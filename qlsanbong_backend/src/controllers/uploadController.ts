import { Response } from 'express';
import cloudinary from '../config/cloudinary';
import { AuthRequest } from '../types';

/**
 * Controller xử lý tải ảnh lên Cloudinary
 * 1. Upload từ file máy tính (multipart/form-data)
 * 2. Upload từ đường link ảnh bên ngoài (URL) - Tải xuống buffer rồi đẩy lên Cloudinary
 */

// Hàm stream buffer lên Cloudinary
export const uploadStreamToCloudinary = (fileBuffer: Buffer): Promise<any> => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: 'quanlysanbong',
                resource_type: 'image'
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        stream.end(fileBuffer);
    });
};

export const uploadImage = async (req: AuthRequest, res: Response) => {
    try {
        // 1. Trường hợp người dùng tải file từ máy tính
        if (req.file) {
            const result = await uploadStreamToCloudinary(req.file.buffer);
            return res.status(200).json({
                success: true,
                message: 'Tải ảnh lên Cloudinary thành công!',
                url: result.secure_url,
                public_id: result.public_id
            });
        }

        // 2. Trường hợp người dùng dán link ảnh từ mạng
        const { url } = req.body;
        if (url && typeof url === 'string' && url.trim()) {
            const trimmedUrl = url.trim();

            // Nếu đã là link Cloudinary thì dùng luôn
            if (trimmedUrl.includes('res.cloudinary.com')) {
                return res.status(200).json({
                    success: true,
                    message: 'Link Cloudinary hợp lệ!',
                    url: trimmedUrl
                });
            }

            try {
                // Tải dữ liệu ảnh về buffer bằng fetch
                const response = await fetch(trimmedUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    }
                });

                if (!response.ok) {
                    throw new Error(`Không thể tải ảnh từ URL (HTTP ${response.status})`);
                }

                const arrayBuffer = await response.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                const result = await uploadStreamToCloudinary(buffer);

                return res.status(200).json({
                    success: true,
                    message: 'Tải ảnh từ liên kết lên Cloudinary thành công!',
                    url: result.secure_url,
                    public_id: result.public_id
                });
            } catch (downloadErr: any) {
                console.warn('Fallback sang direct cloudinary uploader:', downloadErr.message);
                const result = await cloudinary.uploader.upload(trimmedUrl, {
                    folder: 'quanlysanbong',
                    resource_type: 'image'
                });

                return res.status(200).json({
                    success: true,
                    message: 'Tải ảnh từ liên kết lên Cloudinary thành công!',
                    url: result.secure_url,
                    public_id: result.public_id
                });
            }
        }

        return res.status(400).json({
            success: false,
            message: 'Vui lòng chọn file ảnh tải lên hoặc nhập đường link ảnh hợp lệ!'
        });
    } catch (error: any) {
        console.error('🔥 [Lỗi Upload Cloudinary]:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi tải ảnh lên Cloudinary'
        });
    }
};

// Helper trích xuất public_id từ Cloudinary URL
export const getPublicIdFromUrl = (url?: string): string | null => {
    if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) return null;
    try {
        const parts = url.split('/upload/');
        if (parts.length < 2) return null;
        let pathAfterUpload = parts[1];
        // Xóa version prefix nếu có: v1234567890/
        pathAfterUpload = pathAfterUpload.replace(/^v\d+\//, '');
        // Xóa đuôi file: .jpg, .png, .webp
        const dotIndex = pathAfterUpload.lastIndexOf('.');
        if (dotIndex !== -1) {
            pathAfterUpload = pathAfterUpload.substring(0, dotIndex);
        }
        return pathAfterUpload;
    } catch (e) {
        return null;
    }
};

/**
 * Xóa ảnh trên Cloudinary
 * Method: POST /api/upload/delete
 * Body: { url?: string, public_id?: string }
 */
export const deleteImage = async (req: AuthRequest, res: Response) => {
    try {
        const { url, public_id } = req.body;
        const targetPublicId = public_id || getPublicIdFromUrl(url);

        if (!targetPublicId) {
            return res.status(200).json({
                success: true,
                message: 'Không phải ảnh Cloudinary hoặc không tìm thấy public_id để xóa.'
            });
        }

        const result = await cloudinary.uploader.destroy(targetPublicId);
        console.log(`🗑️ [Cloudinary Destroy]: public_id = ${targetPublicId}`, result);

        return res.status(200).json({
            success: true,
            message: 'Đã xóa ảnh cũ trên Cloudinary thành công!',
            result
        });
    } catch (error: any) {
        console.error('Lỗi khi xóa ảnh Cloudinary:', error.message);
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi xóa ảnh Cloudinary'
        });
    }
};
