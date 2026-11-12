/**
 * =====================================================================
 * ROUTES QUẢN LÝ ĐÁNH GIÁ VÀ BÌNH LUẬN THEO SÂN BÓNG
 * =====================================================================
 */

import { Router } from 'express';
import * as reviewController from '../controllers/reviewController';
import { verifyToken } from '../middlewares/authMiddleware';

const router = Router();

// 1. Lấy chi tiết sân và toàn bộ bình luận & trả lời theo mã sân (Công khai)
router.get('/san/:sanId', reviewController.layDanhGiaTheoSan);

// 2. Thêm bình luận / đánh giá mới hoặc trả lời bình luận (Cần đăng nhập)
router.post('/', verifyToken, reviewController.themDanhGiaSan);

// 3. Xóa bình luận / câu trả lời (Cần đăng nhập - Chính chủ hoặc Admin)
router.delete('/:id', verifyToken, reviewController.xoaDanhGiaSan);

// 4. Chỉnh sửa bình luận / câu trả lời (Cần đăng nhập - Chính chủ hoặc Admin)
router.put('/:id', verifyToken, reviewController.suaDanhGiaSan);

export default router;

