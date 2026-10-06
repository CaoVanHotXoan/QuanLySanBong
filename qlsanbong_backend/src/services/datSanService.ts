/**
 * =====================================================================
 * SERVICE: QUẢN LÝ ĐẶT SÂN (DAT SAN SERVICE)
 * Tương tác dữ liệu và Stored Procedures cho Sân bóng, Lịch sân, Đơn đặt
 * =====================================================================
 */

import { sql, poolPromise } from '../config/db';

export const layDanhSachSan = async () => {
    const pool = await poolPromise;
    try {
        const result = await pool.request().execute('sp_LayDanhSachSan');
        return result.recordset || [];
    } catch (e) {
        const res = await pool.request().query(`
            SELECT sb.*, ls.ten_loai_san 
            FROM San_Bong sb
            LEFT JOIN Loai_San ls ON sb.ma_loai_san = ls.id
        `);
        return res.recordset || [];
    }
};

export const layDanhSachLoaiSan = async () => {
    const pool = await poolPromise;
    const res = await pool.request().query(`SELECT * FROM Loai_San ORDER BY id ASC`);
    return res.recordset || [];
};

export const layDanhSachKhungGio = async () => {
    const pool = await poolPromise;
    const res = await pool.request().query(`SELECT * FROM Khung_Gio ORDER BY gio_bat_dau ASC`);
    return res.recordset || [];
};

export const layLichSanTheoNgay = async (ngayDa: string) => {
    const pool = await poolPromise;
    try {
        const result = await pool.request()
            .input('ngay_da', sql.Date, ngayDa)
            .execute('sp_LayLichSan');
        return result.recordset || [];
    } catch (e) {
        const result = await pool.request()
            .input('ngay_da', sql.Date, ngayDa)
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

export const layTatCaDonDatSan = async () => {
    const pool = await poolPromise;
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

export const datSanStoredProcedure = async (params: {
    ma_nguoi_dung: number;
    ma_san: number;
    ngay_da: string;
    gio_bat_dau: string;
    gio_ket_thuc: string;
    ghi_chu?: string;
}) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('ma_nguoi_dung', sql.Int, params.ma_nguoi_dung)
        .input('ma_san', sql.Int, params.ma_san)
        .input('ngay_da', sql.Date, params.ngay_da)
        .input('gio_bat_dau', sql.VarChar(10), params.gio_bat_dau)
        .input('gio_ket_thuc', sql.VarChar(10), params.gio_ket_thuc)
        .input('ghi_chu', sql.NVarChar(255), params.ghi_chu || null)
        .execute('sp_DatSan');

    return result.recordset && result.recordset[0];
};

export const huyDonVaHoanCoc = async (maDonDat: number, lyDoHuy?: string) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('ma_don_dat', sql.Int, maDonDat)
        .input('ly_do_huy', sql.NVarChar(255), lyDoHuy || 'Khách yêu cầu hủy đơn')
        .execute('sp_HuyDonVaHoanCoc');

    return result.recordset && result.recordset[0];
};
