"use strict";
/**
 * =====================================================================
 * MÁY CHỦ CHÍNH (EXPRESS + SOCKET.IO REALTIME) - QUẢN LÝ SÂN BÓNG BACKEND
 * =====================================================================
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const compression_1 = __importDefault(require("compression"));
dotenv_1.default.config();
// Khởi chạy kết nối CSDL
require("./src/config/db");
// Import các routes
const authRoutes_1 = __importDefault(require("./src/routes/authRoutes"));
const datSanRoutes_1 = __importDefault(require("./src/routes/datSanRoutes"));
const dichVuRoutes_1 = __importDefault(require("./src/routes/dichVuRoutes"));
const thanhToanRoutes_1 = __importDefault(require("./src/routes/thanhToanRoutes"));
const baoCaoRoutes_1 = __importDefault(require("./src/routes/baoCaoRoutes"));
const uploadRoutes_1 = __importDefault(require("./src/routes/uploadRoutes"));
const contentRoutes_1 = __importDefault(require("./src/routes/contentRoutes"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Cấu hình Middleware
app.use((0, cors_1.default)());
app.use((0, compression_1.default)()); // Nén toàn bộ dữ liệu phản hồi API (Gzip/Brotli) giúp giảm 60-80% băng thông
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Trang chào mừng & Kiểm tra trạng thái máy chủ
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: '🚀 Hệ thống API Quản lý Sân bóng đá đang hoạt động!',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            dat_san: '/api/dat-san',
            dich_vu: '/api/dich-vu',
            thanh_toan: '/api/thanh-toan',
            bao_cao: '/api/bao-cao',
            upload: '/api/upload',
            content: '/api (tin-tuc, about-us, lien-he, banner)'
        }
    });
});
// Đăng ký các Routes chính
app.use('/api/auth', authRoutes_1.default);
app.use('/api/dat-san', datSanRoutes_1.default);
app.use('/api/dich-vu', dichVuRoutes_1.default);
app.use('/api/thanh-toan', thanhToanRoutes_1.default);
app.use('/api/bao-cao', baoCaoRoutes_1.default);
app.use('/api/upload', uploadRoutes_1.default);
app.use('/api', contentRoutes_1.default);
// Middleware xử lý 404 - Không tìm thấy Endpoint
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: `Endpoint ${req.originalUrl} không tồn tại trên hệ thống!`
    });
});
// Middleware xử lý lỗi toàn cục (Global Error Handler)
app.use((err, req, res, next) => {
    console.error('🔥 [Lỗi Hệ Thống]:', err.stack || err.message);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Đã có lỗi xảy ra từ máy chủ nội bộ!'
    });
});
// =====================================================================
// KHỞI TẠO HTTP SERVER & SOCKET.IO CHO TÍNH NĂNG GIỮ CHỖ REAL-TIME
// =====================================================================
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});
// Gán socket.io vào app để các controller (PayOS webhook, đặt sân, thanh toán) có thể emit realtime
app.set('io', io);
/**
 * =====================================================================
 * SOCKET.IO: HỆ THỐNG GIỮ CHỖ THỜI GIAN THỰC (REAL-TIME COURT LOCKING)
 * In-memory Map lưu danh sách các ô slot đang bị giữ chỗ tạm thời
 * Key: slotId (Ví dụ: "2026-10-02_1_06:30")
 * Value: socket.id của khách hàng đang thao tác
 * =====================================================================
 */
const lockedSlots = new Map();
io.on('connection', (socket) => {
    console.log(`⚡ [Socket Connected]: ${socket.id}`);
    // Gửi danh sách toàn bộ các ô đang bị khóa cho Client vừa kết nối
    socket.emit('slots_updated', Array.from(lockedSlots.keys()));
    // 1. SỰ KIỆN KHÓA NHIỀU Ô CÙNG LÚC (lock_slots)
    socket.on('lock_slots', (slotIds) => {
        if (!Array.isArray(slotIds) || slotIds.length === 0)
            return;
        // Xóa các ô cũ do chính socket này đang giữ trước đó
        for (const [id, holderId] of lockedSlots.entries()) {
            if (holderId === socket.id) {
                lockedSlots.delete(id);
            }
        }
        slotIds.forEach((slotId) => {
            if (slotId && !lockedSlots.has(slotId)) {
                lockedSlots.set(slotId, socket.id);
            }
        });
        console.log(`🔒 [Lock Slots Multi]: Socket ${socket.id} đang giữ các ô:`, slotIds);
        io.emit('slots_updated', Array.from(lockedSlots.keys()));
    });
    // 2. SỰ KIỆN KHÓA 1 Ô ĐƠN LẺ (lock_slot)
    socket.on('lock_slot', (slotId) => {
        if (!slotId)
            return;
        if (!lockedSlots.has(slotId)) {
            lockedSlots.set(slotId, socket.id);
            console.log(`🔒 [Lock Slot]: Slot ${slotId} được giữ bởi ${socket.id}`);
            io.emit('slots_updated', Array.from(lockedSlots.keys()));
        }
    });
    // 3. SỰ KIỆN GIẢI PHÓNG TOÀN BỘ Ô CỦA USER NÀY (unlock_all)
    socket.on('unlock_all', () => {
        let hasChanges = false;
        for (const [slotId, holderId] of lockedSlots.entries()) {
            if (holderId === socket.id) {
                lockedSlots.delete(slotId);
                hasChanges = true;
            }
        }
        if (hasChanges) {
            console.log(`🔓 [Unlock All]: Đã nhả toàn bộ ô giữ chỗ của socket ${socket.id}`);
            io.emit('slots_updated', Array.from(lockedSlots.keys()));
        }
    });
    // 4. SỰ KIỆN NHẢ 1 Ô CỤ THỂ (unlock_slot & force_unlock_slot)
    socket.on('unlock_slot', (slotId) => {
        if (!slotId)
            return;
        if (lockedSlots.has(slotId)) {
            lockedSlots.delete(slotId);
            console.log(`🔓 [Unlock]: Slot ${slotId} đã được nhả`);
            io.emit('slots_updated', Array.from(lockedSlots.keys()));
        }
    });
    socket.on('force_unlock_slot', (slotId) => {
        if (!slotId)
            return;
        if (lockedSlots.has(slotId)) {
            lockedSlots.delete(slotId);
            console.log(`🔓 [Force Unlock]: Slot ${slotId} đã được Admin/POS mở khóa`);
            io.emit('slots_updated', Array.from(lockedSlots.keys()));
        }
    });
    // 5. SỰ KIỆN NGẮT KẾT NỐI (disconnect)
    socket.on('disconnect', () => {
        console.log(`❌ [Socket Disconnected]: ${socket.id}`);
        let hasChanges = false;
        for (const [slotId, holderId] of lockedSlots.entries()) {
            if (holderId === socket.id) {
                lockedSlots.delete(slotId);
                hasChanges = true;
                console.log(`🧹 [Auto-Release]: Đã nhả slot ${slotId} do ${socket.id} ngắt kết nối.`);
            }
        }
        if (hasChanges) {
            io.emit('slots_updated', Array.from(lockedSlots.keys()));
        }
    });
});
// Khởi chạy máy chủ HTTP + Socket.io
server.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 Máy chủ Backend + Socket.io đang lắng nghe tại: http://localhost:${PORT}`);
    console.log(`📌 Môi trường: ${process.env.NODE_ENV || 'development'}`);
    console.log(`====================================================`);
});
