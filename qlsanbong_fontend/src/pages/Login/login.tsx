"use client";

import React, { useState, useEffect } from "react";
import { User, Mail, Phone, Lock, Eye, EyeOff, X, Sparkles, LogIn, UserPlus } from "lucide-react";

// Định nghĩa kiểu dữ liệu người dùng khi xác thực thành công từ CSDL SQL Server
export interface AuthUser {
  id?: number;
  ho_ten: string;
  email: string;
  so_dien_thoai?: string;
  vai_tro?: string;
  anh_dai_dien?: string;
}

export interface LoginProps {
  isOpen?: boolean;
  onClose?: () => void;
  initialRegister?: boolean;
  onLoginSuccess?: (userData: AuthUser) => void;
  // Các props tương thích ngược
  showRegisterButton?: boolean;
  isOpenControlled?: boolean;
  onOpenChange?: (open: boolean) => void;
  onCloseControlled?: () => void;
}

// Địa chỉ API Backend kết nối trực tiếp với SQL Server
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL 
  ? `${process.env.NEXT_PUBLIC_API_URL}/auth` 
  : "http://localhost:5000/api/auth";

export default function Login({
  isOpen: isOpenProp,
  onClose,
  initialRegister = false,
  onLoginSuccess,
  showRegisterButton,
  isOpenControlled,
  onOpenChange,
  onCloseControlled,
}: LoginProps) {
  // Trạng thái mở modal: ưu tiên isOpenProp hoặc isOpenControlled
  const isControlled = isOpenProp !== undefined || isOpenControlled !== undefined;
  const [internalIsOpen, setInternalIsOpen] = useState<boolean>(false);
  const isOpen = isControlled ? Boolean(isOpenProp ?? isOpenControlled) : internalIsOpen;

  // Trạng thái chuyển đổi form: false = "Đăng nhập", true = "Đăng ký"
  const [isRegister, setIsRegister] = useState<boolean>(Boolean(initialRegister));

  // Trạng thái đang gửi yêu cầu lên Backend (Loading spinner)
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Trạng thái ẩn / hiện mật khẩu
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  // Khai báo các State lưu trữ dữ liệu người dùng nhập vào
  const [hoTen, setHoTen] = useState<string>("");
  const [emailInput, setEmailInput] = useState<string>("");
  const [soDienThoai, setSoDienThoai] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  // Thông báo lỗi hoặc thông báo thành công trực tiếp trên form
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  // Đồng bộ initialRegister mỗi khi mở Modal
  useEffect(() => {
    if (isOpen) {
      setIsRegister(Boolean(initialRegister));
      setErrorMessage("");
      setSuccessMessage("");
    }
  }, [isOpen, initialRegister]);

  // Lắng nghe phím ESC để đóng Modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCloseModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Hàm chuẩn hóa email và ghép nối với đuôi @gmail.com nếu người dùng chỉ nhập username
  const getFullEmail = (input: string): string => {
    const clean = (input || "").trim();
    if (!clean) return "";
    if (clean.includes("@")) {
      return clean;
    }
    return `${clean}@gmail.com`;
  };

  // Hàm mở Modal từ trigger nội bộ (nếu có dùng nút kích hoạt nội bộ)
  const handleOpenModal = (registerMode: boolean = false) => {
    setIsRegister(registerMode);
    setErrorMessage("");
    setSuccessMessage("");
    setInternalIsOpen(true);
    if (onOpenChange) onOpenChange(true);
  };

  // Hàm đóng Modal an toàn
  const handleCloseModal = () => {
    setInternalIsOpen(false);
    if (onClose) onClose();
    if (onCloseControlled) onCloseControlled();
    if (onOpenChange) onOpenChange(false);
    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(false);
  };

  // Hàm chuyển đổi qua lại giữa form Đăng nhập và Đăng ký
  const switchFormTab = (registerMode: boolean) => {
    setIsRegister(registerMode);
    setErrorMessage("");
    setSuccessMessage("");
    setPassword("");
    setConfirmPassword("");
  };

  // Xử lý gửi Form (Đăng ký / Đăng nhập trực tiếp với Cơ sở dữ liệu SQL Server)
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setErrorMessage("");
    setSuccessMessage("");

    const fullEmail = getFullEmail(emailInput);

    // 1. Kiểm tra Email
    if (!emailInput.trim()) {
      setErrorMessage("⚠️ Vui lòng nhập tên tài khoản hoặc địa chỉ Email.");
      return;
    }

    // 2. Kiểm tra Mật khẩu tối thiểu 6 ký tự
    if (password.length < 6) {
      setErrorMessage("⚠️ Mật khẩu bắt buộc phải có tối thiểu 6 ký tự.");
      return;
    }

    // 3. Xử lý ĐĂNG KÝ
    if (isRegister) {
      if (!hoTen.trim()) {
        setErrorMessage("⚠️ Vui lòng nhập họ và tên của bạn.");
        return;
      }

      if (password !== confirmPassword) {
        setErrorMessage("⚠️ Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại!");
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch(`${API_BASE_URL}/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ho_ten: hoTen.trim(),
            email: fullEmail,
            so_dien_thoai: soDienThoai.trim() || null,
            mat_khau: password,
            vai_tro: "KHACH_HANG",
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          setErrorMessage(data.message || "⚠️ Đăng ký thất bại. Email có thể đã được sử dụng!");
          setIsLoading(false);
          return;
        }

        // Đăng ký thành công -> Chuyển sang form Đăng nhập để người dùng đăng nhập
        setSuccessMessage(`🎉 Đăng ký thành công tài khoản "${fullEmail}"! Bạn có thể nhập mật khẩu để đăng nhập ngay.`);
        setIsLoading(false);
        setIsRegister(false);
        setPassword("");
        setConfirmPassword("");

      } catch (error) {
        console.error("Lỗi khi kết nối máy chủ SQL Server:", error);
        setErrorMessage("❌ Không thể kết nối đến máy chủ Backend SQL Server. Vui lòng kiểm tra lại kết nối!");
        setIsLoading(false);
      }
    } else {
      // 4. Xử lý ĐĂNG NHẬP
      setIsLoading(true);

      try {
        const response = await fetch(`${API_BASE_URL}/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: fullEmail,
            mat_khau: password,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          setErrorMessage(data.message || "⚠️ Đăng nhập thất bại. Vui lòng kiểm tra lại email hoặc mật khẩu!");
          setIsLoading(false);
          return;
        }

        // Lưu JWT Token và thông tin người dùng từ SQL Server vào LocalStorage
        if (data.token) {
          localStorage.setItem("auth_token", data.token);
        }

        const userFromDb: AuthUser = {
          id: data.data.id,
          ho_ten: data.data.ho_ten,
          email: data.data.email,
          so_dien_thoai: data.data.so_dien_thoai || "",
          vai_tro: data.data.vai_tro || "KHACH_HANG",
          anh_dai_dien: data.data.anh_dai_dien,
        };

        localStorage.setItem("auth_user", JSON.stringify(userFromDb));
        localStorage.setItem("soccer_current_user", JSON.stringify({
          id: userFromDb.id,
          hoTen: userFromDb.ho_ten,
          email: userFromDb.email,
          soDienThoai: userFromDb.so_dien_thoai,
          diaChi: "Hà Nội",
          avatarUrl: userFromDb.anh_dai_dien || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=250&auto=format&fit=crop",
        }));

        setIsLoading(false);

        // Kích hoạt callback thông báo đăng nhập thành công
        if (onLoginSuccess) {
          onLoginSuccess(userFromDb);
        }

        handleCloseModal();
      } catch (error) {
        console.error("Lỗi khi kết nối đăng nhập:", error);
        setErrorMessage("❌ Không thể kết nối tới máy chủ SQL Server. Vui lòng kiểm tra lại dịch vụ Backend!");
        setIsLoading(false);
      }
    }
  };

  return (
    <>
      {/* Nút bấm kích hoạt mở Modal nội bộ (chỉ render khi không điều khiển từ bên ngoài) */}
      {!isControlled && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="login-trigger-btn"
            onClick={() => handleOpenModal(false)}
          >
            Đăng nhập
          </button>
          {showRegisterButton !== false && (
            <button
              type="button"
              className="register-trigger-btn"
              onClick={() => handleOpenModal(true)}
            >
              Đăng ký
            </button>
          )}
        </div>
      )}

      {/* Khung Modal Popup & Lớp phủ mờ (Overlay) */}
      {isOpen && (
        <div
          className="login-modal-overlay"
          onMouseDown={(e) => {
            // Chỉ đóng khi click chuột trực tiếp vào nền mờ bên ngoài
            if (e.target === e.currentTarget) {
              handleCloseModal();
            }
          }}
          role="dialog"
          aria-modal="true"
        >
          {/* Khung nội dung Modal (Chặn nổi bọt mọi sự kiện chuột & phím) */}
          <div
            className="login-modal-container"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Nút X ở góc trên cùng để đóng popup */}
            <button
              type="button"
              className="login-close-btn"
              onClick={handleCloseModal}
              aria-label="Đóng popup"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header Modal */}
            <div className="login-header">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3 shadow-lg shadow-emerald-500/10">
                {isRegister ? <UserPlus className="w-6 h-6" /> : <LogIn className="w-6 h-6" />}
              </div>
              <h2 className="login-title">
                {isRegister ? "Đăng Ký Tài Khoản" : "Đăng Nhập"}
              </h2>
              <p className="login-subtitle">
                {isRegister
                  ? "Tạo tài khoản thành viên để đặt sân nhanh chóng & quản lý lịch đá"
                  : "Chào mừng bạn quay trở lại với Hệ thống Quản lý Sân Bóng"}
              </p>
            </div>

            {/* Tabs chuyển đổi giữa Đăng Nhập & Đăng Ký */}
            <div className="login-tab-container">
              <button
                type="button"
                className={`login-tab-btn ${!isRegister ? "active" : ""}`}
                onClick={() => switchFormTab(false)}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Đăng Nhập</span>
              </button>
              <button
                type="button"
                className={`login-tab-btn ${isRegister ? "active" : ""}`}
                onClick={() => switchFormTab(true)}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Đăng Ký</span>
              </button>
            </div>

            {/* Thông báo lỗi nếu có */}
            {errorMessage && (
              <div className="login-alert-error">
                {errorMessage}
              </div>
            )}

            {/* Thông báo thành công nếu có */}
            {successMessage && (
              <div className="login-alert-success">
                {successMessage}
              </div>
            )}

            {/* Form thao tác Đăng nhập / Đăng ký */}
            <form className="login-form" onSubmit={handleSubmit}>
              {/* Trường Họ tên (Chỉ hiển thị khi ở form Đăng ký) */}
              {isRegister && (
                <div className="login-input-group">
                  <label className="login-label" htmlFor="input-hoten">
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Họ và tên <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    id="input-hoten"
                    type="text"
                    className="login-input"
                    placeholder="Ví dụ: Nguyễn Văn An"
                    value={hoTen}
                    autoComplete="name"
                    onChange={(e) => {
                      setHoTen(e.target.value);
                      if (errorMessage) setErrorMessage("");
                    }}
                    required
                  />
                </div>
              )}

              {/* Trường Số điện thoại (Chỉ hiển thị khi Đăng ký) */}
              {isRegister && (
                <div className="login-input-group">
                  <label className="login-label" htmlFor="input-phone">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Số điện thoại</span>
                  </label>
                  <input
                    id="input-phone"
                    type="tel"
                    className="login-input"
                    placeholder="Ví dụ: 0912345678"
                    value={soDienThoai}
                    autoComplete="tel"
                    onChange={(e) => {
                      setSoDienThoai(e.target.value);
                      if (errorMessage) setErrorMessage("");
                    }}
                  />
                </div>
              )}

              {/* Trường Địa chỉ Email */}
              <div className="login-input-group">
                <label className="login-label" htmlFor="input-email">
                  <Mail className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Địa chỉ Email hoặc Tên tài khoản <span className="text-rose-500">*</span></span>
                </label>
                <div className="login-email-box">
                  <input
                    id="input-email"
                    type="text"
                    className="login-email-input"
                    placeholder="Nhập tên tài khoản hoặc email..."
                    value={emailInput}
                    autoComplete="email"
                    onChange={(e) => {
                      setEmailInput(e.target.value);
                      if (errorMessage) setErrorMessage("");
                    }}
                    required
                  />
                  {!emailInput.includes("@") && emailInput.trim().length > 0 && (
                    <span className="login-email-addon">@gmail.com</span>
                  )}
                </div>
              </div>

              {/* Trường Mật khẩu: Tối thiểu 6 ký tự */}
              <div className="login-input-group">
                <label className="login-label" htmlFor="input-password">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Mật khẩu (Tối thiểu 6 ký tự) <span className="text-rose-500">*</span></span>
                </label>
                <div className="login-password-box">
                  <input
                    id="input-password"
                    type={showPassword ? "text" : "password"}
                    className="login-password-input"
                    placeholder="Nhập mật khẩu..."
                    minLength={6}
                    value={password}
                    autoComplete={isRegister ? "new-password" : "current-password"}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage("");
                    }}
                    required
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    className="login-password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Ẩn hiện mật khẩu"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Trường Nhập lại mật khẩu (Chỉ hiển thị khi ở form Đăng ký) */}
              {isRegister && (
                <div className="login-input-group">
                  <label className="login-label" htmlFor="input-confirm-password">
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Nhập lại mật khẩu <span className="text-rose-500">*</span></span>
                  </label>
                  <div className="login-password-box">
                    <input
                      id="input-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      className="login-password-input"
                      placeholder="Xác nhận lại mật khẩu..."
                      minLength={6}
                      value={confirmPassword}
                      autoComplete="new-password"
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errorMessage) setErrorMessage("");
                      }}
                      required
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      className="login-password-toggle-btn"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label="Ẩn hiện xác nhận mật khẩu"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Nút Submit Form */}
              <button 
                type="submit" 
                className="login-submit-btn" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Đang xử lý kết nối SQL Server...</span>
                  </span>
                ) : isRegister ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <UserPlus className="w-4 h-4" />
                    <span>ĐĂNG KÝ TÀI KHOẢN NGAY</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-1.5">
                    <LogIn className="w-4 h-4" />
                    <span>ĐĂNG NHẬP HỆ THỐNG</span>
                  </span>
                )}
              </button>
            </form>

            {/* Chuyển đổi chân trang giữa Đăng nhập và Đăng ký */}
            <div className="login-footer">
              {!isRegister ? (
                <span>
                  Chưa có tài khoản thành viên?{" "}
                  <button
                    type="button"
                    className="login-toggle-link"
                    onClick={() => switchFormTab(true)}
                  >
                    Đăng ký ngay
                  </button>
                </span>
              ) : (
                <span>
                  Đã có tài khoản hệ thống?{" "}
                  <button
                    type="button"
                    className="login-toggle-link"
                    onClick={() => switchFormTab(false)}
                  >
                    Đăng nhập tại đây
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
