/**
 * =====================================================================
 * ROUTES: THANH TOÁN (/api/thanh-toan)
 * =====================================================================
 */

const express = require('express');
const router = express.Router();
const thanhToanController = require('../controllers/thanhToanController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Lấy danh sách giao dịch thanh toán (Thanh_Toan)
router.get('/danh-sach', thanhToanController.layDanhSachThanhToan);

// Lấy danh sách hoàn tiền / hủy đơn (Lich_Su_Hoan_Tien)
router.get('/hoan-tien', thanhToanController.layDanhSachHoanTien);

// Thanh toán đơn đặt sân (Yêu cầu đăng nhập)
router.post('/', verifyToken, thanhToanController.thanhToanDon);

module.exports = router;
