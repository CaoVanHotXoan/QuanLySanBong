/**
 * =====================================================================
 * ROUTES: XÁC THỰC & NGƯỜI DÙNG (/api/auth)
 * =====================================================================
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Đăng ký tài khoản mới
router.post('/register', authController.dangKy);

// Đăng nhập
router.post('/login', authController.dangNhap);

// Lấy thông tin cá nhân (Cần đăng nhập)
router.get('/profile', verifyToken, authController.layThongTinCaNhan);

module.exports = router;
