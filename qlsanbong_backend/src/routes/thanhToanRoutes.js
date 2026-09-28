/**
 * =====================================================================
 * ROUTES: THANH TOÁN (/api/thanh-toan)
 * =====================================================================
 */

const express = require('express');
const router = express.Router();
const thanhToanController = require('../controllers/thanhToanController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Thanh toán đơn đặt sân (Yêu cầu đăng nhập)
router.post('/', verifyToken, thanhToanController.thanhToanDon);

module.exports = router;
