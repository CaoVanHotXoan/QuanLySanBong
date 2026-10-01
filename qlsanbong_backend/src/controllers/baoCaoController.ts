/**
 * =====================================================================
 * CONTROLLER: BÁO CÁO & THỐNG KÊ (BAO CAO CONTROLLER)
 * Thực thi Stored Procedure: sp_BaoCaoDoanhThu
 * =====================================================================
 */

import { Response } from 'express';
import { sql, poolPromise } from '../config/db';
import { AuthRequest } from '../types';

/**
 * Thống kê báo cáo doanh thu theo khoảng thời gian
 * Method: GET /api/bao-cao/doanh-thu?tu_ngay=YYYY-MM-DD&den_ngay=YYYY-MM-DD
 * Header: Authorization: Bearer <token> (Yêu cầu quyền ADMIN hoặc NHAN_VIEN)
 */
export const baoCaoDoanhThu = async (req: AuthRequest, res: Response) => {
    try {
        const { tu_ngay, den_ngay } = req.query;

        if (!tu_ngay || !den_ngay) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ tu_ngay và den_ngay (Định dạng: YYYY-MM-DD)!'
            });
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('tu_ngay', sql.Date, tu_ngay as string)
            .input('den_ngay', sql.Date, den_ngay as string)
            .execute('sp_BaoCaoDoanhThu');

        // result.recordsets[0]: Tổng quan doanh thu
        // result.recordsets[1]: Chi tiết doanh thu theo từng ngày
        const tongQuan = result.recordsets[0] ? result.recordsets[0][0] : {};
        const chiTietTheoNgay = result.recordsets[1] || [];

        return res.status(200).json({
            success: true,
            data: {
                tong_quan: tongQuan,
                chi_tiet_ngay: chiTietTheoNgay
            }
        });
    } catch (error: any) {
        console.error('Lỗi sp_BaoCaoDoanhThu:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi lấy báo cáo doanh thu'
        });
    }
};
