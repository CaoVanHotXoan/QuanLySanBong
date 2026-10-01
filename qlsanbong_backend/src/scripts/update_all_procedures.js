const { sql, poolPromise } = require('../config/db');

async function updateProcedures() {
    try {
        const pool = await poolPromise;
        console.log('Connected to SQL Server. Updating stored procedures...');

        // 1. sp_HuyDonTam
        await pool.query(`
            CREATE OR ALTER PROCEDURE sp_HuyDonTam
                @ma_don_dat INT = NULL,
                @searchStr NVARCHAR(100) = NULL
            AS
            BEGIN
                SET NOCOUNT ON;
                BEGIN TRY
                    IF @ma_don_dat IS NOT NULL
                    BEGIN
                        DELETE FROM Chi_Tiet_Dich_Vu WHERE ma_don_dat = @ma_don_dat;
                        DELETE FROM Don_Dat_San WHERE id = @ma_don_dat AND trang_thai = 'CHO_THANH_TOAN';
                    END
                    ELSE IF @searchStr IS NOT NULL
                    BEGIN
                        DELETE FROM Don_Dat_San WHERE ghi_chu LIKE @searchStr AND trang_thai = 'CHO_THANH_TOAN';
                    END
                END TRY
                BEGIN CATCH
                    ;THROW;
                END CATCH
            END;
        `);
        console.log('✔ sp_HuyDonTam updated');

        // 2. sp_ThemNguoiDung
        await pool.query(`
            CREATE OR ALTER PROCEDURE sp_ThemNguoiDung
                @ho_ten NVARCHAR(100),
                @email VARCHAR(255),
                @so_dien_thoai VARCHAR(15),
                @mat_khau VARCHAR(255),
                @vai_tro VARCHAR(50) = 'KHACH_HANG',
                @MaVaiTro INT = NULL,
                @anh_dai_dien VARCHAR(255) = NULL
            AS
            BEGIN
                SET NOCOUNT ON;
                BEGIN TRY
                    IF EXISTS (SELECT 1 FROM Nguoi_Dung WHERE email = @email)
                    BEGIN
                        ;THROW 50001, N'Email này đã được đăng ký trong hệ thống.', 1;
                    END;

                    DECLARE @v_MaVaiTro INT = @MaVaiTro;
                    IF @v_MaVaiTro IS NULL
                    BEGIN
                        SELECT @v_MaVaiTro = MaVaiTro FROM Vai_Tro WHERE TenVaiTro = @vai_tro;
                        IF @v_MaVaiTro IS NULL SET @v_MaVaiTro = 3;
                    END;

                    INSERT INTO Nguoi_Dung (ho_ten, email, so_dien_thoai, mat_khau, MaVaiTro, anh_dai_dien)
                    VALUES (@ho_ten, @email, @so_dien_thoai, @mat_khau, @v_MaVaiTro, @anh_dai_dien);

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
        `);
        console.log('✔ sp_ThemNguoiDung updated');

        // 3. sp_SuaNguoiDung
        await pool.query(`
            CREATE OR ALTER PROCEDURE sp_SuaNguoiDung
                @id INT,
                @ho_ten NVARCHAR(100),
                @email VARCHAR(255),
                @so_dien_thoai VARCHAR(15),
                @vai_tro VARCHAR(50) = NULL,
                @MaVaiTro INT = NULL,
                @mat_khau VARCHAR(255) = NULL,
                @anh_dai_dien VARCHAR(255) = NULL
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
                        mat_khau = CASE WHEN @mat_khau IS NOT NULL AND LEN(@mat_khau) > 0 THEN @mat_khau ELSE mat_khau END,
                        anh_dai_dien = ISNULL(@anh_dai_dien, anh_dai_dien)
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
        `);
        console.log('✔ sp_SuaNguoiDung updated');

        console.log('All procedures successfully synchronized!');
        process.exit(0);
    } catch (err) {
        console.error('Error updating procedures:', err);
        process.exit(1);
    }
}

updateProcedures();
