/**
 * =====================================================================
 * ROUTES: QUẢN LÝ DỊCH VỤ & KHO (/api/dich-vu)
 * =====================================================================
 */

const express = require('express');
const router = express.Router();
const dichVuController = require('../controllers/dichVuController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');

// Lấy danh sách dịch vụ (Dich_Vu)
router.get('/', dichVuController.layDanhSachDichVu);

// Lấy danh sách phiếu nhập kho (Phieu_Nhap_Kho)
router.get('/phieu-nhap', dichVuController.layDanhSachPhieuNhapKho);

// Lấy danh sách chi tiết dịch vụ đã bán (Chi_Tiet_Dich_Vu)
router.get('/chi-tiet-ban-hang', dichVuController.layDanhSachChiTietDichVu);

// Bán/Thêm dịch vụ vào đơn đặt sân (Yêu cầu đăng nhập)
router.post('/them-vao-don', verifyToken, dichVuController.themDichVuVaoDon);

// Nhập kho dịch vụ (Yêu cầu quyền ADMIN hoặc NHAN_VIEN)
router.post('/nhap-kho', verifyToken, authorizeRoles('ADMIN', 'NHAN_VIEN'), dichVuController.nhapKhoDichVu);

// Thêm mới dịch vụ
router.post('/', dichVuController.themDichVu);

// Cập nhật dịch vụ
router.put('/:id', dichVuController.suaDichVu);

// Xóa dịch vụ
router.delete('/:id', dichVuController.xoaDichVu);

module.exports = router;
