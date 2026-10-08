/**
 * =====================================================================
 * CẤU HÌNH KẾT NỐI CƠ SỞ DỮ LIỆU SQL SERVER
 * Tự động kết nối lại (Auto-Reconnect) tương thích mọi môi trường (Local, Render, Vercel Serverless)
 * =====================================================================
 */

import sql, { config as SqlConfig, ConnectionPool } from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig: SqlConfig = {
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

let globalPool: ConnectionPool | null = null;
let connectingPromise: Promise<ConnectionPool> | null = null;

/**
 * Hàm lấy Connection Pool đang hoạt động (Tự động kết nối lại nếu bị ngắt)
 */
export const getPool = async (): Promise<ConnectionPool> => {
    if (globalPool && globalPool.connected) {
        return globalPool;
    }

    if (connectingPromise) {
        return connectingPromise;
    }

    connectingPromise = (async () => {
        try {
            if (globalPool) {
                try { await globalPool.close(); } catch (_) { }
            }
            const pool = new sql.ConnectionPool(dbConfig);
            await pool.connect();
            console.log('✅ [SQL Server] Kết nối cơ sở dữ liệu thành công!');
            globalPool = pool;
            connectingPromise = null;
            return pool;
        } catch (err: any) {
            console.error('❌ [SQL Server] Lỗi kết nối CSDL:', err.message);
            connectingPromise = null;
            globalPool = null;
            throw err;
        }
    })();

    return connectingPromise;
};

// Khởi tạo Promise tương thích ngược cho `await poolPromise`
const poolPromise: Promise<ConnectionPool> = {
    then(onfulfilled, onrejected) {
        return getPool().then(onfulfilled, onrejected);
    },
    catch(onrejected) {
        return getPool().catch(onrejected);
    }
} as any;

export { sql, poolPromise };
export default poolPromise;
