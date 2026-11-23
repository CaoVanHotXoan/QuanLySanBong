import { Request, Response } from 'express';
import { sql, poolPromise } from '../config/db';
import { AuthRequest } from '../types';
import { scanAndSendBookingReminders, sendImmediateReminderForBooking } from '../services/reminderService';

/**
 * 1. Lấy danh sách thông báo của người dùng hiện tại
 * GET /api/thong-bao
 */
export const layDanhSachThongBao = async (req: AuthRequest, res: Response) => {
  try {
    const ma_nguoi_dung = req.user?.id;
    if (!ma_nguoi_dung) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để xem thông báo!' });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('ma_nguoi_dung', sql.Int, ma_nguoi_dung)
      .execute('sp_LayDanhSachThongBao');

    const list = result.recordset || [];
    const unreadCount = list.filter((item: any) => !item.da_doc || item.da_doc === 0).length;

    return res.status(200).json({
      success: true,
      data: list,
      unreadCount
    });
  } catch (error: any) {
    console.error('Lỗi layDanhSachThongBao:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tải danh sách thông báo: ' + error.message
    });
  }
};

/**
 * 2. Đánh dấu 1 thông báo là đã đọc
 * PUT /api/thong-bao/:id/da-doc
 */
export const danhDauDaDoc = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const ma_nguoi_dung = req.user?.id;

    if (!ma_nguoi_dung) {
      return res.status(401).json({ success: false, message: 'Chưa xác thực!' });
    }

    const pool = await poolPromise;
    await pool.request()
      .input('id', sql.Int, id)
      .input('ma_nguoi_dung', sql.Int, ma_nguoi_dung)
      .execute('sp_DanhDauDaDocThongBao');

    return res.status(200).json({
      success: true,
      message: 'Đã đánh dấu thông báo đã đọc!'
    });
  } catch (error: any) {
    console.error('Lỗi danhDauDaDoc:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 3. Đánh dấu tất cả thông báo là đã đọc
 * PUT /api/thong-bao/doc-tat-ca
 */
export const danhDauDocTatCa = async (req: AuthRequest, res: Response) => {
  try {
    const ma_nguoi_dung = req.user?.id;
    if (!ma_nguoi_dung) {
      return res.status(401).json({ success: false, message: 'Chưa xác thực!' });
    }

    const pool = await poolPromise;
    await pool.request()
      .input('ma_nguoi_dung', sql.Int, ma_nguoi_dung)
      .execute('sp_DanhDauDocTatCaThongBao');

    return res.status(200).json({
      success: true,
      message: 'Đã đánh dấu tất cả thông báo đã đọc!'
    });
  } catch (error: any) {
    console.error('Lỗi danhDauDocTatCa:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 4. Xóa thông báo
 * DELETE /api/thong-bao/:id
 */
export const xoaThongBao = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const ma_nguoi_dung = req.user?.id;

    if (!ma_nguoi_dung) {
      return res.status(401).json({ success: false, message: 'Chưa xác thực!' });
    }

    const pool = await poolPromise;
    await pool.request()
      .input('id', sql.Int, id)
      .input('ma_nguoi_dung', sql.Int, ma_nguoi_dung)
      .execute('sp_XoaThongBao');

    return res.status(200).json({
      success: true,
      message: 'Đã xóa thông báo!'
    });
  } catch (error: any) {
    console.error('Lỗi xoaThongBao:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 5. Kích hoạt quét và gửi nhắc nhở thủ công (cho Admin / Cron kiểm tra)
 * POST /api/thong-bao/kiem-tra-nhac-nho
 */
export const kiemTraNhacNhoThuCong = async (req: Request, res: Response) => {
  try {
    const io = req.app.get('io');
    const result = await scanAndSendBookingReminders(io);

    return res.status(200).json({
      success: true,
      message: `Đã hoàn tất quét nhắc lịch. Tổng xử lý: ${result.totalProcessed}, thành công: ${result.successCount}`,
      data: result
    });
  } catch (error: any) {
    console.error('Lỗi kiemTraNhacNhoThuCong:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 6. Gửi thử nghiệm nhắc lịch cho 1 đơn cụ thể
 * POST /api/thong-bao/test-reminder/:ma_don_dat
 */
export const testGuiNhacNho = async (req: Request, res: Response) => {
  try {
    const ma_don_dat = parseInt(String(req.params.ma_don_dat), 10);
    const io = req.app.get('io');
    const sent = await sendImmediateReminderForBooking(ma_don_dat, io);

    return res.status(200).json({
      success: sent,
      message: sent
        ? `✅ Đã gửi email và tạo thông báo nhắc lịch thành công cho đơn #${ma_don_dat}!`
        : `⚠️ Không tìm thấy đơn hoặc không thể gửi thông báo cho đơn #${ma_don_dat}`
    });
  } catch (error: any) {
    console.error('Lỗi testGuiNhacNho:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
