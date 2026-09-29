"use client";

import React, { useState } from "react";

// Định nghĩa kiểu dữ liệu người dùng khi xác thực thành công
export interface AuthUser {
  id?: number;
  ho_ten: string;
  email: string;
  so_dien_thoai?: string;
  vai_tro?: string;
  anh_dai_dien?: string;
}

interface LoginProps {
  onLoginSuccess?: (userData: AuthUser) => void;
}

// Địa chỉ API Backend kết nối trực tiếp với SQL Server
const API_BASE_URL = "http://localhost:5000/api/auth";

export default function Login({ onLoginSuccess }: LoginProps = {}) {
  // Trạng thái đóng / mở Modal Popup
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // Trạng thái chuyển đổi form: false = "Đăng nhập", true = "Đăng ký"
  const [isRegister, setIsRegister] = useState<boolean>(false);

  // Trạng thái đang gửi yêu cầu lên Backend (Loading spinner)
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Khai báo các State lưu trữ dữ liệu người dùng nhập vào
  const [hoTen, setHoTen] = useState<string>("");
  // Tên tài khoản email (Phần trước đuôi @gmail.com)
  const [emailUsername, setEmailUsername] = useState<string>("");
  const [soDienThoai, setSoDienThoai] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  // Thông báo lỗi hoặc thông báo thành công trực tiếp trên form
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  // Hàm chuẩn hóa email và ghép nối với đuôi @gmail.com cố định
  const getFullEmail = (username: string): string => {
    let clean = username.trim().toLowerCase();
    // Nếu người dùng lỡ gõ hoặc dán cả chuỗi có chứa đuôi @gmail.com thì tách ra
    if (clean.includes("@")) {
      clean = clean.split("@")[0];
    }
    return clean ? `${clean}@gmail.com` : "";
  };

  // Hàm mở Modal
  const handleOpenModal = () => {
    setIsRegister(false);
    setErrorMessage("");
    setSuccessMessage("");
    setIsOpen(true);
  };

  // Hàm đóng Modal (Xóa sạch toàn bộ dữ liệu đã nhập)
  const handleCloseModal = () => {
    setIsOpen(false);
    setIsRegister(false);
    setHoTen("");
    setEmailUsername("");
    setSoDienThoai("");
    setPassword("");
    setConfirmPassword("");
    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(false);
  };

  // Hàm chuyển đổi qua lại giữa form Đăng nhập và Đăng ký
  const toggleForm = () => {
    setIsRegister(!isRegister);
    setErrorMessage("");
    setSuccessMessage("");
    setPassword("");
    setConfirmPassword("");
  };

  // Xử lý gửi Form (Đăng ký / Đăng nhập trực tiếp với Cơ sở dữ liệu SQL Server)
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const fullEmail = getFullEmail(emailUsername);

    // =========================================================================
    // 1. KIỂM TRA DỮ LIỆU ĐẦU VÀO (VALIDATION)
    // =========================================================================
    if (!emailUsername.trim()) {
      setErrorMessage("⚠️ Vui lòng nhập tên tài khoản Email.");
      return;
    }

    // Yêu cầu: Đăng ký / Đăng nhập mật khẩu tối thiểu 6 ký tự
    if (password.length < 6) {
      setErrorMessage("⚠️ Mật khẩu bắt buộc phải có tối thiểu 6 ký tự.");
      return;
    }

    // =========================================================================
    // 2. XỬ LÝ ĐĂNG KÝ TÀI KHOẢN MỚI (LƯU TRỰC TIẾP VÀO CSDL SQL SERVER)
    // =========================================================================
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
        // Gửi Request POST lên API Backend Express -> Thực thi Stored Procedure sp_ThemNguoiDung trong SQL Server
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
          setErrorMessage(data.message || "⚠️ Đăng ký thất bại. Vui lòng thử lại!");
          setIsLoading(false);
          return;
        }

        // Đăng ký thành công vào SQL Server
        setSuccessMessage(`🎉 Đăng ký tài khoản thành công cho: ${hoTen.trim()}! Vui lòng nhập mật khẩu để đăng nhập.`);
        setIsLoading(false);

        // Tự động chuyển sang form Đăng nhập sau 1.2s và giữ lại email vừa đăng ký
        setTimeout(() => {
          setIsRegister(false);
          setPassword("");
          setConfirmPassword("");
          setSuccessMessage("");
        }, 1200);

      } catch (error) {
        console.error("Lỗi khi kết nối máy chủ SQL Server:", error);
        setErrorMessage("❌ Không thể kết nối đến máy chủ Backend SQL Server. Vui lòng kiểm tra lại kết nối mạng hoặc server!");
        setIsLoading(false);
      }
    } else {
      // =========================================================================
      // 3. XỬ LÝ ĐĂNG NHẬP TÀI KHOẢN (XÁC THỰC QUA CSDL SQL SERVER)
      // =========================================================================
      setIsLoading(true);

      try {
        // Gửi Request POST lên API Backend Express -> Thực thi Stored Procedure sp_DangNhap trong SQL Server
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

        // Kích hoạt callback thông báo đăng nhập thành công cho Component cha
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
      {/* Nút bấm Đăng nhập hiển thị trên thanh Header Navbar */}
      <button
        type="button"
        className="login-trigger-btn"
        onClick={handleOpenModal}
      >
        Đăng nhập
      </button>

      {/* Khung Modal Popup & Lớp phủ mờ (Overlay) */}
      {isOpen && (
        <div
          className="login-modal-overlay"
          onClick={handleCloseModal}
          role="dialog"
          aria-modal="true"
        >
          {/* Khung nội dung Modal (Chặn nổi bọt sự kiện click) */}
          <div
            className="login-modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Nút X ở góc trên cùng để đóng popup */}
            <button
              type="button"
              className="login-close-btn"
              onClick={handleCloseModal}
              aria-label="Đóng popup"
            >
              ✕
            </button>

            {/* Header Modal */}
            <div className="login-header">
              <h2 className="login-title">
                {isRegister ? "Đăng Ký Tài Khoản" : "Đăng Nhập"}
              </h2>
              <p className="login-subtitle">
                {isRegister
                  ? "Tạo tài khoản mới trực tiếp vào CSDL để đặt sân nhanh chóng"
                  : "Chào mừng bạn quay trở lại với hệ thống"}
              </p>
            </div>

            {/* Thông báo lỗi nếu có */}
            {errorMessage && (
              <div
                style={{
                  backgroundColor: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.4)",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  marginBottom: "16px",
                  color: "#fca5a5",
                  fontSize: "13px",
                  lineHeight: "1.4",
                  textAlign: "left",
                }}
              >
                {errorMessage}
              </div>
            )}

            {/* Thông báo thành công nếu có */}
            {successMessage && (
              <div
                style={{
                  backgroundColor: "rgba(16, 185, 129, 0.15)",
                  border: "1px solid rgba(16, 185, 129, 0.4)",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  marginBottom: "16px",
                  color: "#6ee7b7",
                  fontSize: "13px",
                  lineHeight: "1.4",
                  textAlign: "left",
                }}
              >
                {successMessage}
              </div>
            )}

            {/* Form thao tác Đăng nhập / Đăng ký */}
            <form className="login-form" onSubmit={handleSubmit}>
              {/* Trường Họ tên (Chỉ hiển thị khi ở form Đăng ký) */}
              {isRegister && (
                <div className="login-input-group">
                  <label className="login-label" htmlFor="input-hoten">
                    Họ và tên <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    id="input-hoten"
                    type="text"
                    className="login-input"
                    placeholder="Nhập họ và tên của bạn"
                    value={hoTen}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setHoTen(e.target.value);
                      if (errorMessage) setErrorMessage("");
                    }}
                    required
                  />
                </div>
              )}

              {/* Trường Số điện thoại (Tùy chọn khi Đăng ký) */}
              {isRegister && (
                <div className="login-input-group">
                  <label className="login-label" htmlFor="input-phone">
                    Số điện thoại
                  </label>
                  <input
                    id="input-phone"
                    type="tel"
                    className="login-input"
                    placeholder="Nhập số điện thoại (ví dụ: 0912345678)"
                    value={soDienThoai}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setSoDienThoai(e.target.value);
                      if (errorMessage) setErrorMessage("");
                    }}
                  />
                </div>
              )}

              {/* Trường Địa chỉ Email với đuôi sẵn @gmail.com cố định */}
              <div className="login-input-group">
                <label className="login-label" htmlFor="input-email">
                  Địa chỉ Email <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <div className="login-email-box">
                  <input
                    id="input-email"
                    type="text"
                    className="login-email-input"
                    placeholder="Nhập tên tài khoản"
                    value={emailUsername}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      let val = e.target.value;
                      // Nếu người dùng paste email đầy đủ dạng name@gmail.com -> tách lấy phần username
                      if (val.includes("@")) {
                        val = val.split("@")[0];
                      }
                      setEmailUsername(val.trim());
                      if (errorMessage) setErrorMessage("");
                    }}
                    required
                  />
                  {/* Đuôi email @gmail.com hiển thị cố định sẵn cho người dùng */}
                  <span className="login-email-addon">@gmail.com</span>
                </div>
              </div>

              {/* Trường Mật khẩu: Tối thiểu 6 ký tự */}
              <div className="login-input-group">
                <label className="login-label" htmlFor="input-password">
                  Mật khẩu (Tối thiểu 6 ký tự) <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  id="input-password"
                  type="password"
                  className="login-input"
                  placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                  minLength={6}
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage("");
                  }}
                  required
                />
              </div>

              {/* Trường Nhập lại mật khẩu (Chỉ hiển thị khi ở form Đăng ký) */}
              {isRegister && (
                <div className="login-input-group">
                  <label className="login-label" htmlFor="input-confirm-password">
                    Nhập lại mật khẩu <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    id="input-confirm-password"
                    type="password"
                    className="login-input"
                    placeholder="Nhập lại mật khẩu trên"
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setConfirmPassword(e.target.value);
                      if (errorMessage) setErrorMessage("");
                    }}
                    required
                  />
                </div>
              )}

              {/* Nút Submit Form */}
              <button 
                type="submit" 
                className="login-submit-btn" 
                disabled={isLoading}
                style={{ opacity: isLoading ? 0.7 : 1, cursor: isLoading ? "not-allowed" : "pointer" }}
              >
                {isLoading ? "Đang xử lý..." : isRegister ? "Đăng Ký Tài Khoản" : "Đăng Nhập"}
              </button>
            </form>

            {/* Chuyển đổi giữa Đăng nhập và Đăng ký */}
            <div className="login-footer">
              {!isRegister ? (
                <span>
                  Chưa có tài khoản?
                  <button
                    type="button"
                    className="login-toggle-link"
                    onClick={toggleForm}
                  >
                    Đăng ký ngay
                  </button>
                </span>
              ) : (
                <span>
                  Đã có tài khoản?
                  <button
                    type="button"
                    className="login-toggle-link"
                    onClick={toggleForm}
                  >
                    Đăng nhập
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
