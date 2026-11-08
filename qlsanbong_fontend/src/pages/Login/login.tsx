"use client";

import React, { useState, useEffect } from "react";
import { Lock, Eye, EyeOff, X, LogIn, Mail, ShieldCheck, ArrowLeft } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";

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
  showRegisterButton = false,
  isOpenControlled,
  onOpenChange,
  onCloseControlled,
}: LoginProps) {
  // Trạng thái mở modal: ưu tiên isOpenProp hoặc isOpenControlled
  const isControlled = isOpenProp !== undefined || isOpenControlled !== undefined;
  const [internalIsOpen, setInternalIsOpen] = useState<boolean>(false);
  const isOpen = isControlled ? Boolean(isOpenProp ?? isOpenControlled) : internalIsOpen;

  // Trạng thái hiển thị Modal riêng biệt dành cho Quản trị viên / Nhân viên
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);

  // Trạng thái đang gửi yêu cầu lên Backend (Loading spinner)
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Thông báo lỗi hoặc thông báo thành công trực tiếp trên form
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  // Dữ liệu đăng nhập Quản trị viên
  const [emailInput, setEmailInput] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Reset trạng thái mỗi khi mở Modal
  useEffect(() => {
    if (isOpen) {
      setErrorMessage("");
      setSuccessMessage("");
      setIsAdminModalOpen(false);
      setEmailInput("");
      setPassword("");
    }
  }, [isOpen]);

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

  // Hàm mở Modal từ trigger nội bộ (nếu có dùng nút kích hoạt nội bộ)
  const handleOpenModal = () => {
    setErrorMessage("");
    setSuccessMessage("");
    setIsAdminModalOpen(false);
    setInternalIsOpen(true);
    if (onOpenChange) onOpenChange(true);
  };

  // Hàm đóng Modal an toàn
  const handleCloseModal = () => {
    setInternalIsOpen(false);
    setIsAdminModalOpen(false);
    if (onClose) onClose();
    if (onCloseControlled) onCloseControlled();
    if (onOpenChange) onOpenChange(false);
    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(false);
  };

  // =====================================================================
  // 1. XỬ LÝ ĐĂNG NHẬP KHÁCH HÀNG / TIẾP TỤC VỚI GOOGLE (OAUTH 2.0)
  // Sử dụng hook useGoogleLogin cho nút bấm tùy chỉnh siêu đẹp, đẳng cấp
  // =====================================================================
  const triggerGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      try {
        // 1. Lấy thông tin tài khoản Google của người dùng
        const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        });

        let userInfo: any = null;
        if (userInfoRes.ok) {
          userInfo = await userInfoRes.json();
        }

        // 2. Gửi Access Token và User Info lên Backend (sp_DangNhapGoogle)
        const response = await fetch(`${API_BASE_URL}/google`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            access_token: tokenResponse.access_token,
            userInfo: userInfo,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          setErrorMessage(data.message || "⚠️ Đăng nhập Google thất bại!");
          setIsLoading(false);
          return;
        }

        // 3. Xóa sạch phiên đăng nhập cũ
        localStorage.removeItem("auth_token");
        localStorage.removeItem("token");
        localStorage.removeItem("auth_user");
        localStorage.removeItem("soccer_current_user");

        // 4. Lưu JWT Token và User Info từ SQL Server
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
          diaChi: "Việt Nam",
          avatarUrl: userFromDb.anh_dai_dien || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=250&auto=format&fit=crop",
        }));

        setIsLoading(false);

        if (onLoginSuccess) {
          onLoginSuccess(userFromDb);
        }

        // Phát sự kiện toàn cục để Header / Navbar cập nhật thông tin ngay lập tức
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("storage"));
          window.dispatchEvent(new CustomEvent("auth-change", { detail: userFromDb }));
        }

        handleCloseModal();

      } catch (err: any) {
        console.error("Lỗi xác thực Google:", err);
        setErrorMessage("❌ Lỗi kết nối máy chủ khi đăng nhập Google. Vui lòng thử lại!");
        setIsLoading(false);
      }
    },
    onError: (err) => {
      console.error("Lỗi Google Login:", err);
      setErrorMessage("⚠️ Đăng nhập Google bị gián đoạn hoặc cửa sổ đã bị đóng!");
      setIsLoading(false);
    },
  });

  // =====================================================================
  // 2. XỬ LÝ ĐĂNG NHẬP MODAL QUẢN TRỊ VIÊN / NHÂN VIÊN (MẬT KHẨU SQL SERVER)
  // Thực thi sp_DangNhap trong SQL Server với Try...Catch & Transactions
  // =====================================================================
  const handleAdminSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setErrorMessage("");
    setSuccessMessage("");

    if (!emailInput.trim()) {
      setErrorMessage("⚠️ Vui lòng nhập tài khoản hoặc email Quản trị.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("⚠️ Mật khẩu bắt buộc phải có tối thiểu 6 ký tự.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: emailInput.trim(),
          mat_khau: password,
          chi_quan_tri: true,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMessage(data.message || "Thông tin đăng nhập không hợp lệ");
        setIsLoading(false);
        return;
      }

      // Kiểm tra chặn tài khoản Khách hàng ở Cổng Quản trị
      const userRoleUpper = (data.data?.vai_tro || data.data?.TenVaiTro || "").toUpperCase();
      if (userRoleUpper !== "ADMIN" && userRoleUpper !== "QUAN_TRI" && userRoleUpper !== "NHAN_VIEN") {
        setErrorMessage("Thông tin đăng nhập không hợp lệ");
        setIsLoading(false);
        return;
      }

      // Xóa phiên đăng nhập cũ
      localStorage.removeItem("auth_token");
      localStorage.removeItem("token");
      localStorage.removeItem("auth_user");
      localStorage.removeItem("soccer_current_user");

      // Lưu JWT Token và User Info
      if (data.token) {
        localStorage.setItem("auth_token", data.token);
      }

      const userFromDb: AuthUser = {
        id: data.data.id,
        ho_ten: data.data.ho_ten,
        email: data.data.email,
        so_dien_thoai: data.data.so_dien_thoai || "",
        vai_tro: data.data.vai_tro || "QUAN_TRI",
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

      if (onLoginSuccess) {
        onLoginSuccess(userFromDb);
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new CustomEvent("auth-change", { detail: userFromDb }));
      }

      handleCloseModal();
    } catch (error) {
      console.error("Lỗi khi kết nối đăng nhập:", error);
      setErrorMessage("❌ Không thể kết nối tới máy chủ SQL Server. Vui lòng kiểm tra lại Backend!");
      setIsLoading(false);
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
            onClick={handleOpenModal}
          >
            Đăng nhập
          </button>
        </div>
      )}

      {/* Lớp phủ mờ toàn màn hình (Overlay) khi một trong các Modal đang mở */}
      {isOpen && (
        <div
          className="login-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseModal();
            }
          }}
          role="dialog"
          aria-modal="true"
        >
          {/* ========================================================================= */}
          {/* CASE 1: MODAL ĐĂNG NHẬP DÀNH RIÊNG CHO QUẢN TRỊ VIÊN & NHÂN VIÊN          */}
          {/* ========================================================================= */}
          {isAdminModalOpen ? (
            <div
              className="admin-modal-container max-w-[440px]"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Nút X đóng popup */}
              <button
                type="button"
                className="login-close-btn"
                onClick={handleCloseModal}
                aria-label="Đóng popup quản trị"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Header Modal Quản Trị */}
              <div className="login-header">
                <div>
                  <span className="admin-header-badge">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    CỔNG QUẢN TRỊ HỆ THỐNG
                  </span>
                </div>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#274F9D]/30 to-[#E0B341]/25 border border-[#E0B341]/40 text-[#E0B341] mb-2 shadow-lg shadow-[#E0B341]/20">
                  <Lock className="w-6 h-6 text-[#E0B341]" />
                </div>
                <h2 className="login-title text-white">Đăng Nhập Quản Trị</h2>
                <p className="login-subtitle">
                  Dành riêng cho Ban Quản trị & Nhân viên vận hành Sport247
                </p>
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

              {/* Form Đăng Nhập Quản Trị */}
              <form onSubmit={handleAdminSubmit} className="flex flex-col gap-3.5 mt-2">
                <div className="login-input-group">
                  <label className="login-label" htmlFor="admin-email-input">
                    <Mail className="w-3.5 h-3.5 text-[#5B90DD]" />
                    <span>Tài khoản / Email Quản trị <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    id="admin-email-input"
                    type="text"
                    className="login-input"
                    placeholder="admin@gmail.com"
                    value={emailInput}
                    onChange={(e) => {
                      setEmailInput(e.target.value);
                      if (errorMessage) setErrorMessage("");
                    }}
                    required
                  />
                </div>

                <div className="login-input-group">
                  <label className="login-label" htmlFor="admin-password-input">
                    <Lock className="w-3.5 h-3.5 text-[#5B90DD]" />
                    <span>Mật khẩu hệ thống <span className="text-rose-500">*</span></span>
                  </label>
                  <div className="login-password-box">
                    <input
                      id="admin-password-input"
                      type={showPassword ? "text" : "password"}
                      className="login-password-input"
                      placeholder="Nhập mật khẩu quản trị..."
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errorMessage) setErrorMessage("");
                      }}
                      required
                    />
                    <button
                      type="button"
                      className="login-password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Ẩn hiện mật khẩu"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="admin-submit-btn !mt-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang xác thực hệ thống...</span>
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#E0B341]" />
                      <span>ĐĂNG NHẬP HỆ THỐNG QUẢN TRỊ</span>
                    </span>
                  )}
                </button>
              </form>

              {/* Nút Quay Lại Modal Đăng Nhập Khách Hàng */}
              <div className="mt-5 pt-3 border-t border-slate-800/80 flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdminModalOpen(false);
                    setErrorMessage("");
                    setSuccessMessage("");
                  }}
                  className="admin-back-btn"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Quay lại đăng nhập Khách hàng</span>
                </button>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* CASE 2: MODAL ĐĂNG NHẬP CHÍNH DÀNH CHO KHÁCH HÀNG (GOOGLE 1-CHẠM)         */
            /* ========================================================================= */
            <div
              className="login-modal-container max-w-[440px]"
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

              {/* Header Modal Khách Hàng */}
              <div className="login-header">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#274F9D]/20 text-[#5B90DD] border border-[#274F9D]/35 mb-3 shadow-lg shadow-[#274F9D]/15">
                  <LogIn className="w-6 h-6 text-[#5B90DD]" />
                </div>
                <h2 className="login-title">Đăng Nhập</h2>
                <p className="login-subtitle">
                  Chào mừng bạn quay trở lại với Hệ thống Thể Thao Sport247
                </p>
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

              {/* ========================================================= */}
              {/* NÚT TIẾP TỤC VỚI GOOGLE THIẾT KẾ MỚI SANG TRỌNG & NỔI BẬT */}
              {/* ========================================================= */}
              <div className="w-full flex flex-col items-center mt-2 mb-1">
                <button
                  type="button"
                  onClick={() => triggerGoogleLogin()}
                  disabled={isLoading}
                  className="google-luxury-button"
                  title="Đăng nhập 1 chạm an toàn với tài khoản Google"
                >
                  {/* Official 4-color Google SVG Icon */}
                  <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.88c2.27-2.09 3.665-5.17 3.665-9.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.1C3.27 21.43 7.33 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.32c-.25-.72-.38-1.49-.38-2.32s.13-1.6.38-2.32V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.1z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.27 2.57 1.25 6.58l4.03 3.1c.95-2.83 3.6-4.93 6.72-4.93z"
                      />
                    </svg>
                  </div>

                  <span className="text-[15px] font-bold tracking-tight text-slate-800">
                    {isLoading ? "Đang xác thực Google..." : "Tiếp tục với Google"}
                  </span>
                </button>
              </div>

              {/* ========================================================= */}
              {/* LIÊN KẾT CHUYỂN SANG MODAL ĐĂNG NHẬP QUẢN TRỊ VIÊN        */}
              {/* ========================================================= */}
              <div className="mt-5 pt-3.5 flex flex-col items-center border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdminModalOpen(true);
                    setErrorMessage("");
                    setSuccessMessage("");
                  }}
                  className="text-[12px] text-slate-400 hover:text-[#5B90DD] flex items-center gap-1.5 transition-colors py-1 cursor-pointer font-medium group"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#5B90DD] transition-colors" />
                  <span>Đăng nhập dành cho Quản trị viên / Nhân viên</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
