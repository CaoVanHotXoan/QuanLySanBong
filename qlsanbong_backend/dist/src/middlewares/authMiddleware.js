"use strict";
/**
 * =====================================================================
 * MIDDLEWARE XÁC THỰC VÀ PHÂN QUYỀN JWT
 * =====================================================================
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = exports.verifyToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
/**
 * Middleware kiểm tra và giải mã Token JWT từ Header
 */
const verifyToken = (req, res, next) => {
    try {
        const authHeader = (req.headers['authorization'] || req.headers['Authorization']);
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Không tìm thấy Token xác thực hoặc Token không hợp lệ. Vui lòng đăng nhập!'
            });
        }
        const token = authHeader.split(' ')[1];
        const secretKey = process.env.JWT_SECRET || 'super_secret_jwt_key_qlsanbong_2026';
        // Xác minh Token
        jsonwebtoken_1.default.verify(token, secretKey, (err, decoded) => {
            if (err) {
                return res.status(403).json({
                    success: false,
                    message: 'Token đã hết hạn hoặc không hợp lệ!'
                });
            }
            // Gắn dữ liệu người dùng đã giải mã vào đối tượng req
            req.user = decoded; // Chứa: { id, email, vai_tro, ho_ten, ... }
            next();
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi xác thực hệ thống: ' + error.message
        });
    }
};
exports.verifyToken = verifyToken;
/**
 * Middleware phân quyền người dùng theo vai trò (Roles)
 * @param  {...string} roles - Danh sách vai trò được phép truy cập (VD: 'ADMIN', 'NHAN_VIEN')
 */
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.vai_tro)) {
            return res.status(403).json({
                success: false,
                message: `Bạn không có quyền thực hiện hành động này. Yêu cầu quyền: [${roles.join(', ')}]`
            });
        }
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
