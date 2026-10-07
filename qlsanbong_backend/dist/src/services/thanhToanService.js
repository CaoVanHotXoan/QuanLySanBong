"use strict";
/**
 * =====================================================================
 * SERVICE: THANH TOÁN & GIAO DỊCH (THANH TOAN SERVICE)
 * Xử lý thanh toán SQL Server và cổng thanh toán PayOS
 * =====================================================================
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.huyPaymentLinkPayOS = exports.layThongTinThanhToanPayOS = exports.taoPaymentLinkPayOS = exports.layDanhSachHoanTien = exports.layDanhSachThanhToan = exports.thanhToanDonDat = void 0;
const db_1 = require("../config/db");
const payos_1 = __importDefault(require("../config/payos"));
const thanhToanDonDat = async (params) => {
    const pool = await db_1.poolPromise;
    const result = await pool.request()
        .input('ma_don_dat', db_1.sql.Int, params.ma_don_dat)
        .input('phuong_thuc', db_1.sql.VarChar(20), params.phuong_thuc)
        .input('loai_thanh_toan', db_1.sql.VarChar(20), params.loai_thanh_toan)
        .input('so_tien', db_1.sql.Decimal(10, 2), params.so_tien)
        .input('ma_giao_dich', db_1.sql.VarChar(100), params.ma_giao_dich || null)
        .execute('sp_ThanhToanDon');
    return result.recordset[0];
};
exports.thanhToanDonDat = thanhToanDonDat;
const layDanhSachThanhToan = async () => {
    const pool = await db_1.poolPromise;
    const result = await pool.request().execute('sp_LayDanhSachThanhToan');
    return result.recordset || [];
};
exports.layDanhSachThanhToan = layDanhSachThanhToan;
const layDanhSachHoanTien = async () => {
    const pool = await db_1.poolPromise;
    const result = await pool.request().execute('sp_LayDanhSachHoanTien');
    return result.recordset || [];
};
exports.layDanhSachHoanTien = layDanhSachHoanTien;
const taoPaymentLinkPayOS = async (paymentData) => {
    return await payos_1.default.createPaymentLink(paymentData);
};
exports.taoPaymentLinkPayOS = taoPaymentLinkPayOS;
const layThongTinThanhToanPayOS = async (orderCode) => {
    return await payos_1.default.getPaymentLinkInformation(orderCode);
};
exports.layThongTinThanhToanPayOS = layThongTinThanhToanPayOS;
const huyPaymentLinkPayOS = async (orderCode, cancellationReason) => {
    return await payos_1.default.cancelPaymentLink(orderCode, cancellationReason);
};
exports.huyPaymentLinkPayOS = huyPaymentLinkPayOS;
