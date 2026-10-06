/**
 * =====================================================================
 * SERVICE: THANH TOÁN & GIAO DỊCH (THANH TOAN SERVICE)
 * Xử lý thanh toán SQL Server và cổng thanh toán PayOS
 * =====================================================================
 */

import { sql, poolPromise } from '../config/db';
import payOS from '../config/payos';

export const thanhToanDonDat = async (params: {
    ma_don_dat: number;
    phuong_thuc: 'TIEN_MAT' | 'CHUYEN_KHOAN';
    loai_thanh_toan: 'DAT_COC' | 'TRA_HET';
    so_tien: number;
    ma_giao_dich?: string | null;
}) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('ma_don_dat', sql.Int, params.ma_don_dat)
        .input('phuong_thuc', sql.VarChar(20), params.phuong_thuc)
        .input('loai_thanh_toan', sql.VarChar(20), params.loai_thanh_toan)
        .input('so_tien', sql.Decimal(10, 2), params.so_tien)
        .input('ma_giao_dich', sql.VarChar(100), params.ma_giao_dich || null)
        .execute('sp_ThanhToanDon');

    return result.recordset[0];
};

export const layDanhSachThanhToan = async () => {
    const pool = await poolPromise;
    const result = await pool.request().execute('sp_LayDanhSachThanhToan');
    return result.recordset || [];
};

export const layDanhSachHoanTien = async () => {
    const pool = await poolPromise;
    const result = await pool.request().execute('sp_LayDanhSachHoanTien');
    return result.recordset || [];
};

export const taoPaymentLinkPayOS = async (paymentData: any) => {
    return await payOS.createPaymentLink(paymentData);
};

export const layThongTinThanhToanPayOS = async (orderCode: number | string) => {
    return await payOS.getPaymentLinkInformation(orderCode);
};

export const huyPaymentLinkPayOS = async (orderCode: number | string, cancellationReason?: string) => {
    return await payOS.cancelPaymentLink(orderCode, cancellationReason);
};
