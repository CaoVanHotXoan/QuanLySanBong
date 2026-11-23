"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testGuiNhacNho = exports.kiemTraNhacNhoThuCong = exports.xoaThongBao = exports.danhDauDocTatCa = exports.danhDauDaDoc = exports.layDanhSachThongBao = void 0;
const db_1 = require("../config/db");
const reminderService_1 = require("../services/reminderService");
/**
 * 1. Lấy danh sách thông báo của người dùng hiện tại
 * GET /api/thong-bao
 */
const layDanhSachThongBao = async (req, res) => {
    try {
        const ma_nguoi_dung = req.user?.id;
        if (!ma_nguoi_dung) {
            return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để xem thông báo!' });
        }
        const pool = await db_1.poolPromise;
        const result = await pool.request()
            .input('ma_nguoi_dung', db_1.sql.Int, ma_nguoi_dung)
            .execute('sp_LayDanhSachThongBao');
        const list = result.recordset || [];
        const unreadCount = list.filter((item) => !item.da_doc || item.da_doc === 0).length;
        return res.status(200).json({
            success: true,
            data: list,
            unreadCount
        });
    }
    catch (error) {
        console.error('Lỗi layDanhSachThongBao:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi tải danh sách thông báo: ' + error.message
        });
    }
};
exports.layDanhSachThongBao = layDanhSachThongBao;
/**
 * 2. Đánh dấu 1 thông báo là đã đọc
 * PUT /api/thong-bao/:id/da-doc
 */
const danhDauDaDoc = async (req, res) => {
    try {
        const id = parseInt(String(req.params.id), 10);
        const ma_nguoi_dung = req.user?.id;
        if (!ma_nguoi_dung) {
            return res.status(401).json({ success: false, message: 'Chưa xác thực!' });
        }
        const pool = await db_1.poolPromise;
        await pool.request()
            .input('id', db_1.sql.Int, id)
            .input('ma_nguoi_dung', db_1.sql.Int, ma_nguoi_dung)
            .execute('sp_DanhDauDaDocThongBao');
        return res.status(200).json({
            success: true,
            message: 'Đã đánh dấu thông báo đã đọc!'
        });
    }
    catch (error) {
        console.error('Lỗi danhDauDaDoc:', error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.danhDauDaDoc = danhDauDaDoc;
/**
 * 3. Đánh dấu tất cả thông báo là đã đọc
 * PUT /api/thong-bao/doc-tat-ca
 */
const danhDauDocTatCa = async (req, res) => {
    try {
        const ma_nguoi_dung = req.user?.id;
        if (!ma_nguoi_dung) {
            return res.status(401).json({ success: false, message: 'Chưa xác thực!' });
        }
        const pool = await db_1.poolPromise;
        await pool.request()
            .input('ma_nguoi_dung', db_1.sql.Int, ma_nguoi_dung)
            .execute('sp_DanhDauDocTatCaThongBao');
        return res.status(200).json({
            success: true,
            message: 'Đã đánh dấu tất cả thông báo đã đọc!'
        });
    }
    catch (error) {
        console.error('Lỗi danhDauDocTatCa:', error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.danhDauDocTatCa = danhDauDocTatCa;
/**
 * 4. Xóa thông báo
 * DELETE /api/thong-bao/:id
 */
const xoaThongBao = async (req, res) => {
    try {
        const id = parseInt(String(req.params.id), 10);
        const ma_nguoi_dung = req.user?.id;
        if (!ma_nguoi_dung) {
            return res.status(401).json({ success: false, message: 'Chưa xác thực!' });
        }
        const pool = await db_1.poolPromise;
        await pool.request()
            .input('id', db_1.sql.Int, id)
            .input('ma_nguoi_dung', db_1.sql.Int, ma_nguoi_dung)
            .execute('sp_XoaThongBao');
        return res.status(200).json({
            success: true,
            message: 'Đã xóa thông báo!'
        });
    }
    catch (error) {
        console.error('Lỗi xoaThongBao:', error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.xoaThongBao = xoaThongBao;
/**
 * 5. Kích hoạt quét và gửi nhắc nhở thủ công (cho Admin / Cron kiểm tra)
 * POST /api/thong-bao/kiem-tra-nhac-nho
 */
const kiemTraNhacNhoThuCong = async (req, res) => {
    try {
        const io = req.app.get('io');
        const result = await (0, reminderService_1.scanAndSendBookingReminders)(io);
        return res.status(200).json({
            success: true,
            message: `Đã hoàn tất quét nhắc lịch. Tổng xử lý: ${result.totalProcessed}, thành công: ${result.successCount}`,
            data: result
        });
    }
    catch (error) {
        console.error('Lỗi kiemTraNhacNhoThuCong:', error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.kiemTraNhacNhoThuCong = kiemTraNhacNhoThuCong;
/**
 * 6. Gửi thử nghiệm nhắc lịch cho 1 đơn cụ thể
 * POST /api/thong-bao/test-reminder/:ma_don_dat
 */
const testGuiNhacNho = async (req, res) => {
    try {
        const ma_don_dat = parseInt(String(req.params.ma_don_dat), 10);
        const io = req.app.get('io');
        const sent = await (0, reminderService_1.sendImmediateReminderForBooking)(ma_don_dat, io);
        return res.status(200).json({
            success: sent,
            message: sent
                ? `✅ Đã gửi email và tạo thông báo nhắc lịch thành công cho đơn #${ma_don_dat}!`
                : `⚠️ Không tìm thấy đơn hoặc không thể gửi thông báo cho đơn #${ma_don_dat}`
        });
    }
    catch (error) {
        console.error('Lỗi testGuiNhacNho:', error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.testGuiNhacNho = testGuiNhacNho;
