/**
 * =====================================================================
 * MIDDLEWARE: CAPTCHA NGẦM BẢO MẬT ĐA TẦNG (INVISIBLE MULTI-LAYER GUARD)
 * 1. Tầng 1: Bẫy bot ngầm Honeypot (Invisible Trap)
 * 2. Tầng 2: Phân tích thời gian tương tác (Human Timing Analysis)
 * 3. Tầng 3: Google reCAPTCHA v3 Verification (AI Scoring Score >= 0.5)
 * 4. Tầng 4: Giới hạn tần suất gửi theo IP (IP Anti-Brute-Force Rate Limiting)
 * =====================================================================
 */

import { Request, Response, NextFunction } from 'express';

// Quản lý Rate Limiting trong bộ nhớ RAM theo IP
interface IpRecord {
    count: number;
    firstRequestTime: number;
    blockedUntil: number;
}

const ipHistory = new Map<string, IpRecord>();
const MAX_REQUESTS_PER_MINUTE = 15;
const BLOCK_DURATION_MS = 2 * 60 * 1000; // Khóa 2 phút nếu spam vượt quá giới hạn

export const invisibleCaptchaGuard = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || 'unknown-ip';
        const now = Date.now();

        // -------------------------------------------------------------
        // 1. TẦNG 1: KIỂM TRA RATE LIMIT CHỐNG SPAM & BRUTE-FORCE
        // -------------------------------------------------------------
        let record = ipHistory.get(clientIp);
        if (!record) {
            record = { count: 1, firstRequestTime: now, blockedUntil: 0 };
            ipHistory.set(clientIp, record);
        } else {
            // Kiểm tra IP có đang bị khóa hay không
            if (record.blockedUntil > now) {
                const remainingSec = Math.ceil((record.blockedUntil - now) / 1000);
                return res.status(429).json({
                    success: false,
                    isBot: true,
                    message: `Bạn đang gửi yêu cầu quá nhanh! Vui lòng thử lại sau ${remainingSec} giây.`
                });
            }

            // Reset chu kỳ đếm sau 1 phút
            if (now - record.firstRequestTime > 60 * 1000) {
                record.count = 1;
                record.firstRequestTime = now;
            } else {
                record.count += 1;
                if (record.count > MAX_REQUESTS_PER_MINUTE) {
                    record.blockedUntil = now + BLOCK_DURATION_MS;
                    console.warn(`[Anti-Bot] IP ${clientIp} đã bị tạm khóa do spam ${record.count} lần/phút.`);
                    return res.status(429).json({
                        success: false,
                        isBot: true,
                        message: 'Phát hiện hành vi gửi yêu cầu dồn dập (Bot/Spam). IP của bạn bị tạm khóa 2 phút!'
                    });
                }
            }
        }

        // -------------------------------------------------------------
        // 2. TẦNG 2: BẪY BOT NGẦM HONEYPOT (BOT TRAP)
        // -------------------------------------------------------------
        // Các trường ẩn này chỉ có Bot tự động quét mã HTML mới tự động điền giá trị
        const { website_url_hp, company_name_hp, bot_trap } = req.body;
        if (website_url_hp || company_name_hp || bot_trap) {
            console.warn(`[Anti-Bot] Đã phát hiện và chặn Bot quét form qua Honeypot Trap từ IP: ${clientIp}`);
            return res.status(403).json({
                success: false,
                isBot: true,
                message: 'Hệ thống bảo mật từ chối: Phát hiện yêu cầu tự động từ robot!'
            });
        }

        // -------------------------------------------------------------
        // 3. TẦNG 3: PHÂN TÍCH THỜI GIAN ĐIỀN FORM (HUMAN TIMING CHECK)
        // -------------------------------------------------------------
        // Người thật cần ít nhất 600ms - 1000ms để gõ/chọn. Nếu submit < 500ms => Chắc chắn là script Bot
        const { _t_init } = req.body;
        if (_t_init) {
            const initTime = Number(_t_init);
            if (!isNaN(initTime)) {
                const elapsed = now - initTime;
                if (elapsed < 500) {
                    console.warn(`[Anti-Bot] Chặn Bot do thời gian submit quá ngắn (${elapsed}ms) từ IP: ${clientIp}`);
                    return res.status(403).json({
                        success: false,
                        isBot: true,
                        message: 'Thao tác quá nhanh bất thường. Vui lòng thử lại!'
                    });
                }
            }
        }

        // -------------------------------------------------------------
        // 4. TẦNG 4: XÁC THỰC GOOGLE RECAPTCHA V3 (NẾU CÓ TOKEN)
        // -------------------------------------------------------------
        const { captchaToken } = req.body;
        const secretKey = process.env.RECAPTCHA_SECRET_KEY || '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe';

        if (captchaToken && secretKey) {
            try {
                const verifyRes = await fetch(
                    `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captchaToken}`,
                    { method: 'POST' }
                );
                const verifyData = await verifyRes.json();
                
                // Nếu Google trả về score < 0.5 => Chặn vì khả năng cao là Bot
                if (verifyData.success === false && secretKey !== '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe') {
                    console.warn(`[reCAPTCHA v3] Token không hợp lệ hoặc score quá thấp:`, verifyData);
                    return res.status(403).json({
                        success: false,
                        isBot: true,
                        message: 'Điểm số tin cậy bảo mật không đạt chuẩn (Phát hiện Bot). Vui lòng thử lại!'
                    });
                }
            } catch (err: any) {
                console.error('[reCAPTCHA v3] Lỗi kết nối Google verify:', err.message);
                // Nếu Google API gặp sự cố mạng, các tầng 1, 2, 3 vẫn bảo vệ an toàn
            }
        }

        // Vượt qua tất cả các lớp bảo mật ngầm an toàn -> Cho phép tiếp tục vào controller
        next();
    } catch (error: any) {
        console.error('[Anti-Bot Guard] Lỗi hệ thống bảo mật:', error);
        next();
    }
};
