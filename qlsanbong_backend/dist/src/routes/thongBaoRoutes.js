"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const thongBaoController_1 = require("../controllers/thongBaoController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// Lấy danh sách thông báo của user đang đăng nhập
router.get('/', authMiddleware_1.verifyToken, thongBaoController_1.layDanhSachThongBao);
// Đánh dấu 1 thông báo là đã đọc
router.put('/:id/da-doc', authMiddleware_1.verifyToken, thongBaoController_1.danhDauDaDoc);
// Đánh dấu tất cả thông báo là đã đọc
router.put('/doc-tat-ca', authMiddleware_1.verifyToken, thongBaoController_1.danhDauDocTatCa);
// Xóa thông báo
router.delete('/:id', authMiddleware_1.verifyToken, thongBaoController_1.xoaThongBao);
// Kích hoạt quét nhắc nhở thủ công
router.post('/kiem-tra-nhac-nho', thongBaoController_1.kiemTraNhacNhoThuCong);
// Gửi thử nghiệm nhắc lịch cho 1 đơn cụ thể
router.post('/test-reminder/:ma_don_dat', thongBaoController_1.testGuiNhacNho);
exports.default = router;
