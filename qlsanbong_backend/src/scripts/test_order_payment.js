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

async function testPaymentLink() {
    let pool;
    try {
        pool = await sql.connect(dbConfig);
        console.log('Testing column length and update...');

        // Check columns in Don_Dat_San
        const colCheck = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'Don_Dat_San' AND COLUMN_NAME = 'ghi_chu'
        `);
        console.log('ghi_chu column info:', colCheck.recordset[0]);

        // Test appending PayOS order code to any order
        const orders = await pool.request().query('SELECT TOP 1 id, ghi_chu FROM Don_Dat_San ORDER BY id DESC');
        if (orders.recordset.length > 0) {
            const order = orders.recordset[0];
            console.log('Testing update on order #' + order.id);
            const testOrderCode = 999999;
            await pool.request()
                .input('id', sql.Int, order.id)
                .input('orderCodeStr', sql.NVarChar(sql.MAX), ` [PayOS #${testOrderCode}]`)
                .query('UPDATE Don_Dat_San SET ghi_chu = ISNULL(ghi_chu, \'\') + @orderCodeStr WHERE id = @id');
            console.log('✅ Update test succeeded without truncation error!');
        }

        // Test HTTP endpoint
        const fetch = globalThis.fetch || require('node-fetch');
        const res = await fetch('http://localhost:5000/api/thanh-toan/payos/tao-link', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ma_don_dat: orders.recordset[0]?.id,
                so_tien: 12600,
                loai_thanh_toan: 'TRA_HET',
                ho_ten: 'Khách Hàng Test',
                so_dien_thoai: '0901234567'
            })
        });
        const data = await res.json();
        console.log('PayOS API response:', data);

    } catch (err) {
        console.error('Test error:', err);
    } finally {
        if (pool) await pool.close();
    }
}

testPaymentLink();
