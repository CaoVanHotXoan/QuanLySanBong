/**
 * =====================================================================
 * CONTROLLER: QUẢN LÝ DỊCH VỤ & KHO HÀNG (DICH VU CONTROLLER)
 * 100% SỬ DỤNG STORED PROCEDURES (SQL SERVER):
 * 1. sp_LayDanhSachDichVu
 * 2. sp_ThemDichVuMoi
 * 3. sp_SuaDichVu
 * 4. sp_XoaDichVu
 * 5. sp_ThemDichVu (vào đơn đặt sân - Mini POS)
 * 6. sp_NhapKhoDichVu
 * =====================================================================
 */

const { sql, poolPromise } = require('../config/db');

/**
 * 1. Lấy danh sách tất cả dịch vụ (Nước uống, phụ kiện, thuê đồ...)
 * Method: GET /api/dich-vu
 * Procedure: sp_LayDanhSachDichVu
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
 * 2. Thêm mới mặt hàng dịch vụ
 * Method: POST /api/dich-vu
 * Procedure: sp_ThemDichVuMoi
 */
const themDichVu = async (req, res) => {
    try {
        const { ten_dich_vu, don_gia, don_vi_tinh, ton_kho } = req.body;

        if (!ten_dich_vu || !don_gia || !don_vi_tinh) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ: Tên dịch vụ, Đơn giá và Đơn vị tính!'
            });
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('ten_dich_vu', sql.NVarChar(100), ten_dich_vu)
            .input('don_gia', sql.Decimal(10, 2), parseFloat(don_gia))
            .input('don_vi_tinh', sql.NVarChar(20), don_vi_tinh)
            .input('ton_kho', sql.Int, ton_kho ? parseInt(ton_kho, 10) : 0)
            .execute('sp_ThemDichVuMoi');

        return res.status(201).json({
            success: true,
            message: 'Thêm dịch vụ mới thành công!',
            data: result.recordset[0]
        });
    } catch (error) {
        console.error('Lỗi sp_ThemDichVuMoi:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi thêm dịch vụ'
        });
    }
};

/**
 * 3. Cập nhật thông tin dịch vụ
 * Method: PUT /api/dich-vu/:id
 * Procedure: sp_SuaDichVu
 */
const suaDichVu = async (req, res) => {
    try {
        const { id } = req.params;
        const { ten_dich_vu, don_gia, don_vi_tinh, ton_kho } = req.body;

        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, parseInt(id, 10))
            .input('ten_dich_vu', sql.NVarChar(100), ten_dich_vu)
            .input('don_gia', sql.Decimal(10, 2), parseFloat(don_gia))
            .input('don_vi_tinh', sql.NVarChar(20), don_vi_tinh)
            .input('ton_kho', sql.Int, parseInt(ton_kho, 10))
            .execute('sp_SuaDichVu');

        return res.status(200).json({
            success: true,
            message: 'Cập nhật dịch vụ thành công!',
            data: result.recordset[0]
        });
    } catch (error) {
        console.error('Lỗi sp_SuaDichVu:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi cập nhật dịch vụ'
        });
    }
};

/**
 * 4. Xóa dịch vụ
 * Method: DELETE /api/dich-vu/:id
 * Procedure: sp_XoaDichVu
 */
const xoaDichVu = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, parseInt(id, 10))
            .execute('sp_XoaDichVu');

        return res.status(200).json({
            success: true,
            message: 'Xóa dịch vụ thành công!'
        });
    } catch (error) {
        console.error('Lỗi sp_XoaDichVu:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi xóa dịch vụ'
        });
    }
};

/**
 * 5. Thêm dịch vụ / Bán dịch vụ vào đơn đặt sân (Mini POS)
 * Method: POST /api/dich-vu/them-vao-don
 * Procedure: sp_ThemDichVu
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
 * 6. Nhập kho dịch vụ
 * Method: POST /api/dich-vu/nhap-kho
 * Procedure: sp_NhapKhoDichVu
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
    themDichVu,
    suaDichVu,
    xoaDichVu,
    themDichVuVaoDon,
    nhapKhoDichVu
};
