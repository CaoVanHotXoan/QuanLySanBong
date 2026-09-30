/**
 * =====================================================================
 * CONTROLLER: QUẢN LÝ SÂN, LỊCH SÂN & ĐẶT SÂN (DAT SAN CONTROLLER)
 * 100% SỬ DỤNG STORED PROCEDURES (SQL SERVER):
 * 1. sp_LayDanhSachSan
 * 2. sp_LayDanhSachLoaiSan
 * 3. sp_ThemSanBong
 * 4. sp_SuaSanBong
 * 5. sp_XoaSanBong
 * 6. sp_LayKhungGioGia
 * 7. sp_ThemKhungGioGia
 * 8. sp_SuaKhungGioGia
 * 9. sp_XoaKhungGioGia
 * 10. sp_LayTatCaDonDat
 * 11. sp_LayLichSan
 * 12. sp_DatSan
 * 13. sp_HuyDonVaHoanCoc
 * =====================================================================
 */

const { sql, poolPromise } = require('../config/db');

/**
 * 1. Lấy danh sách tất cả các sân bóng
 * Method: GET /api/dat-san/danh-sach-san
 * Procedure: sp_LayDanhSachSan
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
 * 2. Lấy danh sách loại sân (Sân 5, Sân 7, Pickleball...)
 * Method: GET /api/dat-san/loai-san
 * Procedure: sp_LayDanhSachLoaiSan
 */
const layDanhSachLoaiSan = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .execute('sp_LayDanhSachLoaiSan');

        return res.status(200).json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Lỗi sp_LayDanhSachLoaiSan:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi lấy danh sách loại sân'
        });
    }
};

/**
 * 3. Thêm sân bóng mới (Admin Dashboard)
 * Method: POST /api/dat-san/san-bong
 * Procedure: sp_ThemSanBong
 */
const themSanBong = async (req, res) => {
    try {
        const { ten_san, ma_loai_san, hinh_anh, don_gia_phut, trang_thai } = req.body;

        if (!ten_san || !ma_loai_san) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ: Tên sân và Loại sân!'
            });
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('ten_san', sql.NVarChar(50), ten_san)
            .input('ma_loai_san', sql.Int, parseInt(ma_loai_san, 10))
            .input('hinh_anh', sql.VarChar(255), hinh_anh || null)
            .input('don_gia_phut', sql.Decimal(10, 2), don_gia_phut ? parseFloat(don_gia_phut) : 5000.00)
            .input('trang_thai', sql.VarChar(20), trang_thai || 'SAN_SANG')
            .execute('sp_ThemSanBong');

        return res.status(201).json({
            success: true,
            message: 'Thêm sân bóng mới thành công!',
            data: result.recordset[0]
        });
    } catch (error) {
        console.error('Lỗi sp_ThemSanBong:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi thêm sân bóng'
        });
    }
};

/**
 * 4. Sửa thông tin sân bóng (Admin Dashboard)
 * Method: PUT /api/dat-san/san-bong/:id
 * Procedure: sp_SuaSanBong
 */
const suaSanBong = async (req, res) => {
    try {
        const { id } = req.params;
        const { ten_san, ma_loai_san, hinh_anh, don_gia_phut, trang_thai } = req.body;

        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, parseInt(id, 10))
            .input('ten_san', sql.NVarChar(50), ten_san)
            .input('ma_loai_san', sql.Int, parseInt(ma_loai_san, 10))
            .input('hinh_anh', sql.VarChar(255), hinh_anh || null)
            .input('don_gia_phut', sql.Decimal(10, 2), don_gia_phut ? parseFloat(don_gia_phut) : null)
            .input('trang_thai', sql.VarChar(20), trang_thai || 'SAN_SANG')
            .execute('sp_SuaSanBong');

        return res.status(200).json({
            success: true,
            message: 'Cập nhật sân bóng thành công!',
            data: result.recordset[0]
        });
    } catch (error) {
        console.error('Lỗi sp_SuaSanBong:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi cập nhật sân bóng'
        });
    }
};

/**
 * 5. Xóa sân bóng (Admin Dashboard)
 * Method: DELETE /api/dat-san/san-bong/:id
 * Procedure: sp_XoaSanBong
 */
const xoaSanBong = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, parseInt(id, 10))
            .execute('sp_XoaSanBong');

        return res.status(200).json({
            success: true,
            message: 'Xóa sân bóng thành công!'
        });
    } catch (error) {
        console.error('Lỗi sp_XoaSanBong:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi xóa sân bóng'
        });
    }
};

/**
 * 6. Lấy danh sách khung giờ giá
 * Method: GET /api/dat-san/khung-gio-gia
 * Procedure: sp_LayKhungGioGia
 */
const layKhungGioGia = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .execute('sp_LayKhungGioGia');

        return res.status(200).json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Lỗi sp_LayKhungGioGia:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi lấy khung giờ giá'
        });
    }
};

/**
 * 7. Thêm khung giờ giá mới (Admin Dashboard)
 * Method: POST /api/dat-san/khung-gio-gia
 * Procedure: sp_ThemKhungGioGia
 */
const themKhungGioGia = async (req, res) => {
    try {
        const { ma_loai_san, gio_bat_dau, gio_ket_thuc, la_cuoi_tuan, don_gia } = req.body;

        const pool = await poolPromise;
        const result = await pool.request()
            .input('ma_loai_san', sql.Int, parseInt(ma_loai_san, 10))
            .input('gio_bat_dau', sql.VarChar(8), gio_bat_dau)
            .input('gio_ket_thuc', sql.VarChar(8), gio_ket_thuc)
            .input('la_cuoi_tuan', sql.Bit, la_cuoi_tuan ? 1 : 0)
            .input('don_gia', sql.Decimal(10, 2), parseFloat(don_gia))
            .execute('sp_ThemKhungGioGia');

        return res.status(201).json({
            success: true,
            message: 'Thêm khung giờ giá mới thành công!',
            data: result.recordset[0]
        });
    } catch (error) {
        console.error('Lỗi sp_ThemKhungGioGia:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi thêm khung giờ giá'
        });
    }
};

/**
 * 8. Sửa khung giờ giá (Admin Dashboard)
 * Method: PUT /api/dat-san/khung-gio-gia/:id
 * Procedure: sp_SuaKhungGioGia
 */
const suaKhungGioGia = async (req, res) => {
    try {
        const { id } = req.params;
        const { ma_loai_san, gio_bat_dau, gio_ket_thuc, la_cuoi_tuan, don_gia } = req.body;

        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, parseInt(id, 10))
            .input('ma_loai_san', sql.Int, parseInt(ma_loai_san, 10))
            .input('gio_bat_dau', sql.VarChar(8), gio_bat_dau)
            .input('gio_ket_thuc', sql.VarChar(8), gio_ket_thuc)
            .input('la_cuoi_tuan', sql.Bit, la_cuoi_tuan ? 1 : 0)
            .input('don_gia', sql.Decimal(10, 2), parseFloat(don_gia))
            .execute('sp_SuaKhungGioGia');

        return res.status(200).json({
            success: true,
            message: 'Cập nhật khung giờ giá thành công!',
            data: result.recordset[0]
        });
    } catch (error) {
        console.error('Lỗi sp_SuaKhungGioGia:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi cập nhật khung giờ giá'
        });
    }
};

/**
 * 9. Xóa khung giờ giá (Admin Dashboard)
 * Method: DELETE /api/dat-san/khung-gio-gia/:id
 * Procedure: sp_XoaKhungGioGia
 */
const xoaKhungGioGia = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, parseInt(id, 10))
            .execute('sp_XoaKhungGioGia');

        return res.status(200).json({
            success: true,
            message: 'Xóa khung giờ giá thành công!'
        });
    } catch (error) {
        console.error('Lỗi sp_XoaKhungGioGia:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi xóa khung giờ giá'
        });
    }
};

/**
 * 10. Lấy tất cả danh sách đơn đặt sân (Admin Dashboard & KPI)
 * Method: GET /api/dat-san/tat-ca-don
 * Procedure: sp_LayTatCaDonDat
 */
const layTatCaDonDat = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .execute('sp_LayTatCaDonDat');

        return res.status(200).json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Lỗi sp_LayTatCaDonDat:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi lấy danh sách tất cả đơn đặt sân'
        });
    }
};

/**
 * 11. Lấy lịch đặt sân theo ngày và mã sân (Timeline Grid Matrix)
 * Method: GET /api/dat-san/lich-san?ngay_da=YYYY-MM-DD&ma_san=1
 * Procedure: sp_LayLichSan
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
 * 12. Đặt sân bóng
 * Method: POST /api/dat-san
 * Procedure: sp_DatSan
 */
const datSan = async (req, res) => {
    try {
        const ma_nguoi_dung = req.user ? req.user.id : (req.body.ma_nguoi_dung || 1);
        const { ma_san, ngay_da, gio_bat_dau, gio_ket_thuc, tien_san } = req.body;

        if (!ma_san || !ngay_da || !gio_bat_dau || !gio_ket_thuc) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ: ma_san, ngay_da, gio_bat_dau, gio_ket_thuc!'
            });
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('ma_nguoi_dung', sql.Int, parseInt(ma_nguoi_dung, 10))
            .input('ma_san', sql.Int, parseInt(ma_san, 10))
            .input('ngay_da', sql.Date, ngay_da)
            .input('gio_bat_dau', sql.VarChar(8), gio_bat_dau)
            .input('gio_ket_thuc', sql.VarChar(8), gio_ket_thuc)
            .input('tien_san', sql.Decimal(10, 2), tien_san ? parseFloat(tien_san) : null)
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
 * 13. Hủy đơn đặt sân và hoàn cọc
 * Method: POST /api/dat-san/huy-don
 * Procedure: sp_HuyDonVaHoanCoc
 */
const huyDonVaHoanCoc = async (req, res) => {
    try {
        const ma_nguoi_dung = req.user ? req.user.id : (req.body.ma_nguoi_dung || 1);
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
            .input('ma_nguoi_dung', sql.Int, parseInt(ma_nguoi_dung, 10))
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

/**
 * 14. Tính giá sân linh hoạt theo số phút
 * Method: POST /api/dat-san/tinh-gia-linh-hoat
 * Procedure: sp_TinhGiaSanLinhHoat
 */
const tinhGiaLinhHoat = async (req, res) => {
    try {
        const { ma_san, ngay_da, gio_bat_dau, gio_ket_thuc } = req.body;

        if (!ma_san || !ngay_da || !gio_bat_dau || !gio_ket_thuc) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ: ma_san, ngay_da, gio_bat_dau, gio_ket_thuc!'
            });
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('ma_san', sql.Int, parseInt(ma_san, 10))
            .input('ngay_da', sql.Date, ngay_da)
            .input('gio_bat_dau', sql.VarChar(8), gio_bat_dau)
            .input('gio_ket_thuc', sql.VarChar(8), gio_ket_thuc)
            .execute('sp_TinhGiaSanLinhHoat');

        return res.status(200).json({
            success: true,
            data: result.recordset[0]
        });
    } catch (error) {
        console.error('Lỗi sp_TinhGiaSanLinhHoat:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi tính giá sân linh hoạt'
        });
    }
};

/**
 * 15. Đặt sân theo giờ linh hoạt
 * Method: POST /api/dat-san/dat-linh-hoat
 * Procedure: sp_DatSanLinhHoat
 */
const datSanLinhHoat = async (req, res) => {
    try {
        const ma_nguoi_dung = req.user ? req.user.id : (req.body.ma_nguoi_dung || 1);
        const { ma_san, ngay_da, gio_bat_dau, gio_ket_thuc, ghi_chu, tien_coc } = req.body;

        if (!ma_san || !ngay_da || !gio_bat_dau || !gio_ket_thuc) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ: ma_san, ngay_da, gio_bat_dau, gio_ket_thuc!'
            });
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('ma_nguoi_dung', sql.Int, parseInt(ma_nguoi_dung, 10))
            .input('ma_san', sql.Int, parseInt(ma_san, 10))
            .input('ngay_da', sql.Date, ngay_da)
            .input('gio_bat_dau', sql.VarChar(8), gio_bat_dau)
            .input('gio_ket_thuc', sql.VarChar(8), gio_ket_thuc)
            .input('ghi_chu', sql.NVarChar(255), ghi_chu || null)
            .input('tien_coc', sql.Decimal(10, 2), tien_coc ? parseFloat(tien_coc) : 0)
            .execute('sp_DatSanLinhHoat');

        return res.status(201).json({
            success: true,
            message: 'Đặt sân tính giờ linh hoạt thành công!',
            data: result.recordset[0]
        });
    } catch (error) {
        console.error('Lỗi sp_DatSanLinhHoat:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi đặt sân linh hoạt'
        });
    }
};

/**
 * 16. Bắt đầu tính giờ linh hoạt ngay tại quầy (Check-in tức thì)
 * Method: POST /api/dat-san/checkin-linh-hoat
 * Procedure: sp_BatDauDaLinhHoat
 */
const batDauDaLinhHoat = async (req, res) => {
    try {
        const ma_nguoi_dung = req.user ? req.user.id : (req.body.ma_nguoi_dung || 3);
        const { ma_san, ten_khach_hang, so_dien_thoai, ghi_chu } = req.body;

        if (!ma_san) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp mã sân (ma_san)!'
            });
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('ma_nguoi_dung', sql.Int, parseInt(ma_nguoi_dung, 10))
            .input('ma_san', sql.Int, parseInt(ma_san, 10))
            .input('ten_khach_hang', sql.NVarChar(100), ten_khach_hang || null)
            .input('so_dien_thoai', sql.VarChar(15), so_dien_thoai || null)
            .input('ghi_chu', sql.NVarChar(255), ghi_chu || null)
            .execute('sp_BatDauDaLinhHoat');

        return res.status(201).json({
            success: true,
            message: 'Đã check-in và bắt đầu tính giờ đá linh hoạt cho sân!',
            data: result.recordset[0]
        });
    } catch (error) {
        console.error('Lỗi sp_BatDauDaLinhHoat:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi bắt đầu tính giờ đá linh hoạt'
        });
    }
};

/**
 * 17. Kết thúc đá linh hoạt và chốt thanh toán theo phút (Check-out)
 * Method: POST /api/dat-san/checkout-linh-hoat
 * Procedure: sp_KetThucDaLinhHoat
 */
const ketThucDaLinhHoat = async (req, res) => {
    try {
        const { ma_don_dat, gio_ket_thuc } = req.body;

        if (!ma_don_dat) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp mã đơn đặt (ma_don_dat)!'
            });
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('ma_don_dat', sql.Int, parseInt(ma_don_dat, 10))
            .input('gio_ket_thuc', sql.VarChar(8), gio_ket_thuc || null)
            .execute('sp_KetThucDaLinhHoat');

        return res.status(200).json({
            success: true,
            message: 'Đã chốt giờ và tính tiền sân linh hoạt thành công!',
            data: result.recordset[0]
        });
    } catch (error) {
        console.error('Lỗi sp_KetThucDaLinhHoat:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi kết thúc tính giờ đá linh hoạt'
        });
    }
};

module.exports = {
    layDanhSachSan,
    layDanhSachLoaiSan,
    themSanBong,
    suaSanBong,
    xoaSanBong,
    layKhungGioGia,
    themKhungGioGia,
    suaKhungGioGia,
    xoaKhungGioGia,
    layTatCaDonDat,
    layLichSan,
    datSan,
    huyDonVaHoanCoc,
    tinhGiaLinhHoat,
    datSanLinhHoat,
    batDauDaLinhHoat,
    ketThucDaLinhHoat
};
