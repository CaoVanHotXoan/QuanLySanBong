/**
 * =====================================================================
 * CONTROLLER: QUẢN LÝ DỊCH VỤ & KHO HÀNG (DICH VU CONTROLLER)
 * Thực thi các Stored Procedure: sp_LayDanhSachDichVu, sp_ThemDichVu, sp_NhapKhoDichVu
 * =====================================================================
 */

const { sql, poolPromise } = require('../config/db');

/**
 * 1. Lấy danh sách dịch vụ (Nước uống, phụ kiện, thuê đồ...)
 * Method: GET /api/dich-vu
 */
const layDanhSachDichVu = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .execute('sp_LayDanhSachDichVu');

        return res.status(200).json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Lỗi sp_LayDanhSachDichVu:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi lấy danh sách dịch vụ'
        });
    }
};

/**
 * 2. Thêm dịch vụ / Bán dịch vụ vào đơn đặt sân
 * Method: POST /api/dich-vu/them-vao-don
 * Header: Authorization: Bearer <token>
 */
const themDichVuVaoDon = async (req, res) => {
    try {
        const { ma_don_dat, ma_dich_vu, so_luong } = req.body;

        if (!ma_don_dat || !ma_dich_vu || !so_luong) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ: ma_don_dat, ma_dich_vu, so_luong!'
            });
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('ma_don_dat', sql.Int, parseInt(ma_don_dat, 10))
            .input('ma_dich_vu', sql.Int, parseInt(ma_dich_vu, 10))
            .input('so_luong', sql.Int, parseInt(so_luong, 10))
            .execute('sp_ThemDichVu');

        const serviceDetail = result.recordset[0];

        return res.status(200).json({
            success: true,
            message: 'Thêm dịch vụ vào đơn đặt sân thành công!',
            data: serviceDetail
        });
    } catch (error) {
        console.error('Lỗi sp_ThemDichVu:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi thêm dịch vụ vào đơn'
        });
    }
};

/**
 * 3. Nhập kho dịch vụ
 * Method: POST /api/dich-vu/nhap-kho
 * Header: Authorization: Bearer <token> (Yêu cầu quyền ADMIN hoặc NHAN_VIEN)
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

        const pool = await poolPromise;
        const result = await pool.request()
            .input('ma_dich_vu', sql.Int, parseInt(ma_dich_vu, 10))
            .input('so_luong_nhap', sql.Int, parseInt(so_luong_nhap, 10))
            .input('gia_nhap', sql.Decimal(10, 2), parseFloat(gia_nhap))
            .execute('sp_NhapKhoDichVu');

        const inventoryResult = result.recordset[0];

        return res.status(200).json({
            success: true,
            message: 'Nhập kho dịch vụ thành công!',
            data: inventoryResult
        });
    } catch (error) {
        console.error('Lỗi sp_NhapKhoDichVu:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi nhập kho dịch vụ'
        });
    }
};

module.exports = {
    layDanhSachDichVu,
    themDichVuVaoDon,
    nhapKhoDichVu
};
