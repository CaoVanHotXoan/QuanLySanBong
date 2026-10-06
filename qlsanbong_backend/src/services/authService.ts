/**
 * =====================================================================
 * SERVICE: XÁC THỰC & QUẢN LÝ NGƯỜI DÙNG (AUTH SERVICE)
 * Xử lý tài khoản, mã hóa mật khẩu, JWT token và Stored Procedures
 * =====================================================================
 */

import { sql, poolPromise } from '../config/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const hashPassword = async (plainText: string): Promise<string> => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(plainText, salt);
};

export const comparePassword = async (plainText: string, hash: string): Promise<boolean> => {
    return await bcrypt.compare(plainText, hash);
};

export const generateJwtToken = (user: { id: number; email: string; vai_tro: string; ho_ten?: string }): string => {
    const secret = process.env.JWT_SECRET || 'quanlysanbong_super_secret_key_2026';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            vai_tro: user.vai_tro,
            ho_ten: user.ho_ten
        },
        secret,
        { expiresIn } as any
    );
};

export const dangKyNguoiDung = async (userData: {
    ho_ten: string;
    email: string;
    so_dien_thoai?: string;
    mat_khau: string;
    vai_tro?: string;
    anh_dai_dien?: string;
}) => {
    const pool = await poolPromise;
    const hashedPassword = await hashPassword(userData.mat_khau);
    const normalizedEmail = userData.email.toLowerCase().trim();

    try {
        const result = await pool.request()
            .input('ho_ten', sql.NVarChar(100), userData.ho_ten.trim())
            .input('email', sql.VarChar(255), normalizedEmail)
            .input('so_dien_thoai', sql.VarChar(15), userData.so_dien_thoai || null)
            .input('mat_khau', sql.VarChar(255), hashedPassword)
            .input('vai_tro', sql.VarChar(20), userData.vai_tro || 'KHACH_HANG')
            .execute('sp_ThemNguoiDung');

        const newUser = result.recordset[0];
        if (newUser && userData.anh_dai_dien) {
            await pool.request()
                .input('id', sql.Int, newUser.id)
                .input('anh', sql.VarChar(255), userData.anh_dai_dien)
                .query(`UPDATE Nguoi_Dung SET anh_dai_dien = @anh WHERE id = @id`);
            newUser.anh_dai_dien = userData.anh_dai_dien;
        }
        return newUser;
    } catch (err: any) {
        // Fallback trực tiếp nếu SP gặp lỗi
        let vaiTroId = 3;
        if (userData.vai_tro) {
            const vtRes = await pool.request()
                .input('ten', sql.NVarChar(50), userData.vai_tro)
                .query(`SELECT MaVaiTro FROM Vai_Tro WHERE TenVaiTro = @ten`);
            if (vtRes.recordset.length > 0) vaiTroId = vtRes.recordset[0].MaVaiTro;
        }

        const insRes = await pool.request()
            .input('ho_ten', sql.NVarChar(100), userData.ho_ten.trim())
            .input('email', sql.VarChar(255), normalizedEmail)
            .input('so_dien_thoai', sql.VarChar(15), userData.so_dien_thoai || null)
            .input('mat_khau', sql.VarChar(255), hashedPassword)
            .input('MaVaiTro', sql.Int, vaiTroId)
            .input('anh_dai_dien', sql.VarChar(255), userData.anh_dai_dien || null)
            .query(`
                INSERT INTO Nguoi_Dung (ho_ten, email, so_dien_thoai, mat_khau, MaVaiTro, anh_dai_dien)
                OUTPUT INSERTED.id, INSERTED.ho_ten, INSERTED.email, INSERTED.so_dien_thoai, INSERTED.MaVaiTro, INSERTED.anh_dai_dien
                VALUES (@ho_ten, @email, @so_dien_thoai, @mat_khau, @MaVaiTro, @anh_dai_dien)
            `);

        return { ...insRes.recordset[0], vai_tro: userData.vai_tro || 'KHACH_HANG' };
    }
};

export const layDanhSachNguoiDung = async () => {
    const pool = await poolPromise;
    try {
        const result = await pool.request().execute('sp_LayDanhSachNguoiDung');
        return result.recordset || [];
    } catch (e) {
        const queryRes = await pool.request().query(`
            SELECT nd.id, nd.ho_ten, nd.email, nd.so_dien_thoai, nd.MaVaiTro, vt.TenVaiTro AS vai_tro, nd.anh_dai_dien, nd.ngay_tao
            FROM Nguoi_Dung nd
            LEFT JOIN Vai_Tro vt ON nd.MaVaiTro = vt.MaVaiTro
            ORDER BY nd.id DESC
        `);
        return queryRes.recordset || [];
    }
};

export const layThongTinNguoiDungTheoId = async (id: number) => {
    const pool = await poolPromise;
    try {
        const result = await pool.request()
            .input('id', sql.Int, id)
            .execute('sp_LayThongTinNguoiDung');
        return result.recordset && result.recordset[0];
    } catch (e) {
        const queryRes = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT nd.id, nd.ho_ten, nd.email, nd.so_dien_thoai, nd.MaVaiTro, vt.TenVaiTro AS vai_tro, nd.anh_dai_dien, nd.ngay_tao
                FROM Nguoi_Dung nd
                LEFT JOIN Vai_Tro vt ON nd.MaVaiTro = vt.MaVaiTro
                WHERE nd.id = @id
            `);
        return queryRes.recordset && queryRes.recordset[0];
    }
};
