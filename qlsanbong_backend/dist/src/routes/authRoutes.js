"use strict";
/**
 * =====================================================================
 * ROUTES: XÁC THỰC & NGƯỜI DÙNG (/api/auth)
 * =====================================================================
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController = __importStar(require("../controllers/authController"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const captchaGuard_1 = require("../middlewares/captchaGuard");
const router = express_1.default.Router();
// Đăng ký tài khoản mới (Bảo vệ bởi Captcha ngầm & Anti-Bot Guard)
router.post('/register', captchaGuard_1.invisibleCaptchaGuard, authController.dangKy);
// Đăng nhập (Bảo vệ bởi Captcha ngầm & Anti-Bot Guard)
router.post('/login', captchaGuard_1.invisibleCaptchaGuard, authController.dangNhap);
// Lấy thông tin tài khoản hiện tại (Profile / Me)
router.get('/profile', authMiddleware_1.verifyToken, authController.layThongTinCaNhan);
router.get('/me', authMiddleware_1.verifyToken, authController.layThongTinCaNhan);
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
exports.default = router;
