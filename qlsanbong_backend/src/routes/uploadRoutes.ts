import express, { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { uploadImage, deleteImage } from '../controllers/uploadController';

const router: Router = express.Router();

// Cấu hình lưu trữ bộ nhớ tạm (Memory Storage) cho Multer
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // Giới hạn 100MB cho cả ảnh và video
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Chỉ chấp nhận các định dạng file ảnh (jpg, png, webp...) hoặc video (mp4, webm, mov, avi, mkv...)!'));
        }
    }
});

// Endpoint: POST /api/upload
// Hỗ trợ multipart/form-data (trường 'image', 'video' hoặc 'file') lẫn JSON { url: "..." }
router.post('/', (req: Request, res: Response, next: NextFunction) => {
    upload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'video', maxCount: 1 },
        { name: 'file', maxCount: 1 }
    ])(req, res, (err: any) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message || 'Lỗi khi nhận file tải lên'
            });
        }
        // Chuẩn hóa req.file nếu người dùng gửi vào bất kỳ field nào
        if (req.files) {
            const files = req.files as { [fieldname: string]: Express.Multer.File[] };
            req.file = files['file']?.[0] || files['video']?.[0] || files['image']?.[0];
        }
        next();
    });
}, uploadImage as any);

// Endpoint: POST /api/upload/delete - Xóa ảnh cũ trên Cloudinary
router.post('/delete', deleteImage as any);

export default router;
