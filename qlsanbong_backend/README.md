# ⚽ Backend Quản Lý Sân Bóng Đá (Node.js Express & SQL Server)

Dự án Backend RESTful API hoàn chỉnh phục vụ cho Hệ thống Quản lý và Đặt sân bóng đá, được xây dựng theo kiến trúc MVC tinh gọn, bảo mật JWT, mã hóa mật khẩu Bcrypt và **100% các thao tác dữ liệu được thực thi thông qua Stored Procedure trong SQL Server**.

---

## 📁 Cấu trúc thư mục dự án

```
qlsanbong_backend/
├── src/
│   ├── config/
│   │   └── db.js                  # Cấu hình kết nối SQL Server qua mssql ConnectionPool
│   ├── middlewares/
│   │   └── authMiddleware.js      # Middleware xác thực JWT và phân quyền vai trò (Role-based)
│   ├── controllers/
│   │   ├── authController.js      # Xử lý Đăng ký, Đăng nhập, Profile (sp_ThemNguoiDung, sp_DangNhap)
│   │   ├── datSanController.js    # Đặt sân, Hủy đơn hoàn cọc, Lịch sân (sp_DatSan, sp_HuyDonVaHoanCoc, sp_LayLichSan)
│   │   ├── dichVuController.js    # Bán dịch vụ, Nhập kho (sp_ThemDichVu, sp_NhapKhoDichVu)
│   │   ├── thanhToanController.js # Thanh toán đặt cọc / trả hết (sp_ThanhToanDon)
│   │   └── baoCaoController.js    # Báo cáo doanh thu (sp_BaoCaoDoanhThu)
│   └── routes/
│       ├── authRoutes.js          # /api/auth
│       ├── datSanRoutes.js        # /api/dat-san
│       ├── dichVuRoutes.js        # /api/dich-vu
│       ├── thanhToanRoutes.js     # /api/thanh-toan
│       └── baoCaoRoutes.js        # /api/bao-cao
├── .env                           # Biến môi trường hệ thống
├── package.json                   # Khai báo dependencies và scripts
└── server.js                      # Điểm khởi chạy Express Server
```

---

## 🛠️ Yêu cầu & Cài đặt

### 1. Chuẩn bị Cơ sở dữ liệu SQL Server
1. Mở **SQL Server Management Studio (SSMS)**.
2. Thực thi file [`QuanLySanBong.sql`](file:///d:/BaoCaoTotNghiep/QuanLySanBong.sql) để tạo cơ sở dữ liệu và các bảng.
3. Thực thi file [`ThuTuc.sql`](file:///d:/BaoCaoTotNghiep/ThuTuc.sql) để tạo toàn bộ các Stored Procedure nghiệp vụ.

### 2. Cài đặt thư viện Backend
Mở Terminal tại thư mục `qlsanbong_backend` và chạy lệnh:
```bash
npm install
```

### 3. Cấu hình file `.env`
Kiểm tra và cập nhật thông tin đăng nhập SQL Server (Tài khoản `sa`) trong file `.env`:
```env
PORT=5000
DB_USER=sa
DB_PASSWORD=123
DB_SERVER=localhost
DB_DATABASE=QuanLySanTheThao
DB_PORT=1433
JWT_SECRET=super_secret_jwt_key_qlsanbong_2026_!@#$$
JWT_EXPIRES_IN=7d
```

### 4. Khởi chạy Server
- Chế độ phát triển (Tự động tải lại với Nodemon):
```bash
npm run dev
```
- Chế độ sản xuất:
```bash
npm start
```

---

## 📖 Danh sách API Endpoints

### 1. Xác thực & Tài khoản (`/api/auth`)
| Method | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Đăng ký tài khoản (`sp_ThemNguoiDung`) |
| `POST` | `/api/auth/login` | Public | Đăng nhập lấy Token JWT (`sp_DangNhap`) |
| `GET` | `/api/auth/profile` | Bearer Token | Lấy thông tin cá nhân (`sp_LayThongTinNguoiDung`) |

### 2. Quản lý Đặt sân (`/api/dat-san`)
| Method | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| `GET` | `/api/dat-san/danh-sach-san` | Public | Lấy danh sách toàn bộ sân bóng (`sp_LayDanhSachSan`) |
| `GET` | `/api/dat-san/lich-san?ngay_da=YYYY-MM-DD` | Public | Xem lịch sân trong ngày (`sp_LayLichSan`) |
| `POST` | `/api/dat-san` | Bearer Token | Đặt sân bóng (`sp_DatSan`) |
| `POST` | `/api/dat-san/huy-don` | Bearer Token | Hủy đơn & tự động tính hoàn cọc (`sp_HuyDonVaHoanCoc`) |

### 3. Quản lý Dịch vụ & Kho (`/api/dich-vu`)
| Method | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| `GET` | `/api/dich-vu` | Public | Lấy danh sách các dịch vụ & tồn kho (`sp_LayDanhSachDichVu`) |
| `POST` | `/api/dich-vu/them-vao-don` | Bearer Token | Thêm dịch vụ vào đơn đặt sân (`sp_ThemDichVu`) |
| `POST` | `/api/dich-vu/nhap-kho` | ADMIN, NHAN_VIEN | Nhập kho dịch vụ (`sp_NhapKhoDichVu`) |

### 4. Thanh toán (`/api/thanh-toan`)
| Method | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| `POST` | `/api/thanh-toan` | Bearer Token | Thanh toán cọc / trả hết qua Tiền mặt, VNPay, Momo (`sp_ThanhToanDon`) |

### 5. Báo cáo & Thống kê (`/api/bao-cao`)
| Method | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| `GET` | `/api/bao-cao/doanh-thu?tu_ngay=YYYY-MM-DD&den_ngay=YYYY-MM-DD` | ADMIN, NHAN_VIEN | Báo cáo doanh thu chi tiết (`sp_BaoCaoDoanhThu`) |

---

## 🔒 Nguyên tắc lập trình đã đảm bảo
- **Không dùng `.query()`**: 100% gọi Stored Procedure qua `.input()` và `.execute()`.
- **An toàn bảo mật**: Mật khẩu được mã hóa một chiều qua `bcryptjs`. Token JWT có thời hạn và bảo vệ các routes nhạy cảm.
- **Bắt lỗi giao dịch SQL**: Sử dụng `TRY...CATCH` và `THROW` trong SQL Server, trả về chuẩn `{ success: false, message: "..." }`.
