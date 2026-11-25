"use strict";
/**
 * =====================================================================
 * ROUTES: KHUYẾN MÃI & VOUCHER (/api/khuyen-mai)
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
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const khuyenMaiController = __importStar(require("../controllers/khuyenMaiController"));
const router = (0, express_1.Router)();
// Middleware xác thực mềm (optional token: nếu có token thì gán req.user, nếu không có thì vẫn cho qua)
const optionalVerifyToken = (req, res, next) => {
    try {
        const authHeader = (req.headers['authorization'] || req.headers['Authorization']);
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const secretKey = process.env.JWT_SECRET || 'super_secret_jwt_key_qlsanbong_2026';
            try {
                const decoded = jsonwebtoken_1.default.verify(token, secretKey);
                req.user = decoded;
            }
            catch {
                // Token không hợp lệ thì bỏ qua, coi như khách vãng lai
            }
        }
        next();
    }
    catch {
        next();
    }
};
// 1. Lấy danh sách voucher khả dụng cho khách hàng
router.get('/', optionalVerifyToken, khuyenMaiController.layDanhSachVoucher);
// 2. Kiểm tra tính hợp lệ và tính tiền giảm của voucher
router.post('/kiem-tra', optionalVerifyToken, khuyenMaiController.kiemTraVoucher);
// 3. Quản lý Voucher cho Admin (CRUD)
router.get('/admin', optionalVerifyToken, khuyenMaiController.layDanhSachVoucherAdmin);
router.post('/', optionalVerifyToken, khuyenMaiController.themVoucher);
router.put('/:id', optionalVerifyToken, khuyenMaiController.suaVoucher);
router.delete('/:id', optionalVerifyToken, khuyenMaiController.xoaVoucher);
exports.default = router;
