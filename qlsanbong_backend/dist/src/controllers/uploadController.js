"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteImage = exports.getPublicIdFromUrl = exports.uploadImage = exports.uploadStreamToCloudinary = void 0;
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
/**
 * Controller xử lý tải ảnh lên Cloudinary
 * 1. Upload từ file máy tính (multipart/form-data)
 * 2. Upload từ đường link ảnh bên ngoài (URL) - Tải xuống buffer rồi đẩy lên Cloudinary
 */
// Hàm stream buffer lên Cloudinary
const uploadStreamToCloudinary = (fileBuffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary_1.default.uploader.upload_stream({
            folder: 'quanlysanbong',
            resource_type: 'image'
        }, (error, result) => {
            if (error)
                return reject(error);
            resolve(result);
        });
        stream.end(fileBuffer);
    });
};
exports.uploadStreamToCloudinary = uploadStreamToCloudinary;
const uploadImage = async (req, res) => {
    try {
        // 1. Trường hợp người dùng tải file từ máy tính
        if (req.file) {
            const result = await (0, exports.uploadStreamToCloudinary)(req.file.buffer);
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
                const result = await (0, exports.uploadStreamToCloudinary)(buffer);
                return res.status(200).json({
                    success: true,
                    message: 'Tải ảnh từ liên kết lên Cloudinary thành công!',
                    url: result.secure_url,
                    public_id: result.public_id
                });
            }
            catch (downloadErr) {
                console.warn('Fallback sang direct cloudinary uploader:', downloadErr.message);
                const result = await cloudinary_1.default.uploader.upload(trimmedUrl, {
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
    }
    catch (error) {
        console.error('🔥 [Lỗi Upload Cloudinary]:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi tải ảnh lên Cloudinary'
        });
    }
};
exports.uploadImage = uploadImage;
// Helper trích xuất public_id từ Cloudinary URL
const getPublicIdFromUrl = (url) => {
    if (!url || typeof url !== 'string' || !url.includes('cloudinary.com'))
        return null;
    try {
        const parts = url.split('/upload/');
        if (parts.length < 2)
            return null;
        let pathAfterUpload = parts[1];
        // Xóa version prefix nếu có: v1234567890/
        pathAfterUpload = pathAfterUpload.replace(/^v\d+\//, '');
        // Xóa đuôi file: .jpg, .png, .webp
        const dotIndex = pathAfterUpload.lastIndexOf('.');
        if (dotIndex !== -1) {
            pathAfterUpload = pathAfterUpload.substring(0, dotIndex);
        }
        return pathAfterUpload;
    }
    catch (e) {
        return null;
    }
};
exports.getPublicIdFromUrl = getPublicIdFromUrl;
/**
 * Xóa ảnh trên Cloudinary
 * Method: POST /api/upload/delete
 * Body: { url?: string, public_id?: string }
 */
const deleteImage = async (req, res) => {
    try {
        const { url, public_id } = req.body;
        const targetPublicId = public_id || (0, exports.getPublicIdFromUrl)(url);
        if (!targetPublicId) {
            return res.status(200).json({
                success: true,
                message: 'Không phải ảnh Cloudinary hoặc không tìm thấy public_id để xóa.'
            });
        }
        const result = await cloudinary_1.default.uploader.destroy(targetPublicId);
        console.log(`🗑️ [Cloudinary Destroy]: public_id = ${targetPublicId}`, result);
        return res.status(200).json({
            success: true,
            message: 'Đã xóa ảnh cũ trên Cloudinary thành công!',
            result
        });
    }
    catch (error) {
        console.error('Lỗi khi xóa ảnh Cloudinary:', error.message);
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi xóa ảnh Cloudinary'
        });
    }
};
exports.deleteImage = deleteImage;
