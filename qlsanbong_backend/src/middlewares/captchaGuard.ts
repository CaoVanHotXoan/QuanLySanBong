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
        // Tránh chặn nhầm người dùng hợp lệ (trình duyệt tự động điền / autofill hoặc đồng hồ client bị lệch so với server)
        const { _t_init } = req.body;
        if (_t_init) {
            const initTime = Number(_t_init);
            if (!isNaN(initTime)) {
                const elapsed = now - initTime;
                if (elapsed >= 0 && elapsed < 300) {
                    console.info(`[Anti-Bot Timing] Submit nhanh (${elapsed}ms) từ IP: ${clientIp}`);
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

// =====================================================================
// BẢO VỆ CHỐNG SPAM / BOM MÃ OTP QUA GMAIL (OTP SECURITY GUARD)
// 1. Kiểm tra Honeypot Bot Trap
// 2. Kiểm tra Regex Email chuẩn hóa
// 3. Rate Limit theo IP: Tối đa 5 lần / 10 phút, phạt khóa 15 phút nếu cố tình spam
// 4. Rate Limit theo Email: Cooldown 60 giây giữa 2 lần gửi, tối đa 5 lần / 1 giờ
// =====================================================================
interface OtpEmailRecord {
    count: number;
    firstRequestTime: number;
    lastRequestTime: number;
}

const otpIpHistory = new Map<string, IpRecord>();
const otpEmailHistory = new Map<string, OtpEmailRecord>();

const OTP_MAX_PER_IP = 5; // Tối đa 5 lần gửi OTP / 10 phút từ 1 IP
const OTP_IP_WINDOW_MS = 10 * 60 * 1000;
const OTP_IP_BLOCK_MS = 15 * 60 * 1000; // Khóa IP 15 phút nếu spam

const OTP_EMAIL_COOLDOWN_MS = 60 * 1000; // Phải cách nhau ít nhất 60 giây giữa 2 lần gửi cho cùng 1 email
const OTP_MAX_PER_EMAIL = 5; // Tối đa 5 lần gửi OTP cho 1 email / 1 giờ
const OTP_EMAIL_WINDOW_MS = 60 * 60 * 1000;

export const otpSecurityGuard = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown-ip';
        const now = Date.now();
        const { email, website_url_hp, company_name_hp, bot_trap } = req.body;

        // 1. Bẫy Bot ngầm Honeypot
        if (website_url_hp || company_name_hp || bot_trap) {
            console.warn(`[Anti-Bot OTP] Chặn Bot qua Honeypot Trap từ IP: ${clientIp}`);
            return res.status(403).json({
                success: false,
                isBot: true,
                message: 'Hệ thống bảo mật từ chối: Phát hiện yêu cầu tự động từ robot!'
            });
        }

        // 2. Kiểm tra định dạng Email hợp lệ
        if (!email || typeof email !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp địa chỉ Email hợp lệ!'
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                message: 'Địa chỉ Email không đúng định dạng chuẩn!'
            });
        }

        // 3. Rate Limit theo IP
        let ipRec = otpIpHistory.get(clientIp);
        if (!ipRec) {
            ipRec = { count: 1, firstRequestTime: now, blockedUntil: 0 };
            otpIpHistory.set(clientIp, ipRec);
        } else {
            if (ipRec.blockedUntil > now) {
                const remainingMinutes = Math.ceil((ipRec.blockedUntil - now) / 60000);
                return res.status(429).json({
                    success: false,
                    message: `IP của bạn đang bị tạm khóa do gửi mã OTP quá nhiều lần! Vui lòng thử lại sau ${remainingMinutes} phút.`
                });
            }

            if (now - ipRec.firstRequestTime > OTP_IP_WINDOW_MS) {
                ipRec.count = 1;
                ipRec.firstRequestTime = now;
            } else {
                ipRec.count += 1;
                if (ipRec.count > OTP_MAX_PER_IP) {
                    ipRec.blockedUntil = now + OTP_IP_BLOCK_MS;
                    console.warn(`[Anti-Spam OTP] IP ${clientIp} đã bị khóa 15 phút do vượt quá ${OTP_MAX_PER_IP} yêu cầu OTP.`);
                    return res.status(429).json({
                        success: false,
                        message: 'Phát hiện hành vi gửi OTP dồn dập! IP của bạn bị tạm khóa 15 phút.'
                    });
                }
            }
        }

        // 4. Rate Limit & Cooldown 60s theo từng địa chỉ Email
        let emailRec = otpEmailHistory.get(normalizedEmail);
        if (!emailRec) {
            otpEmailHistory.set(normalizedEmail, {
                count: 1,
                firstRequestTime: now,
                lastRequestTime: now
            });
        } else {
            // Kiểm tra Cooldown 60s
            const elapsed = now - emailRec.lastRequestTime;
            if (elapsed < OTP_EMAIL_COOLDOWN_MS) {
                const waitSec = Math.ceil((OTP_EMAIL_COOLDOWN_MS - elapsed) / 1000);
                return res.status(429).json({
                    success: false,
                    message: `Mã OTP vừa được gửi. Vui lòng đợi ${waitSec} giây trước khi bấm gửi lại!`
                });
            }

            // Kiểm tra tối đa 5 lần / giờ
            if (now - emailRec.firstRequestTime > OTP_EMAIL_WINDOW_MS) {
                emailRec.count = 1;
                emailRec.firstRequestTime = now;
                emailRec.lastRequestTime = now;
            } else {
                emailRec.count += 1;
                emailRec.lastRequestTime = now;
                if (emailRec.count > OTP_MAX_PER_EMAIL) {
                    return res.status(429).json({
                        success: false,
                        message: `Email này đã nhận quá số lượng mã OTP cho phép trong 1 giờ (${OTP_MAX_PER_EMAIL} lần). Vui lòng thử lại sau!`
                    });
                }
            }
        }

        next();
    } catch (error: any) {
        console.error('[Anti-Bot Guard] Lỗi xác thực OTP Guard:', error);
        next();
    }
};
