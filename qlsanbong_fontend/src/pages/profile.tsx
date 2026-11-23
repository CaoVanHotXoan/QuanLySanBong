"use client";

import React, { useState, useEffect, useRef } from "react";
import Head from "next/head";
import {
  User,
  Bell,
  Mail,
  Phone,
  MapPin,
  Camera,
  LogOut,
  Edit3,
  X,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Lock,
  Sparkles,
  CheckCheck,
  Trash2,
  Clock,
} from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// =====================================================================
// ĐỊNH NGHĨA KIỂU DỮ LIỆU (INTERFACES)
// =====================================================================

export interface ThongBaoItem {
  id: number;
  ma_nguoi_dung: number;
  tieu_de: string;
  noi_dung: string;
  loai_thong_bao: string;
  ma_don_dat?: number;
  da_doc: boolean | number;
  ngay_tao: string;
  ngay_da?: string;
  gio_bat_dau?: string;
  ten_san?: string;
}

export interface UserProfileData {
  hoTen: string;
  email: string;
  soDienThoai: string;
  diaChi: string;
  avatarUrl?: string;
}

export type TabType = "account" | "notifications";

export interface ProfileProps {
  onLogout?: () => void;
  onClose?: () => void;
  initialData?: Partial<UserProfileData>;
  onUpdateUser?: (userData: any) => void;
}

export default function Profile({ onLogout, onClose, initialData, onUpdateUser }: ProfileProps) {
  // 1. STATE QUẢN LÝ TAB ĐIỀU HƯỚNG HIỆN TẠI
  const [activeTab, setActiveTab] = useState<TabType>("account");

  // 2. STATE THÔNG BÁO NỔI (TOAST)
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ type, message });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  // 3. STATE THÔNG TIN NGƯỜI DÙNG HIỂN THỊ
  const [userData, setUserData] = useState<UserProfileData>({
    hoTen: initialData?.hoTen || "Khách Hàng",
    email: initialData?.email || "khachhang@gmail.com",
    soDienThoai: initialData?.soDienThoai || "",
    diaChi: initialData?.diaChi || "",
    avatarUrl:
      initialData?.avatarUrl ||
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=250&auto=format&fit=crop",
  });

  // 4. STATE QUẢN LÝ MODAL "CẬP NHẬT THÔNG TIN" VÀ "XÁC NHẬN ĐĂNG XUẤT"
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<UserProfileData>({ ...userData });
  const [modalSuccessMsg, setModalSuccessMsg] = useState<string>("");

  // 5. UPLOAD AVATAR
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState<boolean>(false);
  const [avatarError, setAvatarError] = useState<boolean>(false);

  // 6. STATE THÔNG BÁO HỆ THỐNG & NHẮC LỊCH
  const [notifications, setNotifications] = useState<ThongBaoItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loadingNotifications, setLoadingNotifications] = useState<boolean>(false);

  const fetchNotifications = async () => {
    try {
      const token = typeof window !== 'undefined'
        ? (localStorage.getItem('auth_token') || localStorage.getItem('token') || '')
        : '';
      if (!token) return;

      setLoadingNotifications(true);
      const res = await fetch(`${API_BASE_URL}/thong-bao`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setNotifications(data.data);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Lỗi tải thông báo:', err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token') || '';
      await fetch(`${API_BASE_URL}/thong-bao/${id}/da-doc`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, da_doc: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {}
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token') || '';
      await fetch(`${API_BASE_URL}/thong-bao/doc-tat-ca`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, da_doc: true })));
      setUnreadCount(0);
      showToast('Đã đánh dấu tất cả thông báo là đã đọc!', 'success');
    } catch (e) {}
  };

  const handleDeleteNotification = async (id: number) => {
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token') || '';
      await fetch(`${API_BASE_URL}/thong-bao/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.filter(n => n.id !== id));
      showToast('Đã xóa thông báo!', 'info');
    } catch (e) {}
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Tự động load thông tin đã đăng nhập từ localStorage và props
  useEffect(() => {
    const syncUser = () => {
      try {
        const savedAuth = localStorage.getItem("auth_user") || localStorage.getItem("soccer_current_user");
        if (savedAuth) {
          const parsed = JSON.parse(savedAuth);
          setUserData((prev) => ({
            ...prev,
            hoTen: parsed.ho_ten || parsed.hoTen || prev.hoTen,
            email: parsed.email || prev.email,
            soDienThoai: parsed.so_dien_thoai ?? parsed.soDienThoai ?? "",
            diaChi: parsed.dia_chi ?? parsed.diaChi ?? "",
            avatarUrl: parsed.anh_dai_dien || parsed.avatarUrl || prev.avatarUrl,
          }));
        } else if (initialData) {
          setUserData((prev) => ({
            ...prev,
            hoTen: initialData.hoTen || prev.hoTen,
            email: initialData.email || prev.email,
            soDienThoai: initialData.soDienThoai ?? "",
            diaChi: initialData.diaChi ?? "",
            avatarUrl: initialData.avatarUrl || prev.avatarUrl,
          }));
        }
      } catch {
        // Ignored
      }
    };

    syncUser();
    if (typeof window !== "undefined") {
      window.addEventListener("app:user-updated", syncUser);
      return () => window.removeEventListener("app:user-updated", syncUser);
    }
  }, [initialData?.hoTen, initialData?.email, initialData?.soDienThoai, initialData?.diaChi, initialData?.avatarUrl]);

  // Xử lý upload ảnh đại diện khi bấm icon máy ảnh
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, JPEG, WEBP)!", "error");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      let newAvatarUrl = "";

      // 1. Đẩy file lên API /api/upload
      const formData = new FormData();
      formData.append("image", file);

      try {
        const res = await fetch(`${API_BASE_URL}/upload`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.success && data.url) {
          newAvatarUrl = data.url;
        }
      } catch (uploadErr) {
        console.warn("Upload API lỗi, fallback sang Data URL:", uploadErr);
      }

      // Fallback sang Data URL nếu API chưa phản hồi
      if (!newAvatarUrl) {
        const reader = new FileReader();
        newAvatarUrl = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }

      // 2. Cập nhật state
      setUserData((prev) => ({ ...prev, avatarUrl: newAvatarUrl }));
      setEditForm((prev) => ({ ...prev, avatarUrl: newAvatarUrl }));

      // 3. Lưu vào localStorage
      const savedAuth = localStorage.getItem("auth_user") || localStorage.getItem("soccer_current_user");
      let userId: number | null = null;
      let finalAuthObj: any = null;
      if (savedAuth) {
        const parsed = JSON.parse(savedAuth);
        userId = parsed.id || null;
        parsed.anh_dai_dien = newAvatarUrl;
        parsed.avatarUrl = newAvatarUrl;
        localStorage.setItem("auth_user", JSON.stringify(parsed));
        finalAuthObj = parsed;
      }
      localStorage.setItem("soccer_current_user", JSON.stringify({ ...userData, avatarUrl: newAvatarUrl }));

      // 4. Đồng bộ CSDL SQL Server nếu đã đăng nhập
      if (userId) {
        await fetch(`${API_BASE_URL}/auth/users/${userId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ho_ten: userData.hoTen,
            email: userData.email,
            so_dien_thoai: userData.soDienThoai,
            anh_dai_dien: newAvatarUrl,
          }),
        });
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("app:user-updated", { detail: finalAuthObj || { anh_dai_dien: newAvatarUrl } }));
        window.dispatchEvent(new Event("storage"));
      }
      if (onUpdateUser && finalAuthObj) {
        onUpdateUser(finalAuthObj);
      }

      showToast("🎉 Đã cập nhật ảnh đại diện thành công!", "success");
    } catch (err) {
      console.error("Lỗi khi tải ảnh đại diện:", err);
      showToast("Không thể cập nhật ảnh đại diện. Vui lòng thử lại!", "error");
    } finally {
      setIsUploadingAvatar(false);
      if (e.target) e.target.value = "";
    }
  };

  // Mở Modal cập nhật thông tin
  const handleOpenModal = () => {
    setEditForm({ ...userData });
    setModalSuccessMsg("");
    setIsModalOpen(true);
  };

  // Đóng Modal cập nhật
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalSuccessMsg("");
  };

  // Lưu thông tin từ Modal (Chỉ cho phép cập nhật Tên, SĐT, Địa chỉ - Không thể đổi Gmail)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editForm.hoTen.trim()) {
      showToast("Họ và tên không được để trống!", "error");
      return;
    }

    if (!editForm.soDienThoai.trim()) {
      showToast("Số điện thoại không được để trống!", "error");
      return;
    }

    const updatedData: UserProfileData = {
      ...userData,
      hoTen: editForm.hoTen.trim(),
      soDienThoai: editForm.soDienThoai.trim(),
      diaChi: editForm.diaChi.trim(),
    };

    setUserData(updatedData);

    try {
      let userId: number | null = null;
      let finalAuthObj: any = null;
      const savedAuth = localStorage.getItem("auth_user") || localStorage.getItem("soccer_current_user");
      if (savedAuth) {
        const parsed = JSON.parse(savedAuth);
        userId = parsed.id || null;
        parsed.ho_ten = updatedData.hoTen;
        parsed.hoTen = updatedData.hoTen;
        parsed.so_dien_thoai = updatedData.soDienThoai;
        parsed.soDienThoai = updatedData.soDienThoai;
        parsed.diaChi = updatedData.diaChi;
        parsed.dia_chi = updatedData.diaChi;
        localStorage.setItem("auth_user", JSON.stringify(parsed));
        finalAuthObj = parsed;
      } else {
        finalAuthObj = {
          ho_ten: updatedData.hoTen,
          hoTen: updatedData.hoTen,
          email: userData.email,
          so_dien_thoai: updatedData.soDienThoai,
          dia_chi: updatedData.diaChi
        };
        localStorage.setItem("auth_user", JSON.stringify(finalAuthObj));
      }
      localStorage.setItem("soccer_current_user", JSON.stringify(updatedData));

      // Đồng bộ trực tiếp vào CSDL SQL Server qua API
      if (userId) {
        const res = await fetch(`${API_BASE_URL}/auth/users/${userId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ho_ten: updatedData.hoTen,
            email: userData.email, // Bảo toàn Gmail, không cho phép đổi
            so_dien_thoai: updatedData.soDienThoai,
            dia_chi: updatedData.diaChi,
            diaChi: updatedData.diaChi,
            anh_dai_dien: userData.avatarUrl,
            vai_tro: finalAuthObj?.vai_tro || undefined
          }),
        });
        const resJson = await res.json();
        if (resJson.success && resJson.data) {
          finalAuthObj = {
            ...finalAuthObj,
            ...resJson.data,
            ho_ten: resJson.data.ho_ten || updatedData.hoTen,
            hoTen: resJson.data.ho_ten || updatedData.hoTen
          };
          localStorage.setItem("auth_user", JSON.stringify(finalAuthObj));
        }
      }

      // Kích hoạt sự kiện để Navbar và các thành phần khác đồng bộ ngay
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("app:user-updated", { detail: finalAuthObj }));
        window.dispatchEvent(new Event("storage"));
      }
      if (onUpdateUser && finalAuthObj) {
        onUpdateUser(finalAuthObj);
      }
    } catch (err) {
      console.warn("Lỗi lưu thông tin:", err);
    }

    setModalSuccessMsg("Cập nhật thông tin thành công!");
    showToast("🎉 Cập nhật thông tin tài khoản thành công!", "success");
    setTimeout(() => {
      handleCloseModal();
    }, 600);
  };

  // Xử lý xác nhận Đăng xuất
  const handleConfirmLogout = () => {
    setIsLogoutModalOpen(false);

    try {
      localStorage.removeItem("soccer_current_user");
      localStorage.removeItem("auth_user");
      localStorage.removeItem("auth_token");
    } catch {
      // Ignored
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("app:logout"));
    }

    if (onLogout) {
      onLogout();
    } else if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  return (
    <>
      {!onClose && (
        <Head>
          <title>Thông Tin Cá Nhân | Hệ Thống Quản Lý Sân Bóng</title>
          <meta name="description" content="Quản lý thông tin tài khoản cá nhân" />
        </Head>
      )}

      <div className={`w-full ${onClose ? "h-full flex flex-col items-center justify-center" : "min-h-screen bg-slate-950 flex items-center justify-center p-3 sm:p-4"} text-slate-100 font-sans`}>
        {/* THÔNG BÁO NỔI DẠNG TOAST */}
        {toast && (
          <div className="fixed top-5 right-5 z-[99999] max-w-sm pointer-events-auto transition-all animate-bounce duration-300">
            <div
              className={`px-4 py-3 rounded-2xl backdrop-blur-xl border flex items-center gap-3 text-xs font-semibold shadow-2xl ${
                toast.type === "success"
                  ? "bg-slate-900/95 text-emerald-300 border-emerald-500/50 shadow-emerald-950/50"
                  : toast.type === "error"
                  ? "bg-slate-900/95 text-rose-300 border-rose-500/50 shadow-rose-950/50"
                  : "bg-slate-900/95 text-slate-200 border-slate-700/80 shadow-slate-950/50"
              }`}
            >
              <div
                className={`p-1.5 rounded-xl shrink-0 ${
                  toast.type === "success"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : toast.type === "error"
                    ? "bg-rose-500/20 text-rose-400"
                    : "bg-slate-800 text-slate-300"
                }`}
              >
                {toast.type === "success" && <CheckCircle2 className="w-4 h-4" />}
                {toast.type === "error" && <AlertCircle className="w-4 h-4" />}
                {toast.type === "info" && <Sparkles className="w-4 h-4" />}
              </div>
              <p className="flex-1 leading-snug">{toast.message}</p>
              <button
                type="button"
                onClick={() => setToast(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer shrink-0"
                title="Đóng thông báo"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* KHUNG MODAL GỌN GÀNG (MAX-WIDTH 2XL, MAX-HEIGHT 88VH ĐẢM BẢO KHÔNG BỊ TRÀN VIEWPORT) */}
        <div className="relative w-full max-w-2xl max-h-[88vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl shadow-black/80 flex flex-col overflow-hidden mx-auto">
          
          {/* HEADER CHÍNH CỦA MODAL (CỐ ĐỊNH Ở ĐẦU, LUÔN HIỂN THỊ NÚT ĐÓNG X) */}
          <div className="px-4 py-3.5 sm:px-5 bg-slate-950/95 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-md shrink-0">
                <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black text-white leading-tight">Hồ Sơ & Tài Khoản</h2>
                <p className="text-[11px] text-slate-400">Xem và quản lý thông tin của bạn</p>
              </div>
            </div>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                title="Đóng cửa sổ (Esc)"
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>

          {/* THANH ĐIỀU HƯỚNG TABS NGANG (RESPONSIVE HOÀN HẢO MỌI THIẾT BỊ) */}
          <nav className="flex items-center gap-1.5 px-3 py-2 bg-slate-950/70 border-b border-slate-800 overflow-x-auto shrink-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab("account")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "account"
                  ? "bg-emerald-500 text-slate-950 shadow-md font-black"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Thông tin</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("notifications");
                fetchNotifications();
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "notifications"
                  ? "bg-emerald-500 text-slate-950 shadow-md font-black"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Thông báo</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                unreadCount > 0
                  ? "bg-rose-500 text-white animate-pulse"
                  : activeTab === "notifications"
                  ? "bg-emerald-800 text-white"
                  : "bg-slate-900 text-slate-400 border border-slate-800"
              }`}>{unreadCount}</span>
            </button>
          </nav>

          {/* PHẦN THÂN NỘI DUNG CUỘN TRONG (OVERFLOW-Y-AUTO) */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 bg-slate-900 space-y-4">
            
            {/* TAB 1: THÔNG TIN TÀI KHOẢN */}
            {activeTab === "account" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-white">Hồ Sơ Cá Nhân</h3>
                  <p className="text-xs text-slate-400">Xem và quản lý thông tin của bạn</p>
                </div>

                {/* Avatar + Tên gọn gàng */}
                <div className="flex items-center gap-3.5 p-3 bg-slate-950/60 border border-slate-800 rounded-2xl">
                  <div className="relative group shrink-0">
                    <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-emerald-500/40 border border-emerald-400 shadow-md bg-slate-800 flex items-center justify-center">
                      {avatarError || !userData.avatarUrl ? (
                        <div className="w-full h-full bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 flex items-center justify-center text-white font-black text-lg select-none">
                          {userData.hoTen
                            ? userData.hoTen.split(" ").filter(Boolean).map((n: string) => n[0]).slice(-2).join("").toUpperCase()
                            : "U"}
                        </div>
                      ) : (
                        <img
                          src={userData.avatarUrl}
                          alt={userData.hoTen}
                          onError={() => setAvatarError(true)}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={(e) => {
                        setAvatarError(false);
                        handleAvatarChange(e);
                      }}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                      title="Bấm để tải ảnh đại diện từ máy tính"
                      className="absolute -bottom-1 -right-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 p-1.5 rounded-full shadow-lg transition-transform hover:scale-110 cursor-pointer disabled:opacity-50"
                    >
                      {isUploadingAvatar ? (
                        <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Camera className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white tracking-wide">
                      {userData.hoTen}
                    </h4>
                    <span className="inline-block text-[10px] text-emerald-400 bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 rounded-full mt-1 font-semibold">
                      Thành viên chính thức
                    </span>
                  </div>
                </div>

                {/* Grid 4 ô thông tin nhỏ gọn */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-2.5 bg-slate-950/50 border border-slate-800/80 rounded-xl">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase mb-0.5">
                      <User className="w-3 h-3 text-emerald-400" />
                      <span>Họ và Tên</span>
                    </div>
                    <p className="text-xs font-bold text-slate-200 truncate">{userData.hoTen}</p>
                  </div>

                  <div className="p-2.5 bg-slate-950/50 border border-slate-800/80 rounded-xl">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase mb-0.5">
                      <Mail className="w-3 h-3 text-emerald-400" />
                      <span>Email</span>
                    </div>
                    <p className="text-xs font-bold text-slate-200 truncate">{userData.email}</p>
                  </div>

                  <div className="p-2.5 bg-slate-950/50 border border-slate-800/80 rounded-xl">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase mb-0.5">
                      <Phone className="w-3 h-3 text-emerald-400" />
                      <span>Số Điện Thoại</span>
                    </div>
                    <p className={`text-xs ${userData.soDienThoai ? "font-bold text-slate-200" : "italic text-slate-500 font-normal"}`}>
                      {userData.soDienThoai || "Chưa cập nhật"}
                    </p>
                  </div>

                  <div className="p-2.5 bg-slate-950/50 border border-slate-800/80 rounded-xl">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase mb-0.5">
                      <MapPin className="w-3 h-3 text-emerald-400" />
                      <span>Địa Chỉ</span>
                    </div>
                    <p className={`text-xs truncate ${userData.diaChi ? "font-bold text-slate-200" : "italic text-slate-500 font-normal"}`}>
                      {userData.diaChi || "Chưa cập nhật"}
                    </p>
                  </div>
                </div>

                {/* Nút CẬP NHẬT THÔNG TIN và ĐĂNG XUẤT */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsLogoutModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl border border-rose-500/30 text-rose-400 bg-rose-500/10 hover:bg-rose-500 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Đăng xuất</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenModal}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/20"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Cập nhật thông tin</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: THÔNG BÁO */}
            {activeTab === "notifications" && (
              <div className="space-y-3">
                {/* Header thanh công cụ thông báo */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-emerald-400" />
                    <span>Hộp thư thông báo ({notifications.length})</span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold">
                        {unreadCount} chưa đọc
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllAsRead}
                      className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Đánh dấu tất cả đã đọc</span>
                    </button>
                  )}
                </div>

                {loadingNotifications ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Đang tải thông báo...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col justify-center items-center py-10 text-center space-y-2">
                    <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500">
                      <Bell className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-200">Không có thông báo mới</h4>
                    <p className="text-xs text-slate-400 max-w-xs">
                      Hiện tại bạn chưa có thông báo mới nào từ hệ thống.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                    {notifications.map((n) => {
                      const isUnread = !n.da_doc || n.da_doc === 0;
                      const isReminder = n.loai_thong_bao === 'NHAC_LICH';

                      return (
                        <div
                          key={n.id}
                          className={`p-3.5 rounded-2xl border transition-all relative group ${
                            isUnread
                              ? 'bg-slate-800/90 border-emerald-500/40 shadow-md ring-1 ring-emerald-500/30'
                              : 'bg-slate-950/70 border-slate-800/80 text-slate-300'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                              isReminder
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}>
                              {isReminder ? <Clock className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <h5 className={`text-xs font-black truncate ${isUnread ? 'text-white' : 'text-slate-200'}`}>
                                  {n.tieu_de}
                                </h5>
                                <span className="text-[10px] text-slate-400 font-mono shrink-0">
                                  {n.ngay_tao ? new Date(n.ngay_tao).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : ''}
                                </span>
                              </div>

                              <p className="text-xs text-slate-300 leading-relaxed break-words whitespace-pre-line">
                                {n.noi_dung}
                              </p>

                              <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-700/50">
                                <div className="flex items-center gap-1.5">
                                  {isUnread && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                      Mới
                                    </span>
                                  )}
                                  {n.ten_san && (
                                    <span className="text-[10px] text-slate-400 font-medium">
                                      🏟️ {n.ten_san}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5">
                                  {isUnread && (
                                    <button
                                      type="button"
                                      onClick={() => handleMarkAsRead(n.id)}
                                      className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 px-2 py-1 rounded-lg hover:bg-emerald-500/10 transition-colors cursor-pointer"
                                      title="Đánh dấu đã đọc"
                                    >
                                      Đã đọc
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteNotification(n.id)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                    title="Xóa thông báo"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* POPUP SỬA THÔNG TIN */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[100000] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl shadow-black/90 p-5 sm:p-6 space-y-4">
              <button
                type="button"
                onClick={handleCloseModal}
                className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Đóng cửa sổ"
              >
                <X className="w-4 h-4" />
              </button>

              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-emerald-400" />
                  <span>Cập Nhật Thông Tin</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Chỉ được thay đổi Họ tên, Số điện thoại và Địa chỉ
                </p>
              </div>

              {modalSuccessMsg && (
                <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{modalSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-3.5">
                {/* 1. Họ và tên */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                    Họ và tên <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={editForm.hoTen}
                      onChange={(e) => setEditForm({ ...editForm, hoTen: e.target.value })}
                      placeholder="Nhập họ và tên"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none transition-colors"
                      required
                    />
                    <User className="w-3.5 h-3.5 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* 2. Email (Gmail) - CỐ ĐỊNH THEO TÀI KHOẢN, KHÔNG THỂ SỬA */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-400 uppercase">
                      Email (Gmail)
                    </label>
                    <span className="text-[10px] text-amber-400/90 font-medium flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-md">
                      <Lock className="w-3 h-3" /> Cố định, không thể đổi
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="email"
                      value={userData.email}
                      disabled
                      readOnly
                      className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-400 cursor-not-allowed select-none pr-9 font-medium"
                    />
                    <Lock className="w-3.5 h-3.5 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Địa chỉ Gmail dùng để đăng nhập và bảo mật tài khoản nên không thể chỉnh sửa.
                  </p>
                </div>

                {/* 3. Số điện thoại */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                    Số điện thoại <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={editForm.soDienThoai}
                      onChange={(e) => setEditForm({ ...editForm, soDienThoai: e.target.value })}
                      placeholder="VD: 0912345678"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none transition-colors"
                      required
                    />
                    <Phone className="w-3.5 h-3.5 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* 4. Địa chỉ */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                    Địa chỉ
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={editForm.diaChi}
                      onChange={(e) => setEditForm({ ...editForm, diaChi: e.target.value })}
                      placeholder="VD: Hà Nội, TP.HCM, Quận 1..."
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none transition-colors"
                    />
                    <MapPin className="w-3.5 h-3.5 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-xl text-xs font-extrabold shadow-md shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
                  >
                    Lưu thay đổi
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL XÁC NHẬN ĐĂNG XUẤT CHUYÊN NGHIỆP */}
        {isLogoutModalOpen && (
          <div
            className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setIsLogoutModalOpen(false)}
          >
            <div
              className="relative w-full max-w-sm rounded-3xl border border-slate-700/80 bg-slate-900/95 p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* ICON ĐĂNG XUẤT */}
              <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shadow-lg shadow-rose-500/20">
                <LogOut className="w-8 h-8 stroke-[2.2]" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-black text-white">Xác nhận đăng xuất</h3>
                <p className="text-xs text-slate-300">
                  Bạn có chắc chắn muốn đăng xuất khỏi tài khoản{' '}
                  <strong className="text-emerald-400">{userData.hoTen}</strong> không?
                </p>
              </div>

              <div className="pt-2 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsLogoutModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmLogout}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs shadow-lg shadow-rose-600/30 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
