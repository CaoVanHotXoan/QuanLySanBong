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

async function cleanupGhiChu() {
    let pool;
    try {
        pool = await sql.connect(dbConfig);
        console.log('Cleaning up [PayOS #...] tags from Don_Dat_San.ghi_chu...');

        const rows = await pool.request().query('SELECT id, ghi_chu FROM Don_Dat_San WHERE ghi_chu LIKE \'%PayOS%\'');
        console.log(`Found ${rows.recordset.length} rows with PayOS tags.`);

        for (const row of rows.recordset) {
            let cleaned = (row.ghi_chu || '')
                .replace(/\[PayOS\s*#\d+\]/gi, '')
                .replace(/PayOS\s+VietQR\s+MB\s+Bank\s*-\s*\d+%/gi, '')
                .replace(/\s+/g, ' ')
                .trim();

            if (cleaned === '') cleaned = null;

            await pool.request()
                .input('id', sql.Int, row.id)
                .input('ghi_chu', sql.NVarChar(sql.MAX), cleaned)
                .query('UPDATE Don_Dat_San SET ghi_chu = @ghi_chu WHERE id = @id');
        }

        console.log('✅ Cleaned up all PayOS tags from ghi_chu in database successfully!');
    } catch (err) {
        console.error('Error cleaning up ghi_chu:', err);
    } finally {
        if (pool) await pool.close();
    }
}

cleanupGhiChu();
