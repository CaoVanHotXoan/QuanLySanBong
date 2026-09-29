import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
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
  CreditCard,
  DollarSign,
  Activity,
  SlidersHorizontal,
  ChevronDown,
  Sun,
  Moon
} from 'lucide-react';

// =====================================================================
// 1. ĐỊNH NGHĨA INTERFACES & KIỂU DỮ LIỆU (MAPPING TỪ DATABASE SQL SERVER)
// =====================================================================

/**
 * Interface Loại Sân - Tương ứng bảng Loai_San trong CSDL
 * Mapping: id, ten_loai, mo_ta, gia_co_ban, trang_thai
 */
interface LoaiSan {
  id: number;
  ten_loai: string;
  mo_ta: string;
  gia_co_ban: number;
}

/**
 * Interface Sân Bóng - Tương ứng bảng San_Bong & sp_LayDanhSachSan
 * Mapping: id, ma_loai_san, ten_san, hinh_anh, trang_thai ('SAN_SANG' | 'BAO_TRI')
 */
interface SanBong {
  id: number;
  ma_loai_san: number;
  ten_san: string;
  ten_loai: string;
  trang_thai: 'SAN_SANG' | 'BAO_TRI';
}

/**
 * Trạng thái slot giờ đá (Mapping từ Don_Dat_San và sp_LayLichSan):
 * - TRONG (Xanh lá): Sân còn trống, khách có thể click đặt sân ngay
 * - CHO_XAC_NHAN (Vàng): Đang có khách giữ chỗ, chờ duyệt cọc (Trong vòng 15-30 phút)
 * - DA_CHOT (Đỏ): Đã thanh toán cọc/chốt lịch hoặc đã hoàn thành, không thể đặt
 */
type TrangThaiSlot = 'TRONG' | 'CHO_XAC_NHAN' | 'DA_CHOT';

interface SlotLichSan {
  ma_san: number;
  gio_bat_dau: string; // VD: '15:00'
  gio_ket_thuc: string; // VD: '16:30'
  trang_thai: TrangThaiSlot;
  ma_don_dat?: number;
  ten_khach_hang?: string;
  gia_ap_dung: number;
}

/**
 * Interface Dịch Vụ Đi Kèm - Tương ứng bảng Dich_Vu
 */
interface DichVu {
  id: number;
  ten_dich_vu: string;
  don_gia: number;
  don_vi_tinh: string;
  ton_kho: number;
  icon: string;
}

/**
 * Interface Khung Giờ & Bảng Giá - Tương ứng bảng Khung_Gio_Gia
 */
interface BangGiaKhungGio {
  id: number;
  ten_loai: string;
  gio_thuong: string;
  gia_thuong: number;
  gio_vang: string;
  gia_vang: number;
  gia_cuoi_tuan: number;
}

// =====================================================================
// 2. DỮ LIỆU MOCK KHỞI TẠO (GIẢ LẬP KẾT QUẢ TỪ BACKEND & STORED PROCEDURES)
// =====================================================================

const MOCK_LOAI_SAN: LoaiSan[] = [
  { id: 1, ten_loai: 'Sân 5 người', mo_ta: 'Cỏ nhân tạo FIFA tiêu chuẩn, hệ thống đèn LED chống chói', gia_co_ban: 250000 },
  { id: 2, ten_loai: 'Sân 7 người', mo_ta: 'Mặt cỏ mềm cao cấp, khu vực khán đài rộng rãi', gia_co_ban: 450000 },
  { id: 3, ten_loai: 'Sân Pickleball', mo_ta: 'Mặt sân cao su chuẩn quốc tế, lưới và vạch kẻ chuẩn thi đấu', gia_co_ban: 180000 },
  { id: 4, ten_loai: 'Sân Cầu lông', mo_ta: 'Sàn gỗ chuyên dụng trong nhà, chống trơn trượt tối đa', gia_co_ban: 120000 },
];

const MOCK_SAN_BONG: SanBong[] = [
  { id: 1, ma_loai_san: 1, ten_san: 'Sân 5A (Cỏ nhân tạo)', ten_loai: 'Sân 5 người', trang_thai: 'SAN_SANG' },
  { id: 2, ma_loai_san: 1, ten_san: 'Sân 5B (Cỏ nhân tạo)', ten_loai: 'Sân 5 người', trang_thai: 'SAN_SANG' },
  { id: 3, ma_loai_san: 1, ten_san: 'Sân 5C (VIP)', ten_loai: 'Sân 5 người', trang_thai: 'SAN_SANG' },
  { id: 4, ma_loai_san: 2, ten_san: 'Sân 7A (Sân lớn)', ten_loai: 'Sân 7 người', trang_thai: 'SAN_SANG' },
  { id: 5, ma_loai_san: 2, ten_san: 'Sân 7B (Sân lớn)', ten_loai: 'Sân 7 người', trang_thai: 'SAN_SANG' },
  { id: 6, ma_loai_san: 3, ten_san: 'Pickleball 01 (Indoor)', ten_loai: 'Sân Pickleball', trang_thai: 'SAN_SANG' },
  { id: 7, ma_loai_san: 3, ten_san: 'Pickleball 02 (Outdoor)', ten_loai: 'Sân Pickleball', trang_thai: 'SAN_SANG' },
  { id: 8, ma_loai_san: 4, ten_san: 'Cầu lông 01 (Trong nhà)', ten_loai: 'Sân Cầu lông', trang_thai: 'SAN_SANG' },
];

const MOCK_TIME_SLOTS = [
  { start: '15:00', end: '16:30', isGold: false },
  { start: '16:30', end: '18:00', isGold: true },
  { start: '18:00', end: '19:30', isGold: true },
  { start: '19:30', end: '21:00', isGold: true },
  { start: '21:00', end: '22:30', isGold: false },
];

// Tạo mock lịch đặt sân ban đầu với đủ 3 trạng thái Xanh/Vàng/Đỏ
const generateInitialGridSlots = (): Record<string, SlotLichSan> => {
  const grid: Record<string, SlotLichSan> = {};

  MOCK_SAN_BONG.forEach((san) => {
    MOCK_TIME_SLOTS.forEach((slot, index) => {
      const key = `${san.id}_${slot.start}`;
      // Giả lập phân bổ trạng thái trực quan
      let trangThai: TrangThaiSlot = 'TRONG';
      let khachHang = '';

      if (san.id === 1 && slot.start === '18:00') {
        trangThai = 'DA_CHOT';
        khachHang = 'FC Anh Em (Nguyễn Văn A)';
      } else if (san.id === 1 && slot.start === '19:30') {
        trangThai = 'CHO_XAC_NHAN';
        khachHang = 'Trần Hải Đăng (Đang cọc)';
      } else if (san.id === 4 && slot.start === '18:00') {
        trangThai = 'DA_CHOT';
        khachHang = 'CLB Doanh Nhân Trẻ';
      } else if (san.id === 6 && slot.start === '16:30') {
        trangThai = 'DA_CHOT';
        khachHang = 'Hội Pickleball SG';
      } else if (san.id === 2 && slot.start === '19:30') {
        trangThai = 'CHO_XAC_NHAN';
        khachHang = 'FC IT Lương Sơn';
      } else if (index === 2 && san.id % 2 === 0) {
        trangThai = 'DA_CHOT';
        khachHang = 'Khách đặt qua Hotline';
      }

      const loai = MOCK_LOAI_SAN.find((l) => l.id === san.ma_loai_san);
      const giaCoBan = loai ? loai.gia_co_ban : 200000;
      const giaApDung = slot.isGold ? Math.round(giaCoBan * 1.35) : giaCoBan;

      grid[key] = {
        ma_san: san.id,
        gio_bat_dau: slot.start,
        gio_ket_thuc: slot.end,
        trang_thai: trangThai,
        ten_khach_hang: khachHang,
        gia_ap_dung: giaApDung,
      };
    });
  });

  return grid;
};

const MOCK_DICH_VU: DichVu[] = [
  { id: 1, ten_dich_vu: 'Nước lọc / Nước suối Aquafina', don_gia: 10000, don_vi_tinh: 'Chai', ton_kho: 150, icon: 'water' },
  { id: 2, ten_dich_vu: 'Nước tăng lực Revive chanh muối', don_gia: 20000, don_vi_tinh: 'Chai', ton_kho: 80, icon: 'coffee' },
  { id: 3, ten_dich_vu: 'Nước điện giải Pocari Sweat', don_gia: 25000, don_vi_tinh: 'Chai', ton_kho: 60, icon: 'coffee' },
  { id: 4, ten_dich_vu: 'Thuê bộ áo Bib phân đội (10 áo)', don_gia: 30000, don_vi_tinh: 'Bộ / Trận', ton_kho: 20, icon: 'shirt' },
  { id: 5, ten_dich_vu: 'Thuê giày đá bóng sân cỏ nhân tạo', don_gia: 40000, don_vi_tinh: 'Đôi / Trận', ton_kho: 35, icon: 'shirt' },
  { id: 6, ten_dich_vu: 'Thuê trọng tài bắt trận chuyên nghiệp', don_gia: 200000, don_vi_tinh: 'Người / Trận', ton_kho: 5, icon: 'award' },
];

const MOCK_BANG_GIA: BangGiaKhungGio[] = [
  { id: 1, ten_loai: 'Sân Bóng Đá 5 Người', gio_thuong: '06:00 - 16:30 & 21:00 - 23:00', gia_thuong: 250000, gio_vang: '16:30 - 21:00 (Khung Giờ Vàng)', gia_vang: 350000, gia_cuoi_tuan: 380000 },
  { id: 2, ten_loai: 'Sân Bóng Đá 7 Người', gio_thuong: '06:00 - 16:30 & 21:00 - 23:00', gia_thuong: 450000, gio_vang: '16:30 - 21:00 (Khung Giờ Vàng)', gia_vang: 650000, gia_cuoi_tuan: 700000 },
  { id: 3, ten_loai: 'Sân Thể Thao Pickleball', gio_thuong: '06:00 - 16:30 & 21:00 - 23:00', gia_thuong: 180000, gio_vang: '16:30 - 21:00 (Khung Giờ Vàng)', gia_vang: 260000, gia_cuoi_tuan: 280000 },
  { id: 4, ten_loai: 'Sân Cầu Lông Trong Nhà', gio_thuong: '06:00 - 16:30 & 21:00 - 23:00', gia_thuong: 120000, gio_vang: '16:30 - 21:00 (Khung Giờ Vàng)', gia_vang: 180000, gia_cuoi_tuan: 200000 },
];

// =====================================================================
// 3. COMPONENT TRANG CHỦ CHÍNH (HOMEPAGE COMPONENT)
// =====================================================================

export default function HomePage() {
  // -------------------------------------------------------------
  // A. CÁC STATE QUẢN LÝ DỮ LIỆU & GIAO DIỆN
  // -------------------------------------------------------------

  // 0. State Chuyển đổi Giao diện Sáng / Tối (Light / Dark Mode)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // 1. State xác thực người dùng (JWT Auth):
  // Mô phỏng token lưu trong localStorage/Cookies và user profile từ Backend Express (sp_DangNhap / sp_LayThongTinNguoiDung)
  const [currentUser, setCurrentUser] = useState<{
    id: number;
    ho_ten: string;
    email: string;
    so_dien_thoai: string;
    vai_tro: string;
    anh_dai_dien?: string;
  } | null>({
    id: 1,
    ho_ten: 'Nguyễn Văn Đạt',
    email: 'vandat.soccer@gmail.com',
    so_dien_thoai: '0988776655',
    vai_tro: 'KHACH_HANG',
  });

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // State tìm kiếm nhanh tên sân tại Top Navbar
  const [searchCourtName, setSearchCourtName] = useState<string>('');

  // 2. State Bộ lọc Đặt sân nhanh (Hero Section Booking Bar):
  // Dùng để gọi API GET /api/dat-san/lich-san?ngay_da=...&ma_loai_san=... (sp_LayLichSan)
  const [filterLoaiSan, setFilterLoaiSan] = useState<string>('ALL');
  const [filterNgayDa, setFilterNgayDa] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [filterKhungGio, setFilterKhungGio] = useState<string>('ALL');

  // 3. State Lưới Lịch Sân Thời Gian Thực (Ma trận Grid Slot)
  const [gridSlots, setGridSlots] = useState<Record<string, SlotLichSan>>(generateInitialGridSlots);

  // 4. State Quản lý Modal Đặt Sân Tương Tác
  const [selectedSlot, setSelectedSlot] = useState<{
    san: SanBong;
    slot: { start: string; end: string; isGold: boolean };
    giaTien: number;
  } | null>(null);

  // Form thông tin khách đặt sân trong Modal
  const [bookingForm, setBookingForm] = useState({
    ho_ten: currentUser?.ho_ten || '',
    so_dien_thoai: currentUser?.so_dien_thoai || '',
    ghi_chu: '',
    phuong_thuc: 'VNPAY', // 'VNPAY' | 'MOMO' | 'TIEN_MAT'
    loai_thanh_toan: 'DAT_COC', // 'DAT_COC' (Cọc 30%) | 'TRA_HET' (100%)
    dich_vu_chon: {} as Record<number, number>, // ma_dich_vu -> so_luong
  });

  // State thông báo Toast & Trạng thái Loading
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Tự động đóng Toast sau 4 giây
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Cập nhật form khách hàng khi currentUser thay đổi
  useEffect(() => {
    if (currentUser) {
      setBookingForm((prev) => ({
        ...prev,
        ho_ten: currentUser.ho_ten,
        so_dien_thoai: currentUser.so_dien_thoai,
      }));
    }
  }, [currentUser]);

  // -------------------------------------------------------------
  // B. CÁC HÀM XỬ LÝ SỰ KIỆN & GỌI API BACKEND EXPRESS (JWT & STORED PROCEDURES)
  // -------------------------------------------------------------

  /**
   * Chú thích kiến trúc API:
   * Khi gọi Backend Express thật, ta sẽ truyền JWT token qua header:
   * Authorization: `Bearer ${localStorage.getItem('token')}`
   * 
   * Backend nhận request -> Xác thực verifyToken -> Lấy ma_nguoi_dung từ JWT ->
   * Thực thi Stored Procedure SQL Server tương ứng (sp_LayLichSan, sp_DatSan, sp_TaoThanhToan)
   */

  // Lọc danh sách sân theo loại sân và từ khóa tìm kiếm tên sân trên Top Header
  const filteredSanList = useMemo(() => {
    let list = MOCK_SAN_BONG;
    if (filterLoaiSan !== 'ALL') {
      list = list.filter((s) => s.ma_loai_san === Number(filterLoaiSan));
    }
    if (searchCourtName.trim()) {
      const q = searchCourtName.toLowerCase().trim();
      list = list.filter((s) => s.ten_san.toLowerCase().includes(q) || s.ten_loai.toLowerCase().includes(q));
    }
    return list;
  }, [filterLoaiSan, searchCourtName]);

  // Lọc danh sách khung giờ hiển thị trên ma trận
  const filteredTimeSlots = useMemo(() => {
    if (filterKhungGio === 'ALL') return MOCK_TIME_SLOTS;
    return MOCK_TIME_SLOTS.filter((s) => s.start === filterKhungGio);
  }, [filterKhungGio]);

  // Xử lý khi bấm nút "🔍 TÌM SÂN TRỐNG" tại Hero Section
  const handleSearchAvailableSlots = (e: React.FormEvent) => {
    e.preventDefault();
    setToastMessage({
      type: 'info',
      message: `Đang cập nhật lịch sân ngày ${filterNgayDa}... (Đồng bộ qua Stored Procedure sp_LayLichSan)`,
    });

    // Cuộn mượt xuống khu vực ma trận lịch sân
    const matrixElement = document.getElementById('ma-tran-lich-san');
    if (matrixElement) {
      matrixElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Mở Modal đặt sân khi click vào ô Slot Xanh Lá
  const handleSlotClick = (san: SanBong, slot: { start: string; end: string; isGold: boolean }) => {
    const slotData = gridSlots[`${san.id}_${slot.start}`];

    if (!slotData || slotData.trang_thai === 'TRONG') {
      const loai = MOCK_LOAI_SAN.find((l) => l.id === san.ma_loai_san);
      const giaCoBan = loai ? loai.gia_co_ban : 200000;
      const giaTien = slot.isGold ? Math.round(giaCoBan * 1.35) : giaCoBan;

      setSelectedSlot({
        san,
        slot,
        giaTien,
      });
      // Reset dịch vụ chọn
      setBookingForm((prev) => ({
        ...prev,
        dich_vu_chon: {},
      }));
    } else if (slotData.trang_thai === 'CHO_XAC_NHAN') {
      setToastMessage({
        type: 'info',
        message: `Khung giờ ${slot.start} - ${slot.end} của ${san.ten_san} đang có người giữ chỗ cọc. Vui lòng chọn ô khác hoặc quay lại sau 15 phút!`,
      });
    } else {
      setToastMessage({
        type: 'error',
        message: `Khung giờ ${slot.start} - ${slot.end} của ${san.ten_san} đã được chốt đặt. Vui lòng chọn khung giờ khác!`,
      });
    }
  };

  // Thay đổi số lượng dịch vụ chọn trong Modal
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

  // Tính toán tổng tiền: Tiền sân + Tổng tiền dịch vụ chọn thêm
  const { tongTienDichVu, tongTienDon, soTienThanhToan } = useMemo(() => {
    if (!selectedSlot) return { tongTienDichVu: 0, tongTienDon: 0, soTienThanhToan: 0 };

    let tienDv = 0;
    Object.entries(bookingForm.dich_vu_chon).forEach(([dvId, qty]) => {
      const dv = MOCK_DICH_VU.find((d) => d.id === Number(dvId));
      if (dv) {
        tienDv += dv.don_gia * qty;
      }
    });

    const tienSan = selectedSlot.giaTien;
    const tong = tienSan + tienDv;
    // Cọc 30% tổng đơn hoặc thanh toán đủ 100%
    const thanhToan = bookingForm.loai_thanh_toan === 'DAT_COC' ? Math.round(tong * 0.3) : tong;

    return {
      tongTienDichVu: tienDv,
      tongTienDon: tong,
      soTienThanhToan: thanhToan,
    };
  }, [selectedSlot, bookingForm.dich_vu_chon, bookingForm.loai_thanh_toan]);

  // Xử lý gửi đơn đặt sân (Giao tiếp API Backend Express -> sp_DatSan & sp_TaoThanhToan)
  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;

    if (!bookingForm.ho_ten.trim() || !bookingForm.so_dien_thoai.trim()) {
      setToastMessage({
        type: 'error',
        message: 'Vui lòng điền đầy đủ Họ tên và Số điện thoại liên hệ!',
      });
      return;
    }

    setIsSubmitting(true);

    // Giả lập độ trễ mạng xử lý 800ms
    setTimeout(() => {
      const slotKey = `${selectedSlot.san.id}_${selectedSlot.slot.start}`;

      // Cập nhật trạng thái slot thành VÀNG (Chờ duyệt cọc) hoặc ĐỎ nếu chuyển khoản thành công
      setGridSlots((prev) => ({
        ...prev,
        [slotKey]: {
          ma_san: selectedSlot.san.id,
          gio_bat_dau: selectedSlot.slot.start,
          gio_ket_thuc: selectedSlot.slot.end,
          trang_thai: bookingForm.loai_thanh_toan === 'DAT_COC' ? 'CHO_XAC_NHAN' : 'DA_CHOT',
          ten_khach_hang: bookingForm.ho_ten,
          gia_ap_dung: selectedSlot.giaTien,
        },
      }));

      setIsSubmitting(false);
      setSelectedSlot(null);

      setToastMessage({
        type: 'success',
        message: `🎉 Đặt sân thành công! Mã đơn của bạn đã được ghi nhận. Hệ thống đang giữ chỗ cho ${bookingForm.ho_ten}.`,
      });
    }, 800);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 font-sans selection:bg-emerald-500 selection:text-white ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      <Head>
        <title>Soccer247 - Hệ Thống Đặt Sân Thể Thao Trực Tuyến 24/7</title>
        <meta
          name="description"
          content="Đặt sân bóng đá cỏ nhân tạo 5 người, 7 người, Pickleball và Cầu lông chuyên nghiệp. Kiểm tra lịch sân trống thời gian thực, bảng giá minh bạch, cọc an toàn nhanh chóng."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* TOAST THÔNG BÁO NỔI */}
      {toastMessage && (
        <div
          className={`fixed top-28 right-5 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl border backdrop-blur-md transition-all duration-300 animate-slide-in ${
            toastMessage.type === 'success'
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
      <header className={`fixed top-0 left-0 right-0 z-40 backdrop-blur-xl border-b transition-colors duration-300 shadow-xl ${
        isDarkMode ? 'bg-slate-950/95 border-emerald-900/40' : 'bg-white/95 border-slate-200'
      }`}>
        
        {/* TẦNG 1: LOGO + KHUNG TÌM KIẾM TÊN SÂN + NÚT SÁNG/TỐI + ĐĂNG NHẬP/ĐĂNG KÝ */}
        <div className={`border-b transition-colors duration-300 ${
          isDarkMode ? 'border-slate-800/80 bg-slate-950/90' : 'border-slate-200 bg-white/90'
        }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-4">
            
            {/* Logo Thương Hiệu Bên Trái */}
            <a href="#" className="flex items-center gap-3 group shrink-0">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Activity className="w-5 h-5 text-slate-950 stroke-[2.5]" />
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center gap-1">
                  <span className={`text-xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>SOCCER</span>
                  <span className="text-xl font-black tracking-tight text-emerald-500">247</span>
                </div>
                <p className="text-[9px] uppercase font-bold tracking-widest text-emerald-600 dark:text-emerald-500/80 -mt-1">Sân Thể Thao 24/7</p>
              </div>
            </a>

            {/* KHUNG TÌM KIẾM TÊN SÂN Ở GIỮA */}
            <div className="flex-1 max-w-lg mx-1 sm:mx-4">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-emerald-500 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchCourtName}
                  onChange={(e) => setSearchCourtName(e.target.value)}
                  placeholder="Tìm kiếm tên sân (VD: Sân 5A, Sân 7, Pickleball...)"
                  className={`w-full pl-10 pr-10 py-2 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-1 transition-all ${
                    isDarkMode
                      ? 'bg-slate-900/90 border border-slate-700/80 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500'
                      : 'bg-slate-100/90 border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:ring-emerald-600'
                  }`}
                />
                {searchCourtName ? (
                  <button
                    onClick={() => setSearchCourtName('')}
                    className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <kbd className={`hidden lg:inline-block absolute right-3 px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                    isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-200 text-slate-600 border-slate-300'
                  }`}>
                    Live
                  </kbd>
                )}
              </div>
            </div>

            {/* CỤM NÚT PHẢI: NÚT SÁNG/TỐI (TẠI VỊ TRÍ KHOANH TRÒN) + ĐẶT SÂN NHANH + ĐĂNG NHẬP */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              
              {/* NÚT CHUYỂN ĐỔI CHẾ ĐỘ SÁNG / TỐI (THEME TOGGLE) */}
              <button
                type="button"
                onClick={() => setIsDarkMode(!isDarkMode)}
                title={isDarkMode ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
                className={`p-2 sm:p-2.5 rounded-2xl border transition-all duration-300 flex items-center justify-center group shadow-sm hover:scale-105 active:scale-95 cursor-pointer ${
                  isDarkMode
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

              {/* Nút Đặt sân nhanh */}
              <a
                href="#ma-tran-lich-san"
                className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:from-emerald-400 hover:to-teal-300 shadow-md shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
              >
                <Zap className="w-3.5 h-3.5 fill-slate-950" />
                <span>Đặt Sân Nhanh</span>
              </a>

              {/* Khu vực User Profile / Đăng nhập (Xác thực JWT Express) */}
              {currentUser ? (
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className={`flex items-center gap-2 p-1 sm:pr-3 rounded-full border transition-all ${
                      isDarkMode
                        ? 'bg-slate-900 border-emerald-800/50 hover:border-emerald-500/60'
                        : 'bg-slate-100 border-slate-300 hover:border-emerald-500'
                    }`}
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center font-bold text-slate-950 text-xs shadow-inner">
                      {currentUser.ho_ten.charAt(0)}
                    </div>
                    <div className="text-left hidden xl:block">
                      <p className={`text-xs font-semibold leading-tight ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{currentUser.ho_ten}</p>
                      <p className="text-[10px] text-emerald-500 font-mono leading-none">Khách hàng VIP</p>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                  </button>

                  {/* Dropdown Menu User */}
                  {userDropdownOpen && (
                    <div className={`absolute right-0 mt-3 w-56 rounded-2xl border shadow-2xl p-2 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 ${
                      isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                    }`}>
                      <div className={`px-3 py-2.5 border-b mb-1 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                        <p className="text-[11px] text-slate-400">Đã đăng nhập email:</p>
                        <p className="text-xs font-bold text-emerald-500 truncate">{currentUser.email}</p>
                      </div>
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          setToastMessage({ type: 'info', message: 'Mở trang Lịch sử đặt sân (kết nối endpoint GET /api/dat-san/lich-su)' });
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl transition-colors text-left ${
                          isDarkMode ? 'text-slate-300 hover:text-emerald-400 hover:bg-slate-800/60' : 'text-slate-700 hover:text-emerald-600 hover:bg-slate-100'
                        }`}
                      >
                        <History className="w-4 h-4 text-emerald-500" />
                        Lịch sử đặt sân
                      </button>
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          setToastMessage({ type: 'info', message: 'Mở trang Hồ sơ cá nhân (kết nối sp_LayThongTinNguoiDung)' });
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl transition-colors text-left ${
                          isDarkMode ? 'text-slate-300 hover:text-emerald-400 hover:bg-slate-800/60' : 'text-slate-700 hover:text-emerald-600 hover:bg-slate-100'
                        }`}
                      >
                        <User className="w-4 h-4 text-emerald-500" />
                        Thông tin tài khoản
                      </button>
                      <button
                        onClick={() => {
                          setCurrentUser(null);
                          setUserDropdownOpen(false);
                          setToastMessage({ type: 'info', message: 'Đã đăng xuất tài khoản và xóa JWT Token.' });
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-500 rounded-xl transition-colors text-left mt-1 border-t ${
                          isDarkMode ? 'hover:bg-rose-950/40 border-slate-800/60' : 'hover:bg-rose-50 border-slate-100'
                        }`}
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => {
                    setCurrentUser({
                      id: 1,
                      ho_ten: 'Nguyễn Văn Đạt',
                      email: 'vandat.soccer@gmail.com',
                      so_dien_thoai: '0988776655',
                      vai_tro: 'KHACH_HANG',
                    });
                    setToastMessage({ type: 'success', message: 'Đăng nhập thành công! Nhận JWT Token từ backend.' });
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                    isDarkMode
                      ? 'bg-slate-900 border-slate-700 text-slate-200 hover:border-emerald-500/50 hover:text-emerald-400'
                      : 'bg-white border-slate-300 text-slate-800 hover:border-emerald-500 hover:text-emerald-600 shadow-sm'
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Đăng nhập / Đăng ký</span>
                </button>
              )}
            </div>

          </div>
        </div>

        {/* TẦNG 2: THANH MENU ĐIỀU HƯỚNG CHÍNH (SUB-NAVBAR) */}
        <div className={`transition-colors duration-300 border-t ${
          isDarkMode ? 'bg-slate-950/70 border-slate-900' : 'bg-slate-100/80 border-slate-200'
        }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-11 flex items-center justify-between overflow-x-auto">
            
            {/* Danh sách liên kết Menu chính */}
            <nav className="flex items-center gap-1 sm:gap-2 shrink-0 py-1">
              <a
                href="#hero"
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  isDarkMode
                    ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 hover:bg-emerald-900/50'
                    : 'text-emerald-700 bg-emerald-100 border border-emerald-300 hover:bg-emerald-200'
                }`}
              >
                🏠 Trang chủ
              </a>
              <a
                href="#ma-tran-lich-san"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  isDarkMode ? 'text-slate-300 hover:text-emerald-400 hover:bg-slate-900/80' : 'text-slate-700 hover:text-emerald-600 hover:bg-slate-200'
                }`}
              >
                📅 Lịch sân theo giờ
              </a>
              <a
                href="#bang-gia"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  isDarkMode ? 'text-slate-300 hover:text-emerald-400 hover:bg-slate-900/80' : 'text-slate-700 hover:text-emerald-600 hover:bg-slate-200'
                }`}
              >
                💵 Bảng giá & Khung giờ
              </a>
              <a
                href="#dich-vu"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  isDarkMode ? 'text-slate-300 hover:text-emerald-400 hover:bg-slate-900/80' : 'text-slate-700 hover:text-emerald-600 hover:bg-slate-200'
                }`}
              >
                🥤 Dịch vụ tại sân
              </a>
              <a
                href="#chinh-sach-lien-he"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  isDarkMode ? 'text-slate-300 hover:text-emerald-400 hover:bg-slate-900/80' : 'text-slate-700 hover:text-emerald-600 hover:bg-slate-200'
                }`}
              >
                🛡️ Chính sách & Bản đồ
              </a>
            </nav>

            {/* Thông tin hỗ trợ nhanh bên phải menu tầng 2 */}
            <div className="hidden md:flex items-center gap-4 text-[11px] font-semibold text-slate-400 shrink-0">
              <span className={`flex items-center gap-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                <Phone className="w-3.5 h-3.5 text-emerald-500" />
                Hotline Đặt Sân: <strong className="text-emerald-500 font-mono">0909.123.456</strong>
              </span>
              <span className={isDarkMode ? 'text-slate-700' : 'text-slate-300'}>|</span>
              <span className="flex items-center gap-1 text-amber-500 font-bold">
                🔥 Giờ Vàng: 16h30 - 21h00
              </span>
            </div>

          </div>
        </div>

      </header>

      <main className="pt-28">
        {/* =====================================================================
            2. HERO SECTION (THANH ĐẶT SÂN NHANH TƯƠNG TÁC)
            ===================================================================== */}
        <section id="hero" className={`relative py-20 lg:py-28 overflow-hidden border-b transition-colors duration-300 ${
          isDarkMode
            ? 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/40 via-slate-950 to-slate-950 border-emerald-950/40'
            : 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100/60 via-slate-50 to-white border-slate-200'
        }`}>
          {/* Hiệu ứng nền thể thao */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0596690a_1px,transparent_1px),linear-gradient(to_bottom,#0596690a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {/* Tag thông báo nổi bật */}
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-6 backdrop-blur-md border ${
              isDarkMode
                ? 'bg-emerald-900/30 border-emerald-500/30 text-emerald-400'
                : 'bg-emerald-100 border-emerald-300 text-emerald-800'
            }`}>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Hệ Thống Đặt Sân Thể Thao Trực Tuyến Hàng Đầu
            </div>

            {/* Headline chính */}
            <h1 className={`text-4xl sm:text-6xl font-black tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}>
              Đặt Sân Thể Thao <span className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 bg-clip-text text-transparent">Nhanh Dễ Dàng</span>
              <br />
              <span className={`text-3xl sm:text-5xl font-extrabold mt-2 block ${
                isDarkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Chọn Giờ Vào Đá Ngay
              </span>
            </h1>

            <p className={`mt-6 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed ${
              isDarkMode ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Trực quan hóa ma trận lịch sân thời gian thực. Cỏ nhân tạo FIFA chuẩn thi đấu, đèn chiếu sáng 1000 Lux, giữ chỗ tự động không lo trùng lịch.
            </p>

            {/* BOOKING BAR NỔI BẬT Ở GIỮA */}
            <div className="mt-12 max-w-5xl mx-auto">
              <div className={`p-3 sm:p-4 rounded-3xl border shadow-2xl backdrop-blur-2xl transition-all ${
                isDarkMode
                  ? 'bg-slate-900/90 border-emerald-800/40 shadow-emerald-950/80'
                  : 'bg-white/95 border-emerald-200 shadow-slate-300/60'
              }`}>
                <form onSubmit={handleSearchAvailableSlots} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
                  
                  {/* Dropdown 1: Chọn Loại Sân (Bảng Loai_San) */}
                  <div className={`flex flex-col text-left p-3 rounded-2xl border transition-colors ${
                    isDarkMode ? 'bg-slate-950/80 border-slate-800 focus-within:border-emerald-500' : 'bg-slate-50 border-slate-200 focus-within:border-emerald-600'
                  }`}>
                    <label className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      Loại Sân Thể Thao
                    </label>
                    <select
                      value={filterLoaiSan}
                      onChange={(e) => setFilterLoaiSan(e.target.value)}
                      className={`mt-1 bg-transparent text-sm font-semibold focus:outline-none cursor-pointer ${
                        isDarkMode ? 'text-slate-100' : 'text-slate-900'
                      }`}
                    >
                      <option value="ALL" className={isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}>Tất cả môn (Sân 5, 7, Pickleball...)</option>
                      {MOCK_LOAI_SAN.map((loai) => (
                        <option key={loai.id} value={loai.id} className={isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}>
                          {loai.ten_loai}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Input 2: Ô chọn Ngày đá (ngay_da) */}
                  <div className={`flex flex-col text-left p-3 rounded-2xl border transition-colors ${
                    isDarkMode ? 'bg-slate-950/80 border-slate-800 focus-within:border-emerald-500' : 'bg-slate-50 border-slate-200 focus-within:border-emerald-600'
                  }`}>
                    <label className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Ngày Đá (ngay_da)
                    </label>
                    <input
                      type="date"
                      value={filterNgayDa}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setFilterNgayDa(e.target.value)}
                      className={`mt-1 bg-transparent text-sm font-semibold focus:outline-none cursor-pointer ${
                        isDarkMode ? 'text-slate-100' : 'text-slate-900'
                      }`}
                    />
                  </div>

                  {/* Dropdown 3: Dropdown chọn Khung giờ */}
                  <div className={`flex flex-col text-left p-3 rounded-2xl border transition-colors ${
                    isDarkMode ? 'bg-slate-950/80 border-slate-800 focus-within:border-emerald-500' : 'bg-slate-50 border-slate-200 focus-within:border-emerald-600'
                  }`}>
                    <label className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Khung Giờ Đá
                    </label>
                    <select
                      value={filterKhungGio}
                      onChange={(e) => setFilterKhungGio(e.target.value)}
                      className={`mt-1 bg-transparent text-sm font-semibold focus:outline-none cursor-pointer ${
                        isDarkMode ? 'text-slate-100' : 'text-slate-900'
                      }`}
                    >
                      <option value="ALL" className={isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}>Tất cả khung giờ trong ngày</option>
                      {MOCK_TIME_SLOTS.map((t) => (
                        <option key={t.start} value={t.start} className={isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}>
                          {t.start} - {t.end} {t.isGold ? '🔥 (Giờ Vàng)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Nút bấm [🔍 TÌM SÂN TRỐNG] */}
                  <button
                    type="submit"
                    className="w-full h-full py-4 px-6 rounded-2xl font-black text-sm bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:from-emerald-400 hover:to-teal-300 shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Search className="w-5 h-5 stroke-[2.5]" />
                    <span>TÌM SÂN TRỐNG</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Thống kê nhanh dưới Booking Bar */}
            <div className={`mt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-xs font-semibold ${
              isDarkMode ? 'text-slate-400' : 'text-slate-600'
            }`}>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Hoàn cọc 100% khi hủy trước 12h</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Thanh toán bảo mật VNPay / MoMo</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-500" />
                <span>Xác nhận tức thì không chờ đợi</span>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            3. MA TRẬN LỊCH SÂN THEO THỜI GIAN THỰC (SLOT GRID VISUALIZATION)
            ===================================================================== */}
        <section id="ma-tran-lich-san" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1">
                <Activity className="w-4 h-4" />
                Tính Năng Cốt Lõi Hệ Thống
              </div>
              <h2 className={`text-2xl sm:text-4xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Ma Trận Lịch Sân Theo Thời Gian Thực
              </h2>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Hiển thị dữ liệu trực quan từ Stored Procedure <code className={`font-mono px-1.5 py-0.5 rounded ${
                  isDarkMode ? 'text-emerald-400 bg-slate-900' : 'text-emerald-700 bg-slate-200'
                }`}>sp_LayLichSan</code>. Bấm vào ô xanh để đặt sân ngay.
              </p>
            </div>

            {/* Bảng chú giải màu sắc trạng thái */}
            <div className={`flex flex-wrap items-center gap-3 p-2.5 rounded-2xl border text-xs font-semibold ${
              isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/40 text-emerald-600 dark:text-emerald-300">
                <span className="w-3 h-3 rounded-md bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                <span>Sân Trống (Click Đặt)</span>
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/40 text-amber-600 dark:text-amber-300">
                <span className="w-3 h-3 rounded-md bg-amber-500 shadow-sm shadow-amber-500/50 animate-pulse" />
                <span>Đang Giữ Chỗ Cọc</span>
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/40 text-rose-600 dark:text-rose-300">
                <span className="w-3 h-3 rounded-md bg-rose-500 shadow-sm shadow-rose-500/50" />
                <span>Đã Chốt / Đang Đá</span>
              </div>
            </div>
          </div>

          {/* KHUNG BẢNG MA TRẬN GRID SYSTEM */}
          <div className={`overflow-x-auto rounded-3xl border shadow-2xl backdrop-blur-xl ${
            isDarkMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white/90'
          }`}>
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead>
                <tr className={`border-b ${
                  isDarkMode ? 'border-slate-800 bg-slate-950/80' : 'border-slate-200 bg-slate-100/90'
                }`}>
                  <th className={`p-4 sm:p-5 text-xs font-black uppercase tracking-wider w-56 sticky left-0 z-20 backdrop-blur-md ${
                    isDarkMode ? 'text-slate-300 bg-slate-950/95' : 'text-slate-700 bg-slate-100/95'
                  }`}>
                    Sân Bóng / Khung Giờ
                  </th>
                  {filteredTimeSlots.map((slot) => (
                    <th key={slot.start} className={`p-4 text-center border-l ${
                      isDarkMode ? 'border-slate-800/80' : 'border-slate-200'
                    }`}>
                      <div className={`text-sm font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{slot.start} - {slot.end}</div>
                      {slot.isGold ? (
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                          🔥 Giờ Vàng
                        </span>
                      ) : (
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          isDarkMode ? 'text-slate-400 bg-slate-800/60' : 'text-slate-600 bg-slate-200'
                        }`}>
                          Giờ thường
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
                {filteredSanList.map((san) => (
                  <tr key={san.id} className={isDarkMode ? 'hover:bg-slate-800/20 transition-colors' : 'hover:bg-slate-50 transition-colors'}>
                    {/* Cột Trục Dọc: Danh sách sân (San_Bong) */}
                    <td className={`p-4 sm:p-5 sticky left-0 z-10 border-r backdrop-blur-md ${
                      isDarkMode ? 'bg-slate-900/95 border-slate-800/80' : 'bg-white/95 border-slate-200'
                    }`}>
                      <div className={`font-extrabold text-sm sm:text-base flex items-center gap-2 ${
                        isDarkMode ? 'text-white' : 'text-slate-900'
                      }`}>
                        {san.ten_san}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{san.ten_loai}</span>
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[11px] text-slate-400">Sẵn sàng</span>
                      </div>
                    </td>

                    {/* Cột Trục Ngang: Các ô Slot ma trận thời gian */}
                    {filteredTimeSlots.map((slot) => {
                      const slotKey = `${san.id}_${slot.start}`;
                      const slotData = gridSlots[slotKey];
                      const status = slotData ? slotData.trang_thai : 'TRONG';

                      return (
                        <td key={slot.start} className={`p-2 sm:p-3 border-l text-center ${
                          isDarkMode ? 'border-slate-800/60' : 'border-slate-200'
                        }`}>
                          {status === 'TRONG' && (
                            <button
                              onClick={() => handleSlotClick(san, slot)}
                              className={`w-full h-20 p-2 rounded-2xl border transition-all duration-200 flex flex-col items-center justify-center gap-1 group shadow-sm hover:scale-[1.02] cursor-pointer ${
                                isDarkMode
                                  ? 'bg-emerald-950/40 hover:bg-emerald-900/60 border-emerald-600/40 hover:border-emerald-400'
                                  : 'bg-emerald-50 hover:bg-emerald-100/80 border-emerald-300 hover:border-emerald-500'
                              }`}
                            >
                              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                                SÂN TRỐNG
                              </span>
                              <span className={`text-[11px] font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                {slotData ? `${slotData.gia_ap_dung.toLocaleString('vi-VN')} đ` : 'Chọn đặt'}
                              </span>
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                                + Bấm Đặt Ngay
                              </span>
                            </button>
                          )}

                          {status === 'CHO_XAC_NHAN' && (
                            <div
                              onClick={() => handleSlotClick(san, slot)}
                              className={`w-full h-20 p-2 rounded-2xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                                isDarkMode ? 'bg-amber-950/40 border-amber-500/40 hover:bg-amber-950/60' : 'bg-amber-50 border-amber-300 hover:bg-amber-100'
                              }`}
                            >
                              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-600 dark:text-amber-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                                GIỮ CHỖ
                              </span>
                              <span className={`text-[10px] font-medium truncate max-w-[110px] ${
                                isDarkMode ? 'text-amber-200' : 'text-amber-800'
                              }`}>
                                {slotData.ten_khach_hang || 'Chờ duyệt cọc'}
                              </span>
                              <span className="text-[9px] text-amber-600 dark:text-amber-400/80 font-mono">15p giữ chỗ</span>
                            </div>
                          )}

                          {status === 'DA_CHOT' && (
                            <div className={`w-full h-20 p-2 rounded-2xl border flex flex-col items-center justify-center gap-1 opacity-70 cursor-not-allowed ${
                              isDarkMode ? 'bg-rose-950/30 border-rose-900/40' : 'bg-rose-50 border-rose-200'
                            }`}>
                              <span className="text-[11px] font-bold text-rose-500 flex items-center gap-1">
                                <XCircle className="w-3.5 h-3.5" />
                                ĐÃ CHỐT
                              </span>
                              <span className="text-[10px] font-medium text-slate-500 truncate max-w-[110px]">
                                {slotData.ten_khach_hang || 'Đang thi đấu'}
                              </span>
                              <span className="text-[9px] text-slate-400 font-mono">Không khả dụng</span>
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
        </section>

        {/* =====================================================================
            4. BẢNG GIÁ CÔNG KHAI & DỊCH VỤ TẠI SÂN
            ===================================================================== */}
        <section id="bang-gia" className={`py-20 border-y transition-colors duration-300 ${
          isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-100/60 border-slate-200'
        }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* 4.1. BẢNG GIÁ KHUNG GIỜ (Bảng Khung_Gio_Gia) */}
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1">
                Minh Bạch & Niêm Yết
              </div>
              <h2 className={`text-3xl sm:text-4xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Bảng Giá Thuê Sân Theo Khung Giờ
              </h2>
              <p className={`text-sm mt-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Áp dụng chuẩn hóa theo bảng dữ liệu <code className="text-emerald-500 font-mono">Khung_Gio_Gia</code>. Không phụ thu ẩn, đã bao gồm nước uống khởi động.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {MOCK_BANG_GIA.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-3xl border p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-xl ${
                    isDarkMode
                      ? 'bg-slate-900 border-slate-800 hover:border-emerald-500/40'
                      : 'bg-white border-slate-200 hover:border-emerald-500/50 shadow-slate-200'
                  }`}
                >
                  <div>
                    <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center text-emerald-500 mb-4 ${
                      isDarkMode ? 'bg-emerald-950/80 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
                    }`}>
                      <DollarSign className="w-6 h-6" />
                    </div>
                    <h3 className={`text-lg font-black mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{item.ten_loai}</h3>
                    
                    <div className="space-y-4 my-6">
                      <div className={`p-3 rounded-2xl border ${
                        isDarkMode ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Giờ thường (T2 - T6)</div>
                        <div className="text-xs text-slate-400 dark:text-slate-500">{item.gio_thuong}</div>
                        <div className="text-lg font-black text-emerald-500 mt-1">
                          {item.gia_thuong.toLocaleString('vi-VN')} đ <span className="text-xs font-normal text-slate-400">/ 90 phút</span>
                        </div>
                      </div>

                      <div className={`p-3 rounded-2xl border ${
                        isDarkMode ? 'bg-amber-950/30 border-amber-500/30' : 'bg-amber-50 border-amber-200'
                      }`}>
                        <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          🔥 Giờ Vàng (16:30 - 21:00)
                        </div>
                        <div className="text-lg font-black text-amber-600 dark:text-amber-300 mt-1">
                          {item.gia_vang.toLocaleString('vi-VN')} đ <span className="text-xs font-normal text-slate-400">/ 90 phút</span>
                        </div>
                      </div>

                      <div className={`p-3 rounded-2xl border ${
                        isDarkMode ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Cuối tuần (Thứ 7 - CN)</div>
                        <div className={`text-lg font-black mt-1 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                          {item.gia_cuoi_tuan.toLocaleString('vi-VN')} đ <span className="text-xs font-normal text-slate-400">/ 90 phút</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <a
                    href="#ma-tran-lich-san"
                    className={`w-full py-3 rounded-xl font-bold text-xs text-center transition-colors flex items-center justify-center gap-1.5 ${
                      isDarkMode
                        ? 'bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-200'
                        : 'bg-slate-100 hover:bg-emerald-500 hover:text-white text-slate-800'
                    }`}
                  >
                    <span>Xem Lịch Đặt Sân Này</span>
                    <ChevronRight className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>

            {/* 4.2. DỊCH VỤ TẠI SÂN (Bảng Dich_Vu & Chi_Tiet_Dich_Vu) */}
            <div id="dich-vu" className="mt-28">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <div className="text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1">
                  Tiện Ích Đi Kèm Đầy Đủ
                </div>
                <h2 className={`text-3xl sm:text-4xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Dịch Vụ & Trang Thiết Bị Tại Sân
                </h2>
                <p className={`text-sm mt-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Dữ liệu từ bảng <code className="text-emerald-500 font-mono">Dich_Vu</code>. Bạn có thể chọn kèm khi đặt sân để được chuẩn bị sẵn sàng ngay khi đến sân.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {MOCK_DICH_VU.map((dv) => (
                  <div
                    key={dv.id}
                    className={`p-5 rounded-3xl border flex items-center justify-between transition-all group ${
                      isDarkMode
                        ? 'bg-slate-900 border-slate-800 hover:border-emerald-500/40'
                        : 'bg-white border-slate-200 hover:border-emerald-500/50 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform ${
                        isDarkMode ? 'bg-emerald-950/70 border-emerald-600/30' : 'bg-emerald-50 border-emerald-200'
                      }`}>
                        {dv.icon === 'water' && <Coffee className="w-6 h-6" />}
                        {dv.icon === 'coffee' && <Zap className="w-6 h-6" />}
                        {dv.icon === 'shirt' && <Shirt className="w-6 h-6" />}
                        {dv.icon === 'award' && <Award className="w-6 h-6" />}
                      </div>
                      <div>
                        <h4 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{dv.ten_dich_vu}</h4>
                        <div className="text-xs text-slate-400 mt-0.5">
                          Tồn kho: <span className="text-emerald-500 font-medium">{dv.ton_kho} {dv.don_vi_tinh}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-black text-emerald-500">
                        {dv.don_gia.toLocaleString('vi-VN')} đ
                      </div>
                      <span className="text-[11px] text-slate-400">/{dv.don_vi_tinh}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* =====================================================================
            5. FOOTER (CHÂN TRANG, BẢN ĐỒ GOOGLE MAPS & CHÍNH SÁCH HOÀN TIỀN)
            ===================================================================== */}
        <footer id="chinh-sach-lien-he" className={`border-t pt-20 pb-12 transition-colors duration-300 ${
          isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-900 text-slate-100 border-slate-800'
        }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pb-16 border-b border-slate-800/80">
              
              {/* Cột 1: Thông tin thương hiệu & Hotline */}
              <div className="lg:col-span-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center">
                    <Activity className="w-6 h-6 text-slate-950 stroke-[2.5]" />
                  </div>
                  <span className="text-2xl font-black text-white">
                    SOCCER<span className="text-emerald-400">247</span>
                  </span>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Trung tâm liên hợp thể thao hiện đại bậc nhất. Cung cấp hệ thống sân bóng đá, Pickleball và Cầu lông với mặt sân tiêu chuẩn thi đấu quốc tế.
                </p>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3 text-sm text-slate-300">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Hotline đặt kèo & CSKH 24/7:</div>
                      <div className="font-bold text-white text-base">0909.123.456 - 0988.789.789</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-slate-300">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Email hợp tác & sự kiện:</div>
                      <div className="font-bold text-white">contact@soccer247.vn</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-slate-300">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Địa chỉ cụm sân:</div>
                      <div className="font-bold text-white">Khu Thể Thao Đa Năng, Đường D1, TP. Hồ Chí Minh</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cột 2: Chính sách hủy đơn & hoàn cọc (Lich_Su_Hoan_Tien) */}
              <div className="lg:col-span-4 space-y-4">
                <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  Chính Sách Hủy Đơn & Hoàn Tiền Cọc
                </h3>
                <p className="text-xs text-slate-400">
                  Tương ứng thủ tục <code className="text-emerald-400 font-mono">sp_HuyDonDatSan</code> và bảng <code className="text-emerald-400 font-mono">Lich_Su_Hoan_Tien</code>:
                </p>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                      <span>Hủy trước &gt; 12 Giờ</span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300">Hoàn 100% Tiền Cọc</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Hoàn tiền tự động về tài khoản VNPay/MoMo trong vòng 5 - 10 phút.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                      <span>Hủy trước 6 - 12 Giờ</span>
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300">Hoàn 50% Tiền Cọc</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Khấu trừ 50% chi phí giữ sân và hỗ trợ tìm đội đối khác.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                    <div className="flex items-center justify-between text-xs font-bold text-rose-400">
                      <span>Hủy dưới 6 Giờ</span>
                      <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300">Không Hoàn Cọc (0%)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Tiền cọc được sử dụng để đền bù khung giờ trống cho ban quản lý.
                    </p>
                  </div>
                </div>
              </div>

              {/* Cột 3: Bản đồ Google Maps nhúng trực tiếp */}
              <div className="lg:col-span-4 space-y-4">
                <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-400" />
                  Bản Đồ Vị Trí Cụm Sân
                </h3>
                <div className="w-full h-56 rounded-2xl overflow-hidden border border-slate-800 shadow-xl relative bg-slate-900">
                  <iframe
                    title="Bản đồ Soccer247"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.4602324316496!2d106.6983424757034!3d10.77601938937248!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f38f9ed887b%3A0x14aded5703768989!2zU8OibiB24bqtbiDEkeG7mW5nIEhvYSBMxrA!5e0!3m2!1svi!2s!4v1700000000000!5m2!1svi!2s"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen={false}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="w-full h-full grayscale contrast-125 opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                  />
                </div>
                <p className="text-xs text-slate-400 text-center">
                  Bãi giữ xe ô tô & xe máy rộng rãi, an ninh 24/24.
                </p>
              </div>

            </div>

            {/* Dòng bản quyền dưới cùng */}
            <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
              <p>© 2026 Soccer247 - Hệ Thống Quản Lý Sân Bóng Toàn Diện. Phát triển trên Express.js & SQL Server.</p>
              <div className="flex items-center gap-6">
                <a href="#" className="hover:text-emerald-400 transition-colors">Điều khoản sử dụng</a>
                <a href="#" className="hover:text-emerald-400 transition-colors">Chính sách bảo mật</a>
                <a href="#" className="hover:text-emerald-400 transition-colors">API Đối tác</a>
              </div>
            </div>
          </div>
        </footer>
      </main>

      {/* =====================================================================
          6. MODAL ĐẶT SÂN TƯƠNG TÁC (INTERACTIVE BOOKING MODAL)
          ===================================================================== */}
      {selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className={`relative w-full max-w-2xl border rounded-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200 ${
            isDarkMode ? 'bg-slate-900 border-emerald-700/50' : 'bg-white border-emerald-300'
          }`}>
            
            {/* Modal Header */}
            <div className={`p-6 border-b flex items-center justify-between ${
              isDarkMode ? 'bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border-slate-800' : 'bg-gradient-to-r from-emerald-100 via-white to-white border-slate-200'
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
                onClick={() => setSelectedSlot(null)}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                  isDarkMode ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Form Đặt Sân */}
            <form onSubmit={handleConfirmBooking} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              
              {/* Tóm tắt thông tin khung giờ & đơn giá sân */}
              <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl border text-xs ${
                isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <span className="text-slate-400">Ngày thi đấu:</span>
                  <div className={`font-bold text-sm mt-0.5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{filterNgayDa}</div>
                </div>
                <div>
                  <span className="text-slate-400">Khung giờ:</span>
                  <div className="font-bold text-emerald-500 text-sm mt-0.5">
                    {selectedSlot.slot.start} - {selectedSlot.slot.end}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Tiền thuê sân (90p):</span>
                  <div className={`font-extrabold text-sm mt-0.5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {selectedSlot.giaTien.toLocaleString('vi-VN')} đ
                  </div>
                </div>
              </div>

              {/* Thông tin người đặt (Họ tên & SĐT) */}
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
                      className={`w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-emerald-500 ${
                        isDarkMode ? 'bg-slate-950 border border-slate-800 text-slate-100' : 'bg-slate-50 border border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`text-xs font-semibold block mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      Số điện thoại nhận tin nhắn <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="VD: 0912345678"
                      value={bookingForm.so_dien_thoai}
                      onChange={(e) => setBookingForm({ ...bookingForm, so_dien_thoai: e.target.value })}
                      className={`w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-emerald-500 ${
                        isDarkMode ? 'bg-slate-950 border border-slate-800 text-slate-100' : 'bg-slate-50 border border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Chọn thêm dịch vụ tại sân (Chi_Tiet_Dich_Vu) */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Coffee className="w-4 h-4" />
                  Chọn Thêm Dịch Vụ & Trang Thiết Bị (Tùy chọn)
                </h4>
                <div className="space-y-2">
                  {MOCK_DICH_VU.map((dv) => {
                    const qty = bookingForm.dich_vu_chon[dv.id] || 0;
                    return (
                      <div
                        key={dv.id}
                        className={`flex items-center justify-between p-3 rounded-xl border text-xs ${
                          isDarkMode ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div>
                          <div className={`font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{dv.ten_dich_vu}</div>
                          <div className="text-slate-400">{dv.don_gia.toLocaleString('vi-VN')} đ / {dv.don_vi_tinh}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(dv.id, -1)}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-base ${
                              isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                            }`}
                          >
                            -
                          </button>
                          <span className={`w-5 text-center font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{qty}</span>
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(dv.id, 1)}
                            className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center font-bold text-base cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Phương thức thanh toán & Loại thanh toán (Bảng Thanh_Toan) */}
              <div className={`space-y-4 pt-2 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4" />
                  Hình Thức Đặt Cọc & Thanh Toán
                </h4>
                
                {/* Loại thanh toán: Đặt cọc 30% vs Trả hết 100% */}
                <div className="grid grid-cols-2 gap-3">
                  <label
                    onClick={() => setBookingForm({ ...bookingForm, loai_thanh_toan: 'DAT_COC' })}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      bookingForm.loai_thanh_toan === 'DAT_COC'
                        ? isDarkMode ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300' : 'bg-emerald-50 border-emerald-500 text-emerald-800'
                        : isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold text-sm">Đặt Cọc 30%</div>
                    <div className="text-xs mt-1">Giữ chỗ nhanh, trả phần còn lại khi đến sân</div>
                  </label>

                  <label
                    onClick={() => setBookingForm({ ...bookingForm, loai_thanh_toan: 'TRA_HET' })}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      bookingForm.loai_thanh_toan === 'TRA_HET'
                        ? isDarkMode ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300' : 'bg-emerald-50 border-emerald-500 text-emerald-800'
                        : isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold text-sm">Thanh Toán Đủ 100%</div>
                    <div className="text-xs mt-1">Vào sân đá ngay, không cần thanh toán tại quầy</div>
                  </label>
                </div>

                {/* Cổng thanh toán trực tuyến */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'VNPAY', name: 'VNPay QR / Thẻ', icon: '🏧' },
                    { id: 'MOMO', name: 'Ví MoMo', icon: '📱' },
                    { id: 'TIEN_MAT', name: 'Tiền mặt tại sân', icon: '💵' },
                  ].map((gateway) => (
                    <label
                      key={gateway.id}
                      onClick={() => setBookingForm({ ...bookingForm, phuong_thuc: gateway.id })}
                      className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                        bookingForm.phuong_thuc === gateway.id
                          ? isDarkMode ? 'bg-emerald-950/60 border-emerald-500 text-white font-bold' : 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold'
                          : isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-xl mb-1">{gateway.icon}</div>
                      <div className="text-xs">{gateway.name}</div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Tổng kết chi phí thanh toán */}
              <div className={`p-4 rounded-2xl border space-y-2 text-xs ${
                isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex justify-between text-slate-400">
                  <span>Tiền sân:</span>
                  <span>{selectedSlot.giaTien.toLocaleString('vi-VN')} đ</span>
                </div>
                {tongTienDichVu > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>Tiền dịch vụ thêm:</span>
                    <span>{tongTienDichVu.toLocaleString('vi-VN')} đ</span>
                  </div>
                )}
                <div className={`flex justify-between font-bold border-t pt-2 ${
                  isDarkMode ? 'text-slate-300 border-slate-800' : 'text-slate-700 border-slate-200'
                }`}>
                  <span>Tổng giá trị đơn:</span>
                  <span>{tongTienDon.toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="flex justify-between text-base font-black text-emerald-500 pt-1">
                  <span>Số tiền cần thanh toán ngay:</span>
                  <span>{soTienThanhToan.toLocaleString('vi-VN')} đ</span>
                </div>
              </div>

              {/* Nút bấm Submit Modal */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedSlot(null)}
                  className={`w-1/3 py-3.5 rounded-xl font-bold text-sm transition-colors ${
                    isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                  }`}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-2/3 py-3.5 rounded-xl font-black text-sm bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:from-emerald-400 hover:to-teal-300 shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Đang Xử Lý Đơn...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-slate-950" />
                      <span>XÁC NHẬN ĐẶT SÂN NGAY</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
