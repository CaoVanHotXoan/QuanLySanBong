/**
 * =====================================================================
 * ROUTES: QUẢN LÝ DỊCH VỤ & KHO (/api/dich-vu)
 * =====================================================================
 */

const express = require('express');
const router = express.Router();
const dichVuController = require('../controllers/dichVuController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');

// Lấy danh sách dịch vụ
router.get('/', dichVuController.layDanhSachDichVu);

// Bán/Thêm dịch vụ vào đơn đặt sân (Yêu cầu đăng nhập)
router.post('/them-vao-don', verifyToken, dichVuController.themDichVuVaoDon);

// Nhập kho dịch vụ (Yêu cầu quyền ADMIN hoặc NHAN_VIEN)
router.post('/nhap-kho', verifyToken, authorizeRoles('ADMIN', 'NHAN_VIEN'), dichVuController.nhapKhoDichVu);

module.exports = router;
