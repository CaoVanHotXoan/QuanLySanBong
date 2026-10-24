# 📁 1. BACKEND (`qlsanbong_backend`)

### File gốc:
* **`server.ts`**: Code khởi chạy máy chủ Express, cấu hình middleware (CORS, nén dữ liệu) và xử lý sự kiện Socket.IO thời gian thực (khóa/mở ô slot sân, broadcast thanh toán).
* **`OpenAPI.yaml`**: Code đặc tả toàn bộ tài liệu API chuẩn OpenAPI 3.0 (các đường dẫn, tham số, dữ liệu trả về).

### Thư mục `src/config/`:
* **`db.ts`**: Code kết nối CSDL SQL Server 2022 và hàm thực thi các Stored Procedure.
* **`payos.ts`**: Code cấu hình SDK cổng thanh toán PayOS để tạo mã VietQR và xác thực Webhook.
* **`cloudinary.ts`**: Code cấu hình SDK Cloudinary để lưu trữ ảnh đám mây.

### Thư mục `src/middlewares/`:
* **`authMiddleware.ts`**: Code giải mã JWT token và kiểm tra quyền hạn người dùng (Khách hàng, Nhân viên, Admin).
* **`captchaGuard.ts`**: Code giới hạn tần suất gửi yêu cầu (Rate limiting) để chống spam và tấn công brute-force.

### Thư mục `src/routes/` (Khai báo URL API):
* **`authRoutes.ts`**: Code định nghĩa các link API đăng ký, đăng nhập, quên mật khẩu, OTP, đổi mật khẩu.
* **`datSanRoutes.ts`**: Code định nghĩa các link API xem sân, xem lịch theo ngày, đặt sân, check-in, hủy sân.
* **`dichVuRoutes.ts`**: Code định nghĩa các link API danh mục dịch vụ, nhập kho, thêm dịch vụ vào đơn.
* **`thanhToanRoutes.ts`**: Code định nghĩa các link API tạo mã QR thanh toán, Webhook ngân hàng, tiền mặt, hoàn tiền.
* **`baoCaoRoutes.ts`**: Code định nghĩa các link API lấy số liệu doanh thu, tỷ lệ lấp đầy sân, top khách hàng.
* **`uploadRoutes.ts`**: Code định nghĩa link API tải ảnh lên hệ thống.
* **`contentRoutes.ts`**: Code định nghĩa các link API quản lý tin tức, banner, thông tin giới thiệu, form liên hệ.

### Thư mục `src/controllers/` (Xử lý nghiệp vụ chính):
* **`authController.ts`**: Code xử lý đăng nhập, đăng ký, băm mật khẩu `bcrypt`, cấp phát JWT token, tạo mã OTP.
* **`datSanController.ts`**: Code xử lý kiểm tra trùng lịch sân, gọi thủ tục đặt sân, hủy sân, cập nhật trạng thái đơn.
* **`dichVuController.ts`**: Code xử lý CRUD dịch vụ, thêm đồ uống/dụng cụ vào sân đang đá, lưu phiếu nhập kho.
* **`thanhToanController.ts`**: Code tạo link thanh toán VietQR PayOS, xử lý callback khi khách chuyển khoản thành công.
* **`baoCaoController.ts`**: Code tổng hợp số liệu doanh thu, lượt đặt sân và tỷ lệ lấp đầy để gửi về Dashboard.
* **`uploadController.ts`**: Code nhận file ảnh từ client gửi lên Cloudinary và xóa ảnh cũ khi cập nhật.
* **`contentController.ts`**: Code thêm/sửa/xóa bài viết tin tức, slide banner, thông tin About Us và hòm thư liên hệ.

### Thư mục `src/services/`:
* **`emailService.ts`**: Code soạn và gửi email tự động qua Nodemailer (email hóa đơn đặt sân, email mã OTP).
* **`businessLogic.ts`**: Code thuật toán tính tiền sân theo phút và phụ thu theo khung giờ.
* **`cacheService.ts`**: Code lưu tạm dữ liệu trên RAM để giảm tải truy vấn lặp lại vào CSDL.
* **`authService.ts`, `datSanService.ts`, `dichVuService.ts`, `thanhToanService.ts`, `baoCaoService.ts`, `uploadService.ts`**: Code gọi các Stored Procedure từ SQL Server tương ứng với từng chức năng.

---

# 💻 2. FRONTEND (`qlsanbong_fontend`)

### Thư mục `src/pages/` (Các màn hình giao diện):
* **`index.tsx`**: Code trang chủ khách hàng — xem danh sách sân, bảng lưới chọn giờ đá thời gian thực, đặt sân và quét mã VietQR.
* **`Dashboard.tsx`**: Code trang quản trị Admin — biểu đồ doanh thu, quản lý sân, bảng giá giờ vàng, dịch vụ, kho hàng, tài khoản người dùng, CMS tin tức/banner.
* **`management-system.tsx`**: Code màn hình POS vận hành quầy — radar theo dõi sân đang đá, đồng hồ đếm giờ, đổi sân, bán nước, máy tính tiền mặt thối lại.
* **`history.tsx`**: Code trang xem lại lịch sử các đơn đã đặt của khách, xem hóa đơn và gửi yêu cầu hủy đơn.
* **`profile.tsx`**: Code trang xem/sửa thông tin cá nhân, đổi ảnh đại diện và đổi mật khẩu.
* **`about-us.tsx`**: Code trang giới thiệu trung tâm bóng đá và bản đồ chỉ đường Leaflet.
* **`tin-tuc.tsx`**: Code trang đọc tin tức thể thao, bài viết khuyến mãi và giải đấu.
* **`lien-he.tsx`**: Code trang gửi form liên hệ, khiếu nại, góp ý.
* **`Login/login.tsx`**: Code giao diện form đăng nhập, đăng ký tài khoản và quên mật khẩu bằng OTP.
* **`_app.tsx`**: Code thiết lập giao diện gốc, font chữ, nạp theme Sáng/Tối cho toàn bộ web.
* **`api-docs.tsx` / `openapi.tsx`**: Code nhúng giao diện xem tài liệu Swagger API Docs trực tiếp trên web.

### Thư mục `src/components/` (Các thành phần dùng chung):
* **`HeaderNav.tsx`**: Code thanh menu trên cùng, logo, nút chuyển Dark/Light mode và menu phân quyền theo vai trò.
* **`Footer.tsx`**: Code chân trang hiển thị thông tin liên hệ, hotline, địa chỉ sân.
* **`DateNavigationBar.tsx`**: Code thanh chọn ngày trượt (Hôm nay, ngày mai, các ngày trong tuần).
* **`DongNaiMap.tsx`**: Code hiển thị bản đồ số Leaflet định vị vị trí sân bóng.
* **`SoccerLoader.tsx`**: Code hoạt ảnh quả bóng xoay khi chờ tải dữ liệu.
* **`SwaggerApiDocs.tsx`**: Code hiển thị giao diện tương tác API Swagger từ file YAML.

### Thư mục `src/hooks/`:
* **`useAppTheme.ts`**: Code lưu và chuyển đổi chế độ giao diện Sáng / Tối (Dark / Light mode).
* **`useBookingSync.ts`**: Code đồng bộ dữ liệu đơn đặt sân giữa các tab trình duyệt bằng localStorage.

### Thư mục `src/services/` (Code gọi API về Backend):
* **`apiClient.ts`**: Code cấu hình fetch API và tự động đính kèm token đăng nhập (`Bearer token`).
* **`authService.ts`**: Code gửi yêu cầu đăng nhập, đăng ký, quên mật khẩu tới backend.
* **`datSanService.ts`**: Code gửi yêu cầu lấy lịch sân, đặt sân, hủy sân tới backend.
* **`dichVuService.ts`**: Code gửi yêu cầu lấy danh sách dịch vụ, nhập kho tới backend.
* **`thanhToanService.ts`**: Code gửi yêu cầu tạo mã thanh toán QR, thanh toán tiền mặt tới backend.
* **`baoCaoService.ts`**: Code gửi yêu cầu lấy dữ liệu báo cáo thống kê doanh thu tới backend.
* **`contentService.ts`**: Code gửi yêu cầu lấy/sửa banner, tin tức, giới thiệu, liên hệ tới backend.
* **`uploadService.ts`**: Code gửi file ảnh lên API backend để đẩy lên Cloudinary.

### Thư mục `src/utils/` & `src/styles/`:
* **`apiConfig.ts`**: Code chứa các biến cấu hình đường dẫn API URL và Socket URL.
* **`imageHelper.ts`**: Code xử lý link ảnh và hiển thị ảnh mặc định khi link ảnh lỗi.
* **`globals.css`, `login.css`, `history.css`, `profile.css`**: Code định kiểu màu sắc, bố cục và hiệu ứng CSS cho các trang tương ứ
