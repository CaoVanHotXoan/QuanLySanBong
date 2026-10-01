/**
 * =====================================================================
 * ROUTES: THANH TOÁN (/api/thanh-toan)
 * =====================================================================
 */

import express, { Router } from 'express';
import * as thanhToanController from '../controllers/thanhToanController';

const router: Router = express.Router();

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

export default router;
