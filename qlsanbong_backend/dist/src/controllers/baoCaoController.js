"use strict";
/**
 * =====================================================================
 * CONTROLLER: BÁO CÁO & THỐNG KÊ (BAO CAO CONTROLLER)
 * Thực thi Stored Procedures phân tích Dashboard
 * =====================================================================
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.layTrangThaiSanTrucQuan = exports.layDonDatMoiNhat = exports.topDichVuBanChay = exports.baoCaoDoanhThuBieuDo = exports.baoCaoDoanhThu = void 0;
const db_1 = require("../config/db");
/**
 * 1. Thống kê báo cáo doanh thu theo khoảng thời gian
 * Method: GET /api/bao-cao/doanh-thu?tu_ngay=YYYY-MM-DD&den_ngay=YYYY-MM-DD
 */
const baoCaoDoanhThu = async (req, res) => {
    try {
        const { tu_ngay, den_ngay } = req.query;
        if (!tu_ngay || !den_ngay) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ tu_ngay và den_ngay (Định dạng: YYYY-MM-DD)!'
            });
        }
        const pool = await db_1.poolPromise;
        const result = await pool.request()
            .input('tu_ngay', db_1.sql.Date, tu_ngay)
            .input('den_ngay', db_1.sql.Date, den_ngay)
            .execute('sp_BaoCaoDoanhThu');
        const tongQuan = result.recordsets[0] ? result.recordsets[0][0] : {};
        const chiTietTheoNgay = result.recordsets[1] || [];
        return res.status(200).json({
            success: true,
            data: {
                tong_quan: tongQuan,
                chi_tiet_ngay: chiTietTheoNgay
            }
        });
    }
    catch (error) {
        console.error('Lỗi sp_BaoCaoDoanhThu:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi lấy báo cáo doanh thu'
        });
    }
};
exports.baoCaoDoanhThu = baoCaoDoanhThu;
/**
 * 2. Thống kê doanh thu phục vụ vẽ biểu đồ (Ngày, Tuần, Tháng)
 * Method: GET /api/bao-cao/doanh-thu-bieu-do?kieu=NGAY|TUAN|THANG&ngay_moc=YYYY-MM-DD
 */
const baoCaoDoanhThuBieuDo = async (req, res) => {
    try {
        const kieu = req.query.kieu || 'NGAY';
        const ngay_moc = req.query.ngay_moc || null;
        const pool = await db_1.poolPromise;
        const result = await pool.request()
            .input('kieu_thoi_gian', db_1.sql.VarChar(10), kieu.toUpperCase())
            .input('ngay_moc', db_1.sql.Date, ngay_moc)
            .execute('sp_BaoCaoDoanhThuBieuDo');
        return res.status(200).json({
            success: true,
            data: result.recordset || []
        });
    }
    catch (error) {
        console.error('Lỗi sp_BaoCaoDoanhThuBieuDo:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi lấy dữ liệu biểu đồ doanh thu'
        });
    }
};
exports.baoCaoDoanhThuBieuDo = baoCaoDoanhThuBieuDo;
/**
 * 3. Top dịch vụ bán chạy nhất (Pie / Donut chart & Ranking list)
 * Method: GET /api/bao-cao/top-dich-vu?top=5
 */
const topDichVuBanChay = async (req, res) => {
    try {
        const top_n = parseInt(req.query.top || '5', 10);
        const pool = await db_1.poolPromise;
        const result = await pool.request()
            .input('top_n', db_1.sql.Int, top_n)
            .execute('sp_TopDichVuBanChay');
        return res.status(200).json({
            success: true,
            data: result.recordset || []
        });
    }
    catch (error) {
        console.error('Lỗi sp_TopDichVuBanChay:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi lấy danh sách top dịch vụ'
        });
    }
};
exports.topDichVuBanChay = topDichVuBanChay;
/**
 * 4. Lấy danh sách đơn đặt sân mới nhất (Recent Bookings)
 * Method: GET /api/bao-cao/don-moi-nhat?limit=5
 */
const layDonDatMoiNhat = async (req, res) => {
    try {
        const so_luong = parseInt(req.query.limit || '5', 10);
        const pool = await db_1.poolPromise;
        const result = await pool.request()
            .input('so_luong', db_1.sql.Int, so_luong)
            .execute('sp_LayDonDatMoiNhat');
        return res.status(200).json({
            success: true,
            data: result.recordset || []
        });
    }
    catch (error) {
        console.error('Lỗi sp_LayDonDatMoiNhat:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi lấy danh sách đơn đặt sân mới nhất'
        });
    }
};
exports.layDonDatMoiNhat = layDonDatMoiNhat;
/**
 * 5. Lấy trạng thái sân trực quan theo thời gian thực
 * Method: GET /api/bao-cao/trang-thai-san?ngay=YYYY-MM-DD
 */
const layTrangThaiSanTrucQuan = async (req, res) => {
    try {
        const ngay = req.query.ngay || null;
        const pool = await db_1.poolPromise;
        const result = await pool.request()
            .input('ngay_da', db_1.sql.Date, ngay)
            .input('gio_hien_tai', db_1.sql.Time, null)
            .execute('sp_LayTrangThaiSanTrucQuan');
        return res.status(200).json({
            success: true,
            data: result.recordset || []
        });
    }
    catch (error) {
        console.error('Lỗi sp_LayTrangThaiSanTrucQuan:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi lấy trạng thái trực quan các sân bóng'
        });
    }
};
exports.layTrangThaiSanTrucQuan = layTrangThaiSanTrucQuan;
