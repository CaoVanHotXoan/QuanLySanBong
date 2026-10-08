"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const uploadController_1 = require("../controllers/uploadController");
const router = express_1.default.Router();
// Cấu hình lưu trữ bộ nhớ tạm (Memory Storage) cho Multer
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // Giới hạn 100MB cho cả ảnh và video
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Chỉ chấp nhận các định dạng file ảnh (jpg, png, webp...) hoặc video (mp4, webm, mov, avi, mkv...)!'));
        }
    }
});
// Endpoint: POST /api/upload
// Hỗ trợ multipart/form-data (trường 'image', 'video' hoặc 'file') lẫn JSON { url: "..." }
router.post('/', (req, res, next) => {
    upload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'video', maxCount: 1 },
        { name: 'file', maxCount: 1 }
    ])(req, res, (err) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message || 'Lỗi khi nhận file tải lên'
            });
        }
        // Chuẩn hóa req.file nếu người dùng gửi vào bất kỳ field nào
        if (req.files) {
            const files = req.files;
            req.file = files['file']?.[0] || files['video']?.[0] || files['image']?.[0];
        }
        next();
    });
}, uploadController_1.uploadImage);
// Endpoint: POST /api/upload/delete - Xóa ảnh cũ trên Cloudinary
router.post('/delete', uploadController_1.deleteImage);
exports.default = router;
