/**
 * =====================================================================
 * FRONTEND SERVICE: TẢI VÀ QUẢN LÝ ẢNH (UPLOAD SERVICE)
 * =====================================================================
 */

import api from './apiClient';

export const uploadService = {
    // 1. Tải ảnh từ file máy tính lên Cloudinary
    uploadFile: (file: File) => {
        const formData = new FormData();
        formData.append('image', file);
        return api.post<{ success: boolean; url: string; public_id: string; message: string }>('/upload', formData);
    },

    // 2. Tải ảnh từ URL mạng lên Cloudinary
    uploadFromUrl: (url: string) => {
        return api.post<{ success: boolean; url: string; public_id: string; message: string }>('/upload', { url });
    },

    // 3. Xóa ảnh trên Cloudinary
    deleteImage: (data: { url?: string; public_id?: string }) => {
        return api.post<{ success: boolean; message: string }>('/upload/delete', data);
    },
};

export default uploadService;
