/**
 * =====================================================================
 * ROUTES: NỘI DUNG & QUẢN TRỊ (TIN TỨC, ABOUT US, LIÊN HỆ, BANNER)
 * =====================================================================
 */

import express, { Router } from 'express';
import * as contentController from '../controllers/contentController';

const router: Router = express.Router();

// --- LOẠI TIN TỨC ---
router.get('/tin-tuc/loai-tin', contentController.layDanhSachLoaiTinTuc);
router.get('/tin-tuc/loai-tin/admin', contentController.layDanhSachLoaiTinTucAdmin);
router.post('/tin-tuc/loai-tin', contentController.themLoaiTinTuc);
router.put('/tin-tuc/loai-tin/:id', contentController.suaLoaiTinTuc);
router.delete('/tin-tuc/loai-tin/:id', contentController.xoaLoaiTinTuc);

// --- TIN TỨC ---
router.get('/tin-tuc', contentController.layDanhSachTinTuc);
router.get('/tin-tuc/admin', contentController.layDanhSachTinTucAdmin);
router.get('/tin-tuc/:id', contentController.layChiTietTinTuc);
router.post('/tin-tuc', contentController.themTinTuc);
router.put('/tin-tuc/:id', contentController.suaTinTuc);
router.delete('/tin-tuc/:id', contentController.xoaTinTuc);

// --- ABOUT US ---
router.get('/about-us', contentController.layThongTinAboutUs);
router.put('/about-us', contentController.capNhatAboutUs);

// --- LIÊN HỆ ---
router.post('/lien-he', contentController.guiLienHe);
router.get('/lien-he', contentController.layDanhSachLienHe);
router.put('/lien-he/:id/trang-thai', contentController.capNhatTrangThaiLienHe);
router.post('/lien-he/:id/tra-loi', contentController.traLoiLienHe);
router.delete('/lien-he/:id', contentController.xoaLienHe);

// --- BANNER ---
router.get('/banner', contentController.layDanhSachBanner);
router.get('/banner/admin', contentController.layDanhSachBannerAdmin);
router.post('/banner', contentController.themBanner);
router.put('/banner/:id', contentController.suaBanner);
router.delete('/banner/:id', contentController.xoaBanner);

export default router;
