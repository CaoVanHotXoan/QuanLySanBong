/**
 * =====================================================================
 * SERVICE: QUẢN LÝ DỊCH VỤ & KHO (DICH VU SERVICE)
 * Tương tác dữ liệu và Stored Procedures cho Dịch vụ, Kho hàng
 * =====================================================================
 */

import { sql, poolPromise } from '../config/db';

export const layDanhSachDichVu = async () => {
    const pool = await poolPromise;
    const result = await pool.request().execute('sp_LayDanhSachDichVu');
    return result.recordset || [];
};

export const themDichVu = async (data: { ten_dich_vu: string; don_gia: number; don_vi_tinh: string; ton_kho?: number }) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('ten_dich_vu', sql.NVarChar(100), data.ten_dich_vu)
        .input('don_gia', sql.Decimal(10, 2), data.don_gia)
        .input('don_vi_tinh', sql.NVarChar(20), data.don_vi_tinh)
        .input('ton_kho', sql.Int, data.ton_kho || 0)
        .execute('sp_ThemDichVuMoi');

    return result.recordset[0];
};

export const suaDichVu = async (id: number, data: { ten_dich_vu: string; don_gia: number; don_vi_tinh: string; ton_kho?: number }) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('id', sql.Int, id)
        .input('ten_dich_vu', sql.NVarChar(100), data.ten_dich_vu)
        .input('don_gia', sql.Decimal(10, 2), data.don_gia)
        .input('don_vi_tinh', sql.NVarChar(20), data.don_vi_tinh)
        .input('ton_kho', sql.Int, data.ton_kho || 0)
        .execute('sp_SuaDichVu');

    return result.recordset[0];
};

export const xoaDichVu = async (id: number) => {
    const pool = await poolPromise;
    await pool.request()
        .input('id', sql.Int, id)
        .execute('sp_XoaDichVu');
    return true;
};

export const themDichVuVaoDon = async (maDonDat: number, items: Array<{ ma_dich_vu: number; so_luong: number }>) => {
    const pool = await poolPromise;
    let lastResult: any = null;
    for (const item of items) {
        const result = await pool.request()
            .input('ma_don_dat', sql.Int, maDonDat)
            .input('ma_dich_vu', sql.Int, item.ma_dich_vu)
            .input('so_luong', sql.Int, item.so_luong)
            .execute('sp_ThemDichVu');
        lastResult = result.recordset[0];
    }
    return lastResult;
};

export const capNhatDichVuDon = async (maDonDat: number, maDichVu: number, soLuong: number) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('ma_don_dat', sql.Int, maDonDat)
        .input('ma_dich_vu', sql.Int, maDichVu)
        .input('so_luong_moi', sql.Int, soLuong)
        .execute('sp_CapNhatDichVuDonDat');

    return result.recordset[0];
};

export const nhapKhoDichVu = async (maDichVu: number, soLuongNhap: number, giaNhap: number) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('ma_dich_vu', sql.Int, maDichVu)
        .input('so_luong_nhap', sql.Int, soLuongNhap)
        .input('gia_nhap', sql.Decimal(10, 2), giaNhap)
        .execute('sp_NhapKhoDichVu');

    return result.recordset[0];
};

export const layDanhSachPhieuNhapKho = async () => {
    const pool = await poolPromise;
    const result = await pool.request().execute('sp_LayDanhSachPhieuNhapKho');
    return result.recordset || [];
};

export const suaPhieuNhapKho = async (id: number, soLuongNhap: number, giaNhap: number) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('id', sql.Int, id)
        .input('so_luong_nhap', sql.Int, soLuongNhap)
        .input('gia_nhap', sql.Decimal(10, 2), giaNhap)
        .execute('sp_SuaPhieuNhapKho');

    return result.recordset[0];
};

export const xoaPhieuNhapKho = async (id: number) => {
    const pool = await poolPromise;
    await pool.request()
        .input('id', sql.Int, id)
        .execute('sp_XoaPhieuNhapKho');
    return true;
};

export const layDanhSachChiTietDichVu = async () => {
    const pool = await poolPromise;
    const result = await pool.request().execute('sp_LayDanhSachChiTietDichVu');
    return result.recordset || [];
};
