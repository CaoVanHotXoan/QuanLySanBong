/**
 * =====================================================================
 * FRONTEND SERVICE: QUẢN LÝ DỊCH VỤ & KHO HÀNG (DICH VU SERVICE)
 * =====================================================================
 */

import api from './apiClient';

export interface DichVu {
    id: number;
    ten_dich_vu: string;
    don_gia: number;
    don_vi_tinh: string;
    ton_kho: number;
    hinh_anh?: string;
}

export interface PhieuNhapKho {
    id: number;
    ma_dich_vu: number;
    ten_dich_vu?: string;
    so_luong_nhap: number;
    gia_nhap: number;
    ngay_nhap: string;
}

export interface ChiTietDichVuBan {
    id: number;
    ma_don_dat: number;
    ma_dich_vu: number;
    ten_dich_vu: string;
    so_luong: number;
    don_gia: number;
    thanh_tien: number;
}

export const dichVuService = {
    // 1. Lấy danh sách dịch vụ
    getDanhSach: () => {
        return api.get<{ success: boolean; data: DichVu[] }>('/dich-vu');
    },

    // 2. Thêm mới dịch vụ
    them: (data: { ten_dich_vu: string; don_gia: number; don_vi_tinh: string; ton_kho?: number }) => {
        return api.post<{ success: boolean; message: string; data: DichVu }>('/dich-vu', data);
    },

    // 3. Cập nhật thông tin dịch vụ
    sua: (id: number, data: { ten_dich_vu: string; don_gia: number; don_vi_tinh: string; ton_kho?: number }) => {
        return api.put<{ success: boolean; message: string; data: DichVu }>(`/dich-vu/${id}`, data);
    },

    // 4. Xóa dịch vụ
    xoa: (id: number) => {
        return api.delete<{ success: boolean; message: string }>(`/dich-vu/${id}`);
    },

    // 5. Thêm dịch vụ vào đơn đặt sân
    themVaoDon: (data: { ma_don_dat: number; dich_vu_list?: Array<{ ma_dich_vu: number; so_luong: number }>; ma_dich_vu?: number; so_luong?: number }) => {
        return api.post<{ success: boolean; message: string; data: any }>('/dich-vu/them-vao-don', data);
    },

    // 6. Cập nhật số lượng hoặc xóa dịch vụ trong đơn
    capNhatDon: (data: { ma_don_dat: number; ma_dich_vu: number; so_luong: number }) => {
        return api.post<{ success: boolean; message: string; data: any }>('/dich-vu/cap-nhat-don', data);
    },

    // 7. Nhập kho dịch vụ
    nhapKho: (data: { ma_dich_vu: number; so_luong_nhap: number; gia_nhap: number }) => {
        return api.post<{ success: boolean; message: string; data: any }>('/dich-vu/nhap-kho', data);
    },

    // 8. Lấy danh sách phiếu nhập kho
    getPhieuNhapKho: () => {
        return api.get<{ success: boolean; data: PhieuNhapKho[] }>('/dich-vu/phieu-nhap');
    },

    // 9. Sửa phiếu nhập kho
    suaPhieuNhap: (id: number, data: { so_luong_nhap: number; gia_nhap: number }) => {
        return api.put<{ success: boolean; message: string; data: any }>(`/dich-vu/phieu-nhap/${id}`, data);
    },

    // 10. Xóa phiếu nhập kho
    xoaPhieuNhap: (id: number) => {
        return api.delete<{ success: boolean; message: string }>(`/dich-vu/phieu-nhap/${id}`);
    },

    // 11. Lấy toàn bộ danh sách chi tiết bán hàng dịch vụ
    getChiTietBanHang: () => {
        return api.get<{ success: boolean; data: ChiTietDichVuBan[] }>('/dich-vu/chi-tiet-ban-hang');
    },
};

export default dichVuService;
