/**
 * =====================================================================
 * SERVICE: QUẢN LÝ ĐẶT SÂN (DAT SAN SERVICE)
 * Tương tác dữ liệu và Stored Procedures cho Sân bóng, Lịch sân, Đơn đặt
 * =====================================================================
 */

import { sql, poolPromise } from '../config/db';

export const layDanhSachSan = async (maLoaiSan?: number, trangThai?: string, tuKhoa?: string) => {
    const pool = await poolPromise;
    try {
        const request = pool.request();
        if (maLoaiSan && maLoaiSan > 0) {
            request.input('ma_loai_san', sql.Int, maLoaiSan);
        }
        if (trangThai && trangThai !== 'ALL') {
            request.input('trang_thai', sql.VarChar(20), trangThai);
        }
        if (tuKhoa && tuKhoa.trim()) {
            request.input('tu_khoa', sql.NVarChar(100), tuKhoa.trim());
        }
        const result = await request.execute('sp_LayDanhSachSan');
        return result.recordset || [];
    } catch (e) {
        const res = await pool.request().query(`
            SELECT sb.*, ls.ten_loai 
            FROM San_Bong sb
            LEFT JOIN Loai_San ls ON sb.ma_loai_san = ls.id
            ORDER BY sb.id ASC
        `);
        return res.recordset || [];
    }
};

export const layDanhSachLoaiSan = async () => {
    const pool = await poolPromise;
    try {
        const res = await pool.request().execute('sp_LayDanhSachLoaiSan');
        return res.recordset || [];
    } catch (e) {
        const res = await pool.request().query(`SELECT * FROM Loai_San WHERE trang_thai = 1 OR trang_thai IS NULL ORDER BY id ASC`);
        return res.recordset || [];
    }
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

export const datNhieuSanStoredProcedure = async (params: {
    ma_nguoi_dung?: number;
    ho_ten: string;
    so_dien_thoai: string;
    tong_tien?: number;
    phuong_thuc?: string;
    trang_thai?: string;
    ghi_chu?: string;
    danh_sach_san: any[];
    dich_vu_chon?: any;
}) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('ma_nguoi_dung', sql.Int, params.ma_nguoi_dung || null)
        .input('ho_ten', sql.NVarChar(100), params.ho_ten)
        .input('so_dien_thoai', sql.VarChar(15), params.so_dien_thoai)
        .input('tong_tien', sql.Decimal(10, 2), params.tong_tien || null)
        .input('phuong_thuc', sql.VarChar(20), params.phuong_thuc || 'CHUYEN_KHOAN')
        .input('trang_thai', sql.VarChar(30), params.trang_thai || 'DA_COC')
        .input('ghi_chu', sql.NVarChar(sql.MAX), params.ghi_chu || null)
        .input('danh_sach_san', sql.NVarChar(sql.MAX), JSON.stringify(params.danh_sach_san))
        .input('dich_vu_chon', sql.NVarChar(sql.MAX), params.dich_vu_chon ? JSON.stringify(params.dich_vu_chon) : null)
        .execute('sp_DatNhieuSan');

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

// =====================================================================
// DỊCH VỤ QUẢN LÝ LỊCH CỐ ĐỊNH (FIXED / RECURRING BOOKING SERVICE)
// =====================================================================

export const layDanhSachLichCoDinh = async (params: {
    trang_thai?: string;
    ma_san?: number;
    tu_khoa?: string;
}) => {
    const pool = await poolPromise;
    try {
        const result = await pool.request()
            .input('trang_thai', sql.VarChar(30), params.trang_thai || null)
            .input('ma_san', sql.Int, params.ma_san || null)
            .input('tu_khoa', sql.NVarChar(100), params.tu_khoa || null)
            .execute('sp_LayDanhSachLichCoDinh');
        return result.recordset || [];
    } catch (e) {
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

export const layChiTietLichCoDinh = async (id: number) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('id', sql.Int, id)
        .execute('sp_LayChiTietLichCoDinh');
    return {
        hop_dong: result.recordsets[0]?.[0] || null,
        danh_sach_buoi: result.recordsets[1] || []
    };
};

export const kiemTraTrungLichCoDinh = async (params: {
    ma_san: number;
    cac_thu_trong_tuan: string;
    gio_bat_dau: string;
    gio_ket_thuc: string;
    tu_ngay: string;
    den_ngay: string;
    don_gia_moi_buoi?: number;
}) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('ma_san', sql.Int, params.ma_san)
        .input('cac_thu_trong_tuan', sql.VarChar(50), params.cac_thu_trong_tuan)
        .input('gio_bat_dau', sql.VarChar(8), params.gio_bat_dau)
        .input('gio_ket_thuc', sql.VarChar(8), params.gio_ket_thuc)
        .input('tu_ngay', sql.Date, params.tu_ngay)
        .input('den_ngay', sql.Date, params.den_ngay)
        .input('don_gia_moi_buoi', sql.Decimal(10, 2), params.don_gia_moi_buoi || 0)
        .execute('sp_KiemTraTrungLichCoDinh');
    return {
        tong_quan: result.recordsets[0]?.[0] || {},
        chi_tiet_ngay: result.recordsets[1] || []
    };
};

export const themLichCoDinh = async (params: {
    ma_nguoi_dung?: number;
    ma_san: number;
    ten_doi_bong: string;
    so_dien_thoai: string;
    cac_thu_trong_tuan: string;
    gio_bat_dau: string;
    gio_ket_thuc: string;
    tu_ngay: string;
    den_ngay: string;
    don_gia_moi_buoi?: number;
    tien_coc?: number;
    bo_qua_ngay_trung?: boolean;
    ghi_chu?: string;
}) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('ma_nguoi_dung', sql.Int, params.ma_nguoi_dung || null)
        .input('ma_san', sql.Int, params.ma_san)
        .input('ten_doi_bong', sql.NVarChar(100), params.ten_doi_bong)
        .input('so_dien_thoai', sql.VarChar(20), params.so_dien_thoai)
        .input('cac_thu_trong_tuan', sql.VarChar(50), params.cac_thu_trong_tuan)
        .input('gio_bat_dau', sql.VarChar(8), params.gio_bat_dau)
        .input('gio_ket_thuc', sql.VarChar(8), params.gio_ket_thuc)
        .input('tu_ngay', sql.Date, params.tu_ngay)
        .input('den_ngay', sql.Date, params.den_ngay)
        .input('don_gia_moi_buoi', sql.Decimal(10, 2), params.don_gia_moi_buoi || 0)
        .input('tien_coc', sql.Decimal(10, 2), params.tien_coc || 0)
        .input('bo_qua_ngay_trung', sql.Bit, params.bo_qua_ngay_trung ? 1 : 0)
        .input('ghi_chu', sql.NVarChar(sql.MAX), params.ghi_chu || null)
        .execute('sp_ThemLichCoDinh');
    return {
        hop_dong: result.recordsets[0]?.[0] || null,
        danh_sach_buoi: result.recordsets[1] || []
    };
};

export const doiTrangThaiLichCoDinh = async (id: number, trang_thai: string, ghi_chu?: string) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('id', sql.Int, id)
        .input('trang_thai', sql.VarChar(30), trang_thai)
        .input('ghi_chu', sql.NVarChar(sql.MAX), ghi_chu || null)
        .execute('sp_DoiTrangThaiLichCoDinh');
    return result.recordset?.[0] || null;
};

export const huyLichCoDinh = async (id: number, ly_do?: string) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('id', sql.Int, id)
        .input('ly_do', sql.NVarChar(255), ly_do || 'Hủy hợp đồng lịch cố định')
        .execute('sp_HuyLichCoDinh');
    return result.recordset?.[0] || null;
};
