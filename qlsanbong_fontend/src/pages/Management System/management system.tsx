import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { io, Socket } from 'socket.io-client';
import {
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
  Check
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
  trang_thai: 'Chờ thanh toán' | 'Đã thanh toán' | 'Đã hủy';
  ngay_tao: string;
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

// Danh mục dịch vụ gốc
const DEFAULT_SERVICES_LIST = [
  { id: 1, name: 'Nước Khoáng Aquafina 500ml', price: 10000, priceStr: '10.000đ', unit: 'Chai', stock: '48 chai' },
  { id: 2, name: 'Nước Tăng Lực Revive Chanh Muối', price: 15000, priceStr: '15.000đ', unit: 'Chai', stock: '36 chai' },
  { id: 3, name: 'Nước Tăng Lực Red Bull', price: 20000, priceStr: '20.000đ', unit: 'Lon', stock: '24 lon' },
  { id: 4, name: 'Khăn Lạnh Cao Cấp', price: 5000, priceStr: '5.000đ', unit: 'Cái', stock: '100 cái' },
  { id: 5, name: 'Thuê Bóng Thi Đấu Số 5', price: 30000, priceStr: '30.000đ', unit: 'Quả/Trận', stock: '8 quả' },
  { id: 6, name: 'Thuê Bộ Áo Bib Phân Đội (10 áo)', price: 30000, priceStr: '30.000đ', unit: 'Bộ/Trận', stock: '12 bộ' },
];

// Mock Invoices (Chờ thanh toán)
const INITIAL_MOCK_INVOICES: DonDatSanPOS[] = [
  {
    id: 101,
    ma_don_dat: 'HD-2026-001',
    ten_khach_hang: 'Nguyễn Văn Nam',
    so_dien_thoai: '0901234567',
    ten_san: 'Sân 1 (5 người)',
    gio_bat_dau: '17:00',
    gio_ket_thuc: '18:30',
    ngay_da: '2026-10-02',
    tien_san: 270000,
    dich_vu: [
      { id: 1, ten_dich_vu: 'Nước Khoáng Aquafina 500ml', so_luong: 4, don_gia: 10000, thanh_tien: 40000 },
      { id: 2, ten_dich_vu: 'Nước Tăng Lực Revive Chanh Muối', so_luong: 2, don_gia: 15000, thanh_tien: 30000 },
    ],
    tong_tien: 340000,
    trang_thai: 'Chờ thanh toán',
    ngay_tao: '2026-10-02T16:45:00',
  },
  {
    id: 102,
    ma_don_dat: 'HD-2026-002',
    ten_khach_hang: 'Trần Đình Trọng',
    so_dien_thoai: '0987654321',
    ten_san: 'Sân 4 (7 người)',
    gio_bat_dau: '18:30',
    gio_ket_thuc: '20:00',
    ngay_da: '2026-10-02',
    tien_san: 450000,
    dich_vu: [
      { id: 6, ten_dich_vu: 'Thuê Bộ Áo Bib Phân Đội (10 áo)', so_luong: 1, don_gia: 30000, thanh_tien: 30000 },
      { id: 3, ten_dich_vu: 'Nước Tăng Lực Red Bull', so_luong: 6, don_gia: 20000, thanh_tien: 120000 },
    ],
    tong_tien: 600000,
    trang_thai: 'Chờ thanh toán',
    ngay_tao: '2026-10-02T18:00:00',
  },
];

// Mock History (Đã thanh toán)
const INITIAL_MOCK_HISTORY: DonDatSanPOS[] = [
  {
    id: 201,
    ma_don_dat: 'HD-2026-999',
    ten_khach_hang: 'Vũ Đức Đam',
    so_dien_thoai: '0977889900',
    ten_san: 'Sân 1 (5 người)',
    gio_bat_dau: '17:00',
    gio_ket_thuc: '18:30',
    ngay_da: '2026-10-01',
    tien_san: 270000,
    dich_vu: [
      { id: 1, ten_dich_vu: 'Nước Khoáng Aquafina 500ml', so_luong: 6, don_gia: 10000, thanh_tien: 60000 },
    ],
    tong_tien: 330000,
    trang_thai: 'Đã thanh toán',
    ngay_tao: '2026-10-01T17:10:00',
  },
];

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
  const [selectedServices, setSelectedServices] = useState<SelectedServiceItem[]>([]);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  // Hook đồng bộ Real-time giả lập (localStorage & Window Storage Event)
  const {
    orders: syncOrders,
    addOrder: addSyncOrder,
    updateOrderStatus: updateSyncOrderStatus,
    invoices: mockInvoices,
    history: mockHistory,
  } = useBookingSync();

  // State lưu ID hóa đơn đang được chỉnh sửa thêm dịch vụ
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | number | null>(null);
  const [selectedInvoiceDetail, setSelectedInvoiceDetail] = useState<DonDatSanPOS | null>(null);
  // State lưu đơn hàng lịch sử đang xem chi tiết (Modal Read-only)
  const [selectedHistoryOrder, setSelectedHistoryOrder] = useState<any | null>(null);

  // Refs
  const socketRef = useRef<Socket | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

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

  // Nạp thông tin đăng nhập từ localStorage
  const loadUserFromStorage = () => {
    try {
      if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('auth_user');
        if (storedUser) {
          const parsedUser: AuthUser = JSON.parse(storedUser);
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
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setSanBongList(data.data);
      } else {
        setSanBongList([
          { id: 1, ma_loai_san: 1, ten_san: 'Sân 1 (5 người)', ten_loai: 'Sân 5 Người', don_gia_phut: 3000, trang_thai: 'SAN_SANG' },
          { id: 2, ma_loai_san: 1, ten_san: 'Sân 2 (5 người)', ten_loai: 'Sân 5 Người', don_gia_phut: 3000, trang_thai: 'SAN_SANG' },
          { id: 3, ma_loai_san: 1, ten_san: 'Sân 3 (5 người)', ten_loai: 'Sân 5 Người', don_gia_phut: 3000, trang_thai: 'SAN_SANG' },
          { id: 4, ma_loai_san: 2, ten_san: 'Sân 4 (7 người)', ten_loai: 'Sân 7 Người', don_gia_phut: 5000, trang_thai: 'SAN_SANG' },
          { id: 5, ma_loai_san: 2, ten_san: 'Sân 5 (7 người)', ten_loai: 'Sân 7 Người', don_gia_phut: 5000, trang_thai: 'SAN_SANG' },
          { id: 6, ma_loai_san: 3, ten_san: 'Sân 6 (11 người)', ten_loai: 'Sân 11 Người', don_gia_phut: 8000, trang_thai: 'SAN_SANG' },
        ]);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách sân:', err);
      setSanBongList([
        { id: 1, ma_loai_san: 1, ten_san: 'Sân 1 (5 người)', ten_loai: 'Sân 5 Người', don_gia_phut: 3000, trang_thai: 'SAN_SANG' },
        { id: 2, ma_loai_san: 1, ten_san: 'Sân 2 (5 người)', ten_loai: 'Sân 5 Người', don_gia_phut: 3000, trang_thai: 'SAN_SANG' },
        { id: 3, ma_loai_san: 1, ten_san: 'Sân 3 (5 người)', ten_loai: 'Sân 5 Người', don_gia_phut: 3000, trang_thai: 'SAN_SANG' },
        { id: 4, ma_loai_san: 2, ten_san: 'Sân 4 (7 người)', ten_loai: 'Sân 7 Người', don_gia_phut: 5000, trang_thai: 'SAN_SANG' },
        { id: 5, ma_loai_san: 2, ten_san: 'Sân 5 (7 người)', ten_loai: 'Sân 7 Người', don_gia_phut: 5000, trang_thai: 'SAN_SANG' },
        { id: 6, ma_loai_san: 3, ten_san: 'Sân 6 (11 người)', ten_loai: 'Sân 11 Người', don_gia_phut: 8000, trang_thai: 'SAN_SANG' },
      ]);
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

  // Nạp toàn bộ dữ liệu ban đầu
  useEffect(() => {
    const initData = async () => {
      setIsLoadingData(true);
      await Promise.all([
        fetchLoaiSan(),
        fetchSanBong(),
        fetchKhungGio(),
      ]);
    };
    initData();
  }, []);

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

    socket.on('booking_updated', () => {
      fetchLichSan(formattedDateISO, sanBongList);
      fetchHistory();
    });

    socket.on('payment_success', () => {
      fetchLichSan(formattedDateISO, sanBongList);
      fetchHistory();
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

  // Đăng xuất
  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('soccer_current_user');
    }
    setCurrentUser(null);
    setIsSettingsOpen(false);
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
  // POS LOGIC: CHỌN SÂN & DỊCH VỤ VÀO GIỎ HÀNG 25%
  // -------------------------------------------------------------

  // Chuyển đổi slotId nội bộ POS sang định dạng key của backend: {ngay}_{sanId}_{gio}
  const toSocketSlotKey = (sanId: number, gioStart: string) =>
    `${formattedDateISO}_${sanId}_${gioStart}`;

  const handleToggleSlotFromMatrix = (san: SanBong, slot: KhungGioItem, slotData?: SlotLichSan) => {
    if (slotData && slotData.trang_thai === 'DA_CHOT') {
      setSelectedSlotDetail({ san, slot, slotData });
      return;
    }

    const slotId = `pitch_${san.id}_${slot.start}`;
    const socketKey = toSocketSlotKey(san.id, slot.start);
    const isExisted = selectedSlots.some((item) => item.id === slotId);

    if (isExisted) {
      // Bỏ chọn: giải phóng ô này trên realtime
      setSelectedSlots((prev) => {
        const next = prev.filter((item) => item.id !== slotId);
        if (socketRef.current?.connected) {
          socketRef.current.emit('unlock_slot', socketKey);
        }
        return next;
      });
    } else {
      const price = slotData?.gia_ap_dung || (Number(san.don_gia_phut) * 30) || 90000;
      setSelectedSlots((prev) => {
        const next = [
          ...prev,
          {
            id: slotId,
            ten_san: san.ten_san,
            gio_da: `${slot.start} - ${slot.end}`,
            gia_tien: price,
          },
        ];
        // Emit lock_slots toàn bộ các slot đang giữ (bao gồm slot vừa thêm)
        if (socketRef.current?.connected) {
          const allSocketKeys = [
            ...prev.map((s) => {
              const parts = s.id.replace('pitch_', '').split('_');
              return `${formattedDateISO}_${parts[0]}_${parts[1]}`;
            }),
            socketKey,
          ];
          socketRef.current.emit('lock_slots', allSocketKeys);
        }
        return next;
      });
    }
  };

  const handleRemoveSlot = (slotId: string) => {
    setSelectedSlots((prev) => {
      const next = prev.filter((item) => item.id !== slotId);
      // Giải phóng slot này trên realtime
      if (socketRef.current?.connected) {
        const parts = slotId.replace('pitch_', '').split('_');
        const socketKey = `${formattedDateISO}_${parts[0]}_${parts[1]}`;
        socketRef.current.emit('unlock_slot', socketKey);
      }
      return next;
    });
  };

  const handleAddServiceToCart = (item: typeof DEFAULT_SERVICES_LIST[0]) => {
    setSelectedServices((prev) => {
      const existing = prev.find((s) => s.id === item.id);
      if (existing) {
        return prev.map((s) => (s.id === item.id ? { ...s, so_luong: s.so_luong + 1 } : s));
      }
      return [
        ...prev,
        {
          id: item.id,
          ten_dich_vu: item.name,
          don_gia: item.price,
          so_luong: 1,
          don_vi: item.unit,
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

  const handleClearOrder = () => {
    // Giải phóng toàn bộ slot đang giữ chỗ trên realtime trước khi xóa
    if (socketRef.current?.connected) {
      socketRef.current.emit('unlock_all');
    }
    setSelectedSlots([]);
    setSelectedServices([]);
    setCustomerName('');
    setCustomerPhone('');
    setEditingInvoiceId(null);
  };

  const totalPitchPrice = useMemo(() => {
    return selectedSlots.reduce((sum, item) => sum + item.gia_tien, 0);
  }, [selectedSlots]);

  const totalServicePrice = useMemo(() => {
    return selectedServices.reduce((sum, item) => sum + item.don_gia * item.so_luong, 0);
  }, [selectedServices]);

  const grandTotal = useMemo(() => {
    return totalPitchPrice + totalServicePrice;
  }, [totalPitchPrice, totalServicePrice]);

  // -------------------------------------------------------------
  // POS ACTIONS: LƯU & THANH TOÁN & THÊM DỊCH VỤ
  // -------------------------------------------------------------
  const handleSaveOrder = () => {
    if (selectedSlots.length === 0 && selectedServices.length === 0) {
      alert('Giỏ hàng đang trống! Vui lòng chọn sân hoặc dịch vụ trước khi lưu.');
      return;
    }

    const serviceItems: ServiceItemOrder[] = selectedServices.map((item, idx) => ({
      id: item.id || idx + 1,
      ten_dich_vu: item.ten_dich_vu,
      so_luong: item.so_luong,
      don_gia: item.don_gia,
      thanh_tien: item.don_gia * item.so_luong,
    }));

    const firstPitch = selectedSlots[0];
    const [start, end] = firstPitch ? firstPitch.gio_da.split(' - ') : ['17:00', '18:30'];

    if (editingInvoiceId) {
      // CẬP NHẬT HÓA ĐƠN ĐANG SỬA
      updateSyncOrderStatus(editingInvoiceId, 'Chờ thanh toán', {
        ten_khach_hang: customerName.trim() || 'Khách vãng lai',
        so_dien_thoai: customerPhone.trim() || 'Chưa có SĐT',
        ten_san: selectedSlots.length > 0 ? selectedSlots.map((s) => s.ten_san).join(', ') : 'Quầy nước / Dịch vụ',
        gio_bat_dau: start || '17:00',
        gio_ket_thuc: end || '18:30',
        ngay_da: formattedDateISO,
        tien_san: totalPitchPrice,
        dich_vu: serviceItems,
        tong_tien: grandTotal,
      });
      alert('Đã cập nhật Hóa đơn tạm thành công!');
    } else {
      // TẠO HÓA ĐƠN MỚI
      const newId = Date.now();
      const newInvoice: DonDatSanPOS = {
        id: newId,
        ma_don_dat: `HD-${new Date().getFullYear()}-${String(mockInvoices.length + 101).padStart(3, '0')}`,
        ten_khach_hang: customerName.trim() || 'Khách vãng lai',
        so_dien_thoai: customerPhone.trim() || 'Chưa có SĐT',
        ten_san: selectedSlots.length > 0 ? selectedSlots.map((s) => s.ten_san).join(', ') : 'Quầy nước / Dịch vụ',
        gio_bat_dau: start || '17:00',
        gio_ket_thuc: end || '18:30',
        ngay_da: formattedDateISO,
        tien_san: totalPitchPrice,
        dich_vu: serviceItems,
        tong_tien: grandTotal,
        trang_thai: 'Chờ thanh toán',
        ngay_tao: new Date().toISOString(),
      };
      addSyncOrder(newInvoice);
      alert('Đã lưu vào Hóa đơn tạm!');
    }

    handleClearOrder();
  };

  const handlePayOrder = (invoiceToPay?: DonDatSanPOS) => {
    if (invoiceToPay) {
      updateSyncOrderStatus(invoiceToPay.id, 'Đã thanh toán');
      setSelectedInvoiceDetail(null);
      alert('Thanh toán thành công!');
      return;
    }

    if (selectedSlots.length === 0 && selectedServices.length === 0) {
      alert('Giỏ hàng đang trống! Vui lòng chọn sân hoặc dịch vụ trước khi thanh toán.');
      return;
    }

    const serviceItems: ServiceItemOrder[] = selectedServices.map((item, idx) => ({
      id: item.id || idx + 1,
      ten_dich_vu: item.ten_dich_vu,
      so_luong: item.so_luong,
      don_gia: item.don_gia,
      thanh_tien: item.don_gia * item.so_luong,
    }));

    const firstPitch = selectedSlots[0];
    const [start, end] = firstPitch ? firstPitch.gio_da.split(' - ') : ['17:00', '18:30'];

    if (editingInvoiceId) {
      // CẬP NHẬT HÓA ĐƠN VÀ CHUYỂN SANG ĐÃ THANH TOÁN
      updateSyncOrderStatus(editingInvoiceId, 'Đã thanh toán', {
        ten_khach_hang: customerName.trim() || 'Khách vãng lai',
        so_dien_thoai: customerPhone.trim() || 'Chưa có SĐT',
        ten_san: selectedSlots.length > 0 ? selectedSlots.map((s) => s.ten_san).join(', ') : 'Quầy nước / Dịch vụ',
        gio_bat_dau: start || '17:00',
        gio_ket_thuc: end || '18:30',
        ngay_da: formattedDateISO,
        tien_san: totalPitchPrice,
        dich_vu: serviceItems,
        tong_tien: grandTotal,
      });
      alert('Thanh toán thành công!');
    } else {
      // TẠO ĐƠN ĐÃ THANH TOÁN MỚI
      const newId = Date.now();
      const paidOrder: DonDatSanPOS = {
        id: newId,
        ma_don_dat: `HD-${new Date().getFullYear()}-${String(mockHistory.length + 201).padStart(3, '0')}`,
        ten_khach_hang: customerName.trim() || 'Khách vãng lai',
        so_dien_thoai: customerPhone.trim() || 'Chưa có SĐT',
        ten_san: selectedSlots.length > 0 ? selectedSlots.map((s) => s.ten_san).join(', ') : 'Quầy nước / Dịch vụ',
        gio_bat_dau: start || '17:00',
        gio_ket_thuc: end || '18:30',
        ngay_da: formattedDateISO,
        tien_san: totalPitchPrice,
        dich_vu: serviceItems,
        tong_tien: grandTotal,
        trang_thai: 'Đã thanh toán',
        ngay_tao: new Date().toISOString(),
      };
      addSyncOrder(paidOrder);
      alert('Thanh toán thành công!');
    }

    handleClearOrder();
  };

  const handleAddMoreService = (invoice: DonDatSanPOS) => {
    // 1. Nạp lại sân từ hóa đơn vào giỏ hàng
    if (invoice.ten_san) {
      setSelectedSlots([
        {
          id: `pitch_${invoice.ma_san || 1}_${invoice.gio_bat_dau}`,
          ten_san: invoice.ten_san,
          gio_da: `${invoice.gio_bat_dau} - ${invoice.gio_ket_thuc}`,
          gia_tien: invoice.tien_san || 0,
        },
      ]);
    } else {
      setSelectedSlots([]);
    }

    // 2. Nạp lại danh sách dịch vụ từ hóa đơn vào giỏ hàng
    if (invoice.dich_vu && invoice.dich_vu.length > 0) {
      setSelectedServices(
        invoice.dich_vu.map((dv) => ({
          id: dv.id,
          ten_dich_vu: dv.ten_dich_vu,
          so_luong: dv.so_luong,
          don_gia: dv.don_gia,
          don_vi: 'Phần',
        }))
      );
    } else {
      setSelectedServices([]);
    }

    // 3. Nạp thông tin khách hàng & lưu ID hóa đơn đang sửa
    setCustomerName(invoice.ten_khach_hang || '');
    setCustomerPhone(invoice.so_dien_thoai || '');
    setEditingInvoiceId(invoice.id);

    // 4. Đóng chi tiết hóa đơn & chuyển sang Tab Dịch vụ
    setSelectedInvoiceDetail(null);
    setActiveTab('services');
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

            {/* Cụm giữa: Điều hướng ngày & Text ngày tháng */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                id="prev-date-btn"
                type="button"
                onClick={handlePrevDay}
                className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all active:scale-90 cursor-pointer ${isDarkMode ? 'border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300' : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700 shadow-sm'
                  }`}
                title="Lùi 1 ngày"
                aria-label="Lùi 1 ngày"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-bold text-xs sm:text-sm tracking-tight border flex items-center gap-2 select-none shadow-sm ${isDarkMode ? 'bg-slate-900/90 border-slate-700/80 text-emerald-400' : 'bg-white border-slate-200 text-emerald-700'
                }`}>
                <CalendarCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="truncate">{formatVietnameseDate(currentDate)}</span>
              </div>

              <button
                id="next-date-btn"
                type="button"
                onClick={handleNextDay}
                className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all active:scale-90 cursor-pointer ${isDarkMode ? 'border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300' : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700 shadow-sm'
                  }`}
                title="Tiến 1 ngày"
                aria-label="Tiến 1 ngày"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => setCurrentDate(new Date())}
                className="hidden md:inline-flex px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-colors cursor-pointer"
              >
                Hôm nay
              </button>

              {/* Nút Reload Real-time */}
              <button
                type="button"
                onClick={() => fetchLichSan(formattedDateISO, sanBongList)}
                disabled={isRefreshing}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${isRefreshing ? 'animate-spin text-emerald-400' : 'text-slate-400 hover:text-emerald-400'
                  } ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}
                title="Làm mới ma trận lịch"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Cột phải: Khung Lịch Dropdown & Tài khoản */}
            <div className="relative flex items-center gap-2.5">
              <button
                id="calendar-toggle-btn"
                type="button"
                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
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
                    <div className="text-[9px] text-emerald-400 font-mono font-bold uppercase">{currentUser.vai_tro}</div>
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

            {/* TAB 1: SÂN ĐẶT TRƯỚC (PITCH) */}
            {activeTab === 'pitch' && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className={`p-5 rounded-2xl border shadow-lg ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-black shrink-0">
                        <LandPlot className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-base sm:text-lg font-black leading-tight text-white">
                          Danh Sách Sân Đặt Trước
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Ngày: <strong className="text-emerald-400">{formatVietnameseDate(currentDate)}</strong> • Tổng cộng <strong>{rawBookings.filter(b => b.trang_thai !== 'DA_HUY').length + mockInvoices.length}</strong> đơn đặt trước
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab('home')}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all self-start sm:self-auto cursor-pointer"
                    >
                      <CalendarCheck className="w-4 h-4" />
                      <span>Xem Lịch Đặt Sân (Home)</span>
                    </button>
                  </div>
                </div>

                {/* Danh sách đơn đặt trước */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mockInvoices.map((inv) => (
                    <div key={inv.id} className={`p-5 rounded-2xl border transition-all duration-200 hover:shadow-xl ${isDarkMode ? 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/40' : 'bg-white border-slate-200 hover:border-emerald-400 shadow-sm'}`}>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-1">
                            Sân bóng
                          </span>
                          <h3 className="font-bold text-base text-white">{inv.ten_san}</h3>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black border bg-amber-500/15 text-amber-400 border-amber-500/30">
                          #{inv.ma_don_dat}
                        </span>
                      </div>
                      <div className="space-y-2 py-3 border-y border-slate-800/80 text-xs text-slate-400">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-emerald-400" /> Khung giờ đá:</span>
                          <strong className="text-white font-mono">{inv.gio_bat_dau} - {inv.gio_ket_thuc}</strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5"><UserIcon className="w-3.5 h-3.5 text-emerald-400" /> Khách hàng:</span>
                          <strong className="text-white truncate max-w-[160px]">{inv.ten_khach_hang}</strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Tiền cọc / Giá:</span>
                          <strong className="text-amber-400 font-mono">{inv.tong_tien.toLocaleString('vi-VN')}đ</strong>
                        </div>
                      </div>
                      <div className="mt-3.5 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedInvoiceDetail(inv)}
                          className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition-colors shadow-sm cursor-pointer text-center"
                        >
                          ✓ Thu Tiền / Chi Tiết
                        </button>
                      </div>
                    </div>
                  ))}

                  {rawBookings.filter(b => b.trang_thai !== 'DA_HUY').map((booking: any, idx: number) => {
                    const matchedSan = sanBongList.find(s => s.id === booking.ma_san);
                    return (
                      <div
                        key={booking.id || idx}
                        className={`p-5 rounded-2xl border transition-all duration-200 hover:shadow-xl ${isDarkMode ? 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/40' : 'bg-white border-slate-200 hover:border-emerald-400 shadow-sm'
                          }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div>
                            <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-1">
                              {matchedSan?.ten_loai || 'Sân bóng'}
                            </span>
                            <h3 className="font-bold text-base text-white">
                              {booking.ten_san || matchedSan?.ten_san || `Sân #${booking.ma_san}`}
                            </h3>
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black border bg-rose-500/15 text-rose-400 border-rose-500/30">
                            #{booking.id || booking.ma_don_dat || idx + 1}
                          </span>
                        </div>

                        <div className="space-y-2 py-3 border-y border-slate-800/80 text-xs text-slate-400">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-emerald-400" /> Khung giờ đá:
                            </span>
                            <strong className="text-white font-mono">{booking.gio_bat_dau?.substring(0, 5)} - {booking.gio_ket_thuc?.substring(0, 5)}</strong>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <UserIcon className="w-3.5 h-3.5 text-emerald-400" /> Khách hàng:
                            </span>
                            <strong className="text-white truncate max-w-[160px]">{booking.ten_khach_hang || 'Khách vãng lai'}</strong>
                          </div>

                          {booking.so_dien_thoai && (
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-emerald-400" /> Điện thoại:
                              </span>
                              <strong className="font-mono text-emerald-400">{booking.so_dien_thoai}</strong>
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Tiền cọc / Giá:
                            </span>
                            <strong className="text-amber-400 font-mono">
                              {booking.tong_tien ? Number(booking.tong_tien).toLocaleString('vi-VN') + 'đ' : 'Đã thanh toán'}
                            </strong>
                          </div>
                        </div>

                        <div className="mt-3.5 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => alert(`Xác nhận khách đã nhận sân: ${booking.ten_san || matchedSan?.ten_san}`)}
                            className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition-colors shadow-sm cursor-pointer text-center"
                          >
                            ✓ Nhận Sân
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: DỊCH VỤ (SERVICES) */}
            {activeTab === 'services' && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className={`p-5 rounded-2xl border shadow-lg ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-black shrink-0">
                      <Shirt className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-black leading-tight text-white">Dịch Vụ Đi Kèm</h2>
                      <p className="text-xs text-slate-400 mt-0.5">Quản lý nước ngọt, khăn lạnh, thuê bóng, áo bib tập luyện.</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {DEFAULT_SERVICES_LIST.map((item) => (
                    <div key={item.id} className={`p-4 rounded-2xl border flex flex-col justify-between ${isDarkMode ? 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/40' : 'bg-white border-slate-200 shadow-sm'}`}>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-emerald-400">{item.unit}</span>
                          <span className="text-[10px] text-slate-400 font-mono">Kho: {item.stock}</span>
                        </div>
                        <h4 className="font-bold text-sm mb-1 text-white">{item.name}</h4>
                        <div className="text-emerald-400 font-extrabold text-sm mb-3">{item.priceStr}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddServiceToCart(item)}
                        className="w-full py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Thêm Vào Giỏ Hàng POS</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: HÓA ĐƠN (INVOICES - CHỜ THANH TOÁN) */}
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
                    <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20">
                      {mockInvoices.length} Đơn chờ thanh toán
                    </span>
                  </div>
                </div>

                {mockInvoices.length === 0 ? (
                  <div className={`p-16 rounded-2xl border text-center ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-80" />
                    <h3 className="text-base font-bold text-white">Không có hóa đơn chờ thanh toán</h3>
                    <p className="text-xs text-slate-500 mt-1">Tất cả các đơn đặt sân và dịch vụ đều đã được thanh toán hoàn tất.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mockInvoices.map((inv) => (
                      <div
                        key={inv.id}
                        onClick={() => setSelectedInvoiceDetail(inv)}
                        className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 hover:border-amber-500/60 transition-all hover:scale-[1.01] cursor-pointer shadow-lg space-y-3 relative group select-none"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                          <span className="font-mono font-black text-amber-400 text-sm">#{inv.ma_don_dat}</span>
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
                            <span className="text-white font-bold">{inv.ten_khach_hang} ({inv.so_dien_thoai})</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 flex items-center gap-1"><LandPlot className="w-3.5 h-3.5 text-emerald-400" /> Sân:</span>
                            <span className="text-emerald-400 font-bold">{inv.ten_san}</span>
                          </div>
                        </div>

                        <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between">
                          <span className="text-xs text-slate-400 font-medium">Tổng tiền:</span>
                          <span className="text-base font-black text-emerald-400 font-mono">
                            {inv.tong_tien.toLocaleString('vi-VN')} VNĐ
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

            {/* TAB 4: LỊCH SỬ (HISTORY - ĐỒNG BỘ REALTIME) */}
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
                          Tổng cộng <strong className="text-emerald-400">{historyBookings.length + mockHistory.length}</strong> đơn đặt • Đồng bộ real-time
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

                {/* Danh sách lịch sử */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mockHistory.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedHistoryOrder(item)}
                      className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 hover:border-emerald-500/50 hover:bg-slate-900/90 transition-all hover:scale-[1.01] cursor-pointer flex items-center justify-between group shadow-sm select-none"
                    >
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-emerald-400">#{item.ma_don_dat}</span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Đã thanh toán</span>
                        </div>
                        <div className="font-bold text-white text-sm">{item.ten_khach_hang} - {item.ten_san}</div>
                        <div className="text-slate-400 text-[11px]">Giờ: {item.gio_bat_dau} - {item.gio_ket_thuc} ({item.ngay_da})</div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-black text-emerald-400 font-mono">{item.tong_tien.toLocaleString('vi-VN')}đ</div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold group-hover:text-emerald-400 transition-colors">👉 Xem chi tiết</div>
                      </div>
                    </div>
                  ))}

                  {historyBookings.map((hb: any, idx: number) => (
                    <div
                      key={hb.id || idx}
                      onClick={() => setSelectedHistoryOrder(hb)}
                      className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 hover:border-emerald-500/50 hover:bg-slate-900/90 transition-all hover:scale-[1.01] cursor-pointer flex items-center justify-between group shadow-sm select-none"
                    >
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-emerald-400">#{hb.id || hb.ma_don_dat}</span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">{hb.trang_thai || 'Đã thanh toán'}</span>
                        </div>
                        <div className="font-bold text-white text-sm">{hb.ten_khach_hang} - {hb.ten_san}</div>
                        <div className="text-slate-400 text-[11px]">Giờ: {hb.gio_bat_dau?.substring(0, 5)} - {hb.gio_ket_thuc?.substring(0, 5)} ({hb.ngay_da?.substring(0, 10)})</div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-black text-emerald-400 font-mono">{Number(hb.tong_tien || 0).toLocaleString('vi-VN')}đ</div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold group-hover:text-emerald-400 transition-colors">👉 Xem chi tiết</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: HOME (LỊCH ĐẶT SÂN & BẢNG MA TRẬN KHUNG GIỜ CŨ) */}
            {activeTab === 'home' && (
              <div className="space-y-5 animate-in fade-in duration-300">

                {/* Thẻ Thống Kê Nhanh Cũ */}
                <div className={`p-4 sm:p-5 rounded-2xl border shadow-lg transition-all ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-black shrink-0">
                        <Zap className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-base sm:text-lg font-black leading-tight text-white">
                          Lịch Đặt Sân & Bảng Khung Giờ
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Ngày xem: <strong className="text-emerald-400">{formatVietnameseDate(currentDate)}</strong> ({sanBongList.length} sân đang hoạt động)
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className={`p-2.5 rounded-xl border text-center ${isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Tổng Sân</div>
                        <div className="text-base font-black text-emerald-400 mt-0.5">{statsSummary.totalPitches} Sân</div>
                      </div>
                      <div className={`p-2.5 rounded-xl border text-center ${isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Có Lịch Đá</div>
                        <div className="text-base font-black text-amber-400 mt-0.5">{statsSummary.activePitchesCount} Sân</div>
                      </div>
                      <div className={`p-2.5 rounded-xl border text-center ${isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Slot Đã Đặt</div>
                        <div className="text-base font-black text-rose-400 mt-0.5">{statsSummary.bookedSlotsCount} Ca</div>
                      </div>
                      <div className={`p-2.5 rounded-xl border text-center ${isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Sân Trống</div>
                        <div className="text-base font-black text-teal-400 mt-0.5">{statsSummary.availablePitchesCount} Sân</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Thanh Điều Khiển Bộ Lọc Cũ */}
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
                        <option value="ALL" className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>Tất cả sân ({sanBongList.length})</option>
                        {sanBongList.map((san) => (
                          <option key={san.id} value={String(san.id)} className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>
                            {san.ten_san}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                      <Search className="w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Tìm tên sân..."
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        className="bg-transparent focus:outline-none text-xs w-28 sm:w-36 text-white placeholder:text-slate-500"
                      />
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
                                      className="w-full h-16 p-1.5 rounded-xl border border-rose-500/60 bg-gradient-to-br from-rose-950/80 to-red-950/90 text-rose-200 flex flex-col items-center justify-between shadow-sm hover:scale-[1.02] transition-all cursor-pointer select-none text-left"
                                      title={`Đã đặt: ${slotData?.ten_khach_hang || matchedSyncOrder?.ten_khach_hang || 'Có khách'}`}
                                    >
                                      <div className="w-full flex items-center justify-between">
                                        <span className="text-[10px] font-mono font-bold text-rose-300">{slot.label}</span>
                                        <span className="text-[9px] px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 font-bold">#ĐÃ ĐẶT</span>
                                      </div>
                                      <div className="w-full truncate text-[10px] font-extrabold text-rose-200 text-center">
                                        {slotData?.ten_khach_hang || matchedSyncOrder?.ten_khach_hang || 'Khách đặt'}
                                      </div>
                                      <div className="w-full text-center text-[9px] text-rose-400/80 font-mono">
                                        {slotData?.gio_bat_dau_don && slotData?.gio_ket_thuc_don
                                          ? `${slotData.gio_bat_dau_don}-${slotData.gio_ket_thuc_don}`
                                          : matchedSyncOrder
                                            ? `${matchedSyncOrder.gio_bat_dau}-${matchedSyncOrder.gio_ket_thuc}`
                                            : slot.start}
                                      </div>
                                    </button>
                                  ) : isSyncPending ? (
                                    /* Ô Chờ thanh toán từ đơn đặt -> Vô hiệu hóa (disabled), hiển thị màu xám */
                                    <div
                                      onClick={() => matchedSyncOrder && setSelectedInvoiceDetail(matchedSyncOrder as any)}
                                      className={`w-full h-16 p-1.5 rounded-xl border flex flex-col items-center justify-between select-none cursor-pointer transition-all ${
                                        isDarkMode
                                          ? 'border-slate-800 bg-slate-900/80 text-slate-400 hover:border-slate-700'
                                          : 'border-slate-300 bg-slate-200/80 text-slate-500 hover:border-slate-400'
                                      }`}
                                      title={`Đang chờ thanh toán: ${matchedSyncOrder?.ten_khach_hang} (${matchedSyncOrder?.ma_don_dat})`}
                                    >
                                      <div className="w-full flex items-center justify-between">
                                        <span className="text-[10px] font-mono font-bold text-slate-400">{slot.label}</span>
                                        <span className="text-[8px] px-1 py-0.2 rounded bg-slate-500/20 text-slate-400 font-bold">KHÓA/CHỜ</span>
                                      </div>
                                      <div className="w-full truncate text-[9px] font-bold text-center text-slate-300">
                                        {matchedSyncOrder?.ten_khach_hang || 'Chờ thanh toán'}
                                      </div>
                                      <span className="text-[8px] text-slate-400 font-mono">
                                        {matchedSyncOrder?.gio_bat_dau}-{matchedSyncOrder?.gio_ket_thuc}
                                      </span>
                                    </div>
                                  ) : isSelectedInCart ? (
                                    <button
                                      type="button"
                                      onClick={() => handleToggleSlotFromMatrix(san, slot, slotData)}
                                      className="w-full h-16 p-1.5 rounded-xl border-2 border-emerald-300 bg-emerald-500 text-slate-950 flex flex-col items-center justify-between shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-400/50 scale-[1.03] transition-all cursor-pointer select-none"
                                      title="Bấm để bỏ chọn khỏi giỏ hàng POS"
                                    >
                                      <div className="w-full flex items-center justify-between">
                                        <span className="text-[10px] font-mono font-black">{slot.label}</span>
                                        <span className="text-[9px] px-1 py-0.2 rounded bg-slate-950/20 text-slate-950 font-black flex items-center gap-0.5">
                                          <Check className="w-2.5 h-2.5" /> CHỌN
                                        </span>
                                      </div>
                                      <span className="text-[10px] font-black uppercase tracking-tight">TRONG GIỎ</span>
                                      <span className="text-[9px] font-black font-mono">
                                        {(slotData?.gia_ap_dung || san.don_gia_phut * 30 || 90000).toLocaleString('vi-VN')}đ
                                      </span>
                                    </button>
                                  ) : isLockedByOther ? (
                                    <div
                                      className="w-full h-16 p-1.5 rounded-xl border border-amber-500/40 bg-amber-950/40 text-amber-300 flex flex-col items-center justify-between opacity-80 cursor-not-allowed select-none"
                                      title="Đang có khách giữ chỗ"
                                    >
                                      <div className="w-full flex items-center justify-between">
                                        <span className="text-[10px] font-mono font-bold">{slot.label}</span>
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                                      </div>
                                      <span className="text-[9px] font-bold text-amber-400 uppercase">GIỮ CHỖ</span>
                                      <span className="text-[8px] text-amber-500/80 font-mono">Đang chọn</span>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleToggleSlotFromMatrix(san, slot, slotData)}
                                      className={`w-full h-16 p-1.5 rounded-xl border flex flex-col items-center justify-between transition-all duration-200 group shadow-sm hover:scale-[1.02] cursor-pointer ${isDarkMode
                                        ? 'bg-emerald-950/30 hover:bg-emerald-900/50 border-emerald-600/30 hover:border-emerald-400'
                                        : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 hover:border-emerald-500'
                                        }`}
                                      title={`Trống: Bấm để chọn ${san.ten_san} ca ${slot.start}`}
                                    >
                                      <div className="w-full flex items-center justify-between">
                                        <span className="text-[10px] font-mono font-bold text-emerald-400">{slot.label}</span>
                                        <span className="text-[9px] text-slate-400 font-mono">{slot.start}</span>
                                      </div>
                                      <span className="text-[10px] font-black text-emerald-500 group-hover:text-emerald-300">
                                        TRỐNG
                                      </span>
                                      <span className="w-full py-0.5 text-[9px] text-center rounded-lg bg-emerald-500/15 group-hover:bg-emerald-500 group-hover:text-slate-950 text-emerald-400 font-bold transition-all">
                                        + Vào Giỏ POS
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
            <aside className="w-[25%] h-full border-l border-slate-700 bg-slate-800 flex flex-col justify-between p-4 select-none shadow-2xl z-30 shrink-0 animate-in fade-in duration-200">

            {/* Header + Form Khách + Danh sách cuộn */}
            <div className="flex-1 flex flex-col overflow-hidden">

              <div className="flex items-center justify-between pb-3 border-b border-slate-700 mb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <h3 className="font-extrabold text-sm text-white tracking-wide">
                    Thông tin Order
                  </h3>
                </div>

                {(selectedSlots.length > 0 || selectedServices.length > 0) && (
                  <button
                    type="button"
                    onClick={handleClearOrder}
                    className="text-[10px] text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" /> Xóa hết
                  </button>
                )}
              </div>

              {/* Thông tin Khách hàng */}
              <div className="space-y-2 mb-3 shrink-0 text-xs">
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Tên khách hàng..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs focus:outline-none focus:border-emerald-500 placeholder:text-slate-500"
                  />
                </div>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Số điện thoại..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs focus:outline-none focus:border-emerald-500 placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* Danh sách cuộn */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">

                {/* Sân bóng đã chọn */}
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    <span className="flex items-center gap-1">
                      <LandPlot className="w-3.5 h-3.5 text-emerald-400" /> Sân bóng ({selectedSlots.length})
                    </span>
                    <span className="text-emerald-400 font-mono">{totalPitchPrice.toLocaleString('vi-VN')}đ</span>
                  </div>

                  {selectedSlots.length === 0 ? (
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/60 text-center text-slate-500 text-xs italic">
                      Chưa chọn ca sân nào
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {selectedSlots.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-xs"
                        >
                          <div className="overflow-hidden pr-2">
                            <div className="font-bold text-white truncate text-[11px]">{item.ten_san}</div>
                            <div className="text-[10px] text-emerald-400 font-mono mt-0.5">{item.gio_da}</div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono text-white text-[11px] font-bold">
                              {item.gia_tien.toLocaleString('vi-VN')}đ
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveSlot(item.id)}
                              className="text-slate-500 hover:text-rose-400 p-0.5 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Dịch vụ đã chọn */}
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    <span className="flex items-center gap-1">
                      <Shirt className="w-3.5 h-3.5 text-emerald-400" /> Dịch vụ ({selectedServices.length})
                    </span>
                    <span className="text-emerald-400 font-mono">{totalServicePrice.toLocaleString('vi-VN')}đ</span>
                  </div>

                  {selectedServices.length === 0 ? (
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/60 text-center text-slate-500 text-xs italic">
                      Chưa gọi dịch vụ nào
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {selectedServices.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-xs"
                        >
                          <div className="overflow-hidden pr-2">
                            <div className="font-bold text-white truncate text-[11px]">{item.ten_dich_vu}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {item.don_gia.toLocaleString('vi-VN')}đ /{item.don_vi}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleUpdateServiceQuantity(item.id, -1)}
                              className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-black cursor-pointer border border-slate-600"
                            >
                              <Minus className="w-2.5 h-2.5" />
                            </button>
                            <span className="w-4 text-center font-bold text-emerald-400 font-mono text-xs">
                              {item.so_luong}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateServiceQuantity(item.id, 1)}
                              className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-black cursor-pointer border border-slate-600"
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>

            {/* Footer Cột Phải: 2 nút LƯU & THANH TOÁN */}
            <div className="pt-3.5 border-t border-slate-700 space-y-3 shrink-0">
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Tiền sân:</span>
                  <span className="font-mono text-white">{totalPitchPrice.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Tiền dịch vụ:</span>
                  <span className="font-mono text-white">{totalServicePrice.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between items-center text-sm font-black pt-1.5 border-t border-slate-700">
                  <span className="text-white">TỔNG TIỀN:</span>
                  <span className="text-amber-400 font-mono text-lg font-black tracking-tight">
                    {grandTotal.toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>
              </div>

              {/* 2 Nút nằm ngang nhau (grid grid-cols-2 gap-2) */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSaveOrder}
                  className="w-full py-3 px-3 rounded-xl bg-blue-500 hover:bg-blue-600 active:scale-98 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  title="Lưu tạm vào tab Hóa đơn"
                >
                  <Save className="w-4 h-4" />
                  <span>LƯU</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePayOrder()}
                  className="w-full py-3 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  title="Thanh toán ngay và chuyển sang Lịch sử"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>THANH TOÁN</span>
                </button>
              </div>
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

        {/* ==================== NÚT CÀI ĐẶT & TÀI KHOẢN NỔI (FLOATING BOTTOM-LEFT) ==================== */}
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
                      <div className="text-[10px] text-emerald-400 font-mono font-bold uppercase">{currentUser.vai_tro}</div>
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

            {/* 1. Sân đặt trước */}
            <button
              type="button"
              onClick={() => setActiveTab('pitch')}
              className={`flex flex-col items-center justify-center gap-1 py-1 px-4 rounded-2xl transition-all duration-200 cursor-pointer ${activeTab === 'pitch'
                ? 'text-emerald-400 font-extrabold scale-105'
                : isDarkMode
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              <LandPlot className="h-5 w-5" />
              <span className="text-[11px] tracking-tight">Sân đặt trước</span>
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
              onClick={() => {
                setActiveTab('home');
              }}
              className="group relative -top-3 flex flex-col items-center focus:outline-none cursor-pointer"
            >
              <div className={`flex h-13 w-13 items-center justify-center rounded-2xl shadow-xl transition-all duration-300 group-active:scale-95 ${activeTab === 'home'
                ? 'bg-gradient-to-tr from-emerald-600 to-teal-400 text-slate-950 shadow-emerald-500/40 scale-105 ring-4 ring-slate-900 dark:ring-slate-950'
                : isDarkMode
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 ring-4 ring-slate-900'
                  : 'bg-emerald-500 text-white hover:bg-emerald-600 ring-4 ring-white shadow-emerald-500/20'
                }`}>
                <Home className="h-6 w-6" />
              </div>
              <span className={`text-[11px] font-black mt-0.5 tracking-tight ${activeTab === 'home' ? 'text-emerald-400' : isDarkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>
                Home
              </span>
            </button>

            {/* 4. Hóa đơn */}
            <button
              type="button"
              onClick={() => setActiveTab('invoices')}
              className={`flex flex-col items-center justify-center gap-1 py-1 px-4 rounded-2xl transition-all duration-200 cursor-pointer ${activeTab === 'invoices'
                ? 'text-emerald-400 font-extrabold scale-105'
                : isDarkMode
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              <Receipt className="h-5 w-5" />
              <span className="text-[11px] tracking-tight">Hóa đơn</span>
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
    </>
  );
}
