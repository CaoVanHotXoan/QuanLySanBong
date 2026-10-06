"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAppTheme } from '../../hooks/useAppTheme';
import {
  History as HistoryIcon,
  Calendar,
  Clock,
  ArrowLeft,
  Receipt,
  CheckCircle2,
  Clock3,
  TrendingUp,
  CreditCard,
  Coffee,
  AlertCircle,
  RefreshCw,
  ShoppingBag,
  Plus,
  Minus,
  X,
  QrCode,
  Copy,
  Check,
  ChevronRight,
  Sparkles,
  ExternalLink,
  DollarSign,
  Eye,
  FileText,
  Sun,
  Moon
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
  tien_coc?: number;
  tien_da_nhan?: number;
  tien_thieu?: number;
  chi_tiet_dich_vu?: Array<{
    ma_dich_vu: number;
    ten_dich_vu: string;
    don_vi_tinh?: string;
    so_luong: number;
    don_gia?: number;
    tongtien_dichvu: number;
  }>;
}

// Interface Mặt hàng Dịch vụ
export interface IDichVuItem {
  id: number;
  ten_dich_vu: string;
  don_gia: number;
  don_vi_tinh: string;
  ton_kho: number;
}

// Interface Dữ liệu trả về từ Cổng thanh toán PayOS (MB Bank VietQR)
interface PayOSData {
  orderCode: number;
  ma_don_dat?: number;
  amount: number;
  description: string;
  accountNumber: string;
  accountName: string;
  bin: string;
  bankName: string;
  checkoutUrl?: string;
  qrCode?: string;
  paymentLinkId?: string;
  status?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function History() {
  const router = useRouter();
  const { isDarkMode, setIsDarkMode, toggleTheme } = useAppTheme(true);

  // State danh sách đơn đặt nạp trực tiếp từ CSDL SQL Server
  const [danhSachDon, setDanhSachDon] = useState<IDonDatSan[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  // State Toast thông báo nổi
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // State Dịch vụ (Modal Thêm Dịch Vụ)
  const [availableServices, setAvailableServices] = useState<IDichVuItem[]>([]);
  const [selectedOrderForService, setSelectedOrderForService] = useState<IDonDatSan | null>(null);
  const [serviceCart, setServiceCart] = useState<{ [key: number]: number }>({});
  const [isAddingService, setIsAddingService] = useState<boolean>(false);

  // State PayOS VietQR MB Bank Modal
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<IDonDatSan | null>(null);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<IDonDatSan | null>(null);
  const [payOSData, setPayOSData] = useState<PayOSData | null>(null);
  const [isCreatingPayOS, setIsCreatingPayOS] = useState<boolean>(false);
  const [isCheckingPayOS, setIsCheckingPayOS] = useState<boolean>(false);
  const [isPaymentSuccess, setIsPaymentSuccess] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [payOSAlertMessage, setPayOSAlertMessage] = useState<string>('');

  // Helper kiểm tra đơn đặt đã qua ngày/giờ thi đấu hay chưa
  const isOrderPastTime = useCallback((item: IDonDatSan) => {
    if ((item as any).da_qua_gio === 1 || (item as any).da_qua_gio === true) return true;
    if (!item.ngay_da) return false;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const currentDate = String(now.getDate()).padStart(2, '0');
    const todayStr = `${currentYear}-${currentMonth}-${currentDate}`;

    if (item.ngay_da < todayStr) return true;
    if (item.ngay_da > todayStr) return false;

    const timeToCheck = item.gio_ket_thuc || item.gio_bat_dau;
    if (!timeToCheck) return false;

    const [h, m] = timeToCheck.split(':').map(Number);
    const currentH = now.getHours();
    const currentM = now.getMinutes();

    if (h < currentH) return true;
    if (h === currentH && (m !== undefined ? m : 0) <= currentM) return true;

    return false;
  }, []);

  // Helper trigger Toast thông báo
  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

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

  // Hàm copy văn bản
  const handleCopyText = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    showToast(`Đã sao chép ${fieldName} vào clipboard!`, 'info');
    setTimeout(() => setCopiedField(null), 2500);
  };

  // Tải danh mục dịch vụ có sẵn
  const fetchAvailableServices = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/dich-vu`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setAvailableServices(data.data);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách dịch vụ:', err);
    }
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
    fetchAvailableServices();
    try {
      const savedAuth = localStorage.getItem('auth_user') || localStorage.getItem('soccer_current_user');
      if (savedAuth) {
        const parsed = JSON.parse(savedAuth);
        setCurrentUser(parsed);
        fetchBookingHistory(parsed);
      } else {
        fetchBookingHistory(null);
      }
    } catch (e) {
      console.error('Lỗi đọc localStorage:', e);
      fetchBookingHistory(null);
    }
  }, [fetchBookingHistory]);

  // =========================================================================
  // XỬ LÝ THÊM / CHỈNH SỬA DỊCH VỤ VÀO HÓA ĐƠN
  // =========================================================================
  const handleOpenAddServiceModal = (order: IDonDatSan) => {
    setSelectedOrderForService(order);
    const initialCart: { [key: number]: number } = {};
    
    // Nếu đơn hàng còn tiền thiếu (chưa thanh toán đủ), load dịch vụ hiện có để khách có thể thêm hoặc xóa
    if (order.tien_thieu && order.tien_thieu > 0 && Array.isArray(order.chi_tiet_dich_vu)) {
      order.chi_tiet_dich_vu.forEach((dv: any) => {
        if (dv.ma_dich_vu && dv.so_luong) {
          initialCart[dv.ma_dich_vu] = Number(dv.so_luong);
        }
      });
    }
    // Nếu đơn đã thanh toán xong hoàn toàn -> cart khởi tạo trống để chỉ thêm dịch vụ mới
    setServiceCart(initialCart);
  };

  const handleUpdateServiceQuantity = (serviceId: number, delta: number) => {
    setServiceCart((prev) => {
      const current = prev[serviceId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const updated = { ...prev };
        delete updated[serviceId];
        return updated;
      }
      return { ...prev, [serviceId]: next };
    });
  };

  const calculateAddedServicesTotal = () => {
    let total = 0;
    Object.entries(serviceCart).forEach(([sId, qty]) => {
      const item = availableServices.find((s) => s.id === Number(sId));
      if (item && qty > 0) {
        total += item.don_gia * qty;
      }
    });
    return total;
  };

  // Khi nhấn Xác nhận thêm vào đơn -> Lưu trực tiếp vào CSDL qua Stored Procedure sp_CapNhatDichVuDonDat, tăng tiền còn thiếu, không hiện VietQR
  const handleConfirmAddServices = async () => {
    if (!selectedOrderForService) return;
    setIsAddingService(true);

    try {
      const currentOrder = selectedOrderForService;
      
      // Lấy toàn bộ ID dịch vụ ban đầu và dịch vụ trong giỏ
      const allServiceIds = new Set<number>();
      if (currentOrder.tien_thieu && currentOrder.tien_thieu > 0 && Array.isArray(currentOrder.chi_tiet_dich_vu)) {
        currentOrder.chi_tiet_dich_vu.forEach((dv: any) => {
          if (dv.ma_dich_vu) allServiceIds.add(Number(dv.ma_dich_vu));
        });
      }
      Object.keys(serviceCart).forEach((id) => allServiceIds.add(Number(id)));

      // Gọi Stored Procedure cập nhật từng dịch vụ (thêm, sửa số lượng, hoặc xóa hoàn kho)
      for (const sId of Array.from(allServiceIds)) {
        const newQty = serviceCart[sId] || 0;
        await fetch(`${API_BASE_URL}/dich-vu/cap-nhat-don`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ma_don_dat: currentOrder.id,
            ma_dich_vu: sId,
            so_luong: newQty
          })
        });
      }

      // Không hiển thị toast nổi khi xác nhận thêm dịch vụ theo yêu cầu
      setSelectedOrderForService(null);
      setServiceCart({});
      await fetchBookingHistory(currentUser);
    } catch (err: any) {
      console.error('Lỗi khi lưu dịch vụ vào đơn:', err);
      showToast('Lỗi khi cập nhật dịch vụ vào CSDL!', 'error');
    } finally {
      setIsAddingService(false);
    }
  };

  // =========================================================================
  // XỬ LÝ THANH TOÁN VIETQR PAYOS (MB BANK) CHO KHOẢN TIỀN CÒN THIẾU
  // =========================================================================
  const handleOpenVietQRPayment = async (order: IDonDatSan, customAmount?: number) => {
    setSelectedOrderForPayment(order);
    setIsPaymentSuccess(false);
    setPayOSAlertMessage('');
    setIsCreatingPayOS(true);

    const amountToPay = customAmount && customAmount > 0 
      ? customAmount 
      : (order.tien_thieu && order.tien_thieu > 0 ? order.tien_thieu : (order.tong_tien || 10000));

    try {
      const res = await fetch(`${API_BASE_URL}/thanh-toan/payos/tao-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ma_don_dat: order.id,
          so_tien: amountToPay,
          loai_thanh_toan: 'TRA_HET',
          ho_ten: order.ten_khach_hang || currentUser?.ho_ten || 'Khách Hàng',
          so_dien_thoai: order.sdt_khach_hang || currentUser?.so_dien_thoai || '0900000000'
        })
      });

      const data = await res.json();
      if (data.success && data.data) {
        setPayOSData(data.data);
      } else {
        showToast(data.message || 'Không thể tạo mã VietQR PayOS MB Bank!', 'error');
        setSelectedOrderForPayment(null);
      }
    } catch (err) {
      console.error('Lỗi khi tạo mã VietQR PayOS:', err);
      showToast('Lỗi kết nối đến cổng thanh toán VietQR PayOS!', 'error');
      setSelectedOrderForPayment(null);
    } finally {
      setIsCreatingPayOS(false);
    }
  };

  // Polling kiểm tra trạng thái thanh toán PayOS định kỳ mỗi 2.5 giây khi mở QR Modal
  useEffect(() => {
    if (!payOSData?.orderCode || isPaymentSuccess || !selectedOrderForPayment) {
      return;
    }

    const interval = setInterval(() => {
      checkPayOSStatus(payOSData.orderCode, false);
    }, 2500);

    return () => clearInterval(interval);
  }, [payOSData?.orderCode, isPaymentSuccess, selectedOrderForPayment]);

  // Kiểm tra trạng thái giao dịch PayOS
  const checkPayOSStatus = async (orderCode: number, manual: boolean = false) => {
    if (!orderCode) return;
    if (manual) {
      setIsCheckingPayOS(true);
      setPayOSAlertMessage('');
    }

    try {
      const res = await fetch(`${API_BASE_URL}/thanh-toan/payos/trang-thai/${orderCode}`);
      const data = await res.json();

      if (data.success && data.isPaid) {
        setIsPaymentSuccess(true);
        setPayOSAlertMessage('');
        showToast('🎉 MB Bank đã ghi nhận thanh toán thành công! Đơn hàng đã được thanh toán hoàn tất.', 'success');
        await fetchBookingHistory(currentUser);
      } else if (manual) {
        setPayOSAlertMessage('Soccer 247 chưa nhận được tiền chuyển khoản! Quý khách vui lòng quét mã chuyển tiền hoặc thử lại sau vài giây.');
      }
    } catch (err) {
      console.error('Lỗi khi kiểm tra PayOS status:', err);
      if (manual) {
        setPayOSAlertMessage('Không thể kiểm tra giao dịch PayOS lúc này. Vui lòng thử lại sau.');
      }
    } finally {
      if (manual) setIsCheckingPayOS(false);
    }
  };

  const handleCloseQRModal = () => {
    setSelectedOrderForPayment(null);
    setPayOSData(null);
    setIsPaymentSuccess(false);
    setPayOSAlertMessage('');
    fetchBookingHistory(currentUser);
  };

  // =========================================================================
  // TÍNH TOÁN THỐNG KÊ NHANH (CHUẨN HÓA ĐỒNG BỘ CSDL)
  // =========================================================================
  const totalBookings = danhSachDon.length;

  // Số lượng đơn Đã đặt cọc (chưa trả đủ và có tiền cọc/đã nhận > 0)
  const daCocCount = danhSachDon.filter((don) => {
    const st = (don.trang_thai || '').toUpperCase();
    if (st.includes('HUY')) return false;
    const isOrderPaid = st === 'DA_THANH_TOAN' || st === 'HOAN_THANH' || st === 'KET_THUC';
    if (isOrderPaid) return false;
    const tongTien = Number(don.tong_tien) || 0;
    const tienCoc = don.tien_coc !== undefined && don.tien_coc !== null ? Number(don.tien_coc) : Math.round(tongTien * 0.3);
    const tienDaNhan = don.tien_da_nhan !== undefined && don.tien_da_nhan !== null ? Number(don.tien_da_nhan) : (st === 'DA_COC' ? tienCoc : 0);
    const tienThieu = don.tien_thieu !== undefined && don.tien_thieu !== null ? Number(don.tien_thieu) : Math.max(0, tongTien - tienDaNhan);
    return !isOrderPaid && (st === 'DA_COC' || (tienDaNhan > 0 && tienThieu > 0));
  }).length;

  // Số lượng đơn Đã thanh toán (100% hoặc hoàn thành)
  const daThanhToanCount = danhSachDon.filter((don) => {
    const st = (don.trang_thai || '').toUpperCase();
    if (st.includes('HUY')) return false;
    const isOrderPaid = st === 'DA_THANH_TOAN' || st === 'HOAN_THANH' || st === 'KET_THUC';
    if (isOrderPaid) return true;
    const tongTien = Number(don.tong_tien) || 0;
    const tienDaNhan = don.tien_da_nhan !== undefined && don.tien_da_nhan !== null ? Number(don.tien_da_nhan) : 0;
    const tienThieu = don.tien_thieu !== undefined && don.tien_thieu !== null ? Number(don.tien_thieu) : Math.max(0, tongTien - tienDaNhan);
    return (tongTien > 0 && tienDaNhan >= tongTien) || (tienThieu <= 0 && tienDaNhan > 0);
  }).length;

  const totalSpent = danhSachDon
    .filter((don) => !(don.trang_thai || '').toUpperCase().includes('HUY'))
    .reduce((sum, don) => sum + (Number(don.tong_tien) || 0), 0);

  // Helper hiển thị badge trạng thái chuẩn hóa đồng bộ toàn hệ thống
  const renderStatusBadge = (status: string, tienThieu: number = 0, tienDaNhan: number = 0, tongTien: number = 0) => {
    const s = (status || '').toUpperCase();
    if (s.includes('HUY')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
          <AlertCircle className="w-3 h-3 text-rose-400" />
          Đã hủy
        </span>
      );
    }
    const isPaid = (tongTien > 0 && tienDaNhan >= tongTien) || (tienThieu <= 0 && tienDaNhan > 0) || s === 'DA_THANH_TOAN' || s === 'HOAN_THANH';
    if (isPaid) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          Đã thanh toán
        </span>
      );
    }
    const isDeposit = s === 'DA_COC' || (tienDaNhan > 0 && tienThieu > 0);
    if (isDeposit) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-sm">
          <CheckCircle2 className="w-3 h-3 text-teal-400" />
          Đã cọc
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm">
        <Clock3 className="w-3 h-3 text-amber-400" />
        Chưa thanh toán
      </span>
    );
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 py-8 px-4 sm:px-6 lg:px-8 font-sans selection:bg-emerald-500 selection:text-white relative ${
      isDarkMode ? 'bg-[#060e09] text-slate-100 dark' : 'bg-[#f4f7f5] text-slate-900'
    }`}>
      
      {/* Toast Notification Floating */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 animate-bounce duration-300">
          <div className={`px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md border flex items-center gap-3 text-xs font-semibold ${
            toastMessage.type === 'success'
              ? isDarkMode ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40' : 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : toastMessage.type === 'error'
              ? isDarkMode ? 'bg-rose-950/90 text-rose-300 border-rose-500/40' : 'bg-rose-50 text-rose-800 border-rose-300'
              : isDarkMode ? 'bg-slate-900/90 text-slate-200 border-slate-700' : 'bg-white text-slate-800 border-slate-200'
          }`}>
            {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {toastMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
            {toastMessage.type === 'info' && <Sparkles className="w-4 h-4 text-teal-400" />}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header điều hướng & Tiêu đề */}
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6 transition-colors ${
          isDarkMode ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => router.push('/')}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer shadow-sm ${
                isDarkMode
                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700'
                  : 'bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-200'
              }`}
              title="Quay về trang chủ"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className={`text-2xl sm:text-3xl font-extrabold flex items-center gap-2.5 tracking-tight ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}>
                <Receipt className="w-7 h-7 text-emerald-500" />
                Lịch Sử Đặt Sân & Hóa Đơn
              </h1>
              <p className={`text-xs sm:text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Theo dõi danh sách đơn đặt sân bóng, dịch vụ kèm theo và thanh toán
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Nút Chuyển đổi Theme Sáng / Tối */}
            <button
              type="button"
              onClick={() => toggleTheme()}
              title={isDarkMode ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
              className={`p-2.5 rounded-xl border transition-all duration-300 flex items-center justify-center group shadow-sm hover:scale-105 active:scale-95 cursor-pointer ${
                isDarkMode
                  ? 'bg-slate-900 border-slate-700 text-amber-400 hover:bg-slate-800 hover:border-amber-400/50'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-emerald-600 shadow-sm'
              }`}
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
              ) : (
                <Moon className="w-4 h-4 text-emerald-600 group-hover:-rotate-12 transition-transform duration-300" />
              )}
            </button>

            <button
              onClick={() => fetchBookingHistory(currentUser)}
              disabled={isLoading}
              className={`px-3.5 py-2.5 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                isDarkMode
                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Tổng số đơn */}
          <div className={`rounded-2xl p-4 flex items-center gap-4 shadow-lg transition-colors border ${
            isDarkMode 
              ? 'bg-slate-900/90 border-slate-800/90 shadow-black/40' 
              : 'bg-white border-slate-200 shadow-slate-200/60'
          }`}>
            <div className={`p-3 rounded-xl border ${
              isDarkMode ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
            }`}>
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <p className={`text-xs uppercase tracking-wider font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Tổng số đơn</p>
              <p className={`text-xl font-extrabold mt-0.5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {isLoading ? '...' : `${totalBookings} đơn`}
              </p>
            </div>
          </div>

          {/* Card 2: Đã cọc */}
          <div className={`rounded-2xl p-4 flex items-center gap-4 shadow-lg transition-colors border ${
            isDarkMode 
              ? 'bg-slate-900/90 border-slate-800/90 shadow-black/40' 
              : 'bg-white border-slate-200 shadow-slate-200/60'
          }`}>
            <div className={`p-3 rounded-xl border ${
              isDarkMode ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-600 border-amber-200'
            }`}>
              <Clock3 className="w-6 h-6" />
            </div>
            <div>
              <p className={`text-xs uppercase tracking-wider font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Đã cọc</p>
              <p className={`text-xl font-extrabold mt-0.5 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                {isLoading ? '...' : `${daCocCount} đơn`}
              </p>
            </div>
          </div>

          {/* Card 3: Đã thanh toán */}
          <div className={`rounded-2xl p-4 flex items-center gap-4 shadow-lg transition-colors border ${
            isDarkMode 
              ? 'bg-slate-900/90 border-slate-800/90 shadow-black/40' 
              : 'bg-white border-slate-200 shadow-slate-200/60'
          }`}>
            <div className={`p-3 rounded-xl border ${
              isDarkMode ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' : 'bg-teal-50 text-teal-600 border-teal-200'
            }`}>
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className={`text-xs uppercase tracking-wider font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Đã thanh toán</p>
              <p className={`text-xl font-extrabold mt-0.5 ${isDarkMode ? 'text-teal-300' : 'text-teal-600'}`}>
                {isLoading ? '...' : `${daThanhToanCount} đơn`}
              </p>
            </div>
          </div>

          {/* Card 4: Tổng giá trị đơn đặt */}
          <div className={`rounded-2xl p-4 flex items-center gap-4 shadow-lg transition-colors border ${
            isDarkMode 
              ? 'bg-slate-900/90 border-slate-800/90 shadow-black/40' 
              : 'bg-white border-slate-200 shadow-slate-200/60'
          }`}>
            <div className={`p-3 rounded-xl border ${
              isDarkMode ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
            }`}>
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <p className={`text-xs uppercase tracking-wider font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Tổng giá trị đơn đặt</p>
              <p className={`text-xl font-extrabold mt-0.5 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
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

        {/* Bảng & Danh sách đơn đặt sân */}
        <div className={`rounded-2xl shadow-2xl overflow-hidden transition-colors border ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-slate-200/70'
        }`}>
          <div className={`px-6 py-4 border-b flex items-center justify-between transition-colors ${
            isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50/70'
          }`}>
            <h2 className={`text-base sm:text-lg font-bold flex items-center gap-2 ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}>
              <HistoryIcon className="w-5 h-5 text-emerald-500" />
              Chi Tiết Đơn Đặt Sân
            </h2>
            <span className={`text-xs px-3 py-1 rounded-full border font-medium ${
              isDarkMode ? 'text-slate-400 bg-slate-950 border-slate-800' : 'text-slate-600 bg-slate-100 border-slate-200'
            }`}>
              Hiển thị {danhSachDon.length} đơn
            </span>
          </div>

          {isLoading ? (
            /* Hiệu ứng Skeleton Loading */
            <div className="p-12 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Đang tải lịch sử đơn đặt sân từ CSDL SQL Server...</p>
            </div>
          ) : danhSachDon.length === 0 ? (
            /* Trạng thái rỗng khi chưa có đơn */
            <div className="py-16 px-4 text-center">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border shadow-inner ${
                isDarkMode ? 'bg-slate-950 text-slate-500 border-slate-800' : 'bg-slate-100 text-slate-400 border-slate-200'
              }`}>
                <Receipt className="w-8 h-8" />
              </div>
              <p className={`text-base font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Bạn chưa có đơn đặt sân nào trong hệ thống CSDL.</p>
              <p className={`text-xs mt-1 max-w-md mx-auto ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
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
            /* Bảng hiển thị đơn đặt sân & tài chính */
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`border-b text-[11px] uppercase tracking-wider font-bold transition-colors ${
                    isDarkMode ? 'bg-slate-950/80 border-slate-800 text-slate-400' : 'bg-slate-100/90 border-slate-200 text-slate-600'
                  }`}>
                    <th className="py-3.5 px-4 whitespace-nowrap">Tên Sân</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Ngày & Giờ Đá</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Dịch Vụ Kèm Theo</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap">Tổng Tiền</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap">Tiền Cọc</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap">Đã Nhận</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap">Còn Thiếu</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap">Trạng Thái</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className={`divide-y text-xs transition-colors ${
                  isDarkMode ? 'divide-slate-800/70' : 'divide-slate-200'
                }`}>
                  {danhSachDon.map((item) => {
                    const isPast = isOrderPastTime(item);
                    const isFullyPaid = (item.trang_thai === 'DA_THANH_TOAN' || item.trang_thai === 'HOAN_THANH' || item.trang_thai === 'KET_THUC');
                    const tienCoc = item.tien_coc !== undefined && item.tien_coc !== null ? Number(item.tien_coc) : Math.round((item.tong_tien || 0) * 0.3);
                    const tienDaNhan = isFullyPaid
                      ? Number(item.tong_tien || 0)
                      : (item.tien_da_nhan !== undefined && item.tien_da_nhan !== null
                        ? Number(item.tien_da_nhan)
                        : (item.trang_thai === 'DA_COC' ? tienCoc : 0));
                    const tienThieu = isFullyPaid
                      ? 0
                      : (item.tien_thieu !== undefined && item.tien_thieu !== null
                        ? Number(item.tien_thieu)
                        : Math.max(0, (item.tong_tien || 0) - tienDaNhan));
                    const isCancelled = item.trang_thai === 'DA_HUY';
                    const canAddService = !isCancelled && (item.trang_thai === 'DA_COC' || isFullyPaid || tienDaNhan > 0);

                    return (
                      <tr
                        key={item.id || item.ma_don}
                        className={`transition-all group ${
                          isPast
                            ? isDarkMode ? 'opacity-60 hover:opacity-100 bg-slate-950/40 hover:bg-slate-900/60' : 'opacity-60 hover:opacity-100 bg-slate-50 hover:bg-slate-100/80'
                            : isDarkMode ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50/90'
                        }`}
                      >
                        {/* Tên sân */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className={`font-bold transition-colors ${
                            isPast 
                              ? isDarkMode ? 'text-slate-300 group-hover:text-white' : 'text-slate-600 group-hover:text-slate-900'
                              : isDarkMode ? 'text-white group-hover:text-emerald-400' : 'text-slate-900 group-hover:text-emerald-600'
                          }`}>
                            {item.ten_san}
                          </div>
                          {item.ten_loai && (
                            <div className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                              {item.ten_loai}
                            </div>
                          )}
                        </td>

                        {/* Ngày & Khung giờ */}
                        <td className={`py-4 px-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                          <div className="flex items-center gap-1.5 font-medium whitespace-nowrap">
                            <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                            {formatDateDMY(item.ngay_da)}
                          </div>
                          <div className={`flex items-center gap-1.5 font-mono text-[11px] mt-1 whitespace-nowrap ${
                            isDarkMode ? 'text-slate-400' : 'text-slate-500'
                          }`}>
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{item.gio_bat_dau} - {item.gio_ket_thuc}</span>
                          </div>
                          {isPast && (
                            <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] mt-1 font-medium ${
                              isDarkMode ? 'bg-slate-800/80 border-slate-700/60 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500'
                            }`}>
                              <Clock3 className="w-2.5 h-2.5" />
                              <span>Đã qua giờ</span>
                            </div>
                          )}
                        </td>

                        {/* Dịch vụ kèm theo */}
                        <td className="py-4 px-4 max-w-[200px]">
                          {item.chi_tiet_dich_vu && item.chi_tiet_dich_vu.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {item.chi_tiet_dich_vu.map((dv, idx) => (
                                <span
                                  key={idx}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-medium whitespace-nowrap ${
                                    isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                                  }`}
                                  title={`${dv.ten_dich_vu} x${dv.so_luong} = ${formatCurrency(dv.tongtien_dichvu)}`}
                                >
                                  <Coffee className="w-3 h-3 text-emerald-500" />
                                  <span>{dv.ten_dich_vu} x{dv.so_luong}</span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className={`text-[11px] italic ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Chưa chọn dịch vụ</span>
                          )}
                        </td>

                        {/* Tổng tiền */}
                        <td className={`py-4 px-4 font-bold text-right whitespace-nowrap ${
                          isDarkMode ? 'text-white' : 'text-slate-900'
                        }`}>
                          {formatCurrency(item.tong_tien)}
                        </td>

                        {/* Tiền cọc */}
                        <td className={`py-4 px-4 font-medium text-right whitespace-nowrap ${
                          isDarkMode ? 'text-teal-300' : 'text-teal-700'
                        }`}>
                          {formatCurrency(tienCoc)}
                        </td>

                        {/* Đã nhận */}
                        <td className="py-4 px-4 font-bold text-emerald-500 text-right whitespace-nowrap">
                          <span className={`inline-block px-2 py-0.5 rounded border ${
                            isDarkMode ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          }`}>
                            {formatCurrency(tienDaNhan)}
                          </span>
                        </td>

                        {/* Còn thiếu */}
                        <td className="py-4 px-4 font-bold text-right whitespace-nowrap">
                          {tienThieu > 0 ? (
                            <span className={`inline-block px-2 py-0.5 rounded border ${
                              isDarkMode ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {formatCurrency(tienThieu)}
                            </span>
                          ) : (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] ${
                              isDarkMode ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                              <Check className="w-3 h-3" /> Đã đủ
                            </span>
                          )}
                        </td>

                        {/* Trạng thái thanh toán */}
                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          {renderStatusBadge(item.trang_thai, tienThieu, tienDaNhan, item.tong_tien)}
                        </td>

                        {/* Hành động */}
                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            {isPast ? (
                              /* Đơn đã qua giờ: CHỈ HIỆN DUY NHẤT NÚT XEM CHI TIẾT */
                              <button
                                onClick={() => setSelectedOrderForDetail(item)}
                                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:scale-105 ${
                                  isDarkMode
                                    ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white border-slate-700 hover:border-cyan-500/50'
                                    : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-700 hover:text-cyan-900 border-cyan-200'
                                }`}
                                title="Xem chi tiết đơn đặt sân & hóa đơn"
                              >
                                <Eye className="w-3.5 h-3.5 text-cyan-500" />
                                <span>Xem chi tiết</span>
                              </button>
                            ) : (
                              /* Đơn chưa qua giờ: Hiện các nút tương tác bình thường */
                              <>
                                {/* Nút Xem chi tiết nhanh */}
                                <button
                                  onClick={() => setSelectedOrderForDetail(item)}
                                  className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                    isDarkMode
                                      ? 'text-slate-400 hover:text-cyan-300 bg-slate-950 hover:bg-slate-800 border-slate-800 hover:border-cyan-500/50'
                                      : 'text-slate-600 hover:text-cyan-700 bg-slate-100 hover:bg-slate-200 border-slate-200'
                                  }`}
                                  title="Xem chi tiết hóa đơn"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>

                                {/* Nút Dịch Vụ: Chỉ hiện khi đơn chưa bị hủy */}
                                {canAddService && (
                                  <button
                                    onClick={() => handleOpenAddServiceModal(item)}
                                    className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                                      isDarkMode
                                        ? 'bg-slate-950 hover:bg-slate-800 text-slate-200 hover:text-emerald-400 border-slate-700/80 hover:border-emerald-500/50'
                                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 hover:text-emerald-950 border-emerald-200'
                                    }`}
                                    title="Thêm nước uống, phụ kiện vào hóa đơn này"
                                  >
                                    <Plus className="w-3.5 h-3.5 text-emerald-500" />
                                    <span>Dịch vụ</span>
                                  </button>
                                )}

                                {/* Nút Thanh Toán: Luôn hiện khi còn thiếu tiền */}
                                {!isCancelled && tienThieu > 0 && (
                                  <button
                                    onClick={() => handleOpenVietQRPayment(item)}
                                    className="px-2.5 py-1.5 text-[11px] font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-lg transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer hover:scale-105"
                                    title={`Quét mã VietQR (MB Bank) để thanh toán số tiền còn thiếu ${formatCurrency(tienThieu)}`}
                                  >
                                    <QrCode className="w-3.5 h-3.5" />
                                    <span>Thanh toán</span>
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: THÊM DỊCH VỤ VÀO HÓA ĐƠN */}
      {/* ========================================================================= */}
      {selectedOrderForService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className={`border rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] transition-colors ${
            isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            
            {/* Modal Header */}
            <div className={`px-6 py-4 border-b flex items-center justify-between transition-colors ${
              isDarkMode ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl border ${
                  isDarkMode ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                }`}>
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Thêm Dịch Vụ Vào Đơn Hàng</h3>
                  <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Đơn: <span className="font-mono text-emerald-500 font-bold">{selectedOrderForService.ma_don || `DDS-${selectedOrderForService.id}`}</span> • {selectedOrderForService.ten_san}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrderForService(null)}
                className={`p-2 rounded-xl transition-colors ${
                  isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Danh sách dịch vụ */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs ${
                isDarkMode ? 'bg-slate-950/70 border-slate-800/80' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Tổng tiền hiện tại của đơn:</span>
                  <span className={`font-bold ml-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(selectedOrderForService.tong_tien)}</span>
                </div>
                <div>
                  <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Đã trả:</span>
                  <span className="font-bold text-emerald-500 ml-2">{formatCurrency(selectedOrderForService.tien_da_nhan || 0)}</span>
                </div>
              </div>

              <div className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Chọn nước uống, phụ kiện thêm vào sân:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableServices.map((service) => {
                  const currentQty = serviceCart[service.id] || 0;
                  return (
                    <div
                      key={service.id}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                        currentQty > 0
                          ? isDarkMode ? 'bg-emerald-500/10 border-emerald-500/40 shadow-sm' : 'bg-emerald-50/80 border-emerald-300 shadow-sm'
                          : isDarkMode ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className={`font-bold text-xs flex items-center gap-1.5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                          <Coffee className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{service.ten_dich_vu}</span>
                        </div>
                        <div className="text-xs font-semibold text-emerald-500">
                          {formatCurrency(service.don_gia)} <span className={`text-[10px] font-normal ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>/ {service.don_vi_tinh}</span>
                        </div>
                        <div className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                          Còn lại trong kho: {service.ton_kho}
                        </div>
                      </div>

                      {/* Bộ tăng giảm số lượng */}
                      <div className={`flex items-center gap-2 px-2 py-1 rounded-xl border ${
                        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                      }`}>
                        <button
                          type="button"
                          onClick={() => handleUpdateServiceQuantity(service.id, -1)}
                          disabled={currentQty <= 0}
                          className={`w-6 h-6 rounded-lg disabled:opacity-30 flex items-center justify-center cursor-pointer transition-colors ${
                            isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className={`w-6 text-center font-mono font-bold text-xs ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                          {currentQty}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateServiceQuantity(service.id, 1)}
                          disabled={currentQty >= service.ton_kho}
                          className="w-6 h-6 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 text-slate-950 font-bold flex items-center justify-center cursor-pointer transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`p-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 ${
              isDarkMode ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-50'
            }`}>
              <div>
                <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Tiền dịch vụ đã chọn:</div>
                <div className="text-lg font-black text-emerald-500">
                  {formatCurrency(calculateAddedServicesTotal())}
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setSelectedOrderForService(null)}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition-colors w-full sm:w-auto cursor-pointer ${
                    isDarkMode ? 'border-slate-800 text-slate-300 hover:bg-slate-900' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAddServices}
                  disabled={isAddingService}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 w-full sm:w-auto cursor-pointer"
                >
                  {isAddingService ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Xác nhận lưu dịch vụ</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: THANH TOÁN VIETQR PAYOS (MB BANK) */}
      {/* ========================================================================= */}
      {selectedOrderForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className={`border rounded-2xl sm:rounded-3xl w-full max-w-md max-h-[92vh] overflow-hidden shadow-2xl flex flex-col my-auto transition-colors ${
            isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            
            {/* Header VietQR */}
            <div className={`px-4 sm:px-5 py-3 border-b flex items-center justify-between shrink-0 ${
              isDarkMode ? 'border-slate-800 bg-slate-950/90' : 'border-slate-200 bg-slate-50'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-lg border ${
                  isDarkMode ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                }`}>
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Thanh Toán Số Tiền Còn Thiếu
                  </h3>
                  <p className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Đơn đặt: <span className="text-emerald-500 font-mono font-bold">{selectedOrderForPayment.ma_don || `DDS-${selectedOrderForPayment.id}`}</span>
                    <span className="ml-1.5 text-amber-500 font-bold">• VietQR MB Bank</span>
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseQRModal}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Nội dung thanh toán hoặc màn hình thành công */}
            <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto">
              {isPaymentSuccess ? (
                <div className="py-6 text-center space-y-3">
                  <div className="w-14 h-14 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-500/40 animate-pulse">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Thanh Toán Thành Công!</h4>
                    <p className={`text-xs mt-1 max-w-xs mx-auto ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      Hệ thống MB Bank đã xác nhận khoản thanh toán. Đơn hàng của bạn đã hoàn tất thanh toán!
                    </p>
                  </div>
                  <button
                    onClick={handleCloseQRModal}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 cursor-pointer hover:from-emerald-400 hover:to-teal-400 transition-all"
                  >
                    Hoàn tất & Đóng
                  </button>
                </div>
              ) : isCreatingPayOS ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-7 h-7 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Đang khởi tạo mã VietQR MB Bank...</p>
                </div>
              ) : payOSData ? (
                <>
                  {/* Mã QR code quét bằng App ngân hàng */}
                  <div className="flex flex-col items-center justify-center">
                    <div className="p-2.5 bg-white rounded-2xl border border-slate-200 shadow-xl inline-block relative">
                      <img
                        src={`https://img.vietqr.io/image/${payOSData.bin || '970422'}-${payOSData.accountNumber || 'VQRQAMLAF1810'}-compact2.png?amount=${payOSData.amount}&addInfo=${encodeURIComponent(payOSData.description)}&accountName=${encodeURIComponent(payOSData.accountName || 'CAO VAN HOT XOAN')}`}
                        alt="Mã VietQR MB Bank"
                        className="w-40 h-40 sm:w-44 sm:h-44 object-contain rounded-lg"
                      />
                    </div>
                    <p className={`text-[10px] mt-1.5 text-center ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Quét mã bằng App ngân hàng bất kỳ để thanh toán tự động
                    </p>
                  </div>

                  {/* Thông tin chuyển khoản chi tiết */}
                  <div className={`rounded-xl p-3 sm:p-3.5 border space-y-2 text-[11px] sm:text-xs ${
                    isDarkMode ? 'bg-slate-950 border-slate-800/90' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className={`flex items-center justify-between pb-1.5 border-b ${isDarkMode ? 'border-slate-800/70' : 'border-slate-200'}`}>
                      <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Ngân hàng:</span>
                      <span className={`font-bold text-right ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{payOSData.bankName || 'MB Bank (Quân Đội)'}</span>
                    </div>

                    <div className={`flex items-center justify-between pb-1.5 border-b ${isDarkMode ? 'border-slate-800/70' : 'border-slate-200'}`}>
                      <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Chủ tài khoản:</span>
                      <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{payOSData.accountName || 'CAO VAN HOT XOAN'}</span>
                    </div>

                    <div className={`flex items-center justify-between pb-1.5 border-b ${isDarkMode ? 'border-slate-800/70' : 'border-slate-200'}`}>
                      <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Số tài khoản:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-emerald-500">{payOSData.accountNumber}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(payOSData.accountNumber, 'Số tài khoản')}
                          className={`p-1 rounded ${isDarkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'}`}
                          title="Sao chép"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className={`flex items-center justify-between pb-1.5 border-b ${isDarkMode ? 'border-slate-800/70' : 'border-slate-200'}`}>
                      <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Số tiền thanh toán:</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`font-mono font-black text-xs sm:text-sm ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                          {formatCurrency(payOSData.amount)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(String(payOSData.amount), 'Số tiền')}
                          className={`p-1 rounded ${isDarkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'}`}
                          title="Sao chép"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Nội dung:</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`font-mono font-bold px-2 py-0.5 rounded border ${
                          isDarkMode ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                        }`}>
                          {payOSData.description}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(payOSData.description, 'Nội dung')}
                          className={`p-1 rounded ${isDarkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'}`}
                          title="Sao chép"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Cảnh báo khi Soccer 247 chưa nhận được tiền */}
                  {payOSAlertMessage && (
                    <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start gap-2.5 shadow-md animate-fade-in">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                      <span className="leading-relaxed font-medium">{payOSAlertMessage}</span>
                    </div>
                  )}

                  {/* Nút kiểm tra trạng thái */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => checkPayOSStatus(payOSData.orderCode, true)}
                      disabled={isCheckingPayOS}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                        isDarkMode
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                      }`}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isCheckingPayOS ? 'animate-spin text-emerald-400' : ''}`} />
                      <span>{isCheckingPayOS ? 'Đang kiểm tra đối soát...' : 'Tôi đã chuyển khoản'}</span>
                    </button>
                  </div>
                </>
              ) : null}
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: XEM CHI TIẾT HÓA ĐƠN & ĐƠN ĐẶT SÂN */}
      {/* ========================================================================= */}
      {selectedOrderForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className={`border rounded-2xl sm:rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col my-auto max-h-[90vh] transition-colors ${
            isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            
            {/* Header Modal */}
            <div className={`px-5 py-4 border-b flex items-center justify-between shrink-0 ${
              isDarkMode ? 'border-slate-800 bg-slate-950/80' : 'border-slate-200 bg-slate-50'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl border ${
                  isDarkMode ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-cyan-50 text-cyan-600 border-cyan-200'
                }`}>
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-base font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    <span>Chi Tiết Hóa Đơn Đặt Sân</span>
                    {isOrderPastTime(selectedOrderForDetail) && (
                      <span className={`text-[10px] font-normal px-2 py-0.5 rounded border ${
                        isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        Đã qua giờ
                      </span>
                    )}
                  </h3>
                  <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Mã đơn: <span className="font-mono text-emerald-500 font-bold">{selectedOrderForDetail.ma_don || `DDS-${selectedOrderForDetail.id}`}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrderForDetail(null)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nội dung chi tiết hóa đơn */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Thông tin sân & trận đấu */}
              <div className={`p-3.5 rounded-2xl border space-y-2.5 ${
                isDarkMode ? 'bg-slate-950/70 border-slate-800/80 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <div className={`font-bold uppercase tracking-wider text-[11px] pb-1 border-b ${
                  isDarkMode ? 'text-slate-300 border-slate-800/60' : 'text-slate-700 border-slate-200'
                }`}>
                  Thông Tin Trận Đấu
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className={`block ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Sân bóng:</span>
                    <span className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{selectedOrderForDetail.ten_san}</span>
                    {selectedOrderForDetail.ten_loai && (
                      <span className={`text-[11px] block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>({selectedOrderForDetail.ten_loai})</span>
                    )}
                  </div>
                  <div>
                    <span className={`block ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Ngày thi đấu:</span>
                    <span className="font-bold text-emerald-500">{formatDateDMY(selectedOrderForDetail.ngay_da)}</span>
                  </div>
                  <div>
                    <span className={`block ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Khung giờ đá:</span>
                    <span className={`font-mono font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{selectedOrderForDetail.gio_bat_dau} - {selectedOrderForDetail.gio_ket_thuc}</span>
                  </div>
                  <div>
                    <span className={`block ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Trạng thái:</span>
                    <span className="mt-0.5 block">{renderStatusBadge(selectedOrderForDetail.trang_thai, selectedOrderForDetail.tien_thieu || 0, selectedOrderForDetail.tien_da_nhan || 0, selectedOrderForDetail.tong_tien)}</span>
                  </div>
                </div>

                {selectedOrderForDetail.ghi_chu && (
                  <div className={`pt-2 border-t text-[11px] ${
                    isDarkMode ? 'border-slate-800/60 text-slate-400' : 'border-slate-200 text-slate-500'
                  }`}>
                    <span className={isDarkMode ? 'text-slate-500' : 'text-slate-400'}>Ghi chú:</span> {selectedOrderForDetail.ghi_chu}
                  </div>
                )}
              </div>

              {/* Thông tin khách hàng & đặt sân */}
              <div className={`p-3.5 rounded-2xl border space-y-2 ${
                isDarkMode ? 'bg-slate-950/70 border-slate-800/80 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <div className={`font-bold uppercase tracking-wider text-[11px] pb-1 border-b ${
                  isDarkMode ? 'text-slate-300 border-slate-800/60' : 'text-slate-700 border-slate-200'
                }`}>
                  Thông Tin Người Đặt
                </div>
                <div className="flex items-center justify-between">
                  <span className={isDarkMode ? 'text-slate-500' : 'text-slate-400'}>Khách hàng:</span>
                  <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{selectedOrderForDetail.ten_khach_hang || 'Khách vãng lai'}</span>
                </div>
                {selectedOrderForDetail.sdt_khach_hang && (
                  <div className="flex items-center justify-between">
                    <span className={isDarkMode ? 'text-slate-500' : 'text-slate-400'}>Số điện thoại:</span>
                    <span className={`font-mono font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{selectedOrderForDetail.sdt_khach_hang}</span>
                  </div>
                )}
                {selectedOrderForDetail.ngay_tao && (
                  <div className="flex items-center justify-between">
                    <span className={isDarkMode ? 'text-slate-500' : 'text-slate-400'}>Thời gian tạo đơn:</span>
                    <span className={`font-mono text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{new Date(selectedOrderForDetail.ngay_tao).toLocaleString('vi-VN')}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className={isDarkMode ? 'text-slate-500' : 'text-slate-400'}>Phương thức:</span>
                  <span className={`font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{selectedOrderForDetail.phuong_thuc === 'CHUYEN_KHOAN' ? 'Chuyển khoản (VietQR)' : 'Tiền mặt tại quầy'}</span>
                </div>
              </div>

              {/* Chi tiết chi phí */}
              <div className={`p-3.5 rounded-2xl border space-y-2.5 ${
                isDarkMode ? 'bg-slate-950/70 border-slate-800/80' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className={`font-bold uppercase tracking-wider text-[11px] pb-1 border-b ${
                  isDarkMode ? 'text-slate-300 border-slate-800/60' : 'text-slate-700 border-slate-200'
                }`}>
                  Bảng Chi Phí & Dịch Vụ
                </div>

                <div className={`flex items-center justify-between ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  <span>Tiền thuê sân bóng:</span>
                  <span className={`font-bold font-mono ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(selectedOrderForDetail.tien_san || selectedOrderForDetail.tong_tien)}</span>
                </div>

                {/* Danh sách dịch vụ nếu có */}
                {selectedOrderForDetail.chi_tiet_dich_vu && selectedOrderForDetail.chi_tiet_dich_vu.length > 0 ? (
                  <div className={`pt-2 border-t space-y-1.5 ${isDarkMode ? 'border-slate-800/60' : 'border-slate-200'}`}>
                    <div className={`text-[11px] font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Dịch vụ / Nước uống đã gọi:</div>
                    {selectedOrderForDetail.chi_tiet_dich_vu.map((dv, idx) => (
                      <div key={idx} className={`flex items-center justify-between text-[11px] pl-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        <span>• {dv.ten_dich_vu} <span className={isDarkMode ? 'text-slate-500' : 'text-slate-400'}>(x{dv.so_luong})</span>:</span>
                        <span className="font-mono text-emerald-500">{formatCurrency(dv.tongtien_dichvu)}</span>
                      </div>
                    ))}
                  </div>
                ) : null}

                {/* Tổng kết tài chính */}
                <div className={`pt-2.5 border-t space-y-1.5 ${isDarkMode ? 'border-slate-800/80' : 'border-slate-200'}`}>
                  <div className="flex items-center justify-between text-sm font-bold">
                    <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>Tổng tiền thanh toán:</span>
                    <span className="text-emerald-500 font-mono text-base">{formatCurrency(selectedOrderForDetail.tong_tien)}</span>
                  </div>
                  <div className={`flex items-center justify-between text-xs ${isDarkMode ? 'text-teal-300' : 'text-teal-700'}`}>
                    <span>Tiền cọc quy định:</span>
                    <span className="font-mono font-semibold">{formatCurrency(selectedOrderForDetail.tien_coc ?? Math.round(selectedOrderForDetail.tong_tien * 0.3))}</span>
                  </div>
                  {(() => {
                    const isFullyPaid = (selectedOrderForDetail.trang_thai === 'DA_THANH_TOAN' || selectedOrderForDetail.trang_thai === 'HOAN_THANH' || selectedOrderForDetail.trang_thai === 'KET_THUC');
                    const modalDaNhan = isFullyPaid ? selectedOrderForDetail.tong_tien : (selectedOrderForDetail.tien_da_nhan || 0);
                    const modalThieu = isFullyPaid ? 0 : (selectedOrderForDetail.tien_thieu || Math.max(0, (selectedOrderForDetail.tong_tien || 0) - modalDaNhan));
                    return (
                      <>
                        <div className={`flex items-center justify-between text-xs ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                          <span>Đã nhận / Đã thanh toán:</span>
                          <span className="font-mono font-bold text-emerald-500">{formatCurrency(modalDaNhan)}</span>
                        </div>
                        <div className={`flex items-center justify-between text-xs font-bold pt-1 border-t ${isDarkMode ? 'border-slate-800/50' : 'border-slate-200'}`}>
                          <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Số tiền còn thiếu:</span>
                          <span className={`font-mono text-sm ${modalThieu > 0 ? (isDarkMode ? 'text-amber-400' : 'text-amber-600') : 'text-emerald-500'}`}>
                            {modalThieu > 0 ? formatCurrency(modalThieu) : '0 ₫ (Đã thanh toán đủ)'}
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className={`p-4 border-t flex items-center justify-end gap-2 ${
              isDarkMode ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-50'
            }`}>
              <button
                type="button"
                onClick={() => setSelectedOrderForDetail(null)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                }`}
              >
                Đóng
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
