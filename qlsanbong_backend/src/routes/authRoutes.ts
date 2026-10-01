/**
 * =====================================================================
 * ROUTES: XÁC THỰC & NGƯỜI DÙNG (/api/auth)
 * =====================================================================
 */

import express, { Router } from 'express';
import * as authController from '../controllers/authController';
import { verifyToken } from '../middlewares/authMiddleware';

const router: Router = express.Router();

// Đăng ký tài khoản mới
router.post('/register', authController.dangKy);

// Đăng nhập
router.post('/login', authController.dangNhap);

// Lấy thông tin tài khoản hiện tại (Profile / Me)
router.get('/profile', verifyToken, authController.layThongTinCaNhan);
router.get('/me', verifyToken, authController.layThongTinCaNhan);

// Lấy danh sách người dùng
router.get('/users', authController.layDanhSachNguoiDung);

// Tạo người dùng mới
router.post('/users', authController.dangKy);

// Cập nhật người dùng
router.put('/users/:id', authController.suaNguoiDung);

// Xóa người dùng
router.delete('/users/:id', authController.xoaNguoiDung);

// Lấy danh sách vai trò (Vai_Tro)
router.get('/vai-tro', authController.layDanhSachVaiTro);

// Thêm vai trò mới
router.post('/vai-tro', authController.themVaiTro);

// Cập nhật vai trò
router.put('/vai-tro/:id', authController.suaVaiTro);

// Xóa vai trò
router.delete('/vai-tro/:id', authController.xoaVaiTro);

export default router;
