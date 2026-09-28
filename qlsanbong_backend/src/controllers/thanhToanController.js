/**
 * =====================================================================
 * CONTROLLER: THANH TOÁN (THANH TOAN CONTROLLER)
 * Thực thi Stored Procedure: sp_ThanhToanDon
 * =====================================================================
 */

const { sql, poolPromise } = require('../config/db');

/**
 * Xử lý thanh toán đơn đặt sân (Đặt cọc hoặc thanh toán toàn bộ)
 * Method: POST /api/thanh-toan
 * Header: Authorization: Bearer <token>
 * Body: {
 *   "ma_don_dat": 1,
 *   "phuong_thuc": "TIEN_MAT" | "VNPAY" | "MOMO",
 *   "loai_thanh_toan": "DAT_COC" | "TRA_HET",
 *   "so_tien": 150000,
 *   "ma_giao_dich": "GD123456" (Tùy chọn)
 * }
 */
const thanhToanDon = async (req, res) => {
    try {
        const { ma_don_dat, phuong_thuc, loai_thanh_toan, so_tien, ma_giao_dich } = req.body;

        if (!ma_don_dat || !phuong_thuc || !loai_thanh_toan || !so_tien) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ: ma_don_dat, phuong_thuc, loai_thanh_toan, so_tien!'
            });
        }

        const validPhuongThuc = ['TIEN_MAT', 'VNPAY', 'MOMO'];
        const validLoaiThanhToan = ['DAT_COC', 'TRA_HET'];

        if (!validPhuongThuc.includes(phuong_thuc)) {
            return res.status(400).json({
                success: false,
                message: `Phương thức không hợp lệ. Cho phép: ${validPhuongThuc.join(', ')}`
            });
        }

        if (!validLoaiThanhToan.includes(loai_thanh_toan)) {
            return res.status(400).json({
                success: false,
                message: `Loại thanh toán không hợp lệ. Cho phép: ${validLoaiThanhToan.join(', ')}`
            });
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('ma_don_dat', sql.Int, parseInt(ma_don_dat, 10))
            .input('phuong_thuc', sql.VarChar(20), phuong_thuc)
            .input('loai_thanh_toan', sql.VarChar(20), loai_thanh_toan)
            .input('so_tien', sql.Decimal(10, 2), parseFloat(so_tien))
            .input('ma_giao_dich', sql.VarChar(100), ma_giao_dich || null)
            .execute('sp_ThanhToanDon');

        const payment = result.recordset[0];

        return res.status(200).json({
            success: true,
            message: 'Thanh toán đơn đặt sân thành công!',
            data: payment
        });
    } catch (error) {
        console.error('Lỗi sp_ThanhToanDon:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi xử lý thanh toán đơn đặt sân'
        });
    }
};

module.exports = {
    thanhToanDon
};
