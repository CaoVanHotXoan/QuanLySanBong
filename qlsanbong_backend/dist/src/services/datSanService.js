"use strict";
/**
 * =====================================================================
 * SERVICE: QUẢN LÝ ĐẶT SÂN (DAT SAN SERVICE)
 * Tương tác dữ liệu và Stored Procedures cho Sân bóng, Lịch sân, Đơn đặt
 * =====================================================================
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.huyLichCoDinh = exports.doiTrangThaiLichCoDinh = exports.themLichCoDinh = exports.kiemTraTrungLichCoDinh = exports.layChiTietLichCoDinh = exports.layDanhSachLichCoDinh = exports.huyDonVaHoanCoc = exports.datNhieuSanStoredProcedure = exports.datSanStoredProcedure = exports.layTatCaDonDatSan = exports.layLichSanTheoNgay = exports.layDanhSachKhungGio = exports.layDanhSachLoaiSan = exports.layDanhSachSan = void 0;
const db_1 = require("../config/db");
const layDanhSachSan = async (maLoaiSan, trangThai, tuKhoa) => {
    const pool = await db_1.poolPromise;
    try {
        const request = pool.request();
        if (maLoaiSan && maLoaiSan > 0) {
            request.input('ma_loai_san', db_1.sql.Int, maLoaiSan);
        }
        if (trangThai && trangThai !== 'ALL') {
            request.input('trang_thai', db_1.sql.VarChar(20), trangThai);
        }
        if (tuKhoa && tuKhoa.trim()) {
            request.input('tu_khoa', db_1.sql.NVarChar(100), tuKhoa.trim());
        }
        const result = await request.execute('sp_LayDanhSachSan');
        return result.recordset || [];
    }
    catch (e) {
        const res = await pool.request().query(`
            SELECT sb.*, ls.ten_loai 
            FROM San_Bong sb
            LEFT JOIN Loai_San ls ON sb.ma_loai_san = ls.id
            ORDER BY sb.id ASC
        `);
        return res.recordset || [];
    }
};
exports.layDanhSachSan = layDanhSachSan;
const layDanhSachLoaiSan = async () => {
    const pool = await db_1.poolPromise;
    try {
        const res = await pool.request().execute('sp_LayDanhSachLoaiSan');
        return res.recordset || [];
    }
    catch (e) {
        const res = await pool.request().query(`SELECT * FROM Loai_San WHERE trang_thai = 1 OR trang_thai IS NULL ORDER BY id ASC`);
        return res.recordset || [];
    }
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
const datNhieuSanStoredProcedure = async (params) => {
    const pool = await db_1.poolPromise;
    const result = await pool.request()
        .input('ma_nguoi_dung', db_1.sql.Int, params.ma_nguoi_dung || null)
        .input('ho_ten', db_1.sql.NVarChar(100), params.ho_ten)
        .input('so_dien_thoai', db_1.sql.VarChar(15), params.so_dien_thoai)
        .input('tong_tien', db_1.sql.Decimal(10, 2), params.tong_tien || null)
        .input('phuong_thuc', db_1.sql.VarChar(20), params.phuong_thuc || 'CHUYEN_KHOAN')
        .input('trang_thai', db_1.sql.VarChar(30), params.trang_thai || 'DA_COC')
        .input('ghi_chu', db_1.sql.NVarChar(db_1.sql.MAX), params.ghi_chu || null)
        .input('danh_sach_san', db_1.sql.NVarChar(db_1.sql.MAX), JSON.stringify(params.danh_sach_san))
        .input('dich_vu_chon', db_1.sql.NVarChar(db_1.sql.MAX), params.dich_vu_chon ? JSON.stringify(params.dich_vu_chon) : null)
        .execute('sp_DatNhieuSan');
    return result.recordset && result.recordset[0];
};
exports.datNhieuSanStoredProcedure = datNhieuSanStoredProcedure;
const huyDonVaHoanCoc = async (maDonDat, lyDoHuy) => {
    const pool = await db_1.poolPromise;
    const result = await pool.request()
        .input('ma_don_dat', db_1.sql.Int, maDonDat)
        .input('ly_do_huy', db_1.sql.NVarChar(255), lyDoHuy || 'Khách yêu cầu hủy đơn')
        .execute('sp_HuyDonVaHoanCoc');
    return result.recordset && result.recordset[0];
};
exports.huyDonVaHoanCoc = huyDonVaHoanCoc;
// =====================================================================
// DỊCH VỤ QUẢN LÝ LỊCH CỐ ĐỊNH (FIXED / RECURRING BOOKING SERVICE)
// =====================================================================
const layDanhSachLichCoDinh = async (params) => {
    const pool = await db_1.poolPromise;
    try {
        const result = await pool.request()
            .input('trang_thai', db_1.sql.VarChar(30), params.trang_thai || null)
            .input('ma_san', db_1.sql.Int, params.ma_san || null)
            .input('tu_khoa', db_1.sql.NVarChar(100), params.tu_khoa || null)
            .execute('sp_LayDanhSachLichCoDinh');
        return result.recordset || [];
    }
    catch (e) {
        const result = await pool.request().query(`
            SELECT 
                lcd.*, sb.ten_san, ls.ten_loai AS ten_loai_san,
                ISNULL(nd.ho_ten, lcd.ten_doi_bong) AS ten_khach_hang
            FROM Lich_Co_Dinh lcd
            LEFT JOIN San_Bong sb ON lcd.ma_san = sb.id
            LEFT JOIN Loai_San ls ON sb.ma_loai_san = ls.id
            LEFT JOIN Nguoi_Dung nd ON lcd.ma_nguoi_dung = nd.id
            ORDER BY lcd.id DESC
        `);
        return result.recordset || [];
    }
};
exports.layDanhSachLichCoDinh = layDanhSachLichCoDinh;
const layChiTietLichCoDinh = async (id) => {
    const pool = await db_1.poolPromise;
    const result = await pool.request()
        .input('id', db_1.sql.Int, id)
        .execute('sp_LayChiTietLichCoDinh');
    return {
        hop_dong: result.recordsets[0]?.[0] || null,
        danh_sach_buoi: result.recordsets[1] || []
    };
};
exports.layChiTietLichCoDinh = layChiTietLichCoDinh;
const kiemTraTrungLichCoDinh = async (params) => {
    const pool = await db_1.poolPromise;
    const result = await pool.request()
        .input('ma_san', db_1.sql.Int, params.ma_san)
        .input('cac_thu_trong_tuan', db_1.sql.VarChar(50), params.cac_thu_trong_tuan)
        .input('gio_bat_dau', db_1.sql.VarChar(8), params.gio_bat_dau)
        .input('gio_ket_thuc', db_1.sql.VarChar(8), params.gio_ket_thuc)
        .input('tu_ngay', db_1.sql.Date, params.tu_ngay)
        .input('den_ngay', db_1.sql.Date, params.den_ngay)
        .input('don_gia_moi_buoi', db_1.sql.Decimal(10, 2), params.don_gia_moi_buoi || 0)
        .execute('sp_KiemTraTrungLichCoDinh');
    return {
        tong_quan: result.recordsets[0]?.[0] || {},
        chi_tiet_ngay: result.recordsets[1] || []
    };
};
exports.kiemTraTrungLichCoDinh = kiemTraTrungLichCoDinh;
const themLichCoDinh = async (params) => {
    const pool = await db_1.poolPromise;
    const result = await pool.request()
        .input('ma_nguoi_dung', db_1.sql.Int, params.ma_nguoi_dung || null)
        .input('ma_san', db_1.sql.Int, params.ma_san)
        .input('ten_doi_bong', db_1.sql.NVarChar(100), params.ten_doi_bong)
        .input('so_dien_thoai', db_1.sql.VarChar(20), params.so_dien_thoai)
        .input('cac_thu_trong_tuan', db_1.sql.VarChar(50), params.cac_thu_trong_tuan)
        .input('gio_bat_dau', db_1.sql.VarChar(8), params.gio_bat_dau)
        .input('gio_ket_thuc', db_1.sql.VarChar(8), params.gio_ket_thuc)
        .input('tu_ngay', db_1.sql.Date, params.tu_ngay)
        .input('den_ngay', db_1.sql.Date, params.den_ngay)
        .input('don_gia_moi_buoi', db_1.sql.Decimal(10, 2), params.don_gia_moi_buoi || 0)
        .input('tien_coc', db_1.sql.Decimal(10, 2), params.tien_coc || 0)
        .input('bo_qua_ngay_trung', db_1.sql.Bit, params.bo_qua_ngay_trung ? 1 : 0)
        .input('ghi_chu', db_1.sql.NVarChar(db_1.sql.MAX), params.ghi_chu || null)
        .execute('sp_ThemLichCoDinh');
    return {
        hop_dong: result.recordsets[0]?.[0] || null,
        danh_sach_buoi: result.recordsets[1] || []
    };
};
exports.themLichCoDinh = themLichCoDinh;
const doiTrangThaiLichCoDinh = async (id, trang_thai, ghi_chu) => {
    const pool = await db_1.poolPromise;
    const result = await pool.request()
        .input('id', db_1.sql.Int, id)
        .input('trang_thai', db_1.sql.VarChar(30), trang_thai)
        .input('ghi_chu', db_1.sql.NVarChar(db_1.sql.MAX), ghi_chu || null)
        .execute('sp_DoiTrangThaiLichCoDinh');
    return result.recordset?.[0] || null;
};
exports.doiTrangThaiLichCoDinh = doiTrangThaiLichCoDinh;
const huyLichCoDinh = async (id, ly_do) => {
    const pool = await db_1.poolPromise;
    const result = await pool.request()
        .input('id', db_1.sql.Int, id)
        .input('ly_do', db_1.sql.NVarChar(255), ly_do || 'Hủy hợp đồng lịch cố định')
        .execute('sp_HuyLichCoDinh');
    return result.recordset?.[0] || null;
};
exports.huyLichCoDinh = huyLichCoDinh;
