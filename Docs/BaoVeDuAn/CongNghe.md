# BÁO CÁO CÔNG NGHỆ, NGÔN NGỮ LẬP TRÌNH & FRAMEWORK HỆ THỐNG
**Đồ án tốt nghiệp:** Hệ Thống Quản Lý Và Đặt Sân Bóng Đá Trực Tuyến (`QuanLySanBong` / `Soccer247`)  
**Sinh viên thực hiện:** Cao Văn Hột Xoàn — **MSSV:** 525000462  
**Chuyên ngành:** Công Nghệ Thông Tin — Trường Đại Học Lạc Hồng (LHU)  
**Mục tiêu tài liệu:** Báo cáo chi tiết, chuyên sâu và đầy đủ toàn bộ hệ sinh thái công nghệ, ngôn ngữ lập trình, kiến trúc máy chủ, framework, thư viện, dịch vụ đám mây bên thứ ba và hệ quản trị cơ sở dữ liệu được ứng dụng trong đồ án; đi kèm cơ sở lý luận kỹ thuật và bộ câu hỏi vấn đáp bảo vệ đồ án tốt nghiệp trước Hội đồng.

---

## MỤC LỤC TỔNG QUAN

1. [Bảng Tra Cứu Nhanh Hệ Sinh Thái Công Nghệ (Tech Stack Matrix)](#1-bảng-tra-cứu-nhanh-hệ-sinh-thái-công-nghệ-tech-stack-matrix)
2. [Ngôn Ngữ Lập Trình (Programming Languages)](#2-ngôn-ngữ-lập-trình-programming-languages)
3. [Kiến Trúc Tổng Thể & Mô Hình Triển Khai (System Architecture)](#3-kiến-trúc-tổng-thể--mô-hình-triển-khai-system-architecture)
4. [Tầng Giao Diện - Frontend Stack (Next.js & React 19)](#4-tầng-giao-diện---frontend-stack-nextjs--react-19)
5. [Tầng Máy Chủ - Backend Stack (Node.js & Express.js)](#5-tầng-máy-chủ---backend-stack-nodejs--expressjs)
6. [Tầng Cơ Sở Dữ Liệu & T-SQL (Microsoft SQL Server 2022)](#6-tầng-cơ-sở-dữ-liệu--t-sql-microsoft-sql-server-2022)
7. [Hệ Thống Thời Gian Thực - Real-time Communication (Socket.io)](#7-hệ-thống-thời-gian-thực---real-time-communication-socketio)
8. [Bảo Mật, Phân Quyền & Chống Tấn Công (Security & Anti-Bot)](#8-bảo-mật-phân-quyền--chống-tấn-công-security--anti-bot)
9. [Tích Hợp Dịch Vụ Đám Mây & Bên Thứ Ba (Third-Party Integrations)](#9-tích-hợp-dịch-vụ-đám-mây--bên-thứ-ba-third-party-integrations)
10. [Tối Ưu Hóa Hiệu Năng & Bộ Nhớ Đệm (Performance & Caching)](#10-tối-ưu-hóa-hiệu-năng--bộ-nhớ-đệm-performance--caching)
11. [Bộ Câu Hỏi Vấn Đáp Công Nghệ Dành Cho Hội Đồng Chấm Tốt Nghiệp](#11-bộ-câu-hỏi-vấn-đáp-công-nghệ-dành-cho-hội-đồng-chấm-tốt-nghiệp)

---

## 1. BẢNG TRA CỨU NHANH HỆ SINH THÁI CÔNG NGHỆ (TECH STACK MATRIX)

| Phân tầng / Chuyên mục | Công nghệ / Thư viện | Phiên bản | Vai trò & Trách nhiệm chính trong hệ thống |
|---|---|---|---|
| **Ngôn ngữ lập trình chính** | **TypeScript** | v5.x / v7.x | Ngôn ngữ tĩnh kiểu mạnh (Type-safe), chuẩn hóa dữ liệu Frontend & Backend, ngăn chặn lỗi runtime |
| **Ngôn ngữ cơ sở dữ liệu** | **T-SQL (Transact-SQL)** | SQL 2022 | Viết 100% Stored Procedures, quản lý Transaction, Try...Catch, Index và toàn vẹn dữ liệu |
| **Frontend Framework** | **Next.js (Pages Router)** | **16.3.6** | Framework React hiệu năng cao, tối ưu biên dịch, định tuyến trang tự động, SSR/SSG/Client-side |
| **Frontend Core Library** | **React & React DOM** | **19.2.8** | Xây dựng Single Page Application tương tác, tối ưu Render với React Hooks (`useMemo`, `useCallback`) |
| **CSS Framework** | **TailwindCSS** | **v4.0** | Framework giao diện Utility-first hiện đại, biên dịch CSS siêu tốc, tích hợp Dark Mode / Light Mode |
| **Bộ Icon giao diện** | **Lucide-React** | **1.48.0** | Cung cấp hơn 100+ SVG Icons nhẹ, vector sắc nét, chuẩn giao diện Web hiện đại |
| **Bản đồ tương tác** | **Leaflet & @types/leaflet** | **1.9.4** | Bản đồ tương tác định vị cụm sân bóng Biên Hòa - Đồng Nai trên trang Liên hệ & Chân trang |
| **Backend Runtime** | **Node.js (LTS)** | **v20+** | Môi trường thực thi JavaScript/TypeScript non-blocking I/O hướng sự kiện (Event-driven) |
| **Backend Web Framework** | **Express.js** | **4.19.2** | Bộ khung RESTful API tinh gọn, xây dựng bộ định tuyến điều khiển dữ liệu tập trung |
| **Trình chạy TypeScript** | **tsx & typescript** | **4.23.15** | Trình thông dịch & watch code TypeScript thời gian thực không cần biên dịch trung gian khi Dev |
| **Hệ Quản trị CSDL** | **Microsoft SQL Server** | **2022** | RDBMS chuẩn doanh nghiệp lưu trữ toàn bộ người dùng, sân bóng, đơn đặt, hóa đơn và doanh thu |
| **Database Connector** | **mssql (node-mssql)** | **10.0.4** | Thư viện kết nối Node.js với SQL Server qua Connection Pooling tự phục hồi và thực thi Stored Procedures |
| **Realtime Engine** | **Socket.io & Socket.io-client**| **4.8.4** | WebSocket hai chiều: Khóa slot giữ chỗ chống trùng giờ, phát sự kiện thanh toán thành công tức thì |
| **Cổng thanh toán** | **PayOS SDK (@payos/node)** | **2.0.5** | Cổng thanh toán Open Banking chuẩn VietQR (MB Bank), sinh QR động và xử lý Webhook tự động |
| **Lưu trữ Đa phương tiện** | **Cloudinary SDK** | **2.11.0** | CDN lưu trữ và tối ưu hình ảnh sân bóng, video banner trang chủ, hỗ trợ tự động xóa file cũ |
| **Xử lý Tải tệp lên** | **Multer** | **2.4.0** | Middleware xử lý multipart/form-data upload file ảnh/video từ Client lên bộ nhớ đệm trước khi đẩy lên Cloud |
| **Dịch vụ Email** | **Nodemailer** | **10.0.15** | Gửi email thông báo liên hệ tới Admin, gửi email phản hồi khách hàng và cơ chế fallback qua Gmail SMTP |
| **Mã hóa & Bảo mật** | **Bcryptjs** | **2.4.3** | Thuật toán băm mật khẩu một chiều (One-way Salted Hash) chống lộ thông tin người dùng |
| **Xác thực phiên** | **JsonWebToken (JWT)** | **9.0.2** | Chuẩn token không trạng thái (Stateless Authentication) chứa mã người dùng và quyền truy cập |
| **Tối ưu băng thông** | **compression** | **1.8.2** | Nén phản hồi HTTP bằng chuẩn Gzip/Brotli giúp giảm dung lượng JSON từ 60% đến 80% |
| **Bảo mật CORS** | **cors** | **2.8.5** | Quản lý kiểm soát truy cập chia sẻ tài nguyên giữa Frontend và Backend an toàn |
| **Quản lý biến môi trường**| **dotenv** | **16.4.5** | Đọc cấu hình bảo mật từ file `.env` (chuỗi kết nối DB, API Keys, JWT Secret) |

---

## 2. NGÔN NGỮ LẬP TRÌNH (PROGRAMMING LANGUAGES)

### 2.1. TypeScript (Frontend v5.x & Backend v7.x)
- **Vị trí áp dụng:** Toàn diện 100% mã nguồn cả Client (`qlsanbong_fontend/src/**/*.ts(x)`) và Server (`qlsanbong_backend/src/**/*.ts`).
- **Lý do lựa chọn:**
  - **Static Type Checking (Kiểm tra kiểu dữ liệu tĩnh lúc biên dịch):** Dự án quản lý sân bóng có nghiệp vụ rất phức tạp gồm nhiều trạng thái (`CHO_THANH_TOAN`, `CHO_XAC_NHAN`, `DA_COC`, `DANG_DA`, `DA_THANH_TOAN`, `DA_CHOT`, `DA_HUY`), nhiều trường thông tin tiền tệ (`decimal`), khung giờ (`TIME`), tính phút đá linh hoạt. TypeScript giúp định nghĩa chặt chẽ các interface:
    - Model Sân bóng: `interface SanBong { id: number; ten_san: string; don_gia_phut: number; ... }`
    - Model Lịch sân: `interface SlotLichSan { slotId: string; gio_bat_dau: string; trang_thai: string; ... }`
    - Model Đơn thanh toán PayOS: `interface PayOSCheckoutResponse { checkoutUrl: string; qrCode: string; ... }`
  - **Loại trừ triệt để lỗi Runtime phổ biến:** Không còn tình trạng sập web do `Cannot read properties of undefined` hoặc nhầm lẫn giữa kiểu chuỗi số `'500000'` và số thực `500000`.
  - **Trải nghiệm phát triển (DX) vượt trội:** Hỗ trợ IntelliSense gợi ý code chính xác, tái cấu trúc (Refactoring) an toàn trên toàn bộ hệ thống.

### 2.2. Transact-SQL (T-SQL) trên Microsoft SQL Server 2022
- **Vị trí áp dụng:** Toàn bộ tầng nghiệp vụ lưu trữ tại thư mục `Data SQL server 2022/`:
  - [`QuanLySanBong.sql`](file:///d:/BaoCaoTotNghiep/Data%20SQL%20server%202022/QuanLySanBong.sql): Định nghĩa cấu trúc bảng (DDL), khóa ngoại, chỉ mục hiệu năng.
  - [`ThuTuc.sql`](file:///d:/BaoCaoTotNghiep/Data%20SQL%20server%202022/ThuTuc.sql): Định nghĩa hơn **60+ Stored Procedures** xử lý logic nghiệp vụ.
- **Lý do lựa chọn:**
  - Hỗ trợ cú pháp mở rộng mạnh mẽ: Biến cục bộ (`DECLARE`), điều khiển luồng (`IF...ELSE`, `WHILE`), khối bẫy lỗi (`BEGIN TRY...BEGIN CATCH`), lệnh ném ngoại lệ tường minh (`;THROW 50001, N'...', 1;`).
  - Hỗ trợ cơ chế Transaction ACID hoàn hảo (`BEGIN TRAN`, `COMMIT TRAN`, `ROLLBACK TRAN`) đảm bảo khi đặt sân và ghi chi tiết dịch vụ, nếu một bước lỗi thì toàn bộ thao tác được khôi phục, không bao giờ để sót dữ liệu rác.

### 2.3. JavaScript Hiện Đại (ES6+ / ECMAScript 2024)
- **Vị trí áp dụng:** Nền tảng thực thi ngầm cho Node.js và trình duyệt web.
- **Tính năng chủ đạo được sử dụng:**
  - `Async / Await` & `Promise`: Xử lý bất đồng bộ trong các luồng gọi cơ sở dữ liệu, gọi API bên thứ ba, xử lý sự kiện Socket.
  - `Destructuring`, `Spread Operator (...)`: Bóc tách và gộp dữ liệu mảng, đối tượng linh hoạt trong State React.
  - Cấu trúc dữ liệu hiện đại `Map()` và `Set()`: Dùng cho bộ nhớ đệm In-Memory (`lockedSlots` trong Socket và `memoryCache` cho API đọc).

### 2.4. HTML5 & CSS3 Hiện Đại
- **Vị trí áp dụng:** Cấu trúc giao diện người dùng và định dạng thẩm mỹ.
- **Tính năng chủ đạo:** Cấu trúc ngữ nghĩa (Semantic tags: `<header>`, `<main>`, `<section>`, `<article>`, `<footer>`), CSS Flexbox & CSS Grid linh hoạt đáp ứng mọi kích thước màn hình thiết bị di động (Responsive Web Design).

---

## 3. KIẾN TRÚC TỔNG THỂ & MÔ HÌNH TRIỂN KHAI (SYSTEM ARCHITECTURE)

Dự án áp dụng mô hình **Kiến trúc 3 Lớp Phân Tán Hiện Đại (Modern 3-Tier Decoupled Architecture)** kết hợp luồng truyền dữ liệu thời gian thực (Event-Driven Real-time WebSockets):

```
+-----------------------------------------------------------------------------------+
|                           TẦNG GIAO DIỆN (CLIENT LAYER)                           |
|  - Next.js 16 (Pages Router) + React 19 + TypeScript + TailwindCSS v4             |
|  - Trang Chủ Khách Hàng (index.tsx) | Trang Quản Trị POS (management-system.tsx)   |
|  - Socket.io-client (Lắng nghe sự kiện khóa ô slot & trạng thái thanh toán)       |
+----------------------------------------+------------------------------------------+
                                         | HTTP REST API (Fetch/JSON) & WebSocket
                                         v
+-----------------------------------------------------------------------------------+
|                        TẦNG DỊCH VỤ MÁY CHỦ (BACKEND LAYER)                       |
|  - Node.js LTS + Express.js RESTful API Framework (TypeScript)                    |
|  - Socket.io Server (Quản lý kết nối, RAM Map: lockedSlots)                       |
|  - Middleware: JWT Authentication (RBAC), Rate-Limit & Invisible Captcha Guard    |
|  - Dịch vụ nền: In-Memory Cache (TTL), Nodemailer SMTP, Multer Upload             |
|  - Tích hợp Đám mây: Cloudinary Media CDN, PayOS VietQR Payment Gateway           |
+----------------------------------------+------------------------------------------+
                                         | mssql ConnectionPool (execute Stored Proc)
                                         v
+-----------------------------------------------------------------------------------+
|                       TẦNG CƠ SỞ DỮ LIỆU (DATABASE LAYER)                         |
|  - Microsoft SQL Server 2022 (Enterprise RDBMS)                                   |
|  - Kiến trúc: 100% STORED PROCEDURES (Không dùng SQL Raw trong Controller)       |
|  - Ràng buộc toàn vẹn khóa ngoại (FK), Transaction ACID, Chỉ mục tối ưu Index     |
+-----------------------------------------------------------------------------------+
```

### Đặc điểm thiết kế cốt lõi:
1. **Phân tách hoàn toàn (Decoupled Front - Back):** Frontend giao tiếp với Backend thuần túy qua giao thức chuẩn JSON HTTP REST API và kênh WebSocket, cho phép dễ dàng nâng cấp, mở rộng hoặc viết thêm App Mobile (React Native / Flutter) trong tương lai mà không cần sửa Backend.
2. **Kiến trúc dữ liệu 100% Stored Procedures:** Mọi thao tác truy vấn, lọc dữ liệu, thêm, sửa, xóa, báo cáo đều được biên dịch và lưu trữ sẵn bên trong SQL Server. Node.js chỉ đóng vai trò nhận request từ client, kiểm tra hợp lệ, mở kết nối DB và ra lệnh `EXEC sp_...`.
3. **Stateless Authentication:** Sử dụng chuỗi JSON Web Token (JWT) mang thông tin định danh và vai trò, máy chủ không cần duy trì session trong bộ nhớ, tối ưu tài nguyên và dễ dàng scale ngang.

---

## 4. TẦNG GIAO DIỆN - FRONTEND STACK (NEXT.JS & REACT 19)

### 4.1. Framework Next.js (Phiên bản 16.3.6)
- **Cơ chế hoạt động:** Sử dụng kiến trúc **Pages Router** đặt trong thư mục `src/pages/`:
  - `index.tsx`: Trang chủ đặt sân trực quan, hiển thị ma trận sân bóng, banner video/ảnh, modal thanh toán PayOS.
  - `management-system.tsx`: Trang Quản trị hệ thống toàn diện (POS Bán hàng tại quầy, Quản lý sân, Quản lý đơn, Quản lý người dùng, Quản lý dịch vụ, Quản lý tin tức & banner, Báo cáo doanh thu).
  - `history.tsx`: Lịch sử đặt sân cá nhân của khách hàng, xem trạng thái đơn, hủy đơn hoàn cọc.
  - `tin-tuc.tsx`, `about-us.tsx`, `lien-he.tsx`, `profile.tsx`: Các trang nội dung và tiện ích người dùng.
- **Ưu điểm công nghệ:**
  - Tự động phân tách gói mã nguồn (Automatic Code Splitting): Mỗi trang chỉ tải đúng dung lượng JavaScript cần thiết.
  - Tốc độ biên dịch thần tốc, tương thích hoàn toàn với Next Script, Image và Webpack.

### 4.2. Thư viện React (Phiên bản 19.2.8)
- **Áp dụng các React Hooks hiện đại nhất:**
  - `useState`: Quản lý trạng thái giao diện nội bộ (danh sách sân, ô đang chọn, từ khóa tìm kiếm, bộ lọc loại sân, trạng thái modal).
  - `useEffect`: Xử lý side-effects: tải dữ liệu khi đổi ngày, bắt sự kiện click bên ngoài, khởi tạo kết nối WebSocket.
  - `useMemo`: Tối ưu hóa hiệu năng tính toán: Lọc danh sách sân theo loại sân (5, 7, 11) và tìm kiếm tên sân theo thời gian thực mà không gây re-render thừa toàn trang.
  - `useCallback`: Đóng gói các hàm xử lý sự kiện (`handleSelectSlot`, `handleOpenModal`, `handlePayment`) ngăn việc tạo lại function tham chiếu mới ở mỗi lần render.
  - `useRef`: Quản lý tham chiếu trực tiếp đến phần tử DOM (Video Banner player để lắng nghe sự kiện `onEnded`, Timer đếm ngược).
- **Custom Hooks tự thiết kế:**
  - `useBookingSync`: Lắng nghe kênh Socket.io để đồng bộ các ô slot đang bị khách khác khóa hoặc giải phóng.
  - `useAppTheme`: Quản lý chế độ giao diện Sáng / Tối (Light Mode / Dark Mode) lưu trữ cấu hình trong `localStorage`.

### 4.3. TailwindCSS v4 (@tailwindcss/postcss ^4)
- **Đặc trưng:** Phiên bản Tailwind thế hệ mới nhất, loại bỏ hoàn toàn cấu hình phức tạp của `tailwind.config.js` cũ, tích hợp trực tiếp qua PostCSS engine cho tốc độ xử lý nhanh gấp 5 lần.
- **Thiết kế thẩm mỹ cao cấp (Rich Aesthetics):**
  - Bảng màu hiện đại: Kết hợp tông nền Dark sang trọng (`bg-slate-900`, `bg-slate-950`), điểm nhấn màu xanh bóng đá (`emerald-500`, `green-600`), màu cảnh báo chờ cọc (`amber-400`, `yellow-500`) và đỏ sân đã chốt (`rose-600`).
  - Hiệu ứng viền phát sáng (Glow effects), Glassmorphism (lớp mờ thủy tinh `backdrop-blur-md`), chuyển động chuyển màu mượt mà (smooth transitions).

### 4.4. Lucide-React (v1.48.0)
- Thư viện cung cấp toàn bộ biểu tượng trực quan: Lịch thi đấu (`Calendar`), đồng hồ (`Clock`), sân bóng (`CircleDot`), người dùng (`User`), khiên bảo mật (`ShieldCheck`), thẻ ngân hàng (`CreditCard`), mũi tên (`ChevronRight`), điện thoại (`Phone`), vị trí (`MapPin`).
- Dung lượng siêu nhẹ, hiển thị dạng SVG vector sắc nét trên mọi độ phân giải màn hình Retina.

### 4.5. Leaflet (v1.9.4) & Bản Đồ Tương Tác
- Được đóng gói trong component `DongNaiMap.tsx`.
- Hiển thị bản đồ địa lý thực tế cụm sân bóng đá tại Đồng Nai thông qua lớp nền OpenStreetMap, cho phép người dùng phóng to/thu nhỏ, xem tọa độ và dẫn đường GPS.

---

## 5. TẦNG MÁY CHỦ - BACKEND STACK (NODE.JS & EXPRESS.JS)

### 5.1. Nền tảng Node.js (LTS) & Express.js 4.19.2
- **Cấu trúc module hóa theo chuẩn REST API:**
  - `server.ts`: Điểm khởi chạy máy chủ Express kết hợp `http.createServer` và `Socket.io`.
  - `src/routes/`: Phân luồng tài nguyên rõ ràng:
    - `authRoutes.ts`: `/api/auth` (Đăng ký, Đăng nhập, Profile, Quản lý tài khoản Admin).
    - `datSanRoutes.ts`: `/api/dat-san` (Lấy lịch sân, Danh sách sân, Loại sân, Khung giờ, Đặt sân, Hủy cọc).
    - `dichVuRoutes.ts`: `/api/dich-vu` (Danh sách nước/áo, Thêm dịch vụ vào đơn, Nhập kho).
    - `thanhToanRoutes.ts`: `/api/thanh-toan` (Tạo link PayOS, Webhook VietQR, Thanh toán tiền mặt tại quầy).
    - `baoCaoRoutes.ts`: `/api/bao-cao` (Báo cáo doanh thu ngày/tuần/tháng, Top dịch vụ bán chạy).
    - `uploadRoutes.ts`: `/api/upload` (Upload hình ảnh, video lên Cloudinary).
    - `contentRoutes.ts`: `/api` (Banner slider, Tin tức, Giới thiệu About Us, Góp ý Liên hệ).
  - `src/controllers/`: Tiếp nhận HTTP Request, giải mã tham số, gọi dịch vụ thực thi Stored Procedure và trả về JSON chuẩn format `{ success: true, data: ..., message: ... }`.

### 5.2. Công cụ Biên dịch & Chạy TypeScript (tsx & tsc)
- `tsx` (TypeScript Execute): Chạy trực tiếp `tsx watch server.ts` trong môi trường phát triển (Development). Tự động theo dõi các thay đổi mã nguồn và khởi động lại tức thì với tốc độ cực cao nhờ lõi `esbuild`.
- `typescript` & `tsc`: Trình biên dịch mã nguồn từ TypeScript sang mã JavaScript tiêu chuẩn (`dist/server.js`) khi đóng gói môi trường sản xuất (Production).

### 5.3. Trình Điều Khiển Kết Nối SQL Server: `mssql` (v10.0.4)
- **Cấu hình Connection Pooling chuyên nghiệp (`src/config/db.ts`):**
  - Thiết lập hồ chứa kết nối (`ConnectionPool`) với giới hạn tối đa 10 kết nối đồng thời (`max: 10`), thời gian chờ nhàn rỗi 30 giây (`idleTimeoutMillis: 30000`).
  - Cơ chế **Tự Động Kết Nối Lại (Auto-Reconnect Pattern):** Nếu SQL Server khởi động lại hoặc mạng chập chờn, hàm `getPool()` tự động giải phóng pool cũ và kết nối lại hoàn toàn trong suốt đối với người dùng.
  - Thực thi Stored Procedures chuẩn hóa:
    ```typescript
    const pool = await getPool();
    const result = await pool.request()
        .input('ma_san', sql.Int, ma_san)
        .input('ngay_da', sql.Date, ngay_da)
        .execute('sp_LayLichSan');
    ```

---

## 6. TẦNG CƠ SỞ DỮ LIỆU & T-SQL (MICROSOFT SQL SERVER 2022)

### 6.1. Thiết Kế Lược Đồ Dữ Liệu (16 Bảng Nghiệp Vụ Chuẩn Hóa 3NF)
Hệ thống được thiết kế hoàn chỉnh, đáp ứng tiêu chuẩn dạng chuẩn 3 (Third Normal Form) nhằm loại bỏ dư thừa dữ liệu và đảm bảo tính toàn vẹn tham chiếu:

1. **`Vai_Tro`**: Danh mục vai trò (`ADMIN`, `NHAN_VIEN`, `KHACH_HANG`).
2. **`Nguoi_Dung`**: Thông tin tài khoản người dùng, email duy nhất, mật khẩu băm, liên kết `MaVaiTro`.
3. **`Loai_San`**: Phân loại sân bóng (Sân 5 người, Sân 7 người, Sân 11 người tiêu chuẩn FIFA).
4. **`San_Bong`**: Danh sách sân cụ thể (Sân 1, Sân 2...), đơn giá thuê tính theo phút (`don_gia_phut`).
5. **`Khung_Gio`**: Bảng ma trận các mốc giờ bắt đầu và kết thúc cố định (từ 06:00 đến 23:00).
6. **`Don_Dat_San`**: Bảng trung tâm lưu trữ thông tin đơn đặt lịch: ngày đá, giờ bắt đầu/kết thúc, tiền sân, tổng tiền, phương thức thanh toán, trạng thái đơn, giờ check-in vào sân (`da_vao_san`, `gio_vao_san`).
7. **`Thanh_Toan`**: Lịch sử chi tiết các lần thanh toán (đặt cọc 30%, trả hết 100%, thanh toán tiền mặt hoặc chuyển khoản, mã giao dịch).
8. **`Lich_Su_Hoan_Tien`**: Ghi nhận các trường hợp khách hủy sân: số tiền hoàn, tỷ lệ hoàn cọc (100%, 50%, 0%), lý do hủy.
9. **`Dich_Vu`**: Danh mục bán kèm (Nước tăng lực, Nước suối, Áo tập bib, Thuê trọng tài, Thuê bóng), quản lý số lượng tồn kho (`ton_kho`).
10. **`Phieu_Nhap_Kho`**: Lịch sử nhập hàng hóa dịch vụ, giá vốn nhập và ngày nhập.
11. **`Chi_Tiet_Dich_Vu`**: Bảng liên kết nhiều - nhiều giữa `Don_Dat_San` và `Dich_Vu`, lưu số lượng, tổng tiền và số lượng đã trả tiền (`so_luong_da_tra`).
12. **`Banner`**: Quản lý hình ảnh và video slider trình chiếu trên trang chủ.
13. **`Loai_Tin_Tuc`**: Phân loại bài viết tin tức (Giải đấu, Hoạt động sân, Mẹo đá bóng).
14. **`Tin_Tuc`**: Nội dung chi tiết bài viết, hình ảnh, lượt xem.
15. **`Lien_He`**: Tiếp nhận phản hồi, khiếu nại, góp ý từ khách hàng vãng lai.
16. **`About_Us`**: Cấu hình thông tin thương hiệu trung tâm thể thao, hotline, địa chỉ, bản đồ, mạng xã hội.

### 6.2. Triết Lý Thiết Kế: 100% STORED PROCEDURES
Hệ thống **không sử dụng** bất kỳ câu lệnh SQL ghép chuỗi (`string concatenation`) hoặc câu lệnh SQL tĩnh trong code Node.js:
- **Ưu điểm về Tối ưu Hiệu năng (Execution Plan Caching):** SQL Server biên dịch sẵn kế hoạch thực thi (Execution Plan) của Stored Procedure lần đầu tiên chạy và tái sử dụng cho các lần sau, giúp tốc độ phản hồi nhanh hơn đáng kể so với việc gửi chuỗi SQL raw mỗi lần gọi.
- **Ưu điểm về Bảo mật (Tuyệt đối chống SQL Injection):** Mọi tham số đều được ánh xạ qua các kiểu dữ liệu rõ ràng (`sql.Int`, `sql.NVarChar`, `sql.Date`, `sql.Decimal`). Kẻ tấn công không thể chèn ký tự `' OR 1=1 --` để phá hoại cơ sở dữ liệu.
- **Tập trung hóa nghiệp vụ (Centralized Business Logic):** Quy tắc hoàn tiền (hủy trước 24h hoàn 100%, trước 12h hoàn 50%, dưới 12h mất cọc) được viết trọn vẹn trong `sp_HuyDonVaHoanCoc`. Nếu chủ sân thay đổi chính sách kinh doanh, quản trị viên chỉ cần chỉnh sửa Stored Procedure mà không cần biên dịch hay khởi động lại Backend Node.js.

### 6.3. Tối Ưu Hóa Bằng Chỉ Mục (Performance Indexes)
Để đảm bảo tốc độ truy vấn khi dữ liệu tăng lên hàng triệu dòng, hệ thống tạo các chỉ mục phi cụm tối ưu:
```sql
CREATE NONCLUSTERED INDEX IX_DonDatSan_NgayDa_TrangThai 
ON Don_Dat_San(ngay_da, trang_thai) 
INCLUDE (ma_san, ma_nguoi_dung, tong_tien);

CREATE NONCLUSTERED INDEX IX_DonDatSan_MaNguoiDung ON Don_Dat_San(ma_nguoi_dung);
CREATE NONCLUSTERED INDEX IX_ThanhToan_MaDonDat ON Thanh_Toan(ma_don_dat);
```
- Sử dụng mệnh đề `INCLUDE` để tạo **Covering Index**, giúp SQL Server lấy trực tiếp dữ liệu từ Index Leaf Page mà không cần thao tác đọc phụ (Key Lookup) vào bảng chính.

---

## 7. HỆ THỐNG THỜI GIAN THỰC - REAL-TIME COMMUNICATION (SOCKET.IO)

### 7.1. Động Lực Nghiệp Vụ
Trong hệ thống đặt sân bóng, bài toán nan giải nhất là **Xung đột đặt trùng sân cùng một khung giờ (Race Condition / Double Booking)**:
- Khách hàng A đang điền thông tin cho khung giờ 17:30 - 19:00 Sân 1.
- Cùng lúc đó, Khách hàng B cũng vào website và bấm chọn cùng ô giờ này.
- Nếu không có cơ chế thời gian thực, cả 2 khách đều sẽ chuyển sang bước thanh toán, dẫn đến khiếu nại nghiêm trọng.

### 7.2. Giải Pháp Kỹ Thuật: Socket.io In-Memory Court Locking
Hệ thống áp dụng công nghệ **WebSocket hai chiều qua Socket.io (v4.8.4)**:
1. **Lưu trữ trên RAM Server:**
   - Server duy trì một cấu trúc `lockedSlots = new Map<string, string>()`.
   - Key: Mã ô slot kết hợp ngày, mã sân và giờ đá (Ví dụ: `2026-10-12_1_17:30`).
   - Value: `socket.id` của người dùng đang thao tác.
2. **Cơ chế Khóa & Phát sóng tức thời (Lock & Broadcast):**
   - Khi Khách A click vào ô giờ trống trên trang chủ: Client emit sự kiện `lock_slots` kèm danh sách ID ô.
   - Server ghi nhận vào RAM và ngay lập tức gửi broadcast sự kiện `slots_updated` tới **toàn bộ các trình duyệt khác đang mở web**.
   - Trình duyệt của Khách B ngay lập tức chuyển ô giờ đó sang trạng thái màu tím nhấp nháy (Đang có khách giữ chỗ) và vô hiệu hóa nút bấm.
3. **Cơ chế Tự Động Giải Phóng (Auto-Release on Disconnect):**
   - Nếu Khách A đóng tab trình duyệt, mất mạng hoặc tắt máy: Sự kiện `disconnect` trên Socket Server sẽ tự động quét và xóa toàn bộ các ô do `socket.id` của Khách A nắm giữ, sau đó gửi broadcast để ô giờ trở lại trạng thái trống cho người khác đặt.
   - Có hỗ trợ lệnh nhả slot thủ công: `unlock_slot` hoặc `force_unlock_slot` dành cho nhân viên quản trị.
4. **Đồng bộ hóa sau Thanh toán:**
   - Khi Webhook PayOS báo thanh toán thành công, Server gọi `io.emit('booking_confirmed', { donDatId })` để toàn bộ bảng lịch sân của mọi khách hàng tự động chuyển màu đỏ (Đã chốt).

---

## 8. BẢO MẬT, PHÂN QUYỀN & CHỐNG TẤN CÔNG (SECURITY & ANTI-BOT)

### 8.1. Mã Hóa Mật Khẩu (Bcryptjs v2.4.3)
- Sử dụng thuật toán băm mật khẩu một chiều với kỹ thuật sinh muối ngẫu nhiên (Salt Rounds = 10).
- Không bao giờ lưu mật khẩu dạng văn bản thô (Plaintext). Kể cả khi cơ sở dữ liệu bị lộ, kẻ tấn công cũng không thể dịch ngược được mật khẩu gốc.

### 8.2. Xác Thực & Phân Quyền Vai Trò (JWT & RBAC)
- **Cơ chế:** Khi đăng nhập thành công (`sp_DangNhap`), Backend sinh một chuỗi JSON Web Token ký bằng khóa bí mật `JWT_SECRET` với thời hạn hợp lệ 7 ngày.
- **Middleware Phân Quyền (`authMiddleware.ts`):**
  - Trích xuất token từ Header `Authorization: Bearer <token>`.
  - Kiểm tra tính hợp lệ và giải mã thông tin `id`, `email`, `MaVaiTro`, `vai_tro`.
  - Phân quyền theo 3 cấp độ:
    - `ADMIN`: Quản trị viên toàn quyền hệ thống (Cấu hình sân, giá, vai trò, banner, doanh thu).
    - `NHAN_VIEN`: Nhân viên trực quầy (Xem lịch, POS bán hàng, vào sân, kết thúc trận, nhập kho).
    - `KHACH_HANG`: Khách hàng xem sân, đặt sân, thanh toán cọc và quản lý lịch sử cá nhân.

### 8.3. Lá Chắn Chống Bot & Tấn Công Spam Đa Tầng (`captchaGuard.ts`)
Nhằm bảo vệ hệ thống khỏi các cuộc tấn công Brute-force mật khẩu hoặc spam liên hệ gây tràn ngập cơ sở dữ liệu, dự án cài đặt middleware bảo vệ 4 tầng ngầm:
1. **Tầng 1: IP Rate Limiting (Chống dồn dập request):**
   - Giới hạn tối đa 15 yêu cầu mỗi phút cho mỗi địa chỉ IP.
   - Nếu vượt ngưỡng, hệ thống tự động khóa IP đó trong 2 phút và trả về mã lỗi HTTP 429 Too Many Requests.
2. **Tầng 2: Honeypot Invisible Trap (Bẫy bot ngầm):**
   - Đặt các trường nhập ẩn như `_hp_website`, `_trap_code` trên Form. Người dùng thật sẽ không nhìn thấy và để trống, trong khi bot tự động quét mã nguồn sẽ tự điền giá trị. Nếu trường này có dữ liệu -> Chặn ngay lập tức.
3. **Tầng 3: Phân tích Thời gian Tương tác (Human Timing Analysis):**
   - Đo thời gian từ lúc mở form đến khi bấm nút Submit. Con người bình thường cần ít nhất 2 đến 3 giây để nhập thông tin. Nếu thời gian dưới 1.5 giây -> Xác định là Bot tự động và từ chối xử lý.
4. **Tầng 4: Google reCAPTCHA v3 Verification:**
   - Đánh giá điểm rủi ro AI (Score từ 0.0 đến 1.0). Chỉ cho phép các request có Score >= 0.5 đi tiếp.

---

## 9. TÍCH HỢP DỊCH VỤ ĐÁM MÂY & BÊN THỨ BA (THIRD-PARTY INTEGRATIONS)

### 9.1. Cổng Thanh Toán Trực Tuyến PayOS (Chuẩn VietQR Open Banking)
- **Gói tích hợp:** `@payos/node` (v2.0.5) kết hợp tài khoản Ngân hàng Quân đội MB Bank.
- **Quy trình hoạt động:**
  1. Khách hàng chọn hình thức chuyển khoản: Frontend gửi yêu cầu tới Backend `POST /api/thanh-toan/tao-link-payos`.
  2. Backend gọi API PayOS sinh thông tin đơn hàng bao gồm: `orderCode`, `amount`, `description` (Ví dụ: `THANHTOAN 1024`), mã QR định dạng VietQR và đường link thanh toán an toàn.
  3. Khách hàng dùng ứng dụng ngân hàng bất kỳ (Vietcombank, MB, Techcombank...) quét mã QR. Mã QR đã điền sẵn số tài khoản, số tiền và nội dung chuyển khoản chính xác tuyệt đối.
  4. Khách hàng bấm chuyển tiền: Hệ thống Core Banking của ngân hàng báo có tiền -> PayOS bắn Webhook tức thời (`POST /api/thanh-toan/webhook-payos`) về máy chủ Backend.
  5. Backend xác thực chữ ký số (Checksum Webhook), tự động gọi Stored Procedure `sp_ThanhToanDon` để chuyển trạng thái đơn sang ĐÃ ĐẶT CỌC hoặc ĐÃ THANH TOÁN, đồng thời phát tín hiệu qua Socket.io thông báo thành công cho khách.

### 9.2. Dịch Vụ Lưu Trữ Đa Phương Tiện Đám Mây Cloudinary & Multer
- **Gói tích hợp:** `cloudinary` (v2.11.0) và `multer` (v2.4.0).
- **Phạm vi ứng dụng:**
  - Lưu trữ hình ảnh đại diện sân bóng đá.
  - Lưu trữ ảnh avatar người dùng.
  - Lưu trữ banner hình ảnh và video quảng cáo chất lượng cao trên trang chủ.
- **Tính năng vượt trội được hiện thực hóa:**
  - **Tự động dọn dẹp file cũ (Auto Garbage Collection):** Khi quản trị viên cập nhật ảnh/video mới cho banner hoặc sân bóng, hệ thống tự động gọi API Cloudinary để hủy file cũ (`cloudinary.uploader.destroy()`), giúp tiết kiệm dung lượng lưu trữ và tránh tồn đọng tệp rác trên đám mây.
  - **CDN toàn cầu:** Hình ảnh và video được truyền tải qua mạng lưới phân phối nội dung của Cloudinary với khả năng tự động nén định dạng WebP/AVIF tối ưu tốc độ tải trang.

### 9.3. Dịch Vụ Email Tự Động (Nodemailer v10.0.15)
- **Giao thức:** SMTP Gmail an toàn với mật khẩu ứng dụng (App Password).
- **Tính năng nổi bật:**
  - Gửi thông báo tự động về hòm thư Admin (`xoancao2.0@gmail.com`) mỗi khi có khách hàng gửi liên hệ hoặc yêu cầu đặt sân đặc biệt.
  - Gửi email phản hồi chăm sóc khách hàng với template HTML thiết kế đẹp mắt chuẩn nhận diện thương hiệu Soccer247.
  - **Cơ chế Fallback thông minh:** Trong trường hợp email khách hàng nhập bị sai hoặc hòm thư khách bị khóa, hệ thống tự động bắt lỗi và gửi bản sao nội dung về hòm thư Admin, kèm số điện thoại để Admin trực tiếp gọi điện tư vấn cho khách.

---

## 10. TỐI ƯU HÓA HIỆU NĂNG & BỘ NHỚ ĐỆM (PERFORMANCE & CACHING)

### 10.1. Bộ Nhớ Đệm In-Memory Cache (`cacheService.ts`)
- Đối với các thao tác đọc dữ liệu thường xuyên lặp lại (Read-Heavy APIs) như: Danh sách loại sân, bảng giá khung giờ, danh sách banner, tin tức, thông tin giới thiệu:
  - Backend lưu kết quả vào RAM với thời gian sống TTL mặc định (300 giây).
  - Khi có request gửi đến, hệ thống kiểm tra RAM Cache trước. Nếu có, dữ liệu trả về tức thì trong **vài mili-giây** mà không cần truy vấn lại SQL Server.
- **Cơ chế Xóa Cache Chủ Động (Cache Invalidation with `delPrefix`):**
  - Khi có thao tác Thêm / Sửa / Xóa dữ liệu (ví dụ thêm banner mới, sửa tin tức), dịch vụ tự động xóa toàn bộ cache có tiền tố liên quan (`delPrefix('tin_tuc')`, `delPrefix('banner')`) để đảm bảo dữ liệu hiển thị cho người dùng luôn là mới nhất.

### 10.2. Nén Dữ Liệu Phản Hồi HTTP (Compression Middleware)
- Tích hợp thư viện `compression` (v1.8.2) áp dụng thuật toán nén Gzip và Brotli cho toàn bộ các gói phản hồi JSON từ API.
- Kết quả kiểm thử thực tế: Dung lượng dữ liệu truyền qua mạng Internet giảm từ **60% đến 80%**, giúp website tải cực nhanh trên mạng 3G/4G di động.

---

## 11. BỘ CÂU HỎI VẤN ĐÁP CÔNG NGHỆ DÀNH CHO HỘI ĐỒNG CHẤM TỐT NGHIỆP

Dưới đây là 8 câu hỏi cốt lõi mà Hội đồng chấm đồ án tốt nghiệp thường đặt ra cho sinh viên xoay quanh chuyên đề Công nghệ, Ngôn ngữ và Framework, kèm theo chiến lược trả lời đạt điểm tối đa:

---

### Câu 1: Tại sao em lại chọn TypeScript cho cả Frontend và Backend thay vì JavaScript thuần hay các ngôn ngữ như Java / C# / PHP?
> **Gợi ý trả lời ghi điểm:**  
> *"Dạ thưa Thầy/Cô, việc em lựa chọn TypeScript đồng bộ trên cả hệ thống mang lại 3 ưu thế vượt trội:*  
> 1. **Tính Nhất Quán và Tái Sử Dụng Kiểu Dữ Liệu (Full-stack TypeScript):** Các đối tượng mô hình nghiệp vụ như `SanBong`, `SlotLichSan`, `DonDatSan` chỉ cần định nghĩa một lần là có thể hiểu đồng bộ giữa Client và Server, giảm thiểu tối đa sai lệch cấu trúc dữ liệu.  
> 2. **Kiểm Soát Lỗi Lúc Biên Dịch (Compile-time Type Safety):** Hệ thống đặt sân có nhiều trạng thái đơn và nhiều loại dữ liệu tiền tệ. TypeScript giúp em phát hiện và loại bỏ triệt để các lỗi logic, lỗi truy xuất biến `null/undefined` ngay khi đang gõ code thay vì để xảy ra lỗi lúc ứng dụng đang chạy.  
> 3. **Hiệu Năng & Tốc Độ Phát Triển:** Node.js với mô hình Non-blocking I/O xử lý các tác vụ mạng và WebSocket thời gian thực rất mượt mà, đồng thời `tsx` giúp thời gian chạy thử nghiệm nhanh hơn đáng kể so với việc phải biên dịch cả project Java hay C#."*

---

### Câu 2: Tại sao em sử dụng Next.js 16 và React 19 mà không dùng HTML/CSS/JavaScript thuần hoặc React thuần tạo bởi Vite?
> **Gợi ý trả lời ghi điểm:**  
> *"Dạ thưa Thầy/Cô:*  
> - Nếu sử dụng HTML/CSS thuần thì rất khó để quản lý giao diện ma trận lịch sân có tính động cao, nhiều trạng thái màu sắc thay đổi liên tục và nhiều modal tương tác phức tạp.  
> - React 19 cung cấp cơ chế quản lý trạng thái (`State`) mạnh mẽ, kết hợp với `useMemo` và `useCallback` giúp hệ thống render mượt mà, chỉ cập nhật đúng ô slot thay đổi mà không phải tải lại toàn bộ trang web.  
> - Em chọn **Next.js 16** thay vì React Vite thuần vì Next.js cung cấp cấu trúc Pages Router chuẩn hóa, tối ưu hóa quá trình biên dịch (Automatic Code Splitting), tích hợp cơ chế nén mã nguồn tự động, giúp website đạt tốc độ tải trang nhanh và tối ưu hóa công cụ tìm kiếm (SEO) tốt hơn rất nhiều."*

---

### Câu 3: Tại sao tầng cơ sở dữ liệu của em lại dùng 100% Stored Procedures thay vì dùng ORM như Prisma, TypeORM hay Hibernate?
> **Gợi ý trả lời ghi điểm:**  
> *"Dạ thưa Thầy/Cô, em chọn kiến trúc 100% Stored Procedures trong SQL Server vì 3 lý do kỹ thuật then chốt:*  
> 1. **Bảo mật tuyệt đối chống SQL Injection:** Stored Procedure thực thi với các tham số Parameterized Queries phân định rõ ràng giữa lệnh và dữ liệu, kẻ gian hoàn toàn không thể tiêm mã độc vào hệ thống.  
> 2. **Tối ưu hóa hiệu năng (Execution Plan Caching):** SQL Server chỉ cần biên dịch và tối ưu kế hoạch thực thi một lần duy nhất, các lần sau gọi lại sẽ chạy ngay lập tức từ bộ nhớ đệm, nhanh hơn nhiều so với việc ORM phải tự sinh mã SQL thô ở mỗi lượt truy vấn.  
> 3. **Tập trung hóa logic nghiệp vụ & Quản lý Transaction:** Các nghiệp vụ phức tạp như đặt sân, trừ tồn kho dịch vụ, tính tỷ lệ hoàn tiền khi hủy sân được em đóng gói trọn vẹn trong khối `BEGIN TRAN...COMMIT TRAN...BEGIN CATCH` của T-SQL. Dữ liệu luôn đảm bảo tính toàn vẹn ACID, và khi cần thay đổi chính sách kinh doanh chỉ cần cập nhật procedure mà không phải sửa code Backend và deploy lại máy chủ."*

---

### Câu 4: Cơ chế chống đặt trùng sân (Race Condition) bằng Socket.io hoạt động như thế nào trong mã nguồn của em?
> **Gợi ý trả lời ghi điểm:**  
> *"Dạ thưa Thầy/Cô, em xử lý bài toán giữ chỗ thời gian thực qua cơ chế sau:*  
> - Trên máy chủ Backend (`server.ts`), em tạo một `Map<string, string>()` lưu trong bộ nhớ RAM tạm thời các ô slot đang có người chọn theo cấu trúc: `Key = Ngày_MãSân_GiờĐá`, `Value = socket.id`.  
> - Khi Khách A click vào ô giờ trống trên giao diện, trình duyệt lập tức emit sự kiện `lock_slots` lên server. Server ghi nhận vào RAM và gửi broadcast sự kiện `slots_updated` tới tất cả các client khác.  
> - Trình duyệt của các khách khác ngay lập tức nhận sự kiện và chuyển ô đó sang màu tím nhấp nháy (Khóa lại), ngăn không cho người khác click vào.  
> - Nếu Khách A hủy chọn hoặc đóng tab trình duyệt, Socket bắt sự kiện `disconnect`, Server sẽ tự động xóa ô đó khỏi RAM và broadcast thông báo để ô giờ tự động mở lại trạng thái trống cho người khác đặt."*

---

### Câu 5: Hệ thống của em tích hợp cổng thanh toán VietQR PayOS như thế nào và làm sao đảm bảo tính bảo mật của Webhook?
> **Gợi ý trả lời ghi điểm:**  
> *"Dạ thưa Thầy/Cô:*  
> - Khi khách hàng chọn thanh toán chuyển khoản, Backend gọi SDK `@payos/node` để tạo một giao dịch có mã đơn hàng (`orderCode`) và số tiền cụ thể. PayOS sẽ trả về dữ liệu mã VietQR tương ứng tài khoản ngân hàng MB Bank của hệ thống.  
> - Khi khách hàng dùng App ngân hàng quét mã và chuyển tiền thành công, Core Banking của MB Bank thông báo cho PayOS, và PayOS lập tức bắn một HTTP POST Request (Webhook) về endpoint `/api/thanh-toan/webhook-payos` của Backend.  
> - **Về mặt bảo mật Webhook:** Backend sử dụng khóa `PAYOS_CHECKSUM_KEY` để kiểm tra chữ ký điện tử (`signature`) của gói tin nhận được. Nếu chữ ký không khớp với thuật toán mã hóa của PayOS, Backend sẽ từ chối xử lý ngay lập tức để chống kẻ gian giả mạo gói tin thanh toán ảo. Sau khi xác thực hợp lệ, Backend mới gọi Stored Procedure `sp_ThanhToanDon` để chốt đơn."*

---

### Câu 6: Dữ liệu hình ảnh và video banner trong hệ thống được quản lý và lưu trữ ở đâu? Tại sao em chọn giải pháp đó?
> **Gợi ý trả lời ghi điểm:**  
> *"Dạ thưa Thầy/Cô:*  
> - Em không lưu trữ trực tiếp file ảnh và video trong thư mục cục bộ của máy chủ vì việc này làm nặng máy chủ, tốn băng thông và khó mở rộng khi triển khai Cloud.  
> - Em tích hợp dịch vụ lưu trữ đám mây **Cloudinary** kết hợp thư viện **Multer**. Khi người dùng tải ảnh sân bóng hoặc video banner lên, file được đẩy trực tiếp lên Cloudinary. Cơ sở dữ liệu SQL Server chỉ lưu đường dẫn URL an toàn (`https://res.cloudinary.com/...`).  
> - Đặc biệt, em đã lập trình cơ chế **Tự động xóa file cũ**: Mỗi khi quản trị viên cập nhật hoặc xóa sân bóng/banner, hệ thống sẽ tự động gọi API Cloudinary để xóa tệp media cũ, đảm bảo không lưu giữ file rác và tối ưu chi phí lưu trữ."*

---

### Câu 7: Em đã làm những gì để bảo vệ hệ thống trước các cuộc tấn công Brute-force mật khẩu và Bot spam?
> **Gợi ý trả lời ghi điểm:**  
> *"Dạ thưa Thầy/Cô, em đã xây dựng một Middleware bảo vệ đa tầng (`captchaGuard.ts`) gồm 4 lớp bảo mật ngầm:*  
> 1. **IP Rate Limiting:** Giới hạn tối đa 15 request/phút trên mỗi IP, nếu vượt quá sẽ tạm khóa 2 phút (HTTP 429).  
> 2. **Honeypot Trap:** Đặt các ô input ẩn để bẫy các con bot tự động quét và điền form; nếu ô ẩn có dữ liệu thì hệ thống chặn ngay.  
> 3. **Phân tích thời gian tương tác (Human Timing):** Nếu form được gửi đi trong khoảng thời gian dưới 1.5 giây thì hệ thống xác định là do tool/bot thực hiện và từ chối.  
> 4. **Google reCAPTCHA v3:** Tích hợp chấm điểm tin cậy AI cho người dùng với ngưỡng Score >= 0.5.  
> Nhờ đó, hệ thống vừa ngăn chặn bot hiệu quả vừa không gây phiền toái cho người dùng thật (không cần bắt người dùng chọn hình ảnh xác minh)."*

---

### Câu 8: Cơ chế In-Memory Cache và Middleware Compression giúp cải thiện hiệu năng hệ thống như thế nào?
> **Gợi ý trả lời ghi điểm:**  
> *"Dạ thưa Thầy/Cô:*  
> - **In-Memory Cache (`cacheService.ts`):** Đối với các dữ liệu ít khi thay đổi nhưng có tần suất đọc rất cao như danh sách loại sân, danh mục dịch vụ, tin tức, banner, hệ thống sẽ lưu kết quả vào RAM máy chủ với thời gian hết hạn TTL (300 giây). Các request tiếp theo được trả về ngay từ RAM với độ trễ chỉ 1 - 2 mili-giây mà không cần truy vấn lại CSDL. Khi có hành động Thêm/Sửa/Xóa, hệ thống tự động xóa cache liên quan (`delPrefix`) để bảo đảm tính nhất quán dữ liệu.  
> - **Middleware Compression:** Sử dụng thuật toán Gzip/Brotli nén tự động toàn bộ dữ liệu phản hồi JSON từ Express Server, giúp giảm kích thước truyền tải qua mạng từ 60% đến 80%, giúp website hoạt động mượt mà ngay cả trên thiết bị di động có đường truyền mạng yếu."*

---

*(Tài liệu được biên soạn phục vụ bảo vệ đồ án tốt nghiệp — Dự án Quản lý Sân bóng đá `QuanLySanBong`)*
