"use strict";
/**
 * =====================================================================
 * ROUTES: QUẢN LÝ DỊCH VỤ & KHO (/api/dich-vu)
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
const dichVuController = __importStar(require("../controllers/dichVuController"));
const router = express_1.default.Router();
// Lấy danh sách dịch vụ (Dich_Vu)
router.get('/', dichVuController.layDanhSachDichVu);
// Lấy danh sách phiếu nhập kho (Phieu_Nhap_Kho)
router.get('/phieu-nhap', dichVuController.layDanhSachPhieuNhapKho);
// Nhập kho dịch vụ
router.post('/nhap-kho', dichVuController.nhapKhoDichVu);
// Sửa phiếu nhập kho
router.put('/phieu-nhap/:id', dichVuController.suaPhieuNhapKho);
// Xóa phiếu nhập kho
router.delete('/phieu-nhap/:id', dichVuController.xoaPhieuNhapKho);
// Lấy danh sách chi tiết dịch vụ đã bán (Chi_Tiet_Dich_Vu)
router.get('/chi-tiet-ban-hang', dichVuController.layDanhSachChiTietDichVu);
// Bán/Thêm dịch vụ vào đơn đặt sân
router.post('/them-vao-don', dichVuController.themDichVuVaoDon);
// Cập nhật số lượng / Thêm / Xóa dịch vụ trong đơn đặt sân
router.post('/cap-nhat-don', dichVuController.capNhatDichVuDon);
// Thêm mới dịch vụ
router.post('/', dichVuController.themDichVu);
// Cập nhật dịch vụ
router.put('/:id', dichVuController.suaDichVu);
// Xóa dịch vụ
router.delete('/:id', dichVuController.xoaDichVu);
exports.default = router;
