"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.banLeDichVu = exports.chuyenSanDaTiep = exports.xacNhanGiaHan = exports.kiemTraGiaHan = exports.vaoSan = exports.xoaDonDatVaThanhToan = exports.suaDonDatVaThanhToan = exports.themDonDatVaThanhToan = exports.resetKhungGio = exports.xoaKhungGio = exports.suaKhungGio = exports.themKhungGio = exports.layTatCaKhungGioAdmin = exports.layDanhSachKhungGio = exports.ketThucDaLinhHoat = exports.batDauDaLinhHoat = exports.datSanLinhHoat = exports.tinhGiaLinhHoat = exports.huyDonVaHoanCoc = exports.layLichSuKhachHang = exports.datSan = exports.layLichSan = exports.layTatCaDonDat = exports.xoaKhungGioGia = exports.suaKhungGioGia = exports.themKhungGioGia = exports.layKhungGioGia = exports.xoaSanBong = exports.suaSanBong = exports.themSanBong = exports.xoaLoaiSan = exports.suaLoaiSan = exports.themLoaiSan = exports.layDanhSachLoaiSan = exports.layDanhSachSan = void 0;
const db_1 = require("../config/db");
/**
 * 1. Lấy danh sách tất cả các sân bóng
 * Method: GET /api/dat-san/danh-sach-san
 * Procedure: sp_LayDanhSachSan
 */
const layDanhSachSan = async (req, res) => {
    try {
        const pool = await db_1.poolPromise;
        const result = await pool.request()
            .execute('sp_LayDanhSachSan');
        return res.status(200).json({
            success: true,
            data: result.recordset
        });
    }
    catch (error) {
        console.error('Lỗi sp_LayDanhSachSan:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi lấy danh sách sân bóng'
        });
    }
};
exports.layDanhSachSan = layDanhSachSan;
/**
 * 2. Lấy danh sách loại sân (Sân 5, Sân 7, Pickleball...)
 * Method: GET /api/dat-san/loai-san
 * Procedure: sp_LayDanhSachLoaiSan
 */
const layDanhSachLoaiSan = async (req, res) => {
    try {
        const pool = await db_1.poolPromise;
        const result = await pool.request()
            .execute('sp_LayDanhSachLoaiSan');
        return res.status(200).json({
            success: true,
            data: result.recordset
        });
    }
    catch (error) {
        console.error('Lỗi sp_LayDanhSachLoaiSan:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi lấy danh sách loại sân'
        });
    }
};
exports.layDanhSachLoaiSan = layDanhSachLoaiSan;
/**
 * 2b. Thêm loại sân mới (Admin Dashboard)
 * Method: POST /api/dat-san/loai-san
 * Procedure: sp_ThemLoaiSan
 */
const themLoaiSan = async (req, res) => {
    try {
        const { ten_loai, mo_ta, trang_thai } = req.body;
        if (!ten_loai) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập tên loại sân!'
            });
        }
        const pool = await db_1.poolPromise;
        const result = await pool.request()
            .input('ten_loai', db_1.sql.NVarChar(50), ten_loai)
            .input('mo_ta', db_1.sql.NVarChar(db_1.sql.MAX), mo_ta || null)
            .input('trang_thai', db_1.sql.Bit, trang_thai !== false ? 1 : 0)
            .execute('sp_ThemLoaiSan');
        return res.status(201).json({
            success: true,
            message: 'Thêm loại sân mới thành công!',
            data: result.recordset[0]
        });
    }
    catch (error) {
        console.error('Lỗi sp_ThemLoaiSan:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi thêm loại sân'
        });
    }
};
exports.themLoaiSan = themLoaiSan;
/**
 * 2c. Sửa thông tin loại sân (Admin Dashboard)
 * Method: PUT /api/dat-san/loai-san/:id
 * Procedure: sp_SuaLoaiSan
 */
const suaLoaiSan = async (req, res) => {
    try {
        const id = String(req.params.id);
        const { ten_loai, mo_ta, trang_thai } = req.body;
        const pool = await db_1.poolPromise;
        const result = await pool.request()
            .input('id', db_1.sql.Int, parseInt(id, 10))
            .input('ten_loai', db_1.sql.NVarChar(50), ten_loai)
            .input('mo_ta', db_1.sql.NVarChar(db_1.sql.MAX), mo_ta || null)
            .input('trang_thai', db_1.sql.Bit, trang_thai !== false ? 1 : 0)
            .execute('sp_SuaLoaiSan');
        return res.status(200).json({
            success: true,
            message: 'Cập nhật loại sân thành công!',
            data: result.recordset[0]
        });
    }
    catch (error) {
        console.error('Lỗi sp_SuaLoaiSan:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi cập nhật loại sân'
        });
    }
};
exports.suaLoaiSan = suaLoaiSan;
/**
 * 2d. Xóa loại sân (Admin Dashboard)
 * Method: DELETE /api/dat-san/loai-san/:id
 * Procedure: sp_XoaLoaiSan
 */
const xoaLoaiSan = async (req, res) => {
    try {
        const id = String(req.params.id);
        const pool = await db_1.poolPromise;
        await pool.request()
            .input('id', db_1.sql.Int, parseInt(id, 10))
            .execute('sp_XoaLoaiSan');
        return res.status(200).json({
            success: true,
            message: 'Xóa loại sân thành công!'
        });
    }
    catch (error) {
        console.error('Lỗi sp_XoaLoaiSan:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi xóa loại sân'
        });
    }
};
exports.xoaLoaiSan = xoaLoaiSan;
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
        const pool = await db_1.poolPromise;
        const result = await pool.request()
            .input('ten_san', db_1.sql.NVarChar(50), ten_san)
            .input('ma_loai_san', db_1.sql.Int, parseInt(ma_loai_san, 10))
            .input('hinh_anh', db_1.sql.VarChar(255), hinh_anh || null)
            .input('don_gia_phut', db_1.sql.Decimal(10, 2), don_gia_phut ? parseFloat(don_gia_phut) : 5000.00)
            .input('trang_thai', db_1.sql.VarChar(20), trang_thai || 'SAN_SANG')
            .execute('sp_ThemSanBong');
        return res.status(201).json({
            success: true,
            message: 'Thêm sân bóng mới thành công!',
            data: result.recordset[0]
        });
    }
    catch (error) {
        console.error('Lỗi sp_ThemSanBong:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi thêm sân bóng'
        });
    }
};
exports.themSanBong = themSanBong;
/**
 * 4. Sửa thông tin sân bóng (Admin Dashboard)
 * Method: PUT /api/dat-san/san-bong/:id
 * Procedure: sp_SuaSanBong
 */
const suaSanBong = async (req, res) => {
    try {
        const id = String(req.params.id);
        const { ten_san, ma_loai_san, hinh_anh, don_gia_phut, trang_thai } = req.body;
        const pool = await db_1.poolPromise;
        const result = await pool.request()
            .input('id', db_1.sql.Int, parseInt(id, 10))
            .input('ten_san', db_1.sql.NVarChar(50), ten_san)
            .input('ma_loai_san', db_1.sql.Int, parseInt(ma_loai_san, 10))
            .input('hinh_anh', db_1.sql.VarChar(255), hinh_anh || null)
            .input('don_gia_phut', db_1.sql.Decimal(10, 2), don_gia_phut ? parseFloat(don_gia_phut) : null)
            .input('trang_thai', db_1.sql.VarChar(20), trang_thai || 'SAN_SANG')
            .execute('sp_SuaSanBong');
        return res.status(200).json({
            success: true,
            message: 'Cập nhật sân bóng thành công!',
            data: result.recordset[0]
        });
    }
    catch (error) {
        console.error('Lỗi sp_SuaSanBong:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi cập nhật sân bóng'
        });
    }
};
exports.suaSanBong = suaSanBong;
/**
 * 5. Xóa sân bóng (Admin Dashboard)
 * Method: DELETE /api/dat-san/san-bong/:id
 * Procedure: sp_XoaSanBong
 */
const xoaSanBong = async (req, res) => {
    try {
        const id = String(req.params.id);
        const pool = await db_1.poolPromise;
        await pool.request()
            .input('id', db_1.sql.Int, parseInt(id, 10))
            .execute('sp_XoaSanBong');
        return res.status(200).json({
            success: true,
            message: 'Xóa sân bóng thành công!'
        });
    }
    catch (error) {
        console.error('Lỗi sp_XoaSanBong:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi xóa sân bóng'
        });
    }
};
exports.xoaSanBong = xoaSanBong;
/**
 * 6. Lấy danh sách khung giờ giá
 * Method: GET /api/dat-san/khung-gio-gia
 * Procedure: sp_LayKhungGioGia
 */
const layKhungGioGia = async (req, res) => {
    try {
        const pool = await db_1.poolPromise;
        const result = await pool.request()
            .execute('sp_LayKhungGioGia');
        return res.status(200).json({
            success: true,
            data: result.recordset
        });
    }
    catch (error) {
        console.error('Lỗi sp_LayKhungGioGia:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi lấy khung giờ giá'
        });
    }
};
exports.layKhungGioGia = layKhungGioGia;
/**
 * 7. Thêm khung giờ giá mới (Admin Dashboard)
 * Method: POST /api/dat-san/khung-gio-gia
 * Procedure: sp_ThemKhungGioGia
 */
const themKhungGioGia = async (req, res) => {
    try {
        const { ma_loai_san, gio_bat_dau, gio_ket_thuc, la_cuoi_tuan, don_gia } = req.body;
        const pool = await db_1.poolPromise;
        const result = await pool.request()
            .input('ma_loai_san', db_1.sql.Int, parseInt(ma_loai_san, 10))
            .input('gio_bat_dau', db_1.sql.VarChar(8), gio_bat_dau)
            .input('gio_ket_thuc', db_1.sql.VarChar(8), gio_ket_thuc)
            .input('la_cuoi_tuan', db_1.sql.Bit, la_cuoi_tuan ? 1 : 0)
            .input('don_gia', db_1.sql.Decimal(10, 2), parseFloat(don_gia))
            .execute('sp_ThemKhungGioGia');
        return res.status(201).json({
            success: true,
            message: 'Thêm khung giờ giá mới thành công!',
            data: result.recordset[0]
        });
    }
    catch (error) {
        console.error('Lỗi sp_ThemKhungGioGia:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi thêm khung giờ giá'
        });
    }
};
exports.themKhungGioGia = themKhungGioGia;
/**
 * 8. Sửa khung giờ giá (Admin Dashboard)
 * Method: PUT /api/dat-san/khung-gio-gia/:id
 * Procedure: sp_SuaKhungGioGia
 */
const suaKhungGioGia = async (req, res) => {
    try {
        const id = String(req.params.id);
        const { ma_loai_san, gio_bat_dau, gio_ket_thuc, la_cuoi_tuan, don_gia } = req.body;
        const pool = await db_1.poolPromise;
        const result = await pool.request()
            .input('id', db_1.sql.Int, parseInt(id, 10))
            .input('ma_loai_san', db_1.sql.Int, parseInt(ma_loai_san, 10))
            .input('gio_bat_dau', db_1.sql.VarChar(8), gio_bat_dau)
            .input('gio_ket_thuc', db_1.sql.VarChar(8), gio_ket_thuc)
            .input('la_cuoi_tuan', db_1.sql.Bit, la_cuoi_tuan ? 1 : 0)
            .input('don_gia', db_1.sql.Decimal(10, 2), parseFloat(don_gia))
            .execute('sp_SuaKhungGioGia');
        return res.status(200).json({
            success: true,
            message: 'Cập nhật khung giờ giá thành công!',
            data: result.recordset[0]
        });
    }
    catch (error) {
        console.error('Lỗi sp_SuaKhungGioGia:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi cập nhật khung giờ giá'
        });
    }
};
exports.suaKhungGioGia = suaKhungGioGia;
/**
 * 9. Xóa khung giờ giá (Admin Dashboard)
 * Method: DELETE /api/dat-san/khung-gio-gia/:id
 * Procedure: sp_XoaKhungGioGia
 */
const xoaKhungGioGia = async (req, res) => {
    try {
        const id = String(req.params.id);
        const pool = await db_1.poolPromise;
        await pool.request()
            .input('id', db_1.sql.Int, parseInt(id, 10))
            .execute('sp_XoaKhungGioGia');
        return res.status(200).json({
            success: true,
            message: 'Xóa khung giờ giá thành công!'
        });
    }
    catch (error) {
        console.error('Lỗi sp_XoaKhungGioGia:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi xóa khung giờ giá'
        });
    }
};
exports.xoaKhungGioGia = xoaKhungGioGia;
/**
 * 10. Lấy tất cả danh sách đơn đặt sân (Admin Dashboard & KPI)
 * Method: GET /api/dat-san/tat-ca-don
 * Procedure: sp_LayTatCaDonDat
 */
const layTatCaDonDat = async (req, res) => {
    try {
        const pool = await db_1.poolPromise;
        const result = await pool.request().execute('sp_LayTatCaDonDat');
        const bookings = result.recordset || [];
        // Lấy toàn bộ chi tiết dịch vụ cho các đơn bằng Procedure sp_LayDanhSachChiTietDichVu
        const detailsRes = await pool.request().execute('sp_LayDanhSachChiTietDichVu');
        const allDetails = detailsRes.recordset || [];
        // Lấy toàn bộ lịch sử thanh toán để tính so_tien_da_tra
        let allPayments = [];
        try {
            const paymentsRes = await pool.request().execute('sp_LayDanhSachThanhToan');
            allPayments = paymentsRes.recordset || [];
        }
        catch (payErr) {
            console.warn('Lỗi sp_LayDanhSachThanhToan:', payErr.message);
        }
        const merged = bookings.map((b) => {
            const services = allDetails.filter((d) => d.ma_don_dat === b.id);
            const payments = allPayments.filter((p) => p.ma_don_dat === b.id);
            const so_tien_da_tra = payments.reduce((sum, p) => sum + (Number(p.so_tien) || 0), 0);
            return {
                ...b,
                chi_tiet_dich_vu: services,
                dich_vu_da_dung: services,
                so_tien_da_tra
            };
        });
        return res.status(200).json({
            success: true,
            data: merged
        });
    }
    catch (error) {
        console.error('Lỗi sp_LayTatCaDonDat:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi lấy danh sách tất cả đơn đặt sân'
        });
    }
};
exports.layTatCaDonDat = layTatCaDonDat;
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
        const pool = await db_1.poolPromise;
        const request = pool.request()
            .input('ngay_da', db_1.sql.Date, ngay_da);
        if (ma_san) {
            request.input('ma_san', db_1.sql.Int, parseInt(ma_san, 10));
        }
        else {
            request.input('ma_san', db_1.sql.Int, null);
        }
        const result = await request.execute('sp_LayLichSan');
        const rawList = result.recordset || [];
        // Lấy chi tiết dịch vụ và thanh toán để gắn vào từng booking
        const detailsRes = await pool.request().execute('sp_LayDanhSachChiTietDichVu');
        const allDetails = detailsRes.recordset || [];
        let allPayments = [];
        try {
            const paymentsRes = await pool.request().execute('sp_LayDanhSachThanhToan');
            allPayments = paymentsRes.recordset || [];
        }
        catch (payErr) {
            console.warn('Lỗi sp_LayDanhSachThanhToan:', payErr.message);
        }
        const merged = rawList.map((b) => {
            const bId = b.ma_don_dat || b.id;
            const services = allDetails.filter((d) => d.ma_don_dat === bId);
            const payments = allPayments.filter((p) => p.ma_don_dat === bId);
            const so_tien_da_tra = payments.reduce((sum, p) => sum + (Number(p.so_tien) || 0), 0);
            return {
                ...b,
                chi_tiet_dich_vu: services,
                dich_vu_da_dung: services,
                so_tien_da_tra
            };
        });
        return res.status(200).json({
            success: true,
            data: merged
        });
    }
    catch (error) {
        console.error('Lỗi sp_LayLichSan:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi lấy lịch đặt sân'
        });
    }
};
exports.layLichSan = layLichSan;
/**
 * 12. Đặt sân bóng (Lưu trạng thái DA_COC hoặc DA_THANH_TOAN vào bảng Don_Dat_San)
 * Method: POST /api/dat-san
 */
const datSan = async (req, res) => {
    try {
        const { ma_san, ngay_da, gio_bat_dau, gio_ket_thuc, tien_san, tong_tien, phuong_thuc, loai_thanh_toan, trang_thai, ghi_chu, ho_ten, so_dien_thoai } = req.body;
        if (!ma_san || !ngay_da || !gio_bat_dau || !gio_ket_thuc) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ: ma_san, ngay_da, gio_bat_dau, gio_ket_thuc!'
            });
        }
        const pool = await db_1.poolPromise;
        // 1. Xác định hoặc tạo mới người dùng theo đúng Tên và Số điện thoại khách đặt sân
        let ma_nd = null;
        const ten_khach = (ho_ten && ho_ten.trim()) ? ho_ten.trim() : '';
        const sdt_khach = (so_dien_thoai && so_dien_thoai.trim()) ? so_dien_thoai.trim() : '';
        if (sdt_khach || ten_khach) {
            // Tìm theo số điện thoại trước
            if (sdt_khach) {
                const userByPhone = await pool.request()
                    .input('sdt', db_1.sql.VarChar(20), sdt_khach)
                    .query('SELECT TOP 1 id, ho_ten FROM Nguoi_Dung WHERE so_dien_thoai = @sdt');
                if (userByPhone.recordset && userByPhone.recordset.length > 0) {
                    ma_nd = userByPhone.recordset[0].id;
                    if (ten_khach && userByPhone.recordset[0].ho_ten !== ten_khach) {
                        await pool.request()
                            .input('uid', db_1.sql.Int, ma_nd)
                            .input('ten', db_1.sql.NVarChar(100), ten_khach)
                            .query('UPDATE Nguoi_Dung SET ho_ten = @ten WHERE id = @uid');
                    }
                }
            }
            // Nếu chưa có theo SĐT, tìm theo họ tên
            if (!ma_nd && ten_khach) {
                const userByName = await pool.request()
                    .input('ten', db_1.sql.NVarChar(100), ten_khach)
                    .query('SELECT TOP 1 id FROM Nguoi_Dung WHERE ho_ten = @ten');
                if (userByName.recordset && userByName.recordset.length > 0) {
                    ma_nd = userByName.recordset[0].id;
                    if (sdt_khach) {
                        await pool.request()
                            .input('uid', db_1.sql.Int, ma_nd)
                            .input('sdt', db_1.sql.VarChar(20), sdt_khach)
                            .query('UPDATE Nguoi_Dung SET so_dien_thoai = @sdt WHERE id = @uid');
                    }
                }
            }
            // Nếu vẫn chưa có, tạo mới bản ghi khách hàng chuẩn
            if (!ma_nd) {
                const cleanPhone = sdt_khach || `09${Math.floor(10000000 + Math.random() * 90000000)}`;
                const uniqueEmail = `khach_${Date.now()}_${Math.floor(Math.random() * 1000)}@soccer247.vn`;
                const insU = await pool.request()
                    .input('ho_ten', db_1.sql.NVarChar(100), ten_khach || 'Khách Đặt Sân')
                    .input('email', db_1.sql.VarChar(255), uniqueEmail)
                    .input('sdt', db_1.sql.VarChar(20), cleanPhone)
                    .query(`
                        INSERT INTO Nguoi_Dung (ho_ten, email, so_dien_thoai, MaVaiTro)
                        OUTPUT inserted.id
                        VALUES (@ho_ten, @email, @sdt, 3)
                    `);
                ma_nd = insU.recordset && insU.recordset[0] ? insU.recordset[0].id : null;
            }
        }
        // Fallback nếu không có tên/SĐT được truyền vào
        if (!ma_nd) {
            const checkU = req.user ? req.user.id : (req.body.ma_nguoi_dung ? parseInt(req.body.ma_nguoi_dung, 10) : null);
            if (checkU) {
                const checkDb = await pool.request().input('uid', db_1.sql.Int, checkU).query('SELECT id FROM Nguoi_Dung WHERE id = @uid');
                if (checkDb.recordset && checkDb.recordset.length > 0)
                    ma_nd = checkU;
            }
        }
        if (!ma_nd) {
            const firstU = await pool.request().query('SELECT TOP 1 id FROM Nguoi_Dung ORDER BY id ASC');
            if (firstU.recordset && firstU.recordset.length > 0) {
                ma_nd = firstU.recordset[0].id;
            }
        }
        // 2. Chuẩn hóa trạng thái và phương thức thanh toán
        const isTraHet = (loai_thanh_toan === 'TRA_HET' || trang_thai === 'DA_THANH_TOAN' || trang_thai === 'Da Thanh Toan');
        let trang_thai_chuan = 'DANG_DA';
        if (isTraHet) {
            trang_thai_chuan = 'DA_THANH_TOAN';
        }
        else if (trang_thai === 'DA_COC' || loai_thanh_toan === 'DAT_COC') {
            trang_thai_chuan = 'DA_COC';
        }
        else if (trang_thai) {
            trang_thai_chuan = trang_thai;
        }
        const phuong_thuc_chuan = (phuong_thuc === 'TIEN_MAT') ? 'TIEN_MAT' : 'CHUYEN_KHOAN';
        const tien_san_val = tien_san ? parseFloat(tien_san) : (tong_tien ? parseFloat(tong_tien) : 0);
        const tong_tien_val = tong_tien ? parseFloat(tong_tien) : tien_san_val;
        const gio_bd_clean = (gio_bat_dau && gio_bat_dau.length === 5) ? `${gio_bat_dau}:00` : (gio_bat_dau || '06:00:00');
        const gio_kt_clean = (gio_ket_thuc && gio_ket_thuc.length === 5) ? `${gio_ket_thuc}:00` : (gio_ket_thuc || '07:30:00');
        // 3. Thực hiện lưu trực tiếp vào bảng Don_Dat_San
        let booking = null;
        try {
            const insertRes = await pool.request()
                .input('ma_nguoi_dung', db_1.sql.Int, ma_nd)
                .input('ma_san', db_1.sql.Int, ma_san ? parseInt(ma_san, 10) : null)
                .input('ngay_da', db_1.sql.Date, ngay_da)
                .input('gio_bat_dau', db_1.sql.VarChar(8), gio_bd_clean)
                .input('gio_ket_thuc', db_1.sql.VarChar(8), gio_kt_clean)
                .input('tien_san', db_1.sql.Decimal(10, 2), tien_san_val)
                .input('tong_tien', db_1.sql.Decimal(10, 2), tong_tien_val)
                .input('phuong_thuc', db_1.sql.VarChar(20), phuong_thuc_chuan)
                .input('ghi_chu', db_1.sql.NVarChar(db_1.sql.MAX), ghi_chu || null)
                .input('trang_thai', db_1.sql.VarChar(30), trang_thai_chuan)
                .query(`
                    INSERT INTO Don_Dat_San (
                        ma_nguoi_dung, ma_san, ngay_da, gio_bat_dau, gio_ket_thuc, 
                        tien_san, tong_tien, phuong_thuc, ghi_chu, trang_thai, ngay_tao
                    )
                    OUTPUT inserted.*
                    VALUES (
                        @ma_nguoi_dung, @ma_san, @ngay_da, @gio_bat_dau, @gio_ket_thuc, 
                        @tien_san, @tong_tien, @phuong_thuc, @ghi_chu, @trang_thai, GETDATE()
                    )
                `);
            booking = insertRes.recordset && insertRes.recordset[0];
        }
        catch (insertErr) {
            console.warn('Thử fallback lưu Don_Dat_San:', insertErr.message);
            const fallbackTrangThai = isTraHet ? 'Da Thanh Toan' : 'DA_COC';
            const fallbackRes = await pool.request()
                .input('ma_nguoi_dung', db_1.sql.Int, ma_nd)
                .input('ma_san', db_1.sql.Int, ma_san ? parseInt(ma_san, 10) : null)
                .input('ngay_da', db_1.sql.Date, ngay_da)
                .input('gio_bat_dau', db_1.sql.VarChar(8), gio_bd_clean)
                .input('gio_ket_thuc', db_1.sql.VarChar(8), gio_kt_clean)
                .input('tien_san', db_1.sql.Decimal(10, 2), tien_san_val)
                .input('tong_tien', db_1.sql.Decimal(10, 2), tong_tien_val)
                .input('phuong_thuc', db_1.sql.VarChar(20), phuong_thuc_chuan)
                .input('ghi_chu', db_1.sql.NVarChar(db_1.sql.MAX), ghi_chu || null)
                .input('trang_thai', db_1.sql.VarChar(30), fallbackTrangThai)
                .query(`
                    INSERT INTO Don_Dat_San (
                        ma_nguoi_dung, ma_san, ngay_da, gio_bat_dau, gio_ket_thuc, 
                        tien_san, tong_tien, phuong_thuc, ghi_chu, trang_thai, ngay_tao
                    )
                    OUTPUT inserted.*
                    VALUES (
                        @ma_nguoi_dung, @ma_san, @ngay_da, @gio_bat_dau, @gio_ket_thuc, 
                        @tien_san, @tong_tien, @phuong_thuc, @ghi_chu, @trang_thai, GETDATE()
                    )
                `);
            booking = fallbackRes.recordset && fallbackRes.recordset[0];
        }
        // 4. Lưu chi tiết dịch vụ vào bảng Chi_Tiet_Dich_Vu và cập nhật tồn kho Dich_Vu
        const donDatId = booking ? (booking.id || booking.ma_don_dat) : null;
        const selectedServices = req.body.dich_vu_list !== undefined
            ? req.body.dich_vu_list
            : (req.body.dich_vu_chon !== undefined ? req.body.dich_vu_chon : req.body.dich_vu);
        if (donDatId && selectedServices !== undefined) {
            let serviceItems = [];
            if (Array.isArray(selectedServices)) {
                serviceItems = selectedServices;
            }
            else if (typeof selectedServices === 'object' && selectedServices !== null) {
                Object.entries(selectedServices).forEach(([dvId, qty]) => {
                    const numQty = parseInt(qty, 10);
                    if (numQty > 0) {
                        serviceItems.push({ ma_dich_vu: parseInt(dvId, 10), so_luong: numQty });
                    }
                });
            }
            try {
                // Bước 4.1: Hoàn lại tồn kho cho toàn bộ dịch vụ cũ của đơn này
                await pool.request()
                    .input('madon', db_1.sql.Int, donDatId)
                    .query(`
                        UPDATE dv
                        SET dv.ton_kho = dv.ton_kho + ct.so_luong
                        FROM Dich_Vu dv
                        INNER JOIN Chi_Tiet_Dich_Vu ct ON dv.id = ct.ma_dich_vu
                        WHERE ct.ma_don_dat = @madon;

                        DELETE FROM Chi_Tiet_Dich_Vu WHERE ma_don_dat = @madon;
                    `);
                // Bước 4.2: Chèn lại danh sách dịch vụ mới và trừ kho
                let totalServiceCalculated = 0;
                for (const item of serviceItems) {
                    const dvId = item.ma_dich_vu || item.id;
                    const sl = parseInt(item.so_luong, 10) || 1;
                    if (!dvId || sl <= 0)
                        continue;
                    const dvRes = await pool.request()
                        .input('dvid', db_1.sql.Int, dvId)
                        .query('SELECT id, don_gia, ton_kho FROM Dich_Vu WHERE id = @dvid');
                    if (dvRes.recordset && dvRes.recordset.length > 0) {
                        const donGia = parseFloat(dvRes.recordset[0].don_gia) || 0;
                        const tongTienDv = sl * donGia;
                        totalServiceCalculated += tongTienDv;
                        await pool.request()
                            .input('madon', db_1.sql.Int, donDatId)
                            .input('madv', db_1.sql.Int, dvId)
                            .input('sl', db_1.sql.Int, sl)
                            .input('tongtien', db_1.sql.Decimal(10, 2), tongTienDv)
                            .query(`
                                INSERT INTO Chi_Tiet_Dich_Vu (ma_don_dat, ma_dich_vu, so_luong, tongtien_dichvu)
                                VALUES (@madon, @madv, @sl, @tongtien);

                                UPDATE Dich_Vu 
                                SET ton_kho = CASE WHEN ton_kho >= @sl THEN ton_kho - @sl ELSE 0 END
                                WHERE id = @madv;
                            `);
                    }
                }
            }
            catch (serviceErr) {
                console.error('Lỗi khi đồng bộ Chi_Tiet_Dich_Vu và kho:', serviceErr.message);
            }
        }
        const io = req.app.get('io');
        if (io) {
            io.emit('booking_updated');
            if (isTraHet) {
                io.emit('payment_success', {
                    id: donDatId,
                    ma_don_dat: donDatId,
                    ten_khach_hang: ten_khach,
                    so_tien: tong_tien
                });
            }
        }
        return res.status(201).json({
            success: true,
            message: `Đặt sân thành công! Trạng thái đơn: ${isTraHet ? 'Đã thanh toán' : 'Đã cọc'}`,
            data: booking
        });
    }
    catch (error) {
        console.error('Lỗi datSan:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi thực hiện đặt sân'
        });
    }
};
exports.datSan = datSan;
/**
 * 12b. Lấy lịch sử đặt sân của khách hàng (Đúng dữ liệu CSDL SQL Server - sp_LayLichSuDatSan)
 * Method: GET /api/dat-san/lich-su-khach-hang
 */
const layLichSuKhachHang = async (req, res) => {
    try {
        const { ma_nguoi_dung, so_dien_thoai, email } = req.query;
        const pool = await db_1.poolPromise;
        const request = pool.request();
        let ma_nd_param = null;
        let sdt_param = null;
        let email_param = null;
        if (ma_nguoi_dung && parseInt(ma_nguoi_dung, 10)) {
            ma_nd_param = parseInt(ma_nguoi_dung, 10);
            request.input('ma_nguoi_dung', db_1.sql.Int, ma_nd_param);
        }
        else {
            request.input('ma_nguoi_dung', db_1.sql.Int, null);
        }
        if (so_dien_thoai && so_dien_thoai.trim()) {
            sdt_param = so_dien_thoai.trim();
            request.input('so_dien_thoai', db_1.sql.VarChar(20), sdt_param);
        }
        else {
            request.input('so_dien_thoai', db_1.sql.VarChar(20), null);
        }
        if (email && email.trim()) {
            email_param = email.trim();
            request.input('email', db_1.sql.VarChar(255), email_param);
        }
        else {
            request.input('email', db_1.sql.VarChar(255), null);
        }
        const result = await request.execute('sp_LayLichSuDatSan');
        const data = result.recordset || [];
        // 100% Stored Procedure: Lấy chi tiết dịch vụ bằng sp_LayChiTietDichVuDonDat
        if (data.length > 0) {
            const dvRes = await pool.request().execute('sp_LayChiTietDichVuDonDat');
            const dvMap = {};
            (dvRes.recordset || []).forEach((dv) => {
                if (!dvMap[dv.ma_don_dat])
                    dvMap[dv.ma_don_dat] = [];
                dvMap[dv.ma_don_dat].push(dv);
            });
            data.forEach((order) => {
                order.chi_tiet_dich_vu = dvMap[order.id] || [];
                order.tien_coc = Number(order.tien_coc || 0);
                order.tien_da_nhan = Number(order.tien_da_nhan || 0);
                order.tien_thieu = Number(order.tien_thieu || 0);
            });
        }
        return res.status(200).json({
            success: true,
            data
        });
    }
    catch (error) {
        console.error('Lỗi layLichSuKhachHang:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi lấy lịch sử đặt sân của khách hàng'
        });
    }
};
exports.layLichSuKhachHang = layLichSuKhachHang;
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
        const pool = await db_1.poolPromise;
        const result = await pool.request()
            .input('ma_don_dat', db_1.sql.Int, parseInt(ma_don_dat, 10))
            .input('ma_nguoi_dung', db_1.sql.Int, parseInt(ma_nguoi_dung, 10))
            .input('ly_do_huy', db_1.sql.NVarChar(255), ly_do_huy || 'Khách hàng hủy đơn')
            .execute('sp_HuyDonVaHoanCoc');
        const cancelResult = result.recordset[0];
        const io = req.app.get('io');
        if (io) {
            io.emit('booking_updated');
            io.emit('payment_success');
        }
        return res.status(200).json({
            success: true,
            message: 'Hủy đơn đặt sân và xử lý hoàn tiền thành công!',
            data: cancelResult
        });
    }
    catch (error) {
        console.error('Lỗi sp_HuyDonVaHoanCoc:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi hủy đơn đặt sân'
        });
    }
};
exports.huyDonVaHoanCoc = huyDonVaHoanCoc;
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
        const pool = await db_1.poolPromise;
        const result = await pool.request()
            .input('ma_san', db_1.sql.Int, parseInt(ma_san, 10))
            .input('ngay_da', db_1.sql.Date, ngay_da)
            .input('gio_bat_dau', db_1.sql.VarChar(8), gio_bat_dau)
            .input('gio_ket_thuc', db_1.sql.VarChar(8), gio_ket_thuc)
            .execute('sp_TinhGiaSanLinhHoat');
        return res.status(200).json({
            success: true,
            data: result.recordset[0]
        });
    }
    catch (error) {
        console.error('Lỗi sp_TinhGiaSanLinhHoat:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi tính giá sân linh hoạt'
        });
    }
};
exports.tinhGiaLinhHoat = tinhGiaLinhHoat;
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
        const pool = await db_1.poolPromise;
        const result = await pool.request()
            .input('ma_nguoi_dung', db_1.sql.Int, parseInt(ma_nguoi_dung, 10))
            .input('ma_san', db_1.sql.Int, parseInt(ma_san, 10))
            .input('ngay_da', db_1.sql.Date, ngay_da)
            .input('gio_bat_dau', db_1.sql.VarChar(8), gio_bat_dau)
            .input('gio_ket_thuc', db_1.sql.VarChar(8), gio_ket_thuc)
            .input('ghi_chu', db_1.sql.NVarChar(db_1.sql.MAX), ghi_chu || null)
            .input('tien_coc', db_1.sql.Decimal(10, 2), tien_coc ? parseFloat(tien_coc) : 0)
            .execute('sp_DatSanLinhHoat');
        const io = req.app.get('io');
        if (io) {
            io.emit('booking_updated');
            io.emit('payment_success');
        }
        return res.status(201).json({
            success: true,
            message: 'Đặt sân tính giờ linh hoạt thành công!',
            data: result.recordset[0]
        });
    }
    catch (error) {
        console.error('Lỗi sp_DatSanLinhHoat:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi đặt sân linh hoạt'
        });
    }
};
exports.datSanLinhHoat = datSanLinhHoat;
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
        const pool = await db_1.poolPromise;
        const result = await pool.request()
            .input('ma_nguoi_dung', db_1.sql.Int, parseInt(ma_nguoi_dung, 10))
            .input('ma_san', db_1.sql.Int, parseInt(ma_san, 10))
            .input('ten_khach_hang', db_1.sql.NVarChar(100), ten_khach_hang || null)
            .input('so_dien_thoai', db_1.sql.VarChar(15), so_dien_thoai || null)
            .input('ghi_chu', db_1.sql.NVarChar(db_1.sql.MAX), ghi_chu || null)
            .execute('sp_BatDauDaLinhHoat');
        const io = req.app.get('io');
        if (io) {
            io.emit('booking_updated');
            io.emit('payment_success');
        }
        return res.status(201).json({
            success: true,
            message: 'Đã check-in và bắt đầu tính giờ đá linh hoạt cho sân!',
            data: result.recordset[0]
        });
    }
    catch (error) {
        console.error('Lỗi sp_BatDauDaLinhHoat:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi bắt đầu tính giờ đá linh hoạt'
        });
    }
};
exports.batDauDaLinhHoat = batDauDaLinhHoat;
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
        const pool = await db_1.poolPromise;
        const result = await pool.request()
            .input('ma_don_dat', db_1.sql.Int, parseInt(ma_don_dat, 10))
            .input('gio_ket_thuc', db_1.sql.VarChar(8), gio_ket_thuc || null)
            .execute('sp_KetThucDaLinhHoat');
        const io = req.app.get('io');
        if (io) {
            io.emit('booking_updated');
            io.emit('payment_success');
        }
        return res.status(200).json({
            success: true,
            message: 'Đã chốt giờ và tính tiền sân linh hoạt thành công!',
            data: result.recordset[0]
        });
    }
    catch (error) {
        console.error('Lỗi sp_KetThucDaLinhHoat:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi kết thúc tính giờ đá linh hoạt'
        });
    }
};
exports.ketThucDaLinhHoat = ketThucDaLinhHoat;
/**
 * 18. Lấy danh sách khung giờ từ CSDL (Bảng Khung_Gio)
 * Method: GET /api/dat-san/khung-gio
 * Procedure: sp_LayDanhSachKhungGio
 */
const layDanhSachKhungGio = async (req, res) => {
    try {
        const pool = await db_1.poolPromise;
        const result = await pool.request().execute('sp_LayDanhSachKhungGio');
        return res.status(200).json({
            success: true,
            data: result.recordset
        });
    }
    catch (error) {
        console.error('Lỗi sp_LayDanhSachKhungGio:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi lấy danh sách khung giờ'
        });
    }
};
exports.layDanhSachKhungGio = layDanhSachKhungGio;
/**
 * Lấy tất cả khung giờ cho Admin Dashboard (Bao gồm cả đang khóa)
 * Method: GET /api/dat-san/khung-gio/all
 * Procedure: sp_LayTatCaKhungGioAdmin
 */
const layTatCaKhungGioAdmin = async (req, res) => {
    try {
        const pool = await db_1.poolPromise;
        const result = await pool.request().execute('sp_LayTatCaKhungGioAdmin');
        return res.status(200).json({
            success: true,
            data: result.recordset
        });
    }
    catch (error) {
        console.error('Lỗi sp_LayTatCaKhungGioAdmin:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi lấy danh sách khung giờ cho Admin'
        });
    }
};
exports.layTatCaKhungGioAdmin = layTatCaKhungGioAdmin;
/**
 * Thêm mới khung giờ
 * Method: POST /api/dat-san/khung-gio
 * Procedure: sp_ThemKhungGio
 */
const themKhungGio = async (req, res) => {
    try {
        const { gio_bat_dau, gio_ket_thuc, nhan_hien_thi, thu_tu, trang_thai } = req.body;
        if (!gio_bat_dau || !gio_ket_thuc || !nhan_hien_thi) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ gio_bat_dau, gio_ket_thuc, nhan_hien_thi!'
            });
        }
        const pool = await db_1.poolPromise;
        const result = await pool.request()
            .input('gio_bat_dau', db_1.sql.VarChar(5), gio_bat_dau)
            .input('gio_ket_thuc', db_1.sql.VarChar(5), gio_ket_thuc)
            .input('nhan_hien_thi', db_1.sql.NVarChar(50), nhan_hien_thi)
            .input('thu_tu', db_1.sql.Int, parseInt(thu_tu, 10) || 1)
            .input('trang_thai', db_1.sql.Bit, trang_thai === undefined || trang_thai === null || trang_thai === true || trang_thai === 1 ? 1 : 0)
            .execute('sp_ThemKhungGio');
        return res.status(201).json({
            success: true,
            message: 'Thêm khung giờ mới thành công!',
            data: result.recordset[0]
        });
    }
    catch (error) {
        console.error('Lỗi sp_ThemKhungGio:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi thêm khung giờ'
        });
    }
};
exports.themKhungGio = themKhungGio;
/**
 * Cập nhật khung giờ
 * Method: PUT /api/dat-san/khung-gio/:id
 * Procedure: sp_SuaKhungGio
 */
const suaKhungGio = async (req, res) => {
    try {
        const id = String(req.params.id);
        const { gio_bat_dau, gio_ket_thuc, nhan_hien_thi, thu_tu, trang_thai } = req.body;
        const pool = await db_1.poolPromise;
        const result = await pool.request()
            .input('id', db_1.sql.Int, parseInt(id, 10))
            .input('gio_bat_dau', db_1.sql.VarChar(5), gio_bat_dau)
            .input('gio_ket_thuc', db_1.sql.VarChar(5), gio_ket_thuc)
            .input('nhan_hien_thi', db_1.sql.NVarChar(50), nhan_hien_thi)
            .input('thu_tu', db_1.sql.Int, parseInt(thu_tu, 10) || 1)
            .input('trang_thai', db_1.sql.Bit, trang_thai ? 1 : 0)
            .execute('sp_SuaKhungGio');
        return res.status(200).json({
            success: true,
            message: 'Cập nhật khung giờ thành công!',
            data: result.recordset[0]
        });
    }
    catch (error) {
        console.error('Lỗi sp_SuaKhungGio:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi cập nhật khung giờ'
        });
    }
};
exports.suaKhungGio = suaKhungGio;
/**
 * Xóa khung giờ
 * Method: DELETE /api/dat-san/khung-gio/:id
 * Procedure: sp_XoaKhungGio
 */
const xoaKhungGio = async (req, res) => {
    try {
        const id = String(req.params.id);
        const pool = await db_1.poolPromise;
        await pool.request()
            .input('id', db_1.sql.Int, parseInt(id, 10))
            .execute('sp_XoaKhungGio');
        return res.status(200).json({
            success: true,
            message: 'Xóa khung giờ thành công!'
        });
    }
    catch (error) {
        console.error('Lỗi sp_XoaKhungGio:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi xóa khung giờ'
        });
    }
};
exports.xoaKhungGio = xoaKhungGio;
/**
 * Đặt lại 27 khung giờ mặc định (6h - 19h30)
 * Method: POST /api/dat-san/khung-gio/reset
 * Procedure: sp_ResetKhungGio
 */
const resetKhungGio = async (req, res) => {
    try {
        const pool = await db_1.poolPromise;
        const result = await pool.request().execute('sp_ResetKhungGio');
        return res.status(200).json({
            success: true,
            message: 'Đã nạp lại 27 khung giờ mặc định thành công!',
            data: result.recordset
        });
    }
    catch (error) {
        console.error('Lỗi sp_ResetKhungGio:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi đặt lại khung giờ'
        });
    }
};
exports.resetKhungGio = resetKhungGio;
async function resolveCustomerUserId(pool, ten_khach_hang, so_dien_thoai, fallbackId = 1) {
    const ten = (ten_khach_hang || '').trim();
    const phone = (so_dien_thoai || '').trim();
    // Nếu KHÔNG điền tên khách hàng VÀ KHÔNG điền số điện thoại -> Dùng tài khoản đang đăng nhập (fallbackId)
    if (!ten && !phone) {
        return fallbackId;
    }
    try {
        // 1. Tìm theo SĐT nếu có
        if (phone) {
            const res = await pool.request()
                .input('phone', db_1.sql.VarChar(20), phone)
                .query('SELECT TOP 1 id FROM Nguoi_Dung WHERE so_dien_thoai = @phone');
            if (res.recordset[0]?.id) {
                return res.recordset[0].id;
            }
        }
        // 2. Tìm theo Tên khách hàng
        if (ten) {
            const res = await pool.request()
                .input('ten', db_1.sql.NVarChar(100), ten)
                .query('SELECT TOP 1 id FROM Nguoi_Dung WHERE ho_ten = @ten');
            if (res.recordset[0]?.id) {
                return res.recordset[0].id;
            }
        }
        // 3. Nếu chưa có trong CSDL -> Tự động thêm khách hàng mới vào bảng Nguoi_Dung
        const email = `khach_${Date.now()}_${Math.floor(Math.random() * 1000)}@khachhang.pos`;
        const insertRes = await pool.request()
            .input('ho_ten', db_1.sql.NVarChar(100), ten || `Khách ${phone}`)
            .input('email', db_1.sql.VarChar(255), email)
            .input('so_dien_thoai', db_1.sql.VarChar(15), phone || null)
            .input('MaVaiTro', db_1.sql.Int, 3)
            .query(`
                INSERT INTO Nguoi_Dung (ho_ten, email, so_dien_thoai, MaVaiTro)
                OUTPUT INSERTED.id
                VALUES (@ho_ten, @email, @so_dien_thoai, @MaVaiTro)
            `);
        if (insertRes.recordset[0]?.id) {
            return insertRes.recordset[0].id;
        }
    }
    catch (err) {
        console.warn('Lỗi tự động định danh khách hàng:', err.message);
    }
    return fallbackId;
}
/**
 * Thêm Đơn Đặt Sân (Admin Dashboard)
 * Method: POST /api/dat-san/don-dat-thanh-toan
 * Procedure: sp_ThemDonDatVaThanhToan
 */
const themDonDatVaThanhToan = async (req, res) => {
    try {
        const { ma_nguoi_dung, ma_san, ngay_da, gio_bat_dau, gio_ket_thuc, tien_san, tong_tien, ghi_chu, trang_thai, phuong_thuc, loai_thanh_toan, so_tien, trang_thai_gd, ten_khach_hang, so_dien_thoai } = req.body;
        const pool = await db_1.poolPromise;
        const trang_thai_chuan = (trang_thai === 'DA_THANH_TOAN' || trang_thai === 'Da Thanh Toan' || loai_thanh_toan === 'TRA_HET') ? 'DA_THANH_TOAN' : (trang_thai || 'DA_COC');
        const phuong_thuc_chuan = (phuong_thuc === 'CHUYEN_KHOAN') ? 'CHUYEN_KHOAN' : 'TIEN_MAT';
        const tien_san_val = parseFloat(tien_san) || parseFloat(tong_tien) || 0;
        const tong_tien_val = parseFloat(tong_tien) || tien_san_val;
        const so_tien_val = so_tien ? parseFloat(so_tien) : tien_san_val;
        const ngay_da_clean = ngay_da ? String(ngay_da).substring(0, 10) : new Date().toISOString().substring(0, 10);
        const gio_bd_clean = (gio_bat_dau && gio_bat_dau.length === 5) ? `${gio_bat_dau}:00` : (gio_bat_dau || '17:00:00');
        const gio_kt_clean = (gio_ket_thuc && gio_ket_thuc.length === 5) ? `${gio_ket_thuc}:00` : (gio_ket_thuc || '18:30:00');
        // Phân giải mã người dùng: Nếu có điền tên/SĐT khách -> Lưu theo khách đó. Nếu không điền -> Lưu theo tài khoản đang đăng nhập
        const tenKhach = ten_khach_hang || (ghi_chu?.includes('Khách:') ? ghi_chu.replace('Khách:', '').split('-')[0].trim() : '');
        const sdtKhach = so_dien_thoai || (ghi_chu?.includes('-') ? ghi_chu.split('-')[1].trim() : '');
        const finalUserId = await resolveCustomerUserId(pool, tenKhach, sdtKhach, parseInt(ma_nguoi_dung, 10) || req.user?.id || 1);
        const result = await pool.request()
            .input('ma_nguoi_dung', db_1.sql.Int, parseInt(ma_nguoi_dung, 10) || req.user?.id || 1)
            .input('ma_san', db_1.sql.Int, parseInt(ma_san, 10))
            .input('ngay_da', db_1.sql.Date, ngay_da_clean)
            .input('gio_bat_dau', db_1.sql.VarChar(8), gio_bd_clean)
            .input('gio_ket_thuc', db_1.sql.VarChar(8), gio_kt_clean)
            .input('tien_san', db_1.sql.Decimal(10, 2), tien_san_val)
            .input('tong_tien', db_1.sql.Decimal(10, 2), tong_tien_val)
            .input('phuong_thuc', db_1.sql.VarChar(20), phuong_thuc_chuan)
            .input('trang_thai', db_1.sql.VarChar(30), trang_thai_chuan)
            .input('ghi_chu', db_1.sql.NVarChar(db_1.sql.MAX), ghi_chu || null)
            .input('loai_thanh_toan', db_1.sql.VarChar(20), loai_thanh_toan || 'DAT_COC')
            .input('so_tien', db_1.sql.Decimal(10, 2), so_tien_val)
            .input('trang_thai_gd', db_1.sql.VarChar(20), trang_thai_gd || 'THANH_CONG')
            .input('ten_khach_hang', db_1.sql.NVarChar(100), tenKhach || null)
            .input('so_dien_thoai', db_1.sql.VarChar(20), sdtKhach || null)
            .execute('sp_ThemDonDatVaThanhToan');
        const orderData = result.recordset[0];
        const orderId = orderData?.id;
        if (orderId && Array.isArray(req.body.dich_vu_list) && req.body.dich_vu_list.length > 0) {
            for (const item of req.body.dich_vu_list) {
                if (item.ma_dich_vu && Number(item.so_luong) > 0) {
                    try {
                        await pool.request()
                            .input('ma_don_dat', db_1.sql.Int, parseInt(orderId, 10))
                            .input('ma_dich_vu', db_1.sql.Int, parseInt(item.ma_dich_vu, 10))
                            .input('so_luong', db_1.sql.Int, parseInt(item.so_luong, 10))
                            .execute('sp_ThemDichVu');
                    }
                    catch (e) {
                        console.warn('Lỗi thêm dịch vụ kèm đơn:', e.message);
                    }
                }
            }
        }
        const io = req.app.get('io');
        if (io) {
            io.emit('booking_updated');
            io.emit('payment_success');
        }
        return res.status(201).json({
            success: true,
            message: 'Thêm đơn đặt sân thành công!',
            data: orderData
        });
    }
    catch (error) {
        console.error('Lỗi sp_ThemDonDatVaThanhToan:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi thêm đơn đặt sân'
        });
    }
};
exports.themDonDatVaThanhToan = themDonDatVaThanhToan;
/**
 * Sửa Đơn Đặt Sân
 * Method: PUT /api/dat-san/don-dat-thanh-toan/:id
 * Procedure: sp_SuaDonDatVaThanhToan
 */
const suaDonDatVaThanhToan = async (req, res) => {
    try {
        const id = String(req.params.id);
        const parsedId = parseInt(id, 10);
        if (isNaN(parsedId) || parsedId > 2147483647 || parsedId < -2147483648) {
            return res.status(400).json({
                success: false,
                message: 'ID đơn đặt không hợp lệ'
            });
        }
        const { ma_san, ma_nguoi_dung, ngay_da, gio_bat_dau, gio_ket_thuc, tien_san, tong_tien, ghi_chu, trang_thai, phuong_thuc, loai_thanh_toan, so_tien, trang_thai_gd, ten_khach_hang, so_dien_thoai } = req.body;
        const pool = await db_1.poolPromise;
        const phuong_thuc_chuan = phuong_thuc ? ((phuong_thuc === 'CHUYEN_KHOAN') ? 'CHUYEN_KHOAN' : 'TIEN_MAT') : 'TIEN_MAT';
        const trang_thai_chuan = (trang_thai === 'DA_THANH_TOAN' || trang_thai === 'Da Thanh Toan') ? 'DA_THANH_TOAN' : (trang_thai || 'DA_COC');
        const tien_san_val = tien_san !== undefined ? parseFloat(tien_san) : null;
        const tong_tien_val = tong_tien !== undefined ? parseFloat(tong_tien) : null;
        const so_tien_val = so_tien !== undefined ? parseFloat(so_tien) : null;
        const ngay_da_clean = ngay_da ? String(ngay_da).substring(0, 10) : new Date().toISOString().substring(0, 10);
        const gio_bd_clean = (gio_bat_dau && gio_bat_dau.length === 5) ? `${gio_bat_dau}:00` : (gio_bat_dau || '17:00:00');
        const gio_kt_clean = (gio_ket_thuc && gio_ket_thuc.length === 5) ? `${gio_ket_thuc}:00` : (gio_ket_thuc || '18:30:00');
        const tenKhach = ten_khach_hang || (ghi_chu?.includes('Khách:') ? ghi_chu.replace('Khách:', '').split('-')[0].trim() : '');
        const sdtKhach = so_dien_thoai || (ghi_chu?.includes('-') ? ghi_chu.split('-')[1].trim() : '');
        const result = await pool.request()
            .input('id', db_1.sql.Int, parsedId)
            .input('ma_nguoi_dung', db_1.sql.Int, ma_nguoi_dung ? parseInt(ma_nguoi_dung, 10) : (req.user?.id || 1))
            .input('ma_san', db_1.sql.Int, ma_san ? parseInt(ma_san, 10) : null)
            .input('ngay_da', db_1.sql.Date, ngay_da_clean)
            .input('gio_bat_dau', db_1.sql.VarChar(8), gio_bd_clean)
            .input('gio_ket_thuc', db_1.sql.VarChar(8), gio_kt_clean)
            .input('tien_san', db_1.sql.Decimal(10, 2), tien_san_val)
            .input('tong_tien', db_1.sql.Decimal(10, 2), tong_tien_val)
            .input('phuong_thuc', db_1.sql.VarChar(20), phuong_thuc_chuan)
            .input('trang_thai', db_1.sql.VarChar(30), trang_thai_chuan)
            .input('ghi_chu', db_1.sql.NVarChar(db_1.sql.MAX), ghi_chu || null)
            .input('loai_thanh_toan', db_1.sql.VarChar(20), loai_thanh_toan || 'TRA_HET')
            .input('so_tien', db_1.sql.Decimal(10, 2), so_tien_val)
            .input('trang_thai_gd', db_1.sql.VarChar(20), trang_thai_gd || 'THANH_CONG')
            .input('ten_khach_hang', db_1.sql.NVarChar(100), tenKhach || null)
            .input('so_dien_thoai', db_1.sql.VarChar(20), sdtKhach || null)
            .execute('sp_SuaDonDatVaThanhToan');
        if (Array.isArray(req.body.dich_vu_list)) {
            // Lấy danh sách dịch vụ hiện có của đơn
            let currentServices = [];
            try {
                const existingDetailsRes = await pool.request().execute('sp_LayDanhSachChiTietDichVu');
                currentServices = (existingDetailsRes.recordset || []).filter((d) => d.ma_don_dat === parseInt(id, 10));
            }
            catch (e) {
                console.warn('Lỗi lấy chi tiết dịch vụ cũ:', e.message);
            }
            const newServiceIds = new Set(req.body.dich_vu_list.map((item) => parseInt(item.ma_dich_vu, 10)));
            // Xóa các dịch vụ cũ không còn trong danh sách mới (hoặc đã xóa hết)
            for (const oldSvc of currentServices) {
                if (!newServiceIds.has(oldSvc.ma_dich_vu)) {
                    try {
                        await pool.request()
                            .input('ma_don_dat', db_1.sql.Int, parseInt(id, 10))
                            .input('ma_dich_vu', db_1.sql.Int, parseInt(oldSvc.ma_dich_vu, 10))
                            .input('so_luong_moi', db_1.sql.Int, 0)
                            .execute('sp_CapNhatDichVuDonDat');
                    }
                    catch (e) {
                        console.warn('Lỗi xóa dịch vụ cũ:', e.message);
                    }
                }
            }
            // Cập nhật hoặc thêm dịch vụ mới
            for (const item of req.body.dich_vu_list) {
                if (item.ma_dich_vu) {
                    try {
                        await pool.request()
                            .input('ma_don_dat', db_1.sql.Int, parseInt(id, 10))
                            .input('ma_dich_vu', db_1.sql.Int, parseInt(item.ma_dich_vu, 10))
                            .input('so_luong_moi', db_1.sql.Int, parseInt(item.so_luong || 0, 10))
                            .execute('sp_CapNhatDichVuDonDat');
                    }
                    catch (e) {
                        console.warn('Lỗi cập nhật dịch vụ kèm đơn:', e.message);
                    }
                }
            }
        }
        // Lấy lại đơn đặt sau khi đã cập nhật dịch vụ từ CSDL SQL Server
        let finalData = result.recordset?.[0];
        try {
            const freshBooking = await pool.request()
                .input('id', db_1.sql.Int, parseInt(id, 10))
                .query(`
                    SELECT 
                        d.id, d.ma_san, sb.ten_san, ls.ten_loai, d.ma_nguoi_dung,
                        nd.ho_ten AS ten_khach_hang, nd.so_dien_thoai, d.ngay_da,
                        CONVERT(VARCHAR(5), d.gio_bat_dau, 108) AS gio_bat_dau,
                        CONVERT(VARCHAR(5), d.gio_ket_thuc, 108) AS gio_ket_thuc,
                        d.tien_san, d.tong_tien, d.phuong_thuc, d.ghi_chu, d.trang_thai, d.ngay_tao
                    FROM Don_Dat_San d
                    INNER JOIN San_Bong sb ON d.ma_san = sb.id
                    INNER JOIN Loai_San ls ON sb.ma_loai_san = ls.id
                    INNER JOIN Nguoi_Dung nd ON d.ma_nguoi_dung = nd.id
                    WHERE d.id = @id
                `);
            if (freshBooking.recordset && freshBooking.recordset.length > 0) {
                finalData = freshBooking.recordset[0];
            }
        }
        catch (fetchErr) {
            console.warn('Lỗi đọc lại đơn sau sửa:', fetchErr.message);
        }
        const io = req.app.get('io');
        if (io) {
            io.emit('booking_updated');
            if (trang_thai_chuan === 'DA_THANH_TOAN') {
                io.emit('payment_success', {
                    id,
                    ma_don_dat: id,
                    ten_khach_hang: tenKhach,
                    so_tien: finalData?.tong_tien || tong_tien_val
                });
            }
        }
        return res.status(200).json({
            success: true,
            message: 'Cập nhật đơn đặt sân thành công!',
            data: finalData
        });
    }
    catch (error) {
        console.error('Lỗi sp_SuaDonDatVaThanhToan:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi sửa đơn đặt sân'
        });
    }
};
exports.suaDonDatVaThanhToan = suaDonDatVaThanhToan;
/**
 * Xóa Đơn Đặt Sân & Thanh Toán
 * Method: DELETE /api/dat-san/don-dat-thanh-toan/:id
 * Procedure: sp_XoaDonDatVaThanhToan
 */
const xoaDonDatVaThanhToan = async (req, res) => {
    try {
        const id = String(req.params.id);
        const parsedId = parseInt(id, 10);
        if (isNaN(parsedId) || parsedId > 2147483647 || parsedId < -2147483648) {
            return res.status(400).json({
                success: false,
                message: 'ID đơn đặt không hợp lệ'
            });
        }
        const pool = await db_1.poolPromise;
        await pool.request()
            .input('id', db_1.sql.Int, parsedId)
            .execute('sp_XoaDonDatVaThanhToan');
        const io = req.app.get('io');
        if (io) {
            io.emit('booking_updated');
            io.emit('payment_success');
        }
        return res.status(200).json({
            success: true,
            message: 'Xóa đơn đặt sân thành công!'
        });
    }
    catch (error) {
        console.error('Lỗi sp_XoaDonDatVaThanhToan:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi xóa đơn đặt sân'
        });
    }
};
exports.xoaDonDatVaThanhToan = xoaDonDatVaThanhToan;
/**
 * 23. Xác nhận vào sân / Đưa đơn vào sân đang đá
 * Method: POST /api/dat-san/vao-san/:id
 */
const vaoSan = async (req, res) => {
    try {
        const id = parseInt(String(req.params.id), 10);
        if (isNaN(id) || id > 2147483647 || id < -2147483648) {
            return res.status(400).json({
                success: false,
                message: 'ID đơn đặt không hợp lệ'
            });
        }
        const { trang_thai } = req.body;
        const pool = await db_1.poolPromise;
        const newStatus = trang_thai || 'DANG_DA';
        await pool.request()
            .input('id', db_1.sql.Int, id)
            .input('trang_thai', db_1.sql.VarChar(20), newStatus)
            .query(`
                UPDATE Don_Dat_San 
                SET da_vao_san = 1, 
                    gio_vao_san = CONVERT(TIME, GETDATE()),
                    trang_thai = @trang_thai
                WHERE id = @id
            `);
        const io = req.app.get('io');
        if (io) {
            io.emit('booking_updated');
            io.emit('pitch_updated');
        }
        return res.status(200).json({
            success: true,
            message: 'Xác nhận vào sân thành công!',
            data: { id, da_vao_san: 1, trang_thai: newStatus }
        });
    }
    catch (error) {
        console.error('Lỗi khi xác nhận vào sân:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi xác nhận vào sân'
        });
    }
};
exports.vaoSan = vaoSan;
/**
 * 24. Kiểm tra khả năng gia hạn thêm thời gian đá cho sân đang đá
 * Method: POST /api/dat-san/kiem-tra-gia-han
 * Procedure: sp_KiemTraVaGiaHanSan
 */
const kiemTraGiaHan = async (req, res) => {
    try {
        const { ma_don_dat, so_phut_them, gio_ket_thuc_moi } = req.body;
        if (!ma_don_dat) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp ma_don_dat!' });
        }
        const pool = await db_1.poolPromise;
        const request = pool.request()
            .input('ma_don_dat', db_1.sql.Int, parseInt(ma_don_dat, 10))
            .input('so_phut_them', db_1.sql.Int, so_phut_them ? parseInt(so_phut_them, 10) : 30)
            .input('xac_nhan_gia_han', db_1.sql.Bit, 0);
        if (gio_ket_thuc_moi) {
            request.input('gio_ket_thuc_moi', db_1.sql.VarChar(8), gio_ket_thuc_moi.length === 5 ? `${gio_ket_thuc_moi}:00` : gio_ket_thuc_moi);
        }
        else {
            request.input('gio_ket_thuc_moi', db_1.sql.VarChar(8), null);
        }
        const result = await request.execute('sp_KiemTraVaGiaHanSan');
        const checkInfo = result.recordsets[0]?.[0];
        const alternativePitches = result.recordsets[1] || [];
        return res.status(200).json({
            success: true,
            data: {
                ...checkInfo,
                san_thay_the: alternativePitches
            }
        });
    }
    catch (error) {
        console.error('Lỗi kiemTraGiaHan:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi kiểm tra gia hạn sân'
        });
    }
};
exports.kiemTraGiaHan = kiemTraGiaHan;
/**
 * 25. Xác nhận gia hạn thêm thời gian đá cho sân đang đá
 * Method: POST /api/dat-san/xac-nhan-gia-han
 * Procedure: sp_KiemTraVaGiaHanSan
 */
const xacNhanGiaHan = async (req, res) => {
    try {
        const { ma_don_dat, so_phut_them, gio_ket_thuc_moi, da_thanh_toan_luon, phuong_thuc } = req.body;
        if (!ma_don_dat) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp ma_don_dat!' });
        }
        const pool = await db_1.poolPromise;
        const request = pool.request()
            .input('ma_don_dat', db_1.sql.Int, parseInt(ma_don_dat, 10))
            .input('so_phut_them', db_1.sql.Int, so_phut_them ? parseInt(so_phut_them, 10) : 30)
            .input('xac_nhan_gia_han', db_1.sql.Bit, 1);
        if (gio_ket_thuc_moi) {
            request.input('gio_ket_thuc_moi', db_1.sql.VarChar(8), gio_ket_thuc_moi.length === 5 ? `${gio_ket_thuc_moi}:00` : gio_ket_thuc_moi);
        }
        else {
            request.input('gio_ket_thuc_moi', db_1.sql.VarChar(8), null);
        }
        const result = await request.execute('sp_KiemTraVaGiaHanSan');
        const updateInfo = result.recordsets[0]?.[0];
        if (!updateInfo || updateInfo.co_the_gia_han === 0) {
            return res.status(400).json({
                success: false,
                message: updateInfo?.thong_bao || 'Sân đã bị trùng lịch, không thể gia hạn trực tiếp!',
                data: {
                    ...updateInfo,
                    san_thay_the: result.recordsets[1] || []
                }
            });
        }
        // Nếu khách thanh toán số tiền phát sinh thêm luôn
        if (da_thanh_toan_luon && updateInfo.tien_san_them > 0) {
            try {
                await pool.request()
                    .input('ma_don_dat', db_1.sql.Int, parseInt(ma_don_dat, 10))
                    .input('phuong_thuc', db_1.sql.VarChar(20), phuong_thuc || 'TIEN_MAT')
                    .input('loai_thanh_toan', db_1.sql.VarChar(20), 'TRA_HET')
                    .input('so_tien', db_1.sql.Decimal(10, 2), updateInfo.tien_san_them)
                    .input('ma_giao_dich', db_1.sql.VarChar(100), `GD_GIAHAN_${ma_don_dat}_${Date.now()}`)
                    .input('trang_thai_gd', db_1.sql.VarChar(20), 'THANH_CONG')
                    .query(`
                        INSERT INTO Thanh_Toan (ma_don_dat, phuong_thuc, loai_thanh_toan, so_tien, ma_giao_dich, trang_thai_gd, ngay_thanh_toan)
                        VALUES (@ma_don_dat, @phuong_thuc, @loai_thanh_toan, @so_tien, @ma_giao_dich, @trang_thai_gd, GETDATE())
                    `);
            }
            catch (payErr) {
                console.warn('Lỗi ghi nhận thanh toán gia hạn:', payErr.message);
            }
        }
        const io = req.app.get('io');
        if (io) {
            io.emit('booking_updated');
            io.emit('pitch_updated');
        }
        return res.status(200).json({
            success: true,
            message: updateInfo.thong_bao || 'Gia hạn thời gian đá sân thành công!',
            data: updateInfo
        });
    }
    catch (error) {
        console.error('Lỗi xacNhanGiaHan:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi xác nhận gia hạn sân'
        });
    }
};
exports.xacNhanGiaHan = xacNhanGiaHan;
/**
 * 26. Chuyển khách sang sân khác đá tiếp (khi sân cũ hết lịch)
 * Method: POST /api/dat-san/chuyen-san-da-tiep
 * Procedure: sp_ChuyenSanDaTiep
 */
const chuyenSanDaTiep = async (req, res) => {
    try {
        const { ma_don_cu, ma_san_moi, gio_bat_dau, gio_ket_thuc, phuong_thuc, so_tien } = req.body;
        if (!ma_don_cu || !ma_san_moi || !gio_bat_dau || !gio_ket_thuc) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ: ma_don_cu, ma_san_moi, gio_bat_dau, gio_ket_thuc!'
            });
        }
        const pool = await db_1.poolPromise;
        const gio_bd_clean = gio_bat_dau.length === 5 ? `${gio_bat_dau}:00` : gio_bat_dau;
        const gio_kt_clean = gio_ket_thuc.length === 5 ? `${gio_ket_thuc}:00` : gio_ket_thuc;
        const phuong_thuc_chuan = phuong_thuc === 'CHUYEN_KHOAN' ? 'CHUYEN_KHOAN' : 'TIEN_MAT';
        const so_tien_val = so_tien ? parseFloat(so_tien) : 0;
        const result = await pool.request()
            .input('ma_don_cu', db_1.sql.Int, parseInt(ma_don_cu, 10))
            .input('ma_san_moi', db_1.sql.Int, parseInt(ma_san_moi, 10))
            .input('gio_bat_dau', db_1.sql.VarChar(8), gio_bd_clean)
            .input('gio_ket_thuc', db_1.sql.VarChar(8), gio_kt_clean)
            .input('phuong_thuc', db_1.sql.VarChar(20), phuong_thuc_chuan)
            .input('loai_thanh_toan', db_1.sql.VarChar(20), so_tien_val > 0 ? 'TRA_HET' : 'DAT_COC')
            .input('so_tien', db_1.sql.Decimal(10, 2), so_tien_val)
            .execute('sp_ChuyenSanDaTiep');
        const newBooking = result.recordset[0];
        const io = req.app.get('io');
        if (io) {
            io.emit('booking_updated');
            io.emit('pitch_updated');
        }
        return res.status(201).json({
            success: true,
            message: `Chuyển khách sang ${newBooking?.ten_san || 'sân mới'} đá thêm thành công! Đã tạo hóa đơn mới #${newBooking?.id}.`,
            data: newBooking
        });
    }
    catch (error) {
        console.error('Lỗi chuyenSanDaTiep:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi chuyển khách sang sân khác đá tiếp'
        });
    }
};
exports.chuyenSanDaTiep = chuyenSanDaTiep;
/**
 * 27. Bán lẻ dịch vụ / nước uống tại quầy (Không cần đặt sân)
 * Method: POST /api/dat-san/ban-le-dich-vu
 * Procedure: sp_BanLeDichVu
 */
const banLeDichVu = async (req, res) => {
    try {
        const { ten_khach_hang, so_dien_thoai, phuong_thuc, ghi_chu, dich_vu_list, da_thanh_toan } = req.body;
        if (!Array.isArray(dich_vu_list) || dich_vu_list.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng chọn ít nhất 1 dịch vụ / món nước để bán lẻ!'
            });
        }
        const pool = await db_1.poolPromise;
        const phuong_thuc_chuan = phuong_thuc === 'CHUYEN_KHOAN' ? 'CHUYEN_KHOAN' : 'TIEN_MAT';
        const trang_thai_chuan = (da_thanh_toan === false || da_thanh_toan === 0) ? 'CHO_THANH_TOAN' : 'DA_THANH_TOAN';
        // 1. Tạo đơn bán lẻ (ma_san NULL)
        const orderRes = await pool.request()
            .input('ma_nguoi_dung', db_1.sql.Int, req.user?.id || 1)
            .input('ten_khach_hang', db_1.sql.NVarChar(100), ten_khach_hang || 'Khách lẻ quầy')
            .input('so_dien_thoai', db_1.sql.VarChar(20), so_dien_thoai || null)
            .input('phuong_thuc', db_1.sql.VarChar(20), phuong_thuc_chuan)
            .input('ghi_chu', db_1.sql.NVarChar(db_1.sql.MAX), ghi_chu || 'Bán lẻ dịch vụ / nước uống tại quầy')
            .input('trang_thai', db_1.sql.VarChar(20), trang_thai_chuan)
            .execute('sp_BanLeDichVu');
        const newOrder = orderRes.recordset[0];
        const ma_don_dat = newOrder.id;
        // 2. Thêm từng dịch vụ vào Chi_Tiet_Dich_Vu và trừ kho
        let tongTienDv = 0;
        for (const item of dich_vu_list) {
            const dvId = parseInt(item.ma_dich_vu || item.id, 10);
            const sl = parseInt(item.so_luong, 10) || 1;
            if (dvId && sl > 0) {
                try {
                    const dvItemRes = await pool.request()
                        .input('ma_don_dat', db_1.sql.Int, ma_don_dat)
                        .input('ma_dich_vu', db_1.sql.Int, dvId)
                        .input('so_luong', db_1.sql.Int, sl)
                        .execute('sp_ThemDichVu');
                    if (dvItemRes.recordset?.[0]?.tong_tien_don_moi) {
                        tongTienDv = parseFloat(dvItemRes.recordset[0].tong_tien_don_moi);
                    }
                }
                catch (dvErr) {
                    console.warn(`Lỗi thêm dịch vụ #${dvId} vào đơn bán lẻ:`, dvErr.message);
                }
            }
        }
        // 3. Nếu thanh toán ngay -> Lưu vào Thanh_Toan
        if (trang_thai_chuan === 'DA_THANH_TOAN' && tongTienDv > 0) {
            try {
                await pool.request()
                    .input('ma_don_dat', db_1.sql.Int, ma_don_dat)
                    .input('phuong_thuc', db_1.sql.VarChar(20), phuong_thuc_chuan)
                    .input('loai_thanh_toan', db_1.sql.VarChar(20), 'TRA_HET')
                    .input('so_tien', db_1.sql.Decimal(10, 2), tongTienDv)
                    .input('ma_giao_dich', db_1.sql.VarChar(100), `GD_BANLE_${ma_don_dat}_${Date.now()}`)
                    .input('trang_thai_gd', db_1.sql.VarChar(20), 'THANH_CONG')
                    .query(`
                        INSERT INTO Thanh_Toan (ma_don_dat, phuong_thuc, loai_thanh_toan, so_tien, ma_giao_dich, trang_thai_gd, ngay_thanh_toan)
                        VALUES (@ma_don_dat, @phuong_thuc, @loai_thanh_toan, @so_tien, @ma_giao_dich, @trang_thai_gd, GETDATE())
                    `);
            }
            catch (payErr) {
                console.warn('Lỗi ghi nhận thanh toán bán lẻ:', payErr.message);
            }
        }
        const io = req.app.get('io');
        if (io) {
            io.emit('booking_updated');
            if (trang_thai_chuan === 'DA_THANH_TOAN') {
                io.emit('payment_success', {
                    id: ma_don_dat,
                    ma_don_dat,
                    ten_khach_hang: ten_khach_hang || 'Khách lẻ quầy',
                    so_tien: tongTienDv
                });
            }
        }
        return res.status(201).json({
            success: true,
            message: `Bán lẻ dịch vụ thành công! Đơn hàng #${ma_don_dat} (${trang_thai_chuan === 'DA_THANH_TOAN' ? 'Đã thanh toán' : 'Chờ thanh toán'}).`,
            data: {
                ...newOrder,
                tong_tien: tongTienDv,
                chi_tiet_dich_vu: dich_vu_list
            }
        });
    }
    catch (error) {
        console.error('Lỗi banLeDichVu:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi bán lẻ dịch vụ'
        });
    }
};
exports.banLeDichVu = banLeDichVu;
