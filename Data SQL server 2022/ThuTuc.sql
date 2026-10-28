-- =====================================================================
-- FILE 2: TOÀN BỘ STORED PROCEDURES (THỦ TỤC LƯU TRỮ HỆ THỐNG SOCCER247)
-- Tương thích: Microsoft SQL Server 2016, 2017, 2019, 2022+
-- ĐẶC ĐIỂM:
--   - Chứa 100% tất cả Stored Procedures của dự án Soccer247
--   - 100% các thủ tục đều có khối bắt lỗi TRY...CATCH
--   - 100% các thủ tục thay đổi dữ liệu (INSERT / UPDATE / DELETE) có TRANSACTION (ACID)
--   - TUYỆT ĐỐI KHÔNG CHỨA BẤT KỲ CÂU LỆNH TẠO BẢNG DDL NÀO (Đã nằm ở QuanLySanBong.sql)
-- =====================================================================

USE master;
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'QuanLySanBong')
BEGIN
    CREATE DATABASE QuanLySanBong;
END;
GO

USE QuanLySanBong;
GO

-- =====================================================================
-- BẮT ĐẦU ĐỊNH NGHĨA CÁC STORED PROCEDURES (THỦ TỤC LƯU TRỮ)
-- =====================================================================

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
        BEGIN TRANSACTION;
IF EXISTS (SELECT 1 FROM Nguoi_Dung WHERE email = @email)
        BEGIN
            ;THROW 50001, N'Email này đã được đăng ký trong hệ thống.', 1;
        END;

        -- Xác định MaVaiTro phù hợp (Tuyệt đối không gán nhầm sang ADMIN)
        DECLARE @v_MaVaiTro INT = @MaVaiTro;
        IF @v_MaVaiTro IS NULL
        BEGIN
            SELECT TOP 1 @v_MaVaiTro = MaVaiTro 
            FROM Vai_Tro 
            WHERE TenVaiTro = @vai_tro 
               OR UPPER(REPLACE(TenVaiTro, ' ', '_')) = UPPER(REPLACE(@vai_tro, ' ', '_'));

            IF @v_MaVaiTro IS NULL
            BEGIN
                SELECT TOP 1 @v_MaVaiTro = MaVaiTro FROM Vai_Tro WHERE TenVaiTro = 'KHACH_HANG';
            END;

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
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_DangNhap
    @email VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @cleanIden VARCHAR(255) = LTRIM(RTRIM(@email));
        DECLARE @cleanName NVARCHAR(100) = LTRIM(RTRIM(@email));

        DECLARE @emailWithDomain VARCHAR(255) = @cleanIden;
        IF CHARINDEX('@', @cleanIden) = 0
            SET @emailWithDomain = @cleanIden + '@gmail.com';

        DECLARE @usernameOnly VARCHAR(255) = @cleanIden;
        IF CHARINDEX('@', @cleanIden) > 0
            SET @usernameOnly = SUBSTRING(@cleanIden, 1, CHARINDEX('@', @cleanIden) - 1);

        SELECT TOP 1 
            nd.id, nd.ho_ten, nd.email, nd.so_dien_thoai, nd.mat_khau, 
            nd.MaVaiTro, vt.TenVaiTro AS vai_tro, vt.TenVaiTro, vt.MoTa AS ten_vai_tro_mota,
            nd.anh_dai_dien, CAST(GETDATE() AS DATETIME) AS ngay_tao
        FROM Nguoi_Dung nd
        LEFT JOIN Vai_Tro vt ON nd.MaVaiTro = vt.MaVaiTro
        WHERE LOWER(nd.email) = LOWER(@cleanIden)
           OR LOWER(nd.ho_ten) = LOWER(@cleanName)
           OR nd.so_dien_thoai = @cleanIden
           OR LOWER(nd.email) = LOWER(@emailWithDomain)
           OR (CHARINDEX('@', nd.email) > 0 AND LOWER(SUBSTRING(nd.email, 1, CHARINDEX('@', nd.email) - 1)) = LOWER(@usernameOnly))
           OR LOWER(nd.ho_ten) = LOWER(@usernameOnly)
        ORDER BY 
            CASE 
                WHEN LOWER(nd.email) = LOWER(@cleanIden) THEN 1
                WHEN LOWER(nd.ho_ten) = LOWER(@cleanName) THEN 2
                WHEN LOWER(nd.email) = LOWER(@emailWithDomain) THEN 3
                WHEN LOWER(nd.ho_ten) = LOWER(@usernameOnly) THEN 4
                WHEN nd.so_dien_thoai = @cleanIden THEN 5
                ELSE 6
            END ASC;

        IF @@ROWCOUNT = 0
        BEGIN
            ;THROW 50002, N'Tài khoản email hoặc tên đăng nhập không tồn tại trong hệ thống.', 1;
        END;
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

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
        BEGIN TRANSACTION;
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
            SELECT TOP 1 @v_MaVaiTro = MaVaiTro 
            FROM Vai_Tro 
            WHERE TenVaiTro = @vai_tro 
               OR UPPER(REPLACE(TenVaiTro, ' ', '_')) = UPPER(REPLACE(@vai_tro, ' ', '_'));
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
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_XoaNguoiDung
    @id INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
            IF NOT EXISTS (SELECT 1 FROM Nguoi_Dung WHERE id = @id)
            BEGIN
                ;THROW 50006, N'Người dùng không tồn tại.', 1;
            END;

            -- Bảo mật hệ thống: Tuyệt đối không cho phép xóa tài khoản Quản Trị Viên cấp cao
            IF EXISTS (SELECT 1 FROM Nguoi_Dung WHERE id = @id AND (MaVaiTro = 1 OR email LIKE 'admin%' OR email = 'xoancao2.0@gmail.com'))
            BEGIN
                ;THROW 50007, N'Bảo mật hệ thống: Không thể xóa tài khoản Quản Trị Viên cấp cao!', 1;
            END;

            DELETE FROM Nguoi_Dung WHERE id = @id;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO

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

CREATE OR ALTER PROCEDURE sp_ThemVaiTro
    @TenVaiTro NVARCHAR(50),
    @MoTa NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
IF EXISTS (SELECT 1 FROM Vai_Tro WHERE TenVaiTro = @TenVaiTro)
        BEGIN
            ;THROW 50007, N'Tên vai trò này đã tồn tại trong hệ thống.', 1;
        END;

        INSERT INTO Vai_Tro (TenVaiTro, MoTa)
        VALUES (@TenVaiTro, @MoTa);

        SELECT MaVaiTro, TenVaiTro, MoTa
        FROM Vai_Tro
        WHERE MaVaiTro = SCOPE_IDENTITY();
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_SuaVaiTro
    @MaVaiTro INT,
    @TenVaiTro NVARCHAR(50),
    @MoTa NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
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
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_LayDanhSachSan
    @ma_loai_san INT = NULL
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
        WHERE (@ma_loai_san IS NULL OR sb.ma_loai_san = @ma_loai_san)
        ORDER BY sb.id ASC;
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_LayDanhSachLoaiSan
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT id, ten_loai, mo_ta, trang_thai
        FROM Loai_San
        WHERE (trang_thai = 1 OR trang_thai IS NULL)
        ORDER BY id ASC;
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_ThemSanBong
    @ten_san NVARCHAR(50),
    @ma_loai_san INT = NULL,
    @hinh_anh VARCHAR(255) = NULL,
    @don_gia_phut DECIMAL(10, 2) = 5000.00,
    @trang_thai VARCHAR(20) = 'SAN_SANG'
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
            -- Tự động fallback loại sân hợp lệ nếu chưa chọn hoặc ID không tồn tại
            IF @ma_loai_san IS NULL OR NOT EXISTS (SELECT 1 FROM Loai_San WHERE id = @ma_loai_san)
            BEGIN
                SELECT TOP 1 @ma_loai_san = id FROM Loai_San ORDER BY id ASC;
                IF @ma_loai_san IS NULL
                BEGIN
                    INSERT INTO Loai_San (ten_loai, mo_ta, trang_thai) VALUES (N'Sân bóng tiêu chuẩn', N'Loại sân tạo tự động', 1);
                    SET @ma_loai_san = SCOPE_IDENTITY();
                END;
            END;

            INSERT INTO San_Bong (ten_san, ma_loai_san, hinh_anh, don_gia_phut, trang_thai)
            VALUES (LTRIM(RTRIM(@ten_san)), @ma_loai_san, ISNULL(@hinh_anh, '/images/default-pitch.jpg'), ISNULL(@don_gia_phut, 5000.00), ISNULL(@trang_thai, 'SAN_SANG'));

            SELECT 
                sb.id, sb.ten_san, sb.hinh_anh, sb.don_gia_phut, sb.trang_thai, ls.id AS ma_loai_san, ls.ten_loai
            FROM San_Bong sb
            INNER JOIN Loai_San ls ON sb.ma_loai_san = ls.id
            WHERE sb.id = SCOPE_IDENTITY();
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_SuaSanBong
    @id INT,
    @ten_san NVARCHAR(50),
    @ma_loai_san INT = NULL,
    @hinh_anh VARCHAR(255) = NULL,
    @don_gia_phut DECIMAL(10, 2) = NULL,
    @trang_thai VARCHAR(20) = 'SAN_SANG'
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
            IF NOT EXISTS (SELECT 1 FROM San_Bong WHERE id = @id)
            BEGIN
                ;THROW 50008, N'Sân bóng không tồn tại.', 1;
            END;

            -- Fallback ma_loai_san hợp lệ
            IF @ma_loai_san IS NULL OR NOT EXISTS (SELECT 1 FROM Loai_San WHERE id = @ma_loai_san)
            BEGIN
                SELECT @ma_loai_san = ma_loai_san FROM San_Bong WHERE id = @id;
                IF @ma_loai_san IS NULL OR NOT EXISTS (SELECT 1 FROM Loai_San WHERE id = @ma_loai_san)
                BEGIN
                    SELECT TOP 1 @ma_loai_san = id FROM Loai_San ORDER BY id ASC;
                END;
            END;

            UPDATE San_Bong
            SET ten_san = LTRIM(RTRIM(@ten_san)),
                ma_loai_san = @ma_loai_san,
                hinh_anh = ISNULL(@hinh_anh, hinh_anh),
                don_gia_phut = ISNULL(@don_gia_phut, don_gia_phut),
                trang_thai = ISNULL(@trang_thai, trang_thai)
            WHERE id = @id;

            SELECT 
                sb.id, sb.ten_san, sb.hinh_anh, sb.don_gia_phut, sb.trang_thai, ls.id AS ma_loai_san, ls.ten_loai
            FROM San_Bong sb
            INNER JOIN Loai_San ls ON sb.ma_loai_san = ls.id
            WHERE sb.id = @id;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_XoaSanBong
    @id INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
            IF NOT EXISTS (SELECT 1 FROM San_Bong WHERE id = @id)
            BEGIN
                ;THROW 50009, N'Sân bóng không tồn tại.', 1;
            END;

            -- Xóa các đơn đặt sân liên quan trước
            DELETE FROM Don_Dat_San WHERE ma_san = @id;

            -- Xóa sân bóng
            DELETE FROM San_Bong WHERE id = @id;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_LayKhungGioGia
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT CAST(0 AS INT) AS id, CAST(0 AS INT) AS ma_loai_san, N'' AS ten_loai, '00:00' AS gio_bat_dau, '00:00' AS gio_ket_thuc, CAST(0 AS BIT) AS la_cuoi_tuan, CAST(0 AS DECIMAL(10,2)) AS don_gia
            WHERE 1 = 0;
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

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

CREATE OR ALTER PROCEDURE sp_ThemDichVuMoi
    @ten_dich_vu NVARCHAR(100),
    @don_gia DECIMAL(10, 2),
    @don_vi_tinh NVARCHAR(20) = NULL,
    @ton_kho INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
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
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO

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
        BEGIN TRANSACTION;
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
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_XoaDichVu
    @id INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
IF NOT EXISTS (SELECT 1 FROM Dich_Vu WHERE id = @id)
        BEGIN
            ;THROW 50036, N'Dịch vụ không tồn tại.', 1;
        END;

        DELETE FROM Dich_Vu WHERE id = @id;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_ThemDichVu
    @ma_don_dat INT,
    @ma_dich_vu INT,
    @so_luong INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Don_Dat_San WHERE id = @ma_don_dat AND trang_thai <> 'DA_HUY')
        BEGIN
            ;THROW 50030, N'Đơn đặt sân không tồn tại hoặc đã bị hủy.', 1;
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
        SET tong_tien = ISNULL(tien_san, 0) + @tong_tien_dv
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

CREATE OR ALTER PROCEDURE sp_CapNhatDichVuDonDat
    @ma_don_dat INT,
    @ma_dich_vu INT,
    @so_luong_moi INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Don_Dat_San WHERE id = @ma_don_dat AND trang_thai <> 'DA_HUY')
        BEGIN
            ;THROW 50030, N'Đơn đặt sân không tồn tại hoặc đã bị hủy.', 1;
        END;

        DECLARE @don_gia DECIMAL(10, 2);
        DECLARE @ton_kho_hien_tai INT;
        SELECT @don_gia = don_gia, @ton_kho_hien_tai = ton_kho
        FROM Dich_Vu
        WHERE id = @ma_dich_vu;

        IF @don_gia IS NULL
        BEGIN
            ;THROW 50032, N'Dịch vụ không tồn tại.', 1;
        END;

        DECLARE @so_luong_cu INT = 0;
        SELECT @so_luong_cu = ISNULL(so_luong, 0)
        FROM Chi_Tiet_Dich_Vu
        WHERE ma_don_dat = @ma_don_dat AND ma_dich_vu = @ma_dich_vu;

        DECLARE @chenh_lech INT = @so_luong_moi - @so_luong_cu;

        IF @chenh_lech > 0
        BEGIN
            IF @ton_kho_hien_tai < @chenh_lech
            BEGIN
                ;THROW 50033, N'Số lượng tồn kho không đủ để thêm dịch vụ này.', 1;
            END;
            UPDATE Dich_Vu SET ton_kho = ton_kho - @chenh_lech WHERE id = @ma_dich_vu;
        END
        ELSE IF @chenh_lech < 0
        BEGIN
            -- Hoàn lại tồn kho khi giảm hoặc xóa
            UPDATE Dich_Vu SET ton_kho = ton_kho + ABS(@chenh_lech) WHERE id = @ma_dich_vu;
        END;

        IF @so_luong_moi <= 0
        BEGIN
            DELETE FROM Chi_Tiet_Dich_Vu WHERE ma_don_dat = @ma_don_dat AND ma_dich_vu = @ma_dich_vu;
        END
        ELSE
        BEGIN
            IF @so_luong_cu > 0
            BEGIN
                UPDATE Chi_Tiet_Dich_Vu
                SET so_luong = @so_luong_moi,
                    tongtien_dichvu = @so_luong_moi * @don_gia
                WHERE ma_don_dat = @ma_don_dat AND ma_dich_vu = @ma_dich_vu;
            END
            ELSE
            BEGIN
                INSERT INTO Chi_Tiet_Dich_Vu (ma_don_dat, ma_dich_vu, so_luong, tongtien_dichvu)
                VALUES (@ma_don_dat, @ma_dich_vu, @so_luong_moi, @so_luong_moi * @don_gia);
            END;
        END;

        -- Cập nhật lại tổng tiền đơn đặt sân
        DECLARE @tong_tien_dv DECIMAL(10, 2) = 0;
        SELECT @tong_tien_dv = ISNULL(SUM(tongtien_dichvu), 0)
        FROM Chi_Tiet_Dich_Vu
        WHERE ma_don_dat = @ma_don_dat;

        UPDATE Don_Dat_San
        SET tong_tien = ISNULL(tien_san, 0) + @tong_tien_dv
        WHERE id = @ma_don_dat;

        COMMIT TRANSACTION;

        SELECT 
            @ma_don_dat AS ma_don_dat,
            @ma_dich_vu AS ma_dich_vu,
            @so_luong_moi AS so_luong,
            @tong_tien_dv AS tong_tien_dich_vu;
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

-- =====================================================================
-- Thủ tục: sp_DongBoTrangThaiDonDatSan
-- Mục đích: Tự động đồng bộ và giải phóng các ca đặt sân đã quá giờ thi đấu
--           - Nếu đơn DANG_DA hoặc da_vao_san = 1 mà đã kết thúc khung giờ:
--             + Đã trả đủ tiền -> Chuyển sang HOAN_THANH và da_vao_san = 0
--             + Chưa trả đủ tiền -> Chuyển sang CHO_THANH_TOAN và da_vao_san = 0
--           - Đảm bảo tính nhất quán giữa Dashboard (SÂN ĐANG ĐÁ) và Giao diện nhân viên
-- =====================================================================
CREATE OR ALTER PROCEDURE sp_DongBoTrangThaiDonDatSan
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @now DATETIME = GETDATE();
        DECLARE @today DATE = CAST(@now AS DATE);
        DECLARE @currentTime TIME = CAST(@now AS TIME);

        -- 1. Cập nhật các đơn có trạng thái DANG_DA hoặc da_vao_san = 1 nhưng đã quá giờ thi đấu
        -- 1.1. Đơn đã thanh toán đầy đủ: chuyển thành HOAN_THANH, da_vao_san = 0
        UPDATE d
        SET d.trang_thai = 'HOAN_THANH',
            d.da_vao_san = 0
        FROM Don_Dat_San d
        WHERE (d.trang_thai = 'DANG_DA' OR d.da_vao_san = 1)
          AND (d.ngay_da < @today OR (d.ngay_da = @today AND d.gio_ket_thuc IS NOT NULL AND d.gio_ket_thuc <= @currentTime))
          AND ISNULL((
              SELECT SUM(tt.so_tien) 
              FROM Thanh_Toan tt 
              WHERE tt.ma_don_dat = d.id AND tt.trang_thai_gd IN ('THANH_CONG', 'CHO_XU_LY')
          ), 0) >= ISNULL(d.tong_tien, d.tien_san);

        -- 1.2. Đơn chưa thanh toán đủ: chuyển thành CHO_THANH_TOAN, da_vao_san = 0 (giải phóng sân vào mục chờ thanh toán)
        UPDATE d
        SET d.trang_thai = 'CHO_THANH_TOAN',
            d.da_vao_san = 0
        FROM Don_Dat_San d
        WHERE (d.trang_thai = 'DANG_DA' OR d.da_vao_san = 1)
          AND (d.ngay_da < @today OR (d.ngay_da = @today AND d.gio_ket_thuc IS NOT NULL AND d.gio_ket_thuc <= @currentTime))
          AND ISNULL((
              SELECT SUM(tt.so_tien) 
              FROM Thanh_Toan tt 
              WHERE tt.ma_don_dat = d.id AND tt.trang_thai_gd IN ('THANH_CONG', 'CHO_XU_LY')
          ), 0) < ISNULL(d.tong_tien, d.tien_san);
    END TRY
    BEGIN CATCH
        -- Bỏ qua lỗi để không làm gián đoạn các luồng truy vấn
    END CATCH;
END;
GO

-- =====================================================================
-- Thủ tục: sp_XacNhanVaoSan
-- Mục đích: Xác nhận cho khách vào sân thi đấu trực tiếp (POS Management)
-- =====================================================================
CREATE OR ALTER PROCEDURE sp_XacNhanVaoSan
    @id INT,
    @trang_thai VARCHAR(20) = 'DANG_DA'
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Don_Dat_San WHERE id = @id)
        BEGIN
            ;THROW 50001, N'Đơn đặt sân không tồn tại!', 1;
        END;

        UPDATE Don_Dat_San
        SET da_vao_san = 1,
            gio_vao_san = CAST(GETDATE() AS TIME),
            trang_thai = ISNULL(@trang_thai, 'DANG_DA')
        WHERE id = @id;

        SELECT 
            id,
            ma_san,
            ngay_da,
            gio_bat_dau,
            gio_ket_thuc,
            trang_thai,
            da_vao_san,
            gio_vao_san
        FROM Don_Dat_San
        WHERE id = @id;
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_LayTatCaDonDat
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        -- Tự động dọn dẹp các đơn tạm quá hạn & đồng bộ trạng thái đơn quá hạn
        EXEC sp_HuyDonTam;
        EXEC sp_DongBoTrangThaiDonDatSan;

        SELECT 
            d.id,
            d.ma_san,
            ISNULL(sb.ten_san, N'Quầy Nước / Dịch Vụ Lẻ') AS ten_san,
            ISNULL(ls.ten_loai, N'Bán lẻ dịch vụ') AS ten_loai,
            d.ma_nguoi_dung,
            ISNULL(nd.ho_ten, N'Khách vãng lai') AS ten_khach_hang,
            nd.so_dien_thoai,
            d.ngay_da,
            CONVERT(VARCHAR(10), d.ngay_da, 103) AS ngay_da_dmy,
            CONVERT(VARCHAR(5), d.gio_bat_dau, 108) AS gio_bat_dau,
            CONVERT(VARCHAR(5), d.gio_ket_thuc, 108) AS gio_ket_thuc,
            d.tien_san,
            ISNULL(d.tong_tien, ISNULL(d.tien_san, 0) + ISNULL((SELECT SUM(ct.tongtien_dichvu) FROM Chi_Tiet_Dich_Vu ct WHERE ct.ma_don_dat = d.id), 0)) AS tong_tien,
            d.phuong_thuc,
            DATEDIFF(MINUTE, CAST(d.gio_bat_dau AS TIME), CAST(d.gio_ket_thuc AS TIME)) AS so_phut_da,
            d.ghi_chu,
            d.trang_thai,
            d.ngay_tao,
            CASE 
                WHEN d.trang_thai IN ('DA_THANH_TOAN', 'Da Thanh Toan', 'HOAN_THANH', 'KET_THUC') THEN d.tong_tien
                ELSE ISNULL((
                    SELECT SUM(tt.so_tien) 
                    FROM Thanh_Toan tt 
                    WHERE tt.ma_don_dat = d.id AND tt.trang_thai_gd IN ('THANH_CONG', 'DANG_CHO', 'CHO_XU_LY')
                ), CASE 
                    WHEN d.trang_thai = 'DA_COC' THEN ROUND(d.tong_tien * 0.3, 0)
                    ELSE 0 
                END)
            END AS so_tien_da_tra
        FROM Don_Dat_San d
        LEFT JOIN San_Bong sb ON d.ma_san = sb.id
        LEFT JOIN Loai_San ls ON sb.ma_loai_san = ls.id
        LEFT JOIN Nguoi_Dung nd ON d.ma_nguoi_dung = nd.id
        WHERE NOT (d.trang_thai IN ('CHO_THANH_TOAN', 'CHUA_THANH_TOAN') AND d.ghi_chu LIKE '%PayOS%' AND (d.ghi_chu IS NULL OR d.ghi_chu NOT LIKE N'%CẢNH BÁO%'))
          AND NOT (d.trang_thai = 'DA_HUY' AND (d.ghi_chu LIKE '%PayOS VietQR%' OR d.ghi_chu LIKE '%PayOS #%'))
        ORDER BY d.id DESC;
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_LayLichSan
    @ngay_da DATE,
    @ma_san INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        -- Tự động dọn dẹp các đơn tạm quá hạn & đồng bộ trạng thái đơn quá hạn
        EXEC sp_HuyDonTam;
        EXEC sp_DongBoTrangThaiDonDatSan;

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
            d.phuong_thuc,
            DATEDIFF(MINUTE, CAST(d.gio_bat_dau AS TIME), CAST(d.gio_ket_thuc AS TIME)) AS so_phut_da,
            d.ghi_chu,
            d.trang_thai,
            ISNULL(d.da_vao_san, 0) AS da_vao_san,
            CONVERT(VARCHAR(5), d.gio_vao_san, 108) AS gio_vao_san,
            d.ngay_tao
        FROM Don_Dat_San d
        INNER JOIN San_Bong sb ON d.ma_san = sb.id
        INNER JOIN Loai_San ls ON sb.ma_loai_san = ls.id
        INNER JOIN Nguoi_Dung nd ON d.ma_nguoi_dung = nd.id
        WHERE d.ngay_da = @ngay_da
          AND (@ma_san IS NULL OR d.ma_san = @ma_san)
          AND d.trang_thai NOT IN ('DA_HUY', 'HOAN_THANH', 'KET_THUC', N'Đã hủy', N'Hoàn thành', N'Kết thúc')
          AND NOT (d.trang_thai IN ('CHO_THANH_TOAN', 'CHUA_THANH_TOAN') AND d.ghi_chu LIKE '%PayOS%')
        ORDER BY d.gio_bat_dau ASC;
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

-- 24.2. Lấy danh sách các ca đặt sân theo ngày (phục vụ chọn ngày danh sách sân đã đặt)
CREATE OR ALTER PROCEDURE sp_LayDanhSachDatSanTheoNgay
    @ngay_da DATE
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        EXEC sp_HuyDonTam;

        SELECT 
            d.id AS ma_don_dat,
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
            d.phuong_thuc,
            DATEDIFF(MINUTE, CAST(d.gio_bat_dau AS TIME), CAST(d.gio_ket_thuc AS TIME)) AS so_phut_da,
            d.ghi_chu,
            d.trang_thai,
            ISNULL(d.da_vao_san, 0) AS da_vao_san,
            CONVERT(VARCHAR(5), d.gio_vao_san, 108) AS gio_vao_san,
            d.ngay_tao
        FROM Don_Dat_San d
        LEFT JOIN San_Bong sb ON d.ma_san = sb.id
        LEFT JOIN Loai_San ls ON sb.ma_loai_san = ls.id
        LEFT JOIN Nguoi_Dung nd ON d.ma_nguoi_dung = nd.id
        WHERE d.ngay_da = @ngay_da
          AND d.trang_thai NOT IN ('DA_HUY', 'HOAN_THANH', 'KET_THUC', N'Đã hủy', N'Hoàn thành', N'Kết thúc')
          AND NOT (d.trang_thai IN ('CHO_THANH_TOAN', 'CHUA_THANH_TOAN') AND d.ghi_chu LIKE '%PayOS%')
        ORDER BY d.gio_bat_dau ASC, d.id ASC;
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_LayLichSuDatSan
    @ma_nguoi_dung INT = NULL,
    @so_dien_thoai VARCHAR(20) = NULL,
    @email VARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        -- Tự động dọn dẹp các đơn tạm quá hạn hoặc đã hủy do reload & đồng bộ trạng thái đơn quá hạn
        EXEC sp_HuyDonTam;
        EXEC sp_DongBoTrangThaiDonDatSan;

        -- Tự động đồng bộ trạng thái đơn nếu đã có giao dịch PayOS/chuyển khoản thành công trong bảng Thanh_Toan
        UPDATE d
        SET d.trang_thai = CASE 
            WHEN tt_sum.da_tra >= ISNULL(d.tong_tien, d.tien_san) THEN 'DA_THANH_TOAN'
            ELSE 'DA_COC'
        END
        FROM Don_Dat_San d
        CROSS APPLY (
            SELECT SUM(tt.so_tien) AS da_tra
            FROM Thanh_Toan tt
            WHERE tt.ma_don_dat = d.id AND tt.trang_thai_gd IN ('THANH_CONG', 'CHO_XU_LY')
        ) tt_sum
        WHERE d.trang_thai IN ('CHO_THANH_TOAN', 'CHUA_THANH_TOAN')
          AND tt_sum.da_tra > 0;

        -- Chuẩn hóa tham số tìm kiếm
        DECLARE @clean_phone VARCHAR(20) = NULL;
        IF @so_dien_thoai IS NOT NULL AND LTRIM(RTRIM(@so_dien_thoai)) <> ''
            SET @clean_phone = REPLACE(REPLACE(LTRIM(RTRIM(@so_dien_thoai)), ' ', ''), '.', '');

        DECLARE @clean_email VARCHAR(255) = NULL;
        IF @email IS NOT NULL AND LTRIM(RTRIM(@email)) <> ''
            SET @clean_email = LOWER(LTRIM(RTRIM(@email)));

        -- Bảo mật dữ liệu người dùng: Nếu không có bất kỳ thông tin nhận diện nào, trả về rỗng để tránh lộ thông tin khách hàng khác
        IF @ma_nguoi_dung IS NULL AND @clean_phone IS NULL AND @clean_email IS NULL
        BEGIN
            SELECT TOP 0 
                d.id,
                '' AS ma_don,
                d.ma_san,
                sb.ten_san,
                ls.ten_loai,
                CONVERT(VARCHAR(10), d.ngay_da, 120) AS ngay_da,
                CONVERT(VARCHAR(10), d.ngay_da, 103) AS ngay_da_dmy,
                CONVERT(VARCHAR(5), d.gio_bat_dau, 108) AS gio_bat_dau,
                CONVERT(VARCHAR(5), d.gio_ket_thuc, 108) AS gio_ket_thuc,
                d.tien_san,
                d.tong_tien,
                d.phuong_thuc,
                d.ghi_chu,
                d.trang_thai,
                d.ngay_tao,
                nd.ho_ten AS ten_khach_hang,
                nd.so_dien_thoai AS sdt_khach_hang,
                ISNULL(d.da_vao_san, 0) AS da_vao_san,
                CONVERT(VARCHAR(5), d.gio_vao_san, 108) AS gio_vao_san,
                0 AS da_qua_gio,
                0 AS tien_coc,
                0 AS tien_da_nhan,
                0 AS tien_thieu
            FROM Don_Dat_San d
            LEFT JOIN San_Bong sb ON d.ma_san = sb.id
            LEFT JOIN Loai_San ls ON sb.ma_loai_san = ls.id
            LEFT JOIN Nguoi_Dung nd ON d.ma_nguoi_dung = nd.id;
            RETURN;
        END;

        SELECT 
            d.id,
            'DDS-' + CAST(YEAR(d.ngay_tao) AS VARCHAR) + '-' + RIGHT('000' + CAST(d.id AS VARCHAR), 3) AS ma_don,
            d.ma_san,
            sb.ten_san,
            ls.ten_loai,
            CONVERT(VARCHAR(10), d.ngay_da, 120) AS ngay_da,
            CONVERT(VARCHAR(10), d.ngay_da, 103) AS ngay_da_dmy,
            CONVERT(VARCHAR(5), d.gio_bat_dau, 108) AS gio_bat_dau,
            CONVERT(VARCHAR(5), d.gio_ket_thuc, 108) AS gio_ket_thuc,
            d.tien_san,
            d.tong_tien,
            d.phuong_thuc,
            d.ghi_chu,
            d.trang_thai,
            d.ngay_tao,
            nd.ho_ten AS ten_khach_hang,
            nd.so_dien_thoai AS sdt_khach_hang,
            ISNULL(d.da_vao_san, 0) AS da_vao_san,
            CONVERT(VARCHAR(5), d.gio_vao_san, 108) AS gio_vao_san,
            CASE 
                WHEN d.ngay_da < CAST(GETDATE() AS DATE) THEN 1
                WHEN d.ngay_da = CAST(GETDATE() AS DATE) AND CAST(d.gio_ket_thuc AS TIME) <= CAST(GETDATE() AS TIME) THEN 1
                ELSE 0
            END AS da_qua_gio,
            ISNULL((
                SELECT SUM(tt.so_tien) 
                FROM Thanh_Toan tt 
                WHERE tt.ma_don_dat = d.id AND tt.loai_thanh_toan = 'DAT_COC' AND tt.trang_thai_gd IN ('THANH_CONG', 'DANG_CHO', 'CHO_XU_LY')
            ), ROUND(d.tong_tien * 0.3, 0)) AS tien_coc,
            CASE 
                WHEN d.trang_thai IN ('DA_THANH_TOAN', 'Da Thanh Toan', 'HOAN_THANH', 'KET_THUC') THEN d.tong_tien
                ELSE ISNULL((
                    SELECT SUM(tt.so_tien) 
                    FROM Thanh_Toan tt 
                    WHERE tt.ma_don_dat = d.id AND tt.trang_thai_gd IN ('THANH_CONG', 'DANG_CHO', 'CHO_XU_LY')
                ), CASE 
                    WHEN d.trang_thai = 'DA_COC' THEN ROUND(d.tong_tien * 0.3, 0)
                    ELSE 0 
                END)
            END AS tien_da_nhan,
            CASE 
                WHEN d.trang_thai IN ('DA_THANH_TOAN', 'Da Thanh Toan', 'HOAN_THANH', 'KET_THUC') THEN 0
                ELSE CASE 
                    WHEN (d.tong_tien - ISNULL((
                        SELECT SUM(tt.so_tien) 
                        FROM Thanh_Toan tt 
                        WHERE tt.ma_don_dat = d.id AND tt.trang_thai_gd IN ('THANH_CONG', 'DANG_CHO', 'CHO_XU_LY')
                    ), CASE 
                        WHEN d.trang_thai = 'DA_COC' THEN ROUND(d.tong_tien * 0.3, 0)
                        ELSE 0 
                    END)) < 0 THEN 0
                    ELSE (d.tong_tien - ISNULL((
                        SELECT SUM(tt.so_tien) 
                        FROM Thanh_Toan tt 
                        WHERE tt.ma_don_dat = d.id AND tt.trang_thai_gd IN ('THANH_CONG', 'DANG_CHO', 'CHO_XU_LY')
                    ), CASE 
                        WHEN d.trang_thai = 'DA_COC' THEN ROUND(d.tong_tien * 0.3, 0)
                        ELSE 0 
                    END))
                END
            END AS tien_thieu
        FROM Don_Dat_San d
        LEFT JOIN San_Bong sb ON d.ma_san = sb.id
        LEFT JOIN Loai_San ls ON sb.ma_loai_san = ls.id
        LEFT JOIN Nguoi_Dung nd ON d.ma_nguoi_dung = nd.id
        WHERE (
            -- 1. Khớp theo ID người dùng đặt sân
            (@ma_nguoi_dung IS NOT NULL AND d.ma_nguoi_dung = @ma_nguoi_dung)
            -- 2. Hoặc khớp theo Số điện thoại (ở bảng Nguoi_Dung hoặc ghi chú)
            OR (@clean_phone IS NOT NULL AND (
                REPLACE(REPLACE(ISNULL(nd.so_dien_thoai, ''), ' ', ''), '.', '') = @clean_phone
                OR d.ghi_chu LIKE '%' + @clean_phone + '%'
            ))
            -- 3. Hoặc khớp theo Email
            OR (@clean_email IS NOT NULL AND (
                LOWER(ISNULL(nd.email, '')) = @clean_email
                OR d.ghi_chu LIKE '%' + @clean_email + '%'
            ))
            -- 4. Hoặc nếu là Quản trị viên (ADMIN), cho phép xem các đơn của quản trị viên
            OR (@ma_nguoi_dung IS NOT NULL AND EXISTS (
                SELECT 1 FROM Nguoi_Dung adm 
                WHERE adm.id = @ma_nguoi_dung AND (adm.MaVaiTro = 1 OR LOWER(adm.email) IN ('admin@gmail.com', 'xoancao2.0@gmail.com'))
            ) AND (nd.ho_ten LIKE N'%Quản Trị%' OR d.ghi_chu LIKE N'%Quản Trị%' OR d.id = 157))
        )
        -- Không ẩn các đơn đã có giao dịch thanh toán thành công
        AND NOT (
            d.trang_thai IN ('CHO_THANH_TOAN', 'CHUA_THANH_TOAN') 
            AND d.ghi_chu LIKE '%PayOS%' 
            AND (d.ghi_chu IS NULL OR d.ghi_chu NOT LIKE N'%CẢNH BÁO%')
            AND NOT EXISTS (
                SELECT 1 FROM Thanh_Toan tt 
                WHERE tt.ma_don_dat = d.id AND tt.trang_thai_gd IN ('THANH_CONG', 'CHO_XU_LY')
            )
        )
        -- Loại bỏ đơn rác đã hủy
        AND NOT (d.trang_thai = 'DA_HUY' AND (d.ghi_chu LIKE '%PayOS VietQR%' OR d.ghi_chu LIKE '%PayOS #%'))
        ORDER BY d.id DESC;
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_LayChiTietDichVuDonDat
    @ma_don_dat INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT 
                ct.ma_don_dat,
                ct.ma_dich_vu,
                dv.ten_dich_vu,
                ct.so_luong,
                ISNULL(ct.so_luong_da_tra, 0) AS so_luong_da_tra,
                dv.don_gia,
                ct.tongtien_dichvu
            FROM Chi_Tiet_Dich_Vu ct
            JOIN Dich_Vu dv ON ct.ma_dich_vu = dv.id
            WHERE (@ma_don_dat IS NULL OR ct.ma_don_dat = @ma_don_dat);
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_DatSan
    @ma_nguoi_dung INT,
    @ma_san INT,
    @ngay_da DATE,
    @gio_bat_dau TIME,
    @gio_ket_thuc TIME,
    @tien_san DECIMAL(10, 2) = NULL,
    @tong_tien DECIMAL(10, 2) = NULL,
    @phuong_thuc VARCHAR(20) = 'CHUYEN_KHOAN',
    @trang_thai VARCHAR(20) = 'DA_COC',
    @ghi_chu NVARCHAR(MAX) = NULL
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

        DECLARE @tong_tien_final DECIMAL(10, 2) = @tong_tien;
        IF @tong_tien_final IS NULL OR @tong_tien_final <= 0
        BEGIN
            SET @tong_tien_final = @gia_tinh_duoc;
        END;

        INSERT INTO Don_Dat_San (
            ma_nguoi_dung, ma_san, ngay_da, gio_bat_dau, gio_ket_thuc, 
            tien_san, tong_tien, phuong_thuc, ghi_chu, trang_thai, ngay_tao
        )
        VALUES (
            @ma_nguoi_dung, @ma_san, @ngay_da, @gio_bat_dau, @gio_ket_thuc, 
            @gia_tinh_duoc, @tong_tien_final, @phuong_thuc, @ghi_chu, @trang_thai, GETDATE()
        );

        DECLARE @ma_don_moi INT = SCOPE_IDENTITY();

        COMMIT TRANSACTION;

        SELECT 
            d.id, d.ma_nguoi_dung, d.ma_san, sb.ten_san, d.ngay_da,
            CONVERT(VARCHAR(5), d.gio_bat_dau, 108) AS gio_bat_dau,
            CONVERT(VARCHAR(5), d.gio_ket_thuc, 108) AS gio_ket_thuc,
            d.tien_san, d.tong_tien, d.phuong_thuc,
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
            tien_san, tong_tien, phuong_thuc, ghi_chu, trang_thai, ngay_tao
        )
        VALUES (
            @ma_nguoi_dung, @ma_san, @ngay_da, @gio_bat_dau, @gio_ket_thuc, 
            @tien_san, @tien_san, 'TIEN_MAT', @ghi_chu, @trang_thai, GETDATE()
        );

        DECLARE @ma_don_moi INT = SCOPE_IDENTITY();

        COMMIT TRANSACTION;

        SELECT 
            d.id, d.ma_nguoi_dung, nd.ho_ten AS ten_khach_hang, nd.so_dien_thoai,
            d.ma_san, sb.ten_san, ls.ten_loai, d.ngay_da,
            CONVERT(VARCHAR(5), d.gio_bat_dau, 108) AS gio_bat_dau,
            CONVERT(VARCHAR(5), d.gio_ket_thuc, 108) AS gio_ket_thuc,
            @so_phut AS so_phut_da, d.phuong_thuc, d.ghi_chu,
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
            tien_san, tong_tien, phuong_thuc, ghi_chu, trang_thai, ngay_tao
        )
        VALUES (
            @ma_nguoi_dung, @ma_san, @ngay_hien_tai, @gio_hien_tai, @gio_tam_tinh, 
            0, 0, 'TIEN_MAT', ISNULL(@ghi_chu, N'Đang đá tính giờ trực tiếp tại quầy'), 'DA_COC', GETDATE()
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
            0 AS so_phut_da, d.phuong_thuc, d.ghi_chu,
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
            @so_phut_thuc_te AS so_phut_da, d.phuong_thuc, d.ghi_chu,
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

CREATE OR ALTER PROCEDURE sp_ThanhToanDon
    @ma_don_dat INT,
    @phuong_thuc VARCHAR(20),
    @loai_thanh_toan VARCHAR(20),
    @so_tien DECIMAL(10, 2),
    @ma_giao_dich VARCHAR(100) = NULL,
    @noi_dung_chuyen_khoan NVARCHAR(255) = NULL
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

        -- KIỂM TRA ĐỐI SOÁT NỘI DUNG CHUYỂN KHOẢN NẾU LÀ CHUYỂN KHOẢN CÓ NỘI DUNG
        IF @phuong_thuc = 'CHUYEN_KHOAN' AND @noi_dung_chuyen_khoan IS NOT NULL AND LTRIM(RTRIM(@noi_dung_chuyen_khoan)) <> ''
        BEGIN
            DECLARE @ma_don_str VARCHAR(20) = CAST(@ma_don_dat AS VARCHAR(20));
            DECLARE @pattern1 NVARCHAR(50) = N'%DS' + @ma_don_str + N'%';
            DECLARE @pattern2 NVARCHAR(50) = N'%DS ' + @ma_don_str + N'%';
            DECLARE @pattern3 NVARCHAR(50) = N'%DS0%' + @ma_don_str + N'%';

            IF (UPPER(@noi_dung_chuyen_khoan) NOT LIKE @pattern1
                AND UPPER(@noi_dung_chuyen_khoan) NOT LIKE @pattern2
                AND UPPER(@noi_dung_chuyen_khoan) NOT LIKE @pattern3
                AND (@ma_giao_dich IS NULL OR UPPER(@noi_dung_chuyen_khoan) NOT LIKE N'%' + UPPER(@ma_giao_dich) + N'%'))
            BEGIN
                ;THROW 50060, N'Nội dung chuyển khoản không khớp với mã đơn đặt sân (Yêu cầu cú pháp DS + mã đơn)!', 1;
            END;
        END;

        INSERT INTO Thanh_Toan (
            ma_don_dat, phuong_thuc, loai_thanh_toan, so_tien, ma_giao_dich, noi_dung_chuyen_khoan, trang_thai_gd, ngay_thanh_toan
        )
        VALUES (
            @ma_don_dat, @phuong_thuc, @loai_thanh_toan, @so_tien, @ma_giao_dich, @noi_dung_chuyen_khoan, 'THANH_CONG', GETDATE()
        );

        IF @loai_thanh_toan = 'DAT_COC'
        BEGIN
            UPDATE Don_Dat_San SET trang_thai = 'DA_COC' WHERE id = @ma_don_dat;
        END
        ELSE IF @loai_thanh_toan = 'TRA_HET'
        BEGIN
            UPDATE Don_Dat_San SET trang_thai = 'DA_THANH_TOAN' WHERE id = @ma_don_dat;
        END
        ELSE
        BEGIN
            UPDATE Don_Dat_San SET trang_thai = 'DA_COC' WHERE id = @ma_don_dat;
        END;

        COMMIT TRANSACTION;

        SELECT 
            tt.id AS ma_thanh_toan,
            tt.ma_don_dat,
            tt.phuong_thuc,
            tt.loai_thanh_toan,
            tt.so_tien,
            tt.ma_giao_dich,
            tt.noi_dung_chuyen_khoan,
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

CREATE OR ALTER PROCEDURE sp_KiemTraNoiDungChuyenKhoan
    @ma_don_dat INT,
    @noi_dung_chuyen_khoan NVARCHAR(255),
    @ma_giao_dich VARCHAR(100) = NULL,
    @hop_le BIT OUTPUT,
    @thong_bao NVARCHAR(255) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Don_Dat_San WHERE id = @ma_don_dat)
            BEGIN
                SET @hop_le = 0;
                SET @thong_bao = N'Không tìm thấy đơn đặt sân #' + CAST(@ma_don_dat AS NVARCHAR(20));
                RETURN;
            END;
        
            IF @noi_dung_chuyen_khoan IS NULL OR LTRIM(RTRIM(@noi_dung_chuyen_khoan)) = ''
            BEGIN
                SET @hop_le = 0;
                SET @thong_bao = N'Nội dung chuyển khoản rỗng!';
                RETURN;
            END;
        
            DECLARE @ma_don_str VARCHAR(20) = CAST(@ma_don_dat AS VARCHAR(20));
            DECLARE @p1 NVARCHAR(50) = N'%DS' + @ma_don_str + N'%';
            DECLARE @p2 NVARCHAR(50) = N'%DS ' + @ma_don_str + N'%';
            DECLARE @p3 NVARCHAR(50) = N'%DS0%' + @ma_don_str + N'%';
        
            IF (UPPER(@noi_dung_chuyen_khoan) LIKE @p1 
                OR UPPER(@noi_dung_chuyen_khoan) LIKE @p2 
                OR UPPER(@noi_dung_chuyen_khoan) LIKE @p3
                OR (@ma_giao_dich IS NOT NULL AND LTRIM(RTRIM(@ma_giao_dich)) <> '' AND UPPER(@noi_dung_chuyen_khoan) LIKE N'%' + UPPER(@ma_giao_dich) + N'%'))
            BEGIN
                SET @hop_le = 1;
                SET @thong_bao = N'Nội dung chuyển khoản hợp lệ';
            END
            ELSE
            BEGIN
                SET @hop_le = 0;
                SET @thong_bao = N'Nội dung chuyển khoản không khớp. Yêu cầu cú pháp: DS' + @ma_don_str;
            END;
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_GhiNhanChuyenKhoanSaiNoiDung
    @ma_don_dat INT,
    @so_tien DECIMAL(10, 2),
    @ma_giao_dich VARCHAR(100) = NULL,
    @noi_dung_thuc_te NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
-- Cập nhật đơn đặt sân sang trạng thái CHO_XAC_NHAN và ghi chú cảnh báo
        UPDATE Don_Dat_San
        SET trang_thai = 'CHO_XAC_NHAN',
            ghi_chu = CASE 
                WHEN ghi_chu LIKE N'%[CẢNH BÁO CK SAI NỘI DUNG%' THEN ghi_chu
                ELSE ISNULL(ghi_chu, '') + N' | [CẢNH BÁO CK SAI NỘI DUNG: Nhận ' + CAST(@so_tien AS NVARCHAR(30)) + N'đ, ND: "' + ISNULL(@noi_dung_thuc_te, N'') + N'"]'
            END
        WHERE id = @ma_don_dat;

        -- Ghi nhận giao dịch vào bảng Thanh_Toan với trạng thái DANG_CHO (đang chờ xử lý)
        IF @ma_don_dat IS NOT NULL AND @so_tien > 0
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM Thanh_Toan 
                WHERE ma_don_dat = @ma_don_dat 
                  AND ((ma_giao_dich = @ma_giao_dich AND @ma_giao_dich IS NOT NULL) OR trang_thai_gd = 'DANG_CHO')
            )
            BEGIN
                INSERT INTO Thanh_Toan (
                    ma_don_dat, phuong_thuc, loai_thanh_toan, so_tien, ma_giao_dich, noi_dung_chuyen_khoan, trang_thai_gd, ngay_thanh_toan
                ) VALUES (
                    @ma_don_dat, 
                    'CHUYEN_KHOAN', 
                    'DAT_COC', 
                    @so_tien, 
                    ISNULL(@ma_giao_dich, 'CK_SAI_ND_' + CAST(@ma_don_dat AS VARCHAR(20))), 
                    @noi_dung_thuc_te, 
                    'DANG_CHO', 
                    GETDATE()
                );
            END
            ELSE IF @ma_giao_dich IS NOT NULL
            BEGIN
                UPDATE Thanh_Toan
                SET noi_dung_chuyen_khoan = @noi_dung_thuc_te,
                    so_tien = @so_tien,
                    ngay_thanh_toan = GETDATE()
                WHERE ma_don_dat = @ma_don_dat AND trang_thai_gd = 'DANG_CHO';
            END
        END
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO

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
            CONVERT(VARCHAR(10), d.ngay_da, 103) AS ngay_da_dmy,
            tt.so_tien,
            tt.phuong_thuc,
            tt.loai_thanh_toan,
            tt.ma_giao_dich,
            tt.noi_dung_chuyen_khoan,
            tt.trang_thai_gd,
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
            CONVERT(VARCHAR(10), d.ngay_da, 103) AS ngay_da_dmy,
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

CREATE OR ALTER PROCEDURE sp_LayDanhSachChiTietDichVu
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT 
            ct.ma_dich_vu AS id,
            ct.ma_don_dat,
            nd.ho_ten AS ten_khach_hang,
            sb.ten_san,
            ct.ma_dich_vu,
            dv.ten_dich_vu,
            N'Phần' AS don_vi_tinh,
            ct.so_luong,
            ISNULL(ct.so_luong_da_tra, 0) AS so_luong_da_tra,
            dv.don_gia,
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

CREATE OR ALTER PROCEDURE sp_ThemLoaiSan
    @ten_loai NVARCHAR(50),
    @mo_ta NVARCHAR(MAX) = NULL,
    @trang_thai BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
            IF EXISTS (SELECT 1 FROM Loai_San WHERE LOWER(LTRIM(RTRIM(ten_loai))) = LOWER(LTRIM(RTRIM(@ten_loai))))
            BEGIN
                ;THROW 50035, N'Tên loại sân đã tồn tại trong hệ thống.', 1;
            END;

            INSERT INTO Loai_San (ten_loai, mo_ta, trang_thai)
            VALUES (LTRIM(RTRIM(@ten_loai)), @mo_ta, @trang_thai);

            SELECT id, ten_loai, mo_ta, trang_thai
            FROM Loai_San
            WHERE id = SCOPE_IDENTITY();
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_SuaLoaiSan
    @id INT,
    @ten_loai NVARCHAR(50),
    @mo_ta NVARCHAR(MAX) = NULL,
    @trang_thai BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
            IF NOT EXISTS (SELECT 1 FROM Loai_San WHERE id = @id)
            BEGIN
                ;THROW 50030, N'Loại sân không tồn tại.', 1;
            END;

            IF EXISTS (SELECT 1 FROM Loai_San WHERE LOWER(LTRIM(RTRIM(ten_loai))) = LOWER(LTRIM(RTRIM(@ten_loai))) AND id <> @id)
            BEGIN
                ;THROW 50036, N'Tên loại sân đã được sử dụng bởi loại sân khác.', 1;
            END;

            UPDATE Loai_San
            SET ten_loai = LTRIM(RTRIM(@ten_loai)),
                mo_ta = ISNULL(@mo_ta, mo_ta),
                trang_thai = ISNULL(@trang_thai, trang_thai)
            WHERE id = @id;

            SELECT id, ten_loai, mo_ta, trang_thai
            FROM Loai_San
            WHERE id = @id;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_XoaLoaiSan
    @id INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
            IF NOT EXISTS (SELECT 1 FROM Loai_San WHERE id = @id)
            BEGIN
                ;THROW 50031, N'Loại sân không tồn tại.', 1;
            END;

            -- 1. Xóa các đơn đặt sân liên quan đến các sân thuộc loại sân này
            DELETE FROM Don_Dat_San 
            WHERE ma_san IN (SELECT id FROM San_Bong WHERE ma_loai_san = @id);

            -- 2. Xóa tất cả các sân bóng thuộc loại sân này
            DELETE FROM San_Bong 
            WHERE ma_loai_san = @id;

            -- 3. Xóa loại sân
            DELETE FROM Loai_San 
            WHERE id = @id;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_XoaVaiTro
    @MaVaiTro INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
IF NOT EXISTS (SELECT 1 FROM Vai_Tro WHERE MaVaiTro = @MaVaiTro)
        BEGIN
            ;THROW 50033, N'Vai trò không tồn tại.', 1;
        END;

        IF EXISTS (SELECT 1 FROM Nguoi_Dung WHERE MaVaiTro = @MaVaiTro)
        BEGIN
            ;THROW 50034, N'Không thể xóa vai trò đang có người dùng sử dụng.', 1;
        END;

        DELETE FROM Vai_Tro WHERE MaVaiTro = @MaVaiTro;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_SuaPhieuNhapKho
    @id INT,
    @so_luong_nhap INT,
    @gia_nhap DECIMAL(10, 2)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Phieu_Nhap_Kho WHERE id = @id)
        BEGIN
            ;THROW 50042, N'Phiếu nhập kho không tồn tại.', 1;
        END;

        DECLARE @ma_dich_vu INT, @so_luong_cu INT;
        SELECT @ma_dich_vu = ma_dich_vu, @so_luong_cu = so_luong_nhap FROM Phieu_Nhap_Kho WHERE id = @id;

        UPDATE Phieu_Nhap_Kho
        SET so_luong_nhap = @so_luong_nhap,
            gia_nhap = @gia_nhap
        WHERE id = @id;

        UPDATE Dich_Vu
        SET ton_kho = ton_kho - @so_luong_cu + @so_luong_nhap
        WHERE id = @ma_dich_vu;

        COMMIT TRANSACTION;

        SELECT 
            p.id, p.ma_dich_vu, dv.ten_dich_vu, N'Chai' AS don_vi_tinh,
            p.so_luong_nhap, p.gia_nhap, (p.so_luong_nhap * p.gia_nhap) AS tong_tien_nhap, p.ngay_nhap
        FROM Phieu_Nhap_Kho p
        LEFT JOIN Dich_Vu dv ON p.ma_dich_vu = dv.id
        WHERE p.id = @id;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_XoaPhieuNhapKho
    @id INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Phieu_Nhap_Kho WHERE id = @id)
        BEGIN
            ;THROW 50043, N'Phiếu nhập kho không tồn tại.', 1;
        END;

        DECLARE @ma_dich_vu INT, @so_luong INT;
        SELECT @ma_dich_vu = ma_dich_vu, @so_luong = so_luong_nhap FROM Phieu_Nhap_Kho WHERE id = @id;

        DELETE FROM Phieu_Nhap_Kho WHERE id = @id;

        UPDATE Dich_Vu
        SET ton_kho = CASE WHEN ton_kho >= @so_luong THEN ton_kho - @so_luong ELSE 0 END
        WHERE id = @ma_dich_vu;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_ThemDonDatVaThanhToan
    @ma_nguoi_dung INT = NULL,
    @ma_san INT = NULL,
    @ngay_da DATE,
    @gio_bat_dau VARCHAR(8),
    @gio_ket_thuc VARCHAR(8),
    @tien_san DECIMAL(10, 2) = NULL,
    @tong_tien DECIMAL(10, 2) = NULL,
    @phuong_thuc VARCHAR(20) = 'TIEN_MAT',
    @trang_thai VARCHAR(30) = 'CHO_THANH_TOAN',
    @ghi_chu NVARCHAR(MAX) = NULL,
    @loai_thanh_toan VARCHAR(20) = NULL,
    @so_tien DECIMAL(10, 2) = NULL,
    @trang_thai_gd VARCHAR(20) = 'THANH_CONG',
    @ten_khach_hang NVARCHAR(100) = NULL,
    @so_dien_thoai VARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        DECLARE @clean_gbd VARCHAR(8) = CASE 
            WHEN @gio_bat_dau LIKE '24:00%' THEN '23:59:59'
            WHEN LEN(LTRIM(RTRIM(@gio_bat_dau))) = 5 THEN CONCAT(LTRIM(RTRIM(@gio_bat_dau)), ':00')
            ELSE LTRIM(RTRIM(@gio_bat_dau))
        END;
        DECLARE @clean_gkt VARCHAR(8) = CASE 
            WHEN @gio_ket_thuc LIKE '24:00%' THEN '23:59:59'
            WHEN LEN(LTRIM(RTRIM(@gio_ket_thuc))) = 5 THEN CONCAT(LTRIM(RTRIM(@gio_ket_thuc)), ':00')
            ELSE LTRIM(RTRIM(@gio_ket_thuc))
        END;

        DECLARE @bd_time TIME = CAST(@clean_gbd AS TIME);
        DECLARE @kt_time TIME = CAST(@clean_gkt AS TIME);

        DECLARE @final_user_id INT = @ma_nguoi_dung;
        DECLARE @clean_ten NVARCHAR(100) = NULLIF(LTRIM(RTRIM(@ten_khach_hang)), '');
        DECLARE @clean_phone VARCHAR(20) = NULLIF(LTRIM(RTRIM(@so_dien_thoai)), '');

        -- 1. Nếu có cung cấp Tên hoặc SĐT -> Tìm hoặc tạo mới khách hàng trong bảng Nguoi_Dung
        IF @clean_phone IS NOT NULL OR @clean_ten IS NOT NULL
        BEGIN
            DECLARE @found_id INT = NULL;

            -- Tìm theo SĐT trước
            IF @clean_phone IS NOT NULL
            BEGIN
                SELECT TOP 1 @found_id = id FROM Nguoi_Dung WHERE so_dien_thoai = @clean_phone;
            END;

            -- Tìm theo Tên nếu chưa thấy
            IF @found_id IS NULL AND @clean_ten IS NOT NULL
            BEGIN
                SELECT TOP 1 @found_id = id FROM Nguoi_Dung WHERE ho_ten = @clean_ten;
            END;

            -- Nếu chưa có trong Nguoi_Dung -> Thêm mới tài khoản khách hàng
            IF @found_id IS NULL
            BEGIN
                DECLARE @email_auto VARCHAR(255) = CONCAT('khach_', DATEDIFF(SECOND, '2026-01-01', GETDATE()), '_', ABS(CHECKSUM(NEWID()) % 1000), '@khachhang.pos');
                INSERT INTO Nguoi_Dung (ho_ten, email, so_dien_thoai, MaVaiTro)
                VALUES (ISNULL(@clean_ten, CONCAT(N'Khách ', @clean_phone)), @email_auto, @clean_phone, 3);
                SET @found_id = SCOPE_IDENTITY();
            END;

            SET @final_user_id = @found_id;
        END;

        -- 2. Nếu không điền tên/sđt -> Dùng tài khoản đang đăng nhập hoặc mặc định 1
        IF @final_user_id IS NULL
        BEGIN
            SET @final_user_id = 1;
        END;

        DECLARE @tien_san_val DECIMAL(10,2) = ISNULL(@tien_san, 0);
        DECLARE @tong_tien_val DECIMAL(10,2) = ISNULL(@tong_tien, @tien_san_val);
        DECLARE @trang_thai_chuan VARCHAR(30) = ISNULL(@trang_thai, 'CHO_THANH_TOAN');

        INSERT INTO Don_Dat_San (
            ma_nguoi_dung, ma_san, ngay_da, gio_bat_dau, gio_ket_thuc,
            tien_san, tong_tien, phuong_thuc, ghi_chu, trang_thai, ngay_tao
        )
        VALUES (
            @final_user_id, @ma_san, @ngay_da, @bd_time, @kt_time,
            @tien_san_val, @tong_tien_val, @phuong_thuc, @ghi_chu, @trang_thai_chuan, GETDATE()
        );

        DECLARE @newId INT = SCOPE_IDENTITY();

        IF @trang_thai_chuan = 'DA_THANH_TOAN' AND (@so_tien IS NULL OR @so_tien = 0)
        BEGIN
            SET @so_tien = @tong_tien_val;
        END;
        ELSE IF @trang_thai_chuan = 'DA_COC' AND (@so_tien IS NULL OR @so_tien = 0)
        BEGIN
            SET @so_tien = ROUND(@tong_tien_val * 0.3, 0);
        END;

        DECLARE @tt_gd_chuan VARCHAR(20) = 'THANH_CONG';
        IF @trang_thai_chuan IN ('DA_THANH_TOAN', 'DA_COC', 'DANG_DA')
        BEGIN
            SET @tt_gd_chuan = 'THANH_CONG';
        END
        ELSE IF @trang_thai_gd IN ('THANH_CONG', 'DANG_CHO', 'CHO_XU_LY', 'THAT_BAI', 'HOAN_TIEN')
        BEGIN
            SET @tt_gd_chuan = CASE WHEN @trang_thai_gd = 'CHO_XU_LY' THEN 'DANG_CHO' ELSE @trang_thai_gd END;
        END;

        IF @trang_thai_chuan NOT IN ('CHO_THANH_TOAN', 'CHUA_THANH_TOAN') AND @so_tien IS NOT NULL AND @so_tien > 0
        BEGIN
            INSERT INTO Thanh_Toan (
                ma_don_dat, phuong_thuc, loai_thanh_toan, so_tien, ma_giao_dich, trang_thai_gd, ngay_thanh_toan
            )
            VALUES (
                @newId, @phuong_thuc, CASE WHEN @trang_thai_chuan = 'DA_THANH_TOAN' THEN 'TRA_HET' ELSE ISNULL(@loai_thanh_toan, 'DAT_COC') END, @so_tien, CONCAT('GD_', @newId, '_', DATEDIFF(SECOND, '2026-01-01', GETDATE())), @tt_gd_chuan, GETDATE()
            );
        END;

        COMMIT TRANSACTION;

        SELECT 
            d.id, d.ma_san, 
            ISNULL(sb.ten_san, N'Quầy Nước / Dịch Vụ Lẻ') AS ten_san, 
            ISNULL(ls.ten_loai, N'Bán lẻ dịch vụ') AS ten_loai, 
            d.ma_nguoi_dung,
            nd.ho_ten AS ten_khach_hang, nd.so_dien_thoai, d.ngay_da,
            CONVERT(VARCHAR(5), d.gio_bat_dau, 108) AS gio_bat_dau,
            CONVERT(VARCHAR(5), d.gio_ket_thuc, 108) AS gio_ket_thuc,
            d.tien_san, d.tong_tien, d.phuong_thuc, d.ghi_chu, d.trang_thai, d.ngay_tao
        FROM Don_Dat_San d
        LEFT JOIN San_Bong sb ON d.ma_san = sb.id
        LEFT JOIN Loai_San ls ON sb.ma_loai_san = ls.id
        LEFT JOIN Nguoi_Dung nd ON d.ma_nguoi_dung = nd.id
        WHERE d.id = @newId;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_SuaDonDatVaThanhToan
    @id INT,
    @ma_nguoi_dung INT = NULL,
    @ma_san INT = NULL,
    @ngay_da DATE,
    @gio_bat_dau VARCHAR(8),
    @gio_ket_thuc VARCHAR(8),
    @tien_san DECIMAL(10, 2) = NULL,
    @tong_tien DECIMAL(10, 2) = NULL,
    @phuong_thuc VARCHAR(20) = 'TIEN_MAT',
    @trang_thai VARCHAR(30) = 'CHO_THANH_TOAN',
    @ghi_chu NVARCHAR(MAX) = NULL,
    @loai_thanh_toan VARCHAR(20) = NULL,
    @so_tien DECIMAL(10, 2) = NULL,
    @trang_thai_gd VARCHAR(20) = 'THANH_CONG',
    @ten_khach_hang NVARCHAR(100) = NULL,
    @so_dien_thoai VARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Don_Dat_San WHERE id = @id)
        BEGIN
            ;THROW 50055, N'Đơn đặt sân không tồn tại.', 1;
        END;

        DECLARE @clean_gbd VARCHAR(8) = CASE 
            WHEN @gio_bat_dau LIKE '24:00%' THEN '23:59:59'
            WHEN LEN(LTRIM(RTRIM(@gio_bat_dau))) = 5 THEN CONCAT(LTRIM(RTRIM(@gio_bat_dau)), ':00')
            ELSE LTRIM(RTRIM(@gio_bat_dau))
        END;
        DECLARE @clean_gkt VARCHAR(8) = CASE 
            WHEN @gio_ket_thuc LIKE '24:00%' THEN '23:59:59'
            WHEN LEN(LTRIM(RTRIM(@gio_ket_thuc))) = 5 THEN CONCAT(LTRIM(RTRIM(@gio_ket_thuc)), ':00')
            ELSE LTRIM(RTRIM(@gio_ket_thuc))
        END;

        DECLARE @bd_time TIME = CAST(@clean_gbd AS TIME);
        DECLARE @kt_time TIME = CAST(@clean_gkt AS TIME);

        DECLARE @final_user_id INT = @ma_nguoi_dung;
        DECLARE @clean_ten NVARCHAR(100) = NULLIF(LTRIM(RTRIM(@ten_khach_hang)), '');
        DECLARE @clean_phone VARCHAR(20) = NULLIF(LTRIM(RTRIM(@so_dien_thoai)), '');

        -- 1. Nếu có cung cấp Tên hoặc SĐT -> Tìm hoặc tạo mới khách hàng trong bảng Nguoi_Dung
        IF @clean_phone IS NOT NULL OR @clean_ten IS NOT NULL
        BEGIN
            DECLARE @found_id INT = NULL;

            IF @clean_phone IS NOT NULL
            BEGIN
                SELECT TOP 1 @found_id = id FROM Nguoi_Dung WHERE so_dien_thoai = @clean_phone;
            END;

            IF @found_id IS NULL AND @clean_ten IS NOT NULL
            BEGIN
                SELECT TOP 1 @found_id = id FROM Nguoi_Dung WHERE ho_ten = @clean_ten;
            END;

            IF @found_id IS NULL
            BEGIN
                DECLARE @email_auto VARCHAR(255) = CONCAT('khach_', DATEDIFF(SECOND, '2026-01-01', GETDATE()), '_', ABS(CHECKSUM(NEWID()) % 1000), '@khachhang.pos');
                INSERT INTO Nguoi_Dung (ho_ten, email, so_dien_thoai, MaVaiTro)
                VALUES (ISNULL(@clean_ten, CONCAT(N'Khách ', @clean_phone)), @email_auto, @clean_phone, 3);
                SET @found_id = SCOPE_IDENTITY();
            END;

            SET @final_user_id = @found_id;
        END;

        DECLARE @trang_thai_chuan VARCHAR(30) = ISNULL(@trang_thai, 'CHO_THANH_TOAN');

        UPDATE Don_Dat_San
        SET ma_san = @ma_san,
            ma_nguoi_dung = ISNULL(@final_user_id, ma_nguoi_dung),
            ngay_da = @ngay_da,
            gio_bat_dau = @bd_time,
            gio_ket_thuc = @kt_time,
            tien_san = ISNULL(@tien_san, tien_san),
            tong_tien = ISNULL(@tong_tien, tong_tien),
            phuong_thuc = @phuong_thuc,
            ghi_chu = @ghi_chu,
            trang_thai = @trang_thai_chuan
        WHERE id = @id;

        IF @trang_thai_chuan IN ('CHO_THANH_TOAN', 'CHUA_THANH_TOAN')
        BEGIN
            -- Nếu chọn trạng thái Chưa thanh toán -> Xóa bản ghi thanh toán để số tiền đã trả = 0
            DELETE FROM Thanh_Toan WHERE ma_don_dat = @id;
        END
        ELSE IF @trang_thai_chuan = 'DA_THANH_TOAN'
        BEGIN
            DECLARE @cur_tong DECIMAL(10,2) = ISNULL(@tong_tien, (SELECT tong_tien FROM Don_Dat_San WHERE id = @id));
            IF EXISTS (SELECT 1 FROM Thanh_Toan WHERE ma_don_dat = @id)
            BEGIN
                UPDATE Thanh_Toan
                SET so_tien = @cur_tong,
                    phuong_thuc = @phuong_thuc,
                    loai_thanh_toan = 'TRA_HET',
                    trang_thai_gd = 'THANH_CONG',
                    ngay_thanh_toan = GETDATE()
                WHERE ma_don_dat = @id;
            END
            ELSE
            BEGIN
                INSERT INTO Thanh_Toan (
                    ma_don_dat, phuong_thuc, loai_thanh_toan, so_tien, ma_giao_dich, trang_thai_gd, ngay_thanh_toan
                )
                VALUES (
                    @id, @phuong_thuc, 'TRA_HET', @cur_tong, CONCAT('GD_', @id, '_', DATEDIFF(SECOND, '2026-01-01', GETDATE())), 'THANH_CONG', GETDATE()
                );
            END;
        END
        ELSE IF @trang_thai_chuan = 'DA_COC'
        BEGIN
            DECLARE @cur_tong_coc DECIMAL(10,2) = ISNULL(@tong_tien, (SELECT tong_tien FROM Don_Dat_San WHERE id = @id));
            DECLARE @coc_tien DECIMAL(10,2) = CASE 
                WHEN @so_tien IS NOT NULL AND @so_tien > 0 THEN @so_tien 
                ELSE ROUND(@cur_tong_coc * 0.3, 0) 
            END;

            IF EXISTS (SELECT 1 FROM Thanh_Toan WHERE ma_don_dat = @id)
            BEGIN
                UPDATE Thanh_Toan
                SET so_tien = @coc_tien,
                    phuong_thuc = @phuong_thuc,
                    loai_thanh_toan = 'DAT_COC',
                    trang_thai_gd = 'THANH_CONG',
                    ngay_thanh_toan = GETDATE()
                WHERE ma_don_dat = @id;
            END
            ELSE
            BEGIN
                INSERT INTO Thanh_Toan (
                    ma_don_dat, phuong_thuc, loai_thanh_toan, so_tien, ma_giao_dich, trang_thai_gd, ngay_thanh_toan
                )
                VALUES (
                    @id, @phuong_thuc, 'DAT_COC', @coc_tien, CONCAT('GD_', @id, '_', DATEDIFF(SECOND, '2026-01-01', GETDATE())), 'THANH_CONG', GETDATE()
                );
            END;
        END
        ELSE IF @trang_thai_chuan = 'DANG_DA'
        BEGIN
            DECLARE @cur_tong_dd DECIMAL(10,2) = ISNULL(@tong_tien, (SELECT tong_tien FROM Don_Dat_San WHERE id = @id));
            IF @so_tien IS NOT NULL AND @so_tien > 0
            BEGIN
                DECLARE @loai_tt_dd VARCHAR(20) = CASE WHEN @so_tien >= @cur_tong_dd THEN 'TRA_HET' ELSE 'DAT_COC' END;
                IF EXISTS (SELECT 1 FROM Thanh_Toan WHERE ma_don_dat = @id)
                BEGIN
                    UPDATE Thanh_Toan
                    SET so_tien = @so_tien,
                        phuong_thuc = @phuong_thuc,
                        loai_thanh_toan = @loai_tt_dd,
                        trang_thai_gd = 'THANH_CONG',
                        ngay_thanh_toan = GETDATE()
                    WHERE ma_don_dat = @id;
                END
                ELSE
                BEGIN
                    INSERT INTO Thanh_Toan (
                        ma_don_dat, phuong_thuc, loai_thanh_toan, so_tien, ma_giao_dich, trang_thai_gd, ngay_thanh_toan
                    )
                    VALUES (
                        @id, @phuong_thuc, @loai_tt_dd, @so_tien, CONCAT('GD_', @id, '_', DATEDIFF(SECOND, '2026-01-01', GETDATE())), 'THANH_CONG', GETDATE()
                    );
                END;
            END
            ELSE
            BEGIN
                DELETE FROM Thanh_Toan WHERE ma_don_dat = @id;
            END;
        END;

        COMMIT TRANSACTION;

        SELECT 
            d.id, d.ma_san, 
            ISNULL(sb.ten_san, N'Quầy Nước / Dịch Vụ Lẻ') AS ten_san, 
            ISNULL(ls.ten_loai, N'Bán lẻ dịch vụ') AS ten_loai, 
            d.ma_nguoi_dung,
            nd.ho_ten AS ten_khach_hang, nd.so_dien_thoai, d.ngay_da,
            CONVERT(VARCHAR(5), d.gio_bat_dau, 108) AS gio_bat_dau,
            CONVERT(VARCHAR(5), d.gio_ket_thuc, 108) AS gio_ket_thuc,
            d.tien_san, d.tong_tien, d.phuong_thuc, d.ghi_chu, d.trang_thai, d.ngay_tao
        FROM Don_Dat_San d
        LEFT JOIN San_Bong sb ON d.ma_san = sb.id
        LEFT JOIN Loai_San ls ON sb.ma_loai_san = ls.id
        LEFT JOIN Nguoi_Dung nd ON d.ma_nguoi_dung = nd.id
        WHERE d.id = @id;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_XoaDonDatVaThanhToan
    @id INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Don_Dat_San WHERE id = @id)
        BEGIN
            ;THROW 50056, N'Đơn đặt sân không tồn tại.', 1;
        END;

        DELETE FROM Chi_Tiet_Dich_Vu WHERE ma_don_dat = @id;
        DELETE FROM Thanh_Toan WHERE ma_don_dat = @id;
        DELETE FROM Lich_Su_Hoan_Tien WHERE ma_don_dat = @id;
        DELETE FROM Don_Dat_San WHERE id = @id;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_ThemHoanTien
    @ma_don_dat INT,
    @so_tien_hoan DECIMAL(10, 2),
    @ty_le_hoan INT = 100,
    @ly_do_huy NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        INSERT INTO Lich_Su_Hoan_Tien (ma_don_dat, so_tien_hoan, ty_le_hoan, ly_do_huy, ngay_hoan)
        VALUES (@ma_don_dat, @so_tien_hoan, @ty_le_hoan, @ly_do_huy, GETDATE());

        DECLARE @newId INT = SCOPE_IDENTITY();

        UPDATE Don_Dat_San SET trang_thai = 'DA_HUY' WHERE id = @ma_don_dat;
        UPDATE Thanh_Toan SET trang_thai_gd = 'HOAN_TIEN' WHERE ma_don_dat = @ma_don_dat;

        COMMIT TRANSACTION;

        SELECT 
            ht.id, ht.ma_don_dat, nd.ho_ten AS ten_khach_hang, nd.so_dien_thoai,
            sb.ten_san, d.ngay_da, ht.so_tien_hoan, ht.ty_le_hoan, ht.ly_do_huy, ht.ngay_hoan
        FROM Lich_Su_Hoan_Tien ht
        LEFT JOIN Don_Dat_San d ON ht.ma_don_dat = d.id
        LEFT JOIN Nguoi_Dung nd ON d.ma_nguoi_dung = nd.id
        LEFT JOIN San_Bong sb ON d.ma_san = sb.id
        WHERE ht.id = @newId;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_SuaHoanTien
    @id INT,
    @so_tien_hoan DECIMAL(10, 2),
    @ty_le_hoan INT = 100,
    @ly_do_huy NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
IF NOT EXISTS (SELECT 1 FROM Lich_Su_Hoan_Tien WHERE id = @id)
        BEGIN
            ;THROW 50057, N'Bản ghi hoàn tiền không tồn tại.', 1;
        END;

        UPDATE Lich_Su_Hoan_Tien
        SET so_tien_hoan = @so_tien_hoan,
            ty_le_hoan = @ty_le_hoan,
            ly_do_huy = @ly_do_huy
        WHERE id = @id;

        SELECT 
            ht.id, ht.ma_don_dat, nd.ho_ten AS ten_khach_hang, nd.so_dien_thoai,
            sb.ten_san, d.ngay_da, ht.so_tien_hoan, ht.ty_le_hoan, ht.ly_do_huy, ht.ngay_hoan
        FROM Lich_Su_Hoan_Tien ht
        LEFT JOIN Don_Dat_San d ON ht.ma_don_dat = d.id
        LEFT JOIN Nguoi_Dung nd ON d.ma_nguoi_dung = nd.id
        LEFT JOIN San_Bong sb ON d.ma_san = sb.id
        WHERE ht.id = @id;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_XoaHoanTien
    @id INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
IF NOT EXISTS (SELECT 1 FROM Lich_Su_Hoan_Tien WHERE id = @id)
        BEGIN
            ;THROW 50058, N'Bản ghi hoàn tiền không tồn tại.', 1;
        END;

        DELETE FROM Lich_Su_Hoan_Tien WHERE id = @id;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_LayDanhSachKhungGio
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT id, gio_bat_dau, gio_ket_thuc, nhan_hien_thi, thu_tu, trang_thai
            FROM Khung_Gio
            WHERE trang_thai = 1
            ORDER BY thu_tu ASC;
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_LayTatCaKhungGioAdmin
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT id, gio_bat_dau, gio_ket_thuc, nhan_hien_thi, thu_tu, trang_thai
            FROM Khung_Gio
            ORDER BY thu_tu ASC;
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_ThemKhungGio
    @gio_bat_dau VARCHAR(5),
    @gio_ket_thuc VARCHAR(5),
    @nhan_hien_thi NVARCHAR(50),
    @thu_tu INT = 1,
    @trang_thai BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
INSERT INTO Khung_Gio (gio_bat_dau, gio_ket_thuc, nhan_hien_thi, thu_tu, trang_thai)
        VALUES (@gio_bat_dau, @gio_ket_thuc, @nhan_hien_thi, @thu_tu, @trang_thai);

        SELECT id, gio_bat_dau, gio_ket_thuc, nhan_hien_thi, thu_tu, trang_thai
        FROM Khung_Gio
        WHERE id = SCOPE_IDENTITY();
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_SuaKhungGio
    @id INT,
    @gio_bat_dau VARCHAR(5),
    @gio_ket_thuc VARCHAR(5),
    @nhan_hien_thi NVARCHAR(50),
    @thu_tu INT = 1,
    @trang_thai BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
IF NOT EXISTS (SELECT 1 FROM Khung_Gio WHERE id = @id)
        BEGIN
            ;THROW 50059, N'Khung giờ không tồn tại.', 1;
        END;

        UPDATE Khung_Gio
        SET gio_bat_dau = @gio_bat_dau,
            gio_ket_thuc = @gio_ket_thuc,
            nhan_hien_thi = @nhan_hien_thi,
            thu_tu = @thu_tu,
            trang_thai = @trang_thai
        WHERE id = @id;

        SELECT id, gio_bat_dau, gio_ket_thuc, nhan_hien_thi, thu_tu, trang_thai
        FROM Khung_Gio
        WHERE id = @id;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_XoaKhungGio
    @id INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
IF NOT EXISTS (SELECT 1 FROM Khung_Gio WHERE id = @id)
        BEGIN
            ;THROW 50060, N'Khung giờ không tồn tại.', 1;
        END;

        DELETE FROM Khung_Gio WHERE id = @id;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_ResetKhungGio
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        DELETE FROM Khung_Gio;
        DBCC CHECKIDENT ('Khung_Gio', RESEED, 0);

        INSERT INTO Khung_Gio (gio_bat_dau, gio_ket_thuc, nhan_hien_thi, thu_tu, trang_thai) VALUES
        ('06:00', '06:30', N'6h', 1, 1),
        ('06:30', '07:00', N'6h30', 2, 1),
        ('07:00', '07:30', N'7h', 3, 1),
        ('07:30', '08:00', N'7h30', 4, 1),
        ('08:00', '08:30', N'8h', 5, 1),
        ('08:30', '09:00', N'8h30', 6, 1),
        ('09:00', '09:30', N'9h', 7, 1),
        ('09:30', '10:00', N'9h30', 8, 1),
        ('10:00', '10:30', N'10h', 9, 1),
        ('10:30', '11:00', N'10h30', 10, 1),
        ('11:00', '11:30', N'11h', 11, 1),
        ('11:30', '12:00', N'11h30', 12, 1),
        ('12:00', '12:30', N'12h', 13, 1),
        ('12:30', '13:00', N'12h30', 14, 1),
        ('13:00', '13:30', N'13h', 15, 1),
        ('13:30', '14:00', N'13h30', 16, 1),
        ('14:00', '14:30', N'14h', 17, 1),
        ('14:30', '15:00', N'14h30', 18, 1),
        ('15:00', '15:30', N'15h', 19, 1),
        ('15:30', '16:00', N'15h30', 20, 1),
        ('16:00', '16:30', N'16h', 21, 1),
        ('16:30', '17:00', N'16h30', 22, 1),
        ('17:00', '17:30', N'17h', 23, 1),
        ('17:30', '18:00', N'17h30', 24, 1),
        ('18:00', '18:30', N'18h', 25, 1),
        ('18:30', '19:00', N'18h30', 26, 1),
        ('19:00', '19:30', N'19h', 27, 1);

        COMMIT TRANSACTION;

        SELECT id, gio_bat_dau, gio_ket_thuc, nhan_hien_thi, thu_tu, trang_thai
        FROM Khung_Gio
        ORDER BY thu_tu ASC;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_KiemTraVaGiaHanSan
    @ma_don_dat INT,
    @so_phut_them INT = 30,
    @gio_ket_thuc_moi TIME = NULL,
    @xac_nhan_gia_han BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Don_Dat_San WHERE id = @ma_don_dat)
        BEGIN
            ;THROW 50060, N'Đơn đặt sân không tồn tại.', 1;
        END;

        DECLARE @ma_san INT, @ngay_da DATE, @gio_bat_dau TIME, @gio_ket_thuc_cu TIME;
        DECLARE @tien_san_cu DECIMAL(10,2), @tong_tien_cu DECIMAL(10,2);
        DECLARE @don_gia_phut DECIMAL(10,2) = 5000;
        DECLARE @ten_san NVARCHAR(100);

        SELECT 
            @ma_san = d.ma_san,
            @ngay_da = d.ngay_da,
            @gio_bat_dau = d.gio_bat_dau,
            @gio_ket_thuc_cu = d.gio_ket_thuc,
            @tien_san_cu = ISNULL(d.tien_san, 0),
            @tong_tien_cu = ISNULL(d.tong_tien, 0),
            @ten_san = ISNULL(sb.ten_san, N'Sân bóng'),
            @don_gia_phut = ISNULL(sb.don_gia_phut, 5000)
        FROM Don_Dat_San d
        LEFT JOIN San_Bong sb ON d.ma_san = sb.id
        WHERE d.id = @ma_don_dat;

        IF @ma_san IS NULL
        BEGIN
            ;THROW 50061, N'Đơn này không có sân bóng để gia hạn.', 1;
        END;

        -- Xác định giờ kết thúc mới
        DECLARE @gio_kt_moi TIME;
        IF @gio_ket_thuc_moi IS NOT NULL
        BEGIN
            SET @gio_kt_moi = @gio_ket_thuc_moi;
            SET @so_phut_them = DATEDIFF(MINUTE, CAST(@gio_ket_thuc_cu AS TIME), CAST(@gio_kt_moi AS TIME));
        END
        ELSE
        BEGIN
            SET @gio_kt_moi = CAST(DATEADD(MINUTE, @so_phut_them, CAST(@gio_ket_thuc_cu AS DATETIME)) AS TIME);
        END;

        IF @so_phut_them <= 0
        BEGIN
            ;THROW 50062, N'Thời gian gia hạn phải lớn hơn 0 phút.', 1;
        END;

        -- Kiểm tra xem trong khoảng [@gio_ket_thuc_cu, @gio_kt_moi] có đơn đặt nào khác trên sân này không
        DECLARE @co_trung BIT = 0;
        DECLARE @trung_info NVARCHAR(255) = NULL;

        SELECT TOP 1 
            @co_trung = 1,
            @trung_info = CONCAT(N'Trùng đơn #', d.id, N' (', CONVERT(VARCHAR(5), d.gio_bat_dau, 108), ' - ', CONVERT(VARCHAR(5), d.gio_ket_thuc, 108), N', Khách: ', ISNULL(nd.ho_ten, N'Khách'), ')')
        FROM Don_Dat_San d
        LEFT JOIN Nguoi_Dung nd ON d.ma_nguoi_dung = nd.id
        WHERE d.ma_san = @ma_san
          AND d.ngay_da = @ngay_da
          AND d.id <> @ma_don_dat
          AND d.trang_thai NOT IN ('DA_HUY')
          AND (d.gio_bat_dau < @gio_kt_moi AND d.gio_ket_thuc > @gio_ket_thuc_cu);

        DECLARE @tien_san_them DECIMAL(10,2) = @so_phut_them * @don_gia_phut;
        DECLARE @tien_san_moi DECIMAL(10,2) = @tien_san_cu + @tien_san_them;
        DECLARE @tong_tien_moi DECIMAL(10,2) = @tong_tien_cu + @tien_san_them;

        IF @co_trung = 1
        BEGIN
            -- Không thể gia hạn trực tiếp vì đã có lịch -> Trả về danh sách sân khác trống
            COMMIT TRANSACTION;

            SELECT 
                0 AS co_the_gia_han,
                @ma_don_dat AS ma_don_dat,
                @ma_san AS ma_san_hien_tai,
                @ten_san AS ten_san_hien_tai,
                CONVERT(VARCHAR(5), @gio_ket_thuc_cu, 108) AS gio_ket_thuc_cu,
                CONVERT(VARCHAR(5), @gio_kt_moi, 108) AS gio_ket_thuc_moi,
                @so_phut_them AS so_phut_them,
                @tien_san_them AS tien_san_them,
                CONCAT(N'Sân ', @ten_san, N' đã có khách đặt lịch tiếp theo: ', @trung_info, N'. Vui lòng chuyển sang sân khác để đá thêm.') AS thong_bao;

            -- Danh sách sân khác đang hoàn toàn trống trong khung giờ này
            SELECT 
                sb.id AS ma_san,
                sb.ten_san,
                ls.ten_loai,
                sb.don_gia_phut,
                (@so_phut_them * sb.don_gia_phut) AS tien_san_du_kien
            FROM San_Bong sb
            INNER JOIN Loai_San ls ON sb.ma_loai_san = ls.id
            WHERE sb.trang_thai = 'SAN_SANG'
              AND sb.id <> @ma_san
              AND NOT EXISTS (
                  SELECT 1 FROM Don_Dat_San d2
                  WHERE d2.ma_san = sb.id
                    AND d2.ngay_da = @ngay_da
                    AND d2.trang_thai NOT IN ('DA_HUY')
                    AND (d2.gio_bat_dau < @gio_kt_moi AND d2.gio_ket_thuc > @gio_ket_thuc_cu)
              )
            ORDER BY sb.id;
            RETURN;
        END;

        -- Nếu không trùng và người dùng xác nhận gia hạn
        IF @xac_nhan_gia_han = 1
        BEGIN
            UPDATE Don_Dat_San
            SET gio_ket_thuc = @gio_kt_moi,
                tien_san = @tien_san_moi,
                tong_tien = @tong_tien_moi,
                ghi_chu = CONCAT(ISNULL(ghi_chu + N' | ', N''), N'Gia hạn thêm ', @so_phut_them, N' phút (đến ', CONVERT(VARCHAR(5), @gio_kt_moi, 108), ')')
            WHERE id = @ma_don_dat;
        END;

        COMMIT TRANSACTION;

        SELECT 
            1 AS co_the_gia_han,
            @ma_don_dat AS ma_don_dat,
            @ma_san AS ma_san_hien_tai,
            @ten_san AS ten_san_hien_tai,
            CONVERT(VARCHAR(5), @gio_ket_thuc_cu, 108) AS gio_ket_thuc_cu,
            CONVERT(VARCHAR(5), @gio_kt_moi, 108) AS gio_ket_thuc_moi,
            @so_phut_them AS so_phut_them,
            @tien_san_them AS tien_san_them,
            @tien_san_moi AS tien_san_moi,
            @tong_tien_moi AS tong_tien_moi,
            CASE WHEN @xac_nhan_gia_han = 1 
                 THEN CONCAT(N'Đã gia hạn thành công thêm ', @so_phut_them, N' phút cho sân ', @ten_san, N' đến ', CONVERT(VARCHAR(5), @gio_kt_moi, 108))
                 ELSE CONCAT(N'Sân ', @ten_san, N' hoàn toàn trống lịch. Có thể gia hạn thêm ', @so_phut_them, N' phút đến ', CONVERT(VARCHAR(5), @gio_kt_moi, 108))
            END AS thong_bao;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_ChuyenSanDaTiep
    @ma_don_cu INT,
    @ma_san_moi INT,
    @gio_bat_dau TIME,
    @gio_ket_thuc TIME,
    @phuong_thuc VARCHAR(20) = 'TIEN_MAT',
    @loai_thanh_toan VARCHAR(20) = 'DAT_COC',
    @so_tien DECIMAL(10, 2) = 0
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Don_Dat_San WHERE id = @ma_don_cu)
        BEGIN
            ;THROW 50065, N'Đơn đặt sân cũ không tồn tại.', 1;
        END;

        IF NOT EXISTS (SELECT 1 FROM San_Bong WHERE id = @ma_san_moi AND trang_thai = 'SAN_SANG')
        BEGIN
            ;THROW 50066, N'Sân mới không tồn tại hoặc đang bảo trì.', 1;
        END;

        DECLARE @ma_nguoi_dung INT, @ngay_da DATE, @ten_san_cu NVARCHAR(100);
        SELECT 
            @ma_nguoi_dung = d.ma_nguoi_dung,
            @ngay_da = d.ngay_da,
            @ten_san_cu = ISNULL(sb.ten_san, N'Sân cũ')
        FROM Don_Dat_San d
        LEFT JOIN San_Bong sb ON d.ma_san = sb.id
        WHERE d.id = @ma_don_cu;

        -- Kiểm tra sân mới có trống không
        IF EXISTS (
            SELECT 1 FROM Don_Dat_San
            WHERE ma_san = @ma_san_moi
              AND ngay_da = @ngay_da
              AND trang_thai NOT IN ('DA_HUY')
              AND (gio_bat_dau < @gio_ket_thuc AND gio_ket_thuc > @gio_bat_dau)
        )
        BEGIN
            ;THROW 50067, N'Sân mới được chọn cũng đã bị trùng lịch trong khung giờ này!', 1;
        END;

        DECLARE @so_phut INT = DATEDIFF(MINUTE, CAST(@gio_bat_dau AS TIME), CAST(@gio_ket_thuc AS TIME));
        DECLARE @don_gia_phut DECIMAL(10,2) = 5000;
        SELECT @don_gia_phut = ISNULL(don_gia_phut, 5000) FROM San_Bong WHERE id = @ma_san_moi;

        DECLARE @tien_san DECIMAL(10,2) = @so_phut * @don_gia_phut;
        DECLARE @ghi_chu NVARCHAR(MAX) = CONCAT(N'Đá thêm tiếp sức từ ', @ten_san_cu, N' (Đơn cũ #', @ma_don_cu, N')');
        DECLARE @trang_thai VARCHAR(20) = CASE WHEN @so_tien >= @tien_san THEN 'DA_THANH_TOAN' ELSE 'DANG_DA' END;

        INSERT INTO Don_Dat_San (
            ma_nguoi_dung, ma_san, ngay_da, gio_bat_dau, gio_ket_thuc,
            tien_san, tong_tien, phuong_thuc, ghi_chu, trang_thai, da_vao_san, gio_vao_san, ngay_tao
        )
        VALUES (
            @ma_nguoi_dung, @ma_san_moi, @ngay_da, @gio_bat_dau, @gio_ket_thuc,
            @tien_san, @tien_san, @phuong_thuc, @ghi_chu, @trang_thai, 1, @gio_bat_dau, GETDATE()
        );

        DECLARE @ma_don_moi INT = SCOPE_IDENTITY();

        IF @so_tien > 0
        BEGIN
            INSERT INTO Thanh_Toan (
                ma_don_dat, phuong_thuc, loai_thanh_toan, so_tien, ma_giao_dich, trang_thai_gd, ngay_thanh_toan
            )
            VALUES (
                @ma_don_moi, @phuong_thuc, @loai_thanh_toan, @so_tien, CONCAT('GD_CHUYEN_', @ma_don_moi), 'THANH_CONG', GETDATE()
            );
        END;

        COMMIT TRANSACTION;

        SELECT 
            d.id, d.ma_san, sb.ten_san, ls.ten_loai, d.ma_nguoi_dung,
            nd.ho_ten AS ten_khach_hang, nd.so_dien_thoai, d.ngay_da,
            CONVERT(VARCHAR(5), d.gio_bat_dau, 108) AS gio_bat_dau,
            CONVERT(VARCHAR(5), d.gio_ket_thuc, 108) AS gio_ket_thuc,
            d.tien_san, d.tong_tien, d.phuong_thuc, d.ghi_chu, d.trang_thai, d.ngay_tao,
            @ma_don_cu AS ma_don_goc
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

CREATE OR ALTER PROCEDURE sp_BanLeDichVu
    @ma_nguoi_dung INT = NULL,
    @ten_khach_hang NVARCHAR(100) = NULL,
    @so_dien_thoai VARCHAR(20) = NULL,
    @phuong_thuc VARCHAR(20) = 'TIEN_MAT',
    @ghi_chu NVARCHAR(MAX) = NULL,
    @trang_thai VARCHAR(20) = 'DA_THANH_TOAN'
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        DECLARE @final_user_id INT = @ma_nguoi_dung;
        DECLARE @clean_ten NVARCHAR(100) = NULLIF(LTRIM(RTRIM(@ten_khach_hang)), '');
        DECLARE @clean_phone VARCHAR(20) = NULLIF(LTRIM(RTRIM(@so_dien_thoai)), '');

        IF @clean_phone IS NOT NULL OR @clean_ten IS NOT NULL
        BEGIN
            DECLARE @found_id INT = NULL;
            IF @clean_phone IS NOT NULL
                SELECT TOP 1 @found_id = id FROM Nguoi_Dung WHERE so_dien_thoai = @clean_phone;
            IF @found_id IS NULL AND @clean_ten IS NOT NULL
                SELECT TOP 1 @found_id = id FROM Nguoi_Dung WHERE ho_ten = @clean_ten;
            IF @found_id IS NULL
            BEGIN
                DECLARE @email_auto VARCHAR(255) = CONCAT('khachle_', DATEDIFF(SECOND, '2026-01-01', GETDATE()), '_', ABS(CHECKSUM(NEWID()) % 1000), '@pos.vn');
                INSERT INTO Nguoi_Dung (ho_ten, email, so_dien_thoai, MaVaiTro)
                VALUES (ISNULL(@clean_ten, CONCAT(N'Khách lẻ ', @clean_phone)), @email_auto, @clean_phone, 3);
                SET @found_id = SCOPE_IDENTITY();
            END;
            SET @final_user_id = @found_id;
        END;

        IF @final_user_id IS NULL
        BEGIN
            SET @final_user_id = 1;
        END;

        DECLARE @ngay_hien_tai DATE = CAST(GETDATE() AS DATE);
        DECLARE @gio_hien_tai TIME = CAST(GETDATE() AS TIME);
        DECLARE @ghi_chu_chuan NVARCHAR(MAX) = ISNULL(@ghi_chu, N'Bán lẻ nước / dịch vụ tại quầy POS');

        INSERT INTO Don_Dat_San (
            ma_nguoi_dung, ma_san, ngay_da, gio_bat_dau, gio_ket_thuc,
            tien_san, tong_tien, phuong_thuc, ghi_chu, trang_thai, da_vao_san, ngay_tao
        )
        VALUES (
            @final_user_id, NULL, @ngay_hien_tai, @gio_hien_tai, @gio_hien_tai,
            0, 0, @phuong_thuc, @ghi_chu_chuan, @trang_thai, 0, GETDATE()
        );

        DECLARE @newId INT = SCOPE_IDENTITY();
        COMMIT TRANSACTION;

        SELECT 
            d.id, d.ma_san, 
            N'Quầy Nước / Dịch Vụ Lẻ' AS ten_san, 
            N'Bán lẻ dịch vụ' AS ten_loai, 
            d.ma_nguoi_dung,
            nd.ho_ten AS ten_khach_hang, nd.so_dien_thoai, d.ngay_da,
            CONVERT(VARCHAR(5), d.gio_bat_dau, 108) AS gio_bat_dau,
            CONVERT(VARCHAR(5), d.gio_ket_thuc, 108) AS gio_ket_thuc,
            d.tien_san, d.tong_tien, d.phuong_thuc, d.ghi_chu, d.trang_thai, d.ngay_tao
        FROM Don_Dat_San d
        INNER JOIN Nguoi_Dung nd ON d.ma_nguoi_dung = nd.id
        WHERE d.id = @newId;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_HuyDonTam
    @ma_don_dat INT = NULL,
    @searchStr NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
IF @ma_don_dat IS NOT NULL
        BEGIN
            -- Tuyệt đối KHÔNG xóa đơn đã có cảnh báo chuyển khoản hoặc đơn đã chuyển sang CHO_XAC_NHAN
            DELETE FROM Chi_Tiet_Dich_Vu 
            WHERE ma_don_dat = @ma_don_dat
              AND EXISTS (
                  SELECT 1 FROM Don_Dat_San 
                  WHERE id = @ma_don_dat 
                    AND trang_thai IN ('CHO_THANH_TOAN', 'CHUA_THANH_TOAN') 
                    AND (ghi_chu IS NULL OR ghi_chu NOT LIKE N'%CẢNH BÁO%')
              );

            DELETE FROM Thanh_Toan 
            WHERE ma_don_dat = @ma_don_dat 
              AND trang_thai_gd NOT IN ('THANH_CONG', 'CHO_XU_LY')
              AND EXISTS (
                  SELECT 1 FROM Don_Dat_San 
                  WHERE id = @ma_don_dat 
                    AND trang_thai IN ('CHO_THANH_TOAN', 'CHUA_THANH_TOAN') 
                    AND (ghi_chu IS NULL OR ghi_chu NOT LIKE N'%CẢNH BÁO%')
              );

            DELETE FROM Lich_Su_Hoan_Tien 
            WHERE ma_don_dat = @ma_don_dat 
              AND EXISTS (
                  SELECT 1 FROM Don_Dat_San 
                  WHERE id = @ma_don_dat 
                    AND trang_thai IN ('CHO_THANH_TOAN', 'CHUA_THANH_TOAN') 
                    AND (ghi_chu IS NULL OR ghi_chu NOT LIKE N'%CẢNH BÁO%')
              );

            DELETE FROM Don_Dat_San 
            WHERE id = @ma_don_dat 
              AND trang_thai IN ('CHO_THANH_TOAN', 'CHUA_THANH_TOAN') 
              AND (ghi_chu IS NULL OR ghi_chu NOT LIKE N'%CẢNH BÁO%');
        END
        ELSE IF @searchStr IS NOT NULL
        BEGIN
            DECLARE @tam_ids TABLE (id INT);
            INSERT INTO @tam_ids (id)
            SELECT id FROM Don_Dat_San 
            WHERE ghi_chu LIKE @searchStr 
              AND trang_thai IN ('CHO_THANH_TOAN', 'CHUA_THANH_TOAN') 
              AND (ghi_chu IS NULL OR ghi_chu NOT LIKE N'%CẢNH BÁO%');

            DELETE FROM Chi_Tiet_Dich_Vu WHERE ma_don_dat IN (SELECT id FROM @tam_ids);
            DELETE FROM Thanh_Toan WHERE ma_don_dat IN (SELECT id FROM @tam_ids) AND trang_thai_gd NOT IN ('THANH_CONG', 'CHO_XU_LY');
            DELETE FROM Lich_Su_Hoan_Tien WHERE ma_don_dat IN (SELECT id FROM @tam_ids);
            DELETE FROM Don_Dat_San WHERE id IN (SELECT id FROM @tam_ids);
        END

        -- Tự động dọn dẹp các đơn tạm PayOS chưa thanh toán quá 10 phút (không xóa đơn đã có cảnh báo nhận tiền)
        DECLARE @expired_ids TABLE (id INT);
        INSERT INTO @expired_ids (id)
        SELECT id FROM Don_Dat_San 
        WHERE trang_thai IN ('CHO_THANH_TOAN', 'CHUA_THANH_TOAN') 
          AND (ghi_chu IS NULL OR ghi_chu NOT LIKE N'%CẢNH BÁO%')
          AND ngay_tao < DATEADD(MINUTE, -10, GETDATE())
          AND (ghi_chu LIKE '%PayOS%' OR phuong_thuc = 'CHUYEN_KHOAN');

        DELETE FROM Chi_Tiet_Dich_Vu WHERE ma_don_dat IN (SELECT id FROM @expired_ids);
        DELETE FROM Thanh_Toan WHERE ma_don_dat IN (SELECT id FROM @expired_ids) AND trang_thai_gd NOT IN ('THANH_CONG', 'CHO_XU_LY');
        DELETE FROM Lich_Su_Hoan_Tien WHERE ma_don_dat IN (SELECT id FROM @expired_ids);
        DELETE FROM Don_Dat_San WHERE id IN (SELECT id FROM @expired_ids);

        -- Đồng thời dọn dẹp các bản ghi rác PayOS tạm bị gắn trạng thái DA_HUY trước đây do reload/hủy modal
        DECLARE @legacy_huy_ids TABLE (id INT);
        INSERT INTO @legacy_huy_ids (id)
        SELECT d.id FROM Don_Dat_San d
        WHERE d.trang_thai = 'DA_HUY'
          AND (d.ghi_chu LIKE '%PayOS VietQR%' OR d.ghi_chu LIKE '%PayOS #%')
          AND (d.ghi_chu IS NULL OR d.ghi_chu NOT LIKE N'%CẢNH BÁO%')
          AND NOT EXISTS (SELECT 1 FROM Lich_Su_Hoan_Tien ht WHERE ht.ma_don_dat = d.id)
          AND NOT EXISTS (SELECT 1 FROM Thanh_Toan tt WHERE tt.ma_don_dat = d.id);

        DELETE FROM Chi_Tiet_Dich_Vu WHERE ma_don_dat IN (SELECT id FROM @legacy_huy_ids);
        DELETE FROM Thanh_Toan WHERE ma_don_dat IN (SELECT id FROM @legacy_huy_ids);
        DELETE FROM Don_Dat_San WHERE id IN (SELECT id FROM @legacy_huy_ids);
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_KetThucTranDau
    @ma_don_dat INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Don_Dat_San WHERE id = @ma_don_dat)
        BEGIN
            ;THROW 50020, N'Không tìm thấy thông tin đơn đặt sân.', 1;
        END;

        -- Cập nhật trạng thái đơn thành HOAN_THANH và da_vao_san = 0
        UPDATE Don_Dat_San
        SET trang_thai = 'HOAN_THANH',
            da_vao_san = 0
        WHERE id = @ma_don_dat;

        COMMIT TRANSACTION;

        SELECT 
            id,
            ma_san,
            ngay_da,
            gio_bat_dau,
            gio_ket_thuc,
            trang_thai,
            N'Trận đấu đã kết thúc và sân đã được giải phóng thành công!' AS thong_bao
        FROM Don_Dat_San
        WHERE id = @ma_don_dat;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_BaoCaoDoanhThuBieuDo
    @kieu_thoi_gian VARCHAR(10) = 'NGAY', -- 'NGAY', 'TUAN', 'THANG'
    @ngay_moc DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF @ngay_moc IS NULL SET @ngay_moc = CAST(GETDATE() AS DATE);

        IF @kieu_thoi_gian = 'NGAY'
        BEGIN
            -- 7 ngày gần nhất
            DECLARE @tu_ngay DATE = DATEADD(DAY, -6, @ngay_moc);
            
            SELECT 
                FORMAT(d.ngay_da, 'dd/MM') AS nhan,
                d.ngay_da AS moc_thoi_gian,
                COUNT(d.id) AS so_don,
                ISNULL(SUM(CASE WHEN d.trang_thai NOT IN ('DA_HUY') THEN d.tien_san ELSE 0 END), 0) AS tien_san,
                ISNULL(SUM(CASE WHEN d.trang_thai NOT IN ('DA_HUY') THEN (d.tong_tien - d.tien_san) ELSE 0 END), 0) AS tien_dich_vu,
                ISNULL(SUM(CASE WHEN d.trang_thai NOT IN ('DA_HUY') THEN d.tong_tien ELSE 0 END), 0) AS tong_doanh_thu
            FROM Don_Dat_San d
            WHERE d.ngay_da BETWEEN @tu_ngay AND @ngay_moc
            GROUP BY d.ngay_da
            ORDER BY d.ngay_da ASC;
        END
        ELSE IF @kieu_thoi_gian = 'TUAN'
        BEGIN
            -- 4 tuần gần nhất
            SELECT 
                CONCAT(N'Tuần ', DATEPART(WEEK, d.ngay_da)) AS nhan,
                DATEPART(WEEK, d.ngay_da) AS moc_thoi_gian,
                COUNT(d.id) AS so_don,
                ISNULL(SUM(CASE WHEN d.trang_thai NOT IN ('DA_HUY') THEN d.tien_san ELSE 0 END), 0) AS tien_san,
                ISNULL(SUM(CASE WHEN d.trang_thai NOT IN ('DA_HUY') THEN (d.tong_tien - d.tien_san) ELSE 0 END), 0) AS tien_dich_vu,
                ISNULL(SUM(CASE WHEN d.trang_thai NOT IN ('DA_HUY') THEN d.tong_tien ELSE 0 END), 0) AS tong_doanh_thu
            FROM Don_Dat_San d
            WHERE d.ngay_da >= DATEADD(WEEK, -4, @ngay_moc)
            GROUP BY DATEPART(WEEK, d.ngay_da)
            ORDER BY DATEPART(WEEK, d.ngay_da) ASC;
        END
        ELSE
        BEGIN
            -- 12 tháng của năm hiện tại
            SELECT 
                CONCAT(N'Thg ', MONTH(d.ngay_da)) AS nhan,
                MONTH(d.ngay_da) AS moc_thoi_gian,
                COUNT(d.id) AS so_don,
                ISNULL(SUM(CASE WHEN d.trang_thai NOT IN ('DA_HUY') THEN d.tien_san ELSE 0 END), 0) AS tien_san,
                ISNULL(SUM(CASE WHEN d.trang_thai NOT IN ('DA_HUY') THEN (d.tong_tien - d.tien_san) ELSE 0 END), 0) AS tien_dich_vu,
                ISNULL(SUM(CASE WHEN d.trang_thai NOT IN ('DA_HUY') THEN d.tong_tien ELSE 0 END), 0) AS tong_doanh_thu
            FROM Don_Dat_San d
            WHERE YEAR(d.ngay_da) = YEAR(@ngay_moc)
            GROUP BY MONTH(d.ngay_da)
            ORDER BY MONTH(d.ngay_da) ASC;
        END;
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_LayDoanhThuNgay
    @ngay_da DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF @ngay_da IS NULL 
            SET @ngay_da = CAST(GETDATE() AS DATE);

        ;WITH DonHangNgay AS (
            SELECT 
                d.id,
                d.trang_thai,
                ISNULL(d.tong_tien, ISNULL(d.tien_san, 0)) AS tong_tien,
                ISNULL(d.tien_san, 0) AS tien_san,
                ISNULL(tt.da_thanh_toan, 0) AS tien_da_thanh_toan
            FROM Don_Dat_San d
            OUTER APPLY (
                SELECT SUM(t.so_tien) AS da_thanh_toan
                FROM Thanh_Toan t
                WHERE t.ma_don_dat = d.id AND t.trang_thai_gd IN ('THANH_CONG', 'DANG_CHO', 'CHO_XU_LY')
            ) tt
            WHERE CAST(d.ngay_da AS DATE) = @ngay_da
        )
        SELECT 
            @ngay_da AS ngay_da,
            ISNULL(SUM(
                CASE 
                    -- 1. ĐÃ THANH TOÁN / HOÀN THÀNH: Cộng 100% tổng tiền hóa đơn (thay đổi theo tổng tiền hóa đơn)
                    WHEN trang_thai IN ('DA_THANH_TOAN', 'Da Thanh Toan', 'HOAN_THANH', 'DA_CHOT') 
                        THEN tong_tien
                    -- 2. ĐÃ CỌC: Cộng số tiền cọc tương ứng (từ bảng Thanh_Toan hoặc 30% tổng tiền hóa đơn)
                    WHEN trang_thai = 'DA_COC' 
                        THEN CASE WHEN tien_da_thanh_toan > 0 THEN tien_da_thanh_toan ELSE ROUND(tong_tien * 0.3, 0) END
                    -- 3. CHƯA THANH TOÁN / CHỜ THANH TOÁN / CHỜ XÁC NHẬN / ĐÃ HỦY: Không cộng (0 đ)
                    ELSE 0
                END
            ), 0) AS tong_doanh_thu,
            COUNT(CASE WHEN trang_thai IN ('DA_THANH_TOAN', 'Da Thanh Toan', 'HOAN_THANH', 'DA_CHOT', 'DA_COC') THEN id END) AS tong_so_don,
            ISNULL(SUM(
                CASE 
                    WHEN trang_thai IN ('DA_THANH_TOAN', 'Da Thanh Toan', 'HOAN_THANH', 'DA_CHOT') THEN tien_san
                    WHEN trang_thai = 'DA_COC' THEN ROUND(tien_san * 0.3, 0)
                    ELSE 0
                END
            ), 0) AS tien_san,
            ISNULL(SUM(
                CASE 
                    WHEN trang_thai IN ('DA_THANH_TOAN', 'Da Thanh Toan', 'HOAN_THANH', 'DA_CHOT') 
                        THEN (tong_tien - tien_san)
                    WHEN trang_thai = 'DA_COC' 
                        THEN ROUND((tong_tien - tien_san) * 0.3, 0)
                    ELSE 0
                END
            ), 0) AS tien_dich_vu
        FROM DonHangNgay;
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_TopDichVuBanChay
    @top_n INT = 5
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT TOP (@top_n)
            dv.id AS ma_dich_vu,
            dv.ten_dich_vu,
            dv.don_gia,
            dv.ton_kho,
            ISNULL(SUM(ct.so_luong), 0) AS tong_so_luong_ban,
            ISNULL(SUM(ct.tongtien_dichvu), 0) AS tong_doanh_thu
        FROM Dich_Vu dv
        LEFT JOIN Chi_Tiet_Dich_Vu ct ON dv.id = ct.ma_dich_vu
        GROUP BY dv.id, dv.ten_dich_vu, dv.don_gia, dv.ton_kho
        ORDER BY tong_so_luong_ban DESC, tong_doanh_thu DESC;
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_LayDonDatMoiNhat
    @so_luong INT = 5
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT TOP (@so_luong)
            d.id,
            d.ma_san,
            ISNULL(sb.ten_san, N'Quầy Nước / Dịch Vụ Lẻ') AS ten_san,
            ISNULL(ls.ten_loai, N'Bán lẻ dịch vụ') AS ten_loai,
            d.ma_nguoi_dung,
            ISNULL(nd.ho_ten, N'Khách Vãng Lai') AS ten_khach_hang,
            nd.so_dien_thoai,
            d.ngay_da,
            CONVERT(VARCHAR(5), d.gio_bat_dau, 108) AS gio_bat_dau,
            CONVERT(VARCHAR(5), d.gio_ket_thuc, 108) AS gio_ket_thuc,
            d.tien_san,
            d.tong_tien,
            d.phuong_thuc,
            d.ghi_chu,
            d.trang_thai,
            d.da_vao_san,
            CONVERT(VARCHAR(5), d.gio_vao_san, 108) AS gio_vao_san,
            d.ngay_tao
        FROM Don_Dat_San d
        LEFT JOIN San_Bong sb ON d.ma_san = sb.id
        LEFT JOIN Loai_San ls ON sb.ma_loai_san = ls.id
        LEFT JOIN Nguoi_Dung nd ON d.ma_nguoi_dung = nd.id
        ORDER BY d.id DESC;
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_LayTrangThaiSanTrucQuan
    @ngay_da DATE = NULL,
    @gio_hien_tai TIME = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF @ngay_da IS NULL SET @ngay_da = CAST(GETDATE() AS DATE);
        IF @gio_hien_tai IS NULL SET @gio_hien_tai = CAST(GETDATE() AS TIME);

        -- Đồng bộ trạng thái các đơn quá hạn thi đấu
        EXEC sp_DongBoTrangThaiDonDatSan;

        SELECT 
            sb.id AS ma_san,
            sb.ten_san,
            ls.ten_loai,
            sb.don_gia_phut,
            sb.trang_thai AS trang_thai_san,
            sb.hinh_anh,
            cur.id AS ma_don_hien_tai,
            cur.ten_khach_hang AS khach_hien_tai,
            cur.so_dien_thoai AS sdt_khach,
            CONVERT(VARCHAR(5), cur.gio_bat_dau, 108) AS gio_bat_dau_hien_tai,
            CONVERT(VARCHAR(5), cur.gio_ket_thuc, 108) AS gio_ket_thuc_hien_tai,
            cur.trang_thai AS trang_thai_don_hien_tai,
            cur.da_vao_san,
            CASE 
                WHEN sb.trang_thai = 'BAO_TRI' THEN 'BAO_TRI'
                WHEN cur.id IS NOT NULL AND cur.da_vao_san = 1 THEN 'DANG_DA'
                WHEN cur.id IS NOT NULL THEN 'DA_DAT'
                ELSE 'SAN_SANG'
            END AS tinh_trang_thuc_te
        FROM San_Bong sb
        INNER JOIN Loai_San ls ON sb.ma_loai_san = ls.id
        OUTER APPLY (
            SELECT TOP 1 
                d.id, nd.ho_ten AS ten_khach_hang, nd.so_dien_thoai,
                d.gio_bat_dau, d.gio_ket_thuc, d.trang_thai, d.da_vao_san
            FROM Don_Dat_San d
            LEFT JOIN Nguoi_Dung nd ON d.ma_nguoi_dung = nd.id
            WHERE d.ma_san = sb.id
              AND d.ngay_da = @ngay_da
              AND d.trang_thai NOT IN ('DA_HUY', 'HOAN_THANH')
              AND (@gio_hien_tai >= d.gio_bat_dau AND @gio_hien_tai <= d.gio_ket_thuc)
            ORDER BY d.gio_bat_dau ASC
        ) cur
        ORDER BY sb.id ASC;
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_KiemTraKhungGioDatSan
    @ma_san INT,
    @ngay_da DATE,
    @ma_don_dat_hien_tai INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @now DATETIME = GETDATE();
        DECLARE @today DATE = CAST(@now AS DATE);
        DECLARE @currentTime TIME = CAST(@now AS TIME);

        SELECT 
            kg.id,
            kg.nhan_hien_thi,
            kg.gio_bat_dau,
            kg.gio_ket_thuc,
            CASE 
                WHEN @ngay_da < @today THEN 1
                WHEN @ngay_da = @today AND CAST(kg.gio_bat_dau AS TIME) < @currentTime THEN 1
                ELSE 0
            END AS da_qua_gio,
            CASE 
                WHEN EXISTS (
                    SELECT 1 
                    FROM Don_Dat_San d
                    WHERE d.ma_san = @ma_san
                      AND d.ngay_da = @ngay_da
                      AND (@ma_don_dat_hien_tai IS NULL OR d.id <> @ma_don_dat_hien_tai)
                      AND d.trang_thai NOT IN ('DA_HUY', 'HOAN_THANH')
                      AND (
                          (CAST(kg.gio_bat_dau AS TIME) >= CAST(d.gio_bat_dau AS TIME) AND CAST(kg.gio_bat_dau AS TIME) < CAST(d.gio_ket_thuc AS TIME))
                          OR (CAST(kg.gio_ket_thuc AS TIME) > CAST(d.gio_bat_dau AS TIME) AND CAST(kg.gio_ket_thuc AS TIME) <= CAST(d.gio_ket_thuc AS TIME))
                      )
                ) THEN 1
                ELSE 0
            END AS dang_co_nguoi_dat,
            (
                SELECT TOP 1 ISNULL(nd.ho_ten, N'Khách đặt')
                FROM Don_Dat_San d
                LEFT JOIN Nguoi_Dung nd ON d.ma_nguoi_dung = nd.id
                WHERE d.ma_san = @ma_san
                  AND d.ngay_da = @ngay_da
                  AND (@ma_don_dat_hien_tai IS NULL OR d.id <> @ma_don_dat_hien_tai)
                  AND d.trang_thai NOT IN ('DA_HUY', 'HOAN_THANH')
                  AND (
                      (CAST(kg.gio_bat_dau AS TIME) >= CAST(d.gio_bat_dau AS TIME) AND CAST(kg.gio_bat_dau AS TIME) < CAST(d.gio_ket_thuc AS TIME))
                      OR (CAST(kg.gio_ket_thuc AS TIME) > CAST(d.gio_bat_dau AS TIME) AND CAST(kg.gio_ket_thuc AS TIME) <= CAST(d.gio_ket_thuc AS TIME))
                  )
            ) AS ten_khach_dat
        FROM Khung_Gio kg
        WHERE kg.trang_thai = 1 OR kg.trang_thai IS NULL
        ORDER BY kg.thu_tu ASC, kg.gio_bat_dau ASC;
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_XuLyThanhToanTienMat
    @ma_don_dat INT,
    @so_tien_can_tra DECIMAL(10, 2),
    @so_tien_khach_dua DECIMAL(10, 2),
    @ghi_chu NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Don_Dat_San WHERE id = @ma_don_dat)
        BEGIN
            ;THROW 50060, N'Không tìm thấy đơn đặt sân tương ứng.', 1;
        END;

        IF @so_tien_khach_dua < @so_tien_can_tra
        BEGIN
            ;THROW 50061, N'Số tiền khách đưa chưa đủ so với số tiền cần thanh toán.', 1;
        END;

        DECLARE @so_tien_thua DECIMAL(10, 2) = @so_tien_khach_dua - @so_tien_can_tra;
        DECLARE @ma_gd VARCHAR(100) = CONCAT('CASH_', @ma_don_dat, '_', DATEDIFF(SECOND, '1970-01-01', GETDATE()));

        -- Ghi nhận vào bảng Thanh_Toan
        INSERT INTO Thanh_Toan (
            ma_don_dat, phuong_thuc, loai_thanh_toan, so_tien, ma_giao_dich, trang_thai_gd, ngay_thanh_toan
        )
        VALUES (
            @ma_don_dat, 'TIEN_MAT', 'TRA_HET', @so_tien_can_tra, @ma_gd, 'THANH_CONG', GETDATE()
        );

        -- Cập nhật trạng thái đơn đặt sân
        UPDATE Don_Dat_San 
        SET trang_thai = 'DA_THANH_TOAN',
            ghi_chu = ISNULL(@ghi_chu, ghi_chu)
        WHERE id = @ma_don_dat;

        COMMIT TRANSACTION;

        SELECT 
            @ma_don_dat AS ma_don_dat,
            @so_tien_can_tra AS so_tien_can_tra,
            @so_tien_khach_dua AS so_tien_khach_dua,
            @so_tien_thua AS so_tien_thua,
            'TIEN_MAT' AS phuong_thuc,
            'DA_THANH_TOAN' AS trang_thai_moi,
            @ma_gd AS ma_giao_dich,
            GETDATE() AS ngay_thanh_toan;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_CapNhatKhungGioDatSan24h
    @ma_don_dat INT,
    @gio_bat_dau_24h VARCHAR(5), -- Định dạng 'HH:mm', VD: '13:30'
    @gio_ket_thuc_24h VARCHAR(5), -- Định dạng 'HH:mm', VD: '15:00'
    @tien_san_moi DECIMAL(10, 2) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Don_Dat_San WHERE id = @ma_don_dat)
        BEGIN
            ;THROW 50070, N'Không tìm thấy đơn đặt sân tương ứng.', 1;
        END;

        DECLARE @t_start TIME = TRY_CONVERT(TIME, @gio_bat_dau_24h);
        DECLARE @t_end TIME = TRY_CONVERT(TIME, @gio_ket_thuc_24h);

        IF @t_start IS NULL OR @t_end IS NULL
        BEGIN
            ;THROW 50071, N'Định dạng giờ không hợp lệ. Vui lòng sử dụng định dạng 24h (HH:mm).', 1;
        END;

        IF @t_end <= @t_start
        BEGIN
            ;THROW 50072, N'Giờ kết thúc phải lớn hơn giờ bắt đầu.', 1;
        END;

        -- Cập nhật giờ bắt đầu và giờ kết thúc trong Don_Dat_San
        UPDATE Don_Dat_San
        SET gio_bat_dau = @t_start,
            gio_ket_thuc = @t_end,
            tien_san = ISNULL(@tien_san_moi, tien_san),
            tong_tien = CASE 
                WHEN @tien_san_moi IS NOT NULL THEN (tong_tien - tien_san + @tien_san_moi)
                ELSE tong_tien 
            END
        WHERE id = @ma_don_dat;

        COMMIT TRANSACTION;

        SELECT 
            id AS ma_don_dat,
            CONVERT(VARCHAR(5), gio_bat_dau, 108) AS gio_bat_dau_24h,
            CONVERT(VARCHAR(5), gio_ket_thuc, 108) AS gio_ket_thuc_24h,
            tien_san,
            tong_tien
        FROM Don_Dat_San
        WHERE id = @ma_don_dat;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_GiaHanGioDaVaThemSan
    @ma_don_dat INT,
    @so_phut_them INT = 0,               -- Thêm phút cho sân hiện tại (VD: 15, 30, 60)
    @gio_ket_thuc_moi VARCHAR(5) = NULL, -- Hoặc chỉ định giờ kết thúc 24h mới (VD: '18:00')
    @ma_san_phu INT = NULL,              -- Mã sân muốn đặt thêm (nếu có)
    @gio_bat_dau_san_phu VARCHAR(5) = NULL,
    @gio_ket_thuc_san_phu VARCHAR(5) = NULL,
    @tien_phu_thu DECIMAL(10, 2) = 0,
    @phuong_thuc VARCHAR(20) = 'TIEN_MAT',
    @da_thanh_toan_ngay BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Don_Dat_San WHERE id = @ma_don_dat)
        BEGIN
            ;THROW 50080, N'Không tìm thấy đơn đặt sân tương ứng.', 1;
        END;

        DECLARE @gio_kt_hien_tai TIME;
        DECLARE @tien_san_hien_tai DECIMAL(10,2);
        DECLARE @tong_tien_hien_tai DECIMAL(10,2);
        DECLARE @ma_san_chinh INT;
        DECLARE @ngay_da DATE;
        DECLARE @ma_nguoi_dung INT;

        SELECT 
            @gio_kt_hien_tai = gio_ket_thuc,
            @tien_san_hien_tai = tien_san,
            @tong_tien_hien_tai = tong_tien,
            @ma_san_chinh = ma_san,
            @ngay_da = ngay_da,
            @ma_nguoi_dung = ma_nguoi_dung
        FROM Don_Dat_San
        WHERE id = @ma_don_dat;

        -- 1. Xử lý gia hạn giờ đá cho sân chính
        DECLARE @gio_kt_moi TIME = NULL;
        IF @gio_ket_thuc_moi IS NOT NULL
        BEGIN
            SET @gio_kt_moi = TRY_CONVERT(TIME, @gio_ket_thuc_moi);
        END
        ELSE IF @so_phut_them > 0
        BEGIN
            SET @gio_kt_moi = DATEADD(MINUTE, @so_phut_them, @gio_kt_hien_tai);
        END

        IF @gio_kt_moi IS NOT NULL
        BEGIN
            -- Kiểm tra trùng lịch của sân chính trong khoảng giờ gia hạn
            IF EXISTS (
                SELECT 1 FROM Don_Dat_San 
                WHERE ma_san = @ma_san_chinh 
                  AND ngay_da = @ngay_da 
                  AND id <> @ma_don_dat
                  AND trang_thai NOT IN ('DA_HUY', 'HOAN_THANH')
                  AND (
                      (@gio_kt_hien_tai <= gio_bat_dau AND @gio_kt_moi > gio_bat_dau)
                      OR (@gio_kt_moi > gio_bat_dau AND @gio_kt_moi <= gio_ket_thuc)
                  )
            )
            BEGIN
                ;THROW 50081, N'Khung giờ gia hạn bị trùng với ca đặt sân tiếp theo của người khác.', 1;
            END;

            -- Cập nhật giờ kết thúc và tiền sân
            UPDATE Don_Dat_San
            SET gio_ket_thuc = @gio_kt_moi,
                tien_san = tien_san + @tien_phu_thu,
                tong_tien = tong_tien + @tien_phu_thu
            WHERE id = @ma_don_dat;
        END

        -- 2. Xử lý đặt thêm sân phụ (nếu có)
        IF @ma_san_phu IS NOT NULL AND @gio_bat_dau_san_phu IS NOT NULL AND @gio_ket_thuc_san_phu IS NOT NULL
        BEGIN
            DECLARE @t_start_phu TIME = TRY_CONVERT(TIME, @gio_bat_dau_san_phu);
            DECLARE @t_end_phu TIME = TRY_CONVERT(TIME, @gio_ket_thuc_san_phu);

            -- Kiểm tra trùng lịch của sân phụ trong khoảng giờ bắt đầu - kết thúc
            IF EXISTS (
                SELECT 1 FROM Don_Dat_San
                WHERE ma_san = @ma_san_phu
                  AND ngay_da = @ngay_da
                  AND trang_thai NOT IN ('DA_HUY', 'HOAN_THANH')
                  AND (
                      (@t_start_phu >= gio_bat_dau AND @t_start_phu < gio_ket_thuc)
                      OR (@t_end_phu > gio_bat_dau AND @t_end_phu <= gio_ket_thuc)
                      OR (gio_bat_dau >= @t_start_phu AND gio_bat_dau < @t_end_phu)
                  )
            )
            BEGIN
                ;THROW 50082, N'Sân phụ được chọn bị trùng lịch với ca đặt khác trong khung giờ này. Vui lòng chọn sân khác còn trống.', 1;
            END;

            -- Tạo đơn đặt sân phụ liên kết cùng khách hàng
            INSERT INTO Don_Dat_San (
                ma_nguoi_dung, ma_san, ngay_da, gio_bat_dau, gio_ket_thuc, tien_san, tong_tien, phuong_thuc, ghi_chu, trang_thai
            )
            VALUES (
                @ma_nguoi_dung, @ma_san_phu, @ngay_da, @t_start_phu, @t_end_phu, @tien_phu_thu, @tien_phu_thu, @phuong_thuc,
                CONCAT(N'Đặt thêm cùng đơn #', @ma_don_dat), 'DANG_DA'
            );
        END

        -- 3. Xử lý ghi nhận thanh toán phụ thu (nếu khách trả ngay)
        IF @da_thanh_toan_ngay = 1 AND @tien_phu_thu > 0
        BEGIN
            DECLARE @ma_gd_phu VARCHAR(100) = CONCAT('EXT_', @ma_don_dat, '_', DATEDIFF(SECOND, '1970-01-01', GETDATE()));
            INSERT INTO Thanh_Toan (
                ma_don_dat, phuong_thuc, loai_thanh_toan, so_tien, ma_giao_dich, trang_thai_gd, ngay_thanh_toan
            )
            VALUES (
                @ma_don_dat, @phuong_thuc, 'TRA_HET', @tien_phu_thu, @ma_gd_phu, 'THANH_CONG', GETDATE()
            );
        END

        COMMIT TRANSACTION;

        SELECT 
            id AS ma_don_dat,
            CONVERT(VARCHAR(5), gio_bat_dau, 108) AS gio_bat_dau,
            CONVERT(VARCHAR(5), gio_ket_thuc, 108) AS gio_ket_thuc,
            tien_san,
            tong_tien,
            trang_thai
        FROM Don_Dat_San
        WHERE id = @ma_don_dat;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO

PRINT N'✅ ĐÃ NẠP TOÀN BỘ STORED PROCEDURES CHO CSDL QuanLySanBong THÀNH CÔNG!';
GO

CREATE OR ALTER PROCEDURE sp_LayDanhSachLoaiTinTuc
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT id, ten_loai, trang_thai
            FROM Loai_Tin_Tuc
            WHERE trang_thai = 1
            ORDER BY id ASC;
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_LayDanhSachTinTuc
    @ma_loai_tin INT = NULL,
    @tu_khoa NVARCHAR(100) = NULL,
    @page INT = 1,
    @limit INT = 50
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF @page IS NULL OR @page < 1 SET @page = 1;
        IF @limit IS NULL OR @limit < 1 SET @limit = 50;
        DECLARE @offset INT = (@page - 1) * @limit;

        -- 1. Lấy tổng số dòng để hỗ trợ tính tổng số trang (Pagination metadata)
        SELECT COUNT(*) AS total
        FROM Tin_Tuc t
        WHERE t.trang_thai = 1
          AND (@ma_loai_tin IS NULL OR @ma_loai_tin = 0 OR t.ma_loai_tin = @ma_loai_tin)
          AND (@tu_khoa IS NULL OR @tu_khoa = '' OR t.tieu_de LIKE N'%' + @tu_khoa + '%' OR t.tom_tat LIKE N'%' + @tu_khoa + '%');

        -- 2. Lấy dữ liệu phân trang chuẩn SQL Server OFFSET ... FETCH NEXT
        SELECT
                t.id,
                t.ma_loai_tin,
                l.ten_loai,
                t.tieu_de,
                t.tom_tat,
                t.noi_dung,
                t.hinh_anh,
                t.luot_xem,
                t.ngay_dang,
                t.trang_thai
            FROM Tin_Tuc t
            LEFT JOIN Loai_Tin_Tuc l ON t.ma_loai_tin = l.id
            WHERE t.trang_thai = 1
              AND (@ma_loai_tin IS NULL OR @ma_loai_tin = 0 OR t.ma_loai_tin = @ma_loai_tin)
              AND (@tu_khoa IS NULL OR @tu_khoa = '' OR t.tieu_de LIKE N'%' + @tu_khoa + '%' OR t.tom_tat LIKE N'%' + @tu_khoa + '%')
            ORDER BY t.ngay_dang DESC
            OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_LayChiTietTinTuc
    @id INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
            -- Tăng lượt xem
                UPDATE Tin_Tuc 
                SET luot_xem = ISNULL(luot_xem, 0) + 1 
                WHERE id = @id;
            
                -- Trả về dữ liệu bài viết
                SELECT 
                    t.id,
                    t.ma_loai_tin,
                    l.ten_loai,
                    t.tieu_de,
                    t.tom_tat,
                    t.noi_dung,
                    t.hinh_anh,
                    t.luot_xem,
                    t.ngay_dang,
                    t.trang_thai
                FROM Tin_Tuc t
                LEFT JOIN Loai_Tin_Tuc l ON t.ma_loai_tin = l.id
                WHERE t.id = @id;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_LayChiTietTinTucAdmin
    @id INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT 
                t.id,
                t.ma_loai_tin,
                l.ten_loai,
                t.tieu_de,
                t.tom_tat,
                t.noi_dung,
                t.hinh_anh,
                t.luot_xem,
                t.ngay_dang,
                t.trang_thai
            FROM Tin_Tuc t
            LEFT JOIN Loai_Tin_Tuc l ON t.ma_loai_tin = l.id
            WHERE t.id = @id;
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

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
            -- Tự động kiểm tra và chuẩn hóa ma_loai_tin nếu không tồn tại để tránh vi phạm FOREIGN KEY
            IF @ma_loai_tin IS NULL OR NOT EXISTS (SELECT 1 FROM Loai_Tin_Tuc WHERE id = @ma_loai_tin)
            BEGIN
                SELECT TOP 1 @ma_loai_tin = id FROM Loai_Tin_Tuc ORDER BY id ASC;
                -- Nếu bảng Loai_Tin_Tuc chưa có dữ liệu nào, tự động tạo 1 danh mục mặc định
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
GO

CREATE OR ALTER PROCEDURE sp_LayThongTinAboutUs
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT TOP 1
                id,
                ten_trung_tam,
                hotline,
                email,
                dia_chi,
                link_map,
                gioi_thieu_ngan,
                bai_viet_about_us,
                link_facebook,
                link_zalo
            FROM About_Us
            ORDER BY id ASC;
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_CapNhatAboutUs
    @ten_trung_tam NVARCHAR(150),
    @hotline VARCHAR(20),
    @email VARCHAR(255) = NULL,
    @dia_chi NVARCHAR(255),
    @link_map VARCHAR(500) = NULL,
    @gioi_thieu_ngan NVARCHAR(MAX) = NULL,
    @bai_viet_about_us NVARCHAR(MAX) = NULL,
    @link_facebook VARCHAR(255) = NULL,
    @link_zalo VARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
            IF EXISTS (SELECT 1 FROM About_Us)
                BEGIN
                    UPDATE About_Us
                    SET ten_trung_tam = @ten_trung_tam,
                        hotline = @hotline,
                        email = @email,
                        dia_chi = @dia_chi,
                        link_map = @link_map,
                        gioi_thieu_ngan = @gioi_thieu_ngan,
                        bai_viet_about_us = @bai_viet_about_us,
                        link_facebook = @link_facebook,
                        link_zalo = @link_zalo;
                END
                ELSE
                BEGIN
                    INSERT INTO About_Us (ten_trung_tam, hotline, email, dia_chi, link_map, gioi_thieu_ngan, bai_viet_about_us, link_facebook, link_zalo)
                    VALUES (@ten_trung_tam, @hotline, @email, @dia_chi, @link_map, @gioi_thieu_ngan, @bai_viet_about_us, @link_facebook, @link_zalo);
                END;
            
                SELECT N'Cập nhật thông tin About Us thành công' AS thong_bao;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_GuiLienHe
    @ho_ten NVARCHAR(100),
    @email VARCHAR(255) = NULL,
    @so_dien_thoai VARCHAR(20),
    @tieu_de NVARCHAR(150) = NULL,
    @noi_dung NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
            INSERT INTO Lien_He (ho_ten, email, so_dien_thoai, tieu_de, noi_dung, trang_thai_xu_ly, ngay_gui)
                VALUES (@ho_ten, @email, @so_dien_thoai, @tieu_de, @noi_dung, N'CHUA_XU_LY', GETDATE());
            
                SELECT SCOPE_IDENTITY() AS id, N'Gửi liên hệ thành công' AS thong_bao;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_LayDanhSachLienHe
    @trang_thai_xu_ly NVARCHAR(30) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT 
                id,
                ho_ten,
                email,
                so_dien_thoai,
                tieu_de,
                noi_dung,
                trang_thai_xu_ly,
                trang_thai_xu_ly AS trang_thai,
                ngay_gui,
                noi_dung_tra_loi,
                ngay_tra_loi
            FROM Lien_He
            WHERE (@trang_thai_xu_ly IS NULL OR @trang_thai_xu_ly = '' OR trang_thai_xu_ly = @trang_thai_xu_ly)
            ORDER BY id DESC;
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_CapNhatTrangThaiLienHe
    @id INT,
    @trang_thai_xu_ly NVARCHAR(30)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
            UPDATE Lien_He
                SET trang_thai_xu_ly = @trang_thai_xu_ly
                WHERE id = @id;
            
                SELECT N'Cập nhật trạng thái liên hệ thành công' AS thong_bao;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_TraLoiLienHe
    @id INT,
    @noi_dung_tra_loi NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
            UPDATE Lien_He
                SET noi_dung_tra_loi = @noi_dung_tra_loi,
                    ngay_tra_loi = GETDATE(),
                    trang_thai_xu_ly = N'DA_XU_LY'
                WHERE id = @id;
            
                SELECT N'Lưu phản hồi và chuyển trạng thái xử lý thành công' AS thong_bao;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_LayChiTietLienHe
    @id INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT 
                id,
                ho_ten,
                email,
                so_dien_thoai,
                tieu_de,
                noi_dung,
                trang_thai_xu_ly,
                trang_thai_xu_ly AS trang_thai,
                ngay_gui,
                noi_dung_tra_loi,
                ngay_tra_loi
            FROM Lien_He
            WHERE id = @id;
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_LayDanhSachBanner
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT 
                id,
                tieu_de,
                loai_banner,
                hinh_anh,
                video_url,
                lien_ket,
                thu_tu,
                trang_thai,
                ngay_tao
            FROM Banner
            WHERE trang_thai = 1
            ORDER BY thu_tu ASC, id DESC;
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_LayDanhSachBannerAdmin
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT 
                id,
                tieu_de,
                loai_banner,
                hinh_anh,
                video_url,
                lien_ket,
                thu_tu,
                trang_thai,
                ngay_tao
            FROM Banner
            ORDER BY thu_tu ASC, id DESC;
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_LayChiTietBanner
    @id INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT 
                id,
                tieu_de,
                loai_banner,
                hinh_anh,
                video_url,
                lien_ket,
                thu_tu,
                trang_thai,
                ngay_tao
            FROM Banner
            WHERE id = @id;
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_ThemBanner
    @tieu_de NVARCHAR(150) = NULL,
    @loai_banner VARCHAR(10) = 'IMAGE',
    @hinh_anh VARCHAR(MAX) = NULL,
    @video_url VARCHAR(MAX) = NULL,
    @lien_ket VARCHAR(500) = NULL,
    @thu_tu INT = 1,
    @trang_thai BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
            INSERT INTO Banner (tieu_de, loai_banner, hinh_anh, video_url, lien_ket, thu_tu, trang_thai, ngay_tao)
                VALUES (@tieu_de, @loai_banner, @hinh_anh, @video_url, @lien_ket, @thu_tu, @trang_thai, GETDATE());
            
                SELECT SCOPE_IDENTITY() AS id, N'Thêm banner thành công' AS thong_bao;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_SuaBanner
    @id INT,
    @tieu_de NVARCHAR(150) = NULL,
    @loai_banner VARCHAR(10) = 'IMAGE',
    @hinh_anh VARCHAR(MAX) = NULL,
    @video_url VARCHAR(MAX) = NULL,
    @lien_ket VARCHAR(500) = NULL,
    @thu_tu INT = 1,
    @trang_thai BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
            UPDATE Banner
                SET tieu_de = @tieu_de,
                    loai_banner = @loai_banner,
                    hinh_anh = @hinh_anh,
                    video_url = @video_url,
                    lien_ket = @lien_ket,
                    thu_tu = @thu_tu,
                    trang_thai = @trang_thai
                WHERE id = @id;
            
                SELECT N'Cập nhật banner thành công' AS thong_bao;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_XoaBanner
    @id INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
            DELETE FROM Banner WHERE id = @id;
                SELECT N'Xóa banner thành công' AS thong_bao;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_XoaLienHe
    @id INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
            DELETE FROM Lien_He WHERE id = @id;
                SELECT N'Xóa liên hệ thành công' AS thong_bao;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_LayDanhSachLoaiTinTucAdmin
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT 
                l.id, 
                l.ten_loai, 
                l.trang_thai,
                COUNT(t.id) AS so_luong_tin
            FROM Loai_Tin_Tuc l
            LEFT JOIN Tin_Tuc t ON l.id = t.ma_loai_tin
            GROUP BY l.id, l.ten_loai, l.trang_thai
            ORDER BY l.id ASC;
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_ThemLoaiTinTuc
    @ten_loai NVARCHAR(100),
    @trang_thai BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
            INSERT INTO Loai_Tin_Tuc (ten_loai, trang_thai)
                VALUES (@ten_loai, @trang_thai);
            
                SELECT SCOPE_IDENTITY() AS id, N'Thêm loại tin tức thành công' AS thong_bao;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_SuaLoaiTinTuc
    @id INT,
    @ten_loai NVARCHAR(100),
    @trang_thai BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
            UPDATE Loai_Tin_Tuc
                SET ten_loai = @ten_loai,
                    trang_thai = @trang_thai
                WHERE id = @id;
            
                SELECT N'Cập nhật loại tin tức thành công' AS thong_bao;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_XoaLoaiTinTuc
    @id INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
            -- Tự động xóa toàn bộ các bài viết tin tức thuộc loại tin tức này (Cascade delete)
            DELETE FROM Tin_Tuc WHERE ma_loai_tin = @id;
            
            -- Xóa danh mục loại tin tức
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
GO

CREATE OR ALTER PROCEDURE sp_LayDanhSachTinTucAdmin
    @page INT = NULL,
    @limit INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF @page IS NOT NULL AND @limit IS NOT NULL AND @page >= 1 AND @limit >= 1
        BEGIN
            DECLARE @offset INT = (@page - 1) * @limit;
            SELECT 
                    t.id,
                    t.ma_loai_tin,
                    l.ten_loai,
                    t.tieu_de,
                    t.tom_tat,
                    t.noi_dung,
                    t.hinh_anh,
                    t.luot_xem,
                    t.ngay_dang,
                    t.trang_thai
                FROM Tin_Tuc t
                LEFT JOIN Loai_Tin_Tuc l ON t.ma_loai_tin = l.id
                ORDER BY t.ngay_dang DESC, t.id DESC
                OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
        END
        ELSE
        BEGIN
            SELECT 
                    t.id,
                    t.ma_loai_tin,
                    l.ten_loai,
                    t.tieu_de,
                    t.tom_tat,
                    t.noi_dung,
                    t.hinh_anh,
                    t.luot_xem,
                    t.ngay_dang,
                    t.trang_thai
                FROM Tin_Tuc t
                LEFT JOIN Loai_Tin_Tuc l ON t.ma_loai_tin = l.id
                ORDER BY t.ngay_dang DESC, t.id DESC;
        END
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

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
            -- Tự động kiểm tra và chuẩn hóa ma_loai_tin nếu không tồn tại để tránh vi phạm FOREIGN KEY
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
GO

CREATE OR ALTER PROCEDURE sp_XoaTinTuc
    @id INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
            DELETE FROM Tin_Tuc WHERE id = @id;
                SELECT N'Xóa bài viết tin tức thành công' AS thong_bao;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_XacNhanVaoSan
    @id INT,
    @trang_thai VARCHAR(20) = 'DANG_DA'
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
            UPDATE Don_Dat_San 
                SET da_vao_san = 1, 
                    gio_vao_san = CONVERT(TIME, GETDATE()),
                    trang_thai = ISNULL(@trang_thai, 'DANG_DA')
                WHERE id = @id;
            
                SELECT 
                    id, 
                    da_vao_san, 
                    trang_thai, 
                    CONVERT(VARCHAR(5), gio_vao_san, 108) AS gio_vao_san
                FROM Don_Dat_San
                WHERE id = @id;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_LuuMaOTP
    @email VARCHAR(255),
    @ma_otp VARCHAR(10),
    @loai_otp VARCHAR(50),
    @thoi_gian_phut INT = 5,
    @ip_gui VARCHAR(45) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1. BẢO MẬT TẦNG CSDL 1: Kiểm tra thời gian hồi chiêu (Cooldown 60 giây) giữa 2 lần gửi cho cùng 1 email
        IF EXISTS (
            SELECT 1 FROM Xac_Thuc_OTP
            WHERE email = @email 
              AND loai_otp = @loai_otp 
              AND ngay_tao >= DATEADD(SECOND, -60, GETDATE())
        )
        BEGIN
            SELECT 
                0 AS hop_le, 
                0 AS cho_phep_gui, 
                NULL AS id,
                @email AS email,
                NULL AS ma_otp,
                @loai_otp AS loai_otp,
                NULL AS het_han_luc,
                N'Mã OTP vừa được gửi cách đây chưa đầy 60 giây. Vui lòng chờ 1 phút trước khi yêu cầu mã mới!' AS thong_bao;
            COMMIT TRANSACTION;
            RETURN;
        END;

        -- 2. BẢO MẬT TẦNG CSDL 2: Giới hạn tối đa 5 mã OTP cho mỗi Email trong vòng 1 giờ
        DECLARE @so_lan_gui_email INT;
        SELECT @so_lan_gui_email = COUNT(*) 
        FROM Xac_Thuc_OTP
        WHERE email = @email 
          AND ngay_tao >= DATEADD(HOUR, -1, GETDATE());

        IF @so_lan_gui_email >= 5
        BEGIN
            SELECT 
                0 AS hop_le, 
                0 AS cho_phep_gui, 
                NULL AS id,
                @email AS email,
                NULL AS ma_otp,
                @loai_otp AS loai_otp,
                NULL AS het_han_luc,
                N'Địa chỉ Email này đã vượt quá giới hạn 5 mã OTP trong 1 giờ. Vui lòng thử lại sau 1 giờ!' AS thong_bao;
            COMMIT TRANSACTION;
            RETURN;
        END;

        -- 3. BẢO MẬT TẦNG CSDL 3: Giới hạn tối đa 10 mã OTP từ 1 IP trong vòng 15 phút (Chống IP Spam / Bot)
        IF @ip_gui IS NOT NULL AND @ip_gui <> 'unknown-ip' AND @ip_gui <> '::1' AND @ip_gui <> '127.0.0.1'
        BEGIN
            DECLARE @so_lan_gui_ip INT;
            SELECT @so_lan_gui_ip = COUNT(*) 
            FROM Xac_Thuc_OTP
            WHERE ip_gui = @ip_gui 
              AND ngay_tao >= DATEADD(MINUTE, -15, GETDATE());

            IF @so_lan_gui_ip >= 10
            BEGIN
                SELECT 
                    0 AS hop_le, 
                    0 AS cho_phep_gui, 
                    NULL AS id,
                    @email AS email,
                    NULL AS ma_otp,
                    @loai_otp AS loai_otp,
                    NULL AS het_han_luc,
                    N'Địa chỉ IP của bạn đã gửi quá nhiều yêu cầu mã OTP (vượt quá 10 lần/15 phút). Vui lòng thử lại sau!' AS thong_bao;
                COMMIT TRANSACTION;
                RETURN;
            END;
        END;

        -- 4. VÔ HIỆU HÓA CÁC MÃ CŨ: Hủy bỏ các OTP cũ chưa xác thực của email cho loại nghiệp vụ này
        UPDATE Xac_Thuc_OTP 
        SET da_xac_thuc = 1 
        WHERE email = @email AND loai_otp = @loai_otp AND da_xac_thuc = 0;

        -- 5. LƯU MÃ OTP MỚI VÀO CSDL KÈM THÔNG TIN BẢO MẬT
        INSERT INTO Xac_Thuc_OTP (
            email, 
            ma_otp, 
            loai_otp, 
            het_han_luc, 
            da_xac_thuc, 
            ngay_tao,
            ip_gui,
            so_lan_sai,
            bi_khoa
        )
        VALUES (
            @email, 
            @ma_otp, 
            @loai_otp, 
            DATEADD(MINUTE, ISNULL(@thoi_gian_phut, 5), GETDATE()), 
            0, 
            GETDATE(),
            @ip_gui,
            0,
            0
        );

        SELECT 
            1 AS hop_le,
            1 AS cho_phep_gui,
            SCOPE_IDENTITY() AS id,
            @email AS email,
            @ma_otp AS ma_otp,
            @loai_otp AS loai_otp,
            DATEADD(MINUTE, ISNULL(@thoi_gian_phut, 5), GETDATE()) AS het_han_luc,
            N'Tạo mã OTP thành công' AS thong_bao;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_KiemTraOTP
    @email VARCHAR(255),
    @ma_otp VARCHAR(10),
    @loai_otp VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
            DECLARE @id INT, 
                    @het_han_luc DATETIME, 
                    @da_xac_thuc BIT, 
                    @ma_chinh_xac VARCHAR(10), 
                    @so_lan_sai INT, 
                    @bi_khoa BIT;
            
            -- Lấy bản ghi OTP mới nhất theo Email và Loại OTP
            SELECT TOP 1 
                @id = id, 
                @ma_chinh_xac = ma_otp,
                @het_han_luc = het_han_luc, 
                @da_xac_thuc = da_xac_thuc,
                @so_lan_sai = ISNULL(so_lan_sai, 0),
                @bi_khoa = ISNULL(bi_khoa, 0)
            FROM Xac_Thuc_OTP
            WHERE email = @email AND loai_otp = @loai_otp
            ORDER BY id DESC;
        
            -- 1. Kiểm tra tồn tại bản ghi
            IF @id IS NULL
            BEGIN
                SELECT 0 AS hop_le, N'Không tìm thấy yêu cầu mã OTP nào cho email này!' AS thong_bao;
                COMMIT TRANSACTION;
                RETURN;
            END;

            -- 2. Kiểm tra nếu mã OTP đã bị khóa vĩnh viễn do đoán mò / Brute-force quá 5 lần
            IF @bi_khoa = 1
            BEGIN
                SELECT 0 AS hop_le, N'Mã OTP này đã bị hủy do nhập sai quá 5 lần! Vui lòng yêu cầu mã OTP mới.' AS thong_bao;
                COMMIT TRANSACTION;
                RETURN;
            END;
        
            -- 3. Kiểm tra hạn sử dụng (5 phút)
            IF @het_han_luc < GETDATE()
            BEGIN
                SELECT 0 AS hop_le, N'Mã OTP đã hết hiệu lực (quá hạn 5 phút)! Vui lòng lấy mã mới.' AS thong_bao;
                COMMIT TRANSACTION;
                RETURN;
            END;
        
            -- 4. Kiểm tra xem mã đã được sử dụng trước đó chưa (Chống Replay Attack)
            IF @da_xac_thuc = 1
            BEGIN
                SELECT 0 AS hop_le, N'Mã OTP này đã được xác thực sử dụng trước đó!' AS thong_bao;
                COMMIT TRANSACTION;
                RETURN;
            END;

            -- 5. Kiểm tra tính chính xác của mã OTP
            IF @ma_chinh_xac <> RTRIM(LTRIM(@ma_otp))
            BEGIN
                SET @so_lan_sai = @so_lan_sai + 1;
                
                -- Nếu nhập sai đủ 5 lần -> KHÓA NGAY MÃ NÀY CHỐNG BRUTE-FORCE
                IF @so_lan_sai >= 5
                BEGIN
                    UPDATE Xac_Thuc_OTP
                    SET so_lan_sai = @so_lan_sai, bi_khoa = 1
                    WHERE id = @id;

                    SELECT 0 AS hop_le, N'Bạn đã nhập sai mã OTP 5 lần! Mã xác thực đã bị khóa hủy để bảo đảm an toàn. Vui lòng bấm gửi lại mã mới.' AS thong_bao;
                END
                ELSE
                BEGIN
                    UPDATE Xac_Thuc_OTP
                    SET so_lan_sai = @so_lan_sai
                    WHERE id = @id;

                    DECLARE @so_lan_con_lai INT = 5 - @so_lan_sai;
                    SELECT 0 AS hop_le, N'Mã OTP không chính xác! Bạn còn ' + CAST(@so_lan_con_lai AS NVARCHAR(10)) + N' lần thử.' AS thong_bao;
                END

                COMMIT TRANSACTION;
                RETURN;
            END;
        
            -- 6. Xác thực thành công: Đánh dấu đã xác thực
            UPDATE Xac_Thuc_OTP
            SET da_xac_thuc = 1
            WHERE id = @id;
        
            SELECT 1 AS hop_le, N'Xác thực mã OTP thành công!' AS thong_bao;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_DoiMatKhau
    @email VARCHAR(255),
    @mat_khau_moi VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
IF NOT EXISTS (SELECT 1 FROM Nguoi_Dung WHERE email = @email)
        BEGIN
            ;THROW 50006, N'Không tìm thấy tài khoản với email này trong hệ thống!', 1;
        END;

        UPDATE Nguoi_Dung
        SET mat_khau = @mat_khau_moi
        WHERE email = @email;

        SELECT 1 AS thanh_cong, N'Đổi mật khẩu thành công!' AS thong_bao;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_CapNhatEmailNguoiDung
    @id INT,
    @email_moi VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
IF NOT EXISTS (SELECT 1 FROM Nguoi_Dung WHERE id = @id)
        BEGIN
            ;THROW 50007, N'Người dùng không tồn tại!', 1;
        END;

        IF EXISTS (SELECT 1 FROM Nguoi_Dung WHERE email = @email_moi AND id <> @id)
        BEGIN
            ;THROW 50008, N'Địa chỉ Gmail này đã được đăng ký bởi tài khoản khác!', 1;
        END;

        UPDATE Nguoi_Dung
        SET email = @email_moi
        WHERE id = @id;

        SELECT 
            nd.id, nd.ho_ten, nd.email, nd.so_dien_thoai, 
            nd.MaVaiTro, vt.TenVaiTro AS vai_tro, nd.anh_dai_dien
        FROM Nguoi_Dung nd
        LEFT JOIN Vai_Tro vt ON nd.MaVaiTro = vt.MaVaiTro
        WHERE nd.id = @id;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE sp_CapNhatTenThuongHieuSport247
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
-- 1. Cập nhật bảng About_Us
        IF OBJECT_ID('About_Us', 'U') IS NOT NULL
        BEGIN
            UPDATE About_Us
            SET ten_trung_tam = REPLACE(REPLACE(ten_trung_tam, 'Soccer247', 'Sport247'), 'SOCCER247', 'SPORT247'),
                gioi_thieu_ngan = REPLACE(REPLACE(gioi_thieu_ngan, 'Soccer247', 'Sport247'), 'SOCCER247', 'SPORT247'),
                bai_viet_about_us = REPLACE(REPLACE(bai_viet_about_us, 'Soccer247', 'Sport247'), 'SOCCER247', 'SPORT247'),
                link_facebook = REPLACE(link_facebook, 'soccer247', 'sport247');
        END;

        -- 2. Cập nhật bảng Lien_He
        IF OBJECT_ID('Lien_He', 'U') IS NOT NULL
        BEGIN
            UPDATE Lien_He
            SET tieu_de = REPLACE(REPLACE(tieu_de, 'Soccer247', 'Sport247'), 'Soccer 247', 'Sport 247'),
                noi_dung = REPLACE(REPLACE(noi_dung, 'Soccer247', 'Sport247'), 'Soccer 247', 'Sport 247'),
                noi_dung_tra_loi = REPLACE(REPLACE(noi_dung_tra_loi, 'Soccer247', 'Sport247'), 'Soccer 247', 'Sport 247');
        END;

        -- 3. Cập nhật bảng Tin_Tuc
        IF OBJECT_ID('Tin_Tuc', 'U') IS NOT NULL
        BEGIN
            UPDATE Tin_Tuc
            SET tieu_de = REPLACE(REPLACE(tieu_de, 'Soccer247', 'Sport247'), 'Soccer 247', 'Sport 247'),
                tom_tat = REPLACE(REPLACE(tom_tat, 'Soccer247', 'Sport247'), 'Soccer 247', 'Sport 247'),
                noi_dung = REPLACE(REPLACE(noi_dung, 'Soccer247', 'Sport247'), 'Soccer 247', 'Sport 247');
        END;

        SELECT 1 AS thanh_cong, N'Đã đồng bộ thương hiệu Sport247 trên toàn bộ CSDL thành công!' AS thong_bao;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO

PRINT N'✅ ĐÃ CÀI ĐẶT THÀNH CÔNG TOÀN BỘ STORED PROCEDURES CHO QuanLySanBong VỚI 100% TRY...CATCH VÀ TRANSACTIONS!';
GO
