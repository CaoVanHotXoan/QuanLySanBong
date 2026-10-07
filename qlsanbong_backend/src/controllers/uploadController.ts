import { Response } from 'express';
import { AuthRequest } from '../types';
import {
    uploadStreamToCloudinary,
    getCloudinaryInfo,
    getPublicIdFromUrl,
    ensureCloudinaryUrl,
    deleteFromCloudinary
} from '../services/uploadService';

export {
    uploadStreamToCloudinary,
    getCloudinaryInfo,
    getPublicIdFromUrl,
    ensureCloudinaryUrl,
    deleteFromCloudinary
};

/**
 * Controller xử lý tải ảnh & video lên Cloudinary
 * 1. Upload từ file máy tính (multipart/form-data)
 * 2. Upload từ đường link bên ngoài (URL) - Đảm bảo lưu trữ tại Cloudinary
 */
export const uploadImage = async (req: AuthRequest, res: Response) => {
    try {
        // 1. Trường hợp người dùng tải file từ máy tính (ảnh hoặc video)
        if (req.file) {
            const result = await uploadStreamToCloudinary(req.file.buffer, 'auto');
            return res.status(200).json({
                success: true,
                message: 'Tải file lên Cloudinary thành công!',
                url: result.secure_url,
                public_id: result.public_id,
                resource_type: result.resource_type
            });
        }

        // 2. Trường hợp người dùng dán link ảnh/video từ mạng
        const { url, type } = req.body;
        if (url && typeof url === 'string' && url.trim()) {
            const cloudinaryUrl = await ensureCloudinaryUrl(url, type || 'auto');
            return res.status(200).json({
                success: true,
                message: 'Lưu trữ liên kết lên Cloudinary thành công!',
                url: cloudinaryUrl,
                public_id: getPublicIdFromUrl(cloudinaryUrl)
            });
        }

        return res.status(400).json({
            success: false,
            message: 'Vui lòng chọn file tải lên hoặc nhập đường link hợp lệ!'
        });
    } catch (error: any) {
        console.error('🔥 [Lỗi Upload Cloudinary]:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi tải file lên Cloudinary'
        });
    }
};

/**
 * Xóa file (ảnh/video) trên Cloudinary
 * Method: POST /api/upload/delete
 * Body: { url?: string, public_id?: string, resource_type?: 'image' | 'video' }
 */
export const deleteImage = async (req: AuthRequest, res: Response) => {
    try {
        const { url, public_id, resource_type } = req.body;
        const target = public_id || url;

        if (!target) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp url hoặc public_id cần xóa.'
            });
        }

        const result = await deleteFromCloudinary(target, resource_type);
        return res.status(200).json({
            success: true,
            message: 'Đã xóa file trên Cloudinary thành công!',
            result
        });
    } catch (error: any) {
        console.error('Lỗi khi xóa file Cloudinary:', error.message);
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi xóa file Cloudinary'
        });
    }
};
