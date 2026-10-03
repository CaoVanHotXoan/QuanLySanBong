import { poolPromise } from '../config/db';

async function checkLiveData() {
    try {
        const pool = await poolPromise;
        const result = await pool.request().execute('sp_LayTatCaDonDat');

        console.log('=== DỮ LIỆU THỰC TẾ TỪ STORED PROCEDURE sp_LayTatCaDonDat (SQL SERVER) ===');
        console.table(result.recordset.slice(0, 10));
        process.exit(0);
    } catch (err: any) {
        console.error('Lỗi truy vấn:', err.message);
        process.exit(1);
    }
}

checkLiveData();
