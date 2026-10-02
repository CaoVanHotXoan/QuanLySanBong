const fs = require('fs');
const path = require('path');
const { poolPromise } = require('../config/db');

async function deployThuTuc() {
    try {
        const pool = await poolPromise;
        console.log('✅ Đã kết nối SQL Server thành công!');

        const sqlFilePath = path.resolve(__dirname, '../../../Data SQL server 2022/ThuTuc.sql');
        console.log('Đang đọc file:', sqlFilePath);
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

        // Tách các lệnh theo từ khóa GO (đứng độc lập trên 1 dòng)
        const batches = sqlContent
            .split(/^\s*GO\s*$/gim)
            .map(b => b.trim())
            .filter(b => b.length > 0 && !b.startsWith('USE master') && !b.startsWith('USE QuanLySanBong') && !b.startsWith('CREATE DATABASE'));

        console.log(`Tìm thấy ${batches.length} khối lệnh SQL. Đang nạp vào SQL Server...`);

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            try {
                await pool.request().batch(batch);
                successCount++;
            } catch (err) {
                console.error(`❌ Lỗi tại khối lệnh ${i + 1}:`, err.message);
                console.error('Đoạn lệnh lỗi:', batch.substring(0, 150));
                errorCount++;
            }
        }

        console.log(`\n🎉 KẾT QUẢ: Nạp thành công ${successCount}/${batches.length} khối lệnh. Lỗi: ${errorCount}`);
        process.exit(0);
    } catch (err) {
        console.error('🔥 Lỗi nghiêm trọng:', err);
        process.exit(1);
    }
}

deployThuTuc();
