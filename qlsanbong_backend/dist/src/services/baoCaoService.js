"use strict";
/**
 * =====================================================================
 * SERVICE: BÁO CÁO & THỐNG KÊ (BAO CAO SERVICE)
 * Xử lý dữ liệu phân tích và thực thi Stored Procedures SQL Server
 * =====================================================================
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLayTrangThaiSanTrucQuan = exports.getLayDonDatMoiNhat = exports.getTopDichVuBanChay = exports.getBaoCaoDoanhThuBieuDo = exports.getBaoCaoDoanhThu = void 0;
const db_1 = require("../config/db");
const getBaoCaoDoanhThu = async (tuNgay, denNgay) => {
    const pool = await db_1.poolPromise;
    const result = await pool.request()
        .input('tu_ngay', db_1.sql.Date, tuNgay)
        .input('den_ngay', db_1.sql.Date, denNgay)
        .execute('sp_BaoCaoDoanhThu');
    return {
        tong_quan: result.recordsets[0] ? result.recordsets[0][0] : {},
        chi_tiet_ngay: result.recordsets[1] || []
    };
};
exports.getBaoCaoDoanhThu = getBaoCaoDoanhThu;
const getBaoCaoDoanhThuBieuDo = async (kieu = 'NGAY', ngayMoc = null) => {
    const pool = await db_1.poolPromise;
    const result = await pool.request()
        .input('kieu_thoi_gian', db_1.sql.VarChar(10), kieu.toUpperCase())
        .input('ngay_moc', db_1.sql.Date, ngayMoc)
        .execute('sp_BaoCaoDoanhThuBieuDo');
    return result.recordset || [];
};
exports.getBaoCaoDoanhThuBieuDo = getBaoCaoDoanhThuBieuDo;
const getTopDichVuBanChay = async (topN = 5) => {
    const pool = await db_1.poolPromise;
    const result = await pool.request()
        .input('top_n', db_1.sql.Int, topN)
        .execute('sp_TopDichVuBanChay');
    return result.recordset || [];
};
exports.getTopDichVuBanChay = getTopDichVuBanChay;
const getLayDonDatMoiNhat = async (soLuong = 5) => {
    const pool = await db_1.poolPromise;
    const result = await pool.request()
        .input('so_luong', db_1.sql.Int, soLuong)
        .execute('sp_LayDonDatMoiNhat');
    return result.recordset || [];
};
exports.getLayDonDatMoiNhat = getLayDonDatMoiNhat;
const getLayTrangThaiSanTrucQuan = async (ngayDa = null, gioHienTai = null) => {
    const pool = await db_1.poolPromise;
    const result = await pool.request()
        .input('ngay_da', db_1.sql.Date, ngayDa)
        .input('gio_hien_tai', db_1.sql.Time, gioHienTai)
        .execute('sp_LayTrangThaiSanTrucQuan');
    return result.recordset || [];
};
exports.getLayTrangThaiSanTrucQuan = getLayTrangThaiSanTrucQuan;
