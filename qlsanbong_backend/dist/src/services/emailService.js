"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendContactReplyEmail = exports.sendContactEmailToAdmin = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
/**
 * Khởi tạo Transporter gửi mail qua SMTP Gmail
 */
const createTransporter = () => {
    const host = process.env.MAIL_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.MAIL_PORT || '587', 10);
    const user = process.env.MAIL_USER;
    const pass = process.env.MAIL_PASSWORD;
    if (!user || !pass) {
        console.warn('⚠️ Cảnh báo: MAIL_USER hoặc MAIL_PASSWORD chưa được cấu hình trong .env!');
    }
    return nodemailer_1.default.createTransport({
        host,
        port,
        secure: port === 465, // true cho port 465, false cho 587
        auth: {
            user,
            pass,
        },
        tls: {
            rejectUnauthorized: false
        }
    });
};
/**
 * Gửi email thông báo liên hệ mới tới Quản trị viên (Gmail)
 */
const sendContactEmailToAdmin = async (payload) => {
    try {
        const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.MAIL_USER || 'xoancao2.0@gmail.com';
        const mailFrom = process.env.MAIL_FROM || process.env.MAIL_USER || 'Soccer247 <no-reply@soccer247.vn>';
        const transporter = createTransporter();
        const formattedTime = new Date().toLocaleString('vi-VN', {
            timeZone: 'Asia/Ho_Chi_Minh',
            hour12: false,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        const subject = `⚽ [Soccer247] Liên hệ mới từ: ${payload.ho_ten} - ${payload.tieu_de || 'Đặt sân / Góp ý'}`;
        const htmlContent = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
          .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 28px 24px; text-align: center; border-bottom: 4px solid #10b981; }
          .logo { font-size: 26px; font-weight: 900; color: #ffffff; letter-spacing: 1px; }
          .logo span { color: #10b981; }
          .subtitle { color: #94a3b8; font-size: 13px; margin-top: 6px; text-transform: uppercase; letter-spacing: 1.5px; }
          .body { padding: 28px 24px; }
          .badge { display: inline-block; background-color: #d1fae5; color: #065f46; font-size: 12px; font-weight: bold; padding: 4px 12px; border-radius: 20px; margin-bottom: 16px; }
          .info-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .info-table td { padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
          .info-table td.label { font-weight: bold; color: #64748b; width: 35%; }
          .info-table td.value { color: #0f172a; font-weight: 600; }
          .content-box { background: #f8fafc; border-left: 4px solid #10b981; border-radius: 8px; padding: 16px; font-size: 14px; line-height: 1.6; color: #334155; margin-top: 16px; word-break: break-word; }
          .action-btn { display: inline-block; background-color: #10b981; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: bold; font-size: 14px; margin-top: 24px; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">SOCCER<span>247</span></div>
            <div class="subtitle">Hệ Thống Quản Lý Đặt Sân Thể Thao</div>
          </div>
          <div class="body">
            <div class="badge">📩 LIÊN HỆ & YÊU CẦU MỚI</div>
            <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #0f172a;">Có khách hàng vừa gửi thông tin liên hệ:</h2>
            
            <table class="info-table">
              <tr>
                <td class="label">👤 Họ và tên:</td>
                <td class="value">${payload.ho_ten}</td>
              </tr>
              <tr>
                <td class="label">📞 Số điện thoại:</td>
                <td class="value"><a href="tel:${payload.so_dien_thoai}" style="color: #10b981; text-decoration: none;">${payload.so_dien_thoai}</a></td>
              </tr>
              <tr>
                <td class="label">✉️ Email:</td>
                <td class="value">${payload.email ? `<a href="mailto:${payload.email}" style="color: #2563eb; text-decoration: none;">${payload.email}</a>` : '<em>(Không cung cấp)</em>'}</td>
              </tr>
              <tr>
                <td class="label">📌 Chủ đề:</td>
                <td class="value">${payload.tieu_de || 'Đặt sân sự kiện / Giải đấu'}</td>
              </tr>
              <tr>
                <td class="label">⏰ Thời gian gửi:</td>
                <td class="value">${formattedTime}</td>
              </tr>
            </table>

            <div style="font-weight: bold; font-size: 14px; color: #0f172a; margin-top: 16px;">📝 Nội dung chi tiết:</div>
            <div class="content-box">
              ${payload.noi_dung.replace(/\n/g, '<br/>')}
            </div>

            <div style="text-align: center;">
              <a href="tel:${payload.so_dien_thoai}" class="action-btn">📞 Gọi Điện Tư Vấn Ngay</a>
            </div>
          </div>
          <div class="footer">
            Email tự động được gửi từ hệ thống Soccer247 • Biên Hòa - Đồng Nai<br/>
            Vui lòng đăng nhập trang Dashboard Quản trị để theo dõi & cập nhật trạng thái xử lý.
          </div>
        </div>
      </body>
      </html>
    `;
        const info = await transporter.sendMail({
            from: mailFrom,
            to: adminEmail,
            subject,
            html: htmlContent,
        });
        console.log(`✅ Đã gửi email thông báo liên hệ tới Admin (${adminEmail}): messageId = ${info.messageId}`);
        return true;
    }
    catch (error) {
        console.error('❌ Lỗi khi gửi email qua Gmail SMTP:', error.message);
        return false;
    }
};
exports.sendContactEmailToAdmin = sendContactEmailToAdmin;
/**
 * Gửi email phản hồi cho khách hàng. Nếu gửi thất bại (email không tồn tại), tự động gửi bản sao về Gmail của Admin.
 */
const sendContactReplyEmail = async (payload) => {
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.MAIL_USER || 'xoancao2.0@gmail.com';
    const mailFrom = process.env.MAIL_FROM || process.env.MAIL_USER || 'Soccer247 <no-reply@soccer247.vn>';
    const transporter = createTransporter();
    const formattedTime = new Date().toLocaleString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
    const subject = payload.replySubject || `⚽ [Soccer247] Phản hồi yêu cầu: ${payload.originalSubject || 'Liên hệ tư vấn đặt sân'}`;
    // Kiểm tra nếu khách hàng có email hợp lệ
    const customerEmail = payload.toEmail ? payload.toEmail.trim() : '';
    const hasValidEmailFormat = customerEmail && customerEmail.includes('@') && customerEmail.includes('.');
    if (hasValidEmailFormat) {
        try {
            const customerHtml = `
        <!DOCTYPE html>
        <html lang="vi">
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
            .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 28px 24px; text-align: center; border-bottom: 4px solid #10b981; }
            .logo { font-size: 26px; font-weight: 900; color: #ffffff; letter-spacing: 1px; }
            .logo span { color: #10b981; }
            .subtitle { color: #94a3b8; font-size: 13px; margin-top: 6px; text-transform: uppercase; letter-spacing: 1.5px; }
            .body { padding: 28px 24px; }
            .greeting { font-size: 16px; font-weight: bold; color: #0f172a; margin-bottom: 16px; }
            .reply-box { background: #f0fdf4; border-left: 4px solid #10b981; border-radius: 8px; padding: 18px; font-size: 15px; line-height: 1.7; color: #064e3b; margin: 16px 0; word-break: break-word; font-weight: 500; }
            .quote-box { background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 14px; font-size: 13px; color: #64748b; margin-top: 20px; line-height: 1.5; }
            .action-btn { display: inline-block; background-color: #10b981; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: bold; font-size: 14px; margin-top: 20px; }
            .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">SOCCER<span>247</span></div>
              <div class="subtitle">Ban Quản Lý Trung Tâm Thể Thao Soccer247</div>
            </div>
            <div class="body">
              <div class="greeting">Kính gửi quý khách ${payload.customerName},</div>
              <p style="font-size: 14px; color: #334155; line-height: 1.6;">
                Cảm ơn quý khách đã gửi thông tin liên hệ và quan tâm đến dịch vụ sân bóng của Soccer247. Ban quản lý xin gửi phản hồi giải đáp yêu cầu của quý khách như sau:
              </p>

              <div class="reply-box">
                ${payload.replyMessage.replace(/\n/g, '<br/>')}
              </div>

              <p style="font-size: 14px; color: #334155; line-height: 1.6;">
                Nếu quý khách cần hỗ trợ thêm thông tin hoặc muốn giữ sân thi đấu trực tiếp, vui lòng liên hệ trực tiếp với chúng tôi qua Hotline hoặc truy cập website Soccer247.
              </p>

              <div style="text-align: center;">
                <a href="https://soccer247.vn" class="action-btn">⚽ Truy Cập Đặt Sân Online</a>
              </div>

              <div class="quote-box">
                <strong>📌 Trích dẫn nội dung thư của quý khách:</strong><br/>
                <em>"${payload.originalMessage}"</em>
              </div>
            </div>
            <div class="footer">
              <strong>Trung Tâm Thể Thao Soccer247</strong><br/>
              📍 Địa chỉ: Biên Hòa - Đồng Nai • 📞 Hotline: 0816344504 • ✉️ Email: sinhvienxoan@gmail.com<br/>
              Hệ thống quản lý đặt sân thể thao tự động 24/7
            </div>
          </div>
        </body>
        </html>
      `;
            const info = await transporter.sendMail({
                from: mailFrom,
                to: customerEmail,
                subject,
                html: customerHtml,
            });
            console.log(`✅ Đã gửi email phản hồi tới khách hàng (${customerEmail}): messageId = ${info.messageId}`);
            return {
                success: true,
                sentToCustomer: true,
                sentToAdminFallback: false,
                message: `Đã gửi email phản hồi thành công đến hòm thư của khách hàng (${customerEmail})!`
            };
        }
        catch (sendError) {
            console.warn(`⚠️ Gửi tới khách hàng (${customerEmail}) thất bại: ${sendError.message}. Đang gửi bản sao về Gmail của Admin...`);
        }
    }
    // --- TRƯỜNG HỢP GỬI CHO KHÁCH THẤT BẠI HOẶC KHÔNG CÓ EMAIL: GỬI VỀ CHO ADMIN ---
    try {
        const adminFallbackSubject = `⚠️ [Soccer247 - Bản sao phản hồi] Không gửi được đến khách: ${payload.customerName} (${payload.toEmail || 'Không có email'})`;
        const adminFallbackHtml = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #fff1f2; margin: 0; padding: 20px; color: #1e293b; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #fecdd3; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
          .header { background: linear-gradient(135deg, #be123c 0%, #881337 100%); padding: 24px; text-align: center; border-bottom: 4px solid #f43f5e; color: #ffffff; }
          .header h2 { margin: 0; font-size: 20px; }
          .body { padding: 28px 24px; }
          .alert-box { background: #ffe4e6; border-left: 4px solid #f43f5e; border-radius: 8px; padding: 14px; font-size: 13px; color: #9f1239; margin-bottom: 20px; font-weight: 600; }
          .info-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .info-table td { padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
          .info-table td.label { font-weight: bold; color: #64748b; width: 35%; }
          .info-table td.value { color: #0f172a; font-weight: 600; }
          .reply-box { background: #f8fafc; border-left: 4px solid #0284c7; border-radius: 8px; padding: 16px; font-size: 14px; line-height: 1.6; color: #0f172a; margin: 16px 0; word-break: break-word; }
          .action-btn { display: inline-block; background-color: #059669; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: bold; font-size: 14px; margin-top: 16px; }
          .footer { background: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>⚠️ THÔNG BÁO GỬI PHẢN HỒI THẤT BẠI</h2>
            <div style="font-size: 13px; opacity: 0.9; margin-top: 4px;">Hệ Thống Quản Trị Soccer247</div>
          </div>
          <div class="body">
            <div class="alert-box">
              ⚠️ Không thể gửi email đến khách hàng: <strong>${payload.toEmail || '(Khách không cung cấp email)'}</strong> (Địa chỉ email có thể không tồn tại hoặc bị lỗi hòm thư).<br/>
              Hệ thống đã tự động chuyển tiếp nội dung phản hồi về Gmail của bạn để bạn có thể gọi điện thoại trực tiếp cho khách!
            </div>

            <table class="info-table">
              <tr>
                <td class="label">👤 Khách hàng:</td>
                <td class="value">${payload.customerName}</td>
              </tr>
              <tr>
                <td class="label">📞 Số điện thoại:</td>
                <td class="value"><a href="tel:${payload.customerPhone}" style="color: #059669; font-size: 16px;">${payload.customerPhone || '---'}</a></td>
              </tr>
              <tr>
                <td class="label">✉️ Email khách:</td>
                <td class="value">${payload.toEmail || '(Không có)'}</td>
              </tr>
              <tr>
                <td class="label">📌 Tiêu đề yêu cầu:</td>
                <td class="value">${payload.originalSubject || '---'}</td>
              </tr>
              <tr>
                <td class="label">⏰ Thời gian xử lý:</td>
                <td class="value">${formattedTime}</td>
              </tr>
            </table>

            <div style="font-weight: bold; font-size: 14px; color: #0f172a;">💬 Nội dung phản hồi bạn vừa soạn:</div>
            <div class="reply-box">
              ${payload.replyMessage.replace(/\n/g, '<br/>')}
            </div>

            <div style="font-weight: bold; font-size: 13px; color: #64748b; margin-top: 12px;">📝 Nội dung yêu cầu gốc của khách:</div>
            <div style="background: #f1f5f9; padding: 12px; border-radius: 8px; font-size: 13px; color: #475569; margin-top: 6px;">
              ${payload.originalMessage}
            </div>

            ${payload.customerPhone ? `
              <div style="text-align: center; margin-top: 20px;">
                <a href="tel:${payload.customerPhone}" class="action-btn">📞 Gọi Điện Ngay Cho Khách Hàng (${payload.customerPhone})</a>
              </div>
            ` : ''}
          </div>
          <div class="footer">
            Bản sao tự động gửi tới Quản trị viên (${adminEmail}) khi hòm thư khách hàng không thể nhận mail.
          </div>
        </div>
      </body>
      </html>
    `;
        await transporter.sendMail({
            from: mailFrom,
            to: adminEmail,
            subject: adminFallbackSubject,
            html: adminFallbackHtml,
        });
        console.log(`ℹ️ Đã gửi bản sao phản hồi về Gmail của Admin (${adminEmail}) vì không gửi được tới khách.`);
        return {
            success: true,
            sentToCustomer: false,
            sentToAdminFallback: true,
            message: `Địa chỉ email của khách (${payload.toEmail || 'trống'}) không thể nhận thư. Hệ thống đã tự động lưu nội dung và gửi bản sao về Gmail của bạn (${adminEmail}) để bạn tiện gọi điện hỗ trợ khách!`
        };
    }
    catch (adminError) {
        console.error('❌ Lỗi khi gửi fallback email tới Admin:', adminError.message);
        return {
            success: true,
            sentToCustomer: false,
            sentToAdminFallback: false,
            message: 'Đã lưu nội dung phản hồi vào hệ thống CSDL thành công!'
        };
    }
};
exports.sendContactReplyEmail = sendContactReplyEmail;
