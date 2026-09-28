/**
 * =====================================================================
 * CONTROLLER: QUẢN LÝ ĐẶT SÂN (DAT SAN CONTROLLER)
 * Thực thi các Stored Procedure: sp_LayDanhSachSan, sp_LayLichSan, sp_DatSan, sp_HuyDonVaHoanCoc
 * =====================================================================
 */

const { sql, poolPromise } = require('../config/db');

/**
 * 1. Lấy danh sách tất cả các sân bóng
 * Method: GET /api/dat-san/danh-sach-san
 */
const layDanhSachSan = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .execute('sp_LayDanhSachSan');

        return res.status(200).json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Lỗi sp_LayDanhSachSan:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi lấy danh sách sân bóng'
        });
    }
};

/**
 * 2. Lấy lịch đặt sân theo ngày và mã sân
 * Method: GET /api/dat-san/lich-san?ngay_da=YYYY-MM-DD&ma_san=1
 */
const layLichSan = async (req, res) => {
    try {
        const { ngay_da, ma_san } = req.query;

        if (!ngay_da) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp tham số ngay_da (Định dạng: YYYY-MM-DD)!'
            });
        }

        const pool = await poolPromise;
        const request = pool.request()
            .input('ngay_da', sql.Date, ngay_da);

        if (ma_san) {
            request.input('ma_san', sql.Int, parseInt(ma_san, 10));
        } else {
            request.input('ma_san', sql.Int, null);
        }

        const result = await request.execute('sp_LayLichSan');

        return res.status(200).json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Lỗi sp_LayLichSan:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi lấy lịch đặt sân'
        });
    }
};

/**
 * 3. Đặt sân bóng
 * Method: POST /api/dat-san
 * Header: Authorization: Bearer <token>
 */
const datSan = async (req, res) => {
    try {
        const ma_nguoi_dung = req.user.id; // Lấy từ Token đã giải mã
        const { ma_san, ngay_da, gio_bat_dau, gio_ket_thuc, tien_san } = req.body;

        if (!ma_san || !ngay_da || !gio_bat_dau || !gio_ket_thuc) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ: ma_san, ngay_da, gio_bat_dau, gio_ket_thuc!'
            });
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('ma_nguoi_dung', sql.Int, ma_nguoi_dung)
            .input('ma_san', sql.Int, parseInt(ma_san, 10))
            .input('ngay_da', sql.Date, ngay_da)
            .input('gio_bat_dau', sql.VarChar(8), gio_bat_dau) // Định dạng HH:mm hoặc HH:mm:ss
            .input('gio_ket_thuc', sql.VarChar(8), gio_ket_thuc)
            .input('tien_san', sql.Decimal(10, 2), tien_san || null)
            .execute('sp_DatSan');

        const booking = result.recordset[0];

        return res.status(201).json({
            success: true,
            message: 'Đặt sân thành công! Đơn đang ở trạng thái chờ xác nhận.',
            data: booking
        });
    } catch (error) {
        console.error('Lỗi sp_DatSan:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi thực hiện đặt sân'
        });
    }
};

/**
 * 4. Hủy đơn đặt sân và hoàn cọc
 * Method: POST /api/dat-san/huy-don
 * Header: Authorization: Bearer <token>
 */
const huyDonVaHoanCoc = async (req, res) => {
    try {
        const ma_nguoi_dung = req.user.id;
        const { ma_don_dat, ly_do_huy } = req.body;

        if (!ma_don_dat) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp ma_don_dat để hủy đơn!'
            });
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('ma_don_dat', sql.Int, parseInt(ma_don_dat, 10))
            .input('ma_nguoi_dung', sql.Int, ma_nguoi_dung)
            .input('ly_do_huy', sql.NVarChar(255), ly_do_huy || 'Khách hàng hủy đơn')
            .execute('sp_HuyDonVaHoanCoc');

        const cancelResult = result.recordset[0];

        return res.status(200).json({
            success: true,
            message: 'Hủy đơn đặt sân và xử lý hoàn tiền thành công!',
            data: cancelResult
        });
    } catch (error) {
        console.error('Lỗi sp_HuyDonVaHoanCoc:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi hủy đơn đặt sân'
        });
    }
};

module.exports = {
    layDanhSachSan,
    layLichSan,
    datSan,
    huyDonVaHoanCoc
};
