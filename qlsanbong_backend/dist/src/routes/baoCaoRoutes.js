"use strict";
/**
 * =====================================================================
 * ROUTES: BÁO CÁO & THỐNG KÊ (/api/bao-cao)
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
const baoCaoController = __importStar(require("../controllers/baoCaoController"));
const router = express_1.default.Router();
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
// 6. Lấy tổng doanh thu của ngày (hôm nay hoặc ngày chỉ định)
router.get('/doanh-thu-ngay', baoCaoController.layDoanhThuNgay);
exports.default = router;
