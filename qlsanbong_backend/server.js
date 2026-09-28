/**
 * =====================================================================
 * MÁY CHỦ CHÍNH (EXPRESS SERVER) - QUẢN LÝ SÂN BÓNG BACKEND
 * =====================================================================
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Khởi chạy kết nối CSDL
require('./src/config/db');

// Import các routes
const authRoutes = require('./src/routes/authRoutes');
const datSanRoutes = require('./src/routes/datSanRoutes');
const dichVuRoutes = require('./src/routes/dichVuRoutes');
const thanhToanRoutes = require('./src/routes/thanhToanRoutes');
const baoCaoRoutes = require('./src/routes/baoCaoRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Cấu hình Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
            bao_cao: '/api/bao-cao'
        }
    });
});

// Đăng ký các Routes chính
app.use('/api/auth', authRoutes);
app.use('/api/dat-san', datSanRoutes);
app.use('/api/dich-vu', dichVuRoutes);
app.use('/api/thanh-toan', thanhToanRoutes);
app.use('/api/bao-cao', baoCaoRoutes);

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

// Khởi chạy máy chủ
app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 Máy chủ Backend đang lắng nghe tại: http://localhost:${PORT}`);
    console.log(`📌 Môi trường: ${process.env.NODE_ENV || 'development'}`);
    console.log(`====================================================`);
});
