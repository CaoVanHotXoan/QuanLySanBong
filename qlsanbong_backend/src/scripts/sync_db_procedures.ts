import { poolPromise } from '../config/db';

async function syncProcedures() {
  console.log('🔄 Đang đồng bộ cấu trúc bảng và Stored Procedures vào SQL Server...');
  try {
    const pool = await poolPromise;

    // 1. Cập nhật các cột còn thiếu trong bảng Lien_He
    await pool.request().query(`
      IF OBJECT_ID('Lien_He', 'U') IS NOT NULL
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Lien_He') AND name = 'noi_dung_tra_loi')
        BEGIN
          ALTER TABLE Lien_He ADD noi_dung_tra_loi NVARCHAR(MAX) NULL;
          PRINT N'✅ Đã thêm cột noi_dung_tra_loi vào bảng Lien_He';
        END;

        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Lien_He') AND name = 'ngay_tra_loi')
        BEGIN
          ALTER TABLE Lien_He ADD ngay_tra_loi DATETIME NULL;
          PRINT N'✅ Đã thêm cột ngay_tra_loi vào bảng Lien_He';
        END;
      END;
    `);

    // 2. Tạo/Cập nhật sp_LayChiTietLienHe
    await pool.request().query(`
      CREATE OR ALTER PROCEDURE sp_LayChiTietLienHe
          @id INT
      AS
      BEGIN
          SET NOCOUNT ON;
          SELECT 
              id,
              ho_ten,
              email,
              so_dien_thoai,
              tieu_de,
              noi_dung,
              trang_thai_xu_ly,
              ngay_gui,
              noi_dung_tra_loi,
              ngay_tra_loi
          FROM Lien_He
          WHERE id = @id;
      END;
    `);
    console.log('✅ Đã tạo / cập nhật Stored Procedure: sp_LayChiTietLienHe');

    // 3. Tạo/Cập nhật sp_TraLoiLienHe
    await pool.request().query(`
      CREATE OR ALTER PROCEDURE sp_TraLoiLienHe
          @id INT,
          @noi_dung_tra_loi NVARCHAR(MAX)
      AS
      BEGIN
          SET NOCOUNT ON;
          UPDATE Lien_He
          SET noi_dung_tra_loi = @noi_dung_tra_loi,
              ngay_tra_loi = GETDATE(),
              trang_thai_xu_ly = N'DA_XU_LY'
          WHERE id = @id;

          SELECT N'Lưu phản hồi liên hệ thành công' AS thong_bao;
      END;
    `);
    console.log('✅ Đã tạo / cập nhật Stored Procedure: sp_TraLoiLienHe');

    // 4. Tạo/Cập nhật sp_LayDanhSachLienHe
    await pool.request().query(`
      CREATE OR ALTER PROCEDURE sp_LayDanhSachLienHe
          @trang_thai_xu_ly NVARCHAR(30) = NULL
      AS
      BEGIN
          SET NOCOUNT ON;
          SELECT 
              id,
              ho_ten,
              email,
              so_dien_thoai,
              tieu_de,
              noi_dung,
              trang_thai_xu_ly,
              ngay_gui,
              noi_dung_tra_loi,
              ngay_tra_loi
          FROM Lien_He
          WHERE (@trang_thai_xu_ly IS NULL OR @trang_thai_xu_ly = '' OR trang_thai_xu_ly = @trang_thai_xu_ly)
          ORDER BY ngay_gui DESC;
      END;
    `);
    console.log('✅ Đã tạo / cập nhật Stored Procedure: sp_LayDanhSachLienHe');

    // 5. Tạo/Cập nhật sp_GuiLienHe
    await pool.request().query(`
      CREATE OR ALTER PROCEDURE sp_GuiLienHe
          @ho_ten NVARCHAR(100),
          @email VARCHAR(255) = NULL,
          @so_dien_thoai VARCHAR(20),
          @tieu_de NVARCHAR(150) = NULL,
          @noi_dung NVARCHAR(MAX)
      AS
      BEGIN
          SET NOCOUNT ON;
          IF @ho_ten IS NULL OR LTRIM(RTRIM(@ho_ten)) = '' OR @so_dien_thoai IS NULL OR LTRIM(RTRIM(@so_dien_thoai)) = '' OR @noi_dung IS NULL OR LTRIM(RTRIM(@noi_dung)) = ''
          BEGIN
              ;THROW 50090, N'Vui lòng nhập đầy đủ Họ tên, Số điện thoại và Nội dung liên hệ!', 1;
          END;

          IF LEN(@so_dien_thoai) <> 10 OR @so_dien_thoai NOT LIKE '0[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'
          BEGIN
              ;THROW 50091, N'Số điện thoại không hợp lệ! Vui lòng nhập đúng 10 chữ số (bắt đầu bằng số 0).', 1;
          END;

          INSERT INTO Lien_He (ho_ten, email, so_dien_thoai, tieu_de, noi_dung, trang_thai_xu_ly, ngay_gui)
          VALUES (@ho_ten, @email, @so_dien_thoai, @tieu_de, @noi_dung, N'CHUA_XU_LY', GETDATE());

          SELECT SCOPE_IDENTITY() AS id, N'Gửi liên hệ thành công. Chúng tôi sẽ phản hồi sớm nhất!' AS thong_bao;
      END;
    `);
    console.log('✅ Đã tạo / cập nhật Stored Procedure: sp_GuiLienHe');

    // 6. Cập nhật sp_XoaLoaiTinTuc (Cascade delete tin tức liên quan)
    await pool.request().query(`
      CREATE OR ALTER PROCEDURE sp_XoaLoaiTinTuc
          @id INT
      AS
      BEGIN
          SET NOCOUNT ON;
          BEGIN TRY
              BEGIN TRANSACTION;
                  DELETE FROM Tin_Tuc WHERE ma_loai_tin = @id;
                  DELETE FROM Loai_Tin_Tuc WHERE id = @id;
                  SELECT N'Xóa loại tin tức và toàn bộ bài viết liên quan thành công' AS thong_bao;
              COMMIT TRANSACTION;
          END TRY
          BEGIN CATCH
              IF @@TRANCOUNT > 0
                  ROLLBACK TRANSACTION;
              ;THROW;
          END CATCH;
      END;
    `);
    console.log('✅ Đã tạo / cập nhật Stored Procedure: sp_XoaLoaiTinTuc');

    // 7. Cập nhật sp_ThemTinTuc (Tự động fallback loại tin an toàn)
    await pool.request().query(`
      CREATE OR ALTER PROCEDURE sp_ThemTinTuc
          @ma_loai_tin INT,
          @tieu_de NVARCHAR(255),
          @tom_tat NVARCHAR(500) = NULL,
          @noi_dung NVARCHAR(MAX),
          @hinh_anh VARCHAR(255) = NULL,
          @trang_thai BIT = 1
      AS
      BEGIN
          SET NOCOUNT ON;
          BEGIN TRY
              BEGIN TRANSACTION;
                  IF @ma_loai_tin IS NULL OR NOT EXISTS (SELECT 1 FROM Loai_Tin_Tuc WHERE id = @ma_loai_tin)
                  BEGIN
                      SELECT TOP 1 @ma_loai_tin = id FROM Loai_Tin_Tuc ORDER BY id ASC;
                      IF @ma_loai_tin IS NULL
                      BEGIN
                          INSERT INTO Loai_Tin_Tuc (ten_loai, trang_thai) VALUES (N'Tin Tức Thể Thao', 1);
                          SET @ma_loai_tin = SCOPE_IDENTITY();
                      END;
                  END;

                  INSERT INTO Tin_Tuc (ma_loai_tin, tieu_de, tom_tat, noi_dung, hinh_anh, luot_xem, ngay_dang, trang_thai)
                      VALUES (@ma_loai_tin, @tieu_de, @tom_tat, @noi_dung, @hinh_anh, 0, GETDATE(), @trang_thai);
                  
                  SELECT SCOPE_IDENTITY() AS id, N'Thêm tin tức thành công' AS thong_bao;
              COMMIT TRANSACTION;
          END TRY
          BEGIN CATCH
              IF @@TRANCOUNT > 0
                  ROLLBACK TRANSACTION;
              ;THROW;
          END CATCH;
      END;
    `);
    console.log('✅ Đã tạo / cập nhật Stored Procedure: sp_ThemTinTuc');

    // 8. Cập nhật sp_SuaTinTuc
    await pool.request().query(`
      CREATE OR ALTER PROCEDURE sp_SuaTinTuc
          @id INT,
          @ma_loai_tin INT,
          @tieu_de NVARCHAR(255),
          @tom_tat NVARCHAR(500) = NULL,
          @noi_dung NVARCHAR(MAX),
          @hinh_anh VARCHAR(255) = NULL,
          @trang_thai BIT = 1
      AS
      BEGIN
          SET NOCOUNT ON;
          BEGIN TRY
              BEGIN TRANSACTION;
                  IF @ma_loai_tin IS NULL OR NOT EXISTS (SELECT 1 FROM Loai_Tin_Tuc WHERE id = @ma_loai_tin)
                  BEGIN
                      SELECT TOP 1 @ma_loai_tin = id FROM Loai_Tin_Tuc ORDER BY id ASC;
                  END;

                  UPDATE Tin_Tuc
                      SET ma_loai_tin = @ma_loai_tin,
                          tieu_de = @tieu_de,
                          tom_tat = @tom_tat,
                          noi_dung = @noi_dung,
                          hinh_anh = @hinh_anh,
                          trang_thai = @trang_thai
                      WHERE id = @id;
                  
                      SELECT N'Cập nhật tin tức thành công' AS thong_bao;
              COMMIT TRANSACTION;
          END TRY
          BEGIN CATCH
              IF @@TRANCOUNT > 0
                  ROLLBACK TRANSACTION;
              ;THROW;
          END CATCH;
      END;
    `);
    console.log('✅ Đã tạo / cập nhật Stored Procedure: sp_SuaTinTuc');

    console.log('🎉 Đồng bộ SQL Server hoàn tất thành công 100%!');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Lỗi khi đồng bộ SQL Server:', error.message);
    process.exit(1);
  }
}

syncProcedures();
