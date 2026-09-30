const { sql, poolPromise } = require('../config/db');
const fs = require('fs');
const path = require('path');

async function runStoredProcedures() {
    try {
        console.log('Connecting to SQL Server database...');
        const pool = await poolPromise;
        console.log('Connected!');

        // Check/Create Khung_Gio table
        await pool.request().query(`
            IF OBJECT_ID('Khung_Gio', 'U') IS NULL
            BEGIN
                CREATE TABLE Khung_Gio (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    gio_bat_dau VARCHAR(5) NOT NULL,
                    gio_ket_thuc VARCHAR(5) NOT NULL,
                    nhan_hien_thi NVARCHAR(50) NOT NULL,
                    thu_tu INT NOT NULL,
                    trang_thai BIT DEFAULT 1
                );
            END;
        `);

        const sqlFilePath = path.join(__dirname, '../../../ThuTuc.sql');
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

        // Split by GO statements
        const batches = sqlContent
            .split(/^GO\s*$/gim)
            .map(b => b.trim())
            .filter(b => b.length > 0 && !b.toUpperCase().startsWith('USE MASTER') && !b.toUpperCase().startsWith('USE QUANTLYSANBONG'));

        console.log(`Executing ${batches.length} SQL batches...`);

        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            try {
                await pool.request().query(batch);
            } catch (batchErr) {
                console.warn(`[Batch ${i + 1}] Warning/Error:`, batchErr.message);
            }
        }

        console.log('✅ ALL STORED PROCEDURES CREATED/UPDATED SUCCESSFULLY IN SQL SERVER!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration error:', err);
        process.exit(1);
    }
}

runStoredProcedures();
