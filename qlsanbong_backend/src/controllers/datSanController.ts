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

import { Response } from 'express';
import { sql, poolPromise } from '../config/db';
import { AuthRequest } from '../types';

/**
 * 1. Lấy danh sách tất cả các sân bóng
 * Method: GET /api/dat-san/danh-sach-san
 * Procedure: sp_LayDanhSachSan
 */
export const layDanhSachSan = async (req: AuthRequest, res: Response) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .execute('sp_LayDanhSachSan');

        return res.status(200).json({
            success: true,
            data: result.recordset
        });
    } catch (error: any) {
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
export const layDanhSachLoaiSan = async (req: AuthRequest, res: Response) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .execute('sp_LayDanhSachLoaiSan');

        return res.status(200).json({
            success: true,
            data: result.recordset
        });
    } catch (error: any) {
        console.error('Lỗi sp_LayDanhSachLoaiSan:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi lấy danh sách loại sân'
        });
    }
};

/**
 * 2b. Thêm loại sân mới (Admin Dashboard)
 * Method: POST /api/dat-san/loai-san
 * Procedure: sp_ThemLoaiSan
 */
export const themLoaiSan = async (req: AuthRequest, res: Response) => {
    try {
        const { ten_loai, mo_ta, trang_thai } = req.body;
        if (!ten_loai) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập tên loại sân!'
            });
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('ten_loai', sql.NVarChar(50), ten_loai)
            .input('mo_ta', sql.NVarChar(sql.MAX), mo_ta || null)
            .input('trang_thai', sql.Bit, trang_thai !== false ? 1 : 0)
            .execute('sp_ThemLoaiSan');

        return res.status(201).json({
            success: true,
            message: 'Thêm loại sân mới thành công!',
            data: result.recordset[0]
        });
    } catch (error: any) {
        console.error('Lỗi sp_ThemLoaiSan:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi thêm loại sân'
        });
    }
};

/**
 * 2c. Sửa thông tin loại sân (Admin Dashboard)
 * Method: PUT /api/dat-san/loai-san/:id
 * Procedure: sp_SuaLoaiSan
 */
export const suaLoaiSan = async (req: AuthRequest, res: Response) => {
    try {
        const id = String(req.params.id);
        const { ten_loai, mo_ta, trang_thai } = req.body;

        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, parseInt(id, 10))
            .input('ten_loai', sql.NVarChar(50), ten_loai)
            .input('mo_ta', sql.NVarChar(sql.MAX), mo_ta || null)
            .input('trang_thai', sql.Bit, trang_thai !== false ? 1 : 0)
            .execute('sp_SuaLoaiSan');

        return res.status(200).json({
            success: true,
            message: 'Cập nhật loại sân thành công!',
            data: result.recordset[0]
        });
    } catch (error: any) {
        console.error('Lỗi sp_SuaLoaiSan:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi cập nhật loại sân'
        });
    }
};

/**
 * 2d. Xóa loại sân (Admin Dashboard)
 * Method: DELETE /api/dat-san/loai-san/:id
 * Procedure: sp_XoaLoaiSan
 */
export const xoaLoaiSan = async (req: AuthRequest, res: Response) => {
    try {
        const id = String(req.params.id);
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, parseInt(id, 10))
            .execute('sp_XoaLoaiSan');

        return res.status(200).json({
            success: true,
            message: 'Xóa loại sân thành công!'
        });
    } catch (error: any) {
        console.error('Lỗi sp_XoaLoaiSan:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi xóa loại sân'
        });
    }
};

/**
 * 3. Thêm sân bóng mới (Admin Dashboard)
 * Method: POST /api/dat-san/san-bong
 * Procedure: sp_ThemSanBong
 */
export const themSanBong = async (req: AuthRequest, res: Response) => {
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
    } catch (error: any) {
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
export const suaSanBong = async (req: AuthRequest, res: Response) => {
    try {
        const id = String(req.params.id);
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
    } catch (error: any) {
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
export const xoaSanBong = async (req: AuthRequest, res: Response) => {
    try {
        const id = String(req.params.id);
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, parseInt(id, 10))
            .execute('sp_XoaSanBong');

        return res.status(200).json({
            success: true,
            message: 'Xóa sân bóng thành công!'
        });
    } catch (error: any) {
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
export const layKhungGioGia = async (req: AuthRequest, res: Response) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .execute('sp_LayKhungGioGia');

        return res.status(200).json({
            success: true,
            data: result.recordset
        });
    } catch (error: any) {
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
export const themKhungGioGia = async (req: AuthRequest, res: Response) => {
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
    } catch (error: any) {
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
export const suaKhungGioGia = async (req: AuthRequest, res: Response) => {
    try {
        const id = String(req.params.id);
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
    } catch (error: any) {
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
export const xoaKhungGioGia = async (req: AuthRequest, res: Response) => {
    try {
        const id = String(req.params.id);
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, parseInt(id, 10))
            .execute('sp_XoaKhungGioGia');

        return res.status(200).json({
            success: true,
            message: 'Xóa khung giờ giá thành công!'
        });
    } catch (error: any) {
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
export const layTatCaDonDat = async (req: AuthRequest, res: Response) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().execute('sp_LayTatCaDonDat');
        const bookings = result.recordset || [];

        // Lấy toàn bộ chi tiết dịch vụ cho các đơn bằng Procedure sp_LayDanhSachChiTietDichVu
        const detailsRes = await pool.request().execute('sp_LayDanhSachChiTietDichVu');
        const allDetails = detailsRes.recordset || [];

        // Lấy toàn bộ lịch sử thanh toán để tính so_tien_da_tra
        let allPayments: any[] = [];
        try {
            const paymentsRes = await pool.request().execute('sp_LayDanhSachThanhToan');
            allPayments = paymentsRes.recordset || [];
        } catch (payErr: any) {
            console.warn('Lỗi sp_LayDanhSachThanhToan:', payErr.message);
        }

        const merged = bookings.map((b: any) => {
            const services = allDetails.filter((d: any) => d.ma_don_dat === b.id);
            const payments = allPayments.filter((p: any) => p.ma_don_dat === b.id);
            const so_tien_da_tra = payments.reduce((sum: number, p: any) => sum + (Number(p.so_tien) || 0), 0);
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
    } catch (error: any) {
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
export const layLichSan = async (req: AuthRequest, res: Response) => {
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
            .input('ngay_da', sql.Date, ngay_da as string);

        if (ma_san) {
            request.input('ma_san', sql.Int, parseInt(ma_san as string, 10));
        } else {
            request.input('ma_san', sql.Int, null);
        }

        const result = await request.execute('sp_LayLichSan');
        const rawList = result.recordset || [];

        // Lấy chi tiết dịch vụ và thanh toán để gắn vào từng booking
        const detailsRes = await pool.request().execute('sp_LayDanhSachChiTietDichVu');
        const allDetails = detailsRes.recordset || [];

        let allPayments: any[] = [];
        try {
            const paymentsRes = await pool.request().execute('sp_LayDanhSachThanhToan');
            allPayments = paymentsRes.recordset || [];
        } catch (payErr: any) {
            console.warn('Lỗi sp_LayDanhSachThanhToan:', payErr.message);
        }

        const merged = rawList.map((b: any) => {
            const bId = b.ma_don_dat || b.id;
            const services = allDetails.filter((d: any) => d.ma_don_dat === bId);
            const payments = allPayments.filter((p: any) => p.ma_don_dat === bId);
            const so_tien_da_tra = payments.reduce((sum: number, p: any) => sum + (Number(p.so_tien) || 0), 0);
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
    } catch (error: any) {
        console.error('Lỗi sp_LayLichSan:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi lấy lịch đặt sân'
        });
    }
};

/**
 * 12. Đặt sân bóng (Lưu trạng thái DA_COC hoặc DA_THANH_TOAN vào bảng Don_Dat_San)
 * Method: POST /api/dat-san
 */
export const datSan = async (req: AuthRequest, res: Response) => {
    try {
        const { ma_san, ngay_da, gio_bat_dau, gio_ket_thuc, tien_san, tong_tien, phuong_thuc, loai_thanh_toan, trang_thai, ghi_chu, ho_ten, so_dien_thoai } = req.body;

        if (!ma_san || !ngay_da || !gio_bat_dau || !gio_ket_thuc) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ: ma_san, ngay_da, gio_bat_dau, gio_ket_thuc!'
            });
        }

        const pool = await poolPromise;

        // 1. Xác định hoặc tạo mới người dùng theo đúng Tên và Số điện thoại khách đặt sân
        let ma_nd: number | null = null;
        const ten_khach = (ho_ten && ho_ten.trim()) ? ho_ten.trim() : '';
        const sdt_khach = (so_dien_thoai && so_dien_thoai.trim()) ? so_dien_thoai.trim() : '';

        if (sdt_khach || ten_khach) {
            // Tìm theo số điện thoại trước
            if (sdt_khach) {
                const userByPhone = await pool.request()
                    .input('sdt', sql.VarChar(20), sdt_khach)
                    .query('SELECT TOP 1 id, ho_ten FROM Nguoi_Dung WHERE so_dien_thoai = @sdt');

                if (userByPhone.recordset && userByPhone.recordset.length > 0) {
                    ma_nd = userByPhone.recordset[0].id;
                    if (ten_khach && userByPhone.recordset[0].ho_ten !== ten_khach) {
                        await pool.request()
                            .input('uid', sql.Int, ma_nd)
                            .input('ten', sql.NVarChar(100), ten_khach)
                            .query('UPDATE Nguoi_Dung SET ho_ten = @ten WHERE id = @uid');
                    }
                }
            }

            // Nếu chưa có theo SĐT, tìm theo họ tên
            if (!ma_nd && ten_khach) {
                const userByName = await pool.request()
                    .input('ten', sql.NVarChar(100), ten_khach)
                    .query('SELECT TOP 1 id FROM Nguoi_Dung WHERE ho_ten = @ten');

                if (userByName.recordset && userByName.recordset.length > 0) {
                    ma_nd = userByName.recordset[0].id;
                    if (sdt_khach) {
                        await pool.request()
                            .input('uid', sql.Int, ma_nd)
                            .input('sdt', sql.VarChar(20), sdt_khach)
                            .query('UPDATE Nguoi_Dung SET so_dien_thoai = @sdt WHERE id = @uid');
                    }
                }
            }

            // Nếu vẫn chưa có, tạo mới bản ghi khách hàng chuẩn
            if (!ma_nd) {
                const cleanPhone = sdt_khach || `09${Math.floor(10000000 + Math.random() * 90000000)}`;
                const uniqueEmail = `khach_${Date.now()}_${Math.floor(Math.random() * 1000)}@soccer247.vn`;
                const insU = await pool.request()
                    .input('ho_ten', sql.NVarChar(100), ten_khach || 'Khách Đặt Sân')
                    .input('email', sql.VarChar(255), uniqueEmail)
                    .input('sdt', sql.VarChar(20), cleanPhone)
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
                const checkDb = await pool.request().input('uid', sql.Int, checkU).query('SELECT id FROM Nguoi_Dung WHERE id = @uid');
                if (checkDb.recordset && checkDb.recordset.length > 0) ma_nd = checkU;
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
        const trang_thai_chuan = isTraHet ? 'DA_THANH_TOAN' : 'DA_COC';
        const phuong_thuc_chuan = (phuong_thuc === 'TIEN_MAT') ? 'TIEN_MAT' : 'CHUYEN_KHOAN';
        const tien_san_val = tien_san ? parseFloat(tien_san) : (tong_tien ? parseFloat(tong_tien) : 0);
        const tong_tien_val = tong_tien ? parseFloat(tong_tien) : tien_san_val;
        const gio_bd_clean = (gio_bat_dau && gio_bat_dau.length === 5) ? `${gio_bat_dau}:00` : (gio_bat_dau || '06:00:00');
        const gio_kt_clean = (gio_ket_thuc && gio_ket_thuc.length === 5) ? `${gio_ket_thuc}:00` : (gio_ket_thuc || '07:30:00');

        // 3. Thực hiện lưu trực tiếp vào bảng Don_Dat_San
        let booking: any = null;
        try {
            const insertRes = await pool.request()
                .input('ma_nguoi_dung', sql.Int, ma_nd)
                .input('ma_san', sql.Int, parseInt(ma_san, 10))
                .input('ngay_da', sql.Date, ngay_da)
                .input('gio_bat_dau', sql.VarChar(8), gio_bd_clean)
                .input('gio_ket_thuc', sql.VarChar(8), gio_kt_clean)
                .input('tien_san', sql.Decimal(10, 2), tien_san_val)
                .input('tong_tien', sql.Decimal(10, 2), tong_tien_val)
                .input('phuong_thuc', sql.VarChar(20), phuong_thuc_chuan)
                .input('ghi_chu', sql.NVarChar(sql.MAX), ghi_chu || null)
                .input('trang_thai', sql.VarChar(30), trang_thai_chuan)
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
        } catch (insertErr: any) {
            console.warn('Thử fallback lưu Don_Dat_San:', insertErr.message);
            const fallbackTrangThai = isTraHet ? 'Da Thanh Toan' : 'DA_COC';
            const fallbackRes = await pool.request()
                .input('ma_nguoi_dung', sql.Int, ma_nd)
                .input('ma_san', sql.Int, parseInt(ma_san, 10))
                .input('ngay_da', sql.Date, ngay_da)
                .input('gio_bat_dau', sql.VarChar(8), gio_bd_clean)
                .input('gio_ket_thuc', sql.VarChar(8), gio_kt_clean)
                .input('tien_san', sql.Decimal(10, 2), tien_san_val)
                .input('tong_tien', sql.Decimal(10, 2), tong_tien_val)
                .input('phuong_thuc', sql.VarChar(20), phuong_thuc_chuan)
                .input('ghi_chu', sql.NVarChar(sql.MAX), ghi_chu || null)
                .input('trang_thai', sql.VarChar(30), fallbackTrangThai)
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

        // 4. Lưu chi tiết dịch vụ vào bảng Chi_Tiet_Dich_Vu và trừ tồn kho Dich_Vu
        const donDatId = booking ? (booking.id || booking.ma_don_dat) : null;
        const selectedServices = req.body.dich_vu_chon || req.body.dich_vu || {};

        if (donDatId && selectedServices) {
            let serviceItems: any[] = [];
            if (Array.isArray(selectedServices)) {
                serviceItems = selectedServices;
            } else if (typeof selectedServices === 'object') {
                Object.entries(selectedServices).forEach(([dvId, qty]) => {
                    const numQty = parseInt(qty as string, 10);
                    if (numQty > 0) {
                        serviceItems.push({ ma_dich_vu: parseInt(dvId, 10), so_luong: numQty });
                    }
                });
            }

            for (const item of serviceItems) {
                try {
                    const dvId = item.ma_dich_vu || item.id;
                    const sl = parseInt(item.so_luong, 10) || 1;
                    if (!dvId || sl <= 0) continue;

                    // Lấy đơn giá và tồn kho hiện tại của dịch vụ
                    const dvRes = await pool.request()
                        .input('dvid', sql.Int, dvId)
                        .query('SELECT id, don_gia, ton_kho FROM Dich_Vu WHERE id = @dvid');

                    if (dvRes.recordset && dvRes.recordset.length > 0) {
                        const donGia = parseFloat(dvRes.recordset[0].don_gia) || 0;
                        const tongTienDv = sl * donGia;

                        // Chèn / Cập nhật vào bảng Chi_Tiet_Dich_Vu
                        await pool.request()
                            .input('madon', sql.Int, donDatId)
                            .input('madv', sql.Int, dvId)
                            .input('sl', sql.Int, sl)
                            .input('tongtien', sql.Decimal(10, 2), tongTienDv)
                            .query(`
                                IF EXISTS (SELECT 1 FROM Chi_Tiet_Dich_Vu WHERE ma_don_dat = @madon AND ma_dich_vu = @madv)
                                BEGIN
                                    UPDATE Chi_Tiet_Dich_Vu 
                                    SET so_luong = so_luong + @sl, tongtien_dichvu = tongtien_dichvu + @tongtien
                                    WHERE ma_don_dat = @madon AND ma_dich_vu = @madv
                                END
                                ELSE
                                BEGIN
                                    INSERT INTO Chi_Tiet_Dich_Vu (ma_don_dat, ma_dich_vu, so_luong, tongtien_dichvu)
                                    VALUES (@madon, @madv, @sl, @tongtien)
                                END
                            `);

                        // Trừ số lượng tồn tương ứng trong bảng Dich_Vu
                        await pool.request()
                            .input('madv', sql.Int, dvId)
                            .input('sl', sql.Int, sl)
                            .query(`
                                UPDATE Dich_Vu 
                                SET ton_kho = CASE WHEN ton_kho >= @sl THEN ton_kho - @sl ELSE 0 END
                                WHERE id = @madv
                            `);
                    }
                } catch (serviceErr: any) {
                    console.error('Lỗi khi chèn Chi_Tiet_Dich_Vu và trừ kho:', serviceErr.message);
                }
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
    } catch (error: any) {
        console.error('Lỗi datSan:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi thực hiện đặt sân'
        });
    }
};

/**
 * 12b. Lấy lịch sử đặt sân của khách hàng (Đúng dữ liệu CSDL SQL Server - sp_LayLichSuDatSan)
 * Method: GET /api/dat-san/lich-su-khach-hang
 */
export const layLichSuKhachHang = async (req: AuthRequest, res: Response) => {
    try {
        const { ma_nguoi_dung, so_dien_thoai, email } = req.query;
        const pool = await poolPromise;

        const request = pool.request();
        let ma_nd_param: number | null = null;
        let sdt_param: string | null = null;
        let email_param: string | null = null;

        if (ma_nguoi_dung && parseInt(ma_nguoi_dung as string, 10)) {
            ma_nd_param = parseInt(ma_nguoi_dung as string, 10);
            request.input('ma_nguoi_dung', sql.Int, ma_nd_param);
        } else {
            request.input('ma_nguoi_dung', sql.Int, null);
        }

        if (so_dien_thoai && (so_dien_thoai as string).trim()) {
            sdt_param = (so_dien_thoai as string).trim();
            request.input('so_dien_thoai', sql.VarChar(20), sdt_param);
        } else {
            request.input('so_dien_thoai', sql.VarChar(20), null);
        }

        if (email && (email as string).trim()) {
            email_param = (email as string).trim();
            request.input('email', sql.VarChar(255), email_param);
        } else {
            request.input('email', sql.VarChar(255), null);
        }

        const result = await request.execute('sp_LayLichSuDatSan');
        const data = result.recordset || [];

        // 100% Stored Procedure: Lấy chi tiết dịch vụ bằng sp_LayChiTietDichVuDonDat
        if (data.length > 0) {
            const dvRes = await pool.request().execute('sp_LayChiTietDichVuDonDat');
            const dvMap: Record<number, any[]> = {};
            (dvRes.recordset || []).forEach((dv: any) => {
                if (!dvMap[dv.ma_don_dat]) dvMap[dv.ma_don_dat] = [];
                dvMap[dv.ma_don_dat].push(dv);
            });

            data.forEach((order: any) => {
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
    } catch (error: any) {
        console.error('Lỗi layLichSuKhachHang:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi lấy lịch sử đặt sân của khách hàng'
        });
    }
};

/**
 * 13. Hủy đơn đặt sân và hoàn cọc
 * Method: POST /api/dat-san/huy-don
 * Procedure: sp_HuyDonVaHoanCoc
 */
export const huyDonVaHoanCoc = async (req: AuthRequest, res: Response) => {
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
    } catch (error: any) {
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
export const tinhGiaLinhHoat = async (req: AuthRequest, res: Response) => {
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
    } catch (error: any) {
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
export const datSanLinhHoat = async (req: AuthRequest, res: Response) => {
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
            .input('ghi_chu', sql.NVarChar(sql.MAX), ghi_chu || null)
            .input('tien_coc', sql.Decimal(10, 2), tien_coc ? parseFloat(tien_coc) : 0)
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
    } catch (error: any) {
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
export const batDauDaLinhHoat = async (req: AuthRequest, res: Response) => {
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
            .input('ghi_chu', sql.NVarChar(sql.MAX), ghi_chu || null)
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
    } catch (error: any) {
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
export const ketThucDaLinhHoat = async (req: AuthRequest, res: Response) => {
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
    } catch (error: any) {
        console.error('Lỗi sp_KetThucDaLinhHoat:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi kết thúc tính giờ đá linh hoạt'
        });
    }
};

/**
 * 18. Lấy danh sách khung giờ từ CSDL (Bảng Khung_Gio)
 * Method: GET /api/dat-san/khung-gio
 * Procedure: sp_LayDanhSachKhungGio
 */
export const layDanhSachKhungGio = async (req: AuthRequest, res: Response) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().execute('sp_LayDanhSachKhungGio');

        return res.status(200).json({
            success: true,
            data: result.recordset
        });
    } catch (error: any) {
        console.error('Lỗi sp_LayDanhSachKhungGio:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi lấy danh sách khung giờ'
        });
    }
};

/**
 * Lấy tất cả khung giờ cho Admin Dashboard (Bao gồm cả đang khóa)
 * Method: GET /api/dat-san/khung-gio/all
 * Procedure: sp_LayTatCaKhungGioAdmin
 */
export const layTatCaKhungGioAdmin = async (req: AuthRequest, res: Response) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().execute('sp_LayTatCaKhungGioAdmin');

        return res.status(200).json({
            success: true,
            data: result.recordset
        });
    } catch (error: any) {
        console.error('Lỗi sp_LayTatCaKhungGioAdmin:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi lấy danh sách khung giờ cho Admin'
        });
    }
};

/**
 * Thêm mới khung giờ
 * Method: POST /api/dat-san/khung-gio
 * Procedure: sp_ThemKhungGio
 */
export const themKhungGio = async (req: AuthRequest, res: Response) => {
    try {
        const { gio_bat_dau, gio_ket_thuc, nhan_hien_thi, thu_tu, trang_thai } = req.body;
        if (!gio_bat_dau || !gio_ket_thuc || !nhan_hien_thi) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ gio_bat_dau, gio_ket_thuc, nhan_hien_thi!'
            });
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('gio_bat_dau', sql.VarChar(5), gio_bat_dau)
            .input('gio_ket_thuc', sql.VarChar(5), gio_ket_thuc)
            .input('nhan_hien_thi', sql.NVarChar(50), nhan_hien_thi)
            .input('thu_tu', sql.Int, parseInt(thu_tu, 10) || 1)
            .input('trang_thai', sql.Bit, trang_thai === undefined || trang_thai === null || trang_thai === true || trang_thai === 1 ? 1 : 0)
            .execute('sp_ThemKhungGio');

        return res.status(201).json({
            success: true,
            message: 'Thêm khung giờ mới thành công!',
            data: result.recordset[0]
        });
    } catch (error: any) {
        console.error('Lỗi sp_ThemKhungGio:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi thêm khung giờ'
        });
    }
};

/**
 * Cập nhật khung giờ
 * Method: PUT /api/dat-san/khung-gio/:id
 * Procedure: sp_SuaKhungGio
 */
export const suaKhungGio = async (req: AuthRequest, res: Response) => {
    try {
        const id = String(req.params.id);
        const { gio_bat_dau, gio_ket_thuc, nhan_hien_thi, thu_tu, trang_thai } = req.body;

        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, parseInt(id, 10))
            .input('gio_bat_dau', sql.VarChar(5), gio_bat_dau)
            .input('gio_ket_thuc', sql.VarChar(5), gio_ket_thuc)
            .input('nhan_hien_thi', sql.NVarChar(50), nhan_hien_thi)
            .input('thu_tu', sql.Int, parseInt(thu_tu, 10) || 1)
            .input('trang_thai', sql.Bit, trang_thai ? 1 : 0)
            .execute('sp_SuaKhungGio');

        return res.status(200).json({
            success: true,
            message: 'Cập nhật khung giờ thành công!',
            data: result.recordset[0]
        });
    } catch (error: any) {
        console.error('Lỗi sp_SuaKhungGio:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi cập nhật khung giờ'
        });
    }
};

/**
 * Xóa khung giờ
 * Method: DELETE /api/dat-san/khung-gio/:id
 * Procedure: sp_XoaKhungGio
 */
export const xoaKhungGio = async (req: AuthRequest, res: Response) => {
    try {
        const id = String(req.params.id);
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, parseInt(id, 10))
            .execute('sp_XoaKhungGio');

        return res.status(200).json({
            success: true,
            message: 'Xóa khung giờ thành công!'
        });
    } catch (error: any) {
        console.error('Lỗi sp_XoaKhungGio:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi xóa khung giờ'
        });
    }
};

/**
 * Đặt lại 27 khung giờ mặc định (6h - 19h30)
 * Method: POST /api/dat-san/khung-gio/reset
 * Procedure: sp_ResetKhungGio
 */
export const resetKhungGio = async (req: AuthRequest, res: Response) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().execute('sp_ResetKhungGio');

        return res.status(200).json({
            success: true,
            message: 'Đã nạp lại 27 khung giờ mặc định thành công!',
            data: result.recordset
        });
    } catch (error: any) {
        console.error('Lỗi sp_ResetKhungGio:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi đặt lại khung giờ'
        });
    }
};

async function resolveCustomerUserId(pool: any, ten_khach_hang?: string, so_dien_thoai?: string, fallbackId: number = 1): Promise<number> {
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
                .input('phone', sql.VarChar(20), phone)
                .query('SELECT TOP 1 id FROM Nguoi_Dung WHERE so_dien_thoai = @phone');
            if (res.recordset[0]?.id) {
                return res.recordset[0].id;
            }
        }

        // 2. Tìm theo Tên khách hàng
        if (ten) {
            const res = await pool.request()
                .input('ten', sql.NVarChar(100), ten)
                .query('SELECT TOP 1 id FROM Nguoi_Dung WHERE ho_ten = @ten');
            if (res.recordset[0]?.id) {
                return res.recordset[0].id;
            }
        }

        // 3. Nếu chưa có trong CSDL -> Tự động thêm khách hàng mới vào bảng Nguoi_Dung
        const email = `khach_${Date.now()}_${Math.floor(Math.random() * 1000)}@khachhang.pos`;
        const insertRes = await pool.request()
            .input('ho_ten', sql.NVarChar(100), ten || `Khách ${phone}`)
            .input('email', sql.VarChar(255), email)
            .input('so_dien_thoai', sql.VarChar(15), phone || null)
            .input('MaVaiTro', sql.Int, 3)
            .query(`
                INSERT INTO Nguoi_Dung (ho_ten, email, so_dien_thoai, MaVaiTro)
                OUTPUT INSERTED.id
                VALUES (@ho_ten, @email, @so_dien_thoai, @MaVaiTro)
            `);
        if (insertRes.recordset[0]?.id) {
            return insertRes.recordset[0].id;
        }
    } catch (err: any) {
        console.warn('Lỗi tự động định danh khách hàng:', err.message);
    }

    return fallbackId;
}

/**
 * Thêm Đơn Đặt Sân (Admin Dashboard)
 * Method: POST /api/dat-san/don-dat-thanh-toan
 * Procedure: sp_ThemDonDatVaThanhToan
 */
export const themDonDatVaThanhToan = async (req: AuthRequest, res: Response) => {
    try {
        const { ma_nguoi_dung, ma_san, ngay_da, gio_bat_dau, gio_ket_thuc, tien_san, tong_tien, ghi_chu, trang_thai, phuong_thuc, loai_thanh_toan, so_tien, trang_thai_gd, ten_khach_hang, so_dien_thoai } = req.body;

        const pool = await poolPromise;
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
            .input('ma_nguoi_dung', sql.Int, parseInt(ma_nguoi_dung, 10) || req.user?.id || 1)
            .input('ma_san', sql.Int, parseInt(ma_san, 10))
            .input('ngay_da', sql.Date, ngay_da_clean)
            .input('gio_bat_dau', sql.VarChar(8), gio_bd_clean)
            .input('gio_ket_thuc', sql.VarChar(8), gio_kt_clean)
            .input('tien_san', sql.Decimal(10, 2), tien_san_val)
            .input('tong_tien', sql.Decimal(10, 2), tong_tien_val)
            .input('phuong_thuc', sql.VarChar(20), phuong_thuc_chuan)
            .input('trang_thai', sql.VarChar(30), trang_thai_chuan)
            .input('ghi_chu', sql.NVarChar(sql.MAX), ghi_chu || null)
            .input('loai_thanh_toan', sql.VarChar(20), loai_thanh_toan || 'DAT_COC')
            .input('so_tien', sql.Decimal(10, 2), so_tien_val)
            .input('trang_thai_gd', sql.VarChar(20), trang_thai_gd || 'THANH_CONG')
            .input('ten_khach_hang', sql.NVarChar(100), tenKhach || null)
            .input('so_dien_thoai', sql.VarChar(20), sdtKhach || null)
            .execute('sp_ThemDonDatVaThanhToan');

        const orderData = result.recordset[0];
        const orderId = orderData?.id;

        if (orderId && Array.isArray(req.body.dich_vu_list) && req.body.dich_vu_list.length > 0) {
            for (const item of req.body.dich_vu_list) {
                if (item.ma_dich_vu && Number(item.so_luong) > 0) {
                    try {
                        await pool.request()
                            .input('ma_don_dat', sql.Int, parseInt(orderId, 10))
                            .input('ma_dich_vu', sql.Int, parseInt(item.ma_dich_vu, 10))
                            .input('so_luong', sql.Int, parseInt(item.so_luong, 10))
                            .execute('sp_ThemDichVu');
                    } catch (e: any) {
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
    } catch (error: any) {
        console.error('Lỗi sp_ThemDonDatVaThanhToan:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi thêm đơn đặt sân'
        });
    }
};

/**
 * Sửa Đơn Đặt Sân
 * Method: PUT /api/dat-san/don-dat-thanh-toan/:id
 * Procedure: sp_SuaDonDatVaThanhToan
 */
export const suaDonDatVaThanhToan = async (req: AuthRequest, res: Response) => {
    try {
        const id = String(req.params.id);
        const { ma_san, ma_nguoi_dung, ngay_da, gio_bat_dau, gio_ket_thuc, tien_san, tong_tien, ghi_chu, trang_thai, phuong_thuc, loai_thanh_toan, so_tien, trang_thai_gd, ten_khach_hang, so_dien_thoai } = req.body;

        const pool = await poolPromise;
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
            .input('id', sql.Int, parseInt(id, 10))
            .input('ma_nguoi_dung', sql.Int, ma_nguoi_dung ? parseInt(ma_nguoi_dung, 10) : (req.user?.id || 1))
            .input('ma_san', sql.Int, parseInt(ma_san, 10))
            .input('ngay_da', sql.Date, ngay_da_clean)
            .input('gio_bat_dau', sql.VarChar(8), gio_bd_clean)
            .input('gio_ket_thuc', sql.VarChar(8), gio_kt_clean)
            .input('tien_san', sql.Decimal(10, 2), tien_san_val)
            .input('tong_tien', sql.Decimal(10, 2), tong_tien_val)
            .input('phuong_thuc', sql.VarChar(20), phuong_thuc_chuan)
            .input('trang_thai', sql.VarChar(30), trang_thai_chuan)
            .input('ghi_chu', sql.NVarChar(sql.MAX), ghi_chu || null)
            .input('loai_thanh_toan', sql.VarChar(20), loai_thanh_toan || 'TRA_HET')
            .input('so_tien', sql.Decimal(10, 2), so_tien_val)
            .input('trang_thai_gd', sql.VarChar(20), trang_thai_gd || 'THANH_CONG')
            .input('ten_khach_hang', sql.NVarChar(100), tenKhach || null)
            .input('so_dien_thoai', sql.VarChar(20), sdtKhach || null)
            .execute('sp_SuaDonDatVaThanhToan');

        if (Array.isArray(req.body.dich_vu_list)) {
            // Lấy danh sách dịch vụ hiện có của đơn
            let currentServices: any[] = [];
            try {
                const existingDetailsRes = await pool.request().execute('sp_LayDanhSachChiTietDichVu');
                currentServices = (existingDetailsRes.recordset || []).filter((d: any) => d.ma_don_dat === parseInt(id, 10));
            } catch (e: any) {
                console.warn('Lỗi lấy chi tiết dịch vụ cũ:', e.message);
            }

            const newServiceIds = new Set(req.body.dich_vu_list.map((item: any) => parseInt(item.ma_dich_vu, 10)));

            // Xóa các dịch vụ cũ không còn trong danh sách mới (hoặc đã xóa hết)
            for (const oldSvc of currentServices) {
                if (!newServiceIds.has(oldSvc.ma_dich_vu)) {
                    try {
                        await pool.request()
                            .input('ma_don_dat', sql.Int, parseInt(id, 10))
                            .input('ma_dich_vu', sql.Int, parseInt(oldSvc.ma_dich_vu, 10))
                            .input('so_luong_moi', sql.Int, 0)
                            .execute('sp_CapNhatDichVuDonDat');
                    } catch (e: any) {
                        console.warn('Lỗi xóa dịch vụ cũ:', e.message);
                    }
                }
            }

            // Cập nhật hoặc thêm dịch vụ mới
            for (const item of req.body.dich_vu_list) {
                if (item.ma_dich_vu) {
                    try {
                        await pool.request()
                            .input('ma_don_dat', sql.Int, parseInt(id, 10))
                            .input('ma_dich_vu', sql.Int, parseInt(item.ma_dich_vu, 10))
                            .input('so_luong_moi', sql.Int, parseInt(item.so_luong || 0, 10))
                            .execute('sp_CapNhatDichVuDonDat');
                    } catch (e: any) {
                        console.warn('Lỗi cập nhật dịch vụ kèm đơn:', e.message);
                    }
                }
            }
        }

        // Lấy lại đơn đặt sau khi đã cập nhật dịch vụ từ CSDL SQL Server
        let finalData = result.recordset?.[0];
        try {
            const freshBooking = await pool.request()
                .input('id', sql.Int, parseInt(id, 10))
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
        } catch (fetchErr: any) {
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
    } catch (error: any) {
        console.error('Lỗi sp_SuaDonDatVaThanhToan:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi sửa đơn đặt sân'
        });
    }
};

/**
 * Xóa Đơn Đặt Sân & Thanh Toán
 * Method: DELETE /api/dat-san/don-dat-thanh-toan/:id
 * Procedure: sp_XoaDonDatVaThanhToan
 */
export const xoaDonDatVaThanhToan = async (req: AuthRequest, res: Response) => {
    try {
        const id = String(req.params.id);
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, parseInt(id, 10))
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
    } catch (error: any) {
        console.error('Lỗi sp_XoaDonDatVaThanhToan:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi xóa đơn đặt sân'
        });
    }
};

/**
 * 23. Xác nhận vào sân / Đưa đơn vào sân đang đá
 * Method: POST /api/dat-san/vao-san/:id
 */
export const vaoSan = async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(String(req.params.id), 10);
        const { trang_thai } = req.body;
        const pool = await poolPromise;
        const newStatus = trang_thai || 'DANG_DA';

        await pool.request()
            .input('id', sql.Int, id)
            .input('trang_thai', sql.VarChar(20), newStatus)
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
    } catch (error: any) {
        console.error('Lỗi khi xác nhận vào sân:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi xác nhận vào sân'
        });
    }
};

