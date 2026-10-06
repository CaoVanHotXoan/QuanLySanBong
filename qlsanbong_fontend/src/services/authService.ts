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

    // Đăng ký
    register: (data: { ho_ten: string; email: string; so_dien_thoai?: string; mat_khau: string; vai_tro?: string }) => {
        return api.post<{ success: boolean; message: string; data: UserProfile }>('/auth/register', data);
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

    // Đổi mật khẩu
    changePassword: (mat_khau_cu: string, mat_khau_moi: string) => {
        return api.post<{ success: boolean; message: string }>('/auth/change-password', {
            mat_khau_cu,
            mat_khau_moi,
        });
    },
};

export default authService;
