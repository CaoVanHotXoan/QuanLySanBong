/**
 * =====================================================================
 * ROUTES: BÁO CÁO & THỐNG KÊ (/api/bao-cao)
 * =====================================================================
 */

const express = require('express');
const router = express.Router();
const baoCaoController = require('../controllers/baoCaoController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');

// Thống kê doanh thu theo khoảng thời gian (Yêu cầu quyền ADMIN hoặc NHAN_VIEN)
router.get('/doanh-thu', verifyToken, authorizeRoles('ADMIN', 'NHAN_VIEN'), baoCaoController.baoCaoDoanhThu);

module.exports = router;
