"use client";

import React, { useState } from 'react';
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
  CreditCard
} from 'lucide-react';

// 1. Định nghĩa Interface mô phỏng theo bảng Don_Dat_San trong CSDL
export interface IDonDatSan {
  ma_don: string;
  ten_san: string;
  ngay_da: string;
  gio_bat_dau: string;
  gio_ket_thuc: string;
  tong_tien: number;
  trang_thai_thanh_toan: 'Đã thanh toán' | 'Chờ thanh toán';
}

export default function History() {
  const router = useRouter();

  // 2. Mock Data khởi tạo với useState (2 đơn Đã thanh toán, 1 đơn Chờ thanh toán)
  const [danhSachDon, setDanhSachDon] = useState<IDonDatSan[]>([
    {
      ma_don: 'DDS-2026-001',
      ten_san: 'Sân 7A - Cỏ nhân tạo Pro',
      ngay_da: '2026-10-02',
      gio_bat_dau: '18:00',
      gio_ket_thuc: '19:30',
      tong_tien: 450000,
      trang_thai_thanh_toan: 'Đã thanh toán',
    },
    {
      ma_don: 'DDS-2026-002',
      ten_san: 'Sân 5B - VIP Đèn LED',
      ngay_da: '2026-10-05',
      gio_bat_dau: '19:30',
      gio_ket_thuc: '21:00',
      tong_tien: 350000,
      trang_thai_thanh_toan: 'Đã thanh toán',
    },
    {
      ma_don: 'DDS-2026-003',
      ten_san: 'Sân 7B - Cỏ nhân tạo Pro',
      ngay_da: '2026-10-08',
      gio_bat_dau: '17:00',
      gio_ket_thuc: '18:30',
      tong_tien: 400000,
      trang_thai_thanh_toan: 'Chờ thanh toán',
    },
  ]);

  // Format tiền tệ VNĐ
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  // Tính toán nhanh số liệu thống kê
  const totalSpent = danhSachDon
    .filter((don) => don.trang_thai_thanh_toan === 'Đã thanh toán')
    .reduce((sum, don) => sum + don.tong_tien, 0);

  return (
    <div className="min-h-screen bg-slate-900 text-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header điều hướng & Tiêu đề */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/60 pb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer shadow-sm"
              title="Quay về trang chủ"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2.5 text-white">
                <Receipt className="w-8 h-8 text-emerald-500" />
                Lịch Sử Đặt Sân
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Theo dõi danh sách các đơn đặt sân bóng và trạng thái thanh toán của bạn
              </p>
            </div>
          </div>

          <button
            onClick={() => router.push('/')}
            className="self-start sm:self-auto px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all shadow-lg shadow-emerald-900/30 flex items-center gap-2 cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            Đặt sân mới
          </button>
        </div>

        {/* Khối tóm tắt thống kê */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Tổng số đơn</p>
              <p className="text-xl font-bold text-white">{danhSachDon.length} đơn</p>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Đã thanh toán</p>
              <p className="text-xl font-bold text-white">
                {danhSachDon.filter((d) => d.trang_thai_thanh_toan === 'Đã thanh toán').length} đơn
              </p>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Tổng tiền đã chi</p>
              <p className="text-xl font-bold text-emerald-400">{formatCurrency(totalSpent)}</p>
            </div>
          </div>
        </div>

        {/* Bảng & Danh sách đơn đặt sân (Dark Theme) */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <HistoryIcon className="w-5 h-5 text-emerald-500" />
              Chi Tiết Đơn Đặt Sân
            </h2>
            <span className="text-xs text-slate-400 bg-slate-900/60 px-3 py-1 rounded-full border border-slate-700">
              Hiển thị {danhSachDon.length} kết quả
            </span>
          </div>

          {danhSachDon.length === 0 ? (
            /* Xử lý mảng rỗng */
            <div className="py-16 px-4 text-center">
              <div className="w-16 h-16 bg-slate-900/80 text-slate-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-700">
                <Receipt className="w-8 h-8" />
              </div>
              <p className="text-base font-medium text-slate-300">Bạn chưa có lịch sử đặt sân nào.</p>
              <p className="text-xs text-slate-500 mt-1">Khi bạn đặt sân và xác nhận, danh sách đơn sẽ xuất hiện tại đây.</p>
              <button
                onClick={() => router.push('/')}
                className="mt-5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-all cursor-pointer"
              >
                Đặt sân ngay
              </button>
            </div>
          ) : (
            /* Bảng hiển thị Desktop & Tablet */
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/70 border-b border-slate-700 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                    <th className="py-3.5 px-6">Mã Đơn</th>
                    <th className="py-3.5 px-6">Tên Sân</th>
                    <th className="py-3.5 px-6">Ngày Đá</th>
                    <th className="py-3.5 px-6">Khung Giờ</th>
                    <th className="py-3.5 px-6">Tổng Tiền</th>
                    <th className="py-3.5 px-6 text-center">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60 text-sm">
                  {danhSachDon.map((item) => {
                    const isPaid = item.trang_thai_thanh_toan === 'Đã thanh toán';
                    return (
                      <tr
                        key={item.ma_don}
                        className="hover:bg-slate-750 transition-colors group"
                      >
                        {/* Mã đơn */}
                        <td className="py-4 px-6 font-mono font-medium text-slate-200">
                          <span className="bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700 text-xs">
                            {item.ma_don}
                          </span>
                        </td>

                        {/* Tên sân */}
                        <td className="py-4 px-6 font-semibold text-white group-hover:text-emerald-400 transition-colors">
                          {item.ten_san}
                        </td>

                        {/* Ngày đá */}
                        <td className="py-4 px-6 text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            {item.ngay_da}
                          </div>
                        </td>

                        {/* Giờ đá */}
                        <td className="py-4 px-6 text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span>
                              {item.gio_bat_dau} - {item.gio_ket_thuc}
                            </span>
                          </div>
                        </td>

                        {/* Tổng tiền */}
                        <td className="py-4 px-6 font-bold text-slate-100">
                          {formatCurrency(item.tong_tien)}
                        </td>

                        {/* Trạng thái thanh toán */}
                        <td className="py-4 px-6 text-center">
                          {isPaid ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-500 border border-green-500/30">
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                              Đã thanh toán
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                              <Clock3 className="w-3.5 h-3.5 text-amber-400" />
                              Chờ thanh toán
                            </span>
                          )}
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
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400 text-center pt-4">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Hệ thống lưu trữ lịch sử đặt sân Soccer247 minh bạch & an toàn.</span>
        </div>

      </div>
    </div>
  );
}
