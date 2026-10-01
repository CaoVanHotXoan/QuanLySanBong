/**
 * =====================================================================
 * MÁY CHỦ CHÍNH (EXPRESS + SOCKET.IO REALTIME) - QUẢN LÝ SÂN BÓNG BACKEND
 * =====================================================================
 */

import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

// Khởi chạy kết nối CSDL
import './src/config/db';

// Import các routes
import authRoutes from './src/routes/authRoutes';
import datSanRoutes from './src/routes/datSanRoutes';
import dichVuRoutes from './src/routes/dichVuRoutes';
import thanhToanRoutes from './src/routes/thanhToanRoutes';
import baoCaoRoutes from './src/routes/baoCaoRoutes';
import uploadRoutes from './src/routes/uploadRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

// Cấu hình Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Trang chào mừng & Kiểm tra trạng thái máy chủ
app.get('/', (req: Request, res: Response) => {
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
            upload: '/api/upload'
        }
    });
});

// Đăng ký các Routes chính
app.use('/api/auth', authRoutes);
app.use('/api/dat-san', datSanRoutes);
app.use('/api/dich-vu', dichVuRoutes);
app.use('/api/thanh-toan', thanhToanRoutes);
app.use('/api/bao-cao', baoCaoRoutes);
app.use('/api/upload', uploadRoutes);

// Middleware xử lý 404 - Không tìm thấy Endpoint
app.use((req: Request, res: Response, next: NextFunction) => {
    res.status(404).json({
        success: false,
        message: `Endpoint ${req.originalUrl} không tồn tại trên hệ thống!`
    });
});

// Middleware xử lý lỗi toàn cục (Global Error Handler)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('🔥 [Lỗi Hệ Thống]:', err.stack || err.message);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Đã có lỗi xảy ra từ máy chủ nội bộ!'
    });
});

// =====================================================================
// KHỞI TẠO HTTP SERVER & SOCKET.IO CHO TÍNH NĂNG GIỮ CHỖ REAL-TIME
// =====================================================================
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Gán socket.io vào app để các controller (PayOS webhook, đặt sân, thanh toán) có thể emit realtime
app.set('io', io);

/**
 * In-memory Map lưu danh sách các ô slot đang bị giữ chỗ tạm thời
 * Key: slotId (Ví dụ: "2026-09-30_1_16:30" hoặc "1_16:30")
 * Value: socket.id của người đang thao tác giữ chỗ
 */
const lockedSlots = new Map<string, string>();

io.on('connection', (socket) => {
    console.log(`⚡ [Socket Connected]: ${socket.id}`);

    // Gửi danh sách các slot đang bị khóa cho Client vừa kết nối
    socket.emit('slots_updated', Array.from(lockedSlots.keys()));

    // 1. SỰ KIỆN KHÓA SÂN (lock_slot)
    socket.on('lock_slot', (slotId: string) => {
        if (!slotId) return;

        // Nếu ô này chưa bị ai khác khóa
        if (!lockedSlots.has(slotId)) {
            lockedSlots.set(slotId, socket.id);
            console.log(`🔒 [Lock]: Slot ${slotId} được giữ bởi ${socket.id}`);
            // Broadcast toàn bộ danh sách cập nhật cho TẤT CẢ clients
            io.emit('slots_updated', Array.from(lockedSlots.keys()));
        }
    });

    // 2. SỰ KIỆN NHẢ SÂN (unlock_slot)
    socket.on('unlock_slot', (slotId: string) => {
        if (!slotId) return;

        // Chỉ cho phép chính socket đang giữ ô đó nhả ra
        if (lockedSlots.get(slotId) === socket.id) {
            lockedSlots.delete(slotId);
            console.log(`🔓 [Unlock]: Slot ${slotId} đã được nhả bởi ${socket.id}`);
            io.emit('slots_updated', Array.from(lockedSlots.keys()));
        }
    });

    // 3. SỰ KIỆN NGẮT KẾT NỐI (disconnect)
    // Tự động giải phóng toàn bộ ô mà user này đang giữ khi tắt tab/rớt mạng
    socket.on('disconnect', () => {
        console.log(`❌ [Socket Disconnected]: ${socket.id}`);
        let hasChanges = false;

        for (const [slotId, holderSocketId] of lockedSlots.entries()) {
            if (holderSocketId === socket.id) {
                lockedSlots.delete(slotId);
                hasChanges = true;
                console.log(`🧹 [Auto-Release]: Đã tự động nhả slot ${slotId} do ${socket.id} ngắt kết nối.`);
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
