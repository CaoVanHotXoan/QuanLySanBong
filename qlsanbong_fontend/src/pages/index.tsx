"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { io, Socket } from 'socket.io-client';
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
  LandPlot
} from 'lucide-react';
import Login, { AuthUser } from './Login/login';
import Profile from '../profile/profile';
import SoccerLoader from '../components/SoccerLoader';
import DateNavigationBar from '../components/DateNavigationBar';

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

// Helper kiểm tra sân hoặc loại sân có phải là "Dự bị" hay không
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

  // Chuyển đổi Giao diện Sáng / Tối
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

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

  // State xác thực người dùng đã đăng nhập (Lưu từ SQL Server)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [loginInitialRegister, setLoginInitialRegister] = useState<boolean>(false);

  // State tìm kiếm nhanh tên sân tại Navbar
  const [searchCourtName, setSearchCourtName] = useState<string>('');

  // Kiểm tra quyền Admin cho người dùng hiện tại
  const isUserAdmin = Boolean(
    currentUser && (
      (currentUser.vai_tro || '').trim().toUpperCase() === 'ADMIN' ||
      (currentUser.vai_tro || '').trim().toUpperCase() === 'QUAN_TRI_VIEN' ||
      (currentUser.vai_tro || '').toLowerCase().includes('admin') ||
      (currentUser.vai_tro || '').toLowerCase().includes('quản trị') ||
      (currentUser.email || '').toLowerCase().includes('admin')
    )
  );

  // Kiểm tra quyền Nhân viên & Admin cho Management System
  const isUserStaffOrAdmin = Boolean(
    currentUser && (
      isUserAdmin ||
      (currentUser.vai_tro || '').trim().toUpperCase() === 'NHAN_VIEN' ||
      (currentUser.vai_tro || '').trim().toUpperCase() === 'NHANVIEN' ||
      (currentUser.vai_tro || '').toLowerCase().includes('nhân viên') ||
      (currentUser.vai_tro || '').toLowerCase().includes('nhan vien')
    )
  );

  // State Bộ lọc Đặt sân nhanh (Loại sân, Sân cụ thể & Ngày đá)
  const [filterLoaiSan, setFilterLoaiSan] = useState<string>('ALL');
  const [filterSanId, setFilterSanId] = useState<string>('ALL');
  const [filterNgayDa, setFilterNgayDa] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [filterKhungGio, setFilterKhungGio] = useState<string>('ALL');

  // Danh sách Khung giờ tải động từ CSDL SQL Server (Mặc định 6h - 19h)
  const [timeSlotsList, setTimeSlotsList] = useState<KhungGioItem[]>(DEFAULT_TIME_SLOTS);

  // State Quản lý Modal Đặt Sân
  const [selectedSlot, setSelectedSlot] = useState<{
    san: SanBong;
    slot: { start: string; end: string; label: string };
    durationMin: number; // 60 | 90 | 120
    gioKetThuc: string; // VD: '08:30'
    giaTien: number;
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
            if (b.ma_san !== san.id || b.trang_thai === 'DA_HUY') return false;
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

  // Tải toàn bộ dữ liệu ban đầu từ Backend SQL Server khi Component khởi tạo
  useEffect(() => {
    const loadAllInitialData = async () => {
      setIsLoadingData(true);
      await Promise.all([
        fetchLoaiSan(),
        fetchSanBong(),
        fetchKhungGio(),
        fetchDichVu()
      ]);
      setIsLoadingData(false);
    };

    loadAllInitialData();
  }, []);

  // Khởi tạo kết nối Real-time Socket.io Client
  useEffect(() => {
    const socket: Socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('⚡ Đã kết nối Real-time Socket server:', socket.id);
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

    // Lắng nghe sự kiện cập nhật đơn đặt
    socket.on('booking_updated', () => {
      fetchLichSan(filterNgayDa, sanBongList);
      fetchDichVu();
    });

    return () => {
      socket.disconnect();
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

  // Xử lý khi thanh toán MB Bank PayOS thành công
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

  // Kiểm tra trạng thái giao dịch PayOS
  const checkPayOSStatus = async (orderCode: number, manual: boolean = false) => {
    if (!orderCode) return;
    if (manual) {
      setIsCheckingPayOS(true);
      setQrModalAlert({
        type: 'info',
        title: 'Đang kiểm tra giao dịch với MB Bank...',
        message: 'Hệ thống đang kết nối trực tiếp với MB Bank và PayOS để đối soát giao dịch.',
      });
    }
    try {
      const res = await fetch(`${API_BASE_URL}/thanh-toan/payos/trang-thai/${orderCode}`);
      const data = await res.json();
      if (data.success && (data.isPaid || data.status === 'PAID')) {
        setQrModalAlert(null);
        handlePaymentSuccessAction(data.data);
      } else if (manual) {
        setQrModalAlert({
          type: 'error',
          title: 'Chưa Nhận Được Tiền Chuyển Khoản!',
          message: 'Soccer 247 chưa nhận được tiền chuyển khoản! Quý khách vui lòng quét mã chuyển tiền hoặc thử lại sau vài giây.',
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

  // Hàm đóng Modal đặt sân và giải phóng ô đang giữ chỗ Real-time & hủy đơn tạm nếu chưa thanh toán
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

  // Kiểm tra xung đột thời lượng đặt (60p, 90p, 120p) với các đơn đặt đã có trong CSDL
  const checkConflictForSan = useCallback((sanId: number, start: string, durationMin: number) => {
    const end = addMinutesToTime(start, durationMin);
    return rawBookings.some((b) => {
      if (b.ma_san !== sanId || b.trang_thai === 'DA_HUY') return false;
      const bStart = (b.gio_bat_dau || '').substring(0, 5);
      const bEnd = (b.gio_ket_thuc || '').substring(0, 5);
      return isTimeOverlapping(start, end, bStart, bEnd);
    });
  }, [rawBookings]);

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

  // Mở Modal đặt sân khi click vào ô Slot Sân Trống (Kèm Khóa Real-time)
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

    const slotData = gridSlots[`${san.id}_${slot.start}`];

    // -------------------------------------------------------------
    // TÍNH TOÁN DANH SÁCH CÁC Ô SLOT THUỘC THỜI LƯỢNG ĐẶT SÂN
    // -------------------------------------------------------------
    // Mặc định chọn 1 tiếng 30 phút (90 phút) nếu không trùng, hoặc chọn 60 phút
    const canDo90 = !checkConflictForSan(san.id, slot.start, 90);
    const canDo60 = !checkConflictForSan(san.id, slot.start, 60);
    const initialDuration = canDo90 ? 90 : canDo60 ? 60 : 120;
    const initialEndTime = addMinutesToTime(slot.start, initialDuration);
    const donGiaPhut = Number(san.don_gia_phut) || 5000;
    const giaTien = initialDuration * donGiaPhut;

    // Tính toàn bộ các ô 30 phút mà khách 1 sẽ chiếm giữ
    const totalSlots = Math.ceil(initialDuration / 30);
    const initialSlotKeys: string[] = [];
    let curTime = slot.start;
    for (let i = 0; i < totalSlots; i++) {
      initialSlotKeys.push(`${filterNgayDa}_${san.id}_${curTime}`);
      curTime = addMinutesToTime(curTime, 30);
    }

    // 1. Kiểm tra nếu bất kỳ ô nào trong khoảng này đang bị khách khác giữ
    const isAnySlotLockedByOther = initialSlotKeys.some(
      (k) => lockedSlots.includes(k) && !myLockedSlotIds.includes(k)
    );
    if (isAnySlotLockedByOther) {
      triggerToast({
        type: 'info',
        message: `Khung giờ ${slot.label} (${slot.start} - ${initialEndTime}) của ${san.ten_san} đang có khách hàng khác chọn giữ chỗ!`,
      });
      return;
    }

    // 2. Nếu ô đã có đơn đặt trong CSDL (DA_CHOT / CHO_XAC_NHAN)
    if (slotData && slotData.trang_thai !== 'TRONG') {
      triggerToast({
        type: 'error',
        message: `Khung giờ ${slot.label} (${slot.start}) của ${san.ten_san} đã được đặt (${slotData.gio_bat_dau_don} - ${slotData.gio_ket_thuc_don}). Vui lòng chọn ô trống khác!`,
      });
      return;
    }

    // 3. Khóa toàn bộ các ô thuộc khoảng thời gian đã chọn trên Socket.IO Real-time
    socketRef.current?.emit('lock_slots', initialSlotKeys);
    setMyLockedSlotIds(initialSlotKeys);

    setSelectedSlot({
      san,
      slot,
      durationMin: initialDuration,
      gioKetThuc: initialEndTime,
      giaTien,
    });
    setBookingStep('DURATION');
    setBookingForm((prev) => ({
      ...prev,
      ho_ten: currentUser?.ho_ten || prev.ho_ten || '',
      so_dien_thoai: currentUser?.so_dien_thoai || prev.so_dien_thoai || '',
      dich_vu_chon: {},
    }));
  };

  /**
   * Chọn thời lượng đặt sân (1 Tiếng, 1 Tiếng 30 Phút, 2 Tiếng)
   * Tự động tính toán lại tất cả các ô slot cần khóa và phát tín hiệu Socket.IO
   * để Khách hàng 2 nhìn thấy các ô chuyển sang MÀU CAM Real-time
   */
  const handleSelectDuration = (durationMin: number) => {
    if (!selectedSlot) return;
    const newEndTime = addMinutesToTime(selectedSlot.slot.start, durationMin);
    const donGiaPhut = Number(selectedSlot.san.don_gia_phut) || 5000;
    const newGiaTien = durationMin * donGiaPhut;

    // Tính danh sách các ô slot 30 phút tương ứng với thời lượng mới
    const totalSlots = Math.ceil(durationMin / 30);
    const newSlotKeys: string[] = [];
    let curTime = selectedSlot.slot.start;
    for (let i = 0; i < totalSlots; i++) {
      newSlotKeys.push(`${filterNgayDa}_${selectedSlot.san.id}_${curTime}`);
      curTime = addMinutesToTime(curTime, 30);
    }

    // Gửi sự kiện lock_slots lên Socket.IO để khóa đồng loạt các ô này
    socketRef.current?.emit('lock_slots', newSlotKeys);
    setMyLockedSlotIds(newSlotKeys);

    setSelectedSlot({
      ...selectedSlot,
      durationMin,
      gioKetThuc: newEndTime,
      giaTien: newGiaTien,
    });
  };

  // Thay đổi số lượng dịch vụ chọn thêm
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

  // Chuyển từ Bước 1 (DURATION) sang Bước 2 (INFO)
  const handleProceedToInfo = () => {
    if (!selectedSlot) return;
    if (checkConflictForSan(selectedSlot.san.id, selectedSlot.slot.start, selectedSlot.durationMin)) {
      triggerToast({
        type: 'error',
        message: 'Khung giờ bạn chọn bị trùng với lịch đã đặt. Vui lòng chọn thời lượng khác!',
      });
      return;
    }
    setBookingStep('INFO');
  };

  // Chuyển sang màn hình Quét mã QR thanh toán PayOS VietQR MB Bank (Bước 3: QR)
  const handleProceedToQR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;

    if (!bookingForm.ho_ten.trim() || !bookingForm.so_dien_thoai.trim()) {
      triggerToast({
        type: 'error',
        message: 'Vui lòng điền đầy đủ Họ tên và Số điện thoại liên hệ!',
      });
      return;
    }

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
            ho_ten: bookingForm.ho_ten,
            so_dien_thoai: bookingForm.so_dien_thoai,
          },
          so_tien: soTienThanhToan,
          loai_thanh_toan: bookingForm.loai_thanh_toan,
          ho_ten: bookingForm.ho_ten,
          so_dien_thoai: bookingForm.so_dien_thoai,
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

      // Giải phóng toàn bộ các ô giữ chỗ Real-time trên Socket
      socketRef.current?.emit('unlock_all');
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
    <div className={`min-h-screen transition-colors duration-300 font-sans selection:bg-emerald-500 selection:text-white ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}>
      <Head>
        <title>Soccer247 - Hệ Thống Đặt Sân Thể Thao Trực Tuyến 24/7</title>
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
          className={`fixed top-28 right-5 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl border backdrop-blur-md transition-all duration-300 animate-slide-in ${toastMessage.type === 'success'
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
      <header className={`fixed top-0 left-0 right-0 z-40 backdrop-blur-xl border-b transition-colors duration-300 shadow-xl ${isDarkMode ? 'bg-slate-950/95 border-emerald-900/40' : 'bg-white/95 border-slate-200'
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
                  <span className={`text-xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>SOCCER</span>
                  <span className="text-xl font-black tracking-tight text-emerald-500">247</span>
                </div>
                <p className="text-[9px] uppercase font-bold tracking-widest text-emerald-600 dark:text-emerald-500/80 -mt-1">Sân Thể Thao 24/7</p>
              </div>
            </a>

            {/* KHUNG TÌM KIẾM TÊN SÂN Ở GIỮA (ĐÃ BỎ CHỮ SQL LIVE THEO YÊU CẦU) */}
            <div className="flex-1 max-w-lg mx-1 sm:mx-4">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-emerald-500 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchCourtName}
                  onChange={(e) => setSearchCourtName(e.target.value)}
                  placeholder="Tìm kiếm tên sân (VD: Sân 5A, Sân 7, Pickleball...)"
                  className={`w-full pl-10 pr-10 py-2 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-1 transition-all ${isDarkMode
                    ? 'bg-slate-900/90 border border-slate-700/80 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500'
                    : 'bg-slate-100/90 border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:ring-emerald-600'
                    }`}
                />
                {searchCourtName && (
                  <button
                    onClick={() => setSearchCourtName('')}
                    className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* CỤM NÚT PHẢI: NÚT SÁNG/TỐI + ĐĂNG NHẬP (ĐÃ BỎ 2 NÚT ĐẶT SÂN NHANH & TRANG QUẢN TRỊ THEO YÊU CẦU) */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">

              {/* Nút Chuyển đổi Theme Sáng / Tối */}
              <button
                type="button"
                onClick={() => setIsDarkMode(!isDarkMode)}
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
                          href="/Management System/management system"
                          onClick={(e) => {
                            e.preventDefault();
                            setUserDropdownOpen(false);
                            router.push('/Management System/management system');
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
            </div>

          </div>
        </div>

        {/* TẦNG 2: THANH MENU ĐIỀU HƯỚNG CHÍNH (SUB-NAVBAR - ĐÃ BỎ NÚT TRANG QUẢN TRỊ THEO YÊU CẦU) */}
        <div className={`transition-colors duration-300 border-t ${isDarkMode ? 'bg-slate-950/70 border-slate-900' : 'bg-slate-100/80 border-slate-200'
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
                📅 Lịch sân theo giờ
              </a>
            </nav>

            {/* Thông tin hỗ trợ nhanh */}
            <div className="hidden md:flex items-center gap-4 text-[11px] font-semibold text-slate-400 shrink-0">
              <span className={`flex items-center gap-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                <Phone className="w-3.5 h-3.5 text-emerald-500" />
                Hotline Đặt Sân: <strong className="text-emerald-500 font-mono">0816344504</strong>
              </span>
            </div>

          </div>
        </div>

      </header>

      <main className="pt-28">
        {/* =====================================================================
            2. HERO SECTION (THANH ĐẶT SÂN NHANH TƯƠNG TÁC)
            ===================================================================== */}
        <section id="hero" className={`relative py-20 lg:py-28 overflow-hidden border-b transition-colors duration-300 ${isDarkMode
          ? 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/40 via-slate-950 to-slate-950 border-emerald-950/40'
          : 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100/60 via-slate-50 to-white border-slate-200'
          }`}>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {/* Headline chính */}
            <h1 className={`text-4xl sm:text-6xl font-black tracking-tight max-w-4xl mx-auto leading-tight ${isDarkMode ? 'text-white' : 'text-slate-900'
              }`}>
              <div>Đặt Sân Thể Thao</div>
              <div className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 bg-clip-text text-transparent my-1 sm:my-2">
                Nhanh Dễ Dàng
              </div>
              <span className={`text-3xl sm:text-5xl font-extrabold mt-1 block ${isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                Chọn Giờ Vào Đá Ngay
              </span>
            </h1>
          </div>
        </section>

        {/* =====================================================================
            3. LỊCH SÂN THEO THỜI GIAN (CUỘN NGANG)
            ===================================================================== */}
        <section id="ma-tran-lich-san" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <h2 className={`text-2xl sm:text-4xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Lịch Sân Theo Thời Gian
              </h2>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Bấm vào các ô màu xanh lá để chọn thời lượng (1 tiếng, 1 tiếng 30 phút, 2 tiếng) và thanh toán đặt sân.
              </p>
            </div>

            {/* Bảng chú giải trạng thái */}
            <div className={`flex flex-wrap items-center gap-3 p-2.5 rounded-2xl border text-xs font-semibold ${isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}>
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/40 text-emerald-600 dark:text-emerald-300">
                <span className="w-3 h-3 rounded-md bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                <span>Sân Trống</span>
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/50 text-amber-500 dark:text-amber-400">
                <span className="w-3 h-3 rounded-md bg-amber-500 shadow-sm shadow-amber-500/50 animate-pulse" />
                <span>Đang Giữ Chỗ (Màu Cam)</span>
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/40 text-rose-600 dark:text-rose-300">
                <span className="w-3 h-3 rounded-md bg-rose-500 shadow-sm shadow-rose-500/50" />
                <span>Đã Đặt</span>
              </div>
            </div>
          </div>

          {/* THANH ĐIỀU HƯỚNG NGÀY & BỘ LỌC SÂN (DATE NAVIGATION & COURT FILTER) */}
          <div className={`mb-6 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 rounded-2xl border shadow-lg backdrop-blur-md relative z-30 ${isDarkMode ? 'bg-slate-900/80 border-slate-800 shadow-slate-950/40' : 'bg-white border-slate-200 shadow-slate-200/50'
            }`}>
            <div className="flex flex-wrap items-center gap-3">
              {/* NÚT LỌC SÂN BÓNG (HIỂN THỊ LỊCH SÂN ĐÓ) */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${isDarkMode
                ? 'bg-slate-950/90 border-slate-700 hover:border-emerald-500 focus-within:border-emerald-500'
                : 'bg-slate-50 border-slate-300 hover:border-emerald-500 focus-within:border-emerald-500 shadow-sm'
                }`}>
                <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-500" />
                <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  Lọc Sân:
                </span>
                <select
                  value={filterSanId}
                  onChange={(e) => setFilterSanId(e.target.value)}
                  className={`bg-transparent text-xs font-black focus:outline-none cursor-pointer ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'
                    }`}
                >
                  <option value="ALL" className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>
                    Tất Cả Các Sân ({sanBongList.filter((s) => !isDuBiPitch(s)).length} sân)
                  </option>
                  {sanBongList.filter((s) => !isDuBiPitch(s)).map((san) => (
                    <option key={san.id} value={san.id} className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>
                      {san.ten_san}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <DateNavigationBar
              value={filterNgayDa}
              onChange={(_date, formattedDateStr) => setFilterNgayDa(formattedDateStr)}
            />
          </div>

          {/* KHUNG BẢNG MA TRẬN GRID (CUỘN NGANG) */}
          <div className={`overflow-x-auto rounded-3xl border shadow-2xl backdrop-blur-xl ${isDarkMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white/90'
            }`}>
            {isLoadingData ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
                <p className="text-sm font-semibold">Đang tải dữ liệu thực từ CSDL SQL Server...</p>
              </div>
            ) : filteredSanList.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <p className="text-base font-bold">Không tìm thấy sân bóng nào phù hợp với bộ lọc!</p>
              </div>
            ) : filteredSanList.length === 1 ? (
              /* GIAO DIỆN 1 SÂN: CÁC Ô KHUNG GIỜ XẾP XUỐNG DƯỚI ĐẸP MẮT (KHÔNG CUỘN NGANG) */
              (() => {
                const san = filteredSanList[0];
                return (
                  <div className="p-6 sm:p-8 space-y-6">
                    {/* Header thông tin sân đã lọc */}
                    <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg ${isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-slate-950 font-black shadow-md shadow-emerald-500/25 shrink-0">
                          <Zap className="w-6 h-6" />
                        </div>
                        <div>
                          <div>
                            <h3 className={`text-xl sm:text-2xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{san.ten_san}</h3>
                          </div>
                          <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2 sm:gap-3">
                            <span>Ngày xem: <strong className={isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}>{formatDateDMY(filterNgayDa)}</strong></span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold">
                        <span className="text-slate-400">Trạng thái:</span>
                        <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 font-bold">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          Sẵn sàng đặt sân
                        </span>
                      </div>
                    </div>

                    {/* Danh sách các ô giờ xếp xuống (Grid đa cột responsive) */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                          <Clock className="w-4 h-4" /> Danh Sách Khung Giờ (Bấm ô xanh để chọn giờ)
                        </h4>
                        <span className="text-xs text-slate-400">{filteredTimeSlots.length} khung giờ khả dụng</span>
                      </div>

                      {filteredTimeSlots.length === 0 ? (
                        <div className={`text-center py-12 px-4 rounded-2xl border border-dashed ${isDarkMode ? 'border-slate-800 bg-slate-900/30 text-slate-400' : 'border-slate-300 bg-slate-50 text-slate-600'}`}>
                          <Clock className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto mb-3 opacity-60" />
                          <p className="text-sm font-bold">
                            Tất cả các khung giờ hôm nay đã kết thúc hoặc đã qua giờ.
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            Quý khách vui lòng chọn ngày tiếp theo để đặt sân!
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4">
                          {filteredTimeSlots.map((slot) => {
                            const slotKey = `${san.id}_${slot.start}`;
                            const slotKeyRealtime = `${filterNgayDa}_${san.id}_${slot.start}`;
                            const slotData = gridSlots[slotKey];
                            const isBooked = slotData && slotData.trang_thai === 'DA_CHOT';
                            const isPast = isSlotInThePast(slot.start);
                            const isLockedByOther =
                              lockedSlots.includes(slotKeyRealtime) && !myLockedSlotIds.includes(slotKeyRealtime);

                            return (
                              <div key={slot.start} className="w-full">
                                {isBooked ? (
                                  <div
                                    title="Khung giờ này đã được đặt"
                                    className="w-full h-28 p-3 rounded-2xl border border-rose-600/70 bg-gradient-to-br from-rose-950/90 to-red-950/90 text-rose-300 flex flex-col items-center justify-between shadow-md shadow-rose-950/40 cursor-not-allowed select-none transition-all"
                                  >
                                    <div className="w-full flex items-center justify-between">
                                      <span className="text-sm font-black text-rose-300 font-mono">{slot.label}</span>
                                      <span className="text-[10px] text-rose-400/80 font-mono">{slot.start}</span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center my-auto">
                                      <span className="inline-flex items-center gap-1.5 text-xs font-black text-rose-300 tracking-wide">
                                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                                        ĐÃ ĐẶT
                                      </span>
                                    </div>
                                    <div className="w-full text-center">
                                      <span className="text-[10px] text-rose-400/80 font-mono font-bold px-2.5 py-0.5 rounded-full bg-rose-900/40">
                                        Hết chỗ
                                      </span>
                                    </div>
                                  </div>
                                ) : isPast ? (
                                  /* Khung giờ đã qua trong ngày -> Khóa màu xám, không chọn được */
                                  <div
                                    title={`Khung giờ ${slot.label} đã qua`}
                                    className={`w-full h-28 p-3 rounded-2xl border flex flex-col items-center justify-between select-none cursor-not-allowed transition-all ${
                                      isDarkMode
                                        ? 'border-slate-800 bg-slate-900/40 text-slate-500 opacity-60'
                                        : 'border-slate-300 bg-slate-100 text-slate-400 opacity-70'
                                    }`}
                                  >
                                    <div className="w-full flex items-center justify-between">
                                      <span className="text-sm font-extrabold text-slate-400 font-mono line-through">{slot.label}</span>
                                      <span className="text-[10px] text-slate-400 font-mono">{slot.start}</span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center my-auto">
                                      <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                                        ĐÃ QUA GIỜ
                                      </span>
                                    </div>
                                    <div className="w-full text-center">
                                      <span className="text-[10px] text-slate-400 font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800">
                                        Khóa giờ
                                      </span>
                                    </div>
                                  </div>
                                ) : isLockedByOther ? (
                                  /* 3. KHÁCH HÀNG KHÁC ĐANG GIỮ CHỖ THỜI GIAN THỰC -> KHÓA MÀU CAM NỔI BẬT */
                                  <div
                                    title="Khung giờ này đang được khách hàng khác giữ chỗ thao tác đặt sân"
                                    onClick={() => {
                                      triggerToast({
                                        type: 'info',
                                        message: `Khung giờ ${slot.label} (${slot.start}) của ${san.ten_san} đang được khách hàng khác chọn giữ chỗ. Vui lòng chọn khung giờ khác!`,
                                      });
                                    }}
                                    className="w-full h-28 p-3 rounded-2xl border border-amber-500/80 bg-gradient-to-br from-amber-950/90 via-orange-950/85 to-amber-900/90 text-amber-300 flex flex-col items-center justify-between shadow-lg shadow-amber-950/50 cursor-not-allowed select-none transition-all hover:scale-[1.02]"
                                  >
                                    <div className="w-full flex items-center justify-between">
                                      <span className="text-sm font-black text-amber-300 font-mono">{slot.label}</span>
                                      <span className="text-[10px] text-amber-400 font-mono font-bold">{slot.start}</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-1 my-auto">
                                      <span className="inline-flex items-center gap-1.5 text-xs font-black text-amber-300 tracking-wide">
                                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                                        ĐANG GIỮ CHỖ
                                      </span>
                                      <span className="text-[10px] text-amber-300/90 font-medium">Khách đang chọn...</span>
                                    </div>
                                    <div className="w-full text-center">
                                      <span className="text-[10px] text-amber-300 font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30">
                                        Tạm Khóa (Màu Cam)
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleSlotClick(san, slot)}
                                    className={`w-full h-28 p-3 rounded-2xl border transition-all duration-200 flex flex-col items-center justify-between group shadow-sm hover:scale-[1.03] cursor-pointer ${isDarkMode
                                        ? 'bg-emerald-950/40 hover:bg-emerald-900/60 border-emerald-600/40 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-950/50'
                                        : 'bg-emerald-50 hover:bg-emerald-100/80 border-emerald-300 hover:border-emerald-500 hover:shadow-md hover:shadow-emerald-200'
                                      }`}
                                  >
                                    <div className="w-full flex items-center justify-between">
                                      <span className={`text-sm font-black font-mono group-hover:scale-110 transition-transform ${isDarkMode ? 'text-emerald-400' : 'text-slate-900'}`}>
                                        {slot.label}
                                      </span>
                                      <span className={`text-[11px] font-mono font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-700'}`}>{slot.start}</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-0.5 my-auto">
                                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                                        TRỐNG
                                      </span>
                                      <span className={`text-[10px] font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Khả dụng</span>
                                    </div>
                                    <span className="w-full py-1 text-[11px] text-center rounded-xl bg-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-slate-950 text-emerald-600 dark:text-emerald-400 transition-all font-black">
                                      + Chọn Giờ
                                    </span>
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()
            ) : filteredTimeSlots.length === 0 ? (
              <div className={`text-center py-16 px-4 rounded-2xl border border-dashed m-6 ${isDarkMode ? 'border-slate-800 bg-slate-900/30 text-slate-400' : 'border-slate-300 bg-slate-50 text-slate-600'}`}>
                <Clock className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-3 opacity-60" />
                <p className="text-base font-bold">
                  Tất cả các khung giờ trong ngày đã qua hoặc không còn khung giờ khả dụng.
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  Quý khách vui lòng đổi sang ngày tiếp theo để xem lịch sân và đặt chỗ!
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[2000px]">
                <thead>
                  <tr className={`border-b ${isDarkMode ? 'border-slate-800 bg-slate-950/80' : 'border-slate-200 bg-slate-100/90'
                    }`}>
                    <th className={`p-4 sm:p-5 text-xs font-black uppercase tracking-wider w-56 sticky left-0 z-20 backdrop-blur-md shadow-lg ${isDarkMode ? 'text-slate-300 bg-slate-950/95 border-r border-slate-800' : 'text-slate-700 bg-slate-100/95 border-r border-slate-200'
                      }`}>
                      Sân Bóng / Giờ Bắt Đầu
                    </th>
                    {filteredTimeSlots.map((slot) => (
                      <th key={slot.start} className={`p-3 text-center border-l min-w-[95px] ${isDarkMode ? 'border-slate-800/80' : 'border-slate-200'
                        }`}>
                        <div className={`text-base font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{slot.label}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{slot.start}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
                  {filteredSanList.map((san) => (
                    <tr key={san.id} className={isDarkMode ? 'hover:bg-slate-800/20 transition-colors' : 'hover:bg-slate-50 transition-colors'}>
                      {/* Cột Danh sách sân - Cố định bên trái khi cuộn */}
                      <td className={`p-4 sm:p-5 sticky left-0 z-10 border-r backdrop-blur-md shadow-md ${isDarkMode ? 'bg-slate-900/95 border-slate-800/80' : 'bg-white/95 border-slate-200'
                        }`}>
                        <div className={`font-extrabold text-sm sm:text-base flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'
                          }`}>
                          {san.ten_san}
                        </div>
                      </td>

                      {/* Các ô Slot 30 phút trên dòng của sân */}
                      {filteredTimeSlots.map((slot) => {
                        const slotKey = `${san.id}_${slot.start}`;
                        const slotKeyRealtime = `${filterNgayDa}_${san.id}_${slot.start}`;
                        const slotData = gridSlots[slotKey];
                        const isBooked = slotData && slotData.trang_thai === 'DA_CHOT';
                        const isPast = isSlotInThePast(slot.start);

                        // Kiểm tra nếu ô đang bị người khác giữ chỗ Real-time
                        const isLockedByOther =
                          lockedSlots.includes(slotKeyRealtime) && !myLockedSlotIds.includes(slotKeyRealtime);

                        return (
                          <td key={slot.start} className={`p-2 border-l text-center ${isDarkMode ? 'border-slate-800/60' : 'border-slate-200'
                            }`}>
                            {/* 1. TRƯỜNG HỢP: ĐÃ CÓ ĐƠN ĐẶT TRONG CSDL -> HIỂN THỊ MÀU ĐỎ NỔI BẬT & CHỈ HIỆN ĐÃ ĐẶT */}
                            {isBooked ? (
                              <div
                                title="Khung giờ này đã được đặt"
                                className="w-full h-20 p-2 rounded-2xl border border-rose-600/70 bg-gradient-to-br from-rose-950/90 to-red-950/90 text-rose-300 flex flex-col items-center justify-center gap-1.5 shadow-md shadow-rose-950/40 cursor-not-allowed select-none transition-all"
                              >
                                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                                <span className="text-xs font-black text-rose-300 tracking-wider">
                                  ĐÃ ĐẶT
                                </span>
                              </div>
                            ) : isPast ? (
                              /* 2. TRƯỜNG HỢP: ĐÃ QUA GIỜ SO VỚI THỜI GIAN HIỆN TẠI (MÀU XÁM - KHÓA) */
                              <div
                                title={`Khung giờ ${slot.label} đã qua`}
                                className={`w-full h-20 p-2 rounded-2xl border flex flex-col items-center justify-center gap-1 cursor-not-allowed select-none transition-all ${
                                  isDarkMode
                                    ? 'border-slate-800 bg-slate-900/40 text-slate-500 opacity-60'
                                    : 'border-slate-300 bg-slate-100 text-slate-400 opacity-70'
                                }`}
                              >
                                <span className="text-xs font-black text-slate-400 dark:text-slate-500 tracking-wider">
                                  ĐÃ QUA
                                </span>
                                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 font-mono line-through">
                                  {slot.label}
                                </span>
                              </div>
                            ) : isLockedByOther ? (
                              /* 3. TRƯỜNG HỢP: ĐANG CÓ NGƯỜI KHÁC GIỮ CHỖ REALTIME (MÀU CAM NỔI BẬT) */
                              <div
                                title="Khung giờ này đang được khách hàng khác giữ chỗ thao tác đặt sân"
                                onClick={() => {
                                  triggerToast({
                                    type: 'info',
                                    message: `Khung giờ ${slot.label} (${slot.start}) của ${san.ten_san} đang được khách hàng khác chọn giữ chỗ. Vui lòng chọn khung giờ khác!`,
                                  });
                                }}
                                className="w-full h-20 p-2 rounded-2xl border border-amber-500/80 bg-gradient-to-br from-amber-950/90 via-orange-950/85 to-amber-900/90 text-amber-300 flex flex-col items-center justify-center gap-1 shadow-md shadow-amber-950/50 cursor-not-allowed select-none transition-all hover:scale-[1.02]"
                              >
                                <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-300 tracking-wide">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                                  ĐANG GIỮ CHỖ
                                </span>
                                <span className="text-[9px] text-amber-300/90 font-bold truncate max-w-[100px]">
                                  {slot.label} (Khóa)
                                </span>
                              </div>
                            ) : (
                              /* 4. TRƯỜNG HỢP: SÂN TRỐNG (MÀU XANH LÁ) -> CLICK ĐỂ CHỌN THỜI LƯỢNG 1H, 1H30, 2H */
                              <button
                                onClick={() => handleSlotClick(san, slot)}
                                className={`w-full h-20 p-2 rounded-2xl border transition-all duration-200 flex flex-col items-center justify-center gap-1 group shadow-sm hover:scale-[1.03] cursor-pointer ${isDarkMode
                                  ? 'bg-emerald-950/40 hover:bg-emerald-900/60 border-emerald-600/40 hover:border-emerald-400'
                                  : 'bg-emerald-50 hover:bg-emerald-100/80 border-emerald-300 hover:border-emerald-500'
                                  }`}
                              >
                                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                                  TRỐNG
                                </span>
                                <span className={`text-[11px] font-black font-mono ${isDarkMode ? 'text-emerald-300' : 'text-slate-900'}`}>
                                  {slot.label}
                                </span>
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                                  + Chọn Giờ
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
        </section>



        {/* =====================================================================
            5. FOOTER & THÔNG TIN LIÊN HỆ
            ===================================================================== */}
        <footer id="chinh-sach-lien-he" className={`border-t pt-20 pb-12 transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-900 text-slate-100 border-slate-800'
          }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pb-16 border-b border-slate-800/80">

              {/* Cột 1: Thông tin thương hiệu & Liên hệ */}
              <div className="lg:col-span-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-700 flex items-center justify-center overflow-hidden">
                    <SoccerBallIcon className="w-6 h-6" />
                  </div>
                  <span className="text-2xl font-black text-white">
                    SOCCER<span className="text-emerald-400">247</span>
                  </span>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed max-w-lg">
                  Trung tâm thể thao đa năng hiện đại. Toàn bộ quy trình đặt sân, tính giá và thanh toán được quản lý bởi Soccer 247.
                </p>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3 text-sm text-slate-300">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Hotline đặt sân:</div>
                      <div className="font-bold text-white text-base font-mono">0816344504</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-slate-300">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Email:</div>
                      <div className="font-bold text-white">sinhvienxoan@gmail.com</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-slate-300">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Địa chỉ cụm sân:</div>
                      <div className="font-bold text-white">Biên Hòa - Đồng Nai</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cột 2: Bản đồ Google Maps */}
              <div className="lg:col-span-6 space-y-4">
                <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-400" />
                  Bản Đồ Vị Trí Cụm Sân
                </h3>
                <div className="w-full h-56 rounded-2xl overflow-hidden border border-slate-800 shadow-xl relative bg-slate-900">
                  <iframe
                    title="Bản đồ Soccer247"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d125397.66986427306!2d106.74558239014159!3d10.950005799999998!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3174d95267b2d5cb%3A0xbcf4a755a9b736b0!2zVHAuIEJpw6puIEjDsmEsIMSQ4buTbmcgTmFp!5e0!3m2!1svi!2s!4v1700000000000!5m2!1svi!2s"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen={false}
                    loading="lazy"
                    className="w-full h-full grayscale contrast-125 opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                  />
                </div>
              </div>

            </div>

            {/* Bản quyền */}
            <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
              <p>© 2026 Soccer 247.</p>
              <div className="flex items-center gap-6">
                <a href="#" className="hover:text-emerald-400 transition-colors">Điều khoản dịch vụ</a>
                <a href="#" className="hover:text-emerald-400 transition-colors">Bảo mật thông tin</a>
              </div>
            </div>
          </div>
        </footer>
      </main>

      {/* =====================================================================
          6. MODAL ĐẶT SÂN TƯƠNG TÁC (GIAO TIẾP VỚI CSDL SQL SERVER)
          ===================================================================== */}
      {selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
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
                  : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                  1
                </span>
                <span className={bookingStep === 'DURATION' ? 'text-emerald-400 font-extrabold' : 'text-slate-400'}>
                  Chọn Giờ Kết Thúc
                </span>
              </div>

              <ArrowRight className="w-3.5 h-3.5 text-slate-600" />

              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${bookingStep === 'INFO'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/30'
                  : bookingStep === 'QR' ? 'bg-emerald-500/20 text-emerald-400' : isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'
                  }`}>
                  2
                </span>
                <span className={bookingStep === 'INFO' ? 'text-emerald-400 font-extrabold' : 'text-slate-400'}>
                  Thông Tin & Dịch Vụ
                </span>
              </div>

              <ArrowRight className="w-3.5 h-3.5 text-slate-600" />

              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${bookingStep === 'QR'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/30'
                  : isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'
                  }`}>
                  3
                </span>
                <span className={bookingStep === 'QR' ? 'text-emerald-400 font-extrabold' : 'text-slate-400'}>
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
                    <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Sân bóng & Ngày đá</div>
                    <div className={`text-base font-black mt-0.5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {selectedSlot.san.ten_san} <span className="text-xs font-medium text-emerald-500">({selectedSlot.san.ten_loai || 'Sân bóng'})</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">Ngày: <span className="text-slate-200 font-semibold">{formatDateDMY(filterNgayDa)}</span></div>
                  </div>

                  <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                    <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Giờ Bắt Đầu</div>
                    <div className="text-xl font-black text-emerald-500 font-mono">
                      {selectedSlot.slot.label} ({selectedSlot.slot.start})
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Đơn giá: {(Number(selectedSlot.san.don_gia_phut) || 5000).toLocaleString('vi-VN')} đ/phút
                    </div>
                  </div>
                </div>

                {/* Phần chọn 3 nút thời lượng */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      Chọn Giờ Kết Thúc / Thời Lượng Thuê
                    </h4>
                    <span className="text-xs text-slate-400 font-medium">Bấm chọn 1 trong 3 mức</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* NÚT 1: 1 TIẾNG (60 PHÚT) */}
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
                            <span className={`text-base font-black ${isSelected ? 'text-emerald-400' : isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                              1 Tiếng
                            </span>
                            <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                              60 phút
                            </span>
                          </div>

                          <div className="text-xs text-slate-400 mb-1">
                            Giờ kết thúc: <span className="font-bold text-slate-200 font-mono">{endTime}</span>
                          </div>

                          <div className="text-sm font-extrabold text-emerald-500 mt-2">
                            {price.toLocaleString('vi-VN')} đ
                          </div>

                          {isConflict && (
                            <div className="mt-2 text-[10px] font-bold text-rose-400 flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> Trùng lịch đã đặt
                            </div>
                          )}
                        </button>
                      );
                    })()}

                    {/* NÚT 2: 1 TIẾNG 30 PHÚT (90 PHÚT) - PHỔ BIẾN */}
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
                          <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500 text-slate-950 shadow-sm">
                            ⭐ Phổ Biến Nhất
                          </div>

                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-base font-black ${isSelected ? 'text-emerald-400' : isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                              1 Tiếng 30 Phút
                            </span>
                          </div>

                          <div className="text-xs text-slate-400 mb-1">
                            Giờ kết thúc: <span className="font-bold text-slate-200 font-mono">{endTime}</span>
                          </div>

                          <div className="text-sm font-extrabold text-emerald-500 mt-2">
                            {price.toLocaleString('vi-VN')} đ
                          </div>

                          {isConflict && (
                            <div className="mt-2 text-[10px] font-bold text-rose-400 flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> Trùng lịch đã đặt
                            </div>
                          )}
                        </button>
                      );
                    })()}

                    {/* NÚT 3: 2 TIẾNG (120 PHÚT) */}
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
                            <span className={`text-base font-black ${isSelected ? 'text-emerald-400' : isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                              2 Tiếng
                            </span>
                            <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                              120 phút
                            </span>
                          </div>

                          <div className="text-xs text-slate-400 mb-1">
                            Giờ kết thúc: <span className="font-bold text-slate-200 font-mono">{endTime}</span>
                          </div>

                          <div className="text-sm font-extrabold text-emerald-500 mt-2">
                            {price.toLocaleString('vi-VN')} đ
                          </div>

                          {isConflict && (
                            <div className="mt-2 text-[10px] font-bold text-rose-400 flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> Trùng lịch đã đặt
                            </div>
                          )}
                        </button>
                      );
                    })()}
                  </div>
                </div>

                {/* Tóm tắt khung giờ đã chọn */}
                <div className={`p-4 rounded-2xl border space-y-2 text-xs ${isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Khung giờ đá:</span>
                    <span className="font-black text-sm text-emerald-400 font-mono">
                      {selectedSlot.slot.start} ➔ {selectedSlot.gioKetThuc}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Thời lượng:</span>
                    <span className="font-bold text-slate-200">
                      {selectedSlot.durationMin} phút ({selectedSlot.durationMin === 60 ? '1 tiếng' : selectedSlot.durationMin === 90 ? '1 tiếng 30 phút' : '2 tiếng'})
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-sm font-bold">
                    <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>Tiền thuê sân:</span>
                    <span className="text-emerald-500 text-base font-black">{selectedSlot.giaTien.toLocaleString('vi-VN')} đ</span>
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
                    <span className="text-slate-400">Ngày thi đấu:</span>
                    <div className={`font-bold text-sm mt-0.5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{formatDateDMY(filterNgayDa)}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Khung giờ ({selectedSlot.durationMin}p):</span>
                    <div className="font-black text-emerald-500 text-sm mt-0.5 font-mono">
                      {selectedSlot.slot.start} - {selectedSlot.gioKetThuc}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Tiền sân:</span>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={`text-xs font-semibold block mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        Họ và Tên người đặt <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="VD: Nguyễn Văn A"
                        value={bookingForm.ho_ten}
                        onChange={(e) => setBookingForm({ ...bookingForm, ho_ten: e.target.value })}
                        className={`w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-emerald-500 ${isDarkMode ? 'bg-slate-950 border border-slate-800 text-slate-100' : 'bg-slate-50 border border-slate-300 text-slate-900'
                          }`}
                      />
                    </div>
                    <div>
                      <label className={`text-xs font-semibold block mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        Số điện thoại liên hệ <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="VD: 0912345678"
                        value={bookingForm.so_dien_thoai}
                        onChange={(e) => setBookingForm({ ...bookingForm, so_dien_thoai: e.target.value })}
                        className={`w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-emerald-500 ${isDarkMode ? 'bg-slate-950 border border-slate-800 text-slate-100' : 'bg-slate-50 border border-slate-300 text-slate-900'
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
                            <div className="text-[11px] text-emerald-500 font-semibold">
                              {dv.don_gia.toLocaleString('vi-VN')} đ <span className="text-slate-400 font-normal">/{dv.don_vi_tinh}</span>
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
                        <p className="text-[11px] text-slate-400 mt-1">Giữ chỗ trước, thanh toán số còn lại khi đến sân</p>
                      </div>
                      <span className="text-sm font-black text-emerald-500">
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
                        <p className="text-[11px] text-slate-400 mt-1">Vào sân thi đấu ngay không cần trả thêm</p>
                      </div>
                      <span className="text-sm font-black text-emerald-500">
                        {tongTienDon.toLocaleString('vi-VN')} đ
                      </span>
                    </label>
                  </div>
                </div>

                {/* Bảng tổng tiền */}
                <div className={`p-4 rounded-2xl border space-y-2 text-xs ${isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex justify-between text-slate-400">
                    <span>Tiền thuê sân ({selectedSlot.durationMin} phút):</span>
                    <span className="font-semibold text-slate-200">{selectedSlot.giaTien.toLocaleString('vi-VN')} đ</span>
                  </div>
                  {tongTienDichVu > 0 && (
                    <div className="flex justify-between text-slate-400">
                      <span>Dịch vụ & Nước uống chọn thêm:</span>
                      <span className="font-semibold text-slate-200">{tongTienDichVu.toLocaleString('vi-VN')} đ</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-slate-800 text-sm font-bold">
                    <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>Tổng giá trị đơn:</span>
                    <span className="text-emerald-500 text-base">{tongTienDon.toLocaleString('vi-VN')} đ</span>
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
                      <div className="flex justify-between items-center pb-2 border-b border-slate-800/60">
                        <span className="text-slate-400">Mã đơn đặt sân:</span>
                        <span className="font-mono font-black text-emerald-400 text-sm">#{payOSData?.ma_don_dat || selectedSlot?.san.id}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-slate-800/60">
                        <span className="text-slate-400">Mã giao dịch PayOS:</span>
                        <span className="font-mono font-bold text-slate-200">#{payOSData?.orderCode}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-slate-800/60">
                        <span className="text-slate-400">Sân bóng & Khung giờ:</span>
                        <span className="font-bold text-slate-200">{selectedSlot?.san.ten_san} ({selectedSlot?.slot.start} - {selectedSlot?.gioKetThuc})</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-slate-800/60">
                        <span className="text-slate-400">Khách hàng:</span>
                        <span className="font-bold text-slate-200">{bookingForm.ho_ten} ({bookingForm.so_dien_thoai})</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Số tiền thanh toán:</span>
                        <span className="font-mono font-black text-emerald-400 text-base">{soTienThanhToan.toLocaleString('vi-VN')} đ</span>
                      </div>
                    </div>

                    {/* Đếm ngược và các nút hành động */}
                    <div className="space-y-3 max-w-md mx-auto pt-2">
                      <div className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-emerald-400" />
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
                        <span>MB Bank PayOS VietQR • Tự Động Duyệt 3-5 Giây</span>
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
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800/60 dark:border-slate-800">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-emerald-500" /> Ngân hàng:
                        </span>
                        <span className={`font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                          MB Bank (Ngân hàng TMCP Quân Đội)
                        </span>
                      </div>

                      <div className="flex items-center justify-between pb-2 border-b border-slate-800/60 dark:border-slate-800">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <User className="w-4 h-4 text-emerald-500" /> Chủ tài khoản:
                        </span>
                        <span className={`font-black tracking-wide ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                          {payOSData?.accountName || 'CAO VAN HOT XOAN'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pb-2 border-b border-slate-800/60 dark:border-slate-800">
                        <span className="text-slate-400">Số tài khoản:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-emerald-500 text-sm sm:text-base tracking-wider">
                            {payOSData?.accountNumber || 'VQRQAMKSW8778'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyText(payOSData?.accountNumber || 'VQRQAMKSW8778', 'Số tài khoản')}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            title="Sao chép số tài khoản"
                          >
                            {copiedField === 'Số tài khoản' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pb-2 border-b border-slate-800/60 dark:border-slate-800">
                        <span className="text-slate-400">Số tiền cần chuyển:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-base sm:text-lg font-black text-emerald-500">
                            {(payOSData?.amount || soTienThanhToan).toLocaleString('vi-VN')} đ
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyText(String(payOSData?.amount || soTienThanhToan), 'Số tiền')}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            title="Sao chép số tiền"
                          >
                            {copiedField === 'Số tiền' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Nội dung chuyển khoản:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm sm:text-base font-black px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            {payOSData?.description || `DS${payOSData?.orderCode || ''}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyText(payOSData?.description || `DS${payOSData?.orderCode || ''}`, 'Nội dung')}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            title="Sao chép nội dung chuyển khoản"
                          >
                            {copiedField === 'Nội dung' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
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
                        <strong>Lưu ý:</strong> Vui lòng điền <strong>chính xác nội dung chuyển khoản</strong> để MB Bank và PayOS tự động kích hoạt lịch sân của bạn ngay lập tức mà không cần xác nhận thủ công.
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
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
