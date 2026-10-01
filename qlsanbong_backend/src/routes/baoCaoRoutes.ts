/**
 * =====================================================================
 * ROUTES: BÁO CÁO & THỐNG KÊ (/api/bao-cao)
 * =====================================================================
 */

import express, { Router } from 'express';
import * as baoCaoController from '../controllers/baoCaoController';
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware';

const router: Router = express.Router();

// Thống kê doanh thu theo khoảng thời gian (Yêu cầu quyền ADMIN hoặc NHAN_VIEN)
router.get('/doanh-thu', verifyToken, authorizeRoles('ADMIN', 'NHAN_VIEN'), baoCaoController.baoCaoDoanhThu);

export default router;
