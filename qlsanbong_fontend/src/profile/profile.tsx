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

export interface UserProfileData {
  hoTen: string;
  email: string;
  soDienThoai: string;
  diaChi: string;
  avatarUrl?: string;
}

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
    hoTen: initialData?.hoTen || "Khách Hàng",
    email: initialData?.email || "khachhang@gmail.com",
    soDienThoai: initialData?.soDienThoai || "0912345678",
    diaChi: initialData?.diaChi || "Hà Nội",
    avatarUrl:
      initialData?.avatarUrl ||
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=250&auto=format&fit=crop",
  });

  // 3. STATE QUẢN LÝ MODAL "CẬP NHẬT THÔNG TIN"
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
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
      const savedAuth = localStorage.getItem("auth_user") || localStorage.getItem("soccer_current_user");
      if (savedAuth) {
        const parsed = JSON.parse(savedAuth);
        setUserData((prev) => ({
          ...prev,
          hoTen: parsed.ho_ten || parsed.hoTen || prev.hoTen,
          email: parsed.email || prev.email,
          soDienThoai: parsed.so_dien_thoai || parsed.soDienThoai || prev.soDienThoai,
          diaChi: parsed.diaChi || prev.diaChi,
          avatarUrl: parsed.anh_dai_dien || parsed.avatarUrl || prev.avatarUrl,
        }));
      }
    } catch {
      // Ignored
    }
  }, []);

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

  // Lưu thông tin từ Modal
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();

    if (!editForm.hoTen.trim()) {
      alert("Họ và tên không được để trống!");
      return;
    }

    setUserData(editForm);

    try {
      localStorage.setItem("soccer_current_user", JSON.stringify(editForm));
      const authUserStr = localStorage.getItem("auth_user");
      if (authUserStr) {
        const authObj = JSON.parse(authUserStr);
        authObj.ho_ten = editForm.hoTen;
        authObj.so_dien_thoai = editForm.soDienThoai;
        localStorage.setItem("auth_user", JSON.stringify(authObj));
      }
    } catch {
      // Ignored
    }

    setModalSuccessMsg("Cập nhật thông tin thành công!");
    setTimeout(() => {
      handleCloseModal();
    }, 800);
  };

  // Xử lý form Đổi mật khẩu
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg({ type: "", text: "" });

    if (!currentPassword) {
      setPasswordMsg({
        type: "error",
        text: "Vui lòng nhập mật khẩu hiện tại!",
      });
      return;
    }

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

    setPasswordMsg({
      type: "success",
      text: "Đổi mật khẩu thành công!",
    });

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  // Xử lý Đăng xuất
  const handleLogout = () => {
    const isConfirm = window.confirm("Bạn có chắc chắn muốn đăng xuất không?");
    if (!isConfirm) return;

    try {
      localStorage.removeItem("soccer_current_user");
      localStorage.removeItem("auth_user");
      localStorage.removeItem("auth_token");
    } catch {
      // Ignored
    }

    if (onLogout) {
      onLogout();
    } else if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  return (
    <div className={`w-full ${onClose ? "" : "min-h-screen bg-slate-950 flex items-center justify-center p-4"} text-slate-100 font-sans`}>
      {/* KHUNG MODAL GỌN GÀNG (MAX-WIDTH 2XL / 3XL) */}
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col md:flex-row mx-auto">
        
        {/* Nút X đóng Profile */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            title="Đóng trang cá nhân"
            className="absolute top-3 right-3 z-30 p-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* CỘT TRÁI: SIDEBAR ĐIỀU HƯỚNG GỌN GÀNG */}
        <div className="w-full md:w-[32%] bg-slate-950/70 border-b md:border-b-0 md:border-r border-slate-800 p-4 flex flex-col justify-between">
          <div>
            {/* Header Sidebar */}
            <div className="flex items-center gap-2.5 mb-4 px-1">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-md">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Tài Khoản</h2>
                <p className="text-[11px] text-slate-400">Hồ sơ thành viên</p>
              </div>
            </div>

            {/* Menu Tabs */}
            <nav className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTab("account")}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "account"
                    ? "bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                }`}
              >
                <User className="w-4 h-4 text-emerald-400" />
                <span>Thông tin</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("notifications")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "notifications"
                    ? "bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Bell className="w-4 h-4 text-emerald-400" />
                  <span>Thông báo</span>
                </div>
                <span className="text-[10px] bg-slate-900 px-1.5 py-0.2 rounded-full text-slate-400 border border-slate-800">
                  0
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("password")}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "password"
                    ? "bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                }`}
              >
                <KeyRound className="w-4 h-4 text-emerald-400" />
                <span>Đổi mật khẩu</span>
              </button>
            </nav>
          </div>

          <div className="pt-3 border-t border-slate-800/80 text-[10px] text-slate-500 hidden md:block">
            <p>Soccer247 Pro</p>
          </div>
        </div>

        {/* CỘT PHẢI: NỘI DUNG CHÍNH (GỌN GÀNG, KHÔNG BỊ TRÀN) */}
        <div className="w-full md:w-[68%] p-4 sm:p-5 bg-slate-900">
          
          {/* TAB 1: THÔNG TIN TÀI KHOẢN */}
          {activeTab === "account" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-white">Hồ Sơ Cá Nhân</h3>
                <p className="text-xs text-slate-400">Xem và quản lý thông tin của bạn</p>
              </div>

              {/* Avatar + Tên gọn gàng */}
              <div className="flex items-center gap-3.5 p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                <div className="relative group shrink-0">
                  <img
                    src={userData.avatarUrl}
                    alt={userData.hoTen}
                    className="w-14 h-14 rounded-full object-cover ring-2 ring-emerald-500/40 border border-emerald-400 shadow-md"
                  />
                  <button
                    type="button"
                    title="Đổi ảnh đại diện"
                    className="absolute -bottom-1 -right-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 p-1 rounded-full shadow transition-transform hover:scale-110 cursor-pointer"
                  >
                    <Camera className="w-3 h-3" />
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
                  <p className="text-xs font-bold text-slate-200">{userData.soDienThoai}</p>
                </div>

                <div className="p-2.5 bg-slate-950/50 border border-slate-800/80 rounded-xl">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase mb-0.5">
                    <MapPin className="w-3 h-3 text-emerald-400" />
                    <span>Địa Chỉ</span>
                  </div>
                  <p className="text-xs font-bold text-slate-200 truncate">{userData.diaChi}</p>
                </div>
              </div>

              {/* Nút CẬP NHẬT THÔNG TIN và ĐĂNG XUẤT */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleLogout}
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
            <div className="flex flex-col justify-center items-center py-10 text-center space-y-2">
              <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500">
                <Bell className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-200">Không có thông báo mới</h4>
              <p className="text-xs text-slate-400 max-w-xs">
                Hiện tại bạn chưa có thông báo mới nào từ hệ thống.
              </p>
            </div>
          )}

          {/* TAB 3: ĐỔI MẬT KHẨU */}
          {activeTab === "password" && (
            <div className="space-y-3">
              <div>
                <h3 className="text-base font-bold text-white">Đổi Mật Khẩu</h3>
                <p className="text-xs text-slate-400">Bảo vệ an toàn cho tài khoản của bạn</p>
              </div>

              {passwordMsg.text && (
                <div
                  className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                    passwordMsg.type === "success"
                      ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                      : "bg-rose-500/15 border border-rose-500/30 text-rose-400"
                  }`}
                >
                  {passwordMsg.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{passwordMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                    Mật khẩu hiện tại <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Nhập mật khẩu hiện tại"
                      className="w-full pl-3 pr-8 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                    Mật khẩu mới (≥ 6 ký tự) <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Tối thiểu 6 ký tự"
                      className="w-full pl-3 pr-8 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                    Xác nhận mật khẩu mới <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu mới"
                      className="w-full pl-3 pr-8 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-all cursor-pointer"
                  >
                    Xác nhận đổi mật khẩu
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>

      {/* POPUP SỬA THÔNG TIN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5">
            <button
              type="button"
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-bold text-white mb-1">Cập Nhật Thông Tin</h3>
            <p className="text-xs text-slate-400 mb-4">Chỉnh sửa thông tin hồ sơ của bạn</p>

            {modalSuccessMsg && (
              <div className="p-2 mb-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>{modalSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                  Họ và tên <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.hoTen}
                  onChange={(e) => setEditForm({ ...editForm, hoTen: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">Số điện thoại</label>
                <input
                  type="text"
                  value={editForm.soDienThoai}
                  onChange={(e) => setEditForm({ ...editForm, soDienThoai: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">Địa chỉ</label>
                <input
                  type="text"
                  value={editForm.diaChi}
                  onChange={(e) => setEditForm({ ...editForm, diaChi: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="w-1/2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 rounded-xl text-xs font-extrabold"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
