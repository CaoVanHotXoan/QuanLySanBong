/**
 * =====================================================================
 * BỘ 5 UNIT TESTS CHO CÁC LOGIC QUAN TRỌNG CỦA HỆ THỐNG
 * Tuân thủ tiêu chí chấm điểm đồ án (Bảo mật & Testing - 20% số điểm)
 * Framework: Vitest / Jest Compatible
 * =====================================================================
 */

import { describe, it, expect, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { hashPassword, comparePassword, generateJwtToken } from '../src/services/authService';
import { verifyToken, authorizeRoles } from '../src/middlewares/authMiddleware';
import {
    timeToMinutes,
    calculateTienSan,
    isTimeSlotOverlapping,
    validateBookingInput
} from '../src/services/businessLogic';
import { AuthRequest } from '../src/types';

describe('⚡ BỘ UNIT TEST ĐỒ ÁN - QUẢN LÝ SÂN BÓNG ĐÁ', () => {

    // =====================================================================
    // TEST 1: BẢO MẬT MẬT KHẨU (BCRYPT HASHING)
    // =====================================================================
    describe('1. Bảo mật: Mã hóa & So khớp mật khẩu (Bcrypt)', () => {
        it('1.1. Mật khẩu phải được băm thành chuỗi ký tự khác với mật khẩu gốc', async () => {
            const rawPassword = 'MatKhauBaoMat@2026';
            const hashed = await hashPassword(rawPassword);

            expect(hashed).toBeDefined();
            expect(hashed).not.toBe(rawPassword);
            expect(hashed.length).toBeGreaterThan(20);
            expect(hashed.startsWith('$2')).toBe(true); // Định dạng chuẩn của Bcrypt ($2a$ hoặc $2b$)
        });

        it('1.2. So khớp đúng mật khẩu ban đầu phải trả về true', async () => {
            const rawPassword = 'MatKhauChuanXac_123';
            const hashed = await hashPassword(rawPassword);
            const isMatch = await comparePassword(rawPassword, hashed);

            expect(isMatch).toBe(true);
        });

        it('1.3. Nhập sai mật khẩu phải trả về false và không cấp quyền', async () => {
            const rawPassword = 'MatKhauDung';
            const wrongPassword = 'MatKhauSaiRoi';
            const hashed = await hashPassword(rawPassword);
            const isMatch = await comparePassword(wrongPassword, hashed);

            expect(isMatch).toBe(false);
        });
    });

    // =====================================================================
    // TEST 2: XÁC THỰC JSON WEB TOKEN (JWT)
    // =====================================================================
    describe('2. Xác thực: Sinh và xác minh JSON Web Token (JWT)', () => {
        const mockUser = {
            id: 99,
            email: 'test_admin@soccer247.vn',
            vai_tro: 'ADMIN',
            ho_ten: 'Nguyễn Văn Test'
        };

        it('2.1. Token sinh ra phải gồm đúng 3 phần: Header.Payload.Signature', () => {
            const token = generateJwtToken(mockUser);

            expect(typeof token).toBe('string');
            const parts = token.split('.');
            expect(parts.length).toBe(3); // Chuẩn cấu trúc JWT: xxxxx.yyyyy.zzzzz
        });

        it('2.2. Giải mã Token phải đọc được chính xác dữ liệu Payload (id, email, vai_tro)', () => {
            const token = generateJwtToken(mockUser);
            const secret = process.env.JWT_SECRET || 'quanlysanbong_super_secret_key_2026';
            const decoded = jwt.verify(token, secret) as any;

            expect(decoded.id).toBe(mockUser.id);
            expect(decoded.email).toBe(mockUser.email);
            expect(decoded.vai_tro).toBe(mockUser.vai_tro);
            expect(decoded.ho_ten).toBe(mockUser.ho_ten);
            expect(decoded.exp).toBeDefined(); // Phải có thời hạn hết hạn
        });

        it('2.3. Token bị ký bằng Secret giả mạo phải bị từ chối xác thực', () => {
            const fakeSecret = 'khoa_bi_mat_gia_mao_12345';
            const fakeToken = jwt.sign(mockUser, fakeSecret);

            const realSecret = process.env.JWT_SECRET || 'quanlysanbong_super_secret_key_2026';
            expect(() => {
                jwt.verify(fakeToken, realSecret);
            }).toThrow();
        });
    });

    // =====================================================================
    // TEST 3: PHÂN QUYỀN TRUY CẬP (AUTHORIZATION MIDDLEWARE)
    // =====================================================================
    describe('3. Phân quyền: Middleware chặn truy cập trái phép', () => {
        it('3.1. Chặn request không có Token trong Header (Trả về HTTP 401)', () => {
            const req = { headers: {} } as unknown as AuthRequest;
            const res = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn()
            } as any;
            const next = vi.fn();

            verifyToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
            expect(next).not.toHaveBeenCalled();
        });

        it('3.2. Chặn người dùng có vai trò KHACH_HANG truy cập endpoint yêu cầu quyền ADMIN (Trả về HTTP 403)', () => {
            const req = {
                user: { id: 1, email: 'khach@gmail.com', vai_tro: 'KHACH_HANG' }
            } as unknown as AuthRequest;
            const res = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn()
            } as any;
            const next = vi.fn();

            const checkAdminMiddleware = authorizeRoles('ADMIN');
            checkAdminMiddleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
            expect(next).not.toHaveBeenCalled();
        });

        it('3.3. Cho phép người dùng có quyền hợp lệ (ADMIN) đi tiếp qua middleware (gọi next())', () => {
            const req = {
                user: { id: 1, email: 'admin@gmail.com', vai_tro: 'ADMIN' }
            } as unknown as AuthRequest;
            const res = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn()
            } as any;
            const next = vi.fn();

            const checkAdminMiddleware = authorizeRoles('ADMIN');
            checkAdminMiddleware(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });
    });

    // =====================================================================
    // TEST 4: TÍNH TOÁN TIỀN SÂN & PHỤ PHÍ GIỜ VÀNG
    // =====================================================================
    describe('4. Nghiệp vụ: Tính toán tiền sân, hệ số giờ vàng & tiền đặt cọc', () => {
        it('4.1. Tính chính xác thời lượng đá theo phút từ giờ bắt đầu và giờ kết thúc', () => {
            // Đá từ 17:30 đến 19:00 = 90 phút
            const duration = timeToMinutes('19:00') - timeToMinutes('17:30');
            expect(duration).toBe(90);
        });

        it('4.2. Tính đúng tổng tiền sân và tiền đặt cọc 30% ở khung giờ bình thường (hệ số 1.0)', () => {
            const donGiaPhut = 5000; // 5.000đ / phút -> 300.000đ / 60 phút
            const result = calculateTienSan(donGiaPhut, '08:00', '09:00', 1.0);

            expect(result.soPhut).toBe(60);
            expect(result.tongTien).toBe(300000);
            expect(result.tienCoc).toBe(90000); // 30% của 300.000đ = 90.000đ
        });

        it('4.3. Áp dụng hệ số giờ vàng 1.25 tính chuẩn xác phụ phí giờ cao điểm', () => {
            const donGiaPhut = 5000;
            // 90 phút x 5.000đ = 450.000đ gốc -> Nhân hệ số 1.25 = 562.500đ
            const result = calculateTienSan(donGiaPhut, '17:30', '19:00', 1.25);

            expect(result.soPhut).toBe(90);
            expect(result.tongTien).toBe(562500);
            expect(result.tienCoc).toBe(Math.round(562500 * 0.3)); // 168.750đ
        });

        it('4.4. Ném ra ngoại lệ nếu giờ kết thúc nhỏ hơn hoặc bằng giờ bắt đầu', () => {
            expect(() => {
                calculateTienSan(5000, '19:00', '17:00');
            }).toThrow('Giờ kết thúc phải lớn hơn giờ bắt đầu!');
        });
    });

    // =====================================================================
    // TEST 5: CHỐNG RACE CONDITION & PHÁT HIỆN TRÙNG LỊCH SÂN
    // =====================================================================
    describe('5. Thuật toán: Phát hiện xung đột khung giờ đặt sân (Overlap Detection)', () => {
        it('5.1. Phát hiện trùng lịch khi đơn mới có khung giờ giao thoa với đơn đã đặt', () => {
            // Đơn cũ: 17:00 - 18:30
            const daDat = { start: '17:00', end: '18:30' };

            // Khách mới muốn đặt: 18:00 - 19:30 (Trùng đoạn 18:00 - 18:30)
            const donMoi = { start: '18:00', end: '19:30' };

            const isOverlap = isTimeSlotOverlapping(daDat, donMoi);
            expect(isOverlap).toBe(true); // Bắt buộc phải phát hiện trùng lịch để từ chối
        });

        it('5.2. Phát hiện trùng lịch khi đơn mới nằm hoàn toàn bên trong khung giờ đơn cũ', () => {
            const daDat = { start: '16:00', end: '20:00' };
            const donMoi = { start: '17:00', end: '18:00' };

            expect(isTimeSlotOverlapping(daDat, donMoi)).toBe(true);
        });

        it('5.3. Chấp nhận hợp lệ khi 2 khung giờ liền kề nhau không đè lên nhau (tiếp giáp nhau)', () => {
            // Trận 1: 16:00 - 17:30, Trận 2: 17:30 - 19:00
            const tran1 = { start: '16:00', end: '17:30' };
            const tran2 = { start: '17:30', end: '19:00' };

            expect(isTimeSlotOverlapping(tran1, tran2)).toBe(false); // Hợp lệ, không trùng
        });

        it('5.4. Kiểm tra hợp lệ dữ liệu đầu vào khi đặt sân (Validation)', () => {
            // Thiếu mã sân
            const invalid1 = validateBookingInput({ ngay_da: '2026-10-25', gio_bat_dau: '17:00', gio_ket_thuc: '18:00' });
            expect(invalid1.isValid).toBe(false);

            // Đặt dưới 30 phút
            const invalid2 = validateBookingInput({ ma_san: 1, ngay_da: '2026-10-25', gio_bat_dau: '17:00', gio_ket_thuc: '17:15' });
            expect(invalid2.isValid).toBe(false);
            expect(invalid2.message).toContain('30 phút');

            // Dữ liệu chuẩn xác
            const valid = validateBookingInput({ ma_san: 1, ngay_da: '2026-10-25', gio_bat_dau: '17:00', gio_ket_thuc: '18:30' });
            expect(valid.isValid).toBe(true);
        });
    });
});
