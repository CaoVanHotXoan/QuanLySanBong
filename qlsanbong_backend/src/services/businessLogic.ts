/**
 * =====================================================================
 * LOGIC NGHIỆP VỤ CỐT LÕI (BUSINESS LOGIC HELPERS)
 * Phục vụ tính toán giá sân, kiểm tra khung giờ và chống Race condition / Trùng lịch
 * =====================================================================
 */

/**
 * Chuyển đổi chuỗi giờ "HH:mm" hoặc "HH:mm:ss" sang số phút tính từ đầu ngày (00:00)
 */
export const timeToMinutes = (timeStr: string): number => {
    if (!timeStr) return 0;
    const parts = timeStr.trim().split(':');
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    return hours * 60 + minutes;
};

/**
 * Kiểm tra 2 khung giờ trên cùng 1 sân bóng có bị trùng lặp / đè lên nhau không
 * Thuật toán Overlap: Slot A và Slot B trùng nhau khi (StartA < EndB) VÀ (StartB < EndA)
 */
export const isTimeSlotOverlapping = (
    slotA: { start: string; end: string },
    slotB: { start: string; end: string }
): boolean => {
    const startA = timeToMinutes(slotA.start);
    const endA = timeToMinutes(slotA.end);
    const startB = timeToMinutes(slotB.start);
    const endB = timeToMinutes(slotB.end);

    if (startA >= endA || startB >= endB) {
        throw new Error('Giờ bắt đầu phải nhỏ hơn giờ kết thúc!');
    }

    return startA < endB && startB < endA;
};

/**
 * Tính tổng tiền sân theo số phút đá, đơn giá theo phút, hệ số khung giờ vàng và tiền cọc (30%)
 */
export const calculateTienSan = (
    donGiaPhut: number,
    gioBatDau: string,
    gioKetThuc: string,
    heSoGioVang: number = 1.0
): { soPhut: number; tongTien: number; tienCoc: number } => {
    const startMin = timeToMinutes(gioBatDau);
    const endMin = timeToMinutes(gioKetThuc);

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

/**
 * Kiểm tra tính hợp lệ của dữ liệu đầu vào khi đặt sân
 */
export const validateBookingInput = (data: {
    ma_san?: number;
    ngay_da?: string;
    gio_bat_dau?: string;
    gio_ket_thuc?: string;
}): { isValid: boolean; message?: string } => {
    if (!data.ma_san || data.ma_san <= 0) {
        return { isValid: false, message: 'Mã sân không hợp lệ!' };
    }
    if (!data.ngay_da || !/^\d{4}-\d{2}-\d{2}$/.test(data.ngay_da)) {
        return { isValid: false, message: 'Ngày đá không đúng định dạng YYYY-MM-DD!' };
    }
    if (!data.gio_bat_dau || !data.gio_ket_thuc) {
        return { isValid: false, message: 'Vui lòng cung cấp giờ bắt đầu và kết thúc!' };
    }
    const start = timeToMinutes(data.gio_bat_dau);
    const end = timeToMinutes(data.gio_ket_thuc);
    if (start >= end) {
        return { isValid: false, message: 'Giờ bắt đầu phải trước giờ kết thúc!' };
    }
    if (end - start < 30) {
        return { isValid: false, message: 'Thời gian đặt sân tối thiểu là 30 phút!' };
    }
    return { isValid: true };
};
