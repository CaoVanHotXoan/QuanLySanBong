/**
 * =====================================================================
 * ROUTES: QUẢN LÝ ĐẶT SÂN (/api/dat-san)
 * =====================================================================
 */

const express = require('express');
const router = express.Router();
const datSanController = require('../controllers/datSanController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Lấy danh sách sân bóng (sp_LayDanhSachSan)
router.get('/danh-sach-san', datSanController.layDanhSachSan);

// Lấy danh sách loại sân
router.get('/loai-san', datSanController.layDanhSachLoaiSan);

// Thêm, sửa, xóa sân bóng
router.post('/san-bong', datSanController.themSanBong);
router.put('/san-bong/:id', datSanController.suaSanBong);
router.delete('/san-bong/:id', datSanController.xoaSanBong);

// Lấy danh sách khung giờ giá
router.get('/khung-gio-gia', datSanController.layKhungGioGia);
router.post('/khung-gio-gia', datSanController.themKhungGioGia);
router.put('/khung-gio-gia/:id', datSanController.suaKhungGioGia);
router.delete('/khung-gio-gia/:id', datSanController.xoaKhungGioGia);

// Lấy tất cả đơn đặt sân (Cho trang Admin Dashboard)
router.get('/tat-ca-don', datSanController.layTatCaDonDat);

// Lấy lịch đặt sân theo ngày
router.get('/lich-san', datSanController.layLichSan);

// Đặt sân bóng (sp_DatSan)
router.post('/', datSanController.datSan);

// Hủy đơn đặt sân và hoàn cọc (sp_HuyDonVaHoanCoc)
router.post('/huy-don', datSanController.huyDonVaHoanCoc);

module.exports = router;
