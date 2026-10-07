"use strict";
/**
 * =====================================================================
 * SERVICE: QUẢN LÝ DỊCH VỤ & KHO (DICH VU SERVICE)
 * Tương tác dữ liệu và Stored Procedures cho Dịch vụ, Kho hàng
 * =====================================================================
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.layDanhSachChiTietDichVu = exports.xoaPhieuNhapKho = exports.suaPhieuNhapKho = exports.layDanhSachPhieuNhapKho = exports.nhapKhoDichVu = exports.capNhatDichVuDon = exports.themDichVuVaoDon = exports.xoaDichVu = exports.suaDichVu = exports.themDichVu = exports.layDanhSachDichVu = void 0;
const db_1 = require("../config/db");
const layDanhSachDichVu = async () => {
    const pool = await db_1.poolPromise;
    const result = await pool.request().execute('sp_LayDanhSachDichVu');
    return result.recordset || [];
};
exports.layDanhSachDichVu = layDanhSachDichVu;
const themDichVu = async (data) => {
    const pool = await db_1.poolPromise;
    const result = await pool.request()
        .input('ten_dich_vu', db_1.sql.NVarChar(100), data.ten_dich_vu)
        .input('don_gia', db_1.sql.Decimal(10, 2), data.don_gia)
        .input('don_vi_tinh', db_1.sql.NVarChar(20), data.don_vi_tinh)
        .input('ton_kho', db_1.sql.Int, data.ton_kho || 0)
        .execute('sp_ThemDichVuMoi');
    return result.recordset[0];
};
exports.themDichVu = themDichVu;
const suaDichVu = async (id, data) => {
    const pool = await db_1.poolPromise;
    const result = await pool.request()
        .input('id', db_1.sql.Int, id)
        .input('ten_dich_vu', db_1.sql.NVarChar(100), data.ten_dich_vu)
        .input('don_gia', db_1.sql.Decimal(10, 2), data.don_gia)
        .input('don_vi_tinh', db_1.sql.NVarChar(20), data.don_vi_tinh)
        .input('ton_kho', db_1.sql.Int, data.ton_kho || 0)
        .execute('sp_SuaDichVu');
    return result.recordset[0];
};
exports.suaDichVu = suaDichVu;
const xoaDichVu = async (id) => {
    const pool = await db_1.poolPromise;
    await pool.request()
        .input('id', db_1.sql.Int, id)
        .execute('sp_XoaDichVu');
    return true;
};
exports.xoaDichVu = xoaDichVu;
const themDichVuVaoDon = async (maDonDat, items) => {
    const pool = await db_1.poolPromise;
    let lastResult = null;
    for (const item of items) {
        const result = await pool.request()
            .input('ma_don_dat', db_1.sql.Int, maDonDat)
            .input('ma_dich_vu', db_1.sql.Int, item.ma_dich_vu)
            .input('so_luong', db_1.sql.Int, item.so_luong)
            .execute('sp_ThemDichVu');
        lastResult = result.recordset[0];
    }
    return lastResult;
};
exports.themDichVuVaoDon = themDichVuVaoDon;
const capNhatDichVuDon = async (maDonDat, maDichVu, soLuong) => {
    const pool = await db_1.poolPromise;
    const result = await pool.request()
        .input('ma_don_dat', db_1.sql.Int, maDonDat)
        .input('ma_dich_vu', db_1.sql.Int, maDichVu)
        .input('so_luong_moi', db_1.sql.Int, soLuong)
        .execute('sp_CapNhatDichVuDonDat');
    return result.recordset[0];
};
exports.capNhatDichVuDon = capNhatDichVuDon;
const nhapKhoDichVu = async (maDichVu, soLuongNhap, giaNhap) => {
    const pool = await db_1.poolPromise;
    const result = await pool.request()
        .input('ma_dich_vu', db_1.sql.Int, maDichVu)
        .input('so_luong_nhap', db_1.sql.Int, soLuongNhap)
        .input('gia_nhap', db_1.sql.Decimal(10, 2), giaNhap)
        .execute('sp_NhapKhoDichVu');
    return result.recordset[0];
};
exports.nhapKhoDichVu = nhapKhoDichVu;
const layDanhSachPhieuNhapKho = async () => {
    const pool = await db_1.poolPromise;
    const result = await pool.request().execute('sp_LayDanhSachPhieuNhapKho');
    return result.recordset || [];
};
exports.layDanhSachPhieuNhapKho = layDanhSachPhieuNhapKho;
const suaPhieuNhapKho = async (id, soLuongNhap, giaNhap) => {
    const pool = await db_1.poolPromise;
    const result = await pool.request()
        .input('id', db_1.sql.Int, id)
        .input('so_luong_nhap', db_1.sql.Int, soLuongNhap)
        .input('gia_nhap', db_1.sql.Decimal(10, 2), giaNhap)
        .execute('sp_SuaPhieuNhapKho');
    return result.recordset[0];
};
exports.suaPhieuNhapKho = suaPhieuNhapKho;
const xoaPhieuNhapKho = async (id) => {
    const pool = await db_1.poolPromise;
    await pool.request()
        .input('id', db_1.sql.Int, id)
        .execute('sp_XoaPhieuNhapKho');
    return true;
};
exports.xoaPhieuNhapKho = xoaPhieuNhapKho;
const layDanhSachChiTietDichVu = async () => {
    const pool = await db_1.poolPromise;
    const result = await pool.request().execute('sp_LayDanhSachChiTietDichVu');
    return result.recordset || [];
};
exports.layDanhSachChiTietDichVu = layDanhSachChiTietDichVu;
