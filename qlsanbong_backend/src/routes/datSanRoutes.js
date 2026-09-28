/**
 * =====================================================================
 * ROUTES: QUẢN LÝ ĐẶT SÂN (/api/dat-san)
 * =====================================================================
 */

const express = require('express');
const router = express.Router();
const datSanController = require('../controllers/datSanController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Lấy danh sách sân bóng
router.get('/danh-sach-san', datSanController.layDanhSachSan);

// Lấy lịch đặt sân theo ngày
router.get('/lich-san', datSanController.layLichSan);

// Đặt sân bóng (Yêu cầu đăng nhập)
router.post('/', verifyToken, datSanController.datSan);

// Hủy đơn đặt sân và hoàn cọc (Yêu cầu đăng nhập)
router.post('/huy-don', verifyToken, datSanController.huyDonVaHoanCoc);

module.exports = router;
