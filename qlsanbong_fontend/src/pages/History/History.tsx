"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
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
  FileText
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
  // TÍNH TOÁN THỐNG KÊ NHANH
  // =========================================================================
  const totalBookings = danhSachDon.length;

  // Số lượng đơn Đã đặt cọc (có tiền đã nhận / trạng thái DA_COC và còn thiếu tiền)
  const daCocCount = danhSachDon.filter((don) => {
    const st = (don.trang_thai || '').toUpperCase();
    if (st === 'DA_HUY') return false;
    const tienCoc = don.tien_coc ?? Math.round((don.tong_tien || 0) * 0.3);
    const tienDaNhan = don.tien_da_nhan ?? (
      (st === 'DA_THANH_TOAN' || st === 'HOAN_THANH') ? don.tong_tien : (st === 'DA_COC' ? tienCoc : 0)
    );
    const tienThieu = don.tien_thieu ?? Math.max(0, (don.tong_tien || 0) - tienDaNhan);
    return (st === 'DA_COC' || tienDaNhan > 0) && tienThieu > 0;
  }).length;

  // Số lượng đơn Đã thanh toán (100% hoặc hoàn thành)
  const daThanhToanCount = danhSachDon.filter((don) => {
    const st = (don.trang_thai || '').toUpperCase();
    if (st === 'DA_HUY') return false;
    const tienCoc = don.tien_coc ?? Math.round((don.tong_tien || 0) * 0.3);
    const tienDaNhan = don.tien_da_nhan ?? (
      (st === 'DA_THANH_TOAN' || st === 'HOAN_THANH') ? don.tong_tien : (st === 'DA_COC' ? tienCoc : 0)
    );
    const tienThieu = don.tien_thieu ?? Math.max(0, (don.tong_tien || 0) - tienDaNhan);
    return st === 'DA_THANH_TOAN' || st === 'DA THANH TOAN' || st === 'HOAN_THANH' || tienThieu <= 0;
  }).length;

  const totalSpent = danhSachDon
    .filter((don) => (don.trang_thai || '').toUpperCase() !== 'DA_HUY')
    .reduce((sum, don) => sum + (Number(don.tong_tien) || 0), 0);

  // Helper hiển thị badge trạng thái chuẩn hóa
  const renderStatusBadge = (status: string, tienThieu: number = 0, tienDaNhan: number = 0) => {
    const s = (status || '').toUpperCase();
    if (s === 'DA_HUY') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
          <AlertCircle className="w-3 h-3 text-rose-400" />
          Đã hủy
        </span>
      );
    }
    if (tienThieu > 0) {
      if (tienDaNhan > 0) {
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm">
            <Clock3 className="w-3 h-3 text-amber-400" />
            {s === 'DA_COC' ? 'Đã đặt cọc' : 'Chờ thanh toán'}
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
          <Clock3 className="w-3 h-3 text-amber-400" />
          Chờ thanh toán
        </span>
      );
    }
    if (s === 'DA_THANH_TOAN' || s === 'DA THANH TOAN' || s === 'HOAN_THANH' || (tienThieu <= 0 && tienDaNhan > 0)) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          Đã thanh toán
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-sm">
        <CheckCircle2 className="w-3 h-3 text-teal-400" />
        Đã đặt cọc
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8 font-sans selection:bg-emerald-500 selection:text-white relative">
      
      {/* Toast Notification Floating */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 animate-bounce duration-300">
          <div className={`px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md border flex items-center gap-3 text-xs font-semibold ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40'
              : toastMessage.type === 'error'
              ? 'bg-rose-950/90 text-rose-300 border-rose-500/40'
              : 'bg-slate-900/90 text-slate-200 border-slate-700'
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
                Lịch Sử Đặt Sân & Hóa Đơn
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Theo dõi danh sách đơn đặt sân bóng, dịch vụ kèm theo và thanh toán
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Tổng số đơn */}
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

          {/* Card 2: Đã cọc */}
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 flex items-center gap-4 shadow-lg shadow-black/40">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Clock3 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Đã cọc</p>
              <p className="text-xl font-extrabold text-amber-400 mt-0.5">
                {isLoading ? '...' : `${daCocCount} đơn`}
              </p>
            </div>
          </div>

          {/* Card 3: Đã thanh toán */}
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 flex items-center gap-4 shadow-lg shadow-black/40">
            <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/20">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Đã thanh toán</p>
              <p className="text-xl font-extrabold text-teal-300 mt-0.5">
                {isLoading ? '...' : `${daThanhToanCount} đơn`}
              </p>
            </div>
          </div>

          {/* Card 4: Tổng giá trị đơn đặt */}
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 flex items-center gap-4 shadow-lg shadow-black/40">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Tổng giá trị đơn đặt</p>
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

        {/* Bảng & Danh sách đơn đặt sân */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <HistoryIcon className="w-5 h-5 text-emerald-400" />
              Chi Tiết Đơn Đặt Sân
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
            /* Bảng hiển thị đơn đặt sân & tài chính */
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                    <th className="py-3.5 px-4 whitespace-nowrap">Mã Đơn</th>
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
                <tbody className="divide-y divide-slate-800/70 text-xs">
                  {danhSachDon.map((item) => {
                    const isPast = isOrderPastTime(item);
                    const tienCoc = item.tien_coc ?? Math.round((item.tong_tien || 0) * 0.3);
                    const tienDaNhan = item.tien_da_nhan ?? (
                      (item.trang_thai === 'DA_THANH_TOAN' || item.trang_thai === 'HOAN_THANH')
                        ? item.tong_tien
                        : (item.trang_thai === 'DA_COC' ? tienCoc : 0)
                    );
                    const tienThieu = item.tien_thieu ?? Math.max(0, (item.tong_tien || 0) - tienDaNhan);
                    const isFullyPaid = (item.trang_thai === 'DA_THANH_TOAN' || item.trang_thai === 'HOAN_THANH' || tienThieu <= 0);
                    const isCancelled = item.trang_thai === 'DA_HUY';
                    const canAddService = !isCancelled && (item.trang_thai === 'DA_COC' || item.trang_thai === 'DA_THANH_TOAN' || item.trang_thai === 'HOAN_THANH' || tienDaNhan > 0);

                    return (
                      <tr
                        key={item.id || item.ma_don}
                        className={`transition-all group ${
                          isPast
                            ? 'opacity-60 hover:opacity-100 bg-slate-950/40 hover:bg-slate-900/60'
                            : 'hover:bg-slate-850/60'
                        }`}
                      >
                        {/* Mã đơn (Hiển thị đẹp, không bị xuống dòng) */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[11px] font-mono font-black tracking-wider shadow-sm ${
                            isPast 
                              ? 'bg-slate-800/60 border-slate-700/80 text-slate-300' 
                              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          }`}>
                            {item.ma_don || `DDS-${item.id}`}
                          </span>
                        </td>

                        {/* Tên sân */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className={`font-bold transition-colors ${
                            isPast ? 'text-slate-300 group-hover:text-white' : 'text-white group-hover:text-emerald-400'
                          }`}>
                            {item.ten_san}
                          </div>
                          {item.ten_loai && (
                            <div className="text-[10px] text-slate-500">
                              {item.ten_loai}
                            </div>
                          )}
                        </td>

                        {/* Ngày & Khung giờ */}
                        <td className="py-4 px-4 text-slate-300">
                          <div className="flex items-center gap-1.5 font-medium whitespace-nowrap">
                            <Calendar className="w-3.5 h-3.5 text-emerald-500/70" />
                            {formatDateDMY(item.ngay_da)}
                          </div>
                          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400 mt-1 whitespace-nowrap">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>{item.gio_bat_dau} - {item.gio_ket_thuc}</span>
                          </div>
                          {isPast && (
                            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 text-[10px] text-slate-400 mt-1 font-medium">
                              <Clock3 className="w-2.5 h-2.5 text-slate-400" />
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
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-300 font-medium whitespace-nowrap"
                                  title={`${dv.ten_dich_vu} x${dv.so_luong} = ${formatCurrency(dv.tongtien_dichvu)}`}
                                >
                                  <Coffee className="w-3 h-3 text-emerald-400" />
                                  <span>{dv.ten_dich_vu} x{dv.so_luong}</span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-500 italic">Chưa chọn dịch vụ</span>
                          )}
                        </td>

                        {/* Tổng tiền */}
                        <td className="py-4 px-4 font-bold text-white text-right whitespace-nowrap">
                          {formatCurrency(item.tong_tien)}
                        </td>

                        {/* Tiền cọc */}
                        <td className="py-4 px-4 font-medium text-teal-300 text-right whitespace-nowrap">
                          {formatCurrency(tienCoc)}
                        </td>

                        {/* Đã nhận */}
                        <td className="py-4 px-4 font-bold text-emerald-400 text-right whitespace-nowrap">
                          <span className="inline-block px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                            {formatCurrency(tienDaNhan)}
                          </span>
                        </td>

                        {/* Còn thiếu */}
                        <td className="py-4 px-4 font-bold text-right whitespace-nowrap">
                          {tienThieu > 0 ? (
                            <span className="inline-block px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              {formatCurrency(tienThieu)}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                              <Check className="w-3 h-3" /> Đã đủ
                            </span>
                          )}
                        </td>

                        {/* Trạng thái thanh toán */}
                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          {renderStatusBadge(item.trang_thai, tienThieu, tienDaNhan)}
                        </td>

                        {/* Hành động */}
                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            {isPast ? (
                              /* Đơn đã qua giờ: CHỈ HIỆN DUY NHẤT NÚT XEM CHI TIẾT */
                              <button
                                onClick={() => setSelectedOrderForDetail(item)}
                                className="px-3 py-1.5 text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white rounded-lg border border-slate-700 hover:border-cyan-500/50 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:scale-105"
                                title="Xem chi tiết đơn đặt sân & hóa đơn"
                              >
                                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                                <span>Xem chi tiết</span>
                              </button>
                            ) : (
                              /* Đơn chưa qua giờ: Hiện các nút tương tác bình thường */
                              <>
                                {/* Nút Xem chi tiết nhanh */}
                                <button
                                  onClick={() => setSelectedOrderForDetail(item)}
                                  className="p-1.5 text-slate-400 hover:text-cyan-300 bg-slate-950 hover:bg-slate-800 rounded-lg border border-slate-800 hover:border-cyan-500/50 transition-all cursor-pointer"
                                  title="Xem chi tiết hóa đơn"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>

                                {/* Nút Dịch Vụ: Chỉ hiện khi đơn chưa bị hủy */}
                                {canAddService && (
                                  <button
                                    onClick={() => handleOpenAddServiceModal(item)}
                                    className="px-2.5 py-1.5 text-[11px] font-semibold bg-slate-950 hover:bg-slate-800 text-slate-200 hover:text-emerald-400 rounded-lg border border-slate-700/80 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:border-emerald-500/50"
                                    title="Thêm nước uống, phụ kiện vào hóa đơn này"
                                  >
                                    <Plus className="w-3.5 h-3.5 text-emerald-400" />
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
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Thêm Dịch Vụ Vào Đơn Hàng</h3>
                  <p className="text-xs text-slate-400">
                    Đơn: <span className="font-mono text-emerald-400 font-bold">{selectedOrderForService.ma_don || `DDS-${selectedOrderForService.id}`}</span> • {selectedOrderForService.ten_san}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrderForService(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Danh sách dịch vụ */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400">Tổng tiền hiện tại của đơn:</span>
                  <span className="font-bold text-white ml-2">{formatCurrency(selectedOrderForService.tong_tien)}</span>
                </div>
                <div>
                  <span className="text-slate-400">Đã trả:</span>
                  <span className="font-bold text-emerald-400 ml-2">{formatCurrency(selectedOrderForService.tien_da_nhan || 0)}</span>
                </div>
              </div>

              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
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
                          ? 'bg-emerald-500/10 border-emerald-500/40 shadow-sm'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="font-bold text-xs text-white flex items-center gap-1.5">
                          <Coffee className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{service.ten_dich_vu}</span>
                        </div>
                        <div className="text-xs font-semibold text-emerald-400">
                          {formatCurrency(service.don_gia)} <span className="text-[10px] text-slate-400 font-normal">/ {service.don_vi_tinh}</span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Còn lại trong kho: {service.ton_kho}
                        </div>
                      </div>

                      {/* Bộ tăng giảm số lượng */}
                      <div className="flex items-center gap-2 bg-slate-900 px-2 py-1 rounded-xl border border-slate-800">
                        <button
                          type="button"
                          onClick={() => handleUpdateServiceQuantity(service.id, -1)}
                          disabled={currentQty <= 0}
                          className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 flex items-center justify-center cursor-pointer transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center font-mono font-bold text-xs text-white">
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
            <div className="p-6 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="text-xs text-slate-400">Tiền dịch vụ đã chọn:</div>
                <div className="text-lg font-black text-emerald-400">
                  {formatCurrency(calculateAddedServicesTotal())}
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setSelectedOrderForService(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-900 transition-colors w-full sm:w-auto cursor-pointer"
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl w-full max-w-md max-h-[92vh] overflow-hidden shadow-2xl flex flex-col my-auto">
            
            {/* Header VietQR */}
            <div className="px-4 sm:px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/90 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Thanh Toán Số Tiền Còn Thiếu
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Đơn đặt: <span className="text-emerald-400 font-mono font-bold">{selectedOrderForPayment.ma_don || `DDS-${selectedOrderForPayment.id}`}</span>
                    <span className="ml-1.5 text-amber-400 font-bold">• VietQR MB Bank</span>
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseQRModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Nội dung thanh toán hoặc màn hình thành công */}
            <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto">
              {isPaymentSuccess ? (
                <div className="py-6 text-center space-y-3">
                  <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-500/40 animate-pulse">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">Thanh Toán Thành Công!</h4>
                    <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
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
                  <p className="text-xs text-slate-400">Đang khởi tạo mã VietQR MB Bank...</p>
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
                    <p className="text-[10px] text-slate-400 mt-1.5 text-center">
                      Quét mã bằng App ngân hàng bất kỳ để thanh toán tự động
                    </p>
                  </div>

                  {/* Thông tin chuyển khoản chi tiết */}
                  <div className="bg-slate-950 rounded-xl p-3 sm:p-3.5 border border-slate-800/90 space-y-2 text-[11px] sm:text-xs">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/70">
                      <span className="text-slate-400">Ngân hàng:</span>
                      <span className="font-bold text-white text-right">{payOSData.bankName || 'MB Bank (Quân Đội)'}</span>
                    </div>

                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/70">
                      <span className="text-slate-400">Chủ tài khoản:</span>
                      <span className="font-bold text-white">{payOSData.accountName || 'CAO VAN HOT XOAN'}</span>
                    </div>

                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/70">
                      <span className="text-slate-400">Số tài khoản:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-emerald-400">{payOSData.accountNumber}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(payOSData.accountNumber, 'Số tài khoản')}
                          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                          title="Sao chép"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/70">
                      <span className="text-slate-400">Số tiền thanh toán:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-amber-400 text-xs sm:text-sm">
                          {formatCurrency(payOSData.amount)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(String(payOSData.amount), 'Số tiền')}
                          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                          title="Sao chép"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Nội dung:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          {payOSData.description}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(payOSData.description, 'Nội dung')}
                          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
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
                      className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center justify-center gap-2 cursor-pointer transition-colors"
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col my-auto max-h-[90vh]">
            
            {/* Header Modal */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Chi Tiết Hóa Đơn Đặt Sân</span>
                    {isOrderPastTime(selectedOrderForDetail) && (
                      <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        Đã qua giờ
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Mã đơn: <span className="font-mono text-emerald-400 font-bold">{selectedOrderForDetail.ma_don || `DDS-${selectedOrderForDetail.id}`}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrderForDetail(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nội dung chi tiết hóa đơn */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Thông tin sân & trận đấu */}
              <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800/80 space-y-2.5">
                <div className="font-bold text-slate-300 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-800/60">
                  Thông Tin Trận Đấu
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <div>
                    <span className="text-slate-500 block">Sân bóng:</span>
                    <span className="font-bold text-white text-sm">{selectedOrderForDetail.ten_san}</span>
                    {selectedOrderForDetail.ten_loai && (
                      <span className="text-slate-400 text-[11px] block">({selectedOrderForDetail.ten_loai})</span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-500 block">Ngày thi đấu:</span>
                    <span className="font-bold text-emerald-400">{formatDateDMY(selectedOrderForDetail.ngay_da)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Khung giờ đá:</span>
                    <span className="font-mono font-bold text-white">{selectedOrderForDetail.gio_bat_dau} - {selectedOrderForDetail.gio_ket_thuc}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Trạng thái:</span>
                    <span className="mt-0.5 block">{renderStatusBadge(selectedOrderForDetail.trang_thai, selectedOrderForDetail.tien_thieu || 0, selectedOrderForDetail.tien_da_nhan || 0)}</span>
                  </div>
                </div>

                {selectedOrderForDetail.ghi_chu && (
                  <div className="pt-2 border-t border-slate-800/60 text-slate-400 text-[11px]">
                    <span className="text-slate-500">Ghi chú:</span> {selectedOrderForDetail.ghi_chu}
                  </div>
                )}
              </div>

              {/* Thông tin khách hàng & đặt sân */}
              <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800/80 space-y-2 text-slate-300">
                <div className="font-bold text-slate-300 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-800/60">
                  Thông Tin Người Đặt
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Khách hàng:</span>
                  <span className="font-bold text-white">{selectedOrderForDetail.ten_khach_hang || 'Khách vãng lai'}</span>
                </div>
                {selectedOrderForDetail.sdt_khach_hang && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Số điện thoại:</span>
                    <span className="font-mono font-bold text-slate-200">{selectedOrderForDetail.sdt_khach_hang}</span>
                  </div>
                )}
                {selectedOrderForDetail.ngay_tao && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Thời gian tạo đơn:</span>
                    <span className="text-slate-400 font-mono text-[11px]">{new Date(selectedOrderForDetail.ngay_tao).toLocaleString('vi-VN')}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Phương thức:</span>
                  <span className="font-semibold text-slate-300">{selectedOrderForDetail.phuong_thuc === 'CHUYEN_KHOAN' ? 'Chuyển khoản (VietQR)' : 'Tiền mặt tại quầy'}</span>
                </div>
              </div>

              {/* Chi tiết chi phí */}
              <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800/80 space-y-2.5">
                <div className="font-bold text-slate-300 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-800/60">
                  Bảng Chi Phí & Dịch Vụ
                </div>

                <div className="flex items-center justify-between text-slate-300">
                  <span>Tiền thuê sân bóng:</span>
                  <span className="font-bold text-white font-mono">{formatCurrency(selectedOrderForDetail.tien_san || selectedOrderForDetail.tong_tien)}</span>
                </div>

                {/* Danh sách dịch vụ nếu có */}
                {selectedOrderForDetail.chi_tiet_dich_vu && selectedOrderForDetail.chi_tiet_dich_vu.length > 0 ? (
                  <div className="pt-2 border-t border-slate-800/60 space-y-1.5">
                    <div className="text-[11px] text-slate-400 font-semibold">Dịch vụ / Nước uống đã gọi:</div>
                    {selectedOrderForDetail.chi_tiet_dich_vu.map((dv, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[11px] pl-2 text-slate-300">
                        <span>• {dv.ten_dich_vu} <span className="text-slate-500">(x{dv.so_luong})</span>:</span>
                        <span className="font-mono text-emerald-400">{formatCurrency(dv.tongtien_dichvu)}</span>
                      </div>
                    ))}
                  </div>
                ) : null}

                {/* Tổng kết tài chính */}
                <div className="pt-2.5 border-t border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-sm font-bold">
                    <span className="text-white">Tổng tiền thanh toán:</span>
                    <span className="text-emerald-400 font-mono text-base">{formatCurrency(selectedOrderForDetail.tong_tien)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-teal-300">
                    <span>Tiền cọc quy định:</span>
                    <span className="font-mono font-semibold">{formatCurrency(selectedOrderForDetail.tien_coc ?? Math.round(selectedOrderForDetail.tong_tien * 0.3))}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span>Đã nhận / Đã thanh toán:</span>
                    <span className="font-mono font-bold text-emerald-400">{formatCurrency(selectedOrderForDetail.tien_da_nhan || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold pt-1 border-t border-slate-800/50">
                    <span className="text-slate-400">Số tiền còn thiếu:</span>
                    <span className={`font-mono text-sm ${(selectedOrderForDetail.tien_thieu || 0) > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {(selectedOrderForDetail.tien_thieu || 0) > 0 ? formatCurrency(selectedOrderForDetail.tien_thieu || 0) : '0 ₫ (Đã thanh toán đủ)'}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedOrderForDetail(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
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
