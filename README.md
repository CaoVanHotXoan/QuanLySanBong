# ⚽ SPORT247 — HỆ THỐNG QUẢN LÝ VÀ ĐẶT SÂN BÓNG ĐÁ TRỰC TUYẾN

> **Đồ Án Tốt Nghiệp Chuyên Ngành Công Nghệ Thông Tin / Kỹ Thuật Phần Mềm**  
> Hệ thống chuyển đổi số toàn diện quy trình vận hành, đặt lịch sân bóng đá, quản lý dịch vụ tại quầy và báo cáo doanh thu theo thời gian thực (Real-time).

---

## 📌 MỤC LỤC
1. [Giới Thiệu Chung](#-giới-thiệu-chung)
2. [Điểm Nổi Bật & Kiến Trúc Hệ Thống](#-điểm-nổi-bật--kiến-trúc-hệ-thống)
3. [Công Nghệ & Thư Viện Sử Dụng](#-công-nghệ--thư-viện-sử-dụng)
4. [Phân Quyền & Các Nhóm Người Dùng](#-phân-quyền--các-nhóm-người-dùng)
5. [Các Tính Năng Chính Của Hệ Thống](#-các-tính-năng-chính-của-hệ-thống)
6. [Cấu Trúc Thư Mục Dự Án](#-cấu-trúc-thư-mục-dự-án)
7. [Cơ Sở Dữ Liệu & Stored Procedures](#-cơ-sở-dữ-liệu--stored-procedures)
8. [Hướng Dẫn Cài Đặt & Chạy Thử](#-hướng-dẫn-cài-đặt--chạy-thử)
9. [Cấu Hình Môi Trường (.env)](#-cấu-hình-môi-trường-env)
10. [Triển Khai (Deployment)](#-triển-khai-deployment)

---

## 📖 GIỚI THIỆU CHUNG

**Sport247** là nền tảng quản lý và đặt sân bóng đá 24/7 trực tuyến hiện đại. Hệ thống giải quyết triệt để các bài toán tồn đọng của mô hình quản lý sân cỏ truyền thống:
- **Tránh trùng lịch đá**: Đặt sân trực tuyến cập nhật trạng thái thời gian thực (Real-time).
- **Thanh toán linh hoạt**: Hỗ trợ chuyển khoản tự động qua mã **VietQR / PayOS** (đặt cọc 30% hoặc trả đủ 100%) và tiền mặt tại quầy.
- **Tối ưu vận hành**: Hỗ trợ nhân viên lễ tân điều phối "Sân đang đá", order dịch vụ (nước ngọt, phụ kiện), xuất hóa đơn và check-in vào sân.
- **Báo cáo chuyên sâu**: Quản trị viên theo dõi biểu đồ doanh thu theo ngày/tuần/tháng/năm và xuất file Excel thống kê.
- **Bảo mật đa tầng**: Đăng ký xác thực mã OTP gửi về Gmail, mã hóa mật khẩu BCrypt, cơ chế Anti-Bot & Captcha ngầm đa lớp bảo vệ hệ thống.

---

## ⚡ ĐIỂM NỔI BẬT & KIẾN TRÚC HỆ THỐNG

- **100% Nghiệp vụ dữ liệu qua Stored Procedures**: Backend không dùng raw query tùy tiện, toàn bộ thao tác thêm, sửa, xóa, truy vấn, tính tiền, khóa lịch sân đều được đóng gói chặt chẽ trong Stored Procedures trên Microsoft SQL Server 2022 đảm bảo tính toàn vẹn dữ liệu (ACID).
- **Đồng bộ thời gian thực (Real-time Socket.IO)**: Khi có khách đặt hoặc giữ chỗ sân, toàn bộ màn hình của người dùng và nhân viên lễ tân lập tức đổi trạng thái khung giờ mà không cần tải lại trang (F5).
- **Thanh toán VietQR tự động (PayOS)**: Sinh mã QR động chuẩn Napas247, tự động khớp lệnh qua Webhook và kích hoạt đơn đặt sân trong vòng 3 giây.
- **Quản lý Media thông minh (Cloudinary)**: Hỗ trợ upload ảnh/video sân bóng, tin tức, avatar với cơ chế tự động xóa file rác cũ trên Cloudinary khi cập nhật hoặc xóa dữ liệu.
- **Bảo mật Anti-Bot & Rate Limit**: Tích hợp bẫy Honeypot, giới hạn tần suất yêu cầu IP và Google reCAPTCHA v3 bảo vệ API an toàn tuyệt đối.

---

## 🛠 CÔNG NGHỆ & THƯ VIỆN SỬ DỤNG

### 1. Frontend (`qlsanbong_fontend`)
- **Core**: Next.js (App & Pages Router), React, TypeScript.
- **Giao diện & UI/UX**: Tailwind CSS, Lucide React Icons, Responsive hoàn chỉnh cho Mobile / Tablet / Desktop.
- **Giao tiếp Real-time**: `socket.io-client`.
- **Bản đồ**: Leaflet / React-Leaflet (bản đồ định vị vị trí sân bóng).
- **Xử lý API & State**: Fetch API / Axios, React State & Custom Hooks.
- **Hỗ trợ theme**: Dark Mode / Light Mode giao diện thể thao hiện đại.

### 2. Backend (`qlsanbong_backend`)
- **Môi trường & Ngôn ngữ**: Node.js, Express.js, TypeScript (`tsx watch` cho dev, `tsc` cho build).
- **Cơ sở dữ liệu**: Microsoft SQL Server (`mssql` driver kết nối Connection Pool hiệu năng cao).
- **Real-time Server**: Socket.IO Engine.
- **Xác thực & Mã hóa**: JSON Web Token (JWT), `bcryptjs`.
- **Tích hợp bên thứ ba**:
  - `@payos/node`: Cổng thanh toán trực tuyến VietQR MB Bank.
  - `nodemailer`: Gửi mã xác thực OTP đăng ký & thư thông báo xác nhận đặt sân qua Gmail SMTP.
  - `cloudinary`: Upload, nén và quản lý tài nguyên hình ảnh/video.
- **Tài liệu API**: Tích hợp Swagger UI (`swagger-ui-express`, OpenAPI YAML).

### 3. Cơ sở dữ liệu (`Data SQL server 2022`)
- **Hệ quản trị**: Microsoft SQL Server 2022.
- **Thiết kế**: Chuẩn hóa 3NF, ràng buộc khóa ngoại (Foreign Key), chỉ mục (Index) tăng tốc tìm kiếm và bộ Stored Procedures tối ưu giao dịch.

---

## 👥 PHÂN QUYỀN & CÁC NHÓM NGƯỜI DÙNG

Hệ thống phân chia rõ ràng 3 nhóm người dùng (Role-Based Access Control):

| Vai trò | Quyền hạn & Chức năng chính |
|---------|------------------------------|
| **Khách hàng (KHACH_HANG)** | - Đăng ký tài khoản (kèm OTP xác thực qua Gmail), đăng nhập.<br>- Tra cứu sân bóng, xem lịch sân trống theo ngày thời gian thực.<br>- Đặt sân trực tuyến, chọn hình thức thanh toán (Cọc 30% / Đủ 100% qua PayOS VietQR hoặc Tiền mặt).<br>- Xem lịch sử đơn đặt sân, yêu cầu hủy đơn, cập nhật hồ sơ cá nhân.<br>- Xem tin tức, gửi liên hệ/phản hồi, định vị vị trí sân trên bản đồ. |
| **Nhân viên (NHAN_VIEN)** | - Đặt sân trực tiếp tại quầy nhanh chóng (bất kỳ khung giờ nào, hỗ trợ sân dự phòng).<br>- Theo dõi danh sách **Sân đang đá** trong ngày.<br>- Check-in khách vào sân, gọi dịch vụ phụ trợ (nước ngọt, áo tập, bóng đá).<br>- Thu khoản tiền còn lại (nếu khách mới cọc 30%), thanh toán và in hóa đơn. |
| **Quản trị viên (ADMIN)** | - Toàn quyền trên toàn bộ hệ thống.<br>- **Dashboard thống kê**: Doanh thu ngày/tuần/tháng, số đơn đặt sân, tỷ lệ lấp đầy sân, xuất file Excel.<br>- **Quản lý Sân bóng & Loại sân**: Thêm, sửa, xóa, định giá tiền theo phút/giờ.<br>- **Quản lý Dịch vụ**: Nước giải khát, thuê đồ, phụ kiện thi đấu.<br>- **Quản lý Đơn đặt sân**: Duyệt đơn, cập nhật trạng thái, xử lý yêu cầu hủy đơn.<br>- **Quản lý Người dùng**: Phân quyền tài khoản (Admin, Nhân viên, Khách hàng).<br>- **Quản lý Nội dung**: Banner slider trang chủ, tin tức giải đấu, giới thiệu sân, hòm thư liên hệ. |

---

## 🚀 CÁC TÍNH NĂNG CHÍNH CỦA HỆ THỐNG

### 1. Phân Hệ Khách Hàng (Client Portal)
- **Trang chủ sống động**: Banner slider, giới thiệu cơ sở vật chất, bảng giá sân minh bạch, danh sách sân nổi bật.
- **Đặt sân trực tuyến thông minh**:
  - Chọn ngày, loại sân (Sân 5 người, Sân 7 người, Sân 11 người).
  - Lưới hiển thị các khung giờ sáng/chiều/tối với màu sắc trực quan (Trống, Đang giữ chỗ, Đã đặt).
  - Tự động tính tổng tiền theo đơn giá phút/giờ và thời lượng đặt.
- **Thanh toán VietQR tự động**: Quét mã QR thanh toán tức thì qua ứng dụng ngân hàng, hệ thống tự động xác nhận đơn thành công mà không cần can thiệp thủ công.
- **Xác thực OTP Gmail**: Gửi mã xác nhận 6 số ngẫu nhiên qua Gmail để kích hoạt tài khoản an toàn.

### 2. Phân Hệ Tiếp Tân & Thu Ngân (Staff POS)
- **Đặt sân tại quầy**: Thao tác linh hoạt cho khách vãng lai, mở thêm sân dự phòng khi giờ cao điểm.
- **Điều phối sân đang đá**:
  - Xem danh sách trận đấu diễn ra hôm nay.
  - Nhấn vào sân để tải chi tiết order: bổ sung nước ngọt, thuê giày, đồ tập.
  - Phân tách rõ ràng trạng thái: Đã trả đủ hoặc Đang nợ 70% cọc.
  - Thanh toán một chạm khi trận đấu kết thúc.

### 3. Phân Hệ Quản Trị Hệ Thống (Admin Dashboard)
- **Báo cáo doanh thu đa chiều**: Biểu đồ doanh số trực quan, phân tích nguồn thu (tiền sân vs tiền dịch vụ).
- **Xuất dữ liệu Excel**: Xuất báo cáo tài chính, danh sách đơn hàng phục vụ công tác kế toán.
- **Quản lý tài nguyên media**: Upload ảnh sân, banner với CDN Cloudinary tốc độ cao.
- **Hệ thống cấu hình**: Thay đổi thông tin hotline, địa chỉ, định vị bản đồ sân bóng.

---

## 📁 CẤU TRÚC THƯ MỤC DỰ ÁN

```bash
BaoCaoTotNghiep/
├── Data SQL server 2022/              # Tài nguyên Cơ sở dữ liệu SQL Server
│   ├── QuanLySanBong.sql              # Cấu trúc bảng (Tables, Foreign Keys, Sample Data)
│   ├── ThuTuc.sql                     # Toàn bộ Stored Procedures nghiệp vụ hệ thống
│   └── databong.sql                   # Bản sao lưu backup dữ liệu
│
├── Docs/                              # Tài liệu đồ án tốt nghiệp
│   ├── Slide_Baocao_NhomSenPai_Sport247.pptx   # Slide thuyết trình bảo vệ đồ án
│   ├── ThuyetMinhDeTai.docx           # Báo cáo thuyết minh đồ án chi tiết
│   ├── YeuCau.md                      # Hồ sơ phân tích & yêu cầu nghiệp vụ phần mềm
│   └── ...
│
├── qlsanbong_backend/                 # Máy chủ API Backend (Node.js + Express + TS)
│   ├── src/
│   │   ├── config/                    # Cấu hình kết nối CSDL SQL Server, Cloudinary, PayOS
│   │   ├── controllers/               # Bộ điều khiển API (auth, datsan, thanhtoan, content...)
│   │   ├── middlewares/               # Middlewares (Auth JWT, Captcha Anti-bot, Upload Multer)
│   │   ├── routes/                    # Khai báo các đường dẫn RESTful API
│   │   ├── services/                  # Xử lý logic phụ trợ (Email OTP Nodemailer, PayOS, Cache)
│   │   └── types/                     # Định nghĩa TypeScript Interfaces
│   ├── dist/                          # Mã nguồn biên dịch chạy production
│   ├── server.ts                      # Điểm khởi chạy ứng dụng & Socket.IO Server
│   ├── .env                           # File biến môi trường backend
│   └── package.json
│
├── qlsanbong_fontend/                 # Giao diện người dùng Web (Next.js + React + TS)
│   ├── public/                        # Tệp tĩnh (Images, Icons, OpenApi JSON)
│   ├── src/
│   │   ├── components/                # Các thành phần tái sử dụng (Navbar, Footer, Modal, Map...)
│   │   ├── pages/                     # Màn hình giao diện (Trang chủ, Đặt sân, Dashboard, Login...)
│   │   ├── services/                  # Gọi API kết nối với Backend
│   │   └── styles/                    # Cấu hình giao diện CSS toàn cục
│   ├── .env.local                     # Biến môi trường Frontend (Development)
│   ├── .env.production                # Biến môi trường Frontend (Production trên Vercel)
│   ├── next.config.ts
│   └── package.json
│
└── README.md                          # Tài liệu hướng dẫn tổng quan dự án
```

---

## 🗄 CƠ SỞ DỮ LIỆU & STORED PROCEDURES

Hệ thống thiết kế theo quy chuẩn phân tách rõ ràng giữa cấu trúc dữ liệu và thủ tục xử lý:

1. **`Data SQL server 2022/QuanLySanBong.sql`**:
   - Chứa định nghĩa toàn bộ các bảng: `Nguoi_Dung`, `Vai_Tro`, `San_Bong`, `Loai_San`, `Don_Dat_San`, `Chi_Tiet_Dat_San`, `Dich_Vu`, `Hoa_Don_Dich_Vu`, `Tin_Tuc`, `Banner`, `Lien_He`, `OTP_Codes`...
   - Thiết lập khóa chính (PK), khóa ngoại (FK) và dữ liệu ban đầu.
   - **Tuyệt đối không chứa Stored Procedures**.

2. **`Data SQL server 2022/ThuTuc.sql`**:
   - Chứa toàn bộ các Stored Procedures thực thi nghiệp vụ (CREATE OR ALTER PROCEDURE):
     - Xác thực & Tài khoản: `sp_DangNhap`, `sp_ThemNguoiDung`, `sp_KiemTraOTP`, `sp_DoiMatKhau`...
     - Đặt sân & Lịch thi đấu: `sp_KiemTraSanTrong`, `sp_DatSan`, `sp_HuyDonDatSan`, `sp_LayDanhSachDatSanTheoNgay`...
     - Dịch vụ & Hóa đơn: `sp_ThemDichVuVaoDon`, `sp_ThanhToanHoaDon`, `sp_LayDanhSachSanDangDa`...
     - Thống kê doanh thu: `sp_ThongKeDoanhThuTheoNgay`, `sp_ThongKeDoanhThuTheoThang`...

---

## 💻 HƯỚNG DẪN CÀI ĐẶT & CHẠY THỬ

### 1. Chuẩn Bị Môi Trường
- [Node.js](https://nodejs.org/) (Khuyến nghị phiên bản LTS 18.x trở lên).
- [Microsoft SQL Server 2022](https://www.microsoft.com/en-us/sql-server) kèm SQL Server Management Studio (SSMS).
- Git.

### 2. Cài Đặt Cơ Sở Dữ Liệu
1. Mở **SQL Server Management Studio (SSMS)** và kết nối tới máy chủ SQL Server của bạn.
2. Tạo cơ sở dữ liệu có tên: `QuanLySanBong`.
3. Mở file `Data SQL server 2022/QuanLySanBong.sql` và nhấn **Execute (F5)** để tạo bảng và dữ liệu mẫu.
4. Mở tiếp file `Data SQL server 2022/ThuTuc.sql` và nhấn **Execute (F5)** để khởi tạo toàn bộ Stored Procedures.

### 3. Cài Đặt & Chạy Backend
```bash
# 1. Di chuyển vào thư mục backend
cd qlsanbong_backend

# 2. Cài đặt các thư viện phụ thuộc
npm install

# 3. Cấu hình file .env (kiểm tra tài khoản sa và mật khẩu SQL Server)

# 4. Khởi chạy máy chủ ở chế độ phát triển (Development)
npm run dev

# Máy chủ Backend sẽ lắng nghe tại: http://localhost:5000
# Tài liệu Swagger API tại: http://localhost:5000/api-docs
```

### 4. Cài Đặt & Chạy Frontend
```bash
# 1. Mở một cửa sổ Terminal mới và di chuyển vào thư mục frontend
cd qlsanbong_fontend

# 2. Cài đặt các thư viện phụ thuộc
npm install

# 3. Khởi chạy máy chủ giao diện Next.js
npm run dev

# Mở trình duyệt và truy cập: http://localhost:3000
```

---

## ⚙ CẤU HÌNH MÔI TRƯỜNG (.env)

### 1. Backend (`qlsanbong_backend/.env`)
```env
# Cổng máy chủ
PORT=5000

# Cấu hình kết nối SQL Server
DB_USER=sa
DB_PASSWORD=your_sql_password
DB_SERVER=localhost
DB_DATABASE=QuanLySanBong
DB_PORT=1433

# Cấu hình bảo mật JWT
JWT_SECRET=super_secret_jwt_key_qlsanbong_2026_!@#$$
JWT_EXPIRES_IN=7d

# Cổng thanh toán VietQR PayOS
PAYOS_CLIENT_ID=your_client_id
PAYOS_API_KEY=your_api_key
PAYOS_CHECKSUM_KEY=your_checksum_key

# URL máy chủ Frontend cho phép kết nối CORS
FRONTEND_URL=http://localhost:3000

# Cấu hình Cloudinary (Lưu trữ ảnh & video)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Cấu hình gửi mail OTP qua Gmail SMTP
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your_email@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_FROM=your_email@gmail.com
ADMIN_NOTIFICATION_EMAIL=your_email@gmail.com
```

### 2. Frontend (`qlsanbong_fontend/.env.local`)
```env
# URL kết nối API Backend
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# URL máy chủ Socket.IO thời gian thực
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

---

## 🌐 TRIỂN KHAI (DEPLOYMENT)

- **Frontend**: Dễ dàng triển khai lên **Vercel** với thiết lập tự động nhận diện Next.js.
- **Backend**: Có thể triển khai trên **Render / Railway / VPS / Serverless**.
- **Cơ sở dữ liệu**: Triển khai trên **Windows Server / Azure SQL Database / Hosting SQL Server (Site4Now)**.

---

## 👨‍💻 THÀNH VIÊN THỰC HIỆN ĐỀ TÀI

- **Đề tài**: Hệ Thống Quản Lý Và Đặt Sân Bóng Đá (Sport247).
- **Chuyên ngành**: Công Nghệ Thông Tin.
- **Nhóm tác giả**: Nhóm SenPai (Cao Văn Hột Xoàn & cộng sự).
- **Năm hoàn thành**: 2026.

---
*Chúc quý thầy cô và các bạn có trải nghiệm tuyệt vời khi sử dụng và đánh giá hệ thống Sport247!*
