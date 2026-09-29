"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Bell,
  KeyRound,
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
  Eye,
  EyeOff,
} from "lucide-react";

// =====================================================================
// ĐỊNH NGHĨA KIỂU DỮ LIỆU (INTERFACES)
// =====================================================================

// Kiểu dữ liệu thông tin người dùng
export interface UserProfileData {
  hoTen: string;
  email: string;
  soDienThoai: string;
  diaChi: string;
  avatarUrl?: string;
}

// Kiểu các tab điều hướng
export type TabType = "account" | "notifications" | "password";

interface ProfileProps {
  onLogout?: () => void;
  onClose?: () => void;
  initialData?: Partial<UserProfileData>;
}

export default function Profile({ onLogout, onClose, initialData }: ProfileProps) {
  // 1. STATE QUẢN LÝ TAB ĐIỀU HƯỚNG HIỆN TẠI
  const [activeTab, setActiveTab] = useState<TabType>("account");

  // 2. STATE THÔNG TIN NGƯỜI DÙNG HIỂN THỊ
  const [userData, setUserData] = useState<UserProfileData>({
    hoTen: initialData?.hoTen || "Nguyễn Văn Đạt",
    email: initialData?.email || "vandat.soccer@gmail.com",
    soDienThoai: initialData?.soDienThoai || "0987 654 321",
    diaChi: initialData?.diaChi || "123 Đường Cầu Giấy, Quận Cầu Giấy, Hà Nội",
    avatarUrl:
      initialData?.avatarUrl ||
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=250&auto=format&fit=crop",
  });

  // 3. STATE QUẢN LÝ MODAL "CẬP NHẬT THÔNG TIN"
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // State tạm thời khi gõ trong Modal cập nhật thông tin
  const [editForm, setEditForm] = useState<UserProfileData>({ ...userData });
  const [modalSuccessMsg, setModalSuccessMsg] = useState<string>("");

  // 4. STATE QUẢN LÝ FORM "ĐỔI MẬT KHẨU"
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  const [passwordMsg, setPasswordMsg] = useState<{
    type: "success" | "error" | "";
    text: string;
  }>({ type: "", text: "" });

  // Tự động load thông tin đã đăng nhập từ localStorage (nếu có)
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("soccer_current_user");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setUserData((prev) => ({
          ...prev,
          hoTen: parsed.hoTen || prev.hoTen,
          email: parsed.email || prev.email,
          soDienThoai: parsed.soDienThoai || prev.soDienThoai,
          diaChi: parsed.diaChi || prev.diaChi,
        }));
      }
    } catch {
      // Bỏ qua lỗi parse nếu có
    }
  }, []);

  // Mở Modal và đồng bộ dữ liệu hiện tại vào form sửa
  const handleOpenModal = () => {
    setEditForm({ ...userData });
    setModalSuccessMsg("");
    setIsModalOpen(true);
  };

  // Đóng Modal Cập nhật
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalSuccessMsg("");
  };

  // Lưu thông tin từ Modal
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate nhanh
    if (!editForm.hoTen.trim()) {
      alert("Họ và tên không được để trống!");
      return;
    }

    // Cập nhật State
    setUserData(editForm);

    // Lưu vào localStorage để duy trì trạng thái
    try {
      localStorage.setItem("soccer_current_user", JSON.stringify(editForm));
    } catch {
      // Ignored
    }

    setModalSuccessMsg("Cập nhật thông tin thành công!");
    setTimeout(() => {
      handleCloseModal();
    }, 900);
  };

  // Xử lý Lưu form Đổi mật khẩu
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg({ type: "", text: "" });

    // Validate form đổi mật khẩu
    if (!currentPassword) {
      setPasswordMsg({
        type: "error",
        text: "Vui lòng nhập mật khẩu hiện tại!",
      });
      return;
    }

    // Kiểm tra độ dài mật khẩu mới: Tối thiểu 6 ký tự
    if (newPassword.length < 6) {
      setPasswordMsg({
        type: "error",
        text: "Mật khẩu mới phải có tối thiểu 6 ký tự!",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({
        type: "error",
        text: "Mật khẩu xác nhận không trùng khớp!",
      });
      return;
    }

    // Thành công
    setPasswordMsg({
      type: "success",
      text: "Đổi mật khẩu thành công!",
    });

    // Reset các ô input
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  // Xử lý sự kiện Đăng xuất
  const handleLogout = () => {
    const isConfirm = window.confirm("Bạn có chắc chắn muốn đăng xuất không?");
    if (!isConfirm) return;

    console.log("👉 Đã đăng xuất khỏi tài khoản:", userData.email);

    // Xóa session đăng nhập
    try {
      localStorage.removeItem("soccer_current_user");
    } catch {
      // Ignored
    }

    if (onLogout) {
      onLogout();
    } else {
      // Tùy chọn chuyển hướng về trang chủ
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }
  };

  return (
    <div className={`w-full ${onClose ? "py-2" : "min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-gray-950"} text-slate-100 flex items-center justify-center p-2 sm:p-4 md:p-8 font-sans`}>
      {/* =========================================================
          KHUNG CHÍNH (CONTAINER 2 PHẦN - BỐ CỤC 30% / 70%)
          ========================================================= */}
      <div className="relative w-full max-w-5xl bg-slate-900/95 border border-slate-800 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/60 overflow-hidden flex flex-col md:flex-row">
        
        {/* Nút X đóng Profile nếu mở dưới dạng Modal Popup */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            title="Đóng trang cá nhân"
            className="absolute top-4 right-4 z-30 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors cursor-pointer shadow-md"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* =======================================================
            CỘT BÊN TRÁI: THANH MENU ĐIỀU HƯỚNG (SIDEBAR - Chiếm 30%)
            ======================================================= */}
        <div className="w-full md:w-[30%] bg-slate-900/80 border-b md:border-b-0 md:border-r border-slate-800 p-6 flex flex-col justify-between">
          <div>
            {/* Header Sidebar */}
            <div className="flex items-center gap-3 mb-8 px-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Cá Nhân
                </h2>
                <p className="text-xs text-slate-400">Quản lý tài khoản</p>
              </div>
            </div>

            {/* Danh sách Menu Điều hướng */}
            <nav className="flex flex-col gap-2">
              {/* Mục 1: Thông tin tài khoản */}
              <button
                type="button"
                onClick={() => setActiveTab("account")}
                className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer ${
                  activeTab === "account"
                    ? "bg-slate-800 text-emerald-400 shadow-md border-l-4 border-emerald-500 font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <User
                  className={`w-5 h-5 transition-transform duration-200 ${
                    activeTab === "account" ? "scale-110 text-emerald-400" : ""
                  }`}
                />
                <span>Thông tin tài khoản</span>
              </button>

              {/* Mục 2: Thông báo */}
              <button
                type="button"
                onClick={() => setActiveTab("notifications")}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer ${
                  activeTab === "notifications"
                    ? "bg-slate-800 text-emerald-400 shadow-md border-l-4 border-emerald-500 font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Bell
                    className={`w-5 h-5 transition-transform duration-200 ${
                      activeTab === "notifications"
                        ? "scale-110 text-emerald-400"
                        : ""
                    }`}
                  />
                  <span>Thông báo</span>
                </div>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-400 border border-slate-700">
                  0
                </span>
              </button>

              {/* Mục 3: Đổi mật khẩu */}
              <button
                type="button"
                onClick={() => setActiveTab("password")}
                className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer ${
                  activeTab === "password"
                    ? "bg-slate-800 text-emerald-400 shadow-md border-l-4 border-emerald-500 font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <KeyRound
                  className={`w-5 h-5 transition-transform duration-200 ${
                    activeTab === "password" ? "scale-110 text-emerald-400" : ""
                  }`}
                />
                <span>Đổi mật khẩu</span>
              </button>
            </nav>
          </div>

          {/* Quick info footer bên Sidebar */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 px-2 text-xs text-slate-500 hidden md:block">
            <p>Hệ thống Quản lý Sân bóng</p>
            <p className="mt-1 text-[11px] text-slate-600">Phiên bản 2.0.0</p>
          </div>
        </div>

        {/* =======================================================
            CỘT BÊN PHẢI: KHU VỰC NỘI DUNG CHI TIẾT (Chiếm 70%)
            ======================================================= */}
        <div className="w-full md:w-[70%] p-6 md:p-10 bg-slate-900/40">
          {/* =====================================================
              TRƯỜNG HỢP 1: TAB "THÔNG TIN TÀI KHOẢN"
              ===================================================== */}
          {activeTab === "account" && (
            <div className="tab-content-animate flex flex-col justify-between h-full space-y-8">
              <div>
                {/* Tiêu đề mục */}
                <div className="border-b border-slate-800 pb-4 mb-6">
                  <h3 className="text-xl font-bold text-white tracking-wide">
                    Hồ Sơ Cá Nhân
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">
                    Xem và quản lý thông tin tài khoản của bạn
                  </p>
                </div>

                {/* Phần trên: Khung căn giữa Avatar và Tên tài khoản */}
                <div className="flex flex-col items-center justify-center p-6 bg-slate-800/40 border border-slate-800/80 rounded-2xl mb-8">
                  <div className="relative group">
                    <img
                      src={userData.avatarUrl}
                      alt={userData.hoTen}
                      className="w-24 h-24 rounded-full object-cover ring-4 ring-emerald-500/30 border-2 border-emerald-400 shadow-xl"
                    />
                    <button
                      type="button"
                      title="Đổi ảnh đại diện"
                      className="absolute bottom-0 right-0 bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-full shadow-lg transition-transform duration-200 hover:scale-110 cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Tên tài khoản in đậm */}
                  <h4 className="mt-4 text-xl font-bold text-white tracking-wide">
                    {userData.hoTen}
                  </h4>
                  <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full mt-1.5 font-medium">
                    Thành viên chính thức
                  </p>
                </div>

                {/* Phần dưới: Danh sách thông tin cá nhân */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Họ tên */}
                  <div className="p-4 bg-slate-800/50 border border-slate-800 rounded-xl">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      <User className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Họ và Tên</span>
                    </div>
                    <p className="text-base font-medium text-slate-200">
                      {userData.hoTen}
                    </p>
                  </div>

                  {/* Email */}
                  <div className="p-4 bg-slate-800/50 border border-slate-800 rounded-xl">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      <Mail className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Địa Chỉ Email</span>
                    </div>
                    <p className="text-base font-medium text-slate-200 truncate">
                      {userData.email}
                    </p>
                  </div>

                  {/* Số điện thoại */}
                  <div className="p-4 bg-slate-800/50 border border-slate-800 rounded-xl">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Số Điện Thoại</span>
                    </div>
                    <p className="text-base font-medium text-slate-200">
                      {userData.soDienThoai}
                    </p>
                  </div>

                  {/* Địa chỉ */}
                  <div className="p-4 bg-slate-800/50 border border-slate-800 rounded-xl">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Địa Chỉ</span>
                    </div>
                    <p className="text-base font-medium text-slate-200 line-clamp-1">
                      {userData.diaChi}
                    </p>
                  </div>
                </div>
              </div>

              {/* Dưới cùng: 2 nút bấm CẬP NHẬT THÔNG TIN và ĐĂNG XUẤT */}
              <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row gap-4 justify-end items-center">
                {/* Nút ĐĂNG XUẤT (Màu đỏ/danger) */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl border border-red-500/30 text-red-400 bg-red-500/10 hover:bg-red-500 hover:text-white font-semibold text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-500/10"
                >
                  <LogOut className="w-4 h-4" />
                  <span>ĐĂNG XUẤT</span>
                </button>

                {/* Nút CẬP NHẬT THÔNG TIN (Màu xanh ngọc/primary) */}
                <button
                  type="button"
                  onClick={handleOpenModal}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/25 active:scale-[0.98]"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>CẬP NHẬT THÔNG TIN</span>
                </button>
              </div>
            </div>
          )}

          {/* =====================================================
              TRƯỜNG HỢP 2: TAB "THÔNG BÁO"
              ===================================================== */}
          {activeTab === "notifications" && (
            <div className="tab-content-animate flex flex-col justify-center items-center py-16 text-center">
              <div className="w-20 h-20 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-500 mb-5 shadow-inner">
                <Bell className="w-10 h-10 stroke-[1.5]" />
              </div>
              <h4 className="text-lg font-bold text-slate-200">
                Không có thông báo mới
              </h4>
              <p className="text-sm text-slate-400 mt-2 max-w-sm">
                Hiện tại bạn chưa nhận được thông báo nào từ hệ thống đặt sân bóng.
              </p>
            </div>
          )}

          {/* =====================================================
              TRƯỜNG HỢP 3: TAB "ĐỔI MẬT KHẨU"
              ===================================================== */}
          {activeTab === "password" && (
            <div className="tab-content-animate max-w-lg">
              <div className="border-b border-slate-800 pb-4 mb-6">
                <h3 className="text-xl font-bold text-white tracking-wide">
                  Đổi Mật Khẩu
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  Đảm bảo tài khoản của bạn luôn được bảo vệ an toàn
                </p>
              </div>

              {/* Thông báo kết quả đổi mật khẩu */}
              {passwordMsg.text && (
                <div
                  className={`p-4 rounded-xl mb-6 text-sm flex items-center gap-3 ${
                    passwordMsg.type === "success"
                      ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                      : "bg-red-500/15 border border-red-500/30 text-red-400"
                  }`}
                >
                  {passwordMsg.type === "success" ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 shrink-0" />
                  )}
                  <span>{passwordMsg.text}</span>
                </div>
              )}

              {/* Form Đổi mật khẩu */}
              <form onSubmit={handleChangePassword} className="space-y-5">
                {/* 1. Mật khẩu hiện tại */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Mật khẩu hiện tại <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Nhập mật khẩu hiện tại"
                      className="w-full pl-10 pr-10 py-3 bg-slate-800/70 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm profile-input-focus focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* 2. Mật khẩu mới */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Mật khẩu mới <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Tối thiểu 6 ký tự"
                      className="w-full pl-10 pr-10 py-3 bg-slate-800/70 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm profile-input-focus focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* 3. Xác nhận mật khẩu mới */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Xác nhận mật khẩu mới <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu mới"
                      className="w-full pl-10 pr-10 py-3 bg-slate-800/70 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm profile-input-focus focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Nút LƯU Đổi mật khẩu */}
                <div className="pt-3">
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/25 active:scale-[0.98]"
                  >
                    <span>LƯU</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================
          MODAL (BẢNG POPUP): CẬP NHẬT THÔNG TIN
          Hiển thị đè lên màn hình có overlay nền mờ tối
          ========================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div
            className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden transform transition-all tab-content-animate"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-850">
              <div className="flex items-center gap-2.5">
                <Edit3 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white">
                  Cập Nhật Thông Tin Cá Nhân
                </h3>
              </div>
              {/* Nút X đóng Modal */}
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
              {/* Thông báo lưu thành công */}
              {modalSuccessMsg && (
                <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{modalSuccessMsg}</span>
                </div>
              )}

              {/* Ô 1: Họ tên */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Tên / Họ và Tên <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={editForm.hoTen}
                    onChange={(e) =>
                      setEditForm({ ...editForm, hoTen: e.target.value })
                    }
                    placeholder="Nhập họ và tên"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm profile-input-focus focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              {/* Ô 2: Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Địa Chỉ Email <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm({ ...editForm, email: e.target.value })
                    }
                    placeholder="example@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm profile-input-focus focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              {/* Ô 3: Số điện thoại */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Số Điện Thoại
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={editForm.soDienThoai}
                    onChange={(e) =>
                      setEditForm({ ...editForm, soDienThoai: e.target.value })
                    }
                    placeholder="0987..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm profile-input-focus focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              {/* Ô 4: Địa chỉ */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Địa Chỉ
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={editForm.diaChi}
                    onChange={(e) =>
                      setEditForm({ ...editForm, diaChi: e.target.value })
                    }
                    placeholder="Số nhà, tên đường, quận/huyện, thành phố"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm profile-input-focus focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              {/* Nút LƯU trong Modal */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm tracking-wide transition-all duration-200 cursor-pointer shadow-lg shadow-emerald-500/25 active:scale-[0.98]"
                >
                  LƯU
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
