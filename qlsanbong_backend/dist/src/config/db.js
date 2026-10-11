"use strict";
/**
 * =====================================================================
 * CẤU HÌNH KẾT NỐI CƠ SỞ DỮ LIỆU SQL SERVER
 * Tự động kết nối lại (Auto-Reconnect) tương thích mọi môi trường (Local, Render, Vercel Serverless)
 * =====================================================================
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.poolPromise = exports.sql = exports.getPool = void 0;
const mssql_1 = __importDefault(require("mssql"));
exports.sql = mssql_1.default;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const dbConfig = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '123456',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_DATABASE || 'QuanLySanBong',
    port: parseInt(process.env.DB_PORT || '1433', 10),
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true', // true nếu dùng Cloud Azure/Site4Now, false nếu local
        trustServerCertificate: true,
        enableArithAbort: true
    },
    connectionTimeout: 15000,
    requestTimeout: 15000,
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};
let globalPool = null;
let connectingPromise = null;
/**
 * Hàm lấy Connection Pool đang hoạt động (Tự động kết nối lại nếu bị ngắt)
 */
const getPool = async () => {
    if (globalPool && globalPool.connected) {
        return globalPool;
    }
    if (connectingPromise) {
        return connectingPromise;
    }
    connectingPromise = (async () => {
        try {
            if (globalPool) {
                try {
                    await globalPool.close();
                }
                catch (_) { }
            }
            const pool = new mssql_1.default.ConnectionPool(dbConfig);
            await pool.connect();
            console.log('✅ [SQL Server] Kết nối cơ sở dữ liệu thành công!');
            globalPool = pool;
            connectingPromise = null;
            return pool;
        }
        catch (err) {
            console.error('❌ [SQL Server] Lỗi kết nối CSDL:', err.message);
            connectingPromise = null;
            globalPool = null;
            throw err;
        }
    })();
    return connectingPromise;
};
exports.getPool = getPool;
// Khởi tạo Promise tương thích ngược cho `await poolPromise`
const poolPromise = {
    then(onfulfilled, onrejected) {
        return (0, exports.getPool)().then(onfulfilled, onrejected);
    },
    catch(onrejected) {
        return (0, exports.getPool)().catch(onrejected);
    }
};
exports.poolPromise = poolPromise;
exports.default = poolPromise;
