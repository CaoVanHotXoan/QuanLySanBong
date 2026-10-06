/**
 * =====================================================================
 * ROUTES: BÁO CÁO & THỐNG KÊ (/api/bao-cao)
 * =====================================================================
 */

import express, { Router } from 'express';
import * as baoCaoController from '../controllers/baoCaoController';

const router: Router = express.Router();

// 1. Thống kê doanh thu theo khoảng thời gian
router.get('/doanh-thu', baoCaoController.baoCaoDoanhThu);

// 2. Biểu đồ doanh thu theo Ngày / Tuần / Tháng
router.get('/doanh-thu-bieu-do', baoCaoController.baoCaoDoanhThuBieuDo);

// 3. Top dịch vụ bán chạy nhất
router.get('/top-dich-vu', baoCaoController.topDichVuBanChay);

// 4. Lấy đơn đặt sân mới nhất (5 dòng)
router.get('/don-moi-nhat', baoCaoController.layDonDatMoiNhat);

// 5. Trạng thái sân trực quan
router.get('/trang-thai-san', baoCaoController.layTrangThaiSanTrucQuan);

export default router;
