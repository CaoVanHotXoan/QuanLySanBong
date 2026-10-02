import { sql, poolPromise } from '../config/db';

async function testAddBooking() {
    try {
        const pool = await poolPromise;
        console.log('Testing sp_ThemDonDatVaThanhToan...');

        const result = await pool.request()
            .input('ma_nguoi_dung', sql.Int, 1)
            .input('ma_san', sql.Int, 1)
            .input('ngay_da', sql.Date, '2026-10-03')
            .input('gio_bat_dau', sql.VarChar(8), '19:05:00')
            .input('gio_ket_thuc', sql.VarChar(8), '20:34:00')
            .input('tien_san', sql.Decimal(10, 2), 26700)
            .input('tong_tien', sql.Decimal(10, 2), 26700)
            .input('phuong_thuc', sql.VarChar(20), 'CHUYEN_KHOAN')
            .input('trang_thai', sql.VarChar(30), 'DA_THANH_TOAN')
            .input('ghi_chu', sql.NVarChar(sql.MAX), 'Đặt trực tiếp tại quầy')
            .input('loai_thanh_toan', sql.VarChar(20), 'TRA_HET')
            .input('so_tien', sql.Decimal(10, 2), 26700)
            .input('trang_thai_gd', sql.VarChar(20), 'THANH_CONG')
            .execute('sp_ThemDonDatVaThanhToan');

        console.log('✅ Success! Result:', result.recordset[0]);
        process.exit(0);
    } catch (err: any) {
        console.error('❌ Error testing sp_ThemDonDatVaThanhToan:', err);
        process.exit(1);
    }
}

testAddBooking();
