import express, { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { uploadImage, deleteImage } from '../controllers/uploadController';

const router: Router = express.Router();

// Cấu hình lưu trữ bộ nhớ tạm (Memory Storage) cho Multer
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // Giới hạn 10MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Chỉ chấp nhận các định dạng file ảnh (jpg, png, jpeg, webp)!'));
        }
    }
});

// Endpoint: POST /api/upload
// Hỗ trợ cả multipart/form-data (trường 'image' hoặc 'file') lẫn JSON { url: "..." }
router.post('/', (req: Request, res: Response, next: NextFunction) => {
    upload.single('image')(req, res, (err: any) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message || 'Lỗi khi nhận file tải lên'
            });
        }
        next();
    });
}, uploadImage as any);

// Endpoint: POST /api/upload/delete - Xóa ảnh cũ trên Cloudinary
router.post('/delete', deleteImage as any);

export default router;
