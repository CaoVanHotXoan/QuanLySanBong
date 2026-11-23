import { Router } from 'express';
import {
  layDanhSachThongBao,
  danhDauDaDoc,
  danhDauDocTatCa,
  xoaThongBao,
  kiemTraNhacNhoThuCong,
  testGuiNhacNho
} from '../controllers/thongBaoController';
import { verifyToken } from '../middlewares/authMiddleware';

const router = Router();

// Lấy danh sách thông báo của user đang đăng nhập
router.get('/', verifyToken, layDanhSachThongBao);

// Đánh dấu 1 thông báo là đã đọc
router.put('/:id/da-doc', verifyToken, danhDauDaDoc);

// Đánh dấu tất cả thông báo là đã đọc
router.put('/doc-tat-ca', verifyToken, danhDauDocTatCa);

// Xóa thông báo
router.delete('/:id', verifyToken, xoaThongBao);

// Kích hoạt quét nhắc nhở thủ công
router.post('/kiem-tra-nhac-nho', kiemTraNhacNhoThuCong);

// Gửi thử nghiệm nhắc lịch cho 1 đơn cụ thể
router.post('/test-reminder/:ma_don_dat', testGuiNhacNho);

export default router;
