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

async function testProcedures() {
    const pool = await sql.connect(config);
    console.log('--- TEST 1: sp_LuuMaOTP ---');
    const saveRes = await pool.request()
        .input('email', sql.VarChar(255), 'test_otp@gmail.com')
        .input('ma_otp', sql.VarChar(10), '123456')
        .input('loai_otp', sql.VarChar(50), 'DANG_KY')
        .input('thoi_gian_phut', sql.Int, 5)
        .execute('sp_LuuMaOTP');
    console.log('Result save OTP:', saveRes.recordset[0]);

    console.log('\n--- TEST 2: sp_KiemTraOTP (Sai mã) ---');
    const checkWrong = await pool.request()
        .input('email', sql.VarChar(255), 'test_otp@gmail.com')
        .input('ma_otp', sql.VarChar(10), '999999')
        .input('loai_otp', sql.VarChar(50), 'DANG_KY')
        .execute('sp_KiemTraOTP');
    console.log('Result wrong OTP:', checkWrong.recordset[0]);

    console.log('\n--- TEST 3: sp_KiemTraOTP (Đúng mã) ---');
    const checkRight = await pool.request()
        .input('email', sql.VarChar(255), 'test_otp@gmail.com')
        .input('ma_otp', sql.VarChar(10), '123456')
        .input('loai_otp', sql.VarChar(50), 'DANG_KY')
        .execute('sp_KiemTraOTP');
    console.log('Result correct OTP:', checkRight.recordset[0]);

    console.log('\n--- TEST 4: sp_KiemTraOTP (Sử dụng lại mã đã xác thực) ---');
    const checkReused = await pool.request()
        .input('email', sql.VarChar(255), 'test_otp@gmail.com')
        .input('ma_otp', sql.VarChar(10), '123456')
        .input('loai_otp', sql.VarChar(50), 'DANG_KY')
        .execute('sp_KiemTraOTP');
    console.log('Result reused OTP:', checkReused.recordset[0]);

    // Dọn dẹp bản ghi test
    await pool.request().query("DELETE FROM Xac_Thuc_OTP WHERE email = 'test_otp@gmail.com'");
    console.log('\n✅ Dọn dẹp bản ghi test thành công!');
    await pool.close();
}

testProcedures().catch(console.error);
