'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

// ==========================================
// 1. TYPES & INTERFACES DEFINITIONS
// ==========================================

export interface DateNavigationBarProps {
  /** Ngày đang được chọn (định dạng Date hoặc chuỗi 'YYYY-MM-DD') */
  value?: Date | string;
  /** Callback kích hoạt khi ngày thay đổi */
  onChange?: (date: Date, formattedDateStr: string) => void;
  /** Custom className cho wrapper */
  className?: string;
}

export interface CalendarCell {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isPast: boolean;
}

// ==========================================
// 2. HELPER UTILITY FUNCTIONS
// ==========================================

/**
 * Chuyển đổi an toàn Date hoặc YYYY-MM-DD string sang Date chuẩn hóa 00:00:00
 */
const parseToNormalizedDate = (val?: Date | string): Date => {
  if (!val) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (typeof val === 'string') {
    const parts = val.split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      d.setHours(0, 0, 0, 0);
      return d;
    }
  }
  const d = new Date(val);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Chuẩn hóa Date về 00:00:00:000
 */
const normalizeDate = (date: Date): Date => {
  const normalized = new Date(date.getTime());
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

/**
 * Chuyển Date sang định dạng chuỗi YYYY-MM-DD
 */
export const formatToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Kiểm tra xem 2 ngày có trùng nhau không
 */
const isSameDay = (d1: Date, d2: Date): boolean => {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

/**
 * Kiểm tra xem một ngày có nằm trong quá khứ so với ngày chuẩn không
 */
const isBeforeDay = (target: Date, reference: Date): boolean => {
  return normalizeDate(target).getTime() < normalizeDate(reference).getTime();
};

/**
 * Định dạng hiển thị Thứ Ngày Tháng Năm theo tiếng Việt
 * Ví dụ: "Thứ Tư, 30 tháng 09 năm 2026"
 */
const formatFullVietnameseDate = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  const weekdayFormatter = new Intl.DateTimeFormat('vi-VN', { weekday: 'long' });
  let weekday = weekdayFormatter.format(date);

  // Viết hoa chữ cái đầu (VD: "thứ tư" -> "Thứ Tư")
  weekday = weekday
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return `${weekday}, ${day} tháng ${month} năm ${year}`;
};

const WEEK_DAYS: readonly string[] = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

// ==========================================
// 3. MAIN COMPONENT
// ==========================================

export const DateNavigationBar: React.FC<DateNavigationBarProps> = ({
  value,
  onChange,
  className = '',
}) => {
  // Hôm nay (Mốc chặn quá khứ)
  const today = useMemo(() => normalizeDate(new Date()), []);

  // State ngày được chọn
  const [internalDate, setInternalDate] = useState<Date>(() => parseToNormalizedDate(value));

  const selectedDate = useMemo(() => {
    return value ? parseToNormalizedDate(value) : internalDate;
  }, [value, internalDate]);

  // State đóng/mở Dropdown Lịch
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);

  // State tháng đang xem trên lưới lịch
  const [viewingMonth, setViewingMonth] = useState<Date>(() => new Date(selectedDate.getTime()));

  const containerRef = useRef<HTMLDivElement>(null);

  // Đồng bộ viewingMonth khi selectedDate thay đổi
  useEffect(() => {
    setViewingMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  }, [selectedDate]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    };

    if (isCalendarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCalendarOpen]);

  // Hàm thay đổi ngày
  const handleDateChange = useCallback(
    (newDate: Date) => {
      const normalized = normalizeDate(newDate);
      if (isBeforeDay(normalized, today)) return; // Không cho phép lùi về quá khứ

      setInternalDate(normalized);
      onChange?.(normalized, formatToYYYYMMDD(normalized));
    },
    [onChange, today]
  );

  // Lùi 1 ngày (<)
  const handlePrevDay = (): void => {
    const prev = new Date(selectedDate.getTime());
    prev.setDate(prev.getDate() - 1);
    if (!isBeforeDay(prev, today)) {
      handleDateChange(prev);
    }
  };

  // Tiến 1 ngày (>)
  const handleNextDay = (): void => {
    const next = new Date(selectedDate.getTime());
    next.setDate(next.getDate() + 1);
    handleDateChange(next);
  };

  // Toggle trạng thái mở popup lịch
  const toggleCalendar = (): void => {
    setIsCalendarOpen((prev) => !prev);
  };

  // Trạng thái vô hiệu hóa nút lùi ngày
  const isPrevDisabled = isSameDay(selectedDate, today);

  // ==========================================
  // 4. TẠO LƯỚI MA TRẬN LỊCH
  // ==========================================
  const calendarCells = useMemo<CalendarCell[]>(() => {
    const year = viewingMonth.getFullYear();
    const month = viewingMonth.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const daysInMonth = lastDayOfMonth.getDate();
    // Chuyển getDay(): 0(CN)->6, 1(T2)->0, ...
    const startingDayIndex = (firstDayOfMonth.getDay() + 6) % 7;

    const cells: CalendarCell[] = [];

    // Ngày của tháng trước
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      cells.push({
        date: d,
        dayNumber: d.getDate(),
        isCurrentMonth: false,
        isToday: isSameDay(d, today),
        isSelected: isSameDay(d, selectedDate),
        isPast: isBeforeDay(d, today),
      });
    }

    // Các ngày trong tháng này
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      cells.push({
        date: d,
        dayNumber: i,
        isCurrentMonth: true,
        isToday: isSameDay(d, today),
        isSelected: isSameDay(d, selectedDate),
        isPast: isBeforeDay(d, today),
      });
    }

    // Ngày của tháng sau
    const totalSlots = Math.ceil(cells.length / 7) * 7;
    const remainingSlots = totalSlots - cells.length;
    for (let i = 1; i <= remainingSlots; i++) {
      const d = new Date(year, month + 1, i);
      cells.push({
        date: d,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: isSameDay(d, today),
        isSelected: isSameDay(d, selectedDate),
        isPast: isBeforeDay(d, today),
      });
    }

    return cells;
  }, [viewingMonth, selectedDate, today]);

  const handleCalendarPrevMonth = () => {
    setViewingMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleCalendarNextMonth = () => {
    setViewingMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  return (
    <div
      ref={containerRef}
      className={`relative block sm:inline-block select-none w-full sm:w-auto max-w-full ${isCalendarOpen ? 'z-50' : 'z-30'} ${className}`}
    >
      {/* --- THANH ĐIỀU HƯỚNG NGANG --- */}
      <div className="flex items-center justify-between sm:justify-start gap-1.5 sm:gap-3 w-full max-w-full">
        {/* Nút Lùi Ngày (<) */}
        <button
          type="button"
          onClick={handlePrevDay}
          disabled={isPrevDisabled}
          title={isPrevDisabled ? 'Không thể lùi về ngày quá khứ' : 'Lùi 1 ngày'}
          className={`flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-200 transition-all duration-200 shadow-md ${
            isPrevDisabled
              ? 'opacity-40 cursor-not-allowed'
              : 'hover:bg-slate-700 hover:text-white hover:border-slate-600 active:scale-95 cursor-pointer'
          }`}
        >
          <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>

        {/* Ô Hiển Thị Ngày (Khối to ở giữa) */}
        <button
          type="button"
          onClick={toggleCalendar}
          className="flex-1 sm:flex-initial flex h-9 sm:h-11 min-w-0 sm:min-w-[240px] md:min-w-[280px] items-center justify-center rounded-xl border border-slate-700 bg-slate-800 px-2 sm:px-6 font-semibold text-slate-100 shadow-md transition-all duration-200 hover:bg-slate-700/80 hover:border-slate-600 active:scale-[0.99] cursor-pointer overflow-hidden"
        >
          <span className="text-[11px] sm:text-sm md:text-base tracking-wide text-slate-100 truncate">
            {formatFullVietnameseDate(selectedDate)}
          </span>
        </button>

        {/* Nút Tiến Ngày (>) */}
        <button
          type="button"
          onClick={handleNextDay}
          title="Tiến 1 ngày"
          className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-200 shadow-md transition-all duration-200 hover:bg-slate-700 hover:text-white hover:border-slate-600 active:scale-95 cursor-pointer"
        >
          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>

        {/* Nút Icon Lịch (🗓️) - Viền & màu xanh ngọc #00e5ff */}
        <button
          type="button"
          onClick={toggleCalendar}
          title="Mở bảng chọn ngày"
          className={`flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl border border-[#00e5ff]/60 bg-slate-800/90 text-[#00e5ff] shadow-lg shadow-[#00e5ff]/10 transition-all duration-200 hover:bg-[#00e5ff]/15 hover:border-[#00e5ff] hover:shadow-[#00e5ff]/25 active:scale-95 cursor-pointer ${
            isCalendarOpen ? 'ring-2 ring-[#00e5ff]/50 bg-[#00e5ff]/20' : ''
          }`}
        >
          <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      </div>

      {/* --- KHUNG LỊCH DROPDOWN --- */}
      {isCalendarOpen && (
        <div className="absolute right-0 top-full z-[999] mt-2 w-80 max-w-[90vw] rounded-2xl border border-slate-700/80 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
          {/* Header Tháng / Năm */}
          <div className="mb-3 flex items-center justify-between border-b border-slate-800 pb-3">
            <button
              type="button"
              onClick={handleCalendarPrevMonth}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="text-sm font-bold capitalize text-slate-200">
              Tháng {viewingMonth.getMonth() + 1} năm {viewingMonth.getFullYear()}
            </div>

            <button
              type="button"
              onClick={handleCalendarNextMonth}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Thứ Trong Tuần */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {WEEK_DAYS.map((day, idx) => (
              <div
                key={day}
                className={`py-1 text-xs font-semibold ${
                  idx === 6 ? 'text-rose-400' : 'text-slate-400'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Lưới Ngày */}
          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((cell, idx) => {
              const { date, dayNumber, isCurrentMonth, isSelected, isToday, isPast } = cell;

              let buttonStyles = 'text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer';

              if (!isCurrentMonth) {
                buttonStyles = 'text-slate-600 hover:bg-slate-800/50 cursor-pointer';
              }

              if (isPast) {
                buttonStyles = 'opacity-35 cursor-not-allowed text-slate-500 pointer-events-none';
              } else if (isSelected) {
                buttonStyles =
                  'bg-emerald-500 font-bold text-white shadow-md shadow-emerald-500/30 scale-105';
              } else if (isToday) {
                buttonStyles =
                  'border border-emerald-500/60 font-semibold text-emerald-400 hover:bg-emerald-500/10';
              }

              return (
                <button
                  key={`${date.toISOString()}-${idx}`}
                  type="button"
                  disabled={isPast}
                  onClick={() => {
                    handleDateChange(date);
                    setIsCalendarOpen(false);
                  }}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs transition-all duration-150 ${buttonStyles}`}
                >
                  {dayNumber}
                </button>
              );
            })}
          </div>

          {/* Footer về hôm nay */}
          <div className="mt-3 flex items-center justify-between border-t border-slate-800 pt-2 text-xs">
            <span className="text-slate-400">
              Hôm nay:{' '}
              <strong className="text-slate-200">
                {today.getDate()}/{today.getMonth() + 1}/{today.getFullYear()}
              </strong>
            </span>
            <button
              type="button"
              onClick={() => {
                handleDateChange(today);
                setIsCalendarOpen(false);
              }}
              className="font-medium text-[#00e5ff] hover:underline cursor-pointer"
            >
              Về hôm nay
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateNavigationBar;
