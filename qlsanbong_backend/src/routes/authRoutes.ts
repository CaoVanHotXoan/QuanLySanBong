/**
 * =====================================================================
 * ROUTES: XÁC THỰC & NGƯỜI DÙNG (/api/auth)
 * =====================================================================
 */

import express, { Router } from 'express';
import * as authController from '../controllers/authController';
import { verifyToken } from '../middlewares/authMiddleware';
import { invisibleCaptchaGuard, otpSecurityGuard } from '../middlewares/captchaGuard';

const router: Router = express.Router();

// Đăng ký tài khoản mới (Bảo vệ bởi Captcha ngầm & Anti-Bot Guard)
router.post('/register', invisibleCaptchaGuard, authController.dangKy);

// Đăng nhập (Bảo vệ bởi Captcha ngầm & Anti-Bot Guard)
router.post('/login', invisibleCaptchaGuard, authController.dangNhap);

// Gửi mã OTP qua Gmail (Bảo vệ chống spam/bom OTP bằng OtpSecurityGuard: Rate Limit IP + Cooldown 60s theo Email + Anti-Bot)
router.post('/send-otp', otpSecurityGuard, authController.guiMaOTP);

// Xác thực mã OTP (Chống brute-force dò mã 6 số)
router.post('/verify-otp', invisibleCaptchaGuard, authController.xacThucOTP);

// Đổi mật khẩu tài khoản
router.post('/change-password', authController.doiMatKhau);

// Cập nhật địa chỉ Gmail mới kèm xác thực mã OTP
router.post('/update-email', verifyToken, authController.capNhatEmail);

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
