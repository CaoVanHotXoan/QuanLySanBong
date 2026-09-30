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

/**
 * Lấy danh sách lịch sử giao dịch thanh toán
 * Method: GET /api/thanh-toan/danh-sach
 * Procedure: sp_LayDanhSachThanhToan
 */
const layDanhSachThanhToan = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().execute('sp_LayDanhSachThanhToan');
        return res.status(200).json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Lỗi sp_LayDanhSachThanhToan:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi lấy danh sách thanh toán'
        });
    }
};

/**
 * Lấy danh sách lịch sử hoàn tiền / hủy đơn
 * Method: GET /api/thanh-toan/hoan-tien
 * Procedure: sp_LayDanhSachHoanTien
 */
const layDanhSachHoanTien = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT h.id, h.ma_don_dat, h.so_tien_hoan, h.ty_le_hoan, h.ly_do_huy, h.ngay_hoan,
                   u.ho_ten AS ten_khach_hang, u.so_dien_thoai, s.ten_san, d.ngay_da
            FROM Lich_Su_Hoan_Tien h
            LEFT JOIN Don_Dat_San d ON h.ma_don_dat = d.id
            LEFT JOIN Nguoi_Dung u ON d.ma_nguoi_dung = u.id
            LEFT JOIN San_Bong s ON d.ma_san = s.id
            ORDER BY h.id DESC
        `);
        return res.status(200).json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Lỗi layDanhSachHoanTien:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi lấy danh sách hoàn tiền'
        });
    }
};

/**
 * Thêm bản ghi hoàn tiền
 * Method: POST /api/thanh-toan/hoan-tien
 */
const themHoanTien = async (req, res) => {
    try {
        const { ma_don_dat, so_tien_hoan, ty_le_hoan, ly_do_huy } = req.body;
        if (!ma_don_dat || so_tien_hoan === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp mã đơn đặt và số tiền hoàn!'
            });
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('ma_don_dat', sql.Int, parseInt(ma_don_dat, 10))
            .input('so_tien_hoan', sql.Decimal(10, 2), parseFloat(so_tien_hoan) || 0)
            .input('ty_le_hoan', sql.Int, parseInt(ty_le_hoan, 10) || 100)
            .input('ly_do_huy', sql.NVarChar(255), ly_do_huy || 'Hủy sân hoàn cọc')
            .query(`
                INSERT INTO Lich_Su_Hoan_Tien (ma_don_dat, so_tien_hoan, ty_le_hoan, ly_do_huy, ngay_hoan)
                OUTPUT inserted.*
                VALUES (@ma_don_dat, @so_tien_hoan, @ty_le_hoan, @ly_do_huy, GETDATE())
            `);

        return res.status(201).json({
            success: true,
            message: 'Thêm bản ghi hoàn tiền thành công!',
            data: result.recordset[0]
        });
    } catch (error) {
        console.error('Lỗi themHoanTien:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi thêm bản ghi hoàn tiền'
        });
    }
};

/**
 * Sửa bản ghi hoàn tiền
 * Method: PUT /api/thanh-toan/hoan-tien/:id
 */
const suaHoanTien = async (req, res) => {
    try {
        const { id } = req.params;
        const { so_tien_hoan, ty_le_hoan, ly_do_huy } = req.body;

        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, parseInt(id, 10))
            .input('so_tien_hoan', sql.Decimal(10, 2), parseFloat(so_tien_hoan) || 0)
            .input('ty_le_hoan', sql.Int, parseInt(ty_le_hoan, 10) || 100)
            .input('ly_do_huy', sql.NVarChar(255), ly_do_huy || '')
            .query(`
                UPDATE Lich_Su_Hoan_Tien
                SET so_tien_hoan = @so_tien_hoan,
                    ty_le_hoan = @ty_le_hoan,
                    ly_do_huy = @ly_do_huy
                OUTPUT inserted.*
                WHERE id = @id
            `);

        return res.status(200).json({
            success: true,
            message: 'Cập nhật bản ghi hoàn tiền thành công!',
            data: result.recordset[0]
        });
    } catch (error) {
        console.error('Lỗi suaHoanTien:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi sửa bản ghi hoàn tiền'
        });
    }
};

/**
 * Xóa bản ghi hoàn tiền
 * Method: DELETE /api/thanh-toan/hoan-tien/:id
 */
const xoaHoanTien = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, parseInt(id, 10))
            .query('DELETE FROM Lich_Su_Hoan_Tien WHERE id = @id');

        return res.status(200).json({
            success: true,
            message: 'Xóa bản ghi hoàn tiền thành công!'
        });
    } catch (error) {
        console.error('Lỗi xoaHoanTien:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi xóa bản ghi hoàn tiền'
        });
    }
};

module.exports = {
    thanhToanDon,
    layDanhSachThanhToan,
    layDanhSachHoanTien,
    themHoanTien,
    suaHoanTien,
    xoaHoanTien
};
