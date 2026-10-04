"use strict";
/**
 * =====================================================================
 * ROUTES: QUẢN LÝ ĐẶT SÂN (/api/dat-san)
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
const datSanController = __importStar(require("../controllers/datSanController"));
const router = express_1.default.Router();
// Lấy danh sách sân bóng (sp_LayDanhSachSan)
router.get('/danh-sach-san', datSanController.layDanhSachSan);
router.get('/san-bong', datSanController.layDanhSachSan);
// Lấy, thêm, sửa, xóa loại sân (Loai_San)
router.get('/loai-san', datSanController.layDanhSachLoaiSan);
router.post('/loai-san', datSanController.themLoaiSan);
router.put('/loai-san/:id', datSanController.suaLoaiSan);
router.delete('/loai-san/:id', datSanController.xoaLoaiSan);
// Thêm, sửa, xóa sân bóng (San_Bong)
router.post('/san-bong', datSanController.themSanBong);
router.put('/san-bong/:id', datSanController.suaSanBong);
router.delete('/san-bong/:id', datSanController.xoaSanBong);
// Lấy danh sách khung giờ từ CSDL
router.get('/khung-gio', datSanController.layDanhSachKhungGio);
router.get('/khung-gio/all', datSanController.layTatCaKhungGioAdmin);
router.post('/khung-gio', datSanController.themKhungGio);
router.put('/khung-gio/:id', datSanController.suaKhungGio);
router.delete('/khung-gio/:id', datSanController.xoaKhungGio);
router.post('/khung-gio/reset', datSanController.resetKhungGio);
// Lấy danh sách khung giờ giá
router.get('/khung-gio-gia', datSanController.layKhungGioGia);
router.post('/khung-gio-gia', datSanController.themKhungGioGia);
router.put('/khung-gio-gia/:id', datSanController.suaKhungGioGia);
router.delete('/khung-gio-gia/:id', datSanController.xoaKhungGioGia);
// Lấy & Quản lý tất cả đơn đặt sân & thanh toán (Admin Dashboard)
router.get('/tat-ca-don', datSanController.layTatCaDonDat);
router.post('/don-dat-thanh-toan', datSanController.themDonDatVaThanhToan);
router.put('/don-dat-thanh-toan/:id', datSanController.suaDonDatVaThanhToan);
router.delete('/don-dat-thanh-toan/:id', datSanController.xoaDonDatVaThanhToan);
router.post('/vao-san/:id', datSanController.vaoSan);
// Lấy lịch đặt sân theo ngày
router.get('/lich-san', datSanController.layLichSan);
// Lấy lịch sử đặt sân của khách hàng (CSDL SQL Server)
router.get('/lich-su-khach-hang', datSanController.layLichSuKhachHang);
// Đặt sân bóng (sp_DatSan)
router.post('/', datSanController.datSan);
// Đặt sân & tính giờ linh hoạt theo số phút (Flexible Booking)
router.post('/tinh-gia-linh-hoat', datSanController.tinhGiaLinhHoat);
router.post('/dat-linh-hoat', datSanController.datSanLinhHoat);
router.post('/checkin-linh-hoat', datSanController.batDauDaLinhHoat);
router.post('/checkout-linh-hoat', datSanController.ketThucDaLinhHoat);
// Hủy đơn đặt sân và hoàn cọc (sp_HuyDonVaHoanCoc)
router.post('/huy-don', datSanController.huyDonVaHoanCoc);
// Gia hạn thời gian sân đang đá & Chuyển sân đá tiếp & Bán lẻ dịch vụ
router.post('/kiem-tra-gia-han', datSanController.kiemTraGiaHan);
router.post('/xac-nhan-gia-han', datSanController.xacNhanGiaHan);
router.post('/chuyen-san-da-tiep', datSanController.chuyenSanDaTiep);
router.post('/ban-le-dich-vu', datSanController.banLeDichVu);
exports.default = router;
