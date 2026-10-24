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

async function test() {
    const pool = await sql.connect(config);
    const r1 = await pool.request().query(`
        SELECT name, create_date, modify_date 
        FROM sys.procedures 
        WHERE name IN ('sp_DongBoTrangThaiDonDatSan', 'sp_XacNhanVaoSan', 'sp_LayTatCaDonDat', 'sp_LayTrangThaiSanTrucQuan')
        ORDER BY name
    `);
    console.log('✅ Procedures in SQL Server:');
    console.table(r1.recordset);

    const r2 = await pool.request().execute('sp_LayTatCaDonDat');
    console.log('✅ Total bookings returned by sp_LayTatCaDonDat:', r2.recordset.length);
    const dangDa = r2.recordset.filter(b => b.trang_thai === 'DANG_DA');
    console.log('✅ DANG_DA bookings count:', dangDa.length);

    const r3 = await pool.request().execute('sp_LayTrangThaiSanTrucQuan');
    const playingPitches = r3.recordset.filter(s => s.tinh_trang_thuc_te === 'DANG_DA');
    console.log('✅ Live pitch count currently DANG_DA:', playingPitches.length);

    await pool.close();
}

test().catch(console.error);
