"use strict";
/**
 * =====================================================================
 * CẤU HÌNH KẾT NỐI CƠ SỞ DỮ LIỆU SQL SERVER
 * Sử dụng thư viện `mssql` (Tài khoản 'sa')
 * =====================================================================
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.poolPromise = exports.sql = void 0;
const mssql_1 = __importDefault(require("mssql"));
exports.sql = mssql_1.default;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const dbConfig = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '123',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_DATABASE || 'QuanLySanTheThao',
    port: parseInt(process.env.DB_PORT || '1433', 10),
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true', // true nếu dùng Cloud Azure SQL, false nếu dùng local/ngrok
        trustServerCertificate: true, // Chấp nhận chứng chỉ tự ký
        enableArithAbort: true
    },
    pool: {
        max: 20,
        min: 0,
        idleTimeoutMillis: 30000
    }
};
// Khởi tạo Connection Pool (Tự động kết nối và không làm sập máy chủ Render nếu tạm thời mất mạng)
const poolPromise = new mssql_1.default.ConnectionPool(dbConfig)
    .connect()
    .then(async (pool) => {
    console.log('✅ [SQL Server] Kết nối cơ sở dữ liệu thành công!');
    // Tự động kiểm tra và đảm bảo các Stored Procedure của module Liên Hệ luôn sẵn sàng
    try {
        await pool.request().query(`
                IF OBJECT_ID('Lien_He', 'U') IS NOT NULL
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Lien_He') AND name = 'noi_dung_tra_loi')
                        ALTER TABLE Lien_He ADD noi_dung_tra_loi NVARCHAR(MAX) NULL;
                    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Lien_He') AND name = 'ngay_tra_loi')
                        ALTER TABLE Lien_He ADD ngay_tra_loi DATETIME NULL;
                END;
            `);
    }
    catch (e) {
        console.warn('⚠️ Kiểm tra cấu trúc bảng Lien_He:', e.message);
    }
    return pool;
})
    .catch(err => {
    console.error('❌ [SQL Server] Lỗi kết nối cơ sở dữ liệu:', err.message);
    console.warn('⚠️ [Cảnh báo]: Vui lòng kiểm tra lại biến môi trường DB_SERVER, DB_USER, DB_PASSWORD, DB_PORT!');
    return new mssql_1.default.ConnectionPool(dbConfig); // Trả về pool rỗng để Render không bị dừng tiến trình
});
exports.poolPromise = poolPromise;
exports.default = poolPromise;
