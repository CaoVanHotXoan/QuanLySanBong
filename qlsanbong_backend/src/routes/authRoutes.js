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

// Lấy danh sách người dùng
router.get('/users', authController.layDanhSachNguoiDung);

// Tạo người dùng mới
router.post('/users', authController.dangKy);

// Cập nhật người dùng
router.put('/users/:id', authController.suaNguoiDung);

// Lấy danh sách vai trò (Vai_Tro)
router.get('/vai-tro', authController.layDanhSachVaiTro);

// Thêm vai trò mới
router.post('/vai-tro', authController.themVaiTro);

// Cập nhật vai trò
router.put('/vai-tro/:id', authController.suaVaiTro);

module.exports = router;
