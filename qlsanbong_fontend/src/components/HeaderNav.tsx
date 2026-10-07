import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Search,
  Sun,
  Moon,
  User,
  LogOut,
  History,
  Phone,
  LayoutDashboard,
  ShieldCheck,
  ChevronDown,
  LandPlot,
  Menu,
  X,
  CalendarDays,
  Newspaper,
  Info
} from 'lucide-react';
import { useAppTheme } from '@/hooks/useAppTheme';
import Login, { AuthUser } from '@/pages/Login/login';
import Profile from '@/profile/profile';

// SoccerBall Icon SVG quả bóng đá chuẩn màu đen trắng đồng bộ toàn bộ trang web
const SoccerBallIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
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

interface HeaderNavProps {
  activeTab?: 'home' | 'schedule' | 'news' | 'about' | 'contact';
}

export default function HeaderNav({ activeTab = 'home' }: HeaderNavProps) {
  const router = useRouter();
  const { isDarkMode, toggleTheme } = useAppTheme(true);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [loginInitialRegister, setLoginInitialRegister] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Khôi phục thông tin đăng nhập từ localStorage giống hệt index.tsx
  const syncCurrentUser = () => {
    try {
      const savedAuthUser = localStorage.getItem('auth_user');
      if (savedAuthUser) {
        const parsed: AuthUser = JSON.parse(savedAuthUser);
        setCurrentUser(parsed);
      } else {
        const savedSoccerUser = localStorage.getItem('soccer_current_user');
        if (savedSoccerUser) {
          const parsed = JSON.parse(savedSoccerUser);
          setCurrentUser(parsed);
        } else {
          setCurrentUser(null);
        }
      }
    } catch (e) {
      console.error('Lỗi khi đọc auth_user:', e);
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    syncCurrentUser();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_user' || e.key === 'soccer_current_user' || e.key === 'auth_token') {
        syncCurrentUser();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Lắng nghe click ngoài để đóng dropdown menu
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

  const handleLogout = () => {
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('soccer_current_user');
    setCurrentUser(null);
    setUserDropdownOpen(false);
  };

  // Xác định quyền quản trị viên / nhân viên
  const isUserAdmin = currentUser?.vai_tro?.toUpperCase() === 'ADMIN' || (currentUser as any)?.MaVaiTro === 1;
  const isUserStaffOrAdmin = isUserAdmin || currentUser?.vai_tro?.toUpperCase() === 'STAFF' || currentUser?.vai_tro?.toUpperCase() === 'NHAN_VIEN' || (currentUser as any)?.MaVaiTro === 2;

  const navLinks = [
    { key: 'home', label: '🏠 Trang chủ', href: '/' },
    { key: 'schedule', label: '📅 Lịch sân theo giờ', href: '/#ma-tran-lich-san' },
    { key: 'news', label: '📰 Tin Tức', href: '/tin-tuc' },
    { key: 'about', label: 'ℹ️ About Us', href: '/about-us' },
    { key: 'contact', label: '📞 Liên Hệ', href: '/lien-he' },
  ];

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-40 backdrop-blur-md transition-colors duration-300 border-b shadow-sm ${
        isDarkMode ? 'bg-slate-950/90 border-slate-800 text-slate-100' : 'bg-white/90 border-slate-200 text-slate-900'
      }`}>
        {/* TẦNG 1: LOGO, TÌM KIẾM, THEME & TÀI KHOẢN */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            
            {/* Logo Thương Hiệu */}
            <Link href="/" className="flex items-center gap-3 cursor-pointer group shrink-0">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-700 flex items-center justify-center overflow-hidden shadow-md group-hover:scale-105 transition-transform">
                <SoccerBallIcon className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className={`text-xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>
                  SOCCER<span className="text-emerald-500">247</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-500 -mt-1">
                  Sân Thể Thao 24/7
                </span>
              </div>
            </Link>

            {/* Ô tìm kiếm thông minh */}
            <div className="flex-1 max-w-md hidden sm:block">
              <div className="relative">
                <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                <input
                  type="text"
                  placeholder="Tìm kiếm tên sân (VD: Sân 5A, Sân 7, Pickleball...)"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      router.push(`/?search=${encodeURIComponent((e.target as HTMLInputElement).value)}#ma-tran-lich-san`);
                    }
                  }}
                  className={`w-full pl-10 pr-4 py-2 rounded-full text-xs transition-all outline-none border focus:ring-2 focus:ring-emerald-500/50 ${
                    isDarkMode
                      ? 'bg-slate-900/80 border-slate-700/80 text-slate-200 placeholder-slate-500 focus:bg-slate-900'
                      : 'bg-slate-100 border-slate-300 text-slate-800 placeholder-slate-400 focus:bg-white'
                  }`}
                />
              </div>
            </div>

            {/* Hành động: Dark/Light Mode & Auth */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Nút bật/tắt Theme */}
              <button
                type="button"
                onClick={toggleTheme}
                suppressHydrationWarning
                title={isDarkMode ? "Chuyển sang giao diện Sáng" : "Chuyển sang giao diện Tối"}
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

              {/* Khu vực Người Dùng / Đăng nhập */}
              {currentUser ? (
                <div className="relative" ref={userDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setUserDropdownOpen((prev) => !prev)}
                    className={`flex items-center gap-2 p-1 sm:pr-3 rounded-full border transition-all cursor-pointer ${
                      isDarkMode
                        ? 'bg-slate-900 border-emerald-800/50 hover:border-emerald-500/60'
                        : 'bg-slate-100 border-slate-300 hover:border-emerald-500'
                    }`}
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center font-bold text-slate-950 text-xs shadow-inner">
                      {currentUser.ho_ten ? currentUser.ho_ten.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="text-left hidden xl:block">
                      <p className={`text-xs font-semibold leading-tight ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                        {currentUser.ho_ten}
                      </p>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                  </button>

                  {/* Dropdown Menu User */}
                  {userDropdownOpen && (
                    <div className={`absolute right-0 mt-3 w-60 rounded-2xl border shadow-2xl p-2 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 ${
                      isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                    }`}>
                      <div className={`px-3 py-2 border-b mb-1 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                        <p className="text-[11px] text-slate-400">Tài khoản:</p>
                        <p className="text-xs font-bold text-emerald-500 truncate">{currentUser.email}</p>
                      </div>

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

                      {/* Nút đi tới Dashboard cho Admin */}
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
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          setIsProfileModalOpen(true);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl transition-colors text-left cursor-pointer ${
                          isDarkMode ? 'text-slate-300 hover:text-emerald-400 hover:bg-slate-800/60' : 'text-slate-700 hover:text-emerald-600 hover:bg-slate-100'
                        }`}
                      >
                        <User className="w-4 h-4 text-emerald-500" />
                        Thông tin tài khoản
                      </button>

                      <Link
                        href="/history"
                        onClick={() => setUserDropdownOpen(false)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl transition-colors text-left cursor-pointer ${
                          isDarkMode ? 'text-slate-300 hover:text-emerald-400 hover:bg-slate-800/60' : 'text-slate-700 hover:text-emerald-600 hover:bg-slate-100'
                        }`}
                      >
                        <History className="w-4 h-4 text-emerald-500" />
                        Lịch sử đặt sân
                      </Link>

                      <button
                        type="button"
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-500 rounded-xl transition-colors text-left mt-1 border-t cursor-pointer ${
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
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginInitialRegister(false);
                      setIsLoginModalOpen(true);
                    }}
                    className="login-trigger-btn cursor-pointer"
                  >
                    Đăng nhập
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginInitialRegister(true);
                      setIsLoginModalOpen(true);
                    }}
                    className="register-trigger-btn cursor-pointer"
                  >
                    Đăng ký
                  </button>
                </div>
              )}

              {/* Hamburger Button (Mobile & Tablet) */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`p-2 rounded-xl border block lg:hidden transition-all duration-200 cursor-pointer ${
                  isDarkMode
                    ? 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
                    : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                }`}
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>

          </div>
        </div>

        {/* TẦNG 2: SUB-NAVBAR MENU ĐIỀU HƯỚNG (Ẩn trên Mobile & Tablet, chỉ hiện trên PC >= 1024px) */}
        <div className={`hidden lg:block transition-colors duration-300 border-t ${
          isDarkMode ? 'bg-slate-950/70 border-slate-900' : 'bg-slate-100/80 border-slate-200'
        }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-11 flex items-center justify-between overflow-x-auto">
            <nav className="flex items-center gap-1 sm:gap-2 shrink-0 py-1">
              {navLinks.map((link) => {
                const isActive = activeTab === link.key;
                return (
                  <Link
                    key={link.key}
                    href={link.href}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isActive
                        ? isDarkMode
                          ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 hover:bg-emerald-900/50'
                          : 'text-emerald-700 bg-emerald-100 border border-emerald-300 hover:bg-emerald-200'
                        : isDarkMode
                        ? 'text-slate-300 hover:text-emerald-400 hover:bg-slate-900/80 font-semibold'
                        : 'text-slate-700 hover:text-emerald-600 hover:bg-slate-200 font-semibold'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <div className="hidden lg:flex items-center gap-4 text-[11px] font-semibold text-slate-400 shrink-0">
              <span className={`flex items-center gap-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                <Phone className="w-3.5 h-3.5 text-emerald-500" />
                Hotline Đặt Sân: <strong className="text-emerald-500 font-mono">0816344504</strong>
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ==========================================
          MOBILE & TABLET MENU DRAWER & OVERLAY (DƯỚI 1024px)
          ========================================== */}
      {/* Overlay Background */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Slide-out Drawer */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-[280px] max-w-[85vw] z-50 lg:hidden p-5 flex flex-col justify-between transition-transform duration-300 ease-in-out shadow-2xl ${
          isDarkMode ? 'bg-slate-950 text-slate-100 border-l border-slate-800' : 'bg-white text-slate-900 border-l border-slate-200'
        } ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex flex-col gap-5">
          {/* Header Drawer: Logo & Close */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-700 flex items-center justify-center overflow-hidden shadow-sm">
                <SoccerBallIcon className="w-5 h-5" />
              </div>
              <span className={`font-black text-base tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                SOCCER<span className="text-emerald-500">247</span>
              </span>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-col gap-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Điều hướng chính
            </p>
            {navLinks.map((link) => {
              const isActive = activeTab === link.key;
              return (
                <Link
                  key={link.key}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? isDarkMode
                        ? 'text-emerald-400 bg-emerald-950/50 border border-emerald-500/30'
                        : 'text-emerald-700 bg-emerald-100/90 border border-emerald-300'
                      : isDarkMode
                      ? 'text-slate-300 hover:text-emerald-400 hover:bg-slate-900'
                      : 'text-slate-700 hover:text-emerald-600 hover:bg-slate-100'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Management / Admin shortcut for staff/admin on mobile */}
          {currentUser && (
            <div className="flex flex-col gap-1.5 pt-3 border-t border-slate-200 dark:border-slate-800">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Khu vực Quản lý
              </p>
              {isUserStaffOrAdmin && (
                <Link
                  href="/management-system"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/30"
                >
                  <LandPlot className="w-4 h-4" />
                  Management System
                </Link>
              )}
              {isUserAdmin && (
                <Link
                  href="/Dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-500/30"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Dashboard Admin
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Footer Drawer: Theme, User & Hotline */}
        <div className="flex flex-col gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Chế độ giao diện:</span>
            <button
              onClick={toggleTheme}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${
                isDarkMode
                  ? 'bg-slate-900 border-slate-700 text-amber-400'
                  : 'bg-slate-100 border-slate-300 text-slate-700'
              }`}
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5 text-emerald-600" />}
              {isDarkMode ? 'Sáng' : 'Tối'}
            </button>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between text-xs">
            <span className="font-semibold text-emerald-800 dark:text-emerald-300">Hotline:</span>
            <a href="tel:0816344504" className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
              0816344504
            </a>
          </div>

          {currentUser ? (
            <button
              onClick={() => {
                handleLogout();
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40"
            >
              <LogOut className="w-4 h-4" />
              Đăng xuất ({currentUser.ho_ten})
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setLoginInitialRegister(false);
                  setIsLoginModalOpen(true);
                }}
                className="py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-center"
              >
                Đăng nhập
              </button>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setLoginInitialRegister(true);
                  setIsLoginModalOpen(true);
                }}
                className="py-2.5 rounded-xl text-xs font-bold bg-emerald-500 text-white shadow-md shadow-emerald-500/20 text-center"
              >
                Đăng ký
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Modal */}
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

      {/* Login / Register Modal */}
      <Login
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        initialRegister={loginInitialRegister}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setIsLoginModalOpen(false);
        }}
      />
    </>
  );
}
