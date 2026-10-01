/**
 * =====================================================================
 * CẤU HÌNH KẾT NỐI CỔNG THANH TOÁN PAYOS (VIETQR - NGÂN HÀNG MB BANK)
 * =====================================================================
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const PayOSPackage = require('@payos/node');
const PayOS = PayOSPackage.PayOS || PayOSPackage.default || PayOSPackage;
import dotenv from 'dotenv';

dotenv.config();

const clientId = process.env.PAYOS_CLIENT_ID || process.env['Client ID'] || '6424a5ae-d73c-4e93-af5b-3ad23eb8f5bc';
const apiKey = process.env.PAYOS_API_KEY || process.env['API Key'] || '9da5acca-df02-44dc-b455-437b0efc16ec';
const checksumKey = process.env.PAYOS_CHECKSUM_KEY || process.env['Checksum Key'] || 'dda97d7fdc0090f5004e327287f606bc422dae64e2eadd5f9716da8d5f7a79a5';

let payOS: any = null;

try {
    payOS = new PayOS(clientId.trim(), apiKey.trim(), checksumKey.trim());
    console.log('✅ [PayOS]: Khởi tạo cấu hình PayOS (VietQR MB Bank - CAO VAN HOT XOAN) thành công!');
} catch (error: any) {
    console.error('❌ [PayOS]: Lỗi khởi tạo PayOS:', error.message);
}

export default payOS;
