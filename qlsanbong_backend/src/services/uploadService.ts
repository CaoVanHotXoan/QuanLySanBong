/**
 * =====================================================================
 * SERVICE: TẢI VÀ QUẢN LÝ ẢNH & VIDEO (CLOUDINARY SERVICE)
 * Hỗ trợ tự động upload ảnh/video từ file buffer hoặc từ URL bên ngoài
 * Tự động xóa file cũ trên Cloudinary khi sửa hoặc xóa Banner/Nội dung
 * =====================================================================
 */

import cloudinary from '../config/cloudinary';

export interface CloudinaryMediaInfo {
    public_id: string;
    resource_type: 'image' | 'video' | 'raw';
}

/**
 * Trích xuất public_id và resource_type từ Cloudinary URL
 */
export const getCloudinaryInfo = (url?: string): CloudinaryMediaInfo | null => {
    if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) return null;
    try {
        const isVideo = url.includes('/video/upload/') || /\.(mp4|webm|mov|avi|mkv)$/i.test(url);
        const resource_type: 'image' | 'video' | 'raw' = isVideo ? 'video' : 'image';

        const parts = url.split('/upload/');
        if (parts.length < 2) return null;
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
    } catch (e) {
        return null;
    }
};

export const getPublicIdFromUrl = (url?: string): string | null => {
    const info = getCloudinaryInfo(url);
    return info ? info.public_id : null;
};

/**
 * Upload buffer lên Cloudinary (hỗ trợ cả ảnh và video)
 */
export const uploadStreamToCloudinary = (fileBuffer: Buffer, resourceType: 'auto' | 'image' | 'video' | 'raw' = 'auto'): Promise<any> => {
    return new Promise((resolve, reject) => {
        const uploadOptions: any = {
            folder: 'quanlysanbong',
            resource_type: resourceType
        };

        // Bổ sung chunk_size và timeout cho video hoặc file lớn
        if (resourceType === 'video' || resourceType === 'auto') {
            uploadOptions.chunk_size = 6000000;
            uploadOptions.timeout = 180000;
        }

        const stream = cloudinary.uploader.upload_stream(
            uploadOptions,
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        stream.end(fileBuffer);
    });
};

/**
 * Đảm bảo URL lưu trữ là link trên Cloudinary:
 * Nếu là URL ngoài (Unsplash, Pinterest, Mixkit,...) thì tự động tải và đẩy lên Cloudinary
 */
export const ensureCloudinaryUrl = async (url?: string, type: 'IMAGE' | 'VIDEO' | 'auto' = 'auto'): Promise<string | undefined> => {
    if (!url || typeof url !== 'string' || !url.trim()) return undefined;
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
            const res = await uploadStreamToCloudinary(buffer, resource_type);
            return res.secure_url;
        } else {
            const result = await cloudinary.uploader.upload(trimmed, {
                folder: 'quanlysanbong',
                resource_type: resource_type
            });
            return result.secure_url;
        }
    } catch (err: any) {
        console.warn('⚠️ Không thể chuyển remote URL sang Cloudinary, giữ link gốc:', err.message);
        return trimmed;
    }
};

/**
 * Xóa file trên Cloudinary (hỗ trợ cả ảnh và video)
 */
export const deleteFromCloudinary = async (urlOrPublicId?: string, explicitResourceType?: 'image' | 'video' | 'raw'): Promise<any> => {
    if (!urlOrPublicId) return null;
    try {
        let publicId = urlOrPublicId;
        let resourceType = explicitResourceType || 'image';

        if (urlOrPublicId.includes('cloudinary.com')) {
            const info = getCloudinaryInfo(urlOrPublicId);
            if (!info) return null;
            publicId = info.public_id;
            resourceType = explicitResourceType || info.resource_type;
        }

        console.log(`🗑️ [Cloudinary Delete]: Deleting public_id="${publicId}", resource_type="${resourceType}"`);
        let res = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType, invalidate: true });

        // Fallback kiểm tra nếu là video
        if (res && res.result === 'not found' && resourceType === 'image') {
            res = await cloudinary.uploader.destroy(publicId, { resource_type: 'video', invalidate: true });
        }
        console.log(`🗑️ [Cloudinary Delete Result]:`, res);
        return res;
    } catch (err: any) {
        console.error('🔥 [Cloudinary Delete Error]:', err.message);
        return null;
    }
};

export const deleteImageFromCloudinary = async (targetPublicId: string): Promise<any> => {
    return await deleteFromCloudinary(targetPublicId, 'image');
};
