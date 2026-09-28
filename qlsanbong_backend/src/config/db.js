/**
 * =====================================================================
 * CẤU HÌNH KẾT NỐI CƠ SỞ DỮ LIỆU SQL SERVER
 * Sử dụng thư viện `mssql` (Tài khoản 'sa')
 * =====================================================================
 */

const sql = require('mssql');
require('dotenv').config();

const dbConfig = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '123',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_DATABASE || 'QuanLySanTheThao',
    port: parseInt(process.env.DB_PORT, 10) || 1433,
    options: {
        encrypt: false, // Bắt buộc false cho kết nối nội bộ / cục bộ
        trustServerCertificate: true, // Chấp nhận chứng chỉ tự ký
        enableArithAbort: true
    },
    pool: {
        max: 20,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

// Khởi tạo Connection Pool
const poolPromise = new sql.ConnectionPool(dbConfig)
    .connect()
    .then(pool => {
        console.log('✅ [SQL Server] Kết nối cơ sở dữ liệu thành công!');
        return pool;
    })
    .catch(err => {
        console.error('❌ [SQL Server] Lỗi kết nối cơ sở dữ liệu:', err.message);
        process.exit(1);
    });

module.exports = {
    sql,
    poolPromise
};
