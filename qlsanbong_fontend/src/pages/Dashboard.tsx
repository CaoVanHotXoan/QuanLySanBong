import React, { useState, useMemo, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import SoccerLoader from '../components/SoccerLoader';
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
  ArrowLeft
} from 'lucide-react';
import { AuthUser } from './Login/login';

// =====================================================================
// 1. ĐỊNH NGHĨA KIỂU DỮ LIỆU & TABS (ÁNH XẠ 11 BẢNG CSDL)
// =====================================================================

export type TabType =
  // 1. Tổng Quan
  | 'OVERVIEW'
  // 2. Quản Lý Sân Bóng (San_Bong, Loai_San, Khung_Gio_Gia)
  | 'SAN_BONG'
  | 'LOAI_SAN_GIA'
  // 3. Dịch Vụ & Kho (Dich_Vu, Phieu_Nhap_Kho)
  | 'DICH_VU'
  | 'PHIEU_NHAP_KHO'
  // 4. Tài Chính & Giao Dịch (Don_Dat_San & Thanh_Toan, Lich_Su_Hoan_Tien, Khung_Gio)
  | 'DON_DAT_THANH_TOAN'
  | 'HOAN_TIEN'
  | 'KHUNG_GIO'
  // 5. Hệ Thống & Phân Quyền (Nguoi_Dung, Vai_Tro)
  | 'NGUOI_DUNG'
  | 'VAI_TRO';

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
  kieu_dat?: 'CO_DINH' | 'LINH_HOAT';
  so_phut_da?: number;
  ghi_chu?: string;
  trang_thai: 'DA_COC' | 'DA_THANH_TOAN' | 'CHO_XAC_NHAN' | 'DA_CHOT' | 'HOAN_THANH' | 'DA_HUY' | string;
  dich_vu_da_dung?: {
    ma_dich_vu: number;
    ten_dich_vu: string;
    so_luong: number;
    gia_luc_ban: number;
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
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  return {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : ''
  };
};

// =====================================================================
// 2. DỮ LIỆU BAN ĐẦU (SEED DATA CHO 11 BẢNG)
// =====================================================================

const INITIAL_LOAI_SAN: LoaiSan[] = [
  { id: 1, ten_loai: 'Sân 5 người', mo_ta: 'Cỏ nhân tạo FIFA Pro tiêu chuẩn 1000 Lux' },
  { id: 2, ten_loai: 'Sân 7 người', mo_ta: 'Mặt cỏ mềm cao cấp tiêu chuẩn thi đấu' },
  { id: 3, ten_loai: 'Sân Pickleball', mo_ta: 'Mặt sân cao su chuẩn quốc tế' },
  { id: 4, ten_loai: 'Sân Cầu lông', mo_ta: 'Sàn gỗ chuyên dụng chống trơn' },
];

const INITIAL_SAN_BONG: SanBong[] = [
  { id: 1, ma_loai_san: 1, ten_san: 'Sân 5A (Cỏ nhân tạo)', ten_loai: 'Sân 5 người', don_gia_phut: 5000, hinh_anh: '/images/san-5a.jpg', trang_thai: 'SAN_SANG' },
  { id: 2, ma_loai_san: 1, ten_san: 'Sân 5B (Cỏ nhân tạo)', ten_loai: 'Sân 5 người', don_gia_phut: 5000, hinh_anh: '/images/san-5b.jpg', trang_thai: 'SAN_SANG' },
  { id: 3, ma_loai_san: 1, ten_san: 'Sân 5C (VIP Sân Đêm)', ten_loai: 'Sân 5 người', don_gia_phut: 5500, hinh_anh: '/images/san-5c.jpg', trang_thai: 'SAN_SANG' },
  { id: 4, ma_loai_san: 2, ten_san: 'Sân 7A (Sân Đại)', ten_loai: 'Sân 7 người', don_gia_phut: 8000, hinh_anh: '/images/san-7a.jpg', trang_thai: 'SAN_SANG' },
  { id: 5, ma_loai_san: 2, ten_san: 'Sân 7B (Sân Đại)', ten_loai: 'Sân 7 người', don_gia_phut: 8500, hinh_anh: '/images/san-7b.jpg', trang_thai: 'SAN_SANG' },
  { id: 6, ma_loai_san: 3, ten_san: 'Pickleball 01 (Indoor)', ten_loai: 'Sân Pickleball', don_gia_phut: 4500, hinh_anh: '/images/pb-1.jpg', trang_thai: 'SAN_SANG' },
  { id: 7, ma_loai_san: 3, ten_san: 'Pickleball 02 (Outdoor)', ten_loai: 'Sân Pickleball', don_gia_phut: 4000, hinh_anh: '/images/pb-2.jpg', trang_thai: 'BAO_TRI' },
  { id: 8, ma_loai_san: 4, ten_san: 'Cầu lông 01 (Trong nhà)', ten_loai: 'Sân Cầu lông', don_gia_phut: 3000, hinh_anh: '/images/cl-1.jpg', trang_thai: 'SAN_SANG' },
];

const INITIAL_DICH_VU: DichVu[] = [
  { id: 1, ten_dich_vu: 'Nước khoáng Aquafina 500ml', don_gia: 10000, don_vi_tinh: 'Chai', ton_kho: 180 },
  { id: 2, ten_dich_vu: 'Nước tăng lực Revive Chanh Muối', don_gia: 20000, don_vi_tinh: 'Chai', ton_kho: 95 },
  { id: 3, ten_dich_vu: 'Nước điện giải Pocari Sweat 500ml', don_gia: 25000, don_vi_tinh: 'Chai', ton_kho: 60 },
  { id: 4, ten_dich_vu: 'Thuê áo Bib phân đội (Bộ 10 áo)', don_gia: 30000, don_vi_tinh: 'Bộ / Trận', ton_kho: 25 },
  { id: 5, ten_dich_vu: 'Thuê giày bóng đá cỏ nhân tạo', don_gia: 40000, don_vi_tinh: 'Đôi / Trận', ton_kho: 35 },
  { id: 6, ten_dich_vu: 'Thuê trọng tài bắt trận chuyên nghiệp', don_gia: 200000, don_vi_tinh: 'Người / Trận', ton_kho: 5 },
];

const INITIAL_VAI_TRO: VaiTro[] = [
  { MaVaiTro: 1, TenVaiTro: 'ADMIN', MoTa: 'Quản trị viên toàn quyền hệ thống' },
  { MaVaiTro: 2, TenVaiTro: 'NHAN_VIEN', MoTa: 'Nhân viên quầy vận hành sân & POS' },
  { MaVaiTro: 3, TenVaiTro: 'KHACH_HANG', MoTa: 'Khách hàng đặt sân trực tuyến' }
];

const INITIAL_NGUOI_DUNG: NguoiDung[] = [
  { id: 1, ho_ten: 'Quản Trị Viên Hệ Thống', email: 'admin@soccer247.vn', so_dien_thoai: '0909123456', vai_tro: 'ADMIN', MaVaiTro: 1, TenVaiTro: 'ADMIN', ngay_tao: '2026-01-10' },
  { id: 2, ho_ten: 'Trần Văn Nhân (Nhân viên Quầy)', email: 'staff@soccer247.vn', so_dien_thoai: '0909789789', vai_tro: 'NHAN_VIEN', MaVaiTro: 2, TenVaiTro: 'NHAN_VIEN', ngay_tao: '2026-02-15' },
  { id: 3, ho_ten: 'Nguyễn Văn Đạt (Đội Trưởng FC Thunder)', email: 'vandat.soccer@gmail.com', so_dien_thoai: '0988776655', vai_tro: 'KHACH_HANG', MaVaiTro: 3, TenVaiTro: 'KHACH_HANG', ngay_tao: '2026-03-01' },
  { id: 4, ho_ten: 'Lê Hoàng Long (CLB Sài Gòn Star)', email: 'hoanglong.fc@gmail.com', so_dien_thoai: '0912345999', vai_tro: 'KHACH_HANG', MaVaiTro: 3, TenVaiTro: 'KHACH_HANG', ngay_tao: '2026-03-12' },
  { id: 5, ho_ten: 'Phạm Minh Đức (Pickleball Pro)', email: 'minhduc.tennis@gmail.com', so_dien_thoai: '0977112233', vai_tro: 'KHACH_HANG', MaVaiTro: 3, TenVaiTro: 'KHACH_HANG', ngay_tao: '2026-03-20' },
];

const INITIAL_DON_DAT: DonDatSan[] = [
  {
    id: 101,
    ma_nguoi_dung: 3,
    ten_khach_hang: 'Nguyễn Văn Đạt',
    so_dien_thoai: '0988776655',
    ma_san: 1,
    ten_san: 'Sân 5A (Cỏ nhân tạo)',
    ngay_da: new Date().toISOString().split('T')[0],
    gio_bat_dau: '17:15',
    gio_ket_thuc: '18:40',
    tien_san: 496000,
    tong_tien: 556000,
    tien_coc_da_tra: 200000,
    kieu_dat: 'LINH_HOAT',
    so_phut_da: 85,
    ghi_chu: 'Khách đá linh hoạt 85 phút',
    trang_thai: 'DA_CHOT',
    dich_vu_da_dung: [
      { ma_dich_vu: 2, ten_dich_vu: 'Nước tăng lực Revive Chanh Muối', so_luong: 3, gia_luc_ban: 20000 }
    ]
  },
  {
    id: 102,
    ma_nguoi_dung: 4,
    ten_khach_hang: 'Lê Hoàng Long',
    so_dien_thoai: '0912345999',
    ma_san: 4,
    ten_san: 'Sân 7A (Sân Đại)',
    ngay_da: new Date().toISOString().split('T')[0],
    gio_bat_dau: '18:00',
    gio_ket_thuc: '19:30',
    tien_san: 650000,
    tong_tien: 750000,
    tien_coc_da_tra: 200000,
    kieu_dat: 'CO_DINH',
    so_phut_da: 90,
    ghi_chu: 'Đá giao hữu cuối tuần',
    trang_thai: 'DA_CHOT',
    dich_vu_da_dung: [
      { ma_dich_vu: 1, ten_dich_vu: 'Nước khoáng Aquafina 500ml', so_luong: 4, gia_luc_ban: 10000 },
      { ma_dich_vu: 4, ten_dich_vu: 'Thuê áo Bib phân đội (Bộ 10 áo)', so_luong: 2, gia_luc_ban: 30000 }
    ]
  },
  {
    id: 103,
    ma_nguoi_dung: 5,
    ten_khach_hang: 'Phạm Minh Đức',
    so_dien_thoai: '0977112233',
    ma_san: 6,
    ten_san: 'Pickleball 01 (Indoor)',
    ngay_da: new Date().toISOString().split('T')[0],
    gio_bat_dau: '16:30',
    gio_ket_thuc: '18:00',
    tien_san: 260000,
    tong_tien: 260000,
    tien_coc_da_tra: 80000,
    kieu_dat: 'CO_DINH',
    so_phut_da: 90,
    trang_thai: 'CHO_XAC_NHAN',
    dich_vu_da_dung: []
  }
];

const INITIAL_CHI_TIET_DICH_VU: ChiTietDichVu[] = [
  { id: 1, ma_don_dat: 101, ten_khach_hang: 'Nguyễn Văn Đạt', ten_san: 'Sân 5A', ma_dich_vu: 2, ten_dich_vu: 'Nước tăng lực Revive Chanh Muối', don_vi_tinh: 'Chai', so_luong: 3, gia_luc_ban: 20000, thanh_tien: 60000, ngay_tao: '2026-09-29 17:30' },
  { id: 2, ma_don_dat: 102, ten_khach_hang: 'Lê Hoàng Long', ten_san: 'Sân 7A', ma_dich_vu: 1, ten_dich_vu: 'Nước khoáng Aquafina 500ml', don_vi_tinh: 'Chai', so_luong: 4, gia_luc_ban: 10000, thanh_tien: 40000, ngay_tao: '2026-09-29 18:10' },
  { id: 3, ma_don_dat: 102, ten_khach_hang: 'Lê Hoàng Long', ten_san: 'Sân 7A', ma_dich_vu: 4, ten_dich_vu: 'Thuê áo Bib phân đội (Bộ 10 áo)', don_vi_tinh: 'Bộ', so_luong: 2, gia_luc_ban: 30000, thanh_tien: 60000, ngay_tao: '2026-09-29 18:15' }
];

const INITIAL_PHIEU_NHAP: PhieuNhapKho[] = [
  { id: 1, ma_dich_vu: 1, ten_dich_vu: 'Nước khoáng Aquafina 500ml', don_vi_tinh: 'Chai', so_luong_nhap: 200, gia_nhap: 5500, tong_tien_nhap: 1100000, ngay_nhap: '2026-09-20' },
  { id: 2, ma_dich_vu: 2, ten_dich_vu: 'Nước tăng lực Revive Chanh Muối', don_vi_tinh: 'Chai', so_luong_nhap: 100, gia_nhap: 12000, tong_tien_nhap: 1200000, ngay_nhap: '2026-09-22' },
  { id: 3, ma_dich_vu: 3, ten_dich_vu: 'Nước điện giải Pocari Sweat 500ml', don_vi_tinh: 'Chai', so_luong_nhap: 80, gia_nhap: 16000, tong_tien_nhap: 1280000, ngay_nhap: '2026-09-25' }
];

const INITIAL_THANH_TOAN: ThanhToan[] = [
  { id: 1, ma_don_dat: 101, ten_khach_hang: 'Nguyễn Văn Đạt', so_dien_thoai: '0988776655', ten_san: 'Sân 5A', ngay_da: '2026-09-29', so_tien: 200000, phuong_thuc: 'CHUYEN_KHOAN', loai_thanh_toan: 'DAT_COC', ma_giao_dich: 'CK_987123', ngay_thanh_toan: '2026-09-29 14:00' },
  { id: 2, ma_don_dat: 102, ten_khach_hang: 'Lê Hoàng Long', so_dien_thoai: '0912345999', ten_san: 'Sân 7A', ngay_da: '2026-09-29', so_tien: 200000, phuong_thuc: 'CHUYEN_KHOAN', loai_thanh_toan: 'DAT_COC', ma_giao_dich: 'CK_445566', ngay_thanh_toan: '2026-09-29 15:30' },
  { id: 3, ma_don_dat: 103, ten_khach_hang: 'Phạm Minh Đức', so_dien_thoai: '0977112233', ten_san: 'Pickleball 01', ngay_da: '2026-09-29', so_tien: 80000, phuong_thuc: 'TIEN_MAT', loai_thanh_toan: 'DAT_COC', ma_giao_dich: 'CASH_01', ngay_thanh_toan: '2026-09-29 16:00' }
];

const INITIAL_HOAN_TIEN: LichSuHoanTien[] = [
  { id: 1, ma_don_dat: 99, ten_khach_hang: 'Vũ Quốc Huy', so_dien_thoai: '0933221100', ten_san: 'Sân 5B', ngay_da: '2026-09-28', so_tien_hoan: 100000, ty_le_hoan: 100, ly_do_huy: 'Báo hủy trước 24h do trời mưa to', ngay_hoan: '2026-09-28 10:30' },
  { id: 2, ma_don_dat: 98, ten_khach_hang: 'Hoàng Mai Lan', so_dien_thoai: '0911889977', ten_san: 'Sân Pickleball 02', ngay_da: '2026-09-27', so_tien_hoan: 40000, ty_le_hoan: 50, ly_do_huy: 'Báo hủy trước 6h đá, trừ 50% phí giữ chỗ', ngay_hoan: '2026-09-27 12:00' }
];

const TIME_SLOTS = [
  { start: '15:00', end: '16:30', isGold: false },
  { start: '16:30', end: '18:00', isGold: true },
  { start: '18:00', end: '19:30', isGold: true },
  { start: '19:30', end: '21:00', isGold: true },
  { start: '21:00', end: '22:30', isGold: false }
];

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

const INITIAL_KHUNG_GIO: KhungGio[] = [
  { id: 1, gio_bat_dau: '06:00', gio_ket_thuc: '06:30', nhan_hien_thi: '6h', thu_tu: 1, trang_thai: true },
  { id: 2, gio_bat_dau: '06:30', gio_ket_thuc: '07:00', nhan_hien_thi: '6h30', thu_tu: 2, trang_thai: true },
  { id: 3, gio_bat_dau: '07:00', gio_ket_thuc: '07:30', nhan_hien_thi: '7h', thu_tu: 3, trang_thai: true },
  { id: 4, gio_bat_dau: '07:30', gio_ket_thuc: '08:00', nhan_hien_thi: '7h30', thu_tu: 4, trang_thai: true },
  { id: 5, gio_bat_dau: '08:00', gio_ket_thuc: '08:30', nhan_hien_thi: '8h', thu_tu: 5, trang_thai: true },
  { id: 6, gio_bat_dau: '08:30', gio_ket_thuc: '09:00', nhan_hien_thi: '8h30', thu_tu: 6, trang_thai: true },
  { id: 7, gio_bat_dau: '09:00', gio_ket_thuc: '09:30', nhan_hien_thi: '9h', thu_tu: 7, trang_thai: true },
  { id: 8, gio_bat_dau: '09:30', gio_ket_thuc: '10:00', nhan_hien_thi: '9h30', thu_tu: 8, trang_thai: true },
  { id: 9, gio_bat_dau: '10:00', gio_ket_thuc: '10:30', nhan_hien_thi: '10h', thu_tu: 9, trang_thai: true },
  { id: 10, gio_bat_dau: '10:30', gio_ket_thuc: '11:00', nhan_hien_thi: '10h30', thu_tu: 10, trang_thai: true },
  { id: 11, gio_bat_dau: '11:00', gio_ket_thuc: '11:30', nhan_hien_thi: '11h', thu_tu: 11, trang_thai: true },
  { id: 12, gio_bat_dau: '11:30', gio_ket_thuc: '12:00', nhan_hien_thi: '11h30', thu_tu: 12, trang_thai: true },
  { id: 13, gio_bat_dau: '12:00', gio_ket_thuc: '12:30', nhan_hien_thi: '12h', thu_tu: 13, trang_thai: true },
  { id: 14, gio_bat_dau: '12:30', gio_ket_thuc: '13:00', nhan_hien_thi: '12h30', thu_tu: 14, trang_thai: true },
  { id: 15, gio_bat_dau: '13:00', gio_ket_thuc: '13:30', nhan_hien_thi: '13h', thu_tu: 15, trang_thai: true },
  { id: 16, gio_bat_dau: '13:30', gio_ket_thuc: '14:00', nhan_hien_thi: '13h30', thu_tu: 16, trang_thai: true },
  { id: 17, gio_bat_dau: '14:00', gio_ket_thuc: '14:30', nhan_hien_thi: '14h', thu_tu: 17, trang_thai: true },
  { id: 18, gio_bat_dau: '14:30', gio_ket_thuc: '15:00', nhan_hien_thi: '14h30', thu_tu: 18, trang_thai: true },
  { id: 19, gio_bat_dau: '15:00', gio_ket_thuc: '15:30', nhan_hien_thi: '15h', thu_tu: 19, trang_thai: true },
  { id: 20, gio_bat_dau: '15:30', gio_ket_thuc: '16:00', nhan_hien_thi: '15h30', thu_tu: 20, trang_thai: true },
  { id: 21, gio_bat_dau: '16:00', gio_ket_thuc: '16:30', nhan_hien_thi: '16h', thu_tu: 21, trang_thai: true },
  { id: 22, gio_bat_dau: '16:30', gio_ket_thuc: '17:00', nhan_hien_thi: '16h30', thu_tu: 22, trang_thai: true },
  { id: 23, gio_bat_dau: '17:00', gio_ket_thuc: '17:30', nhan_hien_thi: '17h', thu_tu: 23, trang_thai: true },
  { id: 24, gio_bat_dau: '17:30', gio_ket_thuc: '18:00', nhan_hien_thi: '17h30', thu_tu: 24, trang_thai: true },
  { id: 25, gio_bat_dau: '18:00', gio_ket_thuc: '18:30', nhan_hien_thi: '18h', thu_tu: 25, trang_thai: true },
  { id: 26, gio_bat_dau: '18:30', gio_ket_thuc: '19:00', nhan_hien_thi: '18h30', thu_tu: 26, trang_thai: true },
  { id: 27, gio_bat_dau: '19:00', gio_ket_thuc: '19:30', nhan_hien_thi: '19h', thu_tu: 27, trang_thai: true },
];

// Cấu trúc cây Menu Sidebar chuẩn
const SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    groupTitle: 'TỔNG QUAN',
    groupIcon: LayoutDashboard,
    items: [
      { id: 'OVERVIEW', label: 'Dashboard (Thống kê & KPI)', icon: BarChart3, badge: 'KPI' }
    ]
  },
  {
    groupTitle: 'QUẢN LÝ SÂN BÓNG',
    groupIcon: Trophy,
    items: [
      { id: 'SAN_BONG', label: 'Danh Sách Sân Bóng', icon: Layers, tableHint: 'San_Bong' },
      { id: 'LOAI_SAN_GIA', label: 'Loại Sân & Bảng Giá', icon: Clock, tableHint: 'Loai_San, Khung_Gio_Gia' }
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
      { id: 'HOAN_TIEN', label: 'Lịch Sử Hoàn Tiền', icon: RefreshCw, tableHint: 'Lich_Su_Hoan_Tien' },
      { id: 'KHUNG_GIO', label: 'Bảng Khung Giờ', icon: Clock, tableHint: 'Khung_Gio' }
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
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabType>('OVERVIEW');

  // Quản lý xác thực & Phân quyền Admin
  const [currentAdminUser, setCurrentAdminUser] = useState<AuthUser | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);

  // State Form Đăng nhập Admin nếu chưa xác thực
  const [adminEmail, setAdminEmail] = useState<string>('Admin@gmail.com');
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [adminLoginError, setAdminLoginError] = useState<string>('');
  const [isAdminLoggingIn, setIsAdminLoggingIn] = useState<boolean>(false);

  // Dữ liệu 11 Bảng CSDL
  const [courtList, setCourtList] = useState<SanBong[]>(INITIAL_SAN_BONG);
  const [categoryList, setCategoryList] = useState<LoaiSan[]>(INITIAL_LOAI_SAN);
  const [bookingList, setBookingList] = useState<DonDatSan[]>(INITIAL_DON_DAT);
  const [serviceDetailList, setServiceDetailList] = useState<ChiTietDichVu[]>(INITIAL_CHI_TIET_DICH_VU);
  const [serviceList, setServiceList] = useState<DichVu[]>(INITIAL_DICH_VU);
  const [inventoryList, setInventoryList] = useState<PhieuNhapKho[]>(INITIAL_PHIEU_NHAP);
  const [paymentList, setPaymentList] = useState<ThanhToan[]>(INITIAL_THANH_TOAN);
  const [refundList, setRefundList] = useState<LichSuHoanTien[]>(INITIAL_HOAN_TIEN);
  const [khungGioList, setKhungGioList] = useState<KhungGio[]>(INITIAL_KHUNG_GIO);
  const [userList, setUserList] = useState<NguoiDung[]>(INITIAL_NGUOI_DUNG);
  const [roleList, setRoleList] = useState<VaiTro[]>(INITIAL_VAI_TRO);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(null), 3800);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  // Kiểm tra quyền Admin khi tải trang
  const verifyAdminRole = (): boolean => {
    try {
      const savedUserStr = localStorage.getItem('auth_user') || localStorage.getItem('soccer_current_user');
      if (savedUserStr) {
        const parsed = JSON.parse(savedUserStr);
        const role = (parsed.vai_tro || parsed.TenVaiTro || '').toUpperCase();
        if (role === 'ADMIN') {
          setCurrentAdminUser(parsed);
          setIsAuthorized(true);
          return true;
        } else {
          setCurrentAdminUser(parsed);
          setIsAuthorized(false);
          return false;
        }
      } else {
        setCurrentAdminUser(null);
        setIsAuthorized(false);
        return false;
      }
    } catch (e) {
      console.error('Lỗi xác thực Admin:', e);
      setIsAuthorized(false);
      return false;
    } finally {
      setIsAuthChecking(false);
    }
  };

  useEffect(() => {
    const isOk = verifyAdminRole();
    if (isOk) {
      loadAllDataFromBackend();
    }
  }, []);

  // Xử lý Đăng nhập Admin trực tiếp từ trang Dashboard
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginError('');
    setIsAdminLoggingIn(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail.trim(), mat_khau: adminPassword })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setAdminLoginError(data.message || '⚠️ Đăng nhập thất bại. Vui lòng kiểm tra email hoặc mật khẩu!');
        setIsAdminLoggingIn(false);
        return;
      }

      const role = (data.data?.vai_tro || '').toUpperCase();
      if (role !== 'ADMIN') {
        setAdminLoginError(`❌ Tài khoản "${data.data.email}" có vai trò là "${role}", không phải ADMIN. Truy cập bị từ chối!`);
        setIsAdminLoggingIn(false);
        return;
      }

      if (data.token) {
        localStorage.setItem('auth_token', data.token);
      }

      const userObj: AuthUser = {
        id: data.data.id,
        ho_ten: data.data.ho_ten,
        email: data.data.email,
        so_dien_thoai: data.data.so_dien_thoai,
        vai_tro: data.data.vai_tro,
        anh_dai_dien: data.data.anh_dai_dien
      };

      localStorage.setItem('auth_user', JSON.stringify(userObj));
      localStorage.setItem('soccer_current_user', JSON.stringify({
        id: userObj.id,
        hoTen: userObj.ho_ten,
        email: userObj.email,
        soDienThoai: userObj.so_dien_thoai
      }));

      setCurrentAdminUser(userObj);
      setIsAuthorized(true);
      setToastMessage({ type: 'success', message: `🎉 Chào mừng Quản Trị Viên ${userObj.ho_ten}!` });
      loadAllDataFromBackend();
    } catch (err) {
      setAdminLoginError('❌ Không thể kết nối tới máy chủ SQL Server!');
    } finally {
      setIsAdminLoggingIn(false);
    }
  };

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
        if (data.success && Array.isArray(data.data) && data.data.length > 0) setCourtList(data.data);
      }

      const resLoai = await fetch(`${API_BASE}/dat-san/loai-san`);
      if (resLoai.ok) {
        const data = await resLoai.json();
        if (data.success && Array.isArray(data.data) && data.data.length > 0) setCategoryList(data.data);
      }

      const resBookings = await fetch(`${API_BASE}/dat-san/tat-ca-don`);
      if (resBookings.ok) {
        const data = await resBookings.json();
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setBookingList(data.data.map((b: any) => ({ ...b, dich_vu_da_dung: b.dich_vu_da_dung || [] })));
        }
      }

      const resDetails = await fetch(`${API_BASE}/dich-vu/chi-tiet-ban-hang`);
      if (resDetails.ok) {
        const data = await resDetails.json();
        if (data.success && Array.isArray(data.data) && data.data.length > 0) setServiceDetailList(data.data);
      }

      const resServices = await fetch(`${API_BASE}/dich-vu`);
      if (resServices.ok) {
        const data = await resServices.json();
        if (data.success && Array.isArray(data.data) && data.data.length > 0) setServiceList(data.data);
      }

      const resNhap = await fetch(`${API_BASE}/dich-vu/phieu-nhap`);
      if (resNhap.ok) {
        const data = await resNhap.json();
        if (data.success && Array.isArray(data.data) && data.data.length > 0) setInventoryList(data.data);
      }

      const resPayments = await fetch(`${API_BASE}/thanh-toan/danh-sach`);
      if (resPayments.ok) {
        const data = await resPayments.json();
        if (data.success && Array.isArray(data.data) && data.data.length > 0) setPaymentList(data.data);
      }

      const resRefunds = await fetch(`${API_BASE}/thanh-toan/hoan-tien`);
      if (resRefunds.ok) {
        const data = await resRefunds.json();
        if (data.success && Array.isArray(data.data) && data.data.length > 0) setRefundList(data.data);
      }

      const resKhung = await fetch(`${API_BASE}/dat-san/khung-gio/all`);
      if (resKhung.ok) {
        const data = await resKhung.json();
        if (data.success && Array.isArray(data.data) && data.data.length > 0) setKhungGioList(data.data);
      }

      const resUsers = await fetch(`${API_BASE}/auth/users`);
      if (resUsers.ok) {
        const data = await resUsers.json();
        if (data.success && Array.isArray(data.data) && data.data.length > 0) setUserList(data.data);
      }

      const resRoles = await fetch(`${API_BASE}/auth/vai-tro`);
      if (resRoles.ok) {
        const data = await resRoles.json();
        if (data.success && Array.isArray(data.data) && data.data.length > 0) setRoleList(data.data);
      }
    } catch (err) {
      console.warn('Using local state backup.', err);
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
  const [serviceModal, setServiceModal] = useState<{ isOpen: boolean; mode: 'ADD' | 'EDIT'; data: Partial<DichVu> }>({ isOpen: false, mode: 'ADD', data: {} });
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

  // KPI Stats
  const kpiStats = useMemo(() => {
    const totalRevenue = bookingList
      .filter((b) => b.trang_thai === 'DA_CHOT' || b.trang_thai === 'HOAN_THANH')
      .reduce((sum, b) => sum + Number(b.tong_tien || 0), 0);
    const totalOrders = bookingList.length;
    const activeCourtsCount = bookingList.filter((b) => b.trang_thai === 'DA_CHOT').length;
    const totalPossibleSlots = (courtList.length || 1) * TIME_SLOTS.length;
    const occupancyRate = totalPossibleSlots > 0 ? Math.round((activeCourtsCount / totalPossibleSlots) * 100) : 0;

    return { totalRevenue, totalOrders, activeCourtsCount, occupancyRate };
  }, [bookingList, courtList]);

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

  // 2. Thêm/Sửa Sân Bóng (San_Bong)
  const handleSaveCourt = async (e: React.FormEvent) => {
    e.preventDefault();
    const { id, ten_san, ma_loai_san, don_gia_phut, trang_thai, hinh_anh } = courtModal.data;
    if (!ten_san || !ma_loai_san) {
      setToastMessage({ type: 'error', message: 'Vui lòng nhập tên sân và chọn loại sân!' });
      return;
    }

    try {
      if (courtModal.mode === 'ADD') {
        const res = await fetch(`${API_BASE}/dat-san/san-bong`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ ten_san, ma_loai_san: Number(ma_loai_san), don_gia_phut: Number(don_gia_phut || 5000), hinh_anh: hinh_anh || '', trang_thai: trang_thai || 'SAN_SANG' })
        });
        const data = await res.json();
        if (data.success) {
          setToastMessage({ type: 'success', message: `✅ Đã thêm sân bóng mới [${ten_san}]!` });
          loadAllDataFromBackend();
          setCourtModal({ isOpen: false, mode: 'ADD', data: {} });
          return;
        }
      } else {
        const res = await fetch(`${API_BASE}/dat-san/san-bong/${id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ ten_san, ma_loai_san: Number(ma_loai_san), don_gia_phut: Number(don_gia_phut || 5000), hinh_anh: hinh_anh || '', trang_thai: trang_thai || 'SAN_SANG' })
        });
        const data = await res.json();
        if (data.success) {
          setToastMessage({ type: 'success', message: `✅ Đã cập nhật sân [${ten_san}]!` });
          loadAllDataFromBackend();
          setCourtModal({ isOpen: false, mode: 'ADD', data: {} });
          return;
        }
      }
    } catch (err) {}

    const loai = categoryList.find((l) => l.id === Number(ma_loai_san));
    if (courtModal.mode === 'ADD') {
      const newId = Math.max(...courtList.map((c) => c.id), 0) + 1;
      setCourtList([...courtList, { id: newId, ma_loai_san: Number(ma_loai_san), ten_san, ten_loai: loai?.ten_loai || '', don_gia_phut: Number(don_gia_phut || 5000), hinh_anh: '', trang_thai: (trang_thai as any) || 'SAN_SANG' }]);
      setToastMessage({ type: 'success', message: `✅ Đã thêm sân mới [${ten_san}]!` });
    } else {
      setCourtList(courtList.map((c) => (c.id === id ? { ...c, ten_san, ma_loai_san: Number(ma_loai_san), ten_loai: loai?.ten_loai || c.ten_loai, don_gia_phut: Number(don_gia_phut || c.don_gia_phut || 5000), trang_thai: trang_thai as any } : c)));
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
      () => {
        setCategoryList((prev) => prev.filter(l => l.id !== id));
        setToastMessage({ type: 'success', message: '🗑️ Đã xóa loại sân!' });
      }
    );
  };

  // 4. Thêm/Sửa Dịch Vụ (Dich_Vu)
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    const { id, ten_dich_vu, don_gia, don_vi_tinh, ton_kho } = serviceModal.data;
    if (!ten_dich_vu || !don_gia || !don_vi_tinh) {
      setToastMessage({ type: 'error', message: 'Vui lòng điền đầy đủ tên dịch vụ, đơn giá và đơn vị tính!' });
      return;
    }

    try {
      if (serviceModal.mode === 'ADD') {
        const res = await fetch(`${API_BASE}/dich-vu`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ ten_dich_vu, don_gia: Number(don_gia), don_vi_tinh, ton_kho: Number(ton_kho || 0) })
        });
        const data = await res.json();
        if (data.success) {
          setToastMessage({ type: 'success', message: `✅ Đã thêm dịch vụ [${ten_dich_vu}] thành công!` });
          loadAllDataFromBackend();
          setServiceModal({ isOpen: false, mode: 'ADD', data: {} });
          return;
        }
      } else {
        const res = await fetch(`${API_BASE}/dich-vu/${id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ ten_dich_vu, don_gia: Number(don_gia), don_vi_tinh, ton_kho: Number(ton_kho || 0) })
        });
        const data = await res.json();
        if (data.success) {
          setToastMessage({ type: 'success', message: `✅ Đã cập nhật dịch vụ [${ten_dich_vu}]!` });
          loadAllDataFromBackend();
          setServiceModal({ isOpen: false, mode: 'ADD', data: {} });
          return;
        }
      }
    } catch (err) {}

    if (serviceModal.mode === 'ADD') {
      const newId = Math.max(...serviceList.map((s) => s.id), 0) + 1;
      setServiceList([...serviceList, { id: newId, ten_dich_vu, don_gia: Number(don_gia), don_vi_tinh, ton_kho: Number(ton_kho || 0) }]);
      setToastMessage({ type: 'success', message: `✅ Đã thêm dịch vụ [${ten_dich_vu}]!` });
    } else {
      setServiceList(serviceList.map((s) => (s.id === id ? { ...s, ten_dich_vu, don_gia: Number(don_gia), don_vi_tinh, ton_kho: Number(ton_kho || 0) } : s)));
      setToastMessage({ type: 'success', message: `✅ Đã cập nhật dịch vụ [${ten_dich_vu}]!` });
    }
    setServiceModal({ isOpen: false, mode: 'ADD', data: {} });
  };

  const handleDeleteService = (id: number, tenDichVu?: string) => {
    openDeleteConfirm(
      'Xóa Mặt Hàng Dịch Vụ',
      'Bạn có chắc chắn muốn xóa mặt hàng dịch vụ này?',
      `🥤 Dịch vụ: ${tenDichVu || `ID #${id}`}`,
      () => {
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
      () => {
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
      () => {
        setRoleList((prev) => prev.filter(r => r.MaVaiTro !== id));
        setToastMessage({ type: 'success', message: '🗑️ Đã xóa vai trò!' });
      }
    );
  };

  // 9. Thêm/Sửa Đơn Đặt Sân & Thanh Toán (Don_Dat_San & Thanh_Toan)
  const handleSaveDonDatThanhToan = async (e: React.FormEvent) => {
    e.preventDefault();
    const { id, ma_san, ma_nguoi_dung, ngay_da, gio_bat_dau, gio_ket_thuc, tien_san, tong_tien, ghi_chu, trang_thai, phuong_thuc, loai_thanh_toan, so_tien, trang_thai_gd } = bookingModal.data;

    try {
      if (bookingModal.mode === 'ADD') {
        const res = await fetch(`${API_BASE}/dat-san/don-dat-thanh-toan`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ ma_san, ma_nguoi_dung, ngay_da, gio_bat_dau, gio_ket_thuc, tien_san, tong_tien, ghi_chu, trang_thai, phuong_thuc, loai_thanh_toan, so_tien, trang_thai_gd })
        });
        const data = await res.json();
        if (data.success) {
          setToastMessage({ type: 'success', message: '✅ Đã tạo đơn đặt sân & thanh toán thành công!' });
          loadAllDataFromBackend();
          setBookingModal({ isOpen: false, mode: 'ADD', data: {} });
          return;
        }
      } else {
        const res = await fetch(`${API_BASE}/dat-san/don-dat-thanh-toan/${id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ ma_san, ngay_da, gio_bat_dau, gio_ket_thuc, tien_san, tong_tien, ghi_chu, trang_thai, phuong_thuc, loai_thanh_toan, so_tien, trang_thai_gd })
        });
        const data = await res.json();
        if (data.success) {
          setToastMessage({ type: 'success', message: '✅ Đã cập nhật đơn đặt sân & thanh toán!' });
          loadAllDataFromBackend();
          setBookingModal({ isOpen: false, mode: 'ADD', data: {} });
          return;
        }
      }
    } catch (err) {}

    // Fallback local update
    const selectedSan = courtList.find(s => s.id === Number(ma_san));
    const selectedUser = userList.find(u => u.id === Number(ma_nguoi_dung));
    if (bookingModal.mode === 'ADD') {
      const newId = Math.max(...bookingList.map(b => b.id), 0) + 1;
      const newBooking: DonDatSan = {
        id: newId,
        ma_nguoi_dung: Number(ma_nguoi_dung || 1),
        ten_khach_hang: selectedUser?.ho_ten || 'Khách Hàng',
        so_dien_thoai: selectedUser?.so_dien_thoai || '0909000111',
        ma_san: Number(ma_san || 1),
        ten_san: selectedSan?.ten_san || 'Sân Bóng',
        ngay_da: ngay_da || new Date().toISOString().split('T')[0],
        gio_bat_dau: gio_bat_dau || '17:00',
        gio_ket_thuc: gio_ket_thuc || '18:30',
        tien_san: Number(tien_san || 350000),
        tong_tien: Number(tong_tien || 350000),
        phuong_thuc: phuong_thuc || 'CHUYEN_KHOAN',
        trang_thai: trang_thai || 'DA_COC',
        ghi_chu: ghi_chu || '',
        dich_vu_da_dung: []
      };
      setBookingList([newBooking, ...bookingList]);
      setToastMessage({ type: 'success', message: '✅ Đã thêm đơn đặt sân thành công!' });
    } else {
      setBookingList(bookingList.map(b => b.id === id ? {
        ...b,
        ma_san: Number(ma_san || b.ma_san),
        ten_san: selectedSan?.ten_san || b.ten_san,
        ngay_da: ngay_da || b.ngay_da,
        gio_bat_dau: gio_bat_dau || b.gio_bat_dau,
        gio_ket_thuc: gio_ket_thuc || b.gio_ket_thuc,
        tien_san: Number(tien_san ?? b.tien_san),
        tong_tien: Number(tong_tien ?? b.tong_tien),
        phuong_thuc: phuong_thuc || b.phuong_thuc || 'CHUYEN_KHOAN',
        trang_thai: trang_thai || b.trang_thai,
        ghi_chu: ghi_chu ?? b.ghi_chu
      } : b));
      setToastMessage({ type: 'success', message: '✅ Đã cập nhật đơn đặt sân!' });
    }
    setBookingModal({ isOpen: false, mode: 'ADD', data: {} });
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
        } catch (err) {}
        setKhungGioList(INITIAL_KHUNG_GIO);
        setToastMessage({ type: 'success', message: '🔄 Đã đặt lại 27 khung giờ mặc định!' });
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
  if (isAuthChecking) {
    return <SoccerLoader message="Đang kiểm tra quyền Quản trị viên..." fullScreen={true} />;
  }

  // 2. Màn hình Chặn Quyền Truy Cập (Chỉ dành cho ADMIN) & Form Đăng nhập Quản Trị
  if (!isAuthorized) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 sm:p-6 transition-colors duration-300 ${isDarkMode ? 'bg-[#060e09] text-white' : 'bg-[#f4f7f5] text-slate-900'}`}>
        <Head>
          <title>Yêu Cầu Quyền Quản Trị Viên (Admin) | Soccer 247</title>
        </Head>

        {/* TOAST THÔNG BÁO NỔI */}
        {toastMessage && (
          <div
            className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-xl transition-all duration-300 ${
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
          </div>
        )}

        <div className={`w-full max-w-md rounded-3xl p-6 sm:p-8 border shadow-2xl backdrop-blur-xl relative overflow-hidden ${
          isDarkMode ? 'bg-[#0c1a12]/90 border-emerald-900/60 shadow-emerald-950/40' : 'bg-white/95 border-emerald-200 shadow-emerald-900/10'
        }`}>
          {/* Decorative Glow */}
          <div className="absolute -top-20 -right-20 w-44 h-44 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none"></div>

          {/* Header */}
          <div className="text-center mb-6 relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-500 via-amber-500 to-emerald-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20 ring-4 ring-emerald-500/20">
              <ShieldAlert className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight mb-2">Trang Quản Trị Hệ Thống</h1>
            <p className="text-xs sm:text-sm opacity-70">
              Trang Dashboard được bảo mật cao cấp. Chỉ tài khoản có vai trò <span className="font-extrabold text-emerald-500 underline">ADMIN</span> mới được phép truy cập và điều hành.
            </p>
          </div>

          {currentAdminUser && (
            <div className={`mb-5 p-3.5 rounded-2xl border flex items-center gap-3 ${
              isDarkMode ? 'bg-amber-950/40 border-amber-800/60 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
              <div className="text-xs">
                <div>Đang đăng nhập: <strong>{currentAdminUser.ho_ten || currentAdminUser.email}</strong></div>
                <div>Vai trò hiện tại: <span className="font-bold text-rose-500 uppercase">{currentAdminUser.vai_tro || 'Chưa xác định'}</span> (Không có quyền Admin)</div>
              </div>
            </div>
          )}

          {adminLoginError && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-600 dark:text-rose-300 text-xs font-bold flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{adminLoginError}</span>
            </div>
          )}

          {/* Form Login Admin */}
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-80">
                Email Quản Trị Viên (Admin)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="Admin@gmail.com"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    isDarkMode ? 'bg-[#08130c] border-emerald-900/50 text-white placeholder-gray-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-gray-400'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-80">
                Mật Khẩu Admin
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Nhập mật khẩu quản trị..."
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    isDarkMode ? 'bg-[#08130c] border-emerald-900/50 text-white placeholder-gray-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-gray-400'
                  }`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isAdminLoggingIn}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/30 transition-all transform active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isAdminLoggingIn ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang xác thực quyền Admin...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Đăng Nhập Quản Trị (Admin)</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Back Link */}
          <div className="mt-6 pt-5 border-t border-dashed border-gray-500/20 flex items-center justify-between text-xs">
            <a
              href="/"
              className="inline-flex items-center gap-1.5 font-bold text-emerald-500 hover:text-emerald-400 hover:underline transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay về Trang chủ Khách Hàng</span>
            </a>
            <button
              type="button"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-1.5 rounded-lg opacity-70 hover:opacity-100 transition-opacity"
              title="Đổi giao diện Sáng / Tối"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>
        </div>
      </div>
    );
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
          className={`w-64 xl:w-72 shrink-0 border-r flex flex-col justify-between transition-colors duration-300 z-20 ${
            isDarkMode ? 'bg-[#0a150e] border-emerald-900/40' : 'bg-white border-slate-300 shadow-md'
          }`}
        >
          <div className="flex flex-col h-full overflow-hidden">
            {/* Logo Thương Hiệu: SOCCER 247 ADMIN */}
            <div className={`p-4 flex items-center justify-between border-b shrink-0 ${isDarkMode ? 'border-emerald-900/40' : 'border-slate-200'}`}>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-green-400 flex items-center justify-center shadow-md shadow-emerald-500/25 ring-2 ring-emerald-400/40">
                  <span className="text-lg">⚽</span>
                </div>
                <div>
                  <h1 className="text-lg font-black tracking-tight flex items-center gap-1 leading-none">
                    <span className={isDarkMode ? 'text-white' : 'text-[#0f172a]'}>SOCCER247</span>
                    <span className="text-emerald-600">ADMIN</span>
                  </h1>
                  <p className={`text-[9px] uppercase font-black tracking-widest mt-1 flex items-center gap-1 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Hệ Thống 11 Bảng CSDL
                  </p>
                </div>
              </div>
            </div>

            {/* Menu Phân Cấp Dạng Cây Theo 5 Nhóm & 11 Bảng */}
            <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
              {SIDEBAR_GROUPS.map((group, gIdx) => {
                const GroupIcon = group.groupIcon;
                return (
                  <div key={gIdx} className="space-y-1">
                    {/* Tiêu đề nhóm */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-400 border-b border-slate-100 dark:border-emerald-950 pb-1 mb-1">
                      <GroupIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>{group.groupTitle}</span>
                    </div>

                    {/* Danh sách mục con trong nhóm */}
                    <div className="space-y-1 pl-1">
                      {group.items.map((item) => {
                        const ItemIcon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as TabType)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-black transition-all text-left cursor-pointer group ${
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
                              <span className="text-slate-400 group-hover:text-emerald-500 font-mono text-[10px]">├─</span>
                              <ItemIcon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white md:text-slate-950 stroke-[3]' : isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`} />
                              <span className="truncate">{item.label}</span>
                            </div>

                            {item.badge && (
                              <span
                                className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold shrink-0 ${
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

            {/* Footer Admin User Info */}
            <div className={`p-3 border-t shrink-0 flex items-center justify-between ${isDarkMode ? 'border-emerald-900/40 bg-[#060e09]' : 'border-slate-200 bg-slate-50'}`}>
              <div className="flex items-center gap-2 truncate">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                  {currentAdminUser?.ho_ten ? currentAdminUser.ho_ten.charAt(0).toUpperCase() : 'AD'}
                </div>
                <div className="truncate">
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
                className={`p-1.5 rounded-lg transition-all cursor-pointer shrink-0 ${isDarkMode ? 'text-rose-400 hover:bg-rose-500/20' : 'text-rose-600 hover:bg-rose-100'}`}
                title="Đăng xuất khỏi Dashboard"
              >
                <LogOut className="w-4 h-4" />
              </button>
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
                {activeTab === 'OVERVIEW' && 'Dashboard (Thống Kê KPI & Biểu Đồ Doanh Thu)'}
                {activeTab === 'SAN_BONG' && 'Danh Sách Sân Bóng (Bảng San_Bong)'}
                {activeTab === 'LOAI_SAN_GIA' && 'Loại Sân & Bảng Giá Khung Giờ (Loai_San, Khung_Gio_Gia)'}
                {activeTab === 'DICH_VU' && 'Danh Mục Dịch Vụ & Kho Nước (Bảng Dich_Vu)'}
                {activeTab === 'PHIEU_NHAP_KHO' && 'Quản Lý Nhập Kho (Bảng Phieu_Nhap_Kho)'}
                {activeTab === 'DON_DAT_THANH_TOAN' && 'Đơn Đặt Sân & Chi Tiết Thanh Toán (Don_Dat_San, Thanh_Toan)'}
                {activeTab === 'HOAN_TIEN' && 'Quản Lý Hủy Sân & Hoàn Tiền (Bảng Lich_Su_Hoan_Tien)'}
                {activeTab === 'KHUNG_GIO' && 'Quản Lý Danh Sách Khung Giờ (Bảng Khung_Gio)'}
                {activeTab === 'NGUOI_DUNG' && 'Danh Sách Người Dùng (Bảng Nguoi_Dung)'}
                {activeTab === 'VAI_TRO' && 'Phân Quyền & Vai Trò (Bảng Vai_Tro)'}
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
                      Danh Sách Sân Bóng (Bảng San_Bong)
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
                        <Layers className="w-5 h-5 text-emerald-600" /> Bảng 2: Loai_San (Danh Mục Loại Sân)
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
                      <PackagePlus className="w-5 h-5 text-emerald-600" /> Bảng 6: Dich_Vu (Danh Mục Mặt Hàng & Tồn Kho)
                    </h3>
                  </div>
                  <button onClick={() => setServiceModal({ isOpen: true, mode: 'ADD', data: {} })} className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center gap-1.5 cursor-pointer">
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
                      <Download className="w-5 h-5 text-emerald-600" /> Bảng 7: Phieu_Nhap_Kho (Quản Lý Nhập Hàng)
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
                          <td className="p-4 font-mono text-slate-500">{p.ngay_nhap}</td>
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
                      Bảng Đơn Đặt Sân & Thanh Toán (Don_Dat_San & Thanh_Toan)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Quản lý toàn bộ thông tin lịch đặt sân, khách hàng và giao dịch thanh toán / cọc sân.
                    </p>
                  </div>
                  <button
                    onClick={() => setBookingModal({
                      isOpen: true,
                      mode: 'ADD',
                      data: {
                        ma_san: courtList[0]?.id || 1,
                        ma_nguoi_dung: userList[0]?.id || 1,
                        ngay_da: selectedDate,
                        gio_bat_dau: '17:00',
                        gio_ket_thuc: '18:30',
                        tien_san: 350000,
                        tong_tien: 350000,
                        trang_thai: 'DA_CHOT',
                        phuong_thuc: 'TIEN_MAT',
                        loai_thanh_toan: 'TRA_HET',
                        so_tien: 350000,
                        trang_thai_gd: 'THANH_CONG',
                        ghi_chu: 'Đặt trực tiếp tại quầy'
                      }
                    })}
                    className="px-4 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" /> Thêm Đơn & Thanh Toán
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[950px]">
                    <thead>
                      <tr className={`border-b font-black uppercase ${isDarkMode ? 'bg-[#060e09] text-emerald-300' : 'bg-slate-100 text-[#0f172a]'}`}>
                        <th className="p-4">MÃ ĐƠN</th>
                        <th className="p-4">KHÁCH HÀNG / SĐT</th>
                        <th className="p-4">SÂN BÓNG</th>
                        <th className="p-4">NGÀY & GIỜ ĐÁ</th>
                        <th className="p-4">TỔNG TIỀN</th>
                        <th className="p-4">PHƯƠNG THỨC</th>
                        <th className="p-4">TRẠNG THÁI</th>
                        <th className="p-4">GHI CHÚ</th>
                        <th className="p-4 text-right">THAO TÁC</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-emerald-900/30">
                      {bookingList.map((b) => {
                        return (
                          <tr key={b.id} className={isDarkMode ? 'hover:bg-emerald-950/20' : 'hover:bg-slate-50'}>
                            <td className="p-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">#{b.id}</td>
                            <td className="p-4">
                              <div className="font-black text-sm">{b.ten_khach_hang || 'Khách Hàng'}</div>
                              <div className="text-[11px] text-slate-400 font-mono">{b.so_dien_thoai}</div>
                            </td>
                            <td className="p-4 font-bold">{b.ten_san}</td>
                            <td className="p-4">
                              <div className="font-bold">{b.ngay_da ? (b.ngay_da.includes('T') ? b.ngay_da.split('T')[0] : b.ngay_da) : ''}</div>
                              <div className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-black">{b.gio_bat_dau} - {b.gio_ket_thuc}</div>
                            </td>
                            <td className="p-4 font-black text-sm text-emerald-600 dark:text-emerald-400">
                              {Number(b.tong_tien || b.tien_san || 0).toLocaleString('vi-VN')} đ
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase ${
                                b.phuong_thuc === 'CHUYEN_KHOAN' ? 'bg-blue-500/15 text-blue-500 border border-blue-500/30' : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              }`}>
                                {b.phuong_thuc === 'CHUYEN_KHOAN' ? 'Chuyển Khoản' : 'Tiền Mặt'}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                (b.trang_thai === 'DA_THANH_TOAN' || b.trang_thai === 'Da Thanh Toan') ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' :
                                (b.trang_thai === 'DA_COC' || b.trang_thai === 'DA_CHOT') ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30' :
                                b.trang_thai === 'HOAN_THANH' ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30' :
                                b.trang_thai === 'DA_HUY' ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30' :
                                'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                              }`}>
                                {(b.trang_thai === 'DA_THANH_TOAN' || b.trang_thai === 'Da Thanh Toan') ? 'Đã Thanh Toán' :
                                 (b.trang_thai === 'DA_COC' || b.trang_thai === 'DA_CHOT') ? 'Đã Cọc' :
                                 b.trang_thai === 'HOAN_THANH' ? 'Hoàn Thành' :
                                 b.trang_thai === 'DA_HUY' ? 'Đã Hủy' : b.trang_thai}
                              </span>
                            </td>
                            <td className="p-4 text-slate-500 dark:text-slate-400 text-[11px] max-w-[150px] truncate">
                              {b.ghi_chu || '—'}
                            </td>
                            <td className="p-4 text-right space-x-2 whitespace-nowrap">
                              <button
                                onClick={() => setBookingModal({
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
                                    trang_thai: b.trang_thai || 'DA_COC',
                                    ghi_chu: b.ghi_chu,
                                    phuong_thuc: b.phuong_thuc || 'CHUYEN_KHOAN',
                                    loai_thanh_toan: b.trang_thai === 'DA_THANH_TOAN' ? 'TRA_HET' : 'DAT_COC'
                                  }
                                })}
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
                      <RefreshCw className="w-5 h-5 text-rose-500" /> Bảng Lịch Sử Hoàn Tiền (Lich_Su_Hoan_Tien)
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
                        <th className="p-4">MÃ HOÀN</th>
                        <th className="p-4">MÃ ĐƠN ĐẶT</th>
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
                          <td className="p-4 font-mono font-bold text-slate-400">#{h.id}</td>
                          <td className="p-4 font-mono font-bold text-rose-500">#{h.ma_don_dat}</td>
                          <td className="p-4 font-black">{h.ten_khach_hang || 'Khách Đặt'}</td>
                          <td className="p-4 font-black text-rose-600 dark:text-rose-400 text-sm">
                            {Number(h.so_tien_hoan).toLocaleString('vi-VN')} đ
                          </td>
                          <td className="p-4 font-black">
                            <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-500">{h.ty_le_hoan}%</span>
                          </td>
                          <td className="p-4 text-slate-600 dark:text-slate-300">{h.ly_do_huy}</td>
                          <td className="p-4 font-mono text-slate-400">{h.ngay_hoan}</td>
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
                      Bảng Khung Giờ Hoạt Động (Khung_Gio)
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
                        <th className="p-4">STT / THỨ TỰ</th>
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
                          <td className="p-4 font-mono font-bold text-slate-400">
                            #{k.thu_tu || index + 1}
                          </td>
                          <td className="p-4">
                            <span className="font-black text-sm text-emerald-600 dark:text-emerald-400 font-mono px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                              {k.nhan_hien_thi}
                            </span>
                          </td>
                          <td className="p-4 font-mono font-bold text-slate-200 text-sm">{k.gio_bat_dau}</td>
                          <td className="p-4 font-mono font-bold text-slate-200 text-sm">{k.gio_ket_thuc}</td>
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
                      <User className="w-5 h-5 text-emerald-600" /> Bảng 10: Nguoi_Dung (Tài Khoản & Người Dùng)
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
                      <ShieldCheck className="w-5 h-5 text-emerald-600" /> Bảng 11: Vai_Tro (Phân Quyền Hệ Thống)
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

          </div>
        </div>
      </div>

      {/* =====================================================================
          CÁC MODAL THÊM / SỬA CHO 11 BẢNG
          ===================================================================== */}

      {/* 1. Modal Sân Bóng (San_Bong) */}
      {courtModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl ${isDarkMode ? 'bg-[#0a150e] border-emerald-900/60 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}>
            <div className="flex items-center justify-between pb-3 border-b mb-4">
              <h3 className="font-black text-base">{courtModal.mode === 'ADD' ? '⚽ Thêm Sân Bóng Mới' : '✏️ Cập Nhật Sân Bóng'}</h3>
              <button onClick={() => setCourtModal({ isOpen: false, mode: 'ADD', data: {} })}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveCourt} className="space-y-4 text-xs">
              <div>
                <label className="block font-black uppercase mb-1">Tên Sân Bóng *</label>
                <input
                  type="text"
                  value={courtModal.data.ten_san || ''}
                  onChange={(e) => setCourtModal({ ...courtModal, data: { ...courtModal.data, ten_san: e.target.value } })}
                  placeholder="Ví dụ: Sân 5D Sân VIP"
                  className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                />
              </div>
              <div>
                <label className="block font-black uppercase mb-1">Loại Sân *</label>
                <select
                  value={courtModal.data.ma_loai_san || 1}
                  onChange={(e) => setCourtModal({ ...courtModal, data: { ...courtModal.data, ma_loai_san: Number(e.target.value) } })}
                  className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                >
                  {categoryList.map((l) => (
                    <option key={l.id} value={l.id}>{l.ten_loai}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-black uppercase mb-1">Đơn Giá Theo Phút (VNĐ/phút) *</label>
                <input
                  type="number"
                  step="500"
                  required
                  value={courtModal.data.don_gia_phut || 5000}
                  onChange={(e) => setCourtModal({ ...courtModal, data: { ...courtModal.data, don_gia_phut: Number(e.target.value) } })}
                  placeholder="Ví dụ: 5000"
                  className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                />
                <div className="text-[11px] text-slate-500 mt-1 font-medium">
                  💡 Gợi ý: {Number(courtModal.data.don_gia_phut || 5000).toLocaleString('vi-VN')} đ/phút = {(Number(courtModal.data.don_gia_phut || 5000) * 60).toLocaleString('vi-VN')} đ/giờ (60 phút)
                </div>
              </div>
              <div>
                <label className="block font-black uppercase mb-1">Trạng Thái Vận Hành</label>
                <select
                  value={courtModal.data.trang_thai || 'SAN_SANG'}
                  onChange={(e) => setCourtModal({ ...courtModal, data: { ...courtModal.data, trang_thai: e.target.value as any } })}
                  className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                >
                  <option value="SAN_SANG">Sẵn Sàng Vận Hành</option>
                  <option value="BAO_TRI">Bảo Trì / Sửa Chữa</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setCourtModal({ isOpen: false, mode: 'ADD', data: {} })} className="px-4 py-2 rounded-xl font-bold bg-slate-200 text-slate-800 cursor-pointer">Hủy</button>
                <button type="submit" className="px-5 py-2 rounded-xl font-black bg-emerald-600 text-white cursor-pointer">Lưu Sân Bóng</button>
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
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl ${isDarkMode ? 'bg-[#0a150e] border-emerald-900/60 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}>
            <div className="flex items-center justify-between pb-3 border-b mb-4">
              <h3 className="font-black text-base">{serviceModal.mode === 'ADD' ? '🥤 Thêm Dịch Vụ Mới' : '✏️ Cập Nhật Dịch Vụ'}</h3>
              <button onClick={() => setServiceModal({ isOpen: false, mode: 'ADD', data: {} })}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveService} className="space-y-4 text-xs">
              <div>
                <label className="block font-black uppercase mb-1">Tên Dịch Vụ / Nước Uống *</label>
                <input
                  type="text"
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
                    value={serviceModal.data.don_gia || ''}
                    onChange={(e) => setServiceModal({ ...serviceModal, data: { ...serviceModal.data, don_gia: Number(e.target.value) } })}
                    className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                  />
                </div>
                <div>
                  <label className="block font-black uppercase mb-1">Đơn Vị Tính *</label>
                  <input
                    type="text"
                    value={serviceModal.data.don_vi_tinh || 'Chai'}
                    onChange={(e) => setServiceModal({ ...serviceModal, data: { ...serviceModal.data, don_vi_tinh: e.target.value } })}
                    className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setServiceModal({ isOpen: false, mode: 'ADD', data: {} })} className="px-4 py-2 rounded-xl font-bold bg-slate-200 text-slate-800 cursor-pointer">Hủy</button>
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
                      setBookingModal({ ...bookingModal, data: { ...bookingModal.data, ma_san: ms, ten_san: s?.ten_san } });
                    }}
                    className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                  >
                    {courtList.map((c) => (
                      <option key={c.id} value={c.id}>{c.ten_san}</option>
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
                  <label className="block font-black uppercase mb-1">Giờ Bắt Đầu *</label>
                  <input
                    type="text"
                    required
                    placeholder="17:00"
                    value={bookingModal.data.gio_bat_dau || '17:00'}
                    onChange={(e) => setBookingModal({ ...bookingModal, data: { ...bookingModal.data, gio_bat_dau: e.target.value } })}
                    className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                  />
                </div>
                <div>
                  <label className="block font-black uppercase mb-1">Giờ Kết Thúc *</label>
                  <input
                    type="text"
                    required
                    placeholder="18:30"
                    value={bookingModal.data.gio_ket_thuc || '18:30'}
                    onChange={(e) => setBookingModal({ ...bookingModal, data: { ...bookingModal.data, gio_ket_thuc: e.target.value } })}
                    className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black uppercase mb-1">Tiền Sân (VNĐ) *</label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={bookingModal.data.tien_san || 350000}
                    onChange={(e) => {
                      const ts = Number(e.target.value);
                      setBookingModal({ ...bookingModal, data: { ...bookingModal.data, tien_san: ts, tong_tien: ts } });
                    }}
                    className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
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

              <div>
                <label className="block font-black uppercase mb-1">Trạng Thái Đơn</label>
                <select
                  value={bookingModal.data.trang_thai || 'DA_COC'}
                  onChange={(e) => setBookingModal({ ...bookingModal, data: { ...bookingModal.data, trang_thai: e.target.value } })}
                  className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                >
                  <option value="DA_COC">Đã Cọc (30%)</option>
                  <option value="DA_THANH_TOAN">Đã Thanh Toán (100%)</option>
                  <option value="HOAN_THANH">Hoàn Thành (Đã đá xong)</option>
                  <option value="DA_HUY">Đã Hủy</option>
                </select>
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

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setBookingModal({ isOpen: false, mode: 'ADD', data: {} })} className="px-4 py-2 rounded-xl font-bold bg-slate-200 text-slate-800 cursor-pointer">Hủy</button>
                <button type="submit" className="px-5 py-2 rounded-xl font-black bg-emerald-600 text-white cursor-pointer hover:bg-emerald-500">Lưu Đơn Đặt Sân</button>
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

    </div>
  );
}
