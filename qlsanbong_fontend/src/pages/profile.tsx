"use client";

import React, { useState, useEffect, useRef } from "react";
import Head from "next/head";
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
  Sparkles,
  HelpCircle,
} from "lucide-react";
import authService from "../services/authService";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

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

export type TabType = "account" | "notifications" | "password" | "forgot_password";

export interface ProfileProps {
  onLogout?: () => void;
  onClose?: () => void;
  initialData?: Partial<UserProfileData>;
}

export default function Profile({ onLogout, onClose, initialData }: ProfileProps) {
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
    soDienThoai: initialData?.soDienThoai || "0912345678",
    diaChi: initialData?.diaChi || "Hà Nội",
    avatarUrl:
      initialData?.avatarUrl ||
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=250&auto=format&fit=crop",
  });

  // 4. STATE QUẢN LÝ MODAL "CẬP NHẬT THÔNG TIN"
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<UserProfileData>({ ...userData });
  const [modalSuccessMsg, setModalSuccessMsg] = useState<string>("");

  // 5. UPLOAD AVATAR
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState<boolean>(false);

  // 6. STATE QUẢN LÝ FORM "ĐỔI MẬT KHẨU"
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

  // 7. STATE MÃ OTP XÁC THỰC QUA GMAIL (ĐỔI MẬT KHẨU & CẬP NHẬT GMAIL)
  const [passwordOtp, setPasswordOtp] = useState<string>("");
  const [isSendingPasswordOtp, setIsSendingPasswordOtp] = useState<boolean>(false);
  const [passwordOtpCountdown, setPasswordOtpCountdown] = useState<number>(0);

  const [emailOtp, setEmailOtp] = useState<string>("");
  const [isSendingEmailOtp, setIsSendingEmailOtp] = useState<boolean>(false);
  const [emailOtpCountdown, setEmailOtpCountdown] = useState<number>(0);

  // Đếm ngược OTP Đổi mật khẩu
  useEffect(() => {
    if (passwordOtpCountdown <= 0) return;
    const t = setInterval(() => setPasswordOtpCountdown((p) => (p > 0 ? p - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [passwordOtpCountdown]);

  // Đếm ngược OTP Cập nhật Gmail
  useEffect(() => {
    if (emailOtpCountdown <= 0) return;
    const t = setInterval(() => setEmailOtpCountdown((p) => (p > 0 ? p - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [emailOtpCountdown]);

  // 8. STATE QUẢN LÝ "QUÊN MẬT KHẨU"
  const [forgotOtp, setForgotOtp] = useState<string>("");
  const [forgotNewPassword, setForgotNewPassword] = useState<string>("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState<string>("");
  const [showForgotNewPassword, setShowForgotNewPassword] = useState<boolean>(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState<boolean>(false);
  const [isSendingForgotOtp, setIsSendingForgotOtp] = useState<boolean>(false);
  const [forgotOtpCountdown, setForgotOtpCountdown] = useState<number>(0);
  const [forgotMsg, setForgotMsg] = useState<{
    type: "success" | "error" | "";
    text: string;
  }>({ type: "", text: "" });

  // Đếm ngược OTP Quên mật khẩu
  useEffect(() => {
    if (forgotOtpCountdown <= 0) return;
    const t = setInterval(() => setForgotOtpCountdown((p) => (p > 0 ? p - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [forgotOtpCountdown]);

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
      if (savedAuth) {
        const parsed = JSON.parse(savedAuth);
        userId = parsed.id || null;
        parsed.anh_dai_dien = newAvatarUrl;
        parsed.avatarUrl = newAvatarUrl;
        localStorage.setItem("auth_user", JSON.stringify(parsed));
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
    setEmailOtp("");
    setIsModalOpen(true);
  };

  // Đóng Modal cập nhật
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalSuccessMsg("");
    setEmailOtp("");
  };

  // Gửi mã OTP xác thực tới Email mới khi đổi Gmail
  const handleSendEmailOtp = async () => {
    const newEmail = editForm.email.toLowerCase().trim();
    if (!newEmail || !newEmail.includes("@")) {
      showToast("Vui lòng nhập địa chỉ Gmail hợp lệ!", "error");
      return;
    }
    setIsSendingEmailOtp(true);
    try {
      const res = await authService.sendOtp(newEmail, "CAP_NHAT_EMAIL", editForm.hoTen);
      if (res?.success) {
        showToast(`📩 ${res.message || "Đã gửi mã OTP về Gmail mới!"}`, "success");
        setEmailOtpCountdown(60);
      } else {
        showToast(res?.message || "Không thể gửi mã OTP!", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Lỗi khi gửi mã OTP!", "error");
    } finally {
      setIsSendingEmailOtp(false);
    }
  };

  // Gửi mã OTP xác thực tới Gmail hiện tại khi đổi mật khẩu
  const handleSendPasswordOtp = async () => {
    if (!userData.email) {
      setPasswordMsg({ type: "error", text: "Không tìm thấy địa chỉ email tài khoản!" });
      return;
    }
    setIsSendingPasswordOtp(true);
    setPasswordMsg({ type: "", text: "" });
    try {
      const res = await authService.sendOtp(userData.email, "DOI_MAT_KHAU", userData.hoTen);
      if (res?.success) {
        setPasswordMsg({ type: "success", text: res.message || "Đã gửi mã OTP về Gmail của bạn!" });
        setPasswordOtpCountdown(60);
      } else {
        setPasswordMsg({ type: "error", text: res?.message || "Không thể gửi mã OTP lúc này!" });
      }
    } catch (err: any) {
      setPasswordMsg({ type: "error", text: err.message || "Lỗi kết nối khi gửi mã OTP!" });
    } finally {
      setIsSendingPasswordOtp(false);
    }
  };

  // Lưu thông tin từ Modal
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editForm.hoTen.trim()) {
      showToast("Họ và tên không được để trống!", "error");
      return;
    }

    if (!editForm.email.trim()) {
      showToast("Email (Gmail) không được để trống!", "error");
      return;
    }

    const currentEmail = (userData.email || "").toLowerCase().trim();
    const newEmail = editForm.email.toLowerCase().trim();
    const isEmailChanged = newEmail !== currentEmail && currentEmail !== "";

    // Nếu người dùng thay đổi Email -> Bắt buộc xác thực bằng mã OTP gửi về Email mới
    if (isEmailChanged) {
      if (!emailOtp.trim() || emailOtp.trim().length !== 6) {
        showToast("⚠️ Bạn đang thay đổi Gmail! Vui lòng nhập mã OTP 6 số xác thực gửi về hộp thư mới.", "error");
        return;
      }

      try {
        const updateRes = await authService.updateEmail(newEmail, emailOtp.trim());
        if (!updateRes?.success) {
          showToast(updateRes?.message || "Xác thực mã OTP Gmail mới không thành công!", "error");
          return;
        }
      } catch (err: any) {
        showToast(err.message || "Lỗi xác thực Gmail mới!", "error");
        return;
      }
    }

    setUserData(editForm);

    try {
      let userId: number | null = null;
      const savedAuth = localStorage.getItem("auth_user") || localStorage.getItem("soccer_current_user");
      if (savedAuth) {
        const parsed = JSON.parse(savedAuth);
        userId = parsed.id || null;
        parsed.ho_ten = editForm.hoTen;
        parsed.hoTen = editForm.hoTen;
        parsed.email = editForm.email;
        parsed.so_dien_thoai = editForm.soDienThoai;
        parsed.soDienThoai = editForm.soDienThoai;
        parsed.diaChi = editForm.diaChi;
        if (editForm.avatarUrl) {
          parsed.anh_dai_dien = editForm.avatarUrl;
          parsed.avatarUrl = editForm.avatarUrl;
        }
        localStorage.setItem("auth_user", JSON.stringify(parsed));
      }
      localStorage.setItem("soccer_current_user", JSON.stringify(editForm));

      // Đồng bộ trực tiếp vào CSDL SQL Server qua API
      if (userId) {
        await fetch(`${API_BASE_URL}/auth/users/${userId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ho_ten: editForm.hoTen,
            email: editForm.email,
            so_dien_thoai: editForm.soDienThoai,
            diaChi: editForm.diaChi,
            anh_dai_dien: editForm.avatarUrl,
          }),
        });
      }
    } catch {
      // Ignored
    }

    setModalSuccessMsg("Cập nhật thông tin thành công!");
    showToast("🎉 Cập nhật thông tin tài khoản thành công!", "success");
    setTimeout(() => {
      handleCloseModal();
    }, 800);
  };

  // Xử lý form Đổi mật khẩu
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg({ type: "", text: "" });

    if (!newPassword || newPassword.length < 6) {
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

    if (!passwordOtp.trim() || passwordOtp.trim().length !== 6) {
      setPasswordMsg({
        type: "error",
        text: "Vui lòng nhập đúng 6 chữ số mã OTP xác thực gửi về Gmail của bạn!",
      });
      return;
    }

    try {
      const res = await authService.changePassword({
        email: userData.email,
        ma_otp: passwordOtp.trim(),
        mat_khau_cu: currentPassword.trim() || undefined,
        mat_khau_moi: newPassword.trim(),
      });

      if (res?.success) {
        setPasswordMsg({
          type: "success",
          text: res.message || "Đổi mật khẩu thành công! Bạn có thể dùng mật khẩu mới này.",
        });
        showToast("🎉 Đổi mật khẩu tài khoản thành công!", "success");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPasswordOtp("");
      } else {
        setPasswordMsg({
          type: "error",
          text: res?.message || "Đổi mật khẩu thất bại. Vui lòng kiểm tra lại thông tin!",
        });
      }
    } catch (err: any) {
      setPasswordMsg({
        type: "error",
        text: err.message || "Lỗi máy chủ khi đổi mật khẩu!",
      });
    }
  };

  // 9. XỬ LÝ GỬI MÃ OTP QUÊN MẬT KHẨU QUA GMAIL
  const handleSendForgotOtp = async () => {
    if (!userData.email) {
      setForgotMsg({ type: "error", text: "Không tìm thấy địa chỉ Gmail của tài khoản!" });
      return;
    }
    setIsSendingForgotOtp(true);
    setForgotMsg({ type: "", text: "" });
    try {
      const res = await authService.sendOtp(userData.email, "QUEN_MAT_KHAU", userData.hoTen);
      if (res?.success || (res as any)?.data?.success) {
        setForgotOtpCountdown(60);
        setForgotMsg({
          type: "success",
          text: `Mã OTP đã được gửi tới Gmail ${userData.email}. Vui lòng kiểm tra hộp thư!`,
        });
        showToast("📧 Đã gửi mã OTP khôi phục mật khẩu qua Gmail!", "info");
      } else {
        setForgotMsg({
          type: "error",
          text: res?.message || (res as any)?.data?.message || "Không thể gửi mã OTP qua Gmail. Vui lòng thử lại!",
        });
      }
    } catch (err: any) {
      setForgotMsg({
        type: "error",
        text: err.response?.data?.message || err.message || "Lỗi gửi mã OTP qua Gmail!",
      });
    } finally {
      setIsSendingForgotOtp(false);
    }
  };

  // 10. XỬ LÝ SUBMIT ĐẶT LẠI MẬT KHẨU MỚI BẰNG OTP
  const handleResetForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMsg({ type: "", text: "" });

    if (!forgotOtp.trim() || forgotOtp.trim().length !== 6) {
      setForgotMsg({ type: "error", text: "Vui lòng nhập đúng 6 chữ số mã OTP xác thực qua Gmail!" });
      return;
    }

    if (forgotNewPassword.length < 6) {
      setForgotMsg({ type: "error", text: "Mật khẩu mới phải có tối thiểu 6 ký tự!" });
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotMsg({ type: "error", text: "Mật khẩu xác nhận không trùng khớp!" });
      return;
    }

    try {
      const res = await authService.changePassword({
        email: userData.email,
        ma_otp: forgotOtp.trim(),
        mat_khau_moi: forgotNewPassword.trim(),
        loai_otp: "QUEN_MAT_KHAU",
      });

      if (res?.success || (res as any)?.data?.success) {
        setForgotMsg({
          type: "success",
          text: "🎉 Đặt lại mật khẩu thành công! Mật khẩu mới của bạn đã có hiệu lực.",
        });
        showToast("🎉 Đặt lại mật khẩu thành công!", "success");
        setForgotOtp("");
        setForgotNewPassword("");
        setForgotConfirmPassword("");
      } else {
        setForgotMsg({
          type: "error",
          text: res?.message || (res as any)?.data?.message || "Đặt lại mật khẩu thất bại. Vui lòng kiểm tra lại mã OTP!",
        });
      }
    } catch (err: any) {
      setForgotMsg({
        type: "error",
        text: err.response?.data?.message || err.message || "Lỗi đặt lại mật khẩu!",
      });
    }
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
    <>
      {!onClose && (
        <Head>
          <title>Thông Tin Cá Nhân | Hệ Thống Quản Lý Sân Bóng</title>
          <meta name="description" content="Quản lý thông tin tài khoản cá nhân" />
        </Head>
      )}

      <div className={`w-full ${onClose ? "" : "min-h-screen bg-slate-950 flex items-center justify-center p-4"} text-slate-100 font-sans`}>
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

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("forgot_password");
                    setForgotMsg({ type: "", text: "" });
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === "forgot_password"
                      ? "bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                  }`}
                >
                  <HelpCircle className="w-4 h-4 text-emerald-400" />
                  <span>Quên mật khẩu</span>
                </button>
              </nav>
            </div>

            <div className="pt-3 border-t border-slate-800/80 text-[10px] text-slate-500 hidden md:block">
              <p>Sport247 Pro</p>
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
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleAvatarChange}
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

                  {/* Trường Mã xác thực OTP qua Gmail khi Đổi mật khẩu */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                      Mã xác thực OTP qua Gmail <span className="text-rose-400">*</span>
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        maxLength={6}
                        value={passwordOtp}
                        onChange={(e) => setPasswordOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="6 chữ số OTP"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-emerald-400 placeholder-slate-500 text-xs font-mono tracking-widest font-bold text-center focus:outline-none focus:border-emerald-500"
                        required
                      />
                      <button
                        type="button"
                        disabled={isSendingPasswordOtp || passwordOtpCountdown > 0}
                        onClick={handleSendPasswordOtp}
                        className="px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs whitespace-nowrap transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-emerald-500/20 active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        {isSendingPasswordOtp ? (
                          <>
                            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            <span>Đang gửi...</span>
                          </>
                        ) : passwordOtpCountdown > 0 ? (
                          <span>Gửi lại ({passwordOtpCountdown}s)</span>
                        ) : (
                          <>
                            <Mail className="w-3.5 h-3.5" />
                            <span>Gửi mã OTP</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Bấm <strong>"Gửi mã OTP"</strong> để nhận mã bảo mật gửi tới Gmail tài khoản của bạn ({userData.email}).
                    </p>
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

            {/* TAB 4: QUÊN MẬT KHẨU (GỬI MÃ OTP QUA GMAIL) */}
            {activeTab === "forgot_password" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-emerald-400" />
                    <span>Quên Mật Khẩu</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Khôi phục mật khẩu thông qua mã xác thực OTP gửi tới Gmail tài khoản của bạn
                  </p>
                </div>

                {forgotMsg.text && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                      forgotMsg.type === "success"
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : "bg-rose-500/10 border-rose-500/30 text-rose-400"
                    }`}
                  >
                    {forgotMsg.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{forgotMsg.text}</span>
                  </div>
                )}

                <form onSubmit={handleResetForgotPassword} className="space-y-3">
                  {/* Gmail tài khoản */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                      Email đăng ký tài khoản
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={userData.email || ""}
                        readOnly
                        disabled
                        className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-400 cursor-not-allowed select-none"
                      />
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    </div>
                  </div>

                  {/* Nhận và nhập mã OTP */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                      Mã xác thực OTP qua Gmail <span className="text-rose-400">*</span>
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        maxLength={6}
                        value={forgotOtp}
                        onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="6 chữ số OTP"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-emerald-400 placeholder-slate-500 text-xs font-mono tracking-widest font-bold text-center focus:outline-none focus:border-emerald-500"
                        required
                      />
                      <button
                        type="button"
                        disabled={isSendingForgotOtp || forgotOtpCountdown > 0}
                        onClick={handleSendForgotOtp}
                        className="px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs whitespace-nowrap transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-emerald-500/20 active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        {isSendingForgotOtp ? (
                          <>
                            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            <span>Đang gửi...</span>
                          </>
                        ) : forgotOtpCountdown > 0 ? (
                          <span>Gửi lại ({forgotOtpCountdown}s)</span>
                        ) : (
                          <>
                            <Mail className="w-3.5 h-3.5" />
                            <span>Gửi mã OTP</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Bấm <strong>"Gửi mã OTP"</strong> để nhận mã xác minh 6 chữ số gửi tới hộp thư Gmail của bạn ({userData.email}).
                    </p>
                  </div>

                  {/* Mật khẩu mới */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                      Mật khẩu mới <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showForgotNewPassword ? "text" : "password"}
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        placeholder="Tối thiểu 6 ký tự"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:border-emerald-500 focus:outline-none pr-10"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showForgotNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Xác nhận mật khẩu mới */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                      Xác nhận mật khẩu mới <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showForgotConfirmPassword ? "text" : "password"}
                        value={forgotConfirmPassword}
                        onChange={(e) => setForgotConfirmPassword(e.target.value)}
                        placeholder="Nhập lại mật khẩu mới"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:border-emerald-500 focus:outline-none pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotConfirmPassword(!showForgotConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showForgotConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-all cursor-pointer"
                    >
                      Xác nhận đặt lại mật khẩu
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
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                    Email (Gmail) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    placeholder="user@gmail.com"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:border-emerald-500 focus:outline-none"
                    required
                  />

                  {/* Phần xác thực mã OTP khi người dùng thay đổi Email */}
                  {editForm.email.toLowerCase().trim() !== (userData.email || "").toLowerCase().trim() && editForm.email.trim() !== "" && (
                    <div className="mt-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
                      <p className="text-[11px] font-semibold mb-2 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Bạn đang thay đổi địa chỉ Gmail. Vui lòng xác thực mã OTP gửi tới email mới!</span>
                      </p>
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          maxLength={6}
                          value={emailOtp}
                          onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          placeholder="6 số OTP mới"
                          className="w-full px-3 py-1.5 bg-slate-950 border border-amber-500/50 rounded-xl text-emerald-400 placeholder-slate-500 text-xs font-mono tracking-widest font-bold text-center focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          disabled={isSendingEmailOtp || emailOtpCountdown > 0}
                          onClick={handleSendEmailOtp}
                          className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs whitespace-nowrap transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow active:scale-95 flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          {isSendingEmailOtp ? (
                            <>
                              <span className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                              <span>Đang gửi...</span>
                            </>
                          ) : emailOtpCountdown > 0 ? (
                            <span>Gửi lại ({emailOtpCountdown}s)</span>
                          ) : (
                            <>
                              <Mail className="w-3 h-3" />
                              <span>Gửi OTP</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={editForm.soDienThoai}
                    onChange={(e) => setEditForm({ ...editForm, soDienThoai: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">Địa chỉ</label>
                  <input
                    type="text"
                    value={editForm.diaChi}
                    onChange={(e) => setEditForm({ ...editForm, diaChi: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:border-emerald-500 focus:outline-none"
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
    </>
  );
}
