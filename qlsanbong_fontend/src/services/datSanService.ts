/**
 * =====================================================================
 * FRONTEND SERVICE: QUẢN LÝ ĐẶT SÂN (DAT SAN SERVICE)
 * =====================================================================
 */

import api from './apiClient';

export interface SanBong {
    id: number;
    ten_san: string;
    ma_loai_san: number;
    ten_loai_san?: string;
    trang_thai: string;
    gia_mac_dinh?: number;
}

export interface LoaiSan {
    id: number;
    ten_loai_san: string;
    so_nguoi: number;
    mo_ta?: string;
}

export interface KhungGio {
    id: number;
    gio_bat_dau: string;
    gio_ket_thuc: string;
}

export interface DonDatSan {
    id: number;
    ma_san: number;
    ma_nguoi_dung: number;
    ngay_da: string;
    gio_bat_dau: string;
    gio_ket_thuc: string;
    tong_tien: number;
    tien_coc: number;
    da_thanh_toan: number;
    trang_thai: string;
    trang_thai_thanh_toan?: string;
    ten_san?: string;
    ten_khach_hang?: string;
    so_dien_thoai?: string;
    ghi_chu?: string;
}

export const datSanService = {
    // 1. Lấy danh mục loại sân
    getLoaiSan: () => {
        return api.get<{ success: boolean; data: LoaiSan[] }>('/dat-san/loai-san');
    },

    // 2. Lấy danh sách tất cả sân bóng
    getDanhSachSan: () => {
        return api.get<{ success: boolean; data: SanBong[] }>('/dat-san/danh-sach-san');
    },

    // 3. Lấy danh sách khung giờ
    getKhungGio: () => {
        return api.get<{ success: boolean; data: KhungGio[] }>('/dat-san/khung-gio');
    },

    // 4. Lấy lịch đặt sân theo ngày
    getLichSan: (ngayDa: string) => {
        return api.get<{ success: boolean; data: any[] }>('/dat-san/lich-san', { ngay_da: ngayDa });
    },

    // 5. Lấy toàn bộ đơn đặt sân (Dashboard / Management)
    getTatCaDon: () => {
        return api.get<{ success: boolean; data: DonDatSan[] }>('/dat-san/tat-ca-don');
    },

    // 6. Đặt sân
    datSan: (data: {
        ma_san: number;
        ma_nguoi_dung?: number;
        ngay_da: string;
        gio_bat_dau: string;
        gio_ket_thuc: string;
        ghi_chu?: string;
        ho_ten?: string;
        so_dien_thoai?: string;
    }) => {
        return api.post<{ success: boolean; message: string; data: any }>('/dat-san', data);
    },

    // 7. Vào sân (Check-in)
    vaoSan: (id: number) => {
        return api.post<{ success: boolean; message: string }>(`/dat-san/vao-san/${id}`);
    },

    // 8. Tạo đơn đặt & thanh toán kết hợp (POS Admin)
    taoDonDatVaThanhToan: (data: any) => {
        return api.post<{ success: boolean; message: string; data: any }>('/dat-san/don-dat-thanh-toan', data);
    },

    // 9. Cập nhật đơn đặt & thanh toán
    suaDonDatVaThanhToan: (id: number, data: any) => {
        return api.put<{ success: boolean; message: string; data: any }>(`/dat-san/don-dat-thanh-toan/${id}`, data);
    },

    // 10. Xóa đơn đặt
    xoaDonDatVaThanhToan: (id: number) => {
        return api.delete<{ success: boolean; message: string }>(`/dat-san/don-dat-thanh-toan/${id}`);
    },

    // 11. Kiểm tra gia hạn giờ sân đang đá
    kiemTraGiaHan: (data: { ma_san: number; gio_ket_thuc_hien_tai: string; so_phut_gia_han: number }) => {
        return api.post<{ success: boolean; kha_dung: boolean; message: string; gia_du_kien?: number }>('/dat-san/kiem-tra-gia-han', data);
    },

    // 12. Xác nhận gia hạn giờ
    xacNhanGiaHan: (data: { ma_don_dat: number; so_phut_gia_han: number; tien_gia_han: number }) => {
        return api.post<{ success: boolean; message: string; data: any }>('/dat-san/xac-nhan-gia-han', data);
    },

    // 13. Chuyển sân đá tiếp
    chuyenSanDaTiep: (data: { ma_don_dat_cu: number; ma_san_moi: number; so_phut_da_tiep: number; tien_san_moi: number }) => {
        return api.post<{ success: boolean; message: string; data: any }>('/dat-san/chuyen-san-da-tiep', data);
    },

    // 14. Bán lẻ dịch vụ trực tiếp (POS nhanh)
    banLeDichVu: (data: { ma_don_dat: number; danh_sach_dich_vu: Array<{ ma_dich_vu: number; so_luong: number; don_gia: number }> }) => {
        return api.post<{ success: boolean; message: string; data: any }>('/dat-san/ban-le-dich-vu', data);
    },

    // 15. Kết thúc trận đấu (Trả sân / Check-out)
    ketThucTranDau: (ma_don_dat: number) => {
        return api.post<{ success: boolean; message: string }>('/dat-san/ket-thuc-tran-dau', { ma_don_dat });
    },

    // 16. Hủy đơn đặt sân
    huyDon: (ma_don_dat: number, ly_do_huy?: string) => {
        return api.post<{ success: boolean; message: string }>('/dat-san/huy-don', { ma_don_dat, ly_do_huy });
    },

    // 17. Lịch sử đặt sân khách hàng
    getLichSuKhachHang: (params: { ma_nguoi_dung?: number; so_dien_thoai?: string }) => {
        return api.get<{ success: boolean; data: any[] }>('/dat-san/lich-su-khach-hang', params);
    },
};

export default datSanService;
