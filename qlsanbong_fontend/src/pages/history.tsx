"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAppTheme } from '@/hooks/useAppTheme';
import {
  History as HistoryIcon,
  Calendar,
  Clock,
  ArrowLeft,
  Receipt,
  CheckCircle2,
  Clock3,
  TrendingUp,
  CreditCard,
  Coffee,
  AlertCircle,
  RefreshCw,
  ShoppingBag,
  Plus,
  Minus,
  X,
  QrCode,
  Copy,
  Check,
  ChevronRight,
  Sparkles,
  ExternalLink,
  DollarSign,
  Eye,
  FileText,
  Sun,
  Moon,
  Lock,
  XCircle,
  Landmark,
  CalendarClock,
  RotateCcw,
  Filter,
  ArrowLeftRight,
  Search,
  ChevronDown
} from 'lucide-react';

// 1. Định nghĩa Interface đơn đặt sân lấy từ CSDL SQL Server
export interface IDonDatSan {
  id: number;
  ma_don: string;
  ma_san: number;
  ten_san: string;
  ten_loai?: string;
  ngay_da: string;
  gio_bat_dau: string;
  gio_ket_thuc: string;
  tien_san: number;
  tong_tien: number;
  phuong_thuc: string;
  ghi_chu?: string;
  trang_thai: string;
  ngay_tao?: string;
  ten_khach_hang?: string;
  sdt_khach_hang?: string;
  tien_coc?: number;
  tien_da_nhan?: number;
  tien_thieu?: number;
  trang_thai_hoan?: string;
  so_tien_hoan?: number;
  ty_le_hoan?: number;
  ten_ngan_hang?: string;
  so_tai_khoan?: string;
  ten_chu_tai_khoan?: string;
  ngay_chuyen_khoan?: string;
  chi_tiet_dich_vu?: Array<{
    ma_dich_vu: number;
    ten_dich_vu: string;
    don_vi_tinh?: string;
    so_luong: number;
    don_gia?: number;
    tongtien_dichvu: number;
  }>;
}

// Interface Mặt hàng Dịch vụ
export interface IDichVuItem {
  id: number;
  ten_dich_vu: string;
  don_gia: number;
  don_vi_tinh: string;
  ton_kho: number;
}

// Interface Dữ liệu trả về từ Cổng thanh toán PayOS (MB Bank VietQR)
interface PayOSData {
  orderCode: number;
  ma_don_dat?: number;
  amount: number;
  description: string;
  accountNumber: string;
  accountName: string;
  bin: string;
  bankName: string;
  checkoutUrl?: string;
  qrCode?: string;
  paymentLinkId?: string;
  status?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Hàm chuẩn hóa chuỗi sang IN HOA KHÔNG DẤU theo chuẩn thông tin chuyển khoản ngân hàng
export const toUpperCaseNoAccents = (str: string): string => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toUpperCase();
};

// =========================================================================
// COMPONENT DROPDOWN CHỌN NGÂN HÀNG THƯƠNG MẠI (SẮP XẾP CHỮ CÁI A - Z & TÌM KIẾM)
// =========================================================================
interface BankItem {
  id?: number;
  code: string;
  shortName: string;
  name: string;
  logo?: string;
}

interface BankSelectDropdownProps {
  value: string;
  onChange: (value: string) => void;
  banks: BankItem[];
  isDarkMode: boolean;
  cashLabel?: string;
  placeholder?: string;
}

const BankSelectDropdown: React.FC<BankSelectDropdownProps> = ({
  value,
  onChange,
  banks,
  isDarkMode,
  cashLabel = 'Nhận tiền mặt tại quầy',
  placeholder = 'Chọn phương thức nhận tiền...'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sắp xếp danh sách ngân hàng theo thứ tự bảng chữ cái A - Z theo tên viết tắt (shortName)
  const sortedBanks = useMemo(() => {
    return [...banks].sort((a, b) => {
      const nameA = (a.shortName || a.name || '').trim();
      const nameB = (b.shortName || b.name || '').trim();
      return nameA.localeCompare(nameB, 'vi', { sensitivity: 'base' });
    });
  }, [banks]);

  // Lọc theo từ khóa tìm kiếm nhanh
  const filteredBanks = useMemo(() => {
    if (!searchTerm.trim()) return sortedBanks;
    const q = searchTerm.trim().toLowerCase();
    return sortedBanks.filter((b) => {
      const sName = (b.shortName || '').toLowerCase();
      const fName = (b.name || '').toLowerCase();
      const code = (b.code || '').toLowerCase();
      return sName.includes(q) || fName.includes(q) || code.includes(q);
    });
  }, [sortedBanks, searchTerm]);

  // Đóng dropdown khi click ra ngoài hoặc bấm Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const isCashSelected = value === cashLabel || value.includes('quầy') || value.includes('tiền mặt');

  const selectedBank = useMemo(() => {
    if (isCashSelected) return null;
    return banks.find((b) => b.shortName === value || b.name === value || b.code === value);
  }, [banks, value, isCashSelected]);

  return (
    <div ref={dropdownRef} className="relative w-full">
      {/* Nút trigger dropdown */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 transition-all cursor-pointer shadow-sm text-left ${
          isOpen
            ? isDarkMode
              ? 'border-indigo-500 bg-slate-900 ring-2 ring-indigo-500/30 text-white'
              : 'border-indigo-500 bg-white ring-2 ring-indigo-500/30 text-slate-950'
            : isDarkMode
            ? 'border-slate-700 bg-slate-900 hover:border-slate-600 text-white'
            : 'border-slate-300 bg-white hover:border-slate-400 text-slate-950'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {isCashSelected ? (
            <div className="flex items-center gap-2 truncate">
              <span className="text-base shrink-0">💵</span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400 truncate">
                Nhận tiền mặt trực tiếp tại quầy lễ tân
              </span>
            </div>
          ) : selectedBank ? (
            <div className="flex items-center gap-2 truncate">
              {selectedBank.logo ? (
                <img
                  src={selectedBank.logo}
                  alt={selectedBank.shortName}
                  className="w-5 h-5 object-contain rounded bg-white p-0.5 border border-slate-200/60 shrink-0"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : null}
              <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-extrabold shrink-0 ${
                isDarkMode ? 'bg-indigo-950/80 text-cyan-300 border border-indigo-700/50' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
              }`}>
                {selectedBank.shortName}
              </span>
              <span className="truncate font-bold text-slate-900 dark:text-slate-100">
                {selectedBank.name}
              </span>
            </div>
          ) : (
            <span className="truncate font-bold text-slate-900 dark:text-slate-100">
              {value || placeholder}
            </span>
          )}
        </div>

        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-500' : ''}`} />
      </button>

      {/* Menu dropdown popup */}
      {isOpen && (
        <div className={`absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl border shadow-2xl overflow-hidden flex flex-col animate-fade-in ${
          isDarkMode
            ? 'bg-slate-900 border-slate-700 shadow-black/80'
            : 'bg-white border-slate-300 shadow-slate-300/60'
        }`}>
          {/* Ô tìm kiếm nhanh */}
          <div className={`p-2.5 border-b flex items-center gap-2 shrink-0 ${
            isDarkMode ? 'border-slate-800 bg-slate-950/70' : 'border-slate-200 bg-slate-50'
          }`}>
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm nhanh tên ngân hàng (VD: MB, VCB, ACB, Techcom...)..."
              className={`w-full bg-transparent text-xs outline-none font-medium ${
                isDarkMode ? 'text-white placeholder:text-slate-500' : 'text-slate-900 placeholder:text-slate-400'
              }`}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="p-1 rounded-md text-slate-400 hover:text-white shrink-0"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Danh sách các lựa chọn cuộn mượt mà */}
          <div className="max-h-60 sm:max-h-64 overflow-y-auto p-1.5 space-y-1 text-xs">
            {/* Lựa chọn Tiền mặt (Luôn ở đầu nếu không tìm kiếm hoặc tìm kiếm khớp) */}
            {(!searchTerm || 'nhận tiền mặt tại quầy lễ tân'.includes(searchTerm.toLowerCase())) && (
              <button
                type="button"
                onClick={() => {
                  onChange(cashLabel);
                  setIsOpen(false);
                  setSearchTerm('');
                }}
                className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                  isCashSelected
                    ? isDarkMode
                      ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-500/40'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                    : isDarkMode
                    ? 'hover:bg-slate-800 text-slate-200'
                    : 'hover:bg-slate-100 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base shrink-0">💵</span>
                  <div className="min-w-0">
                    <div className="font-extrabold text-xs">Nhận tiền mặt trực tiếp tại quầy</div>
                    <div className="text-[10px] opacity-75">Thu ngân gửi lại tiền mặt khi bạn đến nhận sân</div>
                  </div>
                </div>
                {isCashSelected && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
              </button>
            )}

            {/* Tiêu đề nhóm Ngân hàng theo bảng chữ cái A - Z */}
            <div className={`px-2.5 pt-2 pb-1 text-[10px] font-extrabold uppercase tracking-wider flex items-center justify-between ${
              isDarkMode ? 'text-slate-400 border-t border-slate-800/80' : 'text-slate-500 border-t border-slate-200'
            }`}>
              <span>Danh sách 76 ngân hàng (Thứ tự A - Z)</span>
              <span className="font-mono font-bold text-indigo-500">{filteredBanks.length} ngân hàng</span>
            </div>

            {/* Danh sách ngân hàng sắp xếp A - Z */}
            {filteredBanks.map((b) => {
              const isSelected = value === b.shortName;
              return (
                <button
                  key={`${b.code}-${b.shortName}`}
                  type="button"
                  onClick={() => {
                    onChange(b.shortName);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between gap-2.5 transition-all cursor-pointer ${
                    isSelected
                      ? isDarkMode
                        ? 'bg-indigo-950/70 text-cyan-300 border border-indigo-500/50 shadow-inner'
                        : 'bg-indigo-50 text-indigo-950 border border-indigo-300 font-bold shadow-inner'
                      : isDarkMode
                      ? 'hover:bg-slate-800/80 text-slate-200'
                      : 'hover:bg-slate-100/90 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {b.logo ? (
                      <img
                        src={b.logo}
                        alt={b.shortName}
                        className="w-6 h-6 object-contain rounded-md bg-white p-0.5 border border-slate-200/80 shrink-0 shadow-xs"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : null}
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-extrabold shrink-0 ${
                      isSelected
                        ? isDarkMode
                          ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40'
                          : 'bg-indigo-200 text-indigo-900 border border-indigo-300'
                        : isDarkMode
                        ? 'bg-slate-800 text-slate-300 border border-slate-700'
                        : 'bg-slate-200 text-slate-700 border border-slate-300'
                    }`}>
                      {b.shortName}
                    </span>
                    <span className="truncate text-xs font-semibold">
                      {b.name}
                    </span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-indigo-500 shrink-0" />}
                </button>
              );
            })}

            {filteredBanks.length === 0 && (
              <div className="p-4 text-center text-slate-400 text-xs font-medium">
                Không tìm thấy ngân hàng nào với từ khóa "{searchTerm}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function History() {
  const router = useRouter();
  const { isDarkMode, setIsDarkMode, toggleTheme } = useAppTheme(true);

  // State danh sách đơn đặt nạp trực tiếp từ CSDL SQL Server
  const [danhSachDon, setDanhSachDon] = useState<IDonDatSan[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  // State Toast thông báo nổi
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // State Dịch vụ (Modal Thêm Dịch Vụ)
  const [availableServices, setAvailableServices] = useState<IDichVuItem[]>([]);
  const [selectedOrderForService, setSelectedOrderForService] = useState<IDonDatSan | null>(null);
  const [serviceCart, setServiceCart] = useState<{ [key: number]: number }>({});
  const [isAddingService, setIsAddingService] = useState<boolean>(false);

  // State PayOS VietQR MB Bank Modal
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<IDonDatSan | null>(null);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<IDonDatSan | null>(null);
  const [payOSData, setPayOSData] = useState<PayOSData | null>(null);
  const [isCreatingPayOS, setIsCreatingPayOS] = useState<boolean>(false);
  const [isCheckingPayOS, setIsCheckingPayOS] = useState<boolean>(false);
  const [isPaymentSuccess, setIsPaymentSuccess] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [payOSAlertMessage, setPayOSAlertMessage] = useState<string>('');

  // State Modal Hủy Sân & Hoàn Tiền
  const [cancelModalOrder, setCancelModalOrder] = useState<IDonDatSan | null>(null);
  const [cancelBankName, setCancelBankName] = useState<string>('Nhận tiền mặt tại quầy');
  const [cancelBankAccount, setCancelBankAccount] = useState<string>('');
  const [cancelAccountHolder, setCancelAccountHolder] = useState<string>('');
  const [cancelReason, setCancelReason] = useState<string>('Bận việc đột xuất');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState<boolean>(false);
  const [cancelModalError, setCancelModalError] = useState<string | null>(null);

  // Danh sách ngân hàng thương mại thật (VietQR Open Banking API)
  const [realBankList, setRealBankList] = useState<BankItem[]>([
    { code: 'MB', shortName: 'MBBank', name: 'Ngân hàng TMCP Quân đội' },
    { code: 'VCB', shortName: 'Vietcombank', name: 'Ngân hàng TMCP Ngoại Thương Việt Nam' },
    { code: 'CTG', shortName: 'VietinBank', name: 'Ngân hàng TMCP Công thương Việt Nam' },
    { code: 'BIDV', shortName: 'BIDV', name: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam' },
    { code: 'TCB', shortName: 'Techcombank', name: 'Ngân hàng TMCP Kỹ thương Việt Nam' },
    { code: 'VPB', shortName: 'VPBank', name: 'Ngân hàng TMCP Việt Nam Thịnh Vượng' },
    { code: 'ACB', shortName: 'ACB', name: 'Ngân hàng TMCP Á Châu' },
    { code: 'VBA', shortName: 'Agribank', name: 'Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam' },
    { code: 'TPB', shortName: 'TPBank', name: 'Ngân hàng TMCP Tiên Phong' },
    { code: 'STB', shortName: 'Sacombank', name: 'Ngân hàng TMCP Sài Gòn Thương Tín' },
    { code: 'HDB', shortName: 'HDBank', name: 'Ngân hàng TMCP Phát triển TP.HCM' },
    { code: 'VIB', shortName: 'VIB', name: 'Ngân hàng TMCP Quốc tế Việt Nam' },
    { code: 'SHB', shortName: 'SHB', name: 'Ngân hàng TMCP Sài Gòn - Hà Nội' },
    { code: 'MSB', shortName: 'MSB', name: 'Ngân hàng TMCP Hàng Hải' },
    { code: 'SSB', shortName: 'SeABank', name: 'Ngân hàng TMCP Đông Nam Á' },
    { code: 'OCB', shortName: 'OCB', name: 'Ngân hàng TMCP Phương Đông' },
    { code: 'EIB', shortName: 'Eximbank', name: 'Ngân hàng TMCP Xuất Nhập khẩu Việt Nam' },
    { code: 'LPB', shortName: 'LPBank', name: 'Ngân hàng TMCP Lộc Phát Việt Nam' },
    { code: 'NAB', shortName: 'Nam A Bank', name: 'Ngân hàng TMCP Nam Á' },
    { code: 'BAB', shortName: 'Bac A Bank', name: 'Ngân hàng TMCP Bắc Á' }
  ]);

  // State Bộ lọc thời gian (Tất cả, Hôm nay, Ngày mai, Tuần này, Tháng này, Sắp tới, Đã qua, Tùy chọn)
  const [filterType, setFilterType] = useState<'ALL' | 'TODAY' | 'TOMORROW' | 'THIS_WEEK' | 'THIS_MONTH' | 'UPCOMING' | 'PAST' | 'CUSTOM'>('ALL');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [isTimeFilterModalOpen, setIsTimeFilterModalOpen] = useState<boolean>(false);

  // =========================================================================
  // STATE MODAL ĐỔI SÂN CHO KHÁCH HÀNG (Tối thiểu trước giờ đá 30 phút)
  // =========================================================================
  const [exchangeModalOrder, setExchangeModalOrder] = useState<IDonDatSan | null>(null);
  const [exchangePitchList, setExchangePitchList] = useState<any[]>([]);
  const [exchangeSlotList, setExchangeSlotList] = useState<any[]>([]);
  const [exchangeBookedList, setExchangeBookedList] = useState<any[]>([]);
  const [exchangeSelectedDate, setExchangeSelectedDate] = useState<string>('');
  const [exchangeSelectedPitchId, setExchangeSelectedPitchId] = useState<number | null>(null);
  const [exchangeSelectedSlot, setExchangeSelectedSlot] = useState<{ gio_bat_dau: string; gio_ket_thuc: string; nhan_hien_thi?: string } | null>(null);
  const [exchangeReason, setExchangeReason] = useState<string>('Thay đổi lịch thi đấu');
  const [exchangePreviewData, setExchangePreviewData] = useState<any | null>(null);
  const [exchangeLoadingPreview, setExchangeLoadingPreview] = useState<boolean>(false);
  const [exchangeSubmitting, setExchangeSubmitting] = useState<boolean>(false);
  const [exchangeModalError, setExchangeModalError] = useState<string | null>(null);

  // Thông tin nhận lại tiền thừa (nếu sân mới rẻ hơn)
  const [exchangeRefundBankName, setExchangeRefundBankName] = useState<string>('Nhận tiền mặt tại quầy');
  const [exchangeRefundBankAccount, setExchangeRefundBankAccount] = useState<string>('');
  const [exchangeRefundAccountHolder, setExchangeRefundAccountHolder] = useState<string>('');

  // Helper tính toán tỷ lệ và số tiền hoàn khi hủy đơn
  const calculateCancelRefund = useCallback((order: IDonDatSan | null) => {
    if (!order || !order.ngay_da) return { hoursLeft: 0, refundRate: 0, refundAmount: 0, totalPaid: 0 };
    
    let matchDateTime: Date;
    const timeParts = (order.gio_bat_dau || '00:00').split(':');
    const h = parseInt(timeParts[0] || '0', 10);
    const m = parseInt(timeParts[1] || '0', 10);

    if (order.ngay_da.includes('-')) {
      const parts = order.ngay_da.split('-');
      if (parts[0].length === 4) {
        matchDateTime = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), h, m);
      } else {
        matchDateTime = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10), h, m);
      }
    } else {
      matchDateTime = new Date(order.ngay_da);
      matchDateTime.setHours(h, m, 0, 0);
    }

    const now = new Date();
    const hoursLeft = Math.max(0, (matchDateTime.getTime() - now.getTime()) / (1000 * 60 * 60));

    // Thể lệ hủy sân & hoàn tiền chuẩn:
    // 1. Từ 5 tiếng trở lên (>= 5h): hoàn 100% (tiền cọc và tiền thanh toán nếu có)
    // 2. Từ 1 đến dưới 5 tiếng (từ 1h đến < 5h, tức từ 60 phút trở lên): hoàn 50% số tiền (tiền cọc và tiền thanh toán nếu có)
    // 3. Dưới 1 tiếng (< 1h / < 60 phút): hủy sân không hoàn tiền (0%)
    let refundRate = 0;
    if (hoursLeft >= 5) {
      refundRate = 100;
    } else if (hoursLeft >= 1) {
      refundRate = 50;
    } else {
      refundRate = 0;
    }

    const isFullyPaid = (order.trang_thai === 'DA_THANH_TOAN' || order.trang_thai === 'HOAN_THANH' || order.trang_thai === 'KET_THUC');
    const tienCoc = order.tien_coc !== undefined && order.tien_coc !== null ? Number(order.tien_coc) : Math.round((order.tong_tien || 0) * 0.3);
    const totalPaid = isFullyPaid
      ? Number(order.tong_tien || 0)
      : (order.tien_da_nhan !== undefined && order.tien_da_nhan !== null && Number(order.tien_da_nhan) > 0
        ? Number(order.tien_da_nhan)
        : (order.trang_thai === 'DA_COC' ? tienCoc : Number(order.tien_da_nhan || 0)));

    const refundAmount = Math.round((totalPaid * refundRate) / 100);

    return { hoursLeft, refundRate, refundAmount, totalPaid };
  }, []);

  const handleOpenCancelModal = (order: IDonDatSan) => {
    setCancelModalOrder(order);
    setCancelModalError(null);
    setToastMessage(null);
    setCancelBankName('Nhận tiền mặt tại quầy');
    setCancelBankAccount('');
    setCancelAccountHolder('');
    setCancelReason('Bận việc đột xuất');
  };

  const handleConfirmCancelOrder = async () => {
    if (!cancelModalOrder) return;
    setCancelModalError(null);
    const { refundRate } = calculateCancelRefund(cancelModalOrder);

    if (refundRate > 0 && cancelBankName !== 'Nhận tiền mặt tại quầy') {
      if (!cancelBankAccount.trim()) {
        const msg = 'Vui lòng nhập số tài khoản ngân hàng để nhận tiền hoàn!';
        setCancelModalError(msg);
        return;
      }
      if (!cancelAccountHolder.trim()) {
        const msg = 'Vui lòng nhập tên chủ tài khoản ngân hàng (in hoa không dấu)!';
        setCancelModalError(msg);
        return;
      }
    }

    try {
      setIsSubmittingCancel(true);
      const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/dat-san/huy-don`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ma_don_dat: cancelModalOrder.id,
          ma_nguoi_dung: currentUser?.id || currentUser?.ma_nguoi_dung || (cancelModalOrder as any).ma_nguoi_dung,
          ly_do_huy: cancelReason,
          ten_ngan_hang: cancelBankName,
          so_tai_khoan: cancelBankName === 'Nhận tiền mặt tại quầy' ? 'TIEN_MAT' : cancelBankAccount.trim(),
          ten_chu_tai_khoan: toUpperCaseNoAccents(cancelAccountHolder).trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setToastMessage({
          type: 'success',
          text: `✅ Đã hủy sân #${cancelModalOrder.id} thành công! Đang chờ Ban Quản Lý hoàn tiền.`
        });
        setCancelModalOrder(null);
        setCancelModalError(null);
        fetchBookingHistory(currentUser);
      } else {
        const msg = data.message || 'Không thể hủy đơn đặt sân, vui lòng thử lại!';
        setCancelModalError(msg);
      }
    } catch (err: any) {
      const msg = err.message || 'Lỗi kết nối khi hủy đơn đặt sân!';
      setCancelModalError(msg);
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  // =========================================================================
  // XỬ LÝ NGHIỆP VỤ ĐỔI SÂN CHO KHÁCH HÀNG (TỐI THIỂU TRƯỚC 30 PHÚT)
  // =========================================================================

  // Helper kiểm tra điều kiện được phép đổi sân (tối thiểu trước 30 phút, chưa hủy, chưa hoàn thành)
  const canExchangeOrder = useCallback((order: IDonDatSan | null) => {
    if (!order || !order.ngay_da) return { allowed: false, minutesLeft: 0, reason: 'Không có thông tin lịch đá' };
    if (order.trang_thai === 'DA_HUY' || (order as any).trang_thai_hoan) return { allowed: false, minutesLeft: 0, reason: 'Đơn đã hủy' };
    if (order.trang_thai === 'HOAN_THANH') return { allowed: false, minutesLeft: 0, reason: 'Đơn đã hoàn thành' };
    if (order.trang_thai === 'DANG_DA') return { allowed: false, minutesLeft: 0, reason: 'Trận đấu đang diễn ra' };

    let matchDateTime: Date;
    const timeParts = (order.gio_bat_dau || '00:00').split(':');
    const h = parseInt(timeParts[0] || '0', 10);
    const m = parseInt(timeParts[1] || '0', 10);

    if (order.ngay_da.includes('-')) {
      const parts = order.ngay_da.split('-');
      if (parts[0].length === 4) {
        matchDateTime = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), h, m);
      } else {
        matchDateTime = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10), h, m);
      }
    } else {
      matchDateTime = new Date(order.ngay_da);
      matchDateTime.setHours(h, m, 0, 0);
    }

    const now = new Date();
    const minutesLeft = Math.floor((matchDateTime.getTime() - now.getTime()) / (1000 * 60));

    // Thời gian tối thiểu cho phép đổi là 30 phút
    if (minutesLeft < 30) {
      return {
        allowed: false,
        minutesLeft,
        reason: `Theo quy định, chỉ được đổi sân trước giờ đá tối thiểu 30 phút (hiện còn ${minutesLeft > 0 ? minutesLeft + ' phút' : 'đã qua giờ đá'})`
      };
    }
    return { allowed: true, minutesLeft, reason: '' };
  }, []);

  // Mở modal đổi sân
  const handleOpenExchangeModal = async (order: IDonDatSan) => {
    setExchangeModalOrder(order);
    setExchangeModalError(null);
    setExchangePreviewData(null);
    setExchangeSelectedSlot(null);
    setExchangeRefundBankName('Nhận tiền mặt tại quầy');
    setExchangeRefundBankAccount('');
    setExchangeRefundAccountHolder('');
    setExchangeReason('Thay đổi lịch thi đấu');

    let defaultDate = '';
    const todayStr = getLocalDateString(new Date());
    if (order.ngay_da) {
      const rawDate = order.ngay_da.split('T')[0];
      defaultDate = rawDate >= todayStr ? rawDate : todayStr;
    } else {
      defaultDate = todayStr;
    }
    setExchangeSelectedDate(defaultDate);

    try {
      const [pitchRes, slotRes, bookedRes] = await Promise.all([
        fetch(`${API_BASE_URL}/dat-san/danh-sach-san`).then(r => r.json()).catch(() => ({ success: false })),
        fetch(`${API_BASE_URL}/dat-san/khung-gio`).then(r => r.json()).catch(() => ({ success: false })),
        fetch(`${API_BASE_URL}/dat-san/lich-san?ngay=${defaultDate}`).then(r => r.json()).catch(() => ({ success: false }))
      ]);

      if (pitchRes.success && Array.isArray(pitchRes.data)) {
        const availablePitches = pitchRes.data.filter((p: any) => p.trang_thai === 'SAN_SANG');
        setExchangePitchList(availablePitches);
        const matchOld = availablePitches.find((p: any) => p.id === order.ma_san);
        setExchangeSelectedPitchId(matchOld ? matchOld.id : (availablePitches[0]?.id || null));
      }

      if (slotRes.success && Array.isArray(slotRes.data)) {
        setExchangeSlotList(slotRes.data.filter((s: any) => s.trang_thai !== false && s.trang_thai !== 0));
      }

      if (bookedRes.success && Array.isArray(bookedRes.data)) {
        setExchangeBookedList(bookedRes.data);
      }
    } catch (err: any) {
      console.warn('Lỗi khi mở modal đổi sân:', err.message);
    }
  };

  // Đổi ngày trong modal đổi sân
  const handleDateChangeExchange = async (newDate: string) => {
    setExchangeSelectedDate(newDate);
    setExchangeSelectedSlot(null);
    setExchangePreviewData(null);
    setExchangeModalError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/dat-san/lich-san?ngay=${newDate}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setExchangeBookedList(data.data);
      }
    } catch (e: any) {
      console.warn('Lỗi tải lịch sân:', e.message);
    }
  };

  // Chọn ca giờ và tự động xem trước tính giá
  const handleSelectSlotExchange = async (slot: any) => {
    if (!exchangeModalOrder || !exchangeSelectedPitchId) return;
    setExchangeSelectedSlot(slot);
    setExchangeLoadingPreview(true);
    setExchangeModalError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/dat-san/kiem-tra-doi-san`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ma_don_dat: exchangeModalOrder.id,
          ma_san_moi: exchangeSelectedPitchId,
          ngay_da_moi: exchangeSelectedDate,
          gio_bat_dau_moi: slot.gio_bat_dau,
          gio_ket_thuc_moi: slot.gio_ket_thuc,
          ma_nguoi_dung: currentUser?.id
        })
      });

      const data = await res.json();
      if (data.success && data.data) {
        setExchangePreviewData(data.data);
      } else {
        setExchangePreviewData(null);
        setExchangeModalError(data.message || 'Ca này không khả dụng để đổi!');
      }
    } catch (err: any) {
      setExchangeModalError(err.message || 'Lỗi kiểm tra tính toán đổi sân');
      setExchangePreviewData(null);
    } finally {
      setExchangeLoadingPreview(false);
    }
  };

  // Kiểm tra ca giờ có bị trùng lịch hoặc quá giờ hôm nay không
  const isSlotBookedForExchange = (pitchId: number, slotStart: string, slotEnd: string) => {
    const sStart = (slotStart || '').slice(0, 5);
    const sEnd = (slotEnd || '').slice(0, 5);

    // Kiểm tra giờ đã qua hôm nay hoặc ngày trong quá khứ
    const todayStr = getLocalDateString(new Date());
    if (exchangeSelectedDate && exchangeSelectedDate < todayStr) {
      return true;
    }
    if (exchangeSelectedDate === todayStr) {
      const now = new Date();
      const [h, m] = sStart.split(':').map(Number);
      if (h < now.getHours() || (h === now.getHours() && (m || 0) <= now.getMinutes())) {
        return true;
      }
    }

    return exchangeBookedList.some((b: any) => {
      if (exchangeModalOrder && b.id === exchangeModalOrder.id) return false;
      if (b.trang_thai === 'DA_HUY') return false;
      if (b.ma_san !== pitchId) return false;

      const bStart = (b.gio_bat_dau || '').slice(0, 5);
      const bEnd = (b.gio_ket_thuc || '').slice(0, 5);
      return sStart < bEnd && sEnd > bStart;
    });
  };

  // Xác nhận đổi sân trực tiếp
  const handleConfirmExchangeOrder = async (isPayOSRedirect: boolean = false) => {
    if (!exchangeModalOrder || !exchangeSelectedPitchId || !exchangeSelectedSlot || !exchangePreviewData) {
      setExchangeModalError('Vui lòng chọn ngày, sân và ca giờ mới hợp lệ!');
      return;
    }

    setExchangeModalError(null);

    // Kiểm tra thông tin hoàn tiền thừa nếu sân mới rẻ hơn
    if (exchangePreviewData.tien_thua > 0 && exchangeRefundBankName !== 'Nhận tiền mặt tại quầy') {
      if (!exchangeRefundBankAccount.trim()) {
        setExchangeModalError('Vui lòng nhập số tài khoản ngân hàng để nhận lại tiền thừa!');
        return;
      }
      if (!exchangeRefundAccountHolder.trim()) {
        setExchangeModalError('Vui lòng nhập tên chủ tài khoản (in hoa không dấu) để nhận lại tiền thừa!');
        return;
      }
    }

    // Nếu cần bù tiền và khách chọn thanh toán qua VietQR PayOS
    if (isPayOSRedirect) {
      const amountToPay = exchangePreviewData.duoc_doi_ngay
        ? exchangePreviewData.tien_con_thieu
        : exchangePreviewData.can_bu_coc;
      
      const orderForPayment = exchangeModalOrder;
      setExchangeModalOrder(null);
      handleOpenVietQRPayment(orderForPayment, amountToPay);
      return;
    }

    // Nếu không đủ cọc thì chặn không cho đổi trực tiếp
    if (!exchangePreviewData.duoc_doi_ngay && exchangePreviewData.can_bu_coc > 0) {
      setExchangeModalError(`Tiền cọc chưa đủ 30% sân mới! Bạn cần thanh toán bù thêm ${formatCurrency(exchangePreviewData.can_bu_coc)} tiền cọc để đổi sân.`);
      return;
    }

    setExchangeSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/dat-san/xac-nhan-doi-san`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ma_don_dat: exchangeModalOrder.id,
          ma_san_moi: exchangeSelectedPitchId,
          ngay_da_moi: exchangeSelectedDate,
          gio_bat_dau_moi: exchangeSelectedSlot.gio_bat_dau,
          gio_ket_thuc_moi: exchangeSelectedSlot.gio_ket_thuc,
          ly_do_doi: exchangeReason || 'Khách hàng đổi sân',
          hinh_thuc_nhan_tien_thua: exchangePreviewData.tien_thua > 0 ? exchangeRefundBankName : null,
          ten_ngan_hang: exchangeRefundBankName !== 'Nhận tiền mặt tại quầy' ? exchangeRefundBankName : null,
          so_tai_khoan: exchangeRefundBankAccount || null,
          ten_chu_tai_khoan: exchangeRefundAccountHolder ? toUpperCaseNoAccents(exchangeRefundAccountHolder) : null,
          tien_bu_da_tra: 0
        })
      });

      const data = await res.json();
      if (data.success) {
        setToastMessage({
          type: 'success',
          text: `✅ Đổi sang ${data.data?.ten_san || 'sân mới'} (${formatDateDMY(exchangeSelectedDate)} ${exchangeSelectedSlot.gio_bat_dau.slice(0, 5)} - ${exchangeSelectedSlot.gio_ket_thuc.slice(0, 5)}) thành công!`
        });
        setExchangeModalOrder(null);
        setExchangePreviewData(null);
        fetchBookingHistory(currentUser);
      } else {
        setExchangeModalError(data.message || 'Không thể đổi sân, vui lòng kiểm tra lại!');
      }
    } catch (err: any) {
      setExchangeModalError(err.message || 'Lỗi kết nối khi đổi sân!');
    } finally {
      setExchangeSubmitting(false);
    }
  };

  // Helper kiểm tra đơn đặt đã qua ngày/giờ thi đấu hay chưa
  const isOrderPastTime = useCallback((item: IDonDatSan) => {
    if ((item as any).da_qua_gio === 1 || (item as any).da_qua_gio === true) return true;
    if (!item.ngay_da) return false;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const currentDate = String(now.getDate()).padStart(2, '0');
    const todayStr = `${currentYear}-${currentMonth}-${currentDate}`;

    if (item.ngay_da < todayStr) return true;
    if (item.ngay_da > todayStr) return false;

    const timeToCheck = item.gio_ket_thuc || item.gio_bat_dau;
    if (!timeToCheck) return false;

    const [h, m] = timeToCheck.split(':').map(Number);
    const currentH = now.getHours();
    const currentM = now.getMinutes();

    if (h < currentH) return true;
    if (h === currentH && (m !== undefined ? m : 0) <= currentM) return true;

    return false;
  }, []);

  // Helper trigger Toast thông báo
  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Format tiền tệ VNĐ
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount || 0);
  };

  // Format ngày DD/MM/YYYY
  const formatDateDMY = (dateStr: string) => {
    if (!dateStr) return '';
    const cleanStr = String(dateStr).split('T')[0].split(' ')[0];
    const parts = cleanStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // Helper lấy chuỗi YYYY-MM-DD từ đối tượng Date theo giờ địa phương
  const getLocalDateString = (d: Date = new Date()): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper chuẩn hóa ngày đá của đơn về định dạng YYYY-MM-DD để so sánh chính xác
  const normalizeOrderDateStr = (dateStr?: string): string => {
    if (!dateStr) return '';
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts[0].length === 4) {
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      } else if (parts[2]?.length === 4) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts[2]?.length === 4) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    return dateStr;
  };

  // Hàm đặt lại bộ lọc về mặc định
  const resetFilter = () => {
    setFilterType('ALL');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  // Label hiển thị trên nút Lọc thời gian
  const getFilterLabel = () => {
    switch (filterType) {
      case 'TODAY':
        return 'Hôm nay';
      case 'TOMORROW':
        return 'Ngày mai';
      case 'THIS_WEEK':
        return 'Tuần này';
      case 'THIS_MONTH':
        return 'Tháng này';
      case 'UPCOMING':
        return 'Sắp diễn ra';
      case 'PAST':
        return 'Đã qua giờ';
      case 'CUSTOM':
        if (customStartDate && customEndDate) {
          return `${formatDateDMY(customStartDate)} - ${formatDateDMY(customEndDate)}`;
        }
        if (customStartDate) return `Từ ${formatDateDMY(customStartDate)}`;
        if (customEndDate) return `Đến ${formatDateDMY(customEndDate)}`;
        return 'Tùy chọn';
      default:
        return 'Lọc thời gian';
    }
  };

  // Danh sách đơn đặt sân đã được lọc theo mốc thời gian
  const danhSachDonFiltered = useMemo(() => {
    if (filterType === 'ALL') return danhSachDon;

    const todayStr = getLocalDateString(new Date());

    if (filterType === 'TODAY') {
      return danhSachDon.filter((item) => normalizeOrderDateStr(item.ngay_da) === todayStr);
    }

    if (filterType === 'TOMORROW') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = getLocalDateString(tomorrow);
      return danhSachDon.filter((item) => normalizeOrderDateStr(item.ngay_da) === tomorrowStr);
    }

    if (filterType === 'THIS_WEEK') {
      const now = new Date();
      const day = now.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diffToMonday);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const mondayStr = getLocalDateString(monday);
      const sundayStr = getLocalDateString(sunday);

      return danhSachDon.filter((item) => {
        const dStr = normalizeOrderDateStr(item.ngay_da);
        return dStr >= mondayStr && dStr <= sundayStr;
      });
    }

    if (filterType === 'THIS_MONTH') {
      const now = new Date();
      const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      return danhSachDon.filter((item) => normalizeOrderDateStr(item.ngay_da).startsWith(yearMonth));
    }

    if (filterType === 'UPCOMING') {
      return danhSachDon.filter((item) => !isOrderPastTime(item) && item.trang_thai !== 'DA_HUY');
    }

    if (filterType === 'PAST') {
      return danhSachDon.filter((item) => isOrderPastTime(item));
    }

    if (filterType === 'CUSTOM') {
      return danhSachDon.filter((item) => {
        const dStr = normalizeOrderDateStr(item.ngay_da);
        if (customStartDate && dStr < customStartDate) return false;
        if (customEndDate && dStr > customEndDate) return false;
        return true;
      });
    }

    return danhSachDon;
  }, [danhSachDon, filterType, customStartDate, customEndDate, isOrderPastTime]);

  // Hàm copy văn bản
  const handleCopyText = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    showToast(`Đã sao chép ${fieldName} vào clipboard!`, 'info');
    setTimeout(() => setCopiedField(null), 2500);
  };

  // Tải danh mục dịch vụ có sẵn
  const fetchAvailableServices = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/dich-vu`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setAvailableServices(data.data);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách dịch vụ:', err);
    }
  };

  // Hàm tải dữ liệu lịch sử đặt sân thực tế từ CSDL SQL Server
  const fetchBookingHistory = useCallback(async (user: any) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      let queryParams = new URLSearchParams();
      if (user?.id) queryParams.append('ma_nguoi_dung', String(user.id));
      if (user?.so_dien_thoai || user?.soDienThoai) queryParams.append('so_dien_thoai', user.so_dien_thoai || user.soDienThoai);
      if (user?.email) queryParams.append('email', user.email);

      const token = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token')) : null;
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE_URL}/dat-san/lich-su-khach-hang?${queryParams.toString()}`, { headers });
      const data = await res.json();

      if (data.success && Array.isArray(data.data)) {
        setDanhSachDon(data.data);
      } else {
        setDanhSachDon([]);
        if (!data.success) {
          setErrorMessage(data.message || 'Không thể tải lịch sử đặt sân.');
        }
      }
    } catch (err: any) {
      console.error('Lỗi khi tải lịch sử đặt sân:', err);
      setErrorMessage('Không thể kết nối đến máy chủ Backend SQL Server.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Tải danh mục ngân hàng thật từ API VietQR / Napas
  const fetchRealBankList = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/thanh-toan/danh-sach-ngan-hang`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setRealBankList(data.data);
        return;
      }
    } catch (e) {
      console.warn('Lỗi gọi API ngân hàng nội bộ:', e);
    }

    try {
      const resDirect = await fetch('https://api.vietqr.io/v2/banks');
      const dataDirect = await resDirect.json();
      if (dataDirect && dataDirect.code === '00' && Array.isArray(dataDirect.data)) {
        setRealBankList(dataDirect.data.map((b: any) => ({
          id: b.id,
          code: b.code,
          shortName: b.shortName || b.short_name,
          name: b.name,
          logo: b.logo
        })));
      }
    } catch (err) {
      console.error('Lỗi tải danh mục ngân hàng VietQR:', err);
    }
  };

  // Tự động đóng Toast thông báo sau 3.5 giây
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Đọc thông tin người dùng từ localStorage khi tải trang
  useEffect(() => {
    fetchAvailableServices();
    fetchRealBankList();
    try {
      const savedAuth = localStorage.getItem('auth_user') || localStorage.getItem('soccer_current_user');
      if (savedAuth) {
        const parsed = JSON.parse(savedAuth);
        setCurrentUser(parsed);
        fetchBookingHistory(parsed);
      } else {
        setCurrentUser(null);
        setDanhSachDon([]);
      }
    } catch (e) {
      console.error('Lỗi đọc localStorage:', e);
      setCurrentUser(null);
      setDanhSachDon([]);
    }
  }, [fetchBookingHistory]);

  // =========================================================================
  // XỬ LÝ THÊM / CHỈNH SỬA DỊCH VỤ VÀO HÓA ĐƠN
  // =========================================================================
  const handleOpenAddServiceModal = (order: IDonDatSan) => {
    setSelectedOrderForService(order);
    const initialCart: { [key: number]: number } = {};
    
    // Nếu đơn hàng còn tiền thiếu (chưa thanh toán đủ), load dịch vụ hiện có để khách có thể thêm hoặc xóa
    if (order.tien_thieu && order.tien_thieu > 0 && Array.isArray(order.chi_tiet_dich_vu)) {
      order.chi_tiet_dich_vu.forEach((dv: any) => {
        if (dv.ma_dich_vu && dv.so_luong) {
          initialCart[dv.ma_dich_vu] = Number(dv.so_luong);
        }
      });
    }
    // Nếu đơn đã thanh toán xong hoàn toàn -> cart khởi tạo trống để chỉ thêm dịch vụ mới
    setServiceCart(initialCart);
  };

  const handleUpdateServiceQuantity = (serviceId: number, delta: number) => {
    setServiceCart((prev) => {
      const current = prev[serviceId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const updated = { ...prev };
        delete updated[serviceId];
        return updated;
      }
      return { ...prev, [serviceId]: next };
    });
  };

  const calculateAddedServicesTotal = () => {
    let total = 0;
    Object.entries(serviceCart).forEach(([sId, qty]) => {
      const item = availableServices.find((s) => s.id === Number(sId));
      if (item && qty > 0) {
        total += item.don_gia * qty;
      }
    });
    return total;
  };

  // Khi nhấn Xác nhận thêm vào đơn -> Lưu trực tiếp vào CSDL qua Stored Procedure sp_CapNhatDichVuDonDat, tăng tiền còn thiếu, không hiện VietQR
  const handleConfirmAddServices = async () => {
    if (!selectedOrderForService) return;
    setIsAddingService(true);

    try {
      const currentOrder = selectedOrderForService;
      
      // Lấy toàn bộ ID dịch vụ ban đầu và dịch vụ trong giỏ
      const allServiceIds = new Set<number>();
      if (currentOrder.tien_thieu && currentOrder.tien_thieu > 0 && Array.isArray(currentOrder.chi_tiet_dich_vu)) {
        currentOrder.chi_tiet_dich_vu.forEach((dv: any) => {
          if (dv.ma_dich_vu) allServiceIds.add(Number(dv.ma_dich_vu));
        });
      }
      Object.keys(serviceCart).forEach((id) => allServiceIds.add(Number(id)));

      // Gọi Stored Procedure cập nhật từng dịch vụ (thêm, sửa số lượng, hoặc xóa hoàn kho)
      for (const sId of Array.from(allServiceIds)) {
        const newQty = serviceCart[sId] || 0;
        await fetch(`${API_BASE_URL}/dich-vu/cap-nhat-don`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ma_don_dat: currentOrder.id,
            ma_dich_vu: sId,
            so_luong: newQty
          })
        });
      }

      // Không hiển thị toast nổi khi xác nhận thêm dịch vụ theo yêu cầu
      setSelectedOrderForService(null);
      setServiceCart({});
      await fetchBookingHistory(currentUser);
    } catch (err: any) {
      console.error('Lỗi khi lưu dịch vụ vào đơn:', err);
      showToast('Lỗi khi cập nhật dịch vụ vào CSDL!', 'error');
    } finally {
      setIsAddingService(false);
    }
  };

  // =========================================================================
  // XỬ LÝ THANH TOÁN VIETQR PAYOS (MB BANK) CHO KHOẢN TIỀN CÒN THIẾU
  // =========================================================================
  const handleOpenVietQRPayment = async (order: IDonDatSan, customAmount?: number) => {
    setSelectedOrderForPayment(order);
    setIsPaymentSuccess(false);
    setPayOSAlertMessage('');
    setIsCreatingPayOS(true);

    const amountToPay = customAmount && customAmount > 0 
      ? customAmount 
      : (order.tien_thieu && order.tien_thieu > 0 ? order.tien_thieu : (order.tong_tien || 10000));

    try {
      const res = await fetch(`${API_BASE_URL}/thanh-toan/payos/tao-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ma_don_dat: order.id,
          so_tien: amountToPay,
          loai_thanh_toan: 'TRA_HET',
          ho_ten: order.ten_khach_hang || currentUser?.ho_ten || 'Khách Hàng',
          so_dien_thoai: order.sdt_khach_hang || currentUser?.so_dien_thoai || '0900000000'
        })
      });

      const data = await res.json();
      if (data.success && data.data) {
        setPayOSData(data.data);
      } else {
        showToast(data.message || 'Không thể tạo mã VietQR PayOS MB Bank!', 'error');
        setSelectedOrderForPayment(null);
      }
    } catch (err) {
      console.error('Lỗi khi tạo mã VietQR PayOS:', err);
      showToast('Lỗi kết nối đến cổng thanh toán VietQR PayOS!', 'error');
      setSelectedOrderForPayment(null);
    } finally {
      setIsCreatingPayOS(false);
    }
  };

  // Polling kiểm tra trạng thái thanh toán PayOS định kỳ mỗi 2.5 giây khi mở QR Modal
  useEffect(() => {
    if (!payOSData?.orderCode || isPaymentSuccess || !selectedOrderForPayment) {
      return;
    }

    const interval = setInterval(() => {
      checkPayOSStatus(payOSData.orderCode, false);
    }, 2500);

    return () => clearInterval(interval);
  }, [payOSData?.orderCode, isPaymentSuccess, selectedOrderForPayment]);

  // Kiểm tra trạng thái giao dịch PayOS
  const checkPayOSStatus = async (orderCode: number, manual: boolean = false) => {
    if (!orderCode) return;
    if (manual) {
      setIsCheckingPayOS(true);
      setPayOSAlertMessage('');
    }

    try {
      const res = await fetch(`${API_BASE_URL}/thanh-toan/payos/trang-thai/${orderCode}`);
      const data = await res.json();

      if (data.success && data.isPaid) {
        setIsPaymentSuccess(true);
        setPayOSAlertMessage('');
        showToast('🎉 MB Bank đã ghi nhận thanh toán thành công! Đơn hàng đã được thanh toán hoàn tất.', 'success');
        await fetchBookingHistory(currentUser);
      } else if (manual) {
        setPayOSAlertMessage('Sport 247 chưa nhận được tiền chuyển khoản! Quý khách vui lòng quét mã chuyển tiền hoặc thử lại sau vài giây.');
      }
    } catch (err) {
      console.error('Lỗi khi kiểm tra PayOS status:', err);
      if (manual) {
        setPayOSAlertMessage('Không thể kiểm tra giao dịch PayOS lúc này. Vui lòng thử lại sau.');
      }
    } finally {
      if (manual) setIsCheckingPayOS(false);
    }
  };

  const handleCloseQRModal = () => {
    setSelectedOrderForPayment(null);
    setPayOSData(null);
    setIsPaymentSuccess(false);
    setPayOSAlertMessage('');
    fetchBookingHistory(currentUser);
  };

  // =========================================================================
  // TÍNH TOÁN THỐNG KÊ NHANH (CHUẨN HÓA ĐỒNG BỘ CSDL)
  // =========================================================================
  const totalBookings = danhSachDon.length;

  // Số lượng đơn Đã đặt cọc (chưa trả đủ và có tiền cọc/đã nhận > 0)
  const daCocCount = danhSachDon.filter((don) => {
    const st = (don.trang_thai || '').toUpperCase();
    if (st.includes('HUY')) return false;
    const isOrderPaid = st === 'DA_THANH_TOAN' || st === 'HOAN_THANH' || st === 'KET_THUC';
    if (isOrderPaid) return false;
    const tongTien = Number(don.tong_tien) || 0;
    const tienCoc = don.tien_coc !== undefined && don.tien_coc !== null ? Number(don.tien_coc) : Math.round(tongTien * 0.3);
    const tienDaNhan = don.tien_da_nhan !== undefined && don.tien_da_nhan !== null ? Number(don.tien_da_nhan) : (st === 'DA_COC' ? tienCoc : 0);
    const tienThieu = don.tien_thieu !== undefined && don.tien_thieu !== null ? Number(don.tien_thieu) : Math.max(0, tongTien - tienDaNhan);
    return !isOrderPaid && (st === 'DA_COC' || (tienDaNhan > 0 && tienThieu > 0));
  }).length;

  // Số lượng đơn Đã thanh toán (100% hoặc hoàn thành)
  const daThanhToanCount = danhSachDon.filter((don) => {
    const st = (don.trang_thai || '').toUpperCase();
    if (st.includes('HUY')) return false;
    const isOrderPaid = st === 'DA_THANH_TOAN' || st === 'HOAN_THANH' || st === 'KET_THUC';
    if (isOrderPaid) return true;
    const tongTien = Number(don.tong_tien) || 0;
    const tienDaNhan = don.tien_da_nhan !== undefined && don.tien_da_nhan !== null ? Number(don.tien_da_nhan) : 0;
    const tienThieu = don.tien_thieu !== undefined && don.tien_thieu !== null ? Number(don.tien_thieu) : Math.max(0, tongTien - tienDaNhan);
    return (tongTien > 0 && tienDaNhan >= tongTien) || (tienThieu <= 0 && tienDaNhan > 0);
  }).length;

  const totalSpent = danhSachDon
    .filter((don) => !(don.trang_thai || '').toUpperCase().includes('HUY'))
    .reduce((sum, don) => sum + (Number(don.tong_tien) || 0), 0);

  // Helper hiển thị badge trạng thái chuẩn hóa đồng bộ toàn hệ thống
  const renderStatusBadge = (status: string, tienThieu: number = 0, tienDaNhan: number = 0, tongTien: number = 0, item?: IDonDatSan) => {
    const s = (status || '').toUpperCase();
    if (s.includes('HUY')) {
      if (item?.trang_thai_hoan === 'CHO_HOAN') {
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm animate-pulse" title="Đơn đã hủy - Đang chờ BQL chuyển khoản hoàn tiền">
            <Clock className="w-3 h-3 text-amber-400" />
            Chờ hoàn tiền {item.so_tien_hoan ? `(${formatCurrency(item.so_tien_hoan)})` : ''}
          </span>
        );
      }
      if (item?.trang_thai_hoan === 'DA_HOAN') {
        if (item.so_tien_hoan && item.so_tien_hoan > 0) {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm" title="Đã hoàn tiền thành công">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Đã hoàn tiền ({formatCurrency(item.so_tien_hoan)})
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-500/20 text-slate-400 border border-slate-500/30" title="Đã hủy đơn (Hủy sát giờ hoặc không hoàn)">
            <AlertCircle className="w-3 h-3 text-slate-400" />
            Đã hủy (0đ hoàn)
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
          <AlertCircle className="w-3 h-3 text-rose-400" />
          Đã hủy
        </span>
      );
    }
    if (s === 'CHO_XAC_NHAN' || s.includes('XAC_NHAN')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm" title="Chuyển khoản sai nội dung - Đang chờ quản lý xác nhận">
          <AlertCircle className="w-3 h-3 text-amber-400" />
          Chờ xác nhận (Sai ND)
        </span>
      );
    }
    const isPaid = (tongTien > 0 && tienDaNhan >= tongTien) || (tienThieu <= 0 && tienDaNhan > 0) || s === 'DA_THANH_TOAN' || s === 'HOAN_THANH';
    if (isPaid) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          Đã thanh toán
        </span>
      );
    }
    const isDeposit = s === 'DA_COC' || (tienDaNhan > 0 && tienThieu > 0);
    if (isDeposit) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-sm">
          <CheckCircle2 className="w-3 h-3 text-teal-400" />
          Đã cọc
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm">
        <Clock3 className="w-3 h-3 text-amber-400" />
        Chưa thanh toán
      </span>
    );
  };

  return (
    <>
      <Head>
        <title>Lịch Sử Đặt Sân | Sport247</title>
        <meta name="description" content="Xem chi tiết lịch sử đặt sân bóng và trạng thái thanh toán" />
      </Head>
      <div className={`min-h-screen transition-colors duration-300 py-4 sm:py-8 px-3 sm:px-6 lg:px-8 font-sans selection:bg-emerald-500 selection:text-white relative ${
      isDarkMode ? 'bg-[#060e09] text-slate-100 dark' : 'bg-[#f4f7f5] text-slate-900'
    }`}>
      
      {/* Toast Notification Floating */}
      {toastMessage && (
        <div className="fixed top-4 sm:top-6 right-3 sm:right-6 z-[9999] duration-300 max-w-[90vw] sm:max-w-md animate-fade-in">
          <div className={`px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl shadow-2xl backdrop-blur-md border flex items-center justify-between gap-3 text-xs font-semibold ${
            toastMessage.type === 'success'
              ? isDarkMode ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40' : 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : toastMessage.type === 'error'
              ? isDarkMode ? 'bg-rose-950/90 text-rose-300 border-rose-500/40' : 'bg-rose-50 text-rose-800 border-rose-300'
              : isDarkMode ? 'bg-slate-900/90 text-slate-200 border-slate-700' : 'bg-white text-slate-800 border-slate-200'
          }`}>
            <div className="flex items-center gap-2 min-w-0">
              {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              {toastMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
              {toastMessage.type === 'info' && <Sparkles className="w-4 h-4 text-teal-400 shrink-0" />}
              <span className="truncate">{toastMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="p-1 rounded-lg hover:bg-black/20 text-current opacity-70 hover:opacity-100 transition-opacity cursor-pointer shrink-0"
              title="Đóng thông báo"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        
        {/* Header điều hướng & Tiêu đề */}
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4 border-b pb-4 sm:pb-6 transition-colors ${
          isDarkMode ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <button
              onClick={() => router.push('/')}
              className={`p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer shadow-sm shrink-0 ${
                isDarkMode
                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700'
                  : 'bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-200'
              }`}
              title="Quay về trang chủ"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <div className="min-w-0">
              <h1 className={`text-lg sm:text-2xl md:text-3xl font-extrabold flex items-center gap-2 tracking-tight ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}>
                <Receipt className="w-5 h-5 sm:w-7 sm:h-7 text-emerald-500 shrink-0" />
                <span className="truncate">Lịch Sử Đặt Sân & Hóa Đơn</span>
              </h1>
              <p className={`text-[11px] sm:text-sm mt-0.5 sm:mt-1 truncate ${isDarkMode ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
                Theo dõi danh sách đơn đặt sân bóng, dịch vụ và thanh toán
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 w-full sm:w-auto sm:flex sm:items-center">
            {/* Nút lọc thời gian */}
            <button
              type="button"
              onClick={() => setIsTimeFilterModalOpen(true)}
              className={`px-3 sm:px-4 py-2.5 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                filterType !== 'ALL'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 border-emerald-400 shadow-emerald-500/20'
                  : isDarkMode
                  ? 'bg-slate-900 hover:bg-slate-800 text-cyan-300 hover:text-white border-slate-800 hover:border-slate-700'
                  : 'bg-white hover:bg-slate-50 text-cyan-700 hover:text-cyan-900 border-slate-300'
              }`}
              title="Lọc đơn đặt sân theo thời gian"
            >
              <CalendarClock className="w-4 h-4 shrink-0 text-current" />
              <span className="truncate">{getFilterLabel()}</span>
              {filterType !== 'ALL' && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    resetFilter();
                  }}
                  className="p-0.5 hover:bg-black/20 rounded-full cursor-pointer ml-0.5"
                  title="Xóa bộ lọc thời gian"
                >
                  <X className="w-3.5 h-3.5" />
                </span>
              )}
            </button>

            {/* Nút Đặt sân mới */}
            <button
              onClick={() => router.push('/')}
              className="px-3 sm:px-5 py-2.5 text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Calendar className="w-4 h-4 shrink-0" />
              <span className="truncate">Đặt sân mới</span>
            </button>
          </div>
        </div>

        {/* Tag thông báo đang lọc thời gian */}
        {filterType !== 'ALL' && (
          <div className={`p-2.5 sm:p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
            isDarkMode ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}>
            <div className="flex items-center gap-2 min-w-0">
              <CalendarClock className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="truncate">
                Đang lọc: <strong>{getFilterLabel()}</strong> ({danhSachDonFiltered.length} đơn tìm thấy)
              </span>
            </div>
            <button
              type="button"
              onClick={resetFilter}
              className="px-2 py-1 rounded-lg text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/25 flex items-center gap-1 transition-colors cursor-pointer shrink-0 ml-2"
            >
              <X className="w-3 h-3" />
              <span>Xóa lọc</span>
            </button>
          </div>
        )}

        {/* Thông báo lỗi kết nối nếu có */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Bảng & Danh sách đơn đặt sân */}
        <div className={`rounded-2xl shadow-2xl overflow-hidden transition-colors border ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-slate-200/70'
        }`}>

          {isLoading ? (
            /* Hiệu ứng Skeleton Loading */
            <div className="p-12 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>Đang tải lịch sử đơn đặt sân từ CSDL SQL Server...</p>
            </div>
          ) : danhSachDon.length === 0 ? (
            /* Trạng thái rỗng khi chưa có đơn hoặc chưa đăng nhập */
            <div className="py-16 px-4 text-center">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border shadow-inner ${
                isDarkMode ? 'bg-slate-950 text-slate-500 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-300'
              }`}>
                {!currentUser ? <Lock className="w-8 h-8 text-amber-500" /> : <Receipt className="w-8 h-8 text-slate-400" />}
              </div>
              {!currentUser ? (
                <>
                  <p className={`text-base font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Vui lòng đăng nhập để xem lịch sử đặt sân của bạn.</p>
                  <p className={`text-xs mt-1 max-w-md mx-auto ${isDarkMode ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
                    Hệ thống bảo mật thông tin cá nhân. Bạn cần đăng nhập tài khoản để tra cứu chi tiết các ca đặt sân và hóa đơn của chính mình.
                  </p>
                  <button
                    onClick={() => router.push('/?login=true')}
                    className="mt-5 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer hover:from-emerald-400 hover:to-teal-400"
                  >
                    Đăng nhập ngay
                  </button>
                </>
              ) : (
                <>
                  <p className={`text-base font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Bạn chưa có đơn đặt sân nào trong hệ thống CSDL.</p>
                  <p className={`text-xs mt-1 max-w-md mx-auto ${isDarkMode ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
                    Khi bạn đặt sân bóng trên trang chủ, toàn bộ thông tin đơn đặt và dịch vụ kèm theo sẽ được hiển thị đầy đủ tại đây.
                  </p>
                  <button
                    onClick={() => router.push('/')}
                    className="mt-5 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer hover:from-emerald-400 hover:to-teal-400"
                  >
                    Đặt sân ngay bây giờ
                  </button>
                </>
              )}
            </div>
          ) : danhSachDonFiltered.length === 0 ? (
            /* Trạng thái khi có đơn nhưng bộ lọc thời gian không tìm thấy đơn nào */
            <div className="py-14 px-4 text-center space-y-3">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto border shadow-inner ${
                isDarkMode ? 'bg-slate-950 text-slate-500 border-slate-800' : 'bg-slate-100 text-slate-500 border-slate-300'
              }`}>
                <CalendarClock className="w-7 h-7 text-amber-500" />
              </div>
              <p className={`text-base font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                Không tìm thấy đơn đặt sân nào!
              </p>
              <p className={`text-xs max-w-sm mx-auto ${isDarkMode ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                Không có trận đấu nào trong mốc thời gian: <strong className="text-emerald-500">{getFilterLabel()}</strong>. Bạn có thể chọn mốc khác hoặc xem toàn bộ.
              </p>
              <button
                type="button"
                onClick={resetFilter}
                className="mt-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Xem tất cả thời gian</span>
              </button>
            </div>
          ) : (
            <>
              {/* 1. GIAO DIỆN DESKTOP / TABLET (Bảng đầy đủ cho màn hình >= md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`border-b text-[11px] uppercase tracking-wider font-bold transition-colors ${
                      isDarkMode ? 'bg-slate-950/80 border-slate-800 text-slate-400' : 'bg-slate-100/90 border-slate-300 text-slate-800 font-bold'
                    }`}>
                      <th className="py-3.5 px-4 whitespace-nowrap">Tên Sân</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Ngày & Giờ Đá</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Dịch Vụ Kèm Theo</th>
                      <th className="py-3.5 px-4 text-right whitespace-nowrap">Tổng Tiền</th>
                      <th className="py-3.5 px-4 text-right whitespace-nowrap">Tiền Cọc</th>
                      <th className="py-3.5 px-4 text-right whitespace-nowrap">Đã Nhận</th>
                      <th className="py-3.5 px-4 text-right whitespace-nowrap">Còn Thiếu</th>
                      <th className="py-3.5 px-4 text-center whitespace-nowrap">Trạng Thái</th>
                      <th className="py-3.5 px-4 text-center whitespace-nowrap">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y text-xs transition-colors ${
                    isDarkMode ? 'divide-slate-800/70' : 'divide-slate-200'
                  }`}>
                    {danhSachDonFiltered.map((item) => {
                      const isPast = isOrderPastTime(item);
                      const isFullyPaid = (item.trang_thai === 'DA_THANH_TOAN' || item.trang_thai === 'HOAN_THANH' || item.trang_thai === 'KET_THUC');
                      const tienCoc = item.tien_coc !== undefined && item.tien_coc !== null ? Number(item.tien_coc) : Math.round((item.tong_tien || 0) * 0.3);
                      const tienDaNhan = isFullyPaid
                        ? Number(item.tong_tien || 0)
                        : (item.tien_da_nhan !== undefined && item.tien_da_nhan !== null
                          ? Number(item.tien_da_nhan)
                          : (item.trang_thai === 'DA_COC' ? tienCoc : 0));
                      const tienThieu = isFullyPaid
                        ? 0
                        : (item.tien_thieu !== undefined && item.tien_thieu !== null
                          ? Number(item.tien_thieu)
                          : Math.max(0, (item.tong_tien || 0) - tienDaNhan));
                      const isCancelled = item.trang_thai === 'DA_HUY';
                      const canAddService = !isCancelled && (item.trang_thai === 'DA_COC' || isFullyPaid || tienDaNhan > 0);

                      return (
                        <tr
                          key={item.id || item.ma_don}
                          className={`transition-all group ${
                            isPast
                              ? isDarkMode ? 'opacity-60 hover:opacity-100 bg-slate-950/40 hover:bg-slate-900/60' : 'opacity-60 hover:opacity-100 bg-slate-50 hover:bg-slate-100/80'
                              : isDarkMode ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50/90'
                          }`}
                        >
                          {/* Tên sân */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <div className={`font-bold transition-colors ${
                              isPast 
                                ? isDarkMode ? 'text-slate-300 group-hover:text-white' : 'text-slate-700 group-hover:text-slate-900'
                                : isDarkMode ? 'text-white group-hover:text-emerald-400' : 'text-slate-900 group-hover:text-emerald-600'
                            }`}>
                              {item.ten_san}
                            </div>
                            {item.ten_loai && (
                              <div className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                                {item.ten_loai}
                              </div>
                            )}
                          </td>

                          {/* Ngày & Khung giờ */}
                          <td className={`py-4 px-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                            <div className="flex items-center gap-1.5 font-medium whitespace-nowrap">
                              <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                              {formatDateDMY(item.ngay_da)}
                            </div>
                            <div className={`flex items-center gap-1.5 font-mono text-[11px] mt-1 whitespace-nowrap ${
                              isDarkMode ? 'text-slate-400' : 'text-slate-700 font-semibold'
                            }`}>
                              <Clock className={`w-3 h-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`} />
                              <span>{item.gio_bat_dau} - {item.gio_ket_thuc}</span>
                            </div>
                            {isPast && (
                              <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] mt-1 font-medium ${
                                isDarkMode ? 'bg-slate-800/80 border-slate-700/60 text-slate-400' : 'bg-slate-100 border-slate-300 text-slate-700 font-semibold'
                              }`}>
                                <Clock3 className="w-2.5 h-2.5" />
                                <span>Đã qua giờ</span>
                              </div>
                            )}
                          </td>

                          {/* Dịch vụ kèm theo */}
                          <td className="py-4 px-4 max-w-[200px]">
                            {item.chi_tiet_dich_vu && item.chi_tiet_dich_vu.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {item.chi_tiet_dich_vu.map((dv, idx) => (
                                  <span
                                    key={idx}
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-medium whitespace-nowrap ${
                                      isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700 font-medium'
                                    }`}
                                    title={`${dv.ten_dich_vu} x${dv.so_luong} = ${formatCurrency(dv.tongtien_dichvu)}`}
                                  >
                                    <Coffee className="w-3 h-3 text-emerald-500" />
                                    <span>{dv.ten_dich_vu} x{dv.so_luong}</span>
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className={`text-[11px] italic ${isDarkMode ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>Chưa chọn dịch vụ</span>
                            )}
                          </td>

                          {/* Tổng tiền */}
                          <td className={`py-4 px-4 font-bold text-right whitespace-nowrap ${
                            isDarkMode ? 'text-white' : 'text-slate-900'
                          }`}>
                            {formatCurrency(item.tong_tien)}
                          </td>

                          {/* Tiền cọc */}
                          <td className={`py-4 px-4 font-medium text-right whitespace-nowrap ${
                            isDarkMode ? 'text-teal-300' : 'text-teal-700'
                          }`}>
                            {formatCurrency(tienCoc)}
                          </td>

                          {/* Đã nhận */}
                          <td className="py-4 px-4 font-bold text-emerald-500 text-right whitespace-nowrap">
                            <span className={`inline-block px-2 py-0.5 rounded border ${
                              isDarkMode ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            }`}>
                              {formatCurrency(tienDaNhan)}
                            </span>
                          </td>

                          {/* Còn thiếu */}
                          <td className="py-4 px-4 font-bold text-right whitespace-nowrap">
                            {tienThieu > 0 ? (
                              <span className={`inline-block px-2 py-0.5 rounded border ${
                                isDarkMode ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                {formatCurrency(tienThieu)}
                              </span>
                            ) : (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] ${
                                isDarkMode ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}>
                                <Check className="w-3 h-3" /> Đã đủ
                              </span>
                            )}
                          </td>

                          {/* Trạng thái thanh toán */}
                          <td className="py-4 px-4 text-center whitespace-nowrap">
                            {renderStatusBadge(item.trang_thai, tienThieu, tienDaNhan, item.tong_tien, item)}
                          </td>

                          {/* Hành động: Nút Xem chi tiết & Hủy đơn */}
                          <td className="py-4 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setSelectedOrderForDetail(item)}
                                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:scale-105 ${
                                  isDarkMode
                                    ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white border-slate-700 hover:border-cyan-500/50'
                                    : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-700 hover:text-cyan-900 border-cyan-200'
                                }`}
                                title="Xem chi tiết đơn đặt sân & hóa đơn"
                              >
                                <Eye className="w-3.5 h-3.5 text-cyan-500" />
                                <span>Chi tiết</span>
                              </button>

                              {/* Nút Đổi sân (tối thiểu trước 30p) */}
                              {!isCancelled && !isPast && item.trang_thai !== 'HOAN_THANH' && (() => {
                                const exCheck = canExchangeOrder(item);
                                if (!exCheck.allowed) return null;
                                return (
                                  <button
                                    onClick={() => handleOpenExchangeModal(item)}
                                    className={`px-2.5 py-1.5 text-[11px] font-bold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:scale-105 ${
                                      isDarkMode
                                        ? 'bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-400 hover:text-indigo-200 border-indigo-800/60 hover:border-indigo-600'
                                        : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 hover:text-indigo-800 border-indigo-200'
                                    }`}
                                    title="Đổi sân bóng hoặc dời ngày/giờ thi đấu (tối thiểu trước 30p)"
                                  >
                                    <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-500" />
                                    <span>Đổi sân</span>
                                  </button>
                                );
                              })()}

                              {!isCancelled && !isPast && item.trang_thai !== 'HOAN_THANH' && (
                                <button
                                  onClick={() => handleOpenCancelModal(item)}
                                  className={`px-2.5 py-1.5 text-[11px] font-bold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:scale-105 ${
                                    isDarkMode
                                      ? 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 hover:text-rose-200 border-rose-800/60 hover:border-rose-600'
                                      : 'bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-800 border-rose-200'
                                  }`}
                                  title="Yêu cầu hủy đơn đặt sân & hoàn tiền"
                                >
                                  <XCircle className="w-3.5 h-3.5 text-rose-500" />
                                  <span>Hủy sân</span>
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

              {/* 2. GIAO DIỆN MOBILE CARD VIEW (Tối ưu hoàn hảo cho mọi dòng điện thoại) */}
              <div className="block md:hidden p-2.5 sm:p-3 space-y-3">
                {danhSachDonFiltered.map((item) => {
                  const isPast = isOrderPastTime(item);
                  const isFullyPaid = (item.trang_thai === 'DA_THANH_TOAN' || item.trang_thai === 'HOAN_THANH' || item.trang_thai === 'KET_THUC');
                  const tienCoc = item.tien_coc !== undefined && item.tien_coc !== null ? Number(item.tien_coc) : Math.round((item.tong_tien || 0) * 0.3);
                  const tienDaNhan = isFullyPaid
                    ? Number(item.tong_tien || 0)
                    : (item.tien_da_nhan !== undefined && item.tien_da_nhan !== null
                      ? Number(item.tien_da_nhan)
                      : (item.trang_thai === 'DA_COC' ? tienCoc : 0));
                  const tienThieu = isFullyPaid
                    ? 0
                    : (item.tien_thieu !== undefined && item.tien_thieu !== null
                      ? Number(item.tien_thieu)
                      : Math.max(0, (item.tong_tien || 0) - tienDaNhan));
                  const isCancelled = item.trang_thai === 'DA_HUY';

                  return (
                    <div
                      key={`mob-${item.id || item.ma_don}`}
                      className={`p-3.5 rounded-2xl border transition-all shadow-sm ${
                        isPast
                          ? isDarkMode ? 'bg-slate-950/50 border-slate-800/60 opacity-80' : 'bg-slate-50 border-slate-200 opacity-80'
                          : isDarkMode ? 'bg-slate-900/90 border-slate-800 shadow-black/40' : 'bg-white border-slate-200 shadow-slate-200/50'
                      }`}
                    >
                      {/* Dòng 1: Tên sân + Badge Trạng thái */}
                      <div className="flex items-start justify-between gap-2 mb-2.5">
                        <div className="min-w-0">
                          <h3 className={`font-bold text-sm sm:text-base leading-tight truncate ${
                            isDarkMode ? 'text-white' : 'text-slate-900'
                          }`}>
                            {item.ten_san}
                          </h3>
                          {item.ten_loai && (
                            <span className={`text-[10px] mt-0.5 inline-block px-1.5 py-0.5 rounded ${
                              isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600 font-medium'
                            }`}>
                              {item.ten_loai}
                            </span>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          {renderStatusBadge(item.trang_thai, tienThieu, tienDaNhan, item.tong_tien, item)}
                        </div>
                      </div>

                      {/* Dòng 2: Thời gian đặt sân (Ngày & Giờ) */}
                      <div className={`p-2.5 rounded-xl text-xs mb-2.5 flex items-center justify-between border ${
                        isDarkMode ? 'bg-slate-950/70 border-slate-800/80' : 'bg-slate-50 border-slate-200/80'
                      }`}>
                        <div className="flex items-center gap-1.5 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{formatDateDMY(item.ngay_da)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold">
                          <Clock className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span>{item.gio_bat_dau} - {item.gio_ket_thuc}</span>
                        </div>
                        {isPast && (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] border font-medium ${
                            isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-200 text-slate-700 border-slate-300'
                          }`}>
                            Đã qua giờ
                          </span>
                        )}
                      </div>

                      {/* Dòng 3: Nút Xem chi tiết (hiển thị đầy đủ thông tin) & Hủy */}
                      <div className="flex items-center gap-2 pt-1 border-t border-slate-800/30">
                        <button
                          onClick={() => setSelectedOrderForDetail(item)}
                          className={`flex-1 py-2 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm ${
                            isDarkMode
                              ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-slate-700'
                              : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border-cyan-200'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5 text-cyan-500" />
                          <span>Chi tiết</span>
                        </button>

                        {/* Nút Đổi sân */}
                        {!isCancelled && !isPast && item.trang_thai !== 'HOAN_THANH' && (() => {
                          const exCheck = canExchangeOrder(item);
                          if (!exCheck.allowed) return null;
                          return (
                            <button
                              onClick={() => handleOpenExchangeModal(item)}
                              className={`px-3 py-2 text-xs font-bold rounded-xl border flex items-center justify-center gap-1 transition active:scale-95 shrink-0 ${
                                isDarkMode
                                  ? 'bg-indigo-950/30 hover:bg-indigo-900/50 text-indigo-400 border-indigo-800/50'
                                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border-indigo-200'
                              }`}
                              title="Đổi sang sân khác hoặc dời giờ đá"
                            >
                              <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-500" />
                              <span>Đổi sân</span>
                            </button>
                          );
                        })()}

                        {/* Nút Hủy sân */}
                        {!isCancelled && !isPast && item.trang_thai !== 'HOAN_THANH' && (
                          <button
                            onClick={() => handleOpenCancelModal(item)}
                            className={`px-3.5 py-2 text-xs font-bold rounded-xl border flex items-center justify-center gap-1 transition active:scale-95 shrink-0 ${
                              isDarkMode
                                ? 'bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 border-rose-800/50'
                                : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200'
                            }`}
                            title="Yêu cầu hủy đơn đặt sân"
                          >
                            <XCircle className="w-3.5 h-3.5 text-rose-500" />
                            <span>Hủy</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: THÊM DỊCH VỤ VÀO HÓA ĐƠN */}
      {/* ========================================================================= */}
      {selectedOrderForService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className={`border rounded-2xl sm:rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] transition-colors ${
            isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            
            {/* Modal Header */}
            <div className={`px-4 sm:px-6 py-3 sm:py-4 border-b flex items-center justify-between transition-colors ${
              isDarkMode ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
            }`}>
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className={`p-1.5 sm:p-2 rounded-xl border shrink-0 ${
                  isDarkMode ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                }`}>
                  <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className={`text-sm sm:text-lg font-bold truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Thêm Dịch Vụ Vào Đơn Hàng</h3>
                  <p className={`text-[11px] sm:text-xs truncate ${isDarkMode ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
                    Đơn: <span className="font-mono text-emerald-500 font-bold">{selectedOrderForService.ma_don || `DDS-${selectedOrderForService.id}`}</span> • {selectedOrderForService.ten_san}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrderForService(null)}
                className={`p-1.5 sm:p-2 rounded-xl transition-colors shrink-0 ${
                  isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Danh sách dịch vụ */}
            <div className="p-3.5 sm:p-6 overflow-y-auto space-y-3 sm:space-y-4 flex-1">
              <div className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs ${
                isDarkMode ? 'bg-slate-950/70 border-slate-800/80' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <span className={isDarkMode ? 'text-slate-400' : 'text-slate-700 font-semibold'}>Tổng tiền hiện tại của đơn:</span>
                  <span className={`font-bold ml-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(selectedOrderForService.tong_tien)}</span>
                </div>
                <div>
                  <span className={isDarkMode ? 'text-slate-400' : 'text-slate-700 font-semibold'}>Đã trả:</span>
                  <span className="font-bold text-emerald-500 ml-2">{formatCurrency(selectedOrderForService.tien_da_nhan || 0)}</span>
                </div>
              </div>

              <div className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Chọn nước uống, phụ kiện thêm vào sân:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableServices.map((service) => {
                  const currentQty = serviceCart[service.id] || 0;
                  return (
                    <div
                      key={service.id}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                        currentQty > 0
                          ? isDarkMode ? 'bg-emerald-500/10 border-emerald-500/40 shadow-sm' : 'bg-emerald-50/80 border-emerald-300 shadow-sm'
                          : isDarkMode ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className={`font-bold text-xs flex items-center gap-1.5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                          <Coffee className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{service.ten_dich_vu}</span>
                        </div>
                        <div className="text-xs font-semibold text-emerald-500">
                          {formatCurrency(service.don_gia)} <span className={`text-[10px] font-normal ${isDarkMode ? 'text-slate-400' : 'text-slate-600 font-semibold'}`}>/ {service.don_vi_tinh}</span>
                        </div>
                        <div className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                          Còn lại trong kho: {service.ton_kho}
                        </div>
                      </div>

                      {/* Bộ tăng giảm số lượng */}
                      <div className={`flex items-center gap-2 px-2 py-1 rounded-xl border ${
                        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                      }`}>
                        <button
                          type="button"
                          onClick={() => handleUpdateServiceQuantity(service.id, -1)}
                          disabled={currentQty <= 0}
                          className={`w-6 h-6 rounded-lg disabled:opacity-30 flex items-center justify-center cursor-pointer transition-colors ${
                            isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className={`w-6 text-center font-mono font-bold text-xs ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                          {currentQty}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateServiceQuantity(service.id, 1)}
                          disabled={currentQty >= service.ton_kho}
                          className="w-6 h-6 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 text-slate-950 font-bold flex items-center justify-center cursor-pointer transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`p-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 ${
              isDarkMode ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-50'
            }`}>
              <div>
                <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-700 font-semibold'}`}>Tiền dịch vụ đã chọn:</div>
                <div className="text-lg font-black text-emerald-500">
                  {formatCurrency(calculateAddedServicesTotal())}
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setSelectedOrderForService(null)}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition-colors w-full sm:w-auto cursor-pointer ${
                    isDarkMode ? 'border-slate-800 text-slate-300 hover:bg-slate-900' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAddServices}
                  disabled={isAddingService}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 w-full sm:w-auto cursor-pointer"
                >
                  {isAddingService ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Xác nhận lưu dịch vụ</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: THANH TOÁN VIETQR PAYOS (MB BANK) */}
      {/* ========================================================================= */}
      {selectedOrderForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className={`border rounded-2xl sm:rounded-3xl w-full max-w-md max-h-[92vh] overflow-hidden shadow-2xl flex flex-col my-auto transition-colors ${
            isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            
            {/* Header VietQR */}
            <div className={`px-4 sm:px-5 py-3 border-b flex items-center justify-between shrink-0 ${
              isDarkMode ? 'border-slate-800 bg-slate-950/90' : 'border-slate-200 bg-slate-50'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-lg border ${
                  isDarkMode ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                }`}>
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Thanh Toán Số Tiền Còn Thiếu
                  </h3>
                  <p className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
                    Đơn đặt: <span className="text-emerald-500 font-mono font-bold">{selectedOrderForPayment.ma_don || `DDS-${selectedOrderForPayment.id}`}</span>
                    <span className="ml-1.5 text-amber-500 font-bold">• VietQR MB Bank</span>
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseQRModal}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Nội dung thanh toán hoặc màn hình thành công */}
            <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto">
              {isPaymentSuccess ? (
                <div className="py-6 text-center space-y-3">
                  <div className="w-14 h-14 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-500/40 animate-pulse">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Thanh Toán Thành Công!</h4>
                    <p className={`text-xs mt-1 max-w-xs mx-auto ${isDarkMode ? 'text-slate-300' : 'text-slate-700 font-medium'}`}>
                      Hệ thống MB Bank đã xác nhận khoản thanh toán. Đơn hàng của bạn đã hoàn tất thanh toán!
                    </p>
                  </div>
                  <button
                    onClick={handleCloseQRModal}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 cursor-pointer hover:from-emerald-400 hover:to-teal-400 transition-all"
                  >
                    Hoàn tất & Đóng
                  </button>
                </div>
              ) : isCreatingPayOS ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-7 h-7 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>Đang khởi tạo mã VietQR MB Bank...</p>
                </div>
              ) : payOSData ? (
                <>
                  {/* Mã QR code quét bằng App ngân hàng */}
                  <div className="flex flex-col items-center justify-center">
                    <div className="p-2.5 bg-white rounded-2xl border border-slate-200 shadow-xl inline-block relative">
                      <img
                        src={`https://img.vietqr.io/image/${payOSData.bin || '970422'}-${payOSData.accountNumber || 'VQRQAMLAF1810'}-compact2.png?amount=${payOSData.amount}&addInfo=${encodeURIComponent(payOSData.description)}&accountName=${encodeURIComponent(payOSData.accountName || 'CAO VAN HOT XOAN')}`}
                        alt="Mã VietQR MB Bank"
                        className="w-40 h-40 sm:w-44 sm:h-44 object-contain rounded-lg"
                      />
                    </div>
                    <p className={`text-[10px] mt-1.5 text-center ${isDarkMode ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
                      Quét mã bằng App ngân hàng bất kỳ để thanh toán tự động
                    </p>
                  </div>

                  {/* Thông tin chuyển khoản chi tiết */}
                  <div className={`rounded-xl p-3 sm:p-3.5 border space-y-2 text-[11px] sm:text-xs ${
                    isDarkMode ? 'bg-slate-950 border-slate-800/90' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className={`flex items-center justify-between pb-1.5 border-b ${isDarkMode ? 'border-slate-800/70' : 'border-slate-200'}`}>
                      <span className={isDarkMode ? 'text-slate-400' : 'text-slate-700 font-bold'}>Ngân hàng:</span>
                      <span className={`font-bold text-right ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{payOSData.bankName || 'MB Bank (Quân Đội)'}</span>
                    </div>

                    <div className={`flex items-center justify-between pb-1.5 border-b ${isDarkMode ? 'border-slate-800/70' : 'border-slate-200'}`}>
                      <span className={isDarkMode ? 'text-slate-400' : 'text-slate-700 font-bold'}>Chủ tài khoản:</span>
                      <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{payOSData.accountName || 'CAO VAN HOT XOAN'}</span>
                    </div>

                    <div className={`flex items-center justify-between pb-1.5 border-b ${isDarkMode ? 'border-slate-800/70' : 'border-slate-200'}`}>
                      <span className={isDarkMode ? 'text-slate-400' : 'text-slate-700 font-bold'}>Số tài khoản:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{payOSData.accountNumber}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(payOSData.accountNumber, 'Số tài khoản')}
                          className={`p-1 rounded cursor-pointer ${isDarkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-600 hover:text-slate-900'}`}
                          title="Sao chép"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className={`flex items-center justify-between pb-1.5 border-b ${isDarkMode ? 'border-slate-800/70' : 'border-slate-200'}`}>
                      <span className={isDarkMode ? 'text-slate-400' : 'text-slate-700 font-bold'}>Số tiền thanh toán:</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`font-mono font-black text-xs sm:text-sm ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                          {formatCurrency(payOSData.amount)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(String(payOSData.amount), 'Số tiền')}
                          className={`p-1 rounded cursor-pointer ${isDarkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-600 hover:text-slate-900'}`}
                          title="Sao chép"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={isDarkMode ? 'text-slate-400' : 'text-slate-700 font-bold'}>Nội dung:</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`font-mono font-bold px-2 py-0.5 rounded border ${
                          isDarkMode ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                        }`}>
                          {payOSData.description}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(payOSData.description, 'Nội dung')}
                          className={`p-1 rounded cursor-pointer ${isDarkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-600 hover:text-slate-900'}`}
                          title="Sao chép"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Cảnh báo khi Sport 247 chưa nhận được tiền */}
                  {payOSAlertMessage && (
                    <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start gap-2.5 shadow-md animate-fade-in">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                      <span className="leading-relaxed font-medium">{payOSAlertMessage}</span>
                    </div>
                  )}

                  {/* Nút kiểm tra trạng thái */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => checkPayOSStatus(payOSData.orderCode, true)}
                      disabled={isCheckingPayOS}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                        isDarkMode
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                      }`}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isCheckingPayOS ? 'animate-spin text-emerald-400' : ''}`} />
                      <span>{isCheckingPayOS ? 'Đang kiểm tra đối soát...' : 'Tôi đã chuyển khoản'}</span>
                    </button>
                  </div>
                </>
              ) : null}
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: XEM CHI TIẾT HÓA ĐƠN & ĐƠN ĐẶT SÂN */}
      {/* ========================================================================= */}
      {selectedOrderForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className={`border rounded-2xl sm:rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col my-auto max-h-[90vh] transition-colors ${
            isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            
            {/* Header Modal */}
            <div className={`px-5 py-4 border-b flex items-center justify-between shrink-0 ${
              isDarkMode ? 'border-slate-800 bg-slate-950/80' : 'border-slate-200 bg-slate-50'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl border ${
                  isDarkMode ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-cyan-50 text-cyan-600 border-cyan-200'
                }`}>
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-base font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    <span>Chi Tiết Hóa Đơn Đặt Sân</span>
                    {isOrderPastTime(selectedOrderForDetail) && (
                      <span className={`text-[10px] font-normal px-2 py-0.5 rounded border ${
                        isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-700 font-bold border-slate-300'
                      }`}>
                        Đã qua giờ
                      </span>
                    )}
                  </h3>
                  <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
                    Mã đơn: <span className="font-mono text-emerald-500 font-bold">{selectedOrderForDetail.ma_don || `DDS-${selectedOrderForDetail.id}`}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrderForDetail(null)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nội dung chi tiết hóa đơn */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Thông tin sân & trận đấu */}
              <div className={`p-3.5 rounded-2xl border space-y-2.5 ${
                isDarkMode ? 'bg-slate-950/70 border-slate-800/80 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <div className={`font-bold uppercase tracking-wider text-[11px] pb-1 border-b ${
                  isDarkMode ? 'text-slate-300 border-slate-800/60' : 'text-slate-700 border-slate-200'
                }`}>
                  Thông Tin Trận Đấu
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className={`block ${isDarkMode ? 'text-slate-400' : 'text-slate-700 font-semibold'}`}>Sân bóng:</span>
                    <span className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{selectedOrderForDetail.ten_san}</span>
                    {selectedOrderForDetail.ten_loai && (
                      <span className={`text-[11px] block ${isDarkMode ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>({selectedOrderForDetail.ten_loai})</span>
                    )}
                  </div>
                  <div>
                    <span className={`block ${isDarkMode ? 'text-slate-400' : 'text-slate-700 font-semibold'}`}>Ngày thi đấu:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-500">{formatDateDMY(selectedOrderForDetail.ngay_da)}</span>
                  </div>
                  <div>
                    <span className={`block ${isDarkMode ? 'text-slate-400' : 'text-slate-700 font-semibold'}`}>Khung giờ đá:</span>
                    <span className={`font-mono font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{selectedOrderForDetail.gio_bat_dau} - {selectedOrderForDetail.gio_ket_thuc}</span>
                  </div>
                  <div>
                    <span className={`block ${isDarkMode ? 'text-slate-400' : 'text-slate-700 font-semibold'}`}>Trạng thái:</span>
                    <span className="mt-0.5 block">{renderStatusBadge(selectedOrderForDetail.trang_thai, selectedOrderForDetail.tien_thieu || 0, selectedOrderForDetail.tien_da_nhan || 0, selectedOrderForDetail.tong_tien, selectedOrderForDetail)}</span>
                  </div>
                </div>

                {/* Khối thông báo hủy đơn & hoàn tiền (nếu đã hủy) */}
                {selectedOrderForDetail.trang_thai?.includes('HUY') && (
                  <div className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
                    selectedOrderForDetail.trang_thai_hoan === 'DA_HOAN'
                      ? isDarkMode ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : isDarkMode ? 'bg-amber-950/40 border-amber-800/50 text-amber-300' : 'bg-amber-50 border-amber-300 text-amber-900'
                  }`}>
                    <div className="flex items-center gap-2 font-bold text-sm">
                      {selectedOrderForDetail.trang_thai_hoan === 'DA_HOAN' ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span>Đã chuyển khoản hoàn tiền thành công</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
                          <span>Đơn đã hủy • Đang chờ Ban Quản Lý chuyển khoản hoàn tiền</span>
                        </>
                      )}
                    </div>
                    <div><strong>Số tiền hoàn:</strong> {formatCurrency(selectedOrderForDetail.so_tien_hoan || 0)} ({selectedOrderForDetail.ty_le_hoan || 0}%)</div>
                    {selectedOrderForDetail.so_tai_khoan && (
                      <div><strong>Tài khoản nhận:</strong> {selectedOrderForDetail.so_tai_khoan} - {selectedOrderForDetail.ten_ngan_hang} (Chủ TK: {selectedOrderForDetail.ten_chu_tai_khoan || selectedOrderForDetail.ten_khach_hang})</div>
                    )}
                    {selectedOrderForDetail.ngay_chuyen_khoan && (
                      <div><strong>Thời gian chuyển:</strong> {new Date(selectedOrderForDetail.ngay_chuyen_khoan).toLocaleString('vi-VN')}</div>
                    )}
                  </div>
                )}

                {selectedOrderForDetail.ghi_chu && (
                  <div className={`pt-2 border-t text-[11px] ${
                    isDarkMode ? 'border-slate-800/60 text-slate-400' : 'border-slate-200 text-slate-700'
                  }`}>
                    <span className={isDarkMode ? 'text-slate-400' : 'text-slate-700 font-bold'}>Ghi chú:</span> {selectedOrderForDetail.ghi_chu}
                  </div>
                )}
              </div>

              {/* Thông tin khách hàng & đặt sân */}
              <div className={`p-3.5 rounded-2xl border space-y-2 ${
                isDarkMode ? 'bg-slate-950/70 border-slate-800/80 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <div className={`font-bold uppercase tracking-wider text-[11px] pb-1 border-b ${
                  isDarkMode ? 'text-slate-300 border-slate-800/60' : 'text-slate-700 border-slate-200'
                }`}>
                  Thông Tin Người Đặt
                </div>
                <div className="flex items-center justify-between">
                  <span className={isDarkMode ? 'text-slate-400' : 'text-slate-700 font-semibold'}>Khách hàng:</span>
                  <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{selectedOrderForDetail.ten_khach_hang || 'Khách vãng lai'}</span>
                </div>
                {selectedOrderForDetail.sdt_khach_hang && (
                  <div className="flex items-center justify-between">
                    <span className={isDarkMode ? 'text-slate-400' : 'text-slate-700 font-semibold'}>Số điện thoại:</span>
                    <span className={`font-mono font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>{selectedOrderForDetail.sdt_khach_hang}</span>
                  </div>
                )}
                {selectedOrderForDetail.ngay_tao && (
                  <div className="flex items-center justify-between">
                    <span className={isDarkMode ? 'text-slate-400' : 'text-slate-700 font-semibold'}>Thời gian tạo đơn:</span>
                    <span className={`font-mono text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>{new Date(selectedOrderForDetail.ngay_tao).toLocaleString('vi-VN')}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className={isDarkMode ? 'text-slate-400' : 'text-slate-700 font-semibold'}>Phương thức:</span>
                  <span className={`font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-900'}`}>{selectedOrderForDetail.phuong_thuc === 'CHUYEN_KHOAN' ? 'Chuyển khoản (VietQR)' : 'Tiền mặt tại quầy'}</span>
                </div>
              </div>

              {/* Chi tiết chi phí */}
              <div className={`p-3.5 rounded-2xl border space-y-2.5 ${
                isDarkMode ? 'bg-slate-950/70 border-slate-800/80' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className={`font-bold uppercase tracking-wider text-[11px] pb-1 border-b ${
                  isDarkMode ? 'text-slate-300 border-slate-800/60' : 'text-slate-700 border-slate-200'
                }`}>
                  Bảng Chi Phí & Dịch Vụ
                </div>

                <div className={`flex items-center justify-between ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  <span>Tiền thuê sân bóng:</span>
                  <span className={`font-bold font-mono ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(selectedOrderForDetail.tien_san || selectedOrderForDetail.tong_tien)}</span>
                </div>

                {/* Danh sách dịch vụ nếu có */}
                {selectedOrderForDetail.chi_tiet_dich_vu && selectedOrderForDetail.chi_tiet_dich_vu.length > 0 ? (
                  <div className={`pt-2 border-t space-y-1.5 ${isDarkMode ? 'border-slate-800/60' : 'border-slate-200'}`}>
                    <div className={`text-[11px] font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-700 font-bold'}`}>Dịch vụ / Nước uống đã gọi:</div>
                    {selectedOrderForDetail.chi_tiet_dich_vu.map((dv, idx) => (
                      <div key={idx} className={`flex items-center justify-between text-[11px] pl-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        <span>• {dv.ten_dich_vu} <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600 font-medium'}>(x{dv.so_luong})</span>:</span>
                        <span className="font-mono text-emerald-500">{formatCurrency(dv.tongtien_dichvu)}</span>
                      </div>
                    ))}
                  </div>
                ) : null}

                {/* Tổng kết tài chính */}
                <div className={`pt-2.5 border-t space-y-1.5 ${isDarkMode ? 'border-slate-800/80' : 'border-slate-200'}`}>
                  <div className="flex items-center justify-between text-sm font-bold">
                    <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>Tổng tiền thanh toán:</span>
                    <span className="text-emerald-500 font-mono text-base">{formatCurrency(selectedOrderForDetail.tong_tien)}</span>
                  </div>
                  <div className={`flex items-center justify-between text-xs ${isDarkMode ? 'text-teal-300' : 'text-teal-700'}`}>
                    <span>Tiền cọc quy định:</span>
                    <span className="font-mono font-semibold">{formatCurrency(selectedOrderForDetail.tien_coc ?? Math.round(selectedOrderForDetail.tong_tien * 0.3))}</span>
                  </div>
                  {(() => {
                    const isFullyPaid = (selectedOrderForDetail.trang_thai === 'DA_THANH_TOAN' || selectedOrderForDetail.trang_thai === 'HOAN_THANH' || selectedOrderForDetail.trang_thai === 'KET_THUC');
                    const modalDaNhan = isFullyPaid ? selectedOrderForDetail.tong_tien : (selectedOrderForDetail.tien_da_nhan || 0);
                    const modalThieu = isFullyPaid ? 0 : (selectedOrderForDetail.tien_thieu || Math.max(0, (selectedOrderForDetail.tong_tien || 0) - modalDaNhan));
                    return (
                      <>
                        <div className={`flex items-center justify-between text-xs ${isDarkMode ? 'text-slate-300' : 'text-slate-800 font-semibold'}`}>
                          <span>Đã nhận / Đã thanh toán:</span>
                          <span className="font-mono font-bold text-emerald-500">{formatCurrency(modalDaNhan)}</span>
                        </div>
                        <div className={`flex items-center justify-between text-xs font-bold pt-1 border-t ${isDarkMode ? 'border-slate-800/50' : 'border-slate-200'}`}>
                          <span className={isDarkMode ? 'text-slate-400' : 'text-slate-700 font-bold'}>Số tiền còn thiếu:</span>
                          <span className={`font-mono text-sm ${modalThieu > 0 ? (isDarkMode ? 'text-amber-400' : 'text-amber-600') : 'text-emerald-500'}`}>
                            {modalThieu > 0 ? formatCurrency(modalThieu) : '0 ₫ (Đã thanh toán đủ)'}
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className={`p-4 border-t flex items-center justify-end gap-2 ${
              isDarkMode ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-50'
            }`}>
              {(() => {
                const isFullyPaid = (selectedOrderForDetail.trang_thai === 'DA_THANH_TOAN' || selectedOrderForDetail.trang_thai === 'HOAN_THANH' || selectedOrderForDetail.trang_thai === 'KET_THUC');
                const modalDaNhan = isFullyPaid ? Number(selectedOrderForDetail.tong_tien || 0) : Number(selectedOrderForDetail.tien_da_nhan || 0);
                const modalThieu = isFullyPaid ? 0 : Number(selectedOrderForDetail.tien_thieu || Math.max(0, (selectedOrderForDetail.tong_tien || 0) - modalDaNhan));
                if (modalThieu > 0 && selectedOrderForDetail.trang_thai !== 'DA_HUY') {
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        const orderToPay = selectedOrderForDetail;
                        setSelectedOrderForDetail(null);
                        handleOpenVietQRPayment(orderToPay);
                      }}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:from-emerald-400 hover:to-teal-400 transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/20 hover:scale-105"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Thanh toán VietQR ({formatCurrency(modalThieu)})</span>
                    </button>
                  );
                }
                return null;
              })()}
              {!isOrderPastTime(selectedOrderForDetail) && !selectedOrderForDetail.trang_thai?.includes('HUY') && selectedOrderForDetail.trang_thai !== 'HOAN_THANH' && (() => {
                const exCheck = canExchangeOrder(selectedOrderForDetail);
                if (!exCheck.allowed) return null;
                return (
                  <button
                    type="button"
                    onClick={() => {
                      const orderToExchange = selectedOrderForDetail;
                      setSelectedOrderForDetail(null);
                      handleOpenExchangeModal(orderToExchange);
                    }}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Đổi sân này</span>
                  </button>
                );
              })()}
              {!isOrderPastTime(selectedOrderForDetail) && !selectedOrderForDetail.trang_thai?.includes('HUY') && selectedOrderForDetail.trang_thai !== 'HOAN_THANH' && (
                <button
                  type="button"
                  onClick={() => {
                    const orderToCancel = selectedOrderForDetail;
                    setSelectedOrderForDetail(null);
                    handleOpenCancelModal(orderToCancel);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105"
                >
                  <XCircle className="w-3.5 h-3.5 text-rose-500" />
                  <span>Hủy sân này</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedOrderForDetail(null)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                }`}
              >
                Đóng
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: HỦY ĐƠN ĐẶT SÂN & HOÀN TIỀN */}
      {/* ========================================================================= */}
      {cancelModalOrder && (() => {
        const { hoursLeft, refundRate, refundAmount, totalPaid } = calculateCancelRefund(cancelModalOrder);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className={`border rounded-2xl sm:rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] transition-colors ${
              isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}>
              {/* Header */}
              <div className={`px-4 sm:px-6 py-3.5 sm:py-4 border-b flex items-center justify-between transition-colors ${
                isDarkMode ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
              }`}>
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-xl bg-rose-500/15 text-rose-500 border border-rose-500/30 shrink-0">
                    <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm sm:text-base text-rose-500 truncate">Xác Nhận Hủy Đặt Sân</h3>
                    <p className={`text-[11px] sm:text-xs truncate ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      Mã đơn #{cancelModalOrder.id} • {cancelModalOrder.ten_san}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setCancelModalOrder(null);
                    setCancelModalError(null);
                    setToastMessage(null);
                  }}
                  disabled={isSubmittingCancel}
                  className={`p-1.5 sm:p-2 rounded-xl border transition-colors cursor-pointer shrink-0 ${
                    isDarkMode ? 'border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white' : 'border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-3.5 sm:p-6 overflow-y-auto space-y-3.5 sm:space-y-4 text-xs">
                {/* Thông tin đơn */}
                <div className={`p-4 rounded-2xl border space-y-2 ${
                  isDarkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Sân bóng:</span>
                    <span className="font-bold">{cancelModalOrder.ten_san}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Thời gian đá:</span>
                    <span className="font-mono font-bold">{formatDateDMY(cancelModalOrder.ngay_da)} ({cancelModalOrder.gio_bat_dau} - {cancelModalOrder.gio_ket_thuc})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Số tiền bạn đã trả:</span>
                    <span className="font-bold text-sm text-cyan-400">{formatCurrency(totalPaid)}</span>
                  </div>
                </div>

                {/* Chính sách hoàn tiền */}
                <div className={`p-4 rounded-2xl border space-y-2 ${
                  refundRate === 100
                    ? isDarkMode ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : refundRate === 50
                    ? isDarkMode ? 'bg-amber-950/40 border-amber-800/60 text-amber-300' : 'bg-amber-50 border-amber-300 text-amber-900'
                    : isDarkMode ? 'bg-rose-950/40 border-rose-800/60 text-rose-300' : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}>
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-sm">Chính Sách Hoàn Tiền:</span>
                    <span className="text-sm px-2.5 py-0.5 rounded-full font-black bg-black/20 border border-current">
                      Tỷ lệ hoàn: {refundRate}%
                    </span>
                  </div>
                  <div className="text-[11px] leading-relaxed">
                    {hoursLeft >= 5 ? (
                      <span>✅ Bạn đang hủy trước giờ đá <strong>{hoursLeft.toFixed(1)} giờ</strong> (&ge; 5 tiếng), được hoàn đủ <strong>100%</strong> số tiền đã thanh toán/cọc.</span>
                    ) : hoursLeft >= 1 ? (
                      <span>⚠️ Bạn đang hủy trước giờ đá <strong>{hoursLeft.toFixed(1)} giờ</strong> (từ 1 đến dưới 5 tiếng trước giờ đá / &ge; 60 phút), được hoàn <strong>50%</strong> số tiền đã thanh toán/cọc.</span>
                    ) : (
                      <span>❌ Bạn đang hủy trước giờ đá <strong>{hoursLeft.toFixed(1)} giờ</strong> (&lt; 1 tiếng / dưới 60 phút). Theo thể lệ quy định, đơn hủy không được hoàn tiền.</span>
                    )}
                  </div>

                  {/* Bảng quy định thể lệ rõ ràng */}
                  <div className={`p-2.5 rounded-xl border text-[10px] space-y-1 ${
                    isDarkMode ? 'bg-black/30 border-white/10 text-slate-300' : 'bg-white/80 border-black/10 text-slate-700'
                  }`}>
                    <div className="font-bold uppercase tracking-wider text-[10px]">📋 Thể lệ hủy sân & hoàn tiền:</div>
                    <div className="flex items-center justify-between">
                      <span>• Hủy trước từ 5 tiếng trở lên:</span>
                      <strong className="text-emerald-500 font-bold">Hoàn 100%</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>• Hủy từ 1 đến 4 tiếng trước giờ (từ 60 phút):</span>
                      <strong className="text-amber-500 font-bold">Hoàn 50%</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>• Dưới 1 tiếng (dưới 60 phút):</span>
                      <strong className="text-rose-500 font-bold">Không hoàn tiền (0%)</strong>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-current/20 flex items-center justify-between">
                    <span className="font-bold uppercase tracking-wider text-[11px]">Số tiền hoàn thực tế:</span>
                    <span className="font-black text-base">{formatCurrency(refundAmount)}</span>
                  </div>
                </div>

                {/* Form thông tin ngân hàng nhận hoàn tiền */}
                {refundRate > 0 && (
                  <div className={`p-4 rounded-2xl border space-y-3 ${
                    isDarkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50/80 border-slate-200'
                  }`}>
                    <div className="font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-cyan-400">
                      <Landmark className="w-3.5 h-3.5" />
                      <span>Thông Tin Nhận Tiền Hoàn</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="block text-[11px] font-semibold text-slate-400">Hình thức nhận:</label>
                        <span className="text-[10px] text-cyan-500 font-medium">Dữ liệu ngân hàng thật (VietQR / Napas)</span>
                      </div>
                      <BankSelectDropdown
                        value={cancelBankName}
                        onChange={(val) => {
                          setCancelBankName(val);
                          if (cancelModalError) setCancelModalError(null);
                        }}
                        banks={realBankList}
                        isDarkMode={isDarkMode}
                        cashLabel="Nhận tiền mặt tại quầy"
                      />
                    </div>

                    {cancelBankName !== 'Nhận tiền mặt tại quầy' && (
                      <>
                        <div className="space-y-1">
                          <label className="block text-[11px] font-semibold text-slate-400">
                            Số tài khoản thụ hưởng: <span className="text-rose-500 font-bold">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="Nhập số tài khoản ngân hàng..."
                            value={cancelBankAccount}
                            onChange={(e) => {
                              setCancelBankAccount(e.target.value);
                              if (cancelModalError) setCancelModalError(null);
                            }}
                            className={`w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold outline-none transition-all ${
                              cancelModalError && !cancelBankAccount.trim()
                                ? 'border-rose-500 bg-rose-500/10 text-white focus:border-rose-400 ring-2 ring-rose-500/30'
                                : isDarkMode ? 'bg-slate-900 border-slate-700 text-white focus:border-cyan-500' : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-600'
                            }`}
                          />
                          {cancelModalError && !cancelBankAccount.trim() && (
                            <p className="text-[10px] text-rose-400 font-semibold flex items-center gap-1 mt-0.5 animate-pulse">
                              <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
                              <span>Vui lòng nhập số tài khoản ngân hàng</span>
                            </p>
                          )}
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[11px] font-semibold text-slate-400">
                            Tên chủ tài khoản: <span className="text-rose-500 font-bold">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="NGUYEN VAN A (IN HOA KHÔNG DẤU)..."
                            value={cancelAccountHolder}
                            onChange={(e) => {
                              setCancelAccountHolder(toUpperCaseNoAccents(e.target.value));
                              if (cancelModalError) setCancelModalError(null);
                            }}
                            className={`w-full px-3 py-2 rounded-xl border text-xs font-bold uppercase outline-none transition-all ${
                              cancelModalError && !cancelAccountHolder.trim()
                                ? 'border-rose-500 bg-rose-500/10 text-white focus:border-rose-400 ring-2 ring-rose-500/30'
                                : isDarkMode ? 'bg-slate-900 border-slate-700 text-white focus:border-cyan-500' : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-600'
                            }`}
                          />
                          {cancelModalError && !cancelAccountHolder.trim() && (
                            <p className="text-[10px] text-rose-400 font-semibold flex items-center gap-1 mt-0.5 animate-pulse">
                              <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
                              <span>Vui lòng nhập tên chủ tài khoản (in hoa không dấu)</span>
                            </p>
                          )}
                        </div>
                      </>
                    )}

                    {cancelBankName === 'Nhận tiền mặt tại quầy' && (
                      <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[11px]">
                        ℹ️ Quý khách vui lòng đến quầy lễ tân sân bóng đọc mã đơn <strong>#{cancelModalOrder.id}</strong> để nhân viên gửi lại tiền mặt trực tiếp.
                      </div>
                    )}
                  </div>
                )}

                {/* Banner cảnh báo lỗi hiển thị trực tiếp trên modal */}
                {cancelModalError && (
                  <div className="p-3 sm:p-3.5 rounded-2xl border border-rose-500/60 bg-rose-500/15 text-rose-300 text-xs flex items-center gap-2.5 animate-bounce shadow-lg shadow-rose-950/40">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span className="font-bold leading-relaxed">{cancelModalError}</span>
                  </div>
                )}

                {/* Lý do hủy */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-400">Lý do hủy đơn:</label>
                  <select
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-medium outline-none transition-all ${
                      isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="Bận việc đột xuất">Bận việc đột xuất</option>
                    <option value="Thời tiết xấu / Mưa to">Thời tiết xấu / Mưa to</option>
                    <option value="Đội bóng thiếu người">Đội bóng thiếu người</option>
                    <option value="Thay đổi kế hoạch thi đấu">Thay đổi kế hoạch thi đấu</option>
                    <option value="Khác">Lý do khác</option>
                  </select>
                </div>

                <div className="text-[11px] text-amber-500/90 italic">
                  * Sau khi bạn bấm xác nhận, khung giờ đặt sân sẽ được giải phóng ngay lập tức. Phiếu hoàn tiền sẽ được chuyển tới Ban Quản Lý để hoàn tất chuyển tiền.
                </div>
              </div>

              {/* Footer */}
              <div className={`p-4 border-t flex items-center justify-end gap-2 ${
                isDarkMode ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-50'
              }`}>
                <button
                  type="button"
                  onClick={() => {
                    setCancelModalOrder(null);
                    setCancelModalError(null);
                    setToastMessage(null);
                  }}
                  disabled={isSubmittingCancel}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                  }`}
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancelOrder}
                  disabled={isSubmittingCancel}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-rose-500/20 disabled:opacity-50"
                >
                  {isSubmittingCancel ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang xử lý hủy...</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Xác Nhận Hủy Sân</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* MODAL 5: LỌC THỜI GIAN ĐẶT SÂN */}
      {/* ========================================================================= */}
      {isTimeFilterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className={`border rounded-2xl sm:rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh] transition-colors ${
            isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            {/* Header */}
            <div className={`px-4 sm:px-5 py-3.5 border-b flex items-center justify-between transition-colors ${
              isDarkMode ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl border shrink-0 ${
                  isDarkMode ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                }`}>
                  <CalendarClock className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <h3 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Lọc Theo Thời Gian</h3>
                  <p className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>Chọn mốc thời gian lọc lịch sử đơn đặt sân</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTimeFilterModalOpen(false)}
                className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                  isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
              {/* Quick Presets */}
              <div>
                <div className={`font-bold uppercase tracking-wider text-[11px] mb-2.5 ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Mốc thời gian nhanh:
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'ALL', label: 'Tất cả thời gian', desc: 'Toàn bộ lịch sử' },
                    { key: 'TODAY', label: 'Hôm nay', desc: 'Trận đá hôm nay' },
                    { key: 'TOMORROW', label: 'Ngày mai', desc: 'Trận đá ngày mai' },
                    { key: 'THIS_WEEK', label: 'Tuần này', desc: '7 ngày trong tuần' },
                    { key: 'THIS_MONTH', label: 'Tháng này', desc: 'Trong tháng hiện tại' },
                    { key: 'UPCOMING', label: 'Sắp diễn ra', desc: 'Chưa thi đấu' },
                    { key: 'PAST', label: 'Đã qua giờ', desc: 'Các trận đã qua' },
                  ].map((preset) => {
                    const isSelected = filterType === preset.key;
                    return (
                      <button
                        key={preset.key}
                        type="button"
                        onClick={() => {
                          setFilterType(preset.key as any);
                          setCustomStartDate('');
                          setCustomEndDate('');
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? isDarkMode
                              ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-bold shadow-sm'
                              : 'bg-emerald-50 border-emerald-400 text-emerald-800 font-bold shadow-sm'
                            : isDarkMode
                            ? 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="font-semibold text-xs flex items-center justify-between">
                          <span>{preset.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                        </div>
                        <div className={`text-[10px] mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {preset.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tùy chọn khoảng ngày cụ thể */}
              <div className={`p-3.5 rounded-2xl border space-y-2.5 ${
                isDarkMode ? 'bg-slate-950/70 border-slate-800/80' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className={`font-bold uppercase tracking-wider text-[11px] ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Hoặc chọn khoảng ngày cụ thể:
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className={`block text-[11px] mb-1 font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Từ ngày:</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => {
                        setCustomStartDate(e.target.value);
                        setFilterType('CUSTOM');
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none ${
                        isDarkMode
                          ? 'bg-slate-900 border-slate-700 text-white'
                          : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-[11px] mb-1 font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Đến ngày:</label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => {
                        setCustomEndDate(e.target.value);
                        setFilterType('CUSTOM');
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none ${
                        isDarkMode
                          ? 'bg-slate-900 border-slate-700 text-white'
                          : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Thống kê đơn phù hợp */}
              <div className={`p-2.5 rounded-xl border text-center font-medium ${
                danhSachDonFiltered.length > 0
                  ? isDarkMode ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : isDarkMode ? 'bg-amber-950/20 border-amber-500/30 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}>
                Tìm thấy <strong>{danhSachDonFiltered.length}</strong> đơn đặt sân phù hợp
              </div>
            </div>

            {/* Footer */}
            <div className={`p-4 border-t flex items-center justify-between gap-2 ${
              isDarkMode ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-50'
            }`}>
              <button
                type="button"
                onClick={resetFilter}
                className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  isDarkMode ? 'border-slate-800 text-slate-400 hover:text-white' : 'border-slate-300 text-slate-600 hover:text-slate-900'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Đặt lại</span>
              </button>
              <button
                type="button"
                onClick={() => setIsTimeFilterModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 cursor-pointer transition-all"
              >
                Áp dụng bộ lọc
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: ĐỔI SÂN & DỜI GIỜ ĐÁ CHO KHÁCH HÀNG (TỐI THIỂU TRƯỚC 30 PHÚT) */}
      {/* ========================================================================= */}
      {exchangeModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className={`border rounded-2xl sm:rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh] sm:max-h-[92vh] my-auto transition-colors ${
            isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            {/* Header */}
            <div className={`px-3.5 sm:px-6 py-2.5 sm:py-3.5 border-b flex items-center justify-between shrink-0 transition-colors ${
              isDarkMode ? 'border-slate-800 bg-slate-950/70' : 'border-slate-200 bg-slate-50'
            }`}>
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="p-1.5 sm:p-2 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 shrink-0">
                  <ArrowLeftRight className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" />
                </div>
                <div className="min-w-0">
                  <h3 className={`font-extrabold text-xs sm:text-base truncate ${isDarkMode ? 'text-indigo-400' : 'text-indigo-900'}`}>
                    Đổi Sân & Dời Giờ Thi Đấu
                  </h3>
                  <p className={`text-[10px] sm:text-xs truncate font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Mã #{exchangeModalOrder.id} • {exchangeModalOrder.ten_san} ({formatDateDMY(exchangeModalOrder.ngay_da)} {exchangeModalOrder.gio_bat_dau} - {exchangeModalOrder.gio_ket_thuc})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setExchangeModalOrder(null);
                  setExchangeModalError(null);
                  setExchangePreviewData(null);
                }}
                disabled={exchangeSubmitting}
                className={`p-1.5 rounded-xl border transition-colors cursor-pointer shrink-0 ${
                  isDarkMode ? 'border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white' : 'border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-900'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-3 sm:p-5 overflow-y-auto space-y-3 sm:space-y-3.5 text-xs">
              {/* Alert thông báo lỗi trong modal (nếu có) */}
              {exchangeModalError && (
                <div className="p-2.5 sm:p-3 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-400 text-xs flex items-center justify-between gap-2 animate-shake">
                  <div className="flex items-center gap-2 min-w-0">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                    <span className="font-medium truncate">{exchangeModalError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExchangeModalError(null)}
                    className="p-1 rounded hover:bg-rose-500/20 text-rose-300 shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Hướng dẫn & Thể lệ đổi sân (Gọn gàng, dễ nhìn trên mobile) */}
              <div className={`p-2.5 sm:p-3 rounded-xl border text-[11px] space-y-1 ${
                isDarkMode ? 'bg-indigo-950/20 border-indigo-500/30 text-indigo-200' : 'bg-indigo-50 border-indigo-200 text-indigo-900'
              }`}>
                <div className="font-bold flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 text-[11px] sm:text-xs">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>Quy định đổi sân (Tối thiểu trước giờ đá 30 phút):</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5 sm:gap-2 text-[10px] sm:text-[11px] opacity-90 pl-1">
                  <div>• Sân mới giá thấp hơn: <strong>Hoàn lại tiền thừa</strong> (Tiền mặt / Chuyển khoản).</div>
                  <div>• Sân mới giá cao hơn: <strong>Bù phần cọc thiếu</strong> (nếu đơn chưa đủ cọc 30%).</div>
                </div>
              </div>

              {/* Phần 1: Chọn ngày đá mới & Sân mới */}
              <div className={`p-3 sm:p-4 rounded-2xl border space-y-3 ${
                isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-300 shadow-xs'
              }`}>
                <div className={`font-bold uppercase tracking-wider text-xs flex items-center gap-1.5 ${
                  isDarkMode ? 'text-indigo-400' : 'text-indigo-900'
                }`}>
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  <span>1. Chọn Ngày Đá & Sân Mới</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                  {/* Chọn Ngày đá */}
                  <div className="space-y-1">
                    <label className={`block text-[11px] font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`}>Ngày đá mới:</label>
                    <input
                      type="date"
                      min={getLocalDateString(new Date())}
                      value={exchangeSelectedDate}
                      onChange={(e) => handleDateChangeExchange(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none transition-all ${
                        isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-950'
                      }`}
                    />
                  </div>

                  {/* Chọn Sân bóng */}
                  <div className="space-y-1">
                    <label className={`block text-[11px] font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`}>Sân bóng mới:</label>
                    <select
                      value={exchangeSelectedPitchId || ''}
                      onChange={(e) => {
                        const pid = parseInt(e.target.value, 10);
                        setExchangeSelectedPitchId(pid);
                        setExchangeSelectedSlot(null);
                        setExchangePreviewData(null);
                        setExchangeModalError(null);
                      }}
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none transition-all ${
                        isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-950'
                      }`}
                    >
                      {exchangePitchList.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.ten_san} ({p.ten_loai || 'Sân bóng'}) • {formatCurrency(p.don_gia_phut * 60)}/h
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Chọn Khung Giờ (Chỉ hiển thị các ca còn trống, ẩn ca đã đặt hoặc đã qua giờ) */}
                <div className="space-y-1.5 pt-1">
                  <label className={`block text-[11px] font-bold flex flex-wrap items-center justify-between gap-1 ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-800'
                  }`}>
                    <span>Chọn khung giờ đá mới:</span>
                    {exchangeSelectedSlot && (
                      <span className="text-emerald-500 font-extrabold text-[11px]">
                        ✓ Đang chọn: {exchangeSelectedSlot.gio_bat_dau.slice(0, 5)} - {exchangeSelectedSlot.gio_ket_thuc.slice(0, 5)}
                      </span>
                    )}
                  </label>

                  {(() => {
                    // Lọc ẩn hoàn toàn các ca đã đặt hoặc đã qua giờ
                    const availableSlots = exchangeSlotList.filter(
                      (slot) => !isSlotBookedForExchange(exchangeSelectedPitchId || 0, slot.gio_bat_dau, slot.gio_ket_thuc)
                    );

                    if (availableSlots.length === 0) {
                      return (
                        <div className={`p-3.5 sm:p-4 rounded-xl border border-dashed text-center space-y-1 ${
                          isDarkMode ? 'border-slate-800 bg-slate-950/40 text-slate-400' : 'border-slate-300 bg-slate-50 text-slate-600'
                        }`}>
                          <Clock className="w-4 h-4 mx-auto text-amber-500 opacity-80" />
                          <div className="font-bold text-xs">Không còn khung giờ trống trong ngày này</div>
                          <div className="text-[10px] sm:text-[11px] opacity-75">
                            Các ca giờ đã kín lịch hoặc đã qua giờ thi đấu. Vui lòng chọn ngày khác hoặc sân khác để đổi!
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-1.5 sm:gap-2">
                        {availableSlots.map((slot, sIdx) => {
                          const isSelected =
                            exchangeSelectedSlot?.gio_bat_dau === slot.gio_bat_dau &&
                            exchangeSelectedSlot?.gio_ket_thuc === slot.gio_ket_thuc;

                          return (
                            <button
                              key={`${slot.gio_bat_dau}-${sIdx}`}
                              type="button"
                              disabled={exchangeLoadingPreview}
                              onClick={() => handleSelectSlotExchange(slot)}
                              className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 active:scale-95 ${
                                isSelected
                                  ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white border-transparent shadow-md shadow-indigo-500/25 ring-2 ring-indigo-400 scale-[1.02]'
                                  : isDarkMode
                                  ? 'bg-slate-900/90 hover:bg-slate-800 text-slate-100 border-slate-700 hover:border-indigo-500/50'
                                  : 'bg-white hover:bg-slate-50 text-slate-950 font-bold border-slate-300 hover:border-indigo-600 shadow-xs'
                              }`}
                            >
                              <span className="text-[11px] sm:text-xs font-extrabold font-mono tracking-tight">
                                {slot.gio_bat_dau.slice(0, 5)} - {slot.gio_ket_thuc.slice(0, 5)}
                              </span>
                              <span className={`text-[9px] sm:text-[10px] font-semibold ${
                                isSelected ? 'text-white/90' : isDarkMode ? 'text-cyan-400' : 'text-indigo-600'
                              }`}>
                                {slot.nhan_hien_thi || 'Còn trống'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Loading khi đang tính toán chênh lệch */}
              {exchangeLoadingPreview && (
                <div className="p-4 sm:p-6 rounded-2xl border flex items-center justify-center gap-2 text-indigo-500 font-bold text-xs sm:text-sm">
                  <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                  <span>Đang tính toán chênh lệch giá và kiểm tra khung giờ...</span>
                </div>
              )}

              {/* Phần 2: Bảng So Sánh Giá Tiền & Xử Lý Chênh Lệch (Khi đã tính toán xong) */}
              {exchangePreviewData && !exchangeLoadingPreview && (
                <div className="space-y-3 animate-fade-in">
                  <div className={`font-bold uppercase tracking-wider text-xs flex items-center gap-1.5 ${
                    isDarkMode ? 'text-indigo-400' : 'text-indigo-900'
                  }`}>
                    <Receipt className="w-3.5 h-3.5 text-indigo-500" />
                    <span>2. So Sánh Đơn Đặt & Tính Toán Chênh Lệch</span>
                  </div>

                  {/* THIẾT KẾ 2 KHUNG 2 BÊN RÕ RÀNG TRÊN CẢ ĐIỆN THOẠI & MÁY TÍNH */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {/* KHUNG TRÁI: Sân Hiện Tại */}
                    <div className={`p-2.5 sm:p-3.5 rounded-2xl border flex flex-col justify-between ${
                      isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-slate-300 shadow-xs'
                    }`}>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                          }`}>
                            Sân Hiện Tại
                          </span>
                        </div>
                        <div className={`font-black text-xs sm:text-sm truncate ${
                          isDarkMode ? 'text-cyan-400' : 'text-cyan-700'
                        }`}>
                          {exchangePreviewData.ten_san_cu}
                        </div>
                        <div className={`text-[10px] sm:text-[11px] font-semibold mt-0.5 ${
                          isDarkMode ? 'text-slate-300' : 'text-slate-700'
                        }`}>
                          <div>{formatDateDMY(exchangePreviewData.ngay_da_cu)}</div>
                          <div className="font-mono font-bold text-indigo-500 dark:text-cyan-300">
                            {exchangePreviewData.gio_bat_dau_cu} - {exchangePreviewData.gio_ket_thuc_cu}
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-800 space-y-1 text-[10px] sm:text-xs">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                          <span className="text-slate-400 text-[10px]">Tiền sân cũ:</span>
                          <span className="font-extrabold font-mono text-slate-950 dark:text-white text-[11px] sm:text-xs">
                            {formatCurrency(exchangePreviewData.tien_san_cu)}
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                          <span className="text-slate-400 text-[10px]">Đã trả:</span>
                          <span className={`font-extrabold font-mono text-[11px] sm:text-xs ${
                            isDarkMode ? 'text-emerald-400' : 'text-emerald-700'
                          }`}>
                            {formatCurrency(exchangePreviewData.da_thanh_toan_cu)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* KHUNG PHẢI: Sân Mới Muốn Đổi */}
                    <div className={`p-2.5 sm:p-3.5 rounded-2xl border flex flex-col justify-between ${
                      isDarkMode ? 'bg-indigo-950/30 border-indigo-500/40' : 'bg-indigo-50/90 border-indigo-300 shadow-xs'
                    }`}>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            isDarkMode ? 'bg-indigo-900/60 text-indigo-300' : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            Sân Mới Đổi
                          </span>
                        </div>
                        <div className={`font-black text-xs sm:text-sm truncate ${
                          isDarkMode ? 'text-indigo-300' : 'text-indigo-900'
                        }`}>
                          {exchangePreviewData.ten_san_moi}
                        </div>
                        <div className={`text-[10px] sm:text-[11px] font-semibold mt-0.5 ${
                          isDarkMode ? 'text-slate-300' : 'text-slate-800'
                        }`}>
                          <div>{formatDateDMY(exchangePreviewData.ngay_da_moi)}</div>
                          <div className="font-mono font-bold text-indigo-500 dark:text-cyan-300">
                            {exchangePreviewData.gio_bat_dau_moi} - {exchangePreviewData.gio_ket_thuc_moi}
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 mt-2 border-t border-indigo-200 dark:border-indigo-500/20 space-y-1 text-[10px] sm:text-xs">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                          <span className="text-slate-400 text-[10px]">Giá sân mới:</span>
                          <span className={`font-extrabold font-mono text-[11px] sm:text-xs ${
                            isDarkMode ? 'text-indigo-300' : 'text-indigo-900'
                          }`}>
                            {formatCurrency(exchangePreviewData.tien_san_moi)}
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                          <span className="text-slate-400 text-[10px]">Cọc tối thiểu:</span>
                          <span className={`font-extrabold font-mono text-[11px] sm:text-xs ${
                            isDarkMode ? 'text-amber-400' : 'text-amber-800'
                          }`}>
                            {formatCurrency(exchangePreviewData.tien_coc_san_moi)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* KẾT QUẢ CHÊNH LỆCH THEO THỂ LỆ QUY ĐỊNH */}
                  {/* Trường hợp 1: Sân mới GIÁ THẤP HƠN -> Hoàn tiền thừa */}
                  {exchangePreviewData.tien_thua > 0 && (
                    <div className={`p-3 sm:p-4 rounded-2xl border space-y-2.5 ${
                      isDarkMode ? 'bg-emerald-950/30 border-emerald-500/40' : 'bg-emerald-50/90 border-emerald-400 shadow-xs'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className={`font-extrabold text-xs ${isDarkMode ? 'text-emerald-400' : 'text-emerald-950'}`}>
                            Sân mới giá thấp hơn sân cũ
                          </span>
                        </div>
                        <span className={`text-xs sm:text-sm font-extrabold font-mono ${isDarkMode ? 'text-emerald-400' : 'text-emerald-800'}`}>
                          +{formatCurrency(exchangePreviewData.tien_thua)} (Thừa)
                        </span>
                      </div>
                      <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-200' : 'text-slate-800 font-medium'}`}>
                        Số tiền thừa của bạn là <strong className="text-emerald-700 dark:text-emerald-400 font-bold">{formatCurrency(exchangePreviewData.tien_thua)}</strong>. Vui lòng chọn cách bạn muốn nhận lại:
                      </p>

                      {/* Lựa chọn nhận tiền thừa */}
                      <div className="space-y-2 pt-0.5">
                        <label className={`block text-[11px] font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-900'}`}>
                          Hình thức nhận lại tiền thừa:
                        </label>
                        <BankSelectDropdown
                          value={exchangeRefundBankName}
                          onChange={(val) => setExchangeRefundBankName(val)}
                          banks={realBankList}
                          isDarkMode={isDarkMode}
                          cashLabel="Nhận tiền mặt tại quầy"
                        />

                        {exchangeRefundBankName !== 'Nhận tiền mặt tại quầy' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 animate-fade-in">
                            <div className="space-y-1">
                              <label className={`block text-[11px] font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-900'}`}>
                                Số tài khoản thụ hưởng: <span className="text-rose-500 font-bold">*</span>
                              </label>
                              <input
                                type="text"
                                value={exchangeRefundBankAccount}
                                onChange={(e) => setExchangeRefundBankAccount(e.target.value)}
                                placeholder="Nhập số tài khoản ngân hàng..."
                                className={`w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold outline-none transition-all ${
                                  isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-400 text-slate-950'
                                }`}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className={`block text-[11px] font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-900'}`}>
                                Tên chủ tài khoản: <span className="text-rose-500 font-bold">*</span>
                              </label>
                              <input
                                type="text"
                                value={exchangeRefundAccountHolder}
                                onChange={(e) => setExchangeRefundAccountHolder(toUpperCaseNoAccents(e.target.value))}
                                placeholder="NGUYEN VAN A (IN HOA KHONG DAU)..."
                                className={`w-full px-3 py-2 rounded-xl border text-xs font-extrabold outline-none uppercase transition-all ${
                                  isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-400 text-slate-950'
                                }`}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Trường hợp 2: Sân mới GIÁ CAO HƠN nhưng ĐỦ CỌC 30% (Được đổi ngay) */}
                  {exchangePreviewData.tien_thua === 0 && exchangePreviewData.duoc_doi_ngay && (
                    <div className={`p-3 sm:p-4 rounded-2xl border space-y-2 ${
                      isDarkMode ? 'bg-indigo-950/30 border-indigo-500/40 text-indigo-200' : 'bg-indigo-50/90 border-indigo-300 shadow-xs text-indigo-950'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className={`font-extrabold text-xs ${isDarkMode ? 'text-emerald-400' : 'text-emerald-950'}`}>
                            Đủ điều kiện đổi sân ngay!
                          </span>
                        </div>
                        <span className={`text-xs sm:text-sm font-extrabold font-mono ${isDarkMode ? 'text-amber-400' : 'text-amber-800'}`}>
                          Còn thiếu: {formatCurrency(exchangePreviewData.tien_con_thieu)}
                        </span>
                      </div>
                      <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-200' : 'text-slate-900 font-medium'}`}>
                        Tiền bạn đã thanh toán ở đơn cũ (<strong className="font-bold">{formatCurrency(exchangePreviewData.da_thanh_toan_cu)}</strong>) đã <strong className="font-bold text-emerald-600 dark:text-emerald-400">đạt mức cọc 30%</strong> của sân mới ({formatCurrency(exchangePreviewData.tien_coc_san_moi)}).
                        <br />
                        👉 <strong className="font-extrabold">Bạn được đổi sân ngay lập tức không cần chuyển thêm tiền!</strong>
                        {exchangePreviewData.tien_con_thieu > 0 && (
                          <span> Tiền còn thiếu (<strong className="font-bold">{formatCurrency(exchangePreviewData.tien_con_thieu)}</strong>) có thể thanh toán tại quầy khi đến sân hoặc thanh toán ngay qua VietQR.</span>
                        )}
                      </p>
                    </div>
                  )}

                  {/* Trường hợp 3: Sân mới GIÁ CAO HƠN và CHƯA ĐỦ CỌC 30% (Cần bù cọc mới được đổi) */}
                  {exchangePreviewData.tien_thua === 0 && !exchangePreviewData.duoc_doi_ngay && (
                    <div className={`p-3 sm:p-4 rounded-2xl border space-y-2 ${
                      isDarkMode ? 'bg-amber-950/40 border-amber-500/50 text-amber-200' : 'bg-amber-50/90 border-amber-400 shadow-xs text-amber-950'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span className={`font-extrabold text-xs ${isDarkMode ? 'text-amber-400' : 'text-amber-950'}`}>
                            Cần thanh toán bù tiền cọc để đổi
                          </span>
                        </div>
                        <span className={`text-xs sm:text-sm font-extrabold font-mono ${isDarkMode ? 'text-rose-400' : 'text-rose-700'}`}>
                          Cần bù cọc: {formatCurrency(exchangePreviewData.can_bu_coc)}
                        </span>
                      </div>
                      <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-200' : 'text-slate-900 font-medium'}`}>
                        Mức cọc 30% sân mới là <strong className="font-bold">{formatCurrency(exchangePreviewData.tien_coc_san_moi)}</strong>, tiền cọc đơn cũ là <strong className="font-bold">{formatCurrency(exchangePreviewData.da_thanh_toan_cu)}</strong>.
                        <br />
                        Bạn cần thanh toán đủ phần tiền cọc còn thiếu (<strong className="text-rose-600 dark:text-rose-400 font-bold">{formatCurrency(exchangePreviewData.can_bu_coc)}</strong>) qua VietQR để hoàn tất đổi sân.
                      </p>
                    </div>
                  )}

                  {/* Lý do đổi */}
                  <div className="space-y-1 pt-0.5">
                    <label className={`block text-[11px] font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`}>
                      Lý do đổi sân (tùy chọn):
                    </label>
                    <select
                      value={exchangeReason}
                      onChange={(e) => setExchangeReason(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none transition-all ${
                        isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-950'
                      }`}
                    >
                      <option value="Thay đổi lịch thi đấu">Thay đổi lịch thi đấu</option>
                      <option value="Muốn đổi sang sân lớn hơn / nhỏ hơn">Muốn đổi sang sân lớn hơn / nhỏ hơn</option>
                      <option value="Trùng lịch với đội bóng khác">Trùng lịch với đội bóng khác</option>
                      <option value="Đổi giờ do thời tiết">Đổi giờ do thời tiết</option>
                      <option value="Lý do cá nhân khác">Lý do cá nhân khác</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Footer linh hoạt, tương thích mọi kích thước màn hình điện thoại */}
            <div className={`p-3 sm:p-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0 transition-colors ${
              isDarkMode ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-50'
            }`}>
              <button
                type="button"
                onClick={() => {
                  setExchangeModalOrder(null);
                  setExchangeModalError(null);
                  setExchangePreviewData(null);
                }}
                disabled={exchangeSubmitting}
                className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer text-center order-last sm:order-first ${
                  isDarkMode ? 'border-slate-800 text-slate-400 hover:text-white' : 'border-slate-300 text-slate-600 hover:text-slate-900'
                }`}
              >
                Đóng
              </button>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                {/* Nút thanh toán bù cọc qua VietQR nếu chưa đủ cọc */}
                {exchangePreviewData && !exchangePreviewData.duoc_doi_ngay && exchangePreviewData.can_bu_coc > 0 && (
                  <button
                    type="button"
                    onClick={() => handleConfirmExchangeOrder(true)}
                    disabled={exchangeSubmitting}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20 active:scale-95"
                  >
                    <QrCode className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden sm:inline">Thanh toán bù cọc ({formatCurrency(exchangePreviewData.can_bu_coc)}) qua VietQR</span>
                    <span className="sm:hidden">Bù cọc ({formatCurrency(exchangePreviewData.can_bu_coc)}) VietQR</span>
                  </button>
                )}

                {/* Nút thanh toán nốt toàn bộ qua VietQR nếu khách muốn thanh toán hết ngay trên web */}
                {exchangePreviewData && exchangePreviewData.duoc_doi_ngay && exchangePreviewData.tien_con_thieu > 0 && (
                  <button
                    type="button"
                    onClick={() => handleConfirmExchangeOrder(true)}
                    disabled={exchangeSubmitting}
                    className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <QrCode className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden sm:inline">Thanh toán nốt ({formatCurrency(exchangePreviewData.tien_con_thieu)}) VietQR</span>
                    <span className="sm:hidden">Thanh toán hết ({formatCurrency(exchangePreviewData.tien_con_thieu)}) VietQR</span>
                  </button>
                )}

                {/* Nút Xác nhận đổi sân ngay (cho trường hợp được đổi ngay) */}
                {(!exchangePreviewData || exchangePreviewData.duoc_doi_ngay) && (
                  <button
                    type="button"
                    disabled={!exchangePreviewData || exchangeSubmitting}
                    onClick={() => handleConfirmExchangeOrder(false)}
                    className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-95 ${
                      exchangePreviewData && exchangePreviewData.duoc_doi_ngay
                        ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white shadow-indigo-500/25'
                        : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-50'
                    }`}
                  >
                    {exchangeSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                        <span>Đang xử lý đổi sân...</span>
                      </>
                    ) : (
                      <>
                        <ArrowLeftRight className="w-3.5 h-3.5 shrink-0" />
                        {exchangePreviewData && exchangePreviewData.tien_con_thieu > 0 ? (
                          <>
                            <span className="hidden sm:inline">
                              Xác Nhận Đổi Sân (Thanh toán {formatCurrency(exchangePreviewData.tien_con_thieu)} tại quầy)
                            </span>
                            <span className="sm:hidden">
                              Đổi Sân (Trả {formatCurrency(exchangePreviewData.tien_con_thieu)} tại quầy)
                            </span>
                          </>
                        ) : (
                          <span>Xác Nhận Đổi Sân</span>
                        )}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
    </>
  );
}
