"use client";

import React, { useState, useEffect } from "react";

interface UserAccount {
  hoTen: string;
  email: string;
  password: string;
}

interface LoginProps {
  onLoginSuccess?: (userData: { email: string; hoTen?: string }) => void;
}

// Danh sách tài khoản mẫu ban đầu (Mật khẩu tối thiểu 10 ký tự)
const DEFAULT_USERS: UserAccount[] = [
  {
    hoTen: "Nguyễn Văn Đạt",
    email: "vandat.soccer@gmail.com",
    password: "1234567890",
  },
  {
    hoTen: "Quản Trị Viên",
    email: "admin@gmail.com",
    password: "1234567890",
  },
];

export default function Login({ onLoginSuccess }: LoginProps = {}) {
  // Trạng thái đóng / mở Modal Popup
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // Trạng thái chuyển đổi form: false = "Đăng nhập", true = "Đăng ký"
  const [isRegister, setIsRegister] = useState<boolean>(false);

  // Danh sách tài khoản đã đăng ký (Được đồng bộ với LocalStorage)
  const [userList, setUserList] = useState<UserAccount[]>(DEFAULT_USERS);

  // Khai báo các State lưu trữ dữ liệu người dùng nhập vào
  const [hoTen, setHoTen] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  // Thông báo lỗi trực tiếp trên form (nếu có)
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Load danh sách người dùng đã đăng ký từ localStorage khi mở ứng dụng
  useEffect(() => {
    try {
      const savedUsers = localStorage.getItem("soccer_registered_users");
      if (savedUsers) {
        const parsed: UserAccount[] = JSON.parse(savedUsers);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setUserList(parsed);
          return;
        }
      }
      // Lưu danh sách mặc định lần đầu nếu chưa có
      localStorage.setItem("soccer_registered_users", JSON.stringify(DEFAULT_USERS));
    } catch (err) {
      console.error("Lỗi khi đọc danh sách tài khoản:", err);
    }
  }, []);

  // Hàm kiểm tra Email có đuôi @gmail.com hợp lệ
  const isValidGmail = (mail: string): boolean => {
    const trimmed = mail.toLowerCase().trim();
    return /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(trimmed);
  };

  // Hàm mở Modal
  const handleOpenModal = () => {
    setIsRegister(false);
    setErrorMessage("");
    setIsOpen(true);
  };

  // Hàm đóng Modal (Xóa sạch toàn bộ dữ liệu đã nhập)
  const handleCloseModal = () => {
    setIsOpen(false);
    setIsRegister(false);
    setHoTen("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setErrorMessage("");
  };

  // Hàm chuyển đổi qua lại giữa form Đăng nhập và Đăng ký
  const toggleForm = () => {
    setIsRegister(!isRegister);
    setErrorMessage("");
    // Reset mật khẩu khi chuyển đổi
    setPassword("");
    setConfirmPassword("");
  };

  // Xử lý gửi Form (Submit)
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");

    const normalizedEmail = email.toLowerCase().trim();

    // =========================================================================
    // 1. KIỂM TRA ĐIỀU KIỆN CHUNG: EMAIL ĐUÔI @gmail.com & MẬT KHẨU >= 10 KÝ TỰ
    // =========================================================================
    if (!isValidGmail(normalizedEmail)) {
      setErrorMessage("⚠️ Email bắt buộc phải có định dạng đuôi @gmail.com (Ví dụ: name@gmail.com).");
      return;
    }

    if (password.length < 10) {
      setErrorMessage("⚠️ Mật khẩu phải có tối thiểu 10 ký tự.");
      return;
    }

    // =========================================================================
    // 2. XỬ LÝ LOGIC ĐĂNG KÝ TÀI KHOẢN MỚI
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

      // Kiểm tra xem email này đã tồn tại trong danh sách hay chưa
      const isExisted = userList.some(
        (u) => u.email.toLowerCase() === normalizedEmail
      );

      if (isExisted) {
        setErrorMessage("⚠️ Email này đã được đăng ký! Vui lòng chuyển sang Đăng nhập.");
        return;
      }

      // Tạo tài khoản mới và lưu vào danh sách
      const newUser: UserAccount = {
        hoTen: hoTen.trim(),
        email: normalizedEmail,
        password: password,
      };

      const updatedUsers = [...userList, newUser];
      setUserList(updatedUsers);

      try {
        localStorage.setItem("soccer_registered_users", JSON.stringify(updatedUsers));
      } catch (err) {
        console.error("Lỗi khi lưu tài khoản:", err);
      }

      alert(`🎉 Đăng ký tài khoản thành công cho: ${hoTen}! Vui lòng nhập mật khẩu để đăng nhập.`);
      
      // Chuyển sang form đăng nhập
      setIsRegister(false);
      setPassword("");
      setConfirmPassword("");
    } else {
      // =========================================================================
      // 3. XỬ LÝ LOGIC KIỂM TRA ĐĂNG NHẬP
      // =========================================================================
      
      // Tìm tài khoản theo email
      const matchedUser = userList.find(
        (u) => u.email.toLowerCase() === normalizedEmail
      );

      // Nếu KHÔNG tìm thấy tài khoản -> Chặn đăng nhập
      if (!matchedUser) {
        setErrorMessage(
          "⚠️ Tài khoản không tồn tại! Vui lòng bấm 'Đăng ký ngay' ở bên dưới để tạo tài khoản mới."
        );
        return;
      }

      // Nếu tài khoản tồn tại nhưng SAI mật khẩu -> Báo lỗi sai mật khẩu
      if (matchedUser.password !== password) {
        setErrorMessage("⚠️ Mật khẩu không chính xác. Vui lòng kiểm tra lại!");
        return;
      }

      // Đăng nhập thành công -> Cập nhật trạng thái người dùng lên trang chủ
      if (onLoginSuccess) {
        onLoginSuccess({
          email: matchedUser.email,
          hoTen: matchedUser.hoTen,
        });
      }

      handleCloseModal(); // Đóng modal
    }
  };

  return (
    <>
      {/* Nút bấm Đăng nhập hiển thị trên trang */}
      <button
        type="button"
        className="login-trigger-btn"
        onClick={handleOpenModal}
      >
        Đăng nhập
      </button>

      {/* Khung Modal & Lớp phủ mờ (Overlay) */}
      {isOpen && (
        <div
          className="login-modal-overlay"
          onClick={handleCloseModal}
          role="dialog"
          aria-modal="true"
        >
          {/* Khung nội dung Modal (Chặn nổi bọt sự kiện click để không bị đóng khi click vào bên trong) */}
          <div
            className="login-modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Nút X ở góc trên cùng để đóng */}
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
                  ? "Tạo tài khoản mới để đặt sân nhanh chóng và tiện lợi"
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

            {/* Form thao tác */}
            <form className="login-form" onSubmit={handleSubmit}>
              {/* Trường Họ tên (Chỉ hiển thị khi ở form Đăng ký) */}
              {isRegister && (
                <div className="login-input-group">
                  <label className="login-label" htmlFor="input-hoten">
                    Họ và tên
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

              {/* Trường Email */}
              <div className="login-input-group">
                <label className="login-label" htmlFor="input-email">
                  Địa chỉ Email (@gmail.com)
                </label>
                <input
                  id="input-email"
                  type="email"
                  className="login-input"
                  placeholder="name@gmail.com"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage("");
                  }}
                  required
                />
              </div>

              {/* Trường Mật khẩu */}
              <div className="login-input-group">
                <label className="login-label" htmlFor="input-password">
                  Mật khẩu (Tối thiểu 10 ký tự)
                </label>
                <input
                  id="input-password"
                  type="password"
                  className="login-input"
                  placeholder="Nhập mật khẩu (tối thiểu 10 ký tự)"
                  minLength={10}
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
                    Nhập lại mật khẩu
                  </label>
                  <input
                    id="input-confirm-password"
                    type="password"
                    className="login-input"
                    placeholder="Nhập lại mật khẩu trên"
                    minLength={10}
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
              <button type="submit" className="login-submit-btn">
                {isRegister ? "Đăng Ký" : "Đăng Nhập"}
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
