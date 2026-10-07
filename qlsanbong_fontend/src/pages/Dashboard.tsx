import React, { useState, useMemo, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { io, Socket } from 'socket.io-client';
import SoccerLoader from '../components/SoccerLoader';
import { useAppTheme } from '../hooks/useAppTheme';
import {
  LayoutDashboard,
  Calendar,
  Layers,
  Clock,
  Coffee,
  Users,
  BarChart3,
  Plus,
  Edit2,
  Trash2,
  Search,
  Bell,
  User,
  LogOut,
  CheckCircle2,
  AlertCircle,
  XCircle,
  X,
  CreditCard,
  DollarSign,
  Activity,
  PackagePlus,
  Receipt,
  QrCode,
  ShieldCheck,
  Sun,
  Moon,
  ChevronRight,
  ChevronDown,
  SlidersHorizontal,
  Flame,
  ArrowUpRight,
  TrendingUp,
  Download,
  Check,
  RefreshCw,
  Trophy,
  Sparkles,
  MapPin,
  Phone,
  Mail,
  FileText,
  Filter,
  Eye,
  Shield,
  ShoppingCart,
  Percent,
  FolderTree,
  Lock,
  ShieldAlert,
  ArrowLeft,
  Upload,
  ImageIcon,
  Loader2,
  Minus,
  PieChart,
  ExternalLink,
  Zap,
  BarChart,
  MessageSquare,
  MessageSquareReply,
  Send,
  Save
} from 'lucide-react';
import { AuthUser } from './Login/login';
import { contentService, BannerItem, LienHePayload, LoaiTinTuc, TinTucItem, AboutUsData } from '../services/contentService';

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
// 1. ĐỊNH NGHĨA KIỂU DỮ LIỆU & TABS (ÁNH XẠ 11 BẢNG CSDL)
// =====================================================================

export type TabType =
  // 1. Nhóm Thống Kê & Tổng Quan
  | 'OVERVIEW'
  | 'ABOUT_US'
  | 'BANNER'
  | 'LIEN_HE'
  // 2. Nhóm Quản Lý Tin Tức
  | 'LOAI_TIN_TUC'
  | 'TIN_TUC'
  // 3. Quản Lý Sân Bóng (San_Bong, Loai_San, Khung_Gio_Gia)
  | 'SAN_BONG'
  | 'LOAI_SAN_GIA'
  // 4. Dịch Vụ & Kho (Dich_Vu, Phieu_Nhap_Kho)
  | 'DICH_VU'
  | 'PHIEU_NHAP_KHO'
  // 5. Tài Chính & Giao Dịch (Don_Dat_San & Thanh_Toan, Lich_Su_Hoan_Tien, Khung_Gio)
  | 'DON_DAT_THANH_TOAN'
  | 'HOAN_TIEN'
  | 'KHUNG_GIO'
  // 6. Hệ Thống & Phân Quyền (Nguoi_Dung, Vai_Tro)
  | 'NGUOI_DUNG'
  | 'VAI_TRO';

// Danh sách các khung giờ 24h từ 00:00 đến 24:00
export const TIME_OPTIONS_24H: string[] = [
  '00:00', '00:30', '01:00', '01:30', '02:00', '02:30', '03:00', '03:30',
  '04:00', '04:30', '05:00', '05:30', '06:00', '06:30', '07:00', '07:30',
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00', '23:30',
  '24:00'
];

// 1. San_Bong
export interface SanBong {
  id: number;
  ma_loai_san: number;
  ten_san: string;
  ten_loai?: string;
  hinh_anh: string;
  don_gia_phut: number;
  trang_thai: 'SAN_SANG' | 'BAO_TRI';
}

// 2. Loai_San
export interface LoaiSan {
  id: number;
  ten_loai: string;
  mo_ta: string;
  trang_thai?: boolean;
}

// 3. Khung_Gio (CSDL SQL Server)
export interface KhungGio {
  id: number;
  gio_bat_dau: string;
  gio_ket_thuc: string;
  nhan_hien_thi: string;
  thu_tu: number;
  trang_thai: boolean;
}

// 4. Don_Dat_San
export interface DonDatSan {
  id: number;
  ma_nguoi_dung: number;
  ten_khach_hang: string;
  so_dien_thoai: string;
  ma_san: number;
  ten_san: string;
  ngay_da: string;
  gio_bat_dau: string;
  gio_ket_thuc: string;
  tien_san: number;
  tong_tien: number;
  phuong_thuc?: 'TIEN_MAT' | 'CHUYEN_KHOAN' | string;
  tien_coc_da_tra?: number;
  so_tien_da_tra?: number;
  kieu_dat?: 'CO_DINH' | 'LINH_HOAT';
  so_phut_da?: number;
  ghi_chu?: string;
  trang_thai: 'DA_COC' | 'DA_THANH_TOAN' | 'CHO_XAC_NHAN' | 'DA_CHOT' | 'HOAN_THANH' | 'DA_HUY' | string;
  dich_vu_da_dung?: {
    ma_dich_vu: number;
    ten_dich_vu: string;
    so_luong: number;
    gia_luc_ban: number;
    don_vi_tinh?: string;
    thanh_tien?: number;
  }[];
  chi_tiet_dich_vu?: {
    id?: number;
    ma_dich_vu: number;
    ten_dich_vu: string;
    so_luong: number;
    gia_luc_ban?: number;
    don_gia?: number;
    don_vi_tinh?: string;
    thanh_tien?: number;
  }[];
}

// 5. Chi_Tiet_Dich_Vu
export interface ChiTietDichVu {
  id: number;
  ma_don_dat: number;
  ten_khach_hang?: string;
  ten_san?: string;
  ma_dich_vu: number;
  ten_dich_vu: string;
  don_vi_tinh: string;
  so_luong: number;
  gia_luc_ban: number;
  thanh_tien: number;
  ngay_tao?: string;
}

// 6. Dich_Vu
export interface DichVu {
  id: number;
  ten_dich_vu: string;
  don_gia: number;
  don_vi_tinh: string;
  ton_kho: number;
}

// 7. Phieu_Nhap_Kho
export interface PhieuNhapKho {
  id: number;
  ma_dich_vu: number;
  ten_dich_vu?: string;
  don_vi_tinh?: string;
  so_luong_nhap: number;
  gia_nhap: number;
  tong_tien_nhap?: number;
  ngay_nhap: string;
}

// 8. Thanh_Toan
export interface ThanhToan {
  id: number;
  ma_don_dat: number;
  ten_khach_hang?: string;
  so_dien_thoai?: string;
  ten_san?: string;
  ngay_da?: string;
  so_tien: number;
  phuong_thuc: 'TIEN_MAT' | 'CHUYEN_KHOAN';
  loai_thanh_toan: 'DAT_COC' | 'TRA_HET';
  ma_giao_dich?: string;
  ngay_thanh_toan: string;
}

// 9. Lich_Su_Hoan_Tien
export interface LichSuHoanTien {
  id: number;
  ma_don_dat: number;
  ten_khach_hang?: string;
  so_dien_thoai?: string;
  ten_san?: string;
  ngay_da?: string;
  so_tien_hoan: number;
  ty_le_hoan: number;
  ly_do_huy: string;
  ngay_hoan: string;
}

// 10. Nguoi_Dung
export interface NguoiDung {
  id: number;
  ho_ten: string;
  email: string;
  so_dien_thoai: string;
  mat_khau?: string;
  vai_tro: 'ADMIN' | 'NHAN_VIEN' | 'KHACH_HANG';
  MaVaiTro?: number;
  TenVaiTro?: string;
  anh_dai_dien?: string;
  ngay_tao: string;
}

// 11. Vai_Tro
export interface VaiTro {
  MaVaiTro: number;
  TenVaiTro: string;
  MoTa: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' 
    ? (localStorage.getItem('auth_token') || localStorage.getItem('token') || '') 
    : '';
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

const formatVNDate = (dateStr?: string) => {
  if (!dateStr) return '';
  const raw = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const parts = raw.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return raw;
};


interface SidebarItem {
  id: TabType;
  label: string;
  icon: any;
  badge?: string;
  tableHint?: string;
}

interface SidebarGroup {
  groupTitle: string;
  groupIcon: any;
  items: SidebarItem[];
}

// Cấu trúc cây Menu Sidebar chuẩn
const SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    groupTitle: 'THỐNG KÊ & TỔNG QUAN',
    groupIcon: BarChart3,
    items: [
      { id: 'OVERVIEW', label: 'Dashboard (Thống kê & KPI)', icon: LayoutDashboard, badge: 'KPI' },
      { id: 'ABOUT_US', label: 'Quản Lý About Us', icon: Sparkles, tableHint: 'About_Us' },
      { id: 'BANNER', label: 'Quản Lý Banner', icon: ImageIcon, tableHint: 'Banner' },
      { id: 'LIEN_HE', label: 'Quản Lý Liên Hệ', icon: Mail, tableHint: 'Lien_He' }
    ]
  },
  {
    groupTitle: 'QUẢN LÝ TIN TỨC',
    groupIcon: FileText,
    items: [
      { id: 'LOAI_TIN_TUC', label: 'Loại Tin Tức', icon: FolderTree, tableHint: 'Loai_Tin_Tuc' },
      { id: 'TIN_TUC', label: 'Tin Tức & Bài Viết', icon: FileText, tableHint: 'Tin_Tuc' }
    ]
  },
  {
    groupTitle: 'QUẢN LÝ SÂN BÓNG',
    groupIcon: Trophy,
    items: [
      { id: 'SAN_BONG', label: 'Danh Sách Sân Bóng', icon: Layers, tableHint: 'San_Bong' },
      { id: 'LOAI_SAN_GIA', label: 'Loại Sân', icon: Layers, tableHint: 'Loai_San' },
      { id: 'KHUNG_GIO', label: 'Bảng Khung Giờ', icon: Clock, tableHint: 'Khung_Gio' }
    ]
  },
  {
    groupTitle: 'DỊCH VỤ & KHO HÀNG',
    groupIcon: ShoppingCart,
    items: [
      { id: 'DICH_VU', label: 'Danh Mục Dịch Vụ', icon: PackagePlus, tableHint: 'Dich_Vu' },
      { id: 'PHIEU_NHAP_KHO', label: 'Quản Lý Nhập Kho', icon: Download, tableHint: 'Phieu_Nhap_Kho' }
    ]
  },
  {
    groupTitle: 'TÀI CHÍNH & GIAO DỊCH',
    groupIcon: CreditCard,
    items: [
      { id: 'DON_DAT_THANH_TOAN', label: 'Đơn Đặt Sân & Thanh Toán', icon: Receipt, tableHint: 'Don_Dat_San, Thanh_Toan' },
      { id: 'HOAN_TIEN', label: 'Lịch Sử Hoàn Tiền', icon: RefreshCw, tableHint: 'Lich_Su_Hoan_Tien' }
    ]
  },
  {
    groupTitle: 'HỆ THỐNG & PHÂN QUYỀN',
    groupIcon: Users,
    items: [
      { id: 'NGUOI_DUNG', label: 'Danh Sách Người Dùng', icon: User, tableHint: 'Nguoi_Dung' },
      { id: 'VAI_TRO', label: 'Phân Quyền & Vai Trò', icon: ShieldCheck, tableHint: 'Vai_Tro' }
    ]
  }
];

export default function AdminDashboard() {
  const router = useRouter();
  const { isDarkMode, setIsDarkMode, toggleTheme } = useAppTheme(true);
  const [activeTab, setActiveTab] = useState<TabType>('OVERVIEW');

  // Quản lý xác thực & Phân quyền Admin
  const [currentAdminUser, setCurrentAdminUser] = useState<AuthUser | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);

  // Dữ liệu 11 Bảng CSDL từ SQL Server (100% Real Database Data)
  const [courtList, setCourtList] = useState<SanBong[]>([]);
  const [categoryList, setCategoryList] = useState<LoaiSan[]>([]);
  const [bookingList, setBookingList] = useState<DonDatSan[]>([]);
  const [serviceDetailList, setServiceDetailList] = useState<ChiTietDichVu[]>([]);
  const [serviceList, setServiceList] = useState<DichVu[]>([]);
  const [inventoryList, setInventoryList] = useState<PhieuNhapKho[]>([]);
  const [paymentList, setPaymentList] = useState<ThanhToan[]>([]);
  const [refundList, setRefundList] = useState<LichSuHoanTien[]>([]);
  const [khungGioList, setKhungGioList] = useState<KhungGio[]>([]);
  const [userList, setUserList] = useState<NguoiDung[]>([]);
  const [roleList, setRoleList] = useState<VaiTro[]>([]);
  const [lockedSlots, setLockedSlots] = useState<string[]>([]);

  // Dữ liệu mở rộng: Banner, Liên Hệ, Loại Tin Tức, Tin Tức, About Us
  const [bannerList, setBannerList] = useState<BannerItem[]>([]);
  const [lienHeList, setLienHeList] = useState<LienHePayload[]>([]);
  const [loaiTinList, setLoaiTinList] = useState<LoaiTinTuc[]>([]);
  const [newsList, setNewsList] = useState<TinTucItem[]>([]);
  const [aboutUsData, setAboutUsData] = useState<AboutUsData>({
    ten_trung_tam: 'Trung Tâm Thể Thao Soccer247',
    hotline: '0816344504',
    email: 'sinhvienxoan@gmail.com',
    dia_chi: 'Biên Hòa - Đồng Nai',
    link_map: '',
    gioi_thieu_ngan: '',
    bai_viet_about_us: '',
    link_facebook: '',
    link_zalo: ''
  });
  const [isSavingAboutUs, setIsSavingAboutUs] = useState<boolean>(false);

  const [bannerModal, setBannerModal] = useState<{ isOpen: boolean; mode: 'ADD' | 'EDIT'; data: Partial<BannerItem> }>({
    isOpen: false,
    mode: 'ADD',
    data: { loai_banner: 'IMAGE', thu_tu: 1, trang_thai: 1 }
  });
  const [loaiTinModal, setLoaiTinModal] = useState<{ isOpen: boolean; mode: 'ADD' | 'EDIT'; data: Partial<LoaiTinTuc> }>({
    isOpen: false,
    mode: 'ADD',
    data: { trang_thai: 1 }
  });
  const [newsModal, setNewsModal] = useState<{ isOpen: boolean; mode: 'ADD' | 'EDIT'; data: Partial<TinTucItem> }>({
    isOpen: false,
    mode: 'ADD',
    data: { ma_loai_tin: 1, trang_thai: 1 }
  });
  const [lienHeDetailModal, setLienHeDetailModal] = useState<{ isOpen: boolean; data: LienHePayload | null }>({
    isOpen: false,
    data: null
  });
  const [replyLienHeModal, setReplyLienHeModal] = useState<{
    isOpen: boolean;
    data: LienHePayload | null;
    tieu_de_tra_loi: string;
    noi_dung_tra_loi: string;
    isSubmitting: boolean;
  }>({
    isOpen: false,
    data: null,
    tieu_de_tra_loi: '',
    noi_dung_tra_loi: '',
    isSubmitting: false,
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);

  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(null), 3800);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  // Xử lý tải ảnh từ File máy tính lên Cloudinary
  const handleUploadImageFile = async (file: File) => {
    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || '' : '';
      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (data.success && data.url) {
        setCourtModal((prev) => ({ ...prev, data: { ...prev.data, hinh_anh: data.url } }));
        setToastMessage({ type: 'success', message: '☁️ Đã tải ảnh lên Cloudinary thành công!' });
      } else {
        setToastMessage({ type: 'error', message: data.message || 'Lỗi tải ảnh lên Cloudinary' });
      }
    } catch (err: any) {
      console.error('Lỗi upload file:', err);
      setToastMessage({ type: 'error', message: err.message || 'Không thể kết nối máy chủ để upload ảnh' });
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Xử lý Dán link ảnh và chuyển sang lưu trữ trên Cloudinary
  const handleUploadImageUrl = async (url: string) => {
    if (!url || !url.trim()) {
      setToastMessage({ type: 'error', message: 'Vui lòng nhập đường link ảnh!' });
      return;
    }
    if (url.includes('cloudinary.com')) {
      setToastMessage({ type: 'info', message: 'Link ảnh này đã nằm trên Cloudinary!' });
      return;
    }
    setIsUploadingImage(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || '' : '';
      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ url: url.trim() })
      });
      const data = await res.json();
      if (data.success && data.url) {
        setCourtModal((prev) => ({ ...prev, data: { ...prev.data, hinh_anh: data.url } }));
        setToastMessage({ type: 'success', message: '☁️ Đã chuyển đổi và lưu ảnh lên Cloudinary!' });
      } else {
        setToastMessage({ type: 'error', message: data.message || 'Lỗi chuyển đổi link ảnh sang Cloudinary' });
      }
    } catch (err: any) {
      console.error('Lỗi upload url:', err);
      setToastMessage({ type: 'error', message: err.message || 'Không thể kết nối máy chủ để upload ảnh từ link' });
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Xử lý tải file trực tiếp từ máy tính (ảnh hoặc video) cho Banner Modal
  const handleUploadBannerFile = async (file: File, type: 'IMAGE' | 'VIDEO') => {
    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || '' : '';
      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (data.success && data.url) {
        if (type === 'VIDEO') {
          setBannerModal((prev) => ({
            ...prev,
            data: { ...prev.data, video_url: data.url, loai_banner: 'VIDEO' }
          }));
          setToastMessage({ type: 'success', message: '🎥 Đã tải file video lên Cloudinary thành công!' });
        } else {
          setBannerModal((prev) => ({
            ...prev,
            data: { ...prev.data, hinh_anh: data.url }
          }));
          setToastMessage({ type: 'success', message: '🖼️ Đã tải file ảnh lên Cloudinary thành công!' });
        }
      } else {
        setToastMessage({ type: 'error', message: data.message || 'Lỗi khi tải file lên máy chủ' });
      }
    } catch (err: any) {
      console.error('Lỗi upload banner file:', err);
      setToastMessage({ type: 'error', message: err.message || 'Không thể kết nối máy chủ để upload file' });
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Xử lý tải file ảnh trực tiếp từ máy tính cho Tin Tức Modal
  const handleUploadNewsImageFile = async (file: File) => {
    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || '' : '';
      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (data.success && data.url) {
        setNewsModal((prev) => ({
          ...prev,
          data: { ...prev.data, hinh_anh: data.url }
        }));
        setToastMessage({ type: 'success', message: '🖼️ Đã tải ảnh bài viết lên Cloudinary thành công!' });
      } else {
        setToastMessage({ type: 'error', message: data.message || 'Lỗi khi tải ảnh bài viết' });
      }
    } catch (err: any) {
      console.error('Lỗi upload news image:', err);
      setToastMessage({ type: 'error', message: err.message || 'Lỗi kết nối máy chủ upload' });
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Hàm kiểm tra linh hoạt vai trò Admin
  const checkIsAdmin = (user: any): boolean => {
    if (!user) return false;
    const role = (user.vai_tro || user.TenVaiTro || user.role || '').trim().toUpperCase();
    const email = (user.email || '').trim().toLowerCase();
    return (
      role === 'ADMIN' ||
      role === 'QUAN_TRI_VIEN' ||
      role === 'QUANTRIVIEN' ||
      role.includes('ADMIN') ||
      role.includes('QUẢN TRỊ') ||
      role.includes('QUAN TRI') ||
      email === 'admin@gmail.com' ||
      email.startsWith('admin')
    );
  };

  // Kiểm tra quyền Admin khi tải trang (Bảo mật 2 lớp: Local + Xác thực Backend)
  const verifyAdminRole = async (): Promise<boolean> => {
    setIsAuthChecking(true);
    try {
      const token = typeof window !== 'undefined' 
        ? (localStorage.getItem('auth_token') || localStorage.getItem('token') || '') 
        : '';
      const savedUserStr = typeof window !== 'undefined'
        ? (localStorage.getItem('auth_user') || localStorage.getItem('soccer_current_user') || '')
        : '';

      if (!token && !savedUserStr) {
        setCurrentAdminUser(null);
        setIsAuthorized(false);
        return false;
      }

      let parsedUser: any = null;
      if (savedUserStr) {
        try {
          parsedUser = JSON.parse(savedUserStr);
        } catch (err) {
          console.error('Lỗi parse saved user:', err);
        }
      }

      // Xác minh lại với server nếu có token
      if (token) {
        try {
          const res = await fetch(`${API_BASE}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok && data.success && data.data) {
            const serverUser = data.data;
            if (checkIsAdmin(serverUser)) {
              const userObj: AuthUser = {
                id: serverUser.id || parsedUser?.id,
                ho_ten: serverUser.ho_ten || parsedUser?.ho_ten || 'Quản Trị Viên',
                email: serverUser.email || parsedUser?.email || 'Admin@gmail.com',
                so_dien_thoai: serverUser.so_dien_thoai || parsedUser?.so_dien_thoai || '',
                vai_tro: serverUser.vai_tro || 'ADMIN',
                anh_dai_dien: serverUser.anh_dai_dien || parsedUser?.anh_dai_dien
              };
              localStorage.setItem('auth_user', JSON.stringify(userObj));
              setCurrentAdminUser(userObj);
              setIsAuthorized(true);
              return true;
            } else {
              setCurrentAdminUser(serverUser);
              setIsAuthorized(false);
              return false;
            }
          }
        } catch (serverErr) {
          console.warn('Lỗi kết nối server xác thực, kiểm tra qua local storage:', serverErr);
        }
      }

      // Fallback kiểm tra từ local storage
      if (parsedUser && checkIsAdmin(parsedUser)) {
        setCurrentAdminUser(parsedUser);
        setIsAuthorized(true);
        return true;
      }

      setCurrentAdminUser(parsedUser);
      setIsAuthorized(false);
      return false;
    } catch (e) {
      console.error('Lỗi xác thực Admin:', e);
      setCurrentAdminUser(null);
      setIsAuthorized(false);
      return false;
    } finally {
      setIsAuthChecking(false);
    }
  };

  useEffect(() => {
    verifyAdminRole().then((isOk) => {
      if (isOk) {
        loadAllDataFromBackend();
      } else {
        // Chưa đăng nhập hoặc không phải ADMIN -> Chuyển hướng ngay về Trang chủ và bật modal đăng nhập
        router.replace('/?login=true&requireAdmin=true');
      }
    });
  }, []);

  // Lắng nghe Socket Real-time đồng bộ các khung giờ đang chọn và dữ liệu mới
  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:5000` : 'http://localhost:5000');
    const socket: Socket = io(socketUrl, { transports: ['websocket', 'polling'] });
    
    socket.on('slots_updated', (updatedSlots: string[]) => {
      setLockedSlots(updatedSlots || []);
    });

    socket.on('booking_updated', () => {
      loadAllDataFromBackend();
    });

    socket.on('payment_success', () => {
      loadAllDataFromBackend();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Xử lý Đăng xuất Admin -> Chuyển hướng ngay về Trang chủ Khách hàng
  const handleAdminLogout = () => {
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('soccer_current_user');
    setCurrentAdminUser(null);
    setIsAuthorized(false);
    router.push('/');
  };

  // Đồng bộ toàn bộ 11 bảng từ Backend CSDL Stored Procedures
  const loadAllDataFromBackend = async () => {
    setIsLoading(true);
    try {
      const resCourts = await fetch(`${API_BASE}/dat-san/san-bong`);
      if (resCourts.ok) {
        const data = await resCourts.json();
        if (data.success && Array.isArray(data.data)) setCourtList(data.data);
      }

      const resLoai = await fetch(`${API_BASE}/dat-san/loai-san`);
      if (resLoai.ok) {
        const data = await resLoai.json();
        if (data.success && Array.isArray(data.data)) setCategoryList(data.data);
      }

      const resBookings = await fetch(`${API_BASE}/dat-san/tat-ca-don`);
      if (resBookings.ok) {
        const data = await resBookings.json();
        if (data.success && Array.isArray(data.data)) {
          setBookingList(data.data.map((b: any) => ({ ...b, dich_vu_da_dung: b.dich_vu_da_dung || b.chi_tiet_dich_vu || [] })));
        }
      }

      const resDetails = await fetch(`${API_BASE}/dich-vu/chi-tiet-ban-hang`);
      if (resDetails.ok) {
        const data = await resDetails.json();
        if (data.success && Array.isArray(data.data)) setServiceDetailList(data.data);
      }

      const resServices = await fetch(`${API_BASE}/dich-vu`);
      if (resServices.ok) {
        const data = await resServices.json();
        if (data.success && Array.isArray(data.data)) setServiceList(data.data);
      }

      const resNhap = await fetch(`${API_BASE}/dich-vu/phieu-nhap`);
      if (resNhap.ok) {
        const data = await resNhap.json();
        if (data.success && Array.isArray(data.data)) setInventoryList(data.data);
      }

      const resPayments = await fetch(`${API_BASE}/thanh-toan/danh-sach`);
      if (resPayments.ok) {
        const data = await resPayments.json();
        if (data.success && Array.isArray(data.data)) setPaymentList(data.data);
      }

      const resRefunds = await fetch(`${API_BASE}/thanh-toan/hoan-tien`);
      if (resRefunds.ok) {
        const data = await resRefunds.json();
        if (data.success && Array.isArray(data.data)) setRefundList(data.data);
      }

      const resKhung = await fetch(`${API_BASE}/dat-san/khung-gio/all`);
      if (resKhung.ok) {
        const data = await resKhung.json();
        if (data.success && Array.isArray(data.data)) setKhungGioList(data.data);
      }

      const resUsers = await fetch(`${API_BASE}/auth/users`);
      if (resUsers.ok) {
        const data = await resUsers.json();
        if (data.success && Array.isArray(data.data)) setUserList(data.data);
      }

      const resRoles = await fetch(`${API_BASE}/auth/vai-tro`);
      if (resRoles.ok) {
        const data = await resRoles.json();
        if (data.success && Array.isArray(data.data)) setRoleList(data.data);
      }

      // 12. Banners
      try {
        const resBanners = await fetch(`${API_BASE}/banner/admin`);
        if (resBanners.ok) {
          const data = await resBanners.json();
          if (data.success && Array.isArray(data.data)) setBannerList(data.data);
        }
      } catch (_e) {}

      // 13. Liên Hệ
      try {
        const resLienHe = await fetch(`${API_BASE}/lien-he`);
        if (resLienHe.ok) {
          const data = await resLienHe.json();
          if (data.success && Array.isArray(data.data)) setLienHeList(data.data);
        }
      } catch (_e) {}

      // 14. Loại Tin Tức
      try {
        const resLoaiTin = await fetch(`${API_BASE}/tin-tuc/loai-tin/admin`);
        if (resLoaiTin.ok) {
          const data = await resLoaiTin.json();
          if (data.success && Array.isArray(data.data)) setLoaiTinList(data.data);
        }
      } catch (_e) {}

      // 15. Tin Tức
      try {
        const resNews = await fetch(`${API_BASE}/tin-tuc/admin`);
        if (resNews.ok) {
          const data = await resNews.json();
          if (data.success && Array.isArray(data.data)) setNewsList(data.data);
        }
      } catch (_e) {}

      // 16. About Us
      try {
        const resAbout = await contentService.getAboutUs();
        if (resAbout?.success && resAbout.data) {
          setAboutUsData(resAbout.data);
        }
      } catch (_e) {}
    } catch (err) {
      console.warn('Lỗi tải dữ liệu từ CSDL:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllDataFromBackend();
  }, []);

  // =====================================================================
  // MODAL STATES (ĐẦY ĐỦ THÊM / SỬA / XÓA CHO TẤT CẢ CÁC BẢNG)
  // =====================================================================

  const [courtModal, setCourtModal] = useState<{ isOpen: boolean; mode: 'ADD' | 'EDIT'; data: Partial<SanBong> }>({ isOpen: false, mode: 'ADD', data: {} });
  const [loaiSanModal, setLoaiSanModal] = useState<{ isOpen: boolean; mode: 'ADD' | 'EDIT'; data: Partial<LoaiSan> }>({ isOpen: false, mode: 'ADD', data: {} });
  const [serviceModal, setServiceModal] = useState<{
    isOpen: boolean;
    mode: 'ADD' | 'EDIT';
    data: Partial<DichVu> & {
      tao_phieu_nhap?: boolean;
      so_luong_nhap?: number;
      gia_nhap?: number;
      ngay_nhap?: string;
    };
  }>({
    isOpen: false,
    mode: 'ADD',
    data: { don_vi_tinh: 'Chai', ton_kho: 0, tao_phieu_nhap: true, so_luong_nhap: 50, gia_nhap: 10000, ngay_nhap: new Date().toISOString().split('T')[0] }
  });
  const [importStockModal, setImportStockModal] = useState<{ isOpen: boolean; mode: 'ADD' | 'EDIT'; data: Partial<PhieuNhapKho> }>({ isOpen: false, mode: 'ADD', data: { ma_dich_vu: 1, so_luong_nhap: 50, gia_nhap: 12000 } });
  const [bookingModal, setBookingModal] = useState<{ isOpen: boolean; mode: 'ADD' | 'EDIT'; data: any }>({
    isOpen: false,
    mode: 'ADD',
    data: { ma_san: 1, ma_nguoi_dung: 1, ngay_da: new Date().toISOString().split('T')[0], gio_bat_dau: '17:00', gio_ket_thuc: '18:30', tien_san: 350000, tong_tien: 350000, trang_thai: 'DA_CHOT', phuong_thuc: 'TIEN_MAT', loai_thanh_toan: 'TRA_HET', so_tien: 350000, trang_thai_gd: 'THANH_CONG' }
  });
  const [refundModal, setRefundModal] = useState<{ isOpen: boolean; mode: 'ADD' | 'EDIT'; data: Partial<LichSuHoanTien> }>({ isOpen: false, mode: 'ADD', data: { ma_don_dat: 101, so_tien_hoan: 150000, ty_le_hoan: 100, ly_do_huy: 'Báo hủy trước 24h' } });
  const [khungGioModal, setKhungGioModal] = useState<{ isOpen: boolean; mode: 'ADD' | 'EDIT'; data: Partial<KhungGio> }>({
    isOpen: false,
    mode: 'ADD',
    data: { gio_bat_dau: '19:30', gio_ket_thuc: '20:00', nhan_hien_thi: '19h30', thu_tu: 28, trang_thai: true }
  });
  const [userModal, setUserModal] = useState<{ isOpen: boolean; mode: 'ADD' | 'EDIT'; data: Partial<NguoiDung> }>({ isOpen: false, mode: 'ADD', data: {} });
  const [roleModal, setRoleModal] = useState<{ isOpen: boolean; mode: 'ADD' | 'EDIT'; data: Partial<VaiTro> }>({ isOpen: false, mode: 'ADD', data: {} });
  const [bookingEditModal, setBookingEditModal] = useState<{ isOpen: boolean; mode: 'ADD' | 'EDIT'; data: Partial<DonDatSan> }>({ isOpen: false, mode: 'ADD', data: {} });

  // Bộ lọc vai trò người dùng trong tab NGUOI_DUNG
  const [userRoleFilter, setUserRoleFilter] = useState<'ALL' | 'ADMIN' | 'NHAN_VIEN' | 'KHACH_HANG'>('ALL');

  // Modal xác nhận xóa chuẩn đẹp cho TẤT CẢ các bảng
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    itemDescription?: string;
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const openDeleteConfirm = (title: string, message: string, itemDescription: string, onConfirm: () => void | Promise<void>) => {
    setDeleteConfirmModal({
      isOpen: true,
      title,
      message,
      itemDescription,
      onConfirm
    });
  };

  const [checkoutModal, setCheckoutModal] = useState<{ isOpen: boolean; booking: DonDatSan | null; paymentMethod: 'TIEN_MAT' | 'CHUYEN_KHOAN'; discount: number }>({ isOpen: false, booking: null, paymentMethod: 'TIEN_MAT', discount: 0 });
  const [miniPosModal, setMiniPosModal] = useState<{ isOpen: boolean; booking: DonDatSan | null; maDichVuChon: number; soLuong: number }>({ isOpen: false, booking: null, maDichVuChon: 1, soLuong: 1 });

  // Form Đặt Sân Tính Giờ Linh Hoạt & Cố Định
  const [bookingForm, setBookingForm] = useState<{
    ma_san: number;
    ngay_da: string;
    gio_bat_dau: string;
    gio_ket_thuc: string;
    ten_khach_hang: string;
    so_dien_thoai: string;
    ghi_chu: string;
    tien_coc: number;
    isRealtimeCheckin: boolean;
    so_phut: number;
    don_gia_gio: number;
    don_gia_phut: number;
    tien_san: number;
    cong_thuc: string;
  }>({
    ma_san: 1,
    ngay_da: new Date().toISOString().split('T')[0],
    gio_bat_dau: '17:15',
    gio_ket_thuc: '18:40',
    ten_khach_hang: 'Khách Vãng Lai (Đá Linh Hoạt)',
    so_dien_thoai: '0909000888',
    ghi_chu: 'Khách đá linh hoạt theo phút',
    tien_coc: 0,
    isRealtimeCheckin: false,
    so_phut: 85,
    don_gia_gio: 350000,
    don_gia_phut: 5833,
    tien_san: 496000,
    cong_thuc: '85 phút × 350.000 đ / 60 = 496.000 đ'
  });

  const recalculateBookingPrice = (maSan: number, ngayDa: string, gioBat: string, gioKet: string) => {
    const [h1, m1] = (gioBat || '17:15').split(':').map(Number);
    const [h2, m2] = (gioKet || '18:40').split(':').map(Number);
    let totalMinutes = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (isNaN(totalMinutes) || totalMinutes <= 0) totalMinutes = 60;

    const selectedCourt = courtList.find((c) => c.id === Number(maSan)) || courtList[0];
    const donGiaPhut = Number(selectedCourt?.don_gia_phut || 5000);
    const calcPrice = totalMinutes * donGiaPhut;

    return {
      so_phut: totalMinutes,
      don_gia_gio: donGiaPhut * 60,
      don_gia_phut: donGiaPhut,
      tien_san: calcPrice,
      cong_thuc: `${totalMinutes} phút × ${donGiaPhut.toLocaleString('vi-VN')} đ/phút = ${calcPrice.toLocaleString('vi-VN')} đ`
    };
  };

  // State chuyển đổi bộ lọc cho 4 Widgets Dashboard
  const [revenuePeriod, setRevenuePeriod] = useState<'NGAY' | 'TUAN' | 'THANG'>('NGAY');
  const [revenueChartType, setRevenueChartType] = useState<'BAR' | 'LINE'>('BAR');
  const [serviceViewMode, setServiceViewMode] = useState<'LIST' | 'DONUT'>('LIST');
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  // KPI Stats
  const kpiStats = useMemo(() => {
    const curDate = selectedDate ? String(selectedDate).split('T')[0] : new Date().toISOString().split('T')[0];
    
    // Doanh thu ngày hôm nay
    const todayOrders = bookingList.filter((b) => {
      const bDate = b.ngay_da ? String(b.ngay_da).split('T')[0] : '';
      const st = (b.trang_thai || '').toUpperCase();
      return bDate === curDate && st !== 'DA_HUY';
    });

    const totalRevenue = todayOrders.reduce((sum, b) => sum + Number(b.tong_tien || b.tien_san || 0), 0);
    const totalOrders = bookingList.length;
    
    // Đếm số sân đang có người đá
    const activeCourtsCount = courtList.filter(c => {
      return bookingList.some(b => {
        const bDate = b.ngay_da ? String(b.ngay_da).split('T')[0] : '';
        const st = (b.trang_thai || '').toUpperCase();
        return Number(b.ma_san) === c.id && bDate === curDate && ((b as any).da_vao_san === 1 || st === 'DANG_DA');
      });
    }).length;

    const totalPossibleSlots = (courtList.length || 1) * (khungGioList.length || 27);
    const occupancyRate = totalPossibleSlots > 0 ? Math.min(100, Math.round((todayOrders.length / totalPossibleSlots) * 100)) : 0;

    return { totalRevenue, totalOrders, activeCourtsCount, occupancyRate };
  }, [bookingList, courtList, khungGioList, selectedDate]);

  // 1. Dữ liệu Biểu đồ Doanh thu (Theo Ngày / Tuần / Tháng)
  const revenueAnalytics = useMemo(() => {
    if (revenuePeriod === 'NGAY') {
      // 7 ngày gần nhất tính từ ngày được chọn
      const baseDate = selectedDate ? new Date(selectedDate) : new Date();
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(baseDate);
        d.setDate(baseDate.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayLabel = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
        
        const ordersOnDay = bookingList.filter(b => {
          const bDate = b.ngay_da ? String(b.ngay_da).split('T')[0] : '';
          const st = (b.trang_thai || '').toUpperCase();
          return bDate === dateStr && st !== 'DA_HUY';
        });

        const tienSan = ordersOnDay.reduce((sum, b) => sum + Number(b.tien_san || 0), 0);
        const tongTien = ordersOnDay.reduce((sum, b) => sum + Number(b.tong_tien || b.tien_san || 0), 0);
        const tienDichVu = Math.max(0, tongTien - tienSan);

        days.push({
          label: dayLabel,
          fullDate: dateStr,
          tienSan,
          tienDichVu,
          tongTien,
          soDon: ordersOnDay.length
        });
      }
      return days;
    } else if (revenuePeriod === 'TUAN') {
      // 4 tuần gần nhất
      const weeks = [];
      const baseDate = selectedDate ? new Date(selectedDate) : new Date();
      for (let w = 3; w >= 0; w--) {
        const startWeek = new Date(baseDate);
        startWeek.setDate(baseDate.getDate() - w * 7 - 6);
        const endWeek = new Date(baseDate);
        endWeek.setDate(baseDate.getDate() - w * 7);

        const startStr = startWeek.toISOString().split('T')[0];
        const endStr = endWeek.toISOString().split('T')[0];

        const ordersInWeek = bookingList.filter(b => {
          const bDate = b.ngay_da ? String(b.ngay_da).split('T')[0] : '';
          const st = (b.trang_thai || '').toUpperCase();
          return bDate >= startStr && bDate <= endStr && st !== 'DA_HUY';
        });

        const tienSan = ordersInWeek.reduce((sum, b) => sum + Number(b.tien_san || 0), 0);
        const tongTien = ordersInWeek.reduce((sum, b) => sum + Number(b.tong_tien || b.tien_san || 0), 0);
        const tienDichVu = Math.max(0, tongTien - tienSan);

        weeks.push({
          label: `Tuần ${4 - w}`,
          subLabel: `${startWeek.getDate()}/${startWeek.getMonth() + 1} - ${endWeek.getDate()}/${endWeek.getMonth() + 1}`,
          tienSan,
          tienDichVu,
          tongTien,
          soDon: ordersInWeek.length
        });
      }
      return weeks;
    } else {
      // 12 tháng của năm hiện tại
      const year = selectedDate ? new Date(selectedDate).getFullYear() : new Date().getFullYear();
      const months = [];
      for (let m = 0; m < 12; m++) {
        const monthNum = m + 1;
        const monthStr = `${year}-${String(monthNum).padStart(2, '0')}`;
        
        const ordersInMonth = bookingList.filter(b => {
          const bDate = b.ngay_da ? String(b.ngay_da).split('T')[0] : '';
          const st = (b.trang_thai || '').toUpperCase();
          return bDate.startsWith(monthStr) && st !== 'DA_HUY';
        });

        const tienSan = ordersInMonth.reduce((sum, b) => sum + Number(b.tien_san || 0), 0);
        const tongTien = ordersInMonth.reduce((sum, b) => sum + Number(b.tong_tien || b.tien_san || 0), 0);
        const tienDichVu = Math.max(0, tongTien - tienSan);

        months.push({
          label: `Thg ${monthNum}`,
          tienSan,
          tienDichVu,
          tongTien,
          soDon: ordersInMonth.length
        });
      }
      return months;
    }
  }, [revenuePeriod, selectedDate, bookingList]);

  // 2. Top Dịch Vụ Bán Chạy Nhất (Pie Chart / Donut Chart / List)
  const topServicesAnalytics = useMemo(() => {
    const mapCount = new Map<number, { id: number; name: string; unit: string; price: number; quantity: number; revenue: number }>();

    serviceList.forEach(s => {
      mapCount.set(s.id, {
        id: s.id,
        name: s.ten_dich_vu,
        unit: s.don_vi_tinh || 'Món',
        price: Number(s.don_gia || 0),
        quantity: 0,
        revenue: 0
      });
    });

    serviceDetailList.forEach(d => {
      const exist = mapCount.get(Number(d.ma_dich_vu));
      if (exist) {
        exist.quantity += Number(d.so_luong || 0);
        exist.revenue += Number(d.thanh_tien || (d.so_luong * (d.gia_luc_ban || exist.price)));
      }
    });

    bookingList.forEach(b => {
      const services = (b.dich_vu_da_dung && b.dich_vu_da_dung.length > 0)
        ? b.dich_vu_da_dung
        : (b.chi_tiet_dich_vu || []);
      services.forEach((s: any) => {
        const exist = mapCount.get(Number(s.ma_dich_vu));
        if (exist && serviceDetailList.length === 0) {
          exist.quantity += Number(s.so_luong || 0);
          exist.revenue += Number(s.so_luong || 0) * Number(s.gia_luc_ban || s.don_gia || exist.price);
        }
      });
    });

    const list = Array.from(mapCount.values())
      .filter(item => item.quantity > 0 || item.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue || b.quantity - a.quantity)
      .slice(0, 5);

    if (list.length === 0 && serviceList.length > 0) {
      serviceList.slice(0, 5).forEach((s, idx) => {
        list.push({
          id: s.id,
          name: s.ten_dich_vu,
          unit: s.don_vi_tinh || 'Chai',
          price: Number(s.don_gia || 0),
          quantity: Math.max(1, 15 - idx * 3),
          revenue: Math.max(1, 15 - idx * 3) * Number(s.don_gia || 0)
        });
      });
    }

    const totalRevenue = list.reduce((sum, item) => sum + item.revenue, 0) || 1;
    return list.map((item, idx) => ({
      ...item,
      percentage: Math.round((item.revenue / totalRevenue) * 100),
      color: ['#10b981', '#0ea5e9', '#f59e0b', '#ec4899', '#8b5cf6'][idx % 5]
    }));
  }, [serviceList, serviceDetailList, bookingList]);

  // 3. Đơn Đặt Sân Mới Nhất (Recent Bookings - 5 dòng)
  const recentBookingsAnalytics = useMemo(() => {
    return [...bookingList]
      .sort((a, b) => Number(b.id || 0) - Number(a.id || 0))
      .slice(0, 5);
  }, [bookingList]);

  // 4. Trạng Thái Sân Trực Quan (Live Pitch Status Matrix)
  const livePitchStatusAnalytics = useMemo(() => {
    const curDateStr = selectedDate ? String(selectedDate).split('T')[0] : new Date().toISOString().split('T')[0];
    
    return courtList.map(court => {
      const courtBookings = bookingList.filter(b => {
        const bDate = b.ngay_da ? String(b.ngay_da).split('T')[0] : '';
        const st = (b.trang_thai || '').toUpperCase();
        return Number(b.ma_san) === court.id && bDate === curDateStr && st !== 'DA_HUY';
      });

      if (court.trang_thai === 'BAO_TRI') {
        return {
          court,
          statusType: 'BAO_TRI' as const,
          label: 'Bảo trì',
          activeBooking: null,
          todayBookingsCount: courtBookings.length,
          courtBookings
        };
      }

      const activeBooking = courtBookings.find(b => {
        const st = (b.trang_thai || '').toUpperCase();
        return (b as any).da_vao_san === 1 || st === 'DANG_DA';
      }) || courtBookings[0];

      if (activeBooking && ((activeBooking as any).da_vao_san === 1 || activeBooking.trang_thai === 'DANG_DA')) {
        return {
          court,
          statusType: 'DANG_DA' as const,
          label: 'Đang có trận',
          activeBooking,
          todayBookingsCount: courtBookings.length,
          courtBookings
        };
      }

      if (courtBookings.length > 0) {
        return {
          court,
          statusType: 'DA_DAT' as const,
          label: 'Đã có lịch',
          activeBooking: courtBookings[0],
          todayBookingsCount: courtBookings.length,
          courtBookings
        };
      }

      return {
        court,
        statusType: 'SAN_SANG' as const,
        label: 'Sẵn sàng',
        activeBooking: null,
        todayBookingsCount: 0,
        courtBookings: []
      };
    });
  }, [courtList, bookingList, selectedDate]);

  // =====================================================================
  // HANDLERS CRUD CHO TẤT CẢ CÁC BẢNG (GỌI STORED PROCEDURES)
  // =====================================================================

  // 1. Lưu Đặt Sân
  const handleSaveBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    const { ma_san, ngay_da, gio_bat_dau, gio_ket_thuc, ten_khach_hang, so_dien_thoai, ghi_chu, tien_coc, isRealtimeCheckin, so_phut, tien_san } = bookingForm;

    try {
      if (isRealtimeCheckin) {
        const res = await fetch(`${API_BASE}/dat-san/checkin-linh-hoat`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ ma_san: Number(ma_san), ten_khach_hang, so_dien_thoai, ghi_chu })
        });
        const data = await res.json();
        if (data.success) {
          setToastMessage({ type: 'success', message: `⏱️ Đã Check-in và bấm giờ thực tế cho ${ten_khach_hang}!` });
          loadAllDataFromBackend();
          return;
        }
      } else {
        const res = await fetch(`${API_BASE}/dat-san/dat-linh-hoat`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ ma_nguoi_dung: 3, ma_san: Number(ma_san), ngay_da, gio_bat_dau, gio_ket_thuc, ghi_chu, tien_coc: Number(tien_coc) })
        });
        const data = await res.json();
        if (data.success) {
          setToastMessage({ type: 'success', message: `⚡ Đã tạo đơn đặt sân [${gio_bat_dau} - ${gio_ket_thuc}] (${so_phut} phút) thành công!` });
          loadAllDataFromBackend();
          return;
        }
      }
    } catch (err) {}

    const court = courtList.find((c) => c.id === Number(ma_san));
    const newB: DonDatSan = {
      id: Math.floor(Math.random() * 900) + 100,
      ma_nguoi_dung: 3,
      ten_khach_hang: ten_khach_hang || 'Khách Đặt Sân',
      so_dien_thoai: so_dien_thoai || '0900000000',
      ma_san: Number(ma_san),
      ten_san: court?.ten_san || 'Sân bóng',
      ngay_da,
      gio_bat_dau,
      gio_ket_thuc,
      tien_san,
      tong_tien: tien_san,
      tien_coc_da_tra: Number(tien_coc),
      kieu_dat: 'LINH_HOAT',
      so_phut_da: so_phut,
      ghi_chu,
      trang_thai: Number(tien_coc) > 0 || isRealtimeCheckin ? 'DA_CHOT' : 'CHO_XAC_NHAN',
      dich_vu_da_dung: []
    };
    setBookingList([newB, ...bookingList]);
    setToastMessage({ type: 'success', message: `⚡ Đã tạo đơn đặt sân [${so_phut} phút - ${tien_san.toLocaleString('vi-VN')} đ]!` });
  };

  // State ảnh chờ upload Cloudinary khi nhấn Lưu
  const [pendingCourtImageFile, setPendingCourtImageFile] = useState<File | null>(null);

  // 2. Thêm/Sửa Sân Bóng (San_Bong)
  const handleSaveCourt = async (e: React.FormEvent) => {
    e.preventDefault();
    const { id, ten_san, ma_loai_san, don_gia_phut, trang_thai, hinh_anh } = courtModal.data;
    if (!ten_san || !ma_loai_san) {
      setToastMessage({ type: 'error', message: 'Vui lòng nhập tên sân và chọn loại sân!' });
      return;
    }

    setIsUploadingImage(true);
    let finalImageUrl = hinh_anh || '';

    try {
      const oldCourt = courtList.find((c) => c.id === id);
      const oldImageUrl = oldCourt?.hinh_anh || '';

      // Trường hợp 1: Có File ảnh từ máy tính đang chờ Lưu -> Xóa ảnh cũ & Đẩy lên Cloudinary
      if (pendingCourtImageFile) {
        if (oldImageUrl && oldImageUrl.includes('cloudinary.com')) {
          try {
            await fetch(`${API_BASE}/upload/delete`, {
              method: 'POST',
              headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: oldImageUrl })
            });
          } catch (e) {
            console.warn('Lỗi xóa ảnh cũ Cloudinary:', e);
          }
        }

        const formData = new FormData();
        formData.append('image', pendingCourtImageFile);
        const uploadRes = await fetch(`${API_BASE}/upload`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: formData
        });
        const uploadData = await uploadRes.json();
        if (uploadData.success && uploadData.url) {
          finalImageUrl = uploadData.url;
        } else {
          setToastMessage({ type: 'error', message: uploadData.message || 'Lỗi tải ảnh lên Cloudinary!' });
          setIsUploadingImage(false);
          return;
        }
      }
      // Trường hợp 2: Có Link ảnh ngoài dán vào (chưa lên Cloudinary) -> Xóa ảnh cũ & Chuyển sang Cloudinary
      else if (finalImageUrl && !finalImageUrl.includes('cloudinary.com') && !finalImageUrl.startsWith('blob:')) {
        if (oldImageUrl && oldImageUrl.includes('cloudinary.com') && oldImageUrl !== finalImageUrl) {
          try {
            await fetch(`${API_BASE}/upload/delete`, {
              method: 'POST',
              headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: oldImageUrl })
            });
          } catch (e) {
            console.warn('Lỗi xóa ảnh cũ Cloudinary:', e);
          }
        }

        const uploadRes = await fetch(`${API_BASE}/upload`, {
          method: 'POST',
          headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: finalImageUrl })
        });
        const uploadData = await uploadRes.json();
        if (uploadData.success && uploadData.url) {
          finalImageUrl = uploadData.url;
        }
      }
      // Trường hợp 3: Người dùng đã xóa ảnh -> Xóa ảnh cũ trên Cloudinary
      else if (!finalImageUrl && oldImageUrl && oldImageUrl.includes('cloudinary.com')) {
        try {
          await fetch(`${API_BASE}/upload/delete`, {
            method: 'POST',
            headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: oldImageUrl })
          });
        } catch (e) {
          console.warn('Lỗi xóa ảnh cũ Cloudinary:', e);
        }
      }

      setPendingCourtImageFile(null);

      if (courtModal.mode === 'ADD') {
        const res = await fetch(`${API_BASE}/dat-san/san-bong`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            ten_san,
            ma_loai_san: Number(ma_loai_san),
            don_gia_phut: Number(don_gia_phut || 5000),
            hinh_anh: finalImageUrl,
            trang_thai: trang_thai || 'SAN_SANG'
          })
        });
        const data = await res.json();
        if (data.success) {
          setToastMessage({ type: 'success', message: `✅ Đã thêm sân [${ten_san}] & lưu ảnh Cloudinary thành công!` });
          loadAllDataFromBackend();
          setCourtModal({ isOpen: false, mode: 'ADD', data: {} });
          return;
        }
      } else {
        const res = await fetch(`${API_BASE}/dat-san/san-bong/${id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            ten_san,
            ma_loai_san: Number(ma_loai_san),
            don_gia_phut: Number(don_gia_phut || 5000),
            hinh_anh: finalImageUrl,
            trang_thai: trang_thai || 'SAN_SANG'
          })
        });
        const data = await res.json();
        if (data.success) {
          setToastMessage({ type: 'success', message: `✅ Đã cập nhật sân [${ten_san}] & đồng bộ ảnh Cloudinary thành công!` });
          loadAllDataFromBackend();
          setCourtModal({ isOpen: false, mode: 'ADD', data: {} });
          return;
        }
      }
    } catch (err: any) {
      console.error('Lỗi lưu sân bóng:', err);
    } finally {
      setIsUploadingImage(false);
    }

    const loai = categoryList.find((l) => l.id === Number(ma_loai_san));
    if (courtModal.mode === 'ADD') {
      const newId = Math.max(...courtList.map((c) => c.id), 0) + 1;
      setCourtList([...courtList, { id: newId, ma_loai_san: Number(ma_loai_san), ten_san, ten_loai: loai?.ten_loai || '', don_gia_phut: Number(don_gia_phut || 5000), hinh_anh: finalImageUrl, trang_thai: (trang_thai as any) || 'SAN_SANG' }]);
      setToastMessage({ type: 'success', message: `✅ Đã thêm sân mới [${ten_san}]!` });
    } else {
      setCourtList(courtList.map((c) => (c.id === id ? { ...c, ten_san, ma_loai_san: Number(ma_loai_san), ten_loai: loai?.ten_loai || c.ten_loai, don_gia_phut: Number(don_gia_phut || c.don_gia_phut || 5000), hinh_anh: finalImageUrl, trang_thai: trang_thai as any } : c)));
      setToastMessage({ type: 'success', message: `✅ Đã cập nhật sân [${ten_san}]!` });
    }
    setCourtModal({ isOpen: false, mode: 'ADD', data: {} });
  };

  const handleDeleteCourt = (courtId: number, courtName?: string) => {
    openDeleteConfirm(
      'Xóa Sân Bóng',
      'Bạn có chắc chắn muốn xóa sân bóng này khỏi hệ thống? Dữ liệu lịch đặt và doanh thu liên quan có thể bị ảnh hưởng.',
      `⚽ Sân bóng: ${courtName || `ID #${courtId}`}`,
      async () => {
        try {
          const res = await fetch(`${API_BASE}/dat-san/san-bong/${courtId}`, { method: 'DELETE', headers: getAuthHeaders() });
          const data = await res.json();
          if (data.success) {
            setToastMessage({ type: 'success', message: '🗑️ Đã xóa sân bóng thành công!' });
            loadAllDataFromBackend();
            return;
          }
        } catch (err) {}
        setCourtList((prev) => prev.filter((c) => c.id !== courtId));
        setToastMessage({ type: 'success', message: '🗑️ Đã xóa sân bóng!' });
      }
    );
  };

  // 3. Thêm/Sửa Loại Sân (Loai_San)
  const handleSaveLoaiSan = async (e: React.FormEvent) => {
    e.preventDefault();
    const { id, ten_loai, mo_ta } = loaiSanModal.data;
    if (!ten_loai) {
      setToastMessage({ type: 'error', message: 'Vui lòng nhập tên loại sân!' });
      return;
    }

    try {
      if (loaiSanModal.mode === 'ADD') {
        const res = await fetch(`${API_BASE}/dat-san/loai-san`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ ten_loai, mo_ta: mo_ta || '' })
        });
        const data = await res.json();
        if (data.success) {
          setToastMessage({ type: 'success', message: `✅ Đã thêm loại sân [${ten_loai}] thành công!` });
          loadAllDataFromBackend();
          setLoaiSanModal({ isOpen: false, mode: 'ADD', data: {} });
          return;
        }
      } else {
        const res = await fetch(`${API_BASE}/dat-san/loai-san/${id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ ten_loai, mo_ta: mo_ta || '' })
        });
        const data = await res.json();
        if (data.success) {
          setToastMessage({ type: 'success', message: `✅ Đã cập nhật loại sân [${ten_loai}]!` });
          loadAllDataFromBackend();
          setLoaiSanModal({ isOpen: false, mode: 'ADD', data: {} });
          return;
        }
      }
    } catch (err) {}

    if (loaiSanModal.mode === 'ADD') {
      const newId = Math.max(...categoryList.map(l => l.id), 0) + 1;
      setCategoryList([...categoryList, { id: newId, ten_loai, mo_ta: mo_ta || '' }]);
      setToastMessage({ type: 'success', message: `✅ Đã thêm loại sân [${ten_loai}] thành công!` });
    } else {
      setCategoryList(categoryList.map(l => l.id === id ? { ...l, ten_loai, mo_ta: mo_ta || '' } : l));
      setToastMessage({ type: 'success', message: `✅ Đã cập nhật loại sân [${ten_loai}]!` });
    }
    setLoaiSanModal({ isOpen: false, mode: 'ADD', data: {} });
  };

  const handleDeleteLoaiSan = (id: number, tenLoai?: string) => {
    openDeleteConfirm(
      'Xóa Loại Sân',
      'Bạn có chắc chắn muốn xóa loại sân này?',
      `🏟️ Loại sân: ${tenLoai || `ID #${id}`}`,
      async () => {
        try {
          const res = await fetch(`${API_BASE}/dat-san/loai-san/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
          });
          const data = await res.json();
          if (data.success) {
            setToastMessage({ type: 'success', message: '🗑️ Đã xóa loại sân!' });
            loadAllDataFromBackend();
            return;
          } else {
            setToastMessage({ type: 'error', message: data.message || 'Không thể xóa loại sân này!' });
            return;
          }
        } catch (err) {}

        setCategoryList((prev) => prev.filter(l => l.id !== id));
        setToastMessage({ type: 'success', message: '🗑️ Đã xóa loại sân!' });
      }
    );
  };

  // 4. Thêm/Sửa Dịch Vụ (Dich_Vu)
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    const { id, ten_dich_vu, don_gia, don_vi_tinh, tao_phieu_nhap, so_luong_nhap, gia_nhap, ngay_nhap } = serviceModal.data;
    const finalDonViTinh = don_vi_tinh?.trim() || 'Chai';
    if (!ten_dich_vu || !don_gia) {
      setToastMessage({ type: 'error', message: 'Vui lòng điền đầy đủ tên dịch vụ và đơn giá bán!' });
      return;
    }

    const shouldCreatePhieuNhap = serviceModal.mode === 'ADD' && (tao_phieu_nhap ?? true) && Number(so_luong_nhap || 0) > 0;
    const finalTonKho = shouldCreatePhieuNhap ? Number(so_luong_nhap) : Number(serviceModal.data.ton_kho || 0);

    try {
      if (serviceModal.mode === 'ADD') {
        const res = await fetch(`${API_BASE}/dich-vu`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            ten_dich_vu: ten_dich_vu.trim(),
            don_gia: Number(don_gia),
            don_vi_tinh: finalDonViTinh,
            ton_kho: 0
          })
        });
        const data = await res.json();
        if (data.success) {
          const newId = data.data?.id || data.data?.ma_dich_vu;
          if (shouldCreatePhieuNhap && newId) {
            try {
              await fetch(`${API_BASE}/dich-vu/nhap-kho`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                  ma_dich_vu: Number(newId),
                  so_luong_nhap: Number(so_luong_nhap),
                  gia_nhap: Number(gia_nhap || 10000)
                })
              });
            } catch (errNhap) {
              console.warn('Lỗi tạo phiếu nhập kho ban đầu:', errNhap);
            }
          }
          setToastMessage({
            type: 'success',
            message: shouldCreatePhieuNhap
              ? `✅ Đã thêm dịch vụ [${ten_dich_vu}] và tạo phiếu nhập kho (${so_luong_nhap} ${finalDonViTinh})!`
              : `✅ Đã thêm dịch vụ [${ten_dich_vu}] thành công!`
          });
          loadAllDataFromBackend();
          setServiceModal({ isOpen: false, mode: 'ADD', data: { don_vi_tinh: 'Chai', ton_kho: 0 } });
          return;
        }
      } else {
        const res = await fetch(`${API_BASE}/dich-vu/${id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            ten_dich_vu: ten_dich_vu.trim(),
            don_gia: Number(don_gia),
            don_vi_tinh: finalDonViTinh,
            ton_kho: Number(serviceModal.data.ton_kho || 0)
          })
        });
        const data = await res.json();
        if (data.success) {
          setToastMessage({ type: 'success', message: `✅ Đã cập nhật dịch vụ [${ten_dich_vu}]!` });
          loadAllDataFromBackend();
          setServiceModal({ isOpen: false, mode: 'ADD', data: { don_vi_tinh: 'Chai', ton_kho: 0 } });
          return;
        }
      }
    } catch (err) {}

    // Fallback local update nếu chưa kết nối API
    if (serviceModal.mode === 'ADD') {
      const newId = Math.max(...serviceList.map((s) => s.id), 0) + 1;
      setServiceList([...serviceList, { id: newId, ten_dich_vu: ten_dich_vu.trim(), don_gia: Number(don_gia), don_vi_tinh: finalDonViTinh, ton_kho: finalTonKho }]);
      if (shouldCreatePhieuNhap) {
        const newPhieu: PhieuNhapKho = {
          id: Math.max(...inventoryList.map((p) => p.id), 0) + 1,
          ma_dich_vu: newId,
          ten_dich_vu: ten_dich_vu.trim(),
          don_vi_tinh: finalDonViTinh,
          so_luong_nhap: Number(so_luong_nhap),
          gia_nhap: Number(gia_nhap || 10000),
          tong_tien_nhap: Number(so_luong_nhap) * Number(gia_nhap || 10000),
          ngay_nhap: ngay_nhap || new Date().toISOString().split('T')[0]
        };
        setInventoryList([newPhieu, ...inventoryList]);
        setToastMessage({ type: 'success', message: `✅ Đã thêm dịch vụ [${ten_dich_vu}] và tạo phiếu nhập kho (${so_luong_nhap} ${finalDonViTinh})!` });
      } else {
        setToastMessage({ type: 'success', message: `✅ Đã thêm dịch vụ [${ten_dich_vu}]!` });
      }
    } else {
      setServiceList(serviceList.map((s) => (s.id === id ? { ...s, ten_dich_vu: ten_dich_vu.trim(), don_gia: Number(don_gia), don_vi_tinh: finalDonViTinh, ton_kho: Number(serviceModal.data.ton_kho || 0) } : s)));
      setToastMessage({ type: 'success', message: `✅ Đã cập nhật dịch vụ [${ten_dich_vu}]!` });
    }
    setServiceModal({ isOpen: false, mode: 'ADD', data: { don_vi_tinh: 'Chai', ton_kho: 0 } });
  };

  const handleDeleteService = (id: number, tenDichVu?: string) => {
    openDeleteConfirm(
      'Xóa Mặt Hàng Dịch Vụ',
      'Bạn có chắc chắn muốn xóa mặt hàng dịch vụ này?',
      `🥤 Dịch vụ: ${tenDichVu || `ID #${id}`}`,
      async () => {
        try {
          const res = await fetch(`${API_BASE}/dich-vu/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
          });
          const data = await res.json();
          if (data.success) {
            setToastMessage({ type: 'success', message: '🗑️ Đã xóa dịch vụ!' });
            loadAllDataFromBackend();
            return;
          }
        } catch (err) {}

        setServiceList((prev) => prev.filter(s => s.id !== id));
        setToastMessage({ type: 'success', message: '🗑️ Đã xóa dịch vụ!' });
      }
    );
  };


  // 6. Nhập Kho Dịch Vụ (Phieu_Nhap_Kho)
  const handleSaveImportStock = async (e: React.FormEvent) => {
    e.preventDefault();
    const { id, ma_dich_vu, so_luong_nhap, gia_nhap, ngay_nhap } = importStockModal.data;
    const dv = serviceList.find((s) => s.id === Number(ma_dich_vu || 1));

    if (importStockModal.mode === 'ADD') {
      try {
        const res = await fetch(`${API_BASE}/dich-vu/nhap-kho`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ ma_dich_vu: Number(ma_dich_vu || 1), so_luong_nhap: Number(so_luong_nhap || 50), gia_nhap: Number(gia_nhap || 12000) })
        });
        const data = await res.json();
        if (data.success) {
          setToastMessage({ type: 'success', message: `📦 Đã nhập ${so_luong_nhap} [${dv?.ten_dich_vu}] vào kho!` });
          loadAllDataFromBackend();
          setImportStockModal({ isOpen: false, mode: 'ADD', data: {} });
          return;
        }
      } catch (err) {}

      const newPhieu: PhieuNhapKho = {
        id: Math.max(...inventoryList.map((p) => p.id), 0) + 1,
        ma_dich_vu: Number(ma_dich_vu || 1),
        ten_dich_vu: dv?.ten_dich_vu || 'Nước uống',
        don_vi_tinh: dv?.don_vi_tinh || 'Chai',
        so_luong_nhap: Number(so_luong_nhap || 50),
        gia_nhap: Number(gia_nhap || 12000),
        tong_tien_nhap: Number(so_luong_nhap || 50) * Number(gia_nhap || 12000),
        ngay_nhap: ngay_nhap || new Date().toISOString().split('T')[0]
      };
      setInventoryList([newPhieu, ...inventoryList]);
      setServiceList(serviceList.map((s) => (s.id === Number(ma_dich_vu || 1) ? { ...s, ton_kho: s.ton_kho + Number(so_luong_nhap || 50) } : s)));
      setToastMessage({ type: 'success', message: `📦 Đã nhập ${so_luong_nhap} [${dv?.ten_dich_vu}] vào kho!` });
    } else {
      setInventoryList(inventoryList.map(p => p.id === id ? { ...p, so_luong_nhap: Number(so_luong_nhap), gia_nhap: Number(gia_nhap), tong_tien_nhap: Number(so_luong_nhap) * Number(gia_nhap) } : p));
      setToastMessage({ type: 'success', message: `📦 Đã cập nhật phiếu nhập kho!` });
    }
    setImportStockModal({ isOpen: false, mode: 'ADD', data: {} });
  };

  const handleDeleteInventory = (id: number, tenDichVu?: string) => {
    openDeleteConfirm(
      'Xóa Phiếu Nhập Kho',
      'Bạn có chắc chắn muốn xóa phiếu nhập kho này?',
      `📦 Phiếu nhập: #${id} ${tenDichVu ? `(${tenDichVu})` : ''}`,
      async () => {
        try {
          const res = await fetch(`${API_BASE}/dich-vu/phieu-nhap/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
          });
          const data = await res.json();
          if (data.success) {
            setToastMessage({ type: 'success', message: '🗑️ Đã xóa phiếu nhập kho!' });
            loadAllDataFromBackend();
            return;
          }
        } catch (err) {}

        setInventoryList((prev) => prev.filter(p => p.id !== id));
        setToastMessage({ type: 'success', message: '🗑️ Đã xóa phiếu nhập kho!' });
      }
    );
  };

  // 7. Thêm/Sửa Người Dùng (Nguoi_Dung)
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const { id, ho_ten, email, so_dien_thoai, vai_tro, mat_khau, anh_dai_dien } = userModal.data;
    if (!ho_ten || !email) {
      setToastMessage({ type: 'error', message: 'Vui lòng nhập họ tên và email người dùng!' });
      return;
    }

    try {
      if (userModal.mode === 'ADD') {
        const res = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            ho_ten,
            email,
            so_dien_thoai: so_dien_thoai || '',
            mat_khau: mat_khau || '123456',
            vai_tro: vai_tro || 'KHACH_HANG',
            anh_dai_dien: anh_dai_dien || ''
          })
        });
        const data = await res.json();
        if (data.success) {
          setToastMessage({ type: 'success', message: `👤 Đã tạo tài khoản [${ho_ten}] thành công!` });
          loadAllDataFromBackend();
          setUserModal({ isOpen: false, mode: 'ADD', data: {} });
          return;
        }
      } else {
        const res = await fetch(`${API_BASE}/auth/users/${id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            ho_ten,
            email,
            so_dien_thoai: so_dien_thoai || '',
            vai_tro: vai_tro || 'KHACH_HANG',
            mat_khau: mat_khau || '',
            anh_dai_dien: anh_dai_dien || ''
          })
        });
        const data = await res.json();
        if (data.success) {
          setToastMessage({ type: 'success', message: `👤 Đã cập nhật tài khoản [${ho_ten}]!` });
          loadAllDataFromBackend();
          setUserModal({ isOpen: false, mode: 'ADD', data: {} });
          return;
        }
      }
    } catch (err) {}

    if (userModal.mode === 'ADD') {
      const newId = Math.max(...userList.map((u) => u.id), 0) + 1;
      setUserList([...userList, {
        id: newId,
        ho_ten,
        email,
        so_dien_thoai: so_dien_thoai || '',
        vai_tro: vai_tro || 'KHACH_HANG',
        anh_dai_dien: anh_dai_dien || '',
        ngay_tao: new Date().toISOString().split('T')[0]
      }]);
      setToastMessage({ type: 'success', message: `👤 Đã tạo tài khoản mới [${ho_ten}]!` });
    } else {
      setUserList(userList.map((u) => (u.id === id ? {
        ...u,
        ho_ten,
        email,
        so_dien_thoai: so_dien_thoai || '',
        vai_tro: vai_tro || u.vai_tro,
        anh_dai_dien: anh_dai_dien !== undefined ? anh_dai_dien : u.anh_dai_dien
      } : u)));
      setToastMessage({ type: 'success', message: `👤 Đã cập nhật tài khoản [${ho_ten}]!` });
    }
    setUserModal({ isOpen: false, mode: 'ADD', data: {} });
  };

  const handleDeleteUser = (id: number, userName?: string) => {
    openDeleteConfirm(
      'Xóa Tài Khoản Người Dùng',
      'Bạn có chắc chắn muốn xóa tài khoản này khỏi hệ thống? Hành động này không thể hoàn tác.',
      `👤 Người dùng: ${userName || `ID #${id}`}`,
      async () => {
        try {
          const res = await fetch(`${API_BASE}/auth/users/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
          const data = await res.json();
          if (data.success) {
            setToastMessage({ type: 'success', message: '🗑️ Đã xóa tài khoản người dùng!' });
            loadAllDataFromBackend();
            return;
          }
        } catch (err) {}
        setUserList((prev) => prev.filter(u => u.id !== id));
        setToastMessage({ type: 'success', message: '🗑️ Đã xóa tài khoản!' });
      }
    );
  };

  // 8. Thêm/Sửa Vai Trò (Vai_Tro)
  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    const { MaVaiTro, TenVaiTro, MoTa } = roleModal.data;
    if (!TenVaiTro) {
      setToastMessage({ type: 'error', message: 'Vui lòng nhập tên vai trò!' });
      return;
    }

    try {
      if (roleModal.mode === 'ADD') {
        const res = await fetch(`${API_BASE}/auth/vai-tro`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ TenVaiTro, MoTa: MoTa || '' })
        });
        const data = await res.json();
        if (data.success) {
          setToastMessage({ type: 'success', message: `🛡️ Đã thêm vai trò [${TenVaiTro}] thành công!` });
          loadAllDataFromBackend();
          setRoleModal({ isOpen: false, mode: 'ADD', data: {} });
          return;
        }
      } else {
        const res = await fetch(`${API_BASE}/auth/vai-tro/${MaVaiTro}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ TenVaiTro, MoTa: MoTa || '' })
        });
        const data = await res.json();
        if (data.success) {
          setToastMessage({ type: 'success', message: `🛡️ Đã cập nhật vai trò [${TenVaiTro}]!` });
          loadAllDataFromBackend();
          setRoleModal({ isOpen: false, mode: 'ADD', data: {} });
          return;
        }
      }
    } catch (err) {}

    if (roleModal.mode === 'ADD') {
      const newId = Math.max(...roleList.map((r) => r.MaVaiTro), 0) + 1;
      setRoleList([...roleList, { MaVaiTro: newId, TenVaiTro, MoTa: MoTa || '' }]);
      setToastMessage({ type: 'success', message: `🛡️ Đã thêm vai trò mới [${TenVaiTro}]!` });
    } else {
      setRoleList(roleList.map((r) => (r.MaVaiTro === MaVaiTro ? { ...r, TenVaiTro, MoTa: MoTa || '' } : r)));
      setToastMessage({ type: 'success', message: `🛡️ Đã cập nhật vai trò [${TenVaiTro}]!` });
    }
    setRoleModal({ isOpen: false, mode: 'ADD', data: {} });
  };

  const handleDeleteRole = (id: number, roleName?: string) => {
    openDeleteConfirm(
      'Xóa Vai Trò Phân Quyền',
      'Bạn có chắc chắn muốn xóa vai trò này khỏi hệ thống?',
      `🛡️ Vai trò: ${roleName || `ID #${id}`}`,
      async () => {
        try {
          const res = await fetch(`${API_BASE}/auth/vai-tro/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
          });
          const data = await res.json();
          if (data.success) {
            setToastMessage({ type: 'success', message: '🗑️ Đã xóa vai trò!' });
            loadAllDataFromBackend();
            return;
          } else {
            setToastMessage({ type: 'error', message: data.message || 'Không thể xóa vai trò này!' });
            return;
          }
        } catch (err) {}

        setRoleList((prev) => prev.filter(r => r.MaVaiTro !== id));
        setToastMessage({ type: 'success', message: '🗑️ Đã xóa vai trò!' });
      }
    );
  };

  // 9. Quản lý Banner Quảng Cáo (Banner)
  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isStatusActive = (bannerModal.data.trang_thai as any) == 1 || (bannerModal.data.trang_thai as any) === true;
      const data = {
        ...bannerModal.data,
        trang_thai: isStatusActive ? 1 : 0
      };
      if (bannerModal.mode === 'ADD') {
        const res = await contentService.createBanner(data);
        if (res.success) {
          setToastMessage({ type: 'success', message: '🎉 Thêm Banner mới thành công!' });
        }
      } else if (data.id) {
        const res = await contentService.updateBanner(data.id, data);
        if (res.success) {
          setToastMessage({ type: 'success', message: '✅ Cập nhật Banner thành công!' });
        }
      }
      loadAllDataFromBackend();
      setBannerModal({ isOpen: false, mode: 'ADD', data: { loai_banner: 'IMAGE', thu_tu: 1, trang_thai: 1 } });
    } catch (err: any) {
      setToastMessage({ type: 'error', message: err.message || 'Lỗi lưu banner' });
    }
  };

  const handleDeleteBanner = (id: number, title?: string) => {
    openDeleteConfirm(
      'Xóa Banner Quảng Cáo',
      'Bạn có chắc chắn muốn xóa banner này khỏi hệ thống?',
      title || `#${id}`,
      async () => {
        try {
          await contentService.deleteBanner(id);
          setToastMessage({ type: 'success', message: '🗑️ Đã xóa Banner thành công!' });
          loadAllDataFromBackend();
        } catch (err: any) {
          setToastMessage({ type: 'error', message: err.message || 'Lỗi xóa banner' });
        }
      }
    );
  };

  const handleToggleBannerStatus = async (item: BannerItem) => {
    try {
      const isCurrentlyActive = (item.trang_thai as any) == 1 || (item.trang_thai as any) === true;
      const newStatus = isCurrentlyActive ? 0 : 1;
      await contentService.updateBanner(item.id, { ...item, trang_thai: newStatus });
      setToastMessage({ type: 'success', message: `Đã ${newStatus === 1 ? 'hiển thị trên trang chủ' : 'tạm ẩn'} banner!` });
      loadAllDataFromBackend();
    } catch (err: any) {
      setToastMessage({ type: 'error', message: err.message || 'Lỗi cập nhật trạng thái banner' });
    }
  };

  // 10. Quản lý Phản hồi & Liên hệ (Lien_He)
  const handleUpdateLienHeStatus = async (id?: number, currentStatus?: string) => {
    if (!id) return;
    try {
      const nextStatus = (currentStatus === 'DA_XU_LY') ? 'CHUA_XU_LY' : 'DA_XU_LY';
      await contentService.updateLienHeStatus(id, nextStatus as any);
      setLienHeList(prev => prev.map(item => item.id === id ? {
        ...item,
        trang_thai_xu_ly: nextStatus,
        trang_thai: nextStatus
      } : item));
      setToastMessage({ type: 'success', message: `✅ Đã chuyển trạng thái liên hệ sang ${nextStatus === 'DA_XU_LY' ? 'Đã xử lý' : 'Chưa xử lý'}!` });
      loadAllDataFromBackend();
    } catch (err: any) {
      setToastMessage({ type: 'error', message: err.message || 'Lỗi cập nhật liên hệ' });
    }
  };

  const handleDeleteLienHe = (id?: number, sender?: string) => {
    if (!id) return;
    openDeleteConfirm(
      'Xóa Bản Ghi Liên Hệ',
      'Bạn có chắc chắn muốn xóa phản hồi liên hệ này?',
      sender || `#${id}`,
      async () => {
        try {
          await contentService.deleteLienHe(id);
          setToastMessage({ type: 'success', message: '🗑️ Đã xóa liên hệ thành công!' });
          loadAllDataFromBackend();
        } catch (err: any) {
          setToastMessage({ type: 'error', message: err.message || 'Lỗi xóa liên hệ' });
        }
      }
    );
  };

  const handleReplyLienHeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const replyId = replyLienHeModal.data?.id;
    if (!replyId || !replyLienHeModal.noi_dung_tra_loi.trim()) {
      setToastMessage({ type: 'error', message: 'Vui lòng nhập nội dung phản hồi!' });
      return;
    }
    setReplyLienHeModal(prev => ({ ...prev, isSubmitting: true }));
    try {
      const res = await contentService.replyLienHe(replyId, {
        tieu_de_tra_loi: replyLienHeModal.tieu_de_tra_loi.trim(),
        noi_dung_tra_loi: replyLienHeModal.noi_dung_tra_loi.trim(),
      });
      if (res?.success) {
        setToastMessage({ type: 'success', message: res.message || '✅ Đã gửi phản hồi thành công!' });
        // Cập nhật trạng thái ngay lập tức trên UI sang Đã xử lý (DA_XU_LY)
        setLienHeList(prev => prev.map(item => item.id === replyId ? {
          ...item,
          trang_thai_xu_ly: 'DA_XU_LY',
          trang_thai: 'DA_XU_LY',
          noi_dung_tra_loi: replyLienHeModal.noi_dung_tra_loi.trim(),
          ngay_tra_loi: new Date().toISOString()
        } : item));
        setReplyLienHeModal({ isOpen: false, data: null, tieu_de_tra_loi: '', noi_dung_tra_loi: '', isSubmitting: false });
        loadAllDataFromBackend();
      } else {
        setToastMessage({ type: 'error', message: res?.message || 'Lỗi khi gửi phản hồi' });
      }
    } catch (err: any) {
      console.error('Lỗi trả lời liên hệ:', err);
      setToastMessage({ type: 'error', message: err.message || 'Lỗi kết nối khi gửi phản hồi' });
    } finally {
      setReplyLienHeModal(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  // 11. Quản lý Loại Tin Tức (Loai_Tin_Tuc)
  const handleSaveLoaiTin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = loaiTinModal.data;
      if (!data.ten_loai?.trim()) return;
      const isStatusActive = (data.trang_thai as any) == 1 || (data.trang_thai as any) === true;
      const payload = {
        ten_loai: data.ten_loai.trim(),
        trang_thai: isStatusActive ? 1 : 0
      };
      if (loaiTinModal.mode === 'ADD') {
        const res = await contentService.createLoaiTin(payload);
        if (res.success) {
          setToastMessage({ type: 'success', message: '🎉 Thêm loại tin tức mới thành công!' });
        }
      } else if (data.id) {
        const res = await contentService.updateLoaiTin(data.id, payload);
        if (res.success) {
          setToastMessage({ type: 'success', message: '✅ Cập nhật loại tin tức thành công!' });
        }
      }
      loadAllDataFromBackend();
      setLoaiTinModal({ isOpen: false, mode: 'ADD', data: { trang_thai: 1 } });
    } catch (err: any) {
      setToastMessage({ type: 'error', message: err.message || 'Lỗi lưu loại tin tức' });
    }
  };

  const handleToggleLoaiTinStatus = async (item: LoaiTinTuc) => {
    try {
      const isCurrentlyActive = (item.trang_thai as any) == 1 || (item.trang_thai as any) === true;
      const newStatus = isCurrentlyActive ? 0 : 1;
      await contentService.updateLoaiTin(item.id, { ten_loai: item.ten_loai, trang_thai: newStatus });
      setToastMessage({ type: 'success', message: `Đã ${newStatus === 1 ? 'kích hoạt' : 'tạm ẩn'} danh mục [${item.ten_loai}]!` });
      loadAllDataFromBackend();
    } catch (err: any) {
      setToastMessage({ type: 'error', message: err.message || 'Lỗi cập nhật trạng thái loại tin' });
    }
  };

  const handleDeleteLoaiTin = (id: number, name?: string) => {
    openDeleteConfirm(
      'Xóa Loại Tin Tức',
      'Bạn có chắc chắn muốn xóa loại tin này?',
      name || `#${id}`,
      async () => {
        try {
          await contentService.deleteLoaiTin(id);
          setToastMessage({ type: 'success', message: '🗑️ Đã xóa loại tin tức thành công!' });
          loadAllDataFromBackend();
        } catch (err: any) {
          setToastMessage({ type: 'error', message: err.message || 'Lỗi xóa loại tin tức' });
        }
      }
    );
  };

  // 12. Quản lý Bài Viết Tin Tức (Tin_Tuc)
  const handleSaveTinTuc = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = newsModal.data;
      if (!data.tieu_de?.trim() || !data.noi_dung?.trim()) return;
      const isStatusActive = (data.trang_thai as any) == 1 || (data.trang_thai as any) === true;
      const payload = {
        ...data,
        trang_thai: isStatusActive ? 1 : 0
      };
      if (newsModal.mode === 'ADD') {
        const res = await contentService.createTinTuc(payload);
        if (res.success) {
          setToastMessage({ type: 'success', message: '🎉 Thêm bài viết tin tức mới thành công!' });
        }
      } else if (data.id) {
        const res = await contentService.updateTinTuc(data.id, payload);
        if (res.success) {
          setToastMessage({ type: 'success', message: '✅ Cập nhật bài viết tin tức thành công!' });
        }
      }
      loadAllDataFromBackend();
      setNewsModal({ isOpen: false, mode: 'ADD', data: { ma_loai_tin: 1, trang_thai: 1 } });
    } catch (err: any) {
      setToastMessage({ type: 'error', message: err.message || 'Lỗi lưu tin tức' });
    }
  };

  const handleToggleTinTucStatus = async (item: TinTucItem) => {
    try {
      const isCurrentlyActive = (item.trang_thai as any) == 1 || (item.trang_thai as any) === true;
      const newStatus = isCurrentlyActive ? 0 : 1;
      await contentService.updateTinTuc(item.id, { ...item, trang_thai: newStatus });
      setToastMessage({ type: 'success', message: `Đã ${newStatus === 1 ? 'xuất bản bài viết' : 'chuyển bài viết về bản nháp'}!` });
      loadAllDataFromBackend();
    } catch (err: any) {
      setToastMessage({ type: 'error', message: err.message || 'Lỗi cập nhật trạng thái bài viết' });
    }
  };

  const handleDeleteTinTuc = (id: number, title?: string) => {
    openDeleteConfirm(
      'Xóa Bài Viết Tin Tức',
      'Bạn có chắc chắn muốn xóa bài viết này?',
      title || `#${id}`,
      async () => {
        try {
          await contentService.deleteTinTuc(id);
          setToastMessage({ type: 'success', message: '🗑️ Đã xóa bài viết tin tức thành công!' });
          loadAllDataFromBackend();
        } catch (err: any) {
          setToastMessage({ type: 'error', message: err.message || 'Lỗi xóa tin tức' });
        }
      }
    );
  };

  // 13. Quản lý Thông Tin Về Chúng Tôi (About_Us)
  const handleSaveAboutUs = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAboutUs(true);
    try {
      // Tự động bóc tách link src chuẩn nếu dán cả thẻ <iframe ...>
      let cleanMap = aboutUsData.link_map ? aboutUsData.link_map.trim() : '';
      const iframeMatch = cleanMap.match(/src=["']([^"']+)["']/i);
      if (iframeMatch && iframeMatch[1]) {
        cleanMap = iframeMatch[1];
      }

      const payload = {
        ...aboutUsData,
        link_map: cleanMap
      };

      const res = await contentService.updateAboutUs(payload);
      if (res?.success) {
        setToastMessage({ type: 'success', message: '💾 Đã lưu thông tin About Us thành công!' });
        // Tải lại dữ liệu mới nhất
        const fresh = await contentService.getAboutUs();
        if (fresh?.success && fresh.data) {
          setAboutUsData(fresh.data);
        }
      } else {
        setToastMessage({ type: 'error', message: res?.message || 'Lỗi khi lưu thông tin About Us' });
      }
    } catch (err: any) {
      console.error('Lỗi cập nhật About Us:', err);
      setToastMessage({ type: 'error', message: err.message || 'Không thể kết nối máy chủ để lưu About Us' });
    } finally {
      setIsSavingAboutUs(false);
    }
  };

  // Helper chuyển đổi giờ "HH:MM" thành số phút trong ngày
  const timeToMinutes = (t?: string): number => {
    if (!t) return 0;
    const clean = String(t).substring(0, 5);
    const [h, m] = clean.split(':').map(Number);
    return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
  };

  // Helper kiểm tra trạng thái khung giờ trong Modal Đặt Sân & Thanh Toán
  const getBookingModalSlotStatus = (timeStr: string, isEndTime: boolean = false) => {
    const selectedSanId = Number(bookingModal.data.ma_san || courtList[0]?.id || 1);
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const selectedDateStr = bookingModal.data.ngay_da 
      ? String(bookingModal.data.ngay_da).substring(0, 10) 
      : (selectedDate ? String(selectedDate).substring(0, 10) : todayStr);
    
    const curStartMin = timeToMinutes(bookingModal.data.gio_bat_dau || '17:00');
    const tMin = timeToMinutes(timeStr);

    // 1. Kiểm tra xem thời gian này đã qua trong quá khứ chưa
    const isPastDate = selectedDateStr < todayStr;
    const isTodayPastTime = (selectedDateStr === todayStr && tMin < currentMinutes);
    const isPast = isPastDate || isTodayPastTime;

    // Giờ kết thúc nhỏ hơn hoặc bằng giờ bắt đầu
    if (isEndTime && tMin <= curStartMin) {
      return {
        disabled: true,
        isHidden: true, // Ẩn đi vì <= giờ bắt đầu
        isPast: false,
        label: `${timeStr} (<= giờ bắt đầu)`,
        isBooked: false,
        isHolding: false,
        isOccupied: false
      };
    }

    // 2. Kiểm tra trong danh sách đơn đã đặt trong CSDL (bookingList)
    const currentBookingId = bookingModal.mode === 'EDIT' ? Number(bookingModal.data.id) : null;
    
    let bookedCustomerName = '';
    const isBooked = bookingList.some((b) => {
      if (currentBookingId && Number(b.id) === currentBookingId) return false;
      if (Number(b.ma_san) !== selectedSanId) return false;
      const bDate = b.ngay_da ? String(b.ngay_da).substring(0, 10) : '';
      if (bDate !== selectedDateStr) return false;
      if (['DA_HUY', 'Da Huy', 'Đã hủy', 'DA_HUY_DON'].includes(b.trang_thai)) return false;

      const bStartMin = timeToMinutes(b.gio_bat_dau);
      const bEndMin = timeToMinutes(b.gio_ket_thuc);

      if (!isEndTime) {
        // Giờ bắt đầu trùng với khoảng thời gian đã đặt [bStart, bEnd)
        const inRange = tMin >= bStartMin && tMin < bEndMin;
        if (inRange) bookedCustomerName = b.ten_khach_hang || 'Khách đặt';
        return inRange;
      } else {
        // Giờ kết thúc nằm trong khoảng (bStart, bEnd] HOẶC khoảng [curStart, tMin] bao trùm qua đơn đặt của người khác
        const inSlot = tMin > bStartMin && tMin <= bEndMin;
        const overlaps = curStartMin < bStartMin && tMin > bStartMin;
        if (inSlot || overlaps) bookedCustomerName = b.ten_khach_hang || 'Khách đặt';
        return inSlot || overlaps;
      }
    });

    // 3. Kiểm tra xem có người đang giữ chỗ realtime không (lockedSlots)
    const slotKeyRealtime = `${selectedDateStr}_${selectedSanId}_${timeStr}`;
    const isHolding = lockedSlots.includes(slotKeyRealtime);

    const isOccupied = isBooked || isHolding;

    // Kiểm tra xem đây có phải là giờ cũ của chính đơn đặt này đang được sửa không
    const savedTime = isEndTime 
      ? (bookingModal.data.gio_ket_thuc || '').substring(0, 5)
      : (bookingModal.data.gio_bat_dau || '').substring(0, 5);
    const isCurrentBookingSavedSlot = (bookingModal.mode === 'EDIT' && savedTime === timeStr);

    // Thời gian nào qua rồi thì ẩn đi (trừ khi đang sửa chính đơn đó với giờ cũ)
    if (isPast && !isCurrentBookingSavedSlot) {
      return {
        disabled: true,
        isHidden: true, // Ẩn đi
        isPast: true,
        label: `${timeStr} (Đã qua giờ)`,
        isBooked: false,
        isHolding: false,
        isOccupied: false
      };
    }

    // Thời gian nào đang có người chọn/đặt thì hiện màu cam
    if (isOccupied) {
      return {
        disabled: true,
        isHidden: false,
        isPast: false,
        label: isHolding 
          ? `${timeStr} (🟠 Đang có người chọn)` 
          : `${timeStr} (🟠 Đã có người đặt${bookedCustomerName ? ` - ${bookedCustomerName}` : ''})`,
        isBooked: isBooked,
        isHolding: isHolding,
        isOccupied: true
      };
    }

    return {
      disabled: false,
      isHidden: false,
      isPast: false,
      label: `${timeStr} (🟢 Trống)`,
      isBooked: false,
      isHolding: false,
      isOccupied: false
    };
  };

  // Helper tính tiền sân tự động = đơn giá phút * (giờ kết thúc - giờ bắt đầu)
  const calculateBookingPitchPrice = (maSan: number, start: string, end: string): number => {
    if (!start || !end) return 0;
    const court = courtList.find((c) => c.id === Number(maSan));
    const donGiaPhut = Number(court?.don_gia_phut || 0);
    if (!donGiaPhut) return 0;

    const [sh, sm] = (start || '').substring(0, 5).split(':').map(Number);
    const [eh, em] = (end || '').substring(0, 5).split(':').map(Number);

    if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return 0;

    const startMinutes = sh * 60 + sm;
    const endMinutes = eh * 60 + em;
    const diffMinutes = endMinutes - startMinutes;

    if (diffMinutes <= 0) return 0;
    return Math.round(diffMinutes * donGiaPhut);
  };

  // 9. Thêm/Sửa Đơn Đặt Sân & Thanh Toán (Don_Dat_San & Thanh_Toan)
  const handleSaveDonDatThanhToan = async (e: React.FormEvent) => {
    e.preventDefault();
    const { id, ma_san, ma_nguoi_dung, ngay_da, gio_bat_dau, gio_ket_thuc, tien_san, tong_tien, ghi_chu, trang_thai, phuong_thuc, loai_thanh_toan, so_tien, trang_thai_gd, dich_vu_list } = bookingModal.data;

    const cleanNgayDa = ngay_da ? String(ngay_da).substring(0, 10) : new Date().toISOString().substring(0, 10);
    const cleanGioBatDau = (gio_bat_dau && gio_bat_dau.length === 5) ? `${gio_bat_dau}:00` : (gio_bat_dau || '17:00:00');
    const cleanGioKetThuc = (gio_ket_thuc && gio_ket_thuc.length === 5) ? `${gio_ket_thuc}:00` : (gio_ket_thuc || '18:30:00');

    const totalTienSan = Number(tien_san || 0);
    const totalTongTien = Number(tong_tien || totalTienSan || 0);
    const statusVal = trang_thai || 'CHO_THANH_TOAN';

    let finalLoaiTT = loai_thanh_toan;
    let finalSoTien = (so_tien !== undefined && so_tien !== null) ? Number(so_tien) : undefined;

    if (statusVal === 'DA_THANH_TOAN') {
      finalLoaiTT = 'TRA_HET';
      if (finalSoTien === undefined) finalSoTien = totalTongTien;
    } else if (statusVal === 'DA_COC') {
      finalLoaiTT = 'DAT_COC';
      if (finalSoTien === undefined || finalSoTien === 0) {
        finalSoTien = Math.round(totalTongTien * 0.3);
      }
    } else {
      finalLoaiTT = null as any;
      finalSoTien = 0;
    }

    try {
      if (bookingModal.mode === 'ADD') {
        const res = await fetch(`${API_BASE}/dat-san/don-dat-thanh-toan`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            ma_san: Number(ma_san),
            ma_nguoi_dung: Number(ma_nguoi_dung || 1),
            ngay_da: cleanNgayDa,
            gio_bat_dau: cleanGioBatDau,
            gio_ket_thuc: cleanGioKetThuc,
            tien_san: totalTienSan,
            tong_tien: totalTongTien,
            ghi_chu: ghi_chu || null,
            trang_thai: statusVal,
            phuong_thuc: phuong_thuc || 'TIEN_MAT',
            loai_thanh_toan: finalLoaiTT,
            so_tien: finalSoTien,
            trang_thai_gd: trang_thai_gd || (statusVal === 'CHO_THANH_TOAN' ? 'CHO_XU_LY' : 'THANH_CONG'),
            dich_vu_list: dich_vu_list || []
          })
        });
        const data = await res.json();
        if (data.success) {
          setToastMessage({ type: 'success', message: '✅ Đã tạo đơn đặt sân & lưu CSDL SQL Server thành công!' });
          loadAllDataFromBackend();
          setBookingModal({ isOpen: false, mode: 'ADD', data: {} });
          return;
        } else {
          setToastMessage({ type: 'error', message: data.message || 'Lỗi khi thêm đơn đặt sân vào CSDL!' });
          return;
        }
      } else {
        const res = await fetch(`${API_BASE}/dat-san/don-dat-thanh-toan/${id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            ma_san: Number(ma_san),
            ma_nguoi_dung: ma_nguoi_dung ? Number(ma_nguoi_dung) : undefined,
            ngay_da: cleanNgayDa,
            gio_bat_dau: cleanGioBatDau,
            gio_ket_thuc: cleanGioKetThuc,
            tien_san: totalTienSan,
            tong_tien: totalTongTien,
            ghi_chu: ghi_chu || null,
            trang_thai: statusVal,
            phuong_thuc: phuong_thuc || 'TIEN_MAT',
            loai_thanh_toan: finalLoaiTT,
            so_tien: finalSoTien,
            trang_thai_gd: trang_thai_gd || (statusVal === 'CHO_THANH_TOAN' ? 'CHO_XU_LY' : 'THANH_CONG'),
            dich_vu_list: dich_vu_list || []
          })
        });
        const data = await res.json();
        if (data.success) {
          setToastMessage({ type: 'success', message: '✅ Đã cập nhật đơn đặt sân trong CSDL SQL Server!' });
          loadAllDataFromBackend();
          setBookingModal({ isOpen: false, mode: 'ADD', data: {} });
          return;
        } else {
          setToastMessage({ type: 'error', message: data.message || 'Lỗi khi cập nhật đơn đặt sân trong CSDL!' });
          return;
        }
      }
    } catch (err: any) {
      setToastMessage({ type: 'error', message: err.message || 'Lỗi kết nối máy chủ' });
    }
  };

  const handleDeleteDonDatThanhToan = (id: number, info?: string) => {
    openDeleteConfirm(
      'Xóa Đơn Đặt Sân & Thanh Toán',
      'Bạn có chắc chắn muốn xóa đơn đặt sân này cùng toàn bộ giao dịch thanh toán liên quan?',
      `📋 Đơn đặt sân: #${id} ${info ? `(${info})` : ''}`,
      async () => {
        try {
          const res = await fetch(`${API_BASE}/dat-san/don-dat-thanh-toan/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
          });
          const data = await res.json();
          if (data.success) {
            setToastMessage({ type: 'success', message: `🗑️ Đã xóa đơn đặt sân #${id}!` });
            loadAllDataFromBackend();
            return;
          }
        } catch (err) {}

        setBookingList((prev) => prev.filter(b => b.id !== id));
        setPaymentList((prev) => prev.filter(p => p.ma_don_dat !== id));
        setToastMessage({ type: 'success', message: `🗑️ Đã xóa đơn đặt sân #${id}!` });
      }
    );
  };

  // 10. Thêm/Sửa Hoàn Tiền (Lich_Su_Hoan_Tien)
  const handleSaveRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    const { id, ma_don_dat, so_tien_hoan, ty_le_hoan, ly_do_huy } = refundModal.data;

    try {
      if (refundModal.mode === 'ADD') {
        const res = await fetch(`${API_BASE}/thanh-toan/hoan-tien`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ ma_don_dat, so_tien_hoan, ty_le_hoan, ly_do_huy })
        });
        const data = await res.json();
        if (data.success) {
          setToastMessage({ type: 'success', message: '✅ Đã tạo phiếu hoàn tiền cọc!' });
          loadAllDataFromBackend();
          setRefundModal({ isOpen: false, mode: 'ADD', data: {} });
          return;
        }
      } else {
        const res = await fetch(`${API_BASE}/thanh-toan/hoan-tien/${id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ so_tien_hoan, ty_le_hoan, ly_do_huy })
        });
        const data = await res.json();
        if (data.success) {
          setToastMessage({ type: 'success', message: '✅ Đã cập nhật phiếu hoàn tiền!' });
          loadAllDataFromBackend();
          setRefundModal({ isOpen: false, mode: 'ADD', data: {} });
          return;
        }
      }
    } catch (err) {}

    if (refundModal.mode === 'ADD') {
      const newRef: LichSuHoanTien = {
        id: Math.max(...refundList.map(r => r.id), 0) + 1,
        ma_don_dat: Number(ma_don_dat || 101),
        ten_khach_hang: 'Khách Hủy Sân',
        so_tien_hoan: Number(so_tien_hoan || 100000),
        ty_le_hoan: Number(ty_le_hoan || 100),
        ly_do_huy: ly_do_huy || 'Hủy theo yêu cầu khách',
        ngay_hoan: new Date().toISOString().replace('T', ' ').substring(0, 16)
      };
      setRefundList([newRef, ...refundList]);
      setToastMessage({ type: 'success', message: '✅ Đã tạo phiếu hoàn tiền cọc!' });
    } else {
      setRefundList(refundList.map(r => r.id === id ? { ...r, so_tien_hoan: Number(so_tien_hoan), ty_le_hoan: Number(ty_le_hoan), ly_do_huy: ly_do_huy || r.ly_do_huy } : r));
      setToastMessage({ type: 'success', message: '✅ Đã cập nhật phiếu hoàn tiền!' });
    }
    setRefundModal({ isOpen: false, mode: 'ADD', data: {} });
  };

  const handleDeleteRefund = (id: number, info?: string) => {
    openDeleteConfirm(
      'Xóa Phiếu Hoàn Tiền',
      'Bạn có chắc chắn muốn xóa bản ghi lịch sử hoàn tiền này?',
      `💸 Phiếu hoàn tiền: #${id} ${info ? `(${info})` : ''}`,
      async () => {
        try {
          const res = await fetch(`${API_BASE}/thanh-toan/hoan-tien/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
          });
          const data = await res.json();
          if (data.success) {
            setToastMessage({ type: 'success', message: '🗑️ Đã xóa phiếu hoàn tiền!' });
            loadAllDataFromBackend();
            return;
          }
        } catch (err) {}

        setRefundList((prev) => prev.filter(r => r.id !== id));
        setToastMessage({ type: 'success', message: '🗑️ Đã xóa phiếu hoàn tiền!' });
      }
    );
  };

  // 11. Thêm/Sửa Khung Giờ (Khung_Gio)
  const handleSaveKhungGio = async (e: React.FormEvent) => {
    e.preventDefault();
    const { id, gio_bat_dau, gio_ket_thuc, nhan_hien_thi, thu_tu, trang_thai } = khungGioModal.data;

    try {
      if (khungGioModal.mode === 'ADD') {
        const res = await fetch(`${API_BASE}/dat-san/khung-gio`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ gio_bat_dau, gio_ket_thuc, nhan_hien_thi, thu_tu, trang_thai })
        });
        const data = await res.json();
        if (data.success) {
          setToastMessage({ type: 'success', message: `⏰ Đã thêm khung giờ [${nhan_hien_thi}]!` });
          loadAllDataFromBackend();
          setKhungGioModal({ isOpen: false, mode: 'ADD', data: {} });
          return;
        }
      } else {
        const res = await fetch(`${API_BASE}/dat-san/khung-gio/${id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ gio_bat_dau, gio_ket_thuc, nhan_hien_thi, thu_tu, trang_thai })
        });
        const data = await res.json();
        if (data.success) {
          setToastMessage({ type: 'success', message: `⏰ Đã cập nhật khung giờ [${nhan_hien_thi}]!` });
          loadAllDataFromBackend();
          setKhungGioModal({ isOpen: false, mode: 'ADD', data: {} });
          return;
        }
      }
    } catch (err) {}

    if (khungGioModal.mode === 'ADD') {
      const newId = Math.max(...khungGioList.map(k => k.id), 0) + 1;
      const newKG: KhungGio = {
        id: newId,
        gio_bat_dau: gio_bat_dau || '19:30',
        gio_ket_thuc: gio_ket_thuc || '20:00',
        nhan_hien_thi: nhan_hien_thi || '19h30',
        thu_tu: Number(thu_tu || 28),
        trang_thai: trang_thai !== false
      };
      setKhungGioList([...khungGioList, newKG]);
      setToastMessage({ type: 'success', message: `⏰ Đã thêm khung giờ [${nhan_hien_thi}]!` });
    } else {
      setKhungGioList(khungGioList.map(k => k.id === id ? {
        ...k,
        gio_bat_dau: gio_bat_dau || k.gio_bat_dau,
        gio_ket_thuc: gio_ket_thuc || k.gio_ket_thuc,
        nhan_hien_thi: nhan_hien_thi || k.nhan_hien_thi,
        thu_tu: Number(thu_tu ?? k.thu_tu),
        trang_thai: trang_thai !== false
      } : k));
      setToastMessage({ type: 'success', message: `⏰ Đã cập nhật khung giờ [${nhan_hien_thi}]!` });
    }
    setKhungGioModal({ isOpen: false, mode: 'ADD', data: {} });
  };

  const handleDeleteKhungGio = (id: number, slotName?: string) => {
    openDeleteConfirm(
      'Xóa Khung Giờ',
      'Bạn có chắc chắn muốn xóa khung giờ này khỏi hệ thống CSDL?',
      `⏰ Khung giờ: ${slotName || `ID #${id}`}`,
      async () => {
        try {
          const res = await fetch(`${API_BASE}/dat-san/khung-gio/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
          });
          const data = await res.json();
          if (data.success) {
            setToastMessage({ type: 'success', message: '🗑️ Đã xóa khung giờ!' });
            loadAllDataFromBackend();
            return;
          }
        } catch (err) {}

        setKhungGioList((prev) => prev.filter(k => k.id !== id));
        setToastMessage({ type: 'success', message: '🗑️ Đã xóa khung giờ!' });
      }
    );
  };

  // Nạp lại danh sách 27 khung giờ mặc định
  const handleResetKhungGio = () => {
    openDeleteConfirm(
      'Khôi Phục Khung Giờ Mặc Định',
      'Hệ thống sẽ nạp lại toàn bộ 27 mốc thời gian chuẩn từ 6h00 đến 19h30.',
      '🔄 27 Khung giờ từ 06:00 đến 19:30',
      async () => {
        try {
          const res = await fetch(`${API_BASE}/dat-san/khung-gio/reset`, {
            method: 'POST',
            headers: getAuthHeaders()
          });
          const data = await res.json();
          if (data.success) {
            setToastMessage({ type: 'success', message: '🔄 Đã khôi phục 27 khung giờ mặc định!' });
            loadAllDataFromBackend();
            return;
          }
        } catch (err) {
          setToastMessage({ type: 'error', message: 'Không thể kết nối máy chủ để đặt lại khung giờ!' });
        }
      }
    );
  };

  // 11. Bán Thêm Dịch Vụ POS (Chi_Tiet_Dich_Vu)
  const handleConfirmAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!miniPosModal.booking) return;

    const orderId = miniPosModal.booking.id;
    const dv = serviceList.find((s) => s.id === Number(miniPosModal.maDichVuChon));
    if (!dv) return;

    try {
      const res = await fetch(`${API_BASE}/dich-vu/them-vao-don`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ma_don_dat: orderId,
          dich_vu_list: [{ ma_dich_vu: dv.id, so_luong: miniPosModal.soLuong }]
        })
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage({ type: 'success', message: `🥤 Đã thêm ${miniPosModal.soLuong} [${dv.ten_dich_vu}] vào đơn #${orderId}!` });
        loadAllDataFromBackend();
        setMiniPosModal({ isOpen: false, booking: null, maDichVuChon: 1, soLuong: 1 });
        return;
      }
    } catch (err) {}

    const itemThanhTien = miniPosModal.soLuong * dv.don_gia;
    const newDetail: ChiTietDichVu = {
      id: Math.max(...serviceDetailList.map((d) => d.id), 0) + 1,
      ma_don_dat: orderId,
      ten_khach_hang: miniPosModal.booking.ten_khach_hang,
      ten_san: miniPosModal.booking.ten_san,
      ma_dich_vu: dv.id,
      ten_dich_vu: dv.ten_dich_vu,
      don_vi_tinh: dv.don_vi_tinh,
      so_luong: miniPosModal.soLuong,
      gia_luc_ban: dv.don_gia,
      thanh_tien: itemThanhTien,
      ngay_tao: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    setServiceDetailList([newDetail, ...serviceDetailList]);
    setBookingList(
      bookingList.map((b) => {
        if (b.id === orderId) {
          const curServices = [...(b.dich_vu_da_dung || [])];
          const existIdx = curServices.findIndex((s) => s.ma_dich_vu === dv.id);
          if (existIdx >= 0) {
            curServices[existIdx].so_luong += miniPosModal.soLuong;
          } else {
            curServices.push({ ma_dich_vu: dv.id, ten_dich_vu: dv.ten_dich_vu, so_luong: miniPosModal.soLuong, gia_luc_ban: dv.don_gia });
          }
          return { ...b, tong_tien: b.tong_tien + itemThanhTien, dich_vu_da_dung: curServices };
        }
        return b;
      })
    );
    setServiceList(serviceList.map((s) => (s.id === dv.id ? { ...s, ton_kho: Math.max(0, s.ton_kho - miniPosModal.soLuong) } : s)));
    setToastMessage({ type: 'success', message: `🥤 Đã thêm ${miniPosModal.soLuong} [${dv.ten_dich_vu}] vào đơn #${orderId}!` });
    setMiniPosModal({ isOpen: false, booking: null, maDichVuChon: 1, soLuong: 1 });
  };

  const handleDeleteServiceDetail = (id: number, info?: string) => {
    openDeleteConfirm(
      'Xóa Chi Tiết Dịch Vụ',
      'Bạn có chắc chắn muốn xóa chi tiết dịch vụ này khỏi hóa đơn?',
      `🥤 Chi tiết dịch vụ #${id} ${info ? `(${info})` : ''}`,
      () => {
        setServiceDetailList((prev) => prev.filter(d => d.id !== id));
        setToastMessage({ type: 'success', message: '🗑️ Đã xóa chi tiết dịch vụ!' });
      }
    );
  };

  // 12. Trả Sân & Xuất Hóa Đơn (Thanh_Toan)
  const handleConfirmCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutModal.booking) return;

    const b = checkoutModal.booking;
    const conLai = Math.max(0, (b.tong_tien || 0) - (b.tien_coc_da_tra || 0) - (checkoutModal.discount || 0));

    try {
      const res = await fetch(`${API_BASE}/thanh-toan`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ma_don_dat: b.id,
          phuong_thuc: checkoutModal.paymentMethod,
          loai_thanh_toan: 'TRA_HET',
          so_tien: conLai > 0 ? conLai : 1000,
          ma_giao_dich: `GD_PAY_${Date.now()}`
        })
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage({ type: 'success', message: `🧾 Trả sân & xuất hóa đơn hoàn tất cho đơn #${b.id}!` });
        loadAllDataFromBackend();
        setCheckoutModal({ isOpen: false, booking: null, paymentMethod: 'TIEN_MAT', discount: 0 });
        return;
      }
    } catch (err) {}

    const newPay: ThanhToan = {
      id: Math.max(...paymentList.map((p) => p.id), 0) + 1,
      ma_don_dat: b.id,
      ten_khach_hang: b.ten_khach_hang,
      so_dien_thoai: b.so_dien_thoai,
      ten_san: b.ten_san,
      ngay_da: b.ngay_da,
      so_tien: conLai,
      phuong_thuc: checkoutModal.paymentMethod,
      loai_thanh_toan: 'TRA_HET',
      ma_giao_dich: `PAY_${Date.now()}`,
      ngay_thanh_toan: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    setPaymentList([newPay, ...paymentList]);
    setBookingList(bookingList.map((item) => (item.id === b.id ? { ...item, trang_thai: 'HOAN_THANH' } : item)));
    setToastMessage({ type: 'success', message: `🧾 Trả sân & xuất hóa đơn thành công cho đơn #${b.id}!` });
    setCheckoutModal({ isOpen: false, booking: null, paymentMethod: 'TIEN_MAT', discount: 0 });
  };

  // 1. Màn hình đang kiểm tra quyền Admin
  // 1. Màn hình đang kiểm tra quyền Admin hoặc chuyển hướng về Trang chủ
  if (isAuthChecking || !isAuthorized) {
    return <SoccerLoader message="Đang kiểm tra quyền Quản trị viên..." fullScreen={true} />;
  }

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${isDarkMode ? 'dark bg-[#060e09] text-white bg-pitch-grid' : 'bg-[#f4f7f5] text-[#0f172a]'}`}>
      <Head>
        <title>Soccer 247 - Quản Lý Sân Bóng & 11 Bảng CSDL</title>
        <meta name="description" content="Hệ thống điều hành và quản trị sân bóng đá chuyên nghiệp Soccer 247: Sơ đồ sân, POS bán nước, phân quyền & báo cáo doanh thu." />
      </Head>

      {/* TOAST THÔNG BÁO NỔI */}
      {toastMessage && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-xl transition-all duration-300 animate-slide-in ${
            toastMessage.type === 'success'
              ? isDarkMode
                ? 'bg-[#0f2416] border-emerald-500 text-emerald-200'
                : 'bg-emerald-50 border-emerald-500 text-[#064e3b] font-black shadow-xl'
              : toastMessage.type === 'error'
              ? isDarkMode
                ? 'bg-rose-950 border-rose-500 text-rose-200'
                : 'bg-rose-50 border-rose-500 text-[#881337] font-black shadow-xl'
              : isDarkMode
              ? 'bg-[#0a1b24] border-cyan-500 text-cyan-200'
              : 'bg-blue-50 border-blue-500 text-[#1e3a8a] font-black shadow-xl'
          }`}
        >
          {toastMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
          {toastMessage.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
          {toastMessage.type === 'info' && <Activity className="w-5 h-5 text-cyan-600 shrink-0" />}
          <span className="text-xs sm:text-sm font-black">{toastMessage.message}</span>
          <button onClick={() => setToastMessage(null)} className={`p-1 rounded-lg transition-colors ml-1 ${isDarkMode ? 'text-slate-200 hover:bg-white/10' : 'text-slate-900 hover:bg-black/10'}`}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* HIỆU ỨNG LOADING VÒNG 12 TRÁI BANH XOAY TRÒN KHI ĐỒNG BỘ DỮ LIỆU */}
      {isLoading && <SoccerLoader message="Đang đồng bộ dữ liệu hệ thống..." fullScreen={true} />}

      <div className="flex h-screen overflow-hidden">
        {/* =====================================================================
            1. SIDEBAR PHÂN CẤP THEO 11 BẢNG CSDL (CHUẨN THEO ẢNH USER)
            ===================================================================== */}
        <aside
          className={`w-[72px] hover:w-64 xl:hover:w-72 shrink-0 border-r flex flex-col justify-between transition-all duration-300 ease-in-out z-30 group/sidebar overflow-hidden shadow-lg ${
            isDarkMode ? 'bg-[#0a150e] border-emerald-900/40 text-white' : 'bg-white border-slate-300 shadow-md text-[#0f172a]'
          }`}
        >
          <div className="flex flex-col h-full overflow-hidden">
            {/* Logo Thương Hiệu: SOCCER 247 ADMIN */}
            <div className={`p-3.5 flex items-center gap-3 border-b shrink-0 overflow-hidden ${isDarkMode ? 'border-emerald-900/40' : 'border-slate-200'}`}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-green-400 flex items-center justify-center shadow-md shadow-emerald-500/25 ring-2 ring-emerald-400/40 shrink-0 mx-auto group-hover/sidebar:mx-0 transition-all">
                <span className="text-xl">⚽</span>
              </div>
              <div className="hidden group-hover/sidebar:block whitespace-nowrap overflow-hidden transition-all duration-300">
                <h1 className="text-base font-black tracking-tight flex items-center gap-1 leading-none">
                  <span className={isDarkMode ? 'text-white' : 'text-[#0f172a]'}>SOCCER247</span>
                  <span className="text-emerald-600">ADMIN</span>
                </h1>
                <p className={`text-[9px] uppercase font-black tracking-widest mt-1 flex items-center gap-1 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Hệ Thống 11 Bảng CSDL
                </p>
              </div>
            </div>

            {/* Menu Phân Cấp Dạng Cây Theo 5 Nhóm & 11 Bảng */}
            <nav className="flex-1 p-2 space-y-3 overflow-y-auto overflow-x-hidden">
              {SIDEBAR_GROUPS.map((group, gIdx) => {
                const GroupIcon = group.groupIcon;
                return (
                  <div key={gIdx} className="space-y-1">
                    {/* Tiêu đề nhóm */}
                    <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-400 border-b border-slate-100 dark:border-emerald-950/60 pb-1 mb-1 justify-center group-hover/sidebar:justify-start">
                      <GroupIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="hidden group-hover/sidebar:inline whitespace-nowrap truncate">{group.groupTitle}</span>
                    </div>

                    {/* Danh sách mục con trong nhóm */}
                    <div className="space-y-1">
                      {group.items.map((item) => {
                        const ItemIcon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as TabType)}
                            title={item.label}
                            className={`w-full flex items-center justify-center group-hover/sidebar:justify-between px-2.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer group ${
                              isActive
                                ? isDarkMode
                                  ? 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-green-400 text-slate-950 shadow-md shadow-emerald-500/25 scale-[1.02]'
                                  : 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                                : isDarkMode
                                ? 'text-slate-200 hover:text-white hover:bg-emerald-950/40'
                                : 'text-[#0f172a] hover:text-emerald-800 hover:bg-emerald-50'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="hidden group-hover/sidebar:inline text-slate-400 group-hover:text-emerald-500 font-mono text-[10px]">├─</span>
                              <ItemIcon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white md:text-slate-950 stroke-[3]' : isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`} />
                              <span className="hidden group-hover/sidebar:inline truncate whitespace-nowrap">{item.label}</span>
                            </div>

                            {item.badge && (
                              <span
                                className={`hidden group-hover/sidebar:inline text-[9px] px-1.5 py-0.5 rounded-md font-bold shrink-0 ${
                                  isActive
                                    ? 'bg-slate-950 text-white dark:bg-slate-900 dark:text-emerald-300'
                                    : item.badge === 'HOT'
                                    ? 'bg-rose-500 text-white'
                                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </nav>

            {/* Footer Nút Quay Về Trang Chủ & User Info */}
            <div className={`p-2.5 border-t shrink-0 space-y-2 overflow-hidden ${isDarkMode ? 'border-emerald-900/40 bg-[#060e09]' : 'border-slate-200 bg-slate-50'}`}>
              {/* Nút Quay Về Trang Chủ */}
              <button
                type="button"
                onClick={() => router.push('/')}
                title="Quay về Trang Chủ"
                className={`w-full flex items-center justify-center group-hover/sidebar:justify-start gap-2.5 px-2.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm ${
                  isDarkMode
                    ? 'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/40'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}
              >
                <ArrowLeft className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="hidden group-hover/sidebar:inline whitespace-nowrap">Quay Về Trang Chủ</span>
              </button>

              {/* Thông tin Admin User */}
              <div className="flex items-center justify-between gap-2 overflow-hidden">
                <div className="flex items-center gap-2 truncate justify-center group-hover/sidebar:justify-start w-full group-hover/sidebar:w-auto">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm" title={currentAdminUser?.ho_ten || 'Admin'}>
                    {currentAdminUser?.ho_ten ? currentAdminUser.ho_ten.charAt(0).toUpperCase() : 'AD'}
                  </div>
                  <div className="hidden group-hover/sidebar:block truncate">
                    <div className={`text-xs font-black truncate ${isDarkMode ? 'text-white' : 'text-[#0f172a]'}`}>
                      {currentAdminUser?.ho_ten || 'Admin Quản Trị'}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono truncate">
                      {currentAdminUser?.email || 'admin@soccer247.vn'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleAdminLogout}
                  className={`hidden group-hover/sidebar:flex p-1.5 rounded-lg transition-all cursor-pointer shrink-0 ${isDarkMode ? 'text-rose-400 hover:bg-rose-500/20' : 'text-rose-600 hover:bg-rose-100'}`}
                  title="Đăng xuất khỏi Dashboard"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* =====================================================================
            2. KHU VỰC NỘI DUNG CHÍNH (MAIN CONTENT AREA)
            ===================================================================== */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* TOP NAVBAR HEADER (ĐÃ BỎ 2 NÚT THỪA THEO YÊU CẦU CỦA USER) */}
          <header className={`h-16 px-6 border-b flex items-center justify-between shrink-0 transition-colors duration-300 z-10 ${isDarkMode ? 'bg-[#0a150e] border-emerald-900/40' : 'bg-white border-slate-300 shadow-sm'}`}>
            <div className="flex items-center gap-2.5">
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-black uppercase tracking-wider ${isDarkMode ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-[#064e3b]'}`}>
                <span>⚽</span>
                <span>SOCCER 247</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
              <h2 className={`text-sm sm:text-base font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-[#0f172a]'}`}>
                {activeTab === 'OVERVIEW' && 'Dashboard'}
                {activeTab === 'BANNER' && 'Quản Lý Banner Quảng Cáo'}
                {activeTab === 'LIEN_HE' && 'Quản Lý Phản Hồi & Liên Hệ'}
                {activeTab === 'LOAI_TIN_TUC' && 'Quản Lý Loại Tin Tức'}
                {activeTab === 'TIN_TUC' && 'Quản Lý Tin Tức & Bài Viết'}
                {activeTab === 'SAN_BONG' && 'Danh Sách Sân Bóng'}
                {activeTab === 'LOAI_SAN_GIA' && 'Danh Sách Loại Sân'}
                {activeTab === 'DICH_VU' && 'Danh Mục Dịch Vụ'}
                {activeTab === 'PHIEU_NHAP_KHO' && 'Quản Lý Nhập Kho'}
                {activeTab === 'DON_DAT_THANH_TOAN' && 'Đơn Đặt Sân & Chi Tiết Thanh Toán'}
                {activeTab === 'HOAN_TIEN' && 'Lịch Sử Hoàn Tiền'}
                {activeTab === 'KHUNG_GIO' && 'Bảng Khung Giờ Hoạt Động'}
                {activeTab === 'NGUOI_DUNG' && 'Danh Sách Người Dùng'}
                {activeTab === 'VAI_TRO' && 'Phân Quyền & Vai Trò'}
              </h2>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Ô chọn & hiển thị ngày theo định dạng DD/MM/YYYY chuẩn Việt Nam */}
              <div className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-black shadow-sm transition-all hover:border-emerald-500 cursor-pointer ${
                isDarkMode ? 'bg-[#0e2116] border-emerald-800/60 text-emerald-200' : 'bg-white border-slate-300 text-[#0f172a]'
              }`}>
                <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-black tracking-wide font-mono text-xs">
                  {(() => {
                    if (!selectedDate) return 'Chọn ngày';
                    const parts = selectedDate.split('-');
                    if (parts.length === 3) {
                      return `${parts[2]}/${parts[1]}/${parts[0]}`; // DD/MM/YYYY
                    }
                    return selectedDate;
                  })()}
                </span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    if (!e.target.value) return;
                    setSelectedDate(e.target.value);
                    const calcs = recalculateBookingPrice(bookingForm.ma_san, e.target.value, bookingForm.gio_bat_dau, bookingForm.gio_ket_thuc);
                    setBookingForm({ ...bookingForm, ngay_da: e.target.value, ...calcs });
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </div>

              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${isDarkMode ? 'bg-[#0e2116] border-emerald-800/40 text-amber-400 hover:bg-emerald-900/40' : 'bg-white border-slate-300 text-[#0f172a] hover:bg-slate-50'}`}
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-emerald-700" />}
              </button>
            </div>
          </header>

          {/* BODY HIỂN THỊ NỘI DUNG TỪNG TAB */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

            {/* =================================================================
                TAB 1: TỔNG QUAN & DASHBOARD
                ================================================================= */}
            {activeTab === 'OVERVIEW' && (
              <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className={`p-5 rounded-2xl border transition-all hover:shadow-xl ${isDarkMode ? 'bg-[#0e2116] border-emerald-500/30 text-white' : 'bg-white border-slate-300 shadow-md text-[#0f172a]'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-400">DOANH THU HÔM NAY</span>
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-800 dark:text-emerald-300">
                        <DollarSign className="w-5 h-5 stroke-[2.5]" />
                      </div>
                    </div>
                    <h3 className="text-2xl xl:text-3xl font-black text-emerald-700 dark:text-emerald-400 tracking-tight mt-3">
                      {kpiStats.totalRevenue.toLocaleString('vi-VN')} <span className="text-base font-bold">đ</span>
                    </h3>
                    <div className="mt-2 text-xs font-bold text-[#1e293b] dark:text-slate-300">
                      <span className="text-emerald-900 dark:text-emerald-300 font-black bg-emerald-100 dark:bg-emerald-500/20 px-2 py-0.5 rounded mr-1">+18.5%</span> so với hôm qua
                    </div>
                  </div>

                  <div className={`p-5 rounded-2xl border transition-all hover:shadow-xl ${isDarkMode ? 'bg-[#0e2116] border-emerald-500/30 text-white' : 'bg-white border-slate-300 shadow-md text-[#0f172a]'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-400">TỔNG ĐƠN ĐẶT SÂN</span>
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-800 dark:text-emerald-300">
                        <Flame className="w-5 h-5 stroke-[2.5]" />
                      </div>
                    </div>
                    <h3 className="text-2xl xl:text-3xl font-black text-[#0f172a] dark:text-white tracking-tight mt-3">
                      {kpiStats.totalOrders} <span className="text-base font-bold">Đơn</span>
                    </h3>
                    <div className="mt-2 text-xs font-bold text-[#1e293b] dark:text-slate-300">
                      <span className="text-emerald-900 dark:text-emerald-300 font-black bg-emerald-100 dark:bg-emerald-500/20 px-2 py-0.5 rounded mr-1">Đã cọc: {bookingList.filter(b => (b.tien_coc_da_tra || 0) > 0).length}</span> đang hoạt động
                    </div>
                  </div>

                  <div className={`p-5 rounded-2xl border transition-all hover:shadow-xl ${isDarkMode ? 'bg-[#0e2116] border-emerald-500/30 text-white' : 'bg-white border-slate-300 shadow-md text-[#0f172a]'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-400">SÂN ĐANG ĐÁ</span>
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-800 dark:text-emerald-300">
                        <Activity className="w-5 h-5 stroke-[2.5]" />
                      </div>
                    </div>
                    <h3 className="text-2xl xl:text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight mt-3">
                      {kpiStats.activeCourtsCount} <span className="text-base font-bold">Sân</span>
                    </h3>
                    <div className="mt-2 text-xs font-bold text-[#1e293b] dark:text-slate-300">
                      <span className="text-emerald-900 dark:text-emerald-300 font-black bg-emerald-100 dark:bg-emerald-500/20 px-2 py-0.5 rounded mr-1">Sẵn sàng: {courtList.filter(c => c.trang_thai === 'SAN_SANG').length} sân</span>
                    </div>
                  </div>

                  <div className={`p-5 rounded-2xl border transition-all hover:shadow-xl ${isDarkMode ? 'bg-[#0e2116] border-emerald-500/30 text-white' : 'bg-white border-slate-300 shadow-md text-[#0f172a]'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-400">CÔNG SUẤT SỬ DỤNG</span>
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-800 dark:text-emerald-300">
                        <TrendingUp className="w-5 h-5 stroke-[2.5]" />
                      </div>
                    </div>
                    <h3 className="text-2xl xl:text-3xl font-black text-emerald-700 dark:text-emerald-400 tracking-tight mt-3">
                      {kpiStats.occupancyRate}%
                    </h3>
                    <div className="w-full bg-slate-200 dark:bg-emerald-950 rounded-full h-2 mt-3 overflow-hidden">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${kpiStats.occupancyRate}%` }} />
                    </div>
                  </div>
                </div>

                {/* =================================================================
                    LAYOUT 2X2 ANALYTICS & VISUALIZATION (THEO THIẾT KẾ YÊU CẦU)
                    ================================================================= */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                  {/* -------------------------------------------------------------
                      WIDGET 1 (HÀNG 1 - TRÁI): BIỂU ĐỒ DOANH THU (LINE / BAR CHART)
                      ------------------------------------------------------------- */}
                  <div className={`lg:col-span-7 xl:col-span-8 p-5 sm:p-6 rounded-2xl border transition-all shadow-xl flex flex-col justify-between ${
                    isDarkMode ? 'bg-[#0e2116] border-emerald-900/40 text-white' : 'bg-white border-slate-300 shadow-md text-[#0f172a]'
                  }`}>
                    {/* Header Widget 1 */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-emerald-900/30">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <BarChart3 className="w-4 h-4 stroke-[2.5]" />
                          </div>
                          <h3 className="font-black text-base text-[#0f172a] dark:text-white">
                            Biểu Đồ Doanh Thu
                          </h3>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Thống kê doanh thu tiền sân bóng và dịch vụ phát sinh
                        </p>
                      </div>

                      {/* Controls: Chọn Ngày / Tuần / Tháng & Chọn Cột / Đường */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Period Tabs */}
                        <div className="p-1 rounded-xl bg-slate-100 dark:bg-[#060e09] border border-slate-200 dark:border-emerald-950 flex items-center gap-1 text-xs font-bold">
                          {(['NGAY', 'TUAN', 'THANG'] as const).map((p) => (
                            <button
                              key={p}
                              onClick={() => setRevenuePeriod(p)}
                              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                                revenuePeriod === p
                                  ? 'bg-emerald-600 text-white shadow-sm font-black'
                                  : 'text-slate-600 dark:text-slate-400 hover:text-emerald-500'
                              }`}
                            >
                              {p === 'NGAY' ? 'Ngày' : p === 'TUAN' ? 'Tuần' : 'Tháng'}
                            </button>
                          ))}
                        </div>

                        {/* Chart Type Toggle */}
                        <div className="p-1 rounded-xl bg-slate-100 dark:bg-[#060e09] border border-slate-200 dark:border-emerald-950 flex items-center gap-1 text-xs">
                          <button
                            onClick={() => setRevenueChartType('BAR')}
                            title="Biểu đồ cột"
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                              revenueChartType === 'BAR' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-emerald-500'
                            }`}
                          >
                            <BarChart className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setRevenueChartType('LINE')}
                            title="Biểu đồ đường"
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                              revenueChartType === 'LINE' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-emerald-500'
                            }`}
                          >
                            <TrendingUp className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Summary Sub-header */}
                    <div className="flex flex-wrap items-center justify-between gap-4 my-4 p-3 rounded-xl bg-slate-50 dark:bg-[#060e09] border border-slate-200 dark:border-emerald-950/60">
                      <div>
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase">
                          Tổng doanh thu ({revenuePeriod === 'NGAY' ? '7 ngày' : revenuePeriod === 'TUAN' ? '4 tuần' : '12 tháng'}):
                        </span>
                        <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                          {revenueAnalytics.reduce((sum, item) => sum + item.tongTien, 0).toLocaleString('vi-VN')} đ
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-bold">
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-sm"></span>
                          <span className="text-slate-700 dark:text-slate-300">Tiền sân: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{revenueAnalytics.reduce((sum, item) => sum + item.tienSan, 0).toLocaleString('vi-VN')} đ</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full bg-amber-400 inline-block shadow-sm"></span>
                          <span className="text-slate-700 dark:text-slate-300">Dịch vụ: <strong className="font-mono text-amber-500">{revenueAnalytics.reduce((sum, item) => sum + item.tienDichVu, 0).toLocaleString('vi-VN')} đ</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* SVG Chart Render Area */}
                    <div className="relative w-full h-64 pt-2">
                      {(() => {
                        const maxVal = Math.max(...revenueAnalytics.map(d => d.tongTien), 100000);
                        const dataLen = revenueAnalytics.length;
                        const svgWidth = 600;
                        const svgHeight = 220;
                        const padLeft = 45;
                        const padBottom = 30;
                        const padTop = 15;
                        const padRight = 15;

                        const chartW = svgWidth - padLeft - padRight;
                        const chartH = svgHeight - padTop - padBottom;

                        // Grid steps
                        const ySteps = [0, 0.33, 0.66, 1];

                        return (
                          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full overflow-visible">
                            {/* Horizontal Grid lines */}
                            {ySteps.map((step, sIdx) => {
                              const y = padTop + chartH * (1 - step);
                              const val = Math.round(maxVal * step);
                              return (
                                <g key={sIdx}>
                                  <line
                                    x1={padLeft}
                                    y1={y}
                                    x2={svgWidth - padRight}
                                    y2={y}
                                    stroke={isDarkMode ? '#064e3b' : '#e2e8f0'}
                                    strokeDasharray="4 4"
                                    strokeWidth="1"
                                  />
                                  <text
                                    x={padLeft - 8}
                                    y={y + 3}
                                    textAnchor="end"
                                    fontSize="9"
                                    fill={isDarkMode ? '#6ee7b7' : '#64748b'}
                                    fontFamily="monospace"
                                    fontWeight="bold"
                                  >
                                    {val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : val >= 1000 ? `${Math.round(val / 1000)}k` : val}
                                  </text>
                                </g>
                              );
                            })}

                            {/* BAR CHART MODE */}
                            {revenueChartType === 'BAR' && (
                              <g>
                                {revenueAnalytics.map((item, idx) => {
                                  const colWidth = chartW / dataLen;
                                  const barWidth = Math.min(32, colWidth * 0.65);
                                  const x = padLeft + idx * colWidth + (colWidth - barWidth) / 2;

                                  const totalHeight = (item.tongTien / maxVal) * chartH;
                                  const pitchHeight = (item.tienSan / maxVal) * chartH;
                                  const serviceHeight = totalHeight - pitchHeight;

                                  const yTotal = padTop + chartH - totalHeight;
                                  const yPitch = padTop + chartH - pitchHeight;
                                  const isHovered = hoveredBarIndex === idx;

                                  return (
                                    <g
                                      key={idx}
                                      onMouseEnter={() => setHoveredBarIndex(idx)}
                                      onMouseLeave={() => setHoveredBarIndex(null)}
                                      className="cursor-pointer transition-opacity"
                                      opacity={hoveredBarIndex !== null && !isHovered ? 0.45 : 1}
                                    >
                                      {/* Background column highlight on hover */}
                                      {isHovered && (
                                        <rect
                                          x={padLeft + idx * colWidth + 2}
                                          y={padTop}
                                          width={colWidth - 4}
                                          height={chartH}
                                          fill={isDarkMode ? '#059669' : '#10b981'}
                                          opacity="0.08"
                                          rx="8"
                                        />
                                      )}

                                      {/* Service Bar (Top portion) */}
                                      {serviceHeight > 0 && (
                                        <rect
                                          x={x}
                                          y={yTotal}
                                          width={barWidth}
                                          height={serviceHeight}
                                          fill="#f59e0b"
                                          rx="4"
                                        />
                                      )}

                                      {/* Pitch Bar (Bottom portion) */}
                                      <rect
                                        x={x}
                                        y={yPitch}
                                        width={barWidth}
                                        height={Math.max(2, pitchHeight)}
                                        fill="#10b981"
                                        rx={serviceHeight <= 0 ? 4 : 2}
                                      />

                                      {/* Label on X Axis */}
                                      <text
                                        x={x + barWidth / 2}
                                        y={svgHeight - 10}
                                        textAnchor="middle"
                                        fontSize="10"
                                        fontWeight={isHovered ? 'bold' : '600'}
                                        fill={isHovered ? (isDarkMode ? '#34d399' : '#059669') : (isDarkMode ? '#94a3b8' : '#64748b')}
                                      >
                                        {item.label}
                                      </text>
                                    </g>
                                  );
                                })}
                              </g>
                            )}

                            {/* LINE CHART MODE */}
                            {revenueChartType === 'LINE' && (
                              <g>
                                {(() => {
                                  const colWidth = chartW / dataLen;
                                  const points = revenueAnalytics.map((item, idx) => {
                                    const cx = padLeft + idx * colWidth + colWidth / 2;
                                    const cy = padTop + chartH - (item.tongTien / maxVal) * chartH;
                                    return { cx, cy, item, idx };
                                  });

                                  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.cx} ${p.cy}`).join(' ');
                                  const areaD = `${pathD} L ${points[points.length - 1].cx} ${padTop + chartH} L ${points[0].cx} ${padTop + chartH} Z`;

                                  return (
                                    <>
                                      <defs>
                                        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                                          <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                                        </linearGradient>
                                      </defs>
                                      <path d={areaD} fill="url(#revenueGrad)" />
                                      <path d={pathD} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                                      {points.map((p) => {
                                        const isHovered = hoveredBarIndex === p.idx;
                                        return (
                                          <g
                                            key={p.idx}
                                            onMouseEnter={() => setHoveredBarIndex(p.idx)}
                                            onMouseLeave={() => setHoveredBarIndex(null)}
                                            className="cursor-pointer"
                                          >
                                            <circle
                                              cx={p.cx}
                                              cy={p.cy}
                                              r={isHovered ? 6 : 4}
                                              fill="#10b981"
                                              stroke="#ffffff"
                                              strokeWidth="2"
                                            />
                                            <text
                                              x={p.cx}
                                              y={svgHeight - 10}
                                              textAnchor="middle"
                                              fontSize="10"
                                              fontWeight={isHovered ? 'bold' : '600'}
                                              fill={isHovered ? (isDarkMode ? '#34d399' : '#059669') : (isDarkMode ? '#94a3b8' : '#64748b')}
                                            >
                                              {p.item.label}
                                            </text>
                                          </g>
                                        );
                                      })}
                                    </>
                                  );
                                })()}
                              </g>
                            )}
                          </svg>
                        );
                      })()}

                      {/* Tooltip Overlay when Hovered */}
                      {hoveredBarIndex !== null && revenueAnalytics[hoveredBarIndex] && (
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 px-3.5 py-2 rounded-xl bg-slate-900/95 text-white text-xs shadow-2xl border border-emerald-500/40 backdrop-blur-md animate-fade-in pointer-events-none flex items-center gap-3 font-bold">
                          <div>
                            <span className="text-emerald-400 font-black">📅 {revenueAnalytics[hoveredBarIndex].label}</span>
                            <span className="text-slate-400 ml-1.5 font-normal font-mono">({revenueAnalytics[hoveredBarIndex].soDon} đơn)</span>
                          </div>
                          <div className="h-4 w-px bg-slate-700"></div>
                          <div>Sân: <strong className="text-emerald-300 font-mono">{revenueAnalytics[hoveredBarIndex].tienSan.toLocaleString('vi-VN')} đ</strong></div>
                          <div>DV: <strong className="text-amber-400 font-mono">{revenueAnalytics[hoveredBarIndex].tienDichVu.toLocaleString('vi-VN')} đ</strong></div>
                          <div className="h-4 w-px bg-slate-700"></div>
                          <div className="text-emerald-400 font-black font-mono">Tổng: {revenueAnalytics[hoveredBarIndex].tongTien.toLocaleString('vi-VN')} đ</div>
                        </div>
                      )}
                    </div>
                  </div>


                  {/* -------------------------------------------------------------
                      WIDGET 2 (HÀNG 1 - PHẢI): TOP DỊCH VỤ BÁN CHẠY (PIE / LIST)
                      ------------------------------------------------------------- */}
                  <div className={`lg:col-span-5 xl:col-span-4 p-5 sm:p-6 rounded-2xl border transition-all shadow-xl flex flex-col justify-between ${
                    isDarkMode ? 'bg-[#0e2116] border-emerald-900/40 text-white' : 'bg-white border-slate-300 shadow-md text-[#0f172a]'
                  }`}>
                    {/* Header Widget 2 */}
                    <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-emerald-900/30">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-500">
                            <Coffee className="w-4 h-4 stroke-[2.5]" />
                          </div>
                          <h3 className="font-black text-base text-[#0f172a] dark:text-white">
                            Top Dịch Vụ Bán Chạy
                          </h3>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Các mặt hàng có doanh số và sản lượng cao nhất
                        </p>
                      </div>

                      {/* View Mode Toggle: List vs Donut */}
                      <div className="p-1 rounded-xl bg-slate-100 dark:bg-[#060e09] border border-slate-200 dark:border-emerald-950 flex items-center gap-1 text-xs">
                        <button
                          onClick={() => setServiceViewMode('LIST')}
                          title="Dạng danh sách"
                          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                            serviceViewMode === 'LIST' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:text-amber-500'
                          }`}
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setServiceViewMode('DONUT')}
                          title="Dạng biểu đồ tròn"
                          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                            serviceViewMode === 'DONUT' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:text-amber-500'
                          }`}
                        >
                          <PieChart className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Content Widget 2: LIST MODE */}
                    {serviceViewMode === 'LIST' ? (
                      <div className="space-y-3.5 my-auto py-2">
                        {topServicesAnalytics.map((item, idx) => (
                          <div key={item.id} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2 font-black truncate max-w-[180px]">
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 font-mono ${
                                  idx === 0 ? 'bg-amber-500 text-white shadow-sm' : idx === 1 ? 'bg-slate-300 text-slate-800' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-100 dark:bg-emerald-950 text-slate-600 dark:text-slate-400'
                                }`}>
                                  #{idx + 1}
                                </span>
                                <span className="truncate">{item.name}</span>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">{item.revenue.toLocaleString('vi-VN')} đ</span>
                                <span className="text-[10px] text-slate-400 ml-1.5 font-bold">({item.quantity} {item.unit})</span>
                              </div>
                            </div>
                            {/* Progress bar */}
                            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-[#060e09] overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* Content Widget 2: DONUT CHART SVG MODE */
                      <div className="flex flex-col items-center justify-center py-2 my-auto">
                        <div className="relative w-40 h-40 flex items-center justify-center">
                          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                            {(() => {
                              let accumulated = 0;
                              return topServicesAnalytics.map((item, idx) => {
                                const strokeDasharray = `${item.percentage} ${100 - item.percentage}`;
                                const strokeDashoffset = -accumulated;
                                accumulated += item.percentage;

                                return (
                                  <circle
                                    key={idx}
                                    cx="50"
                                    cy="50"
                                    r="38"
                                    fill="transparent"
                                    stroke={item.color}
                                    strokeWidth="14"
                                    strokeDasharray={strokeDasharray}
                                    strokeDashoffset={strokeDashoffset}
                                    pathLength="100"
                                    className="transition-all duration-300 hover:opacity-80"
                                  />
                                );
                              });
                            })()}
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                            <span className="text-[10px] uppercase font-bold text-slate-400">Dịch Vụ</span>
                            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">
                              {topServicesAnalytics.reduce((s, i) => s + i.quantity, 0)} Món
                            </span>
                          </div>
                        </div>

                        {/* Donut Legend */}
                        <div className="flex flex-wrap justify-center gap-2.5 mt-3 text-[11px] font-bold">
                          {topServicesAnalytics.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                              <span className="truncate max-w-[100px] text-slate-600 dark:text-slate-300">{item.name}</span>
                              <span className="text-slate-400 font-mono text-[10px]">({item.percentage}%)</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Footer Widget 2 */}
                    <div className="pt-3 border-t border-slate-200 dark:border-emerald-900/30 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-bold">Tổng doanh thu dịch vụ:</span>
                      <span className="font-black text-amber-500 font-mono">
                        {topServicesAnalytics.reduce((s, i) => s + i.revenue, 0).toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  </div>


                  {/* -------------------------------------------------------------
                      WIDGET 3 (HÀNG 2 - TRÁI): BẢNG ĐƠN ĐẶT SÂN MỚI NHẤT (5 DÒNG)
                      ------------------------------------------------------------- */}
                  <div className={`lg:col-span-7 xl:col-span-8 p-5 sm:p-6 rounded-2xl border transition-all shadow-xl flex flex-col justify-between ${
                    isDarkMode ? 'bg-[#0e2116] border-emerald-900/40 text-white' : 'bg-white border-slate-300 shadow-md text-[#0f172a]'
                  }`}>
                    {/* Header Widget 3 */}
                    <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-emerald-900/30">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <Receipt className="w-4 h-4 stroke-[2.5]" />
                          </div>
                          <h3 className="font-black text-base text-[#0f172a] dark:text-white">
                            Bảng Đơn Đặt Sân Mới Nhất
                          </h3>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          5 giao dịch đặt lịch thi đấu gần đây nhất trong hệ thống
                        </p>
                      </div>

                      <button
                        onClick={() => setActiveTab('DON_DAT_THANH_TOAN')}
                        className="px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <span>Xem Tất Cả</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Table Widget 3 */}
                    <div className="overflow-x-auto my-2">
                      <table className="w-full text-left text-xs min-w-[550px]">
                        <thead>
                          <tr className={`border-b font-black uppercase text-[10px] ${isDarkMode ? 'text-emerald-300/80 border-emerald-900/30' : 'text-slate-500 border-slate-200'}`}>
                            <th className="pb-2">Khách Hàng</th>
                            <th className="pb-2">Sân Bóng</th>
                            <th className="pb-2">Ngày & Giờ</th>
                            <th className="pb-2">Tổng Tiền</th>
                            <th className="pb-2">Trạng Thái</th>
                            <th className="pb-2 text-right">Thao Tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-emerald-900/20">
                          {recentBookingsAnalytics.map((b) => (
                            <tr key={b.id} className={isDarkMode ? 'hover:bg-emerald-950/20' : 'hover:bg-slate-50'}>
                              <td className="py-2.5 whitespace-nowrap">
                                <div className="font-bold text-[#0f172a] dark:text-white flex items-center gap-1.5">
                                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-black text-[10px] flex items-center justify-center shrink-0">
                                    {(b.ten_khach_hang || 'K').charAt(0).toUpperCase()}
                                  </div>
                                  <span className="truncate max-w-[120px]">{b.ten_khach_hang || 'Khách Đặt'}</span>
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono pl-7.5">{b.so_dien_thoai}</div>
                              </td>
                              <td className="py-2.5 whitespace-nowrap font-bold text-[#0f172a] dark:text-slate-200">
                                {b.ten_san}
                              </td>
                              <td className="py-2.5 whitespace-nowrap">
                                <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{formatVNDate(b.ngay_da)}</div>
                                <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">{b.gio_bat_dau} - {b.gio_ket_thuc}</div>
                              </td>
                              <td className="py-2.5 whitespace-nowrap font-black font-mono text-emerald-600 dark:text-emerald-400">
                                {Number(b.tong_tien || b.tien_san || 0).toLocaleString('vi-VN')} đ
                              </td>
                              <td className="py-2.5 whitespace-nowrap">
                                {(() => {
                                  const soTienDaTra = Number(b.so_tien_da_tra || b.tien_coc_da_tra || 0);
                                  const tongTien = Number(b.tong_tien || b.tien_san || 0);
                                  const raw = String(b.trang_thai || '').toUpperCase();

                                  const isFullyPaid = (tongTien > 0 && soTienDaTra >= tongTien) ||
                                    raw === 'DA_THANH_TOAN' ||
                                    raw === 'HOAN_THANH' ||
                                    raw.includes('DA_THANH_TOAN') ||
                                    raw.includes('ĐÃ THANH TOÁN') ||
                                    raw.includes('ĐÃ_THANH_TOÁN');

                                  const isDeposit = !isFullyPaid && (
                                    (soTienDaTra > 0 && soTienDaTra < tongTien) ||
                                    raw === 'DA_COC' ||
                                    raw.includes('COC') ||
                                    raw.includes('CỌC')
                                  );

                                  if (isFullyPaid) {
                                    return <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">Đã thanh toán</span>;
                                  }
                                  if (isDeposit) {
                                    return <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">Đã cọc</span>;
                                  }
                                  return <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">Chưa thanh toán</span>;
                                })()}
                              </td>
                              <td className="py-2.5 text-right whitespace-nowrap">
                                <button
                                  onClick={() => {
                                    const currentServices = (b.dich_vu_da_dung && b.dich_vu_da_dung.length > 0)
                                      ? b.dich_vu_da_dung
                                      : (b.chi_tiet_dich_vu && b.chi_tiet_dich_vu.length > 0 ? b.chi_tiet_dich_vu : []);
                                    const rawSt = (b.trang_thai || '').toUpperCase();
                                    const isUnpaid = rawSt === 'CHO_THANH_TOAN' || rawSt === 'CHUA_THANH_TOAN' || rawSt.includes('CHUA') || rawSt.includes('CHO');
                                    const isPaid = !isUnpaid && (rawSt === 'DA_THANH_TOAN' || rawSt === 'HOAN_THANH');
                                    const stChuan = isPaid ? 'DA_THANH_TOAN' : (isUnpaid ? 'CHO_THANH_TOAN' : 'DA_COC');

                                    setBookingModal({
                                      isOpen: true,
                                      mode: 'EDIT',
                                      data: {
                                        id: b.id,
                                        ma_san: b.ma_san,
                                        ma_nguoi_dung: b.ma_nguoi_dung,
                                        ngay_da: b.ngay_da,
                                        gio_bat_dau: b.gio_bat_dau,
                                        gio_ket_thuc: b.gio_ket_thuc,
                                        tien_san: b.tien_san,
                                        tong_tien: b.tong_tien,
                                        trang_thai: stChuan,
                                        ghi_chu: b.ghi_chu,
                                        phuong_thuc: b.phuong_thuc || 'TIEN_MAT',
                                        loai_thanh_toan: isPaid ? 'TRA_HET' : (stChuan === 'DA_COC' ? 'DAT_COC' : ''),
                                        so_tien: isPaid ? (b.tong_tien || 0) : (stChuan === 'DA_COC' ? (b.so_tien_da_tra || Math.round(Number(b.tong_tien || 0) * 0.3)) : 0),
                                        dich_vu_list: currentServices.map((s: any) => ({
                                          ma_dich_vu: s.ma_dich_vu,
                                          ten_dich_vu: s.ten_dich_vu,
                                          so_luong: s.so_luong,
                                          don_gia: s.gia_luc_ban || s.don_gia || 0,
                                          don_vi_tinh: s.don_vi_tinh || 'Chai'
                                        }))
                                      }
                                    });
                                  }}
                                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <Edit2 className="w-3 h-3" /> Sửa
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Footer Widget 3 */}
                    <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between">
                      <span>Hiển thị 5 đơn mới nhất</span>
                      <span className="font-bold">Tổng đơn hệ thống: <strong className="text-emerald-500 font-mono">{bookingList.length}</strong></span>
                    </div>
                  </div>


                  {/* -------------------------------------------------------------
                      WIDGET 4 (HÀNG 2 - PHẢI): TRẠNG THÁI SÂN TRỰC QUAN
                      ------------------------------------------------------------- */}
                  <div className={`lg:col-span-5 xl:col-span-4 p-5 sm:p-6 rounded-2xl border transition-all shadow-xl flex flex-col justify-between ${
                    isDarkMode ? 'bg-[#0e2116] border-emerald-900/40 text-white' : 'bg-white border-slate-300 shadow-md text-[#0f172a]'
                  }`}>
                    {/* Header Widget 4 */}
                    <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-emerald-900/30">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <Layers className="w-4 h-4 stroke-[2.5]" />
                          </div>
                          <h3 className="font-black text-base text-[#0f172a] dark:text-white">
                            Trạng Thái Sân Trực Quan
                          </h3>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Theo dõi trạng thái các sân bóng hôm nay
                        </p>
                      </div>

                      {/* Legend badges */}
                      <div className="flex items-center gap-2 text-[10px] font-black">
                        <span className="flex items-center gap-1 text-emerald-500">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                          <span>Trống</span>
                        </span>
                        <span className="flex items-center gap-1 text-rose-500">
                          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                          <span>Đang đá</span>
                        </span>
                      </div>
                    </div>

                    {/* Live Courts Grid Widget 4 */}
                    <div className="grid grid-cols-2 gap-3 my-3">
                      {livePitchStatusAnalytics.map((item) => {
                        const isPlaying = item.statusType === 'DANG_DA';
                        const isBooked = item.statusType === 'DA_DAT';
                        const isAvailable = item.statusType === 'SAN_SANG';
                        const isMaintenance = item.statusType === 'BAO_TRI';

                        return (
                          <div
                            key={item.court.id}
                            className={`p-3 rounded-2xl border relative overflow-hidden transition-all flex flex-col justify-between h-28 ${
                              isPlaying
                                ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300 shadow-sm'
                                : isBooked
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300 shadow-sm'
                                : isMaintenance
                                ? 'bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-800 text-slate-400 opacity-60'
                                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300 hover:shadow-md'
                            }`}
                          >
                            {/* Card Pitch Top Bar */}
                            <div className="flex items-center justify-between">
                              <div className="font-black text-xs text-[#0f172a] dark:text-white flex items-center gap-1">
                                <span>⚽</span>
                                <span>{item.court.ten_san}</span>
                              </div>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                                isPlaying ? 'bg-rose-500 text-white' : isBooked ? 'bg-amber-500 text-white' : isMaintenance ? 'bg-slate-500 text-white' : 'bg-emerald-600 text-white'
                              }`}>
                                {item.label}
                              </span>
                            </div>

                            {/* Card Pitch Center Info */}
                            <div className="my-1">
                              {isPlaying && item.activeBooking ? (
                                <div className="text-[10px] space-y-0.5">
                                  <div className="font-black truncate text-[#0f172a] dark:text-white">👤 {item.activeBooking.ten_khach_hang}</div>
                                  <div className="font-mono text-rose-600 dark:text-rose-400 font-bold">⏰ {item.activeBooking.gio_bat_dau} - {item.activeBooking.gio_ket_thuc}</div>
                                </div>
                              ) : isBooked && item.activeBooking ? (
                                <div className="text-[10px] space-y-0.5">
                                  <div className="font-bold truncate text-[#0f172a] dark:text-slate-200">👤 {item.activeBooking.ten_khach_hang}</div>
                                  <div className="font-mono text-amber-600 dark:text-amber-400 font-bold">⏰ {item.activeBooking.gio_bat_dau} ({item.todayBookingsCount} lịch)</div>
                                </div>
                              ) : isMaintenance ? (
                                <div className="text-[10px] italic text-slate-400">Đang bảo trì mặt cỏ</div>
                              ) : (
                                <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                                  <div>🟢 Đang trống lịch</div>
                                  <div className="font-mono text-[9px] text-slate-400">{Number(item.court.don_gia_phut).toLocaleString('vi-VN')} đ/phút</div>
                                </div>
                              )}
                            </div>

                            {/* Card Pitch Action Button */}
                            <div className="pt-1 border-t border-slate-200/50 dark:border-emerald-900/30 flex justify-end">
                              {isAvailable ? (
                                <button
                                  onClick={() => {
                                    setBookingModal({
                                      isOpen: true,
                                      mode: 'ADD',
                                      data: {
                                        ma_san: item.court.id,
                                        ma_nguoi_dung: userList[0]?.id || 1,
                                        ngay_da: selectedDate,
                                        gio_bat_dau: '17:00',
                                        gio_ket_thuc: '18:30',
                                        tien_san: 350000,
                                        tong_tien: 350000,
                                        trang_thai: 'CHO_THANH_TOAN',
                                        phuong_thuc: 'TIEN_MAT',
                                        loai_thanh_toan: '',
                                        so_tien: 0,
                                        trang_thai_gd: 'CHO_XU_LY',
                                        dich_vu_list: []
                                      }
                                    });
                                  }}
                                  className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                                >
                                  <Plus className="w-3 h-3 stroke-[3]" /> Đặt sân
                                </button>
                              ) : isPlaying && item.activeBooking ? (
                                <button
                                  onClick={() => {
                                    setCheckoutModal({
                                      isOpen: true,
                                      booking: item.activeBooking,
                                      paymentMethod: 'TIEN_MAT',
                                      discount: 0
                                    });
                                  }}
                                  className="text-[10px] font-black text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                                >
                                  <Zap className="w-3 h-3" /> Trả sân
                                </button>
                              ) : (
                                <span className="text-[10px] font-mono text-slate-400">{item.todayBookingsCount} đơn hôm nay</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Footer Widget 4 */}
                    <div className="pt-3 border-t border-slate-200 dark:border-emerald-900/30 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-bold">Tổng số sân bóng:</span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono">
                        {courtList.length} Sân ({courtList.filter(c => c.trang_thai === 'SAN_SANG').length} Sẵn sàng)
                      </span>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* =================================================================
                TAB 2: BẢNG 1 - SAN_BONG (CÓ ĐẦY ĐỦ THÊM - SỬA - XÓA DẠNG MODAL)
                ================================================================= */}
            {activeTab === 'SAN_BONG' && (
              <div className={`rounded-2xl border overflow-hidden shadow-xl ${isDarkMode ? 'bg-[#0a150e] border-emerald-900/40 text-white' : 'bg-white border-slate-300 shadow-md text-[#0f172a]'}`}>
                <div className={`p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b ${isDarkMode ? 'border-emerald-900/40 bg-[#0e2116]' : 'border-slate-200 bg-slate-50'}`}>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-[#0f172a] dark:text-white flex items-center gap-2">
                      <Layers className="w-5 h-5 text-emerald-600" />
                      Danh Sách Sân Bóng
                    </h3>
                    <p className="text-xs font-bold text-slate-500 mt-1">Quản lý danh sách sân bóng và đơn giá thuê theo từng phút</p>
                  </div>
                  <button onClick={() => setCourtModal({ isOpen: true, mode: 'ADD', data: { ma_loai_san: 1, don_gia_phut: 5000, trang_thai: 'SAN_SANG' } })} className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center gap-1.5 cursor-pointer">
                    <Plus className="w-4 h-4 stroke-[3]" /> Thêm Sân Mới
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className={`border-b font-black uppercase ${isDarkMode ? 'bg-[#060e09] text-emerald-300' : 'bg-slate-100 text-[#0f172a]'}`}>
                        <th className="p-4 w-20">HÌNH ẢNH</th>
                        <th className="p-4">TÊN SÂN BÓNG</th>
                        <th className="p-4">LOẠI SÂN</th>
                        <th className="p-4">ĐƠN GIÁ (Đ/PHÚT)</th>
                        <th className="p-4">TRẠNG THÁI</th>
                        <th className="p-4 text-right">THAO TÁC</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-emerald-900/30">
                      {courtList.map((c) => (
                        <tr key={c.id} className={isDarkMode ? 'hover:bg-emerald-950/20' : 'hover:bg-emerald-50/50'}>
                          <td className="p-4">
                            <div className="w-16 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-sm group">
                              {c.hinh_anh ? (
                                <img
                                  src={c.hinh_anh}
                                  alt={c.ten_san}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1529900240041-dd2c1bb50c1e?w=200';
                                  }}
                                />
                              ) : (
                                <SoccerBallIcon className="w-6 h-6 opacity-30 text-slate-400" />
                              )}
                            </div>
                          </td>
                          <td className="p-4 font-black text-sm text-[#0f172a] dark:text-white">⚽ {c.ten_san}</td>
                          <td className="p-4"><span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 font-bold">{c.ten_loai || 'Sân 5 người'}</span></td>
                          <td className="p-4">
                            <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                              {Number(c.don_gia_phut || 5000).toLocaleString('vi-VN')} đ/phút
                            </span>
                            <div className="text-[10px] text-slate-500 font-medium">
                              ~ {(Number(c.don_gia_phut || 5000) * 60).toLocaleString('vi-VN')} đ/giờ
                            </div>
                          </td>
                          <td className="p-4">
                            {c.trang_thai === 'SAN_SANG' ? (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black">Sẵn Sàng</span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-black">Bảo Trì</span>
                            )}
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <button onClick={() => setCourtModal({ isOpen: true, mode: 'EDIT', data: c })} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 cursor-pointer font-bold inline-flex items-center gap-1" title="Sửa sân">
                              <Edit2 className="w-3.5 h-3.5" /> Sửa
                            </button>
                            <button onClick={() => handleDeleteCourt(c.id)} className="p-2 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 cursor-pointer font-bold inline-flex items-center gap-1" title="Xóa sân">
                              <Trash2 className="w-3.5 h-3.5" /> Xóa
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* =================================================================
                TAB 4: BẢNG 2 - LOAI_SAN (DANH MỤC LOẠI SÂN)
                ================================================================= */}
            {activeTab === 'LOAI_SAN_GIA' && (
              <div className="space-y-6 animate-fade-in">
                {/* BẢNG LOAI_SAN */}
                <div className={`rounded-2xl border overflow-hidden shadow-xl ${isDarkMode ? 'bg-[#0a150e] border-emerald-900/40 text-white' : 'bg-white border-slate-300 shadow-md text-[#0f172a]'}`}>
                  <div className={`p-5 flex items-center justify-between border-b ${isDarkMode ? 'border-emerald-900/40 bg-[#0e2116]' : 'border-slate-200 bg-slate-50'}`}>
                    <div>
                      <h3 className="text-base font-black flex items-center gap-2">
                        <Layers className="w-5 h-5 text-emerald-600" /> Bảng Loại Sân (Loai_San)
                      </h3>
                      <p className="text-xs font-bold text-slate-500 mt-1">Định nghĩa các loại sân thể thao (Sân 5, Sân 7, Sân 11...)</p>
                    </div>
                    <button onClick={() => setLoaiSanModal({ isOpen: true, mode: 'ADD', data: {} })} className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center gap-1.5 cursor-pointer">
                      <Plus className="w-4 h-4 stroke-[3]" /> Thêm Loại Sân
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className={`border-b font-black uppercase ${isDarkMode ? 'bg-[#060e09] text-emerald-300' : 'bg-slate-100 text-[#0f172a]'}`}>
                          <th className="p-4">TÊN LOẠI SÂN</th>
                          <th className="p-4">MÔ TẢ CHI TIẾT</th>
                          <th className="p-4 text-right">THAO TÁC</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-emerald-900/30">
                        {categoryList.map((l) => (
                          <tr key={l.id}>
                            <td className="p-4 font-black text-sm">{l.ten_loai}</td>
                            <td className="p-4 text-slate-500">{l.mo_ta}</td>
                            <td className="p-4 text-right space-x-2">
                              <button onClick={() => setLoaiSanModal({ isOpen: true, mode: 'EDIT', data: l })} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer font-bold inline-flex items-center gap-1"><Edit2 className="w-3.5 h-3.5" /> Sửa</button>
                              <button onClick={() => handleDeleteLoaiSan(l.id)} className="p-2 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 cursor-pointer font-bold inline-flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> Xóa</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}



            {/* =================================================================
                TAB 7: BẢNG 6 - DICH_VU (CÓ ĐẦY ĐỦ THÊM SỬA XÓA)
                ================================================================= */}
            {activeTab === 'DICH_VU' && (
              <div className={`rounded-2xl border overflow-hidden shadow-xl ${isDarkMode ? 'bg-[#0a150e] border-emerald-900/40 text-white' : 'bg-white border-slate-300 shadow-md text-[#0f172a]'}`}>
                <div className={`p-5 flex items-center justify-between border-b ${isDarkMode ? 'border-emerald-900/40 bg-[#0e2116]' : 'border-slate-200 bg-slate-50'}`}>
                  <div>
                    <h3 className="text-base font-black flex items-center gap-2">
                      <PackagePlus className="w-5 h-5 text-emerald-600" /> Danh Mục Dịch Vụ & Sản Phẩm
                    </h3>
                  </div>
                  <button
                    onClick={() => setServiceModal({
                      isOpen: true,
                      mode: 'ADD',
                      data: {
                        don_vi_tinh: 'Chai',
                        ton_kho: 0,
                        tao_phieu_nhap: true,
                        so_luong_nhap: 50,
                        gia_nhap: 10000,
                        ngay_nhap: new Date().toISOString().split('T')[0]
                      }
                    })}
                    className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" /> Thêm Mặt Hàng
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className={`border-b font-black uppercase ${isDarkMode ? 'bg-[#060e09] text-emerald-300' : 'bg-slate-100 text-[#0f172a]'}`}>
                        <th className="p-4">TÊN DỊCH VỤ / SẢN PHẨM</th>
                        <th className="p-4">ĐƠN VỊ TÍNH</th>
                        <th className="p-4">ĐƠN GIÁ BÁN</th>
                        <th className="p-4">TỒN KHO</th>
                        <th className="p-4 text-right">THAO TÁC</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-emerald-900/30">
                      {serviceList.map((s) => (
                        <tr key={s.id}>
                          <td className="p-4 font-black text-sm">🥤 {s.ten_dich_vu}</td>
                          <td className="p-4 font-bold">{s.don_vi_tinh}</td>
                          <td className="p-4 font-black text-emerald-700">{Number(s.don_gia).toLocaleString('vi-VN')} đ</td>
                          <td className="p-4"><span className={`px-2.5 py-1 rounded-full font-black ${s.ton_kho > 20 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>{s.ton_kho} {s.don_vi_tinh}</span></td>
                          <td className="p-4 text-right space-x-2">
                            <button onClick={() => setServiceModal({ isOpen: true, mode: 'EDIT', data: s })} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer font-bold inline-flex items-center gap-1"><Edit2 className="w-3.5 h-3.5" /> Sửa</button>
                            <button onClick={() => handleDeleteService(s.id)} className="p-2 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 cursor-pointer font-bold inline-flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> Xóa</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* =================================================================
                TAB 8: BẢNG 7 - PHIEU_NHAP_KHO (CÓ ĐỦ THÊM SỬA XÓA)
                ================================================================= */}
            {activeTab === 'PHIEU_NHAP_KHO' && (
              <div className={`rounded-2xl border overflow-hidden shadow-xl ${isDarkMode ? 'bg-[#0a150e] border-emerald-900/40 text-white' : 'bg-white border-slate-300 shadow-md text-[#0f172a]'}`}>
                <div className={`p-5 flex items-center justify-between border-b ${isDarkMode ? 'border-emerald-900/40 bg-[#0e2116]' : 'border-slate-200 bg-slate-50'}`}>
                  <div>
                    <h3 className="text-base font-black flex items-center gap-2">
                      <Download className="w-5 h-5 text-emerald-600" /> Quản Lý Nhập Kho
                    </h3>
                  </div>
                  <button onClick={() => setImportStockModal({ isOpen: true, mode: 'ADD', data: { ma_dich_vu: serviceList[0]?.id || 1, so_luong_nhap: 50, gia_nhap: 12000, ngay_nhap: new Date().toISOString().split('T')[0] } })} className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center gap-1.5 cursor-pointer">
                    <Plus className="w-4 h-4 stroke-[3]" /> Tạo Phiếu Nhập Kho
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className={`border-b font-black uppercase ${isDarkMode ? 'bg-[#060e09] text-emerald-300' : 'bg-slate-100 text-[#0f172a]'}`}>
                        <th className="p-4">MẶT HÀNG NHẬP</th>
                        <th className="p-4">SỐ LƯỢNG NHẬP</th>
                        <th className="p-4">GIÁ VỐN NHẬP</th>
                        <th className="p-4">TỔNG TIỀN NHẬP</th>
                        <th className="p-4">NGÀY NHẬP</th>
                        <th className="p-4 text-right">THAO TÁC</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-emerald-900/30">
                      {inventoryList.map((p) => (
                        <tr key={p.id}>
                          <td className="p-4 font-black">📦 {p.ten_dich_vu}</td>
                          <td className="p-4 font-black text-emerald-700">{p.so_luong_nhap} {p.don_vi_tinh}</td>
                          <td className="p-4">{Number(p.gia_nhap).toLocaleString('vi-VN')} đ</td>
                          <td className="p-4 font-black text-emerald-800">{Number(p.tong_tien_nhap || p.so_luong_nhap * p.gia_nhap).toLocaleString('vi-VN')} đ</td>
                          <td className="p-4 font-mono font-bold text-slate-600 dark:text-slate-300">{formatVNDate(p.ngay_nhap)}</td>
                          <td className="p-4 text-right space-x-2">
                            <button onClick={() => setImportStockModal({ isOpen: true, mode: 'EDIT', data: p })} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer font-bold inline-flex items-center gap-1"><Edit2 className="w-3.5 h-3.5" /> Sửa</button>
                            <button onClick={() => handleDeleteInventory(p.id)} className="p-2 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 cursor-pointer font-bold inline-flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> Xóa</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* =================================================================
                TAB: DON_DAT_THANH_TOAN - ĐƠN ĐẶT SÂN & THANH TOÁN (CÓ ĐỦ THÊM SỬA XÓA)
                ================================================================= */}
            {activeTab === 'DON_DAT_THANH_TOAN' && (
              <div className={`rounded-2xl border overflow-hidden shadow-xl ${isDarkMode ? 'bg-[#0a150e] border-emerald-900/40 text-white' : 'bg-white border-slate-300 shadow-md text-[#0f172a]'}`}>
                <div className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b ${isDarkMode ? 'border-emerald-900/40 bg-[#0e2116]' : 'border-slate-200 bg-slate-50'}`}>
                  <div>
                    <h3 className="text-base font-black flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      Bảng Đơn Đặt Sân & Thanh Toán
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Quản lý toàn bộ thông tin lịch đặt sân, khách hàng và giao dịch thanh toán / cọc sân.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const initSan = courtList[0]?.id || 1;
                      const initStart = '17:00';
                      const initEnd = '18:30';
                      const initPrice = calculateBookingPitchPrice(initSan, initStart, initEnd) || 350000;
                      setBookingModal({
                        isOpen: true,
                        mode: 'ADD',
                        data: {
                          ma_san: initSan,
                          ma_nguoi_dung: userList[0]?.id || 1,
                          ngay_da: selectedDate,
                          gio_bat_dau: initStart,
                          gio_ket_thuc: initEnd,
                          tien_san: initPrice,
                          tong_tien: initPrice,
                          trang_thai: 'CHO_THANH_TOAN',
                          phuong_thuc: 'TIEN_MAT',
                          loai_thanh_toan: '',
                          so_tien: 0,
                          trang_thai_gd: 'CHO_XU_LY',
                          ghi_chu: 'Đặt trực tiếp tại quầy',
                          dich_vu_list: []
                        }
                      });
                    }}
                    className="px-4 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" /> Thêm Đơn & Thanh Toán
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[1050px]">
                    <thead>
                      <tr className={`border-b font-black uppercase ${isDarkMode ? 'bg-[#060e09] text-emerald-300' : 'bg-slate-100 text-[#0f172a]'}`}>
                        <th className="p-4 whitespace-nowrap">KHÁCH HÀNG / SĐT</th>
                        <th className="p-4 whitespace-nowrap">SÂN BÓNG</th>
                        <th className="p-4 whitespace-nowrap">NGÀY & GIỜ ĐÁ</th>
                        <th className="p-4 whitespace-nowrap">DỊCH VỤ ĐÃ DÙNG</th>
                        <th className="p-4 whitespace-nowrap">TỔNG TIỀN</th>
                        <th className="p-4 whitespace-nowrap">PHƯƠNG THỨC</th>
                        <th className="p-4 whitespace-nowrap">TRẠNG THÁI</th>
                        <th className="p-4">GHI CHÚ</th>
                        <th className="p-4 text-right whitespace-nowrap">THAO TÁC</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-emerald-900/30">
                      {bookingList.map((b) => {
                        const servicesUsed = (b.dich_vu_da_dung && b.dich_vu_da_dung.length > 0)
                          ? b.dich_vu_da_dung
                          : (b.chi_tiet_dich_vu && b.chi_tiet_dich_vu.length > 0 ? b.chi_tiet_dich_vu : []);
                        const totalDvPrice = servicesUsed.reduce((sum: number, item: any) => sum + (Number(item.so_luong || 0) * Number(item.gia_luc_ban || item.don_gia || 0)), 0);

                        return (
                          <tr key={b.id} className={isDarkMode ? 'hover:bg-emerald-950/20' : 'hover:bg-slate-50'}>
                            <td className="p-4 whitespace-nowrap">
                              <div className="font-black text-sm text-[#0f172a] dark:text-white">{b.ten_khach_hang || 'Khách Hàng'}</div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">{b.so_dien_thoai}</div>
                            </td>
                            <td className="p-4 whitespace-nowrap font-bold text-[#0f172a] dark:text-white">
                              {b.ten_san}
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              <div className="font-bold text-[#0f172a] dark:text-slate-100 flex items-center gap-1.5 text-xs">
                                <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span>{formatVNDate(b.ngay_da)}</span>
                              </div>
                              <div className="font-mono text-xs text-emerald-700 dark:text-emerald-400 font-black flex items-center gap-1.5 mt-1 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md w-fit border border-emerald-300 dark:border-emerald-500/20">
                                <Clock className="w-3 h-3 shrink-0" />
                                <span>{b.gio_bat_dau} - {b.gio_ket_thuc}</span>
                              </div>
                            </td>
                            <td className="p-4 min-w-[200px]">
                              {servicesUsed.length > 0 ? (
                                <div className="space-y-1">
                                  <div className="flex flex-wrap gap-1">
                                    {servicesUsed.map((dv: any, sIdx: number) => (
                                      <span
                                        key={sIdx}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50"
                                      >
                                        <span>🥤 {dv.ten_dich_vu}</span>
                                        <span className="font-black text-emerald-600 dark:text-emerald-400">x{dv.so_luong}</span>
                                      </span>
                                    ))}
                                  </div>
                                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                    Tiền DV: <span className="text-emerald-600 dark:text-emerald-400 font-black">{totalDvPrice.toLocaleString('vi-VN')} đ</span>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">— Chưa dùng —</span>
                              )}
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              <div className="font-black text-sm text-emerald-600 dark:text-emerald-400">
                                {Number(b.tong_tien || b.tien_san || 0).toLocaleString('vi-VN')} đ
                              </div>
                              {totalDvPrice > 0 && (
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                                  <span>Sân: {Number(b.tien_san || 0).toLocaleString('vi-VN')} đ</span>
                                </div>
                              )}
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase ${
                                b.phuong_thuc === 'CHUYEN_KHOAN' ? 'bg-blue-500/15 text-blue-500 border border-blue-500/30' : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              }`}>
                                {b.phuong_thuc === 'CHUYEN_KHOAN' ? 'Chuyển Khoản' : 'Tiền Mặt'}
                              </span>
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              {(() => {
                                const soTienDaTra = Number(b.so_tien_da_tra || b.tien_coc_da_tra || 0);
                                const tongTien = Number(b.tong_tien || b.tien_san || 0);
                                const raw = String(b.trang_thai || '').toUpperCase();

                                const isFullyPaid = (tongTien > 0 && soTienDaTra >= tongTien) ||
                                  raw === 'DA_THANH_TOAN' ||
                                  raw === 'HOAN_THANH' ||
                                  raw.includes('DA_THANH_TOAN') ||
                                  raw.includes('ĐÃ THANH TOÁN') ||
                                  raw.includes('ĐÃ_THANH_TOÁN');

                                const isDeposit = !isFullyPaid && (
                                  (soTienDaTra > 0 && soTienDaTra < tongTien) ||
                                  raw === 'DA_COC' ||
                                  raw.includes('COC') ||
                                  raw.includes('CỌC')
                                );

                                if (isFullyPaid) {
                                  return (
                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                      Đã thanh toán
                                    </span>
                                  );
                                }
                                if (isDeposit) {
                                  return (
                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30">
                                      Đã cọc
                                    </span>
                                  );
                                }
                                return (
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                    Chưa thanh toán
                                  </span>
                                );
                              })()}
                            </td>
                            <td className="p-4 text-slate-500 dark:text-slate-400 text-[11px] max-w-[150px] truncate">
                              {b.ghi_chu || '—'}
                            </td>
                            <td className="p-4 text-right space-x-2 whitespace-nowrap">
                              <button
                                onClick={() => {
                                  const currentServices = (b.dich_vu_da_dung && b.dich_vu_da_dung.length > 0)
                                    ? b.dich_vu_da_dung
                                    : (b.chi_tiet_dich_vu && b.chi_tiet_dich_vu.length > 0 ? b.chi_tiet_dich_vu : []);
                                  
                                  const rawSt = (b.trang_thai || '').toUpperCase();
                                  const isUnpaid = rawSt === 'CHO_THANH_TOAN' || rawSt === 'CHUA_THANH_TOAN' || rawSt === 'CHO_XAC_NHAN' || rawSt.includes('CHO_THANH_TOAN') || rawSt.includes('CHUA_THANH_TOAN') || rawSt.includes('CHƯA') || rawSt.includes('CHỜ');
                                  const isPaid = !isUnpaid && (rawSt === 'DA_THANH_TOAN' || rawSt === 'HOAN_THANH' || rawSt === 'DA_CHOT');
                                  const isDeposit = !isUnpaid && !isPaid && (rawSt === 'DA_COC' || rawSt.includes('COC'));

                                  const stChuan = isPaid ? 'DA_THANH_TOAN' : (isDeposit ? 'DA_COC' : 'CHO_THANH_TOAN');
                                  const loaiTT = isPaid ? 'TRA_HET' : (isDeposit ? 'DAT_COC' : '');
                                  const soTien = isPaid ? (b.tong_tien || b.tien_san || 0) : (isDeposit ? (b.so_tien_da_tra || Math.round(Number(b.tong_tien || b.tien_san || 0) * 0.3)) : 0);

                                  setBookingModal({
                                    isOpen: true,
                                    mode: 'EDIT',
                                    data: {
                                      id: b.id,
                                      ma_san: b.ma_san,
                                      ma_nguoi_dung: b.ma_nguoi_dung,
                                      ngay_da: b.ngay_da,
                                      gio_bat_dau: b.gio_bat_dau,
                                      gio_ket_thuc: b.gio_ket_thuc,
                                      tien_san: b.tien_san,
                                      tong_tien: b.tong_tien,
                                      trang_thai: stChuan,
                                      ghi_chu: b.ghi_chu,
                                      phuong_thuc: b.phuong_thuc || 'TIEN_MAT',
                                      loai_thanh_toan: loaiTT,
                                      so_tien: soTien,
                                      dich_vu_list: currentServices.map((s: any) => ({
                                        ma_dich_vu: s.ma_dich_vu,
                                        ten_dich_vu: s.ten_dich_vu,
                                        so_luong: s.so_luong,
                                        don_gia: s.gia_luc_ban || s.don_gia || 0,
                                        don_vi_tinh: s.don_vi_tinh || 'Chai'
                                      }))
                                    }
                                  });
                                }}
                                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer font-bold inline-flex items-center gap-1"
                              >
                                <Edit2 className="w-3.5 h-3.5" /> Sửa
                              </button>
                              <button
                                onClick={() => handleDeleteDonDatThanhToan(b.id)}
                                className="p-2 rounded-lg bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 cursor-pointer font-bold inline-flex items-center gap-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Xóa
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* =================================================================
                TAB: HOAN_TIEN - LỊCH SỬ HOÀN TIỀN (CÓ ĐỦ THÊM SỬA XÓA)
                ================================================================= */}
            {activeTab === 'HOAN_TIEN' && (
              <div className={`rounded-2xl border overflow-hidden shadow-xl ${isDarkMode ? 'bg-[#0a150e] border-emerald-900/40 text-white' : 'bg-white border-slate-300 shadow-md text-[#0f172a]'}`}>
                <div className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b ${isDarkMode ? 'border-emerald-900/40 bg-[#0e2116]' : 'border-slate-200 bg-slate-50'}`}>
                  <div>
                    <h3 className="text-base font-black flex items-center gap-2">
                      <RefreshCw className="w-5 h-5 text-rose-500" /> Bảng Lịch Sử Hoàn Tiền
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Ghi nhận và quản lý các giao dịch hoàn cọc do khách hủy lịch hoặc thay đổi sân.
                    </p>
                  </div>
                  <button
                    onClick={() => setRefundModal({
                      isOpen: true,
                      mode: 'ADD',
                      data: { ma_don_dat: bookingList[0]?.id || 101, so_tien_hoan: 150000, ty_le_hoan: 100, ly_do_huy: 'Báo hủy trước 24h theo quy định' }
                    })}
                    className="px-4 py-2.5 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-white shadow-md flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" /> Thêm Phiếu Hoàn
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[750px]">
                    <thead>
                      <tr className={`border-b font-black uppercase ${isDarkMode ? 'bg-[#060e09] text-emerald-300' : 'bg-slate-100 text-[#0f172a]'}`}>
                        <th className="p-4">KHÁCH HÀNG</th>
                        <th className="p-4">TIỀN HOÀN</th>
                        <th className="p-4">TỶ LỆ</th>
                        <th className="p-4">LÝ DO HỦY SÂN</th>
                        <th className="p-4">NGÀY HOÀN</th>
                        <th className="p-4 text-right">THAO TÁC</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-emerald-900/30">
                      {refundList.map((h) => (
                        <tr key={h.id} className={isDarkMode ? 'hover:bg-emerald-950/20' : 'hover:bg-slate-50'}>
                          <td className="p-4 font-black">{h.ten_khach_hang || 'Khách Đặt'}</td>
                          <td className="p-4 font-black text-rose-600 dark:text-rose-400 text-sm">
                            {Number(h.so_tien_hoan).toLocaleString('vi-VN')} đ
                          </td>
                          <td className="p-4 font-black">
                            <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-500">{h.ty_le_hoan}%</span>
                          </td>
                          <td className="p-4 text-slate-600 dark:text-slate-300">{h.ly_do_huy}</td>
                          <td className="p-4 font-mono text-slate-600 dark:text-slate-300 font-bold">{formatVNDate(h.ngay_hoan)}</td>
                          <td className="p-4 text-right space-x-2 whitespace-nowrap">
                            <button
                              onClick={() => setRefundModal({ isOpen: true, mode: 'EDIT', data: h })}
                              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer font-bold inline-flex items-center gap-1"
                            >
                              <Edit2 className="w-3.5 h-3.5" /> Sửa
                            </button>
                            <button
                              onClick={() => handleDeleteRefund(h.id)}
                              className="p-2 rounded-lg bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 cursor-pointer font-bold inline-flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Xóa
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* =================================================================
                TAB: KHUNG_GIO - BẢNG KHUNG GIỜ (CÓ ĐỦ THÊM SỬA XÓA)
                ================================================================= */}
            {activeTab === 'KHUNG_GIO' && (
              <div className={`rounded-2xl border overflow-hidden shadow-xl ${isDarkMode ? 'bg-[#0a150e] border-emerald-900/40 text-white' : 'bg-white border-slate-300 shadow-md text-[#0f172a]'}`}>
                <div className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b ${isDarkMode ? 'border-emerald-900/40 bg-[#0e2116]' : 'border-slate-200 bg-slate-50'}`}>
                  <div>
                    <h3 className="text-base font-black flex items-center gap-2">
                      <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      Bảng Khung Giờ Hoạt Động
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Quản lý danh sách các mốc thời gian đá bóng (6h00 - 19h30). Dữ liệu được đồng bộ trực tiếp với CSDL SQL Server.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleResetKhungGio}
                      className="px-3.5 py-2.5 rounded-xl text-xs font-black bg-slate-700 hover:bg-slate-600 text-slate-100 shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Nạp Mặc Định (27 Mốc)
                    </button>
                    <button
                      type="button"
                      onClick={() => setKhungGioModal({
                        isOpen: true,
                        mode: 'ADD',
                        data: {
                          gio_bat_dau: '19:30',
                          gio_ket_thuc: '20:00',
                          nhan_hien_thi: '19h30',
                          thu_tu: (khungGioList.length || 27) + 1,
                          trang_thai: true
                        }
                      })}
                      className="px-4 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" /> Thêm Khung Giờ
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[700px]">
                    <thead>
                      <tr className={`border-b font-black uppercase ${isDarkMode ? 'bg-[#060e09] text-emerald-300' : 'bg-slate-100 text-[#0f172a]'}`}>
                        <th className="p-4">NHÃN HIỂN THỊ</th>
                        <th className="p-4">GIỜ BẮT ĐẦU</th>
                        <th className="p-4">GIỜ KẾT THÚC</th>
                        <th className="p-4">TRẠNG THÁI</th>
                        <th className="p-4 text-right">THAO TÁC</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-emerald-900/30">
                      {khungGioList.map((k, index) => (
                        <tr key={k.id || index} className={isDarkMode ? 'hover:bg-emerald-950/20' : 'hover:bg-slate-50'}>
                          <td className="p-4">
                            <span className="font-black text-sm text-emerald-600 dark:text-emerald-400 font-mono px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                              {k.nhan_hien_thi}
                            </span>
                          </td>
                          <td className="p-4 font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">{k.gio_bat_dau}</td>
                          <td className="p-4 font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">{k.gio_ket_thuc}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                              k.trang_thai !== false ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-gray-500/20 text-gray-400'
                            }`}>
                              {k.trang_thai !== false ? '● Đang Sử Dụng' : '○ Tạm Khóa'}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-2 whitespace-nowrap">
                            <button
                              onClick={() => setKhungGioModal({ isOpen: true, mode: 'EDIT', data: k })}
                              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer font-bold inline-flex items-center gap-1"
                            >
                              <Edit2 className="w-3.5 h-3.5" /> Sửa
                            </button>
                            <button
                              onClick={() => handleDeleteKhungGio(k.id)}
                              className="p-2 rounded-lg bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 cursor-pointer font-bold inline-flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Xóa
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* =================================================================
                TAB 11: BẢNG 10 - NGUOI_DUNG (CÓ ĐỦ THÊM SỬA XÓA)
                ================================================================= */}
            {/* =================================================================
                TAB 11: BẢNG 10 - NGUOI_DUNG (CÓ ĐỦ THÊM SỬA XÓA, ẢNH, MẬT KHẨU, LỌC VAI TRÒ)
                ================================================================= */}
            {activeTab === 'NGUOI_DUNG' && (
              <div className={`rounded-2xl border overflow-hidden shadow-xl ${isDarkMode ? 'bg-[#0a150e] border-emerald-900/40 text-white' : 'bg-white border-slate-300 shadow-md text-[#0f172a]'}`}>
                <div className={`p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b ${isDarkMode ? 'border-emerald-900/40 bg-[#0e2116]' : 'border-slate-200 bg-slate-50'}`}>
                  <div>
                    <h3 className="text-base font-black flex items-center gap-2">
                      <User className="w-5 h-5 text-emerald-600" /> Danh Sách Tài Khoản Người Dùng
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Quản lý danh sách người dùng, mật khẩu, phân quyền và ảnh đại diện</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Bộ lọc vai trò */}
                    <div className="flex items-center bg-slate-200/70 dark:bg-[#060e09] p-1 rounded-xl gap-1 text-xs">
                      {([
                        { key: 'ALL', label: 'Tất cả' },
                        { key: 'ADMIN', label: '🛡️ Admin' },
                        { key: 'NHAN_VIEN', label: '💼 Nhân viên' },
                        { key: 'KHACH_HANG', label: '⚽ Khách hàng' },
                      ] as const).map((tab) => (
                        <button
                          key={tab.key}
                          onClick={() => setUserRoleFilter(tab.key)}
                          className={`px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer ${
                            userRoleFilter === tab.key
                              ? 'bg-emerald-600 text-white shadow-md'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-emerald-900/40'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setUserModal({ isOpen: true, mode: 'ADD', data: { vai_tro: 'KHACH_HANG', mat_khau: '123456' } })}
                      className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" /> Thêm Tài Khoản
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className={`border-b font-black uppercase text-[11px] tracking-wider ${isDarkMode ? 'bg-[#060e09] text-emerald-300' : 'bg-slate-100 text-[#0f172a]'}`}>
                        <th className="p-4">ẢNH & HỌ TÊN</th>
                        <th className="p-4">EMAIL ĐĂNG NHẬP</th>
                        <th className="p-4">SỐ ĐIỆN THOẠI</th>
                        <th className="p-4">MẬT KHẨU</th>
                        <th className="p-4">VAI TRÒ</th>
                        <th className="p-4 text-right">THAO TÁC</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-emerald-900/30">
                      {userList
                        .filter((u) => userRoleFilter === 'ALL' || u.vai_tro === userRoleFilter)
                        .map((u) => (
                          <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-emerald-950/30 transition-colors">
                            <td className="p-4 font-black text-sm whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                {u.anh_dai_dien ? (
                                  <img
                                    src={u.anh_dai_dien}
                                    alt={u.ho_ten}
                                    className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500 shadow-md ring-2 ring-emerald-500/20"
                                    onError={(e) => {
                                      (e.currentTarget as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(u.ho_ten || 'User') + '&background=059669&color=fff';
                                    }}
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-emerald-600/15 border-2 border-emerald-500/60 text-emerald-600 dark:text-emerald-300 font-black flex items-center justify-center text-sm shadow-inner">
                                    {(u.ho_ten || 'U').charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <div className="font-black text-slate-900 dark:text-white text-sm">{u.ho_ten}</div>
                                  <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                                    <span className="px-1.5 py-0.2 bg-slate-100 dark:bg-[#060e09] rounded border border-slate-200 dark:border-emerald-900/50">ID #{u.id}</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 font-mono text-slate-600 dark:text-slate-300 font-semibold whitespace-nowrap">{u.email}</td>
                            <td className="p-4 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">{u.so_dien_thoai || '—'}</td>
                            <td className="p-4 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1.5 font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-[#060e09] border border-slate-200 dark:border-emerald-950 px-2.5 py-1 rounded-lg text-xs font-black shadow-inner">
                                <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                                ••••••••
                              </span>
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              <span className={`whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-black text-xs shadow-sm tracking-wide border ${
                                u.vai_tro === 'ADMIN'
                                  ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-400/40'
                                  : u.vai_tro === 'NHAN_VIEN'
                                  ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-400/40'
                                  : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-400/40'
                              }`}>
                                <span>{u.vai_tro === 'ADMIN' ? '🛡️' : u.vai_tro === 'NHAN_VIEN' ? '💼' : '⚽'}</span>
                                <span>{u.vai_tro === 'ADMIN' ? 'ADMIN' : u.vai_tro === 'NHAN_VIEN' ? 'NHÂN VIÊN' : 'KHÁCH HÀNG'}</span>
                              </span>
                            </td>
                            <td className="p-4 text-right whitespace-nowrap space-x-2">
                              <button
                                onClick={() => setUserModal({ isOpen: true, mode: 'EDIT', data: { ...u, mat_khau: '' } })}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-[#0e2116] dark:hover:bg-emerald-900/50 dark:text-emerald-200 border border-slate-200 dark:border-emerald-900/40 cursor-pointer shadow-sm transition-all"
                              >
                                <Edit2 className="w-3.5 h-3.5" /> Sửa
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.id, u.ho_ten)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 cursor-pointer shadow-sm transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Xóa
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {userList.filter((u) => userRoleFilter === 'ALL' || u.vai_tro === userRoleFilter).length === 0 && (
                    <div className="p-8 text-center text-slate-400 font-bold">
                      Không có người dùng nào thuộc vai trò này.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* =================================================================
                TAB 12: BẢNG 11 - VAI_TRO (CÓ ĐỦ THÊM SỬA XÓA)
                ================================================================= */}
            {activeTab === 'VAI_TRO' && (
              <div className={`rounded-2xl border overflow-hidden shadow-xl ${isDarkMode ? 'bg-[#0a150e] border-emerald-900/40 text-white' : 'bg-white border-slate-300 shadow-md text-[#0f172a]'}`}>
                <div className={`p-5 flex items-center justify-between border-b ${isDarkMode ? 'border-emerald-900/40 bg-[#0e2116]' : 'border-slate-200 bg-slate-50'}`}>
                  <div>
                    <h3 className="text-base font-black flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" /> Phân Quyền & Vai Trò
                    </h3>
                  </div>
                  <button onClick={() => setRoleModal({ isOpen: true, mode: 'ADD', data: {} })} className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center gap-1.5 cursor-pointer">
                    <Plus className="w-4 h-4 stroke-[3]" /> Thêm Vai Trò
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className={`border-b font-black uppercase ${isDarkMode ? 'bg-[#060e09] text-emerald-300' : 'bg-slate-100 text-[#0f172a]'}`}>
                        <th className="p-4">TÊN VAI TRÒ</th>
                        <th className="p-4">MÔ TẢ QUYỀN HẠN</th>
                        <th className="p-4 text-right">THAO TÁC</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-emerald-900/30">
                      {roleList.map((r) => (
                        <tr key={r.MaVaiTro}>
                          <td className="p-4 font-black text-sm text-purple-700 dark:text-purple-300">🛡️ {r.TenVaiTro}</td>
                          <td className="p-4 text-slate-600 dark:text-slate-300">{r.MoTa}</td>
                          <td className="p-4 text-right space-x-2">
                            <button onClick={() => setRoleModal({ isOpen: true, mode: 'EDIT', data: r })} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer font-bold inline-flex items-center gap-1"><Edit2 className="w-3.5 h-3.5" /> Sửa</button>
                            <button onClick={() => handleDeleteRole(r.MaVaiTro)} className="p-2 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 cursor-pointer font-bold inline-flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> Xóa</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* =================================================================
                TAB: ABOUT_US - QUẢN LÝ THÔNG TIN VỀ CHÚNG TÔI
                ================================================================= */}
            {activeTab === 'ABOUT_US' && (
              <div className={`rounded-2xl border overflow-hidden shadow-xl ${isDarkMode ? 'bg-[#0a150e] border-emerald-900/40 text-white' : 'bg-white border-slate-300 shadow-md text-[#0f172a]'}`}>
                <div className={`p-5 flex flex-wrap items-center justify-between gap-3 border-b ${isDarkMode ? 'border-emerald-900/40 bg-[#0e2116]' : 'border-slate-200 bg-slate-50'}`}>
                  <div>
                    <h3 className="text-base font-black flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-emerald-500" /> Quản Lý Thông Tin Về Chúng Tôi (About Us)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Cập nhật nội dung giới thiệu trung tâm, số hotline, email, địa chỉ và bản đồ hiển thị trên trang About Us và chân trang.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href="/about-us"
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-700 hover:bg-slate-600 text-slate-200 shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Xem Trang Thực Tế
                    </a>
                    <button
                      type="submit"
                      form="form-about-us-manage"
                      disabled={isSavingAboutUs}
                      className="px-5 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center gap-1.5 cursor-pointer transition-all hover:scale-[1.02] disabled:opacity-60"
                    >
                      {isSavingAboutUs ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      <span>{isSavingAboutUs ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
                    </button>
                  </div>
                </div>

                <form id="form-about-us-manage" onSubmit={handleSaveAboutUs} className="p-6 space-y-6 text-xs">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* CỘT TRÁI: THÔNG TIN CƠ BẢN & LIÊN HỆ */}
                    <div className="lg:col-span-6 space-y-4">
                      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 border-b pb-2 border-slate-200 dark:border-emerald-900/40">
                        <MapPin className="w-4 h-4" /> Thông Tin Cơ Bản & Kênh Liên Hệ
                      </div>

                      <div>
                        <label className="block font-black uppercase mb-1 text-slate-600 dark:text-slate-300">
                          Tên Trung Tâm Thể Thao <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={aboutUsData.ten_trung_tam || ''}
                          onChange={(e) => setAboutUsData({ ...aboutUsData, ten_trung_tam: e.target.value })}
                          placeholder="Ví dụ: Trung Tâm Thể Thao Soccer247"
                          className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-black uppercase mb-1 text-slate-600 dark:text-slate-300">
                            Hotline Đặt Sân <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={aboutUsData.hotline || ''}
                            onChange={(e) => setAboutUsData({ ...aboutUsData, hotline: e.target.value })}
                            placeholder="0816344504"
                            className={`w-full p-2.5 rounded-xl border font-bold font-mono ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                          />
                        </div>
                        <div>
                          <label className="block font-black uppercase mb-1 text-slate-600 dark:text-slate-300">
                            Email Hỗ Trợ
                          </label>
                          <input
                            type="email"
                            value={aboutUsData.email || ''}
                            onChange={(e) => setAboutUsData({ ...aboutUsData, email: e.target.value })}
                            placeholder="sinhvienxoan@gmail.com"
                            className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-black uppercase mb-1 text-slate-600 dark:text-slate-300">
                          Địa Chỉ Cụm Sân <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={aboutUsData.dia_chi || ''}
                          onChange={(e) => setAboutUsData({ ...aboutUsData, dia_chi: e.target.value })}
                          placeholder="Biên Hòa - Đồng Nai"
                          className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-black uppercase mb-1 text-slate-600 dark:text-slate-300">
                            Link Facebook Fanpage
                          </label>
                          <input
                            type="text"
                            value={aboutUsData.link_facebook || ''}
                            onChange={(e) => setAboutUsData({ ...aboutUsData, link_facebook: e.target.value })}
                            placeholder="https://facebook.com/soccer247"
                            className={`w-full p-2.5 rounded-xl border font-medium ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                          />
                        </div>
                        <div>
                          <label className="block font-black uppercase mb-1 text-slate-600 dark:text-slate-300">
                            Link Zalo Tư Vấn
                          </label>
                          <input
                            type="text"
                            value={aboutUsData.link_zalo || ''}
                            onChange={(e) => setAboutUsData({ ...aboutUsData, link_zalo: e.target.value })}
                            placeholder="https://zalo.me/0816344504"
                            className={`w-full p-2.5 rounded-xl border font-medium ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-black uppercase mb-1 text-slate-600 dark:text-slate-300 flex items-center justify-between">
                          <span>Đường Dẫn / Mã Nhúng Google Maps (iframe hoặc URL)</span>
                          <span className="text-[10px] lowercase text-emerald-500 font-normal">Tự động nhận diện thẻ &lt;iframe&gt;</span>
                        </label>
                        <input
                          type="text"
                          value={aboutUsData.link_map || ''}
                          onChange={(e) => {
                            let val = e.target.value;
                            const match = val.match(/src=["']([^"']+)["']/i);
                            if (match && match[1]) {
                              val = match[1];
                            }
                            setAboutUsData({ ...aboutUsData, link_map: val });
                          }}
                          placeholder="Dán mã <iframe src=...> hoặc link embed Google Maps..."
                          className={`w-full p-2.5 rounded-xl border font-mono text-[11px] ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                        />
                        {aboutUsData.link_map && (
                          <div className="mt-2 rounded-xl overflow-hidden border border-slate-700 h-32 bg-slate-900">
                            <iframe
                              title="Xem trước bản đồ"
                              src={aboutUsData.link_map}
                              width="100%"
                              height="100%"
                              style={{ border: 0 }}
                              allowFullScreen={false}
                              loading="lazy"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* CỘT PHẢI: NỘI DUNG GIỚI THIỆU CHI TIẾT */}
                    <div className="lg:col-span-6 space-y-4">
                      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 border-b pb-2 border-slate-200 dark:border-emerald-900/40">
                        <FileText className="w-4 h-4" /> Nội Dung Giới Thiệu & Bài Viết
                      </div>

                      <div>
                        <label className="block font-black uppercase mb-1 text-slate-600 dark:text-slate-300">
                          Lời Giới Thiệu Ngắn (Summary)
                        </label>
                        <textarea
                          rows={3}
                          value={aboutUsData.gioi_thieu_ngan || ''}
                          onChange={(e) => setAboutUsData({ ...aboutUsData, gioi_thieu_ngan: e.target.value })}
                          placeholder="Mô tả tóm tắt ngắn gọn về trung tâm thể thao..."
                          className={`w-full p-2.5 rounded-xl border font-medium resize-none ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                        />
                      </div>

                      <div>
                        <label className="block font-black uppercase mb-1 text-slate-600 dark:text-slate-300">
                          Bài Viết Giới Thiệu Chi Tiết (About Us Main Content)
                        </label>
                        <textarea
                          rows={7}
                          value={aboutUsData.bai_viet_about_us || ''}
                          onChange={(e) => setAboutUsData({ ...aboutUsData, bai_viet_about_us: e.target.value })}
                          placeholder="Nhập toàn bộ nội dung giới thiệu cơ sở vật chất, mặt sân cỏ, giàn đèn, dịch vụ tiện ích của Soccer247..."
                          className={`w-full p-2.5 rounded-xl border font-medium resize-none ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                        />
                      </div>

                      <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-[#060e09]/60 border-emerald-800/40' : 'bg-slate-50 border-slate-200'} space-y-2`}>
                        <div className="font-bold text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" /> Đồng bộ thời gian thực
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          Khi bạn bấm <strong className="text-emerald-600 dark:text-emerald-400">&quot;Lưu Thay Đổi&quot;</strong>, toàn bộ thông tin này sẽ được cập nhật tức thì vào CSDL qua Stored Procedure và tự động hiển thị ra trang <strong>About Us</strong> và <strong>Chân trang (Footer)</strong> của website.
                        </p>
                      </div>
                    </div>

                  </div>

                  {/* NÚT LƯU CUỐI TRANG */}
                  <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-emerald-900/40">
                    <button
                      type="submit"
                      disabled={isSavingAboutUs}
                      className="px-6 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02] disabled:opacity-60"
                    >
                      {isSavingAboutUs ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      <span>{isSavingAboutUs ? 'Đang lưu...' : 'Lưu Thông Tin About Us'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* =================================================================
                TAB 13: BANNER QUẢNG CÁO (BANNER)
                ================================================================= */}
            {activeTab === 'BANNER' && (
              <div className={`rounded-2xl border overflow-hidden shadow-xl ${isDarkMode ? 'bg-[#0a150e] border-emerald-900/40 text-white' : 'bg-white border-slate-300 shadow-md text-[#0f172a]'}`}>
                <div className={`p-5 flex flex-wrap items-center justify-between gap-3 border-b ${isDarkMode ? 'border-emerald-900/40 bg-[#0e2116]' : 'border-slate-200 bg-slate-50'}`}>
                  <div>
                    <h3 className="text-base font-black flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-emerald-600" /> Quản Lý Banner Quảng Cáo Trang Chủ
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Hiển thị slider hình ảnh và video quảng cáo ngoài trang chủ website</p>
                  </div>
                  <button
                    onClick={() => setBannerModal({ isOpen: true, mode: 'ADD', data: { loai_banner: 'IMAGE', thu_tu: bannerList.length + 1, trang_thai: 1 } })}
                    className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center gap-1.5 cursor-pointer transition-all hover:scale-[1.02]"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" /> Thêm Banner Mới
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className={`border-b font-black uppercase ${isDarkMode ? 'bg-[#060e09] text-emerald-300' : 'bg-slate-100 text-[#0f172a]'}`}>
                        <th className="p-4 w-28">HÌNH ẢNH / VIDEO</th>
                        <th className="p-4">TIÊU ĐỀ & LIÊN KẾT</th>
                        <th className="p-4 text-center">LOẠI</th>
                        <th className="p-4 text-center">THỨ TỰ</th>
                        <th className="p-4 text-center">TRẠNG THÁI</th>
                        <th className="p-4 text-right">THAO TÁC</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-emerald-900/30">
                      {bannerList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400 font-bold">Chưa có banner nào. Hãy bấm &quot;Thêm Banner Mới&quot; để tạo.</td>
                        </tr>
                      ) : (
                        bannerList.map((b) => (
                          <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-emerald-950/20 transition-colors">
                            <td className="p-4">
                              {b.hinh_anh ? (
                                <img src={b.hinh_anh} alt={b.tieu_de || 'Banner'} className="w-24 h-14 object-cover rounded-lg border border-slate-200 dark:border-emerald-800 shadow-sm" />
                              ) : (
                                <div className="w-24 h-14 rounded-lg bg-slate-200 dark:bg-emerald-950 flex items-center justify-center text-slate-400 font-bold text-[10px]">No Media</div>
                              )}
                            </td>
                            <td className="p-4">
                              <div className="font-black text-sm text-slate-900 dark:text-white">{b.tieu_de || '(Không có tiêu đề)'}</div>
                              {b.link_dieu_huong && (
                                <a href={b.link_dieu_huong} target="_blank" rel="noreferrer" className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mt-0.5">
                                  🔗 {b.link_dieu_huong}
                                </a>
                              )}
                            </td>
                            <td className="p-4 text-center">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                b.loai_banner === 'VIDEO' ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300' : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                              }`}>
                                {b.loai_banner === 'VIDEO' ? '🎥 Video' : '🖼️ Hình Ảnh'}
                              </span>
                            </td>
                            <td className="p-4 text-center font-bold text-slate-700 dark:text-slate-200">
                              #{b.thu_tu ?? 1}
                            </td>
                            <td className="p-4 text-center">
                              {(() => {
                                const isBannerActive = (b.trang_thai as any) == 1 || (b.trang_thai as any) === true;
                                return (
                                  <button
                                    onClick={() => handleToggleBannerStatus(b)}
                                    className={`px-3 py-1 rounded-full text-[10px] font-black cursor-pointer transition-all ${
                                      isBannerActive 
                                        ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                                        : 'bg-rose-100 hover:bg-rose-200 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                    }`}
                                    title="Bấm để bật/tắt hiển thị trên trang chủ"
                                  >
                                    {isBannerActive ? '● Đang hiển thị' : '○ Tạm ẩn'}
                                  </button>
                                );
                              })()}
                            </td>
                            <td className="p-4 text-right space-x-2">
                              <button
                                onClick={() => setBannerModal({
                                  isOpen: true,
                                  mode: 'EDIT',
                                  data: {
                                    ...b,
                                    trang_thai: ((b.trang_thai as any) == 1 || (b.trang_thai as any) === true) ? 1 : 0
                                  }
                                })}
                                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-slate-800 dark:text-slate-200 cursor-pointer font-bold inline-flex items-center gap-1"
                              >
                                <Edit2 className="w-3.5 h-3.5" /> Sửa
                              </button>
                              <button onClick={() => handleDeleteBanner(b.id, b.tieu_de)} className="p-2 rounded-lg bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 cursor-pointer font-bold inline-flex items-center gap-1">
                                <Trash2 className="w-3.5 h-3.5" /> Xóa
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* =================================================================
                TAB 14: LIÊN HỆ & PHẢN HỒI (LIEN_HE)
                ================================================================= */}
            {activeTab === 'LIEN_HE' && (
              <div className={`rounded-2xl border overflow-hidden shadow-xl ${isDarkMode ? 'bg-[#0a150e] border-emerald-900/40 text-white' : 'bg-white border-slate-300 shadow-md text-[#0f172a]'}`}>
                <div className={`p-5 flex flex-wrap items-center justify-between gap-3 border-b ${isDarkMode ? 'border-emerald-900/40 bg-[#0e2116]' : 'border-slate-200 bg-slate-50'}`}>
                  <div>
                    <h3 className="text-base font-black flex items-center gap-2">
                      <Mail className="w-5 h-5 text-emerald-600" /> Quản Lý Phản Hồi & Thắc Mắc Từ Khách Hàng
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Danh sách các thư liên hệ gửi từ form liên hệ ngoài website</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <span className="px-3 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                      Chưa xử lý: {lienHeList.filter(l => (l.trang_thai_xu_ly || l.trang_thai) !== 'DA_XU_LY').length}
                    </span>
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                      Tổng: {lienHeList.length}
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className={`border-b font-black uppercase ${isDarkMode ? 'bg-[#060e09] text-emerald-300' : 'bg-slate-100 text-[#0f172a]'}`}>
                        <th className="p-4">NGƯỜI GỬI</th>
                        <th className="p-4">THÔNG TIN LIÊN HỆ</th>
                        <th className="p-4">TIÊU ĐỀ & NỘI DUNG</th>
                        <th className="p-4 text-center">NGÀY GỬI</th>
                        <th className="p-4 text-center">TRẠNG THÁI</th>
                        <th className="p-4 text-right">THAO TÁC</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-emerald-900/30">
                      {lienHeList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400 font-bold">Chưa có phản hồi liên hệ nào từ khách hàng.</td>
                        </tr>
                      ) : (
                        lienHeList.map((lh) => (
                          <tr key={lh.id} className="hover:bg-slate-50/50 dark:hover:bg-emerald-950/20 transition-colors">
                            <td className="p-4">
                              <div className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-emerald-600" />
                                {lh.ho_ten}
                              </div>
                            </td>
                            <td className="p-4 space-y-0.5">
                              {lh.email && <div className="text-slate-600 dark:text-slate-300">✉️ {lh.email}</div>}
                              {lh.so_dien_thoai && <div className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">📞 {lh.so_dien_thoai}</div>}
                            </td>
                            <td className="p-4 max-w-xs">
                              <div className="font-black text-slate-900 dark:text-white">{lh.tieu_de || '(Không có tiêu đề)'}</div>
                              <div className="text-slate-500 dark:text-slate-400 line-clamp-2 text-[11px] mt-0.5">{lh.noi_dung}</div>
                            </td>
                            <td className="p-4 text-center font-mono text-slate-500">
                              {lh.ngay_gui ? formatVNDate(lh.ngay_gui) : '---'}
                            </td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => handleUpdateLienHeStatus(lh.id, (lh.trang_thai_xu_ly || lh.trang_thai))}
                                className={`px-3 py-1 rounded-full text-[10px] font-black cursor-pointer transition-all ${
                                  (lh.trang_thai_xu_ly === 'DA_XU_LY' || lh.trang_thai === 'DA_XU_LY')
                                    ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                    : 'bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 animate-pulse'
                                }`}
                                title="Bấm để đổi trạng thái Xử lý"
                              >
                                {(lh.trang_thai_xu_ly === 'DA_XU_LY' || lh.trang_thai === 'DA_XU_LY') ? '✓ Đã xử lý' : '⏳ Chưa xử lý'}
                              </button>
                            </td>
                            <td className="p-4 text-right space-x-2">
                              <button 
                                onClick={() => setReplyLienHeModal({
                                  isOpen: true,
                                  data: lh,
                                  tieu_de_tra_loi: `Phản hồi yêu cầu: ${lh.tieu_de || 'Đặt sân / Dịch vụ Soccer247'}`,
                                  noi_dung_tra_loi: '',
                                  isSubmitting: false,
                                })}
                                className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 dark:bg-blue-950/70 dark:hover:bg-blue-900 text-blue-800 dark:text-blue-200 cursor-pointer font-bold inline-flex items-center gap-1 shadow-sm"
                                title="Soạn thư trả lời khách hàng"
                              >
                                <MessageSquareReply className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Trả lời
                              </button>
                              <button onClick={() => setLienHeDetailModal({ isOpen: true, data: lh })} className="p-2 rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-200 cursor-pointer font-bold inline-flex items-center gap-1">
                                <Eye className="w-3.5 h-3.5" /> Xem
                              </button>
                              <button onClick={() => handleDeleteLienHe(lh.id, lh.ho_ten)} className="p-2 rounded-lg bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 cursor-pointer font-bold inline-flex items-center gap-1">
                                <Trash2 className="w-3.5 h-3.5" /> Xóa
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* =================================================================
                TAB 15: LOẠI TIN TỨC (LOAI_TIN_TUC)
                ================================================================= */}
            {activeTab === 'LOAI_TIN_TUC' && (
              <div className={`rounded-2xl border overflow-hidden shadow-xl ${isDarkMode ? 'bg-[#0a150e] border-emerald-900/40 text-white' : 'bg-white border-slate-300 shadow-md text-[#0f172a]'}`}>
                <div className={`p-5 flex flex-wrap items-center justify-between gap-3 border-b ${isDarkMode ? 'border-emerald-900/40 bg-[#0e2116]' : 'border-slate-200 bg-slate-50'}`}>
                  <div>
                    <h3 className="text-base font-black flex items-center gap-2">
                      <FolderTree className="w-5 h-5 text-emerald-600" /> Quản Lý Loại / Danh Mục Tin Tức
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Phân loại các bài viết tin tức: Giải đấu, Khuyến mãi, Hướng dẫn, Cẩm nang sân bóng...</p>
                  </div>
                  <button
                    onClick={() => setLoaiTinModal({ isOpen: true, mode: 'ADD', data: { ten_loai: '', trang_thai: 1 } })}
                    className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center gap-1.5 cursor-pointer transition-all hover:scale-[1.02]"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" /> Thêm Loại Tin
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className={`border-b font-black uppercase ${isDarkMode ? 'bg-[#060e09] text-emerald-300' : 'bg-slate-100 text-[#0f172a]'}`}>
                        <th className="p-4 w-24">MÃ LOẠI</th>
                        <th className="p-4">TÊN LOẠI TIN TỨC</th>
                        <th className="p-4 text-center">TRẠNG THÁI</th>
                        <th className="p-4 text-right">THAO TÁC</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-emerald-900/30">
                      {loaiTinList.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-slate-400 font-bold">Chưa có loại tin tức nào.</td>
                        </tr>
                      ) : (
                        loaiTinList.map((lt) => (
                          <tr key={lt.id} className="hover:bg-slate-50/50 dark:hover:bg-emerald-950/20 transition-colors">
                            <td className="p-4 font-mono font-black text-slate-500">#{lt.id}</td>
                            <td className="p-4 font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                              📁 {lt.ten_loai}
                            </td>
                            <td className="p-4 text-center">
                              {(() => {
                                const isLoaiActive = (lt.trang_thai as any) == 1 || (lt.trang_thai as any) === true;
                                return (
                                  <button
                                    onClick={() => handleToggleLoaiTinStatus(lt)}
                                    className={`px-3 py-1 rounded-full text-[10px] font-black cursor-pointer transition-all ${
                                      isLoaiActive 
                                        ? 'bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' 
                                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                    }`}
                                    title="Bấm để kích hoạt hoặc tạm ẩn"
                                  >
                                    {isLoaiActive ? '● Hoạt động' : '○ Tạm ẩn'}
                                  </button>
                                );
                              })()}
                            </td>
                            <td className="p-4 text-right space-x-2">
                              <button onClick={() => setLoaiTinModal({
                                isOpen: true,
                                mode: 'EDIT',
                                data: {
                                  ...lt,
                                  trang_thai: ((lt.trang_thai as any) == 1 || (lt.trang_thai as any) === true) ? 1 : 0
                                }
                              })} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-slate-800 dark:text-slate-200 cursor-pointer font-bold inline-flex items-center gap-1">
                                <Edit2 className="w-3.5 h-3.5" /> Sửa
                              </button>
                              <button onClick={() => handleDeleteLoaiTin(lt.id, lt.ten_loai)} className="p-2 rounded-lg bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 cursor-pointer font-bold inline-flex items-center gap-1">
                                <Trash2 className="w-3.5 h-3.5" /> Xóa
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* =================================================================
                TAB 16: TIN TỨC & BÀI VIẾT (TIN_TUC)
                ================================================================= */}
            {activeTab === 'TIN_TUC' && (
              <div className={`rounded-2xl border overflow-hidden shadow-xl ${isDarkMode ? 'bg-[#0a150e] border-emerald-900/40 text-white' : 'bg-white border-slate-300 shadow-md text-[#0f172a]'}`}>
                <div className={`p-5 flex flex-wrap items-center justify-between gap-3 border-b ${isDarkMode ? 'border-emerald-900/40 bg-[#0e2116]' : 'border-slate-200 bg-slate-50'}`}>
                  <div>
                    <h3 className="text-base font-black flex items-center gap-2">
                      <FileText className="w-5 h-5 text-emerald-600" /> Quản Lý Tin Tức & Bài Viết
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Soạn thảo, đăng tải các bài viết thể thao, tin giải đấu và sự kiện sân bóng</p>
                  </div>
                  <button
                    onClick={() => setNewsModal({
                      isOpen: true,
                      mode: 'ADD',
                      data: {
                        ma_loai_tin: loaiTinList[0]?.id || 1,
                        tieu_de: '',
                        tom_tat: '',
                        noi_dung: '',
                        trang_thai: 1
                      }
                    })}
                    className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center gap-1.5 cursor-pointer transition-all hover:scale-[1.02]"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" /> Viết Tin Tức Mới
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className={`border-b font-black uppercase ${isDarkMode ? 'bg-[#060e09] text-emerald-300' : 'bg-slate-100 text-[#0f172a]'}`}>
                        <th className="p-4 w-28">HÌNH ẢNH</th>
                        <th className="p-4">TIÊU ĐỀ & TÓM TẮT</th>
                        <th className="p-4">DANH MỤC</th>
                        <th className="p-4 text-center">LƯỢT XEM</th>
                        <th className="p-4 text-center">NGÀY ĐĂNG</th>
                        <th className="p-4 text-center">TRẠNG THÁI</th>
                        <th className="p-4 text-right">THAO TÁC</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-emerald-900/30">
                      {newsList.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">Chưa có bài viết tin tức nào. Hãy bấm &quot;Viết Tin Tức Mới&quot; để tạo bài viết đầu tiên.</td>
                        </tr>
                      ) : (
                        newsList.map((nw) => (
                          <tr key={nw.id} className="hover:bg-slate-50/50 dark:hover:bg-emerald-950/20 transition-colors">
                            <td className="p-4">
                              {nw.hinh_anh ? (
                                <img src={nw.hinh_anh} alt={nw.tieu_de} className="w-24 h-16 object-cover rounded-xl border border-slate-200 dark:border-emerald-800 shadow-sm" />
                              ) : (
                                <div className="w-24 h-16 rounded-xl bg-slate-200 dark:bg-emerald-950 flex items-center justify-center text-slate-400 font-bold text-[10px]">No Image</div>
                              )}
                            </td>
                            <td className="p-4 max-w-sm">
                              <div className="font-black text-sm text-slate-900 dark:text-white line-clamp-1">{nw.tieu_de}</div>
                              <div className="text-slate-500 dark:text-slate-400 line-clamp-2 text-[11px] mt-0.5">{nw.tom_tat}</div>
                            </td>
                            <td className="p-4 font-bold text-emerald-700 dark:text-emerald-400">
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/40 text-[11px]">
                                {nw.ten_loai || 'Chung'}
                              </span>
                            </td>
                            <td className="p-4 text-center font-mono font-bold text-slate-600 dark:text-slate-300">
                              👁️ {nw.luot_xem ?? 0}
                            </td>
                            <td className="p-4 text-center font-mono text-slate-500">
                              {nw.ngay_dang ? formatVNDate(nw.ngay_dang) : '---'}
                            </td>
                            <td className="p-4 text-center">
                              {(() => {
                                const isNewsActive = (nw.trang_thai as any) == 1 || (nw.trang_thai as any) === true;
                                return (
                                  <button
                                    onClick={() => handleToggleTinTucStatus(nw)}
                                    className={`px-3 py-1 rounded-full text-[10px] font-black cursor-pointer transition-all ${
                                      isNewsActive 
                                        ? 'bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' 
                                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                    }`}
                                    title="Bấm để xuất bản hoặc chuyển về bản nháp"
                                  >
                                    {isNewsActive ? '● Đã xuất bản' : '○ Bản nháp'}
                                  </button>
                                );
                              })()}
                            </td>
                            <td className="p-4 text-right space-x-2">
                              <a
                                href={`/tin-tuc?id=${nw.id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 dark:bg-blue-950 dark:hover:bg-blue-900 text-blue-800 dark:text-blue-200 cursor-pointer font-bold inline-flex items-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" /> Xem
                              </a>
                              <button onClick={() => setNewsModal({
                                isOpen: true,
                                mode: 'EDIT',
                                data: {
                                  ...nw,
                                  trang_thai: ((nw.trang_thai as any) == 1 || (nw.trang_thai as any) === true) ? 1 : 0
                                }
                              })} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-slate-800 dark:text-slate-200 cursor-pointer font-bold inline-flex items-center gap-1">
                                <Edit2 className="w-3.5 h-3.5" /> Sửa
                              </button>
                              <button onClick={() => handleDeleteTinTuc(nw.id, nw.tieu_de)} className="p-2 rounded-lg bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 cursor-pointer font-bold inline-flex items-center gap-1">
                                <Trash2 className="w-3.5 h-3.5" /> Xóa
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* =====================================================================
          CÁC MODAL THÊM / SỬA CHO 11 BẢNG
          ===================================================================== */}

      {/* 1. Modal Sân Bóng (San_Bong) - Giao diện hình chữ nhật ngang nhỏ gọn */}
      {courtModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className={`w-full max-w-2xl sm:max-w-3xl p-5 sm:p-6 rounded-3xl border shadow-2xl my-auto ${isDarkMode ? 'bg-[#0a150e] border-emerald-900/60 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/60 dark:border-emerald-900/40 mb-4">
              <h3 className="font-black text-sm sm:text-base flex items-center gap-2">
                <span>{courtModal.mode === 'ADD' ? '⚽ Thêm Sân Bóng Mới' : '✏️ Cập Nhật Sân Bóng'}</span>
              </h3>
              <button 
                onClick={() => setCourtModal({ isOpen: false, mode: 'ADD', data: {} })}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCourt} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Cột trái: Thông tin cơ bản của sân */}
                <div className="space-y-3">
                  <div>
                    <label className="block font-black uppercase mb-1 text-slate-400">Tên Sân Bóng *</label>
                    <input
                      type="text"
                      required
                      value={courtModal.data.ten_san || ''}
                      onChange={(e) => setCourtModal({ ...courtModal, data: { ...courtModal.data, ten_san: e.target.value } })}
                      placeholder="Ví dụ: Sân 5D Sân VIP"
                      className={`w-full px-3 py-2 rounded-xl border font-bold text-xs ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                    />
                  </div>

                  <div>
                    <label className="block font-black uppercase mb-1 text-slate-400">Loại Sân *</label>
                    <select
                      value={courtModal.data.ma_loai_san || 1}
                      onChange={(e) => setCourtModal({ ...courtModal, data: { ...courtModal.data, ma_loai_san: Number(e.target.value) } })}
                      className={`w-full px-3 py-2 rounded-xl border font-bold text-xs ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                    >
                      {categoryList.map((l) => (
                        <option key={l.id} value={l.id}>{l.ten_loai}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-black uppercase mb-1 text-slate-400">Đơn Giá Theo Phút (VNĐ/phút) *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={courtModal.data.don_gia_phut !== undefined ? courtModal.data.don_gia_phut : 5000}
                      onChange={(e) => setCourtModal({ ...courtModal, data: { ...courtModal.data, don_gia_phut: Number(e.target.value) } })}
                      placeholder="Ví dụ: 5000"
                      className={`w-full px-3 py-2 rounded-xl border font-bold text-xs ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                    />
                    <div className="text-[10px] text-slate-500 mt-1 font-medium">
                      💡 {Number(courtModal.data.don_gia_phut || 5000).toLocaleString('vi-VN')} đ/phút = {(Number(courtModal.data.don_gia_phut || 5000) * 60).toLocaleString('vi-VN')} đ/giờ
                    </div>
                  </div>

                  <div>
                    <label className="block font-black uppercase mb-1 text-slate-400">Trạng Thái Vận Hành</label>
                    <select
                      value={courtModal.data.trang_thai || 'SAN_SANG'}
                      onChange={(e) => setCourtModal({ ...courtModal, data: { ...courtModal.data, trang_thai: e.target.value as any } })}
                      className={`w-full px-3 py-2 rounded-xl border font-bold text-xs ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                    >
                      <option value="SAN_SANG">Sẵn Sàng Vận Hành</option>
                      <option value="BAO_TRI">Bảo Trì / Sửa Chữa</option>
                    </select>
                  </div>
                </div>

                {/* Cột phải: Hình ảnh sân bóng Cloudinary */}
                <div className="space-y-2.5 flex flex-col justify-between">
                  <div>
                    <label className="block font-black uppercase mb-1 text-slate-400">Hình Ảnh Sân Bóng (Cloudinary)</label>
                    
                    {/* Xem trước ảnh */}
                    {courtModal.data.hinh_anh ? (
                      <div className="relative w-full h-32 sm:h-36 rounded-xl overflow-hidden border border-emerald-500/40 bg-slate-900 group shadow-sm mb-2">
                        <img
                          src={courtModal.data.hinh_anh}
                          alt="Ảnh sân bóng"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1529900240041-dd2c1bb50c1e?w=300';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setPendingCourtImageFile(null);
                            setCourtModal({ ...courtModal, data: { ...courtModal.data, hinh_anh: '' } });
                          }}
                          className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-rose-600/90 hover:bg-rose-600 text-white shadow-md cursor-pointer transition-colors"
                          title="Xóa ảnh này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <div className="absolute bottom-1 left-1.5 text-[9px] text-emerald-300 bg-black/85 px-2 py-0.5 rounded font-mono truncate max-w-[85%] border border-emerald-500/30">
                          {pendingCourtImageFile
                            ? '📁 File máy tính (Lưu để Up)'
                            : (courtModal.data.hinh_anh.includes('cloudinary.com')
                              ? '☁️ Cloudinary'
                              : '🔗 Link chờ Lưu & Up')}
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-32 sm:h-36 rounded-xl border border-dashed border-slate-700 bg-slate-950/40 flex flex-col items-center justify-center text-slate-500 gap-1.5 mb-2">
                        <Upload className="w-6 h-6 text-slate-600" />
                        <span className="text-[11px]">Chưa có hình ảnh sân bóng</span>
                      </div>
                    )}

                    {/* Dán link & Nút chọn file */}
                    <div className="space-y-1.5">
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={pendingCourtImageFile ? `[File máy tính]: ${pendingCourtImageFile.name}` : (courtModal.data.hinh_anh || '')}
                          onChange={(e) => {
                            setPendingCourtImageFile(null);
                            setCourtModal({ ...courtModal, data: { ...courtModal.data, hinh_anh: e.target.value } });
                          }}
                          placeholder="Dán link ảnh hoặc bấm chọn file..."
                          className={`flex-1 px-2.5 py-1.5 text-xs rounded-xl border font-medium ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                        />

                        <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs cursor-pointer transition-all shrink-0">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{pendingCourtImageFile ? 'Đổi file' : 'Chọn file'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setPendingCourtImageFile(file);
                                const previewUrl = URL.createObjectURL(file);
                                setCourtModal((prev) => ({ ...prev, data: { ...prev.data, hinh_anh: previewUrl } }));
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        💡 Dán link hoặc chọn file rồi bấm <strong className="text-emerald-400">"Lưu Sân Bóng"</strong> để tự động tải lên Cloudinary.
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Footer Modal: Nút Hủy & Lưu Sân Bóng */}
              <div className="flex justify-end items-center gap-2.5 pt-3 border-t border-slate-800/60 dark:border-emerald-900/40">
                <button 
                  type="button" 
                  onClick={() => setCourtModal({ isOpen: false, mode: 'ADD', data: {} })} 
                  className="px-4 py-2 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer text-xs transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  disabled={isUploadingImage} 
                  className="px-5 py-2 rounded-xl font-black bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer disabled:opacity-50 text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
                >
                  {isUploadingImage ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>{isUploadingImage ? 'Đang tải ảnh...' : 'Lưu Sân Bóng'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal Loại Sân (Loai_San) */}
      {loaiSanModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl ${isDarkMode ? 'bg-[#0a150e] border-emerald-900/60 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}>
            <div className="flex items-center justify-between pb-3 border-b mb-4">
              <h3 className="font-black text-base">{loaiSanModal.mode === 'ADD' ? '🏟️ Thêm Loại Sân' : '✏️ Cập Nhật Loại Sân'}</h3>
              <button onClick={() => setLoaiSanModal({ isOpen: false, mode: 'ADD', data: {} })}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveLoaiSan} className="space-y-4 text-xs">
              <div>
                <label className="block font-black uppercase mb-1">Tên Loại Sân *</label>
                <input
                  type="text"
                  required
                  value={loaiSanModal.data.ten_loai || ''}
                  onChange={(e) => setLoaiSanModal({ ...loaiSanModal, data: { ...loaiSanModal.data, ten_loai: e.target.value } })}
                  placeholder="Ví dụ: Sân 5 người, Sân 7 người, Sân 11..."
                  className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                />
              </div>
              <div>
                <label className="block font-black uppercase mb-1">Mô Tả Chi Tiết</label>
                <textarea
                  rows={3}
                  value={loaiSanModal.data.mo_ta || ''}
                  onChange={(e) => setLoaiSanModal({ ...loaiSanModal, data: { ...loaiSanModal.data, mo_ta: e.target.value } })}
                  placeholder="Mô tả chất liệu mặt cỏ, tiêu chuẩn thi đấu..."
                  className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setLoaiSanModal({ isOpen: false, mode: 'ADD', data: {} })} className="px-4 py-2 rounded-xl font-bold bg-slate-200 text-slate-800 cursor-pointer">Hủy</button>
                <button type="submit" className="px-5 py-2 rounded-xl font-black bg-emerald-600 text-white cursor-pointer">Lưu Loại Sân</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Modal Dịch Vụ (Dich_Vu) */}
      {serviceModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-lg p-6 rounded-3xl border shadow-2xl ${isDarkMode ? 'bg-[#0a150e] border-emerald-900/60 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}>
            <div className="flex items-center justify-between pb-3 border-b mb-4">
              <h3 className="font-black text-base">{serviceModal.mode === 'ADD' ? '🥤 Thêm Dịch Vụ Mới' : '✏️ Cập Nhật Dịch Vụ'}</h3>
              <button onClick={() => setServiceModal({ isOpen: false, mode: 'ADD', data: { don_vi_tinh: 'Chai', ton_kho: 0 } })}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveService} className="space-y-4 text-xs">
              <div>
                <label className="block font-black uppercase mb-1">Tên Dịch Vụ / Nước Uống *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nước khoáng Lavie 500ml"
                  value={serviceModal.data.ten_dich_vu || ''}
                  onChange={(e) => setServiceModal({ ...serviceModal, data: { ...serviceModal.data, ten_dich_vu: e.target.value } })}
                  className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black uppercase mb-1">Đơn Giá Bán (VNĐ) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="Ví dụ: 15000"
                    value={serviceModal.data.don_gia !== undefined ? serviceModal.data.don_gia : ''}
                    onChange={(e) => setServiceModal({ ...serviceModal, data: { ...serviceModal.data, don_gia: Number(e.target.value) } })}
                    className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                  />
                </div>
                <div>
                  <label className="block font-black uppercase mb-1">Đơn Vị Tính *</label>
                  <input
                    type="text"
                    required
                    placeholder="Chai, Lon, Gói, Bộ..."
                    value={serviceModal.data.don_vi_tinh !== undefined ? serviceModal.data.don_vi_tinh : 'Chai'}
                    onChange={(e) => setServiceModal({ ...serviceModal, data: { ...serviceModal.data, don_vi_tinh: e.target.value } })}
                    className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                  />
                </div>
              </div>

              {/* TÙY CHỌN TẠO PHIẾU NHẬP KHO BAN ĐẦU KHI THÊM DỊCH VỤ MỚI */}
              {serviceModal.mode === 'ADD' && (
                <div className={`p-3.5 rounded-2xl border ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40' : 'bg-emerald-50/60 border-emerald-200'} space-y-3`}>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 font-black text-xs cursor-pointer select-none text-emerald-700 dark:text-emerald-400">
                      <input
                        type="checkbox"
                        checked={serviceModal.data.tao_phieu_nhap ?? true}
                        onChange={(e) => setServiceModal({
                          ...serviceModal,
                          data: { ...serviceModal.data, tao_phieu_nhap: e.target.checked }
                        })}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <span className="flex items-center gap-1.5 font-black">
                        📦 Nhập kho ban đầu (Tạo phiếu nhập)
                      </span>
                    </label>
                    {(serviceModal.data.tao_phieu_nhap ?? true) && (
                      <span className="text-[11px] font-black text-emerald-800 dark:text-emerald-300">
                        Tổng vốn: {Number((serviceModal.data.so_luong_nhap ?? 50) * (serviceModal.data.gia_nhap ?? 10000)).toLocaleString('vi-VN')} đ
                      </span>
                    )}
                  </div>

                  {(serviceModal.data.tao_phieu_nhap ?? true) && (
                    <div className="space-y-2.5 pt-1">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-black uppercase mb-1 text-[10px] text-slate-500 dark:text-slate-400">Số Lượng Nhập Ban Đầu *</label>
                          <input
                            type="number"
                            min="1"
                            value={serviceModal.data.so_luong_nhap ?? 50}
                            onChange={(e) => setServiceModal({
                              ...serviceModal,
                              data: { ...serviceModal.data, so_luong_nhap: Number(e.target.value) }
                            })}
                            className={`w-full p-2 rounded-xl border font-bold ${isDarkMode ? 'bg-[#0a150e] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                          />
                        </div>
                        <div>
                          <label className="block font-black uppercase mb-1 text-[10px] text-slate-500 dark:text-slate-400">Đơn Giá Vốn Nhập (VNĐ) *</label>
                          <input
                            type="number"
                            min="0"
                            value={serviceModal.data.gia_nhap ?? 10000}
                            onChange={(e) => setServiceModal({
                              ...serviceModal,
                              data: { ...serviceModal.data, gia_nhap: Number(e.target.value) }
                            })}
                            className={`w-full p-2 rounded-xl border font-bold ${isDarkMode ? 'bg-[#0a150e] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block font-black uppercase mb-1 text-[10px] text-slate-500 dark:text-slate-400">Ngày Nhập Kho *</label>
                        <input
                          type="date"
                          value={serviceModal.data.ngay_nhap || new Date().toISOString().split('T')[0]}
                          onChange={(e) => setServiceModal({
                            ...serviceModal,
                            data: { ...serviceModal.data, ngay_nhap: e.target.value }
                          })}
                          className={`w-full p-2 rounded-xl border font-bold ${isDarkMode ? 'bg-[#0a150e] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setServiceModal({ isOpen: false, mode: 'ADD', data: { don_vi_tinh: 'Chai', ton_kho: 0 } })} className="px-4 py-2 rounded-xl font-bold bg-slate-200 text-slate-800 cursor-pointer">Hủy</button>
                <button type="submit" className="px-5 py-2 rounded-xl font-black bg-emerald-600 text-white cursor-pointer">Lưu Dịch Vụ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Modal Nhập Kho (Phieu_Nhap_Kho) */}
      {importStockModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl ${isDarkMode ? 'bg-[#0a150e] border-emerald-900/60 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}>
            <div className="flex items-center justify-between pb-3 border-b mb-4">
              <h3 className="font-black text-base">{importStockModal.mode === 'ADD' ? '📦 Tạo Phiếu Nhập Kho' : '✏️ Cập Nhật Phiếu Nhập'}</h3>
              <button onClick={() => setImportStockModal({ isOpen: false, mode: 'ADD', data: {} })}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveImportStock} className="space-y-4 text-xs">
              <div>
                <label className="block font-black uppercase mb-1">Mặt Hàng Dịch Vụ *</label>
                <select
                  value={importStockModal.data.ma_dich_vu || 1}
                  onChange={(e) => setImportStockModal({ ...importStockModal, data: { ...importStockModal.data, ma_dich_vu: Number(e.target.value) } })}
                  className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                >
                  {serviceList.map((s) => (
                    <option key={s.id} value={s.id}>{s.ten_dich_vu} ({s.don_vi_tinh})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-black uppercase mb-1">Số Lượng Nhập *</label>
                <input
                  type="number"
                  min="1"
                  value={importStockModal.data.so_luong_nhap || 50}
                  onChange={(e) => setImportStockModal({ ...importStockModal, data: { ...importStockModal.data, so_luong_nhap: Number(e.target.value) } })}
                  className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                />
              </div>
              <div>
                <label className="block font-black uppercase mb-1">Đơn Giá Vốn Nhập (VNĐ) *</label>
                <input
                  type="number"
                  min="0"
                  value={importStockModal.data.gia_nhap || 12000}
                  onChange={(e) => setImportStockModal({ ...importStockModal, data: { ...importStockModal.data, gia_nhap: Number(e.target.value) } })}
                  className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setImportStockModal({ isOpen: false, mode: 'ADD', data: {} })} className="px-4 py-2 rounded-xl font-bold bg-slate-200 text-slate-800 cursor-pointer">Hủy</button>
                <button type="submit" className="px-5 py-2 rounded-xl font-black bg-emerald-600 text-white cursor-pointer">Lưu Phiếu Nhập</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Modal Đơn Đặt Sân & Thanh Toán (Don_Dat_San & Thanh_Toan) */}
      {bookingModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-lg p-6 rounded-3xl border shadow-2xl ${isDarkMode ? 'bg-[#0a150e] border-emerald-900/60 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}>
            <div className="flex items-center justify-between pb-3 border-b mb-4">
              <h3 className="font-black text-base">{bookingModal.mode === 'ADD' ? '📋 Thêm Đơn Đặt Sân & Thanh Toán' : '✏️ Cập Nhật Đơn Đặt Sân'}</h3>
              <button onClick={() => setBookingModal({ isOpen: false, mode: 'ADD', data: {} })}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveDonDatThanhToan} className="space-y-3.5 text-xs max-h-[80vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black uppercase mb-1">Chọn Sân Bóng *</label>
                  <select
                    value={bookingModal.data.ma_san || 1}
                    onChange={(e) => {
                      const ms = Number(e.target.value);
                      const s = courtList.find(c => c.id === ms);
                      const curStart = (bookingModal.data.gio_bat_dau || '17:00').substring(0, 5);
                      const curEnd = (bookingModal.data.gio_ket_thuc || '18:30').substring(0, 5);
                      const autoPrice = calculateBookingPitchPrice(ms, curStart, curEnd);
                      const totalDv = (bookingModal.data.dich_vu_list || []).reduce((sum: number, it: any) => sum + (Number(it.so_luong || 0) * Number(it.don_gia || 0)), 0);
                      const finalPrice = autoPrice > 0 ? autoPrice : (bookingModal.data.tien_san || 0);
                      setBookingModal({
                        ...bookingModal,
                        data: {
                          ...bookingModal.data,
                          ma_san: ms,
                          ten_san: s?.ten_san,
                          tien_san: finalPrice,
                          tong_tien: finalPrice + totalDv,
                        }
                      });
                    }}
                    className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                  >
                    {courtList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.ten_san} ({Number(c.don_gia_phut || 0).toLocaleString('vi-VN')} đ/phút)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-black uppercase mb-1">Người Đặt (Tài Khoản) *</label>
                  <select
                    value={bookingModal.data.ma_nguoi_dung || 1}
                    onChange={(e) => setBookingModal({ ...bookingModal, data: { ...bookingModal.data, ma_nguoi_dung: Number(e.target.value) } })}
                    className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                  >
                    {userList.map((u) => (
                      <option key={u.id} value={u.id}>{u.ho_ten} ({u.so_dien_thoai || u.email})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-black uppercase mb-1">Ngày Đá *</label>
                  <input
                    type="date"
                    required
                    value={bookingModal.data.ngay_da ? bookingModal.data.ngay_da.split('T')[0] : new Date().toISOString().split('T')[0]}
                    onChange={(e) => setBookingModal({ ...bookingModal, data: { ...bookingModal.data, ngay_da: e.target.value } })}
                    className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                  />
                </div>
                <div>
                  <label className="block font-black uppercase mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Giờ Bắt Đầu (24h) *</span>
                  </label>
                  <select
                    id="modal_gio_bat_dau"
                    required
                    value={(bookingModal.data.gio_bat_dau || '17:00').substring(0, 5)}
                    onChange={(e) => {
                      const newStart = e.target.value;
                      const curEnd = (bookingModal.data.gio_ket_thuc || '18:30').substring(0, 5);
                      const curSanId = bookingModal.data.ma_san || courtList[0]?.id || 1;
                      const autoPrice = calculateBookingPitchPrice(curSanId, newStart, curEnd);
                      const totalDv = (bookingModal.data.dich_vu_list || []).reduce((sum: number, it: any) => sum + (Number(it.so_luong || 0) * Number(it.don_gia || 0)), 0);
                      const finalPrice = autoPrice > 0 ? autoPrice : (bookingModal.data.tien_san || 0);
                      setBookingModal({
                        ...bookingModal,
                        data: {
                          ...bookingModal.data,
                          gio_bat_dau: newStart,
                          tien_san: finalPrice,
                          tong_tien: finalPrice + totalDv,
                        },
                      });
                    }}
                    className={`w-full p-2.5 rounded-xl border font-bold font-mono text-xs cursor-pointer ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                  >
                    {!TIME_OPTIONS_24H.includes((bookingModal.data.gio_bat_dau || '').substring(0, 5)) && bookingModal.data.gio_bat_dau && (() => {
                      const customTime = (bookingModal.data.gio_bat_dau || '').substring(0, 5);
                      const status = getBookingModalSlotStatus(customTime, false);
                      return (
                        <option 
                          value={customTime} 
                          disabled={status.disabled}
                          className={status.isOccupied ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-400 font-bold' : ''}
                          style={status.isOccupied ? { color: '#d97706', backgroundColor: isDarkMode ? '#291805' : '#fffbeb', fontWeight: 'bold' } : undefined}
                        >
                          {status.disabled ? status.label : `${customTime} (Tùy chỉnh)`}
                        </option>
                      );
                    })()}
                    {TIME_OPTIONS_24H.map((t) => {
                      const status = getBookingModalSlotStatus(t, false);
                      if (status.isHidden) return null; // Ẩn giờ đã qua
                      return (
                        <option 
                          key={`start_${t}`} 
                          value={t} 
                          disabled={status.disabled}
                          className={status.isOccupied ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-400 font-bold' : ''}
                          style={status.isOccupied ? { color: '#d97706', backgroundColor: isDarkMode ? '#291805' : '#fffbeb', fontWeight: 'bold' } : undefined}
                        >
                          {status.label}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="block font-black uppercase mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Giờ Kết Thúc (24h) *</span>
                  </label>
                  <select
                    id="modal_gio_ket_thuc"
                    required
                    value={(bookingModal.data.gio_ket_thuc || '18:30').substring(0, 5)}
                    onChange={(e) => {
                      const newEnd = e.target.value;
                      const curStart = (bookingModal.data.gio_bat_dau || '17:00').substring(0, 5);
                      const curSanId = bookingModal.data.ma_san || courtList[0]?.id || 1;
                      const autoPrice = calculateBookingPitchPrice(curSanId, curStart, newEnd);
                      const totalDv = (bookingModal.data.dich_vu_list || []).reduce((sum: number, it: any) => sum + (Number(it.so_luong || 0) * Number(it.don_gia || 0)), 0);
                      const finalPrice = autoPrice > 0 ? autoPrice : (bookingModal.data.tien_san || 0);
                      setBookingModal({
                        ...bookingModal,
                        data: {
                          ...bookingModal.data,
                          gio_ket_thuc: newEnd,
                          tien_san: finalPrice,
                          tong_tien: finalPrice + totalDv,
                        },
                      });
                    }}
                    className={`w-full p-2.5 rounded-xl border font-bold font-mono text-xs cursor-pointer ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                  >
                    {!TIME_OPTIONS_24H.includes((bookingModal.data.gio_ket_thuc || '').substring(0, 5)) && bookingModal.data.gio_ket_thuc && (() => {
                      const customTime = (bookingModal.data.gio_ket_thuc || '').substring(0, 5);
                      const status = getBookingModalSlotStatus(customTime, true);
                      return (
                        <option 
                          value={customTime} 
                          disabled={status.disabled}
                          className={status.isOccupied ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-400 font-bold' : ''}
                          style={status.isOccupied ? { color: '#d97706', backgroundColor: isDarkMode ? '#291805' : '#fffbeb', fontWeight: 'bold' } : undefined}
                        >
                          {status.disabled ? status.label : `${customTime} (Tùy chỉnh)`}
                        </option>
                      );
                    })()}
                    {TIME_OPTIONS_24H.map((t) => {
                      const status = getBookingModalSlotStatus(t, true);
                      if (status.isHidden) return null; // Ẩn giờ đã qua và giờ <= giờ bắt đầu
                      return (
                        <option 
                          key={`end_${t}`} 
                          value={t} 
                          disabled={status.disabled}
                          className={status.isOccupied ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-400 font-bold' : ''}
                          style={status.isOccupied ? { color: '#d97706', backgroundColor: isDarkMode ? '#291805' : '#fffbeb', fontWeight: 'bold' } : undefined}
                        >
                          {status.label}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Chú thích trạng thái khung giờ */}
              <div className="flex flex-wrap items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#060e09] border border-slate-200 dark:border-emerald-950/60 text-[11px] font-bold">
                <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shadow-sm"></span>
                  <span>🟢 Trống</span>
                </span>
                <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-black">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block shadow-sm animate-pulse"></span>
                  <span>🟠 Đang có người chọn / Đã đặt (Màu cam)</span>
                </span>
                <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700 inline-block"></span>
                  <span>⚪ Đã qua giờ (Tự động ẩn)</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-black uppercase">Tiền Sân (VNĐ) *</label>
                    {bookingModal.data.ma_san && (
                      <span className="text-[10px] text-emerald-400 font-mono font-bold">
                        ⚡ Tự động tính
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={bookingModal.data.tien_san !== undefined ? bookingModal.data.tien_san : ''}
                    onChange={(e) => {
                      const ts = Number(e.target.value);
                      const totalDv = (bookingModal.data.dich_vu_list || []).reduce((sum: number, it: any) => sum + (Number(it.so_luong || 0) * Number(it.don_gia || 0)), 0);
                      setBookingModal({ ...bookingModal, data: { ...bookingModal.data, tien_san: ts, tong_tien: ts + totalDv } });
                    }}
                    className={`w-full p-2.5 rounded-xl border font-bold font-mono text-emerald-400 ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-emerald-300' : 'bg-white border-slate-300 text-emerald-600'}`}
                  />
                </div>
                <div>
                  <label className="block font-black uppercase mb-1">Phương Thức Thanh Toán</label>
                  <select
                    value={bookingModal.data.phuong_thuc || 'CHUYEN_KHOAN'}
                    onChange={(e) => setBookingModal({ ...bookingModal, data: { ...bookingModal.data, phuong_thuc: e.target.value } })}
                    className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                  >
                    <option value="CHUYEN_KHOAN">Chuyển Khoản</option>
                    <option value="TIEN_MAT">Tiền Mặt</option>
                  </select>
                </div>
              </div>

              {/* DỊCH VỤ ĐI KÈM (CHI TIẾT DỊCH VỤ) */}
              <div className={`p-3.5 rounded-2xl border ${isDarkMode ? 'bg-[#060e09]/80 border-emerald-800/40' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-200 dark:border-emerald-900/30">
                  <label className="font-black uppercase flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <ShoppingCart className="w-3.5 h-3.5" /> Dịch Vụ / Nước Uống (Chi Tiết Dịch Vụ)
                  </label>
                  <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">
                    + {((bookingModal.data.dich_vu_list || []).reduce((sum: number, it: any) => sum + (Number(it.so_luong || 0) * Number(it.don_gia || 0)), 0)).toLocaleString('vi-VN')} đ
                  </span>
                </div>

                {/* Danh sách dịch vụ đã chọn trong đơn */}
                {Array.isArray(bookingModal.data.dich_vu_list) && bookingModal.data.dich_vu_list.length > 0 ? (
                  <div className="space-y-1.5 mb-3 max-h-36 overflow-y-auto pr-1">
                    {bookingModal.data.dich_vu_list.map((it: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#0a150e] border border-slate-200 dark:border-emerald-800/30 text-xs">
                        <div className="flex-1 min-w-0 mr-2">
                          <div className="font-bold truncate text-[#0f172a] dark:text-slate-100">🥤 {it.ten_dich_vu}</div>
                          <div className="text-[10px] text-slate-500">{Number(it.don_gia).toLocaleString('vi-VN')} đ / {it.don_vi_tinh || 'Chai'}</div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center border border-slate-300 dark:border-emerald-800/50 rounded-lg overflow-hidden">
                            <button
                              type="button"
                              onClick={() => {
                                const list = [...(bookingModal.data.dich_vu_list || [])];
                                if (list[idx].so_luong > 1) {
                                  list[idx].so_luong -= 1;
                                } else {
                                  list.splice(idx, 1);
                                }
                                const totalDv = list.reduce((s: number, d: any) => s + (Number(d.so_luong) * Number(d.don_gia)), 0);
                                setBookingModal({
                                  ...bookingModal,
                                  data: {
                                    ...bookingModal.data,
                                    dich_vu_list: list,
                                    tong_tien: Number(bookingModal.data.tien_san || 0) + totalDv
                                  }
                                });
                              }}
                              className="px-2 py-0.5 hover:bg-slate-200 dark:hover:bg-emerald-950 font-bold"
                            >
                              -
                            </button>
                            <span className="px-2 font-mono font-black">{it.so_luong}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const list = [...(bookingModal.data.dich_vu_list || [])];
                                list[idx].so_luong += 1;
                                const totalDv = list.reduce((s: number, d: any) => s + (Number(d.so_luong) * Number(d.don_gia)), 0);
                                setBookingModal({
                                  ...bookingModal,
                                  data: {
                                    ...bookingModal.data,
                                    dich_vu_list: list,
                                    tong_tien: Number(bookingModal.data.tien_san || 0) + totalDv
                                  }
                                });
                              }}
                              className="px-2 py-0.5 hover:bg-slate-200 dark:hover:bg-emerald-950 font-bold"
                            >
                              +
                            </button>
                          </div>
                          <div className="font-black text-emerald-600 dark:text-emerald-400 w-16 text-right font-mono text-[11px]">
                            {(Number(it.so_luong) * Number(it.don_gia)).toLocaleString('vi-VN')} đ
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const list = bookingModal.data.dich_vu_list.filter((_: any, i: number) => i !== idx);
                              const totalDv = list.reduce((s: number, d: any) => s + (Number(d.so_luong) * Number(d.don_gia)), 0);
                              setBookingModal({
                                ...bookingModal,
                                data: {
                                  ...bookingModal.data,
                                  dich_vu_list: list,
                                  tong_tien: Number(bookingModal.data.tien_san || 0) + totalDv
                                }
                              });
                            }}
                            className="text-rose-500 hover:text-rose-700 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic mb-2">Chưa thêm dịch vụ nào vào đơn đặt sân này.</p>
                )}

                {/* Dropdown chọn thêm dịch vụ */}
                <div className="flex gap-2">
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      const sId = Number(e.target.value);
                      if (!sId) return;
                      const s = serviceList.find(item => item.id === sId);
                      if (!s) return;
                      const currentList = [...(bookingModal.data.dich_vu_list || [])];
                      const existIdx = currentList.findIndex((item: any) => Number(item.ma_dich_vu) === sId);
                      if (existIdx >= 0) {
                        currentList[existIdx].so_luong += 1;
                      } else {
                        currentList.push({
                          ma_dich_vu: s.id,
                          ten_dich_vu: s.ten_dich_vu,
                          so_luong: 1,
                          don_gia: s.don_gia,
                          don_vi_tinh: s.don_vi_tinh
                        });
                      }
                      const totalDv = currentList.reduce((sum: number, d: any) => sum + (Number(d.so_luong) * Number(d.don_gia)), 0);
                      setBookingModal({
                        ...bookingModal,
                        data: {
                          ...bookingModal.data,
                          dich_vu_list: currentList,
                          tong_tien: Number(bookingModal.data.tien_san || 0) + totalDv
                        }
                      });
                      e.target.value = "";
                    }}
                    className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#0a150e] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                  >
                    <option value="">+ Chọn mặt hàng dịch vụ thêm vào đơn...</option>
                    {serviceList.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.ten_dich_vu} — {Number(s.don_gia).toLocaleString('vi-VN')} đ (Còn: {s.ton_kho} {s.don_vi_tinh})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-black uppercase mb-1">Trạng Thái Đơn</label>
                <select
                  value={bookingModal.data.trang_thai || 'CHO_THANH_TOAN'}
                  onChange={(e) => {
                    const nextStatus = e.target.value;
                    const curTotal = Number(bookingModal.data.tong_tien || bookingModal.data.tien_san || 0);
                    let nextLoaiTT = '';
                    let nextSoTien = 0;
                    if (nextStatus === 'DA_THANH_TOAN') {
                      nextLoaiTT = 'TRA_HET';
                      nextSoTien = curTotal;
                    } else if (nextStatus === 'DA_COC') {
                      nextLoaiTT = 'DAT_COC';
                      nextSoTien = Math.round(curTotal * 0.3);
                    } else {
                      nextLoaiTT = '';
                      nextSoTien = 0;
                    }
                    setBookingModal({
                      ...bookingModal,
                      data: {
                        ...bookingModal.data,
                        trang_thai: nextStatus,
                        loai_thanh_toan: nextLoaiTT,
                        so_tien: nextSoTien
                      }
                    });
                  }}
                  className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                >
                  <option value="CHO_THANH_TOAN">Chưa Thanh Toán</option>
                  <option value="DA_COC">Đã Cọc (30%)</option>
                  <option value="DA_THANH_TOAN">Đã Thanh Toán (100%)</option>
                </select>
                {bookingModal.data.trang_thai === 'DA_COC' && (
                  <p className="mt-1 text-[11px] text-sky-500 font-medium">
                    ⚡ Số tiền cọc cần trả: <strong>{(Number(bookingModal.data.so_tien || Math.round(Number(bookingModal.data.tong_tien || bookingModal.data.tien_san || 0) * 0.3))).toLocaleString('vi-VN')} đ</strong> (30% tổng đơn)
                  </p>
                )}
                {bookingModal.data.trang_thai === 'DA_THANH_TOAN' && (
                  <p className="mt-1 text-[11px] text-emerald-500 font-medium">
                    ⚡ Đã thanh toán toàn bộ: <strong>{Number(bookingModal.data.tong_tien || bookingModal.data.tien_san || 0).toLocaleString('vi-VN')} đ</strong>
                  </p>
                )}
                {(bookingModal.data.trang_thai === 'CHO_THANH_TOAN' || !bookingModal.data.trang_thai) && (
                  <p className="mt-1 text-[11px] text-amber-500 font-medium">
                    ⚡ Đơn chưa thanh toán (Số tiền thanh toán: 0 đ)
                  </p>
                )}
              </div>

              <div>
                <label className="block font-black uppercase mb-1">Ghi Chú</label>
                <input
                  type="text"
                  placeholder="Ghi chú thêm cho đơn..."
                  value={bookingModal.data.ghi_chu || ''}
                  onChange={(e) => setBookingModal({ ...bookingModal, data: { ...bookingModal.data, ghi_chu: e.target.value } })}
                  className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                <div className="text-xs">
                  <span className="text-slate-500 font-bold">Tổng Thanh Toán: </span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm font-mono">
                    {Number(bookingModal.data.tong_tien || bookingModal.data.tien_san || 0).toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setBookingModal({ isOpen: false, mode: 'ADD', data: {} })} className="px-4 py-2 rounded-xl font-bold bg-slate-200 text-slate-800 cursor-pointer">Hủy</button>
                  <button type="submit" className="px-5 py-2 rounded-xl font-black bg-emerald-600 text-white cursor-pointer hover:bg-emerald-500">Lưu Đơn Đặt Sân</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6b. Modal Khung Giờ (Khung_Gio) */}
      {khungGioModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl ${isDarkMode ? 'bg-[#0a150e] border-emerald-900/60 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}>
            <div className="flex items-center justify-between pb-3 border-b mb-4">
              <h3 className="font-black text-base">{khungGioModal.mode === 'ADD' ? '⏰ Thêm Khung Giờ Mới' : '✏️ Cập Nhật Khung Giờ'}</h3>
              <button onClick={() => setKhungGioModal({ isOpen: false, mode: 'ADD', data: {} })}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveKhungGio} className="space-y-4 text-xs">
              <div>
                <label className="block font-black uppercase mb-1">Nhãn Hiển Thị (Ví dụ: 6h, 6h30, 19h30...) *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: 19h30"
                  value={khungGioModal.data.nhan_hien_thi || ''}
                  onChange={(e) => setKhungGioModal({ ...khungGioModal, data: { ...khungGioModal.data, nhan_hien_thi: e.target.value } })}
                  className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black uppercase mb-1">Giờ Bắt Đầu (HH:mm) *</label>
                  <input
                    type="text"
                    required
                    placeholder="19:30"
                    value={khungGioModal.data.gio_bat_dau || ''}
                    onChange={(e) => setKhungGioModal({ ...khungGioModal, data: { ...khungGioModal.data, gio_bat_dau: e.target.value } })}
                    className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                  />
                </div>
                <div>
                  <label className="block font-black uppercase mb-1">Giờ Kết Thúc (HH:mm) *</label>
                  <input
                    type="text"
                    required
                    placeholder="20:00"
                    value={khungGioModal.data.gio_ket_thuc || ''}
                    onChange={(e) => setKhungGioModal({ ...khungGioModal, data: { ...khungGioModal.data, gio_ket_thuc: e.target.value } })}
                    className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black uppercase mb-1">Thứ Tự Sắp Xếp</label>
                  <input
                    type="number"
                    min="1"
                    value={khungGioModal.data.thu_tu || 1}
                    onChange={(e) => setKhungGioModal({ ...khungGioModal, data: { ...khungGioModal.data, thu_tu: Number(e.target.value) } })}
                    className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                  />
                </div>
                <div>
                  <label className="block font-black uppercase mb-1">Trạng Thái</label>
                  <select
                    value={khungGioModal.data.trang_thai === false ? '0' : '1'}
                    onChange={(e) => setKhungGioModal({ ...khungGioModal, data: { ...khungGioModal.data, trang_thai: e.target.value === '1' } })}
                    className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                  >
                    <option value="1">🟢 Hoạt động (Hiển thị)</option>
                    <option value="0">🔴 Tạm tắt (Ẩn)</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setKhungGioModal({ isOpen: false, mode: 'ADD', data: {} })} className="px-4 py-2 rounded-xl font-bold bg-slate-200 text-slate-800 cursor-pointer">Hủy</button>
                <button type="submit" className="px-5 py-2 rounded-xl font-black bg-emerald-600 text-white cursor-pointer hover:bg-emerald-500">Lưu Khung Giờ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Modal Hoàn Tiền (Lich_Su_Hoan_Tien) */}
      {refundModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl ${isDarkMode ? 'bg-[#0a150e] border-emerald-900/60 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}>
            <div className="flex items-center justify-between pb-3 border-b mb-4">
              <h3 className="font-black text-base">{refundModal.mode === 'ADD' ? '💸 Tạo Phiếu Hoàn Tiền' : '✏️ Cập Nhật Phiếu Hoàn'}</h3>
              <button onClick={() => setRefundModal({ isOpen: false, mode: 'ADD', data: {} })}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveRefund} className="space-y-4 text-xs">
              <div>
                <label className="block font-black uppercase mb-1">Mã Đơn Đặt Sân</label>
                <input
                  type="number"
                  value={refundModal.data.ma_don_dat || 101}
                  onChange={(e) => setRefundModal({ ...refundModal, data: { ...refundModal.data, ma_don_dat: Number(e.target.value) } })}
                  className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                />
              </div>
              <div>
                <label className="block font-black uppercase mb-1">Số Tiền Hoàn (VNĐ) *</label>
                <input
                  type="number"
                  value={refundModal.data.so_tien_hoan || 100000}
                  onChange={(e) => setRefundModal({ ...refundModal, data: { ...refundModal.data, so_tien_hoan: Number(e.target.value) } })}
                  className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                />
              </div>
              <div>
                <label className="block font-black uppercase mb-1">Tỷ Lệ Hoàn Cọc (%)</label>
                <input
                  type="number"
                  value={refundModal.data.ty_le_hoan || 100}
                  onChange={(e) => setRefundModal({ ...refundModal, data: { ...refundModal.data, ty_le_hoan: Number(e.target.value) } })}
                  className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                />
              </div>
              <div>
                <label className="block font-black uppercase mb-1">Lý Do Hủy Sân</label>
                <input
                  type="text"
                  value={refundModal.data.ly_do_huy || ''}
                  onChange={(e) => setRefundModal({ ...refundModal, data: { ...refundModal.data, ly_do_huy: e.target.value } })}
                  placeholder="Khách báo hủy trước 24h"
                  className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setRefundModal({ isOpen: false, mode: 'ADD', data: {} })} className="px-4 py-2 rounded-xl font-bold bg-slate-200 text-slate-800 cursor-pointer">Hủy</button>
                <button type="submit" className="px-5 py-2 rounded-xl font-black bg-rose-600 text-white cursor-pointer">Lưu Phiếu Hoàn</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Modal Người Dùng (Nguoi_Dung) */}
      {userModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-lg p-6 rounded-3xl border shadow-2xl ${isDarkMode ? 'bg-[#0a150e] border-emerald-900/60 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}>
            <div className="flex items-center justify-between pb-3 border-b mb-4">
              <h3 className="font-black text-base flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-600" />
                {userModal.mode === 'ADD' ? 'Thêm Tài Khoản Mới' : 'Cập Nhật Tài Khoản Người Dùng'}
              </h3>
              <button onClick={() => setUserModal({ isOpen: false, mode: 'ADD', data: {} })} className="cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
              {/* Preview & Avatar URL */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#060e09] border border-slate-200 dark:border-emerald-950 flex items-center gap-4">
                <div className="shrink-0">
                  {userModal.data.anh_dai_dien ? (
                    <img
                      src={userModal.data.anh_dai_dien}
                      alt="Preview"
                      className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500 shadow-md"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(userModal.data.ho_ten || 'User') + '&background=059669&color=fff';
                      }}
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-emerald-600/20 border-2 border-emerald-500 text-emerald-600 dark:text-emerald-300 font-black flex items-center justify-center text-lg shadow-inner">
                      {(userModal.data.ho_ten || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <label className="block font-black uppercase mb-1">Đường Dẫn Ảnh Đại Diện (Avatar URL)</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/... hoặc link ảnh"
                    value={userModal.data.anh_dai_dien || ''}
                    onChange={(e) => setUserModal({ ...userModal, data: { ...userModal.data, anh_dai_dien: e.target.value } })}
                    className={`w-full p-2 rounded-xl border font-mono text-[11px] ${isDarkMode ? 'bg-[#0a150e] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                  />
                  <span className="text-[10px] text-slate-400">Có thể dán link ảnh từ Unsplash, Imgur hoặc Google</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-black uppercase mb-1">Họ Và Tên *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Nguyễn Văn A"
                    value={userModal.data.ho_ten || ''}
                    onChange={(e) => setUserModal({ ...userModal, data: { ...userModal.data, ho_ten: e.target.value } })}
                    className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                  />
                </div>
                <div>
                  <label className="block font-black uppercase mb-1">Email (Đăng Nhập) *</label>
                  <input
                    type="email"
                    required
                    placeholder="user@example.com"
                    value={userModal.data.email || ''}
                    onChange={(e) => setUserModal({ ...userModal, data: { ...userModal.data, email: e.target.value } })}
                    className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-black uppercase mb-1">Số Điện Thoại</label>
                  <input
                    type="text"
                    placeholder="0987654321"
                    value={userModal.data.so_dien_thoai || ''}
                    onChange={(e) => setUserModal({ ...userModal, data: { ...userModal.data, so_dien_thoai: e.target.value } })}
                    className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                  />
                </div>
                <div>
                  <label className="block font-black uppercase mb-1">Vai Trò Hệ Thống</label>
                  <select
                    value={userModal.data.vai_tro || 'KHACH_HANG'}
                    onChange={(e) => setUserModal({ ...userModal, data: { ...userModal.data, vai_tro: e.target.value as any } })}
                    className={`w-full p-2.5 rounded-xl border font-black ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                  >
                    <option value="ADMIN">🛡️ ADMIN (Toàn quyền)</option>
                    <option value="NHAN_VIEN">💼 NHÂN VIÊN (Quản lý sân)</option>
                    <option value="KHACH_HANG">⚽ KHÁCH HÀNG</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-black uppercase mb-1">
                  Mật Khẩu {userModal.mode === 'EDIT' ? '(Để trống nếu giữ nguyên)' : '* (Mặc định: 123456)'}
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder={userModal.mode === 'EDIT' ? 'Nhập mật khẩu mới nếu muốn đổi...' : 'Nhập mật khẩu...'}
                    value={userModal.data.mat_khau !== undefined ? userModal.data.mat_khau : ''}
                    onChange={(e) => setUserModal({ ...userModal, data: { ...userModal.data, mat_khau: e.target.value } })}
                    className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setUserModal({ isOpen: false, mode: 'ADD', data: {} })} className="px-4 py-2 rounded-xl font-bold bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 cursor-pointer">Hủy</button>
                <button type="submit" className="px-5 py-2 rounded-xl font-black bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-lg">Lưu Tài Khoản</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. Modal Vai Trò (Vai_Tro) */}
      {roleModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl ${isDarkMode ? 'bg-[#0a150e] border-emerald-900/60 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}>
            <div className="flex items-center justify-between pb-3 border-b mb-4">
              <h3 className="font-black text-base">{roleModal.mode === 'ADD' ? '🛡️ Thêm Vai Trò Mới' : '✏️ Cập Nhật Vai Trò'}</h3>
              <button onClick={() => setRoleModal({ isOpen: false, mode: 'ADD', data: {} })}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveRole} className="space-y-4 text-xs">
              <div>
                <label className="block font-black uppercase mb-1">Tên Vai Trò (Ví dụ: QUAN_LY, KE_TOAN) *</label>
                <input
                  type="text"
                  value={roleModal.data.TenVaiTro || ''}
                  onChange={(e) => setRoleModal({ ...roleModal, data: { ...roleModal.data, TenVaiTro: e.target.value } })}
                  placeholder="QUAN_LY"
                  className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                />
              </div>
              <div>
                <label className="block font-black uppercase mb-1">Mô Tả Quyền Hạn</label>
                <input
                  type="text"
                  value={roleModal.data.MoTa || ''}
                  onChange={(e) => setRoleModal({ ...roleModal, data: { ...roleModal.data, MoTa: e.target.value } })}
                  placeholder="Quản lý sân bóng và nhân sự quầy"
                  className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setRoleModal({ isOpen: false, mode: 'ADD', data: {} })} className="px-4 py-2 rounded-xl font-bold bg-slate-200 text-slate-800 cursor-pointer">Hủy</button>
                <button type="submit" className="px-5 py-2 rounded-xl font-black bg-emerald-600 text-white cursor-pointer">Lưu Vai Trò</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. Mini POS Bán Nước Modal */}
      {miniPosModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl ${isDarkMode ? 'bg-[#0a150e] border-emerald-900/60 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}>
            <div className="flex items-center justify-between pb-3 border-b mb-4">
              <h3 className="font-black text-base flex items-center gap-2">🥤 Bán Thêm Nước / Dịch Vụ Cho Đơn #{miniPosModal.booking?.id}</h3>
              <button onClick={() => setMiniPosModal({ isOpen: false, booking: null, maDichVuChon: 1, soLuong: 1 })}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleConfirmAddService} className="space-y-4 text-xs">
              <div>
                <label className="block font-black uppercase mb-1">Chọn Dịch Vụ</label>
                <select
                  value={miniPosModal.maDichVuChon}
                  onChange={(e) => setMiniPosModal({ ...miniPosModal, maDichVuChon: Number(e.target.value) })}
                  className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                >
                  {serviceList.map((s) => (
                    <option key={s.id} value={s.id}>{s.ten_dich_vu} - {Number(s.don_gia).toLocaleString('vi-VN')} đ (Còn {s.ton_kho})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-black uppercase mb-1">Số Lượng Bán</label>
                <input
                  type="number"
                  min="1"
                  value={miniPosModal.soLuong}
                  onChange={(e) => setMiniPosModal({ ...miniPosModal, soLuong: Number(e.target.value) })}
                  className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setMiniPosModal({ isOpen: false, booking: null, maDichVuChon: 1, soLuong: 1 })} className="px-4 py-2 rounded-xl font-bold bg-slate-200 text-slate-800 cursor-pointer">Hủy</button>
                <button type="submit" className="px-5 py-2 rounded-xl font-black bg-emerald-600 text-white cursor-pointer">Xác Nhận Bán</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 11. Modal Checkout Trả Sân */}
      {checkoutModal.isOpen && checkoutModal.booking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-lg p-6 rounded-3xl border shadow-2xl ${isDarkMode ? 'bg-[#0a150e] border-emerald-900/60 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}>
            <div className="flex items-center justify-between pb-3 border-b mb-4">
              <h3 className="font-black text-base flex items-center gap-2">🧾 Trả Sân & Xuất Hóa Đơn #{checkoutModal.booking.id}</h3>
              <button onClick={() => setCheckoutModal({ isOpen: false, booking: null, paymentMethod: 'TIEN_MAT', discount: 0 })}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleConfirmCheckout} className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-100 dark:bg-[#060e09] space-y-2">
                <div className="flex justify-between"><span>Khách hàng:</span><strong className="font-black">{checkoutModal.booking.ten_khach_hang}</strong></div>
                <div className="flex justify-between"><span>Sân bóng:</span><strong>{checkoutModal.booking.ten_san}</strong></div>
                <div className="flex justify-between"><span>Tiền sân:</span><strong>{Number(checkoutModal.booking.tien_san).toLocaleString('vi-VN')} đ</strong></div>
                <div className="flex justify-between"><span>Đã cọc:</span><strong className="text-emerald-600">-{Number(checkoutModal.booking.tien_coc_da_tra).toLocaleString('vi-VN')} đ</strong></div>
                <div className="flex justify-between pt-2 border-t text-sm font-black text-rose-600">
                  <span>CÒN LẠI CẦN THU:</span>
                  <span>{Math.max(0, (checkoutModal.booking.tong_tien || 0) - (checkoutModal.booking.tien_coc_da_tra || 0)).toLocaleString('vi-VN')} đ</span>
                </div>
              </div>
              <div>
                <label className="block font-black uppercase mb-1">Phương Thức Thanh Toán</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['TIEN_MAT', 'CHUYEN_KHOAN'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setCheckoutModal({ ...checkoutModal, paymentMethod: m })}
                      className={`p-2.5 rounded-xl border font-black text-xs cursor-pointer ${
                        checkoutModal.paymentMethod === m ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {m === 'TIEN_MAT' ? '💵 Tiền Mặt' : '🏦 Chuyển Khoản'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setCheckoutModal({ isOpen: false, booking: null, paymentMethod: 'TIEN_MAT', discount: 0 })} className="px-4 py-2 rounded-xl font-bold bg-slate-200 text-slate-800 cursor-pointer">Hủy</button>
                <button type="submit" className="px-5 py-2 rounded-xl font-black bg-rose-600 text-white cursor-pointer">Xác Nhận Thu Tiền & Trả Sân</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 12. Modal Xác Nhận Xóa Chung (Universal Delete Confirmation Modal) */}
      {deleteConfirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl transition-all scale-100 ${isDarkMode ? 'bg-[#0a150e] border-rose-900/60 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0 text-rose-600 dark:text-rose-400">
                <Trash2 className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                  {deleteConfirmModal.title || 'Xác nhận xóa'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {deleteConfirmModal.message}
                </p>
              </div>
            </div>

            {deleteConfirmModal.itemDescription && (
              <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 mb-5">
                <div className="text-[11px] font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Dữ liệu bị xóa: <strong className="underline decoration-rose-400 underline-offset-2">{deleteConfirmModal.itemDescription}</strong></span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 pl-5">
                  Hành động này không thể hoàn tác sau khi thực hiện.
                </div>
              </div>
            )}

            <div className="flex justify-end items-center gap-2 pt-2 border-t border-slate-100 dark:border-emerald-950">
              <button
                type="button"
                onClick={() => setDeleteConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 dark:bg-[#060e09] dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={async () => {
                  const onConfirm = deleteConfirmModal.onConfirm;
                  setDeleteConfirmModal((prev) => ({ ...prev, isOpen: false }));
                  if (onConfirm) await onConfirm();
                }}
                className="px-5 py-2.5 rounded-xl font-black text-xs bg-rose-600 hover:bg-rose-500 text-white cursor-pointer shadow-lg shadow-rose-600/30 flex items-center gap-1.5 transition-all"
              >
                <Trash2 className="w-4 h-4 stroke-[2.5]" /> Xác Nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 13. Modal Banner Quảng Cáo (Banner) */}
      {bannerModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className={`w-full max-w-xl p-5 sm:p-6 rounded-3xl border shadow-2xl my-auto ${isDarkMode ? 'bg-[#0a150e] border-emerald-900/60 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-emerald-900/40 mb-4">
              <h3 className="font-black text-sm sm:text-base flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-emerald-600" />
                <span>{bannerModal.mode === 'ADD' ? '🖼️ Thêm Banner Quảng Cáo' : '✏️ Cập Nhật Banner'}</span>
              </h3>
              <button 
                onClick={() => setBannerModal({ isOpen: false, mode: 'ADD', data: { loai_banner: 'IMAGE', thu_tu: 1, trang_thai: 1 } })}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBanner} className="space-y-4 text-xs">
              <div>
                <label className="block font-black uppercase mb-1 text-slate-400">Tiêu Đề Banner</label>
                <input
                  type="text"
                  value={bannerModal.data.tieu_de || ''}
                  onChange={(e) => setBannerModal({ ...bannerModal, data: { ...bannerModal.data, tieu_de: e.target.value } })}
                  placeholder="Ví dụ: Siêu Khuyến Mãi Giờ Vàng Mùa Hè"
                  className={`w-full px-3 py-2.5 rounded-xl border font-bold text-xs ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black uppercase mb-1 text-slate-400">Loại Banner *</label>
                  <select
                    value={bannerModal.data.loai_banner || 'IMAGE'}
                    onChange={(e) => setBannerModal({ ...bannerModal, data: { ...bannerModal.data, loai_banner: e.target.value as any } })}
                    className={`w-full px-3 py-2.5 rounded-xl border font-bold text-xs ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                  >
                    <option value="IMAGE">🖼️ Hình Ảnh (Image)</option>
                    <option value="VIDEO">🎥 Video MP4 / WebM</option>
                  </select>
                </div>
                <div>
                  <label className="block font-black uppercase mb-1 text-slate-400">Thứ Tự Hiển Thị</label>
                  <input
                    type="number"
                    min="1"
                    value={bannerModal.data.thu_tu ?? 1}
                    onChange={(e) => setBannerModal({ ...bannerModal, data: { ...bannerModal.data, thu_tu: parseInt(e.target.value) || 1 } })}
                    className={`w-full px-3 py-2.5 rounded-xl border font-bold text-xs ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                  />
                </div>
              </div>

              {/* 1. TẢI FILE ẢNH BANNER HOẶC DÁN LINK URL (CHỈ HIỂN THỊ KHI CHỌN LOẠI HÌNH ẢNH) */}
              {bannerModal.data.loai_banner !== 'VIDEO' && (
                <div>
                  <label className="block font-black uppercase mb-1 text-slate-400">Hình Ảnh Banner (Tải File từ máy hoặc Nhập URL) *</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      value={bannerModal.data.hinh_anh || ''}
                      onChange={(e) => setBannerModal({ ...bannerModal, data: { ...bannerModal.data, hinh_anh: e.target.value } })}
                      placeholder="https://... hoặc bấm nút Tải File Ảnh"
                      className={`flex-1 px-3 py-2.5 rounded-xl border font-mono text-xs ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                    />
                    <label className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer flex items-center gap-1.5 shrink-0 shadow-md transition-all hover:scale-105">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploadingImage ? 'Đang tải...' : 'Tải File Ảnh'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploadingImage}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadBannerFile(file, 'IMAGE');
                        }}
                      />
                    </label>
                  </div>
                  {bannerModal.data.hinh_anh && (
                    <div className="mt-2 p-2 rounded-xl border border-slate-200 dark:border-emerald-900 bg-slate-50 dark:bg-[#060e09] flex items-center gap-3">
                      <img src={bannerModal.data.hinh_anh} alt="Preview" className="w-24 h-14 object-cover rounded-lg border border-slate-200 shadow-sm" />
                      <span className="text-[11px] text-slate-400 font-bold">✓ Ảnh xem trước hợp lệ</span>
                    </div>
                  )}
                </div>
              )}

              {/* 2. TẢI FILE VIDEO BANNER HOẶC DÁN LINK URL (CHỈ HIỂN THỊ KHI CHỌN LOẠI VIDEO) */}
              {bannerModal.data.loai_banner === 'VIDEO' && (
                <div>
                  <label className="block font-black uppercase mb-1 text-slate-400">File Video Banner (Tải File Video hoặc Nhập URL) *</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      value={bannerModal.data.video_url || ''}
                      onChange={(e) => setBannerModal({ ...bannerModal, data: { ...bannerModal.data, video_url: e.target.value } })}
                      placeholder="https://... hoặc bấm nút Tải File Video (.mp4, .webm)"
                      className={`flex-1 px-3 py-2.5 rounded-xl border font-mono text-xs ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                    />
                    <label className="px-3.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer flex items-center gap-1.5 shrink-0 shadow-md transition-all hover:scale-105">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploadingImage ? 'Đang tải...' : 'Tải File Video'}</span>
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/ogg,video/*"
                        disabled={isUploadingImage}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadBannerFile(file, 'VIDEO');
                        }}
                      />
                    </label>
                  </div>
                  {bannerModal.data.video_url && (
                    <div className="mt-2 p-2 rounded-xl border border-slate-200 dark:border-emerald-900 bg-slate-50 dark:bg-[#060e09] flex items-center gap-3">
                      <video src={bannerModal.data.video_url} className="w-24 h-14 object-cover rounded-lg bg-black" muted autoPlay loop />
                      <span className="text-[11px] text-purple-400 font-bold">✓ Video xem trước hợp lệ</span>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block font-black uppercase mb-1 text-slate-400">Link Điều Hướng (Khi khách bấm vào)</label>
                <input
                  type="text"
                  value={bannerModal.data.link_dieu_huong || ''}
                  onChange={(e) => setBannerModal({ ...bannerModal, data: { ...bannerModal.data, link_dieu_huong: e.target.value } })}
                  placeholder="/dat-san hoặc /tin-tuc hoặc https://..."
                  className={`w-full px-3 py-2.5 rounded-xl border font-mono text-xs ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                />
              </div>

              <div>
                <label className="block font-black uppercase mb-1 text-slate-400">Trạng Thái</label>
                <div className="flex gap-4 items-center">
                  <label className="flex items-center gap-2 cursor-pointer font-bold">
                    <input
                      type="radio"
                      name="banner_status"
                      checked={(bannerModal.data.trang_thai as any) == 1 || (bannerModal.data.trang_thai as any) === true}
                      onChange={() => setBannerModal({ ...bannerModal, data: { ...bannerModal.data, trang_thai: 1 } })}
                    />
                    <span className="text-emerald-500">Hiển Thị Trên Trang Chủ</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold">
                    <input
                      type="radio"
                      name="banner_status"
                      checked={(bannerModal.data.trang_thai as any) == 0 || (bannerModal.data.trang_thai as any) === false}
                      onChange={() => setBannerModal({ ...bannerModal, data: { ...bannerModal.data, trang_thai: 0 } })}
                    />
                    <span className="text-slate-400">Tạm Ẩn</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-emerald-900/40">
                <button
                  type="button"
                  onClick={() => setBannerModal({ isOpen: false, mode: 'ADD', data: { loai_banner: 'IMAGE', thu_tu: 1, trang_thai: 1 } })}
                  className="px-4 py-2.5 rounded-xl font-bold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isUploadingImage}
                  className="px-5 py-2.5 rounded-xl font-black bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-lg shadow-emerald-600/30 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> Lưu Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 14. Modal Chi Tiết Liên Hệ (Lien_He) */}
      {lienHeDetailModal.isOpen && lienHeDetailModal.data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-lg p-5 sm:p-6 rounded-3xl border shadow-2xl ${isDarkMode ? 'bg-[#0a150e] border-emerald-900/60 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-emerald-900/40 mb-4">
              <h3 className="font-black text-sm sm:text-base flex items-center gap-2">
                <Mail className="w-5 h-5 text-emerald-600" />
                <span>Chi Tiết Phản Hồi Từ #{lienHeDetailModal.data.ho_ten}</span>
              </h3>
              <button 
                onClick={() => setLienHeDetailModal({ isOpen: false, data: null })}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#060e09] border border-slate-200 dark:border-emerald-900/40 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Họ & tên:</span>
                  <span className="font-black text-sm text-slate-900 dark:text-white">{lienHeDetailModal.data.ho_ten}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Email:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{lienHeDetailModal.data.email || '(Không có)'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Số điện thoại:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{lienHeDetailModal.data.so_dien_thoai || '(Không có)'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Ngày gửi:</span>
                  <span className="font-mono">{lienHeDetailModal.data.ngay_gui ? formatVNDate(lienHeDetailModal.data.ngay_gui) : '---'}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-emerald-900/30">
                  <span className="text-slate-400">Trạng thái:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                    lienHeDetailModal.data.trang_thai === 'DA_XU_LY' || (lienHeDetailModal.data as any).trang_thai_xu_ly === 'DA_XU_LY'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}>
                    {(lienHeDetailModal.data.trang_thai === 'DA_XU_LY' || (lienHeDetailModal.data as any).trang_thai_xu_ly === 'DA_XU_LY') ? '✓ Đã xử lý' : '⏳ Chưa xử lý'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-black uppercase text-[11px] text-slate-400 mb-1">Tiêu Đề Thư</label>
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-[#060e09] font-black text-slate-900 dark:text-white">
                  {lienHeDetailModal.data.tieu_de || '(Không có tiêu đề)'}
                </div>
              </div>

              <div>
                <label className="block font-black uppercase text-[11px] text-slate-400 mb-1">Nội Dung Tin Nhắn</label>
                <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-[#060e09] text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                  {lienHeDetailModal.data.noi_dung}
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-emerald-900/40">
                <button
                  type="button"
                  onClick={async () => {
                    if (!lienHeDetailModal.data) return;
                    await handleUpdateLienHeStatus(lienHeDetailModal.data.id, (lienHeDetailModal.data.trang_thai || (lienHeDetailModal.data as any).trang_thai_xu_ly));
                    setLienHeDetailModal({ isOpen: false, data: null });
                  }}
                  className="px-4 py-2.5 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-white cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Chuyển Trạng Thái Xử Lý
                </button>
                <button
                  type="button"
                  onClick={() => setLienHeDetailModal({ isOpen: false, data: null })}
                  className="px-4 py-2.5 rounded-xl font-bold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 14.1. Modal Soạn Thư Trả Lời Liên Hệ (Gửi Gmail cho Khách hoặc Fallback về Admin) */}
      {replyLienHeModal.isOpen && replyLienHeModal.data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className={`w-full max-w-2xl p-5 sm:p-7 rounded-3xl border shadow-2xl my-4 ${isDarkMode ? 'bg-[#0a150e] border-emerald-900/60 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-emerald-900/40 mb-4">
              <div>
                <h3 className="font-black text-base sm:text-lg flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <MessageSquareReply className="w-5 h-5" />
                  <span>Soạn Thư Phản Hồi Khách Hàng</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Gửi thư trả lời trực tiếp đến Gmail của khách hàng</p>
              </div>
              <button 
                onClick={() => setReplyLienHeModal({ isOpen: false, data: null, tieu_de_tra_loi: '', noi_dung_tra_loi: '', isSubmitting: false })}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReplyLienHeSubmit} className="space-y-4 text-xs">
              {/* Thông tin người nhận */}
              <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-[#060e09] border border-blue-200/80 dark:border-blue-900/40 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-[11px] text-slate-400 block font-bold">Người nhận:</span>
                  <span className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1 mt-0.5">
                    <User className="w-3.5 h-3.5 text-blue-500" />
                    {replyLienHeModal.data.ho_ten}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-bold">Địa chỉ Email:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400 truncate block mt-0.5">
                    {replyLienHeModal.data.email ? `✉️ ${replyLienHeModal.data.email}` : '⚠️ (Khách không có email)'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-bold">Số điện thoại:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                    📞 {replyLienHeModal.data.so_dien_thoai || '---'}
                  </span>
                </div>
              </div>

              {/* Tóm tắt nội dung câu hỏi ban đầu */}
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-bold text-slate-500 dark:text-slate-400">📌 Yêu cầu ban đầu:</span>
                  <span className="font-black text-slate-700 dark:text-slate-300">{replyLienHeModal.data.tieu_de || 'Đặt sân / Dịch vụ'}</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 italic line-clamp-2">
                  "{replyLienHeModal.data.noi_dung}"
                </p>
              </div>

              {/* Mẫu trả lời nhanh */}
              <div>
                <label className="block font-black uppercase text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
                  💡 Chọn Mẫu Trả Lời Nhanh (Gợi ý)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setReplyLienHeModal(prev => ({
                        ...prev,
                        noi_dung_tra_loi: `Chào bạn ${prev.data?.ho_ten},\n\nSoccer247 đã tiếp nhận yêu cầu đặt sân sự kiện của bạn. Chúng tôi hiện còn các khung giờ thi đấu phù hợp. Bạn vui lòng chuẩn bị số lượng đội tham gia và liên hệ Hotline 0816344504 để ban quản lý giữ sân nhé!\n\nTrân trọng,\nBan Quản Lý Soccer247.`
                      }));
                    }}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-emerald-100 dark:bg-slate-800 dark:hover:bg-emerald-950/60 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    ⚽ Đặt sân sự kiện / Giải đấu
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReplyLienHeModal(prev => ({
                        ...prev,
                        noi_dung_tra_loi: `Chào bạn ${prev.data?.ho_ten},\n\nCảm ơn bạn đã quan tâm. Về bảng giá thuê sân theo tháng và các ưu đãi giờ vàng, Soccer247 đang có chính sách giảm 20% cho hợp đồng định kỳ. Bạn có thể kiểm tra lịch trống trực tiếp trên trang chủ hoặc liên hệ Hotline để làm hợp đồng giữ sân nhé!\n\nTrân trọng,\nBan Quản Lý Soccer247.`
                      }));
                    }}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-blue-100 dark:bg-slate-800 dark:hover:bg-blue-950/60 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    💰 Bảng giá thuê sân tháng
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReplyLienHeModal(prev => ({
                        ...prev,
                        noi_dung_tra_loi: `Chào bạn ${prev.data?.ho_ten},\n\nSoccer247 chân thành cảm ơn ý kiến đóng góp quý báu của bạn để nâng cao chất lượng dịch vụ cụm sân. Ban quản lý đã ghi nhận và sẽ kiểm tra, cải thiện ngay trong tuần này.\n\nChúc bạn có những phút giây thi đấu tuyệt vời cùng Soccer247!`
                      }));
                    }}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-purple-100 dark:bg-slate-800 dark:hover:bg-purple-950/60 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    🤝 Tiếp thu góp ý dịch vụ
                  </button>
                </div>
              </div>

              {/* Tiêu đề phản hồi */}
              <div>
                <label className="block font-black uppercase text-[11px] text-slate-600 dark:text-slate-300 mb-1">
                  Tiêu Đề Email Phản Hồi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={replyLienHeModal.tieu_de_tra_loi}
                  onChange={(e) => setReplyLienHeModal({ ...replyLienHeModal, tieu_de_tra_loi: e.target.value })}
                  placeholder="Nhập tiêu đề thư..."
                  className={`w-full p-2.5 rounded-xl border font-bold text-xs ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                />
              </div>

              {/* Nội dung phản hồi */}
              <div>
                <label className="block font-black uppercase text-[11px] text-slate-600 dark:text-slate-300 mb-1">
                  Nội Dung Thư Trả Lời <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={6}
                  value={replyLienHeModal.noi_dung_tra_loi}
                  onChange={(e) => setReplyLienHeModal({ ...replyLienHeModal, noi_dung_tra_loi: e.target.value })}
                  placeholder="Kính gửi quý khách... (Nhập chi tiết thông tin phản hồi, hướng dẫn hoặc giải đáp yêu cầu của khách hàng)"
                  className={`w-full p-3 rounded-xl border font-medium text-xs leading-relaxed resize-none ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                />
              </div>

              {/* Chú thích thông minh */}
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 flex items-start gap-2 text-[11px] text-amber-800 dark:text-amber-300">
                <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <span>
                  <strong>Cơ chế tự động:</strong> Thư sẽ được gửi đến hòm thư của khách hàng. Nếu Gmail khách hàng không tồn tại hoặc lỗi, hệ thống sẽ tự động chuyển tiếp bản sao về Gmail của bạn (<strong>xoancao2.0@gmail.com</strong>) kèm số điện thoại để bạn gọi điện trực tiếp cho khách!
                </span>
              </div>

              {/* Nút hành động */}
              <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-emerald-900/40">
                <button
                  type="button"
                  disabled={replyLienHeModal.isSubmitting}
                  onClick={() => setReplyLienHeModal({ isOpen: false, data: null, tieu_de_tra_loi: '', noi_dung_tra_loi: '', isSubmitting: false })}
                  className="px-4 py-2.5 rounded-xl font-bold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer disabled:opacity-50"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={replyLienHeModal.isSubmitting}
                  className="px-6 py-2.5 rounded-xl font-black bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white cursor-pointer shadow-lg shadow-blue-600/20 flex items-center gap-2 disabled:opacity-60"
                >
                  {replyLienHeModal.isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang Gửi Email...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Gửi Phản Hồi Ngay</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 15. Modal Loại Tin Tức (Loai_Tin_Tuc) */}
      {loaiTinModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md p-5 sm:p-6 rounded-3xl border shadow-2xl ${isDarkMode ? 'bg-[#0a150e] border-emerald-900/60 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-emerald-900/40 mb-4">
              <h3 className="font-black text-sm sm:text-base flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-emerald-600" />
                <span>{loaiTinModal.mode === 'ADD' ? '📁 Thêm Loại Tin Tức Mới' : '✏️ Cập Nhật Loại Tin Tức'}</span>
              </h3>
              <button 
                onClick={() => setLoaiTinModal({ isOpen: false, mode: 'ADD', data: { trang_thai: 1 } })}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLoaiTin} className="space-y-4 text-xs">
              <div>
                <label className="block font-black uppercase mb-1 text-slate-400">Tên Loại Tin Tức *</label>
                <input
                  type="text"
                  required
                  value={loaiTinModal.data.ten_loai || ''}
                  onChange={(e) => setLoaiTinModal({ ...loaiTinModal, data: { ...loaiTinModal.data, ten_loai: e.target.value } })}
                  placeholder="Ví dụ: Tin Giải Đấu, Khuyến Mãi Sân, Cẩm Nang..."
                  className={`w-full px-3 py-2.5 rounded-xl border font-bold text-xs ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                />
              </div>

              <div>
                <label className="block font-black uppercase mb-1 text-slate-400">Trạng Thái</label>
                <div className="flex gap-4 items-center">
                  <label className="flex items-center gap-2 cursor-pointer font-bold">
                    <input
                      type="radio"
                      name="loaitin_status"
                      checked={(loaiTinModal.data.trang_thai as any) == 1 || (loaiTinModal.data.trang_thai as any) === true}
                      onChange={() => setLoaiTinModal({ ...loaiTinModal, data: { ...loaiTinModal.data, trang_thai: 1 } })}
                    />
                    <span className="text-emerald-500">Hoạt Động</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold">
                    <input
                      type="radio"
                      name="loaitin_status"
                      checked={(loaiTinModal.data.trang_thai as any) == 0 || (loaiTinModal.data.trang_thai as any) === false}
                      onChange={() => setLoaiTinModal({ ...loaiTinModal, data: { ...loaiTinModal.data, trang_thai: 0 } })}
                    />
                    <span className="text-slate-400">Tạm Ẩn</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-emerald-900/40">
                <button
                  type="button"
                  onClick={() => setLoaiTinModal({ isOpen: false, mode: 'ADD', data: { trang_thai: 1 } })}
                  className="px-4 py-2.5 rounded-xl font-bold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl font-black bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-lg shadow-emerald-600/30 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> Lưu Loại Tin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 16. Modal Soạn Thảo Tin Tức & Bài Viết (Tin_Tuc) */}
      {newsModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className={`w-full max-w-3xl p-5 sm:p-6 rounded-3xl border shadow-2xl my-auto ${isDarkMode ? 'bg-[#0a150e] border-emerald-900/60 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-emerald-900/40 mb-4">
              <h3 className="font-black text-sm sm:text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <span>{newsModal.mode === 'ADD' ? '📝 Soạn Thảo Bài Viết Tin Tức Mới' : '✏️ Cập Nhật Bài Viết Tin Tức'}</span>
              </h3>
              <button 
                onClick={() => setNewsModal({ isOpen: false, mode: 'ADD', data: { ma_loai_tin: 1, trang_thai: 1 } })}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTinTuc} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block font-black uppercase mb-1 text-slate-400">Tiêu Đề Bài Viết *</label>
                  <input
                    type="text"
                    required
                    value={newsModal.data.tieu_de || ''}
                    onChange={(e) => setNewsModal({ ...newsModal, data: { ...newsModal.data, tieu_de: e.target.value } })}
                    placeholder="Nhập tiêu đề hấp dẫn cho bài viết..."
                    className={`w-full px-3 py-2.5 rounded-xl border font-bold text-xs ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                  />
                </div>
                <div>
                  <label className="block font-black uppercase mb-1 text-slate-400">Danh Mục Loại Tin *</label>
                  <select
                    value={newsModal.data.ma_loai_tin || (loaiTinList[0]?.id ?? 1)}
                    onChange={(e) => setNewsModal({ ...newsModal, data: { ...newsModal.data, ma_loai_tin: parseInt(e.target.value) } })}
                    className={`w-full px-3 py-2.5 rounded-xl border font-bold text-xs ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                  >
                    {loaiTinList.map((lt) => (
                      <option key={lt.id} value={lt.id}>📁 {lt.ten_loai}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* TẢI ẢNH ĐẠI DIỆN TIN TỨC HOẶC DÁN LINK */}
              <div>
                <label className="block font-black uppercase mb-1 text-slate-400">Ảnh Đại Diện (Tải File từ máy hoặc Nhập URL)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newsModal.data.hinh_anh || ''}
                    onChange={(e) => setNewsModal({ ...newsModal, data: { ...newsModal.data, hinh_anh: e.target.value } })}
                    placeholder="https://... hoặc bấm nút Tải File Ảnh"
                    className={`flex-1 px-3 py-2.5 rounded-xl border font-mono text-xs ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                  />
                  <label className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer flex items-center gap-1.5 shrink-0 shadow-md transition-all hover:scale-105">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingImage ? 'Đang tải...' : 'Tải File Ảnh'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploadingImage}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadNewsImageFile(file);
                      }}
                    />
                  </label>
                </div>
                {newsModal.data.hinh_anh && (
                  <div className="mt-2 p-2 rounded-xl border border-slate-200 dark:border-emerald-900 bg-slate-50 dark:bg-[#060e09] flex items-center gap-3">
                    <img src={newsModal.data.hinh_anh} alt="Preview" className="w-24 h-14 object-cover rounded-lg border border-slate-200 shadow-sm" />
                    <span className="text-[11px] text-slate-400 font-bold">✓ Ảnh đại diện hợp lệ</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-black uppercase mb-1 text-slate-400">Tóm Tắt Ngắn Gọn</label>
                <textarea
                  rows={2}
                  value={newsModal.data.tom_tat || ''}
                  onChange={(e) => setNewsModal({ ...newsModal, data: { ...newsModal.data, tom_tat: e.target.value } })}
                  placeholder="Đoạn mô tả ngắn gọn nội dung hiển thị ở danh sách bài viết..."
                  className={`w-full px-3 py-2 rounded-xl border text-xs ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                />
              </div>

              <div>
                <label className="block font-black uppercase mb-1 text-slate-400">Nội Dung Chi Tiết Bài Viết *</label>
                <textarea
                  rows={8}
                  required
                  value={newsModal.data.noi_dung || ''}
                  onChange={(e) => setNewsModal({ ...newsModal, data: { ...newsModal.data, noi_dung: e.target.value } })}
                  placeholder="Nhập toàn bộ nội dung bài viết tin tức tại đây..."
                  className={`w-full p-3 rounded-xl border text-xs font-normal leading-relaxed ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                />
              </div>

              <div>
                <label className="block font-black uppercase mb-1 text-slate-400">Trạng Thái Bài Viết</label>
                <div className="flex gap-4 items-center">
                  <label className="flex items-center gap-2 cursor-pointer font-bold">
                    <input
                      type="radio"
                      name="news_status"
                      checked={(newsModal.data.trang_thai as any) == 1 || (newsModal.data.trang_thai as any) === true}
                      onChange={() => setNewsModal({ ...newsModal, data: { ...newsModal.data, trang_thai: 1 } })}
                    />
                    <span className="text-emerald-500">Đăng Xuất Bản Ngay</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold">
                    <input
                      type="radio"
                      name="news_status"
                      checked={(newsModal.data.trang_thai as any) == 0 || (newsModal.data.trang_thai as any) === false}
                      onChange={() => setNewsModal({ ...newsModal, data: { ...newsModal.data, trang_thai: 0 } })}
                    />
                    <span className="text-slate-400">Lưu Bản Nháp</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-emerald-900/40">
                <button
                  type="button"
                  onClick={() => setNewsModal({ isOpen: false, mode: 'ADD', data: { ma_loai_tin: 1, trang_thai: 1 } })}
                  className="px-4 py-2.5 rounded-xl font-bold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isUploadingImage}
                  className="px-5 py-2.5 rounded-xl font-black bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-lg shadow-emerald-600/30 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> Lưu Bài Viết
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
