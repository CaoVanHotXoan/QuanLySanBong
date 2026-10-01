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
  Globe
} from 'lucide-react';
import Login, { AuthUser } from '../Login/login';

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

// Danh sách khung giờ chuẩn từ 06:00 đến 19:00
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

// Cấu hình URL Backend & Socket.IO
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

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
  // STATE GIAO DIỆN & THEME
  // -------------------------------------------------------------
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('pitch');
  const [calendarViewDate, setCalendarViewDate] = useState<Date>(() => new Date());

  // -------------------------------------------------------------
  // STATE DỮ LIỆU SÂN BÓNG & LỊCH ĐẶT SÂN TỪ SQL SERVER
  // -------------------------------------------------------------
  const [sanBongList, setSanBongList] = useState<SanBong[]>([]);
  const [loaiSanList, setLoaiSanList] = useState<LoaiSan[]>([]);
  const [timeSlotsList, setTimeSlotsList] = useState<KhungGioItem[]>(DEFAULT_TIME_SLOTS);
  const [gridSlots, setGridSlots] = useState<Record<string, SlotLichSan>>({});
  const [lockedSlots, setLockedSlots] = useState<string[]>([]);
  const [rawBookings, setRawBookings] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Bộ lọc lịch đặt sân
  const [filterLoaiSan, setFilterLoaiSan] = useState<string>('ALL');
  const [filterSanId, setFilterSanId] = useState<string>('ALL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // -------------------------------------------------------------
  // STATE LỊCH SỬ (TAB HISTORY) - ĐỒNG BỘ TOÀN BỘ HỆ THỐNG
  // -------------------------------------------------------------
  const [historyBookings, setHistoryBookings] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [historyFilterStatus, setHistoryFilterStatus] = useState<string>('ALL');
  const [historySearchKeyword, setHistorySearchKeyword] = useState<string>('');
  const [historyFilterDate, setHistoryFilterDate] = useState<string>('');

  // Modal Chi Tiết Slot Đặt Sân
  const [selectedSlotDetail, setSelectedSlotDetail] = useState<{
    san: SanBong;
    slot: KhungGioItem;
    slotData?: SlotLichSan;
  } | null>(null);

  // -------------------------------------------------------------
  // STATE XÁC THỰC & PHÂN QUYỀN (RBAC)
  // -------------------------------------------------------------
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);

  // Refs
  const socketRef = useRef<Socket | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  const formattedDateISO = useMemo(() => formatDateToISO(currentDate), [currentDate]);

  // Kiểm tra quyền Admin / Nhân viên
  const checkIsAuthorizedRole = (role?: string): boolean => {
    if (!role) return false;
    const normalized = role.trim().toUpperCase().replace(/\s+/g, '_');
    return (
      normalized === 'ADMIN' ||
      normalized === 'NHAN_VIEN' ||
      normalized === 'NHANVIEN' ||
      normalized === 'QUAN_TRI_VIEN' ||
      role.toLowerCase().includes('admin') ||
      role.toLowerCase().includes('nhân viên') ||
      role.toLowerCase().includes('nhan vien')
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
      if (data.success && Array.isArray(data.data)) {
        setSanBongList(data.data);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách sân:', err);
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
    if (activeTab === 'history' && currentUser && checkIsAuthorizedRole(currentUser.vai_tro)) {
      fetchHistory();
    }
  }, [activeTab, currentUser, fetchHistory]);

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

    // Lắng nghe danh sách slot đang giữ chỗ trên toàn hệ thống
    socket.on('slots_updated', (updatedSlots: string[]) => {
      setLockedSlots(updatedSlots || []);
    });

    // Lắng nghe sự kiện cập nhật đơn đặt từ web hoặc máy trạm khác
    socket.on('booking_updated', () => {
      fetchLichSan(formattedDateISO, sanBongList);
      fetchHistory(); // Đồng bộ lịch sử ngay khi có đơn mới
    });

    // Lắng nghe thanh toán thành công PayOS / MB Bank
    socket.on('payment_success', () => {
      fetchLichSan(formattedDateISO, sanBongList);
      fetchHistory(); // Đồng bộ lịch sử khi thanh toán xong
    });

    return () => {
      socket.disconnect();
    };
  }, [formattedDateISO, sanBongList, fetchLichSan]);

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

  const isAuthorized = currentUser && checkIsAuthorizedRole(currentUser.vai_tro);

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

  return (
    <>
      <Head>
        <title>Hệ Thống Quản Lý Lịch Sân Bóng - Management System</title>
        <meta name="description" content="Giao diện quản lý lịch đặt sân bóng đá trực tiếp cho toàn hệ thống." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={`w-full min-h-screen flex flex-col transition-colors duration-300 ${isDarkMode ? 'dark bg-[#0a0f18] text-slate-100' : 'bg-slate-50 text-slate-900'
        }`}>

        {/* ==================== 3. HEADER ĐIỀU HƯỚNG & LỊCH NGÀY ==================== */}
        <header className={`sticky top-0 z-40 w-full border-b backdrop-blur-xl transition-colors ${isDarkMode ? 'bg-[#0f172a]/95 border-slate-800 text-white' : 'bg-white/95 border-slate-200 text-slate-900'
          }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">

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
                    MANAGEMENT SYSTEM
                  </h1>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Lịch Đặt Sân
                  </p>
                </div>
              </div>

              {/* Toggle Dark/Light */}
              <button
                id="theme-toggle-btn"
                type="button"
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-200 active:scale-95 ${isDarkMode
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
                className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all active:scale-90 ${isDarkMode ? 'border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300' : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700 shadow-sm'
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
                className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all active:scale-90 ${isDarkMode ? 'border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300' : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700 shadow-sm'
                  }`}
                title="Tiến 1 ngày"
                aria-label="Tiến 1 ngày"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => setCurrentDate(new Date())}
                className="hidden md:inline-flex px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-colors"
              >
                Hôm nay
              </button>

              {/* Nút Reload Real-time */}
              <button
                type="button"
                onClick={() => fetchLichSan(formattedDateISO, sanBongList)}
                disabled={isRefreshing}
                className={`p-2 rounded-xl border transition-all ${isRefreshing ? 'animate-spin text-emerald-400' : 'text-slate-400 hover:text-emerald-400'
                  } ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}
                title="Làm mới ma trận lịch"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Cột phải: Khung Lịch Dropdown & Tài khoản */}
            <div className="relative flex items-center gap-2.5">

              {/* Nút Mở Lịch Dropdown */}
              <button
                id="calendar-toggle-btn"
                type="button"
                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                className={`flex h-9 px-3 items-center gap-1.5 rounded-xl border transition-all duration-200 active:scale-95 ${isCalendarOpen
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
                        className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMonthChange('next')}
                        className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
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

        {/* ==================== 4. KHU VỰC NỘI DUNG CHÍNH (MA TRẬN LỊCH SÂN REALTIME) ==================== */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 pb-28">

          {isAuthChecking ? (
            <div className="h-96 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs text-slate-400 font-medium">Đang đồng bộ dữ liệu lịch sân bóng...</p>
            </div>
          ) : !isAuthorized ? (

            /* CHẶN QUYỀN TRUY CẬP */
            <div className="max-w-md mx-auto my-12 p-6 sm:p-8 rounded-3xl border shadow-2xl text-center backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/25 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/10">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-black mb-1.5">Giới Hạn Quyền Quản Trị</h2>
              <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                Chức năng điều phối lịch đặt sân chỉ dành cho tài khoản <span className="font-bold text-emerald-400">Nhân viên</span> và <span className="font-bold text-emerald-400">Admin</span>.
              </p>

              {currentUser && (
                <div className={`p-3 rounded-xl border mb-4 text-left text-xs ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold">{currentUser.ho_ten}</div>
                      <div className="text-[11px] text-slate-400">{currentUser.email}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                      {currentUser.vai_tro || 'KHACH_HANG'}
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setIsLoginModalOpen(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{currentUser ? 'Đổi tài khoản Nhân viên / Admin' : 'Đăng nhập ngay'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className={`w-full py-2.5 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 ${isDarkMode ? 'border-slate-800 bg-slate-900 text-slate-300' : 'border-slate-200 bg-white text-slate-700'
                    }`}
                >
                  <span>Về trang chủ khách hàng</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : activeTab === 'pitch' ? (

            /* TAB 1: SÂN ĐẶT TRƯỚC (DANH SÁCH ĐƠN ĐẶT TRƯỚC - KHÔNG HIỂN THỊ LỊCH) */
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* Header Tab Sân Đặt Trước */}
              <div className={`p-5 rounded-2xl border shadow-lg ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-black shrink-0">
                      <LandPlot className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-black leading-tight">
                        Danh Sách Sân Đặt Trước
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Ngày: <strong className="text-emerald-400">{formatVietnameseDate(currentDate)}</strong> • Tổng cộng <strong>{rawBookings.filter(b => b.trang_thai !== 'DA_HUY').length}</strong> đơn đặt trước
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

              {/* Danh sách các đơn đặt trước */}
              {rawBookings.filter(b => b.trang_thai !== 'DA_HUY').length === 0 ? (
                <div className={`p-16 rounded-2xl border text-center ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <LandPlot className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-60" />
                  <h3 className="text-base font-bold text-slate-300">Chưa có sân nào được đặt trước hôm nay</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Hiện tại chưa ghi nhận đơn đặt sân trước nào cho ngày {formatVietnameseDate(currentDate)}.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('home')}
                    className="mt-4 px-4 py-2 rounded-xl border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Mở Lịch Sân Để Đặt Ca</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                          <button
                            type="button"
                            onClick={() => alert(`Chi tiết đơn đặt #${booking.id || booking.ma_don_dat}`)}
                            className="py-2 px-3 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                          >
                            Chi Tiết
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          ) : activeTab === 'services' ? (

            /* TAB 2: DỊCH VỤ */
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className={`p-5 rounded-2xl border shadow-lg ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-black shrink-0">
                    <Shirt className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black leading-tight">Dịch Vụ Đi Kèm</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Quản lý nước ngọt, khăn lạnh, thuê bóng, áo bib tập luyện.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[
                  { name: 'Nước Khoáng Aquafina 500ml', price: '10.000đ', unit: 'Chai', stock: '48 chai' },
                  { name: 'Nước Tăng Lực Revive Chanh Muối', price: '15.000đ', unit: 'Chai', stock: '36 chai' },
                  { name: 'Nước Tăng Lực Red Bull', price: '20.000đ', unit: 'Lon', stock: '24 lon' },
                  { name: 'Khăn Lạnh Cao Cấp', price: '5.000đ', unit: 'Cái', stock: '100 cái' },
                  { name: 'Thuê Bóng Thi Đấu Số 5', price: '30.000đ', unit: 'Quả/Trận', stock: '8 quả' },
                  { name: 'Thuê Bộ Áo Bib Phân Đội (10 áo)', price: '30.000đ', unit: 'Bộ/Trận', stock: '12 bộ' },
                ].map((item, idx) => (
                  <div key={idx} className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-emerald-400">{item.unit}</span>
                      <span className="text-[10px] text-slate-400 font-mono">Kho: {item.stock}</span>
                    </div>
                    <h4 className="font-bold text-sm mb-1">{item.name}</h4>
                    <div className="text-emerald-400 font-extrabold text-sm mb-3">{item.price}</div>
                    <button
                      type="button"
                      onClick={() => alert(`Thêm dịch vụ: ${item.name}`)}
                      className="w-full py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 font-bold text-xs transition-colors"
                    >
                      + Gọi Thêm Dịch Vụ
                    </button>
                  </div>
                ))}
              </div>
            </div>

          ) : activeTab === 'invoices' ? (

            /* TAB 4: HÓA ĐƠN */
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className={`p-5 rounded-2xl border shadow-lg ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-black shrink-0">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black leading-tight">Quản Lý Hóa Đơn</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Theo dõi doanh thu, hóa đơn cọc và thanh toán tiền sân.</p>
                  </div>
                </div>
              </div>

              <div className={`p-8 rounded-2xl border text-center ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
                <Receipt className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-60" />
                <h3 className="text-base font-bold text-slate-300">Hóa Đơn Ngày {formatVietnameseDate(currentDate)}</h3>
                <p className="text-xs text-slate-500 mt-1">Đang đồng bộ dữ liệu hóa đơn từ hệ thống thanh toán...</p>
              </div>
            </div>

          ) : activeTab === 'history' ? (

            /* TAB 5: LỊCH SỬ - ĐỒNG BỘ REAL-TIME VỚI WEB */
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* Header + bộ lọc */}
              <div className={`p-5 rounded-2xl border shadow-lg ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-black shrink-0">
                      <Book className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-black leading-tight">Lịch Sử Đặt Sân Toàn Hệ Thống</h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Tổng cộng <strong className="text-emerald-400">{historyBookings.length}</strong> đơn đặt • Đồng bộ real-time
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={fetchHistory}
                    disabled={isLoadingHistory}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${isDarkMode ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 shadow-sm'
                      }`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHistory ? 'animate-spin text-emerald-400' : 'text-slate-400'}`} />
                    Làm mới
                  </button>
                </div>

                {/* Bộ lọc */}
                <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-800/60">
                  {/* Lọc trạng thái */}
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}>
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

                  {/* Lọc ngày */}
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                    <CalendarCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-slate-400">Ngày:</span>
                    <input
                      type="date"
                      value={historyFilterDate}
                      onChange={(e) => setHistoryFilterDate(e.target.value)}
                      className="bg-transparent font-bold text-emerald-400 focus:outline-none cursor-pointer text-xs"
                    />
                    {historyFilterDate && (
                      <button type="button" onClick={() => setHistoryFilterDate('')} className="text-slate-400 hover:text-rose-400">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Tìm kiếm */}
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs ${isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                    <Search className="w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Tìm tên khách, SĐT..."
                      value={historySearchKeyword}
                      onChange={(e) => setHistorySearchKeyword(e.target.value)}
                      className="bg-transparent focus:outline-none text-xs w-32 sm:w-40"
                    />
                  </div>
                </div>
              </div>

              {/* Danh sách lịch sử */}
              {isLoadingHistory ? (
                <div className="p-16 text-center flex flex-col items-center gap-3">
                  <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                  <p className="text-xs font-bold text-slate-400">Đang tải lịch sử đặt sân...</p>
                </div>
              ) : (() => {
                const filtered = historyBookings.filter(b => {
                  const matchStatus = historyFilterStatus === 'ALL' || b.trang_thai === historyFilterStatus;
                  const matchDate = !historyFilterDate || (b.ngay_dat || '').startsWith(historyFilterDate);
                  const matchSearch = !historySearchKeyword.trim() ||
                    (b.ten_khach_hang || '').toLowerCase().includes(historySearchKeyword.toLowerCase()) ||
                    (b.so_dien_thoai || '').includes(historySearchKeyword) ||
                    (b.ten_san || '').toLowerCase().includes(historySearchKeyword.toLowerCase());
                  return matchStatus && matchDate && matchSearch;
                });

                return filtered.length === 0 ? (
                  <div className={`p-16 rounded-2xl border text-center ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <Book className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-50" />
                    <h3 className="text-base font-bold text-slate-400">Không có lịch sử nào phù hợp</h3>
                    <p className="text-xs text-slate-500 mt-1">Thử thay đổi bộ lọc hoặc làm mới dữ liệu.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((booking: any, idx: number) => {
                      const trangThaiColor = booking.trang_thai === 'DA_THANH_TOAN'
                        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                        : booking.trang_thai === 'DA_HUY'
                          ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                          : 'text-amber-400 bg-amber-500/10 border-amber-500/30';
                      const trangThaiLabel = booking.trang_thai === 'DA_THANH_TOAN' ? '✓ Đã thanh toán'
                        : booking.trang_thai === 'DA_HUY' ? '✗ Đã hủy'
                          : '⏳ Chờ TT';

                      return (
                        <div
                          key={booking.id || idx}
                          className={`p-4 rounded-2xl border transition-all duration-200 hover:shadow-xl ${isDarkMode ? 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/30' : 'bg-white border-slate-200 hover:border-emerald-300 shadow-sm'
                            }`}
                        >
                          {/* Header card */}
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="flex-1 min-w-0">
                              <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black border mb-1 ${trangThaiColor}`}>
                                {trangThaiLabel}
                              </span>
                              <h3 className="font-bold text-sm truncate">
                                {booking.ten_san || `Sân #${booking.ma_san}`}
                              </h3>
                            </div>
                            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-black border ${isDarkMode ? 'text-slate-400 border-slate-700 bg-slate-800' : 'text-slate-600 border-slate-300 bg-slate-100'
                              }`}>
                              #{booking.id || idx + 1}
                            </span>
                          </div>

                          {/* Thông tin */}
                          <div className="space-y-1.5 text-xs text-slate-400">
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <CalendarCheck className="w-3.5 h-3.5 text-emerald-400" /> Ngày đặt:
                              </span>
                              <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>
                                {booking.ngay_dat ? new Date(booking.ngay_dat).toLocaleDateString('vi-VN') : 'N/A'}
                              </strong>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-emerald-400" /> Khung giờ:
                              </span>
                              <strong className={`font-mono ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                {booking.gio_bat_dau?.substring(0, 5)} - {booking.gio_ket_thuc?.substring(0, 5)}
                              </strong>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <UserIcon className="w-3.5 h-3.5 text-emerald-400" /> Khách hàng:
                              </span>
                              <strong className={`truncate max-w-[140px] ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                {booking.ten_khach_hang || 'Khách vãng lai'}
                              </strong>
                            </div>

                            {booking.so_dien_thoai && (
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                  <Phone className="w-3.5 h-3.5 text-emerald-400" /> SĐT:
                                </span>
                                <strong className="font-mono text-emerald-400">{booking.so_dien_thoai}</strong>
                              </div>
                            )}

                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Tổng tiền:
                              </span>
                              <strong className="text-amber-400 font-mono">
                                {booking.tong_tien ? Number(booking.tong_tien).toLocaleString('vi-VN') + 'đ' : '—'}
                              </strong>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

          ) : (

            /* TAB HOME: LỊCH ĐẶT SÂN */
            <div className="space-y-5 animate-in fade-in duration-300">

              {/* Thẻ Thống Kê Nhanh & Trạng Thái Đồng Bộ */}
              <div className={`p-4 sm:p-5 rounded-2xl border shadow-lg transition-all ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-black shrink-0">
                      <Zap className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-black leading-tight">
                        Lịch Đặt Sân
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Ngày xem: <strong className="text-emerald-400">{formatVietnameseDate(currentDate)}</strong> ({sanBongList.length} sân đang hoạt động)
                      </p>
                    </div>
                  </div>

                  {/* 4 Thống kê nhanh */}
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

              {/* Thanh Điều Khiển Bộ Lọc (Loại Sân, Chọn Sân Cụ Thể, Tìm Kiếm & Chú Thích Màu) */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">

                  {/* Lọc loại sân */}
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                    }`}>
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

                  {/* Lọc sân cụ thể */}
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                    }`}>
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

                  {/* Ô tìm kiếm */}
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                    }`}>
                    <Search className="w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Tìm tên sân..."
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      className="bg-transparent focus:outline-none text-xs w-28 sm:w-36"
                    />
                  </div>
                </div>

                {/* Chú thích màu trạng thái */}
                <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-md bg-emerald-500/30 border border-emerald-500/60" />
                    <span>Trống (Khả dụng)</span>
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

              {/* BẢNG LỊCH ĐẶT SÂN */}
              <div className={`overflow-x-auto rounded-2xl border shadow-xl backdrop-blur-xl ${isDarkMode ? 'border-slate-800 bg-[#0f172a]/90' : 'border-slate-200 bg-white'
                }`}>
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
                ) : (
                  <table className="w-full text-left border-collapse min-w-[2000px]">
                    <thead>
                      <tr className={`border-b ${isDarkMode ? 'border-slate-800 bg-slate-950/80' : 'border-slate-200 bg-slate-100'}`}>
                        {/* Cột Tên Sân cố định bên trái */}
                        <th className={`p-3.5 text-xs font-black uppercase tracking-wider w-60 sticky left-0 z-20 backdrop-blur-md shadow-lg ${isDarkMode ? 'text-slate-300 bg-slate-950/95 border-r border-slate-800' : 'text-slate-700 bg-slate-100/95 border-r border-slate-200'
                          }`}>
                          Sân Bóng / Giờ Đá
                        </th>

                        {/* Danh sách các cột khung giờ */}
                        {timeSlotsList.map((slot) => (
                          <th
                            key={slot.start}
                            className={`p-2.5 text-center border-l min-w-[90px] ${isDarkMode ? 'border-slate-800/80' : 'border-slate-200'
                              }`}
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
                          {/* Cột Danh sách sân (Sticky bên trái khi cuộn) */}
                          <td className={`p-3.5 sticky left-0 z-10 border-r backdrop-blur-md shadow-md ${isDarkMode ? 'bg-slate-900/95 border-slate-800/80' : 'bg-white/95 border-slate-200'
                            }`}>
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

                          {/* Render từng ô slot khung giờ 30 phút */}
                          {timeSlotsList.map((slot) => {
                            const slotKey = `${san.id}_${slot.start}`;
                            const slotKeyRealtime = `${formattedDateISO}_${san.id}_${slot.start}`;
                            const slotData = gridSlots[slotKey];
                            const isBooked = slotData && slotData.trang_thai === 'DA_CHOT';
                            const isLockedByOther = lockedSlots.includes(slotKeyRealtime);

                            return (
                              <td
                                key={slot.start}
                                className={`p-1.5 border-l text-center transition-colors ${isDarkMode ? 'border-slate-800/70' : 'border-slate-200'
                                  }`}
                              >
                                {isBooked ? (
                                  /* Ô ĐÃ CÓ KHÁCH ĐẶT TRÊN CSDL */
                                  <button
                                    type="button"
                                    onClick={() => setSelectedSlotDetail({ san, slot, slotData })}
                                    className="w-full h-16 p-1.5 rounded-xl border border-rose-500/60 bg-gradient-to-br from-rose-950/80 to-red-950/90 text-rose-200 flex flex-col items-center justify-between shadow-sm hover:scale-[1.02] transition-all cursor-pointer select-none text-left"
                                    title={`Đã đặt: ${slotData.ten_khach_hang || 'Có khách'}`}
                                  >
                                    <div className="w-full flex items-center justify-between">
                                      <span className="text-[10px] font-mono font-bold text-rose-300">{slot.label}</span>
                                      <span className="text-[9px] px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 font-bold">#ĐÃ ĐẶT</span>
                                    </div>
                                    <div className="w-full truncate text-[10px] font-extrabold text-rose-200 text-center">
                                      {slotData.ten_khach_hang || 'Khách đặt'}
                                    </div>
                                    <div className="w-full text-center text-[9px] text-rose-400/80 font-mono">
                                      {slotData.gio_bat_dau_don && slotData.gio_ket_thuc_don ? `${slotData.gio_bat_dau_don}-${slotData.gio_ket_thuc_don}` : slot.start}
                                    </div>
                                  </button>
                                ) : isLockedByOther ? (
                                  /* Ô ĐANG CÓ NGƯỜI KHÁC GIỮ CHỖ REALTIME TRÊN WEB */
                                  <div
                                    className="w-full h-16 p-1.5 rounded-xl border border-amber-500/40 bg-amber-950/40 text-amber-300 flex flex-col items-center justify-between opacity-80 cursor-not-allowed select-none"
                                    title="Đang có khách thao tác giữ chỗ"
                                  >
                                    <div className="w-full flex items-center justify-between">
                                      <span className="text-[10px] font-mono font-bold">{slot.label}</span>
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                                    </div>
                                    <span className="text-[9px] font-bold text-amber-400 uppercase">GIỮ CHỖ</span>
                                    <span className="text-[8px] text-amber-500/80 font-mono">Đang chọn</span>
                                  </div>
                                ) : (
                                  /* Ô SÂN TRỐNG KHẢ DỤNG */
                                  <button
                                    type="button"
                                    onClick={() => setSelectedSlotDetail({ san, slot, slotData })}
                                    className={`w-full h-16 p-1.5 rounded-xl border flex flex-col items-center justify-between transition-all duration-200 group shadow-sm hover:scale-[1.02] cursor-pointer ${isDarkMode
                                      ? 'bg-emerald-950/30 hover:bg-emerald-900/50 border-emerald-600/30 hover:border-emerald-400'
                                      : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 hover:border-emerald-500'
                                      }`}
                                    title={`Trống: Bấm để đặt nhanh ${san.ten_san} ca ${slot.start}`}
                                  >
                                    <div className="w-full flex items-center justify-between">
                                      <span className="text-[10px] font-mono font-bold text-emerald-400">{slot.label}</span>
                                      <span className="text-[9px] text-slate-400 font-mono">{slot.start}</span>
                                    </div>
                                    <span className="text-[10px] font-black text-emerald-500 group-hover:text-emerald-300">
                                      TRỐNG
                                    </span>
                                    <span className="w-full py-0.5 text-[9px] text-center rounded-lg bg-emerald-500/15 group-hover:bg-emerald-500 group-hover:text-slate-950 text-emerald-400 font-bold transition-all">
                                      + Chi tiết
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

        {/* ==================== 5. MODAL CHI TIẾT SLOT LỊCH ==================== */}
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
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Thông tin chi tiết */}
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
                  className="flex-1 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 font-bold text-xs"
                >
                  Đóng
                </button>
                {selectedSlotDetail.slotData?.trang_thai !== 'DA_CHOT' && (
                  <button
                    type="button"
                    onClick={() => {
                      alert(`Nhân viên tạo nhanh đơn đặt cho ${selectedSlotDetail.san.ten_san} lúc ${selectedSlotDetail.slot.start}`);
                      setSelectedSlotDetail(null);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25"
                  >
                    + Đặt Chỗ Ngay
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== 6. CÀI ĐẶT & POPUP TÀI KHOẢN (GÓC DƯỚI BÊN TRÁI) ==================== */}
        <div ref={settingsRef} className="fixed bottom-22 left-6 z-50">
          {isSettingsOpen && (
            <div className={`absolute bottom-14 left-0 w-60 rounded-2xl border p-4 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200 ${isDarkMode ? 'bg-[#0f172a]/95 border-slate-700 text-white' : 'bg-white/95 border-slate-200 text-slate-900'
              }`}>
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cài Đặt & Tài Khoản</span>
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="text-slate-400 hover:text-slate-200"
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

                  {/* Nút Quay lại Website */}
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

                  {/* Nút Quay lại Website */}
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

          <button
            id="settings-floating-btn"
            type="button"
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`flex h-12 w-12 items-center justify-center rounded-2xl border shadow-2xl transition-all duration-300 active:scale-90 cursor-pointer ${isSettingsOpen
              ? 'bg-emerald-500 border-emerald-500 text-slate-950 rotate-90 scale-105'
              : isDarkMode
                ? 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-emerald-400'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-emerald-600'
              }`}
            title="Cài đặt & Tài khoản"
            aria-label="Cài đặt & Tài khoản"
          >
            <Settings className="h-6 w-6" />
          </button>
        </div>

        {/* ==================== 7. THANH MENU DƯỚI CÙNG (BOTTOM NAVIGATION) ==================== */}
        <nav
          aria-label="Thanh điều hướng dưới cùng"
          className={`fixed bottom-0 left-0 right-0 z-40 w-full border-t backdrop-blur-2xl transition-colors ${isDarkMode ? 'bg-[#0f172a]/95 border-slate-800' : 'bg-white/95 border-slate-200'
            }`}
        >
          <div className="max-w-3xl mx-auto flex items-center justify-around px-4 py-2.5">

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
              className="group relative -top-4 flex flex-col items-center focus:outline-none cursor-pointer"
            >
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-xl transition-all duration-300 group-active:scale-95 ${activeTab === 'home'
                ? 'bg-gradient-to-tr from-emerald-600 to-teal-400 text-slate-950 shadow-emerald-500/40 scale-105 ring-4 ring-slate-900 dark:ring-slate-950'
                : isDarkMode
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 ring-4 ring-slate-900'
                  : 'bg-emerald-500 text-white hover:bg-emerald-600 ring-4 ring-white shadow-emerald-500/20'
                }`}>
                <Home className="h-7 w-7" />
              </div>
              <span className={`text-[11px] font-black mt-1 tracking-tight ${activeTab === 'home' ? 'text-emerald-400' : isDarkMode ? 'text-slate-400' : 'text-slate-600'
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

      {/* MODAL ĐĂNG NHẬP */}
      <Login
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  );
}
