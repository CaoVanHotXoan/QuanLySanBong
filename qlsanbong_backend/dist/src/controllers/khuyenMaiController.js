"use strict";
/**
 * =====================================================================
 * CONTROLLER: QUẢN LÝ KHUYẾN MÃI & VOUCHER ƯU ĐÃI
 * 100% SỬ DỤNG STORED PROCEDURES (SQL SERVER):
 * 1. sp_LayDanhSachVoucherKhaDung
 * 2. sp_KiemTraVaApDungVoucher
 * =====================================================================
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.xoaVoucher = exports.suaVoucher = exports.themVoucher = exports.layDanhSachVoucherAdmin = exports.kiemTraVoucher = exports.layDanhSachVoucher = void 0;
const db_1 = require("../config/db");
/**
 * 1. Lấy danh sách voucher khả dụng (Kèm trạng thái đủ điều kiện theo người dùng)
 * GET /api/khuyen-mai
 */
const layDanhSachVoucher = async (req, res) => {
    try {
        const ma_nguoi_dung = req.user?.id || (req.query.ma_nguoi_dung ? parseInt(String(req.query.ma_nguoi_dung), 10) : null);
        const pool = await db_1.poolPromise;
        const result = await pool.request()
            .input('ma_nguoi_dung', db_1.sql.Int, ma_nguoi_dung)
            .execute('sp_LayDanhSachVoucherKhaDung');
        return res.status(200).json({
            success: true,
            message: 'Lấy danh sách mã ưu đãi thành công!',
            data: result.recordset || []
        });
    }
    catch (error) {
        console.error('Lỗi khi lấy danh sách khuyến mãi:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Không thể tải danh sách khuyến mãi!',
            error: error.message
        });
    }
};
exports.layDanhSachVoucher = layDanhSachVoucher;
/**
 * 2. Kiểm tra tính hợp lệ và tính tiền giảm của Voucher
 * POST /api/khuyen-mai/kiem-tra
 * Body: { ma_code, tong_tien, ngay_da, gio_bat_dau, ma_nguoi_dung }
 */
const kiemTraVoucher = async (req, res) => {
    try {
        const { ma_code, tong_tien, ngay_da, gio_bat_dau } = req.body;
        const ma_nguoi_dung = req.user?.id || req.body.ma_nguoi_dung || null;
        if (!ma_code || String(ma_code).trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp mã khuyến mãi!'
            });
        }
        if (tong_tien === undefined || tong_tien === null) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp tổng tiền đơn hàng!'
            });
        }
        const pool = await db_1.poolPromise;
        const result = await pool.request()
            .input('ma_code', db_1.sql.VarChar(30), String(ma_code).trim())
            .input('ma_nguoi_dung', db_1.sql.Int, ma_nguoi_dung ? parseInt(String(ma_nguoi_dung), 10) : null)
            .input('tong_tien', db_1.sql.Decimal(10, 2), parseFloat(String(tong_tien)))
            .input('ngay_da', db_1.sql.Date, ngay_da || null)
            .input('gio_bat_dau', db_1.sql.VarChar(8), gio_bat_dau ? String(gio_bat_dau).trim() : null)
            .execute('sp_KiemTraVaApDungVoucher');
        const voucherResult = result.recordset && result.recordset[0] ? result.recordset[0] : null;
        if (!voucherResult) {
            return res.status(404).json({
                success: false,
                message: 'Không thể xác thực mã khuyến mãi!'
            });
        }
        return res.status(200).json({
            success: true,
            data: voucherResult
        });
    }
    catch (error) {
        console.error('Lỗi khi kiểm tra mã khuyến mãi:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi kiểm tra mã khuyến mãi!',
            error: error.message
        });
    }
};
exports.kiemTraVoucher = kiemTraVoucher;
/**
 * 3. Lấy danh sách toàn bộ voucher cho Admin (sp_LayDanhSachVoucherAdmin)
 * GET /api/khuyen-mai/admin
 */
const layDanhSachVoucherAdmin = async (req, res) => {
    try {
        const { tu_khoa, trang_thai } = req.query;
        const pool = await db_1.poolPromise;
        const result = await pool.request()
            .input('tu_khoa', db_1.sql.NVarChar(100), tu_khoa ? String(tu_khoa).trim() : null)
            .input('trang_thai', db_1.sql.Int, trang_thai !== undefined && trang_thai !== null && trang_thai !== '' ? parseInt(String(trang_thai), 10) : -1)
            .execute('sp_LayDanhSachVoucherAdmin');
        return res.status(200).json({
            success: true,
            message: 'Lấy danh sách voucher quản trị thành công!',
            data: result.recordset || []
        });
    }
    catch (error) {
        console.error('Lỗi khi lấy danh sách voucher admin:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Không thể tải danh sách voucher!',
            error: error.message
        });
    }
};
exports.layDanhSachVoucherAdmin = layDanhSachVoucherAdmin;
/**
 * 4. Thêm voucher mới (sp_ThemVoucher)
 * POST /api/khuyen-mai
 */
const themVoucher = async (req, res) => {
    try {
        const { ma_code, tieu_de, mo_ta, loai_giam, gia_tri_giam, giam_toi_da, don_toi_thieu, chi_danh_cho_khach_moi, gio_bat_dau, gio_ket_thuc, thu_trong_tuan, so_luong, ngay_bat_dau, ngay_ket_thuc, trang_thai } = req.body;
        if (!ma_code || !tieu_de || gia_tri_giam === undefined || gia_tri_giam === null) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ: Mã code, Tiêu đề và Giá trị giảm!'
            });
        }
        const pool = await db_1.poolPromise;
        const result = await pool.request()
            .input('ma_code', db_1.sql.VarChar(30), String(ma_code).trim().toUpperCase())
            .input('tieu_de', db_1.sql.NVarChar(100), String(tieu_de).trim())
            .input('mo_ta', db_1.sql.NVarChar(255), mo_ta ? String(mo_ta).trim() : null)
            .input('loai_giam', db_1.sql.VarChar(20), loai_giam || 'PHAN_TRAM')
            .input('gia_tri_giam', db_1.sql.Decimal(10, 2), parseFloat(String(gia_tri_giam)))
            .input('giam_toi_da', db_1.sql.Decimal(10, 2), giam_toi_da ? parseFloat(String(giam_toi_da)) : null)
            .input('don_toi_thieu', db_1.sql.Decimal(10, 2), don_toi_thieu ? parseFloat(String(don_toi_thieu)) : 0)
            .input('chi_danh_cho_khach_moi', db_1.sql.Bit, chi_danh_cho_khach_moi ? 1 : 0)
            .input('gio_bat_dau', db_1.sql.VarChar(8), gio_bat_dau || null)
            .input('gio_ket_thuc', db_1.sql.VarChar(8), gio_ket_thuc || null)
            .input('thu_trong_tuan', db_1.sql.VarChar(50), thu_trong_tuan || null)
            .input('so_luong', db_1.sql.Int, (so_luong !== undefined && so_luong !== null && so_luong !== '' && Number(so_luong) > 0) ? parseInt(String(so_luong), 10) : null)
            .input('ngay_bat_dau', db_1.sql.DateTime, ngay_bat_dau || null)
            .input('ngay_ket_thuc', db_1.sql.DateTime, ngay_ket_thuc || null)
            .input('trang_thai', db_1.sql.Bit, trang_thai !== undefined ? (trang_thai ? 1 : 0) : 1)
            .execute('sp_ThemVoucher');
        return res.status(201).json({
            success: true,
            message: '🎉 Thêm voucher mới thành công!',
            data: result.recordset && result.recordset[0] ? result.recordset[0] : null
        });
    }
    catch (error) {
        console.error('Lỗi khi thêm voucher:', error.message);
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi thêm voucher!',
            error: error.message
        });
    }
};
exports.themVoucher = themVoucher;
/**
 * 5. Cập nhật voucher (sp_SuaVoucher)
 * PUT /api/khuyen-mai/:id
 */
const suaVoucher = async (req, res) => {
    try {
        const id = parseInt(String(req.params.id), 10);
        if (!id) {
            return res.status(400).json({ success: false, message: 'ID voucher không hợp lệ!' });
        }
        const { ma_code, tieu_de, mo_ta, loai_giam, gia_tri_giam, giam_toi_da, don_toi_thieu, chi_danh_cho_khach_moi, gio_bat_dau, gio_ket_thuc, thu_trong_tuan, so_luong, ngay_bat_dau, ngay_ket_thuc, trang_thai } = req.body;
        const pool = await db_1.poolPromise;
        const result = await pool.request()
            .input('id', db_1.sql.Int, id)
            .input('ma_code', db_1.sql.VarChar(30), String(ma_code).trim().toUpperCase())
            .input('tieu_de', db_1.sql.NVarChar(100), String(tieu_de).trim())
            .input('mo_ta', db_1.sql.NVarChar(255), mo_ta ? String(mo_ta).trim() : null)
            .input('loai_giam', db_1.sql.VarChar(20), loai_giam || 'PHAN_TRAM')
            .input('gia_tri_giam', db_1.sql.Decimal(10, 2), parseFloat(String(gia_tri_giam)))
            .input('giam_toi_da', db_1.sql.Decimal(10, 2), giam_toi_da ? parseFloat(String(giam_toi_da)) : null)
            .input('don_toi_thieu', db_1.sql.Decimal(10, 2), don_toi_thieu ? parseFloat(String(don_toi_thieu)) : 0)
            .input('chi_danh_cho_khach_moi', db_1.sql.Bit, chi_danh_cho_khach_moi ? 1 : 0)
            .input('gio_bat_dau', db_1.sql.VarChar(8), gio_bat_dau || null)
            .input('gio_ket_thuc', db_1.sql.VarChar(8), gio_ket_thuc || null)
            .input('thu_trong_tuan', db_1.sql.VarChar(50), thu_trong_tuan || null)
            .input('so_luong', db_1.sql.Int, (so_luong !== undefined && so_luong !== null && so_luong !== '' && Number(so_luong) > 0) ? parseInt(String(so_luong), 10) : null)
            .input('ngay_bat_dau', db_1.sql.DateTime, ngay_bat_dau || null)
            .input('ngay_ket_thuc', db_1.sql.DateTime, ngay_ket_thuc || null)
            .input('trang_thai', db_1.sql.Bit, trang_thai !== undefined ? (trang_thai ? 1 : 0) : 1)
            .execute('sp_SuaVoucher');
        return res.status(200).json({
            success: true,
            message: '🎉 Cập nhật thông tin voucher thành công!',
            data: result.recordset && result.recordset[0] ? result.recordset[0] : null
        });
    }
    catch (error) {
        console.error('Lỗi khi sửa voucher:', error.message);
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi sửa voucher!',
            error: error.message
        });
    }
};
exports.suaVoucher = suaVoucher;
/**
 * 6. Xóa / Vô hiệu hóa voucher (sp_XoaVoucher)
 * DELETE /api/khuyen-mai/:id
 */
const xoaVoucher = async (req, res) => {
    try {
        const id = parseInt(String(req.params.id), 10);
        if (!id) {
            return res.status(400).json({ success: false, message: 'ID voucher không hợp lệ!' });
        }
        const pool = await db_1.poolPromise;
        const result = await pool.request()
            .input('id', db_1.sql.Int, id)
            .execute('sp_XoaVoucher');
        const action = result.recordset && result.recordset[0] ? result.recordset[0].action_result : 'COMPLETED';
        return res.status(200).json({
            success: true,
            message: action === 'DEACTIVATED'
                ? 'Voucher đã được dùng trong đơn đặt sân nên hệ thống đã chuyển sang Tạm Khóa (Vô hiệu hóa)!'
                : 'Đã xóa voucher thành công khỏi hệ thống!',
            action
        });
    }
    catch (error) {
        console.error('Lỗi khi xóa voucher:', error.message);
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi xóa voucher!',
            error: error.message
        });
    }
};
exports.xoaVoucher = xoaVoucher;
