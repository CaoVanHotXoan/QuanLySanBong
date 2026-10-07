"use strict";
/**
 * =====================================================================
 * ROUTES: NỘI DUNG & QUẢN TRỊ (TIN TỨC, ABOUT US, LIÊN HỆ, BANNER)
 * =====================================================================
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const contentController = __importStar(require("../controllers/contentController"));
const router = express_1.default.Router();
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
exports.default = router;
