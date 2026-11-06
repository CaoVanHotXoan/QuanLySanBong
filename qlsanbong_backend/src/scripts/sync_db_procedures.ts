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

    // 14. Tạo Index và cập nhật sp_LayDanhSachSan hỗ trợ lọc loại sân
    await pool.request().query(`
      IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_SanBong_MaLoaiSan_TrangThai' AND object_id = OBJECT_ID('San_Bong'))
      BEGIN
        CREATE NONCLUSTERED INDEX IX_SanBong_MaLoaiSan_TrangThai ON San_Bong(ma_loai_san, trang_thai) INCLUDE (ten_san, don_gia_phut);
      END;
    `);

    await pool.request().query(`
      CREATE OR ALTER PROCEDURE sp_LayDanhSachSan
          @ma_loai_san INT = NULL,
          @trang_thai VARCHAR(20) = NULL,
          @tu_khoa NVARCHAR(100) = NULL
      AS
      BEGIN
          SET NOCOUNT ON;
          BEGIN TRY
              SELECT 
                  sb.id,
                  sb.ten_san,
                  sb.hinh_anh,
                  sb.don_gia_phut,
                  sb.trang_thai,
                  ISNULL(ls.id, sb.ma_loai_san) AS ma_loai_san,
                  ISNULL(ls.ten_loai, N'Sân bóng tiêu chuẩn') AS ten_loai,
                  ISNULL(ls.mo_ta, N'') AS mo_ta
              FROM San_Bong sb
              LEFT JOIN Loai_San ls ON sb.ma_loai_san = ls.id
              WHERE (@ma_loai_san IS NULL OR @ma_loai_san = 0 OR sb.ma_loai_san = @ma_loai_san)
                AND (@trang_thai IS NULL OR @trang_thai = 'ALL' OR sb.trang_thai = @trang_thai)
                AND (@tu_khoa IS NULL OR LTRIM(RTRIM(@tu_khoa)) = '' OR sb.ten_san LIKE N'%' + @tu_khoa + N'%' OR ls.ten_loai LIKE N'%' + @tu_khoa + N'%')
              ORDER BY sb.id ASC;
          END TRY
          BEGIN CATCH
              ;THROW;
          END CATCH;
      END;
    `);
    console.log('✅ Đã tạo / cập nhật sp_LayDanhSachSan (Hỗ trợ lọc loại sân & trạng thái)');

    // 15. Tạo/Cập nhật sp_LayDanhSachLoaiSan kèm số lượng sân
    await pool.request().query(`
      CREATE OR ALTER PROCEDURE sp_LayDanhSachLoaiSan
      AS
      BEGIN
          SET NOCOUNT ON;
          BEGIN TRY
              SELECT 
                  ls.id, 
                  ls.ten_loai, 
                  ls.mo_ta, 
                  ls.trang_thai,
                  COUNT(sb.id) AS so_luong_san
              FROM Loai_San ls
              LEFT JOIN San_Bong sb ON ls.id = sb.ma_loai_san AND sb.trang_thai = 'SAN_SANG'
              WHERE (ls.trang_thai = 1 OR ls.trang_thai IS NULL)
              GROUP BY ls.id, ls.ten_loai, ls.mo_ta, ls.trang_thai
              ORDER BY ls.id ASC;
          END TRY
          BEGIN CATCH
              ;THROW;
          END CATCH;
      END;
    `);
    console.log('✅ Đã tạo / cập nhật sp_LayDanhSachLoaiSan');

    // 16. Bổ sung các loại sân thể thao phổ biến nếu chưa có
    await pool.request().query(`
      IF NOT EXISTS (SELECT 1 FROM Loai_San WHERE ten_loai LIKE N'%Bóng đá%')
        INSERT INTO Loai_San (ten_loai, mo_ta, trang_thai) VALUES (N'Bóng đá', N'Sân 5, 7, 11 người • Cỏ FIFA', 1);
      IF NOT EXISTS (SELECT 1 FROM Loai_San WHERE ten_loai LIKE N'%Cầu lông%')
        INSERT INTO Loai_San (ten_loai, mo_ta, trang_thai) VALUES (N'Cầu lông', N'Thảm Taraflex • Sàn gỗ chuẩn', 1);
      IF NOT EXISTS (SELECT 1 FROM Loai_San WHERE ten_loai LIKE N'%Pickleball%')
        INSERT INTO Loai_San (ten_loai, mo_ta, trang_thai) VALUES (N'Pickleball', N'Có mái che • Điều hòa mát lạnh', 1);
      IF NOT EXISTS (SELECT 1 FROM Loai_San WHERE ten_loai LIKE N'%Quần vợt%' OR ten_loai LIKE N'%Tennis%')
        INSERT INTO Loai_San (ten_loai, mo_ta, trang_thai) VALUES (N'Quần vợt (Tennis)', N'Mặt sân cứng • Đèn LED ban đêm', 1);
      IF NOT EXISTS (SELECT 1 FROM Loai_San WHERE ten_loai LIKE N'%Bóng rổ%')
        INSERT INTO Loai_San (ten_loai, mo_ta, trang_thai) VALUES (N'Bóng rổ', N'Trong nhà & Ngoài trời', 1);
      IF NOT EXISTS (SELECT 1 FROM Loai_San WHERE ten_loai LIKE N'%Bóng chuyền%')
        INSERT INTO Loai_San (ten_loai, mo_ta, trang_thai) VALUES (N'Bóng chuyền', N'Mặt sân cao cấp • Lưới chuẩn', 1);
      IF NOT EXISTS (SELECT 1 FROM Loai_San WHERE ten_loai LIKE N'%Bóng bàn%')
        INSERT INTO Loai_San (ten_loai, mo_ta, trang_thai) VALUES (N'Bóng bàn', N'Bàn thi đấu quốc tế', 1);
    `);

    // 17. Bổ sung bảng Chi_Tiet_Don_Dat nếu chưa tồn tại
    await pool.request().query(`
      IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Chi_Tiet_Don_Dat')
      BEGIN
        CREATE TABLE Chi_Tiet_Don_Dat (
            id INT IDENTITY(1,1) PRIMARY KEY,
            ma_don_dat INT NOT NULL CONSTRAINT FK_ChiTiet_DonDat REFERENCES Don_Dat_San(id) ON DELETE CASCADE,
            ma_san INT NOT NULL CONSTRAINT FK_ChiTiet_San REFERENCES San_Bong(id),
            ngay_da DATE NOT NULL,
            gio_bat_dau TIME NOT NULL,
            gio_ket_thuc TIME NOT NULL,
            tien_san DECIMAL(10,2) NOT NULL DEFAULT 0,
            ghi_chu NVARCHAR(255) NULL
        );
        CREATE NONCLUSTERED INDEX IX_ChiTiet_DonDat_MaSan_NgayDa ON Chi_Tiet_Don_Dat(ma_san, ngay_da, gio_bat_dau, gio_ket_thuc);
        CREATE NONCLUSTERED INDEX IX_ChiTiet_DonDat_MaDonDat ON Chi_Tiet_Don_Dat(ma_don_dat);
        PRINT N'✅ Đã tạo bảng Chi_Tiet_Don_Dat và các chỉ mục';
      END;
    `);

    // 18. Tạo / Cập nhật sp_DatNhieuSan
    await pool.request().query(`
      CREATE OR ALTER PROCEDURE sp_DatNhieuSan
          @ma_nguoi_dung INT = NULL,
          @ho_ten NVARCHAR(100),
          @so_dien_thoai VARCHAR(15),
          @tong_tien DECIMAL(10, 2) = NULL,
          @phuong_thuc VARCHAR(20) = 'CHUYEN_KHOAN',
          @trang_thai VARCHAR(30) = 'DA_COC',
          @ghi_chu NVARCHAR(MAX) = NULL,
          @danh_sach_san NVARCHAR(MAX),
          @dich_vu_chon NVARCHAR(MAX) = NULL
      AS
      BEGIN
          SET NOCOUNT ON;
          BEGIN TRANSACTION;
          BEGIN TRY
              DECLARE @ma_nd_thuc_te INT = @ma_nguoi_dung;
              IF @ma_nd_thuc_te IS NULL
              BEGIN
                  SELECT TOP 1 @ma_nd_thuc_te = id 
                  FROM Nguoi_Dung 
                  WHERE so_dien_thoai = @so_dien_thoai;

                  IF @ma_nd_thuc_te IS NULL
                  BEGIN
                      DECLARE @randomEmail VARCHAR(100) = 'guest_' + REPLACE(@so_dien_thoai, ' ', '') + '_' + CONVERT(VARCHAR(8), GETDATE(), 112) + '@guest.sport247.vn';
                      INSERT INTO Nguoi_Dung (ho_ten, so_dien_thoai, email, mat_khau, MaVaiTro)
                      VALUES (@ho_ten, @so_dien_thoai, @randomEmail, '$2a$10$e8w8G1e102f...guest', 3);
                      SET @ma_nd_thuc_te = SCOPE_IDENTITY();
                  END;
              END;

              CREATE TABLE #TempSanDat (
                  ma_san INT,
                  ngay_da DATE,
                  gio_bat_dau TIME,
                  gio_ket_thuc TIME,
                  tien_san DECIMAL(10,2)
              );

              INSERT INTO #TempSanDat (ma_san, ngay_da, gio_bat_dau, gio_ket_thuc, tien_san)
              SELECT 
                  ma_san,
                  CAST(ngay_da AS DATE),
                  CAST(gio_bat_dau AS TIME),
                  CAST(gio_ket_thuc AS TIME),
                  ISNULL(tien_san, 0)
              FROM OPENJSON(@danh_sach_san)
              WITH (
                  ma_san INT '$.ma_san',
                  ngay_da VARCHAR(20) '$.ngay_da',
                  gio_bat_dau VARCHAR(20) '$.gio_bat_dau',
                  gio_ket_thuc VARCHAR(20) '$.gio_ket_thuc',
                  tien_san DECIMAL(10,2) '$.tien_san'
              );

              IF NOT EXISTS (SELECT 1 FROM #TempSanDat)
              BEGIN
                  ;THROW 50020, N'Danh sách sân đặt không được để trống.', 1;
              END;

              IF EXISTS (
                  SELECT 1 FROM #TempSanDat t
                  JOIN San_Bong sb ON t.ma_san = sb.id
                  WHERE sb.trang_thai <> 'SAN_SANG'
              )
              BEGIN
                  ;THROW 50021, N'Một trong các sân bạn chọn đang tạm ngừng hoạt động hoặc bảo trì.', 1;
              END;

              IF EXISTS (SELECT 1 FROM #TempSanDat WHERE gio_bat_dau >= gio_ket_thuc)
              BEGIN
                  ;THROW 50022, N'Giờ bắt đầu phải nhỏ hơn giờ kết thúc.', 1;
              END;

              IF EXISTS (
                  SELECT 1 
                  FROM Don_Dat_San d
                  JOIN #TempSanDat t ON d.ma_san = t.ma_san AND d.ngay_da = t.ngay_da
                  WHERE d.trang_thai NOT IN ('DA_HUY', N'Đã hủy')
                    AND NOT (d.trang_thai IN ('CHO_THANH_TOAN', 'CHUA_THANH_TOAN') AND d.ghi_chu LIKE '%PayOS%')
                    AND t.gio_bat_dau < d.gio_ket_thuc 
                    AND t.gio_ket_thuc > d.gio_bat_dau
              ) OR EXISTS (
                  SELECT 1 
                  FROM Chi_Tiet_Don_Dat ct
                  JOIN Don_Dat_San d ON ct.ma_don_dat = d.id
                  JOIN #TempSanDat t ON ct.ma_san = t.ma_san AND ct.ngay_da = t.ngay_da
                  WHERE d.trang_thai NOT IN ('DA_HUY', N'Đã hủy')
                    AND NOT (d.trang_thai IN ('CHO_THANH_TOAN', 'CHUA_THANH_TOAN') AND d.ghi_chu LIKE '%PayOS%')
                    AND t.gio_bat_dau < ct.gio_ket_thuc 
                    AND t.gio_ket_thuc > ct.gio_bat_dau
              )
              BEGIN
                  ;THROW 50023, N'Một trong các sân bạn chọn đã có người đặt trong khung giờ này. Vui lòng chọn lại!', 1;
              END;

              DECLARE @tong_tien_san DECIMAL(10,2) = (SELECT SUM(tien_san) FROM #TempSanDat);
              IF @tong_tien IS NULL OR @tong_tien <= 0
                  SET @tong_tien = @tong_tien_san;

              DECLARE @min_ngay DATE = (SELECT MIN(ngay_da) FROM #TempSanDat);
              DECLARE @min_gio TIME = (SELECT MIN(gio_bat_dau) FROM #TempSanDat);
              DECLARE @max_gio TIME = (SELECT MAX(gio_ket_thuc) FROM #TempSanDat);
              DECLARE @first_san INT = (SELECT TOP 1 ma_san FROM #TempSanDat);

              DECLARE @ma_don_moi INT;
              INSERT INTO Don_Dat_San (
                  ma_nguoi_dung, ma_san, ngay_da, gio_bat_dau, gio_ket_thuc,
                  tien_san, tong_tien, phuong_thuc, trang_thai, ghi_chu, ngay_tao
              )
              VALUES (
                  @ma_nd_thuc_te, @first_san, @min_ngay, @min_gio, @max_gio,
                  @tong_tien_san, @tong_tien, @phuong_thuc, @trang_thai, @ghi_chu, GETDATE()
              );

              SET @ma_don_moi = SCOPE_IDENTITY();

              INSERT INTO Chi_Tiet_Don_Dat (ma_don_dat, ma_san, ngay_da, gio_bat_dau, gio_ket_thuc, tien_san)
              SELECT @ma_don_moi, ma_san, ngay_da, gio_bat_dau, gio_ket_thuc, tien_san
              FROM #TempSanDat;

              IF @dich_vu_chon IS NOT NULL AND ISJSON(@dich_vu_chon) = 1
              BEGIN
                  INSERT INTO Chi_Tiet_Dich_Vu (ma_don_dat, ma_dich_vu, so_luong, tongtien_dichvu)
                  SELECT 
                      @ma_don_moi,
                      CAST(dv.ma_dich_vu AS INT),
                      CAST(dv.so_luong AS INT),
                      ISNULL(dv.so_luong, 1) * ISNULL(d.don_gia, 0)
                  FROM OPENJSON(@dich_vu_chon)
                  WITH (
                      ma_dich_vu INT '$.ma_dich_vu',
                      so_luong INT '$.so_luong'
                  ) dv
                  JOIN Dich_Vu d ON dv.ma_dich_vu = d.id
                  WHERE dv.so_luong > 0;
              END;

              COMMIT TRANSACTION;

              SELECT 
                  d.id,
                  d.ma_san,
                  d.ngay_da,
                  CONVERT(VARCHAR(5), d.gio_bat_dau, 108) AS gio_bat_dau,
                  CONVERT(VARCHAR(5), d.gio_ket_thuc, 108) AS gio_ket_thuc,
                  d.tong_tien,
                  d.tien_san,
                  d.trang_thai,
                  d.ghi_chu,
                  (SELECT COUNT(*) FROM Chi_Tiet_Don_Dat WHERE ma_don_dat = d.id) AS so_luong_san
              FROM Don_Dat_San d
              WHERE d.id = @ma_don_moi;

          END TRY
          BEGIN CATCH
              IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
              ;THROW;
          END CATCH;
      END;
    `);
    console.log('✅ Đã tạo / cập nhật sp_DatNhieuSan');

    console.log('🎉 Đồng bộ SQL Server hoàn tất thành công 100%!');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Lỗi khi đồng bộ SQL Server:', error.message);
    process.exit(1);
  }
}

syncProcedures();
