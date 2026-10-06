/**
 * =====================================================================
 * FRONTEND SERVICE: THANH TOÁN & GIAO DỊCH (THANH TOAN SERVICE)
 * =====================================================================
 */

import api from './apiClient';

export interface ThanhToanData {
    ma_don_dat: number;
    phuong_thuc: 'TIEN_MAT' | 'CHUYEN_KHOAN';
    loai_thanh_toan: 'DAT_COC' | 'TRA_HET';
    so_tien: number;
    ma_giao_dich?: string;
}

export const thanhToanService = {
    // 1. Thực hiện thanh toán đơn đặt sân (Tiền mặt / Chuyển khoản)
    thanhToan: (data: ThanhToanData) => {
        return api.post<{ success: boolean; message: string; data: any }>('/thanh-toan', data);
    },

    // 2. Tạo link thanh toán PayOS VietQR
    taoLinkPayOS: (data: {
        ma_san: number;
        ngay_da: string;
        gio_bat_dau: string;
        gio_ket_thuc: string;
        so_tien_coc: number;
        tong_tien: number;
        ho_ten: string;
        so_dien_thoai: string;
        ghi_chu?: string;
        ma_nguoi_dung?: number;
        dich_vu_list?: any[];
        tien_thanh_toan_ngay?: number;
        loai_thanh_toan?: 'DAT_COC' | 'TRA_HET';
    }) => {
        return api.post<{
            success: boolean;
            checkoutUrl: string;
            orderCode: number;
            qrCode?: string;
            paymentLinkId?: string;
        }>('/thanh-toan/payos/tao-link', data);
    },

    // 3. Kiểm tra trạng thái thanh toán PayOS
    kiemTraTrangThaiPayOS: (orderCode: number | string) => {
        return api.get<{
            success: boolean;
            data: {
                status: string;
                amount: number;
                orderCode: number;
                [key: string]: any;
            };
        }>(`/thanh-toan/payos/trang-thai/${orderCode}`);
    },

    // 4. Hủy đơn tạm PayOS khi khách không thanh toán / thoát ra
    huyDonTamPayOS: (data: { orderCode?: number | string; bookingId?: number | string }) => {
        return api.post<{ success: boolean; message: string }>('/thanh-toan/payos/huy-don-tam', data);
    },

    // 5. Lấy danh sách giao dịch thanh toán
    getDanhSachThanhToan: () => {
        return api.get<{ success: boolean; data: any[] }>('/thanh-toan');
    },

    // 6. Lấy danh sách hoàn tiền
    getDanhSachHoanTien: () => {
        return api.get<{ success: boolean; data: any[] }>('/thanh-toan/hoan-tien');
    },
};

export default thanhToanService;
