"use strict";
/**
 * =====================================================================
 * CONTROLLER: QUẢN LÝ DỊCH VỤ & KHO HÀNG (DICH VU CONTROLLER)
 * 100% SỬ DỤNG STORED PROCEDURES (SQL SERVER):
 * 1. sp_LayDanhSachDichVu
 * 2. sp_ThemDichVuMoi
 * 3. sp_SuaDichVu
 * 4. sp_XoaDichVu
 * 5. sp_ThemDichVu (vào đơn đặt sân - Mini POS)
 * 6. sp_NhapKhoDichVu
 * =====================================================================
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.capNhatDichVuDon = exports.xoaPhieuNhapKho = exports.suaPhieuNhapKho = exports.layDanhSachChiTietDichVu = exports.layDanhSachPhieuNhapKho = exports.nhapKhoDichVu = exports.themDichVuVaoDon = exports.xoaDichVu = exports.suaDichVu = exports.themDichVu = exports.layDanhSachDichVu = void 0;
const db_1 = require("../config/db");
/**
 * 1. Lấy danh sách tất cả dịch vụ (Nước uống, phụ kiện, thuê đồ...)
 * Method: GET /api/dich-vu
 * Procedure: sp_LayDanhSachDichVu
 */
const layDanhSachDichVu = async (req, res) => {
    try {
        const pool = await db_1.poolPromise;
        const result = await pool.request()
            .execute('sp_LayDanhSachDichVu');
        return res.status(200).json({
            success: true,
            data: result.recordset
        });
    }
    catch (error) {
        console.error('Lỗi sp_LayDanhSachDichVu:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi lấy danh sách dịch vụ'
        });
    }
};
exports.layDanhSachDichVu = layDanhSachDichVu;
/**
 * 2. Thêm mới mặt hàng dịch vụ
 * Method: POST /api/dich-vu
 * Procedure: sp_ThemDichVuMoi
 */
const themDichVu = async (req, res) => {
    try {
        const { ten_dich_vu, don_gia, don_vi_tinh, ton_kho } = req.body;
        if (!ten_dich_vu || !don_gia || !don_vi_tinh) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ: Tên dịch vụ, Đơn giá và Đơn vị tính!'
            });
        }
        const pool = await db_1.poolPromise;
        const result = await pool.request()
            .input('ten_dich_vu', db_1.sql.NVarChar(100), ten_dich_vu)
            .input('don_gia', db_1.sql.Decimal(10, 2), parseFloat(don_gia))
            .input('don_vi_tinh', db_1.sql.NVarChar(20), don_vi_tinh)
            .input('ton_kho', db_1.sql.Int, ton_kho ? parseInt(ton_kho, 10) : 0)
            .execute('sp_ThemDichVuMoi');
        return res.status(201).json({
            success: true,
            message: 'Thêm dịch vụ mới thành công!',
            data: result.recordset[0]
        });
    }
    catch (error) {
        console.error('Lỗi sp_ThemDichVuMoi:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi thêm dịch vụ'
        });
    }
};
exports.themDichVu = themDichVu;
/**
 * 3. Cập nhật thông tin dịch vụ
 * Method: PUT /api/dich-vu/:id
 * Procedure: sp_SuaDichVu
 */
const suaDichVu = async (req, res) => {
    try {
        const id = String(req.params.id);
        const { ten_dich_vu, don_gia, don_vi_tinh, ton_kho } = req.body;
        const pool = await db_1.poolPromise;
        const result = await pool.request()
            .input('id', db_1.sql.Int, parseInt(id, 10))
            .input('ten_dich_vu', db_1.sql.NVarChar(100), ten_dich_vu)
            .input('don_gia', db_1.sql.Decimal(10, 2), parseFloat(don_gia))
            .input('don_vi_tinh', db_1.sql.NVarChar(20), don_vi_tinh)
            .input('ton_kho', db_1.sql.Int, parseInt(ton_kho, 10))
            .execute('sp_SuaDichVu');
        return res.status(200).json({
            success: true,
            message: 'Cập nhật dịch vụ thành công!',
            data: result.recordset[0]
        });
    }
    catch (error) {
        console.error('Lỗi sp_SuaDichVu:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi cập nhật dịch vụ'
        });
    }
};
exports.suaDichVu = suaDichVu;
/**
 * 4. Xóa dịch vụ
 * Method: DELETE /api/dich-vu/:id
 * Procedure: sp_XoaDichVu
 */
const xoaDichVu = async (req, res) => {
    try {
        const id = String(req.params.id);
        const pool = await db_1.poolPromise;
        await pool.request()
            .input('id', db_1.sql.Int, parseInt(id, 10))
            .execute('sp_XoaDichVu');
        return res.status(200).json({
            success: true,
            message: 'Xóa dịch vụ thành công!'
        });
    }
    catch (error) {
        console.error('Lỗi sp_XoaDichVu:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi xóa dịch vụ'
        });
    }
};
exports.xoaDichVu = xoaDichVu;
/**
 * 5. Thêm dịch vụ / Bán dịch vụ vào đơn đặt sân (Mini POS)
 * Method: POST /api/dich-vu/them-vao-don
 * Procedure: sp_ThemDichVu
 */
const themDichVuVaoDon = async (req, res) => {
    try {
        const { ma_don_dat } = req.body;
        if (!ma_don_dat) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp ma_don_dat!'
            });
        }
        let items = [];
        if (Array.isArray(req.body.dich_vu_list) && req.body.dich_vu_list.length > 0) {
            items = req.body.dich_vu_list;
        }
        else if (req.body.ma_dich_vu && req.body.so_luong) {
            items = [{ ma_dich_vu: req.body.ma_dich_vu, so_luong: req.body.so_luong }];
        }
        if (items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp ma_dich_vu và so_luong!'
            });
        }
        const pool = await db_1.poolPromise;
        let lastResult = null;
        for (const item of items) {
            const result = await pool.request()
                .input('ma_don_dat', db_1.sql.Int, parseInt(ma_don_dat, 10))
                .input('ma_dich_vu', db_1.sql.Int, parseInt(item.ma_dich_vu, 10))
                .input('so_luong', db_1.sql.Int, parseInt(item.so_luong, 10))
                .execute('sp_ThemDichVu');
            lastResult = result.recordset[0];
        }
        return res.status(200).json({
            success: true,
            message: 'Thêm dịch vụ vào đơn đặt sân thành công!',
            data: lastResult
        });
    }
    catch (error) {
        console.error('Lỗi sp_ThemDichVu:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi thêm dịch vụ vào đơn'
        });
    }
};
exports.themDichVuVaoDon = themDichVuVaoDon;
/**
 * 6. Nhập kho dịch vụ
 * Method: POST /api/dich-vu/nhap-kho
 * Procedure: sp_NhapKhoDichVu
 */
const nhapKhoDichVu = async (req, res) => {
    try {
        const { ma_dich_vu, so_luong_nhap, gia_nhap } = req.body;
        if (!ma_dich_vu || !so_luong_nhap || !gia_nhap) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ: ma_dich_vu, so_luong_nhap, gia_nhap!'
            });
        }
        const pool = await db_1.poolPromise;
        const result = await pool.request()
            .input('ma_dich_vu', db_1.sql.Int, parseInt(ma_dich_vu, 10))
            .input('so_luong_nhap', db_1.sql.Int, parseInt(so_luong_nhap, 10))
            .input('gia_nhap', db_1.sql.Decimal(10, 2), parseFloat(gia_nhap))
            .execute('sp_NhapKhoDichVu');
        const inventoryResult = result.recordset[0];
        return res.status(200).json({
            success: true,
            message: 'Nhập kho dịch vụ thành công!',
            data: inventoryResult
        });
    }
    catch (error) {
        console.error('Lỗi sp_NhapKhoDichVu:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi nhập kho dịch vụ'
        });
    }
};
exports.nhapKhoDichVu = nhapKhoDichVu;
/**
 * 7. Lấy danh sách phiếu nhập kho (Phieu_Nhap_Kho)
 * Method: GET /api/dich-vu/phieu-nhap
 * Procedure: sp_LayDanhSachPhieuNhapKho
 */
const layDanhSachPhieuNhapKho = async (req, res) => {
    try {
        const pool = await db_1.poolPromise;
        const result = await pool.request().execute('sp_LayDanhSachPhieuNhapKho');
        return res.status(200).json({
            success: true,
            data: result.recordset
        });
    }
    catch (error) {
        console.error('Lỗi sp_LayDanhSachPhieuNhapKho:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi lấy danh sách phiếu nhập kho'
        });
    }
};
exports.layDanhSachPhieuNhapKho = layDanhSachPhieuNhapKho;
/**
 * 8. Lấy toàn bộ danh sách chi tiết dịch vụ đã bán (Chi_Tiet_Dich_Vu)
 * Method: GET /api/dich-vu/chi-tiet-ban-hang
 * Procedure: sp_LayDanhSachChiTietDichVu
 */
const layDanhSachChiTietDichVu = async (req, res) => {
    try {
        const pool = await db_1.poolPromise;
        const result = await pool.request().execute('sp_LayDanhSachChiTietDichVu');
        return res.status(200).json({
            success: true,
            data: result.recordset
        });
    }
    catch (error) {
        console.error('Lỗi sp_LayDanhSachChiTietDichVu:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi lấy danh sách chi tiết dịch vụ đã bán'
        });
    }
};
exports.layDanhSachChiTietDichVu = layDanhSachChiTietDichVu;
/**
 * 9. Sửa phiếu nhập kho (Phieu_Nhap_Kho)
 * Method: PUT /api/dich-vu/phieu-nhap/:id
 * Procedure: sp_SuaPhieuNhapKho
 */
const suaPhieuNhapKho = async (req, res) => {
    try {
        const id = String(req.params.id);
        const { so_luong_nhap, gia_nhap } = req.body;
        const pool = await db_1.poolPromise;
        const result = await pool.request()
            .input('id', db_1.sql.Int, parseInt(id, 10))
            .input('so_luong_nhap', db_1.sql.Int, parseInt(so_luong_nhap, 10))
            .input('gia_nhap', db_1.sql.Decimal(10, 2), parseFloat(gia_nhap))
            .execute('sp_SuaPhieuNhapKho');
        return res.status(200).json({
            success: true,
            message: 'Cập nhật phiếu nhập kho thành công!',
            data: result.recordset[0]
        });
    }
    catch (error) {
        console.error('Lỗi sp_SuaPhieuNhapKho:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi sửa phiếu nhập kho'
        });
    }
};
exports.suaPhieuNhapKho = suaPhieuNhapKho;
/**
 * 10. Xóa phiếu nhập kho (Phieu_Nhap_Kho)
 * Method: DELETE /api/dich-vu/phieu-nhap/:id
 * Procedure: sp_XoaPhieuNhapKho
 */
const xoaPhieuNhapKho = async (req, res) => {
    try {
        const id = String(req.params.id);
        const pool = await db_1.poolPromise;
        await pool.request()
            .input('id', db_1.sql.Int, parseInt(id, 10))
            .execute('sp_XoaPhieuNhapKho');
        return res.status(200).json({
            success: true,
            message: 'Xóa phiếu nhập kho thành công!'
        });
    }
    catch (error) {
        console.error('Lỗi sp_XoaPhieuNhapKho:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi xóa phiếu nhập kho'
        });
    }
};
exports.xoaPhieuNhapKho = xoaPhieuNhapKho;
/**
 * 5.1 Cập nhật số lượng / Thêm / Xóa dịch vụ trong đơn đặt sân
 * Method: POST /api/dich-vu/cap-nhat-don
 * Procedure: sp_CapNhatDichVuDonDat
 */
const capNhatDichVuDon = async (req, res) => {
    try {
        const { ma_don_dat, ma_dich_vu, so_luong } = req.body;
        if (!ma_don_dat || !ma_dich_vu || so_luong === undefined || so_luong === null) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ: ma_don_dat, ma_dich_vu, so_luong!'
            });
        }
        const pool = await db_1.poolPromise;
        const result = await pool.request()
            .input('ma_don_dat', db_1.sql.Int, parseInt(ma_don_dat, 10))
            .input('ma_dich_vu', db_1.sql.Int, parseInt(ma_dich_vu, 10))
            .input('so_luong_moi', db_1.sql.Int, parseInt(so_luong, 10))
            .execute('sp_CapNhatDichVuDonDat');
        const serviceDetail = result.recordset[0];
        return res.status(200).json({
            success: true,
            message: 'Cập nhật dịch vụ đơn đặt sân thành công!',
            data: serviceDetail
        });
    }
    catch (error) {
        console.error('Lỗi sp_CapNhatDichVuDonDat:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi cập nhật dịch vụ đơn đặt'
        });
    }
};
exports.capNhatDichVuDon = capNhatDichVuDon;
