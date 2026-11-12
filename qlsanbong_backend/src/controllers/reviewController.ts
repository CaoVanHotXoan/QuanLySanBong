/**
 * =====================================================================
 * CONTROLLER QUẢN LÝ ĐÁNH GIÁ, BÌNH LUẬN VÀ TRẢ LỜI BÌNH LUẬN THEO SÂN
 * =====================================================================
 */

import { Response } from 'express';
import sql from 'mssql';
import { poolPromise } from '../config/db';
import { AuthRequest } from '../types';

/**
 * 1. Lấy thông tin chi tiết sân, thống kê số sao và toàn bộ bình luận & trả lời
 * Method: GET /api/reviews/san/:sanId
 * Procedure: sp_LayDanhGiaTheoSan
 */
export const layDanhGiaTheoSan = async (req: AuthRequest, res: Response) => {
    try {
        const sanId = parseInt(req.params.sanId as string, 10);
        if (isNaN(sanId)) {
            return res.status(400).json({
                success: false,
                message: 'Mã sân không hợp lệ!'
            });
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('ma_san', sql.Int, sanId)
            .execute('sp_LayDanhGiaTheoSan');

        const sanThongKe = result.recordsets[0]?.[0] || null;
        const allComments = result.recordsets[1] || [];

        // Tổ chức dữ liệu cây phân cấp nhiều tầng (Multi-level Nested Comments)
        const commentMap = new Map<number, any>();
        allComments.forEach((c: any) => {
            commentMap.set(c.id, {
                ...c,
                tra_loi: []
            });
        });

        const rootComments: any[] = [];
        allComments.forEach((c: any) => {
            const item = commentMap.get(c.id);
            if (c.binh_luan_cha_id && commentMap.has(c.binh_luan_cha_id)) {
                commentMap.get(c.binh_luan_cha_id).tra_loi.push(item);
            } else {
                rootComments.push(item);
            }
        });

        // Bình luận gốc mới nhất xếp lên đầu
        rootComments.sort((a, b) => new Date(b.ngay_tao).getTime() - new Date(a.ngay_tao).getTime());

        return res.status(200).json({
            success: true,
            data: {
                san: sanThongKe,
                tong_binh_luan: allComments.length,
                danh_sach: rootComments
            }
        });
    } catch (error: any) {
        console.error('Lỗi layDanhGiaTheoSan:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin đánh giá sân: ' + error.message
        });
    }
};

/**
 * 2. Gửi đánh giá / bình luận mới hoặc trả lời bình luận
 * Method: POST /api/reviews
 * Procedure: sp_ThemDanhGiaSan
 */
export const themDanhGiaSan = async (req: AuthRequest, res: Response) => {
    try {
        const { ma_san, so_sao, noi_dung, binh_luan_cha_id } = req.body;
        const userId = req.user?.id || req.body.ma_nguoi_dung;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Vui lòng đăng nhập để gửi đánh giá hoặc bình luận!'
            });
        }

        if (!ma_san) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu mã sân bóng!'
            });
        }

        if (!noi_dung || !noi_dung.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Nội dung bình luận không được để trống!'
            });
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('ma_san', sql.Int, parseInt(ma_san, 10))
            .input('ma_nguoi_dung', sql.Int, parseInt(userId, 10))
            .input('noi_dung', sql.NVarChar(1000), noi_dung.trim())
            .input('so_sao', sql.Int, so_sao ? parseInt(so_sao, 10) : null)
            .input('binh_luan_cha_id', sql.Int, binh_luan_cha_id ? parseInt(binh_luan_cha_id, 10) : null)
            .execute('sp_ThemDanhGiaSan');

        const newComment = result.recordset[0];

        return res.status(201).json({
            success: true,
            message: binh_luan_cha_id ? 'Đã gửi câu trả lời thành công!' : 'Đã gửi đánh giá thành công!',
            data: newComment
        });
    } catch (error: any) {
        console.error('Lỗi themDanhGiaSan:', error.message);
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi gửi đánh giá sân'
        });
    }
};

/**
 * 3. Xóa bình luận / đánh giá (Chủ sở hữu hoặc Quản trị viên)
 * Method: DELETE /api/reviews/:id
 * Procedure: sp_XoaDanhGiaSan
 */
export const xoaDanhGiaSan = async (req: AuthRequest, res: Response) => {
    try {
        const commentId = parseInt(req.params.id as string, 10);
        const userId = req.user?.id || req.body.ma_nguoi_dung;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Vui lòng đăng nhập để thực hiện quyền này!'
            });
        }

        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, commentId)
            .input('ma_nguoi_dung', sql.Int, parseInt(userId, 10))
            .execute('sp_XoaDanhGiaSan');

        return res.status(200).json({
            success: true,
            message: 'Đã xóa bình luận thành công!'
        });
    } catch (error: any) {
        console.error('Lỗi xoaDanhGiaSan:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi xóa bình luận'
        });
    }
};

/**
 * 4. Chỉnh sửa bình luận / câu trả lời (Chính chủ hoặc Quản trị viên)
 * Method: PUT /api/reviews/:id
 * Procedure: sp_SuaDanhGiaSan
 */
export const suaDanhGiaSan = async (req: AuthRequest, res: Response) => {
    try {
        const commentId = parseInt(req.params.id as string, 10);
        const userId = req.user?.id || req.body.ma_nguoi_dung;
        const { noi_dung, so_sao } = req.body;

        if (isNaN(commentId)) {
            return res.status(400).json({
                success: false,
                message: 'Mã bình luận không hợp lệ!'
            });
        }

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Vui lòng đăng nhập để thực hiện quyền này!'
            });
        }

        if (!noi_dung || !noi_dung.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Nội dung bình luận không được để trống!'
            });
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, commentId)
            .input('ma_nguoi_dung', sql.Int, parseInt(userId, 10))
            .input('noi_dung', sql.NVarChar(1000), noi_dung.trim())
            .input('so_sao', sql.Int, so_sao ? parseInt(so_sao, 10) : null)
            .execute('sp_SuaDanhGiaSan');

        return res.status(200).json({
            success: true,
            message: 'Đã cập nhật bình luận thành công!',
            data: result.recordset?.[0]
        });
    } catch (error: any) {
        console.error('Lỗi suaDanhGiaSan:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi cập nhật bình luận'
        });
    }
};


