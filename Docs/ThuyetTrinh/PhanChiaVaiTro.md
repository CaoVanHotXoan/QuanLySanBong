# BÁO CÁO THUYẾT TRÌNH: HỆ THỐNG XÁC THỰC & PHÂN QUYỀN TRUY CẬP THEO VAI TRÒ (RBAC: KHÁCH HÀNG, NHÂN VIÊN, QUẢN TRỊ VIÊN)

> **Hệ thống:** Quản Lý & Đặt Sân Bóng Đá Trực Tuyến Sport247 / Soccer247  
> **Sinh viên thực hiện:** Cao Văn Hột Xoàn (MSSV: 525000462) & Phạm Tiến Doanh (MSSV: 525000463)  
> **Khoa:** Công Nghệ Thông Tin - Đại Học Lạc Hồng (LHU)  

---

# PHẦN I: BẢN TÓM TẮT NGẮN GỌN (DÀNH CHO NÓI THUYẾT TRÌNH / HỌC THUỘC)

## 1. Mô Hình Phân Quyền Theo Vai Trò (RBAC - Role-Based Access Control)
Hệ thống Sport247 phân chia người dùng thành **3 cấp độ vai trò độc lập** được quản lý chặt chẽ từ tầng Cơ sở dữ liệu SQL Server đến Giao diện Frontend:

```
                      ┌────────────────────────────────────────┐
                      │    HỆ THỐNG PHÂN QUYỀN SPORT247        │
                      └───────────────────┬────────────────────┘
                                          │
            ┌─────────────────────────────┼─────────────────────────────┐
            ▼                             ▼                             ▼
┌───────────────────────┐   ┌───────────────────────────┐   ┌───────────────────────────┐
│   1. KHÁCH HÀNG       │   │    2. NHÂN VIÊN           │   │    3. QUẢN TRỊ VIÊN       │
│  (Role: KHACH_HANG)   │   │   (Role: NHAN_VIEN)       │   │     (Role: ADMIN)         │
│   (MaVaiTro = 3)      │   │     (MaVaiTro = 2)        │   │     (MaVaiTro = 1)        │
├───────────────────────┤   ├───────────────────────────┤   ├───────────────────────────┤
│ • Đặt sân trực tuyến  │   │ • Thừa hưởng quyền Khách  │   │ • Toàn quyền tối cao 100% │
│ • Thanh toán VietQR   │   │ • Trực ca quầy POS        │   │ • Quản trị sân & giá giờ  │
│ • Xem lịch sử đặt sân │   │ • Nhận sân / Trả sân      │   │ • Quản lý nhân viên & User│
│ • Cập nhật hồ sơ/pass │   │ • Bán dịch vụ (nước, áo)  │   │ • Báo cáo doanh thu & quỹ │
│ • Bị chặn vào Quản trị│   │ • Chốt hóa đơn thanh toán │   │ • Quản lý Banner & Tin tức│
└───────────────────────┘   └───────────────────────────┘   └───────────────────────────┘
```

---

## 2. Công Nghệ Nền Tảng Áp Dụng
+ **JSON Web Token (JWT) & HS256:** Ký mã hóa thông tin người dùng (`id, email, ho_ten, vai_tro`) với thời hạn 7 ngày, đóng gói an toàn trong chuỗi Token truyền qua Header HTTP (`Authorization: Bearer <token>`).
+ **Bcrypt.js (10 Salt Rounds):** Mã hóa băm mật khẩu một chiều không thể giải mã ngược, đảm bảo an toàn tài khoản tuyệt đối.
+ **Backend Security Middlewares (`verifyToken`, `authorizeRoles`):** Bộ lọc kiểm tra chữ ký số JWT và chặn đứng các yêu cầu truy cập API trái thẩm quyền với mã lỗi chuẩn `HTTP 401 Unauthorized` và `HTTP 403 Forbidden`.
+ **Frontend Dynamic Role Rendering & Route Guards:** Next.js tự động kiểm tra vai trò người dùng trong LocalStorage và xác thực chéo qua API `/auth/me`; tự động ẩn/hiện các nút chức năng tương ứng và chuyển hướng người dùng vi phạm quyền về trang chủ.
+ **T-SQL Stored Procedures (`sp_DangNhap`, `sp_ThemNguoiDung`, `sp_LayThongTinNguoiDung`):** 100% logic xác thực và gán vai trò được đóng gói trong SQL Server qua phép kết nối bảng `Nguoi_Dung LEFT JOIN Vai_Tro`.

---

## 3. Những File Xử Lý Code Cốt Lõi

+ **File 1: `qlsanbong_backend/src/controllers/authController.ts` (Backend Controller)**
  - Dòng 140 – 278: Hàm `dangNhap` (thực thi `sp_DangNhap`, đối soát mật khẩu Bcrypt, bóc tách `userRole = user.vai_tro || user.TenVaiTro`, ký JWT Token chứa trường `vai_tro`).
  - Dòng 30 – 100: Hàm `dangKy` (kiểm tra mã OTP qua `sp_KiemTraOTP`, mã hóa Bcrypt, gán mặc định vai trò `KHACH_HANG` qua `sp_ThemNguoiDung`).
  - Dòng 285 – 330: Hàm `layThongTinCaNhan` (API `/auth/me` & `/auth/profile` trích xuất thông tin người dùng và vai trò để Frontend xác thực chéo).

+ **File 2: `qlsanbong_backend/src/middlewares/authMiddleware.ts` (Tầng Bảo Vệ Backend)**
  - Dòng 17 – 50: Middleware `verifyToken` (giải mã token JWT từ Header `Authorization: Bearer`, gắn `decoded` vào `req.user`).
  - Dòng 56 – 66: Middleware `authorizeRoles(...roles)` (kiểm tra quyền hạn: `if (!roles.includes(req.user.vai_tro)) return 403 Forbidden`).

+ **File 3: `Data SQL server 2022/ThuTuc.sql` (Stored Procedures SQL Server)**
  - Dòng 81 – 129: `sp_DangNhap` (truy vấn `Nguoi_Dung nd LEFT JOIN Vai_Tro vt ON nd.MaVaiTro = vt.MaVaiTro`, trả về `MaVaiTro`, `TenVaiTro AS vai_tro`).
  - Dòng 27 – 78: `sp_ThemNguoiDung` (gán mặc định `MaVaiTro = 3` nếu không chỉ định vai trò đặc biệt).

+ **File 4: `qlsanbong_fontend/src/pages/index.tsx` (Trang Chủ & Menu Theo Vai Trò)**
  - Dòng 304 – 325: Khai báo cờ logic kiểm tra vai trò: `isUserAdmin` (Admin) và `isUserStaffOrAdmin` (Nhân viên hoặc Admin).
  - Dòng 1581 – 1660: Dropdown Menu tài khoản:
    * Nếu là **Khách Hàng**: Chỉ thấy "Thông tin tài khoản", "Lịch sử đặt sân", "Đăng xuất".
    * Nếu là **Nhân Viên**: Hiển thị thêm nút màu xanh ngọc **"⚡ Quản Lý Sân (Management System)"**.
    * Nếu là **Admin**: Hiển thị đầy đủ cả 2 nút: **"⚡ Quản Lý Sân (Management System)"** và **"🛡️ Trang Quản Trị (Dashboard)"**.

+ **File 5: `qlsanbong_fontend/src/pages/Dashboard.tsx` (Bảo Vệ Trang Quản Trị Admin)**
  - Dòng 769 – 782: Hàm `checkIsAdmin(user)` (kiểm tra vai trò `ADMIN` hoặc `MaVaiTro === 1`).
  - Dòng 785 – 872: Hàm `verifyAdminRole` (xác thực Token với `/auth/me`; nếu người dùng không phải ADMIN -> Lập tức kích hoạt `router.replace('/?login=true&requireAdmin=true')` đá văng về trang chủ và hiện thông báo lỗi đỏ).

---

## 4. Cách Hoạt Động Tóm Tắt Khi Người Dùng Đăng Nhập Đúng Vai Trò

1. **Bước 1 (Đăng nhập):** Người dùng nhập Email (hoặc Tên đăng nhập) và Mật khẩu tại Modal Đăng nhập.
2. **Bước 2 (Xác thực CSDL & Đóng gói JWT):** 
   - Backend gọi `sp_DangNhap`, kiểm tra mật khẩu bằng `bcrypt.compare`.
   - Bóc tách đúng vai trò từ bảng `Vai_Tro` (`KHACH_HANG`, `NHAN_VIEN` hoặc `ADMIN`).
   - Đóng gói JWT Token và trả về cho trình duyệt.
3. **Bước 3 (Phân nhánh điều hướng & Hiển thị giao diện):**
   - **Trường hợp A - Đăng nhập tài khoản Khách Hàng:** Trình duyệt lưu `vai_tro: "KHACH_HANG"`. Khách ở lại trang chủ, tự do chọn ô giờ trên ma trận lịch sân để đặt cọc. Không hề thấy các nút quản trị nội bộ.
   - **Trường hợp B - Đăng nhập tài khoản Nhân Viên:** Trình duyệt lưu `vai_tro: "NHAN_VIEN"`. Trên thanh menu xuất hiện nút đặc quyền **"⚡ Quản Lý Sân (Management System)"** dẫn thẳng vào hệ thống quầy POS tiếp nhận khách và in hóa đơn.
   - **Trường hợp C - Đăng nhập tài khoản Admin:** Trình duyệt lưu `vai_tro: "ADMIN"`. Xuất hiện đầy đủ cả 2 nút quản trị: **"🛡️ Trang Quản Trị (Dashboard)"** để cấu hình toàn bộ sân bóng/doanh thu và **"⚡ Quản Lý Sân"** để kiểm tra quầy thu ngân.
4. **Bước 4 (Bảo vệ đa tầng khi truy cập trái phép):** Nếu Khách hàng hoặc Nhân viên cố tình gõ thẳng đường dẫn `localhost:3000/Dashboard` trên thanh URL trình duyệt -> Router Guard lập tức phát hiện không đủ quyền, chặn đứng truy cập và chuyển hướng về trang chủ kèm cảnh báo đỏ.

---
---

# PHẦN II: BẢN CHI TIẾT ĐẦY ĐỦ (DÀNH CHO VẤN ĐÁP KỸ THUẬT & DẪN CHỨNG CODE CỤ THỂ)

## 1. Tổng Quan Kiến Trúc Phân Quyền RBAC (Role-Based Access Control)

### - Bảng CSDL Quan Hệ Quản Lý Vai Trò Trong SQL Server 2022:
Hệ thống thiết kế theo chuẩn phân rã chuẩn hóa dữ liệu 3NF với 2 bảng liên kết:
* **Bảng `Vai_Tro`:** Định nghĩa danh mục các vai trò trong hệ thống.
  - `MaVaiTro = 1`: `TenVaiTro = 'ADMIN'` (Quản trị viên toàn quyền).
  - `MaVaiTro = 2`: `TenVaiTro = 'NHAN_VIEN'` (Nhân viên trực quầy POS).
  - `MaVaiTro = 3`: `TenVaiTro = 'KHACH_HANG'` (Khách hàng đặt sân online).
* **Bảng `Nguoi_Dung`:** Lưu trữ hồ sơ người dùng với khóa ngoại `MaVaiTro` tham chiếu đến bảng `Vai_Tro`. Khi khách đăng ký mới qua web, CSDL tự động gán `DEFAULT 3` (`KHACH_HANG`).

```sql
-- Trích dẫn Data SQL server 2022/QuanLySanBong.sql (Dòng 52 - 69)
CREATE TABLE Vai_Tro (
    MaVaiTro INT IDENTITY(1,1) PRIMARY KEY,
    TenVaiTro NVARCHAR(50) UNIQUE NOT NULL,
    MoTa NVARCHAR(255) NULL
);

CREATE TABLE Nguoi_Dung (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ho_ten NVARCHAR(100) NULL,
    email VARCHAR(255) UNIQUE NULL,
    so_dien_thoai VARCHAR(20) NULL,
    mat_khau VARCHAR(255) NULL,
    anh_dai_dien VARCHAR(255) NULL,
    MaVaiTro INT NOT NULL DEFAULT 3,
    FOREIGN KEY (MaVaiTro) REFERENCES Vai_Tro(MaVaiTro) ON DELETE NO ACTION
);
```

---

## 2. Chi Tiết Kỹ Thuật 3 Nhóm Vai Trò Cốt Lõi

### A. Vai Trò 1: KHÁCH HÀNG (`KHACH_HANG` - `MaVaiTro = 3`)

#### 1. Quyền hạn và phạm vi hoạt động:
+ Được quyền xem thông tin giới thiệu trung tâm thể thao, bảng giá công khai, danh sách tin tức và gửi biểu mẫu liên hệ góp ý.
+ Được quyền theo dõi ma trận lịch sân thời gian thực (Real-time Matrix Grid) với các trạng thái màu trực quan (Xanh: Trống, Cam: Đang giữ chỗ, Đỏ: Đã đặt).
+ Click giữ chỗ các ô giờ trống, chọn tiện ích đi kèm (nước uống, áo bib) và thanh toán trực tuyến qua mã VietQR Napas 247 kết nối ngân hàng MB Bank (PayOS).
+ Truy cập trang Hồ sơ cá nhân (`/profile`) để cập nhật họ tên, đổi mật khẩu qua mã OTP Gmail hoặc xem trang Lịch sử đơn đặt sân (`/history`).
+ **Quy tắc bảo mật ngăn chặn:** Tuyệt đối không được cấp quyền xem các trang vận hành quầy POS (`/management-system`) và trang quản trị hệ thống (`/Dashboard`).

#### 2. Dẫn chứng code xử lý:
* **Đăng ký tài khoản tự động gán quyền Khách hàng:**  
  Trong file `qlsanbong_backend/src/controllers/authController.ts` (Dòng 80 – 86), khi gọi Stored Procedure `sp_ThemNguoiDung`:
  ```typescript
  await pool.request()
      .input('ho_ten', sql.NVarChar(100), ho_ten.trim())
      .input('email', sql.VarChar(255), normalizedEmail)
      .input('so_dien_thoai', sql.VarChar(15), so_dien_thoai || null)
      .input('mat_khau', sql.VarChar(255), hashedPassword)
      .input('vai_tro', sql.VarChar(20), vai_tro || 'KHACH_HANG')
      .execute('sp_ThemNguoiDung');
  ```
* **Giao diện Menu của Khách hàng trên Frontend:**  
  Trong file `qlsanbong_fontend/src/pages/index.tsx` (Dòng 1630 – 1660), do `isUserAdmin = false` và `isUserStaffOrAdmin = false`, người dùng Khách hàng chỉ thấy 3 mục cơ bản:
  - 👤 **Thông tin tài khoản** (`setIsProfileModalOpen(true)`)
  - 🕒 **Lịch sử đặt sân** (`router.push('/history')`)
  - 🚪 **Đăng xuất** (`handleLogout`)

---

### B. Vai Trò 2: NHÂN VIÊN TRỰC QUẦY POS (`NHAN_VIEN` - `MaVaiTro = 2`)

#### 1. Quyền hạn và phạm vi hoạt động:
+ Thừa hưởng toàn bộ các quyền của Khách hàng, đồng thời được cấp đặc quyền truy cập phân hệ **Hệ Thống Quản Lý Sân Bãi & Bán Hàng Tại Quầy POS (`/management-system`)**.
+ Được quyền theo dõi tình trạng thực tế của tất cả các sân trong ngày (Sân trống, Sân đang có khách đá, Sân sắp hết giờ).
+ Check-in cho khách vào sân khi khách đến quầy, đổi sân thi đấu linh hoạt khi khách yêu cầu.
+ Bán các mặt hàng dịch vụ tại chỗ: Nước ngọt, nước suối, cho thuê bóng thi đấu, áo bib.
+ Tính tiền thêm giờ tự động theo block phút, in hóa đơn thanh toán tiền mặt hoặc quét mã QR quầy.
+ Nhận thông báo Socket.IO tức thì mili-giây khi có khách hàng đặt sân từ Trang chủ để kịp chuẩn bị sân bãi.
+ **Quy tắc bảo mật ngăn chặn:** Không được cấp quyền truy cập vào trang Quản trị tối cao (`/Dashboard`) để chỉnh sửa cấu hình giá sân, xóa nhân viên khác, hoặc xem các báo cáo tài chính cốt lõi của chủ sân.

#### 2. Dẫn chứng code xử lý:
* **Định danh quyền Nhân viên trên Frontend:**  
  Trong file `qlsanbong_fontend/src/pages/index.tsx` (Dòng 316 – 324):
  ```typescript
  const isUserStaffOrAdmin = Boolean(
    currentUser && (
      isUserAdmin ||
      (currentUser.vai_tro || '').trim().toUpperCase() === 'NHAN_VIEN' ||
      (currentUser.vai_tro || '').trim().toUpperCase() === 'STAFF' ||
      (currentUser as any).MaVaiTro === 2
    )
  );
  ```
* **Kích hoạt nút Menu đặc quyền cho Nhân viên:**  
  Trong `index.tsx` (Dòng 1591 – 1608) & `HeaderNav.tsx` (Dòng 212 – 229), nút sau sẽ xuất hiện nổi bật với viền xanh ngọc:
  ```tsx
  {isUserStaffOrAdmin && (
    <a
      href="/management-system"
      onClick={(e) => {
        e.preventDefault();
        setUserDropdownOpen(false);
        router.push('/management-system');
      }}
      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-black rounded-xl transition-all text-emerald-700 bg-emerald-50 border border-emerald-300"
    >
      <LandPlot className="w-4 h-4 text-emerald-500 shrink-0" />
      <span>⚡ Quản Lý Sân (Management System)</span>
    </a>
  )}
  ```

---

### C. Vai Trò 3: QUẢN TRỊ VIÊN TỐI CAO (`ADMIN` - `MaVaiTro = 1`)

#### 1. Quyền hạn và phạm vi hoạt động:
+ Nắm giữ quyền hạn cao nhất trong toàn bộ hệ thống Sport247, có quyền truy cập vào cả 2 phân hệ: **Trang Quản Trị Hệ Thống (`/Dashboard`)** và **Quản Lý Quầy POS (`/management-system`)**.
+ **Quản lý sân bóng & danh mục loại sân:** Thêm sân mới, chỉnh sửa thông tin, tải ảnh sân bóng lên Cloudinary, đóng/mở bảo trì sân.
+ **Quản lý khung giờ & bảng giá linh hoạt:** Thiết lập giá theo khung giờ cao điểm (17h - 21h) hoặc ngày cuối tuần Thứ 7, Chủ Nhật.
+ **Quản trị người dùng & phân quyền:** Xem danh sách toàn bộ khách hàng và nhân viên; tạo tài khoản nhân viên mới, phân công vai trò (`ADMIN`, `NHAN_VIEN`, `KHACH_HANG`), khóa hoặc xóa tài khoản.
+ **Báo cáo tài chính & thống kê doanh thu:** Biểu đồ doanh thu thực tế theo ngày/tháng/năm, tỷ lệ lấp đầy sân, đối soát các giao dịch chuyển khoản VietQR PayOS.
+ **Quản lý nội dung truyền thông:** Thêm/sửa/xóa Banner slider video/ảnh trên Cloudinary, đăng bài viết tin tức giải đấu, phản hồi email thắc mắc của khách hàng qua Gmail App Password.

#### 2. Dẫn chứng code xử lý:
* **Kiểm tra vai trò Admin tuyệt đối tại Backend:**  
  Trong file `qlsanbong_backend/src/controllers/authController.ts` (Dòng 238 – 247):
  ```typescript
  let userRole = user.vai_tro || user.TenVaiTro;
  if (!userRole) {
      if (user.MaVaiTro === 1) userRole = 'ADMIN';
      else if (user.MaVaiTro === 2) userRole = 'NHAN_VIEN';
      else userRole = 'KHACH_HANG';
  }
  if (user.email && (user.email.toLowerCase() === 'admin@gmail.com' || user.email.toLowerCase() === 'xoancao2.0@gmail.com')) {
      userRole = 'ADMIN';
  }
  ```
* **Kích hoạt đồng thời cả 2 nút chức năng trên Menu Admin:**  
  Trong `index.tsx` (Dòng 1610 – 1628), nút quản trị Admin xuất hiện với màu tím hoàng gia sang trọng:
  ```tsx
  {isUserAdmin && (
    <a
      href="/Dashboard"
      onClick={(e) => {
        e.preventDefault();
        setUserDropdownOpen(false);
        router.push('/Dashboard');
      }}
      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-black rounded-xl text-purple-700 bg-purple-50 border border-purple-300"
    >
      <ShieldCheck className="w-4 h-4 text-purple-500 shrink-0" />
      <span>🛡️ Trang Quản Trị (Dashboard)</span>
    </a>
  )}
  ```

---

## 3. Cơ Chế Bảo Vệ Đa Tầng Chống Truy Cập Trái Phép (Security Guards)

```
┌────────────────────────────────────────────────────────────────────────┐
│             KIẾN TRÚC BẢO MẬT 2 LỚP: FRONTEND GUARD + BACKEND RBAC     │
└────────────────────────────────────────────────────────────────────────┘

  [ Khách Hàng Cố Tình Gõ URL: http://localhost:3000/Dashboard ]
                            │
                            ▼
  ┌──────────────────────────────────────────────────────────────────┐
  │ LỚP 1: FRONTEND ROUTE GUARD (Dashboard.tsx - Hàm verifyAdminRole)│
  │ • Đọc Token & AuthUser từ LocalStorage                          │
  │ • Gọi API /auth/me xác thực chéo với máy chủ                    │
  │ • Phát hiện vai trò === 'KHACH_HANG' (Không phải ADMIN)         │
  │ • KÍCH HOẠT: router.replace('/?login=true&requireAdmin=true')    │
  │ • ĐÁ VĂNG VỀ TRANG CHỦ + HIỆN THÔNG BÁO TỪ CHỐI ĐỎ TRỰC QUAN   │
  └─────────────────────────────────┬────────────────────────────────┘
                                    │ (Nếu Hacker cố tình Bypass Frontend dùng Postman)
                                    ▼
  ┌──────────────────────────────────────────────────────────────────┐
  │ LỚP 2: BACKEND CONTROLLER & MIDDLEWARE (verifyToken & authorize) │
  │ • Giả mã chữ ký số JWT: jwt.verify(token, secretKey)             │
  │ • Middleware: authorizeRoles('ADMIN')                            │
  │ • Đối soát req.user.vai_tro !== 'ADMIN'                          │
  │ • TRẢ VỀ MÃ LỖI: HTTP 403 Forbidden                              │
  │   {"success": false, "message": "Bạn không có quyền truy cập!"}  │
  └──────────────────────────────────────────────────────────────────┘
```

### - Chi tiết mã nguồn Lớp Bảo Vệ 1 tại Frontend (`Dashboard.tsx`):
Trong file `qlsanbong_fontend/src/pages/Dashboard.tsx` (Dòng 863 – 872):
```typescript
useEffect(() => {
  verifyAdminRole().then((isOk) => {
    if (isOk) {
      loadAllDataFromBackend();
    } else {
      // Chưa đăng nhập hoặc không phải ADMIN -> Chuyển hướng ngay về Trang chủ và bật modal đăng nhập
      router.replace('/?login=true&requireAdmin=true');
    }
  });
}, []);
```
Và tại `index.tsx` (Dòng 418 – 426) bắt cờ URL để hiển thị cảnh báo đỏ thân thiện:
```typescript
if (router.query.requireAdmin === 'true') {
  triggerToast({
    type: 'error',
    message: '🛡️ Vui lòng đăng nhập với tài khoản Quản trị viên (ADMIN) để truy cập Dashboard!'
  });
}
```

### - Chi tiết mã nguồn Lớp Bảo Vệ 2 tại Backend (`authMiddleware.ts`):
Trong file `qlsanbong_backend/src/middlewares/authMiddleware.ts` (Dòng 56 – 66):
```typescript
export const authorizeRoles = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.vai_tro)) {
            return res.status(403).json({
                success: false,
                message: `Bạn không có quyền thực hiện hành động này. Yêu cầu quyền: [${roles.join(', ')}]`
            });
        }
        next();
    };
};
```

---

## 4. Bảng So Sánh Quyền Hạn Chi Tiết Giữa 3 Vai Trò

| Tính Năng / Nghiệp Vụ Cụ Thể | Khách Hàng (`KHACH_HANG`) | Nhân Viên (`NHAN_VIEN`) | Quản Trị Viên (`ADMIN`) |
| :--- | :---: | :---: | :---: |
| **Xem ma trận lịch sân thời gian thực** | ✅ Có | ✅ Có | ✅ Có |
| **Đặt sân online & Quét mã VietQR MB Bank** | ✅ Có | ✅ Có | ✅ Có |
| **Xem & Quản lý lịch sử đặt sân của chính mình** | ✅ Có | ✅ Có | ✅ Có |
| **Cập nhật hồ sơ cá nhân / Đổi pass qua OTP** | ✅ Có | ✅ Có | ✅ Có |
| **Truy cập Quầy POS (`/management-system`)** | ❌ Chặn (403) | ✅ **Đặc quyền** | ✅ Toàn quyền |
| **Check-in nhận sân & Trả sân tại quầy** | ❌ Không | ✅ Có | ✅ Có |
| **Bán dịch vụ (nước uống, áo bib, bóng)** | ❌ Không | ✅ Có | ✅ Có |
| **Tính tiền thêm giờ & In hóa đơn tại quầy** | ❌ Không | ✅ Có | ✅ Có |
| **Truy cập Trang Quản Trị (`/Dashboard`)** | ❌ Chặn (403) | ❌ Chặn (403) | ✅ **Đặc quyền** |
| **Thêm / Sửa / Xóa Sân Bóng & Loại Sân** | ❌ Không | ❌ Không | ✅ Có |
| **Cấu hình bảng giá theo khung giờ cao điểm** | ❌ Không | ❌ Không | ✅ Có |
| **Tạo tài khoản Nhân viên & Phân quyền User** | ❌ Không | ❌ Không | ✅ Có |
| **Xem báo cáo doanh thu tài chính & xuất Excel** | ❌ Không | ❌ Không | ✅ Có |
| **Đăng bài viết tin tức, thay đổi Banner Slider** | ❌ Không | ❌ Không | ✅ Có |
| **Phản hồi Gmail liên hệ của khách hàng** | ❌ Không | ❌ Không | ✅ Có |

---

## 5. Bộ Câu Hỏi Vấn Đáp Thường Gặp Khi Bảo Vệ Đồ Án (FAQ)

#### ❓ Câu hỏi 1: Làm thế nào hệ thống phân biệt được đâu là Khách hàng, đâu là Nhân viên và Admin khi cùng gửi yêu cầu lên Backend?
> **Trả lời:** Dạ thưa thầy cô, hệ thống áp dụng cơ chế xác thực dựa trên chuỗi mã hóa **JSON Web Token (JWT)**:
> 1. Khi người dùng đăng nhập thành công, Backend thực thi Stored Procedure `sp_DangNhap` lấy ra `TenVaiTro` từ CSDL SQL Server và đóng gói vào trường `vai_tro` nằm trong Payload của JWT Token.
> 2. Mọi yêu cầu gửi lên các API quản trị bắt buộc phải đính kèm Token trong Header `Authorization: Bearer <token>`.
> 3. Middleware `verifyToken` sẽ giải mã Token bằng chữ ký bí mật (`JWT_SECRET`) để trích xuất `req.user.vai_tro`.
> 4. Middleware `authorizeRoles('ADMIN', 'NHAN_VIEN')` sẽ so khớp vai trò; nếu không đúng vai trò sẽ lập tức trả về mã lỗi `403 Forbidden` mà không thực thi logic tiếp theo.

#### ❓ Câu hỏi 2: Nếu một người dùng Khách hàng cố tình sửa trường `vai_tro` trong LocalStorage từ `KHACH_HANG` thành `ADMIN` thì có chiếm được quyền quản trị không?
> **Trả lời:** Dạ hoàn toàn không thể chiếm quyền được ạ, vì hệ thống được bảo vệ bởi **2 lớp phòng thủ**:
> - **Tại Frontend:** Khi người dùng mở trang `/Dashboard`, hàm `verifyAdminRole` không chỉ đọc LocalStorage mà còn âm thầm gửi Token lên API `/api/auth/me` để yêu cầu máy chủ Backend xác minh lại. Token này được ký số bảo mật bằng thuật toán mã hóa một chiều HS256 với Secret Key chỉ máy chủ nắm giữ. Người dùng không thể tự giả mạo chữ ký số trong Token.
> - **Tại Backend:** Mọi thao tác ghi dữ liệu (thêm sân, đổi giá, xóa tài khoản, xem doanh thu) đều được bảo vệ độc lập bởi middleware `authorizeRoles('ADMIN')`. Dù kẻ xấu có vượt qua được giao diện Frontend thì tất cả các yêu cầu API gửi lên server đều bị từ chối với mã lỗi `403 Forbidden`.

#### ❓ Câu hỏi 3: Tại sao nhóm lại phân tách phân hệ Quản lý sân tại quầy (`/management-system`) và Quản trị hệ thống (`/Dashboard`) thành 2 đường dẫn riêng biệt?
> **Trả lời:** Dạ việc phân tách này xuất phát từ yêu cầu nghiệp vụ thực tế của một trung tâm thể thao:
> - **Phân hệ Management System:** Được thiết kế tối ưu hóa tốc độ cao dành cho **Nhân viên thu ngân / trực sân tại quầy**. Giao diện tập trung vào việc check-in nhận sân, kiểm soát sân đang đá theo thời gian thực, bán nước uống và thanh toán tiền mặt/chuyển khoản nhanh chóng. Nhân viên không cần và không được phép can thiệp vào cấu trúc giá hay cấu hình hệ thống.
> - **Phân hệ Dashboard:** Dành riêng cho **Chủ sân / Quản trị viên cấp cao**. Giao diện tập trung vào quản lý kinh doanh: Thống kê doanh thu, tỷ lệ lợi nhuận, cấu hình bảng giá giờ vàng, quản lý danh sách nhân sự và quản trị nội dung website. Sự phân tách này đảm bảo nguyên tắc đặc quyền tối thiểu (Principle of Least Privilege) trong an toàn thông tin phần mềm.

---
*Tài liệu được biên soạn phục vụ công tác báo cáo, thuyết trình và vấn đáp Đồ Án Tốt Nghiệp Sport247.*
