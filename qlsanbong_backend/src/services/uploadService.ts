/**
 * =====================================================================
 * SERVICE: TẢI VÀ QUẢN LÝ ẢNH (CLOUDINARY SERVICE)
 * =====================================================================
 */

import cloudinary from '../config/cloudinary';

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

export const uploadImageFromUrl = async (url: string): Promise<any> => {
    const trimmedUrl = url.trim();
    if (trimmedUrl.includes('res.cloudinary.com')) {
        return {
            secure_url: trimmedUrl,
            public_id: getPublicIdFromUrl(trimmedUrl)
        };
    }

    try {
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
        return await uploadStreamToCloudinary(buffer);
    } catch (downloadErr: any) {
        return await cloudinary.uploader.upload(trimmedUrl, {
            folder: 'quanlysanbong',
            resource_type: 'image'
        });
    }
};

export const getPublicIdFromUrl = (url?: string): string | null => {
    if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) return null;
    try {
        const parts = url.split('/upload/');
        if (parts.length < 2) return null;
        let pathAfterUpload = parts[1];
        pathAfterUpload = pathAfterUpload.replace(/^v\d+\//, '');
        const dotIndex = pathAfterUpload.lastIndexOf('.');
        if (dotIndex !== -1) {
            pathAfterUpload = pathAfterUpload.substring(0, dotIndex);
        }
        return pathAfterUpload;
    } catch (e) {
        return null;
    }
};

export const deleteImageFromCloudinary = async (targetPublicId: string): Promise<any> => {
    return await cloudinary.uploader.destroy(targetPublicId);
};
