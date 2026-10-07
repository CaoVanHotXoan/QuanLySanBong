"use strict";
/**
 * =====================================================================
 * SERVICE: QUẢN LÝ ĐẶT SÂN (DAT SAN SERVICE)
 * Tương tác dữ liệu và Stored Procedures cho Sân bóng, Lịch sân, Đơn đặt
 * =====================================================================
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.huyDonVaHoanCoc = exports.datSanStoredProcedure = exports.layTatCaDonDatSan = exports.layLichSanTheoNgay = exports.layDanhSachKhungGio = exports.layDanhSachLoaiSan = exports.layDanhSachSan = void 0;
const db_1 = require("../config/db");
const layDanhSachSan = async () => {
    const pool = await db_1.poolPromise;
    try {
        const result = await pool.request().execute('sp_LayDanhSachSan');
        return result.recordset || [];
    }
    catch (e) {
        const res = await pool.request().query(`
            SELECT sb.*, ls.ten_loai_san 
            FROM San_Bong sb
            LEFT JOIN Loai_San ls ON sb.ma_loai_san = ls.id
        `);
        return res.recordset || [];
    }
};
exports.layDanhSachSan = layDanhSachSan;
const layDanhSachLoaiSan = async () => {
    const pool = await db_1.poolPromise;
    const res = await pool.request().query(`SELECT * FROM Loai_San ORDER BY id ASC`);
    return res.recordset || [];
};
exports.layDanhSachLoaiSan = layDanhSachLoaiSan;
const layDanhSachKhungGio = async () => {
    const pool = await db_1.poolPromise;
    const res = await pool.request().query(`SELECT * FROM Khung_Gio ORDER BY gio_bat_dau ASC`);
    return res.recordset || [];
};
exports.layDanhSachKhungGio = layDanhSachKhungGio;
const layLichSanTheoNgay = async (ngayDa) => {
    const pool = await db_1.poolPromise;
    try {
        const result = await pool.request()
            .input('ngay_da', db_1.sql.Date, ngayDa)
            .execute('sp_LayLichSan');
        return result.recordset || [];
    }
    catch (e) {
        const result = await pool.request()
            .input('ngay_da', db_1.sql.Date, ngayDa)
            .query(`
                SELECT dds.*, sb.ten_san, ls.ten_loai_san, nd.ho_ten AS ten_khach_hang, nd.so_dien_thoai
                FROM Don_Dat_San dds
                JOIN San_Bong sb ON dds.ma_san = sb.id
                LEFT JOIN Loai_San ls ON sb.ma_loai_san = ls.id
                LEFT JOIN Nguoi_Dung nd ON dds.ma_nguoi_dung = nd.id
                WHERE CAST(dds.ngay_da AS DATE) = CAST(@ngay_da AS DATE)
            `);
        return result.recordset || [];
    }
};
exports.layLichSanTheoNgay = layLichSanTheoNgay;
const layTatCaDonDatSan = async () => {
    const pool = await db_1.poolPromise;
    const result = await pool.request().query(`
        SELECT dds.*, sb.ten_san, ls.ten_loai_san, nd.ho_ten AS ten_khach_hang, nd.so_dien_thoai
        FROM Don_Dat_San dds
        LEFT JOIN San_Bong sb ON dds.ma_san = sb.id
        LEFT JOIN Loai_San ls ON sb.ma_loai_san = ls.id
        LEFT JOIN Nguoi_Dung nd ON dds.ma_nguoi_dung = nd.id
        ORDER BY dds.id DESC
    `);
    return result.recordset || [];
};
exports.layTatCaDonDatSan = layTatCaDonDatSan;
const datSanStoredProcedure = async (params) => {
    const pool = await db_1.poolPromise;
    const result = await pool.request()
        .input('ma_nguoi_dung', db_1.sql.Int, params.ma_nguoi_dung)
        .input('ma_san', db_1.sql.Int, params.ma_san)
        .input('ngay_da', db_1.sql.Date, params.ngay_da)
        .input('gio_bat_dau', db_1.sql.VarChar(10), params.gio_bat_dau)
        .input('gio_ket_thuc', db_1.sql.VarChar(10), params.gio_ket_thuc)
        .input('ghi_chu', db_1.sql.NVarChar(255), params.ghi_chu || null)
        .execute('sp_DatSan');
    return result.recordset && result.recordset[0];
};
exports.datSanStoredProcedure = datSanStoredProcedure;
const huyDonVaHoanCoc = async (maDonDat, lyDoHuy) => {
    const pool = await db_1.poolPromise;
    const result = await pool.request()
        .input('ma_don_dat', db_1.sql.Int, maDonDat)
        .input('ly_do_huy', db_1.sql.NVarChar(255), lyDoHuy || 'Khách yêu cầu hủy đơn')
        .execute('sp_HuyDonVaHoanCoc');
    return result.recordset && result.recordset[0];
};
exports.huyDonVaHoanCoc = huyDonVaHoanCoc;
