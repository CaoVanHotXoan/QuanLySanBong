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

    // 8. Tạo bảng Lich_Co_Dinh nếu chưa có và thêm cột ma_lich_co_dinh vào Don_Dat_San
    await pool.request().query(`
      IF OBJECT_ID('Lich_Co_Dinh', 'U') IS NULL
      BEGIN
        CREATE TABLE Lich_Co_Dinh (
            id INT IDENTITY(1,1) PRIMARY KEY,
            ma_nguoi_dung INT NULL,
            ma_san INT NOT NULL,
            ten_doi_bong NVARCHAR(100) NOT NULL,
            so_dien_thoai VARCHAR(20) NOT NULL,
            cac_thu_trong_tuan VARCHAR(50) NOT NULL,
            gio_bat_dau TIME NOT NULL,
            gio_ket_thuc TIME NOT NULL,
            tu_ngay DATE NOT NULL,
            den_ngay DATE NOT NULL,
            tong_so_buoi INT NOT NULL DEFAULT 0,
            don_gia_moi_buoi DECIMAL(10, 2) NOT NULL DEFAULT 0,
            tien_coc DECIMAL(10, 2) NOT NULL DEFAULT 0,
            tong_tien DECIMAL(10, 2) NOT NULL DEFAULT 0,
            trang_thai VARCHAR(30) CHECK (trang_thai IN ('DANG_HOAT_DONG', 'TAM_DUNG', 'DA_KET_THUC', 'DA_HUY')) DEFAULT 'DANG_HOAT_DONG',
            ghi_chu NVARCHAR(MAX) NULL,
            ngay_tao DATETIME DEFAULT GETDATE(),
            FOREIGN KEY (ma_nguoi_dung) REFERENCES Nguoi_Dung(id) ON DELETE SET NULL,
            FOREIGN KEY (ma_san) REFERENCES San_Bong(id) ON DELETE CASCADE
        );
        PRINT N'✅ Đã tạo bảng Lich_Co_Dinh thành công!';
      END;

      IF OBJECT_ID('Don_Dat_San', 'U') IS NOT NULL
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Don_Dat_San') AND name = 'ma_lich_co_dinh')
        BEGIN
          ALTER TABLE Don_Dat_San ADD ma_lich_co_dinh INT NULL;
          ALTER TABLE Don_Dat_San ADD CONSTRAINT FK_DonDatSan_LichCoDinh FOREIGN KEY (ma_lich_co_dinh) REFERENCES Lich_Co_Dinh(id) ON DELETE SET NULL;
          PRINT N'✅ Đã thêm cột ma_lich_co_dinh vào bảng Don_Dat_San';
        END;
      END;
    `);
    console.log('✅ Đã cấu trúc bảng Lich_Co_Dinh và liên kết bảng Don_Dat_San');

    // 9. Cài đặt các Stored Procedure Quản lý Lịch Cố Định
    await pool.request().query(`
      CREATE OR ALTER PROCEDURE sp_LayDanhSachLichCoDinh
          @trang_thai VARCHAR(30) = NULL,
          @ma_san INT = NULL,
          @tu_khoa NVARCHAR(100) = NULL
      AS
      BEGIN
          SET NOCOUNT ON;
          BEGIN TRY
              SELECT 
                  lcd.id,
                  lcd.ma_nguoi_dung,
                  lcd.ma_san,
                  sb.ten_san,
                  ls.ten_loai AS ten_loai_san,
                  lcd.ten_doi_bong,
                  lcd.so_dien_thoai,
                  lcd.cac_thu_trong_tuan,
                  CONVERT(VARCHAR(5), lcd.gio_bat_dau, 108) AS gio_bat_dau,
                  CONVERT(VARCHAR(5), lcd.gio_ket_thuc, 108) AS gio_ket_thuc,
                  lcd.tu_ngay,
                  lcd.den_ngay,
                  lcd.tong_so_buoi,
                  lcd.don_gia_moi_buoi,
                  lcd.tien_coc,
                  lcd.tong_tien,
                  lcd.trang_thai,
                  lcd.ghi_chu,
                  lcd.ngay_tao,
                  ISNULL(nd.ho_ten, lcd.ten_doi_bong) AS ten_khach_hang,
                  (SELECT COUNT(*) FROM Don_Dat_San dds WHERE dds.ma_lich_co_dinh = lcd.id AND dds.trang_thai != 'DA_HUY') AS so_buoi_da_sinh,
                  (SELECT COUNT(*) FROM Don_Dat_San dds WHERE dds.ma_lich_co_dinh = lcd.id AND (dds.ngay_da < CAST(GETDATE() AS DATE) OR dds.trang_thai IN ('HOAN_THANH', 'DA_THANH_TOAN', 'Da Thanh Toan'))) AS so_buoi_da_da,
                  (SELECT COUNT(*) FROM Don_Dat_San dds WHERE dds.ma_lich_co_dinh = lcd.id AND dds.ngay_da >= CAST(GETDATE() AS DATE) AND dds.trang_thai NOT IN ('HOAN_THANH', 'DA_THANH_TOAN', 'Da Thanh Toan', 'DA_HUY')) AS so_buoi_con_lai
              FROM Lich_Co_Dinh lcd
              LEFT JOIN San_Bong sb ON lcd.ma_san = sb.id
              LEFT JOIN Loai_San ls ON sb.ma_loai_san = ls.id
              LEFT JOIN Nguoi_Dung nd ON lcd.ma_nguoi_dung = nd.id
              WHERE (@trang_thai IS NULL OR @trang_thai = '' OR lcd.trang_thai = @trang_thai)
                AND (@ma_san IS NULL OR lcd.ma_san = @ma_san)
                AND (@tu_khoa IS NULL OR @tu_khoa = '' 
                     OR lcd.ten_doi_bong LIKE CONCAT('%', @tu_khoa, '%')
                     OR lcd.so_dien_thoai LIKE CONCAT('%', @tu_khoa, '%')
                     OR sb.ten_san LIKE CONCAT('%', @tu_khoa, '%'))
              ORDER BY lcd.id DESC;
          END TRY
          BEGIN CATCH
              ;THROW;
          END CATCH;
      END;
    `);

    await pool.request().query(`
      CREATE OR ALTER PROCEDURE sp_LayChiTietLichCoDinh
          @id INT
      AS
      BEGIN
          SET NOCOUNT ON;
          BEGIN TRY
              SELECT 
                  lcd.id,
                  lcd.ma_nguoi_dung,
                  lcd.ma_san,
                  sb.ten_san,
                  ls.ten_loai AS ten_loai_san,
                  lcd.ten_doi_bong,
                  lcd.so_dien_thoai,
                  lcd.cac_thu_trong_tuan,
                  CONVERT(VARCHAR(5), lcd.gio_bat_dau, 108) AS gio_bat_dau,
                  CONVERT(VARCHAR(5), lcd.gio_ket_thuc, 108) AS gio_ket_thuc,
                  lcd.tu_ngay,
                  lcd.den_ngay,
                  lcd.tong_so_buoi,
                  lcd.don_gia_moi_buoi,
                  lcd.tien_coc,
                  lcd.tong_tien,
                  lcd.trang_thai,
                  lcd.ghi_chu,
                  lcd.ngay_tao,
                  ISNULL(nd.ho_ten, lcd.ten_doi_bong) AS ten_khach_hang
              FROM Lich_Co_Dinh lcd
              LEFT JOIN San_Bong sb ON lcd.ma_san = sb.id
              LEFT JOIN Loai_San ls ON sb.ma_loai_san = ls.id
              LEFT JOIN Nguoi_Dung nd ON lcd.ma_nguoi_dung = nd.id
              WHERE lcd.id = @id;

              SELECT 
                  dds.id,
                  dds.ngay_da,
                  CONVERT(VARCHAR(5), dds.gio_bat_dau, 108) AS gio_bat_dau,
                  CONVERT(VARCHAR(5), dds.gio_ket_thuc, 108) AS gio_ket_thuc,
                  dds.tien_san,
                  dds.tong_tien,
                  dds.trang_thai,
                  dds.phuong_thuc,
                  dds.da_vao_san,
                  dds.ghi_chu
              FROM Don_Dat_San dds
              WHERE dds.ma_lich_co_dinh = @id
              ORDER BY dds.ngay_da ASC, dds.gio_bat_dau ASC;
          END TRY
          BEGIN CATCH
              ;THROW;
          END CATCH;
      END;
    `);

    await pool.request().query(`
      CREATE OR ALTER PROCEDURE sp_KiemTraTrungLichCoDinh
          @ma_san INT,
          @cac_thu_trong_tuan VARCHAR(50),
          @gio_bat_dau VARCHAR(8),
          @gio_ket_thuc VARCHAR(8),
          @tu_ngay DATE,
          @den_ngay DATE,
          @don_gia_moi_buoi DECIMAL(10, 2) = 0
      AS
      BEGIN
          SET NOCOUNT ON;
          BEGIN TRY
              DECLARE @clean_gbd TIME = CAST(CASE 
                  WHEN @gio_bat_dau LIKE '24:00%' THEN '23:59:59'
                  WHEN LEN(LTRIM(RTRIM(@gio_bat_dau))) = 5 THEN CONCAT(LTRIM(RTRIM(@gio_bat_dau)), ':00')
                  ELSE LTRIM(RTRIM(@gio_bat_dau))
              END AS TIME);

              DECLARE @clean_gkt TIME = CAST(CASE 
                  WHEN @gio_ket_thuc LIKE '24:00%' THEN '23:59:59'
                  WHEN LEN(LTRIM(RTRIM(@gio_ket_thuc))) = 5 THEN CONCAT(LTRIM(RTRIM(@gio_ket_thuc)), ':00')
                  ELSE LTRIM(RTRIM(@gio_ket_thuc))
              END AS TIME);

              CREATE TABLE #DanhSachNgayDuKien (
                  ngay_da DATE,
                  thu_tieng_viet NVARCHAR(20),
                  bi_trung BIT DEFAULT 0,
                  ly_do_trung NVARCHAR(255) NULL
              );

              DECLARE @cur DATE = @tu_ngay;
              WHILE @cur <= @den_ngay
              BEGIN
                  DECLARE @dw_offset INT = ((DATEPART(dw, @cur) + @@DATEFIRST - 1) % 7);
                  DECLARE @day_code_vn VARCHAR(5) = CASE WHEN @dw_offset = 0 THEN 'CN' ELSE CAST((@dw_offset + 1) AS VARCHAR(5)) END;

                  IF (CHARINDEX(@day_code_vn, @cac_thu_trong_tuan) > 0)
                     OR (@dw_offset = 0 AND (CHARINDEX('8', @cac_thu_trong_tuan) > 0 OR CHARINDEX('1', @cac_thu_trong_tuan) > 0 OR CHARINDEX('CN', @cac_thu_trong_tuan) > 0))
                  BEGIN
                      DECLARE @thu_name NVARCHAR(20) = CASE 
                          WHEN @dw_offset = 0 THEN N'Chủ Nhật'
                          WHEN @dw_offset = 1 THEN N'Thứ Hai'
                          WHEN @dw_offset = 2 THEN N'Thứ Ba'
                          WHEN @dw_offset = 3 THEN N'Thứ Tư'
                          WHEN @dw_offset = 4 THEN N'Thứ Năm'
                          WHEN @dw_offset = 5 THEN N'Thứ Sáu'
                          WHEN @dw_offset = 6 THEN N'Thứ Bảy'
                      END;

                      DECLARE @is_conflict BIT = 0;
                      DECLARE @conflict_reason NVARCHAR(255) = NULL;

                      IF EXISTS (
                          SELECT 1 FROM Don_Dat_San
                          WHERE ma_san = @ma_san
                            AND ngay_da = @cur
                            AND trang_thai != 'DA_HUY'
                            AND gio_bat_dau < @clean_gkt
                            AND (gio_ket_thuc IS NULL OR gio_ket_thuc > @clean_gbd)
                      )
                      BEGIN
                          SET @is_conflict = 1;
                          SELECT TOP 1 @conflict_reason = CONCAT(N'Trùng với đơn #', id, N' (', CONVERT(VARCHAR(5), gio_bat_dau, 108), N'-', CONVERT(VARCHAR(5), gio_ket_thuc, 108), N') - TT: ', trang_thai)
                          FROM Don_Dat_San
                          WHERE ma_san = @ma_san
                            AND ngay_da = @cur
                            AND trang_thai != 'DA_HUY'
                            AND gio_bat_dau < @clean_gkt
                            AND (gio_ket_thuc IS NULL OR gio_ket_thuc > @clean_gbd);
                      END;

                      INSERT INTO #DanhSachNgayDuKien (ngay_da, thu_tieng_viet, bi_trung, ly_do_trung)
                      VALUES (@cur, @thu_name, @is_conflict, @conflict_reason);
                  END;

                  SET @cur = DATEADD(DAY, 1, @cur);
              END;

              DECLARE @total_buoi INT = (SELECT COUNT(*) FROM #DanhSachNgayDuKien);
              DECLARE @buoi_trung INT = (SELECT COUNT(*) FROM #DanhSachNgayDuKien WHERE bi_trung = 1);
              DECLARE @buoi_hop_le INT = @total_buoi - @buoi_trung;
              DECLARE @tong_tien_du_kien DECIMAL(10,2) = @buoi_hop_le * @don_gia_moi_buoi;

              SELECT 
                  @total_buoi AS tong_so_buoi_du_kien,
                  @buoi_hop_le AS so_buoi_hop_le,
                  @buoi_trung AS so_buoi_bi_trung,
                  @tong_tien_du_kien AS tong_tien_du_kien,
                  CASE WHEN @buoi_trung = 0 AND @total_buoi > 0 THEN 1 ELSE 0 END AS hop_le_hoan_toan;

              SELECT ngay_da, thu_tieng_viet, bi_trung, ly_do_trung
              FROM #DanhSachNgayDuKien
              ORDER BY ngay_da ASC;

              DROP TABLE #DanhSachNgayDuKien;
          END TRY
          BEGIN CATCH
              IF OBJECT_ID('tempdb..#DanhSachNgayDuKien') IS NOT NULL DROP TABLE #DanhSachNgayDuKien;
              ;THROW;
          END CATCH;
      END;
    `);

    await pool.request().query(`
      CREATE OR ALTER PROCEDURE sp_ThemLichCoDinh
          @ma_nguoi_dung INT = NULL,
          @ma_san INT,
          @ten_doi_bong NVARCHAR(100),
          @so_dien_thoai VARCHAR(20),
          @cac_thu_trong_tuan VARCHAR(50),
          @gio_bat_dau VARCHAR(8),
          @gio_ket_thuc VARCHAR(8),
          @tu_ngay DATE,
          @den_ngay DATE,
          @don_gia_moi_buoi DECIMAL(10, 2) = 0,
          @tien_coc DECIMAL(10, 2) = 0,
          @bo_qua_ngay_trung BIT = 0,
          @ghi_chu NVARCHAR(MAX) = NULL
      AS
      BEGIN
          SET NOCOUNT ON;
          BEGIN TRANSACTION;
          BEGIN TRY
              IF @tu_ngay > @den_ngay
              BEGIN
                  ;THROW 50001, N'Ngày bắt đầu không được lớn hơn ngày kết thúc hợp đồng.', 1;
              END;

              DECLARE @clean_gbd TIME = CAST(CASE 
                  WHEN @gio_bat_dau LIKE '24:00%' THEN '23:59:59'
                  WHEN LEN(LTRIM(RTRIM(@gio_bat_dau))) = 5 THEN CONCAT(LTRIM(RTRIM(@gio_bat_dau)), ':00')
                  ELSE LTRIM(RTRIM(@gio_bat_dau))
              END AS TIME);

              DECLARE @clean_gkt TIME = CAST(CASE 
                  WHEN @gio_ket_thuc LIKE '24:00%' THEN '23:59:59'
                  WHEN LEN(LTRIM(RTRIM(@gio_ket_thuc))) = 5 THEN CONCAT(LTRIM(RTRIM(@gio_ket_thuc)), ':00')
                  ELSE LTRIM(RTRIM(@gio_ket_thuc))
              END AS TIME);

              DECLARE @final_user_id INT = @ma_nguoi_dung;
              IF @final_user_id IS NULL AND @so_dien_thoai IS NOT NULL
              BEGIN
                  SELECT TOP 1 @final_user_id = id FROM Nguoi_Dung WHERE so_dien_thoai = @so_dien_thoai;
                  IF @final_user_id IS NULL
                  BEGIN
                      DECLARE @email_auto VARCHAR(255) = CONCAT('codinh_', DATEDIFF(SECOND, '2026-01-01', GETDATE()), '_', ABS(CHECKSUM(NEWID()) % 1000), '@khachhang.pos');
                      INSERT INTO Nguoi_Dung (ho_ten, email, so_dien_thoai, MaVaiTro)
                      VALUES (@ten_doi_bong, @email_auto, @so_dien_thoai, 3);
                      SET @final_user_id = SCOPE_IDENTITY();
                  END;
              END;
              IF @final_user_id IS NULL SET @final_user_id = 1;

              CREATE TABLE #NgayTao (
                  ngay_da DATE,
                  bi_trung BIT DEFAULT 0
              );

              DECLARE @cur DATE = @tu_ngay;
              WHILE @cur <= @den_ngay
              BEGIN
                  DECLARE @dw_offset INT = ((DATEPART(dw, @cur) + @@DATEFIRST - 1) % 7);
                  DECLARE @day_code_vn VARCHAR(5) = CASE WHEN @dw_offset = 0 THEN 'CN' ELSE CAST((@dw_offset + 1) AS VARCHAR(5)) END;

                  IF (CHARINDEX(@day_code_vn, @cac_thu_trong_tuan) > 0)
                     OR (@dw_offset = 0 AND (CHARINDEX('8', @cac_thu_trong_tuan) > 0 OR CHARINDEX('1', @cac_thu_trong_tuan) > 0 OR CHARINDEX('CN', @cac_thu_trong_tuan) > 0))
                  BEGIN
                      DECLARE @trung BIT = 0;
                      IF EXISTS (
                          SELECT 1 FROM Don_Dat_San
                          WHERE ma_san = @ma_san
                            AND ngay_da = @cur
                            AND trang_thai != 'DA_HUY'
                            AND gio_bat_dau < @clean_gkt
                            AND (gio_ket_thuc IS NULL OR gio_ket_thuc > @clean_gbd)
                      )
                      BEGIN
                          SET @trung = 1;
                      END;

                      INSERT INTO #NgayTao (ngay_da, bi_trung) VALUES (@cur, @trung);
                  END;

                  SET @cur = DATEADD(DAY, 1, @cur);
              END;

              IF @bo_qua_ngay_trung = 0 AND EXISTS (SELECT 1 FROM #NgayTao WHERE bi_trung = 1)
              BEGIN
                  ;THROW 50002, N'Có buổi thi đấu bị trùng lịch với khách khác. Vui lòng kiểm tra lại hoặc bật chế độ bỏ qua ngày trùng.', 1;
              END;

              DECLARE @so_buoi_thuc_te INT = (SELECT COUNT(*) FROM #NgayTao WHERE bi_trung = 0);
              IF @so_buoi_thuc_te = 0
              BEGIN
                  ;THROW 50003, N'Không tìm thấy buổi thi đấu hợp lệ nào trong khoảng thời gian đã chọn.', 1;
              END;

              DECLARE @tong_tien_thuc_te DECIMAL(10,2) = @so_buoi_thuc_te * @don_gia_moi_buoi;

              INSERT INTO Lich_Co_Dinh (
                  ma_nguoi_dung, ma_san, ten_doi_bong, so_dien_thoai, cac_thu_trong_tuan,
                  gio_bat_dau, gio_ket_thuc, tu_ngay, den_ngay, tong_so_buoi,
                  don_gia_moi_buoi, tien_coc, tong_tien, trang_thai, ghi_chu, ngay_tao
              )
              VALUES (
                  @final_user_id, @ma_san, @ten_doi_bong, @so_dien_thoai, @cac_thu_trong_tuan,
                  @clean_gbd, @clean_gkt, @tu_ngay, @den_ngay, @so_buoi_thuc_te,
                  @don_gia_moi_buoi, @tien_coc, @tong_tien_thuc_te, 'DANG_HOAT_DONG', @ghi_chu, GETDATE()
              );

              DECLARE @newId INT = SCOPE_IDENTITY();

              INSERT INTO Don_Dat_San (
                  ma_nguoi_dung, ma_san, ma_lich_co_dinh, ngay_da, gio_bat_dau, gio_ket_thuc,
                  tien_san, tong_tien, phuong_thuc, ghi_chu, trang_thai, ngay_tao
              )
              SELECT 
                  @final_user_id,
                  @ma_san,
                  @newId,
                  nt.ngay_da,
                  @clean_gbd,
                  @clean_gkt,
                  @don_gia_moi_buoi,
                  @don_gia_moi_buoi,
                  'TIEN_MAT',
                  CONCAT(N'Lịch cố định: ', @ten_doi_bong, N' (HĐ #', @newId, N')'),
                  'DA_CHOT',
                  GETDATE()
              FROM #NgayTao nt
              WHERE nt.bi_trung = 0
              ORDER BY nt.ngay_da ASC;

              DROP TABLE #NgayTao;

              COMMIT TRANSACTION;

              EXEC sp_LayChiTietLichCoDinh @id = @newId;

          END TRY
          BEGIN CATCH
              IF @@TRANCOUNT > 0
                  ROLLBACK TRANSACTION;
              IF OBJECT_ID('tempdb..#NgayTao') IS NOT NULL DROP TABLE #NgayTao;
              ;THROW;
          END CATCH;
      END;
    `);

    await pool.request().query(`
      CREATE OR ALTER PROCEDURE sp_DoiTrangThaiLichCoDinh
          @id INT,
          @trang_thai VARCHAR(30),
          @ghi_chu NVARCHAR(MAX) = NULL
      AS
      BEGIN
          SET NOCOUNT ON;
          BEGIN TRANSACTION;
          BEGIN TRY
              IF NOT EXISTS (SELECT 1 FROM Lich_Co_Dinh WHERE id = @id)
              BEGIN
                  ;THROW 50004, N'Không tìm thấy hợp đồng lịch cố định.', 1;
              END;

              UPDATE Lich_Co_Dinh
              SET trang_thai = @trang_thai,
                  ghi_chu = ISNULL(@ghi_chu, ghi_chu)
              WHERE id = @id;

              COMMIT TRANSACTION;

              SELECT TOP 1 * FROM Lich_Co_Dinh WHERE id = @id;
          END TRY
          BEGIN CATCH
              IF @@TRANCOUNT > 0
                  ROLLBACK TRANSACTION;
              ;THROW;
          END CATCH;
      END;
    `);

    await pool.request().query(`
      CREATE OR ALTER PROCEDURE sp_HuyLichCoDinh
          @id INT,
          @ly_do NVARCHAR(255) = N'Hủy hợp đồng lịch cố định'
      AS
      BEGIN
          SET NOCOUNT ON;
          BEGIN TRANSACTION;
          BEGIN TRY
              IF NOT EXISTS (SELECT 1 FROM Lich_Co_Dinh WHERE id = @id)
              BEGIN
                  ;THROW 50005, N'Không tìm thấy hợp đồng lịch cố định.', 1;
              END;

              UPDATE Lich_Co_Dinh
              SET trang_thai = 'DA_HUY',
                  ghi_chu = CONCAT(ISNULL(ghi_chu, ''), N' [Đã hủy: ', @ly_do, N']')
              WHERE id = @id;

              UPDATE Don_Dat_San
              SET trang_thai = 'DA_HUY',
                  ghi_chu = CONCAT(ISNULL(ghi_chu, ''), N' [Hủy theo HĐ #', @id, N': ', @ly_do, N']')
              WHERE ma_lich_co_dinh = @id
                AND ngay_da >= CAST(GETDATE() AS DATE)
                AND trang_thai NOT IN ('HOAN_THANH', 'DA_THANH_TOAN', 'Da Thanh Toan');

              COMMIT TRANSACTION;

              SELECT TOP 1 * FROM Lich_Co_Dinh WHERE id = @id;
          END TRY
          BEGIN CATCH
              IF @@TRANCOUNT > 0
                  ROLLBACK TRANSACTION;
              ;THROW;
          END CATCH;
      END;
    `);
    console.log('✅ Đã tạo / cập nhật toàn bộ 5 Stored Procedures cho Lịch Cố Định');

    console.log('🎉 Đồng bộ SQL Server hoàn tất thành công 100%!');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Lỗi khi đồng bộ SQL Server:', error.message);
    process.exit(1);
  }
}

syncProcedures();
