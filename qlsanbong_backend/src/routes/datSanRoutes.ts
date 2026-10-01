/**
 * =====================================================================
 * ROUTES: QUẢN LÝ ĐẶT SÂN (/api/dat-san)
 * =====================================================================
 */

import express, { Router } from 'express';
import * as datSanController from '../controllers/datSanController';

const router: Router = express.Router();

// Lấy danh sách sân bóng (sp_LayDanhSachSan)
router.get('/danh-sach-san', datSanController.layDanhSachSan);
router.get('/san-bong', datSanController.layDanhSachSan);

// Lấy, thêm, sửa, xóa loại sân (Loai_San)
router.get('/loai-san', datSanController.layDanhSachLoaiSan);
router.post('/loai-san', datSanController.themLoaiSan);
router.put('/loai-san/:id', datSanController.suaLoaiSan);
router.delete('/loai-san/:id', datSanController.xoaLoaiSan);

// Thêm, sửa, xóa sân bóng (San_Bong)
router.post('/san-bong', datSanController.themSanBong);
router.put('/san-bong/:id', datSanController.suaSanBong);
router.delete('/san-bong/:id', datSanController.xoaSanBong);

// Lấy danh sách khung giờ từ CSDL
router.get('/khung-gio', datSanController.layDanhSachKhungGio);
router.get('/khung-gio/all', datSanController.layTatCaKhungGioAdmin);
router.post('/khung-gio', datSanController.themKhungGio);
router.put('/khung-gio/:id', datSanController.suaKhungGio);
router.delete('/khung-gio/:id', datSanController.xoaKhungGio);
router.post('/khung-gio/reset', datSanController.resetKhungGio);

// Lấy danh sách khung giờ giá
router.get('/khung-gio-gia', datSanController.layKhungGioGia);
router.post('/khung-gio-gia', datSanController.themKhungGioGia);
router.put('/khung-gio-gia/:id', datSanController.suaKhungGioGia);
router.delete('/khung-gio-gia/:id', datSanController.xoaKhungGioGia);

// Lấy & Quản lý tất cả đơn đặt sân & thanh toán (Admin Dashboard)
router.get('/tat-ca-don', datSanController.layTatCaDonDat);
router.post('/don-dat-thanh-toan', datSanController.themDonDatVaThanhToan);
router.put('/don-dat-thanh-toan/:id', datSanController.suaDonDatVaThanhToan);
router.delete('/don-dat-thanh-toan/:id', datSanController.xoaDonDatVaThanhToan);

// Lấy lịch đặt sân theo ngày
router.get('/lich-san', datSanController.layLichSan);

// Lấy lịch sử đặt sân của khách hàng (CSDL SQL Server)
router.get('/lich-su-khach-hang', datSanController.layLichSuKhachHang);

// Đặt sân bóng (sp_DatSan)
router.post('/', datSanController.datSan);

// Đặt sân & tính giờ linh hoạt theo số phút (Flexible Booking)
router.post('/tinh-gia-linh-hoat', datSanController.tinhGiaLinhHoat);
router.post('/dat-linh-hoat', datSanController.datSanLinhHoat);
router.post('/checkin-linh-hoat', datSanController.batDauDaLinhHoat);
router.post('/checkout-linh-hoat', datSanController.ketThucDaLinhHoat);

// Hủy đơn đặt sân và hoàn cọc (sp_HuyDonVaHoanCoc)
router.post('/huy-don', datSanController.huyDonVaHoanCoc);

export default router;
