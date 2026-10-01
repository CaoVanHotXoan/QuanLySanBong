"use strict";
/**
 * =====================================================================
 * ROUTES: THANH TOÁN (/api/thanh-toan)
 * =====================================================================
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const thanhToanController = __importStar(require("../controllers/thanhToanController"));
const router = express_1.default.Router();
// =====================================================================
// PAYOS VIETQR MB BANK ENDPOINTS
// =====================================================================
// 1. Tạo liên kết và mã VietQR thanh toán PayOS (MB Bank)
router.post('/payos/tao-link', thanhToanController.taoThanhToanPayOS);
// 2. Kiểm tra trạng thái thanh toán từ PayOS (Polling / Xác nhận kết quả)
router.get('/payos/trang-thai/:orderCode', thanhToanController.kiemTraTrangThaiPayOS);
// 3. Webhook nhận thông báo tự động từ PayOS khi MB Bank nhận tiền
router.post('/payos/webhook', thanhToanController.xuLyWebhookPayOS);
// 4. Xác nhận Webhook URL với hệ thống PayOS
router.post('/payos/confirm-webhook', thanhToanController.xacNhanWebhookUrl);
// 5. Hủy đơn đặt sân tạm thời khi đóng modal
router.post('/payos/huy-don-tam', thanhToanController.huyDonTamPayOS);
// =====================================================================
// LỊCH SỬ GIAO DỊCH & QUẢN LÝ HOÀN TIỀN
// =====================================================================
// Lấy danh sách giao dịch thanh toán (Thanh_Toan)
router.get('/danh-sach', thanhToanController.layDanhSachThanhToan);
// Lấy & Quản lý danh sách hoàn tiền / hủy đơn (Lich_Su_Hoan_Tien)
router.get('/hoan-tien', thanhToanController.layDanhSachHoanTien);
router.post('/hoan-tien', thanhToanController.themHoanTien);
router.put('/hoan-tien/:id', thanhToanController.suaHoanTien);
router.delete('/hoan-tien/:id', thanhToanController.xoaHoanTien);
// Thanh toán đơn đặt sân truyền thống
router.post('/', thanhToanController.thanhToanDon);
exports.default = router;
