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

// Nhập kho dịch vụ
router.post('/nhap-kho', dichVuController.nhapKhoDichVu);

// Sửa phiếu nhập kho
router.put('/phieu-nhap/:id', dichVuController.suaPhieuNhapKho);

// Xóa phiếu nhập kho
router.delete('/phieu-nhap/:id', dichVuController.xoaPhieuNhapKho);

// Lấy danh sách chi tiết dịch vụ đã bán (Chi_Tiet_Dich_Vu)
router.get('/chi-tiet-ban-hang', dichVuController.layDanhSachChiTietDichVu);

// Bán/Thêm dịch vụ vào đơn đặt sân
router.post('/them-vao-don', dichVuController.themDichVuVaoDon);

// Cập nhật số lượng / Thêm / Xóa dịch vụ trong đơn đặt sân
router.post('/cap-nhat-don', dichVuController.capNhatDichVuDon);

// Thêm mới dịch vụ
router.post('/', dichVuController.themDichVu);

// Cập nhật dịch vụ
router.put('/:id', dichVuController.suaDichVu);

// Xóa dịch vụ
router.delete('/:id', dichVuController.xoaDichVu);

module.exports = router;

