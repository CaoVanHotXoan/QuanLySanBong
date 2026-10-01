const sql = require('mssql');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const dbConfig = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '123',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_DATABASE || 'QuanLySanTheThao',
    port: parseInt(process.env.DB_PORT, 10) || 1433,
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

async function fixGhiChuColumn() {
    let pool;
    try {
        console.log('Connecting to database...');
        pool = await sql.connect(dbConfig);
        console.log('Connected!');

        // 1. Alter Don_Dat_San.ghi_chu to NVARCHAR(MAX)
        console.log('Altering Don_Dat_San.ghi_chu to NVARCHAR(MAX)...');
        await pool.request().query(`
            IF OBJECT_ID('Don_Dat_San', 'U') IS NOT NULL
            BEGIN
                ALTER TABLE Don_Dat_San ALTER COLUMN ghi_chu NVARCHAR(MAX) NULL;
            END;
        `);
        console.log('✅ Altered Don_Dat_San.ghi_chu to NVARCHAR(MAX) successfully!');

        // 2. Update Stored Procedures to accept NVARCHAR(MAX) for @ghi_chu
        console.log('Updating Stored Procedures...');
        
        // sp_DatSan
        await pool.request().query(`
            CREATE OR ALTER PROCEDURE sp_DatSan
                @ma_nguoi_dung INT,
                @ma_san INT,
                @ngay_da DATE,
                @gio_bat_dau VARCHAR(8),
                @gio_ket_thuc VARCHAR(8),
                @tien_san DECIMAL(10, 2) = NULL,
                @tong_tien DECIMAL(10, 2) = NULL,
                @phuong_thuc VARCHAR(20) = 'CHUYEN_KHOAN',
                @trang_thai VARCHAR(20) = 'CHO_THANH_TOAN',
                @ghi_chu NVARCHAR(MAX) = NULL
            AS
            BEGIN
                SET NOCOUNT ON;
                BEGIN TRANSACTION;
                BEGIN TRY
                    IF EXISTS (
                        SELECT 1 FROM Don_Dat_San
                        WHERE ma_san = @ma_san
                          AND ngay_da = @ngay_da
                          AND trang_thai <> 'DA_HUY'
                          AND (
                              (CAST(gio_bat_dau AS TIME) < CAST(@gio_ket_thuc AS TIME) AND CAST(gio_ket_thuc AS TIME) > CAST(@gio_bat_dau AS TIME))
                          )
                    )
                    BEGIN
                        ;THROW 50001, N'Khung giờ này đã có người đặt, vui lòng chọn khung giờ khác.', 1;
                    END;

                    DECLARE @gia_tinh_duoc DECIMAL(10, 2);
                    DECLARE @so_phut_tinh INT;
                    SET @so_phut_tinh = DATEDIFF(MINUTE, CAST(@gio_bat_dau AS TIME), CAST(@gio_ket_thuc AS TIME));
                    IF @so_phut_tinh <= 0 SET @so_phut_tinh = 60;

                    SELECT @gia_tinh_duoc = (gia_thue / 60.0) * @so_phut_tinh
                    FROM San_Bong
                    WHERE id = @ma_san;

                    IF @tien_san IS NOT NULL AND @tien_san > 0
                        SET @gia_tinh_duoc = @tien_san;

                    DECLARE @tong_tien_final DECIMAL(10, 2);
                    IF @tong_tien IS NOT NULL AND @tong_tien > 0
                        SET @tong_tien_final = @tong_tien;
                    ELSE
                        SET @tong_tien_final = @gia_tinh_duoc;

                    INSERT INTO Don_Dat_San (
                        ma_nguoi_dung, ma_san, ngay_da, gio_bat_dau, gio_ket_thuc,
                        tien_san, tong_tien, phuong_thuc, ghi_chu, trang_thai, ngay_tao
                    )
                    VALUES (
                        @ma_nguoi_dung, @ma_san, @ngay_da, CAST(@gio_bat_dau AS TIME), CAST(@gio_ket_thuc AS TIME),
                        @gia_tinh_duoc, @tong_tien_final, @phuong_thuc, @ghi_chu, @trang_thai, GETDATE()
                    );

                    DECLARE @new_id INT = SCOPE_IDENTITY();

                    COMMIT TRANSACTION;

                    SELECT 
                        d.id, d.ma_nguoi_dung, d.ma_san, d.ngay_da,
                        CONVERT(VARCHAR(5), d.gio_bat_dau, 108) AS gio_bat_dau,
                        CONVERT(VARCHAR(5), d.gio_ket_thuc, 108) AS gio_ket_thuc,
                        d.tien_san, d.tong_tien, d.phuong_thuc, d.ghi_chu, d.trang_thai, d.ngay_tao,
                        s.ten_san, s.loai_san,
                        u.ho_ten AS ten_khach_hang, u.so_dien_thoai AS sdt_khach_hang
                    FROM Don_Dat_San d
                    INNER JOIN San_Bong s ON d.ma_san = s.id
                    INNER JOIN Nguoi_Dung u ON d.ma_nguoi_dung = u.id
                    WHERE d.id = @new_id;
                END TRY
                BEGIN CATCH
                    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
                    THROW;
                END CATCH
            END;
        `);
        console.log('✅ Updated sp_DatSan');

        // sp_ThemDonDatSan
        await pool.request().query(`
            CREATE OR ALTER PROCEDURE sp_ThemDonDatSan
                @ma_nguoi_dung INT,
                @ma_san INT,
                @ngay_da DATE,
                @gio_bat_dau TIME,
                @gio_ket_thuc TIME,
                @tien_san DECIMAL(10, 2) = NULL,
                @tong_tien DECIMAL(10, 2) = NULL,
                @phuong_thuc VARCHAR(20) = 'CHUYEN_KHOAN',
                @ghi_chu NVARCHAR(MAX) = NULL,
                @trang_thai VARCHAR(20) = 'DA_COC'
            AS
            BEGIN
                SET NOCOUNT ON;
                BEGIN TRANSACTION;
                BEGIN TRY
                    IF EXISTS (
                        SELECT 1 FROM Don_Dat_San
                        WHERE ma_san = @ma_san
                          AND ngay_da = @ngay_da
                          AND trang_thai <> 'DA_HUY'
                          AND (
                              (gio_bat_dau < @gio_ket_thuc AND gio_ket_thuc > @gio_bat_dau)
                          )
                    )
                    BEGIN
                        ;THROW 50011, N'Khung giờ này đã có đơn đặt sân khác, vui lòng chọn khung giờ khác.', 1;
                    END;

                    DECLARE @tien_san_val DECIMAL(10, 2);
                    IF @tien_san IS NOT NULL AND @tien_san > 0
                        SET @tien_san_val = @tien_san;
                    ELSE
                    BEGIN
                        DECLARE @gia_san DECIMAL(10, 2);
                        SELECT @gia_san = gia_thue FROM San_Bong WHERE id = @ma_san;
                        DECLARE @phut INT = DATEDIFF(MINUTE, @gio_bat_dau, @gio_ket_thuc);
                        IF @phut <= 0 SET @phut = 60;
                        SET @tien_san_val = (@gia_san / 60.0) * @phut;
                    END;

                    DECLARE @tong_tien_val DECIMAL(10, 2);
                    IF @tong_tien IS NOT NULL AND @tong_tien > 0
                        SET @tong_tien_val = @tong_tien;
                    ELSE
                        SET @tong_tien_val = @tien_san_val;

                    INSERT INTO Don_Dat_San (
                        ma_nguoi_dung, ma_san, ngay_da, gio_bat_dau, gio_ket_thuc,
                        tien_san, tong_tien, phuong_thuc, ghi_chu, trang_thai, ngay_tao
                    )
                    VALUES (
                        @ma_nguoi_dung, @ma_san, @ngay_da, @gio_bat_dau, @gio_ket_thuc,
                        @tien_san_val, @tong_tien_val, @phuong_thuc, @ghi_chu, @trang_thai, GETDATE()
                    );

                    DECLARE @new_id INT = SCOPE_IDENTITY();
                    COMMIT TRANSACTION;

                    SELECT 
                        d.id, d.ma_nguoi_dung, d.ma_san, d.ngay_da,
                        CONVERT(VARCHAR(5), d.gio_bat_dau, 108) AS gio_bat_dau,
                        CONVERT(VARCHAR(5), d.gio_ket_thuc, 108) AS gio_ket_thuc,
                        d.tien_san, d.tong_tien, d.phuong_thuc, d.ghi_chu, d.trang_thai, d.ngay_tao,
                        s.ten_san, s.loai_san,
                        u.ho_ten AS ten_khach_hang, u.so_dien_thoai AS sdt_khach_hang
                    FROM Don_Dat_San d
                    INNER JOIN San_Bong s ON d.ma_san = s.id
                    INNER JOIN Nguoi_Dung u ON d.ma_nguoi_dung = u.id
                    WHERE d.id = @new_id;
                END TRY
                BEGIN CATCH
                    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
                    THROW;
                END CATCH
            END;
        `);
        console.log('✅ Updated sp_ThemDonDatSan');

        // sp_SuaDonDatSan
        await pool.request().query(`
            CREATE OR ALTER PROCEDURE sp_SuaDonDatSan
                @id INT,
                @ma_san INT,
                @ngay_da DATE,
                @gio_bat_dau TIME,
                @gio_ket_thuc TIME,
                @tien_san DECIMAL(10, 2) = NULL,
                @tong_tien DECIMAL(10, 2) = NULL,
                @phuong_thuc VARCHAR(20) = NULL,
                @ghi_chu NVARCHAR(MAX) = NULL,
                @trang_thai VARCHAR(20) = NULL
            AS
            BEGIN
                SET NOCOUNT ON;
                BEGIN TRANSACTION;
                BEGIN TRY
                    IF NOT EXISTS (SELECT 1 FROM Don_Dat_San WHERE id = @id)
                    BEGIN
                        ;THROW 50012, N'Đơn đặt sân không tồn tại.', 1;
                    END;

                    IF @trang_thai <> 'DA_HUY' AND EXISTS (
                        SELECT 1 FROM Don_Dat_San
                        WHERE ma_san = @ma_san
                          AND ngay_da = @ngay_da
                          AND id <> @id
                          AND trang_thai <> 'DA_HUY'
                          AND (
                              (gio_bat_dau < @gio_ket_thuc AND gio_ket_thuc > @gio_bat_dau)
                          )
                    )
                    BEGIN
                        ;THROW 50013, N'Khung giờ mới này đã có đơn đặt sân khác, không thể cập nhật.', 1;
                    END;

                    UPDATE Don_Dat_San
                    SET 
                        ma_san = @ma_san,
                        ngay_da = @ngay_da,
                        gio_bat_dau = @gio_bat_dau,
                        gio_ket_thuc = @gio_ket_thuc,
                        tien_san = ISNULL(@tien_san, tien_san),
                        tong_tien = ISNULL(@tong_tien, tong_tien),
                        phuong_thuc = ISNULL(@phuong_thuc, phuong_thuc),
                        ghi_chu = @ghi_chu,
                        trang_thai = ISNULL(@trang_thai, trang_thai)
                    WHERE id = @id;

                    COMMIT TRANSACTION;

                    SELECT 
                        d.id, d.ma_nguoi_dung, d.ma_san, d.ngay_da,
                        CONVERT(VARCHAR(5), d.gio_bat_dau, 108) AS gio_bat_dau,
                        CONVERT(VARCHAR(5), d.gio_ket_thuc, 108) AS gio_ket_thuc,
                        d.tien_san, d.tong_tien, d.phuong_thuc, d.ghi_chu, d.trang_thai, d.ngay_tao,
                        s.ten_san, s.loai_san,
                        u.ho_ten AS ten_khach_hang, u.so_dien_thoai AS sdt_khach_hang
                    FROM Don_Dat_San d
                    INNER JOIN San_Bong s ON d.ma_san = s.id
                    INNER JOIN Nguoi_Dung u ON d.ma_nguoi_dung = u.id
                    WHERE d.id = @id;
                END TRY
                BEGIN CATCH
                    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
                    THROW;
                END CATCH
            END;
        `);
        console.log('✅ Updated sp_SuaDonDatSan');

        console.log('🎉 All procedures and table alterations applied successfully!');
    } catch (err) {
        console.error('Error during database update:', err);
    } finally {
        if (pool) await pool.close();
    }
}

fixGhiChuColumn();
