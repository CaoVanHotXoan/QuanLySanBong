/**
 * =====================================================================
 * MIDDLEWARE XÁC THỰC VÀ PHÂN QUYỀN JWT
 * =====================================================================
 */

import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { AuthRequest, JwtPayload } from '../types';

dotenv.config();

/**
 * Middleware kiểm tra và giải mã Token JWT từ Header
 */
export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = (req.headers['authorization'] || req.headers['Authorization']) as string | undefined;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Không tìm thấy Token xác thực hoặc Token không hợp lệ. Vui lòng đăng nhập!'
            });
        }

        const token = authHeader.split(' ')[1];
        const secretKey = process.env.JWT_SECRET || 'super_secret_jwt_key_qlsanbong_2026';

        // Xác minh Token
        jwt.verify(token, secretKey, (err: any, decoded: any) => {
            if (err) {
                return res.status(403).json({
                    success: false,
                    message: 'Token đã hết hạn hoặc không hợp lệ!'
                });
            }

            // Gắn dữ liệu người dùng đã giải mã vào đối tượng req
            req.user = decoded as JwtPayload; // Chứa: { id, email, vai_tro, ho_ten, ... }
            next();
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi xác thực hệ thống: ' + error.message
        });
    }
};

/**
 * Middleware phân quyền người dùng theo vai trò (Roles)
 * @param  {...string} roles - Danh sách vai trò được phép truy cập (VD: 'ADMIN', 'NHAN_VIEN')
 */
export const authorizeRoles = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.vai_tro)) {
            return res.status(403).json({
                success: false,
                message: `Bạn không có quyền thực hiện hành động này. Yêu cầu quyền: [${roles.join(', ')}]`
            });
        }
        next();
    };
};
