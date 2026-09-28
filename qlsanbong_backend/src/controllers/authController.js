/**
 * =====================================================================
 * CONTROLLER: XÁC THỰC VÀ TÀI KHOẢN (AUTH CONTROLLER)
 * Thực thi các Stored Procedure: sp_ThemNguoiDung, sp_DangNhap, sp_LayThongTinNguoiDung
 * =====================================================================
 */

const { sql, poolPromise } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * 1. Đăng ký tài khoản người dùng mới
 * Method: POST /api/auth/register
 */
const dangKy = async (req, res) => {
    try {
        const { ho_ten, email, so_dien_thoai, mat_khau, vai_tro } = req.body;

        if (!ho_ten || !email || !mat_khau) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ: Họ tên, Email và Mật khẩu!'
            });
        }

        // Mã hóa mật khẩu bằng bcryptjs
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(mat_khau, salt);

        // Kết nối pool và thực thi Stored Procedure sp_ThemNguoiDung
        const pool = await poolPromise;
        const result = await pool.request()
            .input('ho_ten', sql.NVarChar(100), ho_ten)
            .input('email', sql.VarChar(255), email)
            .input('so_dien_thoai', sql.VarChar(15), so_dien_thoai || null)
            .input('mat_khau', sql.VarChar(255), hashedPassword)
            .input('vai_tro', sql.VarChar(20), vai_tro || 'KHACH_HANG')
            .execute('sp_ThemNguoiDung');

        const newUser = result.recordset[0];

        return res.status(201).json({
            success: true,
            message: 'Đăng ký tài khoản thành công!',
            data: newUser
        });
    } catch (error) {
        console.error('Lỗi sp_ThemNguoiDung:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi đăng ký tài khoản'
        });
    }
};

/**
 * 2. Đăng nhập tài khoản
 * Method: POST /api/auth/login
 */
const dangNhap = async (req, res) => {
    try {
        const { email, mat_khau } = req.body;

        if (!email || !mat_khau) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập đầy đủ Email và Mật khẩu!'
            });
        }

        // Thực thi Stored Procedure sp_DangNhap
        const pool = await poolPromise;
        const result = await pool.request()
            .input('email', sql.VarChar(255), email)
            .execute('sp_DangNhap');

        const user = result.recordset[0];
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Email hoặc mật khẩu không chính xác!'
            });
        }

        // So khớp mật khẩu đã mã hóa
        const isMatch = await bcrypt.compare(mat_khau, user.mat_khau);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Email hoặc mật khẩu không chính xác!'
            });
        }

        // Tạo JWT Token
        const payload = {
            id: user.id,
            email: user.email,
            ho_ten: user.ho_ten,
            vai_tro: user.vai_tro
        };

        const secretKey = process.env.JWT_SECRET || 'super_secret_jwt_key_qlsanbong_2026';
        const token = jwt.sign(payload, secretKey, {
            expiresIn: process.env.JWT_EXPIRES_IN || '7d'
        });

        // Ẩn mật khẩu khi trả về client
        delete user.mat_khau;

        return res.status(200).json({
            success: true,
            message: 'Đăng nhập thành công!',
            token,
            data: user
        });
    } catch (error) {
        console.error('Lỗi sp_DangNhap:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi đăng nhập'
        });
    }
};

/**
 * 3. Lấy thông tin cá nhân (Profile)
 * Method: GET /api/auth/profile
 */
const layThongTinCaNhan = async (req, res) => {
    try {
        const ma_nguoi_dung = req.user.id;

        const pool = await poolPromise;
        const result = await pool.request()
            .input('ma_nguoi_dung', sql.Int, ma_nguoi_dung)
            .execute('sp_LayThongTinNguoiDung');

        const user = result.recordset[0];

        return res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Lỗi sp_LayThongTinNguoiDung:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi lấy thông tin người dùng'
        });
    }
};

module.exports = {
    dangKy,
    dangNhap,
    layThongTinCaNhan
};
