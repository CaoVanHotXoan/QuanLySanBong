const sql = require('mssql');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '123456',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_DATABASE || 'QuanLySanBong',
    port: parseInt(process.env.DB_PORT || '1433', 10),
    options: { encrypt: false, trustServerCertificate: true }
};

async function initOtpDb() {
    try {
        console.log('Đang kết nối SQL Server...');
        const pool = await sql.connect(config);
        console.log('✅ Đã kết nối SQL Server!');

        // 1. Tạo bảng Xac_Thuc_OTP nếu chưa có
        await pool.request().query(`
            IF OBJECT_ID('Xac_Thuc_OTP', 'U') IS NULL
            BEGIN
                CREATE TABLE Xac_Thuc_OTP (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    email VARCHAR(255) NOT NULL,
                    ma_otp VARCHAR(10) NOT NULL,
                    loai_otp VARCHAR(50) NOT NULL,
                    het_han_luc DATETIME NOT NULL,
                    da_xac_thuc BIT DEFAULT 0,
                    ngay_tao DATETIME DEFAULT GETDATE()
                );
                CREATE NONCLUSTERED INDEX IX_XacThucOTP_Email_Loai ON Xac_Thuc_OTP(email, loai_otp, da_xac_thuc, het_han_luc);
                PRINT 'Đã tạo bảng Xac_Thuc_OTP thành công';
            END
        `);
        console.log('✅ Bảng Xac_Thuc_OTP đã sẵn sàng!');

        // 2. Tạo Procedure sp_LuuMaOTP
        await pool.request().batch(`
            CREATE OR ALTER PROCEDURE sp_LuuMaOTP
                @email VARCHAR(255),
                @ma_otp VARCHAR(10),
                @loai_otp VARCHAR(50),
                @thoi_gian_phut INT = 5
            AS
            BEGIN
                SET NOCOUNT ON;
                BEGIN TRY
                    UPDATE Xac_Thuc_OTP 
                    SET da_xac_thuc = 1 
                    WHERE email = @email AND loai_otp = @loai_otp AND da_xac_thuc = 0;

                    INSERT INTO Xac_Thuc_OTP (email, ma_otp, loai_otp, het_han_luc, da_xac_thuc, ngay_tao)
                    VALUES (
                        @email, 
                        @ma_otp, 
                        @loai_otp, 
                        DATEADD(MINUTE, ISNULL(@thoi_gian_phut, 5), GETDATE()), 
                        0, 
                        GETDATE()
                    );

                    SELECT 
                        SCOPE_IDENTITY() AS id,
                        @email AS email,
                        @ma_otp AS ma_otp,
                        @loai_otp AS loai_otp,
                        DATEADD(MINUTE, ISNULL(@thoi_gian_phut, 5), GETDATE()) AS het_han_luc,
                        N'Tạo mã OTP thành công' AS thong_bao;
                END TRY
                BEGIN CATCH
                    ;THROW;
                END CATCH;
            END;
        `);
        console.log('✅ Procedure sp_LuuMaOTP đã sẵn sàng!');

        // 3. Tạo Procedure sp_KiemTraOTP
        await pool.request().batch(`
            CREATE OR ALTER PROCEDURE sp_KiemTraOTP
                @email VARCHAR(255),
                @ma_otp VARCHAR(10),
                @loai_otp VARCHAR(50)
            AS
            BEGIN
                SET NOCOUNT ON;
                DECLARE @id INT, @het_han_luc DATETIME, @da_xac_thuc BIT;

                SELECT TOP 1 
                    @id = id, 
                    @het_han_luc = het_han_luc, 
                    @da_xac_thuc = da_xac_thuc
                FROM Xac_Thuc_OTP
                WHERE email = @email AND loai_otp = @loai_otp AND ma_otp = @ma_otp
                ORDER BY id DESC;

                IF @id IS NULL
                BEGIN
                    SELECT 0 AS hop_le, N'Mã OTP không chính xác!' AS thong_bao;
                    RETURN;
                END;

                IF @het_han_luc < GETDATE()
                BEGIN
                    SELECT 0 AS hop_le, N'Mã OTP đã hết hiệu lực (quá hạn)! Vui lòng lấy mã mới.' AS thong_bao;
                    RETURN;
                END;

                IF @da_xac_thuc = 1
                BEGIN
                    SELECT 0 AS hop_le, N'Mã OTP này đã được sử dụng trước đó!' AS thong_bao;
                    RETURN;
                END;

                UPDATE Xac_Thuc_OTP
                SET da_xac_thuc = 1
                WHERE id = @id;

                SELECT 1 AS hop_le, N'Xác thực mã OTP thành công!' AS thong_bao;
            END;
        `);
        console.log('✅ Procedure sp_KiemTraOTP đã sẵn sàng!');

        // 4. Tạo Procedure sp_DoiMatKhau
        await pool.request().batch(`
            CREATE OR ALTER PROCEDURE sp_DoiMatKhau
                @email VARCHAR(255),
                @mat_khau_moi VARCHAR(255)
            AS
            BEGIN
                SET NOCOUNT ON;
                BEGIN TRY
                    IF NOT EXISTS (SELECT 1 FROM Nguoi_Dung WHERE email = @email)
                    BEGIN
                        ;THROW 50006, N'Không tìm thấy tài khoản với email này trong hệ thống!', 1;
                    END;

                    UPDATE Nguoi_Dung
                    SET mat_khau = @mat_khau_moi
                    WHERE email = @email;

                    SELECT 1 AS thanh_cong, N'Đổi mật khẩu thành công!' AS thong_bao;
                END TRY
                BEGIN CATCH
                    ;THROW;
                END CATCH;
            END;
        `);
        console.log('✅ Procedure sp_DoiMatKhau đã sẵn sàng!');

        // 5. Tạo Procedure sp_CapNhatEmailNguoiDung
        await pool.request().batch(`
            CREATE OR ALTER PROCEDURE sp_CapNhatEmailNguoiDung
                @id INT,
                @email_moi VARCHAR(255)
            AS
            BEGIN
                SET NOCOUNT ON;
                BEGIN TRY
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
                END TRY
                BEGIN CATCH
                    ;THROW;
                END CATCH;
            END;
        `);
        console.log('✅ Procedure sp_CapNhatEmailNguoiDung đã sẵn sàng!');

        await pool.close();
        console.log('🎉 Hoàn tất cấu hình CSDL cho mã OTP!');
    } catch (err) {
        console.error('Lỗi khởi tạo OTP DB:', err);
    }
}

initOtpDb();
