"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import {
  History as HistoryIcon,
  Calendar,
  Clock,
  ArrowLeft,
  Receipt,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  TrendingUp,
  CreditCard,
  Coffee,
  AlertCircle,
  RefreshCw,
  User,
  ShoppingBag
} from 'lucide-react';

// 1. Định nghĩa Interface đơn đặt sân lấy từ CSDL SQL Server
export interface IDonDatSan {
  id: number;
  ma_don: string;
  ma_san: number;
  ten_san: string;
  ten_loai?: string;
  ngay_da: string;
  gio_bat_dau: string;
  gio_ket_thuc: string;
  tien_san: number;
  tong_tien: number;
  phuong_thuc: string;
  ghi_chu?: string;
  trang_thai: string;
  ngay_tao?: string;
  ten_khach_hang?: string;
  sdt_khach_hang?: string;
  chi_tiet_dich_Vu?: Array<{
    ma_dich_vu: number;
    ten_dich_vu: string;
    so_luong: number;
    tongtien_dichvu: number;
  }>;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function History() {
  const router = useRouter();

  // State danh sách đơn đặt nạp trực tiếp từ CSDL SQL Server
  const [danhSachDon, setDanhSachDon] = useState<IDonDatSan[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Format tiền tệ VNĐ
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount || 0);
  };

  // Format ngày DD/MM/YYYY
  const formatDateDMY = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // Hàm tải dữ liệu lịch sử đặt sân thực tế từ CSDL SQL Server
  const fetchBookingHistory = useCallback(async (user: any) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      let queryParams = new URLSearchParams();
      if (user?.id) queryParams.append('ma_nguoi_dung', String(user.id));
      if (user?.so_dien_thoai || user?.soDienThoai) queryParams.append('so_dien_thoai', user.so_dien_thoai || user.soDienThoai);
      if (user?.email) queryParams.append('email', user.email);

      const res = await fetch(`${API_BASE_URL}/dat-san/lich-su-khach-hang?${queryParams.toString()}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.data)) {
        setDanhSachDon(data.data);
      } else {
        setDanhSachDon([]);
        if (!data.success) {
          setErrorMessage(data.message || 'Không thể tải lịch sử đặt sân.');
        }
      }
    } catch (err: any) {
      console.error('Lỗi khi tải lịch sử đặt sân:', err);
      setErrorMessage('Không thể kết nối đến máy chủ Backend SQL Server.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Đọc thông tin người dùng từ localStorage khi tải trang
  useEffect(() => {
    try {
      const savedAuth = localStorage.getItem('auth_user') || localStorage.getItem('soccer_current_user');
      if (savedAuth) {
        const parsed = JSON.parse(savedAuth);
        setCurrentUser(parsed);
        fetchBookingHistory(parsed);
      } else {
        // Nếu chưa đăng nhập, gọi lấy danh sách chung
        fetchBookingHistory(null);
      }
    } catch (e) {
      console.error('Lỗi đọc localStorage:', e);
      fetchBookingHistory(null);
    }
  }, [fetchBookingHistory]);

  // Tính toán nhanh số liệu thống kê thực từ CSDL
  const totalBookings = danhSachDon.length;
  
  const paidBookingsCount = danhSachDon.filter((don) => {
    const st = (don.trang_thai || '').toUpperCase();
    return st === 'DA_THANH_TOAN' || st === 'DA THANH TOAN' || st === 'DA_COC' || st === 'HOAN_THANH';
  }).length;

  const totalSpent = danhSachDon
    .filter((don) => (don.trang_thai || '').toUpperCase() !== 'DA_HUY')
    .reduce((sum, don) => sum + (Number(don.tong_tien) || 0), 0);

  // Helper hiển thị badge trạng thái chuẩn hóa
  const renderStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'DA_THANH_TOAN' || s === 'DA THANH TOAN' || s === 'HOAN_THANH') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          Đã thanh toán
        </span>
      );
    }
    if (s === 'DA_COC') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-sm">
          <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
          Đã đặt cọc
        </span>
      );
    }
    if (s === 'DA_HUY') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
          <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
          Đã hủy
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
        <Clock3 className="w-3.5 h-3.5 text-amber-400" />
        Chờ xác nhận
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8 font-sans selection:bg-emerald-500 selection:text-white">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header điều hướng & Tiêu đề */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => router.push('/')}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all cursor-pointer shadow-sm hover:border-slate-700"
              title="Quay về trang chủ"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-2.5 text-white tracking-tight">
                <Receipt className="w-7 h-7 text-emerald-400" />
                Lịch Sử Đặt Sân
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {currentUser ? (
                  <span>
                    Dữ liệu đơn đặt từ CSDL của: <strong className="text-emerald-400">{currentUser.ho_ten || currentUser.hoTen || currentUser.email}</strong>
                  </span>
                ) : (
                  'Theo dõi danh sách các đơn đặt sân bóng và trạng thái thanh toán của bạn'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => fetchBookingHistory(currentUser)}
              disabled={isLoading}
              className="px-3.5 py-2.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Làm mới dữ liệu từ CSDL"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
              <span>Làm mới</span>
            </button>

            <button
              onClick={() => router.push('/')}
              className="px-4 py-2.5 text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Đặt sân mới</span>
            </button>
          </div>
        </div>

        {/* Khối tóm tắt thống kê từ CSDL */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 flex items-center gap-4 shadow-lg shadow-black/40">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Tổng số đơn</p>
              <p className="text-xl font-extrabold text-white mt-0.5">
                {isLoading ? '...' : `${totalBookings} đơn`}
              </p>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 flex items-center gap-4 shadow-lg shadow-black/40">
            <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/20">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Đã cọc / Đã thanh toán</p>
              <p className="text-xl font-extrabold text-teal-300 mt-0.5">
                {isLoading ? '...' : `${paidBookingsCount} đơn`}
              </p>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 flex items-center gap-4 shadow-lg shadow-black/40">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Tổng tiền đã đặt</p>
              <p className="text-xl font-extrabold text-emerald-400 mt-0.5">
                {isLoading ? '...' : formatCurrency(totalSpent)}
              </p>
            </div>
          </div>
        </div>

        {/* Thông báo lỗi kết nối nếu có */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Bảng & Danh sách đơn đặt sân (Data thực từ CSDL) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <HistoryIcon className="w-5 h-5 text-emerald-400" />
              Chi Tiết Đơn Đặt Sân (CSDL)
            </h2>
            <span className="text-xs text-slate-400 bg-slate-950 px-3 py-1 rounded-full border border-slate-800 font-medium">
              Hiển thị {danhSachDon.length} đơn
            </span>
          </div>

          {isLoading ? (
            /* Hiệu ứng Skeleton Loading */
            <div className="p-12 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Đang tải lịch sử đơn đặt sân từ CSDL SQL Server...</p>
            </div>
          ) : danhSachDon.length === 0 ? (
            /* Trạng thái rỗng khi chưa có đơn */
            <div className="py-16 px-4 text-center">
              <div className="w-16 h-16 bg-slate-950 text-slate-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-800 shadow-inner">
                <Receipt className="w-8 h-8" />
              </div>
              <p className="text-base font-bold text-slate-200">Bạn chưa có đơn đặt sân nào trong hệ thống CSDL.</p>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Khi bạn đặt sân bóng trên trang chủ, toàn bộ thông tin đơn đặt và dịch vụ kèm theo sẽ được hiển thị đầy đủ tại đây.
              </p>
              <button
                onClick={() => router.push('/')}
                className="mt-5 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer hover:from-emerald-400 hover:to-teal-400"
              >
                Đặt sân ngay bây giờ
              </button>
            </div>
          ) : (
            /* Bảng hiển thị đơn đặt sân */
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                    <th className="py-3.5 px-5">Mã Đơn</th>
                    <th className="py-3.5 px-5">Tên Sân</th>
                    <th className="py-3.5 px-5">Ngày Đá</th>
                    <th className="py-3.5 px-5">Khung Giờ</th>
                    <th className="py-3.5 px-5">Dịch Vụ Kèm Theo</th>
                    <th className="py-3.5 px-5">Tổng Tiền</th>
                    <th className="py-3.5 px-5 text-center">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-xs">
                  {danhSachDon.map((item) => {
                    return (
                      <tr
                        key={item.id || item.ma_don}
                        className="hover:bg-slate-850/60 transition-colors group"
                      >
                        {/* Mã đơn */}
                        <td className="py-4 px-5 font-mono font-bold text-slate-200">
                          <span className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-[11px] text-emerald-400">
                            {item.ma_don || `DDS-${item.id}`}
                          </span>
                        </td>

                        {/* Tên sân */}
                        <td className="py-4 px-5">
                          <div className="font-bold text-white group-hover:text-emerald-400 transition-colors">
                            {item.ten_san}
                          </div>
                          {item.ten_loai && (
                            <div className="text-[10px] text-slate-400 mt-0.5">{item.ten_loai}</div>
                          )}
                        </td>

                        {/* Ngày đá */}
                        <td className="py-4 px-5 text-slate-300">
                          <div className="flex items-center gap-1.5 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-emerald-500/70" />
                            {formatDateDMY(item.ngay_da)}
                          </div>
                        </td>

                        {/* Giờ đá */}
                        <td className="py-4 px-5 text-slate-300">
                          <div className="flex items-center gap-1.5 font-mono font-medium">
                            <Clock className="w-3.5 h-3.5 text-emerald-500/70" />
                            <span>
                              {item.gio_bat_dau} - {item.gio_ket_thuc}
                            </span>
                          </div>
                        </td>

                        {/* Dịch vụ kèm theo */}
                        <td className="py-4 px-5">
                          {item.chi_tiet_dich_Vu && item.chi_tiet_dich_Vu.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {item.chi_tiet_dich_Vu.map((dv, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-300 font-medium"
                                >
                                  <Coffee className="w-3 h-3 text-emerald-400" />
                                  <span>{dv.ten_dich_vu} x{dv.so_luong}</span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-500 italic">Không chọn dịch vụ</span>
                          )}
                        </td>

                        {/* Tổng tiền */}
                        <td className="py-4 px-5 font-black text-emerald-400 text-sm">
                          {formatCurrency(item.tong_tien)}
                        </td>

                        {/* Trạng thái thanh toán */}
                        <td className="py-4 px-5 text-center">
                          {renderStatusBadge(item.trang_thai)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer ghi chú bảo mật */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500 text-center pt-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Hệ thống lưu trữ lịch sử đặt sân bóng đồng bộ trực tiếp với CSDL SQL Server.</span>
        </div>

      </div>
    </div>
  );
}
