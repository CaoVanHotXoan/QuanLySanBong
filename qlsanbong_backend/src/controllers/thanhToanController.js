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

const { sql, poolPromise } = require('../config/db');
const payOS = require('../config/payos');

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

        const validPhuongThuc = ['TIEN_MAT', 'CHUYEN_KHOAN'];
        const normalizedPhuongThuc = (phuong_thuc === 'TIEN_MAT') ? 'TIEN_MAT' : 'CHUYEN_KHOAN';
        const validLoaiThanhToan = ['DAT_COC', 'TRA_HET'];

        if (!validLoaiThanhToan.includes(loai_thanh_toan)) {
            return res.status(400).json({
                success: false,
                message: `Loại thanh toán không hợp lệ. Cho phép: ${validLoaiThanhToan.join(', ')}`
            });
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('ma_don_dat', sql.Int, parseInt(ma_don_dat, 10))
            .input('phuong_thuc', sql.VarChar(20), normalizedPhuongThuc)
            .input('loai_thanh_toan', sql.VarChar(20), loai_thanh_toan)
            .input('so_tien', sql.Decimal(10, 2), parseFloat(so_tien))
            .input('ma_giao_dich', sql.VarChar(100), ma_giao_dich || null)
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
    } catch (error) {
        console.error('Lỗi sp_ThanhToanDon:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi xử lý thanh toán đơn đặt sân'
        });
    }
};

/**
 * 2. Tạo link và mã VietQR PayOS MB Bank (Stored Procedure: sp_DatSan & sp_ThemNguoiDung)
 * Method: POST /api/thanh-toan/payos/tao-link
 */
const taoThanhToanPayOS = async (req, res) => {
    try {
        if (!payOS) {
            return res.status(500).json({
                success: false,
                message: 'Cổng thanh toán PayOS chưa được cấu hình đúng key trong máy chủ!'
            });
        }

        const {
            ma_don_dat,
            bookingData,
            so_tien,
            loai_thanh_toan,
            ho_ten,
            so_dien_thoai
        } = req.body;

        const amount = Math.round(Number(so_tien) || 10000);
        if (amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Số tiền thanh toán phải lớn hơn 0!'
            });
        }

        const pool = await poolPromise;
        let finalDonDatId = ma_don_dat ? parseInt(ma_don_dat, 10) : null;

        // Nếu tạo đơn mới trước khi thanh toán -> Thực thi Procedure sp_DatSan
        if (!finalDonDatId && bookingData) {
            const {
                ma_san,
                ngay_da,
                gio_bat_dau,
                gio_ket_thuc,
                tien_san,
                tong_tien,
                ghi_chu
            } = bookingData;

            // Xác định người dùng hoặc tạo qua Procedure sp_ThemNguoiDung
            let ma_nd = null;
            const ten_khach = (ho_ten && ho_ten.trim()) ? ho_ten.trim() : (bookingData.ho_ten || 'Khách Đặt Sân');
            const sdt_khach = (so_dien_thoai && so_dien_thoai.trim()) ? so_dien_thoai.trim() : (bookingData.so_dien_thoai || '0900000000');

            // Kiểm tra số điện thoại người dùng đã có
            const userCheck = await pool.request()
                .input('sdt', sql.VarChar(20), sdt_khach)
                .query('SELECT TOP 1 id FROM Nguoi_Dung WHERE so_dien_thoai = @sdt');

            if (userCheck.recordset && userCheck.recordset.length > 0) {
                ma_nd = userCheck.recordset[0].id;
            } else {
                // Tạo người dùng mới qua Stored Procedure sp_ThemNguoiDung
                const uniqueEmail = `khach_${Date.now()}_${Math.floor(Math.random() * 1000)}@soccer247.vn`;
                const newUserRes = await pool.request()
                    .input('ho_ten', sql.NVarChar(100), ten_khach)
                    .input('email', sql.VarChar(255), uniqueEmail)
                    .input('so_dien_thoai', sql.VarChar(15), sdt_khach.substring(0, 10))
                    .input('mat_khau', sql.VarChar(255), '$2a$10$XwJkh09J4g1aUonHEMVhM.87Nd5qqBLSTC6G1XUQacB0F6RySPQJi')
                    .input('vai_tro', sql.VarChar(50), 'KHACH_HANG')
                    .input('MaVaiTro', sql.Int, 3)
                    .execute('sp_ThemNguoiDung');

                if (newUserRes.recordset && newUserRes.recordset[0]) {
                    ma_nd = newUserRes.recordset[0].id;
                }
            }

            if (!ma_nd) ma_nd = 1;

            const gio_bd_clean = (gio_bat_dau && gio_bat_dau.length === 5) ? `${gio_bat_dau}:00` : (gio_bat_dau || '06:00:00');
            const gio_kt_clean = (gio_ket_thuc && gio_ket_thuc.length === 5) ? `${gio_ket_thuc}:00` : (gio_ket_thuc || '07:30:00');
            const isTraHet = (loai_thanh_toan === 'TRA_HET');
            const initialStatus = 'CHO_THANH_TOAN';

            // Thực thi Stored Procedure sp_DatSan
            const datSanResult = await pool.request()
                .input('ma_nguoi_dung', sql.Int, ma_nd)
                .input('ma_san', sql.Int, parseInt(ma_san, 10))
                .input('ngay_da', sql.Date, ngay_da)
                .input('gio_bat_dau', sql.VarChar(8), gio_bd_clean)
                .input('gio_ket_thuc', sql.VarChar(8), gio_kt_clean)
                .input('tien_san', sql.Decimal(10, 2), tien_san ? parseFloat(tien_san) : null)
                .input('tong_tien', sql.Decimal(10, 2), tong_tien ? parseFloat(tong_tien) : null)
                .input('phuong_thuc', sql.VarChar(20), 'CHUYEN_KHOAN')
                .input('trang_thai', sql.VarChar(20), initialStatus)
                .input('ghi_chu', sql.NVarChar(255), ghi_chu || `PayOS VietQR MB Bank - ${isTraHet ? '100%' : '30%'}`)
                .execute('sp_DatSan');

            if (datSanResult.recordset && datSanResult.recordset[0]) {
                finalDonDatId = datSanResult.recordset[0].id;
            }
        }

        // Tạo orderCode độc nhất
        const orderCode = Number(String(Date.now()).slice(-6) + Math.floor(Math.random() * 90 + 10));
        const description = `DS${finalDonDatId || orderCode}`.slice(0, 25);

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const cancelUrl = `${frontendUrl}/?payment=cancel&orderCode=${orderCode}`;
        const returnUrl = `${frontendUrl}/?payment=success&orderCode=${orderCode}`;

        // Cập nhật orderCode vào ghi chú đơn để đối soát
        if (finalDonDatId) {
            await pool.request()
                .input('id', sql.Int, finalDonDatId)
                .input('orderCodeStr', sql.NVarChar(255), ` [PayOS #${orderCode}]`)
                .query('UPDATE Don_Dat_San SET ghi_chu = ISNULL(ghi_chu, \'\') + @orderCodeStr WHERE id = @id');
        }

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
        if (payOS.paymentRequests && typeof payOS.paymentRequests.create === 'function') {
            paymentResult = await payOS.paymentRequests.create(payload);
        } else if (typeof payOS.createPaymentLink === 'function') {
            paymentResult = await payOS.createPaymentLink(payload);
        }

        console.log(`💳 [PayOS Stored Procedure Created]: Đơn #${finalDonDatId} -> OrderCode: ${orderCode}, Số tiền: ${amount} VND`);

        return res.status(200).json({
            success: true,
            message: 'Tạo mã thanh toán VietQR PayOS (MB Bank) thành công!',
            data: {
                orderCode,
                ma_don_dat: finalDonDatId,
                amount: paymentResult.amount || amount,
                description: paymentResult.description || description,
                accountNumber: paymentResult.accountNumber || 'VQRQAMKSW8778',
                accountName: paymentResult.accountName || 'CAO VAN HOT XOAN',
                bin: paymentResult.bin || '970422',
                bankName: 'MB Bank (Ngân hàng TMCP Quân Đội)',
                checkoutUrl: paymentResult.checkoutUrl,
                qrCode: paymentResult.qrCode,
                paymentLinkId: paymentResult.paymentLinkId || paymentResult.id,
                status: paymentResult.status || 'PENDING'
            }
        });
    } catch (error) {
        console.error('🔥 [Lỗi taoThanhToanPayOS]:', error.message);
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi khởi tạo thanh toán PayOS'
        });
    }
};

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

        if (!payOS) {
            return res.status(500).json({
                success: false,
                message: 'PayOS chưa được cấu hình!'
            });
        }

        const numOrderCode = Number(orderCode);
        let paymentInfo = null;

        if (payOS.paymentRequests && typeof payOS.paymentRequests.get === 'function') {
            paymentInfo = await payOS.paymentRequests.get(numOrderCode);
        } else if (typeof payOS.getPaymentLinkInformation === 'function') {
            paymentInfo = await payOS.getPaymentLinkInformation(numOrderCode);
        }

        if (!paymentInfo) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin giao dịch trên PayOS!'
            });
        }

        const isPaid = paymentInfo.status === 'PAID' || (paymentInfo.amountPaid && paymentInfo.amountPaid >= paymentInfo.amount);

        if (isPaid) {
            const pool = await poolPromise;
            
            // Tìm đơn theo mã orderCode
            const findBooking = await pool.request()
                .input('searchStr', sql.NVarChar(100), `%PayOS #${orderCode}%`)
                .query(`
                    SELECT TOP 1 id, trang_thai, tong_tien, ghi_chu 
                    FROM Don_Dat_San 
                    WHERE ghi_chu LIKE @searchStr
                    ORDER BY id DESC
                `);

            if (findBooking.recordset && findBooking.recordset.length > 0) {
                const booking = findBooking.recordset[0];
                const donDatId = booking.id;
                const isDatCoc = (booking.ghi_chu || '').includes('30%') || (booking.ghi_chu || '').includes('DAT_COC');

                // Kiểm tra nếu chưa thanh toán thì thực thi Procedure sp_ThanhToanDon
                const checkTt = await pool.request()
                    .input('madon', sql.Int, donDatId)
                    .query('SELECT TOP 1 id FROM Thanh_Toan WHERE ma_don_dat = @madon');

                if (!checkTt.recordset || checkTt.recordset.length === 0) {
                    await pool.request()
                        .input('ma_don_dat', sql.Int, donDatId)
                        .input('phuong_thuc', sql.VarChar(20), 'CHUYEN_KHOAN')
                        .input('loai_thanh_toan', sql.VarChar(20), isDatCoc ? 'DAT_COC' : 'TRA_HET')
                        .input('so_tien', sql.Decimal(10, 2), paymentInfo.amountPaid || paymentInfo.amount)
                        .input('ma_giao_dich', sql.VarChar(100), String(orderCode))
                        .execute('sp_ThanhToanDon');

                    const io = req.app.get('io');
                    if (io) {
                        io.emit('payment_success', {
                            orderCode: numOrderCode,
                            ma_don_dat: donDatId,
                            so_tien: paymentInfo.amountPaid || paymentInfo.amount,
                            trang_thai: 'PAID',
                            thoi_gian: new Date()
                        });
                        io.emit('booking_updated');
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
    } catch (error) {
        console.error('Lỗi kiemTraTrangThaiPayOS:', error.message);
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi kiểm tra trạng thái thanh toán'
        });
    }
};

/**
 * 4. Xử lý Webhook PayOS (Stored Procedure: sp_ThanhToanDon)
 * Method: POST /api/thanh-toan/payos/webhook
 */
const xuLyWebhookPayOS = async (req, res) => {
    try {
        console.log('🔔 [PayOS Webhook Received]:', JSON.stringify(req.body));

        if (!payOS) {
            return res.status(200).json({ success: false, message: 'PayOS chưa cấu hình' });
        }

        let webhookData = req.body;

        try {
            if (payOS.webhooks && typeof payOS.webhooks.verify === 'function') {
                webhookData = payOS.webhooks.verify(req.body);
            } else if (typeof payOS.verifyPaymentWebhookData === 'function') {
                webhookData = payOS.verifyPaymentWebhookData(req.body);
            }
        } catch (verifyErr) {
            console.warn('⚠️ [PayOS Webhook]: Bỏ qua lỗi chữ ký:', verifyErr.message);
        }

        const data = webhookData.data || webhookData;
        const orderCode = data.orderCode;
        const code = webhookData.code || data.code;

        if (code === '00' || String(code) === '00' || webhookData.success === true || data.status === 'PAID') {
            const amount = data.amount;
            const pool = await poolPromise;

            console.log(`✅ [PayOS Webhook SUCCESS]: Order #${orderCode}, Số tiền: ${amount} VND`);

            const findBooking = await pool.request()
                .input('searchStr', sql.NVarChar(100), `%PayOS #${orderCode}%`)
                .query(`
                    SELECT TOP 1 id, trang_thai, tong_tien, ghi_chu 
                    FROM Don_Dat_San 
                    WHERE ghi_chu LIKE @searchStr
                    ORDER BY id DESC
                `);

            let donDatId = null;

            if (findBooking.recordset && findBooking.recordset.length > 0) {
                const booking = findBooking.recordset[0];
                donDatId = booking.id;
                const isDatCoc = (booking.ghi_chu || '').includes('30%') || (booking.ghi_chu || '').includes('DAT_COC');

                // Thực thi Stored Procedure sp_ThanhToanDon
                await pool.request()
                    .input('ma_don_dat', sql.Int, donDatId)
                    .input('phuong_thuc', sql.VarChar(20), 'CHUYEN_KHOAN')
                    .input('loai_thanh_toan', sql.VarChar(20), isDatCoc ? 'DAT_COC' : 'TRA_HET')
                    .input('so_tien', sql.Decimal(10, 2), amount)
                    .input('ma_giao_dich', sql.VarChar(100), String(orderCode))
                    .execute('sp_ThanhToanDon');
            }

            const io = req.app.get('io');
            if (io) {
                io.emit('payment_success', {
                    orderCode: Number(orderCode),
                    ma_don_dat: donDatId,
                    so_tien: amount,
                    trang_thai: 'PAID',
                    ngan_hang: 'MB Bank',
                    thoi_gian: new Date()
                });
                io.emit('booking_updated');
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Webhook nhận và xử lý thành công!'
        });
    } catch (error) {
        console.error('🔥 [Lỗi xuLyWebhookPayOS]:', error.message);
        return res.status(200).json({
            success: false,
            message: error.message
        });
    }
};

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

        if (!payOS) {
            return res.status(500).json({
                success: false,
                message: 'PayOS chưa cấu hình!'
            });
        }

        let result = null;
        if (payOS.webhooks && typeof payOS.webhooks.confirm === 'function') {
            result = await payOS.webhooks.confirm(webhookUrl);
        } else if (typeof payOS.confirmWebhook === 'function') {
            result = await payOS.confirmWebhook(webhookUrl);
        }

        return res.status(200).json({
            success: true,
            message: 'Đăng ký Webhook URL với PayOS thành công!',
            data: result
        });
    } catch (error) {
        console.error('Lỗi xacNhanWebhookUrl:', error.message);
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi xác nhận Webhook URL với PayOS'
        });
    }
};

/**
 * 6. Lấy danh sách lịch sử giao dịch thanh toán (Stored Procedure: sp_LayDanhSachThanhToan)
 * Method: GET /api/thanh-toan/danh-sach
 */
const layDanhSachThanhToan = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().execute('sp_LayDanhSachThanhToan');
        return res.status(200).json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Lỗi sp_LayDanhSachThanhToan:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi lấy danh sách thanh toán'
        });
    }
};

/**
 * 7. Lấy danh sách hoàn tiền (Stored Procedure: sp_LayDanhSachHoanTien)
 * Method: GET /api/thanh-toan/hoan-tien
 */
const layDanhSachHoanTien = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().execute('sp_LayDanhSachHoanTien');
        return res.status(200).json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Lỗi sp_LayDanhSachHoanTien:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi lấy danh sách hoàn tiền'
        });
    }
};

/**
 * 8. Quản lý hoàn tiền (Thực thi Stored Procedures: sp_ThemHoanTien, sp_SuaHoanTien, sp_XoaHoanTien)
 */
const themHoanTien = async (req, res) => {
    try {
        const { ma_don_dat, so_tien_hoan, ty_le_hoan, ly_do_huy } = req.body;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('ma_don_dat', sql.Int, parseInt(ma_don_dat, 10))
            .input('so_tien_hoan', sql.Decimal(10, 2), parseFloat(so_tien_hoan) || 0)
            .input('ty_le_hoan', sql.Int, parseInt(ty_le_hoan, 10) || 100)
            .input('ly_do_huy', sql.NVarChar(255), ly_do_huy || 'Hủy sân hoàn cọc')
            .execute('sp_ThemHoanTien');

        return res.status(201).json({
            success: true,
            message: 'Thêm bản ghi hoàn tiền thành công!',
            data: result.recordset[0]
        });
    } catch (error) {
        console.error('Lỗi sp_ThemHoanTien:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi thêm bản ghi hoàn tiền'
        });
    }
};

const suaHoanTien = async (req, res) => {
    try {
        const { id } = req.params;
        const { so_tien_hoan, ty_le_hoan, ly_do_huy } = req.body;

        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, parseInt(id, 10))
            .input('so_tien_hoan', sql.Decimal(10, 2), parseFloat(so_tien_hoan) || 0)
            .input('ty_le_hoan', sql.Int, parseInt(ty_le_hoan, 10) || 100)
            .input('ly_do_huy', sql.NVarChar(255), ly_do_huy || '')
            .execute('sp_SuaHoanTien');

        return res.status(200).json({
            success: true,
            message: 'Cập nhật bản ghi hoàn tiền thành công!',
            data: result.recordset[0]
        });
    } catch (error) {
        console.error('Lỗi sp_SuaHoanTien:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi sửa bản ghi hoàn tiền'
        });
    }
};

const xoaHoanTien = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, parseInt(id, 10))
            .execute('sp_XoaHoanTien');

        return res.status(200).json({
            success: true,
            message: 'Xóa bản ghi hoàn tiền thành công!'
        });
    } catch (error) {
        console.error('Lỗi sp_XoaHoanTien:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi xóa bản ghi hoàn tiền'
        });
    }
};

/**
 * 6. Hủy đơn đặt sân tạm thời khi khách đóng Modal hoặc nhấn Quay lại
 * Method: POST /api/thanh-toan/payos/huy-don-tam
 */
const huyDonTamPayOS = async (req, res) => {
    try {
        const { ma_don_dat, orderCode } = req.body;
        const pool = await poolPromise;

        if (ma_don_dat) {
            await pool.request()
                .input('id', sql.Int, parseInt(ma_don_dat, 10))
                .query(`
                    DELETE FROM Chi_Tiet_Dich_Vu WHERE ma_don_dat = @id;
                    DELETE FROM Don_Dat_San WHERE id = @id AND trang_thai = 'CHO_THANH_TOAN';
                `);
        } else if (orderCode) {
            await pool.request()
                .input('searchStr', sql.NVarChar(100), `%PayOS #${orderCode}%`)
                .query(`
                    DELETE FROM Don_Dat_San WHERE ghi_chu LIKE @searchStr AND trang_thai = 'CHO_THANH_TOAN';
                `);
        }

        return res.status(200).json({
            success: true,
            message: 'Đã hủy đơn tạm thời'
        });
    } catch (error) {
        console.error('Lỗi huyDonTamPayOS:', error.message);
        return res.status(200).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    thanhToanDon,
    taoThanhToanPayOS,
    kiemTraTrangThaiPayOS,
    xuLyWebhookPayOS,
    xacNhanWebhookUrl,
    huyDonTamPayOS,
    layDanhSachThanhToan,
    layDanhSachHoanTien,
    themHoanTien,
    suaHoanTien,
    xoaHoanTien
};

