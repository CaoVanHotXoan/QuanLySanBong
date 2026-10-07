"use strict";
/**
 * =====================================================================
 * SERVICE: XÁC THỰC & QUẢN LÝ NGƯỜI DÙNG (AUTH SERVICE)
 * Xử lý tài khoản, mã hóa mật khẩu, JWT token và Stored Procedures
 * =====================================================================
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.layThongTinNguoiDungTheoId = exports.layDanhSachNguoiDung = exports.dangKyNguoiDung = exports.generateJwtToken = exports.comparePassword = exports.hashPassword = void 0;
const db_1 = require("../config/db");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const hashPassword = async (plainText) => {
    const salt = await bcryptjs_1.default.genSalt(10);
    return await bcryptjs_1.default.hash(plainText, salt);
};
exports.hashPassword = hashPassword;
const comparePassword = async (plainText, hash) => {
    return await bcryptjs_1.default.compare(plainText, hash);
};
exports.comparePassword = comparePassword;
const generateJwtToken = (user) => {
    const secret = process.env.JWT_SECRET || 'quanlysanbong_super_secret_key_2026';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    return jsonwebtoken_1.default.sign({
        id: user.id,
        email: user.email,
        vai_tro: user.vai_tro,
        ho_ten: user.ho_ten
    }, secret, { expiresIn });
};
exports.generateJwtToken = generateJwtToken;
const dangKyNguoiDung = async (userData) => {
    const pool = await db_1.poolPromise;
    const hashedPassword = await (0, exports.hashPassword)(userData.mat_khau);
    const normalizedEmail = userData.email.toLowerCase().trim();
    try {
        const result = await pool.request()
            .input('ho_ten', db_1.sql.NVarChar(100), userData.ho_ten.trim())
            .input('email', db_1.sql.VarChar(255), normalizedEmail)
            .input('so_dien_thoai', db_1.sql.VarChar(15), userData.so_dien_thoai || null)
            .input('mat_khau', db_1.sql.VarChar(255), hashedPassword)
            .input('vai_tro', db_1.sql.VarChar(20), userData.vai_tro || 'KHACH_HANG')
            .execute('sp_ThemNguoiDung');
        const newUser = result.recordset[0];
        if (newUser && userData.anh_dai_dien) {
            await pool.request()
                .input('id', db_1.sql.Int, newUser.id)
                .input('anh', db_1.sql.VarChar(255), userData.anh_dai_dien)
                .query(`UPDATE Nguoi_Dung SET anh_dai_dien = @anh WHERE id = @id`);
            newUser.anh_dai_dien = userData.anh_dai_dien;
        }
        return newUser;
    }
    catch (err) {
        // Fallback trực tiếp nếu SP gặp lỗi
        let vaiTroId = 3;
        if (userData.vai_tro) {
            const vtRes = await pool.request()
                .input('ten', db_1.sql.NVarChar(50), userData.vai_tro)
                .query(`SELECT MaVaiTro FROM Vai_Tro WHERE TenVaiTro = @ten`);
            if (vtRes.recordset.length > 0)
                vaiTroId = vtRes.recordset[0].MaVaiTro;
        }
        const insRes = await pool.request()
            .input('ho_ten', db_1.sql.NVarChar(100), userData.ho_ten.trim())
            .input('email', db_1.sql.VarChar(255), normalizedEmail)
            .input('so_dien_thoai', db_1.sql.VarChar(15), userData.so_dien_thoai || null)
            .input('mat_khau', db_1.sql.VarChar(255), hashedPassword)
            .input('MaVaiTro', db_1.sql.Int, vaiTroId)
            .input('anh_dai_dien', db_1.sql.VarChar(255), userData.anh_dai_dien || null)
            .query(`
                INSERT INTO Nguoi_Dung (ho_ten, email, so_dien_thoai, mat_khau, MaVaiTro, anh_dai_dien)
                OUTPUT INSERTED.id, INSERTED.ho_ten, INSERTED.email, INSERTED.so_dien_thoai, INSERTED.MaVaiTro, INSERTED.anh_dai_dien
                VALUES (@ho_ten, @email, @so_dien_thoai, @mat_khau, @MaVaiTro, @anh_dai_dien)
            `);
        return { ...insRes.recordset[0], vai_tro: userData.vai_tro || 'KHACH_HANG' };
    }
};
exports.dangKyNguoiDung = dangKyNguoiDung;
const layDanhSachNguoiDung = async () => {
    const pool = await db_1.poolPromise;
    try {
        const result = await pool.request().execute('sp_LayDanhSachNguoiDung');
        return result.recordset || [];
    }
    catch (e) {
        const queryRes = await pool.request().query(`
            SELECT nd.id, nd.ho_ten, nd.email, nd.so_dien_thoai, nd.MaVaiTro, vt.TenVaiTro AS vai_tro, nd.anh_dai_dien, nd.ngay_tao
            FROM Nguoi_Dung nd
            LEFT JOIN Vai_Tro vt ON nd.MaVaiTro = vt.MaVaiTro
            ORDER BY nd.id DESC
        `);
        return queryRes.recordset || [];
    }
};
exports.layDanhSachNguoiDung = layDanhSachNguoiDung;
const layThongTinNguoiDungTheoId = async (id) => {
    const pool = await db_1.poolPromise;
    try {
        const result = await pool.request()
            .input('id', db_1.sql.Int, id)
            .execute('sp_LayThongTinNguoiDung');
        return result.recordset && result.recordset[0];
    }
    catch (e) {
        const queryRes = await pool.request()
            .input('id', db_1.sql.Int, id)
            .query(`
                SELECT nd.id, nd.ho_ten, nd.email, nd.so_dien_thoai, nd.MaVaiTro, vt.TenVaiTro AS vai_tro, nd.anh_dai_dien, nd.ngay_tao
                FROM Nguoi_Dung nd
                LEFT JOIN Vai_Tro vt ON nd.MaVaiTro = vt.MaVaiTro
                WHERE nd.id = @id
            `);
        return queryRes.recordset && queryRes.recordset[0];
    }
};
exports.layThongTinNguoiDungTheoId = layThongTinNguoiDungTheoId;
