"use strict";
/**
 * =====================================================================
 * SERVICE: TẢI VÀ QUẢN LÝ ẢNH & VIDEO (CLOUDINARY SERVICE)
 * Hỗ trợ tự động upload ảnh/video từ file buffer hoặc từ URL bên ngoài
 * Tự động xóa file cũ trên Cloudinary khi sửa hoặc xóa Banner/Nội dung
 * =====================================================================
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteImageFromCloudinary = exports.deleteFromCloudinary = exports.ensureCloudinaryUrl = exports.uploadStreamToCloudinary = exports.getPublicIdFromUrl = exports.getCloudinaryInfo = void 0;
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
/**
 * Trích xuất public_id và resource_type từ Cloudinary URL
 */
const getCloudinaryInfo = (url) => {
    if (!url || typeof url !== 'string' || !url.includes('cloudinary.com'))
        return null;
    try {
        const isVideo = url.includes('/video/upload/') || /\.(mp4|webm|mov|avi|mkv)$/i.test(url);
        const resource_type = isVideo ? 'video' : 'image';
        const parts = url.split('/upload/');
        if (parts.length < 2)
            return null;
        let pathAfterUpload = parts[1];
        // Xóa các thông số transform và version: e.g. v1234567890/
        pathAfterUpload = pathAfterUpload.replace(/^(?:[a-zA-Z0-9_,]+(?:\/[a-zA-Z0-9_,]+)*\/)?v\d+\//, '');
        pathAfterUpload = pathAfterUpload.replace(/^v\d+\//, '');
        // Xóa đuôi file mở rộng: .jpg, .png, .mp4,...
        const dotIndex = pathAfterUpload.lastIndexOf('.');
        if (dotIndex !== -1) {
            pathAfterUpload = pathAfterUpload.substring(0, dotIndex);
        }
        return { public_id: pathAfterUpload, resource_type };
    }
    catch (e) {
        return null;
    }
};
exports.getCloudinaryInfo = getCloudinaryInfo;
const getPublicIdFromUrl = (url) => {
    const info = (0, exports.getCloudinaryInfo)(url);
    return info ? info.public_id : null;
};
exports.getPublicIdFromUrl = getPublicIdFromUrl;
/**
 * Upload buffer lên Cloudinary (hỗ trợ cả ảnh và video)
 */
const uploadStreamToCloudinary = (fileBuffer, resourceType = 'auto') => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary_1.default.uploader.upload_stream({
            folder: 'quanlysanbong',
            resource_type: resourceType
        }, (error, result) => {
            if (error)
                return reject(error);
            resolve(result);
        });
        stream.end(fileBuffer);
    });
};
exports.uploadStreamToCloudinary = uploadStreamToCloudinary;
/**
 * Đảm bảo URL lưu trữ là link trên Cloudinary:
 * Nếu là URL ngoài (Unsplash, Pinterest, Mixkit,...) thì tự động tải và đẩy lên Cloudinary
 */
const ensureCloudinaryUrl = async (url, type = 'auto') => {
    if (!url || typeof url !== 'string' || !url.trim())
        return undefined;
    const trimmed = url.trim();
    if (trimmed.includes('res.cloudinary.com')) {
        return trimmed;
    }
    try {
        console.log(`☁️ [Cloudinary Auto-Upload Remote URL]: ${trimmed}`);
        const resource_type = type === 'VIDEO' ? 'video' : (type === 'IMAGE' ? 'image' : 'auto');
        const response = await fetch(trimmed, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const res = await (0, exports.uploadStreamToCloudinary)(buffer, resource_type);
            return res.secure_url;
        }
        else {
            const result = await cloudinary_1.default.uploader.upload(trimmed, {
                folder: 'quanlysanbong',
                resource_type: resource_type
            });
            return result.secure_url;
        }
    }
    catch (err) {
        console.warn('⚠️ Không thể chuyển remote URL sang Cloudinary, giữ link gốc:', err.message);
        return trimmed;
    }
};
exports.ensureCloudinaryUrl = ensureCloudinaryUrl;
/**
 * Xóa file trên Cloudinary (hỗ trợ cả ảnh và video)
 */
const deleteFromCloudinary = async (urlOrPublicId, explicitResourceType) => {
    if (!urlOrPublicId)
        return null;
    try {
        let publicId = urlOrPublicId;
        let resourceType = explicitResourceType || 'image';
        if (urlOrPublicId.includes('cloudinary.com')) {
            const info = (0, exports.getCloudinaryInfo)(urlOrPublicId);
            if (!info)
                return null;
            publicId = info.public_id;
            resourceType = explicitResourceType || info.resource_type;
        }
        console.log(`🗑️ [Cloudinary Delete]: Deleting public_id="${publicId}", resource_type="${resourceType}"`);
        let res = await cloudinary_1.default.uploader.destroy(publicId, { resource_type: resourceType, invalidate: true });
        // Fallback kiểm tra nếu là video
        if (res && res.result === 'not found' && resourceType === 'image') {
            res = await cloudinary_1.default.uploader.destroy(publicId, { resource_type: 'video', invalidate: true });
        }
        console.log(`🗑️ [Cloudinary Delete Result]:`, res);
        return res;
    }
    catch (err) {
        console.error('🔥 [Cloudinary Delete Error]:', err.message);
        return null;
    }
};
exports.deleteFromCloudinary = deleteFromCloudinary;
const deleteImageFromCloudinary = async (targetPublicId) => {
    return await (0, exports.deleteFromCloudinary)(targetPublicId, 'image');
};
exports.deleteImageFromCloudinary = deleteImageFromCloudinary;
