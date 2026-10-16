/**
 * =====================================================================
 * FRONTEND SERVICE: XÁC THỰC & NGƯỜI DÙNG (AUTH SERVICE)
 * =====================================================================
 */

import api from './apiClient';

export interface UserProfile {
    id: number;
    ho_ten: string;
    email: string;
    so_dien_thoai?: string;
    vai_tro: string;
    anh_dai_dien?: string;
}

export const authService = {
    // Đăng nhập
    login: (email: string, mat_khau: string) => {
        return api.post<{ success: boolean; token: string; user: UserProfile; message?: string }>('/auth/login', {
            email,
            mat_khau,
        });
    },

    // Đăng ký (hỗ trợ mã OTP qua Gmail)
    register: (data: { ho_ten: string; email: string; so_dien_thoai?: string; mat_khau: string; vai_tro?: string; ma_otp?: string }) => {
        return api.post<{ success: boolean; message: string; data: UserProfile }>('/auth/register', data);
    },

    // Gửi mã OTP xác thực qua Gmail (Đăng ký, Đổi mật khẩu, Cập nhật Email)
    sendOtp: (email: string, loai_otp: 'DANG_KY' | 'DOI_MAT_KHAU' | 'CAP_NHAT_EMAIL', ho_ten?: string) => {
        return api.post<{ success: boolean; message: string }>('/auth/send-otp', {
            email,
            loai_otp,
            ho_ten,
        });
    },

    // Xác thực mã OTP
    verifyOtp: (email: string, ma_otp: string, loai_otp: 'DANG_KY' | 'DOI_MAT_KHAU' | 'CAP_NHAT_EMAIL') => {
        return api.post<{ success: boolean; message: string }>('/auth/verify-otp', {
            email,
            ma_otp,
            loai_otp,
        });
    },

    // Lấy thông tin tài khoản hiện tại
    getMe: () => {
        return api.get<{ success: boolean; data: UserProfile }>('/auth/me');
    },

    // Lấy danh sách người dùng (Admin)
    getUsers: () => {
        return api.get<{ success: boolean; data: UserProfile[] }>('/auth/users');
    },

    // Cập nhật người dùng
    updateUser: (id: number, data: Partial<UserProfile> & { mat_khau?: string }) => {
        return api.put<{ success: boolean; message: string; data: UserProfile }>(`/auth/users/${id}`, data);
    },

    // Xóa người dùng
    deleteUser: (id: number) => {
        return api.delete<{ success: boolean; message: string }>(`/auth/users/${id}`);
    },

    // Đổi mật khẩu (hỗ trợ xác thực qua OTP Gmail hoặc mật khẩu cũ)
    changePassword: (data: { email?: string; ma_otp?: string; mat_khau_cu?: string; mat_khau_moi: string }) => {
        return api.post<{ success: boolean; message: string }>('/auth/change-password', data);
    },

    // Cập nhật địa chỉ Gmail mới kèm xác thực OTP
    updateEmail: (email_moi: string, ma_otp: string) => {
        return api.post<{ success: boolean; message: string; data: UserProfile }>('/auth/update-email', {
            email_moi,
            ma_otp,
        });
    },
};

export default authService;

