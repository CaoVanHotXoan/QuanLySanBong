# BÁO CÁO THUYẾT TRÌNH: TỔNG HỢP TOÀN BỘ CÔNG NGHỆ & KIẾN TRÚC HỆ THỐNG SPORT247

> **Hệ thống:** Quản Lý & Đặt Sân Bóng Đá Trực Tuyến Toàn Diện Sport247 / Soccer247  
> **Sinh viên thực hiện:** Cao Văn Hột Xoàn (MSSV: 525000462) & Phạm Tiến Doanh (MSSV: 525000463)  
> **Khoa:** Công Nghệ Thông Tin - Đại Học Lạc Hồng (LHU)  

---

# PHẦN I: BẢN TÓM TẮT NGẮN GỌN (DÀNH CHO NÓI THUYẾT TRÌNH / HỌC THUỘC)

## 1. Công Nghệ Tầng Giao Diện (Frontend Stack)

### - Công nghệ:
+ **Next.js 16 (React 19) & TypeScript 5:** Xây dựng cấu trúc Single Page Application (SPA) kết hợp Server-Side Rendering (SSR) và Static Site Generation (SSG); quản lý định tuyến trang (Pages Router); bảo đảm an toàn kiểu dữ liệu (Type-safe) 100% không để phát sinh lỗi lúc runtime.
+ **Tailwind CSS v4 & PostCSS:** Framework Utility-first CSS thế hệ mới nhất, sử dụng engine biên dịch siêu tốc, hỗ trợ `@custom-variant dark` chuyển đổi tức thì giao diện Sáng / Tối (Dark / Light Mode) mà không cần nạp lại file CSS.
+ **Lucide React Icons (v1.48):** Thư viện hơn 1000+ biểu tượng vector SVG nhẹ, sắc nét, đồng bộ phong cách thiết kế hiện đại trên toàn bộ trang chủ, thanh điều hướng và bảng quản trị Dashboard.
+ **Socket.IO-Client (v4.8):** Thư viện WebSocket phía máy khách, duy trì kết nối hai chiều liên tục với máy chủ; đồng bộ tức thời trạng thái giữ chỗ ma trận sân, tiếp nhận tín hiệu thanh toán Webhook và cập nhật màn hình POS nhân viên theo thời gian thực.
+ **Leaflet & OpenStreetMap (v1.9):** Tích hợp bản đồ tương tác hiển thị vị trí sân bóng vệ tinh tại trang Liên Hệ mà không tốn phí bản quyền Google Maps API.
+ **JS-YAML (v5.5):** Thư viện đọc và phân tích cấu trúc OpenAPI Specification từ định dạng YAML để dựng trang tra cứu tài liệu API trực quan (`/api-docs`).

---

### - Những file xử lý code:
+ **File 1: `qlsanbong_fontend/package.json` (Quản lý thư viện Frontend)**
  * Dòng 11 – 20: Khai báo các dependencies cốt lõi (`next: 16.3.6`, `react: 19.2.8`, `socket.io-client: ^4.8.4`, `lucide-react`, `leaflet`, `js-yaml`).
+ **File 2: `qlsanbong_fontend/src/pages/index.tsx` (Trang Chủ & Ma trận đặt sân khách hàng)**
  * Dòng 673 – 730: Kết nối `io(SOCKET_URL)`, lắng nghe sự kiện `slots_updated` (đổi màu ô sang CAM) và `payment_success` (nhận tiền thành công).
  * Dòng 1111 – 1202: Hàm `handleSlotClick` (thuật toán phân tích ô trống, tự động giữ chỗ dải ô khả dụng trên RAM).
+ **File 3: `qlsanbong_fontend/src/pages/Dashboard.tsx` (Trung tâm Quản trị Admin - 13 Phân Hệ Nghiệp Vụ)**
  * Dòng 1200 – 1250: Hook `kpiStats` tự động tính doanh thu hôm nay, tổng đơn đặt sân và số sân đang thi đấu thực tế.
  * Dòng 1385 – 1445: Ma trận `livePitchStatusAnalytics` giám sát thời gian thực 7 sân bóng.
+ **File 4: `qlsanbong_fontend/src/pages/management-system.tsx` (Hệ Thống Thu Ngân & POS Trực Tiếp Tại Quầy)**
  * Dòng 1335 – 1480: Quản lý danh sách sân đang đá (`currentlyPlayingPitches`) và ca đặt chờ vào sân (`allTodayBookings`).
+ **File 5: `qlsanbong_fontend/src/hooks/useAppTheme.ts` & `src/styles/globals.css` (Chế độ Sáng / Tối)**
  * Quản lý LocalStorage Dual-Key (`APP_THEME_DARK` & `theme`), đồng bộ sự kiện `CustomEvent` và biến thể Tailwind `@custom-variant dark`.
+ **File 6: `qlsanbong_fontend/src/pages/lien-he.tsx` (Bản đồ Leaflet)**
  * Tích hợp bản đồ tọa độ GPS sân bóng, ghim marker vệ tinh và hỗ trợ khách mở Google Maps chỉ đường 1 chạm.

---

### - Cách hoạt động:
+ Khách hàng truy cập website -> Next.js phục vụ trang tức thời bằng kiến trúc kết hợp SSR/SSG.
+ Khi khách tương tác đặt sân, giao diện kết nối WebSocket gửi/nhận dữ liệu mili-giây với Backend.
+ Toàn bộ hiệu ứng, màu sắc, thanh đếm ngược, chuyển đổi theme sáng tối đều xử lý mượt mà trên Client mà không cần reload trang.

---
---

## 2. Công Nghệ Tầng Máy Chủ (Backend Stack)

### - Công nghệ:
+ **Node.js (v20/v24 LTS) & Express.js (v4.19):** Nền tảng thực thi JavaScript phía máy chủ và framework định tuyến RESTful API chuẩn mực; xử lý các yêu cầu I/O bất đồng bộ (Non-blocking I/O) hiệu năng cao.
+ **TypeScript 7 & TSX Watcher:** Biên dịch mã nguồn Backend với kiểu dữ liệu tĩnh nghiêm ngặt; công cụ `tsx` hỗ trợ tự động tải lại máy chủ khi sửa code (Hot-reload) cực nhanh mà không cần biên dịch thủ công qua file `.js`.
+ **Compression (`compression` v1.8):** Middleware nén dữ liệu HTTP phản hồi bằng chuẩn Gzip / Deflate, giúp giảm từ 60% - 80% kích thước gói tin JSON gửi về trình duyệt, tăng tốc tải trang tối đa.
+ **CORS (`cors` v2.8):** Cấu hình chia sẻ tài nguyên an toàn giữa các tên miền (Cross-Origin Resource Sharing), chỉ cho phép Frontend Localhost và tên miền Vercel Production gửi request đến API.
+ **Dotenv (`dotenv` v16.4):** Đọc và bảo mật các biến môi trường nhạy cảm (`DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, `PAYOS_API_KEY`, `CLOUDINARY_API_SECRET`, `MAIL_PASSWORD`) qua file `.env`.
+ **Multer (v2.4) & Memory Storage:** Middleware tiếp nhận file upload (ảnh sân bóng, banner, video giải đấu) dưới dạng Buffer trực tiếp trên RAM, không lưu file rác trên ổ cứng máy chủ trước khi đẩy lên Cloud.

---

### - Những file xử lý code:
+ **File 1: `qlsanbong_backend/server.ts` (Điểm khởi động máy chủ & Socket.IO Hub)**
  * Dòng 25 – 45: Cấu hình Express App, CORS, nén dữ liệu `compression()`, phân tích `express.json()` và giới hạn kích thước payload 50MB.
  * Dòng 50 – 85: Đăng ký các nhóm Routes chính (`/api/auth`, `/api/dat-san`, `/api/thanh-toan`, `/api/bao-cao`, `/api/upload`, `/api/dich-vu`, `/api/content`).
  * Dòng 130 – 250: Thiết lập máy chủ WebSocket `Socket.IO`, quản lý bộ nhớ đệm giữ chỗ `lockedSlots = new Map()` trên RAM.
+ **File 2: `qlsanbong_backend/src/routes/` (Hệ thống 7 tập tin định tuyến RESTful)**
  * `authRoutes.ts`, `datSanRoutes.ts`, `thanhToanRoutes.ts`, `baoCaoRoutes.ts`, `dichVuRoutes.ts`, `uploadRoutes.ts`, `contentRoutes.ts`.
+ **File 3: `qlsanbong_backend/src/controllers/uploadController.ts` & `src/config/cloudinary.ts` (Xử lý upload)**
  * Tích hợp Multer `storage: multer.memoryStorage()` và Cloudinary `upload_stream` xử lý ảnh/video mượt mà.

---

### - Cách hoạt động:
+ Máy chủ Express lắng nghe tại cổng `5000` (hoặc cổng môi trường do Render cấp phát).
+ Mọi Request từ Client đi qua chuỗi Middleware: `cors` -> `compression` -> `json parser` -> Router chuyên trách.
+ Dữ liệu được xác thực, sau đó chuyển giao cho Controller để gọi Stored Procedure xuống Cơ sở dữ liệu và trả kết quả JSON chuẩn hóa `{ success: true, data: [...] }`.

---
---

## 3. Công Nghệ Cơ Sở Dữ Liệu & Giao Dịch ACID (Database Stack)

### - Công nghệ:
+ **Microsoft SQL Server 2022 (Enterprise/Developer):** Hệ quản trị cơ sở dữ liệu quan hệ (RDBMS) tiêu chuẩn công nghiệp; mạnh mẽ về khả năng quản lý quan hệ, bảo mật phân quyền và tối ưu hóa truy vấn.
+ **T-SQL Stored Procedures (100% Thủ Tục Lưu Trữ):** Toàn bộ nghiệp vụ đọc, ghi, cập nhật, xóa (CRUD), tính toán giờ chơi, đối soát tiền tệ đều được đóng gói bằng Stored Procedure; mã nguồn Backend chỉ việc gọi tên thủ tục kèm tham số, ngăn chặn hoàn toàn lỗi SQL Injection.
+ **ACID Transactions (`BEGIN TRANSACTION ... COMMIT / ROLLBACK`):** Đảm bảo tính toàn vẹn tuyệt đối trong các thao tác phức tạp (đặt sân đồng thời chèn chi tiết dịch vụ, thanh toán đồng thời cập nhật trạng thái đơn và sinh lịch sử giao dịch).
+ **Node-MSSQL (`mssql` v10.0):** Driver kết nối chính thức giữa Node.js và SQL Server; tích hợp kiến trúc Connection Pooling tự động kết nối lại (Auto-Reconnect) và Keep-Alive liên tục, không bao giờ để chết kết nối API.
+ **Cấu trúc phân tách 2 tập tin chuẩn hóa:**
  * `QuanLySanBong.sql`: Chứa 100% cấu trúc 18 Bảng dữ liệu, Khóa chính, Khóa ngoại, Ràng buộc Check và Dữ liệu mẫu khởi tạo. **Tuyệt đối không chứa Stored Procedure**.
  * `ThuTuc.sql`: Chứa 100% toàn bộ Stored Procedures nghiệp vụ của toàn bộ hệ thống.

---

### - Những file xử lý code:
+ **File 1: `qlsanbong_backend/src/config/db.ts` (Quản lý kết nối SQL Server Connection Pool)**
  * Dòng 13 – 31: Cấu hình `SqlConfig` (host, port 1433, database, connectionTimeout 15s, pool max 10).
  * Dòng 39 – 65: Hàm `getPool()` khởi tạo `ConnectionPool`, tự động phát hiện mất kết nối và tái tạo pool mới an toàn.
+ **File 2: `Data SQL server 2022/QuanLySanBong.sql` (Cấu trúc 18 Bảng & Ràng buộc)**
  * Dòng 51 – 150: Tạo bảng `Vai_Tro`, `Nguoi_Dung`, `Loai_San`, `San_Bong`, `Khung_Gio`, `Don_Dat_San`, `Thanh_Toan`, `Chi_Tiet_Dich_Vu`...
+ **File 3: `Data SQL server 2022/ThuTuc.sql` (Kho tàng 100+ Stored Procedures)**
  * Dòng 859 – 904: `sp_DongBoTrangThaiDonDatSan` (tự động dọn sân và kết thúc các ca đá quá giờ).
  * Dòng 906 – 945: `sp_XacNhanVaoSan` (thủ tục xác nhận cho khách vào sân thi đấu trực tiếp).
  * Dòng 947 – 1000: `sp_LayTatCaDonDat` (thủ tục nạp dữ liệu đơn cho Dashboard và POS).
  * Dòng 1128: `sp_DatSan` (kiểm tra xung đột giờ và lưu đơn đặt với Transaction).
  * Dòng 1596: `sp_ThanhToanDon` (ghi nhận thanh toán cọc 30% hoặc 100% tiền sân).

---

### - Cách hoạt động:
+ Khi Backend cần truy xuất dữ liệu: Lấy connection từ Pool -> Nạp tham số `.input('param', sql.Type, value)` -> Gọi `.execute('sp_TenThuTuc')`.
+ SQL Server biên dịch sẵn Execution Plan trên máy chủ CSDL, tối ưu hóa tốc độ thực thi nhanh hơn từ 3 - 5 lần so với việc gửi câu lệnh SQL thô (Raw SQL) hoặc dùng ORM nặng nề.

---
---

## 4. Công Nghệ Thời Gian Thực & Đồng Bộ Socket (Real-Time Stack)

### - Công nghệ:
+ **Socket.IO (Server v4.8 & Client v4.8):** Thư viện truyền thông hai chiều dựa trên nền tảng WebSocket (với fallback HTTP Long-Polling tự động khi mạng yếu); độ trễ truyền tin dưới 10 mili-giây.
+ **In-Memory RAM Locking Pattern:** Quản lý khóa giữ chỗ tạm thời bằng cấu trúc dữ liệu `Map<string, string>()` trực tiếp trên thanh RAM của máy chủ Node.js; không ghi ổ cứng, không tạo I/O đè lên SQL Server, giải phóng tức thời khi khách ngắt kết nối.
+ **Dual-Way Event Broadcasting:** Cơ chế phát thanh đa chiều:
  * Khách giữ chỗ -> Toàn bộ khách khác trên mạng thấy ô chuyển sang màu CAM giữ chỗ.
  * Khách chuyển khoản thành công -> Toàn mạng thấy ô chuyển sang màu ĐỎ/VÀNG; thông báo nổ tức thì trên màn hình thu ngân POS.
  * Nhân viên POS nhận ca / thanh toán tại quầy -> Khách tại trang chủ lập tức thấy lịch sân được cập nhật tự động.

---

### - Những file xử lý code:
+ **File 1: `qlsanbong_backend/server.ts` (Socket Hub trên Server)**
  * Dòng 147 – 174: Biến `lockedSlots` và sự kiện `socket.on('lock_slots')`.
  * Dòng 187 – 199: Sự kiện `socket.on('unlock_all')` (giải phóng slot trên RAM).
  * Dòng 232 – 250: Sự kiện `socket.on('disconnect')` (tự động nhả slot khi khách tắt tab hoặc rớt mạng).
+ **File 2: `qlsanbong_fontend/src/pages/index.tsx` (Socket Client tại Trang Chủ)**
  * Dòng 673 – 730: Lắng nghe `slots_updated`, `payment_success`, `booking_updated`.
+ **File 3: `qlsanbong_fontend/src/pages/management-system.tsx` (Socket Client tại POS Thu Ngân)**
  * Dòng 680 – 720: Lắng nghe và phát tín hiệu đồng bộ giữa quầy thanh toán và trang chủ online.

---

### - Cách hoạt động:
+ Bất kỳ thao tác click ô giờ, thanh toán, hay vào sân của một người dùng bất kỳ sẽ kích hoạt một sự kiện Socket tương ứng.
+ Máy chủ đóng vai trò Trạm tiếp sóng (Relay Hub), phân phối dữ liệu ngay lập tức tới tất cả các máy khách đang mở trình duyệt, tạo nên trải nghiệm người dùng sống động như đang ở tại sân vận động.

---
---

## 5. Công Nghệ Thanh Toán Tự Động & Open Banking (Fintech Stack)

### - Công nghệ:
+ **PayOS SDK (`@payos/node` v2.0):** Cổng kết nối thanh toán tự động chuyên biệt cho tài khoản Doanh nghiệp / Cá nhân tại Ngân Hàng TMCP Quân Đội (MB Bank).
+ **Mã VietQR Động Chuẩn Napas 247:** Tạo mã QR thanh toán chuẩn ngân hàng Việt Nam, nhúng sẵn số tài khoản nhận, số tiền cần chuyển (30% cọc hoặc 100%) và cú pháp nội dung chuyển khoản duy nhất `DS<mã_đơn>`.
+ **Kiến Trúc Webhook Tự Động (Instant Balance Notification):** Máy chủ MB Bank ngay khi biến động số dư sẽ gửi thông báo Webhook về URL máy chủ Backend trong 1 - 3 giây.
+ **Thuật Toán Đối Soát Sao Kê Tự Động (Regex Auto-Reconciliation):** Backend tự động bóc tách cú pháp `DS\d+` từ nội dung sao kê của ngân hàng, khớp mã đơn và gọi thủ tục xác nhận thanh toán thành công mà không cần con người can thiệp.

---

### - Những file xử lý code:
+ **File 1: `qlsanbong_backend/src/config/payos.ts` (Khởi tạo kết nối PayOS SDK)**
  * Dòng 15 – 25: Đọc `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY` từ `.env`.
+ **File 2: `qlsanbong_backend/src/controllers/thanhToanController.ts` (Xử lý giao dịch)**
  * Dòng 128 – 294: Hàm `taoThanhToanPayOS` (sinh mã QR và đếm ngược 10 phút).
  * Dòng 490 – 632: Hàm `xuLyWebhookPayOS` (đối soát regex và chốt tiền).
+ **File 3: `qlsanbong_fontend/src/pages/index.tsx` (Giao diện quét mã QR)**
  * Dòng 1316 – 1383: Hiển thị Modal VietQR MB Bank kèm đồng hồ đếm ngược thanh toán.

---

### - Cách hoạt động:
+ Khách chọn sân -> Hệ thống sinh mã VietQR động chứa số tiền và nội dung `DS150`.
+ Khách mở App Ngân hàng bất kỳ (Vietcombank, Techcombank, MB Bank, Momo...) quét mã và bấm chuyển tiền.
+ Trong 1 - 3 giây, tiền vào tài khoản -> MB Bank bắn Webhook về Backend -> Backend tự động đổi trạng thái đơn sang ĐÃ ĐẶT và hiển thị chúc mừng trên màn hình khách.

---
---

## 6. Công Nghệ Lưu Trữ Đám Mây Đa Phương Tiện (Cloud Media Stack)

### - Công nghệ:
+ **Cloudinary SDK (`cloudinary` v2.11):** Nền tảng điện toán đám mây quản lý và lưu trữ tài nguyên đa phương tiện (Media CDN) hàng đầu thế giới; cung cấp đường truyền CDN tốc độ cao, tối ưu định dạng ảnh thông minh (WebP/AVIF) và video chuẩn H.264.
+ **Cơ Chế Tự Động Dọn Dẹp File Rác (Auto Garbage Collection):**
  * **Khi Chỉnh Sửa:** Tải ảnh/video mới lên -> Tự động trích xuất `public_id` của file cũ trên Cloudinary và gọi hàm xóa file cũ vĩnh viễn, không để lãng phí dung lượng lưu trữ.
  * **Khi Xóa Bảng Ghi:** Xóa sân bóng / tin tức / banner -> File ảnh hoặc video tương ứng trên Cloudinary lập tức bị xóa theo.
+ **Hỗ Trợ Đa Dạng (File Upload & URL Paste):** Chấp nhận cả 2 hình thức: tải file trực tiếp từ máy tính (tối đa 2MB với ảnh jpg/png, 50MB với video) hoặc dán đường link trực tiếp từ bên ngoài.

---

### - Những file xử lý code:
+ **File 1: `qlsanbong_backend/src/config/cloudinary.ts`**
  * Dòng 8 – 15: Khởi tạo cấu hình Cloudinary với `cloud_name`, `api_key`, `api_secret`.
+ **File 2: `qlsanbong_backend/src/controllers/uploadController.ts`**
  * Dòng 20 – 65: Hàm `uploadMediaCloudinary` (tiếp nhận Buffer từ Multer và upload trực tiếp lên Cloudinary qua luồng Stream).
  * Dòng 70 – 110: Hàm `xoaFileCloudinary` (xóa file cũ bằng `cloudinary.uploader.destroy`).
+ **File 3: `qlsanbong_backend/src/controllers/datSanController.ts`**
  * Dòng 280 – 350: Hàm sửa sân bóng & xóa sân bóng (tự động so sánh ảnh cũ, gọi Cloudinary xóa ảnh cũ khi có ảnh mới).

---

### - Cách hoạt động:
+ Người dùng tải ảnh lên ở giao diện Admin Dashboard -> File chuyển thành Buffer trên RAM -> Multer đưa vào luồng `cloudinary.uploader.upload_stream`.
+ Cloudinary lưu trữ trên cụm máy chủ CDN toàn cầu, trả về đường dẫn URL bảo mật `https://res.cloudinary.com/...`.
+ Đường dẫn này được lưu vào SQL Server để hiển thị siêu tốc cho khách hàng trên toàn thế giới.

---
---

## 7. Công Nghệ Bảo Mật & Xác Thực (Security & Auth Stack)

### - Công nghệ:
+ **JSON Web Token (JWT v9.0):** Cơ chế xác thực không trạng thái (Stateless Authentication); mã hóa thông tin người dùng (`id`, `email`, `ma_vai_tro`) thành chuỗi Token ký điện tử với thuật toán HMAC SHA256; thời hạn 7 ngày.
+ **Bcryptjs (v2.4):** Thuật toán băm mật khẩu một chiều mạnh mẽ với kỹ thuật Salt 10 vòng; đảm bảo dù quản trị viên hay hacker có truy cập được CSDL cũng không thể giải mã mật khẩu gốc của người dùng.
+ **Nodemailer (v10.0) & Gmail App Password SMTP:** Dịch vụ gửi thư điện tử bảo mật qua giao thức SMTP cổng 587 của Google; tự động tạo mã OTP số ngẫu nhiên có hiệu lực 5 phút để xác thực đăng ký tài khoản và khôi phục mật khẩu.
+ **Phân Quyền Vai Trò RBAC (Role-Based Access Control):** Phân chia chặt chẽ 3 cấp bậc: `ADMIN` (toàn quyền quản trị), `NHAN_VIEN` (thu ngân POS tại quầy), `KHACH_HANG` (đặt sân và xem lịch sử cá nhân).

---

### - Những file xử lý code:
+ **File 1: `qlsanbong_backend/src/controllers/authController.ts`**
  * Dòng 50 – 120: Đăng ký & sinh mã OTP gửi qua Gmail SMTP bằng Nodemailer.
  * Dòng 130 – 190: Xác thực OTP, băm mật khẩu bằng `bcrypt.hash(password, 10)` và gọi `sp_ThemNguoiDung`.
  * Dòng 200 – 260: Đăng nhập, kiểm tra `bcrypt.compare` và cấp phát JWT Token bằng `jwt.sign()`.
+ **File 2: `qlsanbong_backend/src/middlewares/authMiddleware.ts`**
  * Dòng 15 – 50: Middleware chặn request, kiểm tra header `Authorization: Bearer <token>`, giải mã và gắn thông tin vào `req.user`.

---

### - Cách hoạt động:
+ Khách đăng ký tài khoản -> Nhập Email -> Hệ thống gửi OTP 6 số qua Gmail trong 3 giây.
+ Khách nhập OTP chính xác -> Mật khẩu được băm Bcrypt lưu vào SQL Server.
+ Khi đăng nhập -> Nhận JWT Token lưu vào `localStorage` -> Mọi request sau đó đều mang theo Token này để chứng minh danh tính.

---
---

## 8. Công Nghệ Tài Liệu Hóa API (OpenAPI & Documentation Stack)

### - Công nghệ:
+ **OpenAPI Specification 3.0 (OAS 3.0):** Chuẩn mực tài liệu hóa API số 1 thế giới hiện nay do Linux Foundation bảo trợ; mô tả chi tiết từng Endpoint, Method, Header, Request Body, Response Schema và mã lỗi HTTP.
+ **Swagger UI Express (v5.0):** Dựng giao diện tra cứu API tương tác trực quan tại đường dẫn máy chủ Backend (`/api-docs`).
+ **YAMLjs & Redoc/OpenAPI Viewer:** Tích hợp giao diện tra cứu tài liệu OpenAPI trực tiếp ngay tại Frontend trang chủ (`/openapi` và `/api-docs`), cho phép giảng viên và lập trình viên thử nghiệm gửi API (Try it out) trực tiếp từ trình duyệt.

---

### - Những file xử lý code:
+ **File 1: `qlsanbong_backend/OpenAPI.yaml` & `server.ts` (Tài liệu gốc chuẩn hóa)**
  * Định nghĩa toàn bộ 45+ endpoints của hệ thống Sport247.
  * Tích hợp Swagger UI: `app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))`.
+ **File 2: `qlsanbong_fontend/src/pages/api-docs.tsx` & `src/pages/openapi.tsx`**
  * Dựng trang tra cứu OpenAPI dành riêng cho giảng viên chấm điểm đề tài tốt nghiệp.

---

### - Cách hoạt động:
+ Mọi hàm API viết ra đều được mô tả chuẩn hóa trong file `OpenAPI.yaml`.
+ Bất kỳ ai mở trang tài liệu đều có thể đọc tài liệu, xem cấu trúc dữ liệu và bấm nút "Execute" để kiểm tra API hoạt động thực tế ngay lập tức.

---
---

## 9. Công Nghệ Hạ Tầng Triển Khai & Đám Mây (Cloud Deployment Stack)

### - Công nghệ:
+ **Vercel Cloud Platform:** Nền tảng Edge Network toàn cầu tối ưu tuyệt đối cho ứng dụng Next.js; tự động build và triển khai (CI/CD) mỗi khi sinh viên đẩy code lên nhánh `main` của GitHub; hỗ trợ chứng chỉ bảo mật HTTPS/SSL miễn phí.
+ **Render Cloud PaaS:** Nền tảng máy chủ đám mây triển khai ứng dụng Backend Node.js Express; quản lý biến môi trường an toàn và cung cấp cổng Webhook công khai để nhận tín hiệu từ Ngân hàng MB Bank.
+ **Git & GitHub Enterprise:** Hệ thống quản lý phiên bản phân tán (VCS), theo dõi toàn bộ lịch sử commit, hỗ trợ làm việc nhóm nhịp nhàng giữa 2 thành viên trong đồ án tốt nghiệp.

---
---
---

# PHẦN II: BẢN CHI TIẾT ĐẦY ĐỦ (DÀNH CHO VẤN ĐÁP KỸ THUẬT & TRẢ LỜI CÂU HỎI HỘI ĐỒNG)

---

## 1. Bảng Tổng Hợp Chi Tiết Tất Cả Thư Viện (Dependencies) Của Dự Án

### 1.1. Phía Giao Diện Khách Hàng (Frontend - `qlsanbong_fontend`)

| Tên Thư Viện / Package | Phiên Bản | Mục Đích Sử Dụng Trong Dự Án Sport247 |
| :--- | :--- | :--- |
| **`next`** | `16.3.6` | Framework cốt lõi, cung cấp kiến trúc Pages Router, SSR, SSG, tối ưu hình ảnh và biên dịch Turbopack. |
| **`react`** & **`react-dom`** | `19.2.8` | Thư viện giao diện người dùng mới nhất, tối ưu việc render DOM, hỗ trợ Hooks hiện đại (`useMemo`, `useCallback`). |
| **`typescript`** | `^5.0.0` | Cung cấp ngôn ngữ lập trình có kiểu dữ liệu tĩnh (Type Safety), ngăn chặn lỗi undefined lúc chạy ứng dụng. |
| **`tailwindcss`** | `^4.0.0` | Thư viện CSS tiện ích thế hệ mới, hỗ trợ Dark Mode tùy chỉnh `@custom-variant dark` cực kỳ mượt mà. |
| **`socket.io-client`** | `^4.8.4` | Kết nối WebSocket với Backend, đồng bộ tức thời trạng thái ma trận sân bóng và tín hiệu nhận tiền. |
| **`lucide-react`** | `^1.48.0` | Bộ sưu tập hơn 1000 biểu tượng SVG hiện đại, đồng bộ phong cách thể thao cho trang web. |
| **`leaflet`** & **`@types/leaflet`** | `^1.9.4` | Hiển thị bản đồ tương tác định vị sân bóng tại trang Liên Hệ mà không tốn phí Google Maps. |
| **`js-yaml`** | `^5.5.0` | Đọc và phân tích file cấu hình OpenAPI `.yaml` thành JavaScript Object để dựng trang tài liệu API. |

---

### 1.2. Phía Máy Chủ & Dịch Vụ (Backend - `qlsanbong_backend`)

| Tên Thư Viện / Package | Phiên Bản | Mục Đích Sử Dụng Trong Dự Án Sport247 |
| :--- | :--- | :--- |
| **`express`** | `^4.19.2` | Framework nền tảng xây dựng máy chủ RESTful API và quản lý các Middleware xử lý request. |
| **`mssql`** | `^10.0.4` | Driver kết nối chính thức giữa Node.js và Microsoft SQL Server, quản lý Connection Pooling tự động. |
| **`socket.io`** | `^4.8.4` | Máy chủ WebSocket thời gian thực, quản lý kênh truyền tin và bộ nhớ đệm giữ chỗ trên RAM. |
| **`@payos/node`** | `^2.0.5` | SDK kết nối Cổng thanh toán Open Banking MB Bank, sinh mã VietQR Napas 247 động theo đơn. |
| **`cloudinary`** | `^2.11.0` | SDK lưu trữ đám mây CDN cho ảnh sân, banner, video; tự động dọn dẹp file cũ khi cập nhật. |
| **`jsonwebtoken`** | `^9.0.2` | Tạo và xác thực mã Token JWT trong cơ chế đăng nhập bảo mật phân quyền (RBAC). |
| **`bcryptjs`** | `^2.4.3` | Thuật toán băm mật khẩu một chiều với Salt 10 vòng, bảo vệ an toàn tuyệt đối mật khẩu người dùng. |
| **`nodemailer`** | `^10.0.15`| Gửi mã OTP xác thực đăng ký tài khoản qua giao thức Gmail SMTP bảo mật. |
| **`multer`** | `^2.4.0` | Tiếp nhận file upload từ Client dưới dạng Buffer RAM trước khi truyền tiếp lên Cloudinary. |
| **`compression`** | `^1.8.2` | Tự động nén dữ liệu HTTP phản hồi (Gzip/Deflate) giúp giảm 70% dung lượng truyền tải mạng. |
| **`cors`** | `^2.8.5` | Cấu hình bảo mật Cross-Origin Resource Sharing, chống tấn công từ các website lạ. |
| **`dotenv`** | `^16.4.5` | Quản lý các biến môi trường và khóa bí mật nhạy cảm trong file `.env`. |
| **`swagger-ui-express`** & **`yamljs`** | `^5.0.1` | Tự động sinh giao diện tra cứu và kiểm thử tài liệu OpenAPI 3.0 trực tiếp từ file YAML. |
| **`tsx`** | `^4.23.15`| Trình thực thi TypeScript trực tiếp với tính năng Hot-Reload cực nhanh trong môi trường phát triển. |

---

## 2. Vì Sao Dự Án Lại Lựa Chọn Các Công Nghệ Này? (Lý Do Kỹ Thuật Đạt Điểm Tuyệt Đối)

### 2.1. Vì sao chọn Next.js 16 (React 19) thay vì Create-React-App hay Vite thông thường?
1. **Tối ưu hóa SEO (Search Engine Optimization):** Sân bóng cần được tìm thấy trên Google khi khách gõ "đặt sân bóng gần đây". Next.js hỗ trợ SSR/SSG giúp bot tìm kiếm đọc được nội dung HTML đầy đủ, trong khi React thông thường (CSR) chỉ trả về một thẻ `<div id="root"></div>` rỗng.
2. **Hiệu năng vượt bậc với Turbopack:** Next.js 16 tích hợp trình đóng gói Turbopack viết bằng ngôn ngữ Rust, nhanh gấp 10 lần so với Webpack truyền thống, giúp việc build và nạp trang diễn ra tức thì.
3. **Cấu trúc Pages Router rõ ràng:** Quản lý trang theo cấu trúc thư mục tự nhiên (`/Dashboard`, `/management-system`, `/lien-he`), dễ bảo trì và mở rộng trong tương lai.

### 2.2. Vì sao dùng 100% Stored Procedures trong SQL Server thay vì dùng ORM (Prisma / TypeORM)?
1. **Hiệu năng truy vấn tối thượng:** Stored Procedure được máy chủ SQL Server phân tích cú pháp và lưu sẵn Kế hoạch thực thi (Execution Plan) trong bộ nhớ đệm, nhanh hơn vượt trội so với ORM phải tự động sinh câu lệnh SQL phức tạp và cồng kềnh lúc runtime.
2. **An toàn tuyệt đối trước SQL Injection:** Tham số truyền vào Stored Procedure luôn được coi là dữ liệu thuần túy (Literals), không bao giờ có thể trở thành mã lệnh thực thi, triệt tiêu 100% lỗ hổng bảo mật tiêm mã độc.
3. **Độc lập nghiệp vụ giữa Database và Code:** Khi cần điều chỉnh logic giá sân, xử lý đơn quá hạn hay thay đổi trạng thái, chỉ cần sửa Procedure trên Database mà không cần phải dừng máy chủ Backend để build lại mã nguồn.

### 2.3. Vì sao chọn giải pháp PayOS VietQR MB Bank thay vì VNPAY hay MoMo truyền thống?
1. **Trải nghiệm người dùng 0 bước trung gian:** VNPAY hoặc MoMo bắt buộc khách phải chuyển hướng sang cổng thanh toán của bên thứ 3 hoặc cài ứng dụng MoMo. Trong khi PayOS tạo mã VietQR Napas 247 chuẩn quốc gia, khách hàng dùng **bất kỳ App ngân hàng nào tại Việt Nam** cũng quét được ngay trên màn hình.
2. **Chi phí 0 đồng:** Không tốn phí duy trì cổng thanh toán hàng tháng và không mất % hoa hồng đắt đỏ như các cổng thanh toán cũ.
3. **Webhook tự động tốc độ cao:** Tiền vừa vào tài khoản ngân hàng của chủ sân là hệ thống nhận được Webhook ngay trong 1 - 3 giây, tự động kích hoạt chốt sân cho khách.

### 2.4. Vì sao dùng Socket.IO kết hợp bộ nhớ RAM để chống Race Condition?
1. **Giải quyết bài toán 2 người cùng click 1 sân tại 1 thời điểm:** Nếu dùng cách truyền thống ghi xuống CSDL, thời gian đọc ghi ổ cứng mất từ 100ms - 300ms, rất dễ xảy ra tình trạng cả 2 người cùng bấm đặt được 1 sân.
2. **Khóa slot trên RAM (Microseconds):** Thao tác đọc ghi vào `Map()` trên RAM chỉ mất chưa đến 0.001 mili-giây. Ngay khi khách A chạm vào ô, socket phát lệnh khóa trên RAM, khách B lập tức thấy ô chuyển sang màu CAM giữ chỗ và không thể click vào được nữa.

---

## 3. Bộ Câu Hỏi Vấn Đáp Về Công Nghệ & Câu Trả Lời Mẫu Xuất Sắc

### Câu 1: Em hãy giải thích mô hình kiến trúc tổng thể của hệ thống?
* **Trả lời:**  
  "Dạ thưa Thầy/Cô, hệ thống của nhóm em được xây dựng theo **mô hình kiến trúc 3 tầng (3-Tier Architecture) hiện đại kết hợp cơ chế Event-Driven thời gian thực**:
  - **Tầng 1 (Presentation Layer - Frontend):** Được xây dựng bằng Next.js 16, React 19, TypeScript và Tailwind CSS v4, đảm nhiệm việc hiển thị giao diện ma trận lịch sân trực quan, bảng điều khiển quản trị Dashboard và giao diện bán hàng tại quầy POS.
  - **Tầng 2 (Application / Business Logic Layer - Backend):** Được xây dựng bằng Node.js và Express.js, đảm nhận việc tiếp nhận yêu cầu RESTful API, quản lý kết nối thời gian thực bằng Socket.IO Server, tiếp nhận thông báo Webhook từ ngân hàng MB Bank và điều phối luồng upload đa phương tiện lên Cloudinary.
  - **Tầng 3 (Data Layer - Database):** Sử dụng hệ quản trị Microsoft SQL Server 2022, đóng gói 100% logic xử lý dữ liệu và kiểm soát giao dịch ACID bằng Stored Procedures, được chia tách chuyên nghiệp thành 2 file: `QuanLySanBong.sql` chứa cấu trúc bảng dữ liệu và `ThuTuc.sql` chứa toàn bộ thủ tục lưu trữ."

---

### Câu 2: Trong dự án, Socket.IO đóng vai trò gì và nếu mất mạng thì hệ thống xử lý như thế nào?
* **Trả lời:**  
  "Dạ thưa Thầy/Cô, Socket.IO đóng vai trò là **huyết mạch đồng bộ thời gian thực** của dự án:
  - Nó đồng bộ trạng thái giữ chỗ các ô slot trên RAM giữa hàng ngàn người dùng cùng lúc để chống trùng lịch (Race Condition).
  - Nó chuyển tiếp tín hiệu thanh toán thành công từ Webhook ngân hàng đến màn hình khách hàng và máy POS thu ngân tức thì.
  - **Về cơ chế xử lý mất kết nối (Resilience):**
    + Khi người dùng bị ngắt mạng hoặc tắt trình duyệt, sự kiện `socket.on('disconnect')` trên máy chủ sẽ tự động kích hoạt: quét sạch mọi ô slot mà socket đó đang giữ trong bộ nhớ RAM và broadcast trả lại trạng thái ô trống màu xanh cho toàn mạng.
    + Phía Client, nhóm em xây dựng cơ chế **đồng bộ kép (Fallback Mechanism)**: cứ mỗi 5 giây hoặc khi người dùng quay lại tab trình duyệt (`window.focus`), hệ thống sẽ tự động gọi API làm mới lại ma trận sân bóng để đảm bảo dữ liệu luôn chính xác 100% ngay cả khi mạng chập chờn."

---

### Câu 3: Làm thế nào hệ thống biết được khách hàng đã chuyển tiền thành công mà không cần nhân viên bấm duyệt tay?
* **Trả lời:**  
  "Dạ thưa Thầy/Cô, hệ thống thực hiện được việc này nhờ **Kiến trúc Webhook tự động kết hợp Thuật toán đối soát Regex**:
  1. Khi khách chọn đặt sân, Backend tạo đơn tạm trong CSDL với mã số cụ thể (ví dụ ID: `150`) và gọi PayOS SDK sinh mã VietQR MB Bank có gắn sẵn nội dung chuyển khoản mã hóa là `DS150`.
  2. Khách hàng dùng bất kỳ ứng dụng ngân hàng nào quét mã và chuyển tiền.
  3. Ngay khi tài khoản MB Bank nhận được tiền, dịch vụ Open Banking của PayOS sẽ tự động bắn một gói tin HTTP POST Webhook chứa thông tin biến động số dư về máy chủ Backend của hệ thống trong vòng 1 - 3 giây.
  4. Backend tiếp nhận Webhook, dùng biểu thức chính quy (Regex) bóc tách lấy mã đơn `150` từ nội dung chuyển khoản, kiểm tra đúng số tiền và thực thi Stored Procedure `sp_ThanhToanDon` để chốt đơn thành công.
  5. Đồng thời, Backend phát sự kiện Socket.IO `payment_success` về Client để giao diện tự động hiện màn hình chúc mừng mà nhân viên không cần phải đối soát thủ công."

---

### Câu 4: Vì sao nhóm lại dùng Stored Procedure cho 100% nghiệp vụ CSDL mà không viết câu lệnh SELECT / INSERT trực tiếp trong code Backend?
* **Trả lời:**  
  "Dạ thưa Thầy/Cô, nhóm em quyết định sử dụng 100% Stored Procedure vì **3 lý do kỹ thuật cốt lõi**:
  1. **Hiệu năng (Performance):** Stored Procedure được SQL Server biên dịch sẵn kế hoạch thực thi (Execution Plan) trên RAM của máy chủ CSDL, nên tốc độ chạy nhanh hơn đáng kể so với việc gửi câu lệnh truy vấn thô từ Node.js.
  2. **Bảo mật tuyệt đối (Security):** Toàn bộ tham số truyền vào Stored Procedure được xử lý bằng cơ chế Parameterized Queries, triệt tiêu 100% nguy cơ tấn công SQL Injection.
  3. **Độc lập và bảo trì nghiệp vụ (Maintainability):** Mã nguồn Backend chỉ gọi tên thủ tục và nhận kết quả JSON. Khi giảng viên hoặc chủ sân bóng muốn thay đổi logic tính giá sân, giải phóng đơn quá hạn (như thủ tục `sp_DongBoTrangThaiDonDatSan` vừa rồi), nhóm chỉ cần cập nhật file `ThuTuc.sql` mà không cần phải dừng server để build lại toàn bộ Backend."

---

### Câu 5: Chức năng upload ảnh và video hoạt động ra sao và file rác được xử lý như thế nào?
* **Trả lời:**  
  "Dạ thưa Thầy/Cô, chức năng upload được thiết kế theo **mô hình Memory Buffer kết hợp Cloudinary Media CDN**:
  - Khi người dùng tải ảnh hoặc video từ máy tính, thư viện `Multer` tiếp nhận file dưới dạng Buffer trực tiếp trên thanh RAM của máy chủ, sau đó dùng `upload_stream` đẩy thẳng lên đám mây Cloudinary mà không ghi file rác tạm bợ xuống ổ cứng máy chủ.
  - **Cơ chế dọn dẹp file cũ tự động:** Khi người quản trị chỉnh sửa sân bóng hoặc tin tức mà chọn ảnh mới, hàm `update` ở Backend sẽ tự động lấy `public_id` của ảnh cũ và gọi lệnh `cloudinary.uploader.destroy()` để xóa sạch ảnh cũ trên đám mây, đảm bảo không bao giờ tồn tại file rác và tiết kiệm tối đa dung lượng lưu trữ."

---

### Câu 6: Dự án của nhóm được triển khai lên môi trường thực tế (Production Deployment) như thế nào?
* **Trả lời:**  
  "Dạ thưa Thầy/Cô, dự án của nhóm em đã được triển khai hoàn chỉnh lên môi trường trực tuyến với **mô hình phân tán đám mây đa nền tảng (Multi-Cloud Deployment)**:
  - **Frontend Next.js:** Được triển khai trên nền tảng **Vercel** tại tên miền chính thức, kết nối trực tiếp với GitHub Repository để tự động kích hoạt luồng CI/CD mỗi khi có commit mới.
  - **Backend Node.js API:** Được triển khai trên nền tảng **Render Cloud PaaS**, cung cấp đường dẫn HTTPS công khai để lắng nghe Webhook ngân hàng và máy chủ WebSocket.
  - **Cơ sở dữ liệu:** Hệ thống CSDL Microsoft SQL Server 2022 được cài đặt chuẩn mực, phục vụ đầy đủ dữ liệu nghiệp vụ của toàn bộ dự án.
  - **Tài nguyên Media:** Toàn bộ hình ảnh sân bóng, banner và video đều được phục vụ qua hệ thống phân phối nội dung toàn cầu **Cloudinary CDN** với tốc độ tải trang dưới 1 giây."
