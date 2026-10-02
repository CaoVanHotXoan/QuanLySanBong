import fs from 'fs';
import path from 'path';
import { poolPromise } from '../config/db';

async function deployThuTuc() {
    try {
        const pool = await poolPromise;
        console.log('✅ [SQL Server] Đã kết nối cơ sở dữ liệu thành công!');

        const sqlFilePath = path.resolve(__dirname, '../../../Data SQL server 2022/ThuTuc.sql');
        console.log('📄 Đang đọc file stored procedures:', sqlFilePath);
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

        // Tách các khối lệnh SQL theo từ khóa GO
        const rawBatches = sqlContent.split(/^\s*GO\s*$/gim);
        const batches = rawBatches
            .map(b => b.trim())
            .filter(b => b.length > 0 && !b.startsWith('USE master') && !b.startsWith('USE QuanLySanBong') && !b.startsWith('CREATE DATABASE'));

        console.log(`🚀 Tìm thấy ${batches.length} khối lệnh Stored Procedures & Bảng. Bắt đầu tự động cập nhật vào SQL Server...`);

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            try {
                await pool.request().batch(batch);
                successCount++;
            } catch (err: any) {
                console.error(`❌ Lỗi tại khối lệnh ${i + 1}:`, err.message);
                console.error('Đoạn đầu khối lệnh lỗi:\n', batch.substring(0, 150));
                errorCount++;
            }
        }

        console.log(`\n====================================================`);
        console.log(`🎉 KẾT QUẢ ĐỒNG BỘ: Thành công ${successCount}/${batches.length} khối lệnh vào SQL Server.`);
        if (errorCount > 0) {
            console.log(`⚠️ Có ${errorCount} khối lệnh gặp cảnh báo/lỗi.`);
        } else {
            console.log(`✅ 100% STORED PROCEDURES ĐÃ ĐƯỢC TỰ ĐỘNG NẠP VÀO CSDL THÀNH CÔNG!`);
        }
        console.log(`====================================================\n`);
        process.exit(0);
    } catch (err: any) {
        console.error('🔥 Lỗi nghiêm trọng:', err);
        process.exit(1);
    }
}

deployThuTuc();
