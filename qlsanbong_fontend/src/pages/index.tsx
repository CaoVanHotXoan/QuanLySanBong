"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { io, Socket } from 'socket.io-client';
import { useAppTheme } from '@/hooks/useAppTheme';
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Search,
  User,
  LogOut,
  History,
  Coffee,
  Shirt,
  Award,
  Zap,
  ChevronRight,
  Info,
  X,
  DollarSign,
  Activity,
  SlidersHorizontal,
  ChevronDown,
  Sun,
  Moon,
  ArrowLeft,
  ArrowRight,
  QrCode,
  RefreshCw,
  Flame,
  Check,
  Copy,
  ExternalLink,
  Loader2,
  Building2,
  Sparkles,
  LandPlot,
  Play,
  Pause,
  ImageIcon,
  Menu,
  Smartphone,
  Table,
  Sunrise,
  Sunset,
  LayoutGrid,
  ShoppingCart,
  Trash2,
  Layers
} from 'lucide-react';
import Login, { AuthUser } from './Login/login';
import Profile from './profile';
import SoccerLoader from '../components/SoccerLoader';
import DateNavigationBar from '../components/DateNavigationBar';
import Footer from '../components/Footer';
import { useBookingSync } from '../hooks/useBookingSync';
import { contentService, BannerItem } from '@/services/contentService';

/**
 * Interface Dữ liệu trả về từ Cổng thanh toán PayOS (MB Bank VietQR)
 */
interface PayOSData {
  orderCode: number;
  ma_don_dat?: number | null;
  amount: number;
  description: string;
  accountNumber: string;
  accountName: string;
  bin: string;
  bankName: string;
  checkoutUrl: string;
  qrCode: string;
  paymentLinkId?: string;
  status: string;
}


// =====================================================================
// 1. ĐỊNH NGHĨA INTERFACES & KIỂU DỮ LIỆU (MAPPING TỪ CSDL SQL SERVER)
// =====================================================================

/**
 * Interface Loại Sân - Tương ứng bảng Loai_San trong CSDL SQL Server
 */
interface LoaiSan {
  id: number;
  ten_loai: string;
  mo_ta: string;
  trang_thai?: boolean;
}

/**
 * Interface Sân Bóng - Tương ứng bảng San_Bong & thủ tục sp_LayDanhSachSan
 */
interface SanBong {
  id: number;
  ma_loai_san: number;
  ten_san: string;
  ten_loai: string;
  don_gia_phut: number;
  hinh_anh?: string;
  mo_ta?: string;
  trang_thai: 'SAN_SANG' | 'BAO_TRI';
}

/**
 * Trạng thái slot giờ đá (Mapping từ Don_Dat_San và sp_LayLichSan trong SQL Server):
 * - TRONG: Sân còn trống trong CSDL, khách có thể click đặt sân ngay
 * - CHO_XAC_NHAN: Đang có khách giữ chỗ cọc trong CSDL
 * - DA_CHOT: Đã chốt đơn trong CSDL (Màu đỏ)
 */
type TrangThaiSlot = 'TRONG' | 'CHO_XAC_NHAN' | 'DA_CHOT';

interface SlotLichSan {
  ma_san: number;
  gio_bat_dau: string; // VD: '06:00'
  gio_ket_thuc: string; // VD: '06:30'
  trang_thai: TrangThaiSlot;
  ma_don_dat?: number;
  ten_khach_hang?: string;
  gio_bat_dau_don?: string;
  gio_ket_thuc_don?: string;
  gia_ap_dung: number;
}

/**
 * Interface Dịch Vụ Đi Kèm - Tương ứng bảng Dich_Vu trong CSDL SQL Server
 */
interface DichVu {
  id: number;
  ten_dich_vu: string;
  don_gia: number;
  don_vi_tinh: string;
  ton_kho: number;
}

// Cấu hình URL Backend API Express kết nối trực tiếp CSDL SQL Server
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
// Cấu hình URL Socket.io Real-time (Tự động suy ra từ API_BASE_URL nếu không cấu hình riêng)
const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:5000');

// Interface Khung giờ đá mapping từ bảng Khung_Gio trong CSDL SQL Server
export interface KhungGioItem {
  start: string; // VD: '06:00'
  end: string;   // VD: '06:30'
  label: string; // VD: '6h'
}

// Danh sách các khung giờ đá 30 phút chuẩn từ 06:00 đến 19:00 (6h, 6h30, ..., 19h)
const DEFAULT_TIME_SLOTS: KhungGioItem[] = [];
for (let h = 6; h <= 18; h++) {
  const start0 = `${String(h).padStart(2, '0')}:00`;
  const end0 = `${String(h).padStart(2, '0')}:30`;
  DEFAULT_TIME_SLOTS.push({
    start: start0,
    end: end0,
    label: `${h}h`,
  });

  const start30 = `${String(h).padStart(2, '0')}:30`;
  const nextH = h + 1;
  const end30 = `${String(nextH).padStart(2, '0')}:00`;
  DEFAULT_TIME_SLOTS.push({
    start: start30,
    end: end30,
    label: `${h}h30`,
  });
}
// Mốc cuối cùng: 19h (19:00 - 19:30)
DEFAULT_TIME_SLOTS.push({
  start: '19:00',
  end: '19:30',
  label: '19h',
});

const TIME_SLOTS = DEFAULT_TIME_SLOTS;

// Helper cộng số phút vào giờ dạng "HH:mm"
function addMinutesToTime(timeStr: string, minutes: number): string {
  const [h, m] = timeStr.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const newH = Math.floor(total / 60);
  const newM = total % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

// Helper kiểm tra 2 khoảng thời gian có giao nhau không
function isTimeOverlapping(startA: string, endA: string, startB: string, endB: string): boolean {
  return startA < endB && endA > startB;
}

// Helper định dạng ngày YYYY-MM-DD sang DD/MM/YYYY (Ngày/Tháng/Năm)
function formatDateDMY(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

// Helper định dạng ngày YYYY-MM-DD sang dạng đầy đủ chữ "Ngày DD tháng MM năm YYYY"
function formatDateVietnamese(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `Ngày ${parts[2]} tháng ${parts[1]} năm ${parts[0]}`;
  }
  return dateStr;
}

// Cấu hình thông tin hiển thị môn thể thao (Icon, mô tả đặc điểm, badge xu hướng)
export interface SportTheme {
  icon: string;
  subtitle: string;
  badge?: string;
  gradient: string;
  iconBg: string;
  accentColor: string;
}

export const getSportTheme = (name: string, moTa?: string): SportTheme => {
  const n = (name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  if (n.includes('bong da') || n.includes('san 5') || n.includes('san 7') || n.includes('san 11') || n.includes('mini')) {
    return {
      icon: '⚽',
      subtitle: moTa || 'Sân 5, 7, 11 người • Cỏ FIFA',
      gradient: 'from-blue-950/40 via-slate-900/60 to-slate-900/90',
      iconBg: 'bg-blue-500/15 border-blue-500/30 text-blue-400',
      accentColor: 'text-blue-400',
    };
  }
  if (n.includes('cau long') || n.includes('badminton')) {
    return {
      icon: '🏸',
      subtitle: moTa || 'Thảm Taraflex • Sàn gỗ chuẩn',
      gradient: 'from-indigo-950/40 via-slate-900/60 to-slate-900/90',
      iconBg: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400',
      accentColor: 'text-indigo-400',
    };
  }
  if (n.includes('pickleball')) {
    return {
      icon: '🏓',
      subtitle: moTa || 'Có mái che • Điều hòa mát lạnh',
      badge: '🔥 Xu hướng',
      gradient: 'from-pink-950/40 via-slate-900/60 to-slate-900/90',
      iconBg: 'bg-pink-500/15 border-pink-500/30 text-pink-400',
      accentColor: 'text-pink-400',
    };
  }
  if (n.includes('quan vot') || n.includes('tennis')) {
    return {
      icon: '🎾',
      subtitle: moTa || 'Mặt sân cứng • Đèn LED ban đêm',
      gradient: 'from-emerald-950/40 via-slate-900/60 to-slate-900/90',
      iconBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
      accentColor: 'text-emerald-400',
    };
  }
  if (n.includes('bong ro') || n.includes('basketball')) {
    return {
      icon: '🏀',
      subtitle: moTa || 'Trong nhà & Ngoài trời',
      gradient: 'from-orange-950/40 via-slate-900/60 to-slate-900/90',
      iconBg: 'bg-orange-500/15 border-orange-500/30 text-orange-400',
      accentColor: 'text-orange-400',
    };
  }
  if (n.includes('bong chuyen') || n.includes('volleyball')) {
    return {
      icon: '🏐',
      subtitle: moTa || 'Mặt sân cao cấp • Lưới chuẩn',
      gradient: 'from-purple-950/40 via-slate-900/60 to-slate-900/90',
      iconBg: 'bg-purple-500/15 border-purple-500/30 text-purple-400',
      accentColor: 'text-purple-400',
    };
  }
  if (n.includes('bong ban') || n.includes('table tennis')) {
    return {
      icon: '🏓',
      subtitle: moTa || 'Bàn thi đấu quốc tế',
      gradient: 'from-rose-950/40 via-slate-900/60 to-slate-900/90',
      iconBg: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
      accentColor: 'text-rose-400',
    };
  }
  return {
    icon: '🏆',
    subtitle: moTa || 'Sân thể thao tiêu chuẩn thi đấu',
    gradient: 'from-slate-950/40 via-slate-900/60 to-slate-900/90',
    iconBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
    accentColor: 'text-emerald-400',
  };
};

// Helper kiểm tra sân hoặc loại sân có phải là "Dự bị" hay không để ẩn trên trang chủ Khách hàng
function isDuBiPitch(item?: { ten_loai?: string; ten_san?: string; mo_ta?: string } | null): boolean {
  if (!item) return false;
  const str = `${item.ten_loai || ''} ${item.ten_san || ''} ${item.mo_ta || ''}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return str.includes('du bi') || str.includes('du phong');
}

// Icon quả bóng đá màu đen trắng chuẩn
function SoccerBallIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9.5" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.5" />
      <polygon points="12,7.5 15.5,10 14.2,14 9.8,14 8.5,10" fill="#0F172A" stroke="#0F172A" strokeWidth="0.5" />
      <line x1="12" y1="7.5" x2="12" y2="2.5" stroke="#0F172A" strokeWidth="1.3" />
      <line x1="15.5" y1="10" x2="20.5" y2="8" stroke="#0F172A" strokeWidth="1.3" />
      <line x1="14.2" y1="14" x2="18" y2="19" stroke="#0F172A" strokeWidth="1.3" />
      <line x1="9.8" y1="14" x2="6" y2="19" stroke="#0F172A" strokeWidth="1.3" />
      <line x1="8.5" y1="10" x2="3.5" y2="8" stroke="#0F172A" strokeWidth="1.3" />
      <path d="M9.5 2.8C10.3 2.6 11.1 2.5 12 2.5C12.9 2.5 13.7 2.6 14.5 2.8L13.8 5.5L10.2 5.5L9.5 2.8Z" fill="#0F172A" />
      <path d="M21.2 9.5C21.4 10.3 21.5 11.1 21.5 12C21.5 12.8 21.4 13.5 21.2 14.3L18.5 13L18.5 11L21.2 9.5Z" fill="#0F172A" />
      <path d="M2.8 9.5L5.5 11L5.5 13L2.8 14.3C2.6 13.5 2.5 12.8 2.5 12C2.5 11.1 2.6 10.3 2.8 9.5Z" fill="#0F172A" />
      <path d="M14.5 21.2C13.7 21.4 12.9 21.5 12 21.5C11.1 21.5 10.3 21.4 9.5 21.2L10.2 18.5L13.8 18.5L14.5 21.2Z" fill="#0F172A" />
    </svg>
  );
}

// =====================================================================
// 2. COMPONENT TRANG CHỦ CHÍNH (HOMEPAGE COMPONENT)
// =====================================================================

export default function HomePage() {
  const router = useRouter();

  // Hook đồng bộ Real-time với Management System (qua localStorage SYSTEM_ORDERS)
  const { orders: syncOrders } = useBookingSync();

  // -------------------------------------------------------------
  // A. CÁC STATE QUẢN LÝ DỮ LIỆU THỰC TỪ SQL SERVER
  // -------------------------------------------------------------

  // Ref kết nối Socket.io Real-time
  const socketRef = useRef<Socket | null>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Danh sách các ID slot đang bị khóa trên hệ thống Real-time (toàn bộ các khách hàng đang chọn)
  const [lockedSlots, setLockedSlots] = useState<string[]>([]);

  // Danh sách các SlotId do CHÍNH khách hàng hiện tại đang giữ chỗ khi chọn mốc thời gian trong Modal
  const [myLockedSlotIds, setMyLockedSlotIds] = useState<string[]>([]);
  const myLockedSlotId = myLockedSlotIds[0] || null;

  // Chuyển đổi Giao diện Sáng / Tối (Đồng bộ thời gian thực toàn hệ thống)
  const { isDarkMode, setIsDarkMode, toggleTheme } = useAppTheme(true);

  // Danh sách dữ liệu nạp trực tiếp từ SQL Server
  const [loaiSanList, setLoaiSanList] = useState<LoaiSan[]>([]);
  const [sanBongList, setSanBongList] = useState<SanBong[]>([]);
  const [dichVuList, setDichVuList] = useState<DichVu[]>([]);

  // Danh sách đơn đặt sân thô nạp từ SQL Server
  const [rawBookings, setRawBookings] = useState<any[]>([]);

  // Lưới ma trận slot lịch sân (Được tổng hợp từ San_Bong + sp_LayLichSan SQL Server)
  const [gridSlots, setGridSlots] = useState<Record<string, SlotLichSan>>({});

  // Trạng thái tải dữ liệu từ SQL Server
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  // State Banner Slider (Nếu là hình ảnh thì 9s chuyển, video thì hết video chuyển)
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState<number>(0);
  const [isBannerMuted, setIsBannerMuted] = useState<boolean>(true);
  const [bannerProgress, setBannerProgress] = useState<number>(0);
  const bannerVideoRef = useRef<HTMLVideoElement | null>(null);

  // State xác thực người dùng đã đăng nhập (Lưu từ SQL Server)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [loginInitialRegister, setLoginInitialRegister] = useState<boolean>(false);

  // State tìm kiếm nhanh tên sân tại Navbar
  const [searchCourtName, setSearchCourtName] = useState<string>('');

  // Kiểm tra quyền Admin cho người dùng hiện tại (Chuẩn hóa dựa trên vai trò CSDL)
  const isUserAdmin = Boolean(
    currentUser && (
      (currentUser.vai_tro || '').trim().toUpperCase() === 'ADMIN' ||
      (currentUser.vai_tro || '').trim().toUpperCase() === 'QUAN_TRI_VIEN' ||
      (currentUser as any).MaVaiTro === 1 ||
      (currentUser.email || '').toLowerCase() === 'admin@gmail.com' ||
      (currentUser.email || '').toLowerCase() === 'xoancao2.0@gmail.com'
    )
  );

  // Kiểm tra quyền Nhân viên & Admin cho Management System
  const isUserStaffOrAdmin = Boolean(
    currentUser && (
      isUserAdmin ||
      (currentUser.vai_tro || '').trim().toUpperCase() === 'NHAN_VIEN' ||
      (currentUser.vai_tro || '').trim().toUpperCase() === 'NHANVIEN' ||
      (currentUser.vai_tro || '').trim().toUpperCase() === 'STAFF' ||
      (currentUser as any).MaVaiTro === 2
    )
  );

  // State quản lý Mobile Hamburger Menu Drawer
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // State Bộ lọc Đặt sân nhanh (Loại sân, Sân cụ thể & Ngày đá)
  const [filterLoaiSan, setFilterLoaiSan] = useState<string>('ALL');
  const [filterSanId, setFilterSanId] = useState<string>('ALL');
  const [filterNgayDa, setFilterNgayDa] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [filterKhungGio, setFilterKhungGio] = useState<string>('ALL');

  // Loại sân được chọn để xem danh sách sân & đặt khung giờ (null: hiển thị tất cả thẻ loại sân giống layout mẫu)
  const [selectedCategory, setSelectedCategory] = useState<LoaiSan | null>(null);

  // Bộ lọc buổi trong ngày: 'ALL' (Cả ngày) | 'MORNING' (Sáng) | 'AFTERNOON' (Chiều) | 'EVENING' (Tối)
  const [filterBuoi, setFilterBuoi] = useState<'ALL' | 'MORNING' | 'AFTERNOON' | 'EVENING'>('ALL');

  const handleSelectCategory = (loai: LoaiSan) => {
    setSelectedCategory(loai);
    setFilterLoaiSan(String(loai.id));
    setFilterSanId('ALL');
  };

  const handleCloseCategoryModal = () => {
    setSelectedCategory(null);
    setFilterLoaiSan('ALL');
    setFilterSanId('ALL');
  };

  // Danh sách Khung giờ tải động từ CSDL SQL Server (Mặc định 6h - 19h)
  const [timeSlotsList, setTimeSlotsList] = useState<KhungGioItem[]>(DEFAULT_TIME_SLOTS);

  // =====================================================================
  // STATE CHO CHỨC NĂNG ĐẶT NHIỀU SÂN CÙNG LÚC (MULTI-COURT BOOKING)
  // =====================================================================
  interface CartCourtItem {
    id: string; // `${san.id}_${slot.start}_${filterNgayDa}`
    san: SanBong;
    slot: KhungGioItem;
    ngay_da: string;
    durationMin: number;
    gioKetThuc: string;
    giaTien: number;
    holdSlotKeys: string[];
  }

  const [isMultiBookingMode, setIsMultiBookingMode] = useState<boolean>(false);
  const [cartCourts, setCartCourts] = useState<CartCourtItem[]>([]);
  const [isMultiBookingModalOpen, setIsMultiBookingModalOpen] = useState<boolean>(false);
  const [multiBookingStep, setMultiBookingStep] = useState<'REVIEW' | 'QR'>('REVIEW');
  const [multiPayOSData, setMultiPayOSData] = useState<any>(null);

  // State Quản lý Modal Đặt Sân
  const [selectedSlot, setSelectedSlot] = useState<{
    san: SanBong;
    slot: { start: string; end: string; label: string };
    durationMin: number; // 60 | 90 | 120
    gioKetThuc: string; // VD: '08:30'
    giaTien: number;
    holdSlotKeys?: string[];
  } | null>(null);

  // Modal Step: 'DURATION' (chọn giờ kết thúc) -> 'INFO' (thông tin & dịch vụ) -> 'QR' (thanh toán VietQR)
  const [bookingStep, setBookingStep] = useState<'DURATION' | 'INFO' | 'QR'>('DURATION');

  // Form thông tin khách đặt sân trong Modal
  const [bookingForm, setBookingForm] = useState({
    ho_ten: '',
    so_dien_thoai: '',
    ghi_chu: '',
    loai_thanh_toan: 'DAT_COC', // 'DAT_COC' (30%) | 'TRA_HET' (100%)
    dich_vu_chon: {} as Record<number, number>, // ma_dich_vu -> so_luong
  });

  // State thông báo Toast & Trạng thái gửi đơn
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // State Cổng thanh toán PayOS VietQR MB Bank
  const [payOSData, setPayOSData] = useState<PayOSData | null>(null);
  const [isCreatingPayOS, setIsCreatingPayOS] = useState<boolean>(false);
  const [isPaymentSuccess, setIsPaymentSuccess] = useState<boolean>(false);
  const [successCountdown, setSuccessCountdown] = useState<number>(15);
  const successTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isCheckingPayOS, setIsCheckingPayOS] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [qrModalAlert, setQrModalAlert] = useState<{ type: 'error' | 'warning' | 'info'; title: string; message: string } | null>(null);


  // Hàm hiển thị Toast thông báo trạng thái
  const triggerToast = (toast: { type: 'success' | 'error' | 'info'; message: string }) => {
    setToastMessage(toast);
  };

  // Tự động đóng Toast sau 4 giây
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Tự động đóng thông báo trong Modal VietQR sau 6 giây
  useEffect(() => {
    if (qrModalAlert) {
      const timer = setTimeout(() => {
        setQrModalAlert(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [qrModalAlert]);

  // Khôi phục thông tin người dùng từ localStorage khi tải trang
  useEffect(() => {
    try {
      const savedAuthUser = localStorage.getItem('auth_user');
      if (savedAuthUser) {
        const parsed: AuthUser = JSON.parse(savedAuthUser);
        setCurrentUser(parsed);
      }
    } catch (e) {
      console.error('Lỗi khi đọc auth_user:', e);
    }
  }, []);

  // Mở modal đăng nhập nếu được chuyển hướng từ trang yêu cầu quyền Admin hoặc trang khác
  useEffect(() => {
    if (!router.isReady) return;
    if (router.query.login === 'true' || router.query.requireAdmin === 'true') {
      setIsLoginModalOpen(true);
      if (router.query.requireAdmin === 'true') {
        triggerToast({
          type: 'error',
          message: '🛡️ Vui lòng đăng nhập với tài khoản Quản trị viên (ADMIN) để truy cập Dashboard!'
        });
      }
    }
  }, [router.isReady, router.query]);

  // Lắng nghe sự kiện click ra ngoài để tự động thu gọn Dropdown menu tài khoản
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };

    if (userDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userDropdownOpen]);

  // Cập nhật form khách hàng khi currentUser thay đổi
  useEffect(() => {
    if (currentUser) {
      setBookingForm((prev) => ({
        ...prev,
        ho_ten: currentUser.ho_ten || '',
        so_dien_thoai: currentUser.so_dien_thoai || '',
      }));
    }
  }, [currentUser]);

  // -------------------------------------------------------------
  // B. HÀM TẢI DỮ LIỆU THỰC TỪ CSDL SQL SERVER QUA BACKEND API
  // -------------------------------------------------------------

  // 1. Tải danh mục Loại sân (sp_LayDanhSachLoaiSan)
  const fetchLoaiSan = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/dat-san/loai-san`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        // Lọc bỏ hoàn toàn loại sân Dự bị
        const validLoaiSan = data.data.filter((l: LoaiSan) => !isDuBiPitch(l));
        setLoaiSanList(validLoaiSan);
      }
    } catch (err) {
      console.error('Lỗi fetch loại sân từ SQL Server:', err);
    }
  };

  // 2. Tải danh sách Sân bóng (sp_LayDanhSachSan)
  const fetchSanBong = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/dat-san/danh-sach-san`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        // Lọc bỏ hoàn toàn các sân thuộc loại Dự bị hoặc có tên/mô tả Dự bị
        const validSanBong = data.data.filter((s: SanBong) => !isDuBiPitch(s));
        setSanBongList(validSanBong);
      }
    } catch (err) {
      console.error('Lỗi fetch danh sách sân từ SQL Server:', err);
    }
  };

  // 3. Tải danh mục Khung giờ đá từ CSDL SQL Server (Bảng Khung_Gio)
  const fetchKhungGio = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/dat-san/khung-gio`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        const mapped: KhungGioItem[] = data.data.map((kg: any) => ({
          start: (kg.gio_bat_dau || '').substring(0, 5),
          end: (kg.gio_ket_thuc || '').substring(0, 5),
          label: kg.nhan_hien_thi || `${parseInt(kg.gio_bat_dau.split(':')[0])}h${kg.gio_bat_dau.includes(':30') ? '30' : ''}`,
        }));
        setTimeSlotsList(mapped);
      }
    } catch (err) {
      console.error('Lỗi fetch khung giờ từ SQL Server:', err);
    }
  };

  // 4. Tải danh sách Dịch vụ đi kèm (sp_LayDanhSachDichVu)
  const fetchDichVu = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/dich-vu`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setDichVuList(data.data);
      }
    } catch (err) {
      console.error('Lỗi fetch dịch vụ từ SQL Server:', err);
    }
  };

  // 5. Tải ma trận Lịch đặt sân theo ngày thực từ SQL Server (sp_LayLichSan)
  const fetchLichSan = useCallback(async (ngay: string, currentSanList: SanBong[]) => {
    try {
      const res = await fetch(`${API_BASE_URL}/dat-san/lich-san?ngay_da=${ngay}`);
      const data = await res.json();
      const bookings = data.success && Array.isArray(data.data) ? data.data : [];
      setRawBookings(bookings);

      // Tạo ma trận grid kết hợp danh sách sân thật và đơn đặt thật trong SQL Server
      const newGrid: Record<string, SlotLichSan> = {};
      const activeSlots = timeSlotsList.length > 0 ? timeSlotsList : DEFAULT_TIME_SLOTS;

      currentSanList.forEach((san) => {
        activeSlots.forEach((slot) => {
          const key = `${san.id}_${slot.start}`;

          // Kiểm tra xem slot 30 phút này có nằm trong khoảng thời gian [gio_bat_dau, gio_ket_thuc) của đơn đặt nào không
          const matchedBooking = bookings.find((b: { ma_san: number; gio_bat_dau: string; gio_ket_thuc: string; trang_thai: string; ten_khach_hang?: string; id?: number; ma_don_dat?: number }) => {
            if (b.ma_san !== san.id) return false;
            const validStatus = ['DA_THANH_TOAN', 'DA_COC', 'DANG_DA', 'DA_CHOT', 'Da Thanh Toan', 'DA_DAT'];
            if (!validStatus.includes(b.trang_thai)) return false;
            const bStart = (b.gio_bat_dau || '').substring(0, 5);
            const bEnd = (b.gio_ket_thuc || '').substring(0, 5);
            return isTimeOverlapping(slot.start, slot.end, bStart, bEnd);
          });

          let trangThai: TrangThaiSlot = 'TRONG';
          let khachHang = '';
          let maDon: number | undefined = undefined;
          let bStartDon: string | undefined = undefined;
          let bEndDon: string | undefined = undefined;

          if (matchedBooking) {
            // Đơn đã có trên CSDL -> Chuyển thành ĐÃ CHỐT / ĐÃ ĐẶT (Màu đỏ)
            trangThai = 'DA_CHOT';
            khachHang = matchedBooking.ten_khach_hang || 'Đã có khách đặt';
            maDon = matchedBooking.id || matchedBooking.ma_don_dat;
            bStartDon = (matchedBooking.gio_bat_dau || '').substring(0, 5);
            bEndDon = (matchedBooking.gio_ket_thuc || '').substring(0, 5);
          }

          // Đơn giá 30 phút tham khảo
          const donGiaPhut = Number(san.don_gia_phut) || 5000;
          const giaApDung = 30 * donGiaPhut;

          newGrid[key] = {
            ma_san: san.id,
            gio_bat_dau: slot.start,
            gio_ket_thuc: slot.end,
            trang_thai: trangThai,
            ten_khach_hang: khachHang,
            ma_don_dat: maDon,
            gio_bat_dau_don: bStartDon,
            gio_ket_thuc_don: bEndDon,
            gia_ap_dung: giaApDung,
          };
        });
      });

      setGridSlots(newGrid);
    } catch (err) {
      console.error('Lỗi khi tải lịch đặt sân từ SQL Server:', err);
    }
  }, [timeSlotsList]);

  // 6. Tải danh sách Banner quảng cáo (sp_LayDanhSachBanner)
  const fetchBanners = async () => {
    try {
      const res = await contentService.getBanners();
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setBanners(res.data);
      }
    } catch (err) {
      console.error('Lỗi fetch banners:', err);
    }
  };

  const handleNextBanner = useCallback(() => {
    setCurrentBannerIndex((prev) => {
      if (!banners || banners.length <= 1) return 0;
      return (prev + 1) % banners.length;
    });
  }, [banners]);

  const handlePrevBanner = useCallback(() => {
    setCurrentBannerIndex((prev) => {
      if (!banners || banners.length <= 1) return 0;
      return (prev - 1 + banners.length) % banners.length;
    });
  }, [banners]);

  // Tự động chuyển Banner: Hình ảnh = 9 giây, Video = Hết video (onEnded)
  useEffect(() => {
    if (!banners || banners.length <= 1) return;

    const current = banners[currentBannerIndex];
    if (!current) return;

    setBannerProgress(0);

    if (current.loai_banner === 'VIDEO') {
      // Đối với Video: Tự động phát video
      if (bannerVideoRef.current) {
        bannerVideoRef.current.currentTime = 0;
        bannerVideoRef.current.play().catch(() => {});
      }
      // Fallback an toàn phòng khi video quá dài hoặc không bắt được onEnded
      const fallbackTimer = setTimeout(() => {
        handleNextBanner();
      }, 90000);

      return () => clearTimeout(fallbackTimer);
    } else {
      // Đối với Hình ảnh: 9 giây thì chuyển (9000ms)
      const duration = 9000;
      const step = 100;
      let elapsed = 0;

      const progressInterval = setInterval(() => {
        elapsed += step;
        setBannerProgress(Math.min(100, (elapsed / duration) * 100));
      }, step);

      const slideTimer = setTimeout(() => {
        handleNextBanner();
      }, duration);

      return () => {
        clearInterval(progressInterval);
        clearTimeout(slideTimer);
      };
    }
  }, [banners, currentBannerIndex, handleNextBanner]);

  // Tải toàn bộ dữ liệu ban đầu từ Backend SQL Server khi Component khởi tạo
  useEffect(() => {
    const loadAllInitialData = async () => {
      setIsLoadingData(true);
      await Promise.all([
        fetchLoaiSan(),
        fetchSanBong(),
        fetchKhungGio(),
        fetchDichVu(),
        fetchBanners()
      ]);
      setIsLoadingData(false);
    };

    loadAllInitialData();
  }, []);

  // Khởi tạo kết nối Real-time Socket.io Client + Cơ chế Đồng bộ kép (Dual-Engine Realtime)
  useEffect(() => {
    const socket: Socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      timeout: 10000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('⚡ Đã kết nối Real-time Socket server:', socket.id);
      fetchLichSan(filterNgayDa, sanBongList);
    });

    // Lắng nghe danh sách slot đang bị khóa trên toàn hệ thống
    socket.on('slots_updated', (updatedSlots: string[]) => {
      setLockedSlots(updatedSlots || []);
    });

    // Lắng nghe sự kiện thanh toán thành công Real-time từ PayOS Webhook (MB Bank)
    socket.on('payment_success', (data: any) => {
      console.log('⚡ [Socket Realtime MB Bank]: Nhận thông báo thanh toán thành công:', data);
      handlePaymentSuccessAction(data);
    });

    // Lắng nghe sự kiện cập nhật đơn đặt từ POS hoặc các client khác
    socket.on('booking_updated', () => {
      fetchLichSan(filterNgayDa, sanBongList);
      fetchDichVu();
    });

    // CƠ CHẾ DỰ PHÒNG THÔNG MINH CHO MÔI TRƯỜNG VERCEL / SERVERLESS:
    // Tự động đồng bộ mỗi 5 giây và khi người dùng quay lại tab (Window Focus)
    const syncInterval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchLichSan(filterNgayDa, sanBongList);
      }
    }, 5000);

    const handleWindowFocus = () => {
      fetchLichSan(filterNgayDa, sanBongList);
      fetchDichVu();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleWindowFocus);
      document.addEventListener('visibilitychange', handleWindowFocus);
    }

    return () => {
      socket.disconnect();
      clearInterval(syncInterval);
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleWindowFocus);
        document.removeEventListener('visibilitychange', handleWindowFocus);
      }
    };
  }, [filterNgayDa, sanBongList]);

  // Polling kiểm tra trạng thái thanh toán PayOS định kỳ mỗi 2.5 giây khi đang mở màn hình QR
  useEffect(() => {
    if (bookingStep !== 'QR' || !payOSData?.orderCode || isPaymentSuccess) {
      return;
    }

    const intervalId = setInterval(() => {
      checkPayOSStatus(payOSData.orderCode, false);
    }, 2500);

    return () => clearInterval(intervalId);
  }, [bookingStep, payOSData?.orderCode, isPaymentSuccess]);

  // Tự động giải phóng và hủy đơn tạm thời nếu người dùng tải lại trang (reload) hoặc đóng tab/rời đi khi chưa thanh toán
  useEffect(() => {
    const handleUnloadOrReload = () => {
      if (bookingStep === 'QR' && (payOSData?.ma_don_dat || payOSData?.orderCode) && !isPaymentSuccess) {
        try {
          const payload = JSON.stringify({
            ma_don_dat: payOSData.ma_don_dat,
            orderCode: payOSData.orderCode,
          });
          if (navigator.sendBeacon) {
            const blob = new Blob([payload], { type: 'application/json' });
            navigator.sendBeacon(`${API_BASE_URL}/thanh-toan/payos/huy-don-tam`, blob);
          }
          if (typeof fetch === 'function') {
            fetch(`${API_BASE_URL}/thanh-toan/payos/huy-don-tam`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: payload,
              keepalive: true,
            }).catch(() => {});
          }
        } catch (_e) {}
      }
    };
    window.addEventListener('beforeunload', handleUnloadOrReload);
    window.addEventListener('pagehide', handleUnloadOrReload);
    return () => {
      window.removeEventListener('beforeunload', handleUnloadOrReload);
      window.removeEventListener('pagehide', handleUnloadOrReload);
    };
  }, [bookingStep, payOSData, isPaymentSuccess]);

  // Khóa cuộn trang nền khi đang mở Modal đặt sân, Modal Profile hoặc Modal chọn môn thể thao
  useEffect(() => {
    if (selectedSlot || isProfileModalOpen || selectedCategory) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [selectedSlot, isProfileModalOpen, selectedCategory]);

  // Đóng modal chọn môn thể thao khi nhấn phím Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!selectedSlot && selectedCategory) {
          handleCloseCategoryModal();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSlot, selectedCategory]);

  // Cập nhật ma trận lịch sân khi danh sách sân bóng hoặc ngày đá thay đổi
  useEffect(() => {
    if (sanBongList.length > 0) {
      fetchLichSan(filterNgayDa, sanBongList);
    }
  }, [filterNgayDa, sanBongList, fetchLichSan]);

  // -------------------------------------------------------------
  // C. CÁC HÀM XỬ LÝ SỰ KIỆN TƯƠNG TÁC GIAO DIỆN
  // -------------------------------------------------------------

  // Hàm sao chép thông tin tài khoản / nội dung
  const handleCopyText = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    triggerToast({
      type: 'info',
      message: `Đã sao chép ${fieldName} vào bộ nhớ tạm!`,
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  // ===================================================================================
  // [LUỒNG ĐẶT LỊCH ONLINE - BƯỚC 6A]: XỬ LÝ KHI THANH TOÁN THÀNH CÔNG (MB BANK -> PAYOS)
  // - Kích hoạt khi Socket.io nhận sự kiện 'payment_success' từ Webhook Backend
  //   hoặc khi Polling checkPayOSStatus phát hiện trạng thái 'PAID'
  // - Cập nhật giao diện: Tải lại ma trận lịch sân (chuyển sang màu VÀNG/ĐỎ cho toàn bộ người dùng)
  // - Phát sự kiện 'unlock_all' giải phóng cờ giữ chỗ tạm thời trên RAM
  // - Bật màn hình thông báo Đặt sân & Thanh toán thành công, đếm ngược 10 giây tự đóng
  // ===================================================================================
  const handlePaymentSuccessAction = (info?: any) => {
    setIsPaymentSuccess(true);
    setSuccessCountdown(10);
    triggerToast({
      type: 'success',
      message: `🎉 Đã nhận thanh toán từ MB Bank qua PayOS! Đơn đặt sân đã được xác nhận thành công!`,
    });

    // Tải lại lịch sân và dịch vụ từ SQL Server
    fetchLichSan(filterNgayDa, sanBongList);
    fetchDichVu();

    // Giải phóng toàn bộ các ô giữ chỗ của khách hàng này khi thanh toán thành công
    socketRef.current?.emit('unlock_all');
    setMyLockedSlotIds([]);

    // Đếm ngược 10 giây
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    countdownIntervalRef.current = setInterval(() => {
      setSuccessCountdown((prev) => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Tự động đóng modal sau 10 giây (hoặc bấm nút Đóng/X để tắt ngay)
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    successTimerRef.current = setTimeout(() => {
      handleCloseSuccessModal();
    }, 10000);
  };

  // Hàm đóng Modal khi đã thanh toán thành công
  const handleCloseSuccessModal = () => {
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setSelectedSlot(null);
    setBookingStep('DURATION');
    setPayOSData(null);
    setQrModalAlert(null);
    setIsPaymentSuccess(false);
  };

  // ===================================================================================
  // [LUỒNG ĐẶT LỊCH ONLINE - BƯỚC 6B]: POLLING KIỂM TRA ĐỐI SOÁT TRẠNG THÁI PAYOS (DỰ PHÒNG)
  // - Định kỳ gọi GET /api/thanh-toan/payos/trang-thai/:orderCode
  // - Backend kiểm tra với PayOS API, đối soát nội dung sao kê (DS<ma_don>),
  //   gọi Stored Procedure sp_ThanhToanDon và bắn tín hiệu Socket.io
  // ===================================================================================
  const checkPayOSStatus = async (orderCode: number, manual: boolean = false) => {
    if (!orderCode) return;
    if (manual) {
      setIsCheckingPayOS(true);
      setQrModalAlert({
        type: 'info',
        title: 'Đang kiểm tra giao dịch với Sport247...',
        message: 'Hệ thống đang kết nối trực tiếp với Sport247 để đối soát giao dịch.',
      });
    }
    try {
      const res = await fetch(`${API_BASE_URL}/thanh-toan/payos/trang-thai/${orderCode}`);
      const data = await res.json();
      if (data.success && (data.isPaid || data.status === 'PAID')) {
        setQrModalAlert(null);
        handlePaymentSuccessAction(data.data);
      } else if (data.invalidDescription) {
        const cleanActual = (data.actualDescription || '')
          .replace(/\b(Qam|VQR)[a-zA-Z0-9]+\b/gi, '')
          .replace(/\bCASSO\w*(\s+\d+)?\b/gi, '')
          .replace(/\b(SNL|FT|REF|TRX)[a-zA-Z0-9]+\b/gi, '')
          .replace(/\bi[a-zA-Z0-9]{5,}\b/gi, '')
          .replace(/\b\d+VND\b/gi, '')
          .replace(/\b[a-zA-Z0-9]{12,}\b/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        const displayDesc = cleanActual || data.actualDescription || '(trống)';

        setQrModalAlert({
          type: 'error',
          title: '⚠️ Sai Nội Dung Chuyển Khoản!',
          message: `Hệ thống phát hiện bạn đã chuyển khoản nhưng SAI NỘI DUNG CHUYỂN KHOẢN! Nội dung nhận được: "${displayDesc}". Nội dung yêu cầu: "${data.expectedDescription}". Đơn đặt sân không thể tự động duyệt! Vui lòng liên hệ ban quản lý để được hỗ trợ.`,
        });
        if (manual) {
          triggerToast({
            type: 'error',
            message: `⚠️ Sai nội dung chuyển khoản! Yêu cầu: ${data.expectedDescription}`,
          });
        }
      } else if (manual) {
        setQrModalAlert({
          type: 'error',
          title: 'Chưa Nhận Được Tiền Chuyển Khoản!',
          message: 'Sport 247 chưa nhận được tiền chuyển khoản! Quý khách vui lòng quét mã chuyển tiền hoặc thử lại sau vài giây.',
        });
      }
    } catch (err) {
      console.error('Lỗi khi kiểm tra PayOS status:', err);
      if (manual) {
        setQrModalAlert({
          type: 'error',
          title: 'Lỗi Kết Nối Máy Chủ',
          message: 'Không thể kết nối đến hệ thống thanh toán PayOS. Vui lòng thử lại sau vài giây!',
        });
      }
    } finally {
      if (manual) setIsCheckingPayOS(false);
    }
  };

  // ===================================================================================
  // [LUỒNG ĐẶT LỊCH ONLINE - BƯỚC 7]: KHÁCH HÀNG ĐÓNG MODAL / HỦY ĐẶT SÂN
  // - Phát tín hiệu Socket.io 'unlock_all' để nhả ngay các ô slot bị giữ trên RAM cho khách khác
  // - Gửi POST /api/thanh-toan/payos/huy-don-tam để xóa/hủy đơn tạm thời trong CSDL SQL Server
  // - Reset các state liên quan để màn hình sẵn sàng cho lần đặt kế tiếp
  // ===================================================================================
  const handleCloseBookingModal = () => {
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    
    // Bắn sự kiện socket giải phóng tất cả ô mà khách hàng này đang giữ
    socketRef.current?.emit('unlock_all');
    setMyLockedSlotIds([]);

    if (payOSData?.ma_don_dat || payOSData?.orderCode) {
      fetch(`${API_BASE_URL}/thanh-toan/payos/huy-don-tam`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ma_don_dat: payOSData.ma_don_dat,
          orderCode: payOSData.orderCode,
        }),
      }).catch((e) => console.warn('Lỗi hủy đơn tạm:', e));
    }
    setSelectedSlot(null);
    setBookingStep('DURATION');
    setPayOSData(null);
    setQrModalAlert(null);
    setIsPaymentSuccess(false);
  };


  // Danh sách các sân thuộc loại sân đã chọn (loại bỏ hoàn toàn sân dự bị) để hiển thị trong bộ lọc Sân
  const availableSanOptions = useMemo(() => {
    let list = sanBongList.filter((s) => !isDuBiPitch(s));
    if (filterLoaiSan !== 'ALL') {
      list = list.filter((s) => s.ma_loai_san === Number(filterLoaiSan));
    }
    return list;
  }, [sanBongList, filterLoaiSan]);

  // Xử lý khi thay đổi Loại Sân: tự động kiểm tra và reset Lọc Sân nếu sân đang chọn không thuộc loại mới
  const handleLoaiSanChange = (newLoaiSan: string) => {
    setFilterLoaiSan(newLoaiSan);
    if (newLoaiSan !== 'ALL' && filterSanId !== 'ALL') {
      const isSanValidInNewLoai = sanBongList.some(
        (s) => s.id === Number(filterSanId) && s.ma_loai_san === Number(newLoaiSan) && !isDuBiPitch(s)
      );
      if (!isSanValidInNewLoai) {
        setFilterSanId('ALL');
      }
    }
  };

  // Lọc danh sách sân theo loại sân, sân cụ thể và từ khóa tìm kiếm (Loại bỏ hoàn toàn sân Dự bị)
  const filteredSanList = useMemo(() => {
    let list = sanBongList.filter((s) => !isDuBiPitch(s));
    if (filterLoaiSan !== 'ALL') {
      list = list.filter((s) => s.ma_loai_san === Number(filterLoaiSan));
    }
    if (filterSanId !== 'ALL') {
      list = list.filter((s) => s.id === Number(filterSanId));
    }
    if (searchCourtName.trim()) {
      const q = searchCourtName.toLowerCase().trim();
      list = list.filter((s) => s.ten_san.toLowerCase().includes(q) || (s.ten_loai && s.ten_loai.toLowerCase().includes(q)));
    }
    return list;
  }, [sanBongList, filterLoaiSan, filterSanId, searchCourtName]);

  // Kiểm tra khung giờ đã trôi qua so với thời gian hiện tại
  const isSlotInThePast = useCallback((slotStart: string) => {
    if (!filterNgayDa) return false;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const currentDate = String(now.getDate()).padStart(2, '0');
    const todayStr = `${currentYear}-${currentMonth}-${currentDate}`;

    // 1. Ngày đã chọn trước ngày hôm nay -> Tất cả các giờ đều đã qua
    if (filterNgayDa < todayStr) {
      return true;
    }

    // 2. Ngày đã chọn sau ngày hôm nay -> Chưa qua giờ nào
    if (filterNgayDa > todayStr) {
      return false;
    }

    // 3. Ngày đã chọn là HÔM NAY -> So sánh giờ bắt đầu với giờ hiện tại
    const [slotH, slotM] = slotStart.split(':').map(Number);
    const currentH = now.getHours();
    const currentM = now.getMinutes();

    if (slotH < currentH) return true;
    if (slotH === currentH && (slotM !== undefined ? slotM : 0) <= currentM) return true;

    return false;
  }, [filterNgayDa]);

  // Lọc danh sách khung giờ hiển thị trên ma trận (Ẩn hoàn toàn các khung giờ đã trôi qua)
  const filteredTimeSlots = useMemo(() => {
    const rawSlots = timeSlotsList.length > 0 ? timeSlotsList : DEFAULT_TIME_SLOTS;
    const activeSlots = rawSlots.filter((s) => !isSlotInThePast(s.start));
    if (filterKhungGio === 'ALL') return activeSlots;
    return activeSlots.filter((s) => s.start === filterKhungGio);
  }, [filterKhungGio, timeSlotsList, isSlotInThePast]);

  // Lọc theo buổi trong ngày (Sáng: 06h-12h, Chiều: 12h-17h, Tối: 17h-19h) giúp người dùng điện thoại lướt chọn siêu tốc
  const displayTimeSlots = useMemo(() => {
    if (filterBuoi === 'ALL') return filteredTimeSlots;
    return filteredTimeSlots.filter((slot) => {
      const hour = parseInt(slot.start.split(':')[0], 10);
      if (filterBuoi === 'MORNING') return hour >= 6 && hour < 12;
      if (filterBuoi === 'AFTERNOON') return hour >= 12 && hour < 17;
      if (filterBuoi === 'EVENING') return hour >= 17;
      return true;
    });
  }, [filteredTimeSlots, filterBuoi]);

  // Kiểm tra xung đột thời lượng đặt (30p, 60p, 90p, 120p) với các đơn đặt đã có trong CSDL và các ô đang GIỮ CHỖ Real-time
  const checkConflictForSan = useCallback((sanId: number, start: string, durationMin: number) => {
    const end = addMinutesToTime(start, durationMin);

    // 1. Kiểm tra từng slot 30 phút trong khoảng [start, end)
    const totalSlots = Math.ceil(durationMin / 30);
    for (let i = 0; i < totalSlots; i++) {
      const curStart = addMinutesToTime(start, i * 30);
      const slotKeyRealtime = `${filterNgayDa}_${sanId}_${curStart}`;
      const gridKey = `${sanId}_${curStart}`;

      // a. Khách hàng khác đang GIỮ CHỖ thời gian thực (Socket.IO lockedSlots)
      if (lockedSlots.includes(slotKeyRealtime) && !myLockedSlotIds.includes(slotKeyRealtime)) {
        return true;
      }

      // b. Ô trên ma trận gridSlots không trống (đã chốt hoặc đang có đơn)
      const slotData = gridSlots[gridKey];
      if (slotData && slotData.trang_thai !== 'TRONG') {
        return true;
      }
    }

    // 2. Kiểm tra xung đột với toàn bộ các đơn đặt đã có trong CSDL (rawBookings)
    const hasDbConflict = rawBookings.some((b) => {
      if (b.ma_san !== sanId) return false;
      const st = (b.trang_thai || '').toUpperCase();
      if (st === 'DA_HUY' || st === 'HUY' || st === 'ĐÃ HỦY') return false;
      const bStart = (b.gio_bat_dau || '').substring(0, 5);
      const bEnd = (b.gio_ket_thuc || '').substring(0, 5);
      return isTimeOverlapping(start, end, bStart, bEnd);
    });
    if (hasDbConflict) return true;

    // 3. Kiểm tra xung đột với các đơn đồng bộ từ Management System (syncOrders)
    const hasSyncConflict = syncOrders.some((order) => {
      if ((order.ngay_da || '').substring(0, 10) !== filterNgayDa) return false;
      const st = (order.trang_thai || '').toUpperCase();
      if (st === 'ĐÃ HỦY' || st === 'DA_HUY' || st === 'HUY') return false;
      const matchSan = (order.ma_san && order.ma_san === sanId) ||
        (order.ten_san && sanBongList.some(s => s.id === sanId && (order.ten_san.includes(s.ten_san) || s.ten_san.includes(order.ten_san))));
      if (!matchSan) return false;
      const oStart = (order.gio_bat_dau || '').substring(0, 5);
      const oEnd = (order.gio_ket_thuc || '').substring(0, 5);
      return isTimeOverlapping(start, end, oStart, oEnd);
    });
    if (hasSyncConflict) return true;

    return false;
  }, [filterNgayDa, lockedSlots, myLockedSlotIds, gridSlots, rawBookings, syncOrders, sanBongList]);

  // Xử lý khi bấm nút "🔍 TÌM SÂN TRỐNG" tại Hero Section
  const handleSearchAvailableSlots = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLichSan(filterNgayDa, sanBongList);
    triggerToast({
      type: 'info',
      message: `Đang cập nhật lịch sân thực tế từ CSDL cho ngày ${filterNgayDa}...`,
    });

    const matrixElement = document.getElementById('ma-tran-lich-san');
    if (matrixElement) {
      matrixElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // =====================================================================
  // CÁC HÀM XỬ LÝ CHO CHỨC NĂNG ĐẶT NHIỀU SÂN CÙNG LÚC (MULTI-BOOKING)
  // =====================================================================
  // Xóa toàn bộ giỏ sân
  const handleClearCart = () => {
    socketRef.current?.emit('unlock_all');
    setMyLockedSlotIds([]);
    setCartCourts([]);
    triggerToast({
      type: 'info',
      message: 'Đã xóa toàn bộ sân trong danh sách chọn!',
    });
  };

  // Đổi thời lượng thi đấu cho từng sân trong giỏ (30, 60, 90, 120 phút)
  const handleChangeCartCourtDuration = (cartId: string, durationMin: number) => {
    setCartCourts((prev) =>
      prev.map((item) => {
        if (item.id !== cartId) return item;
        const endTime = addMinutesToTime(item.slot.start, durationMin);
        const donGia = Number(item.san.don_gia_phut) || 5000;
        const giaTien = durationMin * donGia;

        const totalSlots = Math.ceil(durationMin / 30);
        const holdSlotKeys: string[] = [];
        let curTime = item.slot.start;
        for (let i = 0; i < totalSlots; i++) {
          holdSlotKeys.push(`${item.ngay_da}_${item.san.id}_${curTime}`);
          curTime = addMinutesToTime(curTime, 30);
        }

        return {
          ...item,
          durationMin,
          gioKetThuc: endTime,
          giaTien,
          holdSlotKeys,
        };
      })
    );
  };

  // Xóa 1 sân khỏi giỏ
  const handleRemoveCartCourt = (cartId: string) => {
    const updated = cartCourts.filter((item) => item.id !== cartId);
    setCartCourts(updated);
    const remainingHoldKeys = updated.flatMap((item) => item.holdSlotKeys);
    socketRef.current?.emit('lock_slots', remainingHoldKeys);
    setMyLockedSlotIds(remainingHoldKeys);

    if (updated.length === 0) {
      setIsMultiBookingModalOpen(false);
    }
  };

  // Tổng tiền sân trong giỏ
  const tongTienSanCart = useMemo(() => {
    return cartCourts.reduce((sum, item) => sum + item.giaTien, 0);
  }, [cartCourts]);

  // Tiền dịch vụ chọn kèm
  const tongTienDichVuCart = useMemo(() => {
    return Object.entries(bookingForm.dich_vu_chon).reduce((sum, [dvId, qty]) => {
      const dv = dichVuList.find((d) => d.id === Number(dvId));
      return sum + (dv ? dv.don_gia * qty : 0);
    }, 0);
  }, [bookingForm.dich_vu_chon, dichVuList]);

  // Tổng tiền đơn nhiều sân và tiền cọc 30%
  const tongTienDonCart = tongTienSanCart + tongTienDichVuCart;
  const tienCocCart = Math.round(tongTienDonCart * 0.3);

  // Tạo thanh toán PayOS cho nhiều sân cùng lúc
  const handleCreateMultiPayOSPayment = async () => {
    if (cartCourts.length === 0) return;
    if (!bookingForm.ho_ten || !bookingForm.so_dien_thoai) {
      triggerToast({
        type: 'error',
        message: 'Vui lòng nhập đầy đủ Họ tên và Số điện thoại nhận sân!',
      });
      return;
    }

    setIsCreatingPayOS(true);
    try {
      const isDeposit = bookingForm.loai_thanh_toan === 'DAT_COC';
      const thanhToanAmount = isDeposit ? tienCocCart : tongTienDonCart;

      const danhSachSanPayload = cartCourts.map((item) => ({
        ma_san: item.san.id,
        ngay_da: item.ngay_da,
        gio_bat_dau: item.slot.start,
        gio_ket_thuc: item.gioKetThuc,
        tien_san: item.giaTien,
      }));

      const res = await fetch(`${API_BASE_URL}/thanh-toan/payos/tao-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ma_nguoi_dung: currentUser?.id || null,
          ho_ten: bookingForm.ho_ten,
          so_dien_thoai: bookingForm.so_dien_thoai,
          amount: thanhToanAmount,
          tong_tien: tongTienDonCart,
          loai_thanh_toan: isDeposit ? 'DAT_COC' : 'TRA_HET',
          ghi_chu: bookingForm.ghi_chu || null,
          danh_sach_san: danhSachSanPayload,
          dich_vu_chon: bookingForm.dich_vu_chon,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        triggerToast({
          type: 'error',
          message: data.message || 'Lỗi khi khởi tạo đơn thanh toán VietQR!',
        });
        setIsCreatingPayOS(false);
        return;
      }

      setPayOSData({
        ...data.data,
        ma_don_dat: data.data.ma_don_dat,
        ten_san: `Nhiều sân (${cartCourts.length} sân)`,
        loai_thanh_toan: isDeposit ? 'DAT_COC' : 'TRA_HET',
      });
      setBookingStep('QR');
      setIsMultiBookingModalOpen(false);
      setSelectedSlot({
        san: cartCourts[0].san,
        slot: cartCourts[0].slot,
        durationMin: 60,
        gioKetThuc: cartCourts[0].gioKetThuc,
        giaTien: tongTienDonCart,
      });

      triggerToast({
        type: 'success',
        message: `🎉 Đã tạo mã VietQR PayOS cho ${cartCourts.length} sân! Quý khách quét mã để hoàn tất.`,
      });
    } catch (err) {
      console.error('Lỗi khi tạo thanh toán PayOS nhiều sân:', err);
      triggerToast({
        type: 'error',
        message: 'Lỗi kết nối đến máy chủ thanh toán!',
      });
    } finally {
      setIsCreatingPayOS(false);
    }
  };

  // ===================================================================================
  // [LUỒNG ĐẶT LỊCH ONLINE - BƯỚC 1]: KHÁCH HÀNG CHỌN Ô SLOT TRÊN MA TRẬN LỊCH SÂN
  // - Kiểm tra đăng nhập, kiểm tra slot quá khứ, kiểm tra xung đột với đơn đã đặt
  // - Phát sự kiện Socket.io 'lock_slots' để khóa ô thời gian thực, chống xung đột (race condition)
  // - Mở Modal Đặt Sân ở bước chọn thời lượng ('DURATION')
  // ===================================================================================
  const handleSlotClick = (san: SanBong, slot: { start: string; end: string; label: string }) => {
    // 0. Kiểm tra nếu khung giờ đã trôi qua -> Không cho chọn
    if (isSlotInThePast(slot.start)) {
      triggerToast({
        type: 'error',
        message: `Khung giờ ${slot.label} ngày hôm nay đã trôi qua. Vui lòng chọn khung giờ khác!`,
      });
      return;
    }

    // 0.1 Kiểm tra nếu người dùng chưa đăng nhập -> Tự động bật Modal Đăng Nhập
    if (!currentUser) {
      triggerToast({
        type: 'info',
        message: 'Vui lòng đăng nhập tài khoản để thực hiện đặt sân bóng!',
      });
      setLoginInitialRegister(false);
      setIsLoginModalOpen(true);
      return;
    }

    // NẾU ĐANG Ở CHẾ ĐỘ ĐẶT NHIỀU SÂN CÙNG LÚC (MULTI-BOOKING MODE)
    if (isMultiBookingMode) {
      const cartItemId = `${san.id}_${slot.start}_${filterNgayDa}`;
      const isAlreadyInCart = cartCourts.some((item) => item.id === cartItemId);

      if (isAlreadyInCart) {
        // Bỏ chọn sân này ra khỏi giỏ
        const updated = cartCourts.filter((item) => item.id !== cartItemId);
        setCartCourts(updated);
        
        const remainingHoldKeys = updated.flatMap((item) => item.holdSlotKeys);
        socketRef.current?.emit('lock_slots', remainingHoldKeys);
        setMyLockedSlotIds(remainingHoldKeys);

        triggerToast({
          type: 'info',
          message: `Đã bỏ chọn ${san.ten_san} (${slot.start}) khỏi danh sách đặt!`,
        });
        return;
      }

      // Kiểm tra xung đột với đơn đã đặt trong CSDL
      const slotData = gridSlots[`${san.id}_${slot.start}`];
      if (slotData && slotData.trang_thai !== 'TRONG') {
        triggerToast({
          type: 'error',
          message: `Khung giờ ${slot.label} (${slot.start}) của ${san.ten_san} đã được đặt!`,
        });
        return;
      }

      // Kiểm tra khách khác đang giữ chỗ Real-time
      const currentSlotKey = `${filterNgayDa}_${san.id}_${slot.start}`;
      if (lockedSlots.includes(currentSlotKey) && !myLockedSlotIds.includes(currentSlotKey)) {
        triggerToast({
          type: 'info',
          message: `Khung giờ ${slot.label} (${slot.start}) của ${san.ten_san} đang được khách hàng khác giữ chỗ!`,
        });
        return;
      }

      const initialDuration = 60; // Mặc định 60 phút
      const initialEndTime = addMinutesToTime(slot.start, initialDuration);
      const donGiaPhut = Number(san.don_gia_phut) || 5000;
      const giaTien = initialDuration * donGiaPhut;

      const holdTotalSlots = Math.ceil(initialDuration / 30);
      const holdSlotKeys: string[] = [];
      let curHoldTime = slot.start;
      for (let i = 0; i < holdTotalSlots; i++) {
        holdSlotKeys.push(`${filterNgayDa}_${san.id}_${curHoldTime}`);
        curHoldTime = addMinutesToTime(curHoldTime, 30);
      }

      const newItem: CartCourtItem = {
        id: cartItemId,
        san,
        slot,
        ngay_da: filterNgayDa,
        durationMin: initialDuration,
        gioKetThuc: initialEndTime,
        giaTien,
        holdSlotKeys,
      };

      const newCart = [...cartCourts, newItem];
      setCartCourts(newCart);

      const allHoldKeys = newCart.flatMap((item) => item.holdSlotKeys);
      socketRef.current?.emit('lock_slots', allHoldKeys);
      setMyLockedSlotIds(allHoldKeys);

      triggerToast({
        type: 'success',
        message: `✅ Đã thêm ${san.ten_san} (${slot.start} - ${initialEndTime}) vào danh sách đặt (${newCart.length} sân)!`,
      });
      return;
    }

    const slotData = gridSlots[`${san.id}_${slot.start}`];

    // 1. Kiểm tra nếu chính ô này đang bị khách khác giữ chỗ Real-time
    const currentSlotKey = `${filterNgayDa}_${san.id}_${slot.start}`;
    if (lockedSlots.includes(currentSlotKey) && !myLockedSlotIds.includes(currentSlotKey)) {
      triggerToast({
        type: 'info',
        message: `Khung giờ ${slot.label} (${slot.start}) của ${san.ten_san} đang có khách hàng khác chọn giữ chỗ! Vui lòng chọn khung giờ khác.`,
      });
      return;
    }

    // 2. Nếu ô đã có đơn đặt trong CSDL (DA_CHOT / CHO_XAC_NHAN)
    if (slotData && slotData.trang_thai !== 'TRONG') {
      triggerToast({
        type: 'error',
        message: `Khung giờ ${slot.label} (${slot.start}) của ${san.ten_san} đã được đặt (${slotData.gio_bat_dau_don || slot.start} - ${slotData.gio_ket_thuc_don || slot.end}). Vui lòng chọn ô trống khác!`,
      });
      return;
    }

    // -------------------------------------------------------------
    // TÍNH TOÁN TOÀN BỘ CÁC Ô THỜI GIAN MÀ KHÁCH CÓ THỂ MUA TRONG MỤC LỰA CHỌN
    // -------------------------------------------------------------
    // Danh sách các mức thời lượng trong mục lựa chọn: 30p, 60p, 90p, 120p
    // Tìm mức thời lượng tối đa mà khách có thể mua được từ slot này mà không bị xung đột
    let maxHoldDuration = 30;
    if (!checkConflictForSan(san.id, slot.start, 120)) {
      maxHoldDuration = 120;
    } else if (!checkConflictForSan(san.id, slot.start, 90)) {
      maxHoldDuration = 90;
    } else if (!checkConflictForSan(san.id, slot.start, 60)) {
      maxHoldDuration = 60;
    } else {
      maxHoldDuration = 30;
    }

    // Khóa toàn bộ tất cả những ô thời gian mà khách có thể mua trong mục lựa chọn trên Socket.IO Real-time
    const holdTotalSlots = Math.ceil(maxHoldDuration / 30);
    const holdSlotKeys: string[] = [];
    let curHoldTime = slot.start;
    for (let i = 0; i < holdTotalSlots; i++) {
      holdSlotKeys.push(`${filterNgayDa}_${san.id}_${curHoldTime}`);
      curHoldTime = addMinutesToTime(curHoldTime, 30);
    }

    socketRef.current?.emit('lock_slots', holdSlotKeys);
    setMyLockedSlotIds(holdSlotKeys);

    // Mặc định trong Modal: Nhảy vào ô 30 phút theo đúng yêu cầu
    const initialDuration = 30;
    const initialEndTime = addMinutesToTime(slot.start, initialDuration);
    const donGiaPhut = Number(san.don_gia_phut) || 5000;
    const giaTien = initialDuration * donGiaPhut;

    setSelectedSlot({
      san,
      slot,
      durationMin: initialDuration,
      gioKetThuc: initialEndTime,
      giaTien,
      holdSlotKeys,
    });
    setBookingStep('DURATION');
    setBookingForm((prev) => ({
      ...prev,
      ho_ten: currentUser?.ho_ten || prev.ho_ten || '',
      so_dien_thoai: currentUser?.so_dien_thoai || prev.so_dien_thoai || '',
      dich_vu_chon: {},
    }));
  };

  // ===================================================================================
  // [LUỒNG ĐẶT LỊCH ONLINE - BƯỚC 2]: CHỌN THỜI LƯỢNG ĐÁ (30p, 60p, 90p, 120p,...)
  // - Khi khách 2 chọn bất kỳ ô thời gian nào trong mục lựa chọn:
  // - VẪN TIẾP TỤC KHÓA TẤT CẢ NHỮNG Ô THỜI GIAN MÀ KHÁCH 2 CÓ THỂ MUA TRONG MỤC LỰA CHỌN
  //   trên giao diện khách 1 (không rút gọn danh sách làm nhả các ô còn lại ra ma trận)
  // ===================================================================================
  const handleSelectDuration = (durationMin: number) => {
    if (!selectedSlot) return;
    if (checkConflictForSan(selectedSlot.san.id, selectedSlot.slot.start, durationMin)) {
      triggerToast({
        type: 'error',
        message: `Khung giờ ${selectedSlot.slot.start} với thời lượng ${durationMin} phút bị trùng với lịch đã đặt hoặc khung giờ đang có khách giữ chỗ! Vui lòng chọn thời lượng khác.`,
      });
      return;
    }
    const newEndTime = addMinutesToTime(selectedSlot.slot.start, durationMin);
    const donGiaPhut = Number(selectedSlot.san.don_gia_phut) || 5000;
    const newGiaTien = durationMin * donGiaPhut;

    // QUAN TRỌNG: Dù khách 2 chọn ô thời gian nào (30p, 60p, 90p, 120p),
    // bên giao diện khách 1 VẪN PHẢI KHÓA TẤT CẢ những ô thời gian mà khách 2 có thể mua trong mục lựa chọn.
    // Không được rút gọn danh sách khóa chỉ còn ô của thời lượng đang chọn để tránh khách khác cướp slot!
    const activeHoldKeys = (selectedSlot.holdSlotKeys && selectedSlot.holdSlotKeys.length > 0)
      ? selectedSlot.holdSlotKeys
      : myLockedSlotIds;

    socketRef.current?.emit('lock_slots', activeHoldKeys);
    setMyLockedSlotIds(activeHoldKeys);

    setSelectedSlot({
      ...selectedSlot,
      durationMin,
      gioKetThuc: newEndTime,
      giaTien: newGiaTien,
    });
  };

  // ===================================================================================
  // [LUỒNG ĐẶT LỊCH ONLINE - BƯỚC 3]: CHỌN DỊCH VỤ ĐI KÈM & TỰ ĐỘNG TÍNH TIỀN
  // - Cho phép chọn nước uống, áo bib, trọng tài, bóng thi đấu
  // - Tự động tính: Tổng tiền = Tiền sân + Tiền dịch vụ; Tiền thanh toán = 30% (Cọc) hoặc 100%
  // ===================================================================================
  const handleQuantityChange = (dichVuId: number, delta: number) => {
    setBookingForm((prev) => {
      const current = prev.dich_vu_chon[dichVuId] || 0;
      const next = Math.max(0, current + delta);
      const updated = { ...prev.dich_vu_chon };
      if (next === 0) {
        delete updated[dichVuId];
      } else {
        updated[dichVuId] = next;
      }
      return { ...prev, dich_vu_chon: updated };
    });
  };

  // Tính toán tổng tiền: Tiền sân + Tiền dịch vụ
  const { tongTienDichVu, tongTienDon, soTienThanhToan } = useMemo(() => {
    if (!selectedSlot) return { tongTienDichVu: 0, tongTienDon: 0, soTienThanhToan: 0 };

    let tienDv = 0;
    Object.entries(bookingForm.dich_vu_chon).forEach(([dvId, qty]) => {
      const dv = dichVuList.find((d) => d.id === Number(dvId));
      if (dv) {
        tienDv += dv.don_gia * qty;
      }
    });

    const tienSan = selectedSlot.giaTien;
    const tong = tienSan + tienDv;
    const thanhToan = bookingForm.loai_thanh_toan === 'DAT_COC' ? Math.round(tong * 0.3) : tong;

    return {
      tongTienDichVu: tienDv,
      tongTienDon: tong,
      soTienThanhToan: thanhToan,
    };
  }, [selectedSlot, bookingForm.dich_vu_chon, bookingForm.loai_thanh_toan, dichVuList]);

  // ===================================================================================
  // [LUỒNG ĐẶT LỊCH ONLINE - BƯỚC 4]: XÁC NHẬN THỜI LƯỢNG & CHUYỂN SANG NHẬP THÔNG TIN KHÁCH
  // - Kiểm tra lại xung đột khung giờ đá với các đơn khác trong ngày
  // - Tiếp tục duy trì khóa toàn bộ các ô thời gian mà khách 2 có thể mua trong suốt phiên đặt
  //   để đảm bảo an toàn tuyệt đối, chống xung đột cướp slot
  // ===================================================================================
  const handleProceedToInfo = () => {
    if (!selectedSlot) return;
    if (checkConflictForSan(selectedSlot.san.id, selectedSlot.slot.start, selectedSlot.durationMin)) {
      triggerToast({
        type: 'error',
        message: 'Khung giờ bạn chọn bị trùng với lịch đã đặt hoặc có khách giữ chỗ. Vui lòng chọn thời lượng khác!',
      });
      return;
    }

    // Duy trì khóa toàn bộ các ô thời gian khả dụng trong suốt phiên đặt
    const activeHoldKeys = (selectedSlot.holdSlotKeys && selectedSlot.holdSlotKeys.length > 0)
      ? selectedSlot.holdSlotKeys
      : myLockedSlotIds;
    socketRef.current?.emit('lock_slots', activeHoldKeys);
    setMyLockedSlotIds(activeHoldKeys);

    setBookingStep('INFO');
  };

  // ===================================================================================
  // [LUỒNG ĐẶT LỊCH ONLINE - BƯỚC 5]: TẠO ĐƠN TẠM THỜI VÀ SINH MÃ THANH TOÁN VIETQR PAYOS (MB BANK)
  // - Gửi POST /api/thanh-toan/payos/tao-link kèm dữ liệu đặt sân và số tiền thanh toán (cọc 30% hoặc 100%)
  // - Backend chạy Stored Procedure sp_DatSan lưu đơn tạm trạng thái 'CHO_THANH_TOAN'
  // - Backend gọi PayOS SDK sinh mã VietQR động chứa số tài khoản MB Bank + số tiền chuẩn xác
  // - Frontend chuyển sang Bước 3 ('QR') hiển thị mã VietQR kèm đếm ngược 10 phút
  // ===================================================================================
  const handleProceedToQR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;

    const hoTen = (bookingForm.ho_ten || currentUser?.ho_ten || '').trim();
    if (!hoTen) {
      triggerToast({
        type: 'error',
        message: 'Không tìm thấy Họ tên người đặt! Vui lòng đăng nhập lại.',
      });
      return;
    }
    const soDienThoai = (bookingForm.so_dien_thoai || currentUser?.so_dien_thoai || '').trim();

    setIsCreatingPayOS(true);
    setIsPaymentSuccess(false);

    try {
      const res = await fetch(`${API_BASE_URL}/thanh-toan/payos/tao-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingData: {
            ma_san: selectedSlot.san.id,
            ngay_da: filterNgayDa,
            gio_bat_dau: selectedSlot.slot.start,
            gio_ket_thuc: selectedSlot.gioKetThuc,
            tien_san: selectedSlot.giaTien,
            tong_tien: tongTienDon,
            ghi_chu: bookingForm.ghi_chu || null,
            dich_vu_chon: bookingForm.dich_vu_chon || {},
            ho_ten: hoTen,
            so_dien_thoai: soDienThoai,
            ma_nguoi_dung: currentUser?.id || undefined,
            email: currentUser?.email || undefined,
          },
          so_tien: soTienThanhToan,
          loai_thanh_toan: bookingForm.loai_thanh_toan,
          ho_ten: hoTen,
          so_dien_thoai: soDienThoai,
          ma_nguoi_dung: currentUser?.id || undefined,
          email: currentUser?.email || undefined,
        }),
      });

      const data = await res.json();

      if (data.success && data.data) {
        setPayOSData(data.data);
        setBookingStep('QR');
        triggerToast({
          type: 'info',
          message: 'Đã tạo mã thanh toán VietQR kết nối MB Bank thành công!',
        });
      } else {
        triggerToast({
          type: 'error',
          message: data.message || 'Không thể tạo mã VietQR PayOS MB Bank!',
        });
      }
    } catch (err) {
      console.error('Lỗi khi tạo thanh toán PayOS:', err);
      triggerToast({
        type: 'error',
        message: 'Lỗi kết nối đến máy chủ thanh toán PayOS!',
      });
    } finally {
      setIsCreatingPayOS(false);
    }
  };


  // Xử lý gửi đơn đặt sân LƯU TRỰC TIẾP VÀO SQL SERVER (Stored Procedure sp_DatSan)
  const handleConfirmPayment = async () => {
    if (!selectedSlot) return;

    setIsSubmitting(true);

    try {
      // Gửi yêu cầu POST lên API Backend Express -> Thực thi lưu vào SQL Server
      const res = await fetch(`${API_BASE_URL}/dat-san`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ma_nguoi_dung: currentUser?.id || null,
          ho_ten: bookingForm.ho_ten,
          so_dien_thoai: bookingForm.so_dien_thoai,
          ma_san: selectedSlot.san.id,
          ngay_da: filterNgayDa,
          gio_bat_dau: selectedSlot.slot.start,
          gio_ket_thuc: selectedSlot.gioKetThuc,
          tien_san: selectedSlot.giaTien,
          tong_tien: tongTienDon,
          phuong_thuc: 'CHUYEN_KHOAN',
          loai_thanh_toan: bookingForm.loai_thanh_toan,
          trang_thai: bookingForm.loai_thanh_toan === 'DAT_COC' ? 'DA_COC' : 'DA_THANH_TOAN',
          ghi_chu: bookingForm.ghi_chu || null,
          dich_vu_chon: bookingForm.dich_vu_chon || {},
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        triggerToast({
          type: 'error',
          message: data.message || '⚠️ Lỗi khi lưu đơn đặt sân vào CSDL!',
        });
        setIsSubmitting(false);
        return;
      }

      // Đặt sân thành công -> Tải lại lịch sân & tồn kho dịch vụ trực tiếp từ CSDL SQL Server
      await Promise.all([
        fetchLichSan(filterNgayDa, sanBongList),
        fetchDichVu()
      ]);

      // Giải phóng toàn bộ các ô giữ chỗ Real-time trên Socket và thông báo tới POS / Management System
      socketRef.current?.emit('unlock_all');
      socketRef.current?.emit('booking_updated', {
        ma_don_dat: data.data?.id,
        ten_khach_hang: bookingForm.ho_ten,
        ngay_da: filterNgayDa
      });
      setMyLockedSlotIds([]);

      setIsSubmitting(false);
      setSelectedSlot(null);
      setBookingStep('DURATION');

      triggerToast({
        type: 'success',
        message: `🎉 Đặt sân ${selectedSlot.san.ten_san} (${selectedSlot.slot.start} - ${selectedSlot.gioKetThuc}) thành công cho khách ${bookingForm.ho_ten}! Các ô giờ đã chuyển sang màu đỏ.`,
      });
    } catch (err) {
      console.error('Lỗi khi gửi đơn đặt sân lên SQL Server:', err);
      triggerToast({
        type: 'error',
        message: '❌ Không thể kết nối đến máy chủ Backend SQL Server để lưu đơn đặt!',
      });
      setIsSubmitting(false);
    }
  };

  // Xử lý Đăng xuất
  const handleLogout = () => {
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('soccer_current_user');
    setCurrentUser(null);
    setUserDropdownOpen(false);
    setIsProfileModalOpen(false);
    triggerToast({ type: 'info', message: 'Đã đăng xuất tài khoản thành công.' });
  };

  return (
    <div suppressHydrationWarning className={`min-h-screen transition-colors duration-300 font-sans selection:bg-emerald-500 selection:text-white ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}>
      <Head>
        <title>Sport247 - Hệ Thống Đặt Sân Thể Thao Trực Tuyến 24/7</title>
        <meta
          name="description"
          content="Đặt sân bóng đá cỏ nhân tạo 5 người, 7 người, Pickleball và Cầu lông trực tuyến kết nối CSDL SQL Server thời gian thực."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* HIỆU ỨNG LOADING VÒNG 12 TRÁI BANH XOAY TRÒN KHI ĐANG TẢI DỮ LIỆU */}
      {isLoadingData && (
        <SoccerLoader message="Đang kết nối CSDL và tải dữ liệu sân bóng..." fullScreen={true} />
      )}

      {/* TOAST THÔNG BÁO NỔI */}
      {toastMessage && (
        <div
          className={`fixed top-28 right-5 z-[70] flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl border backdrop-blur-md transition-all duration-300 animate-slide-in ${toastMessage.type === 'success'
            ? isDarkMode ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200' : 'bg-emerald-50 border-emerald-300 text-emerald-900'
            : toastMessage.type === 'error'
              ? isDarkMode ? 'bg-rose-950/90 border-rose-500/50 text-rose-200' : 'bg-rose-50 border-rose-300 text-rose-900'
              : isDarkMode ? 'bg-blue-950/90 border-blue-500/50 text-blue-200' : 'bg-blue-50 border-blue-300 text-blue-900'
            }`}
        >
          {toastMessage.type === 'success' && <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />}
          {toastMessage.type === 'error' && <AlertCircle className="w-6 h-6 text-rose-500 shrink-0" />}
          {toastMessage.type === 'info' && <Info className="w-6 h-6 text-blue-500 shrink-0" />}
          <span className="text-sm font-medium leading-relaxed max-w-sm">{toastMessage.message}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* =====================================================================
          1. HEADER & NAVBAR 2 TẦNG (DOUBLE-DECKER HEADER)
          ===================================================================== */}
      <header className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b transition-colors duration-300 shadow-xl ${isDarkMode ? 'bg-slate-950/95 border-emerald-900/40' : 'bg-white/95 border-slate-200'
        }`}>

        {/* TẦNG 1: LOGO + KHUNG TÌM KIẾM TÊN SÂN + NÚT SÁNG/TỐI + ĐĂNG NHẬP/ĐĂNG KÝ */}
        <div className={`border-b transition-colors duration-300 ${isDarkMode ? 'border-slate-800/80 bg-slate-950/90' : 'border-slate-200 bg-white/90'
          }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-4">

            {/* Logo Thương Hiệu Bên Trái */}
            <a href="#" className="flex items-center gap-3 group shrink-0">
              <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-lg shadow-emerald-500/10 group-hover:scale-105 transition-transform overflow-hidden">
                <SoccerBallIcon className="w-6 h-6" />
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center gap-1">
                  <span className={`text-xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>SPORT</span>
                  <span className="text-xl font-black tracking-tight text-emerald-500">247</span>
                </div>
                <p className="text-[9px] uppercase font-bold tracking-widest text-emerald-600 dark:text-emerald-500/80 -mt-1">Sân Thể Thao 24/7</p>
              </div>
            </a>



            {/* CỤM NÚT PHẢI: NÚT SÁNG/TỐI + ĐĂNG NHẬP (ĐÃ BỎ 2 NÚT ĐẶT SÂN NHANH & TRANG QUẢN TRỊ THEO YÊU CẦU) */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">

              {/* Nút Chuyển đổi Theme Sáng / Tối */}
              <button
                type="button"
                onClick={toggleTheme}
                suppressHydrationWarning
                title={isDarkMode ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
                className={`p-2 sm:p-2.5 rounded-2xl border transition-all duration-300 flex items-center justify-center group shadow-sm hover:scale-105 active:scale-95 cursor-pointer ${isDarkMode
                  ? 'bg-slate-900 border-slate-700 text-amber-400 hover:bg-slate-800 hover:border-amber-400/50'
                  : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200 hover:text-emerald-600'
                  }`}
              >
                {isDarkMode ? (
                  <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
                ) : (
                  <Moon className="w-4 h-4 text-emerald-600 group-hover:-rotate-12 transition-transform duration-300" />
                )}
              </button>

              {/* Khu vực Người Dùng / Đăng nhập (Xác thực trực tiếp từ SQL Server) */}
              {currentUser ? (
                <div className="relative" ref={userDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setUserDropdownOpen((prev) => !prev)}
                    className={`flex items-center gap-2 p-1 sm:pr-3 rounded-full border transition-all cursor-pointer ${isDarkMode
                      ? 'bg-slate-900 border-emerald-800/50 hover:border-emerald-500/60'
                      : 'bg-slate-100 border-slate-300 hover:border-emerald-500'
                      }`}
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center font-bold text-slate-950 text-xs shadow-inner">
                      {currentUser.ho_ten ? currentUser.ho_ten.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="text-left hidden xl:block">
                      <p className={`text-xs font-semibold leading-tight ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{currentUser.ho_ten}</p>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                  </button>

                  {/* Dropdown Menu User */}
                  {userDropdownOpen && (
                    <div className={`absolute right-0 mt-3 w-60 rounded-2xl border shadow-2xl p-2 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                      }`}>
                      <div className={`px-3 py-2 border-b mb-1 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                        <p className="text-[11px] text-slate-400">Tài khoản:</p>
                        <p className="text-xs font-bold text-emerald-500 truncate">{currentUser.email}</p>
                      </div>

                      {/* Nút đi tới Management System cho Nhân viên & Admin */}
                      {isUserStaffOrAdmin && (
                        <a
                          href="/management-system"
                          onClick={(e) => {
                            e.preventDefault();
                            setUserDropdownOpen(false);
                            router.push('/management-system');
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-black rounded-xl transition-all text-left cursor-pointer mb-1 shadow-sm ${
                            isDarkMode 
                              ? 'text-emerald-300 hover:text-white hover:bg-emerald-900/60 bg-emerald-950/50 border border-emerald-500/40' 
                              : 'text-emerald-700 hover:text-emerald-950 hover:bg-emerald-100 bg-emerald-50 border border-emerald-300'
                          }`}
                        >
                          <LandPlot className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span className="truncate font-black">⚡ Quản Lý Sân (Management System)</span>
                        </a>
                      )}

                      {/* Nút đi tới Dashboard cho Admin trong Dropdown */}
                      {isUserAdmin && (
                        <a
                          href="/Dashboard"
                          onClick={(e) => {
                            e.preventDefault();
                            setUserDropdownOpen(false);
                            router.push('/Dashboard');
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-black rounded-xl transition-all text-left cursor-pointer mb-1 shadow-sm ${
                            isDarkMode 
                              ? 'text-purple-300 hover:text-white hover:bg-purple-900/60 bg-purple-950/50 border border-purple-500/40' 
                              : 'text-purple-700 hover:text-purple-950 hover:bg-purple-100 bg-purple-50 border border-purple-300'
                          }`}
                        >
                          <ShieldCheck className="w-4 h-4 text-purple-500 shrink-0" />
                          <span>🛡️ Trang Quản Trị (Dashboard)</span>
                        </a>
                      )}

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          setIsProfileModalOpen(true);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl transition-colors text-left cursor-pointer ${isDarkMode ? 'text-slate-300 hover:text-emerald-400 hover:bg-slate-800/60' : 'text-slate-700 hover:text-emerald-600 hover:bg-slate-100'
                          }`}
                      >
                        <User className="w-4 h-4 text-emerald-500" />
                        Thông tin tài khoản
                      </button>
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          router.push('/history');
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl transition-colors text-left cursor-pointer ${isDarkMode ? 'text-slate-300 hover:text-emerald-400 hover:bg-slate-800/60' : 'text-slate-700 hover:text-emerald-600 hover:bg-slate-100'
                          }`}
                      >
                        <History className="w-4 h-4 text-emerald-500" />
                        Lịch sử đặt sân
                      </button>
                      <button
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-500 rounded-xl transition-colors text-left mt-1 border-t cursor-pointer ${isDarkMode ? 'hover:bg-rose-950/40 border-slate-800/60' : 'hover:bg-rose-50 border-slate-100'
                          }`}
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginInitialRegister(false);
                      setIsLoginModalOpen(true);
                    }}
                    className="login-trigger-btn"
                  >
                    Đăng nhập
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginInitialRegister(true);
                      setIsLoginModalOpen(true);
                    }}
                    className="register-trigger-btn"
                  >
                    Đăng ký
                  </button>
                </div>
              )}

              {/* NÚT HAMBURGER MENU CHO MOBILE & TABLET (block lg:hidden) */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`p-2 rounded-2xl border transition-all duration-200 flex items-center justify-center cursor-pointer block lg:hidden shadow-sm ${
                  isDarkMode
                    ? 'bg-slate-900 border-slate-700 text-slate-200 hover:text-white hover:bg-slate-800'
                    : 'bg-slate-100 border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-200'
                }`}
                aria-label="Mở Menu Di Động"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 text-rose-400" />
                ) : (
                  <Menu className="w-5 h-5 text-emerald-500" />
                )}
              </button>
            </div>

          </div>
        </div>

        {/* TẦNG 2: THANH MENU ĐIỀU HƯỚNG CHÍNH (ẨN TRÊN MOBILE & TABLET: hidden lg:block) */}
        <div className={`hidden lg:block transition-colors duration-300 border-t ${isDarkMode ? 'bg-slate-950/70 border-slate-900' : 'bg-slate-100/80 border-slate-200'
          }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-11 flex items-center justify-between overflow-x-auto">

            {/* Danh sách liên kết Menu chính */}
            <nav className="flex items-center gap-1 sm:gap-2 shrink-0 py-1">
              <a
                href="#hero"
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${isDarkMode
                  ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 hover:bg-emerald-900/50'
                  : 'text-emerald-700 bg-emerald-100 border border-emerald-300 hover:bg-emerald-200'
                  }`}
              >
                🏠 Trang chủ
              </a>
              <a
                href="#ma-tran-lich-san"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${isDarkMode ? 'text-slate-300 hover:text-emerald-400 hover:bg-slate-900/80' : 'text-slate-700 hover:text-emerald-600 hover:bg-slate-200'
                  }`}
              >
                📅 Đặt sân
              </a>
              <Link
                href="/tin-tuc"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${isDarkMode ? 'text-slate-300 hover:text-emerald-400 hover:bg-slate-900/80' : 'text-slate-700 hover:text-emerald-600 hover:bg-slate-200'
                  }`}
              >
                📰 Tin Tức
              </Link>
              <Link
                href="/about-us"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${isDarkMode ? 'text-slate-300 hover:text-emerald-400 hover:bg-slate-900/80' : 'text-slate-700 hover:text-emerald-600 hover:bg-slate-200'
                  }`}
              >
                ℹ️ About Us
              </Link>
              <Link
                href="/lien-he"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${isDarkMode ? 'text-slate-300 hover:text-emerald-400 hover:bg-slate-900/80' : 'text-slate-700 hover:text-emerald-600 hover:bg-slate-200'
                  }`}
              >
                📞 Liên Hệ
              </Link>
            </nav>

            {/* Thông tin hỗ trợ nhanh */}
            <div className="hidden lg:flex items-center gap-4 text-[11px] font-semibold text-slate-400 shrink-0">
              <span className={`flex items-center gap-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                <Phone className="w-3.5 h-3.5 text-emerald-500" />
                Hotline Đặt Sân: <strong className="text-emerald-500 font-mono">0816344504</strong>
              </span>
            </div>

          </div>
        </div>

      </header>

      {/* ==================== 1.1 MOBILE & TABLET NAVIGATION DRAWER & OVERLAY ==================== */}
      {/* LỚP PHỦ NỀN MỜ (OVERLAY): Click vào ngoài để tự đóng menu */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300 lg:hidden ${
          isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* NGĂN KÉO DRAWER TRƯỢT TỪ MÉP PHẢI */}
      <aside
        className={`fixed top-0 right-0 bottom-0 w-72 max-w-[85vw] z-[60] flex flex-col justify-between p-5 transition-transform duration-300 ease-in-out shadow-2xl lg:hidden ${
          isDarkMode ? 'bg-slate-950 border-l border-slate-800 text-white' : 'bg-white border-l border-slate-200 text-slate-900'
        } ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header của Mobile Drawer */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-slate-950 flex items-center justify-center font-black shadow-md shadow-emerald-500/20">
              ⚽
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className={`text-base font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>SPORT</span>
                <span className="text-base font-black tracking-tight text-emerald-500">247</span>
              </div>
              <p className="text-[9px] uppercase font-bold tracking-widest text-emerald-500 -mt-0.5">Menu Điều Hướng</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Đóng menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Danh sách Links điều hướng chính */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-1.5">
          <a
            href="#hero"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all hover:bg-emerald-500/10 hover:text-emerald-400 text-slate-300"
          >
            🏠 Trang chủ
          </a>
          <a
            href="#ma-tran-lich-san"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all hover:bg-emerald-500/10 hover:text-emerald-400 text-slate-300"
          >
            📅 Đặt sân
          </a>
          <Link
            href="/tin-tuc"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all hover:bg-emerald-500/10 hover:text-emerald-400 text-slate-300"
          >
            📰 Tin Tức
          </Link>
          <Link
            href="/about-us"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all hover:bg-emerald-500/10 hover:text-emerald-400 text-slate-300"
          >
            ℹ️ About Us
          </Link>
          <Link
            href="/lien-he"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all hover:bg-emerald-500/10 hover:text-emerald-400 text-slate-300"
          >
            📞 Liên Hệ
          </Link>

          {isUserStaffOrAdmin && (
            <a
              href="/management-system"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-black transition-all bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
            >
              ⚡ Quản Lý Sân (POS)
            </a>
          )}

          {isUserAdmin && (
            <a
              href="/Dashboard"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-black transition-all bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20"
            >
              🛡️ Trang Quản Trị (Dashboard)
            </a>
          )}
        </nav>

        {/* Footer Mobile Drawer (Người dùng / Đăng nhập) */}
        <div className="pt-4 border-t border-slate-800/80">
          {currentUser ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-xs">
                  {currentUser.ho_ten ? currentUser.ho_ten.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-white truncate">{currentUser.ho_ten}</p>
                  <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đăng xuất</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setLoginInitialRegister(false);
                  setIsLoginModalOpen(true);
                }}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 cursor-pointer text-center"
              >
                Đăng nhập
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setLoginInitialRegister(true);
                  setIsLoginModalOpen(true);
                }}
                className="py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md cursor-pointer text-center"
              >
                Đăng ký
              </button>
            </div>
          )}
        </div>
      </aside>

      <main className="pt-16 lg:pt-28 w-full max-w-full overflow-hidden">
        {/* =====================================================================
            2. HERO SECTION VỚI BANNER (ẢNH / VIDEO) LÀM NỀN TRỰC TIẾP DƯỚI CHỮ
            - Mobile First: Tinh chỉnh nhỏ gọn trên mobile, giữ nguyên vẻ đẹp trên PC (lg:)
            - Ảnh: 9 giây thì tự động chuyển
            - Video: Hết thời lượng video thì tự động chuyển
            ===================================================================== */}
        <section id="hero" className="relative w-full max-w-full overflow-hidden flex items-center justify-center bg-slate-950 group pt-8 pb-12 px-4 h-auto min-h-[320px] lg:h-[500px] lg:py-16">
          {/* LỚP NỀN BANNER SLIDER (ẢNH HOẶC VIDEO NẰM TRỰC TIẾP DƯỚI DÒNG CHỮ) */}
          <div className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-slate-950">
            {banners.length > 0 ? (
              banners.map((item, idx) => {
                const isActive = idx === currentBannerIndex;
                if (!isActive) return null;

                return (
                  <div key={item.id || idx} className="absolute inset-0 w-full h-full animate-fade-in">
                    {item.loai_banner === 'VIDEO' && item.video_url ? (
                      <video
                        ref={bannerVideoRef}
                        src={item.video_url}
                        poster={item.hinh_anh}
                        autoPlay
                        muted={isBannerMuted}
                        playsInline
                        onEnded={handleNextBanner}
                        className="w-full h-full object-cover scale-105"
                      />
                    ) : (
                      <img
                        src={item.hinh_anh || 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=1600&q=80'}
                        alt={item.tieu_de || 'Banner Background'}
                        className="w-full h-full object-cover transform scale-105 transition-transform duration-1000"
                      />
                    )}
                  </div>
                );
              })
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-emerald-950 via-slate-950 to-slate-900" />
            )}

            {/* LỚP PHỦ GRADIENT ĐỂ CHỮ NỔI RÕ VÀ CHUYỂN MÀU LIỀN MẠCH XUỐNG DƯỚI */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/65 to-slate-950 pointer-events-none" />
          </div>

          {/* NỘI DUNG CHÍNH NẰM NỔI TRÊN LỚP NỀN BANNER (CHỮ TIÊU ĐỀ & CTA) */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            
            {/* DÒNG CHỮ CHÍNH NẰM TRÊN NỀN BANNER */}
            <h1 className="text-lg md:text-2xl lg:text-4xl font-bold tracking-tight max-w-5xl mx-auto leading-tight text-white drop-shadow-2xl">
              <div className="drop-shadow-lg">Đặt Sân Thể Thao</div>
              <div className="text-xl md:text-3xl lg:text-5xl font-extrabold my-1 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent drop-shadow-md">
                Nhanh Dễ Dàng
              </div>
              <span className="text-sm md:text-xl lg:text-3xl font-extrabold mt-1 block text-slate-100 drop-shadow-lg">
                Chọn Giờ Vào Đá Ngay
              </span>
            </h1>

            {/* NÚT HÀNH ĐỘNG DẪN XUỐNG ĐẶT SÂN */}
            <div className="flex flex-wrap items-center justify-center">
              <a
                href="#ma-tran-lich-san"
                className="inline-flex items-center gap-1.5 md:gap-2 py-2 px-4 text-xs md:py-3 md:px-6 md:text-base font-semibold rounded-full mt-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-xl shadow-emerald-500/30 transition-all hover:scale-105 cursor-pointer"
              >
                <span>⚽ Đặt Sân Ngay Hôm Nay</span>
                <ChevronRight className="w-3.5 h-3.5 md:w-5 md:h-5 stroke-[3]" />
              </a>
            </div>
          </div>

          {/* THANH TIẾN TRÌNH 9 GIÂY CHO ẢNH */}
          {banners[currentBannerIndex]?.loai_banner === 'IMAGE' && banners.length > 1 && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-white/15 z-20 overflow-hidden">
              <div
                className="h-full bg-emerald-400 transition-all duration-100 ease-linear shadow-sm shadow-emerald-400"
                style={{ width: `${bannerProgress}%` }}
              />
            </div>
          )}



          {/* NÚT MŨI TÊN CHUYỂN BANNER TRÁI / PHẢI */}
          {banners.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevBanner();
                }}
                className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 w-7 h-7 md:w-10 md:h-10 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/60 text-white flex items-center justify-center border border-white/20 opacity-70 group-hover:opacity-100 transition-all cursor-pointer shadow-xl hover:scale-110"
                title="Banner trước"
              >
                <ArrowLeft className="w-3.5 h-3.5 md:w-5 md:h-5 stroke-[2.5]" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextBanner();
                }}
                className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 w-7 h-7 md:w-10 md:h-10 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/60 text-white flex items-center justify-center border border-white/20 opacity-70 group-hover:opacity-100 transition-all cursor-pointer shadow-xl hover:scale-110"
                title="Banner tiếp theo"
              >
                <ArrowRight className="w-3.5 h-3.5 md:w-5 md:h-5 stroke-[2.5]" />
              </button>

              {/* CÁC CHẤM CHUYỂN SLIDE Ở DƯỚI CÙNG HERO SECTION */}
              <div className="absolute bottom-3 md:bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 md:gap-2.5 bg-black/40 backdrop-blur-sm hover:bg-black/60 px-2.5 py-1 md:px-4 md:py-1.5 rounded-full border border-white/15 shadow-xl transition-colors">
                {banners.map((b, i) => (
                  <button
                    key={b.id || i}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentBannerIndex(i);
                    }}
                    className={`transition-all rounded-full cursor-pointer ${
                      i === currentBannerIndex
                        ? 'w-5 md:w-8 h-1.5 md:h-2.5 bg-emerald-400 shadow-md shadow-emerald-400/60'
                        : 'w-1.5 md:w-2.5 h-1.5 md:h-2.5 bg-white/40 hover:bg-white/80'
                    }`}
                    title={`Chuyển đến banner ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </section>

        {/* =====================================================================
            3. KHU VỰC ĐẶT SÂN THEO LOẠI SÂN THỂ THAO (LAYOUT CARD THỂ THAO HIỆN ĐẠI)
            ===================================================================== */}
        <section id="ma-tran-lich-san" className="py-12 sm:py-20 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div>
            {/* HEADER SECTION: TIÊU ĐỀ & MÔ TẢ */}
            <div className="flex flex-col items-center text-center mb-8 sm:mb-12">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold mb-3 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Hệ Thống Sân Thể Thao Đa Năng 24/7</span>
              </div>
              <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Chọn Môn Thể Thao Để Đặt Sân
              </h2>
              <p className={`text-xs sm:text-sm mt-2 max-w-2xl ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Khám phá các loại sân thể thao đạt chuẩn quốc tế. Nhấn vào môn thể thao bạn muốn thi đấu để xem chi tiết danh sách sân và chọn khung giờ trống.
              </p>
            </div>

            {/* LƯỚI THẺ CÁC LOẠI SÂN (LAYOUT Y HỆT HÌNH ẢNH MẪU - ĐÃ XÓA CHỮ DƯỚI GẠCH ĐỎ) */}
            {isLoadingData ? (
              <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
                <p className="text-sm font-semibold">Đang tải danh mục môn thể thao từ CSDL SQL Server...</p>
              </div>
            ) : loaiSanList.filter((l) => !isDuBiPitch(l)).length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <p className="text-base font-bold">Chưa có loại sân nào được cập nhật trên hệ thống!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {loaiSanList.filter((l) => !isDuBiPitch(l)).map((loai) => {
                  const theme = getSportTheme(loai.ten_loai, loai.mo_ta);
                  return (
                    <div
                      key={loai.id}
                      onClick={() => handleSelectCategory(loai)}
                      className={`group relative rounded-3xl p-5 sm:p-6 border transition-all duration-300 cursor-pointer flex flex-col justify-between hover:-translate-y-1.5 hover:shadow-2xl ${
                        isDarkMode
                          ? 'bg-slate-900/90 border-slate-800/90 hover:border-emerald-500/60 hover:shadow-emerald-950/40'
                          : 'bg-white border-slate-200/90 hover:border-emerald-500/60 hover:shadow-emerald-100 shadow-md'
                      }`}
                    >
                      <div>
                        {/* HÀNG TRÊN: ICON THỂ THAO & BADGE XU HƯỚNG */}
                        <div className="flex items-start justify-between gap-2">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border shadow-inner ${
                            isDarkMode ? 'bg-slate-800/90 border-slate-700/80' : 'bg-slate-100 border-slate-300'
                          }`}>
                            <span>{theme.icon}</span>
                          </div>
                          {theme.badge && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-sm shadow-rose-900/50 animate-pulse">
                              {theme.badge}
                            </span>
                          )}
                        </div>

                        {/* TÊN LOẠI SÂN & MÔ TẢ ĐẶC ĐIỂM */}
                        <h3 className={`text-lg sm:text-xl font-black mt-4 tracking-tight group-hover:text-emerald-500 transition-colors ${
                          isDarkMode ? 'text-white' : 'text-slate-900'
                        }`}>
                          {loai.ten_loai}
                        </h3>
                        <p className={`text-xs mt-1.5 font-medium leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                          {theme.subtitle}
                        </p>
                      </div>

                      {/* HÀNG DƯỚI: NÚT ĐẶT NGAY (ĐÃ XÓA 30+ CỤM SÂN THEO YÊU CẦU, CĂN PHẢI GỌN GÀNG) */}
                      <div className={`mt-6 pt-4 border-t flex items-center justify-end text-xs ${
                        isDarkMode ? 'border-slate-800' : 'border-slate-100'
                      }`}>
                        <span className="font-black text-emerald-500 flex items-center gap-1 group-hover:translate-x-1.5 transition-transform">
                          <span>Đặt ngay</span>
                          <span>→</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* =====================================================================
            MODAL POPUP: XEM DANH SÁCH SÂN VÀ CHỌN KHUNG GIỜ THI ĐẤU
            ===================================================================== */}
        {selectedCategory && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md overflow-hidden animate-in fade-in duration-200"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleCloseCategoryModal();
              }
            }}
          >
            <div
              className={`relative w-full max-w-6xl max-h-[92vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 ${
                isDarkMode ? 'bg-slate-900 border-slate-700 shadow-slate-950/80' : 'bg-white border-slate-300 shadow-2xl'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* HEADER MODAL */}
              <div className={`p-4 sm:p-5 border-b flex items-center justify-between gap-3 shrink-0 ${
                isDarkMode ? 'bg-slate-950/90 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-2xl border shadow-inner shrink-0 ${
                    isDarkMode ? 'bg-slate-800/90 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}>
                    <span>{getSportTheme(selectedCategory.ten_loai, selectedCategory.mo_ta).icon}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className={`text-base sm:text-xl font-black truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {selectedCategory.ten_loai}
                      </h2>
                      {getSportTheme(selectedCategory.ten_loai, selectedCategory.mo_ta).badge && (
                        <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-600 text-white">
                          {getSportTheme(selectedCategory.ten_loai, selectedCategory.mo_ta).badge}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs truncate ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {getSportTheme(selectedCategory.ten_loai, selectedCategory.mo_ta).subtitle}
                    </p>
                  </div>
                </div>



                {/* NÚT TẮT MODAL (X) */}
                <button
                  type="button"
                  onClick={handleCloseCategoryModal}
                  className={`p-2 rounded-2xl border transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0 ${
                    isDarkMode
                      ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
                      : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100 hover:text-slate-900 shadow-xs'
                  }`}
                  title="Đóng (Esc)"
                >
                  <X className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>

              {/* THANH ĐIỀU HƯỚNG VÀ BỘ LỌC TRONG MODAL */}
              <div className={`p-3 sm:p-4 border-b space-y-3 shrink-0 ${
                isDarkMode ? 'bg-slate-900/95 border-slate-800' : 'bg-slate-100/90 border-slate-200'
              }`}>
                {/* HÀNG 1: CHỌN NGÀY VÀ CHÚ GIẢI TRẠNG THÁI */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <DateNavigationBar
                      value={filterNgayDa}
                      onChange={(_date, formattedDateStr) => setFilterNgayDa(formattedDateStr)}
                    />

                    {/* NÚT CHUYỂN CHẾ ĐỘ ĐẶT NHIỀU SÂN CÙNG LÚC */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsMultiBookingMode((prev) => !prev);
                        if (!isMultiBookingMode) {
                          triggerToast({
                            type: 'info',
                            message: '⚡ Chế độ đặt nhiều sân ĐÃ BẬT! Bạn có thể bấm chọn nhiều sân để gom vào cùng 1 đơn thanh toán.',
                          });
                        } else {
                          triggerToast({
                            type: 'info',
                            message: 'Đã chuyển về chế độ đặt từng sân nhanh.',
                          });
                        }
                      }}
                      className={`px-3 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 ${
                        isMultiBookingMode
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 ring-2 ring-amber-400 shadow-amber-500/30'
                          : isDarkMode
                            ? 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
                            : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                      }`}
                      title="Bật/Tắt chế độ đặt nhiều sân cùng lúc"
                    >
                      <Layers className="w-4 h-4" />
                      <span>{isMultiBookingMode ? '⚡ Đặt nhiều sân (Đang Bật)' : '⚡ Đặt nhiều sân'}</span>
                      {cartCourts.length > 0 && (
                        <span className="w-5 h-5 rounded-full bg-slate-950 text-amber-400 text-[10px] font-black flex items-center justify-center animate-pulse">
                          {cartCourts.length}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* BẢNG CHÚ GIẢI TRẠNG THÁI - THEO MÀU CHỦ ĐẠO LẠC HỒNG (XANH DƯƠNG, VÀNG KIM, ĐỎ ĐÔ) */}
                  <div className={`flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl border text-[11px] font-bold ${
                    isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                  }`}>
                    <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0 shadow-xs" />
                      <span>Trống (+ Đặt)</span>
                    </div>
                    <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/30">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0 animate-pulse" />
                      <span>Giữ Chỗ</span>
                    </div>
                    <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-950/20 text-rose-400 border border-rose-800/30">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#8d1e42] shrink-0" />
                      <span className="line-through">Đã Đặt</span>
                    </div>
                    <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-700/30">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0" />
                      <span>Đã Qua</span>
                    </div>
                    {isMultiBookingMode && (
                      <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-400 font-black border border-amber-400/40">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                        <span>Đã Chọn ({cartCourts.length})</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* HÀNG 2: BỘ LỌC BUỔI & LỌC SÂN */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-800">
                  {/* LỌC BUỔI */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                    <span className={`text-xs font-bold mr-1 shrink-0 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      Buổi:
                    </span>
                    <button
                      type="button"
                      onClick={() => setFilterBuoi('ALL')}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        filterBuoi === 'ALL'
                          ? 'bg-emerald-500 text-slate-950 font-black shadow-xs'
                          : isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      Cả Ngày
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterBuoi('MORNING')}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
                        filterBuoi === 'MORNING'
                          ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                          : isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      <Sunrise className="w-3.5 h-3.5" />
                      Sáng (06h - 12h)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterBuoi('AFTERNOON')}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
                        filterBuoi === 'AFTERNOON'
                          ? 'bg-orange-500 text-slate-950 font-black shadow-xs'
                          : isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5" />
                      Chiều (12h - 17h)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterBuoi('EVENING')}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
                        filterBuoi === 'EVENING'
                          ? 'bg-emerald-500 text-slate-950 font-black shadow-xs'
                          : isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      <Sunset className="w-3.5 h-3.5" />
                      Tối (17h - 19h) 🔥
                    </button>
                  </div>

                  {/* LỌC SÂN CỤ THỂ */}
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border ${
                    isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-slate-300 shadow-xs'
                  }`}>
                    <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className={`text-xs font-bold whitespace-nowrap ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      Sân:
                    </span>
                    <select
                      value={filterSanId}
                      onChange={(e) => setFilterSanId(e.target.value)}
                      className={`bg-transparent text-xs font-black focus:outline-none cursor-pointer ${
                        isDarkMode ? 'text-emerald-400' : 'text-emerald-700'
                      }`}
                    >
                      <option value="ALL" className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>
                        Tất Cả ({availableSanOptions.length} sân)
                      </option>
                      {availableSanOptions.map((san) => (
                        <option key={san.id} value={san.id} className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>
                          {san.ten_san}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* PHẦN THÂN CỦA MODAL (SCROLLABLE NỘI DUNG DANH SÁCH SÂN VÀ KHUNG GIỜ) */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
                {isLoadingData ? (
                  <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                    <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
                    <p className="text-sm font-semibold">Đang tải dữ liệu thực từ CSDL SQL Server...</p>
                  </div>
                ) : filteredSanList.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                    <p className="text-base font-bold">Chưa có sân nào thuộc môn {selectedCategory.ten_loai}!</p>
                    <p className="text-xs text-slate-400 mt-1">Vui lòng chọn môn thể thao khác.</p>
                  </div>
                ) : displayTimeSlots.length === 0 ? (
                  <div className={`text-center py-12 px-4 rounded-3xl border border-dashed ${isDarkMode ? 'border-slate-800 bg-slate-900/30 text-slate-400' : 'border-slate-300 bg-slate-50 text-slate-600'}`}>
                    <Clock className="w-10 h-10 text-slate-400 mx-auto mb-3 opacity-60" />
                    <p className="text-sm font-bold">
                      Không có khung giờ nào trong buổi đã chọn hoặc các khung giờ hôm nay đã kết thúc.
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Quý khách vui lòng chọn buổi khác hoặc đổi sang ngày tiếp theo để xem lịch sân!
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setFilterBuoi('ALL')}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 cursor-pointer"
                      >
                        Xem cả ngày
                      </button>
                    </div>
                  </div>
                ) : (
                  filteredSanList.map((san) => {
                    const availableCount = displayTimeSlots.filter((slot) => {
                      const slotKey = `${san.id}_${slot.start}`;
                      const slotKeyRealtime = `${filterNgayDa}_${san.id}_${slot.start}`;
                      const slotData = gridSlots[slotKey];
                      const matchedSyncOrder = syncOrders.find((order) => {
                        if ((order.ngay_da || '').substring(0, 10) !== filterNgayDa) return false;
                        if (order.trang_thai === 'Đã hủy') return false;
                        const matchSan = (order.ma_san && order.ma_san === san.id) ||
                          (order.ten_san && (order.ten_san.includes(san.ten_san) || san.ten_san.includes(order.ten_san)));
                        if (!matchSan) return false;
                        return isTimeOverlapping(slot.start, slot.end,
                          (order.gio_bat_dau || '').substring(0, 5),
                          (order.gio_ket_thuc || '').substring(0, 5));
                      });
                      const isBooked = (slotData && slotData.trang_thai !== 'TRONG') || !!matchedSyncOrder;
                      const isLockedByOther = lockedSlots.includes(slotKeyRealtime) && !myLockedSlotIds.includes(slotKeyRealtime);
                      const isPast = isSlotInThePast(slot.start);
                      return !isBooked && !isLockedByOther && !isPast;
                    }).length;

                    return (
                      <div
                        key={san.id}
                        className={`p-4 sm:p-5 rounded-3xl border transition-all ${
                          isDarkMode
                            ? 'bg-slate-950/70 border-slate-800/80 shadow-lg shadow-black/20'
                            : 'bg-white border-slate-200/90 shadow-md'
                        }`}
                      >
                        {/* HEADER SÂN */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-200/80 dark:border-slate-800">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm border shadow-sm ${
                              isDarkMode ? 'bg-slate-800 border-slate-700 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            }`}>
                              {san.ten_san.substring(0, 2)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className={`text-base font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                  {san.ten_san}
                                </h3>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                  {san.ten_loai || selectedCategory.ten_loai}
                                </span>
                              </div>
                              <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                💰 {(Number(san.don_gia_phut || 5000) * 60).toLocaleString('vi-VN')} đ/giờ
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-auto">
                            <span className={`text-[11px] font-bold px-3 py-1 rounded-xl border ${
                              availableCount > 0
                                ? isDarkMode
                                  ? 'bg-emerald-950/60 border-emerald-600/50 text-emerald-300'
                                  : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                : 'bg-slate-800/60 border-slate-700 text-slate-400'
                            }`}>
                              ⚡ {availableCount > 0 ? `Còn ${availableCount} ô giờ trống` : 'Hết chỗ hôm nay'}
                            </span>
                          </div>
                        </div>

                        {/* LƯỚI KHUNG GIỜ CỦA SÂN NÀY */}
                        <div className="mt-3.5 grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 sm:gap-2.5">
                          {displayTimeSlots.map((slot) => {
                            const slotKey = `${san.id}_${slot.start}`;
                            const slotKeyRealtime = `${filterNgayDa}_${san.id}_${slot.start}`;
                            const slotData = gridSlots[slotKey];
                            const matchedSyncOrder = syncOrders.find((order) => {
                              if ((order.ngay_da || '').substring(0, 10) !== filterNgayDa) return false;
                              if (order.trang_thai === 'Đã hủy') return false;
                              const matchSan = (order.ma_san && order.ma_san === san.id) ||
                                (order.ten_san && (order.ten_san.includes(san.ten_san) || san.ten_san.includes(order.ten_san)));
                              if (!matchSan) return false;
                              return isTimeOverlapping(slot.start, slot.end,
                                (order.gio_bat_dau || '').substring(0, 5),
                                (order.gio_ket_thuc || '').substring(0, 5));
                            });
                            const isBooked = (slotData && slotData.trang_thai !== 'TRONG') || !!matchedSyncOrder;
                            const isLockedByOther = lockedSlots.includes(slotKeyRealtime) && !myLockedSlotIds.includes(slotKeyRealtime);
                            const isPast = isSlotInThePast(slot.start);

                            return (
                              <div key={`${san.id}_${slot.start}`} className="relative">
                                {isBooked ? (
                                  <div
                                    title={`Khung giờ ${slot.label} đã có người đặt (${slotData?.ten_khach_hang || matchedSyncOrder?.ten_khach_hang || 'Khách đặt'})`}
                                    className="w-full h-9 sm:h-10 px-2 sm:px-3 rounded-full border border-[#8d1e42]/60 bg-[#8d1e42]/25 text-rose-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-1 cursor-not-allowed select-none transition-all line-through opacity-75"
                                  >
                                    <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                    <span className="font-semibold tracking-wide">{slot.label}</span>
                                  </div>
                                ) : isPast ? (
                                  <div
                                    title={`Khung giờ ${slot.label} đã qua`}
                                    className={`w-full h-9 sm:h-10 px-2 sm:px-3 rounded-full flex items-center justify-center select-none cursor-not-allowed transition-all text-xs sm:text-sm font-semibold line-through ${
                                      isDarkMode
                                        ? 'border border-slate-800 bg-slate-900/40 text-slate-600 opacity-50'
                                        : 'border border-slate-200 bg-slate-100 text-slate-400 opacity-60'
                                    }`}
                                  >
                                    <span>{slot.label}</span>
                                  </div>
                                ) : isLockedByOther ? (
                                  <div
                                    title={`Khung giờ ${slot.label} (${slot.start}) của ${san.ten_san} đang được khách hàng khác chọn giữ chỗ`}
                                    onClick={() => {
                                      triggerToast({
                                        type: 'info',
                                        message: `Khung giờ ${slot.label} (${slot.start}) của ${san.ten_san} đang có khách hàng khác chọn giữ chỗ. Vui lòng chọn khung giờ khác!`,
                                      });
                                    }}
                                    className="w-full h-9 sm:h-10 px-2 sm:px-3 rounded-full bg-amber-500/95 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm cursor-not-allowed select-none transition-all"
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping shrink-0" />
                                    <span className="font-bold tracking-wide">{slot.label}</span>
                                  </div>
                                ) : cartCourts.some((c) => c.id === `${san.id}_${slot.start}_${filterNgayDa}`) ? (
                                  <button
                                    type="button"
                                    onClick={() => handleSlotClick(san, slot)}
                                    title={`Đã chọn ${san.ten_san} (${slot.label}). Bấm để bỏ chọn.`}
                                    className="w-full h-9 sm:h-10 px-2 sm:px-3 rounded-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/30 ring-2 ring-white hover:scale-[1.04] active:scale-95 transition-all duration-200 cursor-pointer select-none"
                                  >
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    <span className="font-black tracking-wide">{slot.label}</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleSlotClick(san, slot)}
                                    title={`Bấm để chọn khung giờ ${slot.label} (${slot.start})`}
                                    className="w-full h-9 sm:h-10 px-2 sm:px-3 rounded-full bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center shadow-md shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.04] active:scale-95 transition-all duration-200 cursor-pointer select-none group border border-blue-400/30"
                                  >
                                    <span className="font-bold tracking-wide group-hover:tracking-wider transition-all">
                                      {isMultiBookingMode ? `+ ${slot.label}` : slot.label}
                                    </span>
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* MODAL FOOTER */}
              <div className={`p-3 sm:p-4 border-t flex items-center justify-between gap-3 shrink-0 ${
                isDarkMode ? 'bg-slate-950/90 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                  <span>Nhấn vào ô màu xanh để chọn khung giờ và thời lượng thi đấu.</span>
                </div>
                <button
                  type="button"
                  onClick={handleCloseCategoryModal}
                  className={`px-5 py-2 rounded-2xl text-xs font-black border transition-all cursor-pointer shadow-xs active:scale-95 ${
                    isDarkMode
                      ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white'
                      : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100 shadow-xs'
                  }`}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            5. FOOTER & THÔNG TIN LIÊN HỆ DYNAMIC TỪ DATABASE
            ===================================================================== */}
        <Footer />
      </main>

      {/* =====================================================================
          FLOATING BAR: THANH GIỎ SÂN NỔI Ở ĐÁY MÀN HÌNH (MULTI-BOOKING)
          ===================================================================== */}
      {cartCourts.length > 0 && !isMultiBookingModalOpen && !selectedSlot && (
        <div className="fixed bottom-4 left-1/2 -translate-y-0 -translate-x-1/2 z-[400] w-[95%] max-w-4xl p-3 sm:p-4 rounded-3xl border shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-in slide-in-from-bottom duration-300 bg-slate-950/95 border-amber-500/60 text-white ring-1 ring-amber-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20 shrink-0">
              <ShoppingCart className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-black text-amber-300">
                  Đang chọn {cartCourts.length} sân thi đấu
                </p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Đơn nhiều sân
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Tổng tiền: <span className="font-mono font-black text-emerald-400 text-sm">{tongTienSanCart.toLocaleString('vi-VN')} đ</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleClearCart}
              className="px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
            >
              Xóa tất cả
            </button>
            <button
              type="button"
              onClick={() => {
                setBookingForm((p) => ({
                  ...p,
                  ho_ten: currentUser?.ho_ten || p.ho_ten || '',
                  so_dien_thoai: currentUser?.so_dien_thoai || p.so_dien_thoai || '',
                }));
                setIsMultiBookingModalOpen(true);
              }}
              className="px-5 py-2.5 rounded-2xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:brightness-110 shadow-lg shadow-emerald-500/30 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
            >
              <span>Xem Giỏ Sân & Đặt Ngay</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL XÁC NHẬN ĐẶT NHIỀU SÂN CÙNG LÚC (MULTI-BOOKING MODAL)
          ===================================================================== */}
      {isMultiBookingModalOpen && cartCourts.length > 0 && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className={`relative w-full max-w-4xl border rounded-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200 ${
            isDarkMode ? 'bg-slate-900 border-amber-600/50' : 'bg-white border-amber-400'
          }`}>
            {/* Header Modal */}
            <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${
              isDarkMode ? 'bg-slate-950/90 border-slate-800' : 'bg-amber-50/70 border-slate-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md">
                  <ShoppingCart className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h2 className={`text-base sm:text-lg font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Đặt Nhiều Sân Cùng Lúc ({cartCourts.length} sân)
                  </h2>
                  <p className="text-xs text-amber-500 font-bold">
                    Tất cả các sân sẽ được thanh toán trong 1 mã VietQR PayOS duy nhất
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMultiBookingModalOpen(false)}
                className="w-9 h-9 rounded-2xl border flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thân Modal */}
            <div className="p-4 sm:p-6 max-h-[75vh] overflow-y-auto space-y-6">
              {/* 1. Danh sách các sân */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                    1. Danh sách sân thi đấu ({cartCourts.length})
                  </h3>
                  <button
                    type="button"
                    onClick={handleClearCart}
                    className="text-xs font-bold text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa toàn bộ giỏ</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {cartCourts.map((item, idx) => (
                    <div
                      key={item.id}
                      className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isDarkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-400 font-black text-xs flex items-center justify-center shrink-0 border border-emerald-500/30">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                              {item.san.ten_san}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                              {item.san.ten_loai}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            📅 {item.ngay_da} • Giờ đá: <strong className="text-emerald-400 font-mono">{item.slot.start} - {item.gioKetThuc}</strong>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                        {/* Chọn thời lượng cho sân này */}
                        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                          {[30, 60, 90, 120].map((mins) => (
                            <button
                              key={mins}
                              type="button"
                              onClick={() => handleChangeCartCourtDuration(item.id, mins)}
                              className={`px-2 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                                item.durationMin === mins
                                  ? 'bg-emerald-500 text-slate-950 shadow-xs'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              {mins}p
                            </button>
                          ))}
                        </div>

                        {/* Đơn giá sân */}
                        <div className="text-right min-w-[90px]">
                          <span className="text-xs font-mono font-black text-emerald-400">
                            {item.giaTien.toLocaleString('vi-VN')} đ
                          </span>
                        </div>

                        {/* Nút xóa sân */}
                        <button
                          type="button"
                          onClick={() => handleRemoveCartCourt(item.id)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                          title="Xóa sân này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Dịch vụ kèm theo */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
                  2. Dịch vụ & Nước uống đi kèm
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {dichVuList.slice(0, 8).map((dv) => {
                    const qty = bookingForm.dich_vu_chon[dv.id] || 0;
                    return (
                      <div
                        key={dv.id}
                        className={`p-2.5 rounded-2xl border flex flex-col justify-between ${
                          qty > 0
                            ? 'border-emerald-500/60 bg-emerald-950/20'
                            : isDarkMode ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-bold truncate">{dv.ten_dich_vu}</p>
                          <p className="text-[11px] font-mono font-bold text-emerald-400">
                            {dv.don_gia.toLocaleString('vi-VN')} đ
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800">
                          <button
                            type="button"
                            onClick={() => {
                              if (qty > 0) {
                                setBookingForm((prev) => ({
                                  ...prev,
                                  dich_vu_chon: {
                                    ...prev.dich_vu_chon,
                                    [dv.id]: qty - 1,
                                  },
                                }));
                              }
                            }}
                            className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center font-black text-xs cursor-pointer"
                          >
                            -
                          </button>
                          <span className="font-mono text-xs font-black text-amber-400">{qty}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setBookingForm((prev) => ({
                                ...prev,
                                dich_vu_chon: {
                                  ...prev.dich_vu_chon,
                                  [dv.id]: qty + 1,
                                },
                              }));
                            }}
                            className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center font-black text-xs cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Thông tin người đặt */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
                  3. Thông tin người nhận sân
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      Họ và tên khách hàng <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={bookingForm.ho_ten}
                      onChange={(e) => setBookingForm((p) => ({ ...p, ho_ten: e.target.value }))}
                      placeholder="Nhập họ và tên..."
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold outline-none ${
                        isDarkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500' : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      Số điện thoại liên hệ <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={bookingForm.so_dien_thoai}
                      onChange={(e) => setBookingForm((p) => ({ ...p, so_dien_thoai: e.target.value }))}
                      placeholder="Nhập số điện thoại..."
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold outline-none ${
                        isDarkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500' : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
                      }`}
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Ghi chú cho ban quản lý
                  </label>
                  <input
                    type="text"
                    value={bookingForm.ghi_chu}
                    onChange={(e) => setBookingForm((p) => ({ ...p, ghi_chu: e.target.value }))}
                    placeholder="VD: Tổ chức giải đấu, cần chuẩn bị thêm áo bib..."
                    className={`w-full px-3.5 py-2 rounded-xl border text-xs font-bold outline-none ${
                      isDarkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500' : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
                    }`}
                  />
                </div>
              </div>

              {/* 4. Hình thức thanh toán */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
                  4. Lựa chọn hình thức thanh toán (PayOS VietQR)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setBookingForm((p) => ({ ...p, loai_thanh_toan: 'DAT_COC' }))}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      bookingForm.loai_thanh_toan === 'DAT_COC'
                        ? 'border-emerald-500 bg-emerald-950/30 ring-2 ring-emerald-400'
                        : isDarkMode ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-emerald-400">Đặt cọc 30% giữ chỗ</span>
                      <span className="text-xs font-mono font-black text-white">{tienCocCart.toLocaleString('vi-VN')} đ</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Thanh toán trước 30% tổng tiền để hệ thống khóa toàn bộ các sân cho bạn.
                    </p>
                  </div>

                  <div
                    onClick={() => setBookingForm((p) => ({ ...p, loai_thanh_toan: 'TRA_HET' }))}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      bookingForm.loai_thanh_toan === 'TRA_HET'
                        ? 'border-emerald-500 bg-emerald-950/30 ring-2 ring-emerald-400'
                        : isDarkMode ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-emerald-400">Thanh toán 100% toàn phần</span>
                      <span className="text-xs font-mono font-black text-white">{tongTienDonCart.toLocaleString('vi-VN')} đ</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Thanh toán toàn bộ tiền sân và dịch vụ qua VietQR MB Bank.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className={`p-4 sm:p-5 border-t flex flex-col sm:flex-row items-center justify-between gap-3 ${
              isDarkMode ? 'bg-slate-950/90 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <p className="text-xs text-slate-400">
                  Tổng {cartCourts.length} sân + dịch vụ: <strong className="font-mono text-emerald-400">{tongTienDonCart.toLocaleString('vi-VN')} đ</strong>
                </p>
                <p className="text-sm font-black text-white">
                  Cần thanh toán ngay:{' '}
                  <span className="font-mono text-emerald-400 text-base">
                    {(bookingForm.loai_thanh_toan === 'DAT_COC' ? tienCocCart : tongTienDonCart).toLocaleString('vi-VN')} đ
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsMultiBookingModalOpen(false)}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-700 hover:bg-slate-800 text-slate-300 transition-all cursor-pointer"
                >
                  Chọn thêm sân
                </button>
                <button
                  type="button"
                  disabled={isCreatingPayOS}
                  onClick={handleCreateMultiPayOSPayment}
                  className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                >
                  {isCreatingPayOS ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang tạo mã VietQR...</span>
                    </>
                  ) : (
                    <>
                      <QrCode className="w-4 h-4" />
                      <span>Tạo Mã VietQR Thanh Toán ({cartCourts.length} sân)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          6. MODAL ĐẶT SÂN TƯƠNG TÁC (GIAO TIẾP VỚI CSDL SQL SERVER)
          ===================================================================== */}
      {selectedSlot && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className={`relative w-full max-w-2xl border rounded-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200 ${isDarkMode ? 'bg-slate-900 border-emerald-700/50' : 'bg-white border-emerald-300'
            }`}>

            {/* Modal Header */}
            <div className={`p-6 border-b flex items-center justify-between ${isDarkMode ? 'bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border-slate-800' : 'bg-gradient-to-r from-emerald-100 via-white to-white border-slate-200'
              }`}>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-xs font-bold border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Xác Nhận Đặt Sân Trực Tuyến
                </div>
                <h3 className={`text-xl font-black mt-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {selectedSlot.san.ten_san}
                </h3>
              </div>
              <button
                onClick={handleCloseBookingModal}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${isDarkMode ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress Stepper Header */}
            <div className={`px-6 py-3 border-b flex items-center justify-between text-xs font-bold ${isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${bookingStep === 'DURATION'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/30'
                  : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold'
                  }`}>
                  1
                </span>
                <span className={bookingStep === 'DURATION' ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : isDarkMode ? 'text-slate-400' : 'text-slate-700 font-bold'}>
                  Chọn Giờ Kết Thúc
                </span>
              </div>

              <ArrowRight className={`w-3.5 h-3.5 ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`} />

              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${bookingStep === 'INFO'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/30'
                  : bookingStep === 'QR' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-700 font-bold'
                  }`}>
                  2
                </span>
                <span className={bookingStep === 'INFO' ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : isDarkMode ? 'text-slate-400' : 'text-slate-700 font-bold'}>
                  Thông Tin & Dịch Vụ
                </span>
              </div>

              <ArrowRight className={`w-3.5 h-3.5 ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`} />

              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${bookingStep === 'QR'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/30'
                  : isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-700 font-bold'
                  }`}>
                  3
                </span>
                <span className={bookingStep === 'QR' ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : isDarkMode ? 'text-slate-400' : 'text-slate-700 font-bold'}>
                  Thanh Toán VietQR
                </span>
              </div>
            </div>

            {/* Modal Body: BƯỚC 1 - CHỌN GIỜ KẾT THÚC (3 NÚT: 1 TIẾNG, 1 TIẾNG 30 PHÚT, 2 TIẾNG) */}
            {bookingStep === 'DURATION' && (
              <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                {/* Banner thông tin sân & giờ bắt đầu */}
                <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                  <div>
                    <div className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-700'}`}>Sân bóng & Ngày đá</div>
                    <div className={`text-base font-black mt-0.5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {selectedSlot.san.ten_san} <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-500">({selectedSlot.san.ten_loai || 'Sân bóng'})</span>
                    </div>
                    <div className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>Ngày đá: <span className={`font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>{formatDateVietnamese(filterNgayDa)}</span></div>
                  </div>

                  <div className={`sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                    <div className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-700'}`}>Giờ Bắt Đầu</div>
                    <div className="text-xl font-black text-emerald-600 dark:text-emerald-500 font-mono">
                      {selectedSlot.slot.label} ({selectedSlot.slot.start})
                    </div>
                    <div className={`text-[11px] font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      Đơn giá: {(Number(selectedSlot.san.don_gia_phut) || 5000).toLocaleString('vi-VN')} đ/phút
                    </div>
                  </div>
                </div>

                {/* Phần chọn 4 nút thời lượng */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      Chọn Giờ Kết Thúc / Thời Lượng Thuê
                    </h4>
                    <span className={`text-xs font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-700'}`}>Bấm chọn 1 trong 4 mức</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* NÚT 1: 30 PHÚT */}
                    {(() => {
                      const dur = 30;
                      const endTime = addMinutesToTime(selectedSlot.slot.start, dur);
                      const donGiaPhut = Number(selectedSlot.san.don_gia_phut) || 5000;
                      const price = dur * donGiaPhut;
                      const isConflict = checkConflictForSan(selectedSlot.san.id, selectedSlot.slot.start, dur);
                      const isSelected = selectedSlot.durationMin === dur;

                      return (
                        <button
                          type="button"
                          disabled={isConflict}
                          onClick={() => handleSelectDuration(dur)}
                          className={`p-4 rounded-2xl border text-left transition-all relative cursor-pointer ${isConflict
                            ? 'opacity-40 border-rose-800 bg-rose-950/20 cursor-not-allowed'
                            : isSelected
                              ? 'border-emerald-500 bg-emerald-500/15 ring-2 ring-emerald-500 shadow-lg shadow-emerald-500/20'
                              : isDarkMode
                                ? 'bg-slate-950/60 border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/60'
                                : 'bg-slate-50 border-slate-200 hover:border-emerald-500/50 hover:bg-slate-100'
                            }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-base font-black ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                              30 Phút
                            </span>
                            <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${isSelected ? 'bg-emerald-500 text-slate-950 font-black' : isDarkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-800'}`}>
                              30 phút
                            </span>
                          </div>

                          <div className={`text-xs mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
                            Giờ kết thúc: <span className={`font-bold font-mono ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>{endTime}</span>
                          </div>

                          <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-500 mt-2">
                            {price.toLocaleString('vi-VN')} đ
                          </div>

                          {isConflict && (
                            <div className="mt-2 text-[10px] font-bold text-rose-400 flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> Trùng lịch / Đang giữ chỗ
                            </div>
                          )}
                        </button>
                      );
                    })()}

                    {/* NÚT 2: 1 TIẾNG (60 PHÚT) */}
                    {(() => {
                      const dur = 60;
                      const endTime = addMinutesToTime(selectedSlot.slot.start, dur);
                      const donGiaPhut = Number(selectedSlot.san.don_gia_phut) || 5000;
                      const price = dur * donGiaPhut;
                      const isConflict = checkConflictForSan(selectedSlot.san.id, selectedSlot.slot.start, dur);
                      const isSelected = selectedSlot.durationMin === dur;

                      return (
                        <button
                          type="button"
                          disabled={isConflict}
                          onClick={() => handleSelectDuration(dur)}
                          className={`p-4 rounded-2xl border text-left transition-all relative cursor-pointer ${isConflict
                            ? 'opacity-40 border-rose-800 bg-rose-950/20 cursor-not-allowed'
                            : isSelected
                              ? 'border-emerald-500 bg-emerald-500/15 ring-2 ring-emerald-500 shadow-lg shadow-emerald-500/20'
                              : isDarkMode
                                ? 'bg-slate-950/60 border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/60'
                                : 'bg-slate-50 border-slate-200 hover:border-emerald-500/50 hover:bg-slate-100'
                            }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-base font-black ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                              1 Tiếng
                            </span>
                            <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${isSelected ? 'bg-emerald-500 text-slate-950 font-black' : isDarkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-800'}`}>
                              60 phút
                            </span>
                          </div>

                          <div className={`text-xs mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
                            Giờ kết thúc: <span className={`font-bold font-mono ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>{endTime}</span>
                          </div>

                          <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-500 mt-2">
                            {price.toLocaleString('vi-VN')} đ
                          </div>

                          {isConflict && (
                            <div className="mt-2 text-[10px] font-bold text-rose-400 flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> Trùng lịch / Đang giữ chỗ
                            </div>
                          )}
                        </button>
                      );
                    })()}

                    {/* NÚT 3: 1 TIẾNG 30 PHÚT (90 PHÚT) */}
                    {(() => {
                      const dur = 90;
                      const endTime = addMinutesToTime(selectedSlot.slot.start, dur);
                      const donGiaPhut = Number(selectedSlot.san.don_gia_phut) || 5000;
                      const price = dur * donGiaPhut;
                      const isConflict = checkConflictForSan(selectedSlot.san.id, selectedSlot.slot.start, dur);
                      const isSelected = selectedSlot.durationMin === dur;

                      return (
                        <button
                          type="button"
                          disabled={isConflict}
                          onClick={() => handleSelectDuration(dur)}
                          className={`p-4 rounded-2xl border text-left transition-all relative cursor-pointer ${isConflict
                            ? 'opacity-40 border-rose-800 bg-rose-950/20 cursor-not-allowed'
                            : isSelected
                              ? 'border-emerald-500 bg-emerald-500/15 ring-2 ring-emerald-500 shadow-lg shadow-emerald-500/20'
                              : isDarkMode
                                ? 'bg-slate-950/60 border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/60'
                                : 'bg-slate-50 border-slate-200 hover:border-emerald-500/50 hover:bg-slate-100'
                            }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-base font-black ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                              1 Tiếng 30 Phút
                            </span>
                            <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${isSelected ? 'bg-emerald-500 text-slate-950 font-black' : isDarkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-800'}`}>
                              90 phút
                            </span>
                          </div>

                          <div className={`text-xs mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
                            Giờ kết thúc: <span className={`font-bold font-mono ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>{endTime}</span>
                          </div>

                          <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-500 mt-2">
                            {price.toLocaleString('vi-VN')} đ
                          </div>

                          {isConflict && (
                            <div className="mt-2 text-[10px] font-bold text-rose-400 flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> Trùng lịch / Đang giữ chỗ
                            </div>
                          )}
                        </button>
                      );
                    })()}

                    {/* NÚT 4: 2 TIẾNG (120 PHÚT) */}
                    {(() => {
                      const dur = 120;
                      const endTime = addMinutesToTime(selectedSlot.slot.start, dur);
                      const donGiaPhut = Number(selectedSlot.san.don_gia_phut) || 5000;
                      const price = dur * donGiaPhut;
                      const isConflict = checkConflictForSan(selectedSlot.san.id, selectedSlot.slot.start, dur);
                      const isSelected = selectedSlot.durationMin === dur;

                      return (
                        <button
                          type="button"
                          disabled={isConflict}
                          onClick={() => handleSelectDuration(dur)}
                          className={`p-4 rounded-2xl border text-left transition-all relative cursor-pointer ${isConflict
                            ? 'opacity-40 border-rose-800 bg-rose-950/20 cursor-not-allowed'
                            : isSelected
                              ? 'border-emerald-500 bg-emerald-500/15 ring-2 ring-emerald-500 shadow-lg shadow-emerald-500/20'
                              : isDarkMode
                                ? 'bg-slate-950/60 border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/60'
                                : 'bg-slate-50 border-slate-200 hover:border-emerald-500/50 hover:bg-slate-100'
                            }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-base font-black ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                              2 Tiếng
                            </span>
                            <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${isSelected ? 'bg-emerald-500 text-slate-950 font-black' : isDarkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-800'}`}>
                              120 phút
                            </span>
                          </div>

                          <div className={`text-xs mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
                            Giờ kết thúc: <span className={`font-bold font-mono ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>{endTime}</span>
                          </div>

                          <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-500 mt-2">
                            {price.toLocaleString('vi-VN')} đ
                          </div>

                          {isConflict && (
                            <div className="mt-2 text-[10px] font-bold text-rose-400 flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> Trùng lịch / Đang giữ chỗ
                            </div>
                          )}
                        </button>
                      );
                    })()}
                  </div>
                </div>

                {/* Tóm tắt khung giờ đã chọn */}
                <div className={`p-4 rounded-2xl border space-y-2 text-xs ${isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className={`flex justify-between items-center ${isDarkMode ? 'text-slate-400' : 'text-slate-700 font-semibold'}`}>
                    <span>Khung giờ đá:</span>
                    <span className="font-black text-sm text-emerald-600 dark:text-emerald-400 font-mono">
                      {selectedSlot.slot.start} ➔ {selectedSlot.gioKetThuc}
                    </span>
                  </div>
                  <div className={`flex justify-between items-center ${isDarkMode ? 'text-slate-400' : 'text-slate-700 font-semibold'}`}>
                    <span>Thời lượng:</span>
                    <span className={`font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                      {selectedSlot.durationMin} phút ({selectedSlot.durationMin === 30 ? '30 phút' : selectedSlot.durationMin === 60 ? '1 tiếng' : selectedSlot.durationMin === 90 ? '1 tiếng 30 phút' : `${Math.floor(selectedSlot.durationMin / 60)} tiếng`})
                    </span>
                  </div>
                  <div className={`flex justify-between items-center pt-2 border-t text-sm font-bold ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                    <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>Tiền thuê sân:</span>
                    <span className="text-emerald-600 dark:text-emerald-500 text-base font-black">{selectedSlot.giaTien.toLocaleString('vi-VN')} đ</span>
                  </div>
                </div>

                {/* Nút Tiếp tục sang Bước 2 */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseBookingModal}
                    className={`w-1/3 py-3.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                      }`}
                  >
                    <X className="w-4 h-4" />
                    <span>Hủy</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleProceedToInfo}
                    className="w-2/3 py-3.5 rounded-xl font-black text-sm bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 text-slate-950 hover:from-emerald-400 hover:to-cyan-400 shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>TIẾP TỤC ➔ ĐIỀN THÔNG TIN</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Modal Body: BƯỚC 2 - ĐIỀN THÔNG TIN & CHỌN DỊCH VỤ */}
            {bookingStep === 'INFO' && (
              <form onSubmit={handleProceedToQR} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                {/* Tóm tắt thông tin khung giờ đã chọn ở Bước 1 */}
                <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl border text-xs ${isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                  <div>
                    <span className={`font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Ngày thi đấu:</span>
                    <div className={`font-bold text-sm mt-0.5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{formatDateVietnamese(filterNgayDa)}</div>
                  </div>
                  <div>
                    <span className={`font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Khung giờ ({selectedSlot.durationMin}p):</span>
                    <div className="font-black text-emerald-600 dark:text-emerald-500 text-sm mt-0.5 font-mono">
                      {selectedSlot.slot.start} - {selectedSlot.gioKetThuc}
                    </div>
                  </div>
                  <div>
                    <span className={`font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Tiền sân:</span>
                    <div className={`font-extrabold text-sm mt-0.5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {selectedSlot.giaTien.toLocaleString('vi-VN')} đ
                    </div>
                  </div>
                </div>

                {/* Thông tin người đặt */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <User className="w-4 h-4" />
                    Thông Tin Khách Hàng Đặt Sân
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className={`text-xs font-semibold block mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        Họ và Tên người đặt <span className="text-emerald-500 font-normal">(Đã khóa theo tài khoản)</span>
                      </label>
                      <input
                        type="text"
                        readOnly
                        disabled
                        value={bookingForm.ho_ten || currentUser?.ho_ten || ''}
                        className={`w-full px-4 py-2.5 rounded-xl text-sm font-semibold cursor-not-allowed select-none ${isDarkMode ? 'bg-slate-950/80 border border-slate-800 text-slate-300' : 'bg-slate-100 border border-slate-300 text-slate-700'
                          }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Danh sách dịch vụ đi kèm nạp từ CSDL SQL Server */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <Coffee className="w-4 h-4" />
                    Dịch Vụ Chọn Thêm Tại Sân (Từ CSDL SQL Server)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {dichVuList.map((dv) => {
                      const qty = bookingForm.dich_vu_chon[dv.id] || 0;
                      return (
                        <div
                          key={dv.id}
                          className={`p-3 rounded-2xl border flex items-center justify-between transition-colors ${qty > 0
                            ? isDarkMode ? 'bg-emerald-950/30 border-emerald-500/50' : 'bg-emerald-50 border-emerald-400'
                            : isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                            }`}
                        >
                          <div>
                            <div className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{dv.ten_dich_vu}</div>
                            <div className="text-[11px] text-emerald-600 dark:text-emerald-500 font-semibold">
                              {dv.don_gia.toLocaleString('vi-VN')} đ <span className={isDarkMode ? 'text-slate-400 font-normal' : 'text-slate-600 font-medium'}>/{dv.don_vi_tinh}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(dv.id, -1)}
                              disabled={qty === 0}
                              className={`w-7 h-7 rounded-lg border flex items-center justify-center font-bold text-xs disabled:opacity-30 cursor-pointer ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-200 border-slate-300 text-slate-900'
                                }`}
                            >
                              -
                            </button>
                            <span className="text-xs font-bold w-4 text-center">{qty}</span>
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(dv.id, 1)}
                              className={`w-7 h-7 rounded-lg border flex items-center justify-center font-bold text-xs cursor-pointer ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-200 border-slate-300 text-slate-900'
                                }`}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Chọn hình thức thanh toán */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4" />
                    Hình Thức Thanh Toán Cọc
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label
                      className={`p-4 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${bookingForm.loai_thanh_toan === 'DAT_COC'
                        ? isDarkMode ? 'bg-emerald-950/40 border-emerald-500' : 'bg-emerald-50 border-emerald-500 shadow-sm'
                        : isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <input
                            type="radio"
                            name="loai_thanh_toan"
                            value="DAT_COC"
                            checked={bookingForm.loai_thanh_toan === 'DAT_COC'}
                            onChange={() => setBookingForm({ ...bookingForm, loai_thanh_toan: 'DAT_COC' })}
                            className="text-emerald-500 focus:ring-emerald-500"
                          />
                          <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>Đặt Cọc 30%</span>
                        </div>
                        <p className={`text-[11px] mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>Giữ chỗ trước, thanh toán số còn lại khi đến sân</p>
                      </div>
                      <span className="text-sm font-black text-emerald-600 dark:text-emerald-500">
                        {Math.round(tongTienDon * 0.3).toLocaleString('vi-VN')} đ
                      </span>
                    </label>

                    <label
                      className={`p-4 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${bookingForm.loai_thanh_toan === 'TRA_HET'
                        ? isDarkMode ? 'bg-emerald-950/40 border-emerald-500' : 'bg-emerald-50 border-emerald-500 shadow-sm'
                        : isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <input
                            type="radio"
                            name="loai_thanh_toan"
                            value="TRA_HET"
                            checked={bookingForm.loai_thanh_toan === 'TRA_HET'}
                            onChange={() => setBookingForm({ ...bookingForm, loai_thanh_toan: 'TRA_HET' })}
                            className="text-emerald-500 focus:ring-emerald-500"
                          />
                          <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>Thanh Toán 100%</span>
                        </div>
                        <p className={`text-[11px] mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>Vào sân thi đấu ngay không cần trả thêm</p>
                      </div>
                      <span className="text-sm font-black text-emerald-600 dark:text-emerald-500">
                        {tongTienDon.toLocaleString('vi-VN')} đ
                      </span>
                    </label>
                  </div>
                </div>

                {/* Bảng tổng tiền */}
                <div className={`p-4 rounded-2xl border space-y-2 text-xs ${isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className={`flex justify-between ${isDarkMode ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
                    <span>Tiền thuê sân ({selectedSlot.durationMin} phút):</span>
                    <span className={`font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>{selectedSlot.giaTien.toLocaleString('vi-VN')} đ</span>
                  </div>
                  {tongTienDichVu > 0 && (
                    <div className={`flex justify-between ${isDarkMode ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
                      <span>Dịch vụ & Nước uống chọn thêm:</span>
                      <span className={`font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>{tongTienDichVu.toLocaleString('vi-VN')} đ</span>
                    </div>
                  )}
                  <div className={`flex justify-between pt-2 border-t text-sm font-bold ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                    <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>Tổng giá trị đơn:</span>
                    <span className="text-emerald-600 dark:text-emerald-500 text-base">{tongTienDon.toLocaleString('vi-VN')} đ</span>
                  </div>
                </div>

                {/* Nút bấm chuyển bước */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setBookingStep('DURATION')}
                    className={`w-1/3 py-3.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                      }`}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Quay lại</span>
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingPayOS}
                    className="w-2/3 py-3.5 rounded-xl font-black text-sm bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:from-emerald-400 hover:to-teal-300 shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isCreatingPayOS ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang Khởi Tạo VietQR PayOS...</span>
                      </>
                    ) : (
                      <>
                        <QrCode className="w-4 h-4" />
                        <span>TIẾP TỤC ➔ THANH TOÁN ({soTienThanhToan.toLocaleString('vi-VN')} đ)</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Modal Body: BƯỚC 3 - QUÉT MÃ QR VIETQR (KẾT NỐI NGÂN HÀNG MB BANK QUA PAYOS) */}
            {bookingStep === 'QR' && (
              <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                {isPaymentSuccess ? (
                  /* MÀN HÌNH CHÚC MỪNG KHI MB BANK XÁC NHẬN GIAO DỊCH THÀNH CÔNG */
                  <div className="py-6 text-center space-y-5 animate-in zoom-in-95 duration-300 relative">
                    {/* Nút X ở góc trên bên phải màn hình thành công */}
                    <button
                      type="button"
                      onClick={handleCloseSuccessModal}
                      className="absolute -top-2 right-0 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-700 shadow-lg"
                      title="Đóng cửa sổ ngay"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/40 flex items-center justify-center shadow-2xl shadow-emerald-500/30 animate-bounce">
                      <CheckCircle2 className="w-12 h-12" />
                    </div>

                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                        <Sparkles className="w-3.5 h-3.5" />
                        Giao Dịch MB Bank Thành Công
                      </div>
                      <h3 className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        🎉 THANH TOÁN ĐÃ ĐƯỢC XÁC NHẬN!
                      </h3>
                      <p className="text-sm text-emerald-400 font-semibold">
                        Hệ thống đã nhận được {soTienThanhToan.toLocaleString('vi-VN')} đ từ tài khoản MB Bank.
                      </p>
                    </div>

                    <div className={`p-4 rounded-2xl border text-xs max-w-md mx-auto space-y-2.5 text-left ${isDarkMode ? 'bg-slate-950/80 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}>
                      <div className={`flex justify-between items-center pb-2 border-b ${isDarkMode ? 'border-slate-800/60' : 'border-slate-200'}`}>
                        <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600 font-semibold'}>Mã đơn đặt sân:</span>
                        <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">#{payOSData?.ma_don_dat || selectedSlot?.san.id}</span>
                      </div>
                      <div className={`flex justify-between items-center pb-2 border-b ${isDarkMode ? 'border-slate-800/60' : 'border-slate-200'}`}>
                        <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600 font-semibold'}>Mã giao dịch PayOS:</span>
                        <span className={`font-mono font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>#{payOSData?.orderCode}</span>
                      </div>
                      <div className={`flex justify-between items-center pb-2 border-b ${isDarkMode ? 'border-slate-800/60' : 'border-slate-200'}`}>
                        <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600 font-semibold'}>Sân bóng & Khung giờ:</span>
                        <span className={`font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>{selectedSlot?.san.ten_san} ({selectedSlot?.slot.start} - {selectedSlot?.gioKetThuc})</span>
                      </div>
                      <div className={`flex justify-between items-center pb-2 border-b ${isDarkMode ? 'border-slate-800/60' : 'border-slate-200'}`}>
                        <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600 font-semibold'}>Khách hàng:</span>
                        <span className={`font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>{bookingForm.ho_ten} ({bookingForm.so_dien_thoai})</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600 font-semibold'}>Số tiền thanh toán:</span>
                        <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-base">{soTienThanhToan.toLocaleString('vi-VN')} đ</span>
                      </div>
                    </div>

                    {/* Đếm ngược và các nút hành động */}
                    <div className="space-y-3 max-w-md mx-auto pt-2">
                      <div className={`text-xs flex items-center justify-center gap-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600 font-semibold'}`}>
                        <Clock className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Tự động đóng sau <strong className="text-emerald-400 font-mono text-sm">{successCountdown}s</strong></span>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            handleCloseSuccessModal();
                            router.push('/history');
                          }}
                          className={`w-1/2 py-3 rounded-xl font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                            }`}
                        >
                          <History className="w-4 h-4 text-emerald-400" />
                          <span>Xem Lịch Sử</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleCloseSuccessModal}
                          className="w-1/2 py-3 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:from-emerald-400 hover:to-teal-300 shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>Đóng Ngay (X)</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* MÀN HÌNH QUÉT MÃ VIETQR & THÔNG TIN CHUYỂN KHOẢN MB BANK */
                  <div className="space-y-5">
                    {/* Header thông báo trạng thái kết nối MB Bank */}
                    <div className="text-center space-y-1.5">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/30">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        <span>Sport247 VietQR • Tự Động Duyệt 3-5 Giây</span>
                      </div>
                      <h3 className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        Quét Mã QR MB Bank Để Thanh Toán
                      </h3>
                      <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        Mở App Ngân hàng bất kỳ (MB Bank, Vietcombank, Momo, Techcombank...) để quét mã
                      </p>
                    </div>

                    {/* Khối Mã QR VietQR chất lượng cao */}
                    <div className="flex flex-col items-center justify-center">
                      <div className="p-3.5 bg-white rounded-3xl border-2 border-emerald-500/40 shadow-2xl shadow-emerald-500/10 inline-block relative group">
                        <img
                          src={`https://img.vietqr.io/image/${payOSData?.bin || '970422'}-${payOSData?.accountNumber || 'VQRQAMKSW8778'}-compact2.png?amount=${payOSData?.amount || soTienThanhToan}&addInfo=${encodeURIComponent(payOSData?.description || 'DatSan')}&accountName=${encodeURIComponent(payOSData?.accountName || 'CAO VAN HOT XOAN')}`}
                          alt="Mã QR VietQR MB Bank"
                          className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-xl"
                        />
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/50 whitespace-nowrap shadow-md">
                          MB Bank • CAO VAN HOT XOAN
                        </div>
                      </div>
                    </div>


                    {/* Bảng thông tin chi tiết chuyển khoản có nút Sao Chép */}
                    <div className={`p-4 sm:p-5 rounded-2xl border space-y-2.5 text-xs sm:text-sm ${isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}>
                      <div className={`flex items-center justify-between pb-2 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                        <span className={`flex items-center gap-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-700 font-bold'}`}>
                          <Building2 className="w-4 h-4 text-emerald-500" /> Ngân hàng:
                        </span>
                        <span className={`font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                          MB Bank (Ngân hàng TMCP Quân Đội)
                        </span>
                      </div>

                      <div className={`flex items-center justify-between pb-2 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                        <span className={`flex items-center gap-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-700 font-bold'}`}>
                          <User className="w-4 h-4 text-emerald-500" /> Chủ tài khoản:
                        </span>
                        <span className={`font-black tracking-wide ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                          {payOSData?.accountName || 'CAO VAN HOT XOAN'}
                        </span>
                      </div>

                      <div className={`flex items-center justify-between pb-2 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                        <span className={isDarkMode ? 'text-slate-400' : 'text-slate-700 font-bold'}>Số tài khoản:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-emerald-600 dark:text-emerald-500 text-sm sm:text-base tracking-wider">
                            {payOSData?.accountNumber || 'VQRQAMKSW8778'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyText(payOSData?.accountNumber || 'VQRQAMKSW8778', 'Số tài khoản')}
                            className={`p-1 rounded transition-colors cursor-pointer ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
                            title="Sao chép số tài khoản"
                          >
                            {copiedField === 'Số tài khoản' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className={`flex items-center justify-between pb-2 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                        <span className={isDarkMode ? 'text-slate-400' : 'text-slate-700 font-bold'}>Số tiền cần chuyển:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-500">
                            {(payOSData?.amount || soTienThanhToan).toLocaleString('vi-VN')} đ
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyText(String(payOSData?.amount || soTienThanhToan), 'Số tiền')}
                            className={`p-1 rounded transition-colors cursor-pointer ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
                            title="Sao chép số tiền"
                          >
                            {copiedField === 'Số tiền' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className={isDarkMode ? 'text-slate-400' : 'text-slate-700 font-bold'}>Nội dung chuyển khoản:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm sm:text-base font-black px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            {payOSData?.description || `DS${payOSData?.orderCode || ''}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyText(payOSData?.description || `DS${payOSData?.orderCode || ''}`, 'Nội dung')}
                            className={`p-1 rounded transition-colors cursor-pointer ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
                            title="Sao chép nội dung chuyển khoản"
                          >
                            {copiedField === 'Nội dung' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* THÔNG BÁO NỔI BẬT KHI CHƯA NHẬN ĐƯỢC TIỀN HOẶC ĐANG KIỂM TRA (TỰ MẤT SAU 6 GIÂY) */}
                    {qrModalAlert && (
                      <div
                        className={`relative overflow-hidden p-4 rounded-2xl border flex items-start gap-3.5 shadow-xl animate-in zoom-in-95 duration-200 ${qrModalAlert.type === 'error'
                            ? 'bg-gradient-to-br from-rose-950/95 via-rose-900/85 to-slate-950/95 border-rose-500/80 text-rose-100 shadow-rose-950/50 ring-1 ring-rose-500/40'
                            : qrModalAlert.type === 'info'
                              ? 'bg-gradient-to-br from-sky-950/95 via-sky-900/85 to-slate-950/95 border-sky-500/80 text-sky-100 shadow-sky-950/50 ring-1 ring-sky-500/40'
                              : 'bg-gradient-to-br from-amber-950/95 via-amber-900/85 to-slate-950/95 border-amber-500/80 text-amber-100 shadow-amber-950/50 ring-1 ring-amber-500/40'
                          }`}
                      >
                        <div className="shrink-0 mt-0.5">
                          {qrModalAlert.type === 'error' ? (
                            <div className="w-10 h-10 rounded-xl bg-rose-500/30 border border-rose-400/60 flex items-center justify-center text-rose-300 shadow-inner">
                              <XCircle className="w-5 h-5 animate-pulse text-rose-400" />
                            </div>
                          ) : qrModalAlert.type === 'info' ? (
                            <div className="w-10 h-10 rounded-xl bg-sky-500/30 border border-sky-400/60 flex items-center justify-center text-sky-300 shadow-inner">
                              <Loader2 className="w-5 h-5 animate-spin text-sky-400" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-amber-500/30 border border-amber-400/60 flex items-center justify-center text-amber-300 shadow-inner">
                              <AlertCircle className="w-5 h-5 text-amber-400" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 space-y-1 pr-1">
                          <h4 className="text-sm font-black tracking-wide text-white flex items-center gap-1.5">
                            {qrModalAlert.title}
                          </h4>
                          <p className="text-xs font-medium leading-relaxed opacity-95 text-slate-200">
                            {qrModalAlert.message}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setQrModalAlert(null)}
                          className="p-1 rounded-lg hover:bg-white/15 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
                          title="Đóng thông báo ngay"
                        >
                          <X className="w-4 h-4" />
                        </button>

                        {/* Thanh thời gian thu hồi thông báo 6 giây */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 overflow-hidden">
                          <div
                            className={`h-full ${qrModalAlert.type === 'error'
                                ? 'bg-rose-400'
                                : qrModalAlert.type === 'info'
                                  ? 'bg-sky-400'
                                  : 'bg-amber-400'
                              }`}
                            style={{
                              animation: 'shrinkWidth 6s linear forwards',
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Lưu ý quan trọng */}
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-500 dark:text-amber-400 flex items-start gap-2">
                      <Info className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>
                        <strong>Lưu ý:</strong> Vui lòng điền <strong>chính xác nội dung chuyển khoản</strong> để Sport247 tự động kích hoạt lịch sân của bạn ngay lập tức mà không cần xác nhận thủ công.
                      </span>
                    </div>

                    {/* Các nút hành động */}
                    <div className="pt-2">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            if (payOSData?.ma_don_dat || payOSData?.orderCode) {
                              fetch(`${API_BASE_URL}/thanh-toan/payos/huy-don-tam`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  ma_don_dat: payOSData.ma_don_dat,
                                  orderCode: payOSData.orderCode,
                                }),
                              }).catch((e) => console.warn('Lỗi hủy đơn tạm:', e));
                            }
                            setPayOSData(null);
                            setQrModalAlert(null);
                            setBookingStep('INFO');
                          }}
                          className={`w-1/3 py-3.5 rounded-xl font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                            }`}
                        >
                          <ArrowLeft className="w-4 h-4" />
                          <span>Quay lại</span>
                        </button>
                        <button
                          type="button"
                          disabled={isCheckingPayOS}
                          onClick={() => {
                            if (payOSData?.orderCode) {
                              checkPayOSStatus(payOSData.orderCode, true);
                            } else {
                              handleConfirmPayment();
                            }
                          }}
                          className="w-2/3 py-3.5 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:from-emerald-400 hover:to-teal-300 shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                        >
                          {isCheckingPayOS ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Đang Kiểm Tra MB Bank...</span>
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-4 h-4" />
                              <span>Tôi Đã Chuyển Tiền • Kiểm Tra Ngay</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            )}


          </div>
        </div>
      )}

      {/* MODAL PROFILE THÔNG TIN CÁ NHÂN */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200 my-4">
            <Profile
              onClose={() => setIsProfileModalOpen(false)}
              onLogout={handleLogout}
              initialData={{
                hoTen: currentUser?.ho_ten || '',
                email: currentUser?.email || '',
                soDienThoai: currentUser?.so_dien_thoai || '',
                diaChi: 'Hà Nội',
                avatarUrl: currentUser?.anh_dai_dien,
              }}
            />
          </div>
        </div>
      )}

      {/* MODAL ĐĂNG NHẬP / ĐĂNG KÝ ROOT LEVEL */}
      <Login
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        initialRegister={loginInitialRegister}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setIsLoginModalOpen(false);
          const role = (user.vai_tro || '').toUpperCase();
          if (role === 'ADMIN') {
            triggerToast({
              type: 'success',
              message: `🎉 Đăng nhập Admin thành công! Chào mừng Quản trị viên ${user.ho_ten || user.email}.`,
            });
            if (router.query.requireAdmin === 'true') {
              router.push('/Dashboard');
            }
          } else {
            triggerToast({
              type: 'success',
              message: `🎉 Đăng nhập thành công! Chào mừng ${user.ho_ten || user.email}.`,
            });
          }
        }}
      />

    </div>
  );
}
