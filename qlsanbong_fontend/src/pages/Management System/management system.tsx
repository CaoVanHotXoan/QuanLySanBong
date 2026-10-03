import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { io, Socket } from 'socket.io-client';
import {
  List,
  LayoutGrid,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Settings,
  Home,
  Receipt,
  Book,
  LandPlot,
  Shirt,
  LogIn,
  LogOut,
  X,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ShieldAlert,
  CalendarCheck,
  User as UserIcon,
  ArrowRight,
  Search,
  Filter,
  Users,
  Activity,
  Sparkles,
  TrendingUp,
  CircleDot,
  RefreshCw,
  AlertCircle,
  XCircle,
  Zap,
  Phone,
  SlidersHorizontal,
  DollarSign,
  Globe,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  User,
  Save,
  CreditCard,
  PlusCircle,
  FileText,
  Check,
  Bell,
  QrCode,
  Copy,
  Banknote,
  Smartphone,
  ArrowRightLeft,
  AlertTriangle,
} from 'lucide-react';
import Login, { AuthUser } from '../Login/login';
import { useBookingSync } from '../../hooks/useBookingSync';

// =====================================================================
// 1. INTERFACES & API CONFIG (ĐỒNG BỘ CSDL SQL SERVER & REALTIME)
// =====================================================================

interface LoaiSan {
  id: number;
  ten_loai: string;
  mo_ta: string;
  trang_thai?: boolean;
}

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

type TrangThaiSlot = 'TRONG' | 'CHO_XAC_NHAN' | 'DA_CHOT';

interface SlotLichSan {
  ma_san: number;
  gio_bat_dau: string; // VD: '06:00'
  gio_ket_thuc: string; // VD: '06:30'
  trang_thai: TrangThaiSlot;
  ma_don_dat?: number;
  ten_khach_hang?: string;
  so_dien_thoai?: string;
  gio_bat_dau_don?: string;
  gio_ket_thuc_don?: string;
  gia_ap_dung: number;
}

interface KhungGioItem {
  start: string;
  end: string;
  label: string;
}

// POS Interfaces
export interface SelectedSlotItem {
  id: string; // VD: 'pitch_1_06:00'
  ten_san: string;
  gio_da: string;
  gia_tien: number;
}

export interface SelectedPitchOrder {
  pitch: SanBong;
  startTime: string;
  endTime: string;
  durationMin: number;
  price: number;
}

export interface SelectedServiceItem {
  id: number;
  ten_dich_vu: string;
  so_luong: number;
  don_gia: number;
  don_vi: string;
}

export interface ServiceItemOrder {
  id: number;
  ten_dich_vu: string;
  so_luong: number;
  don_gia: number;
  thanh_tien: number;
}

export interface DonDatSanPOS {
  id: number | string;
  ma_don_dat: string; // VD: 'HD-2026-001'
  ten_khach_hang: string;
  so_dien_thoai: string;
  ten_san: string;
  ma_san?: number;
  gio_bat_dau: string;
  gio_ket_thuc: string;
  ngay_da: string;
  tien_san: number;
  dich_vu: ServiceItemOrder[];
  tong_tien: number;
  so_tien_da_tra?: number;
  trang_thai: 'Chờ thanh toán' | 'Đã thanh toán' | 'Đã hủy' | string;
  trang_thai_vao_san?: string;
  da_vao_san?: boolean;
  gio_vao_san?: string;
  ngay_tao: string;
}

export interface POSNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  amount?: number;
  type: 'payment' | 'booking';
}

// Danh sách khung giờ chuẩn từ 06:00 đến 19:30 (chuẩn CSDL)
const DEFAULT_TIME_SLOTS: KhungGioItem[] = [];
for (let h = 6; h <= 18; h++) {
  DEFAULT_TIME_SLOTS.push({
    start: `${String(h).padStart(2, '0')}:00`,
    end: `${String(h).padStart(2, '0')}:30`,
    label: `${h}h`,
  });
  const nextH = h + 1;
  DEFAULT_TIME_SLOTS.push({
    start: `${String(h).padStart(2, '0')}:30`,
    end: `${String(nextH).padStart(2, '0')}:00`,
    label: `${h}h30`,
  });
}
DEFAULT_TIME_SLOTS.push({
  start: '19:00',
  end: '19:30',
  label: '19h',
});

export interface DichVuCSDL {
  id: number;
  ten_dich_vu: string;
  don_gia: number;
  don_vi_tinh?: string;
  ton_kho?: number;
  hinh_anh?: string;
}

// Cấu hình URL Backend & Socket.IO
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:5000');

function isTimeOverlapping(startA: string, endA: string, startB: string, endB: string): boolean {
  return startA < endB && endA > startB;
}

function formatDateToISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Helper kiểm tra đơn đặt/hóa đơn đã qua ngày hoặc qua thời gian kết thúc chưa
function isBookingExpired(item: any): boolean {
  if (!item) return false;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  const currentDay = String(now.getDate()).padStart(2, '0');
  const todayISO = `${currentYear}-${currentMonth}-${currentDay}`;

  const bDate = item.ngay_da ? String(item.ngay_da).substring(0, 10) : todayISO;

  // 1. Nếu ngày đá trước hôm nay -> Đã qua ngày
  if (bDate < todayISO) {
    return true;
  }

  // 2. Nếu ngày đá sau hôm nay -> Vẫn còn hạn trong tương lai
  if (bDate > todayISO) {
    return false;
  }

  // 3. Nếu ngày đá là hôm nay -> So sánh mốc giờ kết thúc
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const timeEnd = (item.gio_ket_thuc || item.gio_bat_dau || '').substring(0, 5);
  if (!timeEnd) return false;

  const [hStr, mStr] = timeEnd.split(':');
  const endMinutes = parseInt(hStr, 10) * 60 + parseInt(mStr || '0', 10);

  return endMinutes <= currentMinutes;
}

// Âm thanh thông báo khi có giao dịch chuyển khoản thành công
function playNotificationChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();
    const now = audioCtx.currentTime;

    // Nốt thứ 1 (Tone cao 1)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Nốt thứ 2 (Tone cao 2 - Ting!)
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.12); // A5
    gain2.gain.setValueAtTime(0.25, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.6);
  } catch (e) {
    console.warn('Audio notification unavailable:', e);
  }
}

export default function ManagementSystem() {
  const router = useRouter();

  // -------------------------------------------------------------
  // STATE GIAO DIỆN & THEME CŨ
  // -------------------------------------------------------------
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('home');
  const [calendarViewDate, setCalendarViewDate] = useState<Date>(() => new Date());

  // -------------------------------------------------------------
  // STATE DỮ LIỆU SÂN BÓNG & LỊCH ĐẶT SÂN TỪ SQL SERVER CŨ
  // -------------------------------------------------------------
  const [sanBongList, setSanBongList] = useState<SanBong[]>([]);
  const [loaiSanList, setLoaiSanList] = useState<LoaiSan[]>([]);
  const [dichVuList, setDichVuList] = useState<DichVuCSDL[]>([]);
  const [timeSlotsList, setTimeSlotsList] = useState<KhungGioItem[]>(DEFAULT_TIME_SLOTS);
  const [gridSlots, setGridSlots] = useState<Record<string, SlotLichSan>>({});
  const [lockedSlots, setLockedSlots] = useState<string[]>([]);
  const [rawBookings, setRawBookings] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Bộ lọc lịch đặt sân cũ
  const [filterLoaiSan, setFilterLoaiSan] = useState<string>('ALL');
  const [filterSanId, setFilterSanId] = useState<string>('ALL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // -------------------------------------------------------------
  // STATE LỊCH SỬ (TAB HISTORY) CŨ
  // -------------------------------------------------------------
  const [historyBookings, setHistoryBookings] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [historyFilterStatus, setHistoryFilterStatus] = useState<string>('ALL');
  const [historySearchKeyword, setHistorySearchKeyword] = useState<string>('');
  const [historyFilterDate, setHistoryFilterDate] = useState<string>('');

  // Modal Chi Tiết Slot Đặt Sân Cũ
  const [selectedSlotDetail, setSelectedSlotDetail] = useState<{
    san: SanBong;
    slot: KhungGioItem;
    slotData?: SlotLichSan;
  } | null>(null);

  // -------------------------------------------------------------
  // STATE XÁC THỰC & PHÂN QUYỀN (RBAC) CŨ
  // -------------------------------------------------------------
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);

  // -------------------------------------------------------------
  // STATE POS GIỎ HÀNG & HÓA ĐƠN MỚI
  // -------------------------------------------------------------
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlotItem[]>([]);
  const [selectedPitches, setSelectedPitches] = useState<SelectedPitchOrder[]>([]);
  const [selectedServices, setSelectedServices] = useState<SelectedServiceItem[]>([]);
  const [playingViewMode, setPlayingViewMode] = useState<'list' | 'grid'>('list');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  
  // State tìm kiếm khách hàng theo Tên / Số điện thoại ở Header
  const [userList, setUserList] = useState<Array<{
    id: number;
    ho_ten: string;
    so_dien_thoai?: string;
    email?: string;
    vai_tro?: string;
  }>>([]);
  const [customerSearchQuery, setCustomerSearchQuery] = useState<string>('');
  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState<boolean>(false);
  const [customerSearchAlert, setCustomerSearchAlert] = useState<string | null>(null);

  // State quản lý Modal Lịch Sử Đặt Sân của Khách Hàng khi tìm kiếm & chọn
  const [selectedCustomerForHistory, setSelectedCustomerForHistory] = useState<{
    id?: number;
    ho_ten: string;
    so_dien_thoai: string;
    email?: string;
    vai_tro?: string;
    source?: string;
  } | null>(null);
  const [isCustomerHistoryModalOpen, setIsCustomerHistoryModalOpen] = useState<boolean>(false);

  // State theo dõi đơn đặt sân đã nạp vào POS (trạng thái thanh toán, dịch vụ gốc)
  const [loadedBookingState, setLoadedBookingState] = useState<{
    id: string | number;
    ma_don_dat?: string;
    trang_thai: string;
    isPaid: boolean;
    initialServices: SelectedServiceItem[];
    ten_san?: string;
    gio_da?: string;
    ngay_da?: string;
    so_tien_da_tra?: number;
    tong_tien?: number;
  } | null>(null);

  // State Khung Giờ Đá Tùy Chọn Bất Kì & Hình Thức Thanh Toán
  const [customStartTime, setCustomStartTime] = useState<string>('17:00');
  const [customEndTime, setCustomEndTime] = useState<string>('18:30');
  const [isCustomTimeActive, setIsCustomTimeActive] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'TIEN_MAT' | 'CHUYEN_KHOAN'>('TIEN_MAT');

  // State Modal VietQR Cố Định / Động
  const [isVietQRModalOpen, setIsVietQRModalOpen] = useState<boolean>(false);

  // State Chuông Thông Báo (Bell notifications - Tiền vào / Đặt sân)
  const [notifications, setNotifications] = useState<POSNotification[]>([
    {
      id: 'init-1',
      title: 'Hệ thống sẵn sàng',
      message: 'Hệ thống POS & Quản lý đã kết nối CSDL và Real-time Socket.',
      time: 'Vừa xong',
      isRead: false,
      type: 'payment',
    },
  ]);
  const [isNotificationOpen, setIsNotificationOpen] = useState<boolean>(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Bộ lọc phương thức thanh toán trong Tab Hóa đơn & Lịch sử
  const [historyFilterPaymentMethod, setHistoryFilterPaymentMethod] = useState<string>('ALL');
  const [invoicesFilterPaymentMethod, setInvoicesFilterPaymentMethod] = useState<string>('ALL');

  // Đếm số thông báo chưa đọc
  const unreadNotificationCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  // Hook đồng bộ Real-time giả lập (localStorage & Window Storage Event)
  const {
    orders: syncOrders,
    addOrder: addSyncOrder,
    updateOrderStatus: updateSyncOrderStatus,
  } = useBookingSync();

  // State lưu ID hóa đơn đang được chỉnh sửa thêm dịch vụ
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | number | null>(null);
  const [selectedInvoiceDetail, setSelectedInvoiceDetail] = useState<DonDatSanPOS | null>(null);
  // State lưu đơn hàng lịch sử đang xem chi tiết (Modal Read-only)
  const [selectedHistoryOrder, setSelectedHistoryOrder] = useState<any | null>(null);

  // State Gia hạn thời gian sân đang đá & Chuyển sân đá tiếp (Đá thêm giờ)
  const [isExtendingModalOpen, setIsExtendingModalOpen] = useState<boolean>(false);
  const [extendingBooking, setExtendingBooking] = useState<any | null>(null);
  const [extendMinutes, setExtendMinutes] = useState<number>(30);
  const [extendCheckResult, setExtendCheckResult] = useState<any | null>(null);
  const [isCheckingExtend, setIsCheckingExtend] = useState<boolean>(false);
  const [selectedAlternativePitch, setSelectedAlternativePitch] = useState<any | null>(null);
  const [extendPayNow, setExtendPayNow] = useState<boolean>(false);
  const [extendPaymentMethod, setExtendPaymentMethod] = useState<'TIEN_MAT' | 'CHUYEN_KHOAN'>('TIEN_MAT');

  // State thông báo Toast nổi trên màn hình
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error' | 'info' | 'warning';
    title?: string;
    message: string;
  } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success', title?: string) => {
    setToastMessage({ type, message, title });
  }, []);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Refs
  const socketRef = useRef<Socket | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const customerSearchRef = useRef<HTMLDivElement>(null);

  const formattedDateISO = useMemo(() => formatDateToISO(currentDate), [currentDate]);

  // Kiểm tra quyền Admin / Nhân viên cũ
  const checkIsAuthorizedRole = (user?: AuthUser | string | null): boolean => {
    if (!user) return true; // Cho phép mở giao diện POS nếu chưa đăng nhập để thao tác bán hàng
    const role = typeof user === 'string' 
      ? user.trim().toUpperCase().replace(/\s+/g, '_')
      : (user.vai_tro || '').trim().toUpperCase().replace(/\s+/g, '_');
    const email = typeof user === 'string' ? '' : (user.email || '').trim().toLowerCase();
    return (
      role === 'ADMIN' ||
      role === 'NHAN_VIEN' ||
      role === 'NHANVIEN' ||
      role === 'QUAN_TRI_VIEN' ||
      role.includes('ADMIN') ||
      role.includes('NHÂN VIÊN') ||
      role.includes('NHAN VIEN') ||
      role.includes('QUẢN TRỊ') ||
      email === 'admin@gmail.com' ||
      email.startsWith('admin')
    );
  };

  // Lấy vai trò hiển thị chuẩn và thân thiện
  const getDisplayRole = (user?: AuthUser | null): string => {
    if (!user) return 'Khách Hàng';
    const role = (user.vai_tro || '').trim().toUpperCase();
    const name = (user.ho_ten || '').toLowerCase();
    const email = (user.email || '').toLowerCase();

    if (
      role === 'ADMIN' ||
      role === 'QUAN_TRI_VIEN' ||
      role.includes('ADMIN') ||
      role.includes('QUẢN TRỊ') ||
      name.includes('quản trị') ||
      email.startsWith('admin')
    ) {
      return 'Quản Trị Viên';
    }
    if (
      role === 'NHAN_VIEN' ||
      role === 'NHANVIEN' ||
      role.includes('NHÂN VIÊN') ||
      role.includes('NHAN VIEN') ||
      name.includes('nhân viên')
    ) {
      return 'Nhân Viên';
    }
    return 'Khách Hàng';
  };

  // Nạp thông tin đăng nhập từ localStorage & tự động đồng bộ vai trò
  const loadUserFromStorage = () => {
    try {
      if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('auth_user');
        if (storedUser) {
          const parsedUser: AuthUser = JSON.parse(storedUser);
          // Tự động sửa vai trò nếu là Quản trị viên
          const name = (parsedUser.ho_ten || '').toLowerCase();
          const email = (parsedUser.email || '').toLowerCase();
          if (name.includes('quản trị') || email.startsWith('admin') || email === 'admin@gmail.com') {
            parsedUser.vai_tro = 'ADMIN';
            localStorage.setItem('auth_user', JSON.stringify(parsedUser));
          }
          setCurrentUser(parsedUser);
        } else {
          setCurrentUser(null);
        }
      }
    } catch (error) {
      console.error('Lỗi khi đọc thông tin xác thực:', error);
      setCurrentUser(null);
    } finally {
      setIsAuthChecking(false);
    }
  };

  useEffect(() => {
    loadUserFromStorage();
  }, []);

  // Xử lý click ngoài dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
      if (customerSearchRef.current && !customerSearchRef.current.contains(event.target as Node)) {
        setIsCustomerSearchOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setCalendarViewDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
  }, [currentDate]);

  // Format ngày tiếng Việt: "Thứ Năm, 01/10/2026"
  const formatVietnameseDate = (date: Date): string => {
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dayOfWeek = days[date.getDay()];
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${dayOfWeek}, ${day}/${month}/${year}`;
  };

  // Điều hướng ngày
  const handlePrevDay = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 1);
      return newDate;
    });
  };

  const handleNextDay = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + 1);
      return newDate;
    });
  };

  // -------------------------------------------------------------
  // API FETCH DỮ LIỆU CSDL SQL SERVER
  // -------------------------------------------------------------
  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/users`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setUserList(data.data);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách người dùng:', err);
    }
  };

  const fetchLoaiSan = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/dat-san/loai-san`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setLoaiSanList(data.data);
      }
    } catch (err) {
      console.error('Lỗi tải loại sân:', err);
    }
  };

  const fetchSanBong = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/dat-san/danh-sach-san`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setSanBongList(data.data);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách sân từ SQL Server:', err);
    }
  };

  const fetchDichVu = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/dich-vu`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setDichVuList(data.data);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách dịch vụ từ SQL Server:', err);
    }
  };

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
      console.error('Lỗi tải khung giờ:', err);
    }
  };

  // Tải tất cả đơn đặt sân (tab Lịch sử) từ backend
  const fetchHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`${API_BASE_URL}/dat-san/tat-ca-don`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setHistoryBookings(data.data);
      }
    } catch (err) {
      console.error('Lỗi tải lịch sử đặt sân:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  // Tổng hợp danh sách khách hàng từ Bảng Nguoi_Dung & Lịch sử Đơn Đặt Sân CSDL
  const allKnownCustomers = useMemo(() => {
    const map = new Map<string, { id?: number; ho_ten: string; so_dien_thoai: string; email?: string; vai_tro?: string; source: string }>();

    // 1. Thêm từ CSDL Nguoi_Dung
    userList.forEach((u) => {
      if (u.ho_ten || u.so_dien_thoai) {
        const key = (u.so_dien_thoai || u.ho_ten || '').trim().toLowerCase();
        if (key) {
          map.set(key, {
            id: u.id,
            ho_ten: u.ho_ten || 'Khách hàng',
            so_dien_thoai: u.so_dien_thoai || '',
            email: u.email,
            vai_tro: u.vai_tro || 'Khách hàng',
            source: 'Tài khoản CSDL',
          });
        }
      }
    });

    // 2. Thêm từ Lịch sử Đơn Đặt Sân POS & CSDL
    const combinedBookings = [...rawBookings, ...historyBookings];
    combinedBookings.forEach((b: any) => {
      const ten = b.ten_khach_hang;
      const sdt = b.so_dien_thoai;
      if (ten || sdt) {
        const key = (sdt || ten || '').trim().toLowerCase();
        if (key && !map.has(key)) {
          map.set(key, {
            ho_ten: ten || 'Khách vãng lai',
            so_dien_thoai: sdt || '',
            vai_tro: 'Khách đặt sân',
            source: 'Đơn đặt trước',
          });
        }
      }
    });

    return Array.from(map.values());
  }, [userList, rawBookings, historyBookings]);

  // Bộ lọc kết quả tìm kiếm khách hàng
  const filteredCustomers = useMemo(() => {
    const q = customerSearchQuery.trim().toLowerCase();
    if (!q) {
      return allKnownCustomers.slice(0, 6);
    }
    return allKnownCustomers.filter((c) => {
      const matchName = c.ho_ten.toLowerCase().includes(q);
      const matchPhone = c.so_dien_thoai ? c.so_dien_thoai.includes(q) : false;
      const matchEmail = c.email ? c.email.toLowerCase().includes(q) : false;
      return matchName || matchPhone || matchEmail;
    }).slice(0, 10);
  }, [allKnownCustomers, customerSearchQuery]);

  // Chọn khách hàng từ gợi ý -> Chuyển sang Home và Mở Modal Lịch Sử Đặt Sân của khách
  const handleSelectCustomer = (customer: { id?: number; ho_ten: string; so_dien_thoai: string; email?: string; vai_tro?: string; source?: string }) => {
    setSelectedCustomerForHistory(customer);
    setIsCustomerHistoryModalOpen(true);
    setIsCustomerSearchOpen(false);
    setActiveTab('home');
  };

  // Áp dụng giá trị nhập tự do vào tìm kiếm & mở Modal Lịch Sử Đặt Sân
  const handleApplyCustomSearch = () => {
    const q = customerSearchQuery.trim();
    if (!q) return;
    const isDigitsOnly = /^[0-9+() -]+$/.test(q);

    // Tìm trong danh sách khách hàng đã biết
    const matched = allKnownCustomers.find((c) => {
      const matchName = c.ho_ten.toLowerCase() === q.toLowerCase();
      const matchPhone = c.so_dien_thoai ? c.so_dien_thoai.includes(q) : false;
      return matchName || matchPhone;
    });

    if (matched) {
      handleSelectCustomer(matched);
    } else {
      const tempCustomer = {
        ho_ten: isDigitsOnly ? 'Khách hàng' : q,
        so_dien_thoai: isDigitsOnly ? q : '',
        vai_tro: 'Khách tìm kiếm',
        source: 'Tìm kiếm thủ công',
      };
      setSelectedCustomerForHistory(tempCustomer);
      setIsCustomerHistoryModalOpen(true);
      setIsCustomerSearchOpen(false);
      setActiveTab('home');
    }
  };

  // Danh sách lịch sử đặt sân của riêng khách hàng đang xem modal
  const customerHistoryList = useMemo(() => {
    if (!selectedCustomerForHistory) return [];
    const targetPhone = (selectedCustomerForHistory.so_dien_thoai || '').trim().toLowerCase();
    const targetName = (selectedCustomerForHistory.ho_ten || '').trim().toLowerCase();

    const allSources = [...historyBookings, ...rawBookings];
    const seenMap = new Map<string, any>();

    allSources.forEach((b: any) => {
      if (b.trang_thai === 'DA_HUY' || b.trang_thai === 'Đã hủy') return;
      const bPhone = (b.so_dien_thoai || '').trim().toLowerCase();
      const bName = (b.ten_khach_hang || '').trim().toLowerCase();

      const matchPhone = Boolean(targetPhone && bPhone && (bPhone.includes(targetPhone) || targetPhone.includes(bPhone)));
      const matchName = Boolean(targetName && bName && (bName.includes(targetName) || targetName.includes(bName)));

      if (matchPhone || matchName) {
        const uniqueKey = `${b.ma_don_dat || b.id || ''}_${b.ngay_da || ''}_${b.gio_bat_dau || ''}_${b.ma_san || b.ten_san || ''}`;
        if (!seenMap.has(uniqueKey)) {
          seenMap.set(uniqueKey, b);
        }
      }
    });

    return Array.from(seenMap.values());
  }, [selectedCustomerForHistory, historyBookings, rawBookings]);

  // Xử lý khi nhấn vào một đơn trong Modal Lịch sử để nạp thông tin vào Order POS
  const handleSelectCustomerHistoryBookingToOrder = (booking: any) => {
    // Kiểm tra nếu đơn đặt đã qua ngày hoặc qua thời gian kết thúc thì không cho nạp
    if (isBookingExpired(booking)) {
      alert('Ca đặt này đã qua ngày hoặc qua thời gian thi đấu, không thể nạp vào Order POS!');
      return;
    }

    // 1. Điền Tên và SĐT vào form Order
    setCustomerName(booking.ten_khach_hang || selectedCustomerForHistory?.ho_ten || '');
    setCustomerPhone(booking.so_dien_thoai || selectedCustomerForHistory?.so_dien_thoai || '');

    // 2. Điền thông tin sân bóng vào giỏ hàng
    if (booking.ten_san || booking.ma_san) {
      const start = (booking.gio_bat_dau || '17:00').substring(0, 5);
      const end = (booking.gio_ket_thuc || '18:30').substring(0, 5);
      setSelectedSlots([
        {
          id: `pitch_${booking.ma_san || 1}_${start}`,
          ten_san: booking.ten_san || 'Sân bóng',
          gio_da: `${start} - ${end}`,
          gia_tien: Number(booking.tien_san || booking.tong_tien || 0),
        },
      ]);
    } else {
      setSelectedSlots([]);
    }

    // 3. Điền thông tin dịch vụ vào giỏ hàng
    const loadedServices: SelectedServiceItem[] = [];
    if (Array.isArray(booking.dich_vu) && booking.dich_vu.length > 0) {
      booking.dich_vu.forEach((dv: any, idx: number) => {
        loadedServices.push({
          id: dv.id || idx + 1,
          ten_dich_vu: dv.ten_dich_vu,
          so_luong: Number(dv.so_luong) || 1,
          don_gia: Number(dv.don_gia) || 0,
          don_vi: dv.don_vi || 'Phần',
        });
      });
    }
    setSelectedServices(loadedServices);

    // 4. Xác định trạng thái đã thanh toán đủ hay chưa
    const isPaid = (
      booking.trang_thai === 'Đã thanh toán' ||
      booking.trang_thai === 'DA_CHOT' ||
      booking.trang_thai === 'Đã chốt'
    );

    setLoadedBookingState({
      id: booking.id || booking.ma_don_dat,
      ma_don_dat: booking.ma_don_dat || String(booking.id),
      trang_thai: booking.trang_thai || (isPaid ? 'Đã thanh toán' : 'Chờ thanh toán'),
      isPaid,
      initialServices: JSON.parse(JSON.stringify(loadedServices)),
      ten_san: booking.ten_san,
      gio_da: `${booking.gio_bat_dau || ''} - ${booking.gio_ket_thuc || ''}`,
      ngay_da: booking.ngay_da,
    });

    setEditingInvoiceId(booking.id || booking.ma_don_dat);

    // 5. Đóng modal & chuyển về Home
    setIsCustomerHistoryModalOpen(false);
    setActiveTab('home');
    setCustomerSearchAlert(`✓ Đã nạp thông tin đơn đặt của ${booking.ten_khach_hang || 'khách hàng'} vào Order POS!`);
    setTimeout(() => setCustomerSearchAlert(null), 3500);
  };

  // Danh sách các sân đang sử dụng / đang đá trong thời gian hiện tại
  const currentlyPlayingPitches = useMemo(() => {
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentHM = `${String(currentHours).padStart(2, '0')}:${String(currentMinutes).padStart(2, '0')}`;
    const todayISO = formatDateToISO(now);
    const viewingDateISO = formattedDateISO;

    // Gộp tất cả đơn đặt hôm nay/ngày xem (bao gồm cả syncOrders vừa tạo)
    const allBookingsToday = [...rawBookings, ...historyBookings, ...syncOrders].filter((b) => {
      if (b.trang_thai === 'DA_HUY' || b.trang_thai === 'Đã hủy') return false;
      const bDate = (b.ngay_da || '').substring(0, 10);
      return bDate === viewingDateISO || bDate === todayISO || !b.ngay_da;
    });

    const activeList: Array<{
      san: SanBong;
      booking: any;
      gio_bat_dau: string;
      gio_ket_thuc: string;
      ten_khach_hang: string;
      so_dien_thoai: string;
      tong_tien: number;
      ma_don_dat: string | number;
      phut_da_da: number;
      phut_con_lai: number;
      phan_tram_tien_do: number;
      trang_thai_da: 'DANG_DA' | 'SAP_DA';
    }> = [];

    sanBongList.forEach((san) => {
      // Tìm booking đang hoạt động trong khung giờ hiện tại HOẶC được kích hoạt DANG_DA
      const matched = allBookingsToday.find((b) => {
        if (b.ma_san !== san.id && b.ten_san !== san.ten_san) return false;
        if (b.trang_thai === 'DANG_DA' || b.da_vao_san === 1 || b.da_vao_san === true || b.trang_thai_vao_san === 'DANG_DA') return true;
        const bStart = (b.gio_bat_dau || '').substring(0, 5);
        const bEnd = (b.gio_ket_thuc || '').substring(0, 5);
        if (!bStart || !bEnd) return false;
        return isTimeOverlapping(currentHM, currentHM > '23:30' ? '23:59' : `${String(currentHours).padStart(2, '0')}:${String(currentMinutes + 1).padStart(2, '0')}`, bStart, bEnd) ||
               (bStart <= currentHM && currentHM <= bEnd);
      });

      if (matched) {
        const bStart = (matched.gio_bat_dau || '').substring(0, 5);
        const bEnd = (matched.gio_ket_thuc || '').substring(0, 5);
        const [sh, sm] = bStart.split(':').map(Number);
        const [eh, em] = bEnd.split(':').map(Number);
        const startTotalMin = (sh || 0) * 60 + (sm || 0);
        const endTotalMin = (eh || 0) * 60 + (em || 0);
        const curTotalMin = currentHours * 60 + currentMinutes;
        const totalDuration = Math.max(1, endTotalMin - startTotalMin);

        const phut_da_da = Math.min(totalDuration, Math.max(0, curTotalMin - startTotalMin));
        const phut_con_lai = Math.max(0, endTotalMin - curTotalMin);
        const phan_tram_tien_do = Math.min(100, Math.round((phut_da_da / totalDuration) * 100));

        activeList.push({
          san,
          booking: matched,
          gio_bat_dau: bStart,
          gio_ket_thuc: bEnd,
          ten_khach_hang: matched.ten_khach_hang || 'Khách đang đá',
          so_dien_thoai: matched.so_dien_thoai || '',
          tong_tien: Number(matched.tong_tien || matched.tien_san || (san.don_gia_phut * totalDuration)),
          ma_don_dat: matched.ma_don_dat || matched.id || `POS-${san.id}`,
          phut_da_da,
          phut_con_lai,
          phan_tram_tien_do,
          trang_thai_da: 'DANG_DA',
        });
      }
    });

    return activeList;
  }, [sanBongList, rawBookings, historyBookings, syncOrders, formattedDateISO]);

  // Tất cả các ca đá có lịch trong ngày hôm nay (chưa vào sân thi đấu)
  const allTodayBookings = useMemo(() => {
    const viewingDateISO = formattedDateISO;
    const playingBookingIds = new Set(
      currentlyPlayingPitches.map((p) => String(p.ma_don_dat || p.booking?.id || p.booking?.ma_don_dat))
    );

    const list = [...rawBookings, ...historyBookings].filter((b) => {
      if (b.trang_thai === 'DA_HUY' || b.trang_thai === 'Đã hủy') return false;
      if (b.trang_thai === 'HOAN_THANH' || b.trang_thai === 'DA_CHOT') return false;
      const bDate = (b.ngay_da || '').substring(0, 10);
      if (bDate !== viewingDateISO) return false;

      // Khi nhấn vào sân hoặc đang đá: hóa đơn này sẽ biến mất khỏi danh sách chờ bên dưới
      const bId = String(b.ma_don_dat || b.id);
      const isAlreadyInPitch = b.da_vao_san === 1 || b.da_vao_san === true || b.trang_thai === 'DANG_DA' || playingBookingIds.has(bId);
      if (isAlreadyInPitch) return false;

      return true;
    });

    // Lọc trùng ID
    const uniqueMap = new Map<string, any>();
    list.forEach((b) => {
      const key = `${b.ma_san}_${b.gio_bat_dau}_${b.ngay_da}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, b);
      }
    });

    return Array.from(uniqueMap.values()).sort((a, b) => {
      const aStart = (a.gio_bat_dau || '').substring(0, 5);
      const bStart = (b.gio_bat_dau || '').substring(0, 5);
      return aStart.localeCompare(bStart);
    });
  }, [rawBookings, historyBookings, formattedDateISO, currentlyPlayingPitches]);

  // Danh sách lịch sử gộp & lọc theo điều kiện từ SQL Server & POS
  const filteredHistoryList = useMemo(() => {
    const combined: any[] = [];
    const seenIds = new Set<string | number>();

    historyBookings.forEach((item) => {
      const idKey = item.ma_don_dat || item.id;
      if (idKey && !seenIds.has(idKey)) {
        seenIds.add(idKey);
        combined.push(item);
      }
    });

    return combined.filter((item) => {
      // 1. Lọc theo trạng thái
      if (historyFilterStatus !== 'ALL') {
        const rawStatus = (item.trang_thai || '').toUpperCase().replace(/\s+/g, '_');
        if (historyFilterStatus === 'DA_THANH_TOAN') {
          if (!rawStatus.includes('DA_THANH_TOAN') && !rawStatus.includes('THANH_TOAN') && rawStatus !== 'DA_CHOT' && rawStatus !== 'HOAN_THANH') {
            return false;
          }
        } else if (historyFilterStatus === 'CHUA_THANH_TOAN') {
          if (!rawStatus.includes('CHO') && !rawStatus.includes('CHUA')) {
            return false;
          }
        } else if (historyFilterStatus === 'DA_HUY') {
          if (!rawStatus.includes('HUY')) {
            return false;
          }
        }
      }

      // 2. Lọc theo ngày
      if (historyFilterDate) {
        const itemDate = (item.ngay_da || '').substring(0, 10);
        if (itemDate && itemDate !== historyFilterDate) {
          return false;
        }
      }

      // 3. Lọc theo từ khóa tìm kiếm
      if (historySearchKeyword.trim()) {
        const kw = historySearchKeyword.trim().toLowerCase();
        const tenKhach = (item.ten_khach_hang || '').toLowerCase();
        const sdt = (item.so_dien_thoai || '').toLowerCase();
        const tenSan = (item.ten_san || '').toLowerCase();
        const maDon = String(item.ma_don_dat || item.id || '').toLowerCase();
        if (!tenKhach.includes(kw) && !sdt.includes(kw) && !tenSan.includes(kw) && !maDon.includes(kw)) {
          return false;
        }
      }

      // 4. Lọc theo phương thức thanh toán (Tiền mặt / Chuyển khoản VietQR)
      if (historyFilterPaymentMethod !== 'ALL') {
        const pt = (item.phuong_thuc || item.hinh_thuc_thanh_toan || '').toUpperCase();
        if (historyFilterPaymentMethod === 'TIEN_MAT') {
          if (pt.includes('CHUYEN_KHOAN') || pt.includes('QR') || pt.includes('BANK') || pt.includes('VIETQR')) {
            return false;
          }
        } else if (historyFilterPaymentMethod === 'CHUYEN_KHOAN') {
          if (!pt.includes('CHUYEN_KHOAN') && !pt.includes('QR') && !pt.includes('BANK') && !pt.includes('VIETQR')) {
            return false;
          }
        }
      }

      return true;
    });
  }, [historyBookings, historyFilterStatus, historyFilterDate, historySearchKeyword, historyFilterPaymentMethod]);

  // Danh sách hóa đơn chờ thanh toán (CSDL SQL Server & POS)
  const pendingInvoices = useMemo(() => {
    const list: any[] = [];
    const seenIds = new Set<string | number>();

    // Lấy từ CSDL tất cả các đơn có trạng thái Chờ thanh toán / Chưa thanh toán / CHO_XAC_NHAN
    historyBookings.forEach((b: any) => {
      const st = (b.trang_thai || '').toUpperCase().replace(/\s+/g, '_');
      if (st.includes('CHO') || st.includes('CHUA') || b.trang_thai === 'Chờ thanh toán') {
        const idKey = b.ma_don_dat || b.id;
        if (idKey && !seenIds.has(idKey)) {
          seenIds.add(idKey);
          list.push(b);
        }
      }
    });

    // Chỉ lấy từ CSDL SQL Server

    // Lọc theo phương thức thanh toán nếu có
    if (invoicesFilterPaymentMethod !== 'ALL') {
      return list.filter((item) => {
        const pt = (item.phuong_thuc || item.hinh_thuc_thanh_toan || '').toUpperCase();
        if (invoicesFilterPaymentMethod === 'TIEN_MAT') {
          return !pt.includes('CHUYEN_KHOAN') && !pt.includes('QR') && !pt.includes('BANK') && !pt.includes('VIETQR');
        } else if (invoicesFilterPaymentMethod === 'CHUYEN_KHOAN') {
          return pt.includes('CHUYEN_KHOAN') || pt.includes('QR') || pt.includes('BANK') || pt.includes('VIETQR');
        }
        return true;
      });
    }

    return list;
  }, [historyBookings, invoicesFilterPaymentMethod]);

  // Tải ma trận lịch đặt sân thực tế theo ngày
  const fetchLichSan = useCallback(async (ngayISO: string, currentSanList: SanBong[]) => {
    if (!currentSanList || currentSanList.length === 0) return;
    setIsRefreshing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/dat-san/lich-san?ngay_da=${ngayISO}`);
      const data = await res.json();
      const bookings = data.success && Array.isArray(data.data) ? data.data : [];
      setRawBookings(bookings);

      const newGrid: Record<string, SlotLichSan> = {};
      const activeSlots = timeSlotsList.length > 0 ? timeSlotsList : DEFAULT_TIME_SLOTS;

      currentSanList.forEach((san) => {
        activeSlots.forEach((slot) => {
          const key = `${san.id}_${slot.start}`;

          const matchedBooking = bookings.find((b: any) => {
            if (b.ma_san !== san.id || b.trang_thai === 'DA_HUY') return false;
            const bStart = (b.gio_bat_dau || '').substring(0, 5);
            const bEnd = (b.gio_ket_thuc || '').substring(0, 5);
            return isTimeOverlapping(slot.start, slot.end, bStart, bEnd);
          });

          let trangThai: TrangThaiSlot = 'TRONG';
          let khachHang = '';
          let phone = '';
          let maDon: number | undefined = undefined;
          let bStartDon: string | undefined = undefined;
          let bEndDon: string | undefined = undefined;

          if (matchedBooking) {
            trangThai = 'DA_CHOT';
            khachHang = matchedBooking.ten_khach_hang || 'Khách đã đặt';
            phone = matchedBooking.so_dien_thoai || '';
            maDon = matchedBooking.id || matchedBooking.ma_don_dat;
            bStartDon = (matchedBooking.gio_bat_dau || '').substring(0, 5);
            bEndDon = (matchedBooking.gio_ket_thuc || '').substring(0, 5);
          }

          const donGiaPhut = Number(san.don_gia_phut) || 5000;
          const giaApDung = 30 * donGiaPhut;

          newGrid[key] = {
            ma_san: san.id,
            gio_bat_dau: slot.start,
            gio_ket_thuc: slot.end,
            trang_thai: trangThai,
            ten_khach_hang: khachHang,
            so_dien_thoai: phone,
            ma_don_dat: maDon,
            gio_bat_dau_don: bStartDon,
            gio_ket_thuc_don: bEndDon,
            gia_ap_dung: giaApDung,
          };
        });
      });

      setGridSlots(newGrid);
    } catch (err) {
      console.error('Lỗi khi tải lịch sân:', err);
    } finally {
      setIsRefreshing(false);
      setIsLoadingData(false);
    }
  }, [timeSlotsList]);

  // Nạp toàn bộ dữ liệu ban đầu từ CSDL SQL Server
  useEffect(() => {
    const initData = async () => {
      setIsLoadingData(true);
      await Promise.all([
        fetchUsers(),
        fetchLoaiSan(),
        fetchSanBong(),
        fetchKhungGio(),
        fetchDichVu(),
        fetchHistory(),
      ]);
    };
    initData();
  }, [fetchHistory]);

  // Cập nhật ma trận lịch khi danh sách sân hoặc ngày thay đổi
  useEffect(() => {
    if (sanBongList.length > 0) {
      fetchLichSan(formattedDateISO, sanBongList);
    }
  }, [formattedDateISO, sanBongList, fetchLichSan]);

  // Tải lịch sử khi chuyển sang tab history
  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab, fetchHistory]);

  // -------------------------------------------------------------
  // KẾT NỐI REAL-TIME SOCKET.IO ĐỒNG BỘ 100% VỚI WEB VÀ APP
  // -------------------------------------------------------------
  useEffect(() => {
    const socket: Socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('⚡ [Management System]: Đã kết nối Real-time Socket server:', socket.id);
    });

    socket.on('slots_updated', (updatedSlots: string[]) => {
      setLockedSlots(updatedSlots || []);
    });

    socket.on('booking_updated', (data?: any) => {
      fetchLichSan(formattedDateISO, sanBongList);
      fetchHistory();
      if (data?.ten_khach_hang || data?.ma_don_dat) {
        const notif: POSNotification = {
          id: `book_${Date.now()}_${Math.random()}`,
          title: '⚡ Cập Nhật Lịch Đặt Sân',
          message: `Đơn đặt sân #${data.ma_don_dat || 'POS'} của ${data.ten_khach_hang || 'khách hàng'} vừa được cập nhật.`,
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          isRead: false,
          type: 'booking',
        };
        setNotifications((prev) => [notif, ...prev.slice(0, 29)]);
      }
    });

    socket.on('payment_success', (data?: any) => {
      fetchLichSan(formattedDateISO, sanBongList);
      fetchHistory();

      const amount = data?.so_tien || data?.tong_tien || data?.amount || 0;
      const customer = data?.ten_khach_hang || data?.customerName || 'Khách hàng';
      const orderCode = data?.ma_don_dat || data?.id || data?.orderId || 'HD';

      const notif: POSNotification = {
        id: `pay_${Date.now()}_${Math.random()}`,
        title: '💰 Nhận Chuyển Khoản Thành Công!',
        message: `Khách hàng ${customer} vừa chuyển khoản ${
          amount ? Number(amount).toLocaleString('vi-VN') + 'đ' : ''
        } cho đơn #${orderCode}.`,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        isRead: false,
        amount: Number(amount),
        type: 'payment',
      };

      setNotifications((prev) => [notif, ...prev.slice(0, 29)]);
      playNotificationChime();
      setCustomerSearchAlert(`💰 ${customer} đã chuyển khoản ${amount ? Number(amount).toLocaleString('vi-VN') + 'đ' : ''} thành công!`);
      setTimeout(() => setCustomerSearchAlert(null), 5000);
    });

    return () => {
      socket.disconnect();
    };
  }, [formattedDateISO, sanBongList, fetchLichSan, fetchHistory]);

  // Đăng nhập thành công từ modal
  const handleLoginSuccess = (userData: AuthUser) => {
    setCurrentUser(userData);
    setIsLoginModalOpen(false);
    setIsSettingsOpen(false);
  };

  // Đăng xuất và chuyển hướng ra trang chủ
  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('soccer_current_user');
    }
    setCurrentUser(null);
    setIsSettingsOpen(false);
    router.push('/');
  };

  const isAuthorized = Boolean(!currentUser || checkIsAuthorizedRole(currentUser));

  // Danh sách sân sau lọc
  const filteredSanList = useMemo(() => {
    return sanBongList.filter((san) => {
      const matchLoai = filterLoaiSan === 'ALL' || san.ten_loai === filterLoaiSan;
      const matchSan = filterSanId === 'ALL' || String(san.id) === filterSanId;
      const matchSearch = !searchKeyword.trim() ||
        san.ten_san.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        san.ten_loai.toLowerCase().includes(searchKeyword.toLowerCase());
      return matchLoai && matchSan && matchSearch;
    });
  }, [sanBongList, filterLoaiSan, filterSanId, searchKeyword]);

  // Lọc danh sách khung giờ tự động ẩn các ca đã qua theo ngày đang xem (currentDate)
  const availableTimeSlots = useMemo(() => {
    const rawSlots = timeSlotsList.length > 0 ? timeSlotsList : DEFAULT_TIME_SLOTS;
    if (!currentDate) return [];

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const selectedDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()).getTime();

    // 1. Ngày trong QUÁ KHỨ -> Trả về mảng rỗng [] (Không có khung giờ khả dụng)
    if (selectedDay < today) {
      return [];
    }

    // 2. Ngày trong TƯƠNG LAI -> Hiển thị đầy đủ 100% các khung giờ
    if (selectedDay > today) {
      return rawSlots;
    }

    // 3. Ngày HÔM NAY -> Ẩn các khung giờ đã bắt đầu hoặc đã qua
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return rawSlots.filter((slot) => {
      const [startHourStr, startMinStr] = slot.start.split(':');
      const slotStartMinutes = parseInt(startHourStr, 10) * 60 + parseInt(startMinStr || '0', 10);
      return slotStartMinutes > currentMinutes;
    });
  }, [currentDate, timeSlotsList]);

  // Thống kê nhanh hôm nay
  const statsSummary = useMemo(() => {
    const totalPitches = sanBongList.length;
    let bookedSlotsCount = 0;
    let totalSlotsCount = 0;

    Object.values(gridSlots).forEach((slot) => {
      totalSlotsCount++;
      if (slot.trang_thai === 'DA_CHOT') {
        bookedSlotsCount++;
      }
    });

    const bookedPitchesSet = new Set(rawBookings.map((b) => b.ma_san));
    const activePitchesCount = bookedPitchesSet.size;
    const availablePitchesCount = Math.max(0, totalPitches - activePitchesCount);

    return {
      totalPitches,
      activePitchesCount,
      availablePitchesCount,
      bookedSlotsCount,
      totalSlotsCount,
    };
  }, [sanBongList, gridSlots, rawBookings]);

  // Render lịch popup
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
    const d = new Date(year, month, 1).getDay();
    return d === 0 ? 6 : d - 1;
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
    setCalendarViewDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + (direction === 'prev' ? -1 : 1));
      return newDate;
    });
  };

  const handleSelectCalendarDate = (day: number) => {
    const selected = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth(), day);
    setCurrentDate(selected);
    setIsCalendarOpen(false);
  };

  const renderCalendarDays = () => {
    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();
    const totalDays = getDaysInMonth(year, month);
    const startOffset = getFirstDayOfMonth(year, month);
    const daysArray = [];

    for (let i = 0; i < startOffset; i++) {
      daysArray.push(<div key={`empty-${i}`} className="h-8 w-8 flex items-center justify-center text-xs opacity-20">-</div>);
    }

    for (let d = 1; d <= totalDays; d++) {
      const isSelected = currentDate.getDate() === d && currentDate.getMonth() === month && currentDate.getFullYear() === year;
      const isToday = new Date().getDate() === d && new Date().getMonth() === month && new Date().getFullYear() === year;

      daysArray.push(
        <button
          key={`day-${d}`}
          type="button"
          onClick={() => handleSelectCalendarDate(d)}
          className={`h-8 w-8 rounded-xl text-xs font-bold flex items-center justify-center transition-all ${isSelected
            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30 scale-105'
            : isToday
              ? 'border border-emerald-500 text-emerald-500 font-bold hover:bg-emerald-500/10'
              : isDarkMode
                ? 'text-slate-200 hover:bg-slate-800'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
        >
          {d}
        </button>
      );
    }
    return daysArray;
  };

  // -------------------------------------------------------------
  // POS LOGIC: CHỌN NHIỀU SÂN & DỊCH VỤ VÀO GIỎ HÀNG 25%
  // -------------------------------------------------------------

  // Chuyển đổi slotId nội bộ POS sang định dạng key của backend: {ngay}_{sanId}_{gio}
  const toSocketSlotKey = (sanId: number, gioStart: string) =>
    `${formattedDateISO}_${sanId}_${gioStart}`;

  // Tính khoảng cách phút giữa 2 mốc giờ "HH:mm"
  const calculateMinutesDiff = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    const diff = (h2 * 60 + (m2 || 0)) - (h1 * 60 + (m1 || 0));
    return diff > 0 ? diff : 0;
  };

  // Đồng bộ danh sách các sân đã chọn với các slot 30m và phát tín hiệu khóa Real-time (Màu cam)
  const syncPitchesAndSlots = useCallback((pitches: SelectedPitchOrder[]) => {
    setSelectedPitches(pitches);

    if (pitches.length === 0) {
      setSelectedSlots([]);
      if (socketRef.current?.connected) {
        socketRef.current.emit('unlock_all');
      }
      return;
    }

    const allSlots: SelectedSlotItem[] = [];
    const socketKeys: string[] = [];

    pitches.forEach((p) => {
      const overlapping = availableTimeSlots.filter((s) =>
        isTimeOverlapping(s.start, s.end, p.startTime, p.endTime)
      );
      const pricePerSlot = (Number(p.pitch.don_gia_phut) || 3000) * 30;
      overlapping.forEach((s) => {
        allSlots.push({
          id: `pitch_${p.pitch.id}_${s.start}`,
          ten_san: p.pitch.ten_san,
          gio_da: `${s.start} - ${s.end}`,
          gia_tien: pricePerSlot,
        });
        socketKeys.push(`${formattedDateISO}_${p.pitch.id}_${s.start}`);
      });
    });

    setSelectedSlots(allSlots);

    // Emit lock_slots to Socket.IO để tất cả màn hình POS và Trang chủ đổi sang TẠM KHÓA (MÀU CAM)
    if (socketRef.current?.connected) {
      socketRef.current.emit('lock_slots', socketKeys);
    }
  }, [availableTimeSlots, formattedDateISO]);

  const handleToggleSlotFromMatrix = (san: SanBong, slot: KhungGioItem, slotData?: SlotLichSan) => {
    if (slotData && slotData.trang_thai === 'DA_CHOT') {
      setSelectedSlotDetail({ san, slot, slotData });
      return;
    }

    const existingIdx = selectedPitches.findIndex((p) => p.pitch.id === san.id);

    if (existingIdx === -1) {
      // Sân mới -> Thêm vào danh sách selectedPitches
      const durationMin = calculateMinutesDiff(slot.start, slot.end) || 30;
      const price = Math.round(durationMin * (Number(san.don_gia_phut) || 3000));
      const newPitches: SelectedPitchOrder[] = [
        ...selectedPitches,
        {
          pitch: san,
          startTime: slot.start,
          endTime: slot.end,
          durationMin,
          price,
        },
      ];
      syncPitchesAndSlots(newPitches);
      return;
    }

    // Sân đã có trong danh sách -> Cập nhật hoặc hủy chọn
    const curr = selectedPitches[existingIdx];
    const slotId = `pitch_${san.id}_${slot.start}`;
    const isThisSlotSelected = selectedSlots.some((s) => s.id === slotId);

    if (isThisSlotSelected && curr.startTime === slot.start && curr.endTime === slot.end) {
      // Bấm lại chính ô duy nhất của sân này -> Xóa sân này khỏi đơn
      const newPitches = selectedPitches.filter((p) => p.pitch.id !== san.id);
      syncPitchesAndSlots(newPitches);
      return;
    }

    let newStart = curr.startTime;
    let newEnd = curr.endTime;

    if (slot.start < newStart) {
      newStart = slot.start;
    } else if (slot.end > newEnd) {
      newEnd = slot.end;
    } else if (slot.start === newStart) {
      newStart = slot.end;
    } else if (slot.end === newEnd) {
      newEnd = slot.start;
    }

    if (newStart >= newEnd) {
      // Xóa sân nếu khoảng thời gian không hợp lệ
      const newPitches = selectedPitches.filter((p) => p.pitch.id !== san.id);
      syncPitchesAndSlots(newPitches);
    } else {
      const durationMin = calculateMinutesDiff(newStart, newEnd);
      const price = Math.round(durationMin * (Number(san.don_gia_phut) || 3000));
      const newPitches = selectedPitches.map((p, idx) =>
        idx === existingIdx
          ? { ...p, startTime: newStart, endTime: newEnd, durationMin, price }
          : p
      );
      syncPitchesAndSlots(newPitches);
    }
  };

  const handleUpdatePitchTime = (pitchId: number, newStart: string, newEnd: string) => {
    const newPitches = selectedPitches.map((p) => {
      if (p.pitch.id === pitchId) {
        const durationMin = calculateMinutesDiff(newStart, newEnd);
        const price = Math.round(durationMin * (Number(p.pitch.don_gia_phut) || 3000));
        return { ...p, startTime: newStart, endTime: newEnd, durationMin, price };
      }
      return p;
    });
    syncPitchesAndSlots(newPitches);
  };

  const handleRemovePitch = (pitchId: number) => {
    const newPitches = selectedPitches.filter((p) => p.pitch.id !== pitchId);
    syncPitchesAndSlots(newPitches);
  };

  const handleRemoveSlot = (slotId: string) => {
    const parts = slotId.replace('pitch_', '').split('_');
    const pitchId = Number(parts[0]);
    if (pitchId) {
      handleRemovePitch(pitchId);
    }
  };

  const handleAddServiceToCart = (item: DichVuCSDL | { id: number; ten_dich_vu?: string; name?: string; don_gia?: number; price?: number; don_vi_tinh?: string; unit?: string }) => {
    const id = item.id;
    const name = (item as any).ten_dich_vu || (item as any).name || 'Dịch vụ';
    const price = Number((item as any).don_gia ?? (item as any).price ?? 0);
    const unit = (item as any).don_vi_tinh || (item as any).unit || 'Phần';

    setSelectedServices((prev) => {
      const existing = prev.find((s) => s.id === id);
      if (existing) {
        return prev.map((s) => (s.id === id ? { ...s, so_luong: s.so_luong + 1 } : s));
      }
      return [
        ...prev,
        {
          id,
          ten_dich_vu: name,
          don_gia: price,
          so_luong: 1,
          don_vi: unit,
        },
      ];
    });
  };

  const handleUpdateServiceQuantity = (id: number, delta: number) => {
    setSelectedServices((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const nextQty = item.so_luong + delta;
            return nextQty > 0 ? { ...item, so_luong: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as SelectedServiceItem[]
    );
  };

  const handleRemoveService = (id: number) => {
    setSelectedServices((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearOrder = () => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('unlock_all');
    }
    setSelectedPitches([]);
    setSelectedSlots([]);
    setSelectedServices([]);
    setCustomerName('');
    setCustomerPhone('');
    setEditingInvoiceId(null);
    setLoadedBookingState(null);
    setIsCustomTimeActive(false);
    setCustomStartTime('');
    setCustomEndTime('');
    setPaymentMethod('TIEN_MAT');
  };

  const totalPitchPrice = useMemo(() => {
    return selectedPitches.reduce((sum, p) => sum + p.price, 0);
  }, [selectedPitches]);

  const totalServicePrice = useMemo(() => {
    return selectedServices.reduce((sum, item) => sum + item.don_gia * item.so_luong, 0);
  }, [selectedServices]);

  const grandTotal = useMemo(() => {
    return totalPitchPrice + totalServicePrice;
  }, [totalPitchPrice, totalServicePrice]);

  // Kiểm tra đơn đã thanh toán đủ hay chưa
  const isOrderFullyPaid = useMemo(() => {
    if (!loadedBookingState) return false;
    const soTienDaTra = Number(loadedBookingState.so_tien_da_tra || 0);
    const tongTien = Number(loadedBookingState.tong_tien || grandTotal || 0);
    // Nếu có tiền đã trả và số tiền đã trả >= tổng tiền
    if (soTienDaTra > 0 && soTienDaTra >= tongTien) return true;
    const rawSt = (loadedBookingState.trang_thai || '').toUpperCase().replace(/\s+/g, '_');
    // Các trạng thái chưa thanh toán đủ: DANG_DA, DA_COC, CHO, CHUA, TAM
    if (rawSt.includes('DANG_DA') || rawSt.includes('DA_COC') || rawSt.includes('CHO') || rawSt.includes('CHUA') || rawSt.includes('TAM')) {
      return false;
    }
    return Boolean(
      (loadedBookingState.isPaid && soTienDaTra >= tongTien) ||
      ((rawSt.includes('DA_THANH_TOAN') || rawSt.includes('THANH_TOAN') || rawSt === 'HOAN_THANH') && soTienDaTra >= tongTien)
    );
  }, [loadedBookingState, grandTotal]);

  // Số tiền thực tế cần thanh toán:
  // - Nếu đơn bán lẻ (không sân): totalServicePrice
  // - Nếu đã thanh toán đủ tiền sân (isOrderFullyPaid): Chỉ tính tiền dịch vụ phát sinh thêm
  // - Nếu đơn chưa thanh toán hoặc mới cọc (chưa thanh toán đủ): Số tiền còn lại = grandTotal - soTienDaTra
  const amountDueToPay = useMemo(() => {
    // 1. Trường hợp đơn bán lẻ dịch vụ / nước uống (không đặt sân)
    if (selectedPitches.length === 0 && !loadedBookingState) {
      return totalServicePrice;
    }

    const soTienDaTra = Number(loadedBookingState?.so_tien_da_tra || 0);
    if (isOrderFullyPaid) {
      const initialSvc = loadedBookingState?.initialServices || [];
      const initialSvcTotal = initialSvc.reduce((sum: number, s: any) => sum + (Number(s.don_gia || 0) * Number(s.so_luong || 0)), 0);
      return Math.max(0, totalServicePrice - initialSvcTotal);
    }
    return Math.max(0, grandTotal - soTienDaTra);
  }, [isOrderFullyPaid, totalServicePrice, grandTotal, loadedBookingState, selectedPitches.length]);

  // Kiểm tra khách hàng có mua thêm dịch vụ mới hay không
  const hasAddedExtraServices = useMemo(() => {
    if (!loadedBookingState || !isOrderFullyPaid) return false;
    const initial = loadedBookingState.initialServices || [];
    for (const cur of selectedServices) {
      const match = initial.find((s) => s.id === cur.id || s.ten_dich_vu === cur.ten_dich_vu);
      if (!match || cur.so_luong > match.so_luong) {
        return true;
      }
    }
    return false;
  }, [loadedBookingState, isOrderFullyPaid, selectedServices]);

  // Xử lý khi bấm nút "VÀO SÂN" (khi khách đã thanh toán đủ)
  const handleCheckInPitch = async () => {
    if (!customerName && selectedPitches.length === 0) {
      showToast('Vui lòng chọn hoặc nạp thông tin sân bóng trước khi vào sân!', 'warning', 'Chưa có thông tin sân');
      return;
    }

    const orderId = loadedBookingState?.id || editingInvoiceId || Date.now();
    const pitchName = selectedPitches.length > 0 ? selectedPitches.map((s) => s.pitch.ten_san).join(', ') : (loadedBookingState?.ten_san || 'Sân bóng');
    const firstP = selectedPitches[0];
    const start = firstP ? firstP.startTime : (loadedBookingState?.gio_da?.split(' - ')[0] || '17:00');
    const end = firstP ? firstP.endTime : (loadedBookingState?.gio_da?.split(' - ')[1] || '18:30');

    // 1. Gọi API Backend để lưu trạng thái vào CSDL SQL Server
    if (editingInvoiceId && !String(editingInvoiceId).startsWith('temp_')) {
      try {
        await fetch(`${API_BASE_URL}/dat-san/vao-san/${editingInvoiceId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trang_thai: 'DANG_DA' }),
        });
      } catch (err) {
        console.warn('Lỗi gọi API vao-san:', err);
      }
    }

    // 2. Cập nhật state đồng bộ
    updateSyncOrderStatus(orderId, 'Đã thanh toán', {
      ten_khach_hang: customerName || 'Khách vào sân',
      so_dien_thoai: customerPhone || '',
      ten_san: pitchName,
      gio_bat_dau: start,
      gio_ket_thuc: end,
      ngay_da: loadedBookingState?.ngay_da || formattedDateISO,
      trang_thai_vao_san: 'DANG_DA',
      da_vao_san: true,
      gio_vao_san: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    });

    // 3. Tải lại dữ liệu mới nhất
    await fetchLichSan(formattedDateISO, sanBongList);
    fetchHistory();

    showToast(`⚽ Khách hàng ${customerName || 'Khách'} đã vào sân thi đấu thành công! Đơn đã chuyển vào Sân đang đá.`, 'success', 'Vào Sân Thành Công');
    handleClearOrder();
    setActiveTab('pitch');
  };

  // Cho khách vào sân trực tiếp từ danh sách đơn đặt hôm nay
  const handleDirectCheckIn = async (b: any, status: 'DANG_DA' = 'DANG_DA') => {
    const bookingId = b.ma_don_dat || b.id;
    if (bookingId && !String(bookingId).startsWith('temp_')) {
      try {
        await fetch(`${API_BASE_URL}/dat-san/vao-san/${bookingId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trang_thai: status }),
        });
      } catch (err) {
        console.warn('Lỗi gọi API vao-san:', err);
      }
    }
    updateSyncOrderStatus(bookingId, b.trang_thai || 'Đã thanh toán', {
      ten_khach_hang: b.ten_khach_hang || 'Khách vào sân',
      so_dien_thoai: b.so_dien_thoai || '',
      ten_san: b.ten_san || 'Sân bóng',
      gio_bat_dau: (b.gio_bat_dau || '').substring(0, 5) || '17:00',
      gio_ket_thuc: (b.gio_ket_thuc || '').substring(0, 5) || '18:30',
      ngay_da: b.ngay_da || formattedDateISO,
      trang_thai_vao_san: 'DANG_DA',
      da_vao_san: true,
      gio_vao_san: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    });
    await fetchLichSan(formattedDateISO, sanBongList);
    fetchHistory();
    showToast(`⚽ Đã đưa đơn #${bookingId} (${b.ten_khach_hang || 'Khách'}) vào danh sách Sân đang đá thành công!`, 'success', 'Vào Sân Thành Công');
  };

  // -------------------------------------------------------------
  // POS ACTIONS: LƯU & THANH TOÁN GỘP NHIỀU SÂN (CSDL SQL SERVER - sp_ThemDonDatVaThanhToan)
  // -------------------------------------------------------------
  const handleSaveOrder = async () => {
    if (selectedPitches.length === 0 && selectedServices.length === 0) {
      showToast('Giỏ hàng đang trống! Vui lòng chọn ít nhất 1 sân hoặc dịch vụ trước khi lưu.', 'warning', 'Giỏ Hàng Trống');
      return;
    }

    const serviceItems: ServiceItemOrder[] = selectedServices.map((item, idx) => ({
      id: item.id || idx + 1,
      ten_dich_vu: item.ten_dich_vu,
      so_luong: item.so_luong,
      don_gia: item.don_gia,
      thanh_tien: item.don_gia * item.so_luong,
    }));

    const dichVuListPayload = selectedServices.map((s) => ({
      ma_dich_vu: s.id,
      so_luong: s.so_luong,
    }));

    // TRƯỜNG HỢP 1: BÁN LẺ DỊCH VỤ / NƯỚC UỐNG (KHÔNG ĐẶT SÂN) - LƯU CHỜ THANH TOÁN
    if (selectedPitches.length === 0 && selectedServices.length > 0 && !editingInvoiceId) {
      try {
        const res = await fetch(`${API_BASE_URL}/dat-san/ban-le-dich-vu`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ten_khach_hang: customerName.trim() || 'Khách lẻ quầy',
            so_dien_thoai: customerPhone.trim() || null,
            phuong_thuc: paymentMethod,
            ghi_chu: 'Bán lẻ dịch vụ / nước uống (Chờ thanh toán sau)',
            da_thanh_toan: false,
            dich_vu_list: dichVuListPayload,
          }),
        });
        const data = await res.json();
        if (data.success) {
          showToast(`💾 Đã lưu đơn bán lẻ #${data.data?.id || ''} thành công! Khách sẽ thanh toán sau.`, 'success', 'Lưu Đơn Bán Lẻ');
        } else {
          showToast(data.message || 'Lỗi lưu đơn bán lẻ', 'error');
        }
      } catch (e: any) {
        console.error('Lỗi lưu đơn bán lẻ:', e);
      }
      fetchLichSan(formattedDateISO, sanBongList);
      fetchHistory();
      handleClearOrder();
      return;
    }

    try {
      if (editingInvoiceId && !String(editingInvoiceId).startsWith('temp_')) {
        // CẬP NHẬT HÓA ĐƠN ĐANG SỬA TRÊN CSDL SQL SERVER (sp_SuaDonDatVaThanhToan)
        const firstP = selectedPitches[0];
        const targetStatus = (isOrderFullyPaid && !hasAddedExtraServices) ? 'DA_THANH_TOAN' : 'DANG_DA';
        const res = await fetch(`${API_BASE_URL}/dat-san/don-dat-thanh-toan/${editingInvoiceId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ma_nguoi_dung: currentUser?.id || 1,
            ten_khach_hang: customerName.trim(),
            so_dien_thoai: customerPhone.trim(),
            ma_san: firstP?.pitch.id || null,
            ngay_da: formattedDateISO,
            gio_bat_dau: (firstP?.startTime || '17:00').length === 5 ? `${firstP?.startTime}:00` : firstP?.startTime,
            gio_ket_thuc: (firstP?.endTime || '18:30').length === 5 ? `${firstP?.endTime}:00` : firstP?.endTime,
            tien_san: totalPitchPrice,
            tong_tien: grandTotal,
            ghi_chu: customerName ? `Khách: ${customerName} - ${customerPhone}` : 'Khách sân đang đá',
            trang_thai: targetStatus,
            phuong_thuc: paymentMethod,
            loai_thanh_toan: null,
            so_tien: 0,
            trang_thai_gd: 'THANH_CONG',
            dich_vu_list: dichVuListPayload,
          }),
        });
        const data = await res.json();
        if (!data.success) {
          console.warn('Lỗi khi cập nhật CSDL SQL Server:', data.message);
        }

        // Đảm bảo duy trì trạng thái vao-san trên SQL Server nếu đang thi đấu
        try {
          await fetch(`${API_BASE_URL}/dat-san/vao-san/${editingInvoiceId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trang_thai: targetStatus }),
          });
        } catch (e: any) {
          console.warn('Lỗi vao-san:', e.message);
        }
      } else {
        // TẠO CÁC ĐƠN ĐẶT SÂN MỚI TRÊN CSDL SQL SERVER (sp_ThemDonDatVaThanhToan)
        const pitchesToSave = selectedPitches.length > 0
          ? selectedPitches
          : [{
              pitch: sanBongList[0],
              startTime: '17:00',
              endTime: '18:30',
              durationMin: 90,
              price: 0,
            }];

        for (let i = 0; i < pitchesToSave.length; i++) {
          const p = pitchesToSave[i];
          const isFirst = i === 0;
          const pitchDichVu = isFirst ? dichVuListPayload : [];
          const pitchGrandTotal = p.price + (isFirst ? totalServicePrice : 0);

          await fetch(`${API_BASE_URL}/dat-san/don-dat-thanh-toan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ma_nguoi_dung: currentUser?.id || 1,
              ten_khach_hang: customerName.trim(),
              so_dien_thoai: customerPhone.trim(),
              ma_san: p.pitch.id,
              ngay_da: formattedDateISO,
              gio_bat_dau: p.startTime.length === 5 ? `${p.startTime}:00` : p.startTime,
              gio_ket_thuc: p.endTime.length === 5 ? `${p.endTime}:00` : p.endTime,
              tien_san: p.price,
              tong_tien: pitchGrandTotal,
              ghi_chu: customerName ? `Khách: ${customerName} - ${customerPhone}` : 'Khách đá trả sau POS',
              trang_thai: 'DANG_DA',
              phuong_thuc: paymentMethod,
              loai_thanh_toan: null,
              so_tien: 0,
              trang_thai_gd: 'THANH_CONG',
              dich_vu_list: pitchDichVu,
            }),
          });
        }
      }
    } catch (apiErr) {
      console.error('Lỗi kết nối API đặt sân:', apiErr);
    }

    // Cập nhật state đồng bộ
    if (editingInvoiceId) {
      const firstP = selectedPitches[0];
      updateSyncOrderStatus(editingInvoiceId, isOrderFullyPaid ? 'Đã thanh toán' : 'Chờ thanh toán', {
        ten_khach_hang: customerName.trim() || 'Khách vãng lai',
        so_dien_thoai: customerPhone.trim() || 'Chưa có SĐT',
        ten_san: selectedPitches.length > 0 ? selectedPitches.map((s) => s.pitch.ten_san).join(', ') : 'Quầy nước / Dịch vụ',
        gio_bat_dau: firstP?.startTime || '17:00',
        gio_ket_thuc: firstP?.endTime || '18:30',
        ngay_da: formattedDateISO,
        tien_san: totalPitchPrice,
        dich_vu: serviceItems,
        tong_tien: grandTotal,
        trang_thai_vao_san: 'DANG_DA',
        da_vao_san: true,
      });

      if (loadedBookingState) {
        setLoadedBookingState((prev) => prev ? {
          ...prev,
          initialServices: JSON.parse(JSON.stringify(selectedServices)),
        } : null);
      }

      showToast('💾 Đã lưu và đưa hóa đơn này vào danh sách Sân đang đá để khách thi đấu và thanh toán sau!', 'success', 'Lưu Đơn Thành Công');
    } else {
      const newInvoice: DonDatSanPOS = {
        id: Date.now(),
        ma_don_dat: `HD-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
        ten_khach_hang: customerName.trim() || 'Khách vãng lai',
        so_dien_thoai: customerPhone.trim() || 'Chưa có SĐT',
        ten_san: selectedPitches.length > 0 ? selectedPitches.map((s) => s.pitch.ten_san).join(', ') : 'Quầy nước / Dịch vụ',
        gio_bat_dau: selectedPitches[0]?.startTime || '17:00',
        gio_ket_thuc: selectedPitches[0]?.endTime || '18:30',
        ngay_da: formattedDateISO,
        tien_san: totalPitchPrice,
        dich_vu: serviceItems,
        tong_tien: grandTotal,
        so_tien_da_tra: 0,
        trang_thai: 'DANG_DA',
        trang_thai_vao_san: 'DANG_DA',
        da_vao_san: true,
        ngay_tao: new Date().toISOString(),
      };
      addSyncOrder(newInvoice);
      showToast(`💾 Đã lưu đơn đá trả sau vào danh sách Sân đang đá!`, 'success', 'Lưu Đơn Thành Công');
    }

    fetchLichSan(formattedDateISO, sanBongList);
    fetchHistory();
    handleClearOrder();
    setActiveTab('pitch');
  };

  const handlePayOrder = async (invoiceToPay?: DonDatSanPOS, skipQRCheck: boolean = false) => {
    const getPaymentSuccessMsg = (extraText = '') => {
      if (paymentMethod === 'CHUYEN_KHOAN') {
        return `✅ Khách đã chuyển khoản thành công!${extraText ? ` (${extraText})` : ''}`;
      }
      return `💵 Đã thanh toán tiền mặt thành công!${extraText ? ` (${extraText})` : ''}`;
    };

    if (invoiceToPay) {
      try {
        if (invoiceToPay.id && !String(invoiceToPay.id).startsWith('temp_')) {
          await fetch(`${API_BASE_URL}/thanh-toan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ma_don_dat: Number(invoiceToPay.id),
              phuong_thuc: paymentMethod,
              loai_thanh_toan: 'TRA_HET',
              so_tien: (invoiceToPay.tien_san && (invoiceToPay.trang_thai === 'DA_THANH_TOAN' || (invoiceToPay as any).trang_thai_thanh_toan === 'DA_THANH_TOAN')) ? ((invoiceToPay.tong_tien || 0) - (invoiceToPay.tien_san || 0)) : (invoiceToPay.tong_tien || 0),
            }),
          });
        }
      } catch (err) {
        console.warn('Lỗi thanh toán đơn qua API:', err);
      }

      updateSyncOrderStatus(invoiceToPay.id, 'Đã thanh toán');
      setSelectedInvoiceDetail(null);
      fetchLichSan(formattedDateISO, sanBongList);
      fetchHistory();
      playNotificationChime();
      showToast(getPaymentSuccessMsg(`Đơn #${invoiceToPay.id}`), 'success', paymentMethod === 'CHUYEN_KHOAN' ? 'Chuyển Khoản Thành Công' : 'Thanh Toán Thành Công');
      return;
    }

    if (selectedPitches.length === 0 && selectedServices.length === 0) {
      showToast('Giỏ hàng đang trống! Vui lòng chọn sân hoặc dịch vụ trước khi thanh toán.', 'warning', 'Giỏ Hàng Trống');
      return;
    }

    const serviceItems: ServiceItemOrder[] = selectedServices.map((item, idx) => ({
      id: item.id || idx + 1,
      ten_dich_vu: item.ten_dich_vu,
      so_luong: item.so_luong,
      don_gia: item.don_gia,
      thanh_tien: item.don_gia * item.so_luong,
    }));

    const dichVuListPayload = selectedServices.map((s) => ({
      ma_dich_vu: s.id,
      so_luong: s.so_luong,
    }));

    // TRƯỜNG HỢP 1: BÁN LẺ DỊCH VỤ / NƯỚC UỐNG TẠI QUẦY (KHÔNG ĐẶT SÂN) - THANH TOÁN NGAY
    if (selectedPitches.length === 0 && selectedServices.length > 0 && !editingInvoiceId) {
      try {
        const res = await fetch(`${API_BASE_URL}/dat-san/ban-le-dich-vu`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ten_khach_hang: customerName.trim() || 'Khách lẻ quầy',
            so_dien_thoai: customerPhone.trim() || null,
            phuong_thuc: paymentMethod,
            ghi_chu: 'Bán lẻ dịch vụ / nước uống tại quầy (Đã thanh toán)',
            da_thanh_toan: true,
            dich_vu_list: dichVuListPayload,
          }),
        });
        const data = await res.json();
        if (data.success) {
          playNotificationChime();
          showToast(getPaymentSuccessMsg(`Đơn bán lẻ #${data.data?.id || ''}`), 'success', paymentMethod === 'CHUYEN_KHOAN' ? 'Chuyển Khoản Thành Công' : 'Thanh Toán Bán Lẻ');
        } else {
          showToast(data.message || 'Lỗi thanh toán bán lẻ', 'error');
        }
      } catch (err: any) {
        console.error('Lỗi thanh toán bán lẻ:', err);
      }
      fetchLichSan(formattedDateISO, sanBongList);
      fetchHistory();
      handleClearOrder();
      return;
    }

    // TRƯỜNG HỢP 2: CẬP NHẬT & THANH TOÁN CHO ĐƠN HIỆN CÓ / SÂN ĐANG ĐÁ (editingInvoiceId)
    if (editingInvoiceId && !String(editingInvoiceId).startsWith('temp_')) {
      try {
        const firstP = selectedPitches[0];
        const res = await fetch(`${API_BASE_URL}/dat-san/don-dat-thanh-toan/${editingInvoiceId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ma_nguoi_dung: currentUser?.id || 1,
            ten_khach_hang: customerName.trim(),
            so_dien_thoai: customerPhone.trim(),
            ma_san: firstP?.pitch.id || null,
            ngay_da: formattedDateISO,
            gio_bat_dau: (firstP?.startTime || '17:00').length === 5 ? `${firstP?.startTime}:00` : firstP?.startTime,
            gio_ket_thuc: (firstP?.endTime || '18:30').length === 5 ? `${firstP?.endTime}:00` : firstP?.endTime,
            tien_san: totalPitchPrice,
            tong_tien: grandTotal,
            ghi_chu: customerName ? `Khách: ${customerName} - ${customerPhone}` : 'Khách sân đang đá',
            trang_thai: 'DA_THANH_TOAN',
            phuong_thuc: paymentMethod,
            loai_thanh_toan: 'TRA_HET',
            so_tien: amountDueToPay,
            trang_thai_gd: 'THANH_CONG',
            dich_vu_list: dichVuListPayload,
          }),
        });
        const data = await res.json();
        if (data.success) {
          playNotificationChime();
          showToast(getPaymentSuccessMsg(`Đơn #${editingInvoiceId}`), 'success', paymentMethod === 'CHUYEN_KHOAN' ? 'Chuyển Khoản Thành Công' : 'Thanh Toán Thành Công');
        } else {
          showToast(data.message || 'Lỗi thanh toán đơn', 'error');
        }
      } catch (err: any) {
        console.error('Lỗi khi thanh toán đơn đang sửa:', err);
      }

      updateSyncOrderStatus(editingInvoiceId, 'Đã thanh toán', {
        ten_khach_hang: customerName.trim() || 'Khách vãng lai',
        so_dien_thoai: customerPhone.trim() || 'Chưa có SĐT',
        dich_vu: serviceItems,
        tong_tien: grandTotal,
        trang_thai: 'Đã thanh toán',
      });

      fetchLichSan(formattedDateISO, sanBongList);
      fetchHistory();
      handleClearOrder();
      setActiveTab('pitch');
      return;
    }

    // TRƯỜNG HỢP 3: TẠO ĐƠN ĐẶT SÂN MỚI VÀ THANH TOÁN (Từ Tab Home)
    try {
      const pitchesToPay = selectedPitches.length > 0
        ? selectedPitches
        : [{
            pitch: sanBongList[0],
            startTime: '17:00',
            endTime: '18:30',
            durationMin: 90,
            price: 0,
          }];

      for (let i = 0; i < pitchesToPay.length; i++) {
        const p = pitchesToPay[i];
        const isFirst = i === 0;
        const pitchDichVu = isFirst ? dichVuListPayload : [];
        const pitchGrandTotal = p.price + (isFirst ? totalServicePrice : 0);
        const pitchAmountToCharge = (isOrderFullyPaid && isFirst) ? totalServicePrice : pitchGrandTotal;

        await fetch(`${API_BASE_URL}/dat-san/don-dat-thanh-toan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ma_nguoi_dung: currentUser?.id || 1,
            ten_khach_hang: customerName.trim(),
            so_dien_thoai: customerPhone.trim(),
            ma_san: p.pitch.id,
            ngay_da: formattedDateISO,
            gio_bat_dau: p.startTime.length === 5 ? `${p.startTime}:00` : p.startTime,
            gio_ket_thuc: p.endTime.length === 5 ? `${p.endTime}:00` : p.endTime,
            tien_san: p.price,
            tong_tien: pitchGrandTotal,
            ghi_chu: customerName ? `Khách: ${customerName} - ${customerPhone}` : 'Khách thanh toán trực tiếp POS',
            trang_thai: 'DA_THANH_TOAN',
            phuong_thuc: paymentMethod,
            loai_thanh_toan: 'TRA_HET',
            so_tien: pitchAmountToCharge,
            trang_thai_gd: 'THANH_CONG',
            dich_vu_list: pitchDichVu,
          }),
        });
      }
    } catch (apiErr) {
      console.error('Lỗi khi thanh toán đơn qua API:', apiErr);
    }

    const firstPayPitch = selectedPitches[0];
    const payStart = firstPayPitch ? firstPayPitch.startTime : '17:00';
    const payEnd = firstPayPitch ? firstPayPitch.endTime : '18:30';

    const newId = Date.now();
    const paidOrder: DonDatSanPOS = {
      id: newId,
      ma_don_dat: `HD-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
      ten_khach_hang: customerName.trim() || 'Khách vãng lai',
      so_dien_thoai: customerPhone.trim() || 'Chưa có SĐT',
      ten_san: selectedPitches.length > 0 ? selectedPitches.map((s) => s.pitch.ten_san).join(', ') : 'Quầy nước / Dịch vụ',
      gio_bat_dau: payStart,
      gio_ket_thuc: payEnd,
      ngay_da: formattedDateISO,
      tien_san: totalPitchPrice,
      dich_vu: serviceItems,
      tong_tien: grandTotal,
      trang_thai: 'Đã thanh toán',
      ngay_tao: new Date().toISOString(),
    };
    addSyncOrder(paidOrder);
    playNotificationChime();
    showToast(getPaymentSuccessMsg(), 'success', paymentMethod === 'CHUYEN_KHOAN' ? 'Chuyển Khoản Thành Công' : 'Thanh Toán Thành Công');

    fetchLichSan(formattedDateISO, sanBongList);
    fetchHistory();
    handleClearOrder();
  };

  const handleAddMoreService = (invoice: any) => {
    if (!invoice) return;

    // 1. Nạp lại sân từ hóa đơn vào selectedPitches (cột Order đa sân)
    const startT = (invoice.gio_bat_dau || '').substring(0, 5) || '17:00';
    const endT = (invoice.gio_ket_thuc || '').substring(0, 5) || '18:30';
    const [sh, sm] = startT.split(':').map(Number);
    const [eh, em] = endT.split(':').map(Number);
    const durMin = Math.max(1, (eh * 60 + (em || 0)) - (sh * 60 + (sm || 0)));

    const matchedSan = sanBongList.find((s) => s.id === invoice.ma_san || s.ten_san === invoice.ten_san);
    const unitPrice = matchedSan ? Number(matchedSan.don_gia_phut) : 5000;
    const pitchPrice = Number(invoice.tien_san || (durMin * unitPrice));

    const targetPitch: SanBong = matchedSan || {
      id: Number(invoice.ma_san || invoice.id || 1),
      ma_loai_san: 1,
      ten_san: invoice.ten_san || 'Sân bóng',
      ten_loai: invoice.ten_loai || 'Sân bóng',
      don_gia_phut: unitPrice,
      trang_thai: 'SAN_SANG',
    };

    setSelectedPitches([
      {
        pitch: targetPitch,
        startTime: startT,
        endTime: endT,
        durationMin: durMin,
        price: pitchPrice,
      },
    ]);

    // 2. Nạp lại danh sách dịch vụ từ hóa đơn vào giỏ hàng
    const loadedSvc: SelectedServiceItem[] = [];
    const rawServices = invoice.chi_tiet_dich_vu || invoice.dich_vu_da_dung || invoice.dich_vu || [];
    if (Array.isArray(rawServices) && rawServices.length > 0) {
      rawServices.forEach((dv: any) => {
        loadedSvc.push({
          id: dv.id || dv.ma_dich_vu,
          ten_dich_vu: dv.ten_dich_vu || dv.name,
          so_luong: dv.so_luong || dv.quantity || 1,
          don_gia: Number(dv.don_gia || dv.price || 0),
          don_vi: dv.don_vi_tinh || dv.don_vi || 'Phần',
        });
      });
    }
    setSelectedServices(loadedSvc);

    // 3. Nạp thông tin khách hàng & lưu ID hóa đơn đang sửa
    setCustomerName(invoice.ten_khach_hang || '');
    setCustomerPhone(invoice.so_dien_thoai || '');
    const bookingId = invoice.ma_don_dat || invoice.id;
    setEditingInvoiceId(bookingId);

    const soTienDaTra = Number(invoice.so_tien_da_tra || 0);
    const tongTien = Number(invoice.tong_tien || pitchPrice);
    const rawStatus = (invoice.trang_thai || invoice.trang_thai_thanh_toan || '').toUpperCase().replace(/\s+/g, '_');
    const isPaid = (soTienDaTra > 0 && soTienDaTra >= tongTien);

    setLoadedBookingState({
      id: bookingId,
      ma_don_dat: bookingId,
      trang_thai: isPaid ? 'Đã thanh toán' : (soTienDaTra > 0 ? 'Đã cọc' : (rawStatus === 'DANG_DA' ? 'Đang đá' : 'Chờ thanh toán')),
      isPaid,
      so_tien_da_tra: soTienDaTra,
      tong_tien: tongTien,
      initialServices: JSON.parse(JSON.stringify(loadedSvc)),
      ten_san: invoice.ten_san,
      gio_da: `${startT} - ${endT}`,
      ngay_da: invoice.ngay_da,
    });

    // 4. Đóng chi tiết modal (nếu có) & chuyển sang Tab Dịch vụ với Cột Order tự động mở
    setSelectedInvoiceDetail(null);
    setActiveTab('services');
    showToast(`🛒 Đã mở giỏ hàng gọi dịch vụ cho ${invoice.ten_san || 'sân'}!`, 'info', 'Thêm Dịch Vụ');
  };

  const handleSelectBookingForPayment = (invoice: any) => {
    if (!invoice) return;

    // 1. Nạp lại sân từ hóa đơn vào selectedPitches (cột Order đa sân)
    const startT = (invoice.gio_bat_dau || '').substring(0, 5) || '17:00';
    const endT = (invoice.gio_ket_thuc || '').substring(0, 5) || '18:30';
    const [sh, sm] = startT.split(':').map(Number);
    const [eh, em] = endT.split(':').map(Number);
    const durMin = Math.max(1, (eh * 60 + (em || 0)) - (sh * 60 + (sm || 0)));

    const matchedSan = sanBongList.find((s) => s.id === invoice.ma_san || s.ten_san === invoice.ten_san);
    const unitPrice = matchedSan ? Number(matchedSan.don_gia_phut) : 5000;
    const pitchPrice = Number(invoice.tien_san || (durMin * unitPrice));

    const targetPitch: SanBong = matchedSan || {
      id: Number(invoice.ma_san || invoice.id || 1),
      ma_loai_san: 1,
      ten_san: invoice.ten_san || 'Sân bóng',
      ten_loai: invoice.ten_loai || 'Sân bóng',
      don_gia_phut: unitPrice,
      trang_thai: 'SAN_SANG',
    };

    setSelectedPitches([
      {
        pitch: targetPitch,
        startTime: startT,
        endTime: endT,
        durationMin: durMin,
        price: pitchPrice,
      },
    ]);

    // 2. Nạp lại danh sách dịch vụ từ hóa đơn vào giỏ hàng
    const loadedSvc: SelectedServiceItem[] = [];
    const rawServices = invoice.chi_tiet_dich_vu || invoice.dich_vu_da_dung || invoice.dich_vu || [];
    if (Array.isArray(rawServices) && rawServices.length > 0) {
      rawServices.forEach((dv: any) => {
        loadedSvc.push({
          id: dv.id || dv.ma_dich_vu,
          ten_dich_vu: dv.ten_dich_vu || dv.name,
          so_luong: dv.so_luong || dv.quantity || 1,
          don_gia: Number(dv.don_gia || dv.price || 0),
          don_vi: dv.don_vi_tinh || dv.don_vi || 'Phần',
        });
      });
    }
    setSelectedServices(loadedSvc);

    // 3. Nạp thông tin khách hàng & lưu ID hóa đơn đang sửa
    setCustomerName(invoice.ten_khach_hang || '');
    setCustomerPhone(invoice.so_dien_thoai || '');
    const bookingId = invoice.ma_don_dat || invoice.id;
    setEditingInvoiceId(bookingId);

    const soTienDaTra = Number(invoice.so_tien_da_tra || 0);
    const tongTien = Number(invoice.tong_tien || pitchPrice);
    const rawStatus = (invoice.trang_thai || invoice.trang_thai_thanh_toan || '').toUpperCase().replace(/\s+/g, '_');
    const isPaid = (soTienDaTra > 0 && soTienDaTra >= tongTien);

    setLoadedBookingState({
      id: bookingId,
      ma_don_dat: bookingId,
      trang_thai: isPaid ? 'Đã thanh toán' : (soTienDaTra > 0 ? 'Đã cọc' : (rawStatus === 'DANG_DA' ? 'Đang đá' : 'Chờ thanh toán')),
      isPaid,
      so_tien_da_tra: soTienDaTra,
      tong_tien: tongTien,
      initialServices: JSON.parse(JSON.stringify(loadedSvc)),
      ten_san: invoice.ten_san,
      gio_da: `${startT} - ${endT}`,
      ngay_da: invoice.ngay_da,
    });

    // 4. Chuyển sang Tab Home (Lịch đặt & POS) để thấy rõ Cột Thông tin Order
    setSelectedInvoiceDetail(null);
    setActiveTab('home');
    showToast(`💳 Đã chuyển đơn #${bookingId} sang Order để thanh toán!`, 'info', 'Thanh Toán Đơn');
  };

  // --- CÁC HÀM XỬ LÝ GIA HẠN THỜI GIAN SÂN ĐANG ĐÁ & CHUYỂN SÂN ĐÁ TIẾP ---
  const checkPitchExtension = async (bookingId: number | string, minutes: number) => {
    setIsCheckingExtend(true);
    try {
      const res = await fetch(`${API_BASE_URL}/dat-san/kiem-tra-gia-han`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ma_don_dat: Number(bookingId),
          so_phut_them: minutes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setExtendCheckResult(data.data);
      } else {
        setExtendCheckResult(null);
        showToast(data.message || 'Lỗi khi kiểm tra gia hạn sân!', 'error');
      }
    } catch (err: any) {
      console.error('Lỗi checkPitchExtension:', err);
      showToast('Lỗi kết nối máy chủ khi kiểm tra lịch sân!', 'error');
    } finally {
      setIsCheckingExtend(false);
    }
  };

  const handleOpenExtendModal = (booking: any) => {
    if (!booking) return;
    setExtendingBooking(booking);
    setExtendMinutes(30);
    setExtendCheckResult(null);
    setSelectedAlternativePitch(null);
    setExtendPayNow(false);
    setExtendPaymentMethod('TIEN_MAT');
    setIsExtendingModalOpen(true);
    checkPitchExtension(booking.ma_don_dat || booking.id, 30);
  };

  const handleChangeExtendMinutes = (minutes: number) => {
    setExtendMinutes(minutes);
    if (extendingBooking) {
      checkPitchExtension(extendingBooking.ma_don_dat || extendingBooking.id, minutes);
    }
  };

  const handleConfirmExtendSamePitch = async () => {
    if (!extendingBooking || !extendCheckResult) return;
    try {
      const res = await fetch(`${API_BASE_URL}/dat-san/xac-nhan-gia-han`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ma_don_dat: Number(extendingBooking.ma_don_dat || extendingBooking.id),
          so_phut_them: extendMinutes,
          da_thanh_toan_luon: extendPayNow,
          phuong_thuc: extendPaymentMethod,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || `⚽ Đã gia hạn thêm ${extendMinutes} phút cho sân thành công!`, 'success', 'Gia Hạn Thành Công');
        setIsExtendingModalOpen(false);
        fetchLichSan(formattedDateISO, sanBongList);
        fetchHistory();
      } else {
        showToast(data.message || 'Không thể gia hạn sân này!', 'error');
      }
    } catch (err: any) {
      console.error('Lỗi handleConfirmExtendSamePitch:', err);
      showToast('Lỗi khi xác nhận gia hạn!', 'error');
    }
  };

  const handleConfirmSwitchPitch = async () => {
    if (!extendingBooking || !selectedAlternativePitch || !extendCheckResult) return;
    try {
      const res = await fetch(`${API_BASE_URL}/dat-san/chuyen-san-da-tiep`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ma_don_cu: Number(extendingBooking.ma_don_dat || extendingBooking.id),
          ma_san_moi: Number(selectedAlternativePitch.id || selectedAlternativePitch.ma_san),
          gio_bat_dau: extendCheckResult.gio_ket_thuc_cu,
          gio_ket_thuc: extendCheckResult.gio_ket_thuc_moi,
          phuong_thuc: extendPaymentMethod,
          so_tien: extendPayNow ? selectedAlternativePitch.tien_san_du_kien : 0,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || '⚽ Đã chuyển khách sang sân khác đá tiếp thành công!', 'success', 'Chuyển Sân Mới');
        setIsExtendingModalOpen(false);
        fetchLichSan(formattedDateISO, sanBongList);
        fetchHistory();
      } else {
        showToast(data.message || 'Không thể chuyển sân!', 'error');
      }
    } catch (err: any) {
      console.error('Lỗi handleConfirmSwitchPitch:', err);
      showToast('Lỗi khi chuyển sân đá tiếp!', 'error');
    }
  };

  // Nạp thông tin đơn đặt sân trong ngày vào cột Order (Mục Sân Đang Đá)
  const handleSelectBookingToOrder = (invoice: any) => {
    if (!invoice) return;

    // 1. Nạp sân bóng vào selectedPitches
    const startT = (invoice.gio_bat_dau || '').substring(0, 5) || '17:00';
    const endT = (invoice.gio_ket_thuc || '').substring(0, 5) || '18:30';
    const [sh, sm] = startT.split(':').map(Number);
    const [eh, em] = endT.split(':').map(Number);
    const durMin = Math.max(1, (eh * 60 + (em || 0)) - (sh * 60 + (sm || 0)));

    const matchedSan = sanBongList.find((s) => s.id === invoice.ma_san || s.ten_san === invoice.ten_san);
    const unitPrice = matchedSan ? Number(matchedSan.don_gia_phut) : 5000;
    const pitchPrice = Number(invoice.tien_san || (durMin * unitPrice));

    const targetPitch: SanBong = matchedSan || {
      id: Number(invoice.ma_san || invoice.id || 1),
      ma_loai_san: 1,
      ten_san: invoice.ten_san || 'Sân bóng',
      ten_loai: invoice.ten_loai || 'Sân bóng',
      don_gia_phut: unitPrice,
      trang_thai: 'SAN_SANG',
    };

    setSelectedPitches([
      {
        pitch: targetPitch,
        startTime: startT,
        endTime: endT,
        durationMin: durMin,
        price: pitchPrice,
      },
    ]);

    // 2. Nạp dịch vụ đi kèm
    const loadedSvc: SelectedServiceItem[] = [];
    const rawServices = invoice.chi_tiet_dich_vu || invoice.dich_vu_da_dung || invoice.dich_vu || [];
    if (Array.isArray(rawServices) && rawServices.length > 0) {
      rawServices.forEach((dv: any) => {
        loadedSvc.push({
          id: dv.id || dv.ma_dich_vu,
          ten_dich_vu: dv.ten_dich_vu || dv.name,
          so_luong: dv.so_luong || dv.quantity || 1,
          don_gia: Number(dv.don_gia || dv.price || 0),
          don_vi: dv.don_vi_tinh || dv.don_vi || 'Phần',
        });
      });
    }
    setSelectedServices(loadedSvc);

    // 3. Nạp thông tin khách hàng & số tiền đã trả
    setCustomerName(invoice.ten_khach_hang || '');
    setCustomerPhone(invoice.so_dien_thoai || '');
    const bookingId = invoice.ma_don_dat || invoice.id;
    setEditingInvoiceId(bookingId);

    const soTienDaTra = Number(invoice.so_tien_da_tra || 0);
    const tongTien = Number(invoice.tong_tien || pitchPrice);
    const rawStatus = (invoice.trang_thai || '').toUpperCase().replace(/\s+/g, '_');
    const isPaid = (soTienDaTra > 0 && soTienDaTra >= tongTien) || 
      (!rawStatus.includes('DA_COC') && !rawStatus.includes('CHO') && (rawStatus.includes('DA_THANH_TOAN') || rawStatus.includes('THANH_TOAN') || rawStatus === 'HOAN_THANH'));

    setLoadedBookingState({
      id: bookingId,
      ma_don_dat: bookingId,
      trang_thai: isPaid ? 'Đã thanh toán' : (soTienDaTra > 0 ? 'Đã cọc' : 'Chờ thanh toán'),
      isPaid,
      so_tien_da_tra: soTienDaTra,
      tong_tien: tongTien,
      initialServices: JSON.parse(JSON.stringify(loadedSvc)),
      ten_san: invoice.ten_san,
      gio_da: `${startT} - ${endT}`,
      ngay_da: invoice.ngay_da,
    });

    setSelectedInvoiceDetail(null);
  };

  return (
    <>
      <Head>
        <title>Hệ Thống Quản Lý Lịch Sân Bóng & POS Thu Ngân - Management System</title>
        <meta name="description" content="Giao diện quản lý lịch đặt sân bóng và POS thu ngân bán hàng trực tiếp." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={`w-full h-screen flex flex-col overflow-hidden transition-colors duration-300 ${isDarkMode ? 'dark bg-[#0a0f18] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>

        {/* ==================== 1. HEADER CŨ TOÀN DIỆN ==================== */}
        <header className={`sticky top-0 z-40 w-full border-b backdrop-blur-xl transition-colors shrink-0 ${isDarkMode ? 'bg-[#0f172a]/95 border-slate-800 text-white' : 'bg-white/95 border-slate-200 text-slate-900'}`}>
          <div className="w-full px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

            {/* Cột trái: Logo & Dark/Light mode */}
            <div className="flex items-center gap-3">
              <div
                className="flex items-center gap-2.5 cursor-pointer"
                onClick={() => router.push('/')}
                title="Quay lại trang chủ"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-emerald-500/20">
                  <LandPlot className="w-6 h-6" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-sm font-black tracking-tight leading-none bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                    MANAGEMENT SYSTEM • POS
                  </h1>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Lịch Đặt Sân & POS Trực Tiếp
                  </p>
                </div>
              </div>

              {/* Toggle Dark/Light */}
              <button
                id="theme-toggle-btn"
                type="button"
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-200 active:scale-95 cursor-pointer ${isDarkMode
                  ? 'border-slate-700 bg-slate-800 text-amber-400 hover:bg-slate-700'
                  : 'border-slate-200 bg-slate-100 text-indigo-600 hover:bg-slate-200 shadow-sm'
                  }`}
                title={isDarkMode ? 'Chế độ Sáng' : 'Chế độ Tối'}
                aria-label="Toggle Dark/Light Mode"
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>


            </div>

            {/* Cụm giữa: Thanh tìm kiếm Tên khách hàng hoặc Số điện thoại (Thay thế điều hướng ngày) */}
            <div ref={customerSearchRef} className="relative flex-1 max-w-lg mx-2 sm:mx-6">
              <div className={`relative flex items-center gap-2 px-3 py-1.5 sm:py-2 rounded-2xl border transition-all duration-200 shadow-sm ${
                isDarkMode 
                  ? 'bg-slate-900/90 border-slate-700/80 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20' 
                  : 'bg-white border-slate-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20'
              }`}>
                <Search className="w-4 h-4 text-emerald-400 shrink-0" />
                
                <input
                  type="text"
                  placeholder="Tìm kiếm tên khách hàng hoặc số điện thoại..."
                  value={customerSearchQuery}
                  onChange={(e) => {
                    setCustomerSearchQuery(e.target.value);
                    setIsCustomerSearchOpen(true);
                  }}
                  onFocus={() => setIsCustomerSearchOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleApplyCustomSearch();
                    }
                  }}
                  className={`w-full bg-transparent text-xs font-semibold focus:outline-none placeholder:text-slate-400 ${
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}
                />

                {customerSearchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerSearchQuery('');
                    }}
                    className="p-1 rounded-full text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Xóa tìm kiếm"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleApplyCustomSearch}
                  className="px-3 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 text-xs font-black shrink-0 transition-all flex items-center gap-1 shadow-sm shadow-emerald-500/20 cursor-pointer"
                  title="Tìm & Gán vào Order POS"
                >
                  <span>Tìm</span>
                </button>
              </div>

              {/* Thông báo nhỏ đã áp dụng khách hàng */}
              {customerSearchAlert && (
                <div className="absolute left-0 top-full mt-1.5 z-50 px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-[11px] shadow-lg animate-in fade-in slide-in-from-top-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{customerSearchAlert}</span>
                </div>
              )}

              {/* Dropdown Gợi ý & Kết quả tìm kiếm khách hàng */}
              {isCustomerSearchOpen && (
                <div className={`absolute left-0 right-0 top-12 z-50 rounded-2xl border p-2 shadow-2xl backdrop-blur-2xl max-h-80 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 ${
                  isDarkMode ? 'bg-[#0f172a]/98 border-slate-700 text-white' : 'bg-white/98 border-slate-200 text-slate-900'
                }`}>
                  <div className="px-2.5 py-1.5 flex items-center justify-between border-b border-slate-700/50 mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Users className="w-3 h-3 text-emerald-400" />
                      {customerSearchQuery ? `Kết quả tìm kiếm (${filteredCustomers.length})` : 'Gợi ý khách hàng'}
                    </span>
                    {customerSearchQuery && (
                      <span className="text-[10px] text-slate-400">
                        Từ khóa: <strong className="text-emerald-400 font-mono">{customerSearchQuery}</strong>
                      </span>
                    )}
                  </div>

                  {filteredCustomers.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-400">
                      <p>Không tìm thấy khách hàng khớp với từ khóa.</p>
                      <button
                        type="button"
                        onClick={handleApplyCustomSearch}
                        className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-[11px] font-bold border border-emerald-500/30 transition-colors cursor-pointer"
                      >
                        + Dùng "{customerSearchQuery}" cho Order POS
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredCustomers.map((cust, idx) => (
                        <div
                          key={cust.id || `${cust.ho_ten}_${cust.so_dien_thoai}_${idx}`}
                          onClick={() => handleSelectCustomer(cust)}
                          className={`flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer group ${
                            isDarkMode 
                              ? 'hover:bg-slate-800/80 active:bg-slate-800' 
                              : 'hover:bg-slate-100 active:bg-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                              {cust.ho_ten?.charAt(0)?.toUpperCase() || <UserIcon className="w-4 h-4" />}
                            </div>
                            <div className="overflow-hidden">
                              <div className="font-bold text-xs truncate text-white flex items-center gap-1.5">
                                <span>{cust.ho_ten}</span>
                                {cust.vai_tro && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700 font-normal">
                                    {cust.vai_tro}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                                {cust.so_dien_thoai ? (
                                  <span className="font-mono text-emerald-400 flex items-center gap-1">
                                    <Phone className="w-2.5 h-2.5" />
                                    {cust.so_dien_thoai}
                                  </span>
                                ) : (
                                  <span className="italic text-slate-500 text-[10px]">Chưa có SĐT</span>
                                )}
                                {cust.source && (
                                  <span className="text-[9px] text-slate-500">• {cust.source}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectCustomer(cust);
                            }}
                            className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold transition-all shrink-0 cursor-pointer"
                          >
                            + Chọn Order
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cột phải: Chuông Thông Báo, Khung Lịch Dropdown & Tài khoản */}
            <div className="relative flex items-center gap-2.5">

              {/* Nút Chuông Thông Báo Tiền Vào / Biến Động */}
              <div className="relative">
                <button
                  id="notification-bell-btn"
                  type="button"
                  onClick={() => {
                    setIsNotificationOpen(!isNotificationOpen);
                    setIsCalendarOpen(false);
                  }}
                  className={`relative flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-200 active:scale-95 cursor-pointer ${
                    isNotificationOpen
                      ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-lg shadow-amber-500/30'
                      : isDarkMode
                        ? 'border-slate-700 bg-slate-800 text-amber-400 hover:bg-slate-700'
                        : 'border-slate-200 bg-white text-amber-500 hover:bg-slate-100 shadow-sm'
                  }`}
                  title="Thông báo chuyển tiền / hệ thống"
                  aria-label="Thông báo chuyển tiền"
                >
                  <Bell className="h-4 w-4" />
                  {unreadNotificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white ring-2 ring-slate-900 animate-pulse">
                      {unreadNotificationCount}
                    </span>
                  )}
                </button>

                {/* Dropdown Thông Báo */}
                {isNotificationOpen && (
                  <div
                    ref={notificationRef}
                    className={`absolute right-0 top-12 z-50 w-80 sm:w-96 rounded-2xl border p-3.5 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150 ${
                      isDarkMode ? 'bg-[#0f172a]/98 border-slate-700 text-white' : 'bg-white/98 border-slate-200 text-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-700 mb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                          <Bell className="w-3.5 h-3.5" />
                        </div>
                        <h4 className="font-bold text-xs">Thông Báo Tiền Vào & Biến Động</h4>
                      </div>
                      <div className="flex items-center gap-2 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))}
                          className="text-emerald-400 hover:underline cursor-pointer"
                        >
                          Đọc hết
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() => setNotifications([])}
                          className="text-rose-400 hover:underline cursor-pointer"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>

                    <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                      {notifications.length === 0 ? (
                        <div className="py-6 text-center text-slate-400 text-xs italic">
                          Chưa có thông báo chuyển tiền mới nào
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={`p-2.5 rounded-xl border text-xs transition-all ${
                              !notif.isRead
                                ? isDarkMode
                                  ? 'bg-amber-500/10 border-amber-500/30'
                                  : 'bg-amber-50 border-amber-200'
                                : isDarkMode
                                  ? 'bg-slate-900/60 border-slate-800'
                                  : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1 mb-1">
                              <span className="font-bold text-[11px] text-amber-300 flex items-center gap-1">
                                {notif.title}
                              </span>
                              <span className="text-[9px] text-slate-400 font-mono shrink-0">{notif.time}</span>
                            </div>
                            <p className="text-[11px] text-slate-300 leading-snug">
                              {notif.message}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Khung Lịch Toggle Button */}
              <button
                id="calendar-toggle-btn"
                type="button"
                onClick={() => {
                  setIsCalendarOpen(!isCalendarOpen);
                  setIsNotificationOpen(false);
                }}
                className={`flex h-9 px-3 items-center gap-1.5 rounded-xl border transition-all duration-200 active:scale-95 cursor-pointer ${isCalendarOpen
                  ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                  : isDarkMode
                    ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 shadow-sm'
                  }`}
                title="Xem lịch biểu"
                aria-label="Xem lịch biểu"
              >
                <CalendarIcon className="h-4 w-4 text-emerald-400" />
                <span className="hidden sm:inline text-xs font-bold">Lịch</span>
              </button>

              {/* Dropdown Lịch */}
              {isCalendarOpen && (
                <div
                  ref={calendarRef}
                  className={`absolute right-0 top-12 z-50 w-76 rounded-2xl border p-3.5 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150 ${isDarkMode ? 'bg-[#0f172a]/95 border-slate-700 text-white' : 'bg-white/95 border-slate-200 text-slate-900'
                    }`}
                >
                  <div className="mb-2.5 flex items-center justify-between border-b pb-2 border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-xs text-emerald-500">
                      {`Tháng ${calendarViewDate.getMonth() + 1}, ${calendarViewDate.getFullYear()}`}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMonthChange('prev')}
                        className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMonthChange('next')}
                        className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] text-slate-400 mb-1.5">
                    <span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span><span className="text-rose-500">CN</span>
                  </div>

                  <div className="grid grid-cols-7 gap-1 place-items-center">
                    {renderCalendarDays()}
                  </div>
                </div>
              )}

              {/* User badge */}
              {currentUser && (
                <div className={`hidden md:flex items-center gap-2 pl-2.5 border-l ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-xs">
                    {currentUser.ho_ten?.charAt(0) || 'U'}
                  </div>
                  <div className="text-left leading-tight">
                    <div className="text-[11px] font-bold truncate max-w-[110px]">{currentUser.ho_ten}</div>
                    <div className="text-[9px] text-emerald-400 font-mono font-bold uppercase">{getDisplayRole(currentUser)}</div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* ==================== 2. KHU VỰC NỘI DUNG CHÍNH (SPLIT-SCREEN 75% - 25%) ==================== */}
        <div className="flex-1 flex overflow-hidden">

          {/* ----------------- CỘT TRÁI (ĐỘNG: 75% KHI CÓ GIỎ HÀNG, 100% KHI ẨN GIỎ HÀNG) ----------------- */}
          <main className={`h-full overflow-y-auto p-4 sm:p-6 pb-6 space-y-6 transition-all duration-300 ${
            activeTab === 'home' || activeTab === 'services' ? 'w-[75%]' : 'w-full'
          }`}>

            {/* TAB 1: SÂN ĐANG ĐÁ (CURRENTLY PLAYING PITCHES) */}
            {activeTab === 'pitch' && (() => {
              const isBookingPaid = (b: any) => {
                if (!b) return false;
                const soTienDaTra = Number(b.so_tien_da_tra || 0);
                const tongTien = Number(b.tong_tien || b.tien_san || 0);
                if (soTienDaTra > 0 && soTienDaTra >= tongTien) return true;
                const st = (b.trang_thai || b.trang_thai_thanh_toan || '').toUpperCase().replace(/\s+/g, '_');
                if (st.includes('CHO') || st.includes('CHUA') || st.includes('TAM')) return false;
                if (st.includes('DA_HUY') || st.includes('HUY')) return false;
                return st.includes('DA_THANH_TOAN') || st.includes('THANH_TOAN') || st === 'HOAN_THANH';
              };

              return (
              <div className="space-y-5 animate-in fade-in duration-300">
                {/* Header Tab */}
                <div className={`p-5 rounded-2xl border shadow-lg ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center font-black shrink-0 relative shadow-inner">
                        <Activity className="w-6 h-6 animate-pulse" />
                        {currentlyPlayingPitches.length > 0 && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full animate-ping" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base sm:text-lg font-black leading-tight text-white">
                            Danh Sách Sân Đang Đá & Ca Đặt Trong Ngày
                          </h2>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            {currentlyPlayingPitches.length} Sân đang đá trực tiếp
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                          <span>Ngày: <strong className="text-emerald-400">{formatVietnameseDate(currentDate)}</strong></span>
                          <span>•</span>
                          <span>Thời gian hiện tại: <strong className="text-amber-400 font-mono">{new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</strong></span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Nút chuyển đổi Dạng Danh Sách (List) vs Dạng Lưới (Grid) */}
                      <div className="flex items-center p-1 rounded-xl bg-slate-950/80 border border-slate-700/80">
                        <button
                          type="button"
                          onClick={() => setPlayingViewMode('list')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            playingViewMode === 'list'
                              ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                              : 'text-slate-400 hover:text-white'
                          }`}
                          title="Hiển thị dạng bảng danh sách"
                        >
                          <List className="w-3.5 h-3.5" />
                          <span>Danh sách</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPlayingViewMode('grid')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            playingViewMode === 'grid'
                              ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                              : 'text-slate-400 hover:text-white'
                          }`}
                          title="Hiển thị dạng lưới thẻ"
                        >
                          <LayoutGrid className="w-3.5 h-3.5" />
                          <span>Lưới thẻ</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => fetchLichSan(formattedDateISO, sanBongList)}
                        className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          isDarkMode ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Cập nhật</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab('home')}
                        className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                      >
                        <CalendarCheck className="w-4 h-4" />
                        <span>Xem Lịch Đặt Sân (Home)</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 1. KHỐI SÂN ĐANG ĐÁ TRỰC TIẾP */}
                {currentlyPlayingPitches.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black text-rose-400 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                        Trận đấu đang diễn ra trực tiếp ({currentlyPlayingPitches.length})
                      </h3>
                    </div>

                    {playingViewMode === 'list' ? (
                      /* DẠNG LIST CHO SÂN ĐANG ĐÁ */
                      <div className="rounded-2xl border border-rose-500/30 bg-slate-900/90 overflow-hidden shadow-xl shadow-rose-950/10">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                                <th className="py-3 px-4">Mã Đơn</th>
                                <th className="py-3 px-4">Sân Bóng</th>
                                <th className="py-3 px-4">Khung Giờ</th>
                                <th className="py-3 px-4">Tiến Độ Trận Đấu</th>
                                <th className="py-3 px-4">Khách Hàng</th>
                                <th className="py-3 px-4 text-center">Thao Tác</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/80">
                              {currentlyPlayingPitches.map((item, idx) => {
                                const isPaid = isBookingPaid(item.booking);
                                const soTienDaTra = Number(item.booking?.so_tien_da_tra || 0);
                                const tongTien = Number(item.tong_tien || item.booking?.tong_tien || 0);
                                const unpaidAmount = isPaid ? 0 : Math.max(0, tongTien - soTienDaTra);
                                return (
                                  <tr key={item.san.id || idx} className="hover:bg-rose-500/5 transition-colors">
                                    <td className="py-3 px-4">
                                      <span className="px-2 py-0.5 rounded-md font-mono text-[11px] font-black bg-rose-500/15 text-rose-400 border border-rose-500/30">
                                        #{item.ma_don_dat}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4">
                                      <div className="font-bold text-white text-sm">{item.san.ten_san}</div>
                                      <span className="text-[10px] text-slate-400">{item.san.ten_loai || 'Sân bóng'}</span>
                                    </td>
                                    <td className="py-3 px-4">
                                      <div className="font-mono font-bold text-white flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5 text-rose-400" />
                                        <span>{item.gio_bat_dau} - {item.gio_ket_thuc}</span>
                                      </div>
                                    </td>
                                    <td className="py-3 px-4 min-w-[200px]">
                                      <div className="space-y-1">
                                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                          <div
                                            className="bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 h-full rounded-full transition-all duration-500"
                                            style={{ width: `${item.phan_tram_tien_do}%` }}
                                          />
                                        </div>
                                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 font-bold">
                                          <span>Đã đá: <strong className="text-emerald-400">{item.phut_da_da}p</strong></span>
                                          <span>Còn lại: <strong className="text-rose-400">{item.phut_con_lai}p</strong></span>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="py-3 px-4">
                                      <div className="font-bold text-white flex items-center gap-1.5">
                                        <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                                        <span>{item.ten_khach_hang}</span>
                                      </div>
                                      {item.so_dien_thoai && (
                                        <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 mt-0.5">
                                          <Phone className="w-3 h-3" /> {item.so_dien_thoai}
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                      <div className="flex items-center justify-center gap-1.5">
                                        {/* Nút + Dịch Vụ: Nạp dữ liệu vào Order và mở tab Dịch Vụ */}
                                        <button
                                          type="button"
                                          onClick={() => handleAddMoreService(item.booking)}
                                          className="py-1.5 px-2.5 rounded-lg bg-blue-600/25 hover:bg-blue-600 text-cyan-300 hover:text-white font-black text-xs border border-blue-500/40 transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                                          title="Tự động điền đơn vào Cột Order và mở gọi thêm dịch vụ"
                                        >
                                          <Plus className="w-3.5 h-3.5 text-cyan-300" />
                                          <span>Dịch Vụ</span>
                                        </button>

                                        {/* Nút + Thêm Giờ: Gia hạn thời gian hoặc đổi sân đá tiếp */}
                                        <button
                                          type="button"
                                          onClick={() => handleOpenExtendModal(item.booking)}
                                          className="py-1.5 px-2.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 font-black text-xs border border-amber-500/40 transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                                          title="Gia hạn thời gian đá hoặc chuyển sân khác đá tiếp"
                                        >
                                          <Clock className="w-3.5 h-3.5" />
                                          <span>Thêm Giờ</span>
                                        </button>

                                        {/* Nút Thanh Toán: Chỉ hiển thị khi đơn CHƯA thanh toán đủ hoặc Lưu tạm */}
                                        {!isPaid && (
                                          <button
                                            type="button"
                                            onClick={() => handleSelectBookingForPayment(item.booking)}
                                            className="py-1.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-md flex items-center gap-1 cursor-pointer"
                                            title="Chuyển đơn này sang Order để xem thông tin và thanh toán"
                                          >
                                            <CreditCard className="w-3.5 h-3.5" />
                                            <span>Thanh Toán</span>
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      /* DẠNG GRID CHO SÂN ĐANG ĐÁ */
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {currentlyPlayingPitches.map((item, idx) => {
                          const isPaid = isBookingPaid(item.booking);
                          const soTienDaTra = Number(item.booking?.so_tien_da_tra || 0);
                          const tongTien = Number(item.tong_tien || item.booking?.tong_tien || 0);
                          const unpaidAmount = isPaid ? 0 : Math.max(0, tongTien - soTienDaTra);
                          return (
                            <div
                              key={item.san.id || idx}
                              className={`p-5 rounded-2xl border transition-all duration-200 shadow-xl relative overflow-hidden ${
                                isDarkMode 
                                ? 'bg-slate-900/90 border-rose-500/40 hover:border-rose-500/70 shadow-rose-950/20' 
                                : 'bg-white border-rose-300 hover:border-rose-400 shadow-sm'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2 mb-3">
                                <div>
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-wider text-rose-400">
                                      Đang Đá Trực Tiếp
                                    </span>
                                  </div>
                                  <h3 className="font-extrabold text-base text-white">{item.san.ten_san}</h3>
                                  <span className="text-[10px] text-slate-400">{item.san.ten_loai || 'Sân bóng'}</span>
                                </div>

                                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-black border bg-rose-500/15 text-rose-400 border-rose-500/30">
                                  #{item.ma_don_dat}
                                </span>
                              </div>

                              <div className="my-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                                <div className="flex items-center justify-between text-[11px] font-bold">
                                  <span className="text-slate-400 flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 text-rose-400" /> Khung giờ:
                                  </span>
                                  <span className="text-white font-mono text-xs">{item.gio_bat_dau} - {item.gio_ket_thuc}</span>
                                </div>

                                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                  <div
                                    className="bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 h-full rounded-full transition-all duration-500"
                                    style={{ width: `${item.phan_tram_tien_do}%` }}
                                  />
                                </div>

                                <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-400">
                                  <span>Đã đá: <strong className="text-emerald-400">{item.phut_da_da} phút</strong></span>
                                  <span>Còn lại: <strong className="text-rose-400">{item.phut_con_lai} phút</strong></span>
                                </div>
                              </div>

                              <div className="space-y-1.5 py-2 text-xs text-slate-300">
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-400 flex items-center gap-1">
                                    <UserIcon className="w-3.5 h-3.5 text-emerald-400" /> Khách hàng:
                                  </span>
                                  <strong className="text-white truncate max-w-[150px]">{item.ten_khach_hang}</strong>
                                </div>

                                {item.so_dien_thoai && (
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-400 flex items-center gap-1">
                                      <Phone className="w-3.5 h-3.5 text-emerald-400" /> Số điện thoại:
                                    </span>
                                    <strong className="font-mono text-emerald-400">{item.so_dien_thoai}</strong>
                                  </div>
                                )}
                              </div>

                              <div className="mt-3.5 flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleAddMoreService(item.booking)}
                                  className="flex-1 py-2 px-1.5 rounded-xl bg-blue-600/25 hover:bg-blue-600 text-cyan-300 hover:text-white font-bold text-xs border border-blue-500/40 transition-all flex items-center justify-center gap-1 cursor-pointer"
                                  title="Tự động điền đơn vào Cột Order và mở gọi thêm dịch vụ"
                                >
                                  <Plus className="w-3.5 h-3.5 text-cyan-300" />
                                  <span>Dịch Vụ</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleOpenExtendModal(item.booking)}
                                  className="flex-1 py-2 px-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 font-bold text-xs border border-amber-500/40 transition-all flex items-center justify-center gap-1 cursor-pointer"
                                  title="Gia hạn thời gian đá hoặc chuyển sân khác đá tiếp"
                                >
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>+ Giờ</span>
                                </button>

                                {!isPaid && (
                                  <button
                                    type="button"
                                    onClick={() => handleSelectBookingForPayment(item.booking)}
                                    className="flex-1 py-2 px-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer"
                                    title="Chuyển đơn này sang Order để xem thông tin và thanh toán"
                                  >
                                    <CreditCard className="w-3.5 h-3.5" />
                                    <span>Thanh Toán</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {currentlyPlayingPitches.length === 0 && (
                  <div className={`p-10 rounded-2xl border text-center ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <Clock className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-60" />
                    <h3 className="text-base font-bold text-white">Hiện tại chưa có ca đặt sân nào đang thi đấu</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                      Bạn có thể chọn một ca đặt bên dưới để cho khách vào sân thi đấu.
                    </p>
                  </div>
                )}

                {/* 2. KHỐI CÁC CA ĐÃ ĐẶT VÀO NGÀY HÔM NAY */}
                <div className="space-y-3 pt-4 border-t border-slate-800/80">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                        <CalendarCheck className="w-4 h-4 text-amber-400" />
                        Danh sách các khách đã đặt vào ngày hôm nay - Chờ vào sân ({allTodayBookings.length})
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        👉 <strong>Nhấn vào một ca đặt</strong> để nạp sang <strong>Thông tin Order (mục Home)</strong> (Thanh toán đủ: bấm "VÀO SÂN" • Mới cọc 30%: bấm "LƯU" để vào sân trước trả sau hoặc "THANH TOÁN"), hoặc thao tác nhanh bằng nút bấm bên dưới. <em>Ca đặt sau khi vào sân sẽ tự động biến mất khỏi danh sách này.</em>
                      </p>
                    </div>
                  </div>

                  {allTodayBookings.length === 0 ? (
                    <div className={`p-8 rounded-2xl border text-center ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
                      <CalendarCheck className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
                      <p className="text-xs text-slate-300 font-bold">Tất cả ca đặt hôm nay đã vào sân thi đấu hoặc chưa có ca đặt mới.</p>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-xl">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                              <th className="py-3 px-4">Mã Đơn</th>
                              <th className="py-3 px-4">Khách Hàng</th>
                              <th className="py-3 px-4">Sân Bóng</th>
                              <th className="py-3 px-4">Khung Giờ</th>
                              <th className="py-3 px-4 text-right">Thanh Toán</th>
                              <th className="py-3 px-4 text-center">Trạng Thái</th>
                              <th className="py-3 px-4 text-center">Thao Tác</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/80">
                            {allTodayBookings.map((b, idx) => {
                              const bId = b.ma_don_dat || b.id || `POS-${idx + 1}`;
                              const isSelected = editingInvoiceId === bId;
                              const isPaid = isBookingPaid(b);
                              const soTienDaTra = Number(b.so_tien_da_tra || 0);
                              const tongTien = Number(b.tong_tien || b.tien_san || 0);
                              const unpaid = isPaid ? 0 : Math.max(0, tongTien - soTienDaTra);
                              const isPlaying = b.trang_thai === 'DANG_DA' || b.da_vao_san === 1 || b.da_vao_san === true;

                              return (
                                <tr
                                  key={bId}
                                  onClick={() => {
                                    handleSelectBookingToOrder(b);
                                    setActiveTab('home');
                                  }}
                                  className={`transition-colors cursor-pointer ${
                                    isSelected 
                                      ? 'bg-emerald-500/10 border-l-4 border-l-emerald-500' 
                                      : 'hover:bg-slate-800/50'
                                  }`}
                                  title="Nhấn để nạp thông tin đơn sang cột Thông tin Order bên mục Home"
                                >
                                  <td className="py-3 px-4">
                                    <span className="px-2 py-0.5 rounded-md font-mono text-[11px] font-black bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                      #{bId}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="font-bold text-white flex items-center gap-1.5">
                                      <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                                      <span>{b.ten_khach_hang || 'Khách đặt sân'}</span>
                                    </div>
                                    {b.so_dien_thoai && (
                                      <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 mt-0.5">
                                        <Phone className="w-3 h-3" /> {b.so_dien_thoai}
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="font-bold text-white">{b.ten_san}</div>
                                    <span className="text-[10px] text-slate-400">{b.ten_loai || 'Sân bóng'}</span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="font-mono font-bold text-white flex items-center gap-1">
                                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                                      <span>{(b.gio_bat_dau || '').substring(0, 5)} - {(b.gio_ket_thuc || '').substring(0, 5)}</span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    {isPaid || unpaid === 0 ? (
                                      <div className="flex flex-col items-end gap-0.5">
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                          ✓ Đã trả đủ 100%
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-mono">
                                          ({tongTien.toLocaleString('vi-VN')}đ)
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="flex flex-col items-end gap-0.5">
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                          Đã cọc 30%: {soTienDaTra.toLocaleString('vi-VN')}đ
                                        </span>
                                        <span className="text-[10px] text-rose-400 font-mono font-bold">
                                          Còn nợ: {unpaid.toLocaleString('vi-VN')}đ
                                        </span>
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    {isPlaying ? (
                                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse inline-flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                        Đang trong sân
                                      </span>
                                    ) : (
                                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                                        Chưa vào sân
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                      {!isPlaying && (
                                        isPaid || unpaid === 0 ? (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDirectCheckIn(b);
                                            }}
                                            className="py-1 px-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow flex items-center gap-1 cursor-pointer"
                                            title="Cho khách vào sân trực tiếp ngay"
                                          >
                                            <span>⚽ Vào sân</span>
                                          </button>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDirectCheckIn(b, 'DANG_DA');
                                            }}
                                            className="py-1 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow flex items-center gap-1 cursor-pointer"
                                            title="Lưu đơn vào Sân đang đá để khách đá trước thanh toán sau"
                                          >
                                            <Save className="w-3 h-3" />
                                            <span>Lưu vào sân</span>
                                          </button>
                                        )
                                      )}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleSelectBookingToOrder(b);
                                          setActiveTab('home');
                                        }}
                                        className="py-1 px-2.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                        title="Nạp vào cột Thông tin Order bên mục Home để thao tác"
                                      >
                                        <ShoppingBag className="w-3 h-3" />
                                        <span>Mở Order (Home)</span>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

            {/* TAB 2: DỊCH VỤ (SERVICES TỪ CSDL) */}
            {activeTab === 'services' && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className={`p-5 rounded-2xl border shadow-lg ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-black shrink-0">
                        <Shirt className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-base sm:text-lg font-black leading-tight text-white">Dịch Vụ Đi Kèm & Bán Nước Lẻ</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Quản lý nước uống, phụ kiện, thuê trang phục thi đấu từ cơ sở dữ liệu.</p>
                      </div>
                    </div>

                    {/* Nút thoát / chuyển tab nhanh */}
                    {editingInvoiceId ? (
                      <button
                        type="button"
                        onClick={() => setActiveTab('playing')}
                        className="py-1.5 px-3 rounded-xl bg-blue-500/15 hover:bg-blue-500 text-blue-400 hover:text-white border border-blue-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                      >
                        <LandPlot className="w-3.5 h-3.5" />
                        <span>Quay lại Sân Đang Đá</span>
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
                        🥤 Bán Lẻ Nước Tại Quầy
                      </span>
                    )}
                  </div>

                  {/* Banner hướng dẫn chi tiết theo ngữ cảnh */}
                  {editingInvoiceId ? (
                    <div className="mt-4 p-3.5 rounded-xl bg-blue-950/40 border border-blue-500/30 flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                      <div className="text-xs space-y-1">
                        <div className="font-black text-cyan-300">
                          Đang gọi thêm dịch vụ cho: <span className="text-white">{selectedPitches[0]?.pitch?.ten_san || 'Sân đang đá'}</span> (Khách: <span className="text-emerald-400">{customerName || 'Khách đá sân'}</span> - Đơn #{editingInvoiceId})
                        </div>
                        <p className="text-slate-300 leading-relaxed">
                          Chọn các món bên dưới để thêm vào cột Order. Nhấn <strong>"LƯU DỊCH VỤ"</strong> khi khách chưa cần thanh toán ngay (sẽ thanh toán khi kết thúc trận), hoặc nhấn <strong>"THANH TOÁN DỊCH VỤ"</strong> để thu tiền ngay (chọn Tiền mặt hoặc Chuyển khoản QR).
                        </p>
                      </div>
                    </div>
                  ) : selectedPitches.length === 0 ? (
                    <div className="mt-4 p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-3">
                      <ShoppingBag className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="text-xs space-y-1">
                        <div className="font-black text-emerald-300">
                          Chế độ Bán lẻ Dịch vụ / Nước uống tại quầy (Không cần đặt sân bóng)
                        </div>
                        <p className="text-slate-300 leading-relaxed">
                          Khách vãng lai mua nước uống hoặc phụ kiện lẻ: Chọn các món bên dưới, điều chỉnh số lượng ở cột bên phải rồi nhấn <strong>"LƯU ĐƠN LẺ"</strong> hoặc <strong>"THANH TOÁN BÁN LẺ"</strong>.
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>

                {dichVuList.length === 0 ? (
                  <div className={`p-16 rounded-2xl border text-center ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <Shirt className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-60" />
                    <h3 className="text-base font-bold text-white">Chưa có dịch vụ nào trong CSDL</h3>
                    <p className="text-xs text-slate-500 mt-1">Vui lòng kiểm tra lại bảng Dich_Vu trên hệ thống SQL Server.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {dichVuList.map((item) => (
                      <div key={item.id} className={`p-4 rounded-2xl border flex flex-col justify-between ${isDarkMode ? 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/40' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-emerald-400">{item.don_vi_tinh || 'Phần'}</span>
                            {item.ton_kho !== undefined && (
                              <span className="text-[10px] text-slate-400 font-mono">Kho: {item.ton_kho}</span>
                            )}
                          </div>
                          <h4 className="font-bold text-sm mb-1 text-white">{item.ten_dich_vu}</h4>
                          <div className="text-emerald-400 font-extrabold text-sm mb-3">
                            {Number(item.don_gia).toLocaleString('vi-VN')} VNĐ
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddServiceToCart(item)}
                          className="w-full py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Thêm Vào Giỏ Hàng POS</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: HÓA ĐƠN (INVOICES - CHỜ THANH TOÁN TỪ CSDL) */}
            {activeTab === 'invoices' && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className={`p-5 rounded-2xl border shadow-lg ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-black shrink-0">
                        <Receipt className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-base sm:text-lg font-black leading-tight text-white">Quản Lý Hóa Đơn Chờ Thanh Toán</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Bấm vào thẻ hóa đơn để mở Khung Chi Tiết, thêm dịch vụ và thanh toán.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                        <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-slate-400">Hình thức:</span>
                        <select
                          value={invoicesFilterPaymentMethod}
                          onChange={(e) => setInvoicesFilterPaymentMethod(e.target.value)}
                          className="bg-transparent font-bold text-emerald-400 focus:outline-none cursor-pointer"
                        >
                          <option value="ALL" className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>Tất cả</option>
                          <option value="TIEN_MAT" className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>💵 Tiền mặt</option>
                          <option value="CHUYEN_KHOAN" className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>📱 Chuyển khoản (VietQR)</option>
                        </select>
                      </div>

                      <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
                        {pendingInvoices.length} Đơn chờ thanh toán
                      </span>
                    </div>
                  </div>
                </div>

                {pendingInvoices.length === 0 ? (
                  <div className={`p-16 rounded-2xl border text-center ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-80" />
                    <h3 className="text-base font-bold text-white">Không có hóa đơn chờ thanh toán</h3>
                    <p className="text-xs text-slate-500 mt-1">Tất cả các đơn đặt sân và dịch vụ đều đã được thanh toán hoàn tất.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pendingInvoices.map((inv) => (
                      <div
                        key={inv.id || inv.ma_don_dat}
                        onClick={() => setSelectedInvoiceDetail(inv)}
                        className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 hover:border-amber-500/60 transition-all hover:scale-[1.01] cursor-pointer shadow-lg space-y-3 relative group select-none"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                          <span className="font-mono font-black text-amber-400 text-sm">#{inv.ma_don_dat || inv.id}</span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            Chờ thanh toán
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs text-slate-300">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-emerald-400" /> Giờ đặt / Ca:</span>
                            <strong className="text-white font-mono">{inv.gio_bat_dau} - {inv.gio_ket_thuc}</strong>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 flex items-center gap-1"><User className="w-3.5 h-3.5 text-emerald-400" /> Khách hàng:</span>
                            <span className="text-white font-bold">{inv.ten_khach_hang || 'Khách vãng lai'} {inv.so_dien_thoai ? `(${inv.so_dien_thoai})` : ''}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 flex items-center gap-1"><LandPlot className="w-3.5 h-3.5 text-emerald-400" /> Sân:</span>
                            <span className="text-emerald-400 font-bold">{inv.ten_san || 'Sân bóng'}</span>
                          </div>
                        </div>

                        <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between">
                          <span className="text-xs text-slate-400 font-medium">Tổng tiền:</span>
                          <span className="text-base font-black text-emerald-400 font-mono">
                            {Number(inv.tong_tien || inv.tien_san || 0).toLocaleString('vi-VN')} VNĐ
                          </span>
                        </div>

                        <div className="text-center text-[10px] text-amber-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                          👉 Bấm để xem chi tiết & thanh toán
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: LỊCH SỬ (HISTORY - ĐỒNG BỘ CSDL SQL SERVER) */}
            {activeTab === 'history' && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className={`p-5 rounded-2xl border shadow-lg ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-black shrink-0">
                        <Book className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-base sm:text-lg font-black leading-tight text-white">Lịch Sử Đặt Sân Toàn Hệ Thống</h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Hiển thị <strong className="text-emerald-400">{filteredHistoryList.length}</strong> đơn đặt • Dữ liệu CSDL SQL Server
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={fetchHistory}
                      disabled={isLoadingHistory}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${isDarkMode ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 shadow-sm'
                        }`}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHistory ? 'animate-spin text-emerald-400' : 'text-slate-400'}`} />
                      Làm mới
                    </button>
                  </div>

                  {/* Bộ lọc */}
                  <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-800/60">
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                      <Filter className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-slate-400">Trạng thái:</span>
                      <select
                        value={historyFilterStatus}
                        onChange={(e) => setHistoryFilterStatus(e.target.value)}
                        className="bg-transparent font-bold text-emerald-400 focus:outline-none cursor-pointer"
                      >
                        <option value="ALL" className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>Tất cả</option>
                        <option value="CHUA_THANH_TOAN" className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>Chờ thanh toán</option>
                        <option value="DA_THANH_TOAN" className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>Đã thanh toán</option>
                        <option value="DA_HUY" className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>Đã hủy</option>
                      </select>
                    </div>

                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                      <CalendarCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-slate-400">Ngày:</span>
                      <input
                        type="date"
                        value={historyFilterDate}
                        onChange={(e) => setHistoryFilterDate(e.target.value)}
                        className="bg-transparent font-bold text-emerald-400 focus:outline-none cursor-pointer text-xs"
                      />
                      {historyFilterDate && (
                        <button type="button" onClick={() => setHistoryFilterDate('')} className="text-slate-400 hover:text-rose-400 cursor-pointer">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                      <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-slate-400">Hình thức:</span>
                      <select
                        value={historyFilterPaymentMethod}
                        onChange={(e) => setHistoryFilterPaymentMethod(e.target.value)}
                        className="bg-transparent font-bold text-emerald-400 focus:outline-none cursor-pointer"
                      >
                        <option value="ALL" className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>Tất cả</option>
                        <option value="TIEN_MAT" className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>💵 Tiền mặt</option>
                        <option value="CHUYEN_KHOAN" className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>📱 Chuyển khoản (VietQR)</option>
                      </select>
                    </div>

                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs ${isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                      <Search className="w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Tìm tên khách, SĐT..."
                        value={historySearchKeyword}
                        onChange={(e) => setHistorySearchKeyword(e.target.value)}
                        className="bg-transparent focus:outline-none text-xs w-32 sm:w-40 text-white placeholder:text-slate-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Danh sách lịch sử hiển thị dạng LIST (TABLE LIST VIEW) */}
                <div className={`rounded-2xl border shadow-xl backdrop-blur-xl overflow-hidden ${
                  isDarkMode ? 'border-slate-800 bg-[#0f172a]/90' : 'border-slate-200 bg-white'
                }`}>
                  {filteredHistoryList.length === 0 ? (
                    <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="w-10 h-10 text-amber-500/80 mb-1" />
                      <p className="text-sm font-bold text-slate-300">Không tìm thấy đơn đặt sân nào phù hợp với bộ lọc!</p>
                      <p className="text-xs text-slate-500">Hãy thử xóa bộ lọc trạng thái, ngày hoặc từ khóa tìm kiếm.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className={`border-b ${
                            isDarkMode ? 'border-slate-800 bg-slate-950/80 text-slate-400' : 'border-slate-200 bg-slate-100/90 text-slate-600'
                          }`}>
                            <th className="py-3.5 px-4 font-black uppercase tracking-wider text-[11px] w-32">Mã Đơn</th>
                            <th className="py-3.5 px-4 font-black uppercase tracking-wider text-[11px] min-w-[200px]">Khách Hàng</th>
                            <th className="py-3.5 px-4 font-black uppercase tracking-wider text-[11px] min-w-[160px]">Sân Bóng</th>
                            <th className="py-3.5 px-4 font-black uppercase tracking-wider text-[11px] min-w-[160px]">Thời Gian Đá</th>
                            <th className="py-3.5 px-4 font-black uppercase tracking-wider text-[11px] min-w-[130px] text-right">Tổng Tiền</th>
                            <th className="py-3.5 px-4 font-black uppercase tracking-wider text-[11px] min-w-[140px] text-center">Trạng Thái</th>
                            <th className="py-3.5 px-4 font-black uppercase tracking-wider text-[11px] w-28 text-center">Thao Tác</th>
                          </tr>
                        </thead>

                        <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
                          {filteredHistoryList.map((item, idx) => {
                            const maDon = item.ma_don_dat || item.id || `HD-${idx + 1}`;
                            const isPaid = (item.trang_thai || '').toLowerCase().includes('thanh toan') || (item.trang_thai || '').toLowerCase().includes('thanh_toan') || item.trang_thai === 'DA_CHOT' || item.trang_thai === 'HOAN_THANH';
                            const isCancelled = (item.trang_thai || '').toLowerCase().includes('huy');

                            return (
                              <tr
                                key={item.id || `${maDon}_${idx}`}
                                onClick={() => setSelectedHistoryOrder(item)}
                                className={`group transition-all cursor-pointer ${
                                  isDarkMode 
                                    ? 'hover:bg-slate-800/50 active:bg-slate-800/70' 
                                    : 'hover:bg-slate-50 active:bg-slate-100'
                                }`}
                              >
                                {/* Mã Đơn */}
                                <td className="py-3 px-4 font-mono font-black text-emerald-400">
                                  #{maDon}
                                </td>

                                {/* Khách hàng */}
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                                      {item.ten_khach_hang?.charAt(0)?.toUpperCase() || <UserIcon className="w-4 h-4" />}
                                    </div>
                                    <div className="overflow-hidden">
                                      <div className={`font-bold truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                        {item.ten_khach_hang || 'Khách vãng lai'}
                                      </div>
                                      <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                                        <Phone className="w-2.5 h-2.5 text-emerald-400" />
                                        {item.so_dien_thoai || 'Chưa có SĐT'}
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                {/* Sân bóng */}
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-1.5 font-bold text-slate-200">
                                    <LandPlot className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                    <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>
                                      {item.ten_san || 'Sân bóng'}
                                    </span>
                                  </div>
                                </td>

                                {/* Thời gian & Ngày đá */}
                                <td className="py-3 px-4">
                                  <div className="font-mono font-bold text-slate-200 text-xs flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-emerald-400" />
                                    <span>
                                      {(item.gio_bat_dau || '').substring(0, 5)} - {(item.gio_ket_thuc || '').substring(0, 5)}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                                    <CalendarCheck className="w-2.5 h-2.5 text-slate-400" />
                                    <span>{(item.ngay_da || '').substring(0, 10)}</span>
                                  </div>
                                </td>

                                {/* Tổng tiền */}
                                <td className="py-3 px-4 text-right">
                                  <span className="font-mono font-black text-amber-400 text-sm">
                                    {Number(item.tong_tien || 0).toLocaleString('vi-VN')}đ
                                  </span>
                                </td>

                                {/* Trạng thái */}
                                <td className="py-3 px-4 text-center">
                                  {isCancelled ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                      ✕ Đã hủy
                                    </span>
                                  ) : isPaid ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                      ✓ Đã thanh toán
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                      ⏳ Chờ thanh toán
                                    </span>
                                  )}
                                </td>

                                {/* Thao tác */}
                                <td className="py-3 px-4 text-center">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedHistoryOrder(item);
                                    }}
                                    className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 border border-emerald-500/20 text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer active:scale-95 shadow-sm"
                                  >
                                    <span>Chi tiết</span>
                                    <ArrowRight className="w-3 h-3" />
                                  </button>
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
            )}

            {/* TAB 5: HOME (LỊCH ĐẶT SÂN & BẢNG MA TRẬN KHUNG GIỜ) */}
            {activeTab === 'home' && (
              <div className="space-y-4 animate-in fade-in duration-300">

                {/* Thanh Điều Khiển Bộ Lọc */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                      <Filter className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-slate-400">Loại Sân:</span>
                      <select
                        value={filterLoaiSan}
                        onChange={(e) => setFilterLoaiSan(e.target.value)}
                        className="bg-transparent font-bold text-emerald-400 focus:outline-none cursor-pointer"
                      >
                        <option value="ALL" className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>Tất cả loại sân</option>
                        {loaiSanList.map((ls) => (
                          <option key={ls.id} value={ls.ten_loai} className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>
                            {ls.ten_loai}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                      <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-slate-400">Sân:</span>
                      <select
                        value={filterSanId}
                        onChange={(e) => setFilterSanId(e.target.value)}
                        className="bg-transparent font-bold text-emerald-400 focus:outline-none cursor-pointer"
                      >
                        <option value="ALL" className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>
                          Tất cả sân ({sanBongList.length})
                        </option>
                        {sanBongList.map((san) => (
                          <option key={san.id} value={String(san.id)} className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>
                            {san.ten_san}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-md bg-emerald-500/30 border border-emerald-500/60" />
                      <span>Trống (Khả dụng)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-md bg-emerald-500 border border-emerald-400" />
                      <span>Đã chọn vào giỏ POS</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-md bg-rose-600/60 border border-rose-500" />
                      <span>Đã Đặt / Có Khách</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-md bg-amber-500/40 border border-amber-400" />
                      <span>Đang Giữ Chỗ</span>
                    </div>
                  </div>
                </div>

                {/* BẢNG LỊCH ĐẶT SÂN CŨ (MA TRẬN CUỘN NGANG) */}
                <div className={`overflow-x-auto rounded-2xl border shadow-xl backdrop-blur-xl ${isDarkMode ? 'border-slate-800 bg-[#0f172a]/90' : 'border-slate-200 bg-white'}`}>
                  {isLoadingData ? (
                    <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                      <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                      <p className="text-xs font-bold">Đang tải dữ liệu lịch đặt sân từ CSDL SQL Server...</p>
                    </div>
                  ) : filteredSanList.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                      <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                      <p className="text-sm font-bold">Không tìm thấy sân bóng nào phù hợp với bộ lọc!</p>
                    </div>
                  ) : availableTimeSlots.length === 0 ? (
                    <div className={`p-16 text-center rounded-2xl border border-dashed m-6 ${isDarkMode ? 'border-slate-800 bg-slate-900/30 text-slate-400' : 'border-slate-300 bg-slate-50 text-slate-600'}`}>
                      <Clock className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-60" />
                      <p className="text-base font-bold">
                        Tất cả các khung giờ trong ngày đã qua hoặc ngày đã chọn nằm trong quá khứ.
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Quý khách vui lòng chọn sang ngày tiếp theo để xem lịch sân và đặt chỗ!
                      </p>
                    </div>
                  ) : filteredSanList.length === 1 ? (
                    /* GIAO DIỆN 1 SÂN: CÁC Ô KHUNG GIỜ ĐỔ XUỐNG DƯỚI DẠNG GRID TIỆN LỢI */
                    (() => {
                      const san = filteredSanList[0];
                      return (
                        <div className="p-4 sm:p-6 space-y-4">
                          {/* Banner Thông Tin Sân Đã Chọn */}
                          <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg ${
                            isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                          }`}>
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-slate-950 font-black shadow-md shadow-emerald-500/25 shrink-0">
                                <LandPlot className="w-6 h-6" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2.5">
                                  <h3 className={`text-lg sm:text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                    {san.ten_san}
                                  </h3>
                                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                                    {san.ten_loai || 'Sân bóng'}
                                  </span>
                                </div>
                                <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                                  <span className="font-mono text-emerald-400 font-bold">
                                    {Number(san.don_gia_phut * 60).toLocaleString('vi-VN')}đ / giờ
                                  </span>
                                  <span>•</span>
                                  <span>Ngày xem: <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>{formattedDateISO}</strong></span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setFilterSanId('ALL');
                                  setFilterLoaiSan('ALL');
                                }}
                                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span>Xem tất cả sân</span>
                              </button>
                            </div>
                          </div>

                          {/* Tiêu đề danh sách ca giờ */}
                          <div className="flex items-center justify-between pt-1">
                            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                              <Clock className="w-4 h-4" /> Danh Sách Khung Giờ Sân ({availableTimeSlots.length} ca khả dụng)
                            </h4>
                            <span className="text-[11px] text-slate-400">Bấm ô xanh để thêm/bỏ chọn vào giỏ POS</span>
                          </div>

                          {/* Grid khung giờ đổ xuống nhiều cột responsive */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
                            {availableTimeSlots.map((slot) => {
                              const slotKey = `${san.id}_${slot.start}`;
                              const slotKeyRealtime = `${formattedDateISO}_${san.id}_${slot.start}`;
                              const slotData = gridSlots[slotKey];
                              const isBooked = slotData && slotData.trang_thai === 'DA_CHOT';

                              // Kiểm tra đơn từ hook useBookingSync (Real-time giả lập qua localStorage)
                              const matchedSyncOrder = syncOrders.find((order) => {
                                if (order.ngay_da !== formattedDateISO || order.trang_thai === 'Đã hủy') return false;
                                const matchSan = (order.ma_san && order.ma_san === san.id) ||
                                  (order.ten_san && (order.ten_san.includes(san.ten_san) || san.ten_san.includes(order.ten_san)));
                                if (!matchSan) return false;
                                return isTimeOverlapping(slot.start, slot.end, order.gio_bat_dau, order.gio_ket_thuc);
                              });

                              const isSyncPaid = matchedSyncOrder?.trang_thai === 'Đã thanh toán';
                              const isSyncPending = matchedSyncOrder?.trang_thai === 'Chờ thanh toán';

                              const slotIdInCart = `pitch_${san.id}_${slot.start}`;
                              const isSelectedInCart = selectedSlots.some((s) => s.id === slotIdInCart);
                              const isLockedByOther = lockedSlots.includes(slotKeyRealtime) && !isSelectedInCart;

                              if (isBooked || isSyncPaid) {
                                return (
                                  <button
                                    key={slot.start}
                                    type="button"
                                    onClick={() => {
                                      if (slotData) {
                                        setSelectedSlotDetail({ san, slot, slotData });
                                      } else if (matchedSyncOrder) {
                                        setSelectedInvoiceDetail(matchedSyncOrder as any);
                                      }
                                    }}
                                    className="w-full h-24 sm:h-28 p-2.5 rounded-2xl border border-rose-500/70 bg-gradient-to-b from-[#2a0b12] to-[#1a060b] text-rose-200 flex flex-col items-center justify-center gap-1.5 shadow-lg shadow-rose-950/40 hover:scale-[1.03] transition-all cursor-pointer select-none text-center group"
                                    title={`Đã đặt: ${slotData?.ten_khach_hang || matchedSyncOrder?.ten_khach_hang || 'Có khách'}`}
                                  >
                                    <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-rose-400 shrink-0" strokeWidth={2.2} />
                                    <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-rose-200">
                                      ĐÃ ĐẶT
                                    </span>
                                  </button>
                                );
                              }

                              if (isSyncPending) {
                                return (
                                  <div
                                    key={slot.start}
                                    onClick={() => matchedSyncOrder && setSelectedInvoiceDetail(matchedSyncOrder as any)}
                                    className="w-full h-24 sm:h-28 p-2.5 rounded-2xl border border-slate-700 bg-slate-900/90 text-slate-400 flex flex-col items-center justify-center gap-1 select-none cursor-pointer transition-all shadow-md"
                                    title={`Đang chờ thanh toán: ${matchedSyncOrder?.ten_khach_hang} (${matchedSyncOrder?.ma_don_dat})`}
                                  >
                                    <Clock className="w-5 h-5 text-amber-400" />
                                    <span className="text-xs font-bold text-amber-400 uppercase">
                                      CHỜ XÁC NHẬN
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      {slot.label}
                                    </span>
                                  </div>
                                );
                              }

                              if (isSelectedInCart) {
                                return (
                                  <button
                                    key={slot.start}
                                    type="button"
                                    onClick={() => handleToggleSlotFromMatrix(san, slot, slotData)}
                                    className="w-full h-24 sm:h-28 p-2.5 rounded-2xl border-2 border-emerald-300 bg-gradient-to-b from-emerald-500 to-teal-500 text-slate-950 flex flex-col items-center justify-center gap-1 shadow-xl shadow-emerald-500/30 ring-2 ring-emerald-400/50 scale-[1.03] transition-all cursor-pointer select-none text-center"
                                    title="Bấm để bỏ chọn khỏi giỏ hàng POS"
                                  >
                                    <span className="text-xs sm:text-sm font-black uppercase tracking-wider">
                                      TRONG GIỎ
                                    </span>
                                    <span className="text-xs sm:text-sm font-black font-mono">
                                      {slot.label}
                                    </span>
                                  </button>
                                );
                              }

                              if (isLockedByOther) {
                                return (
                                  <div
                                    key={slot.start}
                                    className="w-full h-24 sm:h-28 p-2.5 rounded-2xl border border-amber-500/40 bg-amber-950/40 text-amber-300 flex flex-col items-center justify-center gap-1 opacity-80 cursor-not-allowed select-none shadow-md text-center"
                                    title="Đang có khách giữ chỗ"
                                  >
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping mb-0.5" />
                                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                                      GIỮ CHỖ
                                    </span>
                                    <span className="text-[10px] text-amber-300/80 font-mono">
                                      {slot.label}
                                    </span>
                                  </div>
                                );
                              }

                              return (
                                <button
                                  key={slot.start}
                                  type="button"
                                  onClick={() => handleToggleSlotFromMatrix(san, slot, slotData)}
                                  className="w-full h-24 sm:h-28 p-2.5 rounded-2xl border border-emerald-500/50 bg-gradient-to-b from-[#0b241c]/90 to-[#061712]/90 hover:from-[#0e2e24] hover:to-[#081e17] hover:border-emerald-400 flex flex-col items-center justify-center gap-1 shadow-md hover:scale-[1.03] transition-all cursor-pointer select-none text-center group"
                                  title={`Trống: Bấm để chọn ${san.ten_san} ca ${slot.start} - ${slot.end}`}
                                >
                                  <span className="text-xs sm:text-sm font-black text-emerald-400 group-hover:text-emerald-300 uppercase tracking-wider">
                                    TRỐNG
                                  </span>
                                  <span className="text-xs sm:text-sm font-bold text-teal-300 font-mono">
                                    {slot.label}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <table className="w-full text-left border-collapse min-w-[2000px]">
                      <thead>
                        <tr className={`border-b ${isDarkMode ? 'border-slate-800 bg-slate-950/80' : 'border-slate-200 bg-slate-100'}`}>
                          <th className={`p-3.5 text-xs font-black uppercase tracking-wider w-60 sticky left-0 z-20 backdrop-blur-md shadow-lg ${isDarkMode ? 'text-slate-300 bg-slate-950/95 border-r border-slate-800' : 'text-slate-700 bg-slate-100/95 border-r border-slate-200'}`}>
                            Sân Bóng / Giờ Đá
                          </th>

                          {availableTimeSlots.map((slot) => (
                            <th
                              key={slot.start}
                              className={`p-2.5 text-center border-l min-w-[90px] ${isDarkMode ? 'border-slate-800/80' : 'border-slate-200'}`}
                            >
                              <div className={`text-xs font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                {slot.label}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                {slot.start} - {slot.end}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
                        {filteredSanList.map((san) => (
                          <tr
                            key={san.id}
                            className={isDarkMode ? 'hover:bg-slate-800/30 transition-colors' : 'hover:bg-slate-50 transition-colors'}
                          >
                            <td className={`p-3.5 sticky left-0 z-10 border-r backdrop-blur-md shadow-md ${isDarkMode ? 'bg-slate-900/95 border-slate-800/80' : 'bg-white/95 border-slate-200'}`}>
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                                <span className={`font-black text-xs sm:text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                  {san.ten_san}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                  {san.ten_loai || 'Sân bóng'}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {Number(san.don_gia_phut * 60).toLocaleString('vi-VN')}đ/h
                                </span>
                              </div>
                            </td>

                            {availableTimeSlots.map((slot) => {
                              const slotKey = `${san.id}_${slot.start}`;
                              const slotKeyRealtime = `${formattedDateISO}_${san.id}_${slot.start}`;
                              const slotData = gridSlots[slotKey];
                              const isBooked = slotData && slotData.trang_thai === 'DA_CHOT';

                              // Kiểm tra đơn từ hook useBookingSync (Real-time giả lập qua localStorage)
                              const matchedSyncOrder = syncOrders.find((order) => {
                                if (order.ngay_da !== formattedDateISO || order.trang_thai === 'Đã hủy') return false;
                                const matchSan = (order.ma_san && order.ma_san === san.id) ||
                                  (order.ten_san && (order.ten_san.includes(san.ten_san) || san.ten_san.includes(order.ten_san)));
                                if (!matchSan) return false;
                                return isTimeOverlapping(slot.start, slot.end, order.gio_bat_dau, order.gio_ket_thuc);
                              });

                              const isSyncPaid = matchedSyncOrder?.trang_thai === 'Đã thanh toán';
                              const isSyncPending = matchedSyncOrder?.trang_thai === 'Chờ thanh toán';

                              const slotIdInCart = `pitch_${san.id}_${slot.start}`;
                              const isSelectedInCart = selectedSlots.some((s) => s.id === slotIdInCart);
                              const isLockedByOther = lockedSlots.includes(slotKeyRealtime) && !isSelectedInCart;

                              return (
                                <td
                                  key={slot.start}
                                  className={`p-1.5 border-l text-center transition-colors ${isDarkMode ? 'border-slate-800/70' : 'border-slate-200'}`}
                                >
                                  {isBooked || isSyncPaid ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (slotData) {
                                          setSelectedSlotDetail({ san, slot, slotData });
                                        } else if (matchedSyncOrder) {
                                          setSelectedInvoiceDetail(matchedSyncOrder as any);
                                        }
                                      }}
                                      className="w-full h-20 sm:h-24 p-2 rounded-2xl border border-rose-500/70 bg-gradient-to-b from-[#2a0b12] to-[#1a060b] text-rose-200 flex flex-col items-center justify-center gap-1.5 shadow-lg shadow-rose-950/40 hover:scale-[1.03] transition-all cursor-pointer select-none text-center group"
                                      title={`Đã đặt: ${slotData?.ten_khach_hang || matchedSyncOrder?.ten_khach_hang || 'Có khách'}`}
                                    >
                                      <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-rose-400 shrink-0" strokeWidth={2.2} />
                                      <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-rose-200">
                                        ĐÃ ĐẶT
                                      </span>
                                    </button>
                                  ) : isSyncPending ? (
                                    <div
                                      onClick={() => matchedSyncOrder && setSelectedInvoiceDetail(matchedSyncOrder as any)}
                                      className="w-full h-20 sm:h-24 p-2 rounded-2xl border border-slate-700 bg-slate-900/90 text-slate-400 flex flex-col items-center justify-center gap-1 select-none cursor-pointer transition-all shadow-md"
                                      title={`Đang chờ thanh toán: ${matchedSyncOrder?.ten_khach_hang} (${matchedSyncOrder?.ma_don_dat})`}
                                    >
                                      <Clock className="w-5 h-5 text-amber-400" />
                                      <span className="text-xs font-bold text-amber-400 uppercase">
                                        CHỜ XÁC NHẬN
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-mono">
                                        {slot.label}
                                      </span>
                                    </div>
                                  ) : isSelectedInCart ? (
                                    <button
                                      type="button"
                                      onClick={() => handleToggleSlotFromMatrix(san, slot, slotData)}
                                      className="w-full h-20 sm:h-24 p-2 rounded-2xl border-2 border-emerald-300 bg-gradient-to-b from-emerald-500 to-teal-500 text-slate-950 flex flex-col items-center justify-center gap-1 shadow-xl shadow-emerald-500/30 ring-2 ring-emerald-400/50 scale-[1.03] transition-all cursor-pointer select-none text-center"
                                      title="Bấm để bỏ chọn khỏi giỏ hàng POS"
                                    >
                                      <span className="text-xs sm:text-sm font-black uppercase tracking-wider">
                                        TRONG GIỎ
                                      </span>
                                      <span className="text-xs sm:text-sm font-black font-mono">
                                        {slot.label}
                                      </span>
                                    </button>
                                  ) : isLockedByOther ? (
                                    <div
                                      className="w-full h-20 sm:h-24 p-2 rounded-2xl border border-amber-500/40 bg-amber-950/40 text-amber-300 flex flex-col items-center justify-center gap-1 opacity-80 cursor-not-allowed select-none shadow-md text-center"
                                      title="Đang có khách giữ chỗ"
                                    >
                                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping mb-0.5" />
                                      <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                                        GIỮ CHỖ
                                      </span>
                                      <span className="text-[10px] text-amber-300/80 font-mono">
                                        {slot.label}
                                      </span>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleToggleSlotFromMatrix(san, slot, slotData)}
                                      className="w-full h-20 sm:h-24 p-2 rounded-2xl border border-emerald-500/50 bg-gradient-to-b from-[#0b241c]/90 to-[#061712]/90 hover:from-[#0e2e24] hover:to-[#081e17] hover:border-emerald-400 flex flex-col items-center justify-center gap-1 shadow-md hover:scale-[1.03] transition-all cursor-pointer select-none text-center group"
                                      title={`Trống: Bấm để chọn ${san.ten_san} ca ${slot.start} - ${slot.end}`}
                                    >
                                      <span className="text-xs sm:text-sm font-black text-emerald-400 group-hover:text-emerald-300 uppercase tracking-wider">
                                        TRỐNG
                                      </span>
                                      <span className="text-xs sm:text-sm font-bold text-teal-300 font-mono">
                                        {slot.label}
                                      </span>
                                    </button>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

              </div>
            )}

          </main>

          {/* ----------------- CỘT PHẢI (25% / w-[25%]) - CHỈ HIỂN THỊ Ở TAB HOME & DỊCH VỤ ----------------- */}
          {(activeTab === 'home' || activeTab === 'services') && (
            <aside className="w-[25%] h-full border-l border-slate-700 bg-slate-800 flex flex-col justify-between p-4 select-none shadow-2xl z-30 shrink-0 animate-in fade-in duration-200 overflow-hidden">

              {/* 1. Header Order Sidebar */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-700 mb-2.5 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black shadow-inner">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white tracking-wide leading-tight">
                      Thông tin Order
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium">POS Quầy Thu Ngân</p>
                  </div>
                </div>

                {(selectedPitches.length > 0 || selectedServices.length > 0 || customerName) && (
                  <button
                    type="button"
                    onClick={handleClearOrder}
                    className="text-[11px] text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 px-2 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors cursor-pointer border border-rose-500/20"
                    title="Xóa toàn bộ thông tin đơn hiện tại"
                  >
                    <Trash2 className="w-3 h-3" /> Xóa hết
                  </button>
                )}
              </div>

              {/* 2. Scrollable Body: Danh sách sân + Dịch vụ + Form khách + Phương thức thanh toán */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0 custom-scrollbar text-xs">

                {/* --- A. KHỐI SÂN BÓNG ĐÃ CHỌN --- */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between px-0.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <LandPlot className="w-3.5 h-3.5 text-emerald-400" /> Sân đã chọn ({selectedPitches.length})
                    </span>
                    <span className="text-xs font-mono font-black text-emerald-400">
                      {totalPitchPrice.toLocaleString('vi-VN')}đ
                    </span>
                  </div>

                  {selectedPitches.length === 0 ? (
                    selectedServices.length > 0 ? (
                      <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-1">
                        <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-black text-xs">
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>🥤 ĐƠN BÁN LẺ DỊCH VỤ TẠI QUẦY</span>
                        </div>
                        <p className="text-[10px] text-slate-300 leading-relaxed">
                          Đơn bán tại quầy không đặt sân. Bấm <strong>LƯU ĐƠN LẺ</strong> để giữ đơn hoặc <strong>THANH TOÁN LẺ</strong> để thu tiền.
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-700/60 text-center space-y-1">
                        <div className="flex items-center justify-center gap-1.5 text-amber-400 font-bold text-xs">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Chưa chọn sân & giờ đá</span>
                        </div>
                        <p className="text-[10.5px] text-slate-400 leading-relaxed">
                          Nhấn vào ô giờ trống trên bảng lịch để chọn sân, hoặc sang tab <strong>Dịch vụ</strong> để bán lẻ nước tại quầy.
                        </p>
                      </div>
                    )
                  ) : (
                    <div className="space-y-2">
                      {selectedPitches.map((item) => (
                        <div
                          key={item.pitch.id}
                          className="p-2.5 rounded-2xl bg-slate-900/95 border border-emerald-500/50 space-y-2 shadow-md shadow-emerald-950/20"
                        >
                          {/* Tên sân + Loại + Nút xóa */}
                          <div className="flex items-center justify-between pb-1.5 border-b border-slate-700/80">
                            <div className="flex items-center gap-1.5 overflow-hidden">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                              <span className="font-black text-xs text-white truncate">{item.pitch.ten_san}</span>
                              <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0">
                                {item.pitch.ten_loai || 'Sân bóng'}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemovePitch(item.pitch.id)}
                              className="text-rose-400 hover:text-rose-300 p-1 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                              title="Xóa sân này khỏi đơn"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Ô nhập Giờ bắt đầu & Giờ kết thúc */}
                          <div className="grid grid-cols-2 gap-1.5">
                            <div>
                              <span className="text-[10px] text-slate-400 block mb-0.5 font-bold flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5 text-emerald-400" /> Bắt đầu:
                              </span>
                              <input
                                type="time"
                                value={item.startTime}
                                onChange={(e) => handleUpdatePitchTime(item.pitch.id, e.target.value, item.endTime)}
                                className="w-full px-2 py-1 rounded-lg border border-slate-700 bg-slate-950 text-white font-mono font-bold text-xs focus:outline-none focus:border-emerald-500"
                              />
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block mb-0.5 font-bold flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5 text-amber-400" /> Kết thúc:
                              </span>
                              <input
                                type="time"
                                value={item.endTime}
                                onChange={(e) => handleUpdatePitchTime(item.pitch.id, item.startTime, e.target.value)}
                                className="w-full px-2 py-1 rounded-lg border border-slate-700 bg-slate-950 text-white font-mono font-bold text-xs focus:outline-none focus:border-emerald-500"
                              />
                            </div>
                          </div>

                          {/* Thời lượng & Tiền sân */}
                          <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[10px] font-bold">
                            <span className="text-slate-400">
                              Thời lượng: <span className="text-amber-400 font-mono font-bold">{item.durationMin} phút</span>
                            </span>
                            <span className="text-emerald-400 font-mono font-black text-xs">
                              {item.price.toLocaleString('vi-VN')}đ
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* --- B. KHỐI DỊCH VỤ / NƯỚC UỐNG ĐÃ CHỌN --- */}
                <div className="space-y-1.5 pt-1 border-t border-slate-700/60">
                  <div className="flex items-center justify-between px-0.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Shirt className="w-3.5 h-3.5 text-emerald-400" /> Dịch vụ ({selectedServices.length})
                    </span>
                    <span className="text-xs font-mono font-black text-emerald-400">
                      {totalServicePrice.toLocaleString('vi-VN')}đ
                    </span>
                  </div>

                  {selectedServices.length === 0 ? (
                    <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/50 text-center text-slate-400 text-[11px] flex items-center justify-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />
                      <span>Chưa thêm dịch vụ (Bấm tab <strong>Dịch vụ</strong> để chọn)</span>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {selectedServices.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-900/90 border border-slate-700/90 hover:border-emerald-500/40 transition-colors"
                        >
                          <div className="overflow-hidden pr-2 flex-1">
                            <div className="font-bold text-white truncate text-xs">{item.ten_dich_vu}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                              <span>{item.don_gia.toLocaleString('vi-VN')}đ/{item.don_vi}</span>
                              <span className="text-emerald-400 font-bold">= {(item.don_gia * item.so_luong).toLocaleString('vi-VN')}đ</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Nút giảm */}
                            <button
                              type="button"
                              onClick={() => handleUpdateServiceQuantity(item.id, -1)}
                              className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-black cursor-pointer border border-slate-600 active:scale-95 transition-all"
                              title="Giảm số lượng"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            {/* Số lượng */}
                            <span className="w-5 text-center font-black text-emerald-400 font-mono text-xs">
                              {item.so_luong}
                            </span>
                            {/* Nút tăng */}
                            <button
                              type="button"
                              onClick={() => handleUpdateServiceQuantity(item.id, 1)}
                              className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-black cursor-pointer border border-slate-600 active:scale-95 transition-all"
                              title="Tăng số lượng"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            {/* Nút xóa */}
                            <button
                              type="button"
                              onClick={() => handleRemoveService(item.id)}
                              className="text-slate-500 hover:text-rose-400 p-1 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer ml-0.5"
                              title="Xóa dịch vụ này"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* --- C. THÔNG TIN KHÁCH HÀNG --- */}
                <div className="space-y-1.5 pt-1 border-t border-slate-700/60">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block px-0.5">
                    Khách hàng:
                  </span>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Tên khách hàng..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs focus:outline-none focus:border-emerald-500 placeholder:text-slate-500 font-medium"
                    />
                  </div>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Số điện thoại..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs focus:outline-none focus:border-emerald-500 placeholder:text-slate-500 font-medium font-mono"
                    />
                  </div>
                </div>

                {/* --- D. HÌNH THỨC THANH TOÁN (2 NÚT TO RÕ RÀNG: TIỀN MẶT & CHUYỂN KHOẢN) --- */}
                <div className="space-y-1.5 pt-1 border-t border-slate-700/60">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider px-0.5">
                    <span>Phương thức thanh toán:</span>
                    <span className={paymentMethod === 'TIEN_MAT' ? 'text-emerald-400 font-black' : 'text-blue-400 font-black'}>
                      {paymentMethod === 'TIEN_MAT' ? '💵 Tiền mặt' : '📱 Chuyển khoản QR'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Nút Tiền mặt */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('TIEN_MAT')}
                      className={`py-2.5 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        paymentMethod === 'TIEN_MAT'
                          ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-400 scale-[1.02]'
                          : 'bg-slate-900/90 text-slate-300 border border-slate-700 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Banknote className="w-4 h-4 shrink-0" />
                      <span>Tiền mặt</span>
                    </button>

                    {/* Nút Chuyển khoản */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CHUYEN_KHOAN')}
                      className={`py-2.5 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        paymentMethod === 'CHUYEN_KHOAN'
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 ring-2 ring-blue-400 scale-[1.02]'
                          : 'bg-slate-900/90 text-slate-300 border border-slate-700 hover:bg-slate-800 hover:text-white'
                      }`}
                      title="Thanh toán quét mã VietQR tự động"
                    >
                      <Smartphone className="w-4 h-4 shrink-0 text-cyan-300" />
                      <span>Chuyển khoản</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* 3. Footer Cột Phải: Tổng tiền & Nút Thao Tác (LƯU & THANH TOÁN / VÀO SÂN) */}
              <div className="pt-3 border-t border-slate-700 space-y-2.5 shrink-0">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Tiền sân:</span>
                    <div className="flex items-center gap-1.5">
                      {isOrderFullyPaid && (
                        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 rounded-md">
                          ✓ Đã thanh toán
                        </span>
                      )}
                      <span className="font-mono text-white font-bold">{totalPitchPrice.toLocaleString('vi-VN')}đ</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-slate-400">
                    <span>Tiền dịch vụ:</span>
                    <span className="font-mono text-white font-bold">{totalServicePrice.toLocaleString('vi-VN')}đ</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-300 font-bold pt-1 border-t border-slate-700/60">
                    <span>Tổng tiền hóa đơn:</span>
                    <span className="font-mono text-white font-black">{grandTotal.toLocaleString('vi-VN')}đ</span>
                  </div>

                  {/* Hiển thị số tiền đã trả rồi (CHỈ HIỂN THỊ KHI THỰC SỰ CÓ TIỀN ĐÃ TRẢ > 0) */}
                  {Number(loadedBookingState?.so_tien_da_tra || 0) > 0 && (
                    <div className="flex justify-between items-center text-emerald-400 font-bold">
                      <span className="flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Tiền đã trả rồi:
                      </span>
                      <span className="font-mono font-black">
                        -{Number(loadedBookingState?.so_tien_da_tra).toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-sm font-black pt-1.5 border-t border-slate-700">
                    <span className="text-white uppercase tracking-wider text-xs flex items-center gap-1">
                      {isOrderFullyPaid 
                        ? 'CẦN THANH TOÁN (DỊCH VỤ):' 
                        : (Number(loadedBookingState?.so_tien_da_tra || 0) > 0 ? 'CẦN THANH TOÁN (CÒN LẠI):' : 'TỔNG TIỀN PHẢI TRẢ:')}
                    </span>
                    <span className="text-amber-400 font-mono text-lg font-black tracking-tight drop-shadow-md">
                      {amountDueToPay.toLocaleString('vi-VN')} VNĐ
                    </span>
                  </div>
                </div>

                {/* Nếu khách đã thanh toán đủ và không mua thêm dịch vụ mới -> Hiển thị nút VÀO SÂN */}
                {isOrderFullyPaid && !hasAddedExtraServices ? (
                  <div className="pt-1 space-y-1.5">
                    <button
                      type="button"
                      onClick={handleCheckInPitch}
                      className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 active:scale-98 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer ring-2 ring-emerald-400/50"
                      title="Khách đã thanh toán đủ -> Bấm để cho khách nhận sân và bắt đầu đá"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span>⚽ VÀO SÂN</span>
                    </button>
                    <p className="text-[10px] text-emerald-400 text-center font-bold">
                      ✓ Đơn đã thanh toán đủ 100%. Nhấn "VÀO SÂN" để bắt đầu trận đấu.
                    </p>
                  </div>
                ) : (
                  /* Ngược lại (ví dụ chỉ mới thanh toán 30%): Hiển thị 2 nút LƯU & THANH TOÁN */
                  <div className="space-y-1.5 pt-0.5">
                    {hasAddedExtraServices && (
                      <div className="text-[10px] text-amber-300 text-center font-bold bg-amber-500/15 py-1 px-2 rounded-lg border border-amber-500/30 flex items-center justify-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>Có dịch vụ phát sinh thêm! Vui lòng lưu hoặc thanh toán.</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={handleSaveOrder}
                        className="w-full py-3 px-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        title="Lưu đơn hàng: đưa vào sân đang đá hoặc lưu đơn lẻ để khách thanh toán sau"
                      >
                        <Save className="w-4 h-4" />
                        <span>
                          {selectedPitches.length === 0 && selectedServices.length > 0
                            ? 'LƯU ĐƠN LẺ'
                            : (hasAddedExtraServices || editingInvoiceId ? 'LƯU DỊCH VỤ' : 'LƯU')}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handlePayOrder()}
                        className="w-full py-3 px-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        title="Thanh toán số tiền tương ứng (chọn Tiền mặt hoặc Chuyển khoản QR)"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>
                          {selectedPitches.length === 0 && selectedServices.length > 0
                            ? 'THANH TOÁN LẺ'
                            : (hasAddedExtraServices || editingInvoiceId ? 'THANH TOÁN' : 'THANH TOÁN')}
                        </span>
                      </button>
                    </div>

                    {Number(loadedBookingState?.so_tien_da_tra || 0) > 0 ? (
                      <p className="text-[10px] text-amber-400 text-center font-bold">
                        ℹ Khách đã cọc {Number(loadedBookingState?.so_tien_da_tra).toLocaleString('vi-VN')}đ (30%). Nhấn <strong>"LƯU"</strong> để đưa vào sân đang đá (thanh toán sau), hoặc <strong>"THANH TOÁN"</strong> để trả nốt.
                      </p>
                    ) : (loadedBookingState && !isOrderFullyPaid) ? (
                      <p className="text-[10px] text-amber-400 text-center font-bold">
                        ℹ Đơn chưa thanh toán tiền sân (đá trả sau). Nhấn <strong>"THANH TOÁN"</strong> để thu tiền khách ({amountDueToPay.toLocaleString('vi-VN')}đ).
                      </p>
                    ) : null}
                  </div>
                )}
              </div>

            </aside>
          )}

        </div>

        
{/* ==================== 3. MODAL CHI TIẾT SLOT LỊCH CŨ ==================== */}
        {selectedSlotDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
            <div className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl animate-in zoom-in-95 duration-200 ${isDarkMode ? 'bg-[#0f172a] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-black text-xs">
                    <CalendarCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm">{selectedSlotDetail.san.ten_san}</h3>
                    <p className="text-[11px] text-slate-400">{formatVietnameseDate(currentDate)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSlotDetail(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="my-4 space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/50 border border-slate-800">
                  <span className="text-slate-400">Khung giờ:</span>
                  <strong className="text-emerald-400 font-mono font-bold">{selectedSlotDetail.slot.start} - {selectedSlotDetail.slot.end} ({selectedSlotDetail.slot.label})</strong>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/50 border border-slate-800">
                  <span className="text-slate-400">Trạng thái:</span>
                  {selectedSlotDetail.slotData?.trang_thai === 'DA_CHOT' ? (
                    <span className="px-2.5 py-0.5 rounded-full font-bold text-rose-400 bg-rose-500/20 border border-rose-500/30">
                      ĐÃ ĐẶT SÂN
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full font-bold text-emerald-400 bg-emerald-500/20 border border-emerald-500/30">
                      SÂN TRỐNG (KHẢ DỤNG)
                    </span>
                  )}
                </div>

                {selectedSlotDetail.slotData?.trang_thai === 'DA_CHOT' && (
                  <>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/50 border border-slate-800">
                      <span className="text-slate-400">Tên khách hàng:</span>
                      <strong className="font-bold text-white">{selectedSlotDetail.slotData.ten_khach_hang}</strong>
                    </div>
                    {selectedSlotDetail.slotData.so_dien_thoai && (
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/50 border border-slate-800">
                        <span className="text-slate-400">Số điện thoại:</span>
                        <strong className="font-mono text-emerald-400">{selectedSlotDetail.slotData.so_dien_thoai}</strong>
                      </div>
                    )}
                    {selectedSlotDetail.slotData.ma_don_dat && (
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/50 border border-slate-800">
                        <span className="text-slate-400">Mã đơn đặt:</span>
                        <strong className="font-mono text-amber-400">#{selectedSlotDetail.slotData.ma_don_dat}</strong>
                      </div>
                    )}
                  </>
                )}

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/50 border border-slate-800">
                  <span className="text-slate-400">Đơn giá áp dụng:</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    {Number(selectedSlotDetail.san.don_gia_phut * 30).toLocaleString('vi-VN')}đ / 30 phút
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedSlotDetail(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 font-bold text-xs cursor-pointer"
                >
                  Đóng
                </button>
                {selectedSlotDetail.slotData?.trang_thai !== 'DA_CHOT' && (
                  <button
                    type="button"
                    onClick={() => {
                      handleToggleSlotFromMatrix(selectedSlotDetail.san, selectedSlotDetail.slot, selectedSlotDetail.slotData);
                      setSelectedSlotDetail(null);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 cursor-pointer"
                  >
                    + Chọn Vào Giỏ POS
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== 4. MODAL CHI TIẾT HÓA ĐƠN POS (MỚI) ==================== */}
        {selectedInvoiceDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-3xl border border-slate-700 bg-[#0f172a] text-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
              
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-black">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-base leading-tight">Chi Tiết Hóa Đơn #{selectedInvoiceDetail.ma_don_dat}</h3>
                    <p className="text-[11px] text-slate-400">Ngày tạo: {new Date(selectedInvoiceDetail.ngay_tao).toLocaleString('vi-VN')}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedInvoiceDetail(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="my-4 space-y-2.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Khách hàng:</span>
                    <strong className="text-white font-bold">{selectedInvoiceDetail.ten_khach_hang}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Số điện thoại:</span>
                    <strong className="text-emerald-400 font-mono">{selectedInvoiceDetail.so_dien_thoai}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Sân đặt:</span>
                    <strong className="text-white">{selectedInvoiceDetail.ten_san}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Khung giờ đá:</span>
                    <strong className="text-amber-400 font-mono">{selectedInvoiceDetail.gio_bat_dau} - {selectedInvoiceDetail.gio_ket_thuc} ({selectedInvoiceDetail.ngay_da})</strong>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Dịch Vụ Khách Đã Gọi:</h4>
                  {selectedInvoiceDetail.dich_vu.length === 0 ? (
                    <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-slate-500 italic">
                      Chưa có dịch vụ nào được gọi.
                    </div>
                  ) : (
                    <div className="rounded-xl border border-slate-800 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-900 border-b border-slate-800 text-slate-400">
                          <tr>
                            <th className="p-2.5">Tên món</th>
                            <th className="p-2.5 text-center">SL</th>
                            <th className="p-2.5 text-right">Đơn giá</th>
                            <th className="p-2.5 text-right">Thành tiền</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {selectedInvoiceDetail.dich_vu.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-900/40">
                              <td className="p-2.5 font-bold text-white">{item.ten_dich_vu}</td>
                              <td className="p-2.5 text-center font-mono font-bold text-emerald-400">x{item.so_luong}</td>
                              <td className="p-2.5 text-right font-mono text-slate-300">{item.don_gia.toLocaleString('vi-VN')}đ</td>
                              <td className="p-2.5 text-right font-mono font-bold text-emerald-400">{item.thanh_tien.toLocaleString('vi-VN')}đ</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between text-sm">
                  <span className="font-black text-slate-300">TỔNG TIỀN THANH TOÁN:</span>
                  <span className="font-black text-emerald-400 font-mono text-lg">{selectedInvoiceDetail.tong_tien.toLocaleString('vi-VN')} VNĐ</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => handleAddMoreService(selectedInvoiceDetail)}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600/20 hover:bg-blue-600 hover:text-white text-blue-400 font-bold text-xs border border-blue-500/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>THÊM DỊCH VỤ</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePayOrder(selectedInvoiceDetail)}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>THANH TOÁN</span>
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ==================== 6. MODAL CHI TIẾT HÓA ĐƠN LỊCH SỬ (READ-ONLY) ==================== */}
        {selectedHistoryOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900 text-white p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 select-none">
              
              {/* Header Modal */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-black">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">
                      Chi tiết Hóa đơn #{selectedHistoryOrder.ma_don_dat || selectedHistoryOrder.id}
                    </h3>
                    <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      ✓ ĐÃ THANH TOÁN
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedHistoryOrder(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Nội dung thông tin (Read-only) */}
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 text-xs">
                
                {/* Thông tin Khách hàng & Ngày giờ */}
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-emerald-400" /> Khách hàng:
                    </span>
                    <strong className="text-white font-bold text-sm">
                      {selectedHistoryOrder.ten_khach_hang || 'Khách vãng lai'}
                    </strong>
                  </div>
                  {selectedHistoryOrder.so_dien_thoai && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-400" /> Số điện thoại:
                      </span>
                      <strong className="text-emerald-400 font-mono">
                        {selectedHistoryOrder.so_dien_thoai}
                      </strong>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <CalendarCheck className="w-3.5 h-3.5 text-emerald-400" /> Ngày đá:
                    </span>
                    <strong className="text-slate-200 font-mono">
                      {selectedHistoryOrder.ngay_da?.substring(0, 10) || formattedDateISO}
                    </strong>
                  </div>
                </div>

                {/* Thông tin Sân bóng */}
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                  <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
                    <LandPlot className="w-3.5 h-3.5 text-emerald-400" /> Sân bóng đặt
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <div className="font-bold text-white text-sm">
                        {selectedHistoryOrder.ten_san || 'Sân bóng'}
                      </div>
                      <div className="text-slate-400 text-[11px] font-mono mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-400" />
                        Ca đá: {selectedHistoryOrder.gio_bat_dau?.substring(0, 5)} - {selectedHistoryOrder.gio_ket_thuc?.substring(0, 5)}
                      </div>
                    </div>
                    <span className="text-emerald-400 font-mono font-bold text-sm">
                      {selectedHistoryOrder.tien_san ? Number(selectedHistoryOrder.tien_san).toLocaleString('vi-VN') + 'đ' : ''}
                    </span>
                  </div>
                </div>

                {/* Thông tin Dịch vụ đã dùng (nếu có) */}
                {selectedHistoryOrder.dich_vu && selectedHistoryOrder.dich_vu.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2.5">
                    <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
                      <Shirt className="w-3.5 h-3.5 text-emerald-400" /> Dịch vụ đi kèm ({selectedHistoryOrder.dich_vu.length})
                    </div>
                    <div className="divide-y divide-slate-800/80">
                      {selectedHistoryOrder.dich_vu.map((dv: any, idx: number) => (
                        <div key={dv.id || idx} className="py-2 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-bold text-white">{dv.ten_dich_vu}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {dv.don_gia?.toLocaleString('vi-VN')}đ × {dv.so_luong}
                            </div>
                          </div>
                          <span className="text-emerald-400 font-mono font-bold">
                            {(dv.thanh_tien || dv.don_gia * dv.so_luong).toLocaleString('vi-VN')}đ
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tổng tiền thanh toán */}
                <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between">
                  <span className="font-black text-slate-300 text-xs">TỔNG TIỀN ĐÃ THANH TOÁN:</span>
                  <span className="font-black text-amber-400 font-mono text-lg">
                    {Number(selectedHistoryOrder.tong_tien || 0).toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>

              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedHistoryOrder(null)}
                  className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all cursor-pointer shadow-sm"
                >
                  ĐÓNG
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ==================== 7. MODAL LỊCH SỬ ĐẶT SÂN CỦA KHÁCH HÀNG (KHI TÌM KIẾM/CHỌN GỢI Ý) ==================== */}
        {isCustomerHistoryModalOpen && selectedCustomerForHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-2xl rounded-3xl border border-slate-700 bg-[#0f172a] text-white p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
              
              {/* Header Modal */}
              <div className="flex items-start justify-between pb-3.5 border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-black text-lg shadow-lg shadow-emerald-500/20 shrink-0">
                    {selectedCustomerForHistory.ho_ten?.charAt(0)?.toUpperCase() || <User className="w-6 h-6" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                        Lịch Sử Đặt Sân: {selectedCustomerForHistory.ho_ten}
                      </h3>
                      {selectedCustomerForHistory.vai_tro && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                          {selectedCustomerForHistory.vai_tro}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-400 flex items-center gap-3 mt-1">
                      {selectedCustomerForHistory.so_dien_thoai ? (
                        <span className="font-mono text-emerald-400 flex items-center gap-1 font-bold">
                          <Phone className="w-3 h-3" />
                          {selectedCustomerForHistory.so_dien_thoai}
                        </span>
                      ) : (
                        <span className="italic text-slate-500 text-[11px]">Chưa có số điện thoại</span>
                      )}
                      <span>•</span>
                      <span>Tổng cộng: <strong className="text-amber-400 font-bold">{customerHistoryList.length}</strong> đơn đặt</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCustomerHistoryModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Đóng modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Danh sách các đơn đặt của khách hàng */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {customerHistoryList.length === 0 ? (
                  <div className="p-8 rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 text-center space-y-3">
                    <CalendarCheck className="w-12 h-12 text-slate-500 mx-auto opacity-50" />
                    <div>
                      <h4 className="font-bold text-white text-sm">Chưa có lịch sử đặt sân trước đây</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        Khách hàng <strong>{selectedCustomerForHistory.ho_ten}</strong> chưa có dữ liệu đơn đặt nào trong hệ thống.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerName(selectedCustomerForHistory.ho_ten);
                        setCustomerPhone(selectedCustomerForHistory.so_dien_thoai || '');
                        setIsCustomerHistoryModalOpen(false);
                        setActiveTab('home');
                        setCustomerSearchAlert(`✓ Đã điền thông tin khách hàng ${selectedCustomerForHistory.ho_ten} vào Order!`);
                        setTimeout(() => setCustomerSearchAlert(null), 3500);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Bắt đầu tạo đơn mới cho khách này</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Chọn một đơn/ca đá bên dưới để tự động điền thông tin vào Order POS:</span>
                    </p>

                    {customerHistoryList.map((item, idx) => {
                      const isExpired = isBookingExpired(item);
                      const isPaid = (
                        item.trang_thai === 'Đã thanh toán' ||
                        item.trang_thai === 'DA_CHOT' ||
                        item.trang_thai === 'Đã chốt'
                      );
                      const isPending = (
                        item.trang_thai === 'Chờ thanh toán' ||
                        item.trang_thai === 'CHO_XAC_NHAN'
                      );

                      return (
                        <div
                          key={item.id || item.ma_don_dat || idx}
                          onClick={!isExpired ? () => handleSelectCustomerHistoryBookingToOrder(item) : undefined}
                          className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm ${
                            isExpired
                              ? 'bg-slate-950/60 border-slate-800/80 opacity-60 cursor-not-allowed'
                              : 'border-slate-800 bg-slate-900/80 hover:bg-slate-850 hover:border-emerald-500/60 cursor-pointer group'
                          }`}
                        >
                          <div className="space-y-1.5 overflow-hidden">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-extrabold text-sm ${isExpired ? 'text-slate-400' : 'text-white group-hover:text-emerald-300 transition-colors'}`}>
                                {item.ten_san || 'Sân bóng'}
                              </span>
                              <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                #{item.ma_don_dat || item.id || idx + 1}
                              </span>

                              {isExpired ? (
                                <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-rose-400" /> Đã qua giờ / Hết hạn
                                </span>
                              ) : isPaid ? (
                                <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Đã thanh toán
                                </span>
                              ) : isPending ? (
                                <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> Chờ thanh toán
                                </span>
                              ) : (
                                <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                  {item.trang_thai || 'Đang xử lý'}
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                              <span className={`flex items-center gap-1 font-mono ${isExpired ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                                <CalendarIcon className="w-3 h-3 text-emerald-400" />
                                {item.ngay_da ? String(item.ngay_da).substring(0, 10) : formattedDateISO}
                              </span>
                              <span className={`flex items-center gap-1 font-mono font-bold ${isExpired ? 'text-slate-500 line-through' : 'text-emerald-400'}`}>
                                <Clock className="w-3 h-3" />
                                {item.gio_bat_dau?.substring(0, 5)} - {item.gio_ket_thuc?.substring(0, 5)}
                              </span>
                            </div>

                            {/* Dịch vụ nếu có */}
                            {item.dich_vu && item.dich_vu.length > 0 && (
                              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 flex-wrap pt-0.5">
                                <Shirt className="w-3 h-3 text-emerald-400 shrink-0" />
                                <span>Dịch vụ:</span>
                                {item.dich_vu.map((dv: any, dvIdx: number) => (
                                  <span key={dvIdx} className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
                                    {dv.ten_dich_vu} (x{dv.so_luong})
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                            <div className="text-right">
                              <div className="text-[10px] text-slate-400">Tổng tiền:</div>
                              <div className={`text-sm sm:text-base font-black font-mono leading-tight ${isExpired ? 'text-slate-500' : 'text-amber-400'}`}>
                                {Number(item.tong_tien || item.tien_san || 0).toLocaleString('vi-VN')} VNĐ
                              </div>
                            </div>

                            {isExpired ? (
                              <button
                                type="button"
                                disabled
                                className="px-3 py-1.5 rounded-xl bg-slate-800/80 text-slate-500 font-bold text-xs border border-slate-700/60 cursor-not-allowed flex items-center gap-1"
                              >
                                <span>⌛ Đã hết hạn</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectCustomerHistoryBookingToOrder(item);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <span>⚡ Điền vào Order</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer Modal */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setCustomerName(selectedCustomerForHistory.ho_ten);
                    setCustomerPhone(selectedCustomerForHistory.so_dien_thoai || '');
                    setIsCustomerHistoryModalOpen(false);
                    setActiveTab('home');
                    setCustomerSearchAlert(`✓ Đã điền thông tin khách hàng ${selectedCustomerForHistory.ho_ten} vào Order!`);
                    setTimeout(() => setCustomerSearchAlert(null), 3500);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tạo đơn mới với khách này</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCustomerHistoryModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all cursor-pointer"
                >
                  ĐÓNG
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ==================== 5. MODAL VIETQR THANH TOÁN CHUYỂN KHOẢN CỐ ĐỊNH / ĐỘNG ==================== */}
        {isVietQRModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl animate-in zoom-in-95 duration-200 ${
              isDarkMode ? 'bg-[#0f172a] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}>
              {/* Header Modal */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-700 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black shadow-md shadow-blue-500/30">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-white">Mã Thanh Toán VietQR 24/7</h3>
                    <p className="text-[10px] text-emerald-400 font-bold">Quét mã bằng mọi App Ngân Hàng & Ví Điện Tử</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsVietQRModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Khung Ảnh VietQR & Chi tiết */}
              <div className="space-y-3.5">
                {/* Khung ảnh VietQR */}
                <div className="p-4 rounded-2xl bg-white flex flex-col items-center justify-center shadow-lg relative group border border-slate-200">
                  <div className="w-full flex items-center justify-between px-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-blue-900 text-white text-[10px] font-black">MB BANK</span>
                      <span className="text-[10px] font-bold text-slate-700">NAPAS 247</span>
                    </div>
                    <span className="text-xs font-black text-rose-600 tracking-wider">VietQR</span>
                  </div>

                  {/* Ảnh QR cố định VietQR từ Cloudinary */}
                  <div className="w-60 h-60 rounded-xl overflow-hidden bg-white flex items-center justify-center relative p-1 shadow-inner border border-slate-100">
                    <img
                      src="https://res.cloudinary.com/hpa8esqe/image/upload/v1790952754/vietqr-0816344504-1790952696098.png"
                      alt="VietQR Code Cố Định"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="mt-2 text-center w-full pt-1 border-t border-slate-100">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Số tiền cần thanh toán</div>
                    <div className="text-2xl font-black text-rose-600 font-mono">
                      {(amountDueToPay > 0 ? amountDueToPay : grandTotal).toLocaleString('vi-VN')} VNĐ
                    </div>
                  </div>
                </div>

                {/* Thông tin chuyển khoản chi tiết */}
                <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Ngân hàng:</span>
                    <strong className="text-white font-bold">MB Bank (Ngân Hàng Quân Đội)</strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Số tài khoản:</span>
                    <div className="flex items-center gap-1.5">
                      <strong className="text-emerald-400 font-mono font-bold text-sm">0816344504</strong>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText('0816344504');
                          alert('✓ Đã sao chép STK: 0816344504');
                        }}
                        className="text-slate-400 hover:text-emerald-400 p-0.5 cursor-pointer"
                        title="Sao chép STK"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Chủ tài khoản:</span>
                    <strong className="text-white font-bold uppercase">QUẢN LÝ SÂN BÓNG</strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Nội dung chuyển khoản:</span>
                    <div className="flex items-center gap-1.5">
                      <strong className="text-amber-300 font-mono font-bold">
                        POS{customerPhone ? `_${customerPhone.slice(-4)}` : ''}
                      </strong>
                      <button
                        type="button"
                        onClick={() => {
                          const content = `POS${customerPhone ? `_${customerPhone.slice(-4)}` : ''}`;
                          navigator.clipboard.writeText(content);
                          alert(`✓ Đã sao chép nội dung: ${content}`);
                        }}
                        className="text-slate-400 hover:text-amber-400 p-0.5 cursor-pointer"
                        title="Sao chép nội dung"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Nút Hành Động Xác Nhận */}
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={async () => {
                      const payAmount = amountDueToPay > 0 ? amountDueToPay : grandTotal;
                      setIsVietQRModalOpen(false);
                      await handlePayOrder(undefined, true);

                      // Kích hoạt âm thanh chuông báo nhận tiền
                      playNotificationChime();

                      // Gửi thông báo đến Chuông Bell Notification
                      const notif: POSNotification = {
                        id: `qr_${Date.now()}`,
                        title: '💰 Nhận Chuyển Khoản VietQR Thành Công!',
                        message: `Đã xác nhận nhận chuyển khoản ${payAmount.toLocaleString('vi-VN')}đ từ khách hàng ${customerName || 'Khách vãng lai'}.`,
                        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
                        isRead: false,
                        amount: payAmount,
                        type: 'payment',
                      };
                      setNotifications((prev) => [notif, ...prev.slice(0, 29)]);
                    }}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 active:scale-98 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>✓ XÁC NHẬN ĐÃ NHẬN ĐỦ TIỀN CHUYỂN KHOẢN</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsVietQRModalOpen(false)}
                    className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-bold text-xs transition-all cursor-pointer"
                  >
                    Đóng lại
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 5.5 MODAL GIA HẠN THỜI GIAN ĐÁ HOẶC ĐỔI SÂN ==================== */}
        {isExtendingModalOpen && extendingBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className={`w-full max-w-xl rounded-3xl border p-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col ${
              isDarkMode ? 'bg-[#0f172a] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}>
              {/* Header Modal */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-700 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/30">
                    <Clock className="w-5 h-5 text-slate-950" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-white">Gia Hạn / Đổi Sân Đá Tiếp</h3>
                    <p className="text-[11px] text-amber-400 font-bold">
                      {extendingBooking.ten_san || 'Sân đang đá'} • {extendingBooking.ten_khach_hang}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsExtendingModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body Modal */}
              <div className="flex-1 overflow-y-auto my-4 space-y-4 pr-1 custom-scrollbar text-xs">
                {/* 1. Thông tin giờ đá hiện tại */}
                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[10.5px]">Sân bóng hiện tại:</span>
                    <strong className="text-white text-sm font-black">{extendingBooking.ten_san}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10.5px]">Khách hàng:</span>
                    <strong className="text-emerald-400 font-bold">{extendingBooking.ten_khach_hang}</strong>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-slate-400 block text-[10.5px]">Khung giờ hiện tại:</span>
                    <strong className="text-amber-300 font-mono font-bold">
                      {extendingBooking.gio_bat_dau?.slice(0, 5)} - {extendingBooking.gio_ket_thuc?.slice(0, 5)}
                    </strong>
                  </div>
                </div>

                {/* 2. Chọn số phút muốn đá thêm */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" /> Chọn thời gian muốn đá thêm:
                    </span>
                    <span className="text-amber-400 font-mono font-black text-sm">+{extendMinutes} phút</span>
                  </div>

                  <div className="grid grid-cols-5 gap-1.5">
                    {[15, 30, 45, 60, 90].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => handleChangeExtendMinutes(mins)}
                        className={`py-2 px-1 rounded-xl font-bold text-xs transition-all cursor-pointer text-center ${
                          extendMinutes === mins
                            ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/25 ring-2 ring-amber-400 scale-[1.03]'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                        }`}
                      >
                        +{mins}p
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Tình trạng kiểm tra lịch */}
                {isCheckingExtend ? (
                  <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
                    <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-slate-400 text-xs font-medium">Đang kiểm tra lịch trống của sân và các sân khác...</p>
                  </div>
                ) : extendCheckResult ? (
                  <div className="space-y-3">
                    {/* TRƯỜNG HỢP 1: SÂN NÀY CÒN TRỐNG LỊCH -> CHO PHÉP GIA HẠN TẠI CHỖ */}
                    {extendCheckResult.co_the_gia_han === 1 ? (
                      <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 space-y-3">
                        <div className="flex items-start gap-2.5">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-extrabold text-sm text-emerald-300">
                              ✓ Sân {extendingBooking.ten_san} hoàn toàn trống lịch!
                            </h4>
                            <p className="text-slate-300 text-xs mt-0.5 leading-relaxed">
                              Khách có thể tiếp tục thi đấu trực tiếp trên sân này đến{' '}
                              <strong className="text-white font-mono">{extendCheckResult.gio_ket_thuc_moi}</strong>.
                            </p>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-900/90 border border-emerald-500/20 flex items-center justify-between">
                          <span className="text-slate-400">Tiền sân thêm ({extendMinutes} phút):</span>
                          <span className="text-emerald-400 font-mono font-black text-sm">
                            +{Number(extendCheckResult.tien_san_them || 0).toLocaleString('vi-VN')} VNĐ
                          </span>
                        </div>

                        {/* Tùy chọn thanh toán */}
                        <div className="space-y-2 pt-1 border-t border-emerald-500/20">
                          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-300">
                            <input
                              type="checkbox"
                              checked={extendPayNow}
                              onChange={(e) => setExtendPayNow(e.target.checked)}
                              className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                            />
                            <span>Khách muốn thanh toán luôn số tiền giờ đá thêm này</span>
                          </label>

                          {extendPayNow && (
                            <div className="grid grid-cols-2 gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setExtendPaymentMethod('TIEN_MAT')}
                                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                  extendPaymentMethod === 'TIEN_MAT'
                                    ? 'bg-emerald-500 text-slate-950 font-black shadow-md ring-2 ring-emerald-400'
                                    : 'bg-slate-900 text-slate-300 border border-slate-700'
                                }`}
                              >
                                <Banknote className="w-3.5 h-3.5" />
                                <span>Tiền mặt</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setExtendPaymentMethod('CHUYEN_KHOAN')}
                                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                  extendPaymentMethod === 'CHUYEN_KHOAN'
                                    ? 'bg-blue-600 text-white font-black shadow-md ring-2 ring-blue-400'
                                    : 'bg-slate-900 text-slate-300 border border-slate-700'
                                }`}
                              >
                                <Smartphone className="w-3.5 h-3.5" />
                                <span>Chuyển khoản QR</span>
                              </button>
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={handleConfirmExtendSamePitch}
                          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>⚽ Xác Nhận Gia Hạn Thêm {extendMinutes} Phút (Sân Này)</span>
                        </button>
                      </div>
                    ) : (
                      /* TRƯỜNG HỢP 2: SÂN NÀY BỊ TRÙNG LỊCH -> YÊU CẦU ĐỔI SANG SÂN KHÁC */
                      <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/50 space-y-3">
                        <div className="flex items-start gap-2.5">
                          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-extrabold text-sm text-rose-300">
                              ⚠️ Sân {extendingBooking.ten_san} đã có người đặt lúc {extendCheckResult.trung_luc}!
                            </h4>
                            <p className="text-slate-300 text-xs mt-0.5 leading-relaxed">
                              Không thể gia hạn trực tiếp trên sân này. Vui lòng chuyển khách sang sân khác còn trống để đá tiếp ({extendCheckResult.gio_ket_thuc_cu} - {extendCheckResult.gio_ket_thuc_moi}).
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2 pt-1 border-t border-rose-500/20">
                          <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px] block">
                            Danh sách sân khác còn trống trong khung giờ này:
                          </span>

                          {!extendCheckResult.san_thay_the || extendCheckResult.san_thay_the.length === 0 ? (
                            <div className="p-3 rounded-xl bg-slate-900/80 text-center text-slate-400">
                              Rất tiếc! Hiện không có sân nào khác còn trống trong khung giờ này.
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {extendCheckResult.san_thay_the.map((pitch: any) => {
                                const isSelected = selectedAlternativePitch?.ma_san === pitch.ma_san;
                                return (
                                  <div
                                    key={pitch.ma_san}
                                    onClick={() => setSelectedAlternativePitch(pitch)}
                                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                      isSelected
                                        ? 'bg-blue-950/70 border-blue-400 ring-2 ring-blue-500 shadow-md'
                                        : 'bg-slate-900/90 border-slate-700/80 hover:border-slate-500'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'
                                      }`}>
                                        <LandPlot className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <div className="font-black text-white text-xs">{pitch.ten_san}</div>
                                        <div className="text-[10.5px] text-slate-400">{pitch.ten_loai || 'Sân bóng'} • {Number(pitch.gia_co_ban).toLocaleString('vi-VN')}đ/h</div>
                                      </div>
                                    </div>

                                    <div className="text-right">
                                      <div className="text-emerald-400 font-mono font-black text-xs">
                                        +{Number(pitch.tien_san_du_kien || 0).toLocaleString('vi-VN')}đ
                                      </div>
                                      <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded ${
                                        isSelected ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'
                                      }`}>
                                        {isSelected ? '✓ Đã chọn sân này' : 'Bấm để chọn'}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {selectedAlternativePitch && (
                          <div className="space-y-2 pt-2 border-t border-slate-800">
                            {/* Tùy chọn thanh toán */}
                            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-300">
                              <input
                                type="checkbox"
                                checked={extendPayNow}
                                onChange={(e) => setExtendPayNow(e.target.checked)}
                                className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                              />
                              <span>Khách thanh toán luôn tiền sân mới (Ngược lại: thanh toán sau khi đá xong)</span>
                            </label>

                            {extendPayNow && (
                              <div className="grid grid-cols-2 gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setExtendPaymentMethod('TIEN_MAT')}
                                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                    extendPaymentMethod === 'TIEN_MAT'
                                      ? 'bg-emerald-500 text-slate-950 font-black shadow-md ring-2 ring-emerald-400'
                                      : 'bg-slate-900 text-slate-300 border border-slate-700'
                                  }`}
                                >
                                  <Banknote className="w-3.5 h-3.5" />
                                  <span>Tiền mặt</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setExtendPaymentMethod('CHUYEN_KHOAN')}
                                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                    extendPaymentMethod === 'CHUYEN_KHOAN'
                                      ? 'bg-blue-600 text-white font-black shadow-md ring-2 ring-blue-400'
                                      : 'bg-slate-900 text-slate-300 border border-slate-700'
                                  }`}
                                >
                                  <Smartphone className="w-3.5 h-3.5" />
                                  <span>Chuyển khoản QR</span>
                                </button>
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={handleConfirmSwitchPitch}
                              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                            >
                              <ArrowRightLeft className="w-4 h-4" />
                              <span>🔄 Chuyển Khách Sang {selectedAlternativePitch.ten_san} Đá Tiếp (Tạo Đơn Mới)</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              {/* Footer Modal */}
              <div className="pt-3 border-t border-slate-700 flex justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setIsExtendingModalOpen(false)}
                  className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs transition-all cursor-pointer"
                >
                  HỦY BỎ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 6. NÚT CÀI ĐẶT FLOATING ==================== */}
        <div className="fixed bottom-24 left-6 z-50" ref={settingsRef}>
          <button
            id="settings-floating-btn"
            type="button"
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`flex h-11 w-11 items-center justify-center rounded-full border shadow-2xl transition-all duration-300 active:scale-95 cursor-pointer ${
              isSettingsOpen
                ? 'bg-emerald-500 border-emerald-400 text-slate-950 rotate-90 scale-105 shadow-emerald-500/30'
                : isDarkMode
                  ? 'border-slate-700 bg-slate-800/90 backdrop-blur-xl text-slate-200 hover:bg-slate-700 hover:border-emerald-500/50 hover:text-emerald-400 shadow-slate-900/60'
                  : 'border-slate-200 bg-white/95 backdrop-blur-xl text-slate-700 hover:bg-slate-100 hover:border-emerald-500 hover:text-emerald-600 shadow-lg'
            }`}
            title="Cài đặt & Tài khoản"
            aria-label="Cài đặt & Tài khoản"
          >
            <Settings className="h-5 w-5" />
          </button>

          {/* Popup Cài đặt & Tài khoản (Mở hướng lên trên) */}
          {isSettingsOpen && (
            <div className={`absolute bottom-14 left-0 w-64 rounded-2xl border p-4 shadow-2xl backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95 duration-200 ${isDarkMode ? 'bg-[#0f172a]/95 border-slate-700 text-white' : 'bg-white/95 border-slate-200 text-slate-900'
              }`}>
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cài Đặt & Tài Khoản</span>
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {currentUser ? (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-xs">
                      {currentUser.ho_ten?.charAt(0) || 'U'}
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold truncate">{currentUser.ho_ten}</div>
                      <div className="text-[10px] text-emerald-400 font-mono font-bold uppercase">{getDisplayRole(currentUser)}</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsSettingsOpen(false);
                      router.push('/');
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 py-2 px-3 text-xs font-bold border border-slate-700 transition-all cursor-pointer shadow-sm"
                  >
                    <Globe className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Quay lại Website</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 py-2 px-3 text-xs font-bold border border-rose-500/25 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    id="login-btn"
                    type="button"
                    onClick={() => {
                      setIsLoginModalOpen(true);
                      setIsSettingsOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 py-2.5 px-3 text-xs font-black shadow-lg shadow-emerald-500/25 transition-all duration-200 active:scale-95 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Đăng nhập hệ thống</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsSettingsOpen(false);
                      router.push('/');
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 py-2 px-3 text-xs font-bold border border-slate-700 transition-all cursor-pointer shadow-sm"
                  >
                    <Globe className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Quay lại Website</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ==================== 5. THANH MENU DƯỚI CÙNG (BOTTOM NAVIGATION CŨ) ==================== */}
        <nav
          aria-label="Thanh điều hướng dưới cùng"
          className={`h-16 shrink-0 w-full border-t backdrop-blur-2xl transition-colors z-40 ${isDarkMode ? 'bg-[#0f172a]/95 border-slate-800' : 'bg-white/95 border-slate-200'
            }`}
        >
          <div className="max-w-3xl mx-auto flex items-center justify-around px-4 h-full">

            {/* 1. Sân đang đá */}
            <button
              type="button"
              onClick={() => setActiveTab('pitch')}
              className={`relative flex flex-col items-center justify-center gap-1 py-1 px-4 rounded-2xl transition-all duration-200 cursor-pointer ${activeTab === 'pitch'
                ? 'text-emerald-400 font-extrabold scale-105'
                : isDarkMode
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              <Activity className="h-5 w-5" />
              <span className="text-[11px] tracking-tight">Sân đang đá</span>
              {currentlyPlayingPitches.length > 0 && (
                <span className="absolute top-1 right-3 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
              )}
            </button>

            {/* 2. Dịch vụ */}
            <button
              type="button"
              onClick={() => setActiveTab('services')}
              className={`flex flex-col items-center justify-center gap-1 py-1 px-4 rounded-2xl transition-all duration-200 cursor-pointer ${activeTab === 'services'
                ? 'text-emerald-400 font-extrabold scale-105'
                : isDarkMode
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              <Shirt className="h-5 w-5" />
              <span className="text-[11px] tracking-tight">Dịch vụ</span>
            </button>

            {/* 3. Home (Xem Lịch Đặt Sân trong Management System) */}
            <button
              type="button"
              onClick={() => setActiveTab('home')}
              className={`flex flex-col items-center justify-center gap-1 py-1 px-4 rounded-2xl transition-all duration-200 cursor-pointer ${activeTab === 'home'
                ? 'text-emerald-400 font-extrabold scale-105'
                : isDarkMode
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              <Home className="h-5 w-5" />
              <span className="text-[11px] tracking-tight">Home</span>
            </button>

            {/* 5. Lịch sử */}
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`flex flex-col items-center justify-center gap-1 py-1 px-4 rounded-2xl transition-all duration-200 cursor-pointer ${activeTab === 'history'
                ? 'text-emerald-400 font-extrabold scale-105'
                : isDarkMode
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              <Book className="h-5 w-5" />
              <span className="text-[11px] tracking-tight">Lịch sử</span>
            </button>

          </div>
        </nav>

      </div>

      {/* ==================== 7. MODAL ĐĂNG NHẬP CŨ ==================== */}
      <Login
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* ==================== 8. THÔNG BÁO NỔI TOAST HIỆN ĐẠI ==================== */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-[99999] max-w-sm sm:max-w-md w-full animate-in slide-in-from-top-4 fade-in duration-300 pointer-events-auto shadow-2xl">
          <div
            className={`p-4 rounded-2xl border backdrop-blur-xl flex items-start gap-3 transition-all ${
              toastMessage.type === 'success'
                ? 'bg-slate-900/95 border-emerald-500/50 text-white shadow-emerald-500/25 ring-1 ring-emerald-500/30'
                : toastMessage.type === 'error'
                ? 'bg-slate-900/95 border-rose-500/50 text-white shadow-rose-500/25 ring-1 ring-rose-500/30'
                : toastMessage.type === 'warning'
                ? 'bg-slate-900/95 border-amber-500/50 text-white shadow-amber-500/25 ring-1 ring-amber-500/30'
                : 'bg-slate-900/95 border-cyan-500/50 text-white shadow-cyan-500/25 ring-1 ring-cyan-500/30'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                toastMessage.type === 'success'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : toastMessage.type === 'error'
                  ? 'bg-rose-500/20 text-rose-400'
                  : toastMessage.type === 'warning'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-cyan-500/20 text-cyan-400'
              }`}
            >
              {toastMessage.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
              {toastMessage.type === 'error' && <AlertCircle className="w-5 h-5" />}
              {toastMessage.type === 'warning' && <AlertCircle className="w-5 h-5" />}
              {toastMessage.type === 'info' && <Sparkles className="w-5 h-5" />}
            </div>

            <div className="flex-1 min-w-0 pt-0.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">
                {toastMessage.title || (toastMessage.type === 'success' ? 'Thành Công' : toastMessage.type === 'error' ? 'Lỗi' : 'Thông Báo')}
              </h4>
              <p className="text-xs font-semibold text-slate-100 mt-0.5 leading-relaxed break-words">
                {toastMessage.message}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
