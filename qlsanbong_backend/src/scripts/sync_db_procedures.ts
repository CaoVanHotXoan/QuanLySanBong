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

    console.log('🎉 Đồng bộ SQL Server hoàn tất thành công 100%!');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Lỗi khi đồng bộ SQL Server:', error.message);
    process.exit(1);
  }
}

syncProcedures();
