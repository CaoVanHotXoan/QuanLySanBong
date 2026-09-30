-- =====================================================================
-- FILE: STORED PROCEDURES (THỦ TỤC LƯU TRỮ HỆ THỐNG QUẢN LÝ SÂN BÓNG)
-- Tương thích: SQL Server 2016, 2017, 2019, 2022+
-- Toàn bộ hệ thống Backend sử dụng 100% Stored Procedures (Thủ tục)
-- =====================================================================

USE master;
GO

-- 1. TỰ ĐỘNG TẠO DATABASE NẾU CHƯA CÓ
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'QuanLySanBong')
BEGIN
    CREATE DATABASE QuanLySanBong;
END;
GO

-- 2. CHUYỂN NGỮ CẢNH SANG DATABASE QuanLySanBong
USE QuanLySanBong;
GO

-- =====================================================================
-- 3. TỰ ĐỘNG TẠO BẢNG & TỰ ĐỘNG ĐỒNG BỘ CỘT CHO CSDL HIỆN HỮU
-- =====================================================================

-- 3.0. Bảng Vai_Tro (Vai trò người dùng: Admin, Nhân viên, Khách hàng)
IF OBJECT_ID('Vai_Tro', 'U') IS NULL
BEGIN
    CREATE TABLE Vai_Tro (
        MaVaiTro INT IDENTITY(1,1) PRIMARY KEY,
        TenVaiTro NVARCHAR(50) UNIQUE NOT NULL,
        MoTa NVARCHAR(255) NULL
    );

    -- Chèn vai trò mặc định
    INSERT INTO Vai_Tro (TenVaiTro, MoTa) VALUES
    ('ADMIN', N'Quản trị viên toàn quyền hệ thống'),
    ('NHAN_VIEN', N'Nhân viên quản lý sân và bán hàng'),
    ('KHACH_HANG', N'Khách hàng đặt sân');
END;
GO

-- 3.1. Bảng Nguoi_Dung
IF OBJECT_ID('Nguoi_Dung', 'U') IS NULL
BEGIN
    CREATE TABLE Nguoi_Dung (
        id INT IDENTITY(1,1) PRIMARY KEY,
        ho_ten NVARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        so_dien_thoai VARCHAR(10),
        mat_khau VARCHAR(255),
        anh_dai_dien VARCHAR(255) NULL,
        MaVaiTro INT NOT NULL DEFAULT 3,
        FOREIGN KEY (MaVaiTro) REFERENCES Vai_Tro(MaVaiTro) ON DELETE NO ACTION
    );
END;
GO

IF OBJECT_ID('Nguoi_Dung', 'U') IS NOT NULL AND COL_LENGTH('Nguoi_Dung', 'MaVaiTro') IS NULL
BEGIN
    ALTER TABLE Nguoi_Dung ADD MaVaiTro INT NOT NULL CONSTRAINT DF_NguoiDung_MaVaiTro DEFAULT 3;
END;
GO

-- 3.2. Bảng Loai_San
IF OBJECT_ID('Loai_San', 'U') IS NULL
BEGIN
    CREATE TABLE Loai_San (
        id INT IDENTITY(1,1) PRIMARY KEY,
        ten_loai NVARCHAR(50) NOT NULL, 
        mo_ta NVARCHAR(MAX),
        trang_thai BIT DEFAULT 1
    );
END;
GO

-- 3.3. Bảng San_Bong
IF OBJECT_ID('San_Bong', 'U') IS NULL
BEGIN
    CREATE TABLE San_Bong (
        id INT IDENTITY(1,1) PRIMARY KEY,
        ma_loai_san INT NOT NULL,
        ten_san NVARCHAR(50) NOT NULL, 
        hinh_anh VARCHAR(255),
        don_gia_phut DECIMAL(10, 2) NOT NULL,
        trang_thai VARCHAR(20) CHECK (trang_thai IN ('SAN_SANG', 'BAO_TRI')) DEFAULT 'SAN_SANG',
        FOREIGN KEY (ma_loai_san) REFERENCES Loai_San(id) ON DELETE NO ACTION
    );
END;
GO

-- Tự động thêm cột don_gia_phut nếu bảng San_Bong đã tồn tại trong SQL Server mà chưa có cột này
IF OBJECT_ID('San_Bong', 'U') IS NOT NULL AND COL_LENGTH('San_Bong', 'don_gia_phut') IS NULL
BEGIN
    ALTER TABLE San_Bong ADD don_gia_phut DECIMAL(10, 2) NOT NULL CONSTRAINT DF_SanBong_don_gia_phut DEFAULT 5000.00;
END;
GO

-- 3.4. Bảng Don_Dat_San (Cố định & Linh hoạt theo phút)
IF OBJECT_ID('Don_Dat_San', 'U') IS NULL
BEGIN
    CREATE TABLE Don_Dat_San (
        id INT IDENTITY(1,1) PRIMARY KEY,
        ma_nguoi_dung INT NOT NULL,
        ma_san INT NOT NULL,
        ngay_da DATE NOT NULL,
        gio_bat_dau TIME NOT NULL,
        gio_ket_thuc TIME NOT NULL,
        tien_san DECIMAL(10, 2) NOT NULL,
        tong_tien DECIMAL(10, 2) NOT NULL,
        kieu_dat VARCHAR(20) CHECK (kieu_dat IN ('CO_DINH', 'LINH_HOAT')) DEFAULT 'CO_DINH',
        ghi_chu NVARCHAR(255) NULL,
        trang_thai VARCHAR(20) CHECK (trang_thai IN ('CHO_XAC_NHAN', 'DA_CHOT', 'HOAN_THANH', 'DA_HUY')) DEFAULT 'CHO_XAC_NHAN',
        ngay_tao DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (ma_nguoi_dung) REFERENCES Nguoi_Dung(id) ON DELETE CASCADE,
        FOREIGN KEY (ma_san) REFERENCES San_Bong(id) ON DELETE NO ACTION
    );
END;
GO

IF OBJECT_ID('Don_Dat_San', 'U') IS NOT NULL AND COL_LENGTH('Don_Dat_San', 'tien_san') IS NULL
BEGIN
    ALTER TABLE Don_Dat_San ADD tien_san DECIMAL(10, 2) NOT NULL CONSTRAINT DF_DonDat_tien_san DEFAULT 0;
END;
GO

IF OBJECT_ID('Don_Dat_San', 'U') IS NOT NULL AND COL_LENGTH('Don_Dat_San', 'tong_tien') IS NULL
BEGIN
    ALTER TABLE Don_Dat_San ADD tong_tien DECIMAL(10, 2) NOT NULL CONSTRAINT DF_DonDat_tong_tien DEFAULT 0;
END;
GO

IF OBJECT_ID('Don_Dat_San', 'U') IS NOT NULL AND COL_LENGTH('Don_Dat_San', 'kieu_dat') IS NULL
BEGIN
    ALTER TABLE Don_Dat_San ADD kieu_dat VARCHAR(20) CONSTRAINT DF_DonDat_kieu_dat DEFAULT 'CO_DINH';
END;
GO

IF OBJECT_ID('Don_Dat_San', 'U') IS NOT NULL AND COL_LENGTH('Don_Dat_San', 'ngay_tao') IS NULL
BEGIN
    ALTER TABLE Don_Dat_San ADD ngay_tao DATETIME CONSTRAINT DF_DonDat_ngay_tao DEFAULT GETDATE();
END;
GO

-- 3.5. Bảng Thanh_Toan
IF OBJECT_ID('Thanh_Toan', 'U') IS NULL
BEGIN
    CREATE TABLE Thanh_Toan (
        id INT IDENTITY(1,1) PRIMARY KEY,
        ma_don_dat INT NOT NULL,
        phuong_thuc VARCHAR(20) CHECK (phuong_thuc IN ('TIEN_MAT', 'CHUYEN_KHOAN')) NOT NULL,
        loai_thanh_toan VARCHAR(20) CHECK (loai_thanh_toan IN ('DAT_COC', 'TRA_HET')) NOT NULL,
        so_tien DECIMAL(10, 2) NOT NULL,
        ma_giao_dich VARCHAR(100), 
        trang_thai_gd VARCHAR(20) CHECK (trang_thai_gd IN ('DANG_CHO', 'THANH_CONG', 'THAT_BAI', 'HOAN_TIEN')) DEFAULT 'DANG_CHO',
        ngay_thanh_toan DATETIME NULL,
        FOREIGN KEY (ma_don_dat) REFERENCES Don_Dat_San(id) ON DELETE CASCADE
    );
END;
GO

-- 3.6. Bảng Lich_Su_Hoan_Tien
IF OBJECT_ID('Lich_Su_Hoan_Tien', 'U') IS NULL
BEGIN
    CREATE TABLE Lich_Su_Hoan_Tien (
        id INT IDENTITY(1,1) PRIMARY KEY,
        ma_don_dat INT NOT NULL,
        so_tien_hoan DECIMAL(10, 2) NOT NULL,
        ty_le_hoan INT CHECK (ty_le_hoan BETWEEN 0 AND 100),
        ly_do_huy NVARCHAR(255),
        ngay_hoan DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (ma_don_dat) REFERENCES Don_Dat_San(id) ON DELETE CASCADE
    );
END;
GO

-- 3.7. Bảng Dich_Vu
IF OBJECT_ID('Dich_Vu', 'U') IS NULL
BEGIN
    CREATE TABLE Dich_Vu (
        id INT IDENTITY(1,1) PRIMARY KEY,
        ten_dich_vu NVARCHAR(100) NOT NULL,
        don_gia DECIMAL(10, 2) NOT NULL,
        ton_kho INT DEFAULT 0
    );
END;
GO

-- 3.8. Bảng Phieu_Nhap_Kho
IF OBJECT_ID('Phieu_Nhap_Kho', 'U') IS NULL
BEGIN
    CREATE TABLE Phieu_Nhap_Kho (
        id INT IDENTITY(1,1) PRIMARY KEY,
        ma_dich_vu INT NOT NULL,
        so_luong_nhap INT NOT NULL,
        gia_nhap DECIMAL(10, 2) NOT NULL,
        ngay_nhap DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (ma_dich_vu) REFERENCES Dich_Vu(id) ON DELETE CASCADE
    );
END;
GO

-- 3.9. Bảng Chi_Tiet_Dich_Vu
IF OBJECT_ID('Chi_Tiet_Dich_Vu', 'U') IS NULL
BEGIN
    CREATE TABLE Chi_Tiet_Dich_Vu (
        ma_don_dat INT NOT NULL,
        ma_dich_vu INT NOT NULL,
        so_luong INT NOT NULL DEFAULT 1,
        tongtien_dichvu DECIMAL(10, 2) NOT NULL, 
        PRIMARY KEY (ma_don_dat, ma_dich_vu),
        FOREIGN KEY (ma_don_dat) REFERENCES Don_Dat_San(id) ON DELETE CASCADE,
        FOREIGN KEY (ma_dich_vu) REFERENCES Dich_Vu(id) ON DELETE NO ACTION
    );
END;
GO

-- Tự động thêm cột tongtien_dichvu nếu bảng Chi_Tiet_Dich_Vu đã tồn tại trong SQL Server mà chưa có cột này
IF OBJECT_ID('Chi_Tiet_Dich_Vu', 'U') IS NOT NULL AND COL_LENGTH('Chi_Tiet_Dich_Vu', 'tongtien_dichvu') IS NULL
BEGIN
    ALTER TABLE Chi_Tiet_Dich_Vu ADD tongtien_dichvu DECIMAL(10, 2) NOT NULL CONSTRAINT DF_ChiTietDichVu_tongtien DEFAULT 0;
END;
GO

-- =====================================================================
-- 4. ĐỊNH NGHĨA CÁC THỦ TỤC LƯU TRỮ (STORED PROCEDURES)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 4.1. THỦ TỤC XÁC THỰC & QUẢN LÝ NGƯỜI DÙNG & VAI TRÒ
-- ---------------------------------------------------------------------

-- Thủ tục Thêm/Đăng ký người dùng
CREATE OR ALTER PROCEDURE sp_ThemNguoiDung
    @ho_ten NVARCHAR(100),
    @email VARCHAR(255),
    @so_dien_thoai VARCHAR(15),
    @mat_khau VARCHAR(255),
    @vai_tro VARCHAR(50) = 'KHACH_HANG',
    @MaVaiTro INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF EXISTS (SELECT 1 FROM Nguoi_Dung WHERE email = @email)
        BEGIN
            ;THROW 50001, N'Email này đã được đăng ký trong hệ thống.', 1;
        END;

        -- Xác định MaVaiTro phù hợp
        DECLARE @v_MaVaiTro INT = @MaVaiTro;
        IF @v_MaVaiTro IS NULL
        BEGIN
            SELECT @v_MaVaiTro = MaVaiTro FROM Vai_Tro WHERE TenVaiTro = @vai_tro;
            IF @v_MaVaiTro IS NULL SET @v_MaVaiTro = 3; -- Mặc định là Khách hàng
        END;

        INSERT INTO Nguoi_Dung (ho_ten, email, so_dien_thoai, mat_khau, MaVaiTro)
        VALUES (@ho_ten, @email, @so_dien_thoai, @mat_khau, @v_MaVaiTro);

        SELECT 
            nd.id, nd.ho_ten, nd.email, nd.so_dien_thoai, 
            nd.MaVaiTro, vt.TenVaiTro AS vai_tro, vt.TenVaiTro, vt.MoTa AS ten_vai_tro_mota,
            nd.anh_dai_dien, CAST(GETDATE() AS DATETIME) AS ngay_tao 
        FROM Nguoi_Dung nd
        LEFT JOIN Vai_Tro vt ON nd.MaVaiTro = vt.MaVaiTro
        WHERE nd.id = SCOPE_IDENTITY();
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

-- Thủ tục Đăng nhập người dùng
CREATE OR ALTER PROCEDURE sp_DangNhap
    @email VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Nguoi_Dung WHERE email = @email)
        BEGIN
            ;THROW 50002, N'Tài khoản email không tồn tại trong hệ thống.', 1;
        END;

        SELECT 
            nd.id, nd.ho_ten, nd.email, nd.so_dien_thoai, nd.mat_khau, 
            nd.MaVaiTro, vt.TenVaiTro AS vai_tro, vt.TenVaiTro, vt.MoTa AS ten_vai_tro_mota,
            nd.anh_dai_dien, CAST(GETDATE() AS DATETIME) AS ngay_tao
        FROM Nguoi_Dung nd
        LEFT JOIN Vai_Tro vt ON nd.MaVaiTro = vt.MaVaiTro
        WHERE nd.email = @email;
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

-- Thủ tục Lấy thông tin người dùng
CREATE OR ALTER PROCEDURE sp_LayThongTinNguoiDung
    @ma_nguoi_dung INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Nguoi_Dung WHERE id = @ma_nguoi_dung)
        BEGIN
            ;THROW 50003, N'Không tìm thấy thông tin người dùng.', 1;
        END;

        SELECT 
            nd.id, nd.ho_ten, nd.email, nd.so_dien_thoai, 
            nd.MaVaiTro, vt.TenVaiTro AS vai_tro, vt.TenVaiTro, vt.MoTa AS ten_vai_tro_mota,
            nd.anh_dai_dien, CAST(GETDATE() AS DATETIME) AS ngay_tao
        FROM Nguoi_Dung nd
        LEFT JOIN Vai_Tro vt ON nd.MaVaiTro = vt.MaVaiTro
        WHERE nd.id = @ma_nguoi_dung;
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

-- Thủ tục Lấy danh sách tất cả người dùng (Admin)
CREATE OR ALTER PROCEDURE sp_LayDanhSachNguoiDung
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT 
            nd.id, nd.ho_ten, nd.email, nd.so_dien_thoai, 
            nd.MaVaiTro, vt.TenVaiTro AS vai_tro, vt.TenVaiTro, vt.MoTa AS ten_vai_tro_mota,
            nd.anh_dai_dien, CAST(GETDATE() AS DATETIME) AS ngay_tao
        FROM Nguoi_Dung nd
        LEFT JOIN Vai_Tro vt ON nd.MaVaiTro = vt.MaVaiTro
        ORDER BY nd.id DESC;
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

-- Thủ tục Cập nhật người dùng (Admin)
CREATE OR ALTER PROCEDURE sp_SuaNguoiDung
    @id INT,
    @ho_ten NVARCHAR(100),
    @email VARCHAR(255),
    @so_dien_thoai VARCHAR(15),
    @vai_tro VARCHAR(50) = NULL,
    @MaVaiTro INT = NULL,
    @mat_khau VARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Nguoi_Dung WHERE id = @id)
        BEGIN
            ;THROW 50004, N'Người dùng không tồn tại.', 1;
        END;

        IF EXISTS (SELECT 1 FROM Nguoi_Dung WHERE email = @email AND id <> @id)
        BEGIN
            ;THROW 50005, N'Email này đã được sử dụng bởi tài khoản khác.', 1;
        END;

        -- Xác định MaVaiTro nếu truyền @vai_tro dạng chữ
        DECLARE @v_MaVaiTro INT = @MaVaiTro;
        IF @v_MaVaiTro IS NULL AND @vai_tro IS NOT NULL
        BEGIN
            SELECT @v_MaVaiTro = MaVaiTro FROM Vai_Tro WHERE TenVaiTro = @vai_tro;
        END;

        UPDATE Nguoi_Dung
        SET ho_ten = @ho_ten,
            email = @email,
            so_dien_thoai = @so_dien_thoai,
            MaVaiTro = ISNULL(@v_MaVaiTro, MaVaiTro),
            mat_khau = CASE WHEN @mat_khau IS NOT NULL AND LEN(@mat_khau) > 0 THEN @mat_khau ELSE mat_khau END
        WHERE id = @id;

        SELECT 
            nd.id, nd.ho_ten, nd.email, nd.so_dien_thoai, 
            nd.MaVaiTro, vt.TenVaiTro AS vai_tro, vt.TenVaiTro, vt.MoTa AS ten_vai_tro_mota,
            nd.anh_dai_dien, CAST(GETDATE() AS DATETIME) AS ngay_tao
        FROM Nguoi_Dung nd
        LEFT JOIN Vai_Tro vt ON nd.MaVaiTro = vt.MaVaiTro
        WHERE nd.id = @id;
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

-- Thủ tục Xóa người dùng (Admin)
CREATE OR ALTER PROCEDURE sp_XoaNguoiDung
    @id INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Nguoi_Dung WHERE id = @id)
        BEGIN
            ;THROW 50006, N'Người dùng không tồn tại.', 1;
        END;

        DELETE FROM Nguoi_Dung WHERE id = @id;
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

-- Thủ tục Lấy danh sách vai trò
CREATE OR ALTER PROCEDURE sp_LayDanhSachVaiTro
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT MaVaiTro, TenVaiTro, MoTa
        FROM Vai_Tro
        ORDER BY MaVaiTro ASC;
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

-- Thủ tục Thêm vai trò mới
CREATE OR ALTER PROCEDURE sp_ThemVaiTro
    @TenVaiTro NVARCHAR(50),
    @MoTa NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF EXISTS (SELECT 1 FROM Vai_Tro WHERE TenVaiTro = @TenVaiTro)
        BEGIN
            ;THROW 50007, N'Tên vai trò này đã tồn tại trong hệ thống.', 1;
        END;

        INSERT INTO Vai_Tro (TenVaiTro, MoTa)
        VALUES (@TenVaiTro, @MoTa);

        SELECT MaVaiTro, TenVaiTro, MoTa
        FROM Vai_Tro
        WHERE MaVaiTro = SCOPE_IDENTITY();
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

-- Thủ tục Sửa vai trò
CREATE OR ALTER PROCEDURE sp_SuaVaiTro
    @MaVaiTro INT,
    @TenVaiTro NVARCHAR(50),
    @MoTa NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Vai_Tro WHERE MaVaiTro = @MaVaiTro)
        BEGIN
            ;THROW 50008, N'Vai trò không tồn tại.', 1;
        END;

        IF EXISTS (SELECT 1 FROM Vai_Tro WHERE TenVaiTro = @TenVaiTro AND MaVaiTro <> @MaVaiTro)
        BEGIN
            ;THROW 50009, N'Tên vai trò này đã được sử dụng.', 1;
        END;

        UPDATE Vai_Tro
        SET TenVaiTro = @TenVaiTro,
            MoTa = @MoTa
        WHERE MaVaiTro = @MaVaiTro;

        SELECT MaVaiTro, TenVaiTro, MoTa
        FROM Vai_Tro
        WHERE MaVaiTro = @MaVaiTro;
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

-- ---------------------------------------------------------------------
-- 4.2. THỦ TỤC QUẢN LÝ SÂN BÓNG & LOẠI SÂN (COURTS & COURT TYPES)
-- ---------------------------------------------------------------------

-- Lấy danh sách sân bóng kèm loại sân và đơn giá theo phút
CREATE OR ALTER PROCEDURE sp_LayDanhSachSan
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
            ls.id AS ma_loai_san,
            ls.ten_loai,
            ls.mo_ta
        FROM San_Bong sb
        INNER JOIN Loai_San ls ON sb.ma_loai_san = ls.id
        ORDER BY sb.id ASC;
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

-- Lấy danh sách loại sân
CREATE OR ALTER PROCEDURE sp_LayDanhSachLoaiSan
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT id, ten_loai, mo_ta, trang_thai
        FROM Loai_San
        ORDER BY id ASC;
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

-- Thêm sân bóng mới (Kèm don_gia_phut)
CREATE OR ALTER PROCEDURE sp_ThemSanBong
    @ten_san NVARCHAR(50),
    @ma_loai_san INT,
    @hinh_anh VARCHAR(255) = NULL,
    @don_gia_phut DECIMAL(10, 2) = 5000.00,
    @trang_thai VARCHAR(20) = 'SAN_SANG'
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Loai_San WHERE id = @ma_loai_san)
        BEGIN
            ;THROW 50007, N'Loại sân không tồn tại.', 1;
        END;

        INSERT INTO San_Bong (ten_san, ma_loai_san, hinh_anh, don_gia_phut, trang_thai)
        VALUES (@ten_san, @ma_loai_san, ISNULL(@hinh_anh, '/images/default-pitch.jpg'), @don_gia_phut, @trang_thai);

        SELECT 
            sb.id, sb.ten_san, sb.hinh_anh, sb.don_gia_phut, sb.trang_thai, ls.id AS ma_loai_san, ls.ten_loai
        FROM San_Bong sb
        INNER JOIN Loai_San ls ON sb.ma_loai_san = ls.id
        WHERE sb.id = SCOPE_IDENTITY();
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

-- Sửa thông tin sân bóng (Kèm don_gia_phut)
CREATE OR ALTER PROCEDURE sp_SuaSanBong
    @id INT,
    @ten_san NVARCHAR(50),
    @ma_loai_san INT,
    @hinh_anh VARCHAR(255) = NULL,
    @don_gia_phut DECIMAL(10, 2) = NULL,
    @trang_thai VARCHAR(20) = 'SAN_SANG'
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM San_Bong WHERE id = @id)
        BEGIN
            ;THROW 50008, N'Sân bóng không tồn tại.', 1;
        END;

        UPDATE San_Bong
        SET ten_san = @ten_san,
            ma_loai_san = @ma_loai_san,
            hinh_anh = ISNULL(@hinh_anh, hinh_anh),
            don_gia_phut = ISNULL(@don_gia_phut, don_gia_phut),
            trang_thai = @trang_thai
        WHERE id = @id;

        SELECT 
            sb.id, sb.ten_san, sb.hinh_anh, sb.don_gia_phut, sb.trang_thai, ls.id AS ma_loai_san, ls.ten_loai
        FROM San_Bong sb
        INNER JOIN Loai_San ls ON sb.ma_loai_san = ls.id
        WHERE sb.id = @id;
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

-- Xóa sân bóng
CREATE OR ALTER PROCEDURE sp_XoaSanBong
    @id INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM San_Bong WHERE id = @id)
        BEGIN
            ;THROW 50009, N'Sân bóng không tồn tại.', 1;
        END;

        DELETE FROM San_Bong WHERE id = @id;
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

-- ---------------------------------------------------------------------
-- 4.3. THỦ TỤC QUẢN LÝ ĐƠN GIÁ THEO PHÚT (PRICING COMPATIBILITY)
-- ---------------------------------------------------------------------

-- Lấy khung giờ giá (Tương thích backward, trả về rỗng vì giá đã tích hợp vào từng San_Bong)
CREATE OR ALTER PROCEDURE sp_LayKhungGioGia
AS
BEGIN
    SET NOCOUNT ON;
    SELECT CAST(0 AS INT) AS id, CAST(0 AS INT) AS ma_loai_san, N'' AS ten_loai, '00:00' AS gio_bat_dau, '00:00' AS gio_ket_thuc, CAST(0 AS BIT) AS la_cuoi_tuan, CAST(0 AS DECIMAL(10,2)) AS don_gia
    WHERE 1 = 0;
END;
GO

-- ---------------------------------------------------------------------
-- 4.4. THỦ TỤC QUẢN LÝ DỊCH VỤ & KHO HÀNG (SERVICES & INVENTORY)
-- ---------------------------------------------------------------------

-- Lấy danh sách dịch vụ
CREATE OR ALTER PROCEDURE sp_LayDanhSachDichVu
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT 
            id, 
            ten_dich_vu, 
            don_gia, 
            N'Chai' AS don_vi_tinh, 
            ton_kho
        FROM Dich_Vu
        ORDER BY id ASC;
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

-- Thêm mặt hàng dịch vụ mới
CREATE OR ALTER PROCEDURE sp_ThemDichVuMoi
    @ten_dich_vu NVARCHAR(100),
    @don_gia DECIMAL(10, 2),
    @don_vi_tinh NVARCHAR(20) = NULL,
    @ton_kho INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        INSERT INTO Dich_Vu (ten_dich_vu, don_gia, ton_kho)
        VALUES (@ten_dich_vu, @don_gia, @ton_kho);

        SELECT 
            id, 
            ten_dich_vu, 
            don_gia, 
            ISNULL(@don_vi_tinh, N'Chai') AS don_vi_tinh, 
            ton_kho
        FROM Dich_Vu
        WHERE id = SCOPE_IDENTITY();
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

-- Sửa mặt hàng dịch vụ
CREATE OR ALTER PROCEDURE sp_SuaDichVu
    @id INT,
    @ten_dich_vu NVARCHAR(100),
    @don_gia DECIMAL(10, 2),
    @don_vi_tinh NVARCHAR(20) = NULL,
    @ton_kho INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Dich_Vu WHERE id = @id)
        BEGIN
            ;THROW 50035, N'Dịch vụ không tồn tại.', 1;
        END;

        UPDATE Dich_Vu
        SET ten_dich_vu = @ten_dich_vu,
            don_gia = @don_gia,
            ton_kho = @ton_kho
        WHERE id = @id;

        SELECT 
            id, 
            ten_dich_vu, 
            don_gia, 
            ISNULL(@don_vi_tinh, N'Chai') AS don_vi_tinh, 
            ton_kho
        FROM Dich_Vu
        WHERE id = @id;
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

-- Xóa mặt hàng dịch vụ
CREATE OR ALTER PROCEDURE sp_XoaDichVu
    @id INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Dich_Vu WHERE id = @id)
        BEGIN
            ;THROW 50036, N'Dịch vụ không tồn tại.', 1;
        END;

        DELETE FROM Dich_Vu WHERE id = @id;
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

-- Thêm dịch vụ vào đơn đặt sân (Mini POS)
CREATE OR ALTER PROCEDURE sp_ThemDichVu
    @ma_don_dat INT,
    @ma_dich_vu INT,
    @so_luong INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Don_Dat_San WHERE id = @ma_don_dat AND trang_thai IN ('CHO_XAC_NHAN', 'DA_CHOT'))
        BEGIN
            ;THROW 50030, N'Đơn đặt sân không tồn tại hoặc đã kết thúc/bị hủy.', 1;
        END;

        IF @so_luong <= 0
        BEGIN
            ;THROW 50031, N'Số lượng dịch vụ phải lớn hơn 0.', 1;
        END;

        DECLARE @don_gia DECIMAL(10, 2);
        DECLARE @ton_kho_hien_tai INT;
        SELECT @don_gia = don_gia, @ton_kho_hien_tai = ton_kho
        FROM Dich_Vu
        WHERE id = @ma_dich_vu;

        IF @don_gia IS NULL
        BEGIN
            ;THROW 50032, N'Dịch vụ không tồn tại trong hệ thống.', 1;
        END;

        IF @ton_kho_hien_tai < @so_luong
        BEGIN
            ;THROW 50033, N'Số lượng tồn kho không đủ để đáp ứng.', 1;
        END;

        UPDATE Dich_Vu
        SET ton_kho = ton_kho - @so_luong
        WHERE id = @ma_dich_vu;

        IF EXISTS (SELECT 1 FROM Chi_Tiet_Dich_Vu WHERE ma_don_dat = @ma_don_dat AND ma_dich_vu = @ma_dich_vu)
        BEGIN
            UPDATE Chi_Tiet_Dich_Vu
            SET so_luong = so_luong + @so_luong,
                tongtien_dichvu = (so_luong + @so_luong) * @don_gia
            WHERE ma_don_dat = @ma_don_dat AND ma_dich_vu = @ma_dich_vu;
        END
        ELSE
        BEGIN
            INSERT INTO Chi_Tiet_Dich_Vu (ma_don_dat, ma_dich_vu, so_luong, tongtien_dichvu)
            VALUES (@ma_don_dat, @ma_dich_vu, @so_luong, @so_luong * @don_gia);
        END;

        DECLARE @tong_tien_dv DECIMAL(10, 2);
        SET @tong_tien_dv = 0;

        SELECT @tong_tien_dv = ISNULL(SUM(tongtien_dichvu), 0)
        FROM Chi_Tiet_Dich_Vu
        WHERE ma_don_dat = @ma_don_dat;

        UPDATE Don_Dat_San
        SET tong_tien = tien_san + @tong_tien_dv
        WHERE id = @ma_don_dat;

        COMMIT TRANSACTION;

        SELECT 
            ct.ma_don_dat,
            ct.ma_dich_vu,
            dv.ten_dich_vu,
            ct.so_luong,
            dv.don_gia AS gia_luc_ban,
            ct.tongtien_dichvu AS thanh_tien,
            d.tong_tien AS tong_tien_don_moi
        FROM Chi_Tiet_Dich_Vu ct
        INNER JOIN Dich_Vu dv ON ct.ma_dich_vu = dv.id
        INNER JOIN Don_Dat_San d ON ct.ma_don_dat = d.id
        WHERE ct.ma_don_dat = @ma_don_dat AND ct.ma_dich_vu = @ma_dich_vu;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 
        BEGIN
            ROLLBACK TRANSACTION;
        END;
        ;THROW;
    END CATCH;
END;
GO

-- Nhập kho dịch vụ
CREATE OR ALTER PROCEDURE sp_NhapKhoDichVu
    @ma_dich_vu INT,
    @so_luong_nhap INT,
    @gia_nhap DECIMAL(10, 2)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Dich_Vu WHERE id = @ma_dich_vu)
        BEGIN
            ;THROW 50040, N'Dịch vụ không tồn tại trong hệ thống.', 1;
        END;

        IF @so_luong_nhap <= 0 OR @gia_nhap <= 0
        BEGIN
            ;THROW 50041, N'Số lượng và giá nhập phải lớn hơn 0.', 1;
        END;

        INSERT INTO Phieu_Nhap_Kho (ma_dich_vu, so_luong_nhap, gia_nhap, ngay_nhap)
        VALUES (@ma_dich_vu, @so_luong_nhap, @gia_nhap, GETDATE());

        UPDATE Dich_Vu
        SET ton_kho = ton_kho + @so_luong_nhap
        WHERE id = @ma_dich_vu;

        COMMIT TRANSACTION;

        SELECT 
            dv.id, dv.ten_dich_vu, dv.ton_kho, @so_luong_nhap AS so_luong_vua_nhap, @gia_nhap AS gia_nhap
        FROM Dich_Vu dv
        WHERE dv.id = @ma_dich_vu;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 
        BEGIN
            ROLLBACK TRANSACTION;
        END;
        ;THROW;
    END CATCH;
END;
GO

-- ---------------------------------------------------------------------
-- 4.5. THỦ TỤC QUẢN LÝ ĐẶT SÂN, LỊCH SÂN & THANH TOÁN (BOOKINGS & PAYMENTS)
-- ---------------------------------------------------------------------

-- Lấy tất cả đơn đặt sân (Dành cho trang Quản trị Admin Dashboard)
CREATE OR ALTER PROCEDURE sp_LayTatCaDonDat
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT 
            d.id,
            d.ma_san,
            sb.ten_san,
            ls.ten_loai,
            d.ma_nguoi_dung,
            nd.ho_ten AS ten_khach_hang,
            nd.so_dien_thoai,
            d.ngay_da,
            CONVERT(VARCHAR(5), d.gio_bat_dau, 108) AS gio_bat_dau,
            CONVERT(VARCHAR(5), d.gio_ket_thuc, 108) AS gio_ket_thuc,
            d.tien_san,
            d.tong_tien,
            d.kieu_dat,
            DATEDIFF(MINUTE, CAST(d.gio_bat_dau AS TIME), CAST(d.gio_ket_thuc AS TIME)) AS so_phut_da,
            d.ghi_chu,
            ISNULL(
                (SELECT SUM(so_tien) FROM Thanh_Toan WHERE ma_don_dat = d.id AND trang_thai_gd = 'THANH_CONG' AND loai_thanh_toan = 'DAT_COC'),
                0
            ) AS tien_coc_da_tra,
            d.trang_thai,
            d.ngay_tao
        FROM Don_Dat_San d
        INNER JOIN San_Bong sb ON d.ma_san = sb.id
        INNER JOIN Loai_San ls ON sb.ma_loai_san = ls.id
        INNER JOIN Nguoi_Dung nd ON d.ma_nguoi_dung = nd.id
        ORDER BY d.id DESC;
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

-- Lấy lịch đặt sân theo ngày và mã sân
CREATE OR ALTER PROCEDURE sp_LayLichSan
    @ngay_da DATE,
    @ma_san INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT 
            d.id AS ma_don_dat,
            d.ma_san,
            sb.ten_san,
            ls.ten_loai,
            d.ma_nguoi_dung,
            nd.ho_ten AS ten_khach_hang,
            nd.so_dien_thoai,
            d.ngay_da,
            CONVERT(VARCHAR(5), d.gio_bat_dau, 108) AS gio_bat_dau,
            CONVERT(VARCHAR(5), d.gio_ket_thuc, 108) AS gio_ket_thuc,
            d.tien_san,
            d.tong_tien,
            d.kieu_dat,
            DATEDIFF(MINUTE, CAST(d.gio_bat_dau AS TIME), CAST(d.gio_ket_thuc AS TIME)) AS so_phut_da,
            d.ghi_chu,
            d.trang_thai
        FROM Don_Dat_San d
        INNER JOIN San_Bong sb ON d.ma_san = sb.id
        INNER JOIN Loai_San ls ON sb.ma_loai_san = ls.id
        INNER JOIN Nguoi_Dung nd ON d.ma_nguoi_dung = nd.id
        WHERE d.ngay_da = @ngay_da
          AND (@ma_san IS NULL OR d.ma_san = @ma_san)
          AND d.trang_thai <> 'DA_HUY'
        ORDER BY d.gio_bat_dau ASC;
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

-- Đặt sân bóng tiêu chuẩn
CREATE OR ALTER PROCEDURE sp_DatSan
    @ma_nguoi_dung INT,
    @ma_san INT,
    @ngay_da DATE,
    @gio_bat_dau TIME,
    @gio_ket_thuc TIME,
    @tien_san DECIMAL(10, 2) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM San_Bong WHERE id = @ma_san AND trang_thai = 'SAN_SANG')
        BEGIN
            ;THROW 50010, N'Sân bóng không tồn tại hoặc đang trong thời gian bảo trì.', 1;
        END;

        IF @gio_bat_dau >= @gio_ket_thuc
        BEGIN
            ;THROW 50011, N'Giờ bắt đầu phải nhỏ hơn giờ kết thúc.', 1;
        END;

        IF @ngay_da < CAST(GETDATE() AS DATE)
        BEGIN
            ;THROW 50012, N'Không thể đặt sân cho ngày trong quá khứ.', 1;
        END;

        IF EXISTS (
            SELECT 1 
            FROM Don_Dat_San 
            WHERE ma_san = @ma_san 
                AND ngay_da = @ngay_da 
                AND trang_thai IN ('CHO_XAC_NHAN', 'DA_CHOT')
                AND (
                    (@gio_bat_dau >= gio_bat_dau AND @gio_bat_dau < gio_ket_thuc) OR
                    (@gio_ket_thuc > gio_bat_dau AND @gio_ket_thuc <= gio_ket_thuc) OR
                    (@gio_bat_dau <= gio_bat_dau AND @gio_ket_thuc >= gio_ket_thuc)
                )
        )
        BEGIN
            ;THROW 50013, N'Khung giờ này sân đã có người đặt trước. Vui lòng chọn khung giờ khác!', 1;
        END;

        -- Tính số phút đá = giờ kết thúc trừ giờ bắt đầu
        DECLARE @so_phut INT = DATEDIFF(MINUTE, CAST(@gio_bat_dau AS TIME), CAST(@gio_ket_thuc AS TIME));
        IF @so_phut <= 0 SET @so_phut = 60;

        -- Lấy đơn giá theo phút từ bảng San_Bong
        DECLARE @don_gia_phut DECIMAL(10, 2);
        SELECT @don_gia_phut = don_gia_phut FROM San_Bong WHERE id = @ma_san;
        IF @don_gia_phut IS NULL SET @don_gia_phut = 5000.00;

        DECLARE @gia_tinh_duoc DECIMAL(10, 2) = @tien_san;
        IF @gia_tinh_duoc IS NULL OR @gia_tinh_duoc <= 0
        BEGIN
            SET @gia_tinh_duoc = @so_phut * @don_gia_phut;
        END;

        INSERT INTO Don_Dat_San (
            ma_nguoi_dung, ma_san, ngay_da, gio_bat_dau, gio_ket_thuc, 
            tien_san, tong_tien, kieu_dat, trang_thai, ngay_tao
        )
        VALUES (
            @ma_nguoi_dung, @ma_san, @ngay_da, @gio_bat_dau, @gio_ket_thuc, 
            @gia_tinh_duoc, @gia_tinh_duoc, 'CO_DINH', 'CHO_XAC_NHAN', GETDATE()
        );

        DECLARE @ma_don_moi INT = SCOPE_IDENTITY();

        COMMIT TRANSACTION;

        SELECT 
            d.id, d.ma_nguoi_dung, d.ma_san, sb.ten_san, d.ngay_da,
            CONVERT(VARCHAR(5), d.gio_bat_dau, 108) AS gio_bat_dau,
            CONVERT(VARCHAR(5), d.gio_ket_thuc, 108) AS gio_ket_thuc,
            d.tien_san, d.tong_tien, d.kieu_dat,
            @so_phut AS so_phut_da,
            d.trang_thai, d.ngay_tao
        FROM Don_Dat_San d
        INNER JOIN San_Bong sb ON d.ma_san = sb.id
        WHERE d.id = @ma_don_moi;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO

-- ---------------------------------------------------------------------
-- THỦ TỤC TÍNH GIỜ & ĐẶT SÂN THEO PHÚT (CÔNG THỨC: SỐ PHÚT * ĐƠN GIÁ PHÚT)
-- ---------------------------------------------------------------------

-- 1. Thủ tục Tính giá sân theo phút (Giờ kết thúc - Giờ bắt đầu = số phút; số phút * don_gia_phut)
CREATE OR ALTER PROCEDURE sp_TinhGiaSanLinhHoat
    @ma_san INT,
    @ngay_da DATE,
    @gio_bat_dau TIME,
    @gio_ket_thuc TIME
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM San_Bong WHERE id = @ma_san)
        BEGIN
            ;THROW 50010, N'Sân bóng không tồn tại trong hệ thống.', 1;
        END;

        IF @gio_bat_dau >= @gio_ket_thuc
        BEGIN
            ;THROW 50011, N'Giờ bắt đầu phải nhỏ hơn giờ kết thúc.', 1;
        END;

        DECLARE @ma_loai_san INT, @ten_san NVARCHAR(50), @ten_loai NVARCHAR(50), @don_gia_phut DECIMAL(10,2);
        SELECT 
            @ma_loai_san = sb.ma_loai_san,
            @ten_san = sb.ten_san,
            @ten_loai = ls.ten_loai,
            @don_gia_phut = sb.don_gia_phut
        FROM San_Bong sb
        INNER JOIN Loai_San ls ON sb.ma_loai_san = ls.id
        WHERE sb.id = @ma_san;

        IF @don_gia_phut IS NULL SET @don_gia_phut = 5000.00;

        -- Tính tổng số phút đá = giờ kết thúc trừ cho giờ bắt đầu
        DECLARE @so_phut INT;
        SET @so_phut = DATEDIFF(MINUTE, CAST(@gio_bat_dau AS TIME), CAST(@gio_ket_thuc AS TIME));
        IF @so_phut <= 0 SET @so_phut = 15;

        -- Tiền sân = số phút * don_gia_phut của bảng San_Bong
        DECLARE @tien_san DECIMAL(10,2);
        SET @tien_san = @so_phut * @don_gia_phut;

        SELECT 
            @ma_san AS ma_san,
            @ten_san AS ten_san,
            @ten_loai AS ten_loai,
            @ngay_da AS ngay_da,
            CONVERT(VARCHAR(5), @gio_bat_dau, 108) AS gio_bat_dau,
            CONVERT(VARCHAR(5), @gio_ket_thuc, 108) AS gio_ket_thuc,
            @so_phut AS so_phut,
            @don_gia_phut AS don_gia_phut,
            @tien_san AS tien_san,
            CONCAT(@so_phut, N' phút × ', FORMAT(@don_gia_phut, '#,##0'), N' đ/phút = ', FORMAT(@tien_san, '#,##0'), N' đ') AS cong_thuc_tinh;

    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

-- 2. Thủ tục Đặt sân theo phút
CREATE OR ALTER PROCEDURE sp_DatSanLinhHoat
    @ma_nguoi_dung INT,
    @ma_san INT,
    @ngay_da DATE,
    @gio_bat_dau TIME,
    @gio_ket_thuc TIME,
    @ghi_chu NVARCHAR(255) = NULL,
    @tien_coc DECIMAL(10, 2) = 0
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM San_Bong WHERE id = @ma_san AND trang_thai = 'SAN_SANG')
        BEGIN
            ;THROW 50010, N'Sân bóng không tồn tại hoặc đang trong thời gian bảo trì.', 1;
        END;

        IF @gio_bat_dau >= @gio_ket_thuc
        BEGIN
            ;THROW 50011, N'Giờ bắt đầu phải nhỏ hơn giờ kết thúc.', 1;
        END;

        IF @ngay_da < CAST(GETDATE() AS DATE)
        BEGIN
            ;THROW 50012, N'Không thể đặt sân cho ngày trong quá khứ.', 1;
        END;

        -- Kiểm tra trùng lịch
        IF EXISTS (
            SELECT 1 
            FROM Don_Dat_San 
            WHERE ma_san = @ma_san 
                AND ngay_da = @ngay_da 
                AND trang_thai IN ('CHO_XAC_NHAN', 'DA_CHOT')
                AND (
                    (@gio_bat_dau >= gio_bat_dau AND @gio_bat_dau < gio_ket_thuc) OR
                    (@gio_ket_thuc > gio_bat_dau AND @gio_ket_thuc <= gio_ket_thuc) OR
                    (@gio_bat_dau <= gio_bat_dau AND @gio_ket_thuc >= gio_ket_thuc)
                )
        )
        BEGIN
            ;THROW 50013, N'Khung giờ này sân đã có người đặt. Vui lòng chọn khung giờ khác!', 1;
        END;

        -- Lấy đơn giá phút từ bảng San_Bong
        DECLARE @don_gia_phut DECIMAL(10,2);
        SELECT @don_gia_phut = don_gia_phut FROM San_Bong WHERE id = @ma_san;
        IF @don_gia_phut IS NULL SET @don_gia_phut = 5000.00;

        -- Tính số phút và tiền sân = số phút * don_gia_phut
        DECLARE @so_phut INT = DATEDIFF(MINUTE, CAST(@gio_bat_dau AS TIME), CAST(@gio_ket_thuc AS TIME));
        IF @so_phut <= 0 SET @so_phut = 15;
        DECLARE @tien_san DECIMAL(10,2) = @so_phut * @don_gia_phut;

        DECLARE @trang_thai VARCHAR(20) = 'CHO_XAC_NHAN';
        IF @tien_coc > 0 SET @trang_thai = 'DA_CHOT';

        INSERT INTO Don_Dat_San (
            ma_nguoi_dung, ma_san, ngay_da, gio_bat_dau, gio_ket_thuc, 
            tien_san, tong_tien, kieu_dat, ghi_chu, trang_thai, ngay_tao
        )
        VALUES (
            @ma_nguoi_dung, @ma_san, @ngay_da, @gio_bat_dau, @gio_ket_thuc, 
            @tien_san, @tien_san, 'LINH_HOAT', @ghi_chu, @trang_thai, GETDATE()
        );

        DECLARE @ma_don_moi INT = SCOPE_IDENTITY();

        IF @tien_coc > 0
        BEGIN
            INSERT INTO Thanh_Toan (
                ma_don_dat, phuong_thuc, loai_thanh_toan, so_tien, trang_thai_gd, ngay_thanh_toan
            )
            VALUES (
                @ma_don_moi, 'TIEN_MAT', 'DAT_COC', @tien_coc, 'THANH_CONG', GETDATE()
            );
        END;

        COMMIT TRANSACTION;

        SELECT 
            d.id, d.ma_nguoi_dung, nd.ho_ten AS ten_khach_hang, nd.so_dien_thoai,
            d.ma_san, sb.ten_san, ls.ten_loai, d.ngay_da,
            CONVERT(VARCHAR(5), d.gio_bat_dau, 108) AS gio_bat_dau,
            CONVERT(VARCHAR(5), d.gio_ket_thuc, 108) AS gio_ket_thuc,
            @so_phut AS so_phut_da, d.kieu_dat, d.ghi_chu,
            d.tien_san, d.tong_tien, @tien_coc AS tien_coc_da_tra,
            d.trang_thai, d.ngay_tao
        FROM Don_Dat_San d
        INNER JOIN San_Bong sb ON d.ma_san = sb.id
        INNER JOIN Loai_San ls ON sb.ma_loai_san = ls.id
        INNER JOIN Nguoi_Dung nd ON d.ma_nguoi_dung = nd.id
        WHERE d.id = @ma_don_moi;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO

-- 3. Thủ tục Bắt đầu tính giờ linh hoạt ngay tại quầy (Check-in Realtime)
CREATE OR ALTER PROCEDURE sp_BatDauDaLinhHoat
    @ma_nguoi_dung INT = 3,
    @ma_san INT,
    @ten_khach_hang NVARCHAR(100) = NULL,
    @so_dien_thoai VARCHAR(15) = NULL,
    @ghi_chu NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM San_Bong WHERE id = @ma_san AND trang_thai = 'SAN_SANG')
        BEGIN
            ;THROW 50010, N'Sân bóng không tồn tại hoặc đang trong thời gian bảo trì.', 1;
        END;

        DECLARE @ngay_hien_tai DATE = CAST(GETDATE() AS DATE);
        DECLARE @gio_hien_tai TIME = CAST(GETDATE() AS TIME);
        DECLARE @gio_tam_tinh TIME = CAST(DATEADD(MINUTE, 60, GETDATE()) AS TIME);

        INSERT INTO Don_Dat_San (
            ma_nguoi_dung, ma_san, ngay_da, gio_bat_dau, gio_ket_thuc, 
            tien_san, tong_tien, kieu_dat, ghi_chu, trang_thai, ngay_tao
        )
        VALUES (
            @ma_nguoi_dung, @ma_san, @ngay_hien_tai, @gio_hien_tai, @gio_tam_tinh, 
            0, 0, 'LINH_HOAT', ISNULL(@ghi_chu, N'Đang đá tính giờ trực tiếp tại quầy'), 'DA_CHOT', GETDATE()
        );

        DECLARE @ma_don_moi INT = SCOPE_IDENTITY();
        COMMIT TRANSACTION;

        SELECT 
            d.id, d.ma_nguoi_dung, 
            ISNULL(@ten_khach_hang, nd.ho_ten) AS ten_khach_hang, 
            ISNULL(@so_dien_thoai, nd.so_dien_thoai) AS so_dien_thoai,
            d.ma_san, sb.ten_san, ls.ten_loai, d.ngay_da,
            CONVERT(VARCHAR(5), d.gio_bat_dau, 108) AS gio_bat_dau,
            CONVERT(VARCHAR(5), d.gio_ket_thuc, 108) AS gio_ket_thuc,
            0 AS so_phut_da, d.kieu_dat, d.ghi_chu,
            d.tien_san, d.tong_tien, d.trang_thai, d.ngay_tao
        FROM Don_Dat_San d
        INNER JOIN San_Bong sb ON d.ma_san = sb.id
        INNER JOIN Loai_San ls ON sb.ma_loai_san = ls.id
        INNER JOIN Nguoi_Dung nd ON d.ma_nguoi_dung = nd.id
        WHERE d.id = @ma_don_moi;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO

-- 4. Thủ tục Kết thúc đá linh hoạt và chốt tiền sân theo phút thực tế
CREATE OR ALTER PROCEDURE sp_KetThucDaLinhHoat
    @ma_don_dat INT,
    @gio_ket_thuc TIME = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Don_Dat_San WHERE id = @ma_don_dat)
        BEGIN
            ;THROW 50020, N'Không tìm thấy thông tin đơn đặt sân.', 1;
        END;

        DECLARE @ma_san INT, @ngay_da DATE, @gio_bat_dau TIME;
        SELECT @ma_san = ma_san, @ngay_da = ngay_da, @gio_bat_dau = gio_bat_dau
        FROM Don_Dat_San
        WHERE id = @ma_don_dat;

        DECLARE @gio_ket_thuc_chot TIME = ISNULL(@gio_ket_thuc, CAST(GETDATE() AS TIME));
        DECLARE @so_phut_thuc_te INT = DATEDIFF(MINUTE, CAST(@gio_bat_dau AS TIME), CAST(@gio_ket_thuc_chot AS TIME));
        IF @so_phut_thuc_te <= 0 SET @so_phut_thuc_te = 15; -- Tối thiểu 15 phút

        -- Lấy đơn giá phút từ bảng San_Bong
        DECLARE @don_gia_phut DECIMAL(10,2);
        SELECT @don_gia_phut = don_gia_phut FROM San_Bong WHERE id = @ma_san;
        IF @don_gia_phut IS NULL SET @don_gia_phut = 5000.00;

        DECLARE @tien_san DECIMAL(10,2) = @so_phut_thuc_te * @don_gia_phut;

        -- Tính tổng tiền dịch vụ phát sinh
        DECLARE @tien_dich_vu DECIMAL(10,2) = 0;
        SELECT @tien_dich_vu = ISNULL(SUM(tongtien_dichvu), 0)
        FROM Chi_Tiet_Dich_Vu
        WHERE ma_don_dat = @ma_don_dat;

        UPDATE Don_Dat_San
        SET gio_ket_thuc = @gio_ket_thuc_chot,
            tien_san = @tien_san,
            tong_tien = @tien_san + @tien_dich_vu,
            trang_thai = 'HOAN_THANH'
        WHERE id = @ma_don_dat;

        COMMIT TRANSACTION;

        SELECT 
            d.id, d.ma_nguoi_dung, nd.ho_ten AS ten_khach_hang, nd.so_dien_thoai,
            d.ma_san, sb.ten_san, ls.ten_loai, d.ngay_da,
            CONVERT(VARCHAR(5), d.gio_bat_dau, 108) AS gio_bat_dau,
            CONVERT(VARCHAR(5), d.gio_ket_thuc, 108) AS gio_ket_thuc,
            @so_phut_thuc_te AS so_phut_da, d.kieu_dat, d.ghi_chu,
            @don_gia_phut AS don_gia_phut,
            d.tien_san, @tien_dich_vu AS tien_dich_vu, d.tong_tien,
            d.trang_thai, d.ngay_tao
        FROM Don_Dat_San d
        INNER JOIN San_Bong sb ON d.ma_san = sb.id
        INNER JOIN Loai_San ls ON sb.ma_loai_san = ls.id
        INNER JOIN Nguoi_Dung nd ON d.ma_nguoi_dung = nd.id
        WHERE d.id = @ma_don_dat;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO

-- Hủy đơn đặt sân và tính hoàn cọc
CREATE OR ALTER PROCEDURE sp_HuyDonVaHoanCoc
    @ma_don_dat INT,
    @ma_nguoi_dung INT,
    @ly_do_huy NVARCHAR(255) = N'Khách hàng yêu cầu hủy đơn'
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        DECLARE @trang_thai_hien_tai VARCHAR(20);
        DECLARE @ngay_da DATE;
        DECLARE @gio_bat_dau TIME;
        DECLARE @nguoi_so_huu INT;

        SELECT 
            @trang_thai_hien_tai = trang_thai,
            @ngay_da = ngay_da,
            @gio_bat_dau = gio_bat_dau,
            @nguoi_so_huu = ma_nguoi_dung
        FROM Don_Dat_San
        WHERE id = @ma_don_dat;

        IF @trang_thai_hien_tai IS NULL
        BEGIN
            ;THROW 50020, N'Không tìm thấy thông tin đơn đặt sân.', 1;
        END;

        DECLARE @vai_tro VARCHAR(50);
        SELECT @vai_tro = vt.TenVaiTro 
        FROM Nguoi_Dung nd
        LEFT JOIN Vai_Tro vt ON nd.MaVaiTro = vt.MaVaiTro
        WHERE nd.id = @ma_nguoi_dung;
        
        IF @nguoi_so_huu <> @ma_nguoi_dung AND @vai_tro NOT IN ('ADMIN', 'NHAN_VIEN')
        BEGIN
            ;THROW 50021, N'Bạn không có quyền hủy đơn đặt sân của người khác.', 1;
        END;

        IF @trang_thai_hien_tai = 'DA_HUY'
        BEGIN
            ;THROW 50022, N'Đơn đặt sân này đã được hủy trước đó.', 1;
        END;

        IF @trang_thai_hien_tai = 'HOAN_THANH'
        BEGIN
            ;THROW 50023, N'Đơn đặt sân đã hoàn thành, không thể hủy.', 1;
        END;

        DECLARE @thoi_diem_da DATETIME;
        SET @thoi_diem_da = CAST(CONCAT(@ngay_da, ' ', @gio_bat_dau) AS DATETIME);
        
        DECLARE @so_gio_con_lai FLOAT;
        SET @so_gio_con_lai = DATEDIFF(MINUTE, GETDATE(), @thoi_diem_da) / 60.0;

        DECLARE @ty_le_hoan INT;
        SET @ty_le_hoan = 0;
        IF @so_gio_con_lai >= 24
        BEGIN
            SET @ty_le_hoan = 100;
        END
        ELSE IF @so_gio_con_lai >= 12
        BEGIN
            SET @ty_le_hoan = 50;
        END
        ELSE
        BEGIN
            SET @ty_le_hoan = 0;
        END;

        DECLARE @tong_tien_da_coc DECIMAL(10, 2);
        SET @tong_tien_da_coc = 0;

        SELECT @tong_tien_da_coc = ISNULL(SUM(so_tien), 0)
        FROM Thanh_Toan
        WHERE ma_don_dat = @ma_don_dat AND trang_thai_gd = 'THANH_CONG';

        DECLARE @so_tien_hoan DECIMAL(10, 2);
        SET @so_tien_hoan = (@tong_tien_da_coc * @ty_le_hoan) / 100.0;

        UPDATE Don_Dat_San
        SET trang_thai = 'DA_HUY'
        WHERE id = @ma_don_dat;

        IF @tong_tien_da_coc > 0
        BEGIN
            INSERT INTO Lich_Su_Hoan_Tien (ma_don_dat, so_tien_hoan, ty_le_hoan, ly_do_huy, ngay_hoan)
            VALUES (@ma_don_dat, @so_tien_hoan, @ty_le_hoan, @ly_do_huy, GETDATE());

            UPDATE Thanh_Toan
            SET trang_thai_gd = 'HOAN_TIEN'
            WHERE ma_don_dat = @ma_don_dat AND trang_thai_gd = 'THANH_CONG';
        END;

        COMMIT TRANSACTION;

        SELECT 
            @ma_don_dat AS ma_don_dat,
            'DA_HUY' AS trang_thai,
            @tong_tien_da_coc AS tong_tien_da_coc,
            @ty_le_hoan AS ty_le_hoan,
            @so_tien_hoan AS so_tien_hoan,
            @so_gio_con_lai AS so_gio_con_lai,
            @ly_do_huy AS ly_do_huy;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 
        BEGIN
            ROLLBACK TRANSACTION;
        END;
        ;THROW;
    END CATCH;
END;
GO

-- Thanh toán đơn đặt sân (sp_ThanhToanDon)
CREATE OR ALTER PROCEDURE sp_ThanhToanDon
    @ma_don_dat INT,
    @phuong_thuc VARCHAR(20),
    @loai_thanh_toan VARCHAR(20),
    @so_tien DECIMAL(10, 2),
    @ma_giao_dich VARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        DECLARE @trang_thai_don VARCHAR(20);
        DECLARE @tong_tien DECIMAL(10, 2);

        SELECT @trang_thai_don = trang_thai, @tong_tien = tong_tien
        FROM Don_Dat_San
        WHERE id = @ma_don_dat;

        IF @trang_thai_don IS NULL
        BEGIN
            ;THROW 50050, N'Không tìm thấy đơn đặt sân tương ứng.', 1;
        END;

        IF @trang_thai_don = 'DA_HUY'
        BEGIN
            ;THROW 50051, N'Đơn đặt sân này đã bị hủy, không thể thực hiện thanh toán.', 1;
        END;

        IF @so_tien <= 0
        BEGIN
            ;THROW 50052, N'Số tiền thanh toán phải lớn hơn 0.', 1;
        END;

        INSERT INTO Thanh_Toan (
            ma_don_dat, phuong_thuc, loai_thanh_toan, so_tien, ma_giao_dich, trang_thai_gd, ngay_thanh_toan
        )
        VALUES (
            @ma_don_dat, @phuong_thuc, @loai_thanh_toan, @so_tien, @ma_giao_dich, 'THANH_CONG', GETDATE()
        );

        IF @loai_thanh_toan = 'DAT_COC'
        BEGIN
            UPDATE Don_Dat_San SET trang_thai = 'DA_CHOT' WHERE id = @ma_don_dat;
        END
        ELSE IF @loai_thanh_toan = 'TRA_HET'
        BEGIN
            UPDATE Don_Dat_San SET trang_thai = 'HOAN_THANH' WHERE id = @ma_don_dat;
        END;

        COMMIT TRANSACTION;

        SELECT 
            tt.id AS ma_thanh_toan,
            tt.ma_don_dat,
            tt.phuong_thuc,
            tt.loai_thanh_toan,
            tt.so_tien,
            tt.ma_giao_dich,
            tt.trang_thai_gd,
            tt.ngay_thanh_toan,
            d.trang_thai AS trang_thai_don_moi
        FROM Thanh_Toan tt
        INNER JOIN Don_Dat_San d ON tt.ma_don_dat = d.id
        WHERE tt.id = SCOPE_IDENTITY();

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 
        BEGIN
            ROLLBACK TRANSACTION;
        END;
        ;THROW;
    END CATCH;
END;
GO

-- ---------------------------------------------------------------------
-- 4.6. THỦ TỤC BÁO CÁO & THỐNG KÊ (REPORT & STATISTICS)
-- ---------------------------------------------------------------------

-- Báo cáo doanh thu theo khoảng thời gian
CREATE OR ALTER PROCEDURE sp_BaoCaoDoanhThu
    @tu_ngay DATE,
    @den_ngay DATE
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF @tu_ngay > @den_ngay
        BEGIN
            ;THROW 50060, N'Từ ngày không được lớn hơn đến ngày.', 1;
        END;

        SELECT 
            COUNT(DISTINCT d.id) AS tong_so_don,
            COUNT(DISTINCT CASE WHEN d.trang_thai = 'HOAN_THANH' THEN d.id END) AS so_don_hoan_thanh,
            COUNT(DISTINCT CASE WHEN d.trang_thai = 'DA_HUY' THEN d.id END) AS so_don_da_huy,
            ISNULL(SUM(CASE WHEN d.trang_thai IN ('DA_CHOT', 'HOAN_THANH') THEN d.tien_san ELSE 0 END), 0) AS doanh_thu_tien_san,
            ISNULL(SUM(CASE WHEN d.trang_thai IN ('DA_CHOT', 'HOAN_THANH') THEN (d.tong_tien - d.tien_san) ELSE 0 END), 0) AS doanh_thu_dich_vu,
            ISNULL(SUM(CASE WHEN d.trang_thai IN ('DA_CHOT', 'HOAN_THANH') THEN d.tong_tien ELSE 0 END), 0) AS tong_doanh_thu,
            ISNULL((SELECT SUM(so_tien_hoan) FROM Lich_Su_Hoan_Tien WHERE CAST(ngay_hoan AS DATE) BETWEEN @tu_ngay AND @den_ngay), 0) AS tong_tien_hoan_tra
        FROM Don_Dat_San d
        WHERE d.ngay_da BETWEEN @tu_ngay AND @den_ngay;

        SELECT 
            d.ngay_da,
            COUNT(d.id) AS so_don_trong_ngay,
            ISNULL(SUM(d.tien_san), 0) AS tien_san,
            ISNULL(SUM(d.tong_tien - d.tien_san), 0) AS tien_dich_vu,
            ISNULL(SUM(d.tong_tien), 0) AS tong_tien_ngay
        FROM Don_Dat_San d
        WHERE d.ngay_da BETWEEN @tu_ngay AND @den_ngay
            AND d.trang_thai IN ('DA_CHOT', 'HOAN_THANH')
        GROUP BY d.ngay_da
        ORDER BY d.ngay_da ASC;

    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

-- ---------------------------------------------------------------------
-- 4.7. CÁC THỦ TỤC TRUY VẤN LỊCH SỬ GIAO DỊCH, NHẬP KHO, HOÀN TIỀN & BÁN HÀNG
-- ---------------------------------------------------------------------

-- Lấy danh sách phiếu nhập kho
CREATE OR ALTER PROCEDURE sp_LayDanhSachPhieuNhapKho
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT 
            p.id,
            p.ma_dich_vu,
            dv.ten_dich_vu,
            N'Chai' AS don_vi_tinh,
            p.so_luong_nhap,
            p.gia_nhap,
            (p.so_luong_nhap * p.gia_nhap) AS tong_tien_nhap,
            p.ngay_nhap
        FROM Phieu_Nhap_Kho p
        LEFT JOIN Dich_Vu dv ON p.ma_dich_vu = dv.id
        ORDER BY p.ngay_nhap DESC, p.id DESC;
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

-- Lấy danh sách lịch sử thanh toán
CREATE OR ALTER PROCEDURE sp_LayDanhSachThanhToan
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT 
            tt.id,
            tt.ma_don_dat,
            nd.ho_ten AS ten_khach_hang,
            nd.so_dien_thoai,
            sb.ten_san,
            d.ngay_da,
            tt.so_tien,
            tt.phuong_thuc,
            tt.loai_thanh_toan,
            tt.ma_giao_dich,
            tt.ngay_thanh_toan
        FROM Thanh_Toan tt
        LEFT JOIN Don_Dat_San d ON tt.ma_don_dat = d.id
        LEFT JOIN Nguoi_Dung nd ON d.ma_nguoi_dung = nd.id
        LEFT JOIN San_Bong sb ON d.ma_san = sb.id
        ORDER BY tt.ngay_thanh_toan DESC, tt.id DESC;
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

-- Lấy danh sách lịch sử hoàn tiền / hủy đơn
CREATE OR ALTER PROCEDURE sp_LayDanhSachHoanTien
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT 
            ht.id,
            ht.ma_don_dat,
            nd.ho_ten AS ten_khach_hang,
            nd.so_dien_thoai,
            sb.ten_san,
            d.ngay_da,
            ht.so_tien_hoan,
            ht.ty_le_hoan,
            ht.ly_do_huy,
            ht.ngay_hoan
        FROM Lich_Su_Hoan_Tien ht
        LEFT JOIN Don_Dat_San d ON ht.ma_don_dat = d.id
        LEFT JOIN Nguoi_Dung nd ON d.ma_nguoi_dung = nd.id
        LEFT JOIN San_Bong sb ON d.ma_san = sb.id
        ORDER BY ht.ngay_hoan DESC, ht.id DESC;
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

-- Lấy toàn bộ danh sách chi tiết dịch vụ đã bán tại quầy POS
CREATE OR ALTER PROCEDURE sp_LayDanhSachChiTietDichVu
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT 
            ROW_NUMBER() OVER (ORDER BY d.ngay_tao DESC, ct.ma_don_dat DESC) AS id,
            ct.ma_don_dat,
            nd.ho_ten AS ten_khach_hang,
            sb.ten_san,
            ct.ma_dich_vu,
            dv.ten_dich_vu,
            N'Chai' AS don_vi_tinh,
            ct.so_luong,
            dv.don_gia AS gia_luc_ban,
            ct.tongtien_dichvu AS thanh_tien,
            d.ngay_tao
        FROM Chi_Tiet_Dich_Vu ct
        LEFT JOIN Dich_Vu dv ON ct.ma_dich_vu = dv.id
        LEFT JOIN Don_Dat_San d ON ct.ma_don_dat = d.id
        LEFT JOIN Nguoi_Dung nd ON d.ma_nguoi_dung = nd.id
        LEFT JOIN San_Bong sb ON d.ma_san = sb.id
        ORDER BY d.ngay_tao DESC, ct.ma_don_dat DESC;
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

PRINT N'✅ ĐÃ NẠP TOÀN BỘ STORED PROCEDURES CHO CSDL QuanLySanBong THÀNH CÔNG!';
GO
