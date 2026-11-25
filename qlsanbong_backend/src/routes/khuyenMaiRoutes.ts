/**
 * =====================================================================
 * ROUTES: KHUYẾN MÃI & VOUCHER (/api/khuyen-mai)
 * =====================================================================
 */

import { Router, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, JwtPayload } from '../types';
import * as khuyenMaiController from '../controllers/khuyenMaiController';

const router = Router();

// Middleware xác thực mềm (optional token: nếu có token thì gán req.user, nếu không có thì vẫn cho qua)
const optionalVerifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = (req.headers['authorization'] || req.headers['Authorization']) as string | undefined;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const secretKey = process.env.JWT_SECRET || 'super_secret_jwt_key_qlsanbong_2026';
            try {
                const decoded = jwt.verify(token, secretKey);
                req.user = decoded as JwtPayload;
            } catch {
                // Token không hợp lệ thì bỏ qua, coi như khách vãng lai
            }
        }
        next();
    } catch {
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

export default router;
