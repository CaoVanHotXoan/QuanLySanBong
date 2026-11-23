/**
 * =====================================================================
 * REMINDER SERVICE - TỰ ĐỘNG GỬI EMAIL & THÔNG BÁO NHẮC LỊCH ĐÁ BÓNG
 * TRƯỚC 1 TIẾNG KHI THỜI GIAN SỬ DỤNG SÂN BẮT ĐẦU
 * =====================================================================
 */

import { sql, poolPromise } from '../config/db';
import { sendBookingReminderEmail, isMailServiceEnabled } from './emailService';

// Format ngày YYYY-MM-DD -> DD/MM/YYYY
const formatDateDMY = (dateVal: any): string => {
  if (!dateVal) return '';
  if (dateVal instanceof Date) {
    const d = String(dateVal.getDate()).padStart(2, '0');
    const m = String(dateVal.getMonth() + 1).padStart(2, '0');
    const y = dateVal.getFullYear();
    return `${d}/${m}/${y}`;
  }
  const s = String(dateVal).split('T')[0];
  const parts = s.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return String(dateVal);
};

export interface ReminderProcessResult {
  totalProcessed: number;
  successCount: number;
  skippedCount: number;
  details: any[];
}

/**
 * Quét toàn bộ các đơn đặt sân sắp bắt đầu trong vòng 1 tiếng tới (chưa được gửi nhắc nhở)
 * 1. Gửi email nhắc lịch qua Gmail SMTP
 * 2. Tạo bản ghi thông báo trong bảng Thong_Bao cho tài khoản khách hàng
 * 3. Đánh dấu da_gui_nhac_nho = 1 vào Don_Dat_San qua sp_DanhDauDaGuiNhacNhoDonDatSan
 * 4. Phát thông báo Realtime qua Socket.io
 */
export const scanAndSendBookingReminders = async (io?: any): Promise<ReminderProcessResult> => {
  const result: ReminderProcessResult = {
    totalProcessed: 0,
    successCount: 0,
    skippedCount: 0,
    details: []
  };

  try {
    const pool = await poolPromise;
    const dbRes = await pool.request().execute('sp_LayDonDatSanCanNhacNho');
    const bookings = dbRes.recordset || [];

    if (bookings.length === 0) {
      return result;
    }

    console.log(`⏰ [Reminder Service]: Phát hiện ${bookings.length} đơn đặt sân cần gửi thông báo nhắc trước 1 tiếng.`);

    for (const b of bookings) {
      result.totalProcessed++;
      const playDateStr = formatDateDMY(b.ngay_da);
      const startTimeStr = b.gio_bat_dau || '';
      const endTimeStr = b.gio_ket_thuc || '';
      const pitchName = b.ten_san || 'Sân bóng Sport247';
      const categoryName = b.ten_loai_san || 'Sân bóng';

      // 1. Gửi Email thông báo qua Gmail SMTP
      let emailSent = false;
      if (b.email && b.email.includes('@')) {
        try {
          emailSent = await sendBookingReminderEmail({
            toEmail: b.email,
            customerName: b.ten_khach_hang || 'Quý khách',
            bookingId: b.ma_don_dat,
            pitchName,
            pitchCategory: categoryName,
            playDate: playDateStr,
            startTime: startTimeStr,
            endTime: endTimeStr,
            totalAmount: b.tong_tien,
            minutesRemaining: b.phut_con_lai
          });
        } catch (emailErr: any) {
          console.warn(`⚠️ [Reminder Service] Lỗi gửi email cho đơn #${b.ma_don_dat}:`, emailErr.message);
        }
      }

      // 2. Tạo thông báo trong hệ thống cho tài khoản khách hàng (bảng Thong_Bao)
      if (b.ma_nguoi_dung) {
        try {
          const tieuDe = `⏰ Nhắc lịch: Trận đấu tại ${pitchName} sắp bắt đầu lúc ${startTimeStr}!`;
          const noiDung = `Trận đấu đặt sân #${b.ma_don_dat} (${pitchName} - ${categoryName}) của bạn sẽ bắt đầu vào lúc ${startTimeStr} - ${endTimeStr} ngày ${playDateStr} (còn khoảng 1 tiếng nữa). Quý khách vui lòng đến trước 10-15 phút để chuẩn bị trang phục thi đấu và nhận sân đúng giờ!`;

          await pool.request()
            .input('ma_nguoi_dung', sql.Int, b.ma_nguoi_dung)
            .input('tieu_de', sql.NVarChar(255), tieuDe)
            .input('noi_dung', sql.NVarChar(sql.MAX), noiDung)
            .input('loai_thong_bao', sql.VarChar(50), 'NHAC_LICH')
            .input('ma_don_dat', sql.Int, b.ma_don_dat)
            .execute('sp_ThemThongBao');

          // Phát realtime tới client
          if (io) {
            io.emit('new_notification', {
              userId: b.ma_nguoi_dung,
              bookingId: b.ma_don_dat,
              title: tieuDe,
              createdAt: new Date().toISOString()
            });
          }
        } catch (notifErr: any) {
          console.warn(`⚠️ [Reminder Service] Lỗi lưu thông báo vào DB cho đơn #${b.ma_don_dat}:`, notifErr.message);
        }
      }

      // 3. Đánh dấu đã gửi nhắc nhở để không bao giờ gửi lặp lại
      try {
        await pool.request()
          .input('ma_don_dat', sql.Int, b.ma_don_dat)
          .execute('sp_DanhDauDaGuiNhacNhoDonDatSan');
        result.successCount++;
        result.details.push({
          bookingId: b.ma_don_dat,
          email: b.email,
          customerName: b.ten_khach_hang,
          pitchName,
          startTime: startTimeStr,
          emailSent
        });
      } catch (markErr: any) {
        console.error(`❌ [Reminder Service] Lỗi đánh dấu đã gửi nhắc nhở đơn #${b.ma_don_dat}:`, markErr.message);
      }
    }

    return result;
  } catch (error: any) {
    console.error('❌ [Reminder Service] Lỗi quét và gửi thông báo nhắc lịch:', error.message);
    return result;
  }
};

/**
 * Gửi thông báo nhắc lịch ngay lập tức cho 1 đơn cụ thể (Dùng cho API Test / Kích hoạt thủ công)
 */
export const sendImmediateReminderForBooking = async (bookingId: number, io?: any): Promise<boolean> => {
  try {
    const pool = await poolPromise;
    const dbRes = await pool.request()
      .input('id', sql.Int, bookingId)
      .query(`
        SELECT 
            d.id AS ma_don_dat,
            d.ma_nguoi_dung,
            nd.ho_ten AS ten_khach_hang,
            nd.email,
            nd.so_dien_thoai,
            d.ma_san,
            sb.ten_san,
            ls.ten_loai AS ten_loai_san,
            d.ngay_da,
            CONVERT(VARCHAR(5), d.gio_bat_dau, 108) AS gio_bat_dau,
            CONVERT(VARCHAR(5), d.gio_ket_thuc, 108) AS gio_ket_thuc,
            d.tong_tien,
            d.trang_thai
        FROM Don_Dat_San d
        LEFT JOIN Nguoi_Dung nd ON d.ma_nguoi_dung = nd.id
        LEFT JOIN San_Bong sb ON d.ma_san = sb.id
        LEFT JOIN Loai_San ls ON sb.ma_loai_san = ls.id
        WHERE d.id = @id
      `);

    const b = dbRes.recordset && dbRes.recordset[0];
    if (!b) return false;

    const playDateStr = formatDateDMY(b.ngay_da);
    const startTimeStr = b.gio_bat_dau || '';
    const endTimeStr = b.gio_ket_thuc || '';
    const pitchName = b.ten_san || 'Sân bóng Sport247';
    const categoryName = b.ten_loai_san || 'Sân bóng';

    // Gửi email
    if (b.email && b.email.includes('@')) {
      await sendBookingReminderEmail({
        toEmail: b.email,
        customerName: b.ten_khach_hang || 'Quý khách',
        bookingId: b.ma_don_dat,
        pitchName,
        pitchCategory: categoryName,
        playDate: playDateStr,
        startTime: startTimeStr,
        endTime: endTimeStr,
        totalAmount: b.tong_tien,
        minutesRemaining: 60
      });
    }

    // Tạo thông báo trong hệ thống
    if (b.ma_nguoi_dung) {
      const tieuDe = `⏰ Nhắc lịch: Trận đấu tại ${pitchName} sắp bắt đầu lúc ${startTimeStr}!`;
      const noiDung = `Trận đấu đặt sân #${b.ma_don_dat} (${pitchName} - ${categoryName}) của bạn sẽ bắt đầu vào lúc ${startTimeStr} - ${endTimeStr} ngày ${playDateStr} (còn 1 tiếng nữa bắt đầu). Quý khách vui lòng đến trước 10-15 phút để chuẩn bị trang phục thi đấu và nhận sân đúng giờ!`;

      await pool.request()
        .input('ma_nguoi_dung', sql.Int, b.ma_nguoi_dung)
        .input('tieu_de', sql.NVarChar(255), tieuDe)
        .input('noi_dung', sql.NVarChar(sql.MAX), noiDung)
        .input('loai_thong_bao', sql.VarChar(50), 'NHAC_LICH')
        .input('ma_don_dat', sql.Int, b.ma_don_dat)
        .execute('sp_ThemThongBao');

      if (io) {
        io.emit('new_notification', {
          userId: b.ma_nguoi_dung,
          bookingId: b.ma_don_dat,
          title: tieuDe,
          createdAt: new Date().toISOString()
        });
      }
    }

    // Đánh dấu đã gửi
    await pool.request()
      .input('ma_don_dat', sql.Int, b.ma_don_dat)
      .execute('sp_DanhDauDaGuiNhacNhoDonDatSan');

    return true;
  } catch (err: any) {
    console.error(`❌ [sendImmediateReminderForBooking] Lỗi cho đơn #${bookingId}:`, err.message);
    return false;
  }
};

/**
 * Khởi động Background Cron định kỳ (mỗi 60 giây) quét và gửi nhắc nhở
 */
export const startBookingReminderCron = (io?: any) => {
  console.log('⏰ [Reminder Cron]: Đã kích hoạt hệ thống tự động gửi Email thông báo nhắc lịch đá bóng trước 1 tiếng (Quét mỗi 60s).');

  // Chạy ngay 1 lần sau khi máy chủ khởi động 5 giây
  setTimeout(() => {
    scanAndSendBookingReminders(io).catch((e) => {
      console.warn('⚠️ Lỗi lần quét đầu tiên:', e.message);
    });
  }, 5000);

  // Lặp lại định kỳ mỗi 60 giây
  setInterval(() => {
    scanAndSendBookingReminders(io).catch((e) => {
      console.warn('⚠️ Lỗi vòng lặp quét nhắc nhở:', e.message);
    });
  }, 60 * 1000);
};
