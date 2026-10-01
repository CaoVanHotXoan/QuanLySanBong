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

const procedureSql = `
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
        SET tong_tien = tien_san + @tong_tien_dv
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
`;

async function main() {
    try {
        const pool = await sql.connect(dbConfig);
        await pool.request().query(procedureSql);
        console.log('✅ Created procedure sp_CapNhatDichVuDonDat in SQL Server successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error creating procedure:', err);
        process.exit(1);
    }
}

main();
