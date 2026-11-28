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
  ChevronUp,
  Sun,
  Moon,
  ArrowLeft,
  ArrowRight,
  QrCode,
  RefreshCw,
  Flame,
  Check,
  Lock,
  Copy,
  Download,
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
  Plus,
  Layers,
  Ticket,
  Tag,
  Percent,
  Gift,
  FileText
} from 'lucide-react';
import Login, { AuthUser } from './Login/login';
import Profile from './profile';
import CourtDetailModal from '../components/CourtDetailModal';
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
  mo_ta: string | null;
  icon?: string | null;
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
  tien_ich?: string | null;
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

/**
 * Interface Mã Khuyến Mãi / Voucher Ưu Đãi (Khuyen_Mai trong CSDL SQL Server)
 */
interface Voucher {
  id: number;
  ma_code: string;
  tieu_de: string;
  mo_ta: string | null;
  loai_giam: 'PHAN_TRAM' | 'SO_TIEN';
  gia_tri_giam: number;
  giam_toi_da: number | null;
  don_toi_thieu: number;
  chi_danh_cho_khach_moi: boolean;
  gio_bat_dau: string | null;
  gio_ket_thuc: string | null;
  thu_trong_tuan: string | null;
  so_luong: number;
  so_luong_da_dung: number;
  hop_le_khach_hang?: number | boolean;
  da_tung_dat_san?: number;
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

// Danh sách các khung giờ đá chuẩn theo giờ từ 06:00 đến 20:00 (6h, 7h, 8h .. 19h, mỗi ca 60 phút)
const DEFAULT_TIME_SLOTS: KhungGioItem[] = [];
for (let h = 6; h <= 19; h++) {
  const start0 = `${String(h).padStart(2, '0')}:00`;
  const end0 = `${String(h + 1).padStart(2, '0')}:00`;
  DEFAULT_TIME_SLOTS.push({
    start: start0,
    end: end0,
    label: `${h}h`,
  });
}

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

// Icon quả bóng Pickleball đục lỗ (Perforated Wiffle Ball) - Biểu tượng độc nhất vô nhị của môn Pickleball
export function PickleballIcon({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Màu vàng chanh neon 3D đặc trưng của bóng thi đấu Pickleball chuẩn quốc tế */}
        <radialGradient id="pickleballBallGrad" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="40%" stopColor="#EAB308" />
          <stop offset="75%" stopColor="#CA8A04" />
          <stop offset="100%" stopColor="#854D0E" />
        </radialGradient>
      </defs>

      {/* Thân quả bóng tròn chuẩn */}
      <circle cx="18" cy="18" r="15" fill="url(#pickleballBallGrad)" stroke="#A16207" strokeWidth="1.2" />

      {/* Các lỗ đục đặc trưng của bóng Pickleball với độ sâu 3D */}
      {/* Lỗ trung tâm */}
      <circle cx="18" cy="18" r="2.2" fill="#451A03" stroke="#78350F" strokeWidth="0.8" />
      <circle cx="17.6" cy="17.6" r="1.3" fill="#260F02" />

      {/* Vòng lỗ bên trong */}
      <circle cx="18" cy="9.8" r="2" fill="#451A03" stroke="#78350F" strokeWidth="0.7" />
      <circle cx="24.8" cy="13.2" r="1.9" fill="#451A03" stroke="#78350F" strokeWidth="0.7" />
      <circle cx="24.8" cy="22.8" r="1.9" fill="#451A03" stroke="#78350F" strokeWidth="0.7" />
      <circle cx="18" cy="26.2" r="2" fill="#451A03" stroke="#78350F" strokeWidth="0.7" />
      <circle cx="11.2" cy="22.8" r="1.9" fill="#451A03" stroke="#78350F" strokeWidth="0.7" />
      <circle cx="11.2" cy="13.2" r="1.9" fill="#451A03" stroke="#78350F" strokeWidth="0.7" />

      {/* Vòng lỗ viền xung quanh (co lại theo phối cảnh hình cầu) */}
      <ellipse cx="18" cy="4.8" rx="1.6" ry="0.9" fill="#451A03" />
      <ellipse cx="29" cy="9.2" rx="1.2" ry="1.6" fill="#451A03" />
      <ellipse cx="31.2" cy="18" rx="0.9" ry="1.7" fill="#451A03" />
      <ellipse cx="29" cy="26.8" rx="1.2" ry="1.6" fill="#451A03" />
      <ellipse cx="18" cy="31.2" rx="1.6" ry="0.9" fill="#451A03" />
      <ellipse cx="7" cy="26.8" rx="1.2" ry="1.6" fill="#451A03" />
      <ellipse cx="4.8" cy="18" rx="0.9" ry="1.7" fill="#451A03" />
      <ellipse cx="7" cy="9.2" rx="1.2" ry="1.6" fill="#451A03" />

      {/* Ánh sáng phản chiếu bóng nhựa (Gloss Highlight) */}
      <ellipse cx="13" cy="9.5" rx="3.5" ry="1.8" transform="rotate(-30 13 9.5)" fill="#FFFFFF" fillOpacity="0.45" />
    </svg>
  );
}

// Cấu hình thông tin hiển thị môn thể thao (Icon, mô tả đặc điểm)
export interface SportTheme {
  icon: React.ReactNode;
  subtitle: string;
  badge?: string;
  gradient: string;
  iconBg: string;
  accentColor: string;
}

// Hàm resolve icon môn thể thao an toàn tuyệt đối (hỗ trợ slug, emoji chuẩn và tự động nhận diện theo tên)
export const resolveSportIcon = (name: string, customIcon?: string | null): React.ReactNode => {
  const raw = (customIcon || '').trim();
  if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('/') || raw.startsWith('data:image')) {
    return (
      <img
        src={raw}
        alt={name || 'Icon'}
        className="w-full h-full object-contain p-0.5"
        onError={(e) => {
          (e.currentTarget as HTMLElement).style.display = 'none';
        }}
      />
    );
  }

  const c = raw.toLowerCase();
  if (c === 'pickleball') return '🏓';
  if (c === 'bong-da' || c === 'soccer' || c === 'football') return '⚽';
  if (c === 'quan-vot' || c === 'tennis') return '🎾';
  if (c === 'cau-long' || c === 'badminton') return '🏸';
  if (c === 'bong-ro' || c === 'basketball') return '🏀';
  if (c === 'bong-ban' || c === 'table-tennis' || c === 'ping-pong') return '🏓';
  if (c === 'bong-chuyen' || c === 'volleyball') return '🏐';

  // Nếu customIcon là emoji hợp lệ (không phải chuỗi lỗi mã hóa / mojibake '?' hoặc 'đŸ' hoặc 'â')
  if (raw && !raw.includes('?') && !raw.includes('đŸ') && !raw.includes('â')) {
    return raw;
  }

  // Tự động nhận diện chuẩn theo tên môn thể thao
  const n = (name || '')
    .toLowerCase()
    .replace(/[đĐ]/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  if (n.includes('pickleball')) return '🏓';
  if (n.includes('bong da') || n.includes('san 5') || n.includes('san 7') || n.includes('san 11') || n.includes('mini') || n.includes('futsal')) return '⚽';
  if (n.includes('cau long') || n.includes('badminton')) return '🏸';
  if (n.includes('quan vot') || n.includes('tennis')) return '🎾';
  if (n.includes('bong ro') || n.includes('basketball')) return '🏀';
  if (n.includes('bong chuyen') || n.includes('volleyball')) return '🏐';
  if (n.includes('bong ban') || n.includes('table tennis') || n.includes('ping pong')) return '🏓';

  return '🏟️';
};

export const getSportTheme = (name: string, moTa?: string | null, customIcon?: string | null): SportTheme => {
  const n = (name || '')
    .toLowerCase()
    .replace(/[đĐ]/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
  
  const icon = resolveSportIcon(name, customIcon);

  if (n.includes('bong da') || n.includes('san 5') || n.includes('san 7') || n.includes('san 11') || n.includes('mini') || n.includes('futsal')) {
    return {
      icon,
      subtitle: moTa || '',
      gradient: 'from-blue-950/40 via-slate-900/60 to-slate-900/90',
      iconBg: 'bg-blue-500/15 border-blue-500/30 text-blue-400',
      accentColor: 'text-blue-400',
    };
  }
  if (n.includes('cau long') || n.includes('badminton')) {
    return {
      icon,
      subtitle: moTa || '',
      gradient: 'from-indigo-950/40 via-slate-900/60 to-slate-900/90',
      iconBg: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400',
      accentColor: 'text-indigo-400',
    };
  }
  if (n.includes('pickleball')) {
    return {
      icon,
      subtitle: moTa || '',
      gradient: 'from-emerald-950/40 via-slate-900/60 to-slate-900/90',
      iconBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
      accentColor: 'text-emerald-400',
    };
  }
  if (n.includes('quan vot') || n.includes('tennis')) {
    return {
      icon,
      subtitle: moTa || '',
      gradient: 'from-amber-950/40 via-slate-900/60 to-slate-900/90',
      iconBg: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
      accentColor: 'text-amber-400',
    };
  }
  if (n.includes('bong ro') || n.includes('basketball')) {
    return {
      icon,
      subtitle: moTa || '',
      gradient: 'from-orange-950/40 via-slate-900/60 to-slate-900/90',
      iconBg: 'bg-orange-500/15 border-orange-500/30 text-orange-400',
      accentColor: 'text-orange-400',
    };
  }
  if (n.includes('bong chuyen') || n.includes('volleyball')) {
    return {
      icon,
      subtitle: moTa || '',
      gradient: 'from-purple-950/40 via-slate-900/60 to-slate-900/90',
      iconBg: 'bg-purple-500/15 border-purple-500/30 text-purple-400',
      accentColor: 'text-purple-400',
    };
  }
  if (n.includes('bong ban') || n.includes('table tennis') || n.includes('ping pong')) {
    return {
      icon,
      subtitle: moTa || '',
      gradient: 'from-rose-950/40 via-slate-900/60 to-slate-900/90',
      iconBg: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
      accentColor: 'text-rose-400',
    };
  }
  return {
    icon,
    subtitle: moTa || '',
    gradient: 'from-slate-950/40 via-slate-900/60 to-slate-900/90',
    iconBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
    accentColor: 'text-emerald-400',
  };
};

// Helper kiểm tra sân hoặc loại sân có phải là "Dự bị" hay không để ẩn trên trang chủ Khách hàng
function isDuBiPitch(item?: { ten_loai?: string; ten_san?: string; mo_ta?: string | null } | null): boolean {
  if (!item) return false;
  const str = `${item.ten_loai || ''} ${item.ten_san || ''} ${item.mo_ta || ''}`
    .toLowerCase()
    .replace(/[đĐ]/g, 'd')
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
  const courtFilterDropdownRef = useRef<HTMLDivElement>(null);
  const [isCourtFilterOpen, setIsCourtFilterOpen] = useState<boolean>(false);

  // Danh sách các ID slot đang bị khóa trên hệ thống Real-time (toàn bộ các khách hàng đang chọn)
  const [lockedSlots, setLockedSlots] = useState<string[]>([]);

  // Danh sách các SlotId do CHÍNH khách hàng hiện tại đang giữ chỗ khi chọn mốc thời gian trong Modal
  const [myLockedSlotIds, setMyLockedSlotIds] = useState<string[]>([]);
  const myLockedSlotId = myLockedSlotIds[0] || null;

  // Trạng thái thu gọn thanh giỏ hàng nổi để xem trọn vẹn màn hình lịch sân không bị che
  const [isCartBarCollapsed, setIsCartBarCollapsed] = useState(false);

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
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [loginInitialRegister, setLoginInitialRegister] = useState<boolean>(false);

  // State Modal Chi tiết Sân & Đánh giá/Bình luận
  const [selectedCourtDetailId, setSelectedCourtDetailId] = useState<number | null>(null);
  const [isCourtDetailModalOpen, setIsCourtDetailModalOpen] = useState<boolean>(false);

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

  // Chế độ hiển thị khung giờ đặt sân: 'CALENDAR' (Google Calendar view) | 'GRID' (Lưới nút)
  const [bookingViewMode, setBookingViewMode] = useState<'CALENDAR' | 'GRID'>('CALENDAR');

  // Chế độ hiển thị con trong Google Calendar: 'ONE_SCREEN' (Trọn 1 màn hình) | 'TIMELINE' (Dòng thời gian dọc)
  const [calendarSubMode, setCalendarSubMode] = useState<'ONE_SCREEN' | 'TIMELINE'>('TIMELINE');

  // Sân được chọn trong chế độ Google Calendar (mặc định 'FIRST' = sân đầu tiên để vừa trọn 1 màn hình)
  const [calendarSelectedCourtId, setCalendarSelectedCourtId] = useState<number | 'ALL' | 'FIRST'>('FIRST');

  // Bật/tắt hiển thị khung giờ đêm (00:00 - 06:00)
  const [showNightSlots, setShowNightSlots] = useState<boolean>(false);

  // Bộ lọc chỉ hiện ca trống & tìm ca trống sớm nhất (Lựa chọn 3 / B)
  const [onlyShowEmptySlots, setOnlyShowEmptySlots] = useState<boolean>(false);
  const [isSearchingNextSlot, setIsSearchingNextSlot] = useState<boolean>(false);

  // Ref container cuộn của Google Calendar
  const calendarScrollRef = useRef<HTMLDivElement>(null);

  // Phút hiện tại trong ngày để tính vị trí vạch đỏ Google Calendar
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState<number>(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTimeMinutes(now.getHours() * 60 + now.getMinutes());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const handleSelectCategory = (loai: LoaiSan) => {
    setSelectedCategory(loai);
    setFilterLoaiSan(String(loai.id));
    setFilterSanId('ALL');
    setCalendarSelectedCourtId('FIRST');
    setIsCourtFilterOpen(false);
  };

  const handleCloseCategoryModal = () => {
    setSelectedCategory(null);
    setFilterLoaiSan('ALL');
    setFilterSanId('ALL');
    setCalendarSelectedCourtId('FIRST');
    setIsCourtFilterOpen(false);
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
  const [multiBookingStep, setMultiBookingStep] = useState<'CART' | 'SERVICES' | 'CONFIRM' | 'QR'>('CART');
  const [multiPayOSData, setMultiPayOSData] = useState<any>(null);
  const [holdSecondsLeft, setHoldSecondsLeft] = useState<number>(600); // 10 phút giữ sân (600 giây)

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
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; message: string; shortMessage?: string } | null>(null);

  // State Quản lý Mã Giảm Giá & Voucher Ưu Đãi (Shopee / Grab style)
  const [voucherList, setVoucherList] = useState<Voucher[]>([]);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState<boolean>(false);
  const [voucherInput, setVoucherInput] = useState<string>('');
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [isValidatingVoucher, setIsValidatingVoucher] = useState<boolean>(false);

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
  const triggerToast = (toast: { type: 'success' | 'error' | 'info'; message: string; shortMessage?: string }) => {
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

  // Đếm ngược 10 phút giữ sân (600 giây) khi có sân trong giỏ hàng
  useEffect(() => {
    if (cartCourts.length === 0) {
      setHoldSecondsLeft(600);
      return;
    }

    const timer = setInterval(() => {
      setHoldSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Hết 10 phút giữ sân: Tự động giải phóng các ô giữ chỗ và làm mới giỏ
          socketRef.current?.emit('unlock_all');
          setMyLockedSlotIds([]);
          setCartCourts([]);
          setIsMultiBookingModalOpen(false);
          setMultiBookingStep('CART');
          setBookingForm((p) => ({ ...p, dich_vu_chon: {}, ghi_chu: '' }));
          setAppliedVoucher(null);
          setVoucherInput('');
          setVoucherError(null);
          triggerToast({
            type: 'info',
            message: '⏱️ Thời gian giữ sân 10 phút đã hết! Các sân đã được giải phóng để khách hàng khác có thể đặt.',
          });
          return 600;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cartCourts.length]);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Khôi phục và đồng bộ thông tin người dùng từ localStorage khi tải trang hoặc khi có cập nhật
  const syncCurrentUser = async () => {
    try {
      const savedAuthUser = localStorage.getItem('auth_user') || localStorage.getItem('soccer_current_user');
      const token = typeof window !== 'undefined'
        ? (localStorage.getItem('auth_token') || localStorage.getItem('token') || '')
        : '';
      if (savedAuthUser) {
        const parsed: any = JSON.parse(savedAuthUser);
        const normalized: AuthUser = {
          ...parsed,
          ho_ten: parsed.ho_ten || parsed.hoTen || '',
          email: parsed.email || '',
          so_dien_thoai: parsed.so_dien_thoai || parsed.soDienThoai || '',
          dia_chi: parsed.dia_chi || parsed.diaChi || '',
          anh_dai_dien: parsed.anh_dai_dien || parsed.avatarUrl || ''
        };
        setCurrentUser(normalized);

        // Tự động kiểm tra và đồng bộ avatar mới nhất từ server nếu chưa có avatar
        if (token && !normalized.anh_dai_dien) {
          try {
            const res = await fetch(`${API_BASE_URL}/auth/me`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success && data.data && data.data.anh_dai_dien) {
              const updated = {
                ...normalized,
                anh_dai_dien: data.data.anh_dai_dien,
                ho_ten: data.data.ho_ten || normalized.ho_ten
              };
              localStorage.setItem('auth_user', JSON.stringify(updated));
              setCurrentUser(updated);
            }
          } catch (e) {}
        }
      } else {
        setCurrentUser(null);
      }
    } catch (e) {
      console.error('Lỗi khi đọc auth_user:', e);
    }
  };

  useEffect(() => {
    syncCurrentUser();

    const handleUserUpdated = () => {
      syncCurrentUser();
    };

    window.addEventListener('app:user-updated', handleUserUpdated);
    window.addEventListener('storage', handleUserUpdated);
    return () => {
      window.removeEventListener('app:user-updated', handleUserUpdated);
      window.removeEventListener('storage', handleUserUpdated);
    };
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

  // Lắng nghe sự kiện click ra ngoài để tự động đóng Dropdown menu lọc sân
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (courtFilterDropdownRef.current && !courtFilterDropdownRef.current.contains(event.target as Node)) {
        setIsCourtFilterOpen(false);
      }
    };

    if (isCourtFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCourtFilterOpen]);

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

  // Lắng nghe sự kiện đăng xuất từ các thành phần khác hoặc tab khác để giải phóng giỏ sân
  useEffect(() => {
    const clearCartOnLogout = () => {
      try {
        socketRef.current?.emit('unlock_all');
      } catch (e) {
        console.warn('Lỗi khi unlock socket:', e);
      }
      setCartCourts([]);
      setMyLockedSlotIds([]);
      setHoldSecondsLeft(600);
      setIsCartBarCollapsed(false);
      setIsMultiBookingModalOpen(false);
      setMultiBookingStep('CART');
      setMultiPayOSData(null);
      setSelectedSlot(null);
      setBookingStep('DURATION');
      setPayOSData(null);
      setIsPaymentSuccess(false);
      setBookingForm({
        ho_ten: '',
        so_dien_thoai: '',
        ghi_chu: '',
        loai_thanh_toan: 'DAT_COC',
        dich_vu_chon: {},
      });
      setCurrentUser(null);
    };

    const handleStorageChange = (e: StorageEvent) => {
      if ((e.key === 'auth_user' || e.key === 'soccer_current_user') && !e.newValue) {
        clearCartOnLogout();
      }
    };

    window.addEventListener('app:logout', clearCartOnLogout);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('app:logout', clearCartOnLogout);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // -------------------------------------------------------------
  // B. HÀM TẢI DỮ LIỆU THỰC TỪ CSDL SQL SERVER QUA BACKEND API
  // -------------------------------------------------------------

  // 1. Tải danh mục Loại sân (sp_LayDanhSachLoaiSan)
  const fetchLoaiSan = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/dat-san/loai-san`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        // Lọc bỏ hoàn toàn loại sân Dự bị
        const validLoaiSan = data.data.filter((l: LoaiSan) => !isDuBiPitch(l));
        setLoaiSanList(validLoaiSan);
      }
    } catch (err: any) {
      if (err?.name === 'TypeError' || err?.message?.includes('fetch')) {
        console.warn('[Sport247 Offline Mode] Chưa thể kết nối máy chủ backend để tải loại sân.');
      } else {
        console.error('Lỗi fetch loại sân từ SQL Server:', err);
      }
    }
  };

  // 2. Tải danh sách Sân bóng (sp_LayDanhSachSan)
  const fetchSanBong = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/dat-san/danh-sach-san`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        // Lọc bỏ hoàn toàn các sân thuộc loại Dự bị hoặc có tên/mô tả Dự bị
        const validSanBong = data.data.filter((s: SanBong) => !isDuBiPitch(s));
        setSanBongList(validSanBong);
      }
    } catch (err: any) {
      if (err?.name === 'TypeError' || err?.message?.includes('fetch')) {
        console.warn('[Sport247 Offline Mode] Chưa thể kết nối máy chủ backend để tải danh sách sân.');
      } else {
        console.error('Lỗi fetch danh sách sân từ SQL Server:', err);
      }
    }
  };

  // 3. Tải danh mục Khung giờ đá từ CSDL SQL Server (Bảng Khung_Gio)
  const fetchKhungGio = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/dat-san/khung-gio`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        const mapped: KhungGioItem[] = data.data.map((kg: any) => ({
          start: (kg.gio_bat_dau || '').substring(0, 5),
          end: (kg.gio_ket_thuc || '').substring(0, 5),
          label: kg.nhan_hien_thi || `${parseInt(kg.gio_bat_dau.split(':')[0])}h${kg.gio_bat_dau.includes(':30') ? '30' : ''}`,
        }));
        setTimeSlotsList(mapped);
      }
    } catch (err: any) {
      if (err?.name === 'TypeError' || err?.message?.includes('fetch')) {
        console.warn('[Sport247 Offline Mode] Chưa thể kết nối máy chủ backend để tải khung giờ.');
      } else {
        console.error('Lỗi fetch khung giờ từ SQL Server:', err);
      }
    }
  };

  // 4. Tải danh sách Dịch vụ đi kèm (sp_LayDanhSachDichVu)
  const fetchDichVu = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/dich-vu`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setDichVuList(data.data);
      }
    } catch (err: any) {
      if (err?.name === 'TypeError' || err?.message?.includes('fetch')) {
        console.warn('[Sport247 Offline Mode] Chưa thể kết nối máy chủ backend để tải dịch vụ.');
      } else {
        console.error('Lỗi fetch dịch vụ từ SQL Server:', err);
      }
    }
  };

  // 5. Tải ma trận Lịch đặt sân theo ngày thực từ SQL Server (sp_LayLichSan)
  const fetchLichSan = useCallback(async (ngay: string, currentSanList: SanBong[]) => {
    try {
      const res = await fetch(`${API_BASE_URL}/dat-san/lich-san?ngay_da=${ngay}`);
      if (!res.ok) return;
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
    } catch (err: any) {
      if (err?.name === 'TypeError' || err?.message?.includes('fetch')) {
        console.warn('[Sport247 Offline Mode] Chưa thể kết nối máy chủ backend để tải lịch đặt sân.');
      } else {
        console.error('Lỗi khi tải lịch đặt sân từ SQL Server:', err);
      }
    }
  }, [timeSlotsList]);

  // 6. Tải danh sách Banner quảng cáo (sp_LayDanhSachBanner)
  const fetchBanners = async () => {
    try {
      const res = await contentService.getBanners();
      if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
        setBanners(res.data);
      }
    } catch (err: any) {
      console.warn('[Sport247 Offline Mode] Chưa thể tải danh sách banner từ máy chủ backend:', err?.message || err);
    }
  };

  // 6. Tải danh sách mã khuyến mãi / voucher khả dụng (sp_LayDanhSachVoucherKhaDung)
  const fetchVouchers = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const url = currentUser?.id
        ? `${API_BASE_URL}/khuyen-mai?ma_nguoi_dung=${currentUser.id}`
        : `${API_BASE_URL}/khuyen-mai`;
      const res = await fetch(url, { headers });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setVoucherList(data.data);
      }
    } catch (err: any) {
      console.warn('Lỗi khi tải danh sách voucher:', err.message);
    }
  };

  // Kiểm tra điều kiện áp dụng voucher cho đơn đặt hiện tại (UX Shopee/Grab)
  const getVoucherStatus = (v: Voucher) => {
    let currentTotal = 0;
    let matchDate = filterNgayDa || new Date().toISOString().split('T')[0];
    let startTime = '06:00';

    if (cartCourts.length > 0) {
      const cartSan = cartCourts.reduce((sum, item) => sum + item.giaTien, 0);
      const cartDv = Object.entries(bookingForm.dich_vu_chon).reduce((sum, [dvId, qty]) => {
        const dv = dichVuList.find((d) => d.id === Number(dvId));
        return sum + (dv ? dv.don_gia * qty : 0);
      }, 0);
      currentTotal = cartSan + cartDv;
      matchDate = cartCourts[0].ngay_da || matchDate;
      startTime = cartCourts[0].slot.start || startTime;
    } else if (selectedSlot) {
      currentTotal = selectedSlot.giaTien + tongTienDichVu;
      matchDate = filterNgayDa || matchDate;
      startTime = selectedSlot.slot.start || startTime;
    }

    const minOrder = v.don_toi_thieu || 0;
    const shortage = minOrder > currentTotal ? minOrder - currentTotal : 0;
    const progressPercent = minOrder > 0 ? Math.min(100, Math.max(8, Math.round((currentTotal / minOrder) * 100))) : 100;

    // 1. Kiểm tra bạn mới
    if (v.chi_danh_cho_khach_moi) {
      if ((v.da_tung_dat_san && v.da_tung_dat_san > 0) || v.hop_le_khach_hang === 0 || v.hop_le_khach_hang === false) {
        return {
          eligible: false,
          reason: 'Chỉ dành cho đơn đặt sân đầu tiên của bạn mới',
          calculatedDiscount: 0,
          currentTotal,
          minOrder,
          shortage,
          progressPercent,
          conditionType: 'NEW_USER' as const,
        };
      }
    }

    // 2. Kiểm tra thứ trong tuần (Thứ 2 - Thứ 6 = 2,3,4,5,6)
    if (v.thu_trong_tuan && matchDate) {
      const d = new Date(matchDate);
      const day = d.getDay(); // 0: CN, 1: T2, ..., 6: T7
      const vnDay = day === 0 ? 8 : (day + 1); // 2: T2, 3: T3, 4: T4, 5: T5, 6: T6, 7: T7, 8: CN
      const allowedDays = v.thu_trong_tuan.split(',').map((s) => s.trim());
      if (!allowedDays.includes(String(vnDay))) {
        return {
          eligible: false,
          reason: 'Chỉ áp dụng các ngày Thứ 2 đến Thứ 6',
          calculatedDiscount: 0,
          currentTotal,
          minOrder,
          shortage,
          progressPercent,
          conditionType: 'DAY_OF_WEEK' as const,
        };
      }
    }

    // 3. Kiểm tra khung giờ
    if (v.gio_bat_dau && v.gio_ket_thuc && startTime) {
      const startClean = startTime.slice(0, 5);
      const vStartClean = v.gio_bat_dau.slice(0, 5);
      const vEndClean = v.gio_ket_thuc.slice(0, 5);
      if (startClean < vStartClean || startClean > vEndClean) {
        return {
          eligible: false,
          reason: `Chỉ áp dụng trong khung giờ ${vStartClean} – ${vEndClean}`,
          calculatedDiscount: 0,
          currentTotal,
          minOrder,
          shortage,
          progressPercent,
          conditionType: 'TIME_SLOT' as const,
        };
      }
    }

    // 4. Kiểm tra đơn tối thiểu
    if (minOrder > 0 && currentTotal < minOrder) {
      return {
        eligible: false,
        reason: `Đặt thêm ${shortage.toLocaleString('vi-VN')} đ để sử dụng mã này`,
        calculatedDiscount: 0,
        currentTotal,
        minOrder,
        shortage,
        progressPercent,
        conditionType: 'MIN_ORDER' as const,
      };
    }

    // Đủ điều kiện -> tính mức giảm
    let discount = 0;
    if (v.loai_giam === 'PHAN_TRAM') {
      discount = Math.round(currentTotal * (v.gia_tri_giam / 100));
      if (v.giam_toi_da && discount > v.giam_toi_da) {
        discount = v.giam_toi_da;
      }
    } else {
      discount = Math.min(currentTotal, v.gia_tri_giam);
    }

    return {
      eligible: true,
      reason: 'Đủ điều kiện áp dụng',
      calculatedDiscount: discount,
      currentTotal,
      minOrder,
      shortage: 0,
      progressPercent: 100,
      conditionType: 'ELIGIBLE' as const,
    };
  };

  // Áp dụng voucher từ danh sách
  const handleSelectVoucher = (v: Voucher) => {
    const status = getVoucherStatus(v);
    if (!status.eligible) {
      triggerToast({
        type: 'error',
        message: status.reason,
      });
      return;
    }
    setAppliedVoucher(v);
    setVoucherInput(v.ma_code);
    setVoucherError(null);
    setIsVoucherModalOpen(false);
    triggerToast({
      type: 'success',
      message: `🎉 Đã áp dụng mã ưu đãi ${v.ma_code} (-${status.calculatedDiscount.toLocaleString('vi-VN')} đ)!`,
    });
  };

  // Áp dụng voucher khi nhập tay
  const handleApplyVoucherInput = async () => {
    const code = voucherInput.trim().toUpperCase();
    if (!code) return;

    let currentTotal = 0;
    let matchDate = filterNgayDa;
    let startTime = selectedSlot?.slot.start;

    if (cartCourts.length > 0) {
      const cartSan = cartCourts.reduce((sum, item) => sum + item.giaTien, 0);
      const cartDv = Object.entries(bookingForm.dich_vu_chon).reduce((sum, [dvId, qty]) => {
        const dv = dichVuList.find((d) => d.id === Number(dvId));
        return sum + (dv ? dv.don_gia * qty : 0);
      }, 0);
      currentTotal = cartSan + cartDv;
      matchDate = cartCourts[0].ngay_da;
      startTime = cartCourts[0].slot.start;
    } else if (selectedSlot) {
      currentTotal = selectedSlot.giaTien + tongTienDichVu;
    }

    setIsValidatingVoucher(true);
    setVoucherError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/khuyen-mai/kiem-tra`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ma_code: code,
          tong_tien: currentTotal,
          ngay_da: matchDate,
          gio_bat_dau: startTime,
          ma_nguoi_dung: currentUser?.id || undefined,
        }),
      });
      const result = await res.json();
      if (result.success && result.data && result.data.hop_le === 1) {
        const match = voucherList.find((v) => v.ma_code.toUpperCase() === code) || {
          id: 0,
          ma_code: result.data.ma_code,
          tieu_de: result.data.tieu_de,
          mo_ta: result.data.mo_ta,
          loai_giam: 'SO_TIEN' as const,
          gia_tri_giam: result.data.tien_giam,
          giam_toi_da: null,
          don_toi_thieu: 0,
          chi_danh_cho_khach_moi: false,
          gio_bat_dau: null,
          gio_ket_thuc: null,
          thu_trong_tuan: null,
          so_luong: 100,
          so_luong_da_dung: 0,
        };
        setAppliedVoucher(match);
        triggerToast({
          type: 'success',
          message: `🎉 Áp dụng mã ưu đãi ${code} thành công (-${Number(result.data.tien_giam).toLocaleString('vi-VN')} đ)!`,
        });
      } else {
        const errMsg = result.data?.ly_do || result.message || 'Mã ưu đãi không hợp lệ!';
        setVoucherError(errMsg);
        triggerToast({
          type: 'error',
          message: errMsg,
        });
      }
    } catch {
      setVoucherError('Lỗi kết nối khi kiểm tra mã ưu đãi');
    } finally {
      setIsValidatingVoucher(false);
    }
  };

  // Gỡ voucher đã áp dụng
  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherInput('');
    setVoucherError(null);
    triggerToast({
      type: 'info',
      message: 'Đã hủy áp dụng mã ưu đãi.',
    });
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
        fetchBanners(),
        fetchVouchers()
      ]);
      setIsLoadingData(false);
    };

    loadAllInitialData();
  }, []);

  // Cập nhật lại voucher khi người dùng đăng nhập hoặc đổi tài khoản
  useEffect(() => {
    fetchVouchers();
  }, [currentUser]);

  // Cập nhật lại voucher khi mở modal kho voucher
  useEffect(() => {
    if (isVoucherModalOpen) {
      fetchVouchers();
    }
  }, [isVoucherModalOpen]);

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
      if (typeof document !== 'undefined' && document.visibilityState === 'visible' && sanBongList.length > 0) {
        fetchLichSan(filterNgayDa, sanBongList);
      }
    }, 5000);

    const handleWindowFocus = () => {
      if (sanBongList.length > 0) {
        fetchLichSan(filterNgayDa, sanBongList);
        fetchDichVu();
      }
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
    const isQrScreen = (bookingStep === 'QR' && selectedSlot) || (isMultiBookingModalOpen && multiBookingStep === 'QR');
    if (!isQrScreen || !payOSData?.orderCode || isPaymentSuccess) {
      return;
    }

    const intervalId = setInterval(() => {
      checkPayOSStatus(payOSData.orderCode, false);
    }, 2500);

    return () => clearInterval(intervalId);
  }, [bookingStep, multiBookingStep, isMultiBookingModalOpen, selectedSlot, payOSData?.orderCode, isPaymentSuccess]);

  // Tự động giải phóng và hủy đơn tạm thời nếu người dùng tải lại trang (reload) hoặc đóng tab/rời đi khi chưa thanh toán
  useEffect(() => {
    const handleUnloadOrReload = () => {
      // Tự động giải phóng các ô giữ chỗ realtime nếu đang giữ chỗ mà reload hoặc rời trang
      if (myLockedSlotIds.length > 0 && !isPaymentSuccess) {
        socketRef.current?.emit('unlock_all');
      }

      const isQrScreen = (bookingStep === 'QR' && selectedSlot) || (isMultiBookingModalOpen && multiBookingStep === 'QR');
      if (isQrScreen && (payOSData?.ma_don_dat || payOSData?.orderCode) && !isPaymentSuccess) {
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
  }, [bookingStep, multiBookingStep, isMultiBookingModalOpen, selectedSlot, payOSData, isPaymentSuccess, myLockedSlotIds]);

  // Khóa cuộn trang nền khi đang mở Modal đặt sân, Modal Profile hoặc Modal chọn môn thể thao
  useEffect(() => {
    if (selectedSlot || isMultiBookingModalOpen || isProfileModalOpen || selectedCategory) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [selectedSlot, isMultiBookingModalOpen, isProfileModalOpen, selectedCategory]);

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

  // Hàm tải ảnh mã QR VietQR MB Bank về máy (không mở tab mới, chống chặn CORS)
  const handleDownloadQRCode = async (qrUrl: string, fileName: string = 'Sport247_VietQR_MBBank.png') => {
    if (!qrUrl) return;
    try {
      triggerToast({
        type: 'info',
        message: 'Đang tải ảnh mã QR về máy...',
      });

      // 1. Chuẩn hóa tên file và URL: Luôn đảm bảo định dạng file .png
      const targetFileName = fileName.endsWith('.png') ? fileName : `${fileName}.png`;
      const normalizedQrUrl = qrUrl.replace(/\.svg(\?|$)/i, '.png$1');

      // 2. Tải qua Backend Proxy để vượt qua chính sách CORS của trình duyệt
      const proxyUrl = `${API_BASE_URL}/thanh-toan/tai-qr?url=${encodeURIComponent(normalizedQrUrl)}&fileName=${encodeURIComponent(targetFileName)}`;
      const response = await fetch(proxyUrl);

      if (!response.ok) {
        throw new Error(`Proxy status: ${response.status}`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = targetFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);

      triggerToast({
        type: 'success',
        message: 'Đã tải ảnh mã QR thành công về máy!',
      });
    } catch (error) {
      console.warn('Lỗi tải trực tiếp blob qua proxy, chuyển sang kích hoạt tải bằng liên kết proxy:', error);
      try {
        // Fallback: Tải trực tiếp thông qua endpoint proxy (có header Content-Disposition: attachment)
        // Tuyệt đối KHÔNG dùng target="_blank" để không mở tab mới
        const targetFileName = fileName.endsWith('.png') ? fileName : `${fileName}.png`;
        const normalizedQrUrl = qrUrl.replace(/\.svg(\?|$)/i, '.png$1');
        const proxyUrl = `${API_BASE_URL}/thanh-toan/tai-qr?url=${encodeURIComponent(normalizedQrUrl)}&fileName=${encodeURIComponent(targetFileName)}`;

        const downloadLink = document.createElement('a');
        downloadLink.href = proxyUrl;
        downloadLink.download = targetFileName;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        triggerToast({
          type: 'success',
          message: 'Đang bắt đầu tải ảnh mã QR về máy!',
        });
      } catch (fallbackErr) {
        triggerToast({
          type: 'error',
          message: 'Không thể tải ảnh tự động. Quý khách vui lòng chụp màn hình để quét mã!',
        });
      }
    }
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
    setIsMultiBookingModalOpen(false);
    setCartCourts([]);
    setMultiBookingStep('CART');
    setPayOSData(null);
    setQrModalAlert(null);
    setIsPaymentSuccess(false);
    setAppliedVoucher(null);
    setVoucherInput('');
    setVoucherError(null);
    setIsVoucherModalOpen(false);
    setBookingForm((p) => ({
      ...p,
      ghi_chu: '',
      dich_vu_chon: {},
    }));
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

        if (manual) {
          triggerToast({
            type: 'error',
            message: `⚠️ Sai nội dung chuyển khoản! Nội dung nhận: "${displayDesc}". Vui lòng liên hệ ban quản lý để được hỗ trợ!`,
            shortMessage: `Sai nội dung: "${displayDesc}"`,
          });
        }
      } else if (manual) {
        triggerToast({
          type: 'error',
          message: 'Chưa nhận được tiền chuyển khoản! Vui lòng thử lại sau vài giây.',
          shortMessage: 'Chưa nhận được tiền! Vui lòng thử lại sau.',
        });
      }
    } catch (err) {
      console.error('Lỗi khi kiểm tra PayOS status:', err);
      if (manual) {
        triggerToast({
          type: 'error',
          message: 'Không thể kết nối đến hệ thống thanh toán. Vui lòng thử lại sau vài giây!',
          shortMessage: 'Lỗi kết nối máy chủ thanh toán!',
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
    setAppliedVoucher(null);
    setVoucherInput('');
    setVoucherError(null);
    setIsVoucherModalOpen(false);
    setBookingForm((p) => ({
      ...p,
      ghi_chu: '',
      dich_vu_chon: {},
    }));
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

  // Lọc danh sách khung giờ hiển thị trên ma trận (Hiển thị đầy đủ tất cả khung giờ chuẩn Google Calendar)
  const filteredTimeSlots = useMemo(() => {
    const rawSlots = timeSlotsList.length > 0 ? timeSlotsList : DEFAULT_TIME_SLOTS;
    if (filterKhungGio === 'ALL') return rawSlots;
    return rawSlots.filter((s) => s.start === filterKhungGio);
  }, [filterKhungGio, timeSlotsList]);

  // Lọc theo buổi trong ngày (Sáng: 06h-12h, Chiều: 12h-17h, Tối: 17h-24h, Đêm: 00h-06h)
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

  // Chiều cao mỗi hàng 30 phút trong giao diện Google Calendar (pixel)
  const CALENDAR_ROW_HEIGHT = 35;

  // Kiểm tra ngày đang chọn có phải là hôm nay
  const isViewingToday = useMemo(() => {
    if (!filterNgayDa) return false;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const currentDate = String(now.getDate()).padStart(2, '0');
    const todayStr = `${currentYear}-${currentMonth}-${currentDate}`;
    return filterNgayDa === todayStr;
  }, [filterNgayDa]);

  // Danh sách khung giờ cho Google Calendar (áp dụng bộ lọc Buổi Sáng/Chiều/Tối & Chỉ hiện ca trống)
  const calendarDisplaySlots = useMemo(() => {
    let rawSlots = timeSlotsList.length > 0 ? timeSlotsList : DEFAULT_TIME_SLOTS;
    if (filterKhungGio !== 'ALL') {
      rawSlots = rawSlots.filter((s) => s.start === filterKhungGio);
    }

    // Lọc theo buổi trong ngày (Sáng: 06h-12h, Chiều: 12h-17h, Tối: 17h-24h)
    if (filterBuoi === 'MORNING') {
      rawSlots = rawSlots.filter((slot) => {
        const hour = parseInt(slot.start.split(':')[0], 10);
        return hour >= 6 && hour < 12;
      });
    } else if (filterBuoi === 'AFTERNOON') {
      rawSlots = rawSlots.filter((slot) => {
        const hour = parseInt(slot.start.split(':')[0], 10);
        return hour >= 12 && hour < 17;
      });
    } else if (filterBuoi === 'EVENING') {
      rawSlots = rawSlots.filter((slot) => {
        const hour = parseInt(slot.start.split(':')[0], 10);
        return hour >= 17;
      });
    }

    // Lọc "Chỉ hiện ca trống": Chỉ giữ lại các khung giờ có ít nhất 1 sân chưa đặt & chưa qua giờ
    if (onlyShowEmptySlots) {
      rawSlots = rawSlots.filter((slot) => {
        const isPast = isSlotInThePast(slot.start);
        if (isPast) return false;

        return filteredSanList.some((san) => {
          const slotKey = `${san.id}_${slot.start}`;
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
          return !isBooked;
        });
      });
    }

    return rawSlots;
  }, [timeSlotsList, filterKhungGio, filterBuoi, onlyShowEmptySlots, isSlotInThePast, filteredSanList, gridSlots, syncOrders, filterNgayDa]);

  // Kiểm tra khung giờ có phải là giờ hiện tại không
  const isCurrentTimeSlot = useCallback((slotStart: string, slotEnd: string) => {
    if (!isViewingToday) return false;
    const now = new Date();
    const currentTotal = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = slotStart.split(':').map(Number);
    const startTotal = startH * 60 + startM;

    const endStr = slotEnd === '23:59' ? '24:00' : slotEnd;
    const [endH, endM] = endStr.split(':').map(Number);
    const endTotal = endH * 60 + endM;

    return currentTotal >= startTotal && currentTotal < endTotal;
  }, [isViewingToday]);

  // Danh sách các sân sẽ render trong chế độ Google Calendar (hỗ trợ chọn sân cụ thể để vừa trọn 1 màn hình)
  const courtsToRenderInCalendar = useMemo(() => {
    if (filteredSanList.length === 0) return [];
    if (calendarSelectedCourtId === 'ALL') return filteredSanList;
    if (calendarSelectedCourtId === 'FIRST') return [filteredSanList[0]];
    const matched = filteredSanList.find((s) => typeof calendarSelectedCourtId === 'number' && s.id === calendarSelectedCourtId);
    return matched ? [matched] : [filteredSanList[0]];
  }, [filteredSanList, calendarSelectedCourtId]);

  // Vị trí pixel chính xác của vạch đỏ thời gian thực (Google Calendar current-time line)
  const calendarLineTopPx = useMemo(() => {
    if (!isViewingToday || calendarDisplaySlots.length === 0) return null;
    const [startH, startM] = calendarDisplaySlots[0].start.split(':').map(Number);
    const [endH, endM] = calendarDisplaySlots[calendarDisplaySlots.length - 1].end.split(':').map(Number);
    const dayStartMin = startH * 60 + startM;
    const dayEndMin = endH * 60 + endM;

    if (currentTimeMinutes < dayStartMin || currentTimeMinutes > dayEndMin) return null;

    return ((currentTimeMinutes - dayStartMin) / 60) * CALENDAR_ROW_HEIGHT;
  }, [isViewingToday, calendarDisplaySlots, currentTimeMinutes]);

  // Cuộn mượt đến vạch thời gian hiện tại trong Google Calendar
  const scrollToCurrentTime = useCallback(() => {
    if (calendarScrollRef.current && calendarLineTopPx !== null) {
      calendarScrollRef.current.scrollTo({
        top: Math.max(0, calendarLineTopPx - 100),
        behavior: 'smooth',
      });
    }
  }, [calendarLineTopPx]);

  // Tìm kiếm ca trống sớm nhất cho khách hàng (Lựa chọn 3 / Option B)
  const handleFindNextAvailableSlot = async () => {
    try {
      setIsSearchingNextSlot(true);
      const params = new URLSearchParams();
      if (filterSanId && filterSanId !== 'ALL') {
        params.append('ma_san', filterSanId);
      }
      if (selectedCategory?.id) {
        params.append('ma_loai_san', String(selectedCategory.id));
      }
      params.append('so_ngay', '14');
      if (filterBuoi === 'MORNING') params.append('buoi', 'SANG');
      else if (filterBuoi === 'AFTERNOON') params.append('buoi', 'CHIEU');
      else if (filterBuoi === 'EVENING') params.append('buoi', 'TOI');

      const res = await fetch(`${API_BASE_URL}/dat-san/tim-ca-trong?${params.toString()}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        const nextSlot = json.data[0];
        const targetDate = nextSlot.ngay;
        setFilterNgayDa(targetDate);
        if (filterSanId === 'ALL' && nextSlot.ma_san) {
          setFilterSanId(String(nextSlot.ma_san));
          setCalendarSelectedCourtId(nextSlot.ma_san);
        }
        triggerToast({
          type: 'success',
          message: `⚡ Đã tìm thấy ca trống sớm nhất: ${nextSlot.nhan_hien_thi || nextSlot.gio_bat_dau?.substring(0, 5)} ngày ${formatDateDMY(targetDate)} (${nextSlot.ten_san})!`,
        });
      } else {
        triggerToast({
          type: 'info',
          message: 'Hiện tại không còn ca trống nào trong 14 ngày tới phù hợp bộ lọc.',
        });
      }
    } catch (err: any) {
      triggerToast({
        type: 'error',
        message: 'Lỗi khi tìm ca trống: ' + (err.message || 'Không thể kết nối máy chủ'),
      });
    } finally {
      setIsSearchingNextSlot(false);
    }
  };

  // Tự động cuộn đến giờ hiện tại khi mở modal ở chế độ Google Calendar
  useEffect(() => {
    if (selectedCategory && bookingViewMode === 'CALENDAR' && calendarLineTopPx !== null) {
      const t = setTimeout(() => {
        scrollToCurrentTime();
      }, 300);
      return () => clearTimeout(t);
    }
  }, [selectedCategory, bookingViewMode, calendarLineTopPx, scrollToCurrentTime]);

  // Kiểm tra xung đột thời lượng đặt (30p, 60p, 90p, 120p) với các đơn đặt đã có trong CSDL và các ô đang GIỮ CHỖ Real-time
  const checkConflictForSan = useCallback((sanId: number, start: string, durationMin: number) => {
    const end = addMinutesToTime(start, durationMin);

    // 1. Kiểm tra từng slot 60 phút trong khoảng [start, end)
    const totalSlots = Math.ceil(durationMin / 60);
    for (let i = 0; i < totalSlots; i++) {
      const curStart = addMinutesToTime(start, i * 60);
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
      message: `Đang cập nhật lịch sân thực tế từ CSDL cho ngày ${formatDateDMY(filterNgayDa)}...`,
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
    setHoldSecondsLeft(600);
    setIsCartBarCollapsed(false);
    setMultiBookingStep('CART');
    setBookingForm((p) => ({ ...p, dich_vu_chon: {}, ghi_chu: '' }));
    setAppliedVoucher(null);
    setVoucherInput('');
    setVoucherError(null);
    triggerToast({
      type: 'info',
      message: 'Đã xóa toàn bộ sân trong danh sách chọn!',
    });
  };

  // Đổi thời lượng thi đấu cho từng sân trong giỏ (30, 60, 90, 120 phút)
  const handleChangeCartCourtDuration = (cartId: string, durationMin: number) => {
    setCartCourts((prev) => {
      const updated = prev.map((item) => {
        if (item.id !== cartId) return item;
        const endTime = addMinutesToTime(item.slot.start, durationMin);
        const donGia = Number(item.san.don_gia_phut) || 5000;
        const giaTien = durationMin * donGia;

        return {
          ...item,
          durationMin,
          gioKetThuc: endTime,
          giaTien,
          // Giữ nguyên holdSlotKeys (tối đa 2 tiếng đã khóa) để không bị nhả các ô còn lại khi khách thử chọn 30p hoặc 60p
          holdSlotKeys: item.holdSlotKeys,
        };
      });

      return updated;
    });
  };

  // Xóa 1 sân khỏi giỏ
  const handleRemoveCartCourt = (cartId: string) => {
    const updated = cartCourts.filter((item) => item.id !== cartId);
    setCartCourts(updated);
    const remainingHoldKeys = updated.flatMap((item) => item.holdSlotKeys);

    if (updated.length === 0 || remainingHoldKeys.length === 0) {
      socketRef.current?.emit('unlock_all');
      setMyLockedSlotIds([]);
      setHoldSecondsLeft(600);
      setIsMultiBookingModalOpen(false);
      setBookingForm((p) => ({ ...p, dich_vu_chon: {}, ghi_chu: '' }));
      setAppliedVoucher(null);
      setVoucherInput('');
      setVoucherError(null);
    } else {
      socketRef.current?.emit('lock_slots', remainingHoldKeys);
      setMyLockedSlotIds(remainingHoldKeys);
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
  const tongTienDonCartGoc = tongTienSanCart + tongTienDichVuCart;
  const tienGiamVoucherCart = useMemo(() => {
    if (!appliedVoucher) return 0;
    if (appliedVoucher.loai_giam === 'PHAN_TRAM') {
      let giam = Math.round(tongTienDonCartGoc * (appliedVoucher.gia_tri_giam / 100));
      if (appliedVoucher.giam_toi_da && giam > appliedVoucher.giam_toi_da) {
        giam = appliedVoucher.giam_toi_da;
      }
      return giam;
    } else {
      return Math.min(tongTienDonCartGoc, appliedVoucher.gia_tri_giam);
    }
  }, [appliedVoucher, tongTienDonCartGoc]);

  const tongTienDonCart = Math.max(0, tongTienDonCartGoc - tienGiamVoucherCart);
  const tienCocCart = Math.round(tongTienDonCart * 0.3);

  // Tạo thanh toán PayOS cho giỏ sân (1 sân hoặc nhiều sân)
  const handleCreateMultiPayOSPayment = async () => {
    if (cartCourts.length === 0) return;

    const hoTenKhach = bookingForm.ho_ten || currentUser?.ho_ten || 'Khách hàng Sport247';
    const sdtKhach = bookingForm.so_dien_thoai || currentUser?.so_dien_thoai || '0816344504';

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
          ho_ten: hoTenKhach,
          so_dien_thoai: sdtKhach,
          amount: thanhToanAmount,
          tong_tien: tongTienDonCart,
          loai_thanh_toan: isDeposit ? 'DAT_COC' : 'TRA_HET',
          ghi_chu: bookingForm.ghi_chu || null,
          danh_sach_san: danhSachSanPayload,
          dich_vu_chon: bookingForm.dich_vu_chon,
          ma_voucher: appliedVoucher?.ma_code || undefined,
          tien_giam_gia: tienGiamVoucherCart || 0,
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
        ten_san: cartCourts.length > 1 ? `Nhiều sân (${cartCourts.length} sân)` : cartCourts[0].san.ten_san,
        loai_thanh_toan: isDeposit ? 'DAT_COC' : 'TRA_HET',
      });
      setBookingStep('QR');
      setMultiBookingStep('QR');
      setIsMultiBookingModalOpen(true);
      setSelectedSlot(null);
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

    // QUY TRÌNH ĐẶT SÂN ĐỒNG NHẤT: ĐẶT 1 SÂN HOẶC NHIỀU SÂN ĐỀU DÙNG CHUNG GIAO DIỆN GIỎ HÀNG
    // Hỗ trợ chọn cùng 1 sân ở nhiều ngày khác nhau.
    // Trong cùng một ngày thi đấu: Mỗi sân chọn 1 ca và tùy chỉnh thời lượng (60p, 90p, 120p) trong giỏ hàng.
    const existingCourtOnSameDay = cartCourts.find(
      (item) => item.san.id === san.id && item.ngay_da === filterNgayDa
    );
    if (existingCourtOnSameDay) {
      const isClickingHeldSlot = existingCourtOnSameDay.holdSlotKeys.includes(`${filterNgayDa}_${san.id}_${slot.start}`);
      if (isClickingHeldSlot) {
        // Bấm vào chính ô đang giữ chỗ của ngày này -> Mở lại giỏ sân
        setMultiBookingStep('CART');
        setIsMultiBookingModalOpen(true);
        return;
      }
      // Bấm vào ô khác của cùng sân trong cùng ngày -> Thông báo rõ ràng cho khách
      triggerToast({
        type: 'info',
        message: `Sân "${san.ten_san}" đã có ca đặt (${existingCourtOnSameDay.slot.start} - ${existingCourtOnSameDay.gioKetThuc}) trong ngày ${formatDateDMY(filterNgayDa)}. Quý khách có thể đổi sang ngày khác để đặt tiếp sân này!`,
      });
      return;
    }

    const cartItemId = `${san.id}_${slot.start}_${filterNgayDa}`;

    // Tìm các ô liên tiếp trống tối đa 2 tiếng (2 ca x 60p = 120 phút)
    // Nếu trống không có người nào đang chọn và đã đặt
    const holdSlotKeys: string[] = [];
    for (let i = 0; i < 2; i++) {
      const curTime = addMinutesToTime(slot.start, i * 60);
      const [h] = curTime.split(':').map(Number);
      if (h >= 24) break;

      // Kiểm tra ô trong quá khứ
      if (isSlotInThePast(curTime)) {
        if (i === 0) {
          triggerToast({
            type: 'error',
            message: `Khung giờ ${slot.label} (${slot.start}) ngày hôm nay đã trôi qua. Vui lòng chọn khung giờ khác!`,
          });
          return;
        }
        break;
      }

      // Kiểm tra xung đột với đơn đã đặt trong CSDL
      const slotData = gridSlots[`${san.id}_${curTime}`];
      if (slotData && slotData.trang_thai !== 'TRONG') {
        if (i === 0) {
          triggerToast({
            type: 'error',
            message: `Khung giờ ${slot.label} (${slot.start}) của ${san.ten_san} đã được đặt!`,
          });
          return;
        }
        break;
      }

      // Kiểm tra khách khác đang giữ chỗ Real-time
      const curSlotKey = `${filterNgayDa}_${san.id}_${curTime}`;
      if (lockedSlots.includes(curSlotKey) && !myLockedSlotIds.includes(curSlotKey)) {
        if (i === 0) {
          triggerToast({
            type: 'info',
            message: `Khung giờ ${slot.label} (${slot.start}) của ${san.ten_san} đang có người khác chọn!`,
          });
          return;
        }
        break;
      }

      holdSlotKeys.push(curSlotKey);
    }

    if (holdSlotKeys.length === 0) {
      triggerToast({
        type: 'error',
        message: `Khung giờ ${slot.label} (${slot.start}) không khả dụng!`,
      });
      return;
    }

    const initialDuration = 60; // Mặc định 60 phút (1 ca trọn vẹn)
    const initialEndTime = addMinutesToTime(slot.start, initialDuration);
    const donGiaPhut = Number(san.don_gia_phut) || 5000;
    const giaTien = initialDuration * donGiaPhut;

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
    if (cartCourts.length === 0) {
      setHoldSecondsLeft(600);
      setAppliedVoucher(null);
      setVoucherInput('');
      setVoucherError(null);
    }
    setCartCourts(newCart);

    const allHoldKeys = newCart.flatMap((item) => item.holdSlotKeys);
    socketRef.current?.emit('lock_slots', allHoldKeys);
    setMyLockedSlotIds(allHoldKeys);

    // Điền sẵn thông tin người đặt từ currentUser; nếu bắt đầu đơn mới thì reset dịch vụ & ghi chú cũ
    setBookingForm((p) => ({
      ...p,
      ho_ten: currentUser?.ho_ten || p.ho_ten || 'Khách hàng Sport247',
      so_dien_thoai: currentUser?.so_dien_thoai || p.so_dien_thoai || '0816344504',
      ...(cartCourts.length === 0 ? { dich_vu_chon: {}, ghi_chu: '' } : {}),
    }));

    // Bật ngay giao diện giỏ hàng xác nhận đặt sân (dù đặt 1 sân hay nhiều sân)
    setMultiBookingStep('CART');
    setIsMultiBookingModalOpen(true);
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

  // Tính toán tổng tiền: Tiền sân + Tiền dịch vụ - Giảm giá Voucher
  const { tongTienDichVu, tongTienDonGoc, tienGiamVoucher, tongTienDon, soTienThanhToan } = useMemo(() => {
    if (!selectedSlot) return { tongTienDichVu: 0, tongTienDonGoc: 0, tienGiamVoucher: 0, tongTienDon: 0, soTienThanhToan: 0 };

    let tienDv = 0;
    Object.entries(bookingForm.dich_vu_chon).forEach(([dvId, qty]) => {
      const dv = dichVuList.find((d) => d.id === Number(dvId));
      if (dv) {
        tienDv += dv.don_gia * qty;
      }
    });

    const tienSan = selectedSlot.giaTien;
    const tongGoc = tienSan + tienDv;

    let giam = 0;
    if (appliedVoucher) {
      if (appliedVoucher.loai_giam === 'PHAN_TRAM') {
        giam = Math.round(tongGoc * (appliedVoucher.gia_tri_giam / 100));
        if (appliedVoucher.giam_toi_da && giam > appliedVoucher.giam_toi_da) {
          giam = appliedVoucher.giam_toi_da;
        }
      } else {
        giam = Math.min(tongGoc, appliedVoucher.gia_tri_giam);
      }
    }

    const tongSauGiam = Math.max(0, tongGoc - giam);
    const thanhToan = bookingForm.loai_thanh_toan === 'DAT_COC' ? Math.round(tongSauGiam * 0.3) : tongSauGiam;

    return {
      tongTienDichVu: tienDv,
      tongTienDonGoc: tongGoc,
      tienGiamVoucher: giam,
      tongTienDon: tongSauGiam,
      soTienThanhToan: thanhToan,
    };
  }, [selectedSlot, bookingForm.dich_vu_chon, bookingForm.loai_thanh_toan, dichVuList, appliedVoucher]);

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
            ma_voucher: appliedVoucher?.ma_code || undefined,
            tien_giam_gia: tienGiamVoucher || 0,
          },
          so_tien: soTienThanhToan,
          loai_thanh_toan: bookingForm.loai_thanh_toan,
          ma_voucher: appliedVoucher?.ma_code || undefined,
          tien_giam_gia: tienGiamVoucher || 0,
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
    // 1. Giải phóng toàn bộ các ô giữ chỗ trên Real-time Socket Server
    try {
      socketRef.current?.emit('unlock_all');
    } catch (e) {
      console.warn('Lỗi khi unlock socket:', e);
    }

    // 2. Xóa sạch giỏ sân và trạng thái giữ chỗ
    setCartCourts([]);
    setMyLockedSlotIds([]);
    setHoldSecondsLeft(600);
    setIsCartBarCollapsed(false);

    // 3. Đóng và reset toàn bộ các Modal đặt sân & thanh toán
    setIsMultiBookingModalOpen(false);
    setMultiBookingStep('CART');
    setMultiPayOSData(null);
    setSelectedSlot(null);
    setBookingStep('DURATION');
    setPayOSData(null);
    setIsPaymentSuccess(false);

    // 4. Xóa thông tin form đặt sân
    setBookingForm({
      ho_ten: '',
      so_dien_thoai: '',
      ghi_chu: '',
      loai_thanh_toan: 'DAT_COC',
      dich_vu_chon: {},
    });

    // 5. Xóa thông tin phiên đăng nhập
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('soccer_current_user');
    setCurrentUser(null);
    setUserDropdownOpen(false);
    setIsProfileModalOpen(false);
    setIsLogoutConfirmOpen(false);

    // 6. Phát sự kiện đăng xuất cho toàn bộ ứng dụng
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('app:logout'));
    }

    triggerToast({ type: 'info', message: 'Đã đăng xuất tài khoản và giải phóng giỏ sân thành công.' });
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

      {/* TOAST THÔNG BÁO NỔI TOÀN HỆ THỐNG */}
      {toastMessage && (
        <div
          className={`fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 z-[9999999] w-[94%] sm:w-auto min-w-[280px] max-w-xl flex items-center justify-between gap-2.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl sm:rounded-full shadow-2xl border backdrop-blur-xl transition-all duration-300 animate-in fade-in slide-in-from-top-3 ${toastMessage.type === 'success'
            ? isDarkMode ? 'bg-emerald-950/95 border-emerald-500/60 text-emerald-100 shadow-emerald-950/80 ring-1 ring-emerald-500/40' : 'bg-emerald-50 border-emerald-400 text-emerald-950 shadow-emerald-500/25 ring-1 ring-emerald-400/40'
            : toastMessage.type === 'error'
              ? isDarkMode ? 'bg-rose-950/95 border-rose-500/70 text-rose-100 shadow-rose-950/80 ring-1 ring-rose-500/50' : 'bg-rose-50 border-rose-400 text-rose-950 shadow-rose-500/30 ring-1 ring-rose-400/50'
              : isDarkMode ? 'bg-sky-950/95 border-sky-500/60 text-sky-100 shadow-sky-950/80 ring-1 ring-sky-500/40' : 'bg-sky-50 border-sky-400 text-sky-950 shadow-sky-500/20 ring-1 ring-sky-400/40'
            }`}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toastMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            {toastMessage.type === 'info' && <Info className="w-4 h-4 text-sky-400 shrink-0" />}
            <div className="min-w-0 flex-1">
              {toastMessage.shortMessage ? (
                <>
                  <span className="sm:hidden text-xs font-bold leading-tight block">
                    {toastMessage.shortMessage}
                  </span>
                  <span className="hidden sm:inline text-xs sm:text-sm font-semibold">
                    {toastMessage.message}
                  </span>
                </>
              ) : (
                <span className="text-xs sm:text-sm font-semibold leading-tight break-words">
                  {toastMessage.message}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white transition-colors p-1 cursor-pointer shrink-0 ml-1"
          >
            <X className="w-3.5 h-3.5" />
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
                    {currentUser.anh_dai_dien ? (
                      <img
                        src={currentUser.anh_dai_dien}
                        alt={currentUser.ho_ten || 'Avatar'}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-emerald-500/50 shadow-sm shrink-0"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.parentElement?.querySelector('.header-avatar-fallback');
                          if (fallback) (fallback as HTMLElement).style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className={`header-avatar-fallback w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 items-center justify-center font-bold text-slate-950 text-xs shadow-inner ${
                        currentUser.anh_dai_dien ? 'hidden' : 'flex'
                      }`}
                    >
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
                        onClick={() => {
                          setUserDropdownOpen(false);
                          setIsLogoutConfirmOpen(true);
                        }}
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
              <span className={`flex items-center gap-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-800 font-bold'}`}>
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                Hotline Đặt Sân: <strong className="text-emerald-700 dark:text-emerald-500 font-mono text-xs">0816344504</strong>
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
        <div className={`flex items-center justify-between pb-4 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-slate-950 flex items-center justify-center font-black shadow-md shadow-emerald-500/20">
              ⚽
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className={`text-base font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>SPORT</span>
                <span className="text-base font-black tracking-tight text-emerald-500">247</span>
              </div>
              <p className="text-[9px] uppercase font-bold tracking-widest text-emerald-500 -mt-0.5">Menu Điều Hướng</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
            }`}
            aria-label="Đóng menu"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Danh sách Links điều hướng chính */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-1.5">
          <a
            href="#hero"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-extrabold transition-all ${
              isDarkMode
                ? 'text-slate-100 hover:text-emerald-400 hover:bg-slate-900/90'
                : 'text-slate-900 hover:text-emerald-600 hover:bg-emerald-50/80'
            }`}
          >
            <span className="text-base">🏠</span>
            <span>Trang chủ</span>
          </a>
          <a
            href="#ma-tran-lich-san"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-extrabold transition-all ${
              isDarkMode
                ? 'text-slate-100 hover:text-emerald-400 hover:bg-slate-900/90'
                : 'text-slate-900 hover:text-emerald-600 hover:bg-emerald-50/80'
            }`}
          >
            <span className="text-base">📅</span>
            <span>Đặt sân</span>
          </a>
          <Link
            href="/tin-tuc"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-extrabold transition-all ${
              isDarkMode
                ? 'text-slate-100 hover:text-emerald-400 hover:bg-slate-900/90'
                : 'text-slate-900 hover:text-emerald-600 hover:bg-emerald-50/80'
            }`}
          >
            <span className="text-base">📰</span>
            <span>Tin Tức</span>
          </Link>
          <Link
            href="/about-us"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-extrabold transition-all ${
              isDarkMode
                ? 'text-slate-100 hover:text-emerald-400 hover:bg-slate-900/90'
                : 'text-slate-900 hover:text-emerald-600 hover:bg-emerald-50/80'
            }`}
          >
            <span className="text-base">ℹ️</span>
            <span>About Us</span>
          </Link>
          <Link
            href="/lien-he"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-extrabold transition-all ${
              isDarkMode
                ? 'text-slate-100 hover:text-emerald-400 hover:bg-slate-900/90'
                : 'text-slate-900 hover:text-emerald-600 hover:bg-emerald-50/80'
            }`}
          >
            <span className="text-base">📞</span>
            <span>Liên Hệ</span>
          </Link>

          {isUserStaffOrAdmin && (
            <a
              href="/management-system"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black transition-all border ${
                isDarkMode
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100'
              }`}
            >
              <span>⚡</span>
              <span>Quản Lý Sân (POS)</span>
            </a>
          )}

          {isUserAdmin && (
            <a
              href="/Dashboard"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black transition-all border ${
                isDarkMode
                  ? 'bg-purple-500/15 border-purple-500/30 text-purple-400 hover:bg-purple-500/25'
                  : 'bg-purple-50 border-purple-300 text-purple-950 hover:bg-purple-100'
              }`}
            >
              <span>🛡️</span>
              <span>Trang Quản Trị (Dashboard)</span>
            </a>
          )}
        </nav>

        {/* Footer Mobile Drawer (Người dùng / Đăng nhập) */}
        <div className={`pt-4 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
          {currentUser ? (
            <div className="space-y-2.5">
              <div className={`flex items-center gap-3 p-2.5 rounded-2xl border ${
                isDarkMode
                  ? 'bg-slate-900/90 border-slate-800'
                  : 'bg-slate-100 border-slate-300 text-slate-900'
              }`}>
                {currentUser.anh_dai_dien ? (
                  <img
                    src={currentUser.anh_dai_dien}
                    alt={currentUser.ho_ten || 'Avatar'}
                    className="w-9 h-9 rounded-full object-cover border border-emerald-500/50 shadow-sm shrink-0"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.parentElement?.querySelector('.mobile-avatar-fallback');
                      if (fallback) (fallback as HTMLElement).style.display = 'flex';
                    }}
                  />
                ) : null}
                <div
                  className={`mobile-avatar-fallback w-9 h-9 rounded-full bg-emerald-500 text-slate-950 font-black items-center justify-center text-sm shadow-sm shrink-0 ${
                    currentUser.anh_dai_dien ? 'hidden' : 'flex'
                  }`}
                >
                  {currentUser.ho_ten ? currentUser.ho_ten.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="overflow-hidden flex-1">
                  <p className={`text-xs font-black truncate ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>
                    {currentUser.ho_ten}
                  </p>
                  <p className={`text-[11px] font-medium truncate ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    {currentUser.email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsLogoutConfirmOpen(true);
                }}
                className={`w-full py-2.5 px-3 rounded-xl text-xs font-black border flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 ${
                  isDarkMode
                    ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
                    : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                }`}
              >
                <LogOut className="w-4 h-4 stroke-[2.5]" />
                <span>Đăng xuất</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setLoginInitialRegister(false);
                  setIsLoginModalOpen(true);
                }}
                className={`w-full py-2.5 px-3 rounded-xl text-xs font-black border cursor-pointer text-center transition-all ${
                  isDarkMode
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                }`}
              >
                Đăng nhập
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
                  const theme = getSportTheme(loai.ten_loai, loai.mo_ta, loai.icon);
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
                        {/* HÀNG TRÊN: ICON THỂ THAO */}
                        <div className="flex items-start justify-between gap-2">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border shadow-inner ${
                            isDarkMode ? 'bg-slate-800/90 border-slate-700/80' : 'bg-slate-100 border-slate-300'
                          }`}>
                            <span>{theme.icon}</span>
                          </div>
                        </div>

                        {/* TÊN LOẠI SÂN & MÔ TẢ ĐẶC ĐIỂM (CHỈ HIỂN THỊ DỮ LIỆU THẬT TỪ CSDL) */}
                        <h3 className={`text-lg sm:text-xl font-black mt-4 tracking-tight group-hover:text-emerald-500 transition-colors ${
                          isDarkMode ? 'text-white' : 'text-slate-900'
                        }`}>
                          {loai.ten_loai}
                        </h3>
                        {loai.mo_ta && loai.mo_ta.trim() ? (
                          <p className={`text-xs mt-1.5 font-medium leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            {loai.mo_ta.trim()}
                          </p>
                        ) : null}
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
              <div className={`p-2.5 sm:p-3 border-b flex items-center justify-between gap-2 shrink-0 ${
                isDarkMode ? 'bg-slate-950/90 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-xl border shadow-inner shrink-0 ${
                    isDarkMode ? 'bg-slate-800/90 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}>
                    <span>{getSportTheme(selectedCategory.ten_loai, selectedCategory.mo_ta, selectedCategory.icon).icon}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className={`text-sm sm:text-lg font-black truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {selectedCategory.ten_loai}
                      </h2>
                    </div>
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
              <div className={`px-3 py-2 border-b flex flex-wrap items-center justify-between gap-2.5 shrink-0 relative z-50 ${
                isDarkMode ? 'bg-slate-900/95 border-slate-800' : 'bg-slate-100/90 border-slate-200'
              }`}>
                {/* CHỌN NGÀY */}
                <div className="flex items-center gap-2">
                  <DateNavigationBar
                    value={filterNgayDa}
                    onChange={(_date, formattedDateStr) => setFilterNgayDa(formattedDateStr)}
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* LỌC SÂN CỤ THỂ (CUSTOM DROPDOWN CAO CẤP) */}
                  <div className="relative" ref={courtFilterDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsCourtFilterOpen((prev) => !prev)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-xs select-none ${
                        isCourtFilterOpen
                          ? 'border-emerald-500 ring-2 ring-emerald-500/25 bg-emerald-500/10'
                          : filterSanId !== 'ALL'
                          ? isDarkMode
                            ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-400 shadow-emerald-950/30'
                            : 'bg-emerald-50/90 border-emerald-400 text-emerald-800 shadow-emerald-500/10'
                          : isDarkMode
                          ? 'bg-slate-950/80 border-slate-800 text-slate-200 hover:border-slate-700 hover:bg-slate-900'
                          : 'bg-white border-slate-300 text-slate-700 hover:border-emerald-300 hover:bg-slate-50'
                      }`}
                      title="Bấm để lọc danh sách sân hiển thị"
                    >
                      <SlidersHorizontal className={`w-3.5 h-3.5 ${filterSanId !== 'ALL' || isCourtFilterOpen ? 'text-emerald-500' : 'text-slate-400'} shrink-0`} />
                      <span className={`whitespace-nowrap ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Sân:</span>
                      <span className={`font-black truncate max-w-[120px] xs:max-w-[150px] sm:max-w-[190px] ${
                        filterSanId !== 'ALL' || isCourtFilterOpen
                          ? isDarkMode ? 'text-emerald-400' : 'text-emerald-700'
                          : isDarkMode ? 'text-white' : 'text-slate-900'
                      }`}>
                        {filterSanId === 'ALL'
                          ? `Tất Cả (${availableSanOptions.length} sân)`
                          : (availableSanOptions.find((s) => String(s.id) === String(filterSanId))?.ten_san || `Sân #${filterSanId}`)}
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${
                        isCourtFilterOpen ? 'rotate-180 text-emerald-500' : isDarkMode ? 'text-slate-400' : 'text-slate-500'
                      }`} />
                    </button>

                    {/* MENU DROPDOWN TÙY BIẾN HIỂN THỊ ĐẸP MẮT */}
                    {isCourtFilterOpen && (
                      <div
                        className={`absolute left-0 top-full mt-2 z-[100] w-[290px] sm:w-[320px] max-w-[calc(100vw-2rem)] rounded-2xl border shadow-2xl backdrop-blur-2xl p-2.5 animate-in fade-in zoom-in-95 duration-150 ${
                          isDarkMode
                            ? 'bg-slate-950/95 border-slate-800/90 text-white shadow-black/70 ring-1 ring-white/10'
                            : 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-900/15 ring-1 ring-black/5'
                        }`}
                      >
                        {/* TIÊU ĐỀ MENU DROPDOWN */}
                        <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-slate-200/70 dark:border-slate-800/80 mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Lọc Danh Sách Sân
                            </span>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            {availableSanOptions.length} sân
                          </span>
                        </div>

                        {/* MỤC CHỌN TẤT CẢ SÂN */}
                        <button
                          type="button"
                          onClick={() => {
                            setFilterSanId('ALL');
                            setCalendarSelectedCourtId('ALL');
                            setIsCourtFilterOpen(false);
                          }}
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer text-left ${
                            filterSanId === 'ALL'
                              ? isDarkMode
                                ? 'bg-emerald-500/20 text-emerald-300 font-black border border-emerald-500/40 shadow-xs'
                                : 'bg-emerald-50 text-emerald-900 font-black border border-emerald-300 shadow-xs'
                              : isDarkMode
                              ? 'hover:bg-slate-900 text-slate-300 hover:text-white border border-transparent'
                              : 'hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              filterSanId === 'ALL'
                                ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                                : isDarkMode
                                ? 'bg-slate-900 text-slate-400 border border-slate-800'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                              <LayoutGrid className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-black truncate">
                                Tất Cả Các Sân
                              </div>
                              <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                                Hiển thị toàn bộ {availableSanOptions.length} sân trên ma trận
                              </div>
                            </div>
                          </div>
                          {filterSanId === 'ALL' && (
                            <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 shadow-sm ml-2">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                        </button>

                        {/* ĐƯỜNG PHÂN CÁCH NHẸ */}
                        <div className="my-1.5 border-t border-slate-200/60 dark:border-slate-800/60" />

                        {/* DANH SÁCH TỪNG SÂN CỤ THỂ */}
                        <div className="max-h-56 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                          {availableSanOptions.map((san) => {
                            const isSelected = String(san.id) === String(filterSanId);
                            const courtInitial = san.ten_san.replace(/^Sân\s*/i, '').trim().substring(0, 3) || san.ten_san.substring(0, 2);
                            const donGiaGio = (Number(san.don_gia_phut || 5000) * 60).toLocaleString('vi-VN');

                            return (
                              <button
                                key={san.id}
                                type="button"
                                onClick={() => {
                                  setFilterSanId(String(san.id));
                                  setCalendarSelectedCourtId(Number(san.id));
                                  setIsCourtFilterOpen(false);
                                }}
                                className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer text-left ${
                                  isSelected
                                    ? isDarkMode
                                      ? 'bg-emerald-500/20 text-emerald-300 font-black border border-emerald-500/40 shadow-xs'
                                      : 'bg-emerald-50 text-emerald-900 font-black border border-emerald-300 shadow-xs'
                                    : isDarkMode
                                    ? 'hover:bg-slate-900 text-slate-300 hover:text-white border border-transparent'
                                    : 'hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-transparent'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                                    isSelected
                                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                                      : isDarkMode
                                      ? 'bg-slate-900 text-emerald-400 border border-slate-800'
                                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  }`}>
                                    {courtInitial}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs font-black truncate">
                                      {san.ten_san}
                                    </div>
                                    <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                      💰 {donGiaGio} đ/h
                                    </div>
                                  </div>
                                </div>
                                {isSelected && (
                                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 shadow-sm ml-2">
                                    <Check className="w-3 h-3 stroke-[3]" />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* FOOTER ĐẶT LẠI (KHI ĐANG CHỌN LỌC 1 SÂN CỤ THỂ) */}
                        {filterSanId !== 'ALL' && (
                          <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between px-1">
                            <button
                              type="button"
                              onClick={() => {
                                setFilterSanId('ALL');
                                setCalendarSelectedCourtId('ALL');
                                setIsCourtFilterOpen(false);
                              }}
                              className="text-[11px] font-bold text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Xem lại tất cả sân</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* TOGGLE CHỈ HIỆN CA TRỐNG */}
                  <button
                    type="button"
                    onClick={() => setOnlyShowEmptySlots(!onlyShowEmptySlots)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-xs ${
                      onlyShowEmptySlots
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 ring-1 ring-emerald-500/30'
                        : isDarkMode
                        ? 'bg-slate-950/80 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                        : 'bg-white border-slate-300 text-slate-600 hover:text-slate-900'
                    }`}
                    title="Chỉ hiển thị các khung giờ còn ít nhất một sân trống"
                  >
                    <CheckCircle2 className={`w-3.5 h-3.5 ${onlyShowEmptySlots ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span>Chỉ hiện ca trống</span>
                  </button>

                  {filterSanId !== 'ALL' && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCourtDetailId(Number(filterSanId));
                        setIsCourtDetailModalOpen(true);
                      }}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-xs ${
                        isDarkMode
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                          : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                      }`}
                      title="Xem chi tiết, đánh giá & bình luận sân này"
                    >
                      <Info className="w-3.5 h-3.5" />
                      <span>Chi tiết sân</span>
                    </button>
                  )}
                </div>
              </div>

              {/* THANH CHÚ THÍCH GOOGLE CALENDAR */}
              {bookingViewMode === 'CALENDAR' && (
                <div className={`px-3 sm:px-4 py-2 border-b flex flex-wrap items-center justify-between gap-2 text-xs shrink-0 ${
                  isDarkMode ? 'bg-slate-950/70 border-slate-800/80 text-slate-300' : 'bg-slate-50/90 border-slate-200 text-slate-600'
                }`}>
                  <div className="flex flex-wrap items-center gap-2.5 sm:gap-4">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 border border-blue-400/60 shadow-xs" />
                      <span className="text-[11px] font-semibold">Trống</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 border border-rose-400/60 shadow-xs" />
                      <span className="text-[11px] font-semibold">Đã đặt</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 border border-amber-400/60 shadow-xs" />
                      <span className="text-[11px] font-semibold">Người khác đang chọn</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 border border-emerald-400/60 shadow-xs" />
                      <span className="text-[11px] font-semibold">Bạn đang chọn</span>
                    </div>
                  </div>
                </div>
              )}

              {/* PHẦN THÂN CỦA MODAL (GOOGLE CALENDAR VIEW HOẶC LƯỚI NÚT TRUYỀN THỐNG) */}
              {bookingViewMode === 'CALENDAR' ? (
                /* CHẾ ĐỘ XEM GOOGLE CALENDAR VIEW */
                <div
                  ref={calendarScrollRef}
                  className={`flex-1 min-h-0 overflow-auto relative ${
                    cartCourts.length > 0 ? 'pb-44 sm:pb-36' : 'pb-2'
                  }`}
                >
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
                  ) : calendarDisplaySlots.length === 0 ? (
                    <div className={`text-center py-12 px-4 rounded-3xl border border-dashed ${isDarkMode ? 'border-slate-800 bg-slate-900/30 text-slate-400' : 'border-slate-300 bg-slate-50 text-slate-600'}`}>
                      <Clock className="w-10 h-10 text-slate-400 mx-auto mb-3 opacity-60" />
                      <p className="text-sm font-bold">Không có khung giờ nào.</p>
                    </div>
                  ) : (
                    /* GIAO DIỆN DÒNG THỜI GIAN DỌC CHUẨN GOOGLE CALENDAR (TIMELINE VIEW) */
                    /* ========================================================================= */
                    <div className={`min-w-max border border-slate-200 dark:border-slate-800 shadow-sm ${
                      isDarkMode ? 'bg-slate-900/40' : 'bg-white'
                    }`}>
                      {/* HÀNG HEADER CỘT: GÓC TRÁI (GMT+7) & CÁC CỘT SÂN (CỐ ĐỊNH KHI CUỘN) */}
                      <div className={`flex border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs ${
                        isDarkMode ? 'bg-slate-900' : 'bg-slate-50'
                      }`}>
                        {/* Ô GÓC TRÁI TRÊN CÙNG (GIAO ĐIỂM STICKY TOP & LEFT) */}
                        <div className={`sticky left-0 z-40 w-16 sm:w-20 shrink-0 p-1.5 sm:p-2 text-center border-r border-slate-200 dark:border-slate-800 font-mono text-[11px] font-bold select-none ${
                          isDarkMode ? 'bg-slate-950 text-slate-400' : 'bg-slate-100 text-slate-600'
                        }`}>
                          <span>GMT+7</span>
                        </div>

                          {/* TIÊU ĐỀ TỪNG SÂN (CLICK ĐỂ XEM CHI TIẾT SÂN & ĐÁNH GIÁ/BÌNH LUẬN) */}
                          {filteredSanList.map((san) => (
                            <div
                              key={`header_${san.id}`}
                              className={`flex-1 min-w-[145px] sm:min-w-[185px] py-2 px-1.5 text-center border-r border-slate-200/80 dark:border-slate-800/80 last:border-r-0 transition-colors ${
                                isDarkMode ? 'bg-slate-900/90 text-white' : 'bg-slate-50/95 text-slate-900'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedCourtDetailId(san.id);
                                  setIsCourtDetailModalOpen(true);
                                }}
                                title={`Bấm vào tên sân để xem chi tiết & đánh giá: ${san.ten_san}`}
                                className="w-full group flex flex-col items-center justify-center focus:outline-none cursor-pointer py-1 px-1.5 rounded-xl transition-all hover:bg-emerald-500/10 hover:scale-[1.02]"
                              >
                                <div className="flex items-center gap-1.5 max-w-full">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-400/50 shrink-0" />
                                  <span className={`font-black text-xs sm:text-sm truncate transition-colors ${
                                    isDarkMode ? 'text-white group-hover:text-emerald-400' : 'text-slate-900 group-hover:text-emerald-600'
                                  }`}>
                                    {san.ten_san}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400 font-medium">
                                  <span className="px-1.5 py-0.2 rounded-md bg-slate-500/10 font-bold text-emerald-600 dark:text-emerald-400">
                                    {san.ten_loai || 'Sân bóng'}
                                  </span>
                                  <span className="hidden sm:inline font-mono">
                                    {(Number(san.don_gia_phut || 5000) * 60).toLocaleString('vi-VN')} đ/h
                                  </span>
                                </div>
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* THÂN GOOGLE CALENDAR GRID: TỪNG HÀNG THỜI GIAN & CÁC Ô SÂN */}
                        <div className="relative">
                          {/* VẠCH ĐỎ THỜI GIAN THỰC (SIGNATURE GOOGLE CALENDAR) */}
                          {isViewingToday && calendarLineTopPx !== null && (
                            <div
                              className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                              style={{ top: `${calendarLineTopPx}px` }}
                            >
                              <div className="sticky left-0 z-30 w-16 sm:w-20 shrink-0 flex items-center justify-end pr-1">
                                <div className="flex items-center gap-1 -translate-y-1/2">
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-black bg-red-500 text-white shadow-md shadow-red-500/50">
                                    {String(Math.floor(currentTimeMinutes / 60)).padStart(2, '0')}:{String(currentTimeMinutes % 60).padStart(2, '0')}
                                  </span>
                                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-red-400 animate-pulse shrink-0" />
                                </div>
                              </div>
                              <div className="flex-1 h-0.5 bg-red-500 shadow-sm shadow-red-500/50" />
                            </div>
                          )}

                          {/* CÁC HÀNG KHUNG GIỜ */}
                          {calendarDisplaySlots.map((slot) => (
                            <div
                              key={slot.start}
                              className="flex border-b border-slate-200/80 dark:border-slate-800/80 last:border-b-0"
                            >
                              {/* CỘT THỜI GIAN BÊN TRÁI (STICKY LEFT CHUẨN GOOGLE CALENDAR) */}
                              <div
                                style={{ height: `${CALENDAR_ROW_HEIGHT}px` }}
                                className={`sticky left-0 z-10 w-16 sm:w-20 shrink-0 px-2 text-right border-r border-slate-200/80 dark:border-slate-800/80 font-mono select-none flex items-center justify-end shadow-xs ${
                                  isDarkMode ? 'bg-slate-950/95' : 'bg-slate-50/95'
                                }`}
                              >
                                <div className="flex items-center gap-1.5 pr-1">
                                  <span className={`font-mono font-black text-xs ${
                                    isDarkMode ? 'text-blue-400' : 'text-blue-600'
                                  }`}>
                                    {slot.label || `${parseInt(slot.start.split(':')[0])}h`}
                                  </span>
                                  <span className="font-mono text-[9px] text-slate-400 dark:text-slate-500">
                                    {slot.start}
                                  </span>
                                </div>
                              </div>

                              {/* TỪNG CỘT SÂN */}
                              {filteredSanList.map((san) => {
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
                                const isPast = isSlotInThePast(slot.start);
                                const isHeldByMe = cartCourts.length > 0 && (cartCourts.some((c) => c.holdSlotKeys.includes(slotKeyRealtime)) || myLockedSlotIds.includes(slotKeyRealtime));
                                const isLockedByOther = lockedSlots.includes(slotKeyRealtime) && !isHeldByMe;
                                const isCourtInCartOnThisDay = cartCourts.some((c) => c.san.id === san.id && c.ngay_da === filterNgayDa);

                                return (
                                  <div
                                    key={`${san.id}_${slot.start}`}
                                    style={{ height: `${CALENDAR_ROW_HEIGHT}px` }}
                                    className="flex-1 min-w-[145px] sm:min-w-[185px] border-r border-slate-200/80 dark:border-slate-800/80 last:border-r-0 relative px-2 py-0.5 flex items-center justify-center transition-colors"
                                  >
                                    {isBooked ? (
                                      <div
                                        title={`Ca ${slot.label} (${slot.start} - ${slot.end}) đã có người đặt (${slotData?.ten_khach_hang || matchedSyncOrder?.ten_khach_hang || 'Khách đặt'})`}
                                        className="w-full max-w-[130px] sm:max-w-[160px] h-7 sm:h-7.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center justify-center gap-1 select-none cursor-not-allowed"
                                      >
                                        <XCircle className="w-3 h-3 shrink-0" />
                                        <span className="truncate">{slot.label} • Đã đặt</span>
                                      </div>
                                    ) : isPast ? (
                                      <div
                                        title={`Ca ${slot.label} ngày hôm nay đã kết thúc`}
                                        className="w-full max-w-[130px] sm:max-w-[160px] h-7 sm:h-7.5 rounded-full bg-slate-500/10 border border-dashed border-slate-300 dark:border-slate-800 text-slate-400 line-through font-medium text-xs flex items-center justify-center select-none cursor-not-allowed opacity-50"
                                      >
                                        <span>{slot.label} (Đã qua)</span>
                                      </div>
                                    ) : isLockedByOther ? (
                                      <div
                                        title={`Ca ${slot.label} (${slot.start} - ${slot.end}) đang có người khác chọn`}
                                        onClick={() => triggerToast({
                                          type: 'info',
                                          message: `Khung giờ ${slot.label} của ${san.ten_san} đang có người khác chọn!`,
                                        })}
                                        className="w-full max-w-[130px] sm:max-w-[160px] h-7 sm:h-7.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer select-none"
                                      >
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping shrink-0" />
                                        <span className="truncate">{slot.label} • Đang chọn</span>
                                      </div>
                                    ) : isHeldByMe ? (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setMultiBookingStep('CART');
                                          setIsMultiBookingModalOpen(true);
                                        }}
                                        title={`Bạn đang chọn giữ chỗ ca ${slot.label} (${san.ten_san}). Bấm để mở giỏ sân.`}
                                        className="w-full max-w-[130px] sm:max-w-[160px] h-7 sm:h-7.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs cursor-pointer transition-all hover:scale-[1.03] active:scale-95"
                                      >
                                        <Lock className="w-3 h-3 shrink-0" />
                                        <span className="truncate">{slot.label} • Trong giỏ</span>
                                      </button>
                                    ) : isCourtInCartOnThisDay ? (
                                      <div
                                        title={`Sân "${san.ten_san}" đã có ca đặt trong ngày ${formatDateDMY(filterNgayDa)}. Quý khách có thể đổi sang ngày khác để đặt tiếp sân này!`}
                                        onClick={() => triggerToast({
                                          type: 'info',
                                          message: `Sân "${san.ten_san}" đã có ca đặt trong ngày ${formatDateDMY(filterNgayDa)}. Quý khách có thể đổi sang ngày khác để đặt tiếp sân này!`,
                                        })}
                                        className="w-full max-w-[130px] sm:max-w-[160px] h-7 sm:h-7.5 rounded-full bg-slate-500/10 border border-dashed border-slate-400/40 text-slate-400 font-semibold text-xs flex items-center justify-center select-none cursor-not-allowed opacity-60"
                                      >
                                        <span className="truncate">{slot.label} • Đã trong giỏ</span>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleSlotClick(san, slot)}
                                        title={`Đặt ca ${slot.label} (${slot.start} - ${slot.end}) sân ${san.ten_san} • ${(Number(san.don_gia_phut || 5000) * 60).toLocaleString('vi-VN')} đ`}
                                        className="w-full max-w-[130px] sm:max-w-[160px] h-7 sm:h-7.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm shadow-xs hover:shadow-md hover:scale-[1.03] active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                                      >
                                        <span>{slot.label || `${parseInt(slot.start.split(':')[0])}h`}</span>
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Khoảng đệm đáy cuộn an toàn chống che khuất bởi thanh giỏ hàng nổi */}
                  {cartCourts.length > 0 && (
                    <div className="h-36 sm:h-28 w-full shrink-0 pointer-events-none" aria-hidden="true" />
                  )}
                </div>
              ) : (
                /* CHẾ ĐỘ XEM LƯỚI NÚT TRUYỀN THỐNG */
                <div className={`flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6 ${cartCourts.length > 0 ? 'pb-44 sm:pb-36' : 'pb-6'}`}>
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
                              </div>
                              <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                💰 {(Number(san.don_gia_phut || 5000) * 60).toLocaleString('vi-VN')} đ/giờ
                              </p>
                            </div>
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
                            const isPast = isSlotInThePast(slot.start);

                            // Kiểm tra xem slot này có đang được chính khách hàng này giữ chỗ trong giỏ hay không
                            const isHeldByMe = cartCourts.length > 0 && (cartCourts.some((c) => c.holdSlotKeys.includes(slotKeyRealtime)) || myLockedSlotIds.includes(slotKeyRealtime));

                            // Khách hàng khác đang giữ chỗ
                            const isLockedByOther = lockedSlots.includes(slotKeyRealtime) && !isHeldByMe;

                            // Sân này đã có trong giỏ hàng
                            const isCourtInCartOnThisDay = cartCourts.some((c) => c.san.id === san.id && c.ngay_da === filterNgayDa);

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
                                  /* Ô do khách hàng khác đang chọn giữ chỗ Real-time (Màu Cam Đậm nổi bật) */
                                  <div
                                    title={`Khung giờ ${slot.label} (${slot.start}) của ${san.ten_san} đang có người khác chọn`}
                                    onClick={() => {
                                      triggerToast({
                                        type: 'info',
                                        message: `Khung giờ ${slot.label} (${slot.start}) của ${san.ten_san} đang có người khác chọn. Vui lòng chọn khung giờ khác!`,
                                      });
                                    }}
                                    className="w-full h-9 sm:h-10 px-2 sm:px-3 rounded-full bg-gradient-to-r from-orange-500 via-amber-600 to-orange-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/30 border border-orange-400/50 cursor-not-allowed select-none transition-all"
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping shrink-0" />
                                    <span className="font-bold tracking-wide">{slot.label}</span>
                                  </div>
                                ) : isHeldByMe ? (
                                  /* Ô do chính khách hàng này đang chọn giữ chỗ (Màu Xanh Lá Cây Emerald Ngọc Lục Bảo) */
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setMultiBookingStep('CART');
                                      setIsMultiBookingModalOpen(true);
                                    }}
                                    title={`Bạn đang chọn khung giờ ${slot.label} (${san.ten_san}). Bấm để mở giỏ sân.`}
                                    className="w-full h-9 sm:h-10 px-2 sm:px-3 rounded-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/40 ring-2 ring-emerald-300 hover:scale-[1.04] active:scale-95 transition-all duration-200 cursor-pointer select-none"
                                  >
                                    <Lock className="w-3.5 h-3.5 stroke-[2.5]" />
                                    <span className="font-black tracking-wide">{slot.label}</span>
                                  </button>
                                ) : isCourtInCartOnThisDay ? (
                                  /* Sân này đã có ca đặt trong ngày hiện tại */
                                  <button
                                    type="button"
                                    onClick={() => {
                                      triggerToast({
                                        type: 'info',
                                        message: `Sân "${san.ten_san}" đã có ca đặt trong ngày ${formatDateDMY(filterNgayDa)}. Quý khách có thể chọn ngày khác để tiếp tục đặt sân này!`,
                                      });
                                    }}
                                    title={`Sân ${san.ten_san} đã có ca đặt trong ngày ${formatDateDMY(filterNgayDa)}. Quý khách có thể chọn ngày khác để tiếp tục đặt sân này.`}
                                    className={`w-full h-9 sm:h-10 px-2 sm:px-3 rounded-full flex items-center justify-center select-none cursor-not-allowed transition-all text-xs sm:text-sm font-semibold opacity-40 border ${
                                      isDarkMode
                                        ? 'border-slate-800 bg-slate-900/50 text-slate-500'
                                        : 'border-slate-200 bg-slate-100 text-slate-400'
                                    }`}
                                  >
                                    <span>{slot.label}</span>
                                  </button>
                                ) : (
                                  /* Ô trống sẵn sàng đặt */
                                  <button
                                    type="button"
                                    onClick={() => handleSlotClick(san, slot)}
                                    title={`Bấm để chọn khung giờ ${slot.label} (${slot.start})`}
                                    className="w-full h-9 sm:h-10 px-2 sm:px-3 rounded-full bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center shadow-md shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.04] active:scale-95 transition-all duration-200 cursor-pointer select-none group border border-blue-400/30"
                                  >
                                    <span className="font-bold tracking-wide group-hover:tracking-wider transition-all">
                                      {slot.label}
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
                {/* Khoảng đệm đáy cuộn an toàn chống che khuất bởi thanh giỏ hàng nổi */}
                {cartCourts.length > 0 && (
                  <div className="h-36 sm:h-28 w-full shrink-0 pointer-events-none" aria-hidden="true" />
                )}
              </div>
              )}
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
          - Có nút Thu Gọn / Mở Rộng giúp khách thoải mái lướt xem các khung giờ không bị che khuất
          ===================================================================== */}
      {cartCourts.length > 0 && !isMultiBookingModalOpen && !selectedSlot && (
        isCartBarCollapsed ? (
          /* Dạng thu gọn siêu nhỏ gọn góc phải màn hình - Dynamic Island Capsule */
          <div className="fixed bottom-4 right-3 sm:right-6 z-[400] p-2.5 sm:p-3 rounded-2xl border shadow-2xl backdrop-blur-2xl flex items-center gap-3 bg-slate-950/95 border-emerald-500/60 text-white ring-2 ring-emerald-500/25 shadow-emerald-950/60 animate-in slide-in-from-bottom duration-200">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
                <ShoppingCart className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black flex items-center justify-center ring-2 ring-slate-950">
                {cartCourts.length}
              </span>
            </div>
            <div className="text-xs">
              <p className="font-black text-amber-300">
                {cartCourts.length} sân thi đấu
              </p>
              <p className="font-mono text-emerald-400 font-black">{tongTienSanCart.toLocaleString('vi-VN')} đ</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setBookingForm((p) => ({
                  ...p,
                  ho_ten: currentUser?.ho_ten || p.ho_ten || '',
                  so_dien_thoai: currentUser?.so_dien_thoai || p.so_dien_thoai || '',
                }));
                setMultiBookingStep('CART');
                setIsMultiBookingModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:from-emerald-400 hover:to-teal-300 shadow-lg shadow-emerald-500/30 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
            >
              <span>Xem Giỏ</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
            </button>
            <button
              type="button"
              onClick={() => setIsCartBarCollapsed(false)}
              title="Mở rộng thanh giỏ hàng"
              className="p-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <ChevronUp className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        ) : (
          /* Dạng đầy đủ cao cấp - Glassmorphism Athletic Bar */
          <div className="fixed bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-[400] w-[95%] max-w-4xl p-3 sm:p-4 rounded-3xl border shadow-2xl backdrop-blur-2xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-in slide-in-from-bottom duration-300 bg-slate-950/95 border-emerald-500/50 text-white ring-2 ring-emerald-500/20 shadow-emerald-950/60">
            <div className="flex items-center gap-3 sm:gap-3.5 w-full sm:w-auto">
              <div className="relative">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-400 to-emerald-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-emerald-500/30 shrink-0">
                  <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
                </div>
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 text-slate-950 text-xs font-black flex items-center justify-center ring-2 ring-slate-950">
                  {cartCourts.length}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm sm:text-base font-black text-white truncate">
                    Đang chọn <span className="text-amber-400">{cartCourts.length} sân thi đấu</span>
                  </p>
                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-mono font-bold animate-pulse">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Giữ chỗ: {formatCountdown(holdSecondsLeft)}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Tổng tiền sân:{' '}
                  <span className="font-mono font-black text-emerald-400 text-sm sm:text-base">
                    {tongTienSanCart.toLocaleString('vi-VN')} đ
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => setIsCartBarCollapsed(true)}
                title="Thu gọn thanh giỏ hàng để dễ xem lịch sân"
                className="px-3 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ChevronDown className="w-4 h-4 stroke-[2.5]" />
                <span>Thu gọn</span>
              </button>
              <button
                type="button"
                onClick={handleClearCart}
                className="px-3 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
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
                  setMultiBookingStep('CART');
                  setIsMultiBookingModalOpen(true);
                }}
                className="flex-1 sm:flex-initial px-5 sm:px-6 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-black bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-xl shadow-emerald-500/40 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
              >
                <span>Xem Giỏ Sân & Đặt Ngay</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </div>
        )
      )}

      {/* =====================================================================
          MODAL XÁC NHẬN ĐẶT NHIỀU SÂN CÙNG LÚC (MULTI-BOOKING MODAL)
          ===================================================================== */}
      {isMultiBookingModalOpen && cartCourts.length > 0 && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2.5 sm:p-5 md:p-6 bg-slate-950/80 backdrop-blur-md overflow-hidden">
          <div className={`relative w-full ${multiBookingStep === 'QR' ? 'max-w-lg md:max-w-4xl lg:max-w-5xl' : 'max-w-4xl lg:max-w-5xl'} max-h-[84vh] sm:max-h-[82vh] flex flex-col border rounded-3xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 ${
            isDarkMode ? 'bg-slate-900 border-amber-600/50' : 'bg-white border-amber-400'
          }`}>
            {/* Header Modal: Bước 1 (Giỏ Sân), Bước 2 (Dịch vụ đi kèm) hoặc Bước 3 (Thanh Toán VietQR) */}
            {multiBookingStep === 'CART' ? (
              <div className={`px-4 py-2.5 sm:px-6 sm:py-3 border-b flex items-center justify-between shrink-0 ${
                isDarkMode ? 'bg-slate-950/90 border-slate-800' : 'bg-amber-50/70 border-slate-200'
              }`}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md">
                    <ShoppingCart className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <h2 className={`text-sm sm:text-base font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      Giỏ Sân Đặt
                    </h2>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono font-black text-xs shadow-xs ${
                    isDarkMode
                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                      : 'bg-amber-100 border-amber-300 text-amber-800'
                  }`}>
                    <Clock className={`w-3.5 h-3.5 ${isDarkMode ? 'text-amber-400' : 'text-amber-700'}`} />
                    <span>Giữ sân: {formatCountdown(holdSecondsLeft)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMultiBookingModalOpen(false);
                      setMultiBookingStep('CART');
                    }}
                    className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                      isDarkMode
                        ? 'border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800'
                        : 'border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-100 shadow-xs'
                    }`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : multiBookingStep === 'SERVICES' ? (
              <div className={`px-4 py-2.5 sm:px-6 sm:py-3 border-b flex items-center justify-between shrink-0 ${
                isDarkMode ? 'bg-slate-950/90 border-slate-800' : 'bg-amber-50/70 border-slate-200'
              }`}>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setMultiBookingStep('CART')}
                    className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-all cursor-pointer border border-slate-700"
                    title="Quay lại danh sách sân"
                  >
                    <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
                  </button>
                  <div>
                    <h2 className={`text-sm sm:text-base font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      Dịch vụ đi kèm
                    </h2>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono font-black text-xs shadow-xs ${
                    isDarkMode
                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                      : 'bg-amber-100 border-amber-300 text-amber-800'
                  }`}>
                    <Clock className={`w-3.5 h-3.5 ${isDarkMode ? 'text-amber-400' : 'text-amber-700'}`} />
                    <span>Giữ sân: {formatCountdown(holdSecondsLeft)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMultiBookingModalOpen(false);
                      setMultiBookingStep('CART');
                    }}
                    className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                      isDarkMode
                        ? 'border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800'
                        : 'border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-100 shadow-xs'
                    }`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : multiBookingStep === 'CONFIRM' ? (
              <div className={`px-4 py-2.5 sm:px-6 sm:py-3 border-b flex items-center justify-between shrink-0 ${
                isDarkMode ? 'bg-slate-950/90 border-slate-800' : 'bg-emerald-50/70 border-slate-200'
              }`}>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setMultiBookingStep('SERVICES')}
                    className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-all cursor-pointer border border-slate-700"
                    title="Quay lại dịch vụ đi kèm"
                  >
                    <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
                  </button>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shadow-md">
                    <FileText className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <h2 className={`text-sm sm:text-base font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      Xác Nhận Đơn Đặt & Ưu Đãi
                    </h2>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono font-black text-xs shadow-xs ${
                    isDarkMode
                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                      : 'bg-amber-100 border-amber-300 text-amber-800'
                  }`}>
                    <Clock className={`w-3.5 h-3.5 ${isDarkMode ? 'text-amber-400' : 'text-amber-700'}`} />
                    <span>Giữ sân: {formatCountdown(holdSecondsLeft)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMultiBookingModalOpen(false);
                      setMultiBookingStep('CART');
                    }}
                    className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                      isDarkMode
                        ? 'border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800'
                        : 'border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-100 shadow-xs'
                    }`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className={`px-4 py-2.5 sm:px-6 sm:py-3 border-b flex items-center justify-between shrink-0 ${
                isDarkMode ? 'bg-slate-950/90 border-slate-800' : 'bg-emerald-50/70 border-slate-200'
              }`}>
                <div className="flex items-center gap-2.5">
                  {!isPaymentSuccess && (
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
                        setMultiBookingStep('CONFIRM');
                      }}
                      className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-all cursor-pointer border border-slate-700"
                      title="Quay lại xác nhận đơn đặt"
                    >
                      <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  )}
                  <div>
                    <h2 className={`text-sm sm:text-base font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      Thanh Toán
                    </h2>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!isPaymentSuccess && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono font-black text-xs shadow-sm">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Giữ sân: {formatCountdown(holdSecondsLeft)}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (!isPaymentSuccess && (payOSData?.ma_don_dat || payOSData?.orderCode)) {
                        fetch(`${API_BASE_URL}/thanh-toan/payos/huy-don-tam`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            ma_don_dat: payOSData.ma_don_dat,
                            orderCode: payOSData.orderCode,
                          }),
                        }).catch((e) => console.warn('Lỗi hủy đơn tạm:', e));
                      }
                      if (isPaymentSuccess) {
                        handleCloseSuccessModal();
                      } else {
                        setPayOSData(null);
                        setQrModalAlert(null);
                        setIsMultiBookingModalOpen(false);
                      }
                    }}
                    className="w-8 h-8 rounded-xl border flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Thân Modal */}
            <div className="p-3.5 sm:p-5 overflow-y-auto space-y-3.5 sm:space-y-4 flex-1">
              {multiBookingStep === 'CART' && (
                <>
                  {/* 1. Danh sách các sân thi đấu (VIP Match Ticket Design) */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`text-xs font-black uppercase tracking-wider ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-700 font-extrabold'
                      }`}>
                        1. Danh sách sân thi đấu ({cartCourts.length})
                      </h3>
                      <button
                        type="button"
                        onClick={handleClearCart}
                        className={`text-xs font-bold hover:underline flex items-center gap-1 cursor-pointer ${
                          isDarkMode ? 'text-rose-400' : 'text-rose-600'
                        }`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa toàn bộ giỏ</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {cartCourts.map((item, idx) => (
                        <div
                          key={item.id}
                          className={`relative p-3 sm:p-3.5 rounded-2xl border flex flex-col gap-2.5 transition-all ${
                            isDarkMode
                              ? 'bg-gradient-to-br from-slate-950/90 via-slate-900/80 to-slate-950/90 border-slate-800 hover:border-emerald-500/40'
                              : 'bg-white border-slate-200/90 hover:border-emerald-500/40 shadow-sm'
                          }`}
                        >
                          {/* Dòng 1: Thông tin vé sân & Giờ đá & Nút xóa */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5 min-w-0">
                              <div className="flex flex-col items-center justify-center w-7 h-7 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 font-black text-xs shadow-md shrink-0">
                                <span>{idx + 1}</span>
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className={`text-sm sm:text-base font-black truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                    {item.san.ten_san}
                                  </h4>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                                    isDarkMode
                                      ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                                      : 'bg-cyan-50 text-cyan-800 border-cyan-300'
                                  }`}>
                                    {item.san.ten_loai || 'Sân tiêu chuẩn'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-3 flex-wrap mt-0.5 text-xs">
                                  <span className={`flex items-center gap-1 font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                    <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                                    {formatDateDMY(item.ngay_da)}
                                  </span>
                                  <span className="text-slate-400">•</span>
                                  <span className="flex items-center gap-1 font-mono font-bold text-amber-500 dark:text-amber-400">
                                    <Clock className="w-3.5 h-3.5" />
                                    {item.slot.start} - {item.gioKetThuc}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveCartCourt(item.id)}
                              className={`w-7 h-7 rounded-xl border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                                isDarkMode
                                  ? 'border-slate-800 hover:border-rose-500/50 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400'
                                  : 'border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-500 hover:text-rose-600 shadow-xs'
                              }`}
                              title="Xóa sân này khỏi giỏ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Dòng 2: Thời lượng & Giá vé sân */}
                          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t ${
                            isDarkMode ? 'border-slate-800/80' : 'border-slate-200'
                          }`}>
                            <div className="flex items-center gap-2">
                              <span className={`text-[11px] font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                Thời lượng:
                              </span>
                              <div className={`grid grid-cols-3 sm:inline-flex rounded-xl p-0.5 border ${
                                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-300'
                              }`}>
                                {[60, 90, 120].map((dur) => {
                                  const maxAvailableMin = (item.holdSlotKeys?.length || 1) * 60;
                                  const isAvailable = dur <= maxAvailableMin;
                                  const label = dur === 60 ? '1h (60p)' : dur === 90 ? '1h30 (90p)' : '2h (120p)';
                                  return (
                                    <button
                                      key={dur}
                                      type="button"
                                      disabled={!isAvailable}
                                      onClick={() => isAvailable && handleChangeCartCourtDuration(item.id, dur)}
                                      title={!isAvailable ? `Không thể chọn ${dur === 90 ? '1 tiếng 30p' : dur + 'p'} vì các khung giờ tiếp theo đã có người đặt hoặc đang giữ chỗ` : undefined}
                                      className={`px-2 sm:px-2.5 py-0.5 text-[11px] font-bold rounded-lg transition-all text-center whitespace-nowrap ${
                                        !isAvailable
                                          ? isDarkMode ? 'text-slate-600 opacity-30 cursor-not-allowed' : 'text-slate-400 opacity-40 cursor-not-allowed'
                                          : item.durationMin === dur
                                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black shadow-sm cursor-pointer'
                                          : isDarkMode
                                            ? 'text-slate-400 hover:text-white cursor-pointer'
                                            : 'text-slate-600 hover:text-slate-900 cursor-pointer'
                                      }`}
                                    >
                                      {label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-2 text-right">
                              <span className={`text-xs font-semibold sm:hidden ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Tiền sân:</span>
                              <p className="text-sm sm:text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                                {item.giaTien.toLocaleString('vi-VN')} đ
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 2. Lựa chọn hình thức thanh toán cọc / toàn phần (Comparison Cards) */}
                  <div>
                    <h3 className={`text-xs font-black uppercase tracking-wider mb-2 ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-700 font-extrabold'
                    }`}>
                      2. Lựa chọn hình thức thanh toán
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Thẻ 1: Đặt cọc 30% */}
                      <div
                        onClick={() => setBookingForm((p) => ({ ...p, loai_thanh_toan: 'DAT_COC' }))}
                        className={`p-3 sm:p-3.5 rounded-2xl border cursor-pointer transition-all relative ${
                          bookingForm.loai_thanh_toan === 'DAT_COC'
                            ? isDarkMode
                              ? 'border-emerald-500 bg-emerald-950/30 ring-2 ring-emerald-400 shadow-md shadow-emerald-950/40'
                              : 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500 shadow-sm'
                            : isDarkMode
                              ? 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                              : 'border-slate-200 bg-white hover:border-slate-300 shadow-xs'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                              bookingForm.loai_thanh_toan === 'DAT_COC'
                                ? 'border-emerald-500 bg-emerald-500 text-slate-950'
                                : 'border-slate-400'
                            }`}>
                              {bookingForm.loai_thanh_toan === 'DAT_COC' && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className={`text-xs sm:text-sm font-black ${
                              bookingForm.loai_thanh_toan === 'DAT_COC'
                                ? isDarkMode ? 'text-emerald-400' : 'text-emerald-800 font-black'
                                : isDarkMode ? 'text-slate-200' : 'text-slate-800 font-bold'
                            }`}>
                              Đặt cọc 30% giữ chỗ
                            </span>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/30">
                            Tiết kiệm ban đầu
                          </span>
                        </div>

                        <div className="mt-1.5 flex items-baseline justify-between">
                          <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                            Số tiền cọc ngay:
                          </span>
                          <span className="text-base sm:text-lg font-mono font-black text-emerald-600 dark:text-emerald-400">
                            {tienCocCart.toLocaleString('vi-VN')} đ
                          </span>
                        </div>

                        <p className={`text-[10px] sm:text-[11px] mt-1 leading-snug ${
                          isDarkMode ? 'text-slate-400' : 'text-slate-600'
                        }`}>
                          Thanh toán trước 30% để hệ thống khóa sân. Số tiền còn lại thanh toán tại quầy khi nhận sân.
                        </p>
                      </div>

                      {/* Thẻ 2: Thanh toán 100% */}
                      <div
                        onClick={() => setBookingForm((p) => ({ ...p, loai_thanh_toan: 'TRA_HET' }))}
                        className={`p-3 sm:p-3.5 rounded-2xl border cursor-pointer transition-all relative ${
                          bookingForm.loai_thanh_toan === 'TRA_HET'
                            ? isDarkMode
                              ? 'border-emerald-500 bg-emerald-950/30 ring-2 ring-emerald-400 shadow-md shadow-emerald-950/40'
                              : 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500 shadow-sm'
                            : isDarkMode
                              ? 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                              : 'border-slate-200 bg-white hover:border-slate-300 shadow-xs'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                              bookingForm.loai_thanh_toan === 'TRA_HET'
                                ? 'border-emerald-500 bg-emerald-500 text-slate-950'
                                : 'border-slate-400'
                            }`}>
                              {bookingForm.loai_thanh_toan === 'TRA_HET' && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className={`text-xs sm:text-sm font-black ${
                              bookingForm.loai_thanh_toan === 'TRA_HET'
                                ? isDarkMode ? 'text-emerald-400' : 'text-emerald-800 font-black'
                                : isDarkMode ? 'text-slate-200' : 'text-slate-800 font-bold'
                            }`}>
                              Thanh toán 100% toàn phần
                            </span>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 border border-emerald-500/30">
                            Thảnh thơi đá ngay
                          </span>
                        </div>

                        <div className="mt-1.5 flex items-baseline justify-between">
                          <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                            Tổng tiền trọn gói:
                          </span>
                          <span className="text-base sm:text-lg font-mono font-black text-emerald-600 dark:text-emerald-400">
                            {tongTienSanCart.toLocaleString('vi-VN')} đ
                          </span>
                        </div>

                        <p className={`text-[10px] sm:text-[11px] mt-1 leading-snug ${
                          isDarkMode ? 'text-slate-400' : 'text-slate-600'
                        }`}>
                          Thanh toán toàn bộ tiền sân và dịch vụ.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {multiBookingStep === 'SERVICES' && (
                /* Thân Modal: BƯỚC 2 - DỊCH VỤ ĐI KÈM */
                <div className="space-y-4">
                  {/* Banner tổng tiền dịch vụ */}
                  <div className={`p-3.5 sm:p-4 rounded-2xl border flex items-center justify-between ${
                    isDarkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-emerald-50/60 border-emerald-200'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold">
                        <Coffee className="w-5 h-5" />
                      </div>
                      <div>
                        <p className={`text-xs font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`}>
                          Nước giải khát & Dịch vụ đi kèm
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Chuẩn bị sẵn sàng khi bạn và đồng đội ra sân
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-[11px] block ${isDarkMode ? 'text-slate-400' : 'text-slate-500 font-semibold'}`}>
                        Tiền dịch vụ:
                      </span>
                      <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-base font-black">
                        {tongTienDichVuCart.toLocaleString('vi-VN')} đ
                      </strong>
                    </div>
                  </div>

                  {/* Lưới sản phẩm dịch vụ - NO bán chạy / gợi ý */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-3.5">
                    {dichVuList.map((dv) => {
                      const qty = bookingForm.dich_vu_chon[dv.id] || 0;
                      return (
                        <div
                          key={dv.id}
                          className={`p-3.5 rounded-2xl border flex flex-col justify-between transition-all ${
                            qty > 0
                              ? isDarkMode
                                ? 'border-emerald-500/70 bg-emerald-950/25 ring-2 ring-emerald-500/30 shadow-md shadow-emerald-950/30'
                                : 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-400 shadow-sm'
                              : isDarkMode
                                ? 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                                : 'border-slate-200 bg-white hover:border-slate-300 shadow-xs'
                          }`}
                        >
                          <div>
                            <div className="w-8 h-8 rounded-lg bg-slate-500/10 text-emerald-500 flex items-center justify-center mb-2 font-bold">
                              {dv.ten_dich_vu.toLowerCase().includes('áo') || dv.ten_dich_vu.toLowerCase().includes('quần') ? (
                                <Shirt className="w-4 h-4" />
                              ) : (
                                <Coffee className="w-4 h-4" />
                              )}
                            </div>
                            <p className={`text-xs font-black line-clamp-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                              {dv.ten_dich_vu}
                            </p>
                            <p className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                              {dv.don_gia.toLocaleString('vi-VN')} đ
                            </p>
                          </div>

                          <div className={`flex items-center justify-between mt-3 pt-2.5 border-t ${
                            isDarkMode ? 'border-slate-800' : 'border-slate-200'
                          }`}>
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
                              disabled={qty === 0}
                              className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-sm transition-all ${
                                qty === 0
                                  ? isDarkMode ? 'bg-slate-900 text-slate-600 cursor-not-allowed opacity-40' : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-40'
                                  : isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-white cursor-pointer active:scale-90' : 'bg-slate-200 hover:bg-slate-300 text-slate-800 cursor-pointer active:scale-90'
                              }`}
                            >
                              -
                            </button>
                            <span className={`font-mono text-xs font-black ${
                              qty > 0 ? (isDarkMode ? 'text-emerald-400 font-extrabold' : 'text-emerald-700 font-extrabold') : (isDarkMode ? 'text-slate-500' : 'text-slate-400')
                            }`}>
                              {qty}
                            </span>
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
                              className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-sm cursor-pointer active:scale-90 transition-all ${
                                isDarkMode ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black' : 'bg-emerald-600 hover:bg-emerald-500 text-white font-black'
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
              )}

              {multiBookingStep === 'CONFIRM' && (
                /* Thân Modal: BƯỚC 3 - XÁC NHẬN ĐƠN ĐẶT SÂN & VOUCHER ƯU ĐÃI */
                <div className="space-y-4">
                  {/* 1. TẤT CẢ CÁC ĐƠN SÂN THI ĐẤU ĐÃ CHỌN */}
                  <div className={`p-4 rounded-2xl border ${
                    isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                        isDarkMode ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                        <span>🏟️ Danh sách sân thi đấu ({cartCourts.length} sân)</span>
                      </h3>
                      <button
                        type="button"
                        onClick={() => setMultiBookingStep('CART')}
                        className="text-xs font-bold text-emerald-500 hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>Sửa sân</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      {cartCourts.map((item, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center font-black text-[11px] shrink-0">
                              {idx + 1}
                            </span>
                            <div>
                              <div className="flex items-center gap-1.5 font-black">
                                <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>{item.san.ten_san}</span>
                                {item.san.ten_loai && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500">
                                    {item.san.ten_loai}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                📅 {formatDateDMY(item.ngay_da)} • ⏰ {item.slot.start} - {item.gioKetThuc} ({item.durationMin}p)
                              </p>
                            </div>
                          </div>
                          <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm shrink-0">
                            {item.giaTien.toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 2. DỊCH VỤ ĐI KÈM ĐÃ CHỌN */}
                  <div className={`p-4 rounded-2xl border ${
                    isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                        isDarkMode ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                        <span>🥤 Dịch vụ đi kèm</span>
                      </h3>
                      <button
                        type="button"
                        onClick={() => setMultiBookingStep('SERVICES')}
                        className="text-xs font-bold text-emerald-500 hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>Sửa dịch vụ</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>

                    {Object.entries(bookingForm.dich_vu_chon).some(([_, qty]) => qty > 0) ? (
                      <div className="space-y-1.5">
                        {Object.entries(bookingForm.dich_vu_chon)
                          .filter(([_, qty]) => qty > 0)
                          .map(([dvId, qty]) => {
                            const dv = dichVuList.find((d) => d.id === Number(dvId));
                            if (!dv) return null;
                            return (
                              <div
                                key={dvId}
                                className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                                  isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className={isDarkMode ? 'text-slate-200' : 'text-slate-800 font-bold'}>{dv.ten_dich_vu}</span>
                                  <span className="text-slate-400">x{qty}</span>
                                </div>
                                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                  {(dv.don_gia * qty).toLocaleString('vi-VN')} đ
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        Không chọn dịch vụ đi kèm.
                      </p>
                    )}
                  </div>

                  {/* 3. HÌNH THỨC THANH TOÁN */}
                  <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                    isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">💳</span>
                      <div>
                        <span className={`text-[11px] block ${isDarkMode ? 'text-slate-400' : 'text-slate-500 font-medium'}`}>
                          Hình thức thanh toán:
                        </span>
                        <span className="font-bold text-xs text-slate-800 dark:text-white">
                          {bookingForm.loai_thanh_toan === 'DAT_COC' 
                            ? 'Đặt cọc 30% giữ chỗ (còn lại trả tại quầy)' 
                            : 'Thanh toán 100% trọn gói'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMultiBookingStep('CART')}
                      className="text-xs font-bold text-emerald-500 hover:underline cursor-pointer"
                    >
                      Đổi
                    </button>
                  </div>

                  {/* 4. MÃ ƯU ĐÃI & VOUCHER (DUY NHẤT Ở ĐÂY) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-xs font-black uppercase tracking-wider ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-700 font-extrabold'
                      }`}>
                        Mã ưu đãi & Voucher
                      </h3>
                      {/* Nút Xem tất cả mã ưu đãi (Kho Voucher) */}
                      <button
                        type="button"
                        onClick={() => setIsVoucherModalOpen(true)}
                        className="px-3 py-1 rounded-xl text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all flex items-center gap-1 cursor-pointer border border-emerald-500/30 shadow-xs"
                      >
                        <span>🎫 Chọn Voucher</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className={`p-3 sm:p-3.5 rounded-2xl border transition-all ${
                      isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-gradient-to-r from-emerald-50/70 to-teal-50/50 border-emerald-200 shadow-xs'
                    }`}>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Tag className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                          <input
                            type="text"
                            value={voucherInput}
                            onChange={(e) => {
                              setVoucherInput(e.target.value.toUpperCase());
                              if (voucherError) setVoucherError(null);
                            }}
                            placeholder="Nhập mã ưu đãi (VD: SOCCER247NEW)..."
                            className={`w-full pl-8 pr-3 py-2 text-xs font-mono font-bold uppercase rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                              isDarkMode 
                                ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500' 
                                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                            }`}
                          />
                        </div>
                        {appliedVoucher ? (
                          <button
                            type="button"
                            onClick={handleRemoveVoucher}
                            className="px-3 py-2 text-xs font-bold text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl transition-all cursor-pointer border border-rose-500/30 flex items-center gap-1 shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Gỡ mã</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleApplyVoucherInput}
                            disabled={!voucherInput.trim() || isValidatingVoucher}
                            className="px-4 py-2 text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-emerald-500/20 flex items-center gap-1 shrink-0"
                          >
                            {isValidatingVoucher ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Áp dụng</span>}
                          </button>
                        )}
                      </div>

                      {/* Hiển thị thẻ voucher đang áp dụng */}
                      {appliedVoucher && (
                        <div className={`mt-2.5 p-2.5 rounded-2xl border flex items-center justify-between text-xs transition-all shadow-sm animate-in fade-in-50 ${
                          isDarkMode
                            ? 'bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/10 border-amber-500/40 shadow-amber-500/5'
                            : 'bg-gradient-to-r from-amber-50 via-orange-50/60 to-amber-50/80 border-amber-300 shadow-amber-500/10'
                        }`}>
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center font-black shadow-xs shrink-0">
                              <Sparkles className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-black text-amber-700 dark:text-amber-300 flex items-center gap-1.5 font-mono">
                                <span className="tracking-wider">{appliedVoucher.ma_code}</span>
                                <span className="text-[10px] font-sans font-black px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-md shadow-2xs">
                                  {appliedVoucher.loai_giam === 'PHAN_TRAM' ? `-${appliedVoucher.gia_tri_giam}%` : `-${appliedVoucher.gia_tri_giam.toLocaleString('vi-VN')}đ`}
                                </span>
                              </div>
                              <p className={`text-[11px] mt-0.5 line-clamp-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700 font-semibold'}`}>
                                {appliedVoucher.tieu_de}
                              </p>
                            </div>
                          </div>
                          <span className="font-black font-mono text-orange-600 dark:text-orange-400 text-sm sm:text-base shrink-0">
                            -{tienGiamVoucherCart.toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                      )}

                      {/* Hiển thị lỗi hoặc gợi ý nếu chưa đạt */}
                      {voucherError && (
                        <div className="mt-2 p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-semibold animate-in fade-in-50">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{voucherError}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 5. CHI TIẾT THANH TOÁN (HÓA ĐƠN) */}
                  <div className={`p-4 rounded-2xl border space-y-2 text-xs ${
                    isDarkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-100/80 border-slate-300'
                  }`}>
                    <div className={`flex justify-between items-center ${isDarkMode ? 'text-slate-400' : 'text-slate-700 font-bold'}`}>
                      <span>Tiền sân ({cartCourts.length} sân):</span>
                      <span className={`font-mono font-black ${isDarkMode ? 'text-slate-200' : 'text-slate-950 text-sm'}`}>{tongTienSanCart.toLocaleString('vi-VN')} đ</span>
                    </div>
                    <div className={`flex justify-between items-center ${isDarkMode ? 'text-slate-400' : 'text-slate-700 font-bold'}`}>
                      <span>Tiền dịch vụ đi kèm:</span>
                      <span className={`font-mono font-black ${isDarkMode ? 'text-slate-200' : 'text-slate-950 text-sm'}`}>{tongTienDichVuCart.toLocaleString('vi-VN')} đ</span>
                    </div>
                    {tienGiamVoucherCart > 0 && (
                      <div className="flex justify-between items-center text-rose-500 font-black">
                        <span>Giảm giá Voucher:</span>
                        <span className="font-mono text-sm">-{tienGiamVoucherCart.toLocaleString('vi-VN')} đ</span>
                      </div>
                    )}
                    <div className={`pt-2 border-t flex justify-between items-center text-sm font-black ${
                      isDarkMode ? 'border-slate-800 text-white' : 'border-slate-300 text-slate-950'
                    }`}>
                      <span>Tổng giá trị đơn:</span>
                      <div className="flex items-center gap-1.5">
                        {tienGiamVoucherCart > 0 && (
                          <span className={`line-through text-xs font-mono font-normal ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            {tongTienDonCartGoc.toLocaleString('vi-VN')} đ
                          </span>
                        )}
                        <span className="font-mono text-blue-600 dark:text-emerald-400 text-base font-black">
                          {tongTienDonCart.toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {multiBookingStep === 'QR' && (
                /* Thân Modal: BƯỚC 3 - THANH TOÁN VIETQR PAYOS */
                <div className="space-y-6">
                  {isPaymentSuccess ? (
                    /* MÀN HÌNH CHÚC MỪNG KHI MB BANK XÁC NHẬN GIAO DỊCH THÀNH CÔNG (SPORT247 PASS) */
                    <div className="py-4 text-center space-y-5 animate-in zoom-in-95 duration-300 relative">
                      <button
                        type="button"
                        onClick={handleCloseSuccessModal}
                        className="absolute -top-2 right-0 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-700 shadow-lg"
                        title="Đóng cửa sổ ngay"
                      >
                        <X className="w-5 h-5" />
                      </button>

                      <div className="relative inline-block">
                        <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/40 flex items-center justify-center shadow-2xl shadow-emerald-500/40 animate-bounce ring-4 ring-emerald-500/20">
                          <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
                        </div>
                        <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-xs font-black shadow-md">
                          ✓
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                          <Sparkles className="w-3.5 h-3.5" />
                          Giao Dịch MB Bank Hoàn Tất Tự Động
                        </div>
                        <h3 className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                          🎉 ĐẶT SÂN THÀNH CÔNG!
                        </h3>
                        <p className="text-sm text-emerald-500 dark:text-emerald-400 font-bold">
                          Hệ thống đã nhận được {(payOSData?.amount || (bookingForm.loai_thanh_toan === 'DAT_COC' ? tienCocCart : tongTienDonCart)).toLocaleString('vi-VN')} đ từ tài khoản MB Bank.
                        </p>
                      </div>

                      {/* VÉ RA SÂN TRỰC TUYẾN (SPORT247 PASS) */}
                      <div className={`relative p-5 rounded-3xl border text-xs max-w-lg mx-auto space-y-3 text-left shadow-xl ${
                        isDarkMode
                          ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-emerald-500/40 text-slate-300 ring-1 ring-emerald-500/30'
                          : 'bg-white border-emerald-500/50 text-slate-700 ring-1 ring-emerald-500/20 shadow-emerald-500/10'
                      }`}>
                        {/* Header Vé */}
                        <div className="flex items-center justify-between pb-3 border-b border-dashed border-slate-700/60 dark:border-slate-800">
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500">SPORT247 VIP PASS</span>
                            <h4 className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Thẻ Ra Sân Trực Tuyến</h4>
                          </div>
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-sm">
                            ĐÃ THANH TOÁN
                          </span>
                        </div>

                        {/* Chi tiết đơn */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className={isDarkMode ? 'text-slate-400' : 'text-slate-700 font-bold'}>Mã đơn đặt:</span>
                            <p className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">#{payOSData?.ma_don_dat}</p>
                          </div>
                          <div>
                            <span className={isDarkMode ? 'text-slate-400' : 'text-slate-700 font-bold'}>Mã GD PayOS:</span>
                            <p className={`font-mono font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>#{payOSData?.orderCode}</p>
                          </div>
                        </div>

                        <div className={`pt-2 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                          <span className={isDarkMode ? 'text-slate-400' : 'text-slate-700 font-bold'}>Danh sách sân thi đấu ({cartCourts.length}):</span>
                          <div className="mt-1 space-y-1">
                            {cartCourts.map((c, i) => (
                              <div key={i} className={`p-2 rounded-xl flex items-center justify-between font-bold text-xs ${
                                isDarkMode ? 'bg-slate-900/80 text-white' : 'bg-slate-100 text-slate-900'
                              }`}>
                                <span>⚽ {c.san.ten_san}</span>
                                <span className="font-mono text-amber-500 dark:text-amber-400">{formatDateDMY(c.ngay_da)} • {c.slot.start} - {c.gioKetThuc}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className={`flex justify-between items-center pt-2 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                          <span className={isDarkMode ? 'text-slate-400' : 'text-slate-700 font-bold'}>Khách hàng:</span>
                          <span className={`font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                            {bookingForm.ho_ten || currentUser?.ho_ten || 'Khách hàng'} ({bookingForm.so_dien_thoai || currentUser?.so_dien_thoai || ''})
                          </span>
                        </div>

                        {appliedVoucher && (
                          <div className={`flex justify-between items-center pt-2 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                            <span className="text-emerald-500 font-bold flex items-center gap-1">
                              <Ticket className="w-3.5 h-3.5" />
                              <span>Mã ưu đãi ({appliedVoucher.ma_code}):</span>
                            </span>
                            <span className="font-mono font-bold text-rose-500">
                              -{tienGiamVoucherCart.toLocaleString('vi-VN')} đ
                            </span>
                          </div>
                        )}

                        <div className={`flex justify-between items-center pt-2 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                          <span className={isDarkMode ? 'text-slate-400' : 'text-slate-700 font-bold'}>Số tiền thanh toán:</span>
                          <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-lg">
                            {(payOSData?.amount || (bookingForm.loai_thanh_toan === 'DAT_COC' ? tienCocCart : tongTienDonCart)).toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                      </div>

                      {/* Đếm ngược và các nút hành động */}
                      <div className="space-y-3 max-w-lg mx-auto pt-2">
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
                            className={`w-1/2 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                              isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                            }`}
                          >
                            <History className="w-4 h-4 text-emerald-400" />
                            <span>Xem Lịch Sử</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleCloseSuccessModal}
                            className="w-1/2 py-3 rounded-2xl font-black text-xs sm:text-sm bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:from-emerald-400 hover:to-teal-300 shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                          >
                            <Check className="w-4 h-4" />
                            <span>Đóng Ngay (X)</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* MÀN HÌNH QUÉT MÃ VIETQR PAYOS */
                    <div className="space-y-4">
                      {/* Tiêu đề trên Mobile */}
                      <div className="md:hidden text-center">
                        <h3 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                          Quét Mã QR MB Bank Để Thanh Toán
                        </h3>
                      </div>

                      {/* Bố cục: Nằm ngang rộng trên Desktop (md:grid-cols-12), Dọc nguyên bản trên Mobile */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-6 items-start">
                        {/* CỘT TRÁI (Desktop md:col-span-5): Mã QR & Nút tải ảnh mã QR */}
                        <div className="md:col-span-5 flex flex-col items-center justify-center">
                          <div className={`w-full flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl border ${
                            isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                          }`}>
                            <div className="p-3.5 bg-white rounded-3xl border-2 border-emerald-500/40 shadow-2xl shadow-emerald-500/10 inline-block relative group">
                              <img
                                src={`https://img.vietqr.io/image/${payOSData?.bin || '970422'}-${payOSData?.accountNumber || 'VQRQAMKSW8778'}-compact2.png?amount=${payOSData?.amount || (bookingForm.loai_thanh_toan === 'DAT_COC' ? tienCocCart : tongTienDonCart)}&addInfo=${encodeURIComponent(payOSData?.description || 'DatSan')}&accountName=${encodeURIComponent(payOSData?.accountName || 'CAO VAN HOT XOAN')}`}
                                alt="Mã QR VietQR MB Bank"
                                className="w-52 h-52 sm:w-60 sm:h-60 object-contain rounded-xl"
                              />
                              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/50 whitespace-nowrap shadow-md">
                                MB Bank • CAO VAN HOT XOAN
                              </div>
                            </div>

                            {/* Nút tải ảnh mã QR */}
                            <button
                              type="button"
                              onClick={() => handleDownloadQRCode(
                                `https://img.vietqr.io/image/${payOSData?.bin || '970422'}-${payOSData?.accountNumber || 'VQRQAMKSW8778'}-compact2.png?amount=${payOSData?.amount || (bookingForm.loai_thanh_toan === 'DAT_COC' ? tienCocCart : tongTienDonCart)}&addInfo=${encodeURIComponent(payOSData?.description || 'DatSan')}&accountName=${encodeURIComponent(payOSData?.accountName || 'CAO VAN HOT XOAN')}`,
                                `Sport247_VietQR_${payOSData?.orderCode || 'MBBank'}.png`
                              )}
                              className={`w-full max-w-[260px] mt-4 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer active:scale-95 shadow-sm ${
                                isDarkMode
                                  ? 'bg-slate-900 hover:bg-slate-800 text-emerald-400 border-emerald-500/30 hover:border-emerald-500/60'
                                  : 'bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-emerald-400'
                              }`}
                              title="Tải ảnh mã QR về máy để chuyển khoản trên App"
                            >
                              <Download className="w-4 h-4 text-emerald-500 stroke-[2.5]" />
                              <span>Tải ảnh mã QR</span>
                            </button>
                          </div>
                        </div>

                        {/* CỘT PHẢI (Desktop md:col-span-7): Tiêu đề Desktop + Bảng thông tin CK + Ghi chú */}
                        <div className="md:col-span-7 space-y-3.5 sm:space-y-4">
                          {/* Tiêu đề trên Desktop */}
                          <div className="hidden md:block">
                            <h3 className={`text-xl sm:text-2xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                              Quét Mã QR MB Bank Để Thanh Toán
                            </h3>
                          </div>

                          {/* Bảng thông tin chi tiết chuyển khoản */}
                          <div className={`p-4 sm:p-5 rounded-2xl border space-y-2.5 text-xs sm:text-sm ${
                            isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
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
                                  {(payOSData?.amount || (bookingForm.loai_thanh_toan === 'DAT_COC' ? tienCocCart : tongTienDonCart)).toLocaleString('vi-VN')} đ
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyText(String(payOSData?.amount || (bookingForm.loai_thanh_toan === 'DAT_COC' ? tienCocCart : tongTienDonCart)), 'Số tiền')}
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

                          {/* Lưu ý quan trọng */}
                          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-500 dark:text-amber-400 flex items-start gap-2">
                            <Info className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>
                              <strong>Lưu ý:</strong> Vui lòng điền <strong>chính xác nội dung chuyển khoản</strong> để Sport247 tự động kích hoạt lịch sân của bạn ngay lập tức mà không cần xác nhận thủ công.
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Modal: BƯỚC 1 (GIỎ SÂN) */}
            {multiBookingStep === 'CART' && (
              <div className={`px-4 py-2.5 sm:px-6 sm:py-3 border-t flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0 ${
                isDarkMode ? 'bg-slate-950/90 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                {/* Cụm giá tiền */}
                <div className="flex items-center gap-3 sm:gap-4 flex-wrap text-left w-full sm:w-auto">
                  <div>
                    <span className={`text-[10px] sm:text-[11px] block ${isDarkMode ? 'text-slate-400' : 'text-slate-700 font-bold'}`}>
                      Tổng tiền {cartCourts.length} sân:
                    </span>
                    <strong className={`font-mono text-xs sm:text-sm font-black ${isDarkMode ? 'text-emerald-400' : 'text-slate-900'}`}>
                      {tongTienSanCart.toLocaleString('vi-VN')} đ
                    </strong>
                  </div>
                  <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
                  <div>
                    <span className={`text-[10px] sm:text-[11px] block ${isDarkMode ? 'text-slate-400' : 'text-slate-700 font-bold'}`}>
                      {bookingForm.loai_thanh_toan === 'DAT_COC' ? 'Cần cọc 30%:' : 'Thanh toán 100%:'}
                    </span>
                    <span className={`font-mono text-sm sm:text-base font-black ${isDarkMode ? 'text-emerald-400' : 'text-blue-700'}`}>
                      {(bookingForm.loai_thanh_toan === 'DAT_COC' ? Math.round(tongTienSanCart * 0.3) : tongTienSanCart).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </div>

                {/* Các nút hành động */}
                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMultiBookingModalOpen(false);
                      setMultiBookingStep('CART');
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      isDarkMode
                        ? 'border-slate-700 hover:bg-slate-800 text-slate-300'
                        : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 shadow-xs'
                    }`}
                  >
                    Chọn thêm sân
                  </button>
                  <button
                    type="button"
                    onClick={() => setMultiBookingStep('SERVICES')}
                    className="px-5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 shadow-md shadow-emerald-500/25 flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
                  >
                    <span>Tiếp tục</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            )}

            {/* Footer Modal: BƯỚC 2 (DỊCH VỤ ĐI KÈM) */}
            {multiBookingStep === 'SERVICES' && (
              <div className={`px-4 py-2.5 sm:px-6 sm:py-3 border-t flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0 ${
                isDarkMode ? 'bg-slate-950/90 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                {/* Cụm giá tiền */}
                <div className="flex items-center gap-3 sm:gap-4 flex-wrap text-left w-full sm:w-auto">
                  <div>
                    <span className={`text-[10px] sm:text-[11px] block ${isDarkMode ? 'text-slate-400' : 'text-slate-700 font-bold'}`}>
                      Tổng tiền sân + dịch vụ:
                    </span>
                    <strong className={`font-mono text-xs sm:text-sm font-black ${isDarkMode ? 'text-emerald-400' : 'text-slate-900'}`}>
                      {(tongTienSanCart + tongTienDichVuCart).toLocaleString('vi-VN')} đ
                    </strong>
                  </div>
                  <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
                  <div>
                    <span className={`text-[10px] sm:text-[11px] block ${isDarkMode ? 'text-slate-400' : 'text-slate-700 font-bold'}`}>
                      {bookingForm.loai_thanh_toan === 'DAT_COC' ? 'Cần cọc 30%:' : 'Thanh toán 100%:'}
                    </span>
                    <span className={`font-mono text-sm sm:text-base font-black ${isDarkMode ? 'text-emerald-400' : 'text-blue-700'}`}>
                      {(bookingForm.loai_thanh_toan === 'DAT_COC' ? Math.round((tongTienSanCart + tongTienDichVuCart) * 0.3) : (tongTienSanCart + tongTienDichVuCart)).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </div>

                {/* Các nút hành động */}
                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                  <button
                    type="button"
                    onClick={() => setMultiBookingStep('CART')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      isDarkMode
                        ? 'border-slate-700 hover:bg-slate-800 text-slate-300'
                        : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 shadow-xs'
                    }`}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Quay lại</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMultiBookingStep('CONFIRM')}
                    className="px-5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 shadow-md shadow-emerald-500/25 flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
                  >
                    <span>Tiếp tục</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            )}

            {/* Footer Modal: BƯỚC 3 (XÁC NHẬN ĐƠN ĐẶT & VOUCHER) */}
            {multiBookingStep === 'CONFIRM' && (
              <div className={`px-4 py-2.5 sm:px-6 sm:py-3 border-t flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0 ${
                isDarkMode ? 'bg-slate-950/90 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                {/* Cụm giá tiền */}
                <div className="flex items-center gap-3 sm:gap-4 flex-wrap text-left w-full sm:w-auto">
                  <div>
                    <span className={`text-[10px] sm:text-[11px] block ${isDarkMode ? 'text-slate-400' : 'text-slate-700 font-bold'}`}>
                      Tổng đơn ({cartCourts.length} sân{tongTienDichVuCart > 0 ? ' + DV' : ''}):
                    </span>
                    <div className="flex items-center gap-1.5">
                      {tienGiamVoucherCart > 0 && (
                        <span className={`line-through text-[11px] font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {tongTienDonCartGoc.toLocaleString('vi-VN')} đ
                        </span>
                      )}
                      <strong className={`font-mono text-xs sm:text-sm font-black ${isDarkMode ? 'text-emerald-400' : 'text-slate-900'}`}>
                        {tongTienDonCart.toLocaleString('vi-VN')} đ
                      </strong>
                    </div>
                  </div>
                  {tienGiamVoucherCart > 0 && (
                    <>
                      <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
                      <div>
                        <span className="text-[10px] sm:text-[11px] block text-rose-500 font-bold">
                          Tiết kiệm:
                        </span>
                        <strong className="font-mono text-rose-500 text-xs sm:text-sm font-black">
                          -{tienGiamVoucherCart.toLocaleString('vi-VN')} đ
                        </strong>
                      </div>
                    </>
                  )}
                  <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
                  <div>
                    <span className={`text-[10px] sm:text-[11px] block ${isDarkMode ? 'text-slate-400' : 'text-slate-700 font-bold'}`}>
                      Cần thanh toán ngay:
                    </span>
                    <span className={`font-mono text-sm sm:text-base font-black ${isDarkMode ? 'text-emerald-400' : 'text-blue-700'}`}>
                      {(bookingForm.loai_thanh_toan === 'DAT_COC' ? tienCocCart : tongTienDonCart).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </div>

                {/* Các nút hành động */}
                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                  <button
                    type="button"
                    onClick={() => setMultiBookingStep('SERVICES')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      isDarkMode
                        ? 'border-slate-700 hover:bg-slate-800 text-slate-300'
                        : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 shadow-xs'
                    }`}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Quay lại</span>
                  </button>
                  <button
                    type="button"
                    disabled={isCreatingPayOS}
                    onClick={handleCreateMultiPayOSPayment}
                    className="px-5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 shadow-md shadow-emerald-500/25 flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isCreatingPayOS ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Đang tạo mã VietQR...</span>
                      </>
                    ) : (
                      <>
                        <span>Thanh Toán</span>
                        <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Footer Modal: BƯỚC 4 (THANH TOÁN VIETQR) */}
            {multiBookingStep === 'QR' && !isPaymentSuccess && (
              <div className={`p-4 sm:p-5 border-t flex flex-col sm:flex-row items-center gap-3 ${
                isDarkMode ? 'bg-slate-950/90 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
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
                    setMultiBookingStep('CONFIRM');
                  }}
                  className={`w-full sm:w-1/3 py-3 rounded-xl font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                    isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
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
                  className="w-full sm:w-2/3 py-3 rounded-2xl font-black text-xs sm:text-sm bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 text-slate-950 hover:from-emerald-400 hover:to-teal-300 shadow-xl shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95"
                >
                  {isCheckingPayOS ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang Kiểm Tra MB Bank...</span>
                    </>
                  ) : (
                    <span>Tôi đã chuyển khoản</span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          6. MODAL ĐẶT SÂN TƯƠNG TÁC (GIAO TIẾP VỚI CSDL SQL SERVER)
          ===================================================================== */}
      {selectedSlot && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className={`relative w-full ${bookingStep === 'QR' ? 'max-w-lg md:max-w-4xl lg:max-w-5xl' : 'max-w-2xl'} border rounded-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200 ${isDarkMode ? 'bg-slate-900 border-emerald-700/50' : 'bg-white border-emerald-300'
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

                  {/* Thẻ Voucher tại Bước 2 nếu có hoặc cho phép đổi/chọn */}
                  <div className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
                    appliedVoucher
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-emerald-500 shrink-0" />
                      {appliedVoucher ? (
                        <div>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                            {appliedVoucher.ma_code} (-{tienGiamVoucherCart.toLocaleString('vi-VN')} đ)
                          </span>
                          <span className={`text-[11px] block ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            {appliedVoucher.tieu_de}
                          </span>
                        </div>
                      ) : (
                        <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                          Chưa áp dụng mã ưu đãi
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsVoucherModalOpen(true)}
                      className="px-2.5 py-1 rounded-lg text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 hover:bg-emerald-500/25 transition-all flex items-center gap-1 cursor-pointer border border-emerald-500/30"
                    >
                      <span>{appliedVoucher ? 'Đổi mã' : '🎫 Chọn Voucher'}</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
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
                        <div className={`text-xs font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                          <input
                            type="radio"
                            name="loai_thanh_toan"
                            value="DAT_COC"
                            checked={bookingForm.loai_thanh_toan === 'DAT_COC'}
                            onChange={() => setBookingForm({ ...bookingForm, loai_thanh_toan: 'DAT_COC' })}
                            className="text-emerald-500 focus:ring-emerald-500"
                          />
                          <span>Đặt Cọc 30%</span>
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
                        <div className={`text-xs font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                          <input
                            type="radio"
                            name="loai_thanh_toan"
                            value="TRA_HET"
                            checked={bookingForm.loai_thanh_toan === 'TRA_HET'}
                            onChange={() => setBookingForm({ ...bookingForm, loai_thanh_toan: 'TRA_HET' })}
                            className="text-emerald-500 focus:ring-emerald-500"
                          />
                          <span>Thanh Toán 100%</span>
                        </div>
                        <p className={`text-[11px] mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>Vào sân thi đấu ngay không cần trả thêm</p>
                      </div>
                      <span className="text-sm font-black text-emerald-600 dark:text-emerald-500">
                        {tongTienDon.toLocaleString('vi-VN')} đ
                      </span>
                    </label>
                  </div>
                </div>

                {/* KHỐI MÃ GIẢM GIÁ & VOUCHER ƯU ĐÃI (UX CHUẨN SHOPEE / GRAB) */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  isDarkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-gradient-to-r from-emerald-50/60 to-teal-50/40 border-emerald-200/80 shadow-sm'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold">
                        <Ticket className="w-4 h-4" />
                      </div>
                      <span className={`text-xs font-black uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        Mã Ưu Đãi / Voucher
                      </span>
                    </div>

                    {/* Nút Xem tất cả mã ưu đãi (Kho Voucher) */}
                    <button
                      type="button"
                      onClick={() => setIsVoucherModalOpen(true)}
                      className="px-2.5 py-1 rounded-lg text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all flex items-center gap-1 cursor-pointer border border-emerald-500/30 shadow-sm"
                    >
                      <span>🎫 Chọn Voucher</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Ô nhập mã và nút Áp dụng */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Tag className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                      <input
                        type="text"
                        value={voucherInput}
                        onChange={(e) => {
                          setVoucherInput(e.target.value.toUpperCase());
                          if (voucherError) setVoucherError(null);
                        }}
                        placeholder="Nhập mã ưu đãi (VD: SOCCER247NEW)..."
                        className={`w-full pl-8 pr-3 py-2 text-xs font-mono font-bold uppercase rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                          isDarkMode 
                            ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500' 
                            : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                        }`}
                      />
                    </div>
                    {appliedVoucher ? (
                      <button
                        type="button"
                        onClick={handleRemoveVoucher}
                        className="px-3 py-2 text-xs font-bold text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl transition-all cursor-pointer border border-rose-500/30 flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Gỡ mã</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleApplyVoucherInput}
                        disabled={!voucherInput.trim() || isValidatingVoucher}
                        className="px-4 py-2 text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-emerald-500/20 flex items-center gap-1"
                      >
                        {isValidatingVoucher ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Áp dụng</span>}
                      </button>
                    )}
                  </div>

                  {/* Hiển thị mã đang áp dụng */}
                  {appliedVoucher && (
                    <div className={`mt-2.5 p-2.5 rounded-2xl border flex items-center justify-between text-xs transition-all shadow-sm animate-in fade-in-50 ${
                      isDarkMode
                        ? 'bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/10 border-amber-500/40 shadow-amber-500/5'
                        : 'bg-gradient-to-r from-amber-50 via-orange-50/60 to-amber-50/80 border-amber-300 shadow-amber-500/10'
                    }`}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center font-black shadow-xs shrink-0">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-black text-amber-700 dark:text-amber-300 flex items-center gap-1.5 font-mono">
                            <span className="tracking-wider">{appliedVoucher.ma_code}</span>
                            <span className="text-[10px] font-sans font-black px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-md shadow-2xs">
                              {appliedVoucher.loai_giam === 'PHAN_TRAM' ? `-${appliedVoucher.gia_tri_giam}%` : `-${appliedVoucher.gia_tri_giam.toLocaleString('vi-VN')}đ`}
                            </span>
                          </div>
                          <p className={`text-[11px] mt-0.5 line-clamp-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700 font-semibold'}`}>
                            {appliedVoucher.tieu_de}
                          </p>
                        </div>
                      </div>
                      <span className="font-black font-mono text-orange-600 dark:text-orange-400 text-sm sm:text-base shrink-0">
                        -{tienGiamVoucher.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  )}

                  {/* Hiển thị lỗi hoặc gợi ý nếu chưa đạt */}
                  {voucherError && (
                    <div className="mt-2 p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-semibold animate-in fade-in-50">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{voucherError}</span>
                    </div>
                  )}
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
                  {tienGiamVoucher > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                      <span className="flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5" />
                        Giảm giá ưu đãi ({appliedVoucher?.ma_code}):
                      </span>
                      <span className="font-mono font-black">-{tienGiamVoucher.toLocaleString('vi-VN')} đ</span>
                    </div>
                  )}
                  <div className={`flex justify-between pt-2 border-t text-sm font-bold ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                    <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>Tổng giá trị đơn:</span>
                    <div className="text-right">
                      {tienGiamVoucher > 0 && (
                        <span className="line-through text-xs text-slate-400 font-mono mr-2">
                          {tongTienDonGoc.toLocaleString('vi-VN')} đ
                        </span>
                      )}
                      <span className="text-emerald-600 dark:text-emerald-500 text-base">{tongTienDon.toLocaleString('vi-VN')} đ</span>
                    </div>
                  </div>
                </div>

                {/* Nút bấm chuyển bước */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                    setSelectedSlot(null);
                    setIsMultiBookingModalOpen(true);
                    setMultiBookingStep('CART');
                  }}
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
                  /* MÀN HÌNH CHÚC MỪNG KHI MB BANK XÁC NHẬN GIAO DỊCH THÀNH CÔNG (SPORT247 PASS) */
                  <div className="py-4 text-center space-y-5 animate-in zoom-in-95 duration-300 relative">
                    {/* Nút X ở góc trên bên phải màn hình thành công */}
                    <button
                      type="button"
                      onClick={handleCloseSuccessModal}
                      className="absolute -top-2 right-0 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-700 shadow-lg"
                      title="Đóng cửa sổ ngay"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <div className="relative inline-block">
                      <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/40 flex items-center justify-center shadow-2xl shadow-emerald-500/40 animate-bounce ring-4 ring-emerald-500/20">
                        <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
                      </div>
                      <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-xs font-black shadow-md">
                        ✓
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                        <Sparkles className="w-3.5 h-3.5" />
                        Giao Dịch MB Bank Hoàn Tất Tự Động
                      </div>
                      <h3 className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        🎉 ĐẶT SÂN THÀNH CÔNG!
                      </h3>
                      <p className="text-sm text-emerald-500 dark:text-emerald-400 font-bold">
                        Hệ thống đã nhận được {soTienThanhToan.toLocaleString('vi-VN')} đ từ tài khoản MB Bank.
                      </p>
                    </div>

                    {/* VÉ RA SÂN TRỰC TUYẾN (SPORT247 PASS) */}
                    <div className={`relative p-5 rounded-3xl border text-xs max-w-lg mx-auto space-y-3 text-left shadow-xl ${
                      isDarkMode
                        ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-emerald-500/40 text-slate-300 ring-1 ring-emerald-500/30'
                        : 'bg-white border-emerald-500/50 text-slate-700 ring-1 ring-emerald-500/20 shadow-emerald-500/10'
                    }`}>
                      {/* Header Vé */}
                      <div className="flex items-center justify-between pb-3 border-b border-dashed border-slate-700/60 dark:border-slate-800">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500">SPORT247 VIP PASS</span>
                          <h4 className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Thẻ Ra Sân Trực Tuyến</h4>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-sm">
                          ĐÃ THANH TOÁN
                        </span>
                      </div>

                      {/* Chi tiết đơn */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Mã đơn đặt sân:</span>
                          <p className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">#{payOSData?.ma_don_dat || selectedSlot?.san.id}</p>
                        </div>
                        <div>
                          <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Mã GD PayOS:</span>
                          <p className={`font-mono font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>#{payOSData?.orderCode}</p>
                        </div>
                      </div>

                      <div className={`pt-2 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                        <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Sân bóng & Khung giờ:</span>
                        <div className={`mt-1 p-2 rounded-xl flex items-center justify-between font-bold text-xs ${
                          isDarkMode ? 'bg-slate-900/80 text-white' : 'bg-slate-100 text-slate-900'
                        }`}>
                          <span>⚽ {selectedSlot?.san.ten_san}</span>
                          <span className="font-mono text-amber-500 dark:text-amber-400">{formatDateDMY(filterNgayDa)} • {selectedSlot?.slot.start} - {selectedSlot?.gioKetThuc}</span>
                        </div>
                      </div>

                      <div className={`flex justify-between items-center pt-2 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                        <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Khách hàng:</span>
                        <span className={`font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                          {bookingForm.ho_ten || currentUser?.ho_ten || 'Khách hàng'} ({bookingForm.so_dien_thoai || currentUser?.so_dien_thoai || ''})
                        </span>
                      </div>

                      {appliedVoucher && (
                        <div className={`flex justify-between items-center pt-2 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                          <span className="text-emerald-500 font-bold flex items-center gap-1">
                            <Tag className="w-3.5 h-3.5" />
                            Ưu đãi giảm giá ({appliedVoucher.ma_code}):
                          </span>
                          <span className="font-mono font-bold text-emerald-500">
                            -{tienGiamVoucher.toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                      )}

                      <div className={`flex justify-between items-center pt-2 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                        <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500 font-bold'}>Số tiền thanh toán:</span>
                        <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-lg">
                          {soTienThanhToan.toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                    </div>

                    {/* Đếm ngược và các nút hành động */}
                    <div className="space-y-3 max-w-lg mx-auto pt-2">
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
                          className={`w-1/2 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                          }`}
                        >
                          <History className="w-4 h-4 text-emerald-400" />
                          <span>Xem Lịch Sử</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleCloseSuccessModal}
                          className="w-1/2 py-3 rounded-2xl font-black text-xs sm:text-sm bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:from-emerald-400 hover:to-teal-300 shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                        >
                          <Check className="w-4 h-4" />
                          <span>Đóng Ngay (X)</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* MÀN HÌNH QUÉT MÃ VIETQR & THÔNG TIN CHUYỂN KHOẢN MB BANK */
                  <div className="space-y-4">
                    {/* Tiêu đề trên Mobile */}
                    <div className="md:hidden text-center">
                      <h3 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        Quét Mã QR MB Bank Để Thanh Toán
                      </h3>
                    </div>

                    {/* Bố cục: Nằm ngang rộng trên Desktop (md:grid-cols-12), Dọc nguyên bản trên Mobile */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-6 items-start">
                      {/* CỘT TRÁI (Desktop md:col-span-5): Khung ảnh QR & Nút tải ảnh mã QR */}
                      <div className="md:col-span-5 flex flex-col items-center justify-center">
                        <div className={`w-full flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl border ${
                          isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <div className="p-3.5 bg-white rounded-3xl border-2 border-emerald-500/40 shadow-2xl shadow-emerald-500/10 inline-block relative group">
                            <img
                              src={`https://img.vietqr.io/image/${payOSData?.bin || '970422'}-${payOSData?.accountNumber || 'VQRQAMKSW8778'}-compact2.png?amount=${payOSData?.amount || soTienThanhToan}&addInfo=${encodeURIComponent(payOSData?.description || 'DatSan')}&accountName=${encodeURIComponent(payOSData?.accountName || 'CAO VAN HOT XOAN')}`}
                              alt="Mã QR VietQR MB Bank"
                              className="w-52 h-52 sm:w-60 sm:h-60 object-contain rounded-xl"
                            />
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/50 whitespace-nowrap shadow-md">
                              MB Bank • CAO VAN HOT XOAN
                            </div>
                          </div>

                          {/* Nút tải ảnh mã QR */}
                          <button
                            type="button"
                            onClick={() => handleDownloadQRCode(
                              `https://img.vietqr.io/image/${payOSData?.bin || '970422'}-${payOSData?.accountNumber || 'VQRQAMKSW8778'}-compact2.png?amount=${payOSData?.amount || soTienThanhToan}&addInfo=${encodeURIComponent(payOSData?.description || 'DatSan')}&accountName=${encodeURIComponent(payOSData?.accountName || 'CAO VAN HOT XOAN')}`,
                              `Sport247_VietQR_${payOSData?.orderCode || 'MBBank'}.png`
                            )}
                            className={`w-full max-w-[260px] mt-4 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer active:scale-95 shadow-sm ${
                              isDarkMode
                                ? 'bg-slate-900 hover:bg-slate-800 text-emerald-400 border-emerald-500/30 hover:border-emerald-500/60'
                                : 'bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-emerald-400'
                            }`}
                            title="Tải ảnh mã QR về máy để chuyển khoản trên App"
                          >
                            <Download className="w-4 h-4 text-emerald-500 stroke-[2.5]" />
                            <span>Tải ảnh mã QR</span>
                          </button>
                        </div>
                      </div>

                      {/* CỘT PHẢI (Desktop md:col-span-7): Tiêu đề Desktop + Bảng thông tin CK + Ghi chú */}
                      <div className="md:col-span-7 space-y-3.5 sm:space-y-4">
                        {/* Tiêu đề trên Desktop */}
                        <div className="hidden md:block">
                          <h3 className={`text-xl sm:text-2xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            Quét Mã QR MB Bank Để Thanh Toán
                          </h3>
                        </div>

                        {/* Bảng thông tin chi tiết chuyển khoản */}
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

                        {/* Lưu ý quan trọng */}
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-500 dark:text-amber-400 flex items-start gap-2">
                          <Info className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>
                            <strong>Lưu ý:</strong> Vui lòng điền <strong>chính xác nội dung chuyển khoản</strong> để Sport247 tự động kích hoạt lịch sân của bạn ngay lập tức mà không cần xác nhận thủ công.
                          </span>
                        </div>
                      </div>
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
                            setSelectedSlot(null);
                            setIsMultiBookingModalOpen(true);
                            setMultiBookingStep('SERVICES');
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
                          className="w-2/3 py-3.5 rounded-2xl font-black text-xs sm:text-sm bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 text-slate-950 hover:from-emerald-400 hover:to-teal-300 shadow-xl shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95"
                        >
                          {isCheckingPayOS ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Đang Kiểm Tra MB Bank...</span>
                            </>
                          ) : (
                            <span>Tôi đã chuyển khoản</span>
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
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-hidden">
          <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <Profile
              onClose={() => {
                setIsProfileModalOpen(false);
                syncCurrentUser();
              }}
              onUpdateUser={(updated) => {
                const normalized: AuthUser = {
                  ...updated,
                  ho_ten: updated.ho_ten || updated.hoTen || '',
                  email: updated.email || '',
                  so_dien_thoai: updated.so_dien_thoai || updated.soDienThoai || '',
                  dia_chi: updated.dia_chi || updated.diaChi || ''
                };
                setCurrentUser(normalized);
              }}
              onLogout={handleLogout}
              initialData={{
                hoTen: currentUser?.ho_ten || '',
                email: currentUser?.email || '',
                soDienThoai: currentUser?.so_dien_thoai || '',
                diaChi: currentUser?.dia_chi || currentUser?.diaChi || '',
                avatarUrl: currentUser?.anh_dai_dien,
              }}
            />
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN ĐĂNG XUẤT */}
      {isLogoutConfirmOpen && (
        <div
          className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsLogoutConfirmOpen(false)}
        >
          <div
            className={`relative w-full max-w-sm rounded-3xl border p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200 ${
              isDarkMode ? 'bg-slate-900 border-slate-700/80 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ICON ĐĂNG XUẤT */}
            <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <LogOut className="w-8 h-8 stroke-[2.2]" />
            </div>

            <div className="space-y-1.5">
              <h3 className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Xác nhận đăng xuất
              </h3>
              <p className={`text-xs ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Bạn có chắc chắn muốn đăng xuất khỏi tài khoản{' '}
                <strong className="text-emerald-500">{currentUser?.ho_ten || 'này'}</strong> không?
              </p>
            </div>

            <div className="pt-2 flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsLogoutConfirmOpen(false)}
                className={`flex-1 py-2.5 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
                  isDarkMode
                    ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300'
                    : 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs shadow-lg shadow-rose-600/30 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHI TIẾT SÂN & ĐÁNH GIÁ, BÌNH LUẬN CÓ PHẢN HỒI */}
      <CourtDetailModal
        isOpen={isCourtDetailModalOpen}
        sanId={selectedCourtDetailId}
        onClose={() => {
          setIsCourtDetailModalOpen(false);
          setSelectedCourtDetailId(null);
        }}
        isDarkMode={isDarkMode}
        onBookNow={(court, targetDate, targetSlot) => {
          setIsCourtDetailModalOpen(false);
          const targetCourtId = court.ma_san || court.id;
          setFilterSanId(String(targetCourtId));
          setCalendarSelectedCourtId(targetCourtId);
          if (targetDate) {
            setFilterNgayDa(targetDate);
          }
          if (!selectedCategory) {
            const foundLoai = loaiSanList.find(
              (l) => l.id === (court.ma_loai_san || court.maLoaiSan)
            );
            if (foundLoai) {
              handleSelectCategory(foundLoai);
            }
          }
          if (targetSlot) {
            triggerToast({
              type: 'success',
              message: `⚡ Đã chuyển sang ngày ${formatDateDMY(targetDate || '')} cho ${court.ten_san}. Ca ${targetSlot.gio_bat_dau?.substring(0, 5)} - ${targetSlot.gio_ket_thuc?.substring(0, 5)} đã sẵn sàng trên lịch!`,
            });
          }
        }}
      />

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

      {/* =====================================================================
          MODAL KHO VOUCHER & MÃ ƯU ĐÃI (UX/UI CHUẨN SHOPEE / GRAB / TRAVELOKA)
          - Thiết kế cuống vé coupon chuẩn với vết khuyết 2 bên và đường xé nét đứt
          - Thanh tiến trình điều kiện thông minh (Smart Progress Bar)
          - Phân cấp thị giác: Mã dùng được nổi bật ánh kim, mã khóa mờ nhẹ
          - Thanh nhập mã & Header hiện đại với đếm số mã khả dụng
          - Hiệu ứng tương tác mượt mà (Micro-interactions)
      ===================================================================== */}
      {isVoucherModalOpen && (
        <div className="fixed inset-0 z-[1000000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in-50 duration-200">
          <div
            className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 ${
              isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Modal Header */}
            <div className={`px-6 py-4 border-b flex items-center justify-between ${
              isDarkMode ? 'bg-slate-950/90 border-slate-800' : 'bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent border-slate-100'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-400 text-white flex items-center justify-center font-black shadow-lg shadow-orange-500/25 shrink-0">
                  <Ticket className="w-6 h-6 drop-shadow-sm" />
                </div>
                <div>
                  <h3 className={`text-base font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Kho Ưu Đãi & Voucher
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5">
                    <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Chọn mã ưu đãi tốt nhất cho bạn
                    </p>
                    {voucherList.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        {voucherList.filter((v) => getVoucherStatus(v).eligible).length} mã dùng được
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsVoucherModalOpen(false)}
                className={`p-2 rounded-full transition-colors cursor-pointer ${
                  isDarkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Voucher Quick Search / Input Bar */}
            <div className={`p-4 border-b ${isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Tag className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                    voucherInput.trim() ? 'text-amber-500' : isDarkMode ? 'text-slate-500' : 'text-slate-400'
                  }`} />
                  <input
                    type="text"
                    value={voucherInput}
                    onChange={(e) => {
                      setVoucherInput(e.target.value.toUpperCase());
                      if (voucherError) setVoucherError(null);
                    }}
                    placeholder="Nhập mã ưu đãi (VD: SOCCER247NEW)..."
                    className={`w-full pl-10 pr-3 py-2.5 text-xs font-mono font-bold uppercase rounded-2xl border transition-all ${
                      isDarkMode 
                        ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20' 
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                    }`}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyVoucherInput}
                  disabled={!voucherInput.trim() || isValidatingVoucher}
                  className={`px-4 py-2.5 text-xs font-black rounded-2xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    voucherInput.trim()
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-md shadow-orange-500/25 active:scale-95'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 opacity-60 cursor-not-allowed'
                  }`}
                >
                  {isValidatingVoucher ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Áp dụng</span>}
                </button>
              </div>

              {voucherError && (
                <div className="mt-2.5 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-500 flex items-center gap-1.5 font-medium animate-in fade-in-50">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{voucherError}</span>
                </div>
              )}
            </div>

            {/* Voucher List Body */}
            <div className={`p-4 space-y-3.5 overflow-y-auto flex-1 max-h-[58vh] ${
              isDarkMode ? 'bg-slate-950/40' : 'bg-slate-100/60'
            }`}>
              {voucherList.length === 0 ? (
                <div className="py-12 text-center text-slate-500 space-y-2">
                  <Ticket className="w-10 h-10 mx-auto opacity-40 animate-pulse text-amber-500" />
                  <p className="text-xs">Hiện tại chưa có mã ưu đãi nào khả dụng.</p>
                </div>
              ) : (
                (() => {
                  const sortedVouchers = [...voucherList]
                    .map((v) => ({
                      voucher: v,
                      status: getVoucherStatus(v),
                      isCurrentApplied: appliedVoucher?.ma_code === v.ma_code,
                    }))
                    .sort((a, b) => {
                      if (a.isCurrentApplied && !b.isCurrentApplied) return -1;
                      if (!a.isCurrentApplied && b.isCurrentApplied) return 1;
                      if (a.status.eligible && !b.status.eligible) return -1;
                      if (!a.status.eligible && b.status.eligible) return 1;
                      if (a.status.eligible && b.status.eligible) {
                        return b.status.calculatedDiscount - a.status.calculatedDiscount;
                      }
                      return 0;
                    });

                  return sortedVouchers.map(({ voucher: v, status, isCurrentApplied }, index) => {
                    // Hiển thị dải phân cách giữa nhóm mã dùng được và nhóm chưa đủ điều kiện
                    const showIneligibleDivider =
                      !status.eligible &&
                      index > 0 &&
                      sortedVouchers[index - 1].status.eligible;

                    return (
                      <React.Fragment key={v.id || v.ma_code}>
                        {showIneligibleDivider && (
                          <div className="py-2 flex items-center gap-3">
                            <div className={`h-px flex-1 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-300'}`} />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                              <Lock className="w-3 h-3 text-slate-400" />
                              Ưu đãi khác chưa đủ điều kiện
                            </span>
                            <div className={`h-px flex-1 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-300'}`} />
                          </div>
                        )}

                        <div
                          className={`relative rounded-2xl border transition-all duration-300 flex flex-row items-stretch overflow-hidden group ${
                            isCurrentApplied
                              ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-500/5 shadow-lg shadow-emerald-500/10'
                              : status.eligible
                              ? isDarkMode
                                ? 'border-amber-500/40 hover:border-amber-500 bg-slate-900 shadow-md hover:shadow-xl hover:-translate-y-0.5'
                                : 'border-amber-300 hover:border-amber-400 bg-white shadow-md hover:shadow-xl hover:-translate-y-0.5'
                              : isDarkMode
                              ? 'border-slate-800/80 bg-slate-950/60 opacity-75 hover:opacity-95'
                              : 'border-slate-200 bg-white/70 opacity-80 hover:opacity-100'
                          }`}
                        >
                          {/* Lỗ khuyết vé bán nguyệt ở trên và dưới đường nét đứt */}
                          <div
                            className="absolute -top-2.5 left-24 sm:left-28 -translate-x-1/2 w-5 h-5 rounded-full z-20 pointer-events-none"
                            style={{
                              backgroundColor: isDarkMode ? '#030712' : '#f1f5f9',
                              borderBottom: `1.5px solid ${status.eligible ? '#f59e0b' : isDarkMode ? '#334155' : '#cbd5e1'}`,
                            }}
                          />
                          <div
                            className="absolute -bottom-2.5 left-24 sm:left-28 -translate-x-1/2 w-5 h-5 rounded-full z-20 pointer-events-none"
                            style={{
                              backgroundColor: isDarkMode ? '#030712' : '#f1f5f9',
                              borderTop: `1.5px solid ${status.eligible ? '#f59e0b' : isDarkMode ? '#334155' : '#cbd5e1'}`,
                            }}
                          />

                          {/* Huy hiệu ĐANG CHỌN */}
                          {isCurrentApplied && (
                            <div className="absolute top-0 right-0 bg-gradient-to-l from-emerald-500 to-teal-500 text-slate-950 font-black text-[9px] px-2.5 py-0.5 rounded-bl-xl shadow-sm uppercase tracking-wider flex items-center gap-1 z-10">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                              <span>Đang chọn</span>
                            </div>
                          )}

                          {/* CỘT TRÁI: CUỐNG VÉ (TICKET STUB) */}
                          <div
                            className={`w-24 sm:w-28 shrink-0 flex flex-col items-center justify-center text-center p-2.5 relative select-none border-r border-dashed ${
                              status.eligible
                                ? 'bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white border-amber-300/40 shadow-inner'
                                : isDarkMode
                                ? 'bg-gradient-to-b from-slate-800 to-slate-900 text-slate-400 border-slate-700'
                                : 'bg-gradient-to-b from-slate-200 to-slate-300 text-slate-600 border-slate-300'
                            }`}
                          >
                            <Ticket className="w-12 h-12 absolute -bottom-2 -right-2 opacity-10 pointer-events-none rotate-12" />

                            <div className="relative z-10">
                              <div className={`text-xl sm:text-2xl font-black font-mono leading-none tracking-tight ${
                                status.eligible ? 'text-white drop-shadow-sm' : ''
                              }`}>
                                {v.loai_giam === 'PHAN_TRAM' ? `${v.gia_tri_giam}%` : `${Math.round(v.gia_tri_giam / 1000)}K`}
                              </div>
                              <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider block mt-1 ${
                                status.eligible ? 'text-amber-100' : 'text-slate-500 dark:text-slate-400'
                              }`}>
                                GIẢM {v.loai_giam === 'PHAN_TRAM' ? 'TỔNG' : 'TIỀN'}
                              </span>
                            </div>
                          </div>

                          {/* CỘT PHẢI: THÂN VÉ (TICKET BODY) */}
                          <div className="p-3 sm:p-3.5 flex-1 min-w-0 flex flex-col justify-between space-y-2">
                            <div>
                              {/* Hàng code và nhãn */}
                              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-black font-mono uppercase tracking-wider ${
                                  status.eligible
                                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                                }`}>
                                  {v.ma_code}
                                </span>
                                {v.chi_danh_cho_khach_moi && (
                                  <span className="px-1.5 py-0.2 rounded-md text-[9px] sm:text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                                    ⭐ Bạn Mới
                                  </span>
                                )}
                                {v.thu_trong_tuan && (
                                  <span className="px-1.5 py-0.2 rounded-md text-[9px] sm:text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                                    📅 T2 - T6
                                  </span>
                                )}
                              </div>

                              <h4 className={`text-xs sm:text-sm font-black truncate ${
                                isDarkMode ? 'text-white' : 'text-slate-900'
                              }`}>
                                {v.tieu_de}
                              </h4>

                              <p className={`text-[11px] line-clamp-2 leading-relaxed mt-0.5 ${
                                isDarkMode ? 'text-slate-400' : 'text-slate-600 font-medium'
                              }`}>
                                {v.mo_ta}
                              </p>

                              {/* Điều kiện thông minh & Thanh tiến trình */}
                              {!status.eligible && (
                                <div className="pt-1.5">
                                  {status.conditionType === 'MIN_ORDER' ? (
                                    <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
                                      <div className="flex items-center justify-between text-[10px] font-bold">
                                        <span className="text-amber-700 dark:text-amber-300 flex items-center gap-1">
                                          <Zap className="w-3 h-3 text-amber-500 shrink-0" />
                                          <span>Tiến trình đơn:</span>
                                        </span>
                                        <span className="font-mono text-amber-800 dark:text-amber-200">
                                          {status.currentTotal.toLocaleString('vi-VN')}đ / {v.don_toi_thieu.toLocaleString('vi-VN')}đ ({status.progressPercent}%)
                                        </span>
                                      </div>
                                      <div className="w-full bg-slate-200 dark:bg-slate-700/60 h-1.5 rounded-full overflow-hidden">
                                        <div
                                          className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-500"
                                          style={{ width: `${status.progressPercent}%` }}
                                        />
                                      </div>
                                      <p className="text-[10px] font-medium text-amber-700 dark:text-amber-300 flex items-center gap-1">
                                        <span>💡</span>
                                        <span>Đặt thêm <strong>{status.shortage.toLocaleString('vi-VN')} đ</strong> để mở khóa mã này!</span>
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                                      <AlertCircle className="w-3 h-3 shrink-0 text-amber-500" />
                                      <span>{status.reason}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Hàng nút bấm & số tiền tiết kiệm */}
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                              <div>
                                {status.eligible ? (
                                  <div className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono">
                                    <Sparkles className="w-3 h-3 shrink-0" />
                                    <span>Tiết kiệm: {status.calculatedDiscount.toLocaleString('vi-VN')} đ</span>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                    {v.don_toi_thieu ? `Đơn tối thiểu: ${v.don_toi_thieu.toLocaleString('vi-VN')}đ` : 'Ưu đãi có điều kiện'}
                                  </span>
                                )}
                              </div>

                              <div>
                                {isCurrentApplied ? (
                                  <button
                                    type="button"
                                    onClick={handleRemoveVoucher}
                                    className="px-3.5 py-1.5 rounded-full text-xs font-black bg-rose-500/15 hover:bg-rose-500/25 text-rose-500 border border-rose-500/30 transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                                  >
                                    <X className="w-3 h-3 stroke-[2.5]" />
                                    <span>Bỏ chọn</span>
                                  </button>
                                ) : status.eligible ? (
                                  <button
                                    type="button"
                                    onClick={() => handleSelectVoucher(v)}
                                    className="px-4 py-1.5 rounded-full text-xs font-black bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:brightness-110 text-white shadow-md shadow-orange-500/25 transition-all cursor-pointer flex items-center gap-1 active:scale-95 group-hover:scale-105"
                                  >
                                    <span>Dùng mã</span>
                                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    disabled
                                    className="px-3 py-1 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-80"
                                  >
                                    <span>Chưa đủ điều kiện</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  });
                })()
              )}
            </div>

            {/* Modal Footer */}
            <div className={`p-4 border-t flex items-center justify-between text-xs ${
              isDarkMode ? 'bg-slate-950/80 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'
            }`}>
              <div className="flex items-center gap-1.5 text-[11px]">
                <Info className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                <span>Mỗi đơn đặt sân được áp dụng 1 mã ưu đãi tốt nhất.</span>
              </div>
              <button
                type="button"
                onClick={() => setIsVoucherModalOpen(false)}
                className={`px-4 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                  isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
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
