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

import { Response } from 'express';
import { sql, poolPromise } from '../config/db';
import { AuthRequest } from '../types';
import memoryCache from '../services/cacheService';

/**
 * 1. Lấy danh sách tất cả dịch vụ (Nước uống, phụ kiện, thuê đồ...)
 * Method: GET /api/dich-vu
 * Procedure: sp_LayDanhSachDichVu
 */
export const layDanhSachDichVu = async (req: AuthRequest, res: Response) => {
    try {
        const cached = memoryCache.get('danh_sach_dich_vu');
        if (cached) {
            return res.status(200).json({
                success: true,
                data: cached
            });
        }
        const pool = await poolPromise;
        const result = await pool.request()
            .execute('sp_LayDanhSachDichVu');

        const data = result.recordset || [];
        memoryCache.set('danh_sach_dich_vu', data, 300); // Cache 5 phút

        return res.status(200).json({
            success: true,
            data
        });
    } catch (error: any) {
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
export const themDichVu = async (req: AuthRequest, res: Response) => {
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

        memoryCache.del('danh_sach_dich_vu');
        return res.status(201).json({
            success: true,
            message: 'Thêm dịch vụ mới thành công!',
            data: result.recordset[0]
        });
    } catch (error: any) {
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
export const suaDichVu = async (req: AuthRequest, res: Response) => {
    try {
        const id = String(req.params.id);
        const { ten_dich_vu, don_gia, don_vi_tinh, ton_kho } = req.body;

        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, parseInt(id, 10))
            .input('ten_dich_vu', sql.NVarChar(100), ten_dich_vu)
            .input('don_gia', sql.Decimal(10, 2), parseFloat(don_gia))
            .input('don_vi_tinh', sql.NVarChar(20), don_vi_tinh)
            .input('ton_kho', sql.Int, parseInt(ton_kho, 10))
            .execute('sp_SuaDichVu');

        memoryCache.del('danh_sach_dich_vu');
        return res.status(200).json({
            success: true,
            message: 'Cập nhật dịch vụ thành công!',
            data: result.recordset[0]
        });
    } catch (error: any) {
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
export const xoaDichVu = async (req: AuthRequest, res: Response) => {
    try {
        const id = String(req.params.id);
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, parseInt(id, 10))
            .execute('sp_XoaDichVu');

        memoryCache.del('danh_sach_dich_vu');
        return res.status(200).json({
            success: true,
            message: 'Xóa dịch vụ thành công!'
        });
    } catch (error: any) {
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
export const themDichVuVaoDon = async (req: AuthRequest, res: Response) => {
    try {
        const { ma_don_dat } = req.body;

        if (!ma_don_dat) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp ma_don_dat!'
            });
        }

        let items: any[] = [];
        if (Array.isArray(req.body.dich_vu_list) && req.body.dich_vu_list.length > 0) {
            items = req.body.dich_vu_list;
        } else if (req.body.ma_dich_vu && req.body.so_luong) {
            items = [{ ma_dich_vu: req.body.ma_dich_vu, so_luong: req.body.so_luong }];
        }

        if (items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp ma_dich_vu và so_luong!'
            });
        }

        const pool = await poolPromise;
        let lastResult: any = null;
        for (const item of items) {
            const result = await pool.request()
                .input('ma_don_dat', sql.Int, parseInt(ma_don_dat, 10))
                .input('ma_dich_vu', sql.Int, parseInt(item.ma_dich_vu, 10))
                .input('so_luong', sql.Int, parseInt(item.so_luong, 10))
                .execute('sp_ThemDichVu');
            lastResult = result.recordset[0];
        }

        memoryCache.del('danh_sach_dich_vu');
        return res.status(200).json({
            success: true,
            message: 'Thêm dịch vụ vào đơn đặt sân thành công!',
            data: lastResult
        });
    } catch (error: any) {
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
export const nhapKhoDichVu = async (req: AuthRequest, res: Response) => {
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
        memoryCache.del('danh_sach_dich_vu');

        return res.status(200).json({
            success: true,
            message: 'Nhập kho dịch vụ thành công!',
            data: inventoryResult
        });
    } catch (error: any) {
        console.error('Lỗi sp_NhapKhoDichVu:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi nhập kho dịch vụ'
        });
    }
};

/**
 * 7. Lấy danh sách phiếu nhập kho (Phieu_Nhap_Kho)
 * Method: GET /api/dich-vu/phieu-nhap
 * Procedure: sp_LayDanhSachPhieuNhapKho
 */
export const layDanhSachPhieuNhapKho = async (req: AuthRequest, res: Response) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().execute('sp_LayDanhSachPhieuNhapKho');
        return res.status(200).json({
            success: true,
            data: result.recordset
        });
    } catch (error: any) {
        console.error('Lỗi sp_LayDanhSachPhieuNhapKho:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi lấy danh sách phiếu nhập kho'
        });
    }
};

/**
 * 8. Lấy toàn bộ danh sách chi tiết dịch vụ đã bán (Chi_Tiet_Dich_Vu)
 * Method: GET /api/dich-vu/chi-tiet-ban-hang
 * Procedure: sp_LayDanhSachChiTietDichVu
 */
export const layDanhSachChiTietDichVu = async (req: AuthRequest, res: Response) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().execute('sp_LayDanhSachChiTietDichVu');
        return res.status(200).json({
            success: true,
            data: result.recordset
        });
    } catch (error: any) {
        console.error('Lỗi sp_LayDanhSachChiTietDichVu:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi lấy danh sách chi tiết dịch vụ đã bán'
        });
    }
};

/**
 * 9. Sửa phiếu nhập kho (Phieu_Nhap_Kho)
 * Method: PUT /api/dich-vu/phieu-nhap/:id
 * Procedure: sp_SuaPhieuNhapKho
 */
export const suaPhieuNhapKho = async (req: AuthRequest, res: Response) => {
    try {
        const id = String(req.params.id);
        const { so_luong_nhap, gia_nhap } = req.body;

        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, parseInt(id, 10))
            .input('so_luong_nhap', sql.Int, parseInt(so_luong_nhap, 10))
            .input('gia_nhap', sql.Decimal(10, 2), parseFloat(gia_nhap))
            .execute('sp_SuaPhieuNhapKho');

        return res.status(200).json({
            success: true,
            message: 'Cập nhật phiếu nhập kho thành công!',
            data: result.recordset[0]
        });
    } catch (error: any) {
        console.error('Lỗi sp_SuaPhieuNhapKho:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi sửa phiếu nhập kho'
        });
    }
};

/**
 * 10. Xóa phiếu nhập kho (Phieu_Nhap_Kho)
 * Method: DELETE /api/dich-vu/phieu-nhap/:id
 * Procedure: sp_XoaPhieuNhapKho
 */
export const xoaPhieuNhapKho = async (req: AuthRequest, res: Response) => {
    try {
        const id = String(req.params.id);
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, parseInt(id, 10))
            .execute('sp_XoaPhieuNhapKho');

        return res.status(200).json({
            success: true,
            message: 'Xóa phiếu nhập kho thành công!'
        });
    } catch (error: any) {
        console.error('Lỗi sp_XoaPhieuNhapKho:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi xóa phiếu nhập kho'
        });
    }
};

/**
 * 5.1 Cập nhật số lượng / Thêm / Xóa dịch vụ trong đơn đặt sân
 * Method: POST /api/dich-vu/cap-nhat-don
 * Procedure: sp_CapNhatDichVuDonDat
 */
export const capNhatDichVuDon = async (req: AuthRequest, res: Response) => {
    try {
        const { ma_don_dat, ma_dich_vu, so_luong } = req.body;

        if (!ma_don_dat || !ma_dich_vu || so_luong === undefined || so_luong === null) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ: ma_don_dat, ma_dich_vu, so_luong!'
            });
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('ma_don_dat', sql.Int, parseInt(ma_don_dat, 10))
            .input('ma_dich_vu', sql.Int, parseInt(ma_dich_vu, 10))
            .input('so_luong_moi', sql.Int, parseInt(so_luong, 10))
            .execute('sp_CapNhatDichVuDonDat');

        const serviceDetail = result.recordset[0];

        return res.status(200).json({
            success: true,
            message: 'Cập nhật dịch vụ đơn đặt sân thành công!',
            data: serviceDetail
        });
    } catch (error: any) {
        console.error('Lỗi sp_CapNhatDichVuDonDat:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi cập nhật dịch vụ đơn đặt'
        });
    }
};
