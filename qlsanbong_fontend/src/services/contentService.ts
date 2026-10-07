/**
 * =====================================================================
 * SERVICE: NỘI DUNG (TIN TỨC, ABOUT US, LIÊN HỆ, BANNER)
 * =====================================================================
 */

import { api } from './apiClient';

export interface LoaiTinTuc {
  id: number;
  ten_loai: string;
  trang_thai: number;
  so_luong_tin?: number;
}

export interface TinTucItem {
  id: number;
  ma_loai_tin: number;
  ten_loai?: string;
  tieu_de: string;
  tom_tat?: string;
  noi_dung: string;
  hinh_anh?: string;
  luot_xem: number;
  ngay_dang: string;
  trang_thai: number;
}

export interface AboutUsData {
  id?: number;
  ten_trung_tam: string;
  hotline: string;
  email?: string;
  dia_chi: string;
  link_map?: string;
  gioi_thieu_ngan?: string;
  bai_viet_about_us?: string;
  link_facebook?: string;
  link_zalo?: string;
}

export interface LienHePayload {
  id?: number;
  ho_ten: string;
  email?: string;
  so_dien_thoai: string;
  tieu_de?: string;
  noi_dung: string;
  trang_thai_xu_ly?: 'CHUA_XU_LY' | 'DA_XU_LY';
  trang_thai?: 'CHUA_XU_LY' | 'DA_XU_LY' | string;
  ngay_gui?: string;
  noi_dung_tra_loi?: string;
  ngay_tra_loi?: string;
}

export interface BannerItem {
  id: number;
  tieu_de?: string;
  loai_banner: 'IMAGE' | 'VIDEO';
  hinh_anh?: string;
  video_url?: string;
  lien_ket?: string;
  link_dieu_huong?: string;
  thu_tu: number;
  trang_thai: number;
}

export const contentService = {
  // --- LOẠI TIN TỨC ---
  getLoaiTin: async () => {
    return api.get<{ success: boolean; data: LoaiTinTuc[] }>('/tin-tuc/loai-tin');
  },
  getLoaiTinAdmin: async () => {
    return api.get<{ success: boolean; data: LoaiTinTuc[] }>('/tin-tuc/loai-tin/admin');
  },
  createLoaiTin: async (data: { ten_loai: string; trang_thai?: number | boolean }) => {
    return api.post<{ success: boolean; message: string; data?: any }>('/tin-tuc/loai-tin', data);
  },
  updateLoaiTin: async (id: number, data: { ten_loai: string; trang_thai?: number | boolean }) => {
    return api.put<{ success: boolean; message: string }>(`/tin-tuc/loai-tin/${id}`, data);
  },
  deleteLoaiTin: async (id: number) => {
    return api.delete<{ success: boolean; message: string }>(`/tin-tuc/loai-tin/${id}`);
  },

  // --- TIN TỨC ---
  getTinTucList: async (params?: { ma_loai_tin?: number; tu_khoa?: string; limit?: number }) => {
    return api.get<{ success: boolean; data: TinTucItem[] }>('/tin-tuc', params);
  },
  getTinTucAdmin: async () => {
    return api.get<{ success: boolean; data: TinTucItem[] }>('/tin-tuc/admin');
  },
  getTinTucDetail: async (id: number | string) => {
    return api.get<{ success: boolean; data: TinTucItem }>(`/tin-tuc/${id}`);
  },
  createTinTuc: async (data: Partial<TinTucItem>) => {
    return api.post<{ success: boolean; message: string; data?: any }>('/tin-tuc', data);
  },
  updateTinTuc: async (id: number, data: Partial<TinTucItem>) => {
    return api.put<{ success: boolean; message: string }>(`/tin-tuc/${id}`, data);
  },
  deleteTinTuc: async (id: number) => {
    return api.delete<{ success: boolean; message: string }>(`/tin-tuc/${id}`);
  },

  // --- ABOUT US ---
  getAboutUs: async () => {
    return api.get<{ success: boolean; data: AboutUsData }>('/about-us');
  },
  updateAboutUs: async (data: Partial<AboutUsData>) => {
    return api.put<{ success: boolean; message: string }>('/about-us', data);
  },

  // --- LIÊN HỆ ---
  sendLienHe: async (data: LienHePayload) => {
    return api.post<{ success: boolean; message: string }>('/lien-he', data);
  },
  getLienHeList: async (params?: { trang_thai_xu_ly?: string }) => {
    return api.get<{ success: boolean; data: LienHePayload[] }>('/lien-he', params);
  },
  updateLienHeStatus: async (id: number, trang_thai_xu_ly: 'CHUA_XU_LY' | 'DA_XU_LY') => {
    return api.put<{ success: boolean; message: string }>(`/lien-he/${id}/trang-thai`, { trang_thai_xu_ly });
  },
  replyLienHe: async (id: number, data: { tieu_de_tra_loi?: string; noi_dung_tra_loi: string }) => {
    return api.post<{ success: boolean; message: string; data?: { sentToCustomer: boolean; sentToAdminFallback: boolean } }>(`/lien-he/${id}/tra-loi`, data);
  },
  deleteLienHe: async (id: number) => {
    return api.delete<{ success: boolean; message: string }>(`/lien-he/${id}`);
  },

  // --- BANNER ---
  getBanners: async () => {
    return api.get<{ success: boolean; data: BannerItem[] }>('/banner');
  },
  getBannersAdmin: async () => {
    return api.get<{ success: boolean; data: BannerItem[] }>('/banner/admin');
  },
  createBanner: async (data: Partial<BannerItem>) => {
    return api.post<{ success: boolean; message: string; data?: any }>('/banner', data);
  },
  updateBanner: async (id: number, data: Partial<BannerItem>) => {
    return api.put<{ success: boolean; message: string }>(`/banner/${id}`, data);
  },
  deleteBanner: async (id: number) => {
    return api.delete<{ success: boolean; message: string }>(`/banner/${id}`);
  },
};

export default contentService;
