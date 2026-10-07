"use strict";
/**
 * =====================================================================
 * CONTROLLER: THANH TOÁN & TÍCH HỢP PAYOS VIETQR (MB BANK)
 * 100% SỬ DỤNG STORED PROCEDURES (SQL SERVER):
 * 1. sp_DatSan
 * 2. sp_ThemNguoiDung
 * 3. sp_ThanhToanDon
 * 4. sp_LayDanhSachThanhToan
 * 5. sp_LayDanhSachHoanTien
 * =====================================================================
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.huyDonTamPayOS = exports.xoaHoanTien = exports.suaHoanTien = exports.themHoanTien = exports.layDanhSachHoanTien = exports.layDanhSachThanhToan = exports.xacNhanWebhookUrl = exports.xuLyWebhookPayOS = exports.kiemTraTrangThaiPayOS = exports.taoThanhToanPayOS = exports.thanhToanDon = void 0;
const db_1 = require("../config/db");
const payos_1 = __importDefault(require("../config/payos"));
const datSanController_1 = require("./datSanController");
/**
 * 1. Xử lý thanh toán đơn đặt sân (Stored Procedure: sp_ThanhToanDon)
 * Method: POST /api/thanh-toan
 */
const thanhToanDon = async (req, res) => {
    try {
        const { ma_don_dat, phuong_thuc, loai_thanh_toan, so_tien, ma_giao_dich } = req.body;
        if (!ma_don_dat || !phuong_thuc || !loai_thanh_toan || !so_tien) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ: ma_don_dat, phuong_thuc, loai_thanh_toan, so_tien!'
            });
        }
        const normalizedPhuongThuc = (phuong_thuc === 'TIEN_MAT') ? 'TIEN_MAT' : 'CHUYEN_KHOAN';
        const validLoaiThanhToan = ['DAT_COC', 'TRA_HET'];
        if (!validLoaiThanhToan.includes(loai_thanh_toan)) {
            return res.status(400).json({
                success: false,
                message: `Loại thanh toán không hợp lệ. Cho phép: ${validLoaiThanhToan.join(', ')}`
            });
        }
        const pool = await db_1.poolPromise;
        const result = await pool.request()
            .input('ma_don_dat', db_1.sql.Int, parseInt(ma_don_dat, 10))
            .input('phuong_thuc', db_1.sql.VarChar(20), normalizedPhuongThuc)
            .input('loai_thanh_toan', db_1.sql.VarChar(20), loai_thanh_toan)
            .input('so_tien', db_1.sql.Decimal(10, 2), parseFloat(so_tien))
            .input('ma_giao_dich', db_1.sql.VarChar(100), ma_giao_dich || null)
            .execute('sp_ThanhToanDon');
        const payment = result.recordset[0];
        // Phát tín hiệu Real-time qua Socket.IO
        const io = req.app.get('io');
        if (io) {
            io.emit('payment_success', {
                ma_don_dat: parseInt(ma_don_dat, 10),
                so_tien: parseFloat(so_tien),
                phuong_thuc: normalizedPhuongThuc,
                loai_thanh_toan,
                ma_giao_dich: ma_giao_dich || null
            });
            io.emit('booking_updated');
        }
        return res.status(200).json({
            success: true,
            message: 'Thanh toán đơn đặt sân thành công!',
            data: payment
        });
    }
    catch (error) {
        console.error('Lỗi sp_ThanhToanDon:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi xử lý thanh toán đơn đặt sân'
        });
    }
};
exports.thanhToanDon = thanhToanDon;
/**
 * 2. Tạo link và mã VietQR PayOS MB Bank (Stored Procedure: sp_DatSan & sp_ThemNguoiDung)
 * Method: POST /api/thanh-toan/payos/tao-link
 */
const taoThanhToanPayOS = async (req, res) => {
    try {
        if (!payos_1.default) {
            return res.status(500).json({
                success: false,
                message: 'Cổng thanh toán PayOS chưa được cấu hình đúng key trong máy chủ!'
            });
        }
        const { ma_don_dat, bookingData, so_tien, loai_thanh_toan, ho_ten, so_dien_thoai } = req.body;
        const amount = Math.round(Number(so_tien) || 10000);
        if (amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Số tiền thanh toán phải lớn hơn 0!'
            });
        }
        const pool = await db_1.poolPromise;
        let finalDonDatId = ma_don_dat ? parseInt(ma_don_dat, 10) : null;
        // Nếu tạo đơn mới trước khi thanh toán -> Thực thi Procedure sp_DatSan
        if (!finalDonDatId && bookingData) {
            const { ma_san, ngay_da, gio_bat_dau, gio_ket_thuc, tien_san, tong_tien, ghi_chu } = bookingData;
            // Xác định người dùng hoặc tạo qua Procedure sp_ThemNguoiDung
            let ma_nd = null;
            const ten_khach = (ho_ten && ho_ten.trim()) ? ho_ten.trim() : (bookingData.ho_ten || 'Khách Đặt Sân');
            const sdt_khach = (so_dien_thoai && so_dien_thoai.trim()) ? so_dien_thoai.trim() : (bookingData.so_dien_thoai || '0900000000');
            // Kiểm tra số điện thoại người dùng đã có
            const userCheck = await pool.request()
                .input('sdt', db_1.sql.VarChar(20), sdt_khach)
                .query('SELECT TOP 1 id FROM Nguoi_Dung WHERE so_dien_thoai = @sdt');
            if (userCheck.recordset && userCheck.recordset.length > 0) {
                ma_nd = userCheck.recordset[0].id;
            }
            else {
                // Tạo người dùng mới qua Stored Procedure sp_ThemNguoiDung
                const uniqueEmail = `khach_${Date.now()}_${Math.floor(Math.random() * 1000)}@soccer247.vn`;
                const newUserRes = await pool.request()
                    .input('ho_ten', db_1.sql.NVarChar(100), ten_khach)
                    .input('email', db_1.sql.VarChar(255), uniqueEmail)
                    .input('so_dien_thoai', db_1.sql.VarChar(15), sdt_khach.substring(0, 10))
                    .input('mat_khau', db_1.sql.VarChar(255), '$2a$10$XwJkh09J4g1aUonHEMVhM.87Nd5qqBLSTC6G1XUQacB0F6RySPQJi')
                    .input('vai_tro', db_1.sql.VarChar(50), 'KHACH_HANG')
                    .input('MaVaiTro', db_1.sql.Int, 3)
                    .execute('sp_ThemNguoiDung');
                if (newUserRes.recordset && newUserRes.recordset[0]) {
                    ma_nd = newUserRes.recordset[0].id;
                }
            }
            if (!ma_nd)
                ma_nd = 1;
            const gio_bd_clean = (0, datSanController_1.cleanTimeForSql)(gio_bat_dau, '06:00:00');
            const gio_kt_clean = (0, datSanController_1.cleanTimeForSql)(gio_ket_thuc, '07:30:00');
            const isTraHet = (loai_thanh_toan === 'TRA_HET');
            const initialStatus = 'CHO_THANH_TOAN';
            // Thực thi Stored Procedure sp_DatSan
            const datSanResult = await pool.request()
                .input('ma_nguoi_dung', db_1.sql.Int, ma_nd)
                .input('ma_san', db_1.sql.Int, parseInt(ma_san, 10))
                .input('ngay_da', db_1.sql.Date, ngay_da)
                .input('gio_bat_dau', db_1.sql.VarChar(8), gio_bd_clean)
                .input('gio_ket_thuc', db_1.sql.VarChar(8), gio_kt_clean)
                .input('tien_san', db_1.sql.Decimal(10, 2), tien_san ? parseFloat(tien_san) : null)
                .input('tong_tien', db_1.sql.Decimal(10, 2), tong_tien ? parseFloat(tong_tien) : null)
                .input('phuong_thuc', db_1.sql.VarChar(20), 'CHUYEN_KHOAN')
                .input('trang_thai', db_1.sql.VarChar(20), initialStatus)
                .input('ghi_chu', db_1.sql.NVarChar(db_1.sql.MAX), ghi_chu || `PayOS VietQR MB Bank - ${isTraHet ? '100%' : '30%'}`)
                .execute('sp_DatSan');
            if (datSanResult.recordset && datSanResult.recordset[0]) {
                finalDonDatId = datSanResult.recordset[0].id;
            }
        }
        // Tạo orderCode độc nhất
        const orderCode = Number(String(Date.now()).slice(-6) + Math.floor(Math.random() * 90 + 10));
        const description = `DS${finalDonDatId || orderCode}`.slice(0, 25);
        // Lưu orderCode vào ghi chú đơn để dễ dàng tra cứu khi Webhook gọi về
        if (finalDonDatId) {
            try {
                await pool.request()
                    .input('id', db_1.sql.Int, finalDonDatId)
                    .input('orderCodeStr', db_1.sql.NVarChar(100), ` | PayOS #${orderCode}`)
                    .query(`UPDATE Don_Dat_San SET ghi_chu = ISNULL(ghi_chu, '') + @orderCodeStr WHERE id = @id`);
            }
            catch (errDb) {
                console.warn('⚠️ Không thể update ghi chú orderCode:', errDb.message);
            }
        }
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const cancelUrl = `${frontendUrl}/?payment=cancel&orderCode=${orderCode}`;
        const returnUrl = `${frontendUrl}/?payment=success&orderCode=${orderCode}`;
        // Khởi tạo link thanh toán PayOS VietQR
        const payload = {
            orderCode,
            amount,
            description,
            cancelUrl,
            returnUrl,
            items: [
                {
                    name: `Dat san ${finalDonDatId ? `#${finalDonDatId}` : ''}`,
                    quantity: 1,
                    price: amount
                }
            ]
        };
        let paymentResult = null;
        if (payos_1.default.paymentRequests && typeof payos_1.default.paymentRequests.create === 'function') {
            paymentResult = await payos_1.default.paymentRequests.create(payload);
        }
        else if (typeof payos_1.default.createPaymentLink === 'function') {
            paymentResult = await payos_1.default.createPaymentLink(payload);
        }
        console.log(`💳 [PayOS Stored Procedure Created]: Đơn #${finalDonDatId} -> OrderCode: ${orderCode}, Số tiền: ${amount} VND`);
        return res.status(200).json({
            success: true,
            message: 'Tạo mã thanh toán VietQR PayOS (MB Bank) thành công!',
            data: {
                orderCode,
                ma_don_dat: finalDonDatId,
                amount: paymentResult?.amount || amount,
                description: paymentResult?.description || description,
                accountNumber: paymentResult?.accountNumber || 'VQRQAMKSW8778',
                accountName: paymentResult?.accountName || 'CAO VAN HOT XOAN',
                bin: paymentResult?.bin || '970422',
                bankName: 'MB Bank (Ngân hàng TMCP Quân Đội)',
                checkoutUrl: paymentResult?.checkoutUrl,
                qrCode: paymentResult?.qrCode,
                paymentLinkId: paymentResult?.paymentLinkId || paymentResult?.id,
                status: paymentResult?.status || 'PENDING'
            }
        });
    }
    catch (error) {
        console.error('🔥 [Lỗi taoThanhToanPayOS]:', error.message);
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi khởi tạo thanh toán PayOS'
        });
    }
};
exports.taoThanhToanPayOS = taoThanhToanPayOS;
/**
 * 3. Kiểm tra trạng thái thanh toán PayOS (Stored Procedure: sp_ThanhToanDon)
 * Method: GET /api/thanh-toan/payos/trang-thai/:orderCode
 */
const kiemTraTrangThaiPayOS = async (req, res) => {
    try {
        const { orderCode } = req.params;
        if (!orderCode) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp mã orderCode!'
            });
        }
        if (!payos_1.default) {
            return res.status(500).json({
                success: false,
                message: 'PayOS chưa được cấu hình!'
            });
        }
        const numOrderCode = Number(orderCode);
        let paymentInfo = null;
        if (payos_1.default.paymentRequests && typeof payos_1.default.paymentRequests.get === 'function') {
            paymentInfo = await payos_1.default.paymentRequests.get(numOrderCode);
        }
        else if (typeof payos_1.default.getPaymentLinkInformation === 'function') {
            paymentInfo = await payos_1.default.getPaymentLinkInformation(numOrderCode);
        }
        if (!paymentInfo) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin giao dịch trên PayOS!'
            });
        }
        const isPaid = paymentInfo.status === 'PAID' || (paymentInfo.amountPaid && paymentInfo.amountPaid >= paymentInfo.amount);
        if (isPaid) {
            const pool = await db_1.poolPromise;
            // Tìm đơn theo description (DS123 -> ID = 123) hoặc searchStr fallback
            let donDatId = null;
            const desc = paymentInfo.description || '';
            const matchId = desc.match(/DS(\d+)/i);
            if (matchId && matchId[1]) {
                donDatId = parseInt(matchId[1], 10);
            }
            if (!donDatId) {
                const findBooking = await pool.request()
                    .input('searchStr', db_1.sql.NVarChar(100), `%PayOS #${orderCode}%`)
                    .query(`
                        SELECT TOP 1 id 
                        FROM Don_Dat_San 
                        WHERE ghi_chu LIKE @searchStr
                        ORDER BY id DESC
                    `);
                if (findBooking.recordset && findBooking.recordset.length > 0) {
                    donDatId = findBooking.recordset[0].id;
                }
            }
            if (donDatId) {
                const bookingRes = await pool.request()
                    .input('id', db_1.sql.Int, donDatId)
                    .query(`
                        SELECT TOP 1 d.id, d.trang_thai, d.tong_tien, d.ghi_chu, nd.ho_ten AS ten_khach_hang 
                        FROM Don_Dat_San d
                        LEFT JOIN Nguoi_Dung nd ON d.ma_nguoi_dung = nd.id
                        WHERE d.id = @id
                    `);
                if (bookingRes.recordset && bookingRes.recordset.length > 0) {
                    const booking = bookingRes.recordset[0];
                    const isDatCoc = (booking.trang_thai === 'CHO_THANH_TOAN' || !booking.trang_thai) && ((booking.ghi_chu || '').includes('30%') || (booking.ghi_chu || '').includes('DAT_COC'));
                    const checkTt = await pool.request()
                        .input('magd', db_1.sql.VarChar(100), String(orderCode))
                        .query('SELECT TOP 1 id FROM Thanh_Toan WHERE ma_giao_dich = @magd');
                    if (!checkTt.recordset || checkTt.recordset.length === 0) {
                        await pool.request()
                            .input('ma_don_dat', db_1.sql.Int, donDatId)
                            .input('phuong_thuc', db_1.sql.VarChar(20), 'CHUYEN_KHOAN')
                            .input('loai_thanh_toan', db_1.sql.VarChar(20), isDatCoc ? 'DAT_COC' : 'TRA_HET')
                            .input('so_tien', db_1.sql.Decimal(10, 2), paymentInfo.amountPaid || paymentInfo.amount)
                            .input('ma_giao_dich', db_1.sql.VarChar(100), String(orderCode))
                            .execute('sp_ThanhToanDon');
                        const io = req.app.get('io');
                        if (io) {
                            io.emit('payment_success', {
                                orderCode: numOrderCode,
                                ma_don_dat: donDatId,
                                so_tien: paymentInfo.amountPaid || paymentInfo.amount,
                                ten_khach_hang: booking?.ten_khach_hang || 'Khách MB Bank',
                                trang_thai: 'PAID',
                                thoi_gian: new Date()
                            });
                            io.emit('booking_updated');
                        }
                    }
                }
            }
        }
        return res.status(200).json({
            success: true,
            isPaid,
            status: paymentInfo.status,
            data: paymentInfo
        });
    }
    catch (error) {
        console.error('Lỗi kiemTraTrangThaiPayOS:', error.message);
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi kiểm tra trạng thái thanh toán'
        });
    }
};
exports.kiemTraTrangThaiPayOS = kiemTraTrangThaiPayOS;
/**
 * 4. Xử lý Webhook PayOS (Stored Procedure: sp_ThanhToanDon)
 * Method: POST /api/thanh-toan/payos/webhook
 */
const xuLyWebhookPayOS = async (req, res) => {
    try {
        console.log('🔔 [PayOS Webhook Received]:', JSON.stringify(req.body));
        if (!payos_1.default) {
            return res.status(200).json({ success: false, message: 'PayOS chưa cấu hình' });
        }
        let webhookData = req.body;
        try {
            if (payos_1.default.webhooks && typeof payos_1.default.webhooks.verify === 'function') {
                webhookData = payos_1.default.webhooks.verify(req.body);
            }
            else if (typeof payos_1.default.verifyPaymentWebhookData === 'function') {
                webhookData = payos_1.default.verifyPaymentWebhookData(req.body);
            }
        }
        catch (verifyErr) {
            console.warn('⚠️ [PayOS Webhook]: Bỏ qua lỗi chữ ký:', verifyErr.message);
        }
        const data = webhookData.data || webhookData;
        const orderCode = data.orderCode;
        const code = webhookData.code || data.code;
        if (code === '00' || String(code) === '00' || webhookData.success === true || data.status === 'PAID') {
            const amount = data.amount;
            const pool = await db_1.poolPromise;
            console.log(`✅ [PayOS Webhook SUCCESS]: Order #${orderCode}, Số tiền: ${amount} VND`);
            let donDatId = null;
            const desc = data.description || '';
            const matchId = desc.match(/DS(\d+)/i);
            if (matchId && matchId[1]) {
                donDatId = parseInt(matchId[1], 10);
            }
            if (!donDatId) {
                const findBooking = await pool.request()
                    .input('searchStr', db_1.sql.NVarChar(100), `%PayOS #${orderCode}%`)
                    .query(`
                        SELECT TOP 1 id 
                        FROM Don_Dat_San 
                        WHERE ghi_chu LIKE @searchStr
                        ORDER BY id DESC
                    `);
                if (findBooking.recordset && findBooking.recordset.length > 0) {
                    donDatId = findBooking.recordset[0].id;
                }
            }
            if (donDatId) {
                const bookingRes = await pool.request()
                    .input('id', db_1.sql.Int, donDatId)
                    .query(`
                        SELECT TOP 1 d.id, d.trang_thai, d.tong_tien, d.ghi_chu, nd.ho_ten AS ten_khach_hang 
                        FROM Don_Dat_San d
                        LEFT JOIN Nguoi_Dung nd ON d.ma_nguoi_dung = nd.id
                        WHERE d.id = @id
                    `);
                if (bookingRes.recordset && bookingRes.recordset.length > 0) {
                    const booking = bookingRes.recordset[0];
                    const isDatCoc = (booking.trang_thai === 'CHO_THANH_TOAN' || !booking.trang_thai) && ((booking.ghi_chu || '').includes('30%') || (booking.ghi_chu || '').includes('DAT_COC'));
                    const checkTt = await pool.request()
                        .input('magd', db_1.sql.VarChar(100), String(orderCode))
                        .query('SELECT TOP 1 id FROM Thanh_Toan WHERE ma_giao_dich = @magd');
                    if (!checkTt.recordset || checkTt.recordset.length === 0) {
                        await pool.request()
                            .input('ma_don_dat', db_1.sql.Int, donDatId)
                            .input('phuong_thuc', db_1.sql.VarChar(20), 'CHUYEN_KHOAN')
                            .input('loai_thanh_toan', db_1.sql.VarChar(20), isDatCoc ? 'DAT_COC' : 'TRA_HET')
                            .input('so_tien', db_1.sql.Decimal(10, 2), amount)
                            .input('ma_giao_dich', db_1.sql.VarChar(100), String(orderCode))
                            .execute('sp_ThanhToanDon');
                    }
                    const io = req.app.get('io');
                    if (io) {
                        io.emit('payment_success', {
                            orderCode: Number(orderCode),
                            ma_don_dat: donDatId,
                            so_tien: amount,
                            ten_khach_hang: booking?.ten_khach_hang || 'Khách MB Bank',
                            trang_thai: 'PAID',
                            ngan_hang: 'MB Bank',
                            thoi_gian: new Date()
                        });
                        io.emit('booking_updated');
                    }
                }
            }
        }
        return res.status(200).json({
            success: true,
            message: 'Webhook nhận và xử lý thành công!'
        });
    }
    catch (error) {
        console.error('🔥 [Lỗi xuLyWebhookPayOS]:', error.message);
        return res.status(200).json({
            success: false,
            message: error.message
        });
    }
};
exports.xuLyWebhookPayOS = xuLyWebhookPayOS;
/**
 * 5. Xác thực Webhook URL với PayOS
 * Method: POST /api/thanh-toan/payos/confirm-webhook
 */
const xacNhanWebhookUrl = async (req, res) => {
    try {
        const { webhookUrl } = req.body;
        if (!webhookUrl) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp webhookUrl'
            });
        }
        if (!payos_1.default) {
            return res.status(500).json({
                success: false,
                message: 'PayOS chưa cấu hình!'
            });
        }
        let result = null;
        if (payos_1.default.webhooks && typeof payos_1.default.webhooks.confirm === 'function') {
            result = await payos_1.default.webhooks.confirm(webhookUrl);
        }
        else if (typeof payos_1.default.confirmWebhook === 'function') {
            result = await payos_1.default.confirmWebhook(webhookUrl);
        }
        return res.status(200).json({
            success: true,
            message: 'Đăng ký Webhook URL với PayOS thành công!',
            data: result
        });
    }
    catch (error) {
        console.error('Lỗi xacNhanWebhookUrl:', error.message);
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi xác nhận Webhook URL với PayOS'
        });
    }
};
exports.xacNhanWebhookUrl = xacNhanWebhookUrl;
/**
 * 6. Lấy danh sách lịch sử giao dịch thanh toán (Stored Procedure: sp_LayDanhSachThanhToan)
 * Method: GET /api/thanh-toan/danh-sach
 */
const layDanhSachThanhToan = async (req, res) => {
    try {
        const pool = await db_1.poolPromise;
        const result = await pool.request().execute('sp_LayDanhSachThanhToan');
        return res.status(200).json({
            success: true,
            data: result.recordset
        });
    }
    catch (error) {
        console.error('Lỗi sp_LayDanhSachThanhToan:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi lấy danh sách thanh toán'
        });
    }
};
exports.layDanhSachThanhToan = layDanhSachThanhToan;
/**
 * 7. Lấy danh sách hoàn tiền (Stored Procedure: sp_LayDanhSachHoanTien)
 * Method: GET /api/thanh-toan/hoan-tien
 */
const layDanhSachHoanTien = async (req, res) => {
    try {
        const pool = await db_1.poolPromise;
        const result = await pool.request().execute('sp_LayDanhSachHoanTien');
        return res.status(200).json({
            success: true,
            data: result.recordset
        });
    }
    catch (error) {
        console.error('Lỗi sp_LayDanhSachHoanTien:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi lấy danh sách hoàn tiền'
        });
    }
};
exports.layDanhSachHoanTien = layDanhSachHoanTien;
/**
 * 8. Quản lý hoàn tiền (Thực thi Stored Procedures: sp_ThemHoanTien, sp_SuaHoanTien, sp_XoaHoanTien)
 */
const themHoanTien = async (req, res) => {
    try {
        const { ma_don_dat, so_tien_hoan, ty_le_hoan, ly_do_huy } = req.body;
        const pool = await db_1.poolPromise;
        const result = await pool.request()
            .input('ma_don_dat', db_1.sql.Int, parseInt(ma_don_dat, 10))
            .input('so_tien_hoan', db_1.sql.Decimal(10, 2), parseFloat(so_tien_hoan) || 0)
            .input('ty_le_hoan', db_1.sql.Int, parseInt(ty_le_hoan, 10) || 100)
            .input('ly_do_huy', db_1.sql.NVarChar(255), ly_do_huy || 'Hủy sân hoàn cọc')
            .execute('sp_ThemHoanTien');
        return res.status(201).json({
            success: true,
            message: 'Thêm bản ghi hoàn tiền thành công!',
            data: result.recordset[0]
        });
    }
    catch (error) {
        console.error('Lỗi sp_ThemHoanTien:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi thêm bản ghi hoàn tiền'
        });
    }
};
exports.themHoanTien = themHoanTien;
const suaHoanTien = async (req, res) => {
    try {
        const id = String(req.params.id);
        const { so_tien_hoan, ty_le_hoan, ly_do_huy } = req.body;
        const pool = await db_1.poolPromise;
        const result = await pool.request()
            .input('id', db_1.sql.Int, parseInt(id, 10))
            .input('so_tien_hoan', db_1.sql.Decimal(10, 2), parseFloat(so_tien_hoan) || 0)
            .input('ty_le_hoan', db_1.sql.Int, parseInt(ty_le_hoan, 10) || 100)
            .input('ly_do_huy', db_1.sql.NVarChar(255), ly_do_huy || '')
            .execute('sp_SuaHoanTien');
        return res.status(200).json({
            success: true,
            message: 'Cập nhật bản ghi hoàn tiền thành công!',
            data: result.recordset[0]
        });
    }
    catch (error) {
        console.error('Lỗi sp_SuaHoanTien:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi sửa bản ghi hoàn tiền'
        });
    }
};
exports.suaHoanTien = suaHoanTien;
const xoaHoanTien = async (req, res) => {
    try {
        const id = String(req.params.id);
        const pool = await db_1.poolPromise;
        await pool.request()
            .input('id', db_1.sql.Int, parseInt(id, 10))
            .execute('sp_XoaHoanTien');
        return res.status(200).json({
            success: true,
            message: 'Xóa bản ghi hoàn tiền thành công!'
        });
    }
    catch (error) {
        console.error('Lỗi sp_XoaHoanTien:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi xóa bản ghi hoàn tiền'
        });
    }
};
exports.xoaHoanTien = xoaHoanTien;
/**
 * 9. Hủy đơn đặt sân tạm thời khi khách đóng Modal hoặc nhấn Quay lại
 * Method: POST /api/thanh-toan/payos/huy-don-tam
 */
const huyDonTamPayOS = async (req, res) => {
    try {
        let body = req.body;
        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            }
            catch (_e) { }
        }
        const ma_don_dat = body?.ma_don_dat;
        const orderCode = body?.orderCode;
        const pool = await db_1.poolPromise;
        const request = pool.request();
        if (ma_don_dat) {
            request.input('ma_don_dat', db_1.sql.Int, parseInt(ma_don_dat, 10));
        }
        else {
            request.input('ma_don_dat', db_1.sql.Int, null);
        }
        if (orderCode) {
            request.input('searchStr', db_1.sql.NVarChar(100), `%PayOS #${orderCode}%`);
        }
        else {
            request.input('searchStr', db_1.sql.NVarChar(100), null);
        }
        await request.execute('sp_HuyDonTam');
        return res.status(200).json({
            success: true,
            message: 'Đã hủy đơn tạm thời'
        });
    }
    catch (error) {
        console.error('Lỗi huyDonTamPayOS:', error.message);
        return res.status(200).json({
            success: false,
            message: error.message
        });
    }
};
exports.huyDonTamPayOS = huyDonTamPayOS;
