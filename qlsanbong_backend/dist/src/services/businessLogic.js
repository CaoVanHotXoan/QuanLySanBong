"use strict";
/**
 * =====================================================================
 * LOGIC NGHIỆP VỤ CỐT LÕI (BUSINESS LOGIC HELPERS)
 * Phục vụ tính toán giá sân, kiểm tra khung giờ và chống Race condition / Trùng lịch
 * =====================================================================
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBookingInput = exports.calculateTienSan = exports.isTimeSlotOverlapping = exports.timeToMinutes = void 0;
/**
 * Chuyển đổi chuỗi giờ "HH:mm" hoặc "HH:mm:ss" sang số phút tính từ đầu ngày (00:00)
 */
const timeToMinutes = (timeStr) => {
    if (!timeStr)
        return 0;
    const parts = timeStr.trim().split(':');
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    return hours * 60 + minutes;
};
exports.timeToMinutes = timeToMinutes;
/**
 * Kiểm tra 2 khung giờ trên cùng 1 sân bóng có bị trùng lặp / đè lên nhau không
 * Thuật toán Overlap: Slot A và Slot B trùng nhau khi (StartA < EndB) VÀ (StartB < EndA)
 */
const isTimeSlotOverlapping = (slotA, slotB) => {
    const startA = (0, exports.timeToMinutes)(slotA.start);
    const endA = (0, exports.timeToMinutes)(slotA.end);
    const startB = (0, exports.timeToMinutes)(slotB.start);
    const endB = (0, exports.timeToMinutes)(slotB.end);
    if (startA >= endA || startB >= endB) {
        throw new Error('Giờ bắt đầu phải nhỏ hơn giờ kết thúc!');
    }
    return startA < endB && startB < endA;
};
exports.isTimeSlotOverlapping = isTimeSlotOverlapping;
/**
 * Tính tổng tiền sân theo số phút đá, đơn giá theo phút, hệ số khung giờ vàng và tiền cọc (30%)
 */
const calculateTienSan = (donGiaPhut, gioBatDau, gioKetThuc, heSoGioVang = 1.0) => {
    const startMin = (0, exports.timeToMinutes)(gioBatDau);
    const endMin = (0, exports.timeToMinutes)(gioKetThuc);
    if (endMin <= startMin) {
        throw new Error('Giờ kết thúc phải lớn hơn giờ bắt đầu!');
    }
    const soPhut = endMin - startMin;
    const giaGoc = soPhut * donGiaPhut;
    const tongTien = Math.round(giaGoc * heSoGioVang);
    const tienCoc = Math.round(tongTien * 0.3); // Quy định cọc 30%
    return {
        soPhut,
        tongTien,
        tienCoc
    };
};
exports.calculateTienSan = calculateTienSan;
/**
 * Kiểm tra tính hợp lệ của dữ liệu đầu vào khi đặt sân
 */
const validateBookingInput = (data) => {
    if (!data.ma_san || data.ma_san <= 0) {
        return { isValid: false, message: 'Mã sân không hợp lệ!' };
    }
    if (!data.ngay_da || !/^\d{4}-\d{2}-\d{2}$/.test(data.ngay_da)) {
        return { isValid: false, message: 'Ngày đá không đúng định dạng YYYY-MM-DD!' };
    }
    if (!data.gio_bat_dau || !data.gio_ket_thuc) {
        return { isValid: false, message: 'Vui lòng cung cấp giờ bắt đầu và kết thúc!' };
    }
    const start = (0, exports.timeToMinutes)(data.gio_bat_dau);
    const end = (0, exports.timeToMinutes)(data.gio_ket_thuc);
    if (start >= end) {
        return { isValid: false, message: 'Giờ bắt đầu phải trước giờ kết thúc!' };
    }
    if (end - start < 30) {
        return { isValid: false, message: 'Thời gian đặt sân tối thiểu là 30 phút!' };
    }
    return { isValid: true };
};
exports.validateBookingInput = validateBookingInput;
