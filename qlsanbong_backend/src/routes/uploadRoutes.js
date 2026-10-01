const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadImage, deleteImage } = require('../controllers/uploadController');

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
            cb(new Error('Chỉ chấp nhận các định dạng file ảnh (jpg, png, jpeg, webp)!'), false);
        }
    }
});

// Endpoint: POST /api/upload
// Hỗ trợ cả multipart/form-data (trường 'image' hoặc 'file') lẫn JSON { url: "..." }
router.post('/', (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message || 'Lỗi khi nhận file tải lên'
            });
        }
        next();
    });
}, uploadImage);

// Endpoint: POST /api/upload/delete - Xóa ảnh cũ trên Cloudinary
router.post('/delete', deleteImage);

module.exports = router;
