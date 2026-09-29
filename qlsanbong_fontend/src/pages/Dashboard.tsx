import React, { useState, useMemo, useEffect } from 'react';
import Head from 'next/head';
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
  FolderTree
} from 'lucide-react';

// =====================================================================
// 1. ĐỊNH NGHĨA KIỂU DỮ LIỆU & TABS (ÁNH XẠ 11 BẢNG CSDL)
// =====================================================================

export type TabType =
  // 1. Tổng Quan
  | 'OVERVIEW'
  // 2. Quản Lý Sân Bóng (San_Bong, Loai_San, Khung_Gio_Gia, Don_Dat_San)
  | 'TIMELINE_GRID'
  | 'SAN_BONG'
  | 'LOAI_SAN_GIA'
  | 'DON_DAT_SAN'
  // 3. Dịch Vụ & Bán Hàng POS (Chi_Tiet_Dich_Vu, Dich_Vu, Phieu_Nhap_Kho)
  | 'POS_ORDER'
  | 'DICH_VU'
  | 'PHIEU_NHAP_KHO'
  // 4. Tài Chính & Giao Dịch (Thanh_Toan, Lich_Su_Hoan_Tien)
  | 'THANH_TOAN'
  | 'HOAN_TIEN'
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
  trang_thai: 'SAN_SANG' | 'BAO_TRI';
}

// 2. Loai_San
export interface LoaiSan {
  id: number;
  ten_loai: string;
  mo_ta: string;
  gia_co_ban: number;
}

// 3. Khung_Gio_Gia
export interface KhungGioGia {
  id: number;
  ma_loai_san: number;
  ten_loai?: string;
  gio_bat_dau: string;
  gio_ket_thuc: string;
  la_cuoi_tuan: boolean;
  don_gia: number;
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
  tien_coc_da_tra: number;
  kieu_dat?: 'CO_DINH' | 'LINH_HOAT';
  so_phut_da?: number;
  ghi_chu?: string;
  trang_thai: 'CHO_XAC_NHAN' | 'DA_CHOT' | 'HOAN_THANH' | 'DA_HUY';
  dich_vu_da_dung: {
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
  phuong_thuc: 'TIEN_MAT' | 'VNPAY' | 'MOMO';
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
  { id: 1, ten_loai: 'Sân 5 người', mo_ta: 'Cỏ nhân tạo FIFA Pro tiêu chuẩn 1000 Lux', gia_co_ban: 250000 },
  { id: 2, ten_loai: 'Sân 7 người', mo_ta: 'Mặt cỏ mềm cao cấp tiêu chuẩn thi đấu', gia_co_ban: 450000 },
  { id: 3, ten_loai: 'Sân Pickleball', mo_ta: 'Mặt sân cao su chuẩn quốc tế', gia_co_ban: 180000 },
  { id: 4, ten_loai: 'Sân Cầu lông', mo_ta: 'Sàn gỗ chuyên dụng chống trơn', gia_co_ban: 120000 },
];

const INITIAL_SAN_BONG: SanBong[] = [
  { id: 1, ma_loai_san: 1, ten_san: 'Sân 5A (Cỏ nhân tạo)', ten_loai: 'Sân 5 người', hinh_anh: '/images/san-5a.jpg', trang_thai: 'SAN_SANG' },
  { id: 2, ma_loai_san: 1, ten_san: 'Sân 5B (Cỏ nhân tạo)', ten_loai: 'Sân 5 người', hinh_anh: '/images/san-5b.jpg', trang_thai: 'SAN_SANG' },
  { id: 3, ma_loai_san: 1, ten_san: 'Sân 5C (VIP Sân Đêm)', ten_loai: 'Sân 5 người', hinh_anh: '/images/san-5c.jpg', trang_thai: 'SAN_SANG' },
  { id: 4, ma_loai_san: 2, ten_san: 'Sân 7A (Sân Đại)', ten_loai: 'Sân 7 người', hinh_anh: '/images/san-7a.jpg', trang_thai: 'SAN_SANG' },
  { id: 5, ma_loai_san: 2, ten_san: 'Sân 7B (Sân Đại)', ten_loai: 'Sân 7 người', hinh_anh: '/images/san-7b.jpg', trang_thai: 'SAN_SANG' },
  { id: 6, ma_loai_san: 3, ten_san: 'Pickleball 01 (Indoor)', ten_loai: 'Sân Pickleball', hinh_anh: '/images/pb-1.jpg', trang_thai: 'SAN_SANG' },
  { id: 7, ma_loai_san: 3, ten_san: 'Pickleball 02 (Outdoor)', ten_loai: 'Sân Pickleball', hinh_anh: '/images/pb-2.jpg', trang_thai: 'BAO_TRI' },
  { id: 8, ma_loai_san: 4, ten_san: 'Cầu lông 01 (Trong nhà)', ten_loai: 'Sân Cầu lông', hinh_anh: '/images/cl-1.jpg', trang_thai: 'SAN_SANG' },
];

const INITIAL_KHUNG_GIO_GIA: KhungGioGia[] = [
  { id: 1, ma_loai_san: 1, ten_loai: 'Sân 5 người', gio_bat_dau: '06:00', gio_ket_thuc: '16:30', la_cuoi_tuan: false, don_gia: 250000 },
  { id: 2, ma_loai_san: 1, ten_loai: 'Sân 5 người', gio_bat_dau: '16:30', gio_ket_thuc: '21:00', la_cuoi_tuan: false, don_gia: 350000 },
  { id: 3, ma_loai_san: 1, ten_loai: 'Sân 5 người', gio_bat_dau: '06:00', gio_ket_thuc: '23:00', la_cuoi_tuan: true, don_gia: 380000 },
  { id: 4, ma_loai_san: 2, ten_loai: 'Sân 7 người', gio_bat_dau: '06:00', gio_ket_thuc: '16:30', la_cuoi_tuan: false, don_gia: 450000 },
  { id: 5, ma_loai_san: 2, ten_loai: 'Sân 7 người', gio_bat_dau: '16:30', gio_ket_thuc: '21:00', la_cuoi_tuan: false, don_gia: 650000 },
  { id: 6, ma_loai_san: 2, ten_loai: 'Sân 7 người', gio_bat_dau: '06:00', gio_ket_thuc: '23:00', la_cuoi_tuan: true, don_gia: 700000 },
  { id: 7, ma_loai_san: 3, ten_loai: 'Sân Pickleball', gio_bat_dau: '16:30', gio_ket_thuc: '21:00', la_cuoi_tuan: false, don_gia: 260000 },
  { id: 8, ma_loai_san: 4, ten_loai: 'Sân Cầu lông', gio_bat_dau: '06:00', gio_ket_thuc: '23:00', la_cuoi_tuan: false, don_gia: 120000 },
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
  { id: 1, ma_don_dat: 101, ten_khach_hang: 'Nguyễn Văn Đạt', so_dien_thoai: '0988776655', ten_san: 'Sân 5A', ngay_da: '2026-09-29', so_tien: 200000, phuong_thuc: 'VNPAY', loai_thanh_toan: 'DAT_COC', ma_giao_dich: 'VNPAY_987123', ngay_thanh_toan: '2026-09-29 14:00' },
  { id: 2, ma_don_dat: 102, ten_khach_hang: 'Lê Hoàng Long', so_dien_thoai: '0912345999', ten_san: 'Sân 7A', ngay_da: '2026-09-29', so_tien: 200000, phuong_thuc: 'MOMO', loai_thanh_toan: 'DAT_COC', ma_giao_dich: 'MOMO_445566', ngay_thanh_toan: '2026-09-29 15:30' },
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

// Cấu trúc cây Menu Sidebar 5 Nhóm chuẩn theo ảnh thiết kế của User (Đổi tên Ma Trận Lịch Sân thành Sơ đồ sân)
const SIDEBAR_GROUPS = [
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
      { id: 'TIMELINE_GRID', label: 'Sơ đồ sân', icon: Calendar, badge: 'Live' },
      { id: 'SAN_BONG', label: 'Danh Sách Sân Bóng', icon: Layers, tableHint: 'San_Bong' },
      { id: 'LOAI_SAN_GIA', label: 'Loại Sân & Bảng Giá', icon: Clock, tableHint: 'Loai_San, Khung_Gio_Gia' },
      { id: 'DON_DAT_SAN', label: 'Đặt Sân', icon: Flame, badge: 'HOT', tableHint: 'Don_Dat_San' }
    ]
  },
  {
    groupTitle: 'DỊCH VỤ & BÁN HÀNG (POS)',
    groupIcon: ShoppingCart,
    items: [
      { id: 'POS_ORDER', label: 'Quầy Bán Hàng (POS)', icon: Sparkles, badge: 'POS', tableHint: 'Chi_Tiet_Dich_Vu' },
      { id: 'DICH_VU', label: 'Danh Mục Dịch Vụ', icon: PackagePlus, tableHint: 'Dich_Vu' },
      { id: 'PHIEU_NHAP_KHO', label: 'Quản Lý Nhập Kho', icon: Download, tableHint: 'Phieu_Nhap_Kho' }
    ]
  },
  {
    groupTitle: 'TÀI CHÍNH & GIAO DỊCH',
    groupIcon: CreditCard,
    items: [
      { id: 'THANH_TOAN', label: 'Lịch Sử Thanh Toán', icon: Receipt, tableHint: 'Thanh_Toan' },
      { id: 'HOAN_TIEN', label: 'Quản Lý Hủy / Hoàn Tiền', icon: RefreshCw, tableHint: 'Lich_Su_Hoan_Tien' }
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
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabType>('OVERVIEW');

  // Dữ liệu 11 Bảng CSDL
  const [courtList, setCourtList] = useState<SanBong[]>(INITIAL_SAN_BONG);
  const [categoryList, setCategoryList] = useState<LoaiSan[]>(INITIAL_LOAI_SAN);
  const [priceList, setPriceList] = useState<KhungGioGia[]>(INITIAL_KHUNG_GIO_GIA);
  const [bookingList, setBookingList] = useState<DonDatSan[]>(INITIAL_DON_DAT);
  const [serviceDetailList, setServiceDetailList] = useState<ChiTietDichVu[]>(INITIAL_CHI_TIET_DICH_VU);
  const [serviceList, setServiceList] = useState<DichVu[]>(INITIAL_DICH_VU);
  const [inventoryList, setInventoryList] = useState<PhieuNhapKho[]>(INITIAL_PHIEU_NHAP);
  const [paymentList, setPaymentList] = useState<ThanhToan[]>(INITIAL_THANH_TOAN);
  const [refundList, setRefundList] = useState<LichSuHoanTien[]>(INITIAL_HOAN_TIEN);
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

      const resPrice = await fetch(`${API_BASE}/dat-san/khung-gio-gia`);
      if (resPrice.ok) {
        const data = await resPrice.json();
        if (data.success && Array.isArray(data.data) && data.data.length > 0) setPriceList(data.data);
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
  // MODAL STATES (ĐẦY ĐỦ THÊM / SỬA / XÓA CHO TẤT CẢ 11 BẢNG)
  // =====================================================================

  const [courtModal, setCourtModal] = useState<{ isOpen: boolean; mode: 'ADD' | 'EDIT'; data: Partial<SanBong> }>({ isOpen: false, mode: 'ADD', data: {} });
  const [loaiSanModal, setLoaiSanModal] = useState<{ isOpen: boolean; mode: 'ADD' | 'EDIT'; data: Partial<LoaiSan> }>({ isOpen: false, mode: 'ADD', data: {} });
  const [priceModal, setPriceModal] = useState<{ isOpen: boolean; mode: 'ADD' | 'EDIT'; data: Partial<KhungGioGia> }>({ isOpen: false, mode: 'ADD', data: {} });
  const [serviceModal, setServiceModal] = useState<{ isOpen: boolean; mode: 'ADD' | 'EDIT'; data: Partial<DichVu> }>({ isOpen: false, mode: 'ADD', data: {} });
  const [importStockModal, setImportStockModal] = useState<{ isOpen: boolean; mode: 'ADD' | 'EDIT'; data: Partial<PhieuNhapKho> }>({ isOpen: false, mode: 'ADD', data: { ma_dich_vu: 1, so_luong_nhap: 50, gia_nhap: 12000 } });
  const [paymentModal, setPaymentModal] = useState<{ isOpen: boolean; mode: 'ADD' | 'EDIT'; data: Partial<ThanhToan> }>({ isOpen: false, mode: 'ADD', data: { phuong_thuc: 'TIEN_MAT', loai_thanh_toan: 'DAT_COC' } });
  const [refundModal, setRefundModal] = useState<{ isOpen: boolean; mode: 'ADD' | 'EDIT'; data: Partial<LichSuHoanTien> }>({ isOpen: false, mode: 'ADD', data: { ty_le_hoan: 100 } });
  const [userModal, setUserModal] = useState<{ isOpen: boolean; mode: 'ADD' | 'EDIT'; data: Partial<NguoiDung> }>({ isOpen: false, mode: 'ADD', data: {} });
  const [roleModal, setRoleModal] = useState<{ isOpen: boolean; mode: 'ADD' | 'EDIT'; data: Partial<VaiTro> }>({ isOpen: false, mode: 'ADD', data: {} });
  const [bookingEditModal, setBookingEditModal] = useState<{ isOpen: boolean; mode: 'ADD' | 'EDIT'; data: Partial<DonDatSan> }>({ isOpen: false, mode: 'ADD', data: {} });

  const [checkoutModal, setCheckoutModal] = useState<{ isOpen: boolean; booking: DonDatSan | null; paymentMethod: 'TIEN_MAT' | 'VNPAY' | 'MOMO'; discount: number }>({ isOpen: false, booking: null, paymentMethod: 'TIEN_MAT', discount: 0 });
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
    const isWeekend = new Date(ngayDa).getDay() === 0 || new Date(ngayDa).getDay() === 6;
    const matchingPrice = priceList.find(
      (p) =>
        p.ma_loai_san === selectedCourt?.ma_loai_san &&
        p.la_cuoi_tuan === isWeekend &&
        gioBat >= p.gio_bat_dau &&
        gioBat < p.gio_ket_thuc
    );
    const hourlyPrice = matchingPrice?.don_gia || (isWeekend ? 380000 : 350000);
    const perMinute = Math.round(hourlyPrice / 60);
    const calcPrice = Math.round((totalMinutes * hourlyPrice) / 60 / 1000) * 1000;

    return {
      so_phut: totalMinutes,
      don_gia_gio: hourlyPrice,
      don_gia_phut: perMinute,
      tien_san: calcPrice,
      cong_thuc: `${totalMinutes} phút × ${hourlyPrice.toLocaleString('vi-VN')} đ / 60 = ${calcPrice.toLocaleString('vi-VN')} đ`
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
    const { id, ten_san, ma_loai_san, trang_thai, hinh_anh } = courtModal.data;
    if (!ten_san || !ma_loai_san) {
      setToastMessage({ type: 'error', message: 'Vui lòng nhập tên sân và chọn loại sân!' });
      return;
    }

    try {
      if (courtModal.mode === 'ADD') {
        const res = await fetch(`${API_BASE}/dat-san/san-bong`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ ten_san, ma_loai_san: Number(ma_loai_san), hinh_anh: hinh_anh || '', trang_thai: trang_thai || 'SAN_SANG' })
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
          body: JSON.stringify({ ten_san, ma_loai_san: Number(ma_loai_san), hinh_anh: hinh_anh || '', trang_thai: trang_thai || 'SAN_SANG' })
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
      setCourtList([...courtList, { id: newId, ma_loai_san: Number(ma_loai_san), ten_san, ten_loai: loai?.ten_loai || '', hinh_anh: '', trang_thai: (trang_thai as any) || 'SAN_SANG' }]);
      setToastMessage({ type: 'success', message: `✅ Đã thêm sân mới [${ten_san}]!` });
    } else {
      setCourtList(courtList.map((c) => (c.id === id ? { ...c, ten_san, ma_loai_san: Number(ma_loai_san), ten_loai: loai?.ten_loai || c.ten_loai, trang_thai: trang_thai as any } : c)));
      setToastMessage({ type: 'success', message: `✅ Đã cập nhật sân [${ten_san}]!` });
    }
    setCourtModal({ isOpen: false, mode: 'ADD', data: {} });
  };

  const handleDeleteCourt = async (courtId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sân bóng này?')) return;
    try {
      const res = await fetch(`${API_BASE}/dat-san/san-bong/${courtId}`, { method: 'DELETE', headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) {
        setToastMessage({ type: 'success', message: '🗑️ Đã xóa sân bóng thành công!' });
        loadAllDataFromBackend();
        return;
      }
    } catch (err) {}
    setCourtList(courtList.filter((c) => c.id !== courtId));
    setToastMessage({ type: 'success', message: '🗑️ Đã xóa sân bóng!' });
  };

  // 3. Thêm/Sửa Loại Sân (Loai_San)
  const handleSaveLoaiSan = async (e: React.FormEvent) => {
    e.preventDefault();
    const { id, ten_loai, mo_ta, gia_co_ban } = loaiSanModal.data;
    if (!ten_loai) {
      setToastMessage({ type: 'error', message: 'Vui lòng nhập tên loại sân!' });
      return;
    }
    if (loaiSanModal.mode === 'ADD') {
      const newId = Math.max(...categoryList.map(l => l.id), 0) + 1;
      setCategoryList([...categoryList, { id: newId, ten_loai, mo_ta: mo_ta || '', gia_co_ban: Number(gia_co_ban || 200000) }]);
      setToastMessage({ type: 'success', message: `✅ Đã thêm loại sân [${ten_loai}] thành công!` });
    } else {
      setCategoryList(categoryList.map(l => l.id === id ? { ...l, ten_loai, mo_ta: mo_ta || '', gia_co_ban: Number(gia_co_ban || l.gia_co_ban) } : l));
      setToastMessage({ type: 'success', message: `✅ Đã cập nhật loại sân [${ten_loai}]!` });
    }
    setLoaiSanModal({ isOpen: false, mode: 'ADD', data: {} });
  };

  const handleDeleteLoaiSan = (id: number) => {
    if (!window.confirm('Xác nhận xóa loại sân này?')) return;
    setCategoryList(categoryList.filter(l => l.id !== id));
    setToastMessage({ type: 'success', message: '🗑️ Đã xóa loại sân!' });
  };

  // 4. Thêm/Sửa Khung Giờ Giá (Khung_Gio_Gia)
  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    const { id, ma_loai_san, gio_bat_dau, gio_ket_thuc, la_cuoi_tuan, don_gia } = priceModal.data;
    const loai = categoryList.find(l => l.id === Number(ma_loai_san || 1));
    if (priceModal.mode === 'ADD') {
      const newId = Math.max(...priceList.map(p => p.id), 0) + 1;
      setPriceList([...priceList, { id: newId, ma_loai_san: Number(ma_loai_san || 1), ten_loai: loai?.ten_loai, gio_bat_dau: gio_bat_dau || '06:00', gio_ket_thuc: gio_ket_thuc || '22:00', la_cuoi_tuan: !!la_cuoi_tuan, don_gia: Number(don_gia || 300000) }]);
      setToastMessage({ type: 'success', message: `✅ Đã thêm khung giờ giá mới!` });
    } else {
      setPriceList(priceList.map(p => p.id === id ? { ...p, ma_loai_san: Number(ma_loai_san || p.ma_loai_san), ten_loai: loai?.ten_loai || p.ten_loai, gio_bat_dau: gio_bat_dau || p.gio_bat_dau, gio_ket_thuc: gio_ket_thuc || p.gio_ket_thuc, la_cuoi_tuan: !!la_cuoi_tuan, don_gia: Number(don_gia || p.don_gia) } : p));
      setToastMessage({ type: 'success', message: `✅ Đã cập nhật khung giờ giá!` });
    }
    setPriceModal({ isOpen: false, mode: 'ADD', data: {} });
  };

  const handleDeletePrice = (id: number) => {
    if (!window.confirm('Xác nhận xóa khung giờ giá này?')) return;
    setPriceList(priceList.filter(p => p.id !== id));
    setToastMessage({ type: 'success', message: '🗑️ Đã xóa khung giờ giá!' });
  };

  // 5. Thêm/Sửa Dịch Vụ (Dich_Vu)
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

  const handleDeleteService = (id: number) => {
    if (!window.confirm('Xác nhận xóa dịch vụ này?')) return;
    setServiceList(serviceList.filter(s => s.id !== id));
    setToastMessage({ type: 'success', message: '🗑️ Đã xóa dịch vụ!' });
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

  const handleDeleteInventory = (id: number) => {
    if (!window.confirm('Xác nhận xóa phiếu nhập kho này?')) return;
    setInventoryList(inventoryList.filter(p => p.id !== id));
    setToastMessage({ type: 'success', message: '🗑️ Đã xóa phiếu nhập kho!' });
  };

  // 7. Thêm/Sửa Người Dùng (Nguoi_Dung)
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const { id, ho_ten, email, so_dien_thoai, vai_tro, mat_khau } = userModal.data;
    if (!ho_ten || !email) {
      setToastMessage({ type: 'error', message: 'Vui lòng nhập họ tên và email người dùng!' });
      return;
    }

    try {
      if (userModal.mode === 'ADD') {
        const res = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ ho_ten, email, so_dien_thoai: so_dien_thoai || '', mat_khau: mat_khau || '123456', vai_tro: vai_tro || 'KHACH_HANG' })
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
          body: JSON.stringify({ ho_ten, email, so_dien_thoai: so_dien_thoai || '', vai_tro: vai_tro || 'KHACH_HANG', mat_khau: mat_khau || '' })
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
      setUserList([...userList, { id: newId, ho_ten, email, so_dien_thoai: so_dien_thoai || '', vai_tro: vai_tro || 'KHACH_HANG', ngay_tao: new Date().toISOString().split('T')[0] }]);
      setToastMessage({ type: 'success', message: `👤 Đã tạo tài khoản mới [${ho_ten}]!` });
    } else {
      setUserList(userList.map((u) => (u.id === id ? { ...u, ho_ten, email, so_dien_thoai: so_dien_thoai || '', vai_tro: vai_tro || u.vai_tro } : u)));
      setToastMessage({ type: 'success', message: `👤 Đã cập nhật tài khoản [${ho_ten}]!` });
    }
    setUserModal({ isOpen: false, mode: 'ADD', data: {} });
  };

  const handleDeleteUser = (id: number) => {
    if (!window.confirm('Xác nhận xóa tài khoản người dùng này?')) return;
    setUserList(userList.filter(u => u.id !== id));
    setToastMessage({ type: 'success', message: '🗑️ Đã xóa tài khoản!' });
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

  const handleDeleteRole = (id: number) => {
    if (!window.confirm('Xác nhận xóa vai trò này?')) return;
    setRoleList(roleList.filter(r => r.MaVaiTro !== id));
    setToastMessage({ type: 'success', message: '🗑️ Đã xóa vai trò!' });
  };

  // 9. Thêm/Sửa Thanh Toán (Thanh_Toan)
  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    const { id, ma_don_dat, ten_khach_hang, so_tien, phuong_thuc, loai_thanh_toan, ma_giao_dich } = paymentModal.data;
    if (paymentModal.mode === 'ADD') {
      const newPay: ThanhToan = {
        id: Math.max(...paymentList.map(p => p.id), 0) + 1,
        ma_don_dat: Number(ma_don_dat || 101),
        ten_khach_hang: ten_khach_hang || 'Khách Hàng',
        so_tien: Number(so_tien || 200000),
        phuong_thuc: (phuong_thuc as any) || 'TIEN_MAT',
        loai_thanh_toan: (loai_thanh_toan as any) || 'DAT_COC',
        ma_giao_dich: ma_giao_dich || `GD_${Date.now()}`,
        ngay_thanh_toan: new Date().toISOString().replace('T', ' ').substring(0, 16)
      };
      setPaymentList([newPay, ...paymentList]);
      setToastMessage({ type: 'success', message: '✅ Đã thêm giao dịch thanh toán!' });
    } else {
      setPaymentList(paymentList.map(p => p.id === id ? { ...p, so_tien: Number(so_tien), phuong_thuc: phuong_thuc as any, loai_thanh_toan: loai_thanh_toan as any } : p));
      setToastMessage({ type: 'success', message: '✅ Đã cập nhật giao dịch thanh toán!' });
    }
    setPaymentModal({ isOpen: false, mode: 'ADD', data: {} });
  };

  const handleDeletePayment = (id: number) => {
    if (!window.confirm('Xác nhận xóa bản ghi thanh toán này?')) return;
    setPaymentList(paymentList.filter(p => p.id !== id));
    setToastMessage({ type: 'success', message: '🗑️ Đã xóa bản ghi thanh toán!' });
  };

  // 10. Thêm/Sửa Hoàn Tiền (Lich_Su_Hoan_Tien)
  const handleSaveRefund = (e: React.FormEvent) => {
    e.preventDefault();
    const { id, ma_don_dat, ten_khach_hang, so_tien_hoan, ty_le_hoan, ly_do_huy } = refundModal.data;
    if (refundModal.mode === 'ADD') {
      const newRef: LichSuHoanTien = {
        id: Math.max(...refundList.map(r => r.id), 0) + 1,
        ma_don_dat: Number(ma_don_dat || 101),
        ten_khach_hang: ten_khach_hang || 'Khách Hủy Sân',
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

  const handleDeleteRefund = (id: number) => {
    if (!window.confirm('Xác nhận xóa phiếu hoàn tiền này?')) return;
    setRefundList(refundList.filter(r => r.id !== id));
    setToastMessage({ type: 'success', message: '🗑️ Đã xóa phiếu hoàn tiền!' });
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

  const handleDeleteServiceDetail = (id: number) => {
    if (!window.confirm('Xác nhận xóa chi tiết dịch vụ này khỏi hóa đơn?')) return;
    setServiceDetailList(serviceDetailList.filter(d => d.id !== id));
    setToastMessage({ type: 'success', message: '🗑️ Đã xóa chi tiết dịch vụ!' });
  };

  // 12. Trả Sân & Xuất Hóa Đơn (Thanh_Toan)
  const handleConfirmCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutModal.booking) return;

    const b = checkoutModal.booking;
    const conLai = Math.max(0, b.tong_tien - b.tien_coc_da_tra - checkoutModal.discount);

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
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-xs">
                  AD
                </div>
                <div>
                  <div className={`text-xs font-black ${isDarkMode ? 'text-white' : 'text-[#0f172a]'}`}>Admin Quản Trị</div>
                  <div className="text-[10px] text-slate-500 font-mono">admin@soccer247.vn</div>
                </div>
              </div>
              <button
                onClick={() => setToastMessage({ type: 'info', message: 'Đăng xuất hệ thống quản trị thành công!' })}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${isDarkMode ? 'text-rose-400 hover:bg-rose-500/20' : 'text-rose-600 hover:bg-rose-100'}`}
                title="Đăng xuất"
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
                {activeTab === 'TIMELINE_GRID' && 'Sơ Đồ Sân (Thời Gian Thực)'}
                {activeTab === 'SAN_BONG' && 'Danh Sách Sân Bóng (Bảng San_Bong)'}
                {activeTab === 'LOAI_SAN_GIA' && 'Loại Sân & Bảng Giá Khung Giờ (Loai_San, Khung_Gio_Gia)'}
                {activeTab === 'DON_DAT_SAN' && 'Quản Lý Đặt Sân (Bảng Don_Dat_San)'}
                {activeTab === 'POS_ORDER' && 'Quầy Bán Hàng POS (Bảng Chi_Tiet_Dich_Vu)'}
                {activeTab === 'DICH_VU' && 'Danh Mục Dịch Vụ & Kho Nước (Bảng Dich_Vu)'}
                {activeTab === 'PHIEU_NHAP_KHO' && 'Quản Lý Nhập Kho (Bảng Phieu_Nhap_Kho)'}
                {activeTab === 'THANH_TOAN' && 'Lịch Sử Thanh Toán (Bảng Thanh_Toan)'}
                {activeTab === 'HOAN_TIEN' && 'Quản Lý Hủy Sân & Hoàn Tiền (Bảng Lich_Su_Hoan_Tien)'}
                {activeTab === 'NGUOI_DUNG' && 'Danh Sách Người Dùng (Bảng Nguoi_Dung)'}
                {activeTab === 'VAI_TRO' && 'Phân Quyền & Vai Trò (Bảng Vai_Tro)'}
              </h2>
            </div>

            <div className="flex items-center gap-2.5">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-black ${isDarkMode ? 'bg-[#0e2116] border-emerald-800/40 text-emerald-200' : 'bg-white border-slate-300 text-[#0f172a]'}`}>
                <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    const calcs = recalculateBookingPrice(bookingForm.ma_san, e.target.value, bookingForm.gio_bat_dau, bookingForm.gio_ket_thuc);
                    setBookingForm({ ...bookingForm, ngay_da: e.target.value, ...calcs });
                  }}
                  className={`bg-transparent font-bold focus:outline-none cursor-pointer ${isDarkMode ? 'text-white' : 'text-[#0f172a]'}`}
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
                      <span className="text-emerald-900 dark:text-emerald-300 font-black bg-emerald-100 dark:bg-emerald-500/20 px-2 py-0.5 rounded mr-1">Đã cọc: {bookingList.filter(b => b.tien_coc_da_tra > 0).length}</span> đang hoạt động
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

                {/* Danh sách 11 Bảng CSDL Quick Navigator */}
                <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-[#0a150e] border-emerald-900/40 text-white' : 'bg-white border-slate-300 shadow-md text-[#0f172a]'}`}>
                  <h3 className="text-base font-black flex items-center gap-2 mb-3">
                    <FolderTree className="w-5 h-5 text-emerald-600" />
                    Bản Đồ 11 Bảng Cơ Sở Dữ Liệu SQL Server
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {[
                      { tab: 'SAN_BONG', name: 'San_Bong', count: courtList.length, label: 'Sân Bóng' },
                      { tab: 'LOAI_SAN_GIA', name: 'Loai_San', count: categoryList.length, label: 'Loại Sân' },
                      { tab: 'LOAI_SAN_GIA', name: 'Khung_Gio_Gia', count: priceList.length, label: 'Bảng Giá' },
                      { tab: 'DON_DAT_SAN', name: 'Don_Dat_San', count: bookingList.length, label: 'Đơn Đặt Sân' },
                      { tab: 'POS_ORDER', name: 'Chi_Tiet_Dich_Vu', count: serviceDetailList.length, label: 'Chi Tiết Dịch Vụ' },
                      { tab: 'DICH_VU', name: 'Dich_Vu', count: serviceList.length, label: 'Danh Mục Dịch Vụ' },
                      { tab: 'PHIEU_NHAP_KHO', name: 'Phieu_Nhap_Kho', count: inventoryList.length, label: 'Phiếu Nhập Kho' },
                      { tab: 'THANH_TOAN', name: 'Thanh_Toan', count: paymentList.length, label: 'Thanh Toán' },
                      { tab: 'HOAN_TIEN', name: 'Lich_Su_Hoan_Tien', count: refundList.length, label: 'Hoàn Tiền' },
                      { tab: 'NGUOI_DUNG', name: 'Nguoi_Dung', count: userList.length, label: 'Người Dùng' },
                      { tab: 'VAI_TRO', name: 'Vai_Tro', count: roleList.length, label: 'Vai Trò' }
                    ].map((tbl, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveTab(tbl.tab as TabType)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all hover:scale-102 flex items-center justify-between ${
                          isDarkMode ? 'bg-[#0f2416] border-emerald-900/60 hover:bg-emerald-900/40' : 'bg-slate-50 border-slate-200 hover:bg-emerald-50 hover:border-emerald-300'
                        }`}
                      >
                        <div>
                          <div className="font-mono text-xs font-black text-emerald-700 dark:text-emerald-400">{tbl.name}</div>
                          <div className="text-[11px] font-bold text-slate-500">{tbl.label}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-mono font-black text-xs">
                          {tbl.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* =================================================================
                TAB 2: SƠ ĐỒ SÂN (ĐỔI TÊN THEO YÊU CẦU)
                ================================================================= */}
            {activeTab === 'TIMELINE_GRID' && (
              <div className={`rounded-2xl border overflow-hidden shadow-xl ${isDarkMode ? 'bg-[#0a150e] border-emerald-900/40 text-white' : 'bg-white border-slate-300 shadow-md text-[#0f172a]'}`}>
                <div className={`p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b ${isDarkMode ? 'border-emerald-900/40 bg-[#0e2116]' : 'border-slate-200 bg-slate-50'}`}>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-[#0f172a] dark:text-white flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      Sơ Đồ Sân Bóng Thời Gian Thực (Ngày: {selectedDate})
                    </h3>
                    <p className="text-xs font-bold text-[#334155] dark:text-slate-300 mt-1">
                      Theo dõi trực tiếp sơ đồ sân, tình trạng đặt sân, duyệt cọc và check-out trả sân
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">🟢 Sân Trống</span>
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">🟡 Chờ Duyệt Cọc</span>
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300">🔴 Đang Đá</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className={`border-b font-black uppercase text-xs tracking-wider ${isDarkMode ? 'bg-[#060e09] text-emerald-300 border-emerald-900/50' : 'bg-slate-100 text-[#0f172a] border-slate-300'}`}>
                        <th className="p-4 w-48">TÊN SÂN BÓNG</th>
                        {TIME_SLOTS.map((slot, idx) => (
                          <th key={idx} className="p-4 text-center">
                            <div>{slot.start} - {slot.end}</div>
                            {slot.isGold && <span className="text-[10px] text-amber-500 font-black">🔥 GIỜ VÀNG</span>}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-emerald-900/30 text-xs">
                      {courtList.map((court) => (
                        <tr key={court.id} className={isDarkMode ? 'hover:bg-emerald-950/20' : 'hover:bg-emerald-50/50'}>
                          <td className="p-4 font-black">
                            <div className="text-[#0f172a] dark:text-white flex items-center gap-1.5">
                              <span>⚽</span> {court.ten_san}
                            </div>
                            <span className="text-[10px] text-slate-400 font-normal">{court.ten_loai}</span>
                          </td>
                          {TIME_SLOTS.map((slot, sIdx) => {
                            const matched = bookingList.find(b => b.ma_san === court.id && b.ngay_da === selectedDate && b.gio_bat_dau <= slot.start && b.gio_ket_thuc >= slot.end);
                            return (
                              <td key={sIdx} className="p-2 text-center">
                                {!matched ? (
                                  <button
                                    onClick={() => {
                                      const calcs = recalculateBookingPrice(court.id, selectedDate, slot.start, slot.end);
                                      setBookingForm({ ...bookingForm, ma_san: court.id, ngay_da: selectedDate, gio_bat_dau: slot.start, gio_ket_thuc: slot.end, ...calcs });
                                      setActiveTab('DON_DAT_SAN');
                                    }}
                                    className="w-full py-2.5 px-2 rounded-xl border border-dashed border-emerald-400 text-emerald-700 dark:text-emerald-300 font-bold hover:bg-emerald-500 hover:text-white transition-all cursor-pointer text-xs"
                                  >
                                    + Đặt Nhanh
                                  </button>
                                ) : (
                                  <div className={`p-2 rounded-xl text-xs font-black shadow ${matched.trang_thai === 'DA_CHOT' ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'}`}>
                                    <div className="truncate">{matched.ten_khach_hang}</div>
                                    <div className="text-[10px] opacity-90">{matched.so_phut_da ? `${matched.so_phut_da} phút` : `${matched.gio_bat_dau}-${matched.gio_ket_thuc}`}</div>
                                    <div className="mt-1 flex gap-1 justify-center">
                                      <button onClick={() => setMiniPosModal({ isOpen: true, booking: matched, maDichVuChon: 1, soLuong: 1 })} className="px-1.5 py-0.5 rounded bg-white/20 hover:bg-white/30 text-[10px] cursor-pointer">+Nước</button>
                                      <button onClick={() => setCheckoutModal({ isOpen: true, booking: matched, paymentMethod: 'TIEN_MAT', discount: 0 })} className="px-1.5 py-0.5 rounded bg-rose-700 hover:bg-rose-800 text-[10px] cursor-pointer">Trả Sân</button>
                                    </div>
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* =================================================================
                TAB 3: BẢNG 1 - SAN_BONG (CÓ ĐẦY ĐỦ THÊM - SỬA - XÓA DẠNG MODAL)
                ================================================================= */}
            {activeTab === 'SAN_BONG' && (
              <div className={`rounded-2xl border overflow-hidden shadow-xl ${isDarkMode ? 'bg-[#0a150e] border-emerald-900/40 text-white' : 'bg-white border-slate-300 shadow-md text-[#0f172a]'}`}>
                <div className={`p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b ${isDarkMode ? 'border-emerald-900/40 bg-[#0e2116]' : 'border-slate-200 bg-slate-50'}`}>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-[#0f172a] dark:text-white flex items-center gap-2">
                      <Layers className="w-5 h-5 text-emerald-600" />
                      Danh Sách Sân Bóng (Bảng San_Bong)
                    </h3>
                    <p className="text-xs font-bold text-slate-500 mt-1">Thao tác Thêm, Sửa, Xóa sân bóng dạng Modal tương tác</p>
                  </div>
                  <button onClick={() => setCourtModal({ isOpen: true, mode: 'ADD', data: { ma_loai_san: 1, trang_thai: 'SAN_SANG' } })} className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center gap-1.5 cursor-pointer">
                    <Plus className="w-4 h-4 stroke-[3]" /> Thêm Sân Mới
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className={`border-b font-black uppercase ${isDarkMode ? 'bg-[#060e09] text-emerald-300' : 'bg-slate-100 text-[#0f172a]'}`}>
                        <th className="p-4 w-16">MÃ SÂN</th>
                        <th className="p-4">TÊN SÂN BÓNG</th>
                        <th className="p-4">LOẠI SÂN</th>
                        <th className="p-4">TRẠNG THÁI</th>
                        <th className="p-4 text-right">THAO TÁC</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-emerald-900/30">
                      {courtList.map((c) => (
                        <tr key={c.id} className={isDarkMode ? 'hover:bg-emerald-950/20' : 'hover:bg-emerald-50/50'}>
                          <td className="p-4 font-mono font-black text-emerald-700 dark:text-emerald-400">#{c.id}</td>
                          <td className="p-4 font-black text-sm text-[#0f172a] dark:text-white">⚽ {c.ten_san}</td>
                          <td className="p-4"><span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 font-bold">{c.ten_loai || 'Sân 5 người'}</span></td>
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
                TAB 4: BẢNG 2 & 3 - LOAI_SAN & KHUNG_GIO_GIA (CÓ ĐỦ THÊM SỬA XÓA)
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
                    </div>
                    <button onClick={() => setLoaiSanModal({ isOpen: true, mode: 'ADD', data: {} })} className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center gap-1.5 cursor-pointer">
                      <Plus className="w-4 h-4 stroke-[3]" /> Thêm Loại Sân
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className={`border-b font-black uppercase ${isDarkMode ? 'bg-[#060e09] text-emerald-300' : 'bg-slate-100 text-[#0f172a]'}`}>
                          <th className="p-4 w-16">MÃ LOẠI</th>
                          <th className="p-4">TÊN LOẠI SÂN</th>
                          <th className="p-4">MÔ TẢ CHI TIẾT</th>
                          <th className="p-4">GIÁ CƠ BẢN</th>
                          <th className="p-4 text-right">THAO TÁC</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-emerald-900/30">
                        {categoryList.map((l) => (
                          <tr key={l.id}>
                            <td className="p-4 font-mono font-black text-emerald-700">#{l.id}</td>
                            <td className="p-4 font-black text-sm">{l.ten_loai}</td>
                            <td className="p-4 text-slate-500">{l.mo_ta}</td>
                            <td className="p-4 font-black text-emerald-700">{Number(l.gia_co_ban).toLocaleString('vi-VN')} đ</td>
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

                {/* BẢNG KHUNG_GIO_GIA */}
                <div className={`rounded-2xl border overflow-hidden shadow-xl ${isDarkMode ? 'bg-[#0a150e] border-emerald-900/40 text-white' : 'bg-white border-slate-300 shadow-md text-[#0f172a]'}`}>
                  <div className={`p-5 flex items-center justify-between border-b ${isDarkMode ? 'border-emerald-900/40 bg-[#0e2116]' : 'border-slate-200 bg-slate-50'}`}>
                    <div>
                      <h3 className="text-base font-black flex items-center gap-2">
                        <Clock className="w-5 h-5 text-amber-500" /> Bảng 3: Khung_Gio_Gia (Bảng Giá Theo Giờ & Cuối Tuần)
                      </h3>
                    </div>
                    <button onClick={() => setPriceModal({ isOpen: true, mode: 'ADD', data: { ma_loai_san: 1, gio_bat_dau: '17:00', gio_ket_thuc: '21:00', la_cuoi_tuan: false, don_gia: 350000 } })} className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center gap-1.5 cursor-pointer">
                      <Plus className="w-4 h-4 stroke-[3]" /> Thêm Khung Giờ Giá
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className={`border-b font-black uppercase ${isDarkMode ? 'bg-[#060e09] text-emerald-300' : 'bg-slate-100 text-[#0f172a]'}`}>
                          <th className="p-4 w-16">MÃ GIÁ</th>
                          <th className="p-4">LOẠI SÂN</th>
                          <th className="p-4">KHUNG GIỜ</th>
                          <th className="p-4">ÁP DỤNG</th>
                          <th className="p-4">ĐƠN GIÁ / GIỜ</th>
                          <th className="p-4 text-right">THAO TÁC</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-emerald-900/30">
                        {priceList.map((p) => (
                          <tr key={p.id}>
                            <td className="p-4 font-mono font-black text-emerald-700">#{p.id}</td>
                            <td className="p-4 font-black">{p.ten_loai || 'Sân 5 người'}</td>
                            <td className="p-4 font-mono font-bold">{p.gio_bat_dau} - {p.gio_ket_thuc}</td>
                            <td className="p-4">
                              {p.la_cuoi_tuan ? (
                                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">Cuối Tuần (T7/CN)</span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold">Ngày Thường</span>
                              )}
                            </td>
                            <td className="p-4 font-black text-emerald-700">{Number(p.don_gia).toLocaleString('vi-VN')} đ</td>
                            <td className="p-4 text-right space-x-2">
                              <button onClick={() => setPriceModal({ isOpen: true, mode: 'EDIT', data: p })} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer font-bold inline-flex items-center gap-1"><Edit2 className="w-3.5 h-3.5" /> Sửa</button>
                              <button onClick={() => handleDeletePrice(p.id)} className="p-2 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 cursor-pointer font-bold inline-flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> Xóa</button>
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
                TAB 5: BẢNG 4 - DON_DAT_SAN (ĐẶT SÂN & TÍNH GIỜ THEO PHÚT)
                ================================================================= */}
            {activeTab === 'DON_DAT_SAN' && (
              <div className="space-y-6 animate-fade-in">
                {/* 1. KHU VỰC TÍNH TOÁN VÀ ĐẶT SÂN THEO PHÚT */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Form đặt sân */}
                  <div className={`lg:col-span-7 p-6 rounded-2xl border shadow-xl ${isDarkMode ? 'bg-[#0a150e] border-emerald-900/40 text-white' : 'bg-white border-slate-300 shadow-md text-[#0f172a]'}`}>
                    <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-emerald-900/40 mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500">
                          <Flame className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-black text-[#0f172a] dark:text-white">Đặt Sân & Tính Giờ Linh Hoạt</h3>
                          <p className="text-xs text-slate-500 font-bold">Lưu trực tiếp vào bảng Don_Dat_San</p>
                        </div>
                      </div>
                    </div>

                    <form onSubmit={handleSaveBooking} className="space-y-4 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block font-black uppercase mb-1">Chọn Sân Bóng *</label>
                          <select
                            value={bookingForm.ma_san}
                            onChange={(e) => {
                              const newSan = Number(e.target.value);
                              const calcs = recalculateBookingPrice(newSan, bookingForm.ngay_da, bookingForm.gio_bat_dau, bookingForm.gio_ket_thuc);
                              setBookingForm({ ...bookingForm, ma_san: newSan, ...calcs });
                            }}
                            className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                          >
                            {courtList.map((c) => (
                              <option key={c.id} value={c.id} className="bg-slate-900 text-white">{c.ten_san} ({c.ten_loai})</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block font-black uppercase mb-1">Ngày Đá *</label>
                          <input
                            type="date"
                            value={bookingForm.ngay_da}
                            onChange={(e) => {
                              const newNgay = e.target.value;
                              const calcs = recalculateBookingPrice(bookingForm.ma_san, newNgay, bookingForm.gio_bat_dau, bookingForm.gio_ket_thuc);
                              setBookingForm({ ...bookingForm, ngay_da: newNgay, ...calcs });
                            }}
                            className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block font-black uppercase mb-1">Giờ Vào Sân (hh:mm) *</label>
                          <input
                            type="time"
                            value={bookingForm.gio_bat_dau}
                            onChange={(e) => {
                              const newBat = e.target.value;
                              const calcs = recalculateBookingPrice(bookingForm.ma_san, bookingForm.ngay_da, newBat, bookingForm.gio_ket_thuc);
                              setBookingForm({ ...bookingForm, gio_bat_dau: newBat, ...calcs });
                            }}
                            className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                          />
                        </div>
                        <div>
                          <label className="block font-black uppercase mb-1">Giờ Ra Sân (hh:mm) *</label>
                          <input
                            type="time"
                            value={bookingForm.gio_ket_thuc}
                            onChange={(e) => {
                              const newKet = e.target.value;
                              const calcs = recalculateBookingPrice(bookingForm.ma_san, bookingForm.ngay_da, bookingForm.gio_bat_dau, newKet);
                              setBookingForm({ ...bookingForm, gio_ket_thuc: newKet, ...calcs });
                            }}
                            className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                          />
                        </div>
                      </div>

                      {/* Quick Chips 85 phút chuẩn mẫu */}
                      <div className="flex flex-wrap gap-2">
                        {[
                          { label: '30 phút', mins: 30 },
                          { label: '60 phút', mins: 60 },
                          { label: '⭐ 85 phút (Chuẩn mẫu)', mins: 85, start: '17:15', end: '18:40' },
                          { label: '90 phút', mins: 90 },
                          { label: '120 phút', mins: 120 }
                        ].map((chip, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              let newBat = chip.start || bookingForm.gio_bat_dau || '17:15';
                              let newKet = chip.end;
                              if (!newKet) {
                                const [h, m] = newBat.split(':').map(Number);
                                const totalEndM = h * 60 + m + chip.mins;
                                newKet = `${String(Math.floor(totalEndM / 60) % 24).padStart(2, '0')}:${String(totalEndM % 60).padStart(2, '0')}`;
                              }
                              const calcs = recalculateBookingPrice(bookingForm.ma_san, bookingForm.ngay_da, newBat, newKet);
                              setBookingForm({ ...bookingForm, gio_bat_dau: newBat, gio_ket_thuc: newKet, ...calcs });
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                              bookingForm.so_phut === chip.mins ? 'bg-amber-500 text-white border-amber-600 shadow' : 'bg-slate-100 text-slate-800 hover:bg-emerald-50'
                            }`}
                          >
                            {chip.label}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block font-black uppercase mb-1">Tên Khách Hàng</label>
                          <input
                            type="text"
                            value={bookingForm.ten_khach_hang}
                            onChange={(e) => setBookingForm({ ...bookingForm, ten_khach_hang: e.target.value })}
                            className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                          />
                        </div>
                        <div>
                          <label className="block font-black uppercase mb-1">Số Điện Thoại</label>
                          <input
                            type="text"
                            value={bookingForm.so_dien_thoai}
                            onChange={(e) => setBookingForm({ ...bookingForm, so_dien_thoai: e.target.value })}
                            className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block font-black uppercase mb-1">Tiền Cọc Trước (VNĐ)</label>
                          <input
                            type="number"
                            value={bookingForm.tien_coc}
                            onChange={(e) => setBookingForm({ ...bookingForm, tien_coc: Number(e.target.value) })}
                            className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                          />
                        </div>
                        <div>
                          <label className="block font-black uppercase mb-1">Ghi Chú</label>
                          <input
                            type="text"
                            value={bookingForm.ghi_chu}
                            onChange={(e) => setBookingForm({ ...bookingForm, ghi_chu: e.target.value })}
                            className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <button
                          type="button"
                          onClick={(e) => { bookingForm.isRealtimeCheckin = true; handleSaveBooking(e); }}
                          className="py-3 px-4 rounded-xl font-black text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Clock className="w-4 h-4" /> Bấm Giờ Ngay (Realtime)
                        </button>
                        <button
                          type="submit"
                          onClick={() => { bookingForm.isRealtimeCheckin = false; }}
                          className="py-3 px-4 rounded-xl font-black text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Check className="w-4 h-4 stroke-[3]" /> Xác Nhận Đặt Sân
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Thẻ công thức tự động theo phút */}
                  <div className="lg:col-span-5 space-y-4">
                    <div className={`p-6 rounded-2xl border shadow-xl ${isDarkMode ? 'bg-[#0c1c12] border-emerald-500/40 text-white' : 'bg-gradient-to-br from-emerald-50 via-white to-green-50 border-emerald-300 text-[#0f172a]'}`}>
                      <h4 className="text-sm font-black uppercase tracking-tight text-emerald-800 dark:text-emerald-300 pb-2 border-b border-emerald-300 mb-3 flex items-center gap-2">
                        <span>🧮</span> Ví dụ thực tế & Công thức tự động
                      </h4>
                      <div className="space-y-3 text-xs">
                        <div>
                          <span className="font-bold">Đơn giá khung giờ:</span>
                          <div className="p-2 rounded bg-emerald-100 dark:bg-emerald-950 font-black text-emerald-900 dark:text-emerald-200 mt-1">
                            {bookingForm.don_gia_gio.toLocaleString('vi-VN')} đ / giờ (≈ {bookingForm.don_gia_phut.toLocaleString('vi-VN')} đ / phút)
                          </div>
                        </div>
                        <div>
                          <span className="font-bold">Tổng thời gian đá:</span>
                          <div className="p-2 rounded bg-amber-100 text-amber-900 font-black mt-1">
                            {bookingForm.gio_bat_dau} đến {bookingForm.gio_ket_thuc} = {bookingForm.so_phut} phút
                          </div>
                        </div>
                        <div className="pt-2 border-t border-emerald-200">
                          <span className="font-black uppercase text-emerald-800">Công thức tiền sân:</span>
                          <div className="p-3 rounded bg-white dark:bg-black font-mono font-black text-center text-emerald-700 dark:text-emerald-400 mt-1">
                            ({bookingForm.so_phut} × {bookingForm.don_gia_gio.toLocaleString('vi-VN')}) / 60
                          </div>
                          <div className="p-3 rounded-xl bg-emerald-700 text-white font-black text-base flex justify-between items-center mt-2 shadow">
                            <span>LÀM TRÒN:</span>
                            <span>{bookingForm.tien_san.toLocaleString('vi-VN')} đ</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. BẢNG DANH SÁCH ĐƠN ĐẶT SÂN (DON_DAT_SAN) */}
                <div className={`rounded-2xl border overflow-hidden shadow-xl ${isDarkMode ? 'bg-[#0a150e] border-emerald-900/40 text-white' : 'bg-white border-slate-300 shadow-md text-[#0f172a]'}`}>
                  <div className={`p-5 flex items-center justify-between border-b ${isDarkMode ? 'border-emerald-900/40 bg-[#0e2116]' : 'border-slate-200 bg-slate-50'}`}>
                    <h3 className="text-base font-black flex items-center gap-2">
                      <Flame className="w-5 h-5 text-amber-500" /> Bảng 4: Don_Dat_San (Toàn Bộ Đơn Đặt Sân)
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className={`border-b font-black uppercase ${isDarkMode ? 'bg-[#060e09] text-emerald-300' : 'bg-slate-100 text-[#0f172a]'}`}>
                          <th className="p-4 w-16">MÃ</th>
                          <th className="p-4">KHÁCH HÀNG</th>
                          <th className="p-4">SÂN BÓNG</th>
                          <th className="p-4">KHUNG GIỜ</th>
                          <th className="p-4">SỐ PHÚT</th>
                          <th className="p-4">TIỀN SÂN</th>
                          <th className="p-4">TỔNG TIỀN</th>
                          <th className="p-4">TRẠNG THÁI</th>
                          <th className="p-4 text-right">THAO TÁC</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-emerald-900/30">
                        {bookingList.map((b) => (
                          <tr key={b.id}>
                            <td className="p-4 font-mono font-black text-emerald-700">#{b.id}</td>
                            <td className="p-4 font-black">{b.ten_khach_hang}<div className="text-[10px] text-slate-500 font-normal">📞 {b.so_dien_thoai}</div></td>
                            <td className="p-4 font-bold text-emerald-800 dark:text-emerald-300">⚽ {b.ten_san}</td>
                            <td className="p-4 font-mono">{b.gio_bat_dau} - {b.gio_ket_thuc}</td>
                            <td className="p-4"><span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-black">{b.so_phut_da || 85}p</span></td>
                            <td className="p-4 font-bold text-emerald-700">{Number(b.tien_san).toLocaleString('vi-VN')} đ</td>
                            <td className="p-4 font-black">{Number(b.tong_tien).toLocaleString('vi-VN')} đ</td>
                            <td className="p-4">
                              {b.trang_thai === 'DA_CHOT' && <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black">Đang Đá</span>}
                              {b.trang_thai === 'CHO_XAC_NHAN' && <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-black">Chờ Cọc</span>}
                              {b.trang_thai === 'HOAN_THANH' && <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-black">Hoàn Tất</span>}
                            </td>
                            <td className="p-4 text-right space-x-1.5">
                              <button onClick={() => setMiniPosModal({ isOpen: true, booking: b, maDichVuChon: 1, soLuong: 1 })} className="p-1.5 rounded bg-emerald-100 text-emerald-800 cursor-pointer font-bold" title="Bán nước">+Nước</button>
                              {b.trang_thai !== 'HOAN_THANH' && (
                                <button onClick={() => setCheckoutModal({ isOpen: true, booking: b, paymentMethod: 'TIEN_MAT', discount: 0 })} className="px-2.5 py-1 rounded bg-rose-600 text-white font-black cursor-pointer text-xs">Trả Sân</button>
                              )}
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
                TAB 6: BẢNG 5 - CHI_TIET_DICH_VU (QUẦY BÁN HÀNG POS)
                ================================================================= */}
            {activeTab === 'POS_ORDER' && (
              <div className={`rounded-2xl border overflow-hidden shadow-xl ${isDarkMode ? 'bg-[#0a150e] border-emerald-900/40 text-white' : 'bg-white border-slate-300 shadow-md text-[#0f172a]'}`}>
                <div className={`p-5 flex items-center justify-between border-b ${isDarkMode ? 'border-emerald-900/40 bg-[#0e2116]' : 'border-slate-200 bg-slate-50'}`}>
                  <div>
                    <h3 className="text-base font-black flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-emerald-600" /> Bảng 5: Chi_Tiet_Dich_Vu (Quầy Bán Hàng POS)
                    </h3>
                    <p className="text-xs text-slate-500 font-bold mt-1">Lịch sử xuất bán nước giải khát & dịch vụ cho các sân</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className={`border-b font-black uppercase ${isDarkMode ? 'bg-[#060e09] text-emerald-300' : 'bg-slate-100 text-[#0f172a]'}`}>
                        <th className="p-4 w-16">MÃ CT</th>
                        <th className="p-4">MÃ ĐƠN</th>
                        <th className="p-4">KHÁCH HÀNG</th>
                        <th className="p-4">SÂN BÓNG</th>
                        <th className="p-4">TÊN MẶT HÀNG</th>
                        <th className="p-4">SỐ LƯỢNG</th>
                        <th className="p-4">ĐƠN GIÁ BÁN</th>
                        <th className="p-4">THÀNH TIỀN</th>
                        <th className="p-4 text-right">THAO TÁC</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-emerald-900/30">
                      {serviceDetailList.map((ct) => (
                        <tr key={ct.id}>
                          <td className="p-4 font-mono font-black text-emerald-700">#{ct.id}</td>
                          <td className="p-4 font-mono font-bold">#{ct.ma_don_dat}</td>
                          <td className="p-4 font-black">{ct.ten_khach_hang || 'Khách vãng lai'}</td>
                          <td className="p-4 text-emerald-700 font-bold">{ct.ten_san || 'Sân 5A'}</td>
                          <td className="p-4 font-black">🥤 {ct.ten_dich_vu}</td>
                          <td className="p-4 font-bold">{ct.so_luong} {ct.don_vi_tinh}</td>
                          <td className="p-4">{Number(ct.gia_luc_ban).toLocaleString('vi-VN')} đ</td>
                          <td className="p-4 font-black text-emerald-700">{Number(ct.thanh_tien).toLocaleString('vi-VN')} đ</td>
                          <td className="p-4 text-right">
                            <button onClick={() => handleDeleteServiceDetail(ct.id)} className="p-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 cursor-pointer font-bold inline-flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> Xóa</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                        <th className="p-4 w-16">MÃ</th>
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
                          <td className="p-4 font-mono font-black text-emerald-700">#{s.id}</td>
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
                        <th className="p-4 w-16">MÃ PHIẾU</th>
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
                          <td className="p-4 font-mono font-black text-emerald-700">#{p.id}</td>
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
                TAB 9: BẢNG 8 - THANH_TOAN (CÓ ĐỦ THÊM SỬA XÓA)
                ================================================================= */}
            {activeTab === 'THANH_TOAN' && (
              <div className={`rounded-2xl border overflow-hidden shadow-xl ${isDarkMode ? 'bg-[#0a150e] border-emerald-900/40 text-white' : 'bg-white border-slate-300 shadow-md text-[#0f172a]'}`}>
                <div className={`p-5 flex items-center justify-between border-b ${isDarkMode ? 'border-emerald-900/40 bg-[#0e2116]' : 'border-slate-200 bg-slate-50'}`}>
                  <div>
                    <h3 className="text-base font-black flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-emerald-600" /> Bảng 8: Thanh_Toan (Lịch Sử Giao Dịch)
                    </h3>
                  </div>
                  <button onClick={() => setPaymentModal({ isOpen: true, mode: 'ADD', data: { ma_don_dat: 101, so_tien: 200000, phuong_thuc: 'TIEN_MAT', loai_thanh_toan: 'DAT_COC' } })} className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center gap-1.5 cursor-pointer">
                    <Plus className="w-4 h-4 stroke-[3]" /> Thêm Giao Dịch
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className={`border-b font-black uppercase ${isDarkMode ? 'bg-[#060e09] text-emerald-300' : 'bg-slate-100 text-[#0f172a]'}`}>
                        <th className="p-4 w-16">MÃ GD</th>
                        <th className="p-4">MÃ ĐƠN</th>
                        <th className="p-4">KHÁCH HÀNG</th>
                        <th className="p-4">SỐ TIỀN</th>
                        <th className="p-4">PHƯƠNG THỨC</th>
                        <th className="p-4">LOẠI GD</th>
                        <th className="p-4">MÃ GIAO DỊCH</th>
                        <th className="p-4">NGÀY GD</th>
                        <th className="p-4 text-right">THAO TÁC</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-emerald-900/30">
                      {paymentList.map((t) => (
                        <tr key={t.id}>
                          <td className="p-4 font-mono font-black text-emerald-700">#{t.id}</td>
                          <td className="p-4 font-mono font-bold">#{t.ma_don_dat}</td>
                          <td className="p-4 font-black">{t.ten_khach_hang}</td>
                          <td className="p-4 font-black text-emerald-700">{Number(t.so_tien).toLocaleString('vi-VN')} đ</td>
                          <td className="p-4"><span className="px-2 py-0.5 rounded font-black bg-emerald-100 text-emerald-800">{t.phuong_thuc}</span></td>
                          <td className="p-4">{t.loai_thanh_toan === 'DAT_COC' ? 'Cọc Sân' : 'Thanh Toán Hết'}</td>
                          <td className="p-4 font-mono text-[11px] text-slate-500">{t.ma_giao_dich}</td>
                          <td className="p-4 font-mono text-slate-500">{t.ngay_thanh_toan}</td>
                          <td className="p-4 text-right space-x-2">
                            <button onClick={() => setPaymentModal({ isOpen: true, mode: 'EDIT', data: t })} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer font-bold inline-flex items-center gap-1"><Edit2 className="w-3.5 h-3.5" /> Sửa</button>
                            <button onClick={() => handleDeletePayment(t.id)} className="p-2 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 cursor-pointer font-bold inline-flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> Xóa</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* =================================================================
                TAB 10: BẢNG 9 - LICH_SU_HOAN_TIEN (CÓ ĐỦ THÊM SỬA XÓA)
                ================================================================= */}
            {activeTab === 'HOAN_TIEN' && (
              <div className={`rounded-2xl border overflow-hidden shadow-xl ${isDarkMode ? 'bg-[#0a150e] border-emerald-900/40 text-white' : 'bg-white border-slate-300 shadow-md text-[#0f172a]'}`}>
                <div className={`p-5 flex items-center justify-between border-b ${isDarkMode ? 'border-emerald-900/40 bg-[#0e2116]' : 'border-slate-200 bg-slate-50'}`}>
                  <div>
                    <h3 className="text-base font-black flex items-center gap-2">
                      <RefreshCw className="w-5 h-5 text-rose-500" /> Bảng 9: Lich_Su_Hoan_Tien (Hủy Sân & Hoàn Cọc)
                    </h3>
                  </div>
                  <button onClick={() => setRefundModal({ isOpen: true, mode: 'ADD', data: { ma_don_dat: 101, so_tien_hoan: 150000, ty_le_hoan: 100, ly_do_huy: 'Báo hủy trước 24h' } })} className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center gap-1.5 cursor-pointer">
                    <Plus className="w-4 h-4 stroke-[3]" /> Thêm Phiếu Hoàn
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className={`border-b font-black uppercase ${isDarkMode ? 'bg-[#060e09] text-emerald-300' : 'bg-slate-100 text-[#0f172a]'}`}>
                        <th className="p-4 w-16">MÃ HOÀN</th>
                        <th className="p-4">MÃ ĐƠN</th>
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
                        <tr key={h.id}>
                          <td className="p-4 font-mono font-black text-rose-600">#{h.id}</td>
                          <td className="p-4 font-mono font-bold">#{h.ma_don_dat}</td>
                          <td className="p-4 font-black">{h.ten_khach_hang}</td>
                          <td className="p-4 font-black text-rose-600">{Number(h.so_tien_hoan).toLocaleString('vi-VN')} đ</td>
                          <td className="p-4 font-bold">{h.ty_le_hoan}%</td>
                          <td className="p-4 text-slate-600 dark:text-slate-300">{h.ly_do_huy}</td>
                          <td className="p-4 font-mono text-slate-500">{h.ngay_hoan}</td>
                          <td className="p-4 text-right space-x-2">
                            <button onClick={() => setRefundModal({ isOpen: true, mode: 'EDIT', data: h })} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer font-bold inline-flex items-center gap-1"><Edit2 className="w-3.5 h-3.5" /> Sửa</button>
                            <button onClick={() => handleDeleteRefund(h.id)} className="p-2 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 cursor-pointer font-bold inline-flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> Xóa</button>
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
            {activeTab === 'NGUOI_DUNG' && (
              <div className={`rounded-2xl border overflow-hidden shadow-xl ${isDarkMode ? 'bg-[#0a150e] border-emerald-900/40 text-white' : 'bg-white border-slate-300 shadow-md text-[#0f172a]'}`}>
                <div className={`p-5 flex items-center justify-between border-b ${isDarkMode ? 'border-emerald-900/40 bg-[#0e2116]' : 'border-slate-200 bg-slate-50'}`}>
                  <div>
                    <h3 className="text-base font-black flex items-center gap-2">
                      <User className="w-5 h-5 text-emerald-600" /> Bảng 10: Nguoi_Dung (Tài Khoản Hệ Thống)
                    </h3>
                  </div>
                  <button onClick={() => setUserModal({ isOpen: true, mode: 'ADD', data: { vai_tro: 'KHACH_HANG' } })} className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center gap-1.5 cursor-pointer">
                    <Plus className="w-4 h-4 stroke-[3]" /> Thêm Tài Khoản
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className={`border-b font-black uppercase ${isDarkMode ? 'bg-[#060e09] text-emerald-300' : 'bg-slate-100 text-[#0f172a]'}`}>
                        <th className="p-4 w-16">MÃ</th>
                        <th className="p-4">HỌ VÀ TÊN</th>
                        <th className="p-4">EMAIL</th>
                        <th className="p-4">SỐ ĐIỆN THOẠI</th>
                        <th className="p-4">VAI TRÒ</th>
                        <th className="p-4 text-right">THAO TÁC</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-emerald-900/30">
                      {userList.map((u) => (
                        <tr key={u.id}>
                          <td className="p-4 font-mono font-black text-emerald-700">#{u.id}</td>
                          <td className="p-4 font-black text-sm">👤 {u.ho_ten}</td>
                          <td className="p-4 font-mono text-slate-500">{u.email}</td>
                          <td className="p-4 font-bold">{u.so_dien_thoai}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full font-black text-[11px] ${
                              u.vai_tro === 'ADMIN' ? 'bg-purple-100 text-purple-900' : u.vai_tro === 'NHAN_VIEN' ? 'bg-blue-100 text-blue-900' : 'bg-slate-100 text-slate-800'
                            }`}>
                              {u.vai_tro}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <button onClick={() => setUserModal({ isOpen: true, mode: 'EDIT', data: u })} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer font-bold inline-flex items-center gap-1"><Edit2 className="w-3.5 h-3.5" /> Sửa</button>
                            <button onClick={() => handleDeleteUser(u.id)} className="p-2 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 cursor-pointer font-bold inline-flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> Xóa</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                        <th className="p-4 w-20">MÃ VAI TRÒ</th>
                        <th className="p-4">TÊN VAI TRÒ</th>
                        <th className="p-4">MÔ TẢ QUYỀN HẠN</th>
                        <th className="p-4 text-right">THAO TÁC</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-emerald-900/30">
                      {roleList.map((r) => (
                        <tr key={r.MaVaiTro}>
                          <td className="p-4 font-mono font-black text-emerald-700">#{r.MaVaiTro}</td>
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
                  value={loaiSanModal.data.ten_loai || ''}
                  onChange={(e) => setLoaiSanModal({ ...loaiSanModal, data: { ...loaiSanModal.data, ten_loai: e.target.value } })}
                  placeholder="Sân 11 người"
                  className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                />
              </div>
              <div>
                <label className="block font-black uppercase mb-1">Giá Cơ Bản (VNĐ) *</label>
                <input
                  type="number"
                  value={loaiSanModal.data.gia_co_ban || 250000}
                  onChange={(e) => setLoaiSanModal({ ...loaiSanModal, data: { ...loaiSanModal.data, gia_co_ban: Number(e.target.value) } })}
                  className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                />
              </div>
              <div>
                <label className="block font-black uppercase mb-1">Mô Tả</label>
                <input
                  type="text"
                  value={loaiSanModal.data.mo_ta || ''}
                  onChange={(e) => setLoaiSanModal({ ...loaiSanModal, data: { ...loaiSanModal.data, mo_ta: e.target.value } })}
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

      {/* 3. Modal Khung Giờ Giá (Khung_Gio_Gia) */}
      {priceModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl ${isDarkMode ? 'bg-[#0a150e] border-emerald-900/60 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}>
            <div className="flex items-center justify-between pb-3 border-b mb-4">
              <h3 className="font-black text-base">{priceModal.mode === 'ADD' ? '⏰ Thêm Khung Giờ Giá' : '✏️ Cập Nhật Khung Giờ Giá'}</h3>
              <button onClick={() => setPriceModal({ isOpen: false, mode: 'ADD', data: {} })}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSavePrice} className="space-y-4 text-xs">
              <div>
                <label className="block font-black uppercase mb-1">Loại Sân *</label>
                <select
                  value={priceModal.data.ma_loai_san || 1}
                  onChange={(e) => setPriceModal({ ...priceModal, data: { ...priceModal.data, ma_loai_san: Number(e.target.value) } })}
                  className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                >
                  {categoryList.map(l => (
                    <option key={l.id} value={l.id}>{l.ten_loai}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black uppercase mb-1">Giờ Bắt Đầu</label>
                  <input
                    type="time"
                    value={priceModal.data.gio_bat_dau || '06:00'}
                    onChange={(e) => setPriceModal({ ...priceModal, data: { ...priceModal.data, gio_bat_dau: e.target.value } })}
                    className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                  />
                </div>
                <div>
                  <label className="block font-black uppercase mb-1">Giờ Kết Thúc</label>
                  <input
                    type="time"
                    value={priceModal.data.gio_ket_thuc || '22:00'}
                    onChange={(e) => setPriceModal({ ...priceModal, data: { ...priceModal.data, gio_ket_thuc: e.target.value } })}
                    className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                  />
                </div>
              </div>
              <div>
                <label className="block font-black uppercase mb-1">Đơn Giá / Giờ (VNĐ) *</label>
                <input
                  type="number"
                  value={priceModal.data.don_gia || 350000}
                  onChange={(e) => setPriceModal({ ...priceModal, data: { ...priceModal.data, don_gia: Number(e.target.value) } })}
                  className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="la_cuoi_tuan"
                  checked={!!priceModal.data.la_cuoi_tuan}
                  onChange={(e) => setPriceModal({ ...priceModal, data: { ...priceModal.data, la_cuoi_tuan: e.target.checked } })}
                  className="w-4 h-4 cursor-pointer"
                />
                <label htmlFor="la_cuoi_tuan" className="font-bold cursor-pointer">Áp dụng giá cuối tuần (Thứ 7 / Chủ Nhật)</label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setPriceModal({ isOpen: false, mode: 'ADD', data: {} })} className="px-4 py-2 rounded-xl font-bold bg-slate-200 text-slate-800 cursor-pointer">Hủy</button>
                <button type="submit" className="px-5 py-2 rounded-xl font-black bg-emerald-600 text-white cursor-pointer">Lưu Bảng Giá</button>
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

      {/* 6. Modal Thanh Toán (Thanh_Toan) */}
      {paymentModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl ${isDarkMode ? 'bg-[#0a150e] border-emerald-900/60 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}>
            <div className="flex items-center justify-between pb-3 border-b mb-4">
              <h3 className="font-black text-base">{paymentModal.mode === 'ADD' ? '💳 Thêm Giao Dịch Thanh Toán' : '✏️ Cập Nhật Giao Dịch'}</h3>
              <button onClick={() => setPaymentModal({ isOpen: false, mode: 'ADD', data: {} })}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSavePayment} className="space-y-4 text-xs">
              <div>
                <label className="block font-black uppercase mb-1">Mã Đơn Đặt Sân</label>
                <input
                  type="number"
                  value={paymentModal.data.ma_don_dat || 101}
                  onChange={(e) => setPaymentModal({ ...paymentModal, data: { ...paymentModal.data, ma_don_dat: Number(e.target.value) } })}
                  className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                />
              </div>
              <div>
                <label className="block font-black uppercase mb-1">Số Tiền Thanh Toán (VNĐ) *</label>
                <input
                  type="number"
                  value={paymentModal.data.so_tien || 200000}
                  onChange={(e) => setPaymentModal({ ...paymentModal, data: { ...paymentModal.data, so_tien: Number(e.target.value) } })}
                  className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                />
              </div>
              <div>
                <label className="block font-black uppercase mb-1">Phương Thức Thanh Toán</label>
                <select
                  value={paymentModal.data.phuong_thuc || 'TIEN_MAT'}
                  onChange={(e) => setPaymentModal({ ...paymentModal, data: { ...paymentModal.data, phuong_thuc: e.target.value as any } })}
                  className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                >
                  <option value="TIEN_MAT">Tiền Mặt</option>
                  <option value="VNPAY">VNPay</option>
                  <option value="MOMO">MoMo</option>
                </select>
              </div>
              <div>
                <label className="block font-black uppercase mb-1">Loại Thanh Toán</label>
                <select
                  value={paymentModal.data.loai_thanh_toan || 'DAT_COC'}
                  onChange={(e) => setPaymentModal({ ...paymentModal, data: { ...paymentModal.data, loai_thanh_toan: e.target.value as any } })}
                  className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                >
                  <option value="DAT_COC">Đặt Cọc</option>
                  <option value="TRA_HET">Thanh Toán Hoàn Tất</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setPaymentModal({ isOpen: false, mode: 'ADD', data: {} })} className="px-4 py-2 rounded-xl font-bold bg-slate-200 text-slate-800 cursor-pointer">Hủy</button>
                <button type="submit" className="px-5 py-2 rounded-xl font-black bg-emerald-600 text-white cursor-pointer">Lưu Giao Dịch</button>
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
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl ${isDarkMode ? 'bg-[#0a150e] border-emerald-900/60 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}>
            <div className="flex items-center justify-between pb-3 border-b mb-4">
              <h3 className="font-black text-base">{userModal.mode === 'ADD' ? '👤 Thêm Tài Khoản Mới' : '✏️ Cập Nhật Tài Khoản'}</h3>
              <button onClick={() => setUserModal({ isOpen: false, mode: 'ADD', data: {} })}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-black uppercase mb-1">Họ Và Tên *</label>
                <input
                  type="text"
                  value={userModal.data.ho_ten || ''}
                  onChange={(e) => setUserModal({ ...userModal, data: { ...userModal.data, ho_ten: e.target.value } })}
                  className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                />
              </div>
              <div>
                <label className="block font-black uppercase mb-1">Email *</label>
                <input
                  type="email"
                  value={userModal.data.email || ''}
                  onChange={(e) => setUserModal({ ...userModal, data: { ...userModal.data, email: e.target.value } })}
                  className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                />
              </div>
              <div>
                <label className="block font-black uppercase mb-1">Số Điện Thoại</label>
                <input
                  type="text"
                  value={userModal.data.so_dien_thoai || ''}
                  onChange={(e) => setUserModal({ ...userModal, data: { ...userModal.data, so_dien_thoai: e.target.value } })}
                  className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                />
              </div>
              <div>
                <label className="block font-black uppercase mb-1">Vai Trò</label>
                <select
                  value={userModal.data.vai_tro || 'KHACH_HANG'}
                  onChange={(e) => setUserModal({ ...userModal, data: { ...userModal.data, vai_tro: e.target.value as any } })}
                  className={`w-full p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-[#060e09] border-emerald-800/40 text-white' : 'bg-white border-slate-300 text-[#0f172a]'}`}
                >
                  <option value="ADMIN">ADMIN (Toàn quyền)</option>
                  <option value="NHAN_VIEN">NHAN_VIEN (Quầy)</option>
                  <option value="KHACH_HANG">KHACH_HANG</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setUserModal({ isOpen: false, mode: 'ADD', data: {} })} className="px-4 py-2 rounded-xl font-bold bg-slate-200 text-slate-800 cursor-pointer">Hủy</button>
                <button type="submit" className="px-5 py-2 rounded-xl font-black bg-emerald-600 text-white cursor-pointer">Lưu Tài Khoản</button>
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
                  <span>{Math.max(0, checkoutModal.booking.tong_tien - checkoutModal.booking.tien_coc_da_tra).toLocaleString('vi-VN')} đ</span>
                </div>
              </div>
              <div>
                <label className="block font-black uppercase mb-1">Phương Thức Thanh Toán</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['TIEN_MAT', 'VNPAY', 'MOMO'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setCheckoutModal({ ...checkoutModal, paymentMethod: m })}
                      className={`p-2.5 rounded-xl border font-black text-xs cursor-pointer ${
                        checkoutModal.paymentMethod === m ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {m === 'TIEN_MAT' ? '💵 Tiền Mặt' : m === 'VNPAY' ? '💳 VNPay' : '📱 MoMo'}
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

    </div>
  );
}
