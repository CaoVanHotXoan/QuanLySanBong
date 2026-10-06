/**
 * =====================================================================
 * SERVICE: BÁO CÁO & THỐNG KÊ (BAO CAO SERVICE)
 * Xử lý dữ liệu phân tích và thực thi Stored Procedures SQL Server
 * =====================================================================
 */

import { sql, poolPromise } from '../config/db';

export const getBaoCaoDoanhThu = async (tuNgay: string, denNgay: string) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('tu_ngay', sql.Date, tuNgay)
        .input('den_ngay', sql.Date, denNgay)
        .execute('sp_BaoCaoDoanhThu');

    return {
        tong_quan: result.recordsets[0] ? result.recordsets[0][0] : {},
        chi_tiet_ngay: result.recordsets[1] || []
    };
};

export const getBaoCaoDoanhThuBieuDo = async (kieu: string = 'NGAY', ngayMoc: string | null = null) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('kieu_thoi_gian', sql.VarChar(10), kieu.toUpperCase())
        .input('ngay_moc', sql.Date, ngayMoc)
        .execute('sp_BaoCaoDoanhThuBieuDo');

    return result.recordset || [];
};

export const getTopDichVuBanChay = async (topN: number = 5) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('top_n', sql.Int, topN)
        .execute('sp_TopDichVuBanChay');

    return result.recordset || [];
};

export const getLayDonDatMoiNhat = async (soLuong: number = 5) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('so_luong', sql.Int, soLuong)
        .execute('sp_LayDonDatMoiNhat');

    return result.recordset || [];
};

export const getLayTrangThaiSanTrucQuan = async (ngayDa: string | null = null, gioHienTai: string | null = null) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('ngay_da', sql.Date, ngayDa)
        .input('gio_hien_tai', sql.Time, gioHienTai)
        .execute('sp_LayTrangThaiSanTrucQuan');

    return result.recordset || [];
};
