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
  Edit,
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
  ChevronLeft,
  SlidersHorizontal,
  Flame,
  ArrowUpRight,
  TrendingUp,
  Download,
  Check
} from 'lucide-react';

// =====================================================================
// 1. ĐỊNH NGHĨA KIỂU DỮ LIỆU (MAPPING TỪ CSDL SQL SERVER & STORED PROCEDURES)
// =====================================================================

export type TabType = 
  | 'OVERVIEW' 
  | 'TIMELINE_GRID' 
  | 'COURT_MANAGEMENT' 
  | 'PRICE_CONFIG' 
  | 'SERVICES_INVENTORY' 
  | 'USER_MANAGEMENT' 
  | 'REVENUE_REPORT';

export interface LoaiSan {
  id: number;
  ten_loai: string;
  mo_ta: string;
  gia_co_ban: number;
}

export interface SanBong {
  id: number;
  ma_loai_san: number;
  ten_san: string;
  ten_loai?: string;
  hinh_anh: string;
  trang_thai: 'SAN_SANG' | 'BAO_TRI';
}

export interface KhungGioGia {
  id: number;
  ma_loai_san: number;
  ten_loai?: string;
  gio_bat_dau: string;
  gio_ket_thuc: string;
  la_cuoi_tuan: boolean;
  don_gia: number;
}

export interface DichVu {
  id: number;
  ten_dich_vu: string;
  don_gia: number;
  don_vi_tinh: string;
  ton_kho: number;
}

export interface NguoiDung {
  id: number;
  ho_ten: string;
  email: string;
  so_dien_thoai: string;
  mat_khau?: string;
  vai_tro: 'ADMIN' | 'NHAN_VIEN' | 'KHACH_HANG';
  anh_dai_dien?: string;
  ngay_tao: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

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
  trang_thai: 'CHO_XAC_NHAN' | 'DA_CHOT' | 'HOAN_THANH' | 'DA_HUY';
  dich_vu_da_dung: {
    ma_dich_vu: number;
    ten_dich_vu: string;
    so_luong: number;
    gia_luc_ban: number;
  }[];
}

// =====================================================================
// 2. DỮ LIỆU MẪU BAN ĐẦU (MOCK STATE CHO TOÀN BỘ CHỨC NĂNG CRUD)
// =====================================================================

const INITIAL_LOAI_SAN: LoaiSan[] = [
  { id: 1, ten_loai: 'Sân 5 người', mo_ta: 'Cỏ nhân tạo FIFA tiêu chuẩn 1000 Lux', gia_co_ban: 250000 },
  { id: 2, ten_loai: 'Sân 7 người', mo_ta: 'Mặt cỏ mềm cao cấp tiêu chuẩn thi đấu', gia_co_ban: 450000 },
  { id: 3, ten_loai: 'Sân Pickleball', mo_ta: 'Mặt sân cao su chuẩn quốc tế', gia_co_ban: 180000 },
  { id: 4, ten_loai: 'Sân Cầu lông', mo_ta: 'Sàn gỗ chuyên dụng chống trơn', gia_co_ban: 120000 },
];

const INITIAL_SAN_BONG: SanBong[] = [
  { id: 1, ma_loai_san: 1, ten_san: 'Sân 5A (Cỏ nhân tạo)', ten_loai: 'Sân 5 người', hinh_anh: '/images/san-5a.jpg', trang_thai: 'SAN_SANG' },
  { id: 2, ma_loai_san: 1, ten_san: 'Sân 5B (Cỏ nhân tạo)', ten_loai: 'Sân 5 người', hinh_anh: '/images/san-5b.jpg', trang_thai: 'SAN_SANG' },
  { id: 3, ma_loai_san: 1, ten_san: 'Sân 5C (VIP)', ten_loai: 'Sân 5 người', hinh_anh: '/images/san-5c.jpg', trang_thai: 'SAN_SANG' },
  { id: 4, ma_loai_san: 2, ten_san: 'Sân 7A (Sân lớn)', ten_loai: 'Sân 7 người', hinh_anh: '/images/san-7a.jpg', trang_thai: 'SAN_SANG' },
  { id: 5, ma_loai_san: 2, ten_san: 'Sân 7B (Sân lớn)', ten_loai: 'Sân 7 người', hinh_anh: '/images/san-7b.jpg', trang_thai: 'SAN_SANG' },
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
  { id: 1, ten_dich_vu: 'Nước lọc Aquafina 500ml', don_gia: 10000, don_vi_tinh: 'Chai', ton_kho: 180 },
  { id: 2, ten_dich_vu: 'Nước tăng lực Revive chanh muối', don_gia: 20000, don_vi_tinh: 'Chai', ton_kho: 95 },
  { id: 3, ten_dich_vu: 'Nước điện giải Pocari Sweat', don_gia: 25000, don_vi_tinh: 'Chai', ton_kho: 60 },
  { id: 4, ten_dich_vu: 'Thuê bộ áo Bib phân đội (10 áo)', don_gia: 30000, don_vi_tinh: 'Bộ / Trận', ton_kho: 25 },
  { id: 5, ten_dich_vu: 'Thuê giày đá bóng cỏ nhân tạo', don_gia: 40000, don_vi_tinh: 'Đôi / Trận', ton_kho: 35 },
  { id: 6, ten_dich_vu: 'Thuê trọng tài bắt trận chuyên nghiệp', don_gia: 200000, don_vi_tinh: 'Người / Trận', ton_kho: 5 },
];

const INITIAL_NGUOI_DUNG: NguoiDung[] = [
  { id: 1, ho_ten: 'Quản Trị Viên Hệ Thống', email: 'admin@soccer247.vn', so_dien_thoai: '0909123456', vai_tro: 'ADMIN', ngay_tao: '2026-01-10' },
  { id: 2, ho_ten: 'Trần Văn Nhân (Nhân viên)', email: 'staff@soccer247.vn', so_dien_thoai: '0909789789', vai_tro: 'NHAN_VIEN', ngay_tao: '2026-02-15' },
  { id: 3, ho_ten: 'Nguyễn Văn Đạt', email: 'vandat.soccer@gmail.com', so_dien_thoai: '0988776655', vai_tro: 'KHACH_HANG', ngay_tao: '2026-03-01' },
  { id: 4, ho_ten: 'Lê Hoàng Long', email: 'hoanglong.fc@gmail.com', so_dien_thoai: '0912345999', vai_tro: 'KHACH_HANG', ngay_tao: '2026-03-12' },
  { id: 5, ho_ten: 'Phạm Minh Đức', email: 'minhduc.tennis@gmail.com', so_dien_thoai: '0977112233', vai_tro: 'KHACH_HANG', ngay_tao: '2026-03-20' },
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
    gio_bat_dau: '18:00',
    gio_ket_thuc: '19:30',
    tien_san: 350000,
    tong_tien: 410000,
    tien_coc_da_tra: 150000,
    trang_thai: 'DA_CHOT',
    dich_vu_da_dung: [
      { ma_dich_vu: 2, ten_dich_vu: 'Nước tăng lực Revive chanh muối', so_luong: 3, gia_luc_ban: 20000 }
    ]
  },
  {
    id: 102,
    ma_nguoi_dung: 4,
    ten_khach_hang: 'Lê Hoàng Long',
    so_dien_thoai: '0912345999',
    ma_san: 4,
    ten_san: 'Sân 7A (Sân lớn)',
    ngay_da: new Date().toISOString().split('T')[0],
    gio_bat_dau: '18:00',
    gio_ket_thuc: '19:30',
    tien_san: 650000,
    tong_tien: 750000,
    tien_coc_da_tra: 200000,
    trang_thai: 'DA_CHOT',
    dich_vu_da_dung: [
      { ma_dich_vu: 1, ten_dich_vu: 'Nước lọc Aquafina 500ml', so_luong: 4, gia_luc_ban: 10000 },
      { ma_dich_vu: 4, ten_dich_vu: 'Thuê bộ áo Bib phân đội (10 áo)', so_luong: 2, gia_luc_ban: 30000 }
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
    trang_thai: 'CHO_XAC_NHAN',
    dich_vu_da_dung: []
  }
];

const TIME_SLOTS = [
  { start: '15:00', end: '16:30', isGold: false },
  { start: '16:30', end: '18:00', isGold: true },
  { start: '18:00', end: '19:30', isGold: true },
  { start: '19:30', end: '21:00', isGold: true },
  { start: '21:00', end: '22:30', isGold: false }
];

// =====================================================================
// 3. COMPONENT TRANG QUẢN TRỊ ADMIN (DASHBOARD COMPONENT)
// =====================================================================

export default function AdminDashboard() {
  // Theme sáng/tối
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // Active Tab Menu
  const [activeTab, setActiveTab] = useState<TabType>('OVERVIEW');

  // Quản lý Dữ liệu State (CRUD States)
  const [courtList, setCourtList] = useState<SanBong[]>(INITIAL_SAN_BONG);
  const [categoryList, setCategoryList] = useState<LoaiSan[]>(INITIAL_LOAI_SAN);
  const [priceList, setPriceList] = useState<KhungGioGia[]>(INITIAL_KHUNG_GIO_GIA);
  const [serviceList, setServiceList] = useState<DichVu[]>(INITIAL_DICH_VU);
  const [userList, setUserList] = useState<NguoiDung[]>(INITIAL_NGUOI_DUNG);
  const [bookingList, setBookingList] = useState<DonDatSan[]>(INITIAL_DON_DAT);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Search & Pagination States
  const [searchCourt, setSearchCourt] = useState('');
  const [searchPrice, setSearchPrice] = useState('');
  const [searchService, setSearchService] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Toast message
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  // ===================================================================
  // HÀM TẢI DỮ LIỆU TỪ BACKEND EXPRESS.JS & CSDL SQL SERVER (STORED PROCEDURES)
  // ===================================================================
  const loadAllDataFromBackend = async () => {
    setIsLoading(true);
    try {
      // 1. Lấy danh sách sân bóng (sp_LayDanhSachSan)
      const resCourts = await fetch(`${API_BASE}/dat-san/danh-sach-san`);
      if (resCourts.ok) {
        const dataCourts = await resCourts.json();
        if (dataCourts.success && Array.isArray(dataCourts.data) && dataCourts.data.length > 0) {
          setCourtList(dataCourts.data);
        }
      }

      // 2. Lấy danh sách loại sân (sp_LayDanhSachLoaiSan)
      const resLoaiSan = await fetch(`${API_BASE}/dat-san/loai-san`);
      if (resLoaiSan.ok) {
        const dataLoaiSan = await resLoaiSan.json();
        if (dataLoaiSan.success && Array.isArray(dataLoaiSan.data) && dataLoaiSan.data.length > 0) {
          setCategoryList(dataLoaiSan.data);
        }
      }

      // 3. Lấy danh sách khung giờ giá (sp_LayKhungGioGia)
      const resPrice = await fetch(`${API_BASE}/dat-san/khung-gio-gia`);
      if (resPrice.ok) {
        const dataPrice = await resPrice.json();
        if (dataPrice.success && Array.isArray(dataPrice.data) && dataPrice.data.length > 0) {
          setPriceList(dataPrice.data);
        }
      }

      // 4. Lấy danh sách dịch vụ & kho (sp_LayDanhSachDichVu)
      const resServices = await fetch(`${API_BASE}/dich-vu`);
      if (resServices.ok) {
        const dataServices = await resServices.json();
        if (dataServices.success && Array.isArray(dataServices.data) && dataServices.data.length > 0) {
          setServiceList(dataServices.data);
        }
      }

      // 5. Lấy danh sách người dùng (sp_LayDanhSachNguoiDung)
      const resUsers = await fetch(`${API_BASE}/auth/users`);
      if (resUsers.ok) {
        const dataUsers = await resUsers.json();
        if (dataUsers.success && Array.isArray(dataUsers.data) && dataUsers.data.length > 0) {
          setUserList(dataUsers.data);
        }
      }

      // 6. Lấy tất cả đơn đặt sân (sp_LayTatCaDonDat)
      const resBookings = await fetch(`${API_BASE}/dat-san/tat-ca-don`);
      if (resBookings.ok) {
        const dataBookings = await resBookings.json();
        if (dataBookings.success && Array.isArray(dataBookings.data) && dataBookings.data.length > 0) {
          setBookingList(dataBookings.data.map((b: any) => ({
            ...b,
            dich_vu_da_dung: b.dich_vu_da_dung || []
          })));
        }
      }
    } catch (err: any) {
      console.warn('Lưu ý: Kết nối máy chủ backend SQL Server gặp gián đoạn hoặc đang khởi tạo, đang sử dụng dữ liệu bộ nhớ đệm.', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllDataFromBackend();
  }, []);

  // ===================================================================
  // CÁC STATE QUẢN LÝ MODAL (CRUD & CHECKOUT MODALS)
  // ===================================================================

  // Modal Sân Bóng
  const [courtModal, setCourtModal] = useState<{
    isOpen: boolean;
    mode: 'ADD' | 'EDIT';
    data: Partial<SanBong>;
  }>({ isOpen: false, mode: 'ADD', data: {} });

  // Modal Khung Giờ Giá
  const [priceModal, setPriceModal] = useState<{
    isOpen: boolean;
    mode: 'ADD' | 'EDIT';
    data: Partial<KhungGioGia>;
  }>({ isOpen: false, mode: 'ADD', data: {} });

  // Modal Dịch Vụ
  const [serviceModal, setServiceModal] = useState<{
    isOpen: boolean;
    mode: 'ADD' | 'EDIT';
    data: Partial<DichVu>;
  }>({ isOpen: false, mode: 'ADD', data: {} });

  // Modal Nhập Kho Dịch Vụ (sp_NhapKhoDichVu)
  const [importStockModal, setImportStockModal] = useState<{
    isOpen: boolean;
    dichVu: DichVu | null;
    soLuongNhap: number;
    giaNhap: number;
  }>({ isOpen: false, dichVu: null, soLuongNhap: 10, giaNhap: 15000 });

  // Modal Người Dùng (sp_ThemNguoiDung, sp_SuaNguoiDung)
  const [userModal, setUserModal] = useState<{
    isOpen: boolean;
    mode: 'ADD' | 'EDIT';
    data: Partial<NguoiDung>;
  }>({ isOpen: false, mode: 'ADD', data: {} });

  // Modal Check-out Trả Sân & Xuất Hóa Đơn (sp_ThanhToanDon)
  const [checkoutModal, setCheckoutModal] = useState<{
    isOpen: boolean;
    booking: DonDatSan | null;
    paymentMethod: 'TIEN_MAT' | 'VNPAY' | 'MOMO';
    discount: number;
  }>({ isOpen: false, booking: null, paymentMethod: 'TIEN_MAT', discount: 0 });

  // Modal Mini POS (Bán thêm nước trực tiếp vào đơn đặt sân - sp_ThemDichVu)
  const [miniPosModal, setMiniPosModal] = useState<{
    isOpen: boolean;
    booking: DonDatSan | null;
    maDichVuChon: number;
    soLuong: number;
  }>({ isOpen: false, booking: null, maDichVuChon: 1, soLuong: 1 });

  // ===================================================================
  // TÍNH TOÁN KPI DASHBOARD OVERVIEW
  // ===================================================================
  const kpiStats = useMemo(() => {
    // 1. Doanh thu hôm nay
    const totalRevenue = bookingList
      .filter((b) => b.trang_thai === 'DA_CHOT' || b.trang_thai === 'HOAN_THANH')
      .reduce((sum, b) => sum + Number(b.tong_tien || 0), 0);

    // 2. Tổng đơn đặt sân
    const totalOrders = bookingList.length;

    // 3. Số sân đang có khách thi đấu (DA_CHOT)
    const activeCourtsCount = bookingList.filter((b) => b.trang_thai === 'DA_CHOT').length;

    // 4. Tỷ lệ lấp đầy (dựa trên tổng số slots có thể đặt)
    const totalPossibleSlots = (courtList.length || 1) * TIME_SLOTS.length;
    const occupiedSlots = activeCourtsCount;
    const occupancyRate = totalPossibleSlots > 0 ? Math.round((occupiedSlots / totalPossibleSlots) * 100) : 0;

    return {
      totalRevenue,
      totalOrders,
      activeCourtsCount,
      occupancyRate
    };
  }, [bookingList, courtList]);

  // ===================================================================
  // CÁC HÀM XỬ LÝ CRUD GỌI BACKEND EXPRESS (100% STORED PROCEDURES)
  // ===================================================================

  // --- 1. CRUD SÂN BÓNG (San_Bong - sp_ThemSanBong, sp_SuaSanBong, sp_XoaSanBong) ---
  const handleSaveCourt = async (e: React.FormEvent) => {
    e.preventDefault();
    const { ten_san, ma_loai_san, trang_thai, hinh_anh } = courtModal.data;
    if (!ten_san || !ma_loai_san) {
      setToastMessage({ type: 'error', message: 'Vui lòng nhập tên sân và chọn loại sân!' });
      return;
    }

    try {
      if (courtModal.mode === 'ADD') {
        const res = await fetch(`${API_BASE}/dat-san/san-bong`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            ten_san,
            ma_loai_san: Number(ma_loai_san),
            hinh_anh: hinh_anh || '/images/default-pitch.jpg',
            trang_thai: (trang_thai as any) || 'SAN_SANG'
          })
        });
        const data = await res.json();
        if (data.success) {
          setToastMessage({ type: 'success', message: `✅ Đã thêm sân [${ten_san}] thành công! (Thủ tục sp_ThemSanBong)` });
          loadAllDataFromBackend();
        } else {
          throw new Error(data.message);
        }
      } else {
        const res = await fetch(`${API_BASE}/dat-san/san-bong/${courtModal.data.id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            ten_san,
            ma_loai_san: Number(ma_loai_san),
            hinh_anh: hinh_anh || '/images/default-pitch.jpg',
            trang_thai: (trang_thai as any) || 'SAN_SANG'
          })
        });
        const data = await res.json();
        if (data.success) {
          setToastMessage({ type: 'success', message: `✅ Đã cập nhật thông tin sân [${ten_san}]! (Thủ tục sp_SuaSanBong)` });
          loadAllDataFromBackend();
        } else {
          throw new Error(data.message);
        }
      }
    } catch (err: any) {
      setToastMessage({ type: 'error', message: err.message || 'Lỗi khi lưu sân bóng' });
    }
    setCourtModal({ isOpen: false, mode: 'ADD', data: {} });
  };

  const handleDeleteCourt = async (id: number, name: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa sân [${name}] không?`)) {
      try {
        const res = await fetch(`${API_BASE}/dat-san/san-bong/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
        const data = await res.json();
        if (data.success) {
          setToastMessage({ type: 'success', message: `🗑️ Đã xóa sân [${name}] thành công! (Thủ tục sp_XoaSanBong)` });
          loadAllDataFromBackend();
        } else {
          throw new Error(data.message);
        }
      } catch (err: any) {
        setToastMessage({ type: 'error', message: err.message || 'Lỗi khi xóa sân bóng' });
      }
    }
  };

  // --- 2. CRUD KHUNG GIỜ GIÁ (Khung_Gio_Gia - sp_ThemKhungGioGia, sp_SuaKhungGioGia, sp_XoaKhungGioGia) ---
  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    const { ma_loai_san, gio_bat_dau, gio_ket_thuc, la_cuoi_tuan, don_gia } = priceModal.data;
    if (!ma_loai_san || !gio_bat_dau || !gio_ket_thuc || !don_gia) {
      setToastMessage({ type: 'error', message: 'Vui lòng điền đầy đủ thông tin khung giờ giá!' });
      return;
    }

    try {
      if (priceModal.mode === 'ADD') {
        const res = await fetch(`${API_BASE}/dat-san/khung-gio-gia`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            ma_loai_san: Number(ma_loai_san),
            gio_bat_dau,
            gio_ket_thuc,
            la_cuoi_tuan: !!la_cuoi_tuan,
            don_gia: Number(don_gia)
          })
        });
        const data = await res.json();
        if (data.success) {
          setToastMessage({ type: 'success', message: '✅ Đã thêm khung giờ giá mới! (Thủ tục sp_ThemKhungGioGia)' });
          loadAllDataFromBackend();
        } else {
          throw new Error(data.message);
        }
      } else {
        const res = await fetch(`${API_BASE}/dat-san/khung-gio-gia/${priceModal.data.id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            ma_loai_san: Number(ma_loai_san),
            gio_bat_dau,
            gio_ket_thuc,
            la_cuoi_tuan: !!la_cuoi_tuan,
            don_gia: Number(don_gia)
          })
        });
        const data = await res.json();
        if (data.success) {
          setToastMessage({ type: 'success', message: '✅ Đã cập nhật bảng giá thành công! (Thủ tục sp_SuaKhungGioGia)' });
          loadAllDataFromBackend();
        } else {
          throw new Error(data.message);
        }
      }
    } catch (err: any) {
      setToastMessage({ type: 'error', message: err.message || 'Lỗi khi lưu khung giờ giá' });
    }
    setPriceModal({ isOpen: false, mode: 'ADD', data: {} });
  };

  const handleDeletePrice = async (id: number) => {
    if (confirm('Bạn có chắc muốn xóa cấu hình khung giờ giá này không?')) {
      try {
        const res = await fetch(`${API_BASE}/dat-san/khung-gio-gia/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
        const data = await res.json();
        if (data.success) {
          setToastMessage({ type: 'success', message: '🗑️ Đã xóa cấu hình giá thành công! (Thủ tục sp_XoaKhungGioGia)' });
          loadAllDataFromBackend();
        } else {
          throw new Error(data.message);
        }
      } catch (err: any) {
        setToastMessage({ type: 'error', message: err.message || 'Lỗi khi xóa bảng giá' });
      }
    }
  };

  // --- 3. CRUD DỊCH VỤ & NHẬP KHO (Dich_Vu - sp_ThemDichVuMoi, sp_SuaDichVu, sp_XoaDichVu, sp_NhapKhoDichVu) ---
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    const { ten_dich_vu, don_gia, don_vi_tinh, ton_kho } = serviceModal.data;
    if (!ten_dich_vu || !don_gia || !don_vi_tinh) {
      setToastMessage({ type: 'error', message: 'Vui lòng điền tên, đơn giá và đơn vị tính!' });
      return;
    }

    try {
      if (serviceModal.mode === 'ADD') {
        const res = await fetch(`${API_BASE}/dich-vu`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            ten_dich_vu,
            don_gia: Number(don_gia),
            don_vi_tinh,
            ton_kho: Number(ton_kho) || 0
          })
        });
        const data = await res.json();
        if (data.success) {
          setToastMessage({ type: 'success', message: `✅ Đã thêm dịch vụ [${ten_dich_vu}]! (Thủ tục sp_ThemDichVuMoi)` });
          loadAllDataFromBackend();
        } else {
          throw new Error(data.message);
        }
      } else {
        const res = await fetch(`${API_BASE}/dich-vu/${serviceModal.data.id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            ten_dich_vu,
            don_gia: Number(don_gia),
            don_vi_tinh,
            ton_kho: Number(ton_kho) || 0
          })
        });
        const data = await res.json();
        if (data.success) {
          setToastMessage({ type: 'success', message: `✅ Đã cập nhật dịch vụ [${ten_dich_vu}]! (Thủ tục sp_SuaDichVu)` });
          loadAllDataFromBackend();
        } else {
          throw new Error(data.message);
        }
      }
    } catch (err: any) {
      setToastMessage({ type: 'error', message: err.message || 'Lỗi khi lưu dịch vụ' });
    }
    setServiceModal({ isOpen: false, mode: 'ADD', data: {} });
  };

  const handleDeleteService = async (id: number, name: string) => {
    if (confirm(`Bạn có chắc muốn xóa dịch vụ [${name}] không?`)) {
      try {
        const res = await fetch(`${API_BASE}/dich-vu/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
        const data = await res.json();
        if (data.success) {
          setToastMessage({ type: 'success', message: `🗑️ Đã xóa dịch vụ [${name}] thành công! (Thủ tục sp_XoaDichVu)` });
          loadAllDataFromBackend();
        } else {
          throw new Error(data.message);
        }
      } catch (err: any) {
        setToastMessage({ type: 'error', message: err.message || 'Lỗi khi xóa dịch vụ' });
      }
    }
  };

  // Xử lý nhập kho gọi Stored Procedure sp_NhapKhoDichVu
  const handleImportStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importStockModal.dichVu || importStockModal.soLuongNhap <= 0) {
      setToastMessage({ type: 'error', message: 'Số lượng nhập phải lớn hơn 0!' });
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/dich-vu/nhap-kho`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ma_dich_vu: importStockModal.dichVu.id,
          so_luong_nhap: importStockModal.soLuongNhap,
          gia_nhap: importStockModal.giaNhap
        })
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage({
          type: 'success',
          message: `📦 Nhập kho thành công +${importStockModal.soLuongNhap} [${importStockModal.dichVu.ten_dich_vu}] (Thủ tục sp_NhapKhoDichVu)`
        });
        loadAllDataFromBackend();
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      setToastMessage({ type: 'error', message: err.message || 'Lỗi khi nhập kho dịch vụ' });
    }
    setImportStockModal({ isOpen: false, dichVu: null, soLuongNhap: 10, giaNhap: 15000 });
  };

  // --- 4. CRUD NGƯỜI DÙNG (Nguoi_Dung - sp_ThemNguoiDung, sp_SuaNguoiDung, sp_XoaNguoiDung) ---
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const { ho_ten, email, so_dien_thoai, vai_tro, mat_khau } = userModal.data;
    if (!ho_ten || !email) {
      setToastMessage({ type: 'error', message: 'Vui lòng nhập họ tên và email!' });
      return;
    }

    try {
      if (userModal.mode === 'ADD') {
        const res = await fetch(`${API_BASE}/auth/users`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            ho_ten,
            email,
            so_dien_thoai: so_dien_thoai || '',
            mat_khau: mat_khau || '123456',
            vai_tro: (vai_tro as any) || 'KHACH_HANG'
          })
        });
        const data = await res.json();
        if (data.success) {
          setToastMessage({ type: 'success', message: `✅ Thêm tài khoản [${ho_ten}] thành công! (Thủ tục sp_ThemNguoiDung)` });
          loadAllDataFromBackend();
        } else {
          throw new Error(data.message);
        }
      } else {
        const res = await fetch(`${API_BASE}/auth/users/${userModal.data.id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            ho_ten,
            email,
            so_dien_thoai: so_dien_thoai || '',
            mat_khau: mat_khau || '',
            vai_tro: (vai_tro as any) || 'KHACH_HANG'
          })
        });
        const data = await res.json();
        if (data.success) {
          setToastMessage({ type: 'success', message: `✅ Cập nhật thông tin tài khoản [${ho_ten}]! (Thủ tục sp_SuaNguoiDung)` });
          loadAllDataFromBackend();
        } else {
          throw new Error(data.message);
        }
      }
    } catch (err: any) {
      setToastMessage({ type: 'error', message: err.message || 'Lỗi khi lưu thông tin người dùng' });
    }
    setUserModal({ isOpen: false, mode: 'ADD', data: {} });
  };

  const handleDeleteUser = async (id: number, name: string) => {
    if (confirm(`Bạn có chắc muốn xóa tài khoản [${name}] không?`)) {
      try {
        const res = await fetch(`${API_BASE}/auth/users/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
        const data = await res.json();
        if (data.success) {
          setToastMessage({ type: 'success', message: `🗑️ Đã xóa tài khoản [${name}]! (Thủ tục sp_XoaNguoiDung)` });
          loadAllDataFromBackend();
        } else {
          throw new Error(data.message);
        }
      } catch (err: any) {
        setToastMessage({ type: 'error', message: err.message || 'Lỗi khi xóa người dùng' });
      }
    }
  };

  // --- 5. BÁN DỊCH VỤ TẠI SÂN (MINI POS - sp_ThemDichVu) ---
  const handleAddServiceToBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!miniPosModal.booking) return;

    const dv = serviceList.find((s) => s.id === Number(miniPosModal.maDichVuChon));
    if (!dv) return;

    if (dv.ton_kho < miniPosModal.soLuong) {
      setToastMessage({ type: 'error', message: `Tồn kho của [${dv.ten_dich_vu}] chỉ còn ${dv.ton_kho}!` });
      return;
    }

    try {
      const orderId = miniPosModal.booking.id;
      const res = await fetch(`${API_BASE}/dich-vu/them-vao-don`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ma_don_dat: orderId,
          ma_dich_vu: dv.id,
          so_luong: miniPosModal.soLuong
        })
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage({
          type: 'success',
          message: `🥤 Đã bán thêm ${miniPosModal.soLuong} [${dv.ten_dich_vu}] vào đơn #${orderId}! (Thủ tục sp_ThemDichVu)`
        });
        loadAllDataFromBackend();
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      setToastMessage({ type: 'error', message: err.message || 'Lỗi khi bán dịch vụ' });
    }
    setMiniPosModal({ isOpen: false, booking: null, maDichVuChon: 1, soLuong: 1 });
  };

  // --- 6. TRẢ SÂN & XUẤT HÓA ĐƠN (CHECKOUT INVOICE - sp_ThanhToanDon) ---
  const handleConfirmCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutModal.booking) return;

    const bId = checkoutModal.booking.id;
    const conLai = Math.max(0, checkoutModal.booking.tong_tien - checkoutModal.booking.tien_coc_da_tra - checkoutModal.discount);

    try {
      const res = await fetch(`${API_BASE}/thanh-toan`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ma_don_dat: bId,
          phuong_thuc: checkoutModal.paymentMethod,
          loai_thanh_toan: 'TRA_HET',
          so_tien: conLai > 0 ? conLai : 1000,
          ma_giao_dich: `GD_CHECKOUT_${Date.now()}`
        })
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage({
          type: 'success',
          message: `🧾 Trả sân & xuất hóa đơn thành công đơn #${bId}! (Thủ tục sp_ThanhToanDon)`
        });
        loadAllDataFromBackend();
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      setToastMessage({ type: 'error', message: err.message || 'Lỗi khi thanh toán trả sân' });
    }
    setCheckoutModal({ isOpen: false, booking: null, paymentMethod: 'TIEN_MAT', discount: 0 });
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      <Head>
        <title>SportZone Admin - Trung Tâm Quản Trị Hệ Thống Sân Bóng 24/7</title>
        <meta name="description" content="Giao diện quản trị Admin toàn diện cho hệ thống quản lý đặt sân thể thao, POS bán nước, báo cáo doanh thu và cấu hình giá." />
      </Head>

      {/* TOAST THÔNG BÁO NỔI */}
      {toastMessage && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-md transition-all duration-300 animate-slide-in ${
            toastMessage.type === 'success'
              ? isDarkMode ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200' : 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : toastMessage.type === 'error'
              ? isDarkMode ? 'bg-rose-950/90 border-rose-500/50 text-rose-200' : 'bg-rose-50 border-rose-300 text-rose-900'
              : isDarkMode ? 'bg-blue-950/90 border-blue-500/50 text-blue-200' : 'bg-blue-50 border-blue-300 text-blue-900'
          }`}
        >
          {toastMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
          {toastMessage.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />}
          {toastMessage.type === 'info' && <Activity className="w-5 h-5 text-blue-500 shrink-0" />}
          <span className="text-xs sm:text-sm font-semibold">{toastMessage.message}</span>
          <button onClick={() => setToastMessage(null)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex h-screen overflow-hidden">
        
        {/* =====================================================================
            1. SIDEBAR CỐ ĐỊNH BÊN TRÁI (LEFT NAVIGATION SIDEBAR)
            ===================================================================== */}
        <aside className={`w-64 xl:w-72 shrink-0 border-r flex flex-col justify-between transition-colors duration-300 ${
          isDarkMode ? 'bg-slate-900/95 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div>
            {/* Logo Thương Hiệu Admin */}
            <div className="p-6 flex items-center gap-3 border-b border-slate-800/60">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Activity className="w-5 h-5 text-slate-950 stroke-[2.5]" />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight flex items-center gap-1">
                  <span>SPORT</span>
                  <span className="text-emerald-500">ZONE</span>
                </h1>
                <p className="text-[9px] uppercase font-bold tracking-widest text-emerald-600 dark:text-emerald-400">Admin Control Center</p>
              </div>
            </div>

            {/* Menu 7 Mục Quản Trị */}
            <nav className="p-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-200px)]">
              {[
                { id: 'OVERVIEW', label: 'Tổng Quan & KPI', icon: LayoutDashboard },
                { id: 'TIMELINE_GRID', label: 'Lịch Sân Real-Time', icon: Calendar },
                { id: 'COURT_MANAGEMENT', label: 'Quản Lý Sân Bóng', icon: Layers },
                { id: 'PRICE_CONFIG', label: 'Cấu Hình Khung Giờ Giá', icon: Clock },
                { id: 'SERVICES_INVENTORY', label: 'Dịch Vụ & Nhập Kho', icon: Coffee },
                { id: 'USER_MANAGEMENT', label: 'Quản Lý Tài Khoản', icon: Users },
                { id: 'REVENUE_REPORT', label: 'Báo Cáo Doanh Thu', icon: BarChart3 }
              ].map((item) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as TabType)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/20 scale-[1.02]'
                        : isDarkMode
                        ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                        : 'text-slate-600 hover:text-emerald-600 hover:bg-slate-100'
                    }`}
                  >
                    <IconComponent className={`w-4 h-4 ${isActive ? 'text-slate-950 stroke-[2.5]' : ''}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* User Footer Profile & Đăng xuất */}
          <div className={`p-4 border-t ${isDarkMode ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-slate-950 text-xs">
                  AD
                </div>
                <div>
                  <p className="text-xs font-bold leading-tight">Admin Quản Trị</p>
                  <p className="text-[10px] text-emerald-500 font-mono">admin@soccer247.vn</p>
                </div>
              </div>
              <button
                onClick={() => setToastMessage({ type: 'info', message: 'Đăng xuất khỏi phiên làm việc Quản trị viên.' })}
                className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
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
          
          {/* TOP NAVBAR HEADER */}
          <header className={`h-16 px-6 border-b flex items-center justify-between shrink-0 transition-colors duration-300 ${
            isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            {/* Tiêu đề trang hiện tại */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-500 font-mono">Bảng Điều Khiển</span>
              <span className="text-slate-500">/</span>
              <h2 className="text-sm sm:text-base font-black capitalize">
                {activeTab === 'OVERVIEW' && 'Tổng Quan Hoạt Động & KPI'}
                {activeTab === 'TIMELINE_GRID' && 'Ma Trận Lịch Sân Thời Gian Thực'}
                {activeTab === 'COURT_MANAGEMENT' && 'Quản Lý Sân Bóng & Cơ Sở Vật Chất'}
                {activeTab === 'PRICE_CONFIG' && 'Cấu Hình Khung Giờ & Bảng Giá'}
                {activeTab === 'SERVICES_INVENTORY' && 'Quản Lý Dịch Vụ & Nhập Xuất Kho'}
                {activeTab === 'USER_MANAGEMENT' && 'Quản Lý Tài Khoản Người Dùng'}
                {activeTab === 'REVENUE_REPORT' && 'Báo Cáo Doanh Thu & Thống Kê'}
              </h2>
            </div>

            {/* Cụm Nút Phải: Date Picker, Theme Switch, Notifications */}
            <div className="flex items-center gap-3">
              {/* Chọn ngày xem lịch */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
                isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-100 border-slate-300 text-slate-800'
              }`}>
                <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent focus:outline-none cursor-pointer text-xs"
                />
              </div>

              {/* Nút Đổi Theme Sáng / Tối */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                title={isDarkMode ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  isDarkMode
                    ? 'bg-slate-950 border-slate-800 text-amber-400 hover:bg-slate-800'
                    : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-emerald-600" />}
              </button>

              {/* Thông báo chuông */}
              <div className="relative">
                <button
                  onClick={() => setToastMessage({ type: 'info', message: 'Hệ thống có 2 đơn đặt sân mới chờ duyệt cọc!' })}
                  className={`p-2 rounded-xl border transition-all relative cursor-pointer ${
                    isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-slate-100 border-slate-300 text-slate-700'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500" />
                </button>
              </div>
            </div>
          </header>

          {/* BODY NỘI DUNG THAY ĐỔI THEO TAB */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {/* =================================================================
                TAB 1 & 2: TỔNG QUAN KPI & MA TRẬN LỊCH SÂN THỜI GIAN THỰC
                ================================================================= */}
            {(activeTab === 'OVERVIEW' || activeTab === 'TIMELINE_GRID') && (
              <div className="space-y-8">
                
                {/* 4 THẺ KPI NỔI BẬT */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  {/* KPI 1 */}
                  <div className={`p-5 rounded-3xl border transition-all shadow-lg ${
                    isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Doanh Thu Hôm Nay</span>
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                        <DollarSign className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <h3 className="text-2xl font-black text-emerald-500">
                        {kpiStats.totalRevenue.toLocaleString('vi-VN')} đ
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-semibold">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-500">+18.5%</span> so với hôm qua
                      </p>
                    </div>
                  </div>

                  {/* KPI 2 */}
                  <div className={`p-5 rounded-3xl border transition-all shadow-lg ${
                    isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng Đơn Đặt Sân</span>
                      <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                        <Calendar className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <h3 className="text-2xl font-black">{kpiStats.totalOrders} Đơn</h3>
                      <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-semibold">
                        <span>Đã chốt cọc: {bookingList.filter((b) => b.trang_thai === 'DA_CHOT').length}</span>
                      </p>
                    </div>
                  </div>

                  {/* KPI 3 */}
                  <div className={`p-5 rounded-3xl border transition-all shadow-lg ${
                    isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Số Sân Đang Đá</span>
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                        <Flame className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <h3 className="text-2xl font-black text-amber-500">{kpiStats.activeCourtsCount} Sân</h3>
                      <p className="text-[11px] text-slate-500 mt-1 font-semibold">
                        Sân trống sẵn sàng: {courtList.length - kpiStats.activeCourtsCount} sân
                      </p>
                    </div>
                  </div>

                  {/* KPI 4 */}
                  <div className={`p-5 rounded-3xl border transition-all shadow-lg ${
                    isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tỷ Lệ Lấp Đầy</span>
                      <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
                        <Activity className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <h3 className="text-2xl font-black text-purple-400">{kpiStats.occupancyRate}%</h3>
                      <div className="w-full bg-slate-700/40 h-2 rounded-full mt-2 overflow-hidden">
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full" style={{ width: `${kpiStats.occupancyRate}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* MA TRẬN LỊCH SÂN REAL-TIME (TIMELINE GRID) */}
                <div className={`p-6 rounded-3xl border shadow-xl ${
                  isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 gap-4 border-b border-slate-800/60">
                    <div>
                      <h3 className="text-lg font-black flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-emerald-500" />
                        Ma Trận Lịch Sân Theo Thời Gian Thực (Ngày {selectedDate})
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Dữ liệu đồng bộ trực tiếp từ Stored Procedure <code className="text-emerald-500 font-mono">sp_LayLichSan</code>
                      </p>
                    </div>
                    
                    {/* Bảng chú giải màu sắc */}
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                        🟩 Trống (Đặt Sân)
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-500 border border-amber-500/30">
                        🟨 Chờ Duyệt Cọc
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-500 border border-rose-500/30">
                        🟥 Đang Đá (Bấm Trả Sân)
                      </span>
                    </div>
                  </div>

                  {/* BẢNG GRID TIMELINE */}
                  <div className="overflow-x-auto mt-6">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                      <thead>
                        <tr className={isDarkMode ? 'bg-slate-950/80 text-slate-300' : 'bg-slate-100 text-slate-700'}>
                          <th className="p-4 text-xs font-black uppercase tracking-wider w-48 sticky left-0 z-10 bg-inherit">
                            Tên Sân Bóng
                          </th>
                          {TIME_SLOTS.map((slot) => (
                            <th key={slot.start} className="p-3 text-center text-xs font-bold border-l border-slate-800/40">
                              {slot.start} - {slot.end}
                              {slot.isGold && <span className="block text-[10px] text-amber-500 font-normal">🔥 Giờ Vàng</span>}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-xs">
                        {courtList.map((court) => (
                          <tr key={court.id} className="hover:bg-slate-800/20 transition-colors">
                            <td className={`p-4 font-bold sticky left-0 z-10 border-r ${
                              isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
                            }`}>
                              <div>{court.ten_san}</div>
                              <span className="text-[10px] text-emerald-500 font-normal">{court.ten_loai}</span>
                            </td>

                            {TIME_SLOTS.map((slot) => {
                              // Tìm đơn đặt sân trùng khớp sân và khung giờ
                              const matchedBooking = bookingList.find(
                                (b) => b.ma_san === court.id && b.gio_bat_dau === slot.start && b.trang_thai !== 'DA_HUY'
                              );

                              return (
                                <td key={slot.start} className="p-2 border-l border-slate-800/40 text-center">
                                  {!matchedBooking && (
                                    <button
                                      onClick={() => {
                                        // Mở form nhanh đặt sân
                                        const newB: DonDatSan = {
                                          id: Math.floor(Math.random() * 900) + 100,
                                          ma_nguoi_dung: 3,
                                          ten_khach_hang: 'Khách Đặt Tại Quầy',
                                          so_dien_thoai: '0900000000',
                                          ma_san: court.id,
                                          ten_san: court.ten_san,
                                          ngay_da: selectedDate,
                                          gio_bat_dau: slot.start,
                                          gio_ket_thuc: slot.end,
                                          tien_san: 350000,
                                          tong_tien: 350000,
                                          tien_coc_da_tra: 100000,
                                          trang_thai: 'DA_CHOT',
                                          dich_vu_da_dung: []
                                        };
                                        setBookingList([...bookingList, newB]);
                                        setToastMessage({ type: 'success', message: `✅ Đã đặt giữ chỗ khung giờ ${slot.start} cho ${court.ten_san}!` });
                                      }}
                                      className={`w-full py-3.5 px-2 rounded-xl border transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                                        isDarkMode
                                          ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/50'
                                          : 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                                      }`}
                                    >
                                      <span className="font-bold">SÂN TRỐNG</span>
                                      <span className="text-[10px] opacity-75">+ Bấm Đặt</span>
                                    </button>
                                  )}

                                  {matchedBooking && matchedBooking.trang_thai === 'CHO_XAC_NHAN' && (
                                    <div
                                      onClick={() => {
                                        // Xác nhận duyệt cọc
                                        setBookingList(
                                          bookingList.map((b) => (b.id === matchedBooking.id ? { ...b, trang_thai: 'DA_CHOT' } : b))
                                        );
                                        setToastMessage({ type: 'success', message: `✅ Đã duyệt cọc cho đơn #${matchedBooking.id}!` });
                                      }}
                                      className="w-full py-3 px-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-500 flex flex-col items-center justify-center gap-0.5 cursor-pointer hover:bg-amber-500/30 transition-all"
                                    >
                                      <span className="font-black">CHỜ DUYỆT CỌC</span>
                                      <span className="text-[10px] truncate max-w-[100px]">{matchedBooking.ten_khach_hang}</span>
                                      <span className="text-[9px] underline">Click Duyệt Cọc</span>
                                    </div>
                                  )}

                                  {matchedBooking && matchedBooking.trang_thai === 'DA_CHOT' && (
                                    <div className="w-full py-2.5 px-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex flex-col items-center justify-center gap-1">
                                      <div className="font-black text-[11px] truncate max-w-[110px]">{matchedBooking.ten_khach_hang}</div>
                                      <div className="flex items-center gap-1 mt-0.5">
                                        {/* Nút Mini POS */}
                                        <button
                                          onClick={() => setMiniPosModal({ isOpen: true, booking: matchedBooking, maDichVuChon: 1, soLuong: 1 })}
                                          className="p-1 rounded-lg bg-slate-800 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 transition-colors cursor-pointer text-[10px] font-bold"
                                          title="Bán thêm nước / dịch vụ"
                                        >
                                          + Dịch Vụ
                                        </button>
                                        {/* Nút Trả sân & Checkout */}
                                        <button
                                          onClick={() => setCheckoutModal({ isOpen: true, booking: matchedBooking, paymentMethod: 'TIEN_MAT', discount: 0 })}
                                          className="p-1 rounded-lg bg-rose-600 text-white hover:bg-rose-500 transition-colors cursor-pointer text-[10px] font-bold"
                                          title="Trả sân & Xuất hóa đơn"
                                        >
                                          Trả Sân
                                        </button>
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

              </div>
            )}

            {/* =================================================================
                TAB 3: QUẢN LÝ SÂN BÓNG (CRUD San_Bong & Loai_San)
                ================================================================= */}
            {activeTab === 'COURT_MANAGEMENT' && (
              <div className={`p-6 rounded-3xl border shadow-xl ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 gap-4 border-b border-slate-800/60">
                  <div>
                    <h3 className="text-lg font-black flex items-center gap-2">
                      <Layers className="w-5 h-5 text-emerald-500" />
                      Danh Sách Sân Bóng & Cơ Sở Vật Chất (Bảng San_Bong)
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Thêm mới, cập nhật trạng thái bảo trì hoặc xóa sân (sp_ThemSanBong, sp_XoaSanBong)</p>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Tìm tên sân..."
                        value={searchCourt}
                        onChange={(e) => setSearchCourt(e.target.value)}
                        className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border focus:outline-none focus:border-emerald-500 ${
                          isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300'
                        }`}
                      />
                    </div>

                    <button
                      onClick={() => setCourtModal({ isOpen: true, mode: 'ADD', data: { ma_loai_san: 1, trang_thai: 'SAN_SANG' } })}
                      className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:from-emerald-400 hover:to-teal-300 shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      Thêm Sân Mới
                    </button>
                  </div>
                </div>

                {/* BẢNG DỮ LIỆU SÂN BÓNG */}
                <div className="overflow-x-auto mt-6">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className={`border-b ${isDarkMode ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        <th className="p-3.5 font-bold">Mã Sân</th>
                        <th className="p-3.5 font-bold">Tên Sân Bóng</th>
                        <th className="p-3.5 font-bold">Loại Sân</th>
                        <th className="p-3.5 font-bold">Trạng Thái Hoạt Động</th>
                        <th className="p-3.5 font-bold text-right">Thao Tác Hành Động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {courtList
                        .filter((c) => c.ten_san.toLowerCase().includes(searchCourt.toLowerCase()))
                        .map((court) => (
                          <tr key={court.id} className="hover:bg-slate-800/20 transition-colors">
                            <td className="p-3.5 font-mono text-emerald-500 font-bold">#{court.id}</td>
                            <td className="p-3.5 font-bold">{court.ten_san}</td>
                            <td className="p-3.5">{court.ten_loai}</td>
                            <td className="p-3.5">
                              {court.trang_thai === 'SAN_SANG' ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                  SẴN SÀNG
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                  BẢO TRÌ
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 text-right space-x-2">
                              <button
                                onClick={() => setCourtModal({ isOpen: true, mode: 'EDIT', data: court })}
                                className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors cursor-pointer"
                                title="Chỉnh sửa sân"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteCourt(court.id, court.ten_san)}
                                className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                                title="Xóa sân"
                              >
                                <Trash2 className="w-4 h-4" />
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
                TAB 4: CẤU HÌNH KHUNG GIỜ GIÁ (CRUD Khung_Gio_Gia)
                ================================================================= */}
            {activeTab === 'PRICE_CONFIG' && (
              <div className={`p-6 rounded-3xl border shadow-xl ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 gap-4 border-b border-slate-800/60">
                  <div>
                    <h3 className="text-lg font-black flex items-center gap-2">
                      <Clock className="w-5 h-5 text-emerald-500" />
                      Cấu Hình Bảng Giá & Giờ Vàng (Bảng Khung_Gio_Gia)
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Thiết lập đơn giá linh hoạt theo giờ thường, giờ vàng và ngày cuối tuần</p>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      onClick={() => setPriceModal({ isOpen: true, mode: 'ADD', data: { ma_loai_san: 1, gio_bat_dau: '16:30', gio_ket_thuc: '21:00', la_cuoi_tuan: false, don_gia: 350000 } })}
                      className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:from-emerald-400 hover:to-teal-300 shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      Thêm Khung Giá Mới
                    </button>
                  </div>
                </div>

                {/* BẢNG KHUNG GIỜ GIÁ */}
                <div className="overflow-x-auto mt-6">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className={`border-b ${isDarkMode ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        <th className="p-3.5 font-bold">Mã</th>
                        <th className="p-3.5 font-bold">Loại Sân</th>
                        <th className="p-3.5 font-bold">Khung Thời Gian</th>
                        <th className="p-3.5 font-bold">Áp Dụng</th>
                        <th className="p-3.5 font-bold">Đơn Giá / 90 Phút</th>
                        <th className="p-3.5 font-bold text-right">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {priceList.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-800/20 transition-colors">
                          <td className="p-3.5 font-mono text-emerald-500 font-bold">#{item.id}</td>
                          <td className="p-3.5 font-bold">{item.ten_loai}</td>
                          <td className="p-3.5 font-mono font-semibold">{item.gio_bat_dau} - {item.gio_ket_thuc}</td>
                          <td className="p-3.5">
                            {item.la_cuoi_tuan ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                Cuối Tuần (T7 - CN)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                                Ngày Thường (T2 - T6)
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 font-bold text-emerald-500 text-sm">
                            {item.don_gia.toLocaleString('vi-VN')} đ
                          </td>
                          <td className="p-3.5 text-right space-x-2">
                            <button
                              onClick={() => setPriceModal({ isOpen: true, mode: 'EDIT', data: item })}
                              className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors cursor-pointer"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePrice(item.id)}
                              className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
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
                TAB 5: DỊCH VỤ & NHẬP KHO (CRUD Dich_Vu & sp_NhapKhoDichVu)
                ================================================================= */}
            {activeTab === 'SERVICES_INVENTORY' && (
              <div className={`p-6 rounded-3xl border shadow-xl ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 gap-4 border-b border-slate-800/60">
                  <div>
                    <h3 className="text-lg font-black flex items-center gap-2">
                      <Coffee className="w-5 h-5 text-emerald-500" />
                      Quản Lý Dịch Vụ & Nhập Xuất Kho (Bảng Dich_Vu & Phieu_Nhap_Kho)
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Quản lý các mặt hàng nước giải khát, thuê áo bib, giày thi đấu và lịch sử nhập kho</p>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      onClick={() => setServiceModal({ isOpen: true, mode: 'ADD', data: { don_vi_tinh: 'Chai', ton_kho: 50 } })}
                      className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:from-emerald-400 hover:to-teal-300 shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      Thêm Mặt Hàng
                    </button>
                  </div>
                </div>

                {/* BẢNG DỊCH VỤ */}
                <div className="overflow-x-auto mt-6">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className={`border-b ${isDarkMode ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        <th className="p-3.5 font-bold">Mã</th>
                        <th className="p-3.5 font-bold">Tên Dịch Vụ / Hàng Hóa</th>
                        <th className="p-3.5 font-bold">Đơn Giá Bán</th>
                        <th className="p-3.5 font-bold">Đơn Vị Tính</th>
                        <th className="p-3.5 font-bold">Tồn Kho Hiện Tại</th>
                        <th className="p-3.5 font-bold text-right">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {serviceList.map((dv) => (
                        <tr key={dv.id} className="hover:bg-slate-800/20 transition-colors">
                          <td className="p-3.5 font-mono text-emerald-500 font-bold">#{dv.id}</td>
                          <td className="p-3.5 font-bold">{dv.ten_dich_vu}</td>
                          <td className="p-3.5 font-black text-emerald-500">{dv.don_gia.toLocaleString('vi-VN')} đ</td>
                          <td className="p-3.5">{dv.don_vi_tinh}</td>
                          <td className="p-3.5">
                            <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                              dv.ton_kho > 20 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                            }`}>
                              {dv.ton_kho} {dv.don_vi_tinh}
                            </span>
                          </td>
                          <td className="p-3.5 text-right space-x-2">
                            {/* Nút Nhập kho */}
                            <button
                              onClick={() => setImportStockModal({ isOpen: true, dichVu: dv, soLuongNhap: 20, giaNhap: Math.round(dv.don_gia * 0.7) })}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                              title="Nhập thêm kho"
                            >
                              <PackagePlus className="w-3.5 h-3.5" />
                              Nhập Kho
                            </button>
                            <button
                              onClick={() => setServiceModal({ isOpen: true, mode: 'EDIT', data: dv })}
                              className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors cursor-pointer"
                            >
                              <Edit className="w-4 h-4" />
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
                TAB 6: QUẢN LÝ TÀI KHOẢN NGƯỜI DÙNG (Nguoi_Dung)
                ================================================================= */}
            {activeTab === 'USER_MANAGEMENT' && (
              <div className={`p-6 rounded-3xl border shadow-xl ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 gap-4 border-b border-slate-800/60">
                  <div>
                    <h3 className="text-lg font-black flex items-center gap-2">
                      <Users className="w-5 h-5 text-emerald-500" />
                      Quản Lý Tài Khoản & Phân Quyền (Bảng Nguoi_Dung)
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Quản lý thông tin, phân quyền vai trò ADMIN, NHAN_VIEN, KHACH_HANG (sp_ThemNguoiDung)</p>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      onClick={() => setUserModal({ isOpen: true, mode: 'ADD', data: { vai_tro: 'KHACH_HANG' } })}
                      className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:from-emerald-400 hover:to-teal-300 shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      Tạo Tài Khoản
                    </button>
                  </div>
                </div>

                {/* BẢNG NGƯỜI DÙNG */}
                <div className="overflow-x-auto mt-6">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className={`border-b ${isDarkMode ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        <th className="p-3.5 font-bold">Mã</th>
                        <th className="p-3.5 font-bold">Họ Và Tên</th>
                        <th className="p-3.5 font-bold">Email</th>
                        <th className="p-3.5 font-bold">Số Điện Thoại</th>
                        <th className="p-3.5 font-bold">Vai Trò</th>
                        <th className="p-3.5 font-bold">Ngày Tạo</th>
                        <th className="p-3.5 font-bold text-right">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {userList.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-800/20 transition-colors">
                          <td className="p-3.5 font-mono text-emerald-500 font-bold">#{u.id}</td>
                          <td className="p-3.5 font-bold">{u.ho_ten}</td>
                          <td className="p-3.5 font-mono">{u.email}</td>
                          <td className="p-3.5 font-mono">{u.so_dien_thoai || '---'}</td>
                          <td className="p-3.5">
                            {u.vai_tro === 'ADMIN' && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                QUẢN TRỊ VIÊN
                              </span>
                            )}
                            {u.vai_tro === 'NHAN_VIEN' && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                NHÂN VIÊN
                              </span>
                            )}
                            {u.vai_tro === 'KHACH_HANG' && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300">
                                KHÁCH HÀNG
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-slate-400">{u.ngay_tao}</td>
                          <td className="p-3.5 text-right space-x-2">
                            <button
                              onClick={() => setUserModal({ isOpen: true, mode: 'EDIT', data: u })}
                              className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors cursor-pointer"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id, u.ho_ten)}
                              className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
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
                TAB 7: BÁO CÁO DOANH THU & THỐNG KÊ (sp_BaoCaoDoanhThu)
                ================================================================= */}
            {activeTab === 'REVENUE_REPORT' && (
              <div className="space-y-6">
                <div className={`p-6 rounded-3xl border shadow-xl ${
                  isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center justify-between pb-6 border-b border-slate-800/60">
                    <div>
                      <h3 className="text-lg font-black flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-emerald-500" />
                        Báo Cáo Doanh Thu Theo Khoảng Thời Gian (sp_BaoCaoDoanhThu)
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">Thống kê chi tiết doanh thu tiền sân, tiền dịch vụ và tiền hoàn cọc</p>
                    </div>

                    <button
                      onClick={() => setToastMessage({ type: 'success', message: '📥 Đã xuất báo cáo doanh thu ra file Excel thành công!' })}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      Xuất File Báo Cáo
                    </button>
                  </div>

                  {/* Chi tiết đơn đã hoàn thành */}
                  <div className="overflow-x-auto mt-6">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className={`border-b ${isDarkMode ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                          <th className="p-3.5 font-bold">Mã Đơn</th>
                          <th className="p-3.5 font-bold">Khách Hàng</th>
                          <th className="p-3.5 font-bold">Sân Đá</th>
                          <th className="p-3.5 font-bold">Khung Giờ</th>
                          <th className="p-3.5 font-bold">Tiền Sân</th>
                          <th className="p-3.5 font-bold">Dịch Vụ Kèm</th>
                          <th className="p-3.5 font-bold">Tổng Thanh Toán</th>
                          <th className="p-3.5 font-bold">Trạng Thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {bookingList.map((b) => (
                          <tr key={b.id} className="hover:bg-slate-800/20 transition-colors">
                            <td className="p-3.5 font-mono text-emerald-500 font-bold">#{b.id}</td>
                            <td className="p-3.5 font-bold">{b.ten_khach_hang}</td>
                            <td className="p-3.5">{b.ten_san}</td>
                            <td className="p-3.5 font-mono">{b.gio_bat_dau} - {b.gio_ket_thuc}</td>
                            <td className="p-3.5">{b.tien_san.toLocaleString('vi-VN')} đ</td>
                            <td className="p-3.5">
                              {b.dich_vu_da_dung.length > 0
                                ? b.dich_vu_da_dung.map((d) => `${d.ten_dich_vu} (x${d.so_luong})`).join(', ')
                                : '---'}
                            </td>
                            <td className="p-3.5 font-black text-emerald-500">{b.tong_tien.toLocaleString('vi-VN')} đ</td>
                            <td className="p-3.5">
                              {b.trang_thai === 'HOAN_THANH' && (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                                  HOÀN THÀNH
                                </span>
                              )}
                              {b.trang_thai === 'DA_CHOT' && (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400">
                                  ĐANG ĐÁ
                                </span>
                              )}
                              {b.trang_thai === 'CHO_XAC_NHAN' && (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400">
                                  GIỮ CHỖ
                                </span>
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

          </div>
        </div>

      </div>

      {/* =====================================================================
          4. CÁC CỬA SỔ POPUP MODAL (CRUD & CHECKOUT MODALS)
          ===================================================================== */}

      {/* MODAL 1: THÊM / SỬA SÂN BÓNG */}
      {courtModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h4 className="text-base font-black flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-500" />
                {courtModal.mode === 'ADD' ? 'Thêm Sân Bóng Mới' : 'Chỉnh Sửa Sân Bóng'}
              </h4>
              <button onClick={() => setCourtModal({ ...courtModal, isOpen: false })} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCourt} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-bold block mb-1">Tên Sân Bóng *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Sân 5D (VIP)"
                  value={courtModal.data.ten_san || ''}
                  onChange={(e) => setCourtModal({ ...courtModal, data: { ...courtModal.data, ten_san: e.target.value } })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:border-emerald-500 ${
                    isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Loại Sân Thể Thao *</label>
                <select
                  value={courtModal.data.ma_loai_san || 1}
                  onChange={(e) => setCourtModal({ ...courtModal, data: { ...courtModal.data, ma_loai_san: Number(e.target.value) } })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:border-emerald-500 ${
                    isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                >
                  {categoryList.map((loai) => (
                    <option key={loai.id} value={loai.id}>
                      {loai.ten_loai}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">Trạng Thái</label>
                <select
                  value={courtModal.data.trang_thai || 'SAN_SANG'}
                  onChange={(e) => setCourtModal({ ...courtModal, data: { ...courtModal.data, trang_thai: e.target.value as any } })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:border-emerald-500 ${
                    isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                >
                  <option value="SAN_SANG">SẴN SÀNG HOẠT ĐỘNG</option>
                  <option value="BAO_TRI">ĐANG BẢO TRÌ SÂN</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setCourtModal({ ...courtModal, isOpen: false })}
                  className="px-4 py-2.5 rounded-xl font-bold bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl font-black bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:from-emerald-400 hover:to-teal-300 shadow-md shadow-emerald-500/20"
                >
                  Lưu Sân Bóng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: THÊM / SỬA KHUNG GIỜ GIÁ */}
      {priceModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h4 className="text-base font-black flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-500" />
                {priceModal.mode === 'ADD' ? 'Thêm Khung Giờ Giá Mới' : 'Cập Nhật Khung Giờ Giá'}
              </h4>
              <button onClick={() => setPriceModal({ ...priceModal, isOpen: false })} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePrice} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-bold block mb-1">Loại Sân Áp Dụng *</label>
                <select
                  value={priceModal.data.ma_loai_san || 1}
                  onChange={(e) => setPriceModal({ ...priceModal, data: { ...priceModal.data, ma_loai_san: Number(e.target.value) } })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300'}`}
                >
                  {categoryList.map((loai) => (
                    <option key={loai.id} value={loai.id}>
                      {loai.ten_loai}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Giờ Bắt Đầu</label>
                  <input
                    type="time"
                    required
                    value={priceModal.data.gio_bat_dau || '16:30'}
                    onChange={(e) => setPriceModal({ ...priceModal, data: { ...priceModal.data, gio_bat_dau: e.target.value } })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300'}`}
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Giờ Kết Thúc</label>
                  <input
                    type="time"
                    required
                    value={priceModal.data.gio_ket_thuc || '21:00'}
                    onChange={(e) => setPriceModal({ ...priceModal, data: { ...priceModal.data, gio_ket_thuc: e.target.value } })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300'}`}
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Đơn Giá Cho Khung Giờ Này (đ/90p) *</label>
                <input
                  type="number"
                  step="10000"
                  required
                  value={priceModal.data.don_gia || 350000}
                  onChange={(e) => setPriceModal({ ...priceModal, data: { ...priceModal.data, don_gia: Number(e.target.value) } })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300'}`}
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="cuoi_tuan"
                  checked={!!priceModal.data.la_cuoi_tuan}
                  onChange={(e) => setPriceModal({ ...priceModal, data: { ...priceModal.data, la_cuoi_tuan: e.target.checked } })}
                  className="rounded"
                />
                <label htmlFor="cuoi_tuan" className="font-bold">Áp dụng cho ngày cuối tuần (Thứ 7 & Chủ Nhật)</label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setPriceModal({ ...priceModal, isOpen: false })}
                  className="px-4 py-2.5 rounded-xl font-bold bg-slate-800 text-slate-300"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl font-black bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md shadow-emerald-500/20"
                >
                  Lưu Khung Giá
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: THÊM / SỬA DỊCH VỤ */}
      {serviceModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h4 className="text-base font-black flex items-center gap-2">
                <Coffee className="w-5 h-5 text-emerald-500" />
                {serviceModal.mode === 'ADD' ? 'Thêm Mặt Hàng Dịch Vụ Mới' : 'Cập Nhật Dịch Vụ'}
              </h4>
              <button onClick={() => setServiceModal({ ...serviceModal, isOpen: false })} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-bold block mb-1">Tên Dịch Vụ / Hàng Hóa *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Nước tăng lực RedBull"
                  value={serviceModal.data.ten_dich_vu || ''}
                  onChange={(e) => setServiceModal({ ...serviceModal, data: { ...serviceModal.data, ten_dich_vu: e.target.value } })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300'}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Đơn Giá Bán (đ) *</label>
                  <input
                    type="number"
                    step="1000"
                    required
                    value={serviceModal.data.don_gia || 20000}
                    onChange={(e) => setServiceModal({ ...serviceModal, data: { ...serviceModal.data, don_gia: Number(e.target.value) } })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300'}`}
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Đơn Vị Tính *</label>
                  <input
                    type="text"
                    required
                    placeholder="Chai / Lon / Đôi"
                    value={serviceModal.data.don_vi_tinh || 'Chai'}
                    onChange={(e) => setServiceModal({ ...serviceModal, data: { ...serviceModal.data, don_vi_tinh: e.target.value } })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300'}`}
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Tồn Kho Ban Đầu</label>
                <input
                  type="number"
                  value={serviceModal.data.ton_kho || 0}
                  onChange={(e) => setServiceModal({ ...serviceModal, data: { ...serviceModal.data, ton_kho: Number(e.target.value) } })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300'}`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setServiceModal({ ...serviceModal, isOpen: false })}
                  className="px-4 py-2.5 rounded-xl font-bold bg-slate-800 text-slate-300"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl font-black bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md shadow-emerald-500/20"
                >
                  Lưu Dịch Vụ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: NHẬP KHO DỊCH VỤ (sp_NhapKhoDichVu) */}
      {importStockModal.isOpen && importStockModal.dichVu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h4 className="text-base font-black flex items-center gap-2 text-emerald-500">
                <PackagePlus className="w-5 h-5" />
                Phiếu Nhập Kho Hàng Hóa (sp_NhapKhoDichVu)
              </h4>
              <button onClick={() => setImportStockModal({ ...importStockModal, isOpen: false })} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleImportStock} className="space-y-4 mt-4 text-xs">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <p className="font-bold text-sm">{importStockModal.dichVu.ten_dich_vu}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Tồn kho hiện tại: {importStockModal.dichVu.ton_kho} {importStockModal.dichVu.don_vi_tinh}</p>
              </div>

              <div>
                <label className="font-bold block mb-1">Số Lượng Nhập Thêm *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={importStockModal.soLuongNhap}
                  onChange={(e) => setImportStockModal({ ...importStockModal, soLuongNhap: Number(e.target.value) })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-bold ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300'}`}
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Giá Nhập Vào (đ/đơn vị) *</label>
                <input
                  type="number"
                  step="1000"
                  required
                  value={importStockModal.giaNhap}
                  onChange={(e) => setImportStockModal({ ...importStockModal, giaNhap: Number(e.target.value) })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300'}`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setImportStockModal({ ...importStockModal, isOpen: false })}
                  className="px-4 py-2.5 rounded-xl font-bold bg-slate-800 text-slate-300"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl font-black bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md shadow-emerald-500/20"
                >
                  Xác Nhận Nhập Kho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: THÊM / SỬA NGƯỜI DÙNG */}
      {userModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h4 className="text-base font-black flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-500" />
                {userModal.mode === 'ADD' ? 'Tạo Tài Khoản Người Dùng Mới' : 'Cập Nhật Tài Khoản'}
              </h4>
              <button onClick={() => setUserModal({ ...userModal, isOpen: false })} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-bold block mb-1">Họ Và Tên *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Nguyễn Văn A"
                  value={userModal.data.ho_ten || ''}
                  onChange={(e) => setUserModal({ ...userModal, data: { ...userModal.data, ho_ten: e.target.value } })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300'}`}
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Địa Chỉ Email *</label>
                <input
                  type="email"
                  required
                  placeholder="name@gmail.com"
                  value={userModal.data.email || ''}
                  onChange={(e) => setUserModal({ ...userModal, data: { ...userModal.data, email: e.target.value } })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300'}`}
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Số Điện Thoại</label>
                <input
                  type="tel"
                  placeholder="0912345678"
                  value={userModal.data.so_dien_thoai || ''}
                  onChange={(e) => setUserModal({ ...userModal, data: { ...userModal.data, so_dien_thoai: e.target.value } })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300'}`}
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Phân Quyền Vai Trò *</label>
                <select
                  value={userModal.data.vai_tro || 'KHACH_HANG'}
                  onChange={(e) => setUserModal({ ...userModal, data: { ...userModal.data, vai_tro: e.target.value as any } })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300'}`}
                >
                  <option value="KHACH_HANG">KHÁCH HÀNG (ĐẶT SÂN)</option>
                  <option value="NHAN_VIEN">NHÂN VIÊN QUẢN LÝ</option>
                  <option value="ADMIN">QUẢN TRỊ VIÊN TOÀN QUYỀN</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setUserModal({ ...userModal, isOpen: false })}
                  className="px-4 py-2.5 rounded-xl font-bold bg-slate-800 text-slate-300"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl font-black bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md shadow-emerald-500/20"
                >
                  Lưu Tài Khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: MINI POS (BÁN NƯỚC/DỊCH VỤ VÀO ĐƠN ĐANG ĐÁ - sp_ThemDichVu) */}
      {miniPosModal.isOpen && miniPosModal.booking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h4 className="text-base font-black flex items-center gap-2 text-emerald-500">
                <Coffee className="w-5 h-5" />
                Mini POS - Bán Nước & Dịch Vụ Vào Đơn #{miniPosModal.booking.id}
              </h4>
              <button onClick={() => setMiniPosModal({ ...miniPosModal, isOpen: false })} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddServiceToBooking} className="space-y-4 mt-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <p className="text-slate-400">Khách hàng: <strong className="text-white">{miniPosModal.booking.ten_khach_hang}</strong></p>
                <p className="text-slate-400 mt-1">Sân: <strong className="text-emerald-400">{miniPosModal.booking.ten_san}</strong> ({miniPosModal.booking.gio_bat_dau} - {miniPosModal.booking.gio_ket_thuc})</p>
              </div>

              <div>
                <label className="font-bold block mb-1">Chọn Dịch Vụ / Nước Uống *</label>
                <select
                  value={miniPosModal.maDichVuChon}
                  onChange={(e) => setMiniPosModal({ ...miniPosModal, maDichVuChon: Number(e.target.value) })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300'}`}
                >
                  {serviceList.map((dv) => (
                    <option key={dv.id} value={dv.id}>
                      {dv.ten_dich_vu} - {dv.don_gia.toLocaleString('vi-VN')} đ (Tồn: {dv.ton_kho})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">Số Lượng Mua *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={miniPosModal.soLuong}
                  onChange={(e) => setMiniPosModal({ ...miniPosModal, soLuong: Number(e.target.value) })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-bold ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300'}`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setMiniPosModal({ ...miniPosModal, isOpen: false })}
                  className="px-4 py-2.5 rounded-xl font-bold bg-slate-800 text-slate-300"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl font-black bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md shadow-emerald-500/20"
                >
                  + Thêm Vào Hóa Đơn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 7: TRẢ SÂN & XUẤT HÓA ĐƠN CHECK-OUT (sp_ThanhToanDon) */}
      {checkoutModal.isOpen && checkoutModal.booking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className={`w-full max-w-lg p-6 rounded-3xl border shadow-2xl my-8 ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-500" />
                <h4 className="text-base font-black">Hóa Đơn Thanh Toán & Trả Sân</h4>
              </div>
              <button onClick={() => setCheckoutModal({ ...checkoutModal, isOpen: false })} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCheckout} className="space-y-4 mt-4 text-xs">
              {/* Tóm tắt thông tin trận đấu */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Khách hàng:</span>
                  <span className="font-bold text-white">{checkoutModal.booking.ten_khach_hang} ({checkoutModal.booking.so_dien_thoai})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Sân thi đấu:</span>
                  <span className="font-bold text-emerald-400">{checkoutModal.booking.ten_san}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Khung giờ:</span>
                  <span className="font-mono text-slate-300">{checkoutModal.booking.gio_bat_dau} - {checkoutModal.booking.gio_ket_thuc}</span>
                </div>
              </div>

              {/* Danh sách dịch vụ phát sinh */}
              <div>
                <label className="font-bold block mb-2 text-slate-300 uppercase tracking-wider text-[11px]">Dịch Vụ Phát Sinh</label>
                {checkoutModal.booking.dich_vu_da_dung.length === 0 ? (
                  <p className="text-slate-500 italic">Không có dịch vụ phát sinh nào.</p>
                ) : (
                  <div className="space-y-1.5">
                    {checkoutModal.booking.dich_vu_da_dung.map((dv, idx) => (
                      <div key={idx} className="flex justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                        <span>{dv.ten_dich_vu} (x{dv.so_luong})</span>
                        <span className="font-bold">{(dv.so_luong * dv.gia_luc_ban).toLocaleString('vi-VN')} đ</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bảng tính tổng tiền */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>Tiền thuê sân:</span>
                  <span>{checkoutModal.booking.tien_san.toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Tổng tiền dịch vụ:</span>
                  <span>{(checkoutModal.booking.tong_tien - checkoutModal.booking.tien_san).toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-semibold border-t border-slate-800 pt-1.5">
                  <span>Tiền cọc đã nhận trước:</span>
                  <span>- {checkoutModal.booking.tien_coc_da_tra.toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="flex justify-between text-base font-black text-white border-t border-slate-800 pt-2">
                  <span>SỐ TIỀN CÒN LẠI CẦN THU:</span>
                  <span className="text-emerald-400 text-lg">
                    {Math.max(0, checkoutModal.booking.tong_tien - checkoutModal.booking.tien_coc_da_tra).toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>

              {/* Hình thức thanh toán */}
              <div>
                <label className="font-bold block mb-2 text-slate-300 uppercase tracking-wider text-[11px]">Hình Thức Thanh Toán</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'TIEN_MAT', label: 'Tiền Mặt', icon: '💵' },
                    { id: 'VNPAY', label: 'VNPay QR', icon: '🏧' },
                    { id: 'MOMO', label: 'Ví MoMo', icon: '📱' }
                  ].map((method) => (
                    <button
                      type="button"
                      key={method.id}
                      onClick={() => setCheckoutModal({ ...checkoutModal, paymentMethod: method.id as any })}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        checkoutModal.paymentMethod === method.id
                          ? 'bg-emerald-500/20 border-emerald-500 text-white font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="text-xl mb-0.5">{method.icon}</div>
                      <div className="text-[11px]">{method.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setCheckoutModal({ ...checkoutModal, isOpen: false })}
                  className="px-4 py-2.5 rounded-xl font-bold bg-slate-800 text-slate-300"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl font-black bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:from-emerald-400 hover:to-teal-300 shadow-lg shadow-emerald-500/25 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  Xác Nhận Thu Tiền & Xuất Hóa Đơn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
