"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteImage = exports.uploadImage = exports.deleteFromCloudinary = exports.ensureCloudinaryUrl = exports.getPublicIdFromUrl = exports.getCloudinaryInfo = exports.uploadStreamToCloudinary = void 0;
const uploadService_1 = require("../services/uploadService");
Object.defineProperty(exports, "uploadStreamToCloudinary", { enumerable: true, get: function () { return uploadService_1.uploadStreamToCloudinary; } });
Object.defineProperty(exports, "getCloudinaryInfo", { enumerable: true, get: function () { return uploadService_1.getCloudinaryInfo; } });
Object.defineProperty(exports, "getPublicIdFromUrl", { enumerable: true, get: function () { return uploadService_1.getPublicIdFromUrl; } });
Object.defineProperty(exports, "ensureCloudinaryUrl", { enumerable: true, get: function () { return uploadService_1.ensureCloudinaryUrl; } });
Object.defineProperty(exports, "deleteFromCloudinary", { enumerable: true, get: function () { return uploadService_1.deleteFromCloudinary; } });
/**
 * Controller xử lý tải ảnh & video lên Cloudinary
 * 1. Upload từ file máy tính (multipart/form-data)
 * 2. Upload từ đường link bên ngoài (URL) - Đảm bảo lưu trữ tại Cloudinary
 */
const uploadImage = async (req, res) => {
    try {
        // 1. Trường hợp người dùng tải file từ máy tính (ảnh hoặc video)
        if (req.file) {
            const result = await (0, uploadService_1.uploadStreamToCloudinary)(req.file.buffer, 'auto');
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
            const cloudinaryUrl = await (0, uploadService_1.ensureCloudinaryUrl)(url, type || 'auto');
            return res.status(200).json({
                success: true,
                message: 'Lưu trữ liên kết lên Cloudinary thành công!',
                url: cloudinaryUrl,
                public_id: (0, uploadService_1.getPublicIdFromUrl)(cloudinaryUrl)
            });
        }
        return res.status(400).json({
            success: false,
            message: 'Vui lòng chọn file tải lên hoặc nhập đường link hợp lệ!'
        });
    }
    catch (error) {
        console.error('🔥 [Lỗi Upload Cloudinary]:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi tải file lên Cloudinary'
        });
    }
};
exports.uploadImage = uploadImage;
/**
 * Xóa file (ảnh/video) trên Cloudinary
 * Method: POST /api/upload/delete
 * Body: { url?: string, public_id?: string, resource_type?: 'image' | 'video' }
 */
const deleteImage = async (req, res) => {
    try {
        const { url, public_id, resource_type } = req.body;
        const target = public_id || url;
        if (!target) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp url hoặc public_id cần xóa.'
            });
        }
        const result = await (0, uploadService_1.deleteFromCloudinary)(target, resource_type);
        return res.status(200).json({
            success: true,
            message: 'Đã xóa file trên Cloudinary thành công!',
            result
        });
    }
    catch (error) {
        console.error('Lỗi khi xóa file Cloudinary:', error.message);
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi xóa file Cloudinary'
        });
    }
};
exports.deleteImage = deleteImage;
