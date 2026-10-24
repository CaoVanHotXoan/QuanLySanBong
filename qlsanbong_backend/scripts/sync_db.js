const sql = require('mssql');

const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '123456',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_DATABASE || 'QuanLySanBong',
    port: parseInt(process.env.DB_PORT || '1433', 10),
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function main() {
    console.log('Connecting to SQL Server...');
    const pool = await sql.connect(config);
    console.log('Connected successfully!');

    // 1. Tạo thủ tục sp_DongBoTrangThaiDonDatSan
    const p1 = `
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
            -- Bỏ qua lỗi
        END CATCH;
    END;
    `;
    await pool.request().query(p1);
    console.log('✅ Created/Updated sp_DongBoTrangThaiDonDatSan');

    // 2. Tạo thủ tục sp_XacNhanVaoSan
    const p2 = `
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
    `;
    await pool.request().query(p2);
    console.log('✅ Created/Updated sp_XacNhanVaoSan');

    // 3. Cập nhật sp_LayTatCaDonDat có gọi sp_DongBoTrangThaiDonDatSan
    const p3 = `
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
    `;
    await pool.request().query(p3);
    console.log('✅ Updated sp_LayTatCaDonDat');

    // 4. Chạy thủ tục đồng bộ ngay lập tức
    await pool.request().execute('sp_DongBoTrangThaiDonDatSan');
    console.log('✅ Executed sp_DongBoTrangThaiDonDatSan successfully!');

    // 5. Kiểm tra kết quả
    const res = await pool.request().query("SELECT id, ma_san, CONVERT(VARCHAR(10), ngay_da, 120) as ngay_da, CONVERT(VARCHAR(5), gio_bat_dau, 108) as gio_bat_dau, CONVERT(VARCHAR(5), gio_ket_thuc, 108) as gio_ket_thuc, trang_thai, da_vao_san FROM Don_Dat_San WHERE trang_thai = 'DANG_DA' OR da_vao_san = 1");
    console.log('Currently active DANG_DA count:', res.recordset.length);
    console.log('Result:', res.recordset);

    await pool.close();
    console.log('Done!');
}

main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
