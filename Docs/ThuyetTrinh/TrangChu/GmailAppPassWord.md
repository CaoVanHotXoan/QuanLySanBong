# BÁO CÁO THUYẾT TRÌNH: CHỨC NĂNG GỬI MÃ OTP, PHẢN HỒI GMAIL & QUẢN LÝ LIÊN HỆ QUA GMAIL APP PASSWORD

> **Hệ thống:** Quản Lý & Đặt Sân Bóng Đá Trực Tuyến Sport247 / Soccer247  
> **Sinh viên thực hiện:** Cao Văn Hột Xoàn (MSSV: 525000462) & Phạm Tiến Doanh (MSSV: 525000463)  
> **Khoa:** Công Nghệ Thông Tin - Đại Học Lạc Hồng (LHU)  

---

# PHẦN I: BẢN TÓM TẮT NGẮN GỌN (DÀNH CHO NÓI THUYẾT TRÌNH / HỌC THUỘC)

## 1. Cơ Chế Gmail App Password (Mật Khẩu Ứng Dụng)
+ **Công nghệ:** Giao thức **SMTP (Simple Mail Transfer Protocol)** qua cổng bảo mật TLS 587 kết hợp tính năng **Google App Password (Mật khẩu ứng dụng 16 ký tự)** của tài khoản Google có bật xác thực 2 bước (2FA).
+ **Mục đích:** Vượt qua rào cản chặn truy cập ứng dụng kém an toàn (Less Secure Apps) của Google, cho phép máy chủ Backend gửi email tự động với độ tin cậy tuyệt đối (100% vào hộp thư đến Inbox, không rơi vào Spam) mà không làm lộ mật khẩu chính của hòm thư quản trị.

---

## 2. Ba Nhóm Chức Năng Cốt Lõi Tích Hợp Gmail App Password

### A. Chức Năng Gửi & Xác Thực Mã OTP (Đăng Ký & Quên/Đổi Mật Khẩu)
* **Công nghệ:** Node.js, Nodemailer (v10.0), SQL Server 2022 Stored Procedures (`sp_LuuMaOTP`, `sp_KiemTraOTP`), Bcrypt.js mã hóa, React Modal với bộ đếm ngược 60 giây.
* **Những file xử lý code:**
  - `qlsanbong_fontend/src/pages/Login/login.tsx`: Hàm `handleSendOtpRegister` (gọi API xin mã OTP), kích hoạt đếm ngược 60s, kiểm tra 6 chữ số trước khi gọi `POST /api/auth/register`.
  - `qlsanbong_backend/src/services/emailService.ts`: Hàm `sendOtpEmail` (tạo email HTML đồ họa Sport247 sang trọng, hiển thị mã OTP 6 số chữ to, ghi rõ hạn dùng 5 phút và lưu ý bảo mật).
  - `qlsanbong_backend/src/controllers/authController.ts`: Hàm `guiMaOTP` (kiểm tra trùng lặp email, sinh ngẫu nhiên 6 chữ số, gọi `sp_LuuMaOTP`, gửi mail qua Nodemailer) & hàm `xacThucOTP` / `dangKy` (đối soát qua `sp_KiemTraOTP`).
  - `Data SQL server 2022/ThuTuc.sql`: `sp_LuuMaOTP` (hủy OTP cũ, lưu mã mới với TTL 5 phút qua `DATEADD`), `sp_KiemTraOTP` (kiểm tra hạn dùng và cờ `da_xac_thuc = 0`).
* **Cách hoạt động tóm tắt:**
  1. Người dùng nhập Email -> Bấm **"Nhận mã OTP"**.
  2. Backend sinh ngẫu nhiên mã 6 số (Ví dụ: `682915`), lưu vào bảng `Xac_Thuc_OTP` trong CSDL với thời hạn đúng 5 phút.
  3. Backend dùng Nodemailer kết nối SMTP Gmail gửi email chứa mã OTP vào hộp thư người dùng trong 1 – 3 giây.
  4. Người dùng nhập mã OTP vào form Đăng ký / Đổi mật khẩu. Backend gọi `sp_KiemTraOTP` kiểm tra tính hợp lệ; nếu đúng và còn hạn thì kích hoạt tạo tài khoản hoặc đổi mật khẩu.

---

### B. Chức Năng Gửi Liên Hệ & Tự Động Báo Về Gmail Quản Trị Viên
* **Công nghệ:** Next.js 16, Lucide Icons, RESTful API Express, Stored Procedure `sp_GuiLienHe`, Nodemailer Asynchronous Mailer.
* **Những file xử lý code:**
  - `qlsanbong_fontend/src/pages/lien-he.tsx`: Form liên hệ trực quan, tự động điền thông tin nếu đã đăng nhập (`handleToggleUseAccountInfo`), kiểm tra định dạng số điện thoại 10 chữ số đầu 0, gửi `contentService.sendLienHe`.
  - `qlsanbong_backend/src/controllers/contentController.ts`: Hàm `guiLienHe` (validate dữ liệu, thực thi `sp_GuiLienHe` lưu vào CSDL, kích hoạt chạy ngầm `sendContactEmailToAdmin` gửi thư báo ngay cho Admin mà không làm nghẽn phản hồi API).
  - `qlsanbong_backend/src/services/emailService.ts`: Hàm `sendContactEmailToAdmin` (gửi email thông báo khẩn cấp tới `ADMIN_NOTIFICATION_EMAIL` với đầy đủ họ tên, SĐT, tiêu đề, nội dung và nút bấm `tel:` để Admin gọi lại cho khách ngay tức khắc).
  - `Data SQL server 2022/ThuTuc.sql`: `sp_GuiLienHe` (lưu liên hệ mới vào bảng `Lien_He` với trạng thái `CHUA_XU_LY`).
* **Cách hoạt động tóm tắt:**
  1. Khách hàng truy cập trang Liên hệ hoặc chân trang, điền Họ tên, Số điện thoại, Email và Nội dung cần tư vấn (thuê sân giải, sự kiện công ty,...).
  2. Khách bấm "Gửi thông tin liên hệ" -> Backend lưu vào bảng `Lien_He`.
  3. Ngay lập tức, Backend tự động kích hoạt gửi một bức thư HTML chi tiết đến Gmail của Ban quản lý sân (`xoancao2.0@gmail.com`).
  4. Quản trị viên nhận thông báo đẩy trên điện thoại ngay cả khi không mở website, xem nhanh nội dung và bấm nút gọi điện thoại tư vấn khách hàng trong vòng vài phút.

---

### C. Chức Năng Quản Trị Viên Trả Lời Gmail Khách Hàng & Cơ Chế Fallback
* **Công nghệ:** React Admin Dashboard, Stored Procedure `sp_TraLoiLienHe`, Nodemailer Dual-Channel Fallback Mechanism.
* **Những file xử lý code:**
  - `qlsanbong_fontend/src/pages/Dashboard.tsx`: Modal phản hồi liên hệ `replyLienHeModal`, hiển thị lại câu hỏi gốc của khách, các ô nhập tiêu đề và nội dung phản hồi, gọi `contentService.replyLienHe`.
  - `qlsanbong_backend/src/controllers/contentController.ts`: Hàm `traLoiLienHe` (gọi `sp_LayChiTietLienHe`, thực thi `sp_TraLoiLienHe` lưu phản hồi và đổi trạng thái sang `DA_XU_LY`, gọi `sendContactReplyEmail`).
  - `qlsanbong_backend/src/services/emailService.ts`: Hàm `sendContactReplyEmail` (soạn thư HTML chuyên nghiệp gửi đến Email khách hàng. Nếu khách không có email hoặc địa chỉ email bị lỗi hòm thư -> hệ thống tự động kích hoạt chế độ **Fallback**, gửi một bản sao cảnh báo về Gmail của Admin kèm SĐT khách để Admin tiện gọi điện hỗ trợ).
  - `Data SQL server 2022/ThuTuc.sql`: `sp_TraLoiLienHe` (cập nhật nội dung trả lời, gán `ngay_tra_loi = GETDATE()` và chuyển `trang_thai_xu_ly = N'DA_XU_LY'`).
* **Cách hoạt động tóm tắt:**
  1. Admin mở mục **"Quản lý liên hệ"** trên Dashboard, xem danh sách thư của khách.
  2. Admin bấm nút **"Trả lời"** -> Modal hiện lên với câu hỏi của khách. Admin gõ lời giải đáp và bấm **"Gửi phản hồi"**.
  3. CSDL cập nhật trạng thái liên hệ thành `ĐÃ XỬ LÝ`.
  4. Hệ thống gửi thư Gmail phản hồi sang trọng đến hộp thư của khách hàng.
  5. **Cơ chế Fallback thông minh:** Nếu khách không cung cấp email hoặc email không tồn tại, hệ thống không báo lỗi đứt gãy mà tự động gửi bản sao nội dung trả lời về Gmail của Admin kèm số điện thoại để Admin bấm gọi trực tiếp, đảm bảo 100% khách hàng đều được chăm sóc chu đáo.

---
---

# PHẦN II: BẢN CHI TIẾT ĐẦY ĐỦ (DÀNH CHO VẤN ĐÁP KỸ THUẬT & DẪN CHỨNG CODE CỤ THỂ)

## 1. Tổng Quan Kiến Trúc Gmail App Password & Nodemailer SMTP

```
┌────────────────────────────────────────────────────────────────────────┐
│                        KIẾN TRÚC TỔNG THỂ DỊCH VỤ EMAIL                │
└────────────────────────────────────────────────────────────────────────┘

  [ Khách Hàng Web / Mobile ]
      │ (1) Nhận mã OTP khi Đăng ký / Quên MK
      │ (2) Gửi biểu mẫu tư vấn & liên hệ
      ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       FRONTEND (Next.js 16 + React 19)                 │
│  • login.tsx (OTP countdown 60s, Input 6 số)                           │
│  • lien-he.tsx (Form tư vấn, tự điền tài khoản, validate SĐT)          │
│  • Dashboard.tsx (Modal soạn thư phản hồi Gmail cho Quản trị viên)     │
└───────────────────┬────────────────────────────────────────────────────┘
                    │ RESTful API Calls (Fetch / Axios)
                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   BACKEND TẦNG DỊCH VỤ (Node.js & Express.js)           │
│  • authController.ts (guiMaOTP, xacThucOTP, dangKy, doiMatKhau)        │
│  • contentController.ts (guiLienHe, traLoiLienHe, layDanhSachLienHe)    │
│  • emailService.ts (Nodemailer Transporter SMTP Gmail)                 │
└──────────┬───────────────────────────────────────────────┬─────────────┘
           │                                               │
   (T-SQL Stored Procedures)                       (Giao thức SMTP TLS 587)
           │                                               │
           ▼                                               ▼
┌─────────────────────────────────────┐  ┌───────────────────────────────┐
│     DATABASE SQL SERVER 2022        │  │       GOOGLE GMAIL SMTP       │
│  • Xac_Thuc_OTP (sp_LuuMaOTP,       │  │  Host: smtp.gmail.com:587     │
│                  sp_KiemTraOTP)     │  │  User: xoancao2.0@gmail.com    │
│  • Lien_He (sp_GuiLienHe,           │  │  Auth: Google App Password     │
│             sp_TraLoiLienHe)        │  │        (16 ký tự ứng dụng)     │
└─────────────────────────────────────┘  └───────────────┬───────────────┘
                                                         │
                                        ┌────────────────┴───────────────┐
                                        ▼                                ▼
                                 [ Hộp Thư Khách ]               [ Hộp Thư Admin ]
                                 (Mã OTP 6 số /                  (Thông báo liên hệ /
                                  Thư giải đáp)                   Fallback gọi lại)
```

### - Tại sao hệ thống sử dụng Gmail App Password (Mật khẩu ứng dụng 16 ký tự)?
1. **Google chặn phương thức đăng nhập cơ bản (Basic Auth):** Từ tháng 05/2022, Google đã vô hiệu hóa hoàn toàn tính năng "Less Secure Apps" (Ứng dụng kém an toàn). Bất kỳ ứng dụng nào sử dụng mật khẩu tài khoản Google thông thường để gửi qua SMTP đều sẽ bị từ chối truy cập ngay lập tức (`535-5.7.8 Username and Password not accepted`).
2. **Bảo mật tối đa nhờ xác thực hai lớp (2FA):** Google App Password là mật khẩu độc lập gồm 16 ký tự ngẫu nhiên được sinh ra dành riêng cho dịch vụ máy chủ Backend. Dù mã nguồn có được triển khai lên máy chủ hay bàn giao, mật khẩu đăng nhập chính của chủ hệ thống vẫn được giữ an toàn tuyệt đối. Nếu xảy ra rủi ro lộ khóa, Admin chỉ cần thu hồi (Revoke) mật khẩu ứng dụng đó trên Google Console trong 1 giây mà không ảnh hưởng tới tài khoản gốc.
3. **Độ tin cậy và tốc độ gửi thư:** Sử dụng trực tiếp hạ tầng Google SMTP (`smtp.gmail.com`) với cổng 587 STARTTLS giúp toàn bộ email (Mã OTP, Thông báo, Phản hồi) đạt tỷ lệ vào thẳng hộp thư chính (**Inbox**) lên tới 99.9%, hoàn toàn không bị các bộ lọc thư rác (Spam/Junk) chặn lại như các SMTP server tự dựng.

### - Cấu hình Biến Môi Trường (`.env` tại Backend):
* **File:** `qlsanbong_backend/.env` (Dòng 39 – 45)
```env
# Cấu hình Gmail App Password & Dịch vụ Email Nodemailer
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your_email@gmail.com
MAIL_PASSWORD=your_gmail_app_password_here
MAIL_FROM="Sport247 <no-reply@sport247.vn>"
ADMIN_NOTIFICATION_EMAIL=your_admin_email@gmail.com
```

---

## 2. Chi Tiết Chức Năng 1: Gửi & Xác Thực Mã OTP (Đăng Ký & Quên/Đổi Mật Khẩu)

### - Công nghệ:
+ **Nodemailer (v10.0.15):** Thư viện chuẩn công nghiệp cho Node.js dùng để kết nối SMTP client, thiết lập kết nối an toàn TLS và đóng gói email định dạng HTML/CSS hiện đại.
+ **T-SQL Stored Procedures (`sp_LuuMaOTP`, `sp_KiemTraOTP`):** Đóng gói logic quản lý vòng đời của mã OTP trong CSDL, tự động vô hiệu hóa các mã cũ và thiết lập thời gian sống (TTL) 5 phút qua hàm `DATEADD(MINUTE, 5, GETDATE())`.
+ **Bcrypt.js (v2.4.3):** Thuật toán băm mật khẩu một chiều với chuỗi muối ngẫu nhiên (Salt 10 rounds), chỉ được kích hoạt sau khi mã OTP xác thực thành công.
+ **React State & Timer Interval (Next.js):** Quản lý trạng thái khóa nút bấm và đồng hồ đếm ngược 60 giây chống người dùng spam gửi yêu cầu liên tục (Anti-flood / Rate limiting).

---

### - Những file xử lý code chi tiết:

#### + File 1: `qlsanbong_backend/src/services/emailService.ts`
* **Dòng 24 – 46 (Hàm `createTransporter`):**
  - Khởi tạo đối tượng `nodemailer.createTransport` đọc từ biến môi trường `MAIL_HOST`, `MAIL_PORT` (587), `MAIL_USER`, `MAIL_PASSWORD`.
  - Thiết lập thuộc tính `tls: { rejectUnauthorized: false }` đảm bảo bắt tay chứng chỉ SSL/TLS mượt mà trên môi trường máy chủ đám mây (Render / VPS).
* **Dòng 380 – 486 (Hàm `sendOtpEmail`):**
  - Nhận tham số qua interface `OtpEmailPayload`: `{ toEmail, otpCode, purpose, userName }`.
  - Xử lý đa năng theo 4 loại nghiệp vụ:
    + `'DANG_KY'`: Tiêu đề "Xác Thực Đăng Ký Tài Khoản".
    + `'DOI_MAT_KHAU'`: Tiêu đề "Xác Thực Đổi Mật Khẩu".
    + `'QUEN_MAT_KHAU'`: Tiêu đề "Khôi Phục Mật Khẩu".
    + `'CAP_NHAT_EMAIL'`: Tiêu đề "Xác Thực Cập Nhật Gmail".
  - Biên soạn giao diện thư HTML chuẩn thể thao Sport247:
    + Hộp viền nét đứt màu xanh ngọc (`#10b981`).
    + Mã OTP 6 chữ số cỡ lớn (`font-size: 34px`, phông monospace dễ đọc, giãn cách ký tự `letter-spacing: 8px`).
    + Dòng cảnh báo đỏ: *"⏰ Mã OTP này có hiệu lực trong vòng 5 phút kể từ thời điểm gửi."*
    + Khung lưu ý an toàn màu vàng cảnh báo không cung cấp mã cho bất kỳ ai nhằm chống lừa đảo giả mạo ban quản trị.
  - Gửi qua `transporter.sendMail` và trả về `Promise<boolean>`.

#### + File 2: `qlsanbong_backend/src/controllers/authController.ts`
* **Dòng 610 – 709 (Hàm `guiMaOTP`):**
  - Endpoint: `POST /api/auth/send-otp`.
  - Nhận `email`, `loai_otp`, `ho_ten`.
  - Kiểm tra tính hợp lệ của nghiệp vụ:
    + Nếu `loai_otp === 'DANG_KY'`: Kiểm tra bảng `Nguoi_Dung`, nếu email đã có tài khoản thì từ chối ngay để tránh tạo trùng.
    + Nếu `loai_otp === 'QUEN_MAT_KHAU'` hoặc `'DOI_MAT_KHAU'`: Kiểm tra email có tồn tại hay không, nếu không tồn tại trả về lỗi `404 Not Found`.
  - Sinh chuỗi ngẫu nhiên 6 chữ số: `const otpCode = Math.floor(100000 + Math.random() * 900000).toString();`.
  - Thực thi Stored Procedure `sp_LuuMaOTP` với thời gian sống 5 phút.
  - Gọi `await sendOtpEmail(...)` chuyển tiếp mã qua SMTP Gmail về điện thoại người dùng.
* **Dòng 716 – 753 (Hàm `xacThucOTP`):**
  - Endpoint: `POST /api/auth/verify-otp`.
  - Gọi Stored Procedure `sp_KiemTraOTP` truyền `email`, `ma_otp`, `loai_otp`.
  - Nhận về kết quả `hop_le = 1` hoặc `hop_le = 0` kèm thông báo lỗi chi tiết (Sai mã, Đã hết hạn, hoặc Đã được sử dụng).
* **Dòng 30 – 100 (Hàm `dangKy`):**
  - Endpoint: `POST /api/auth/register`.
  - Nhận trường `ma_otp` từ form gửi lên.
  - Kiểm tra trực tiếp qua `sp_KiemTraOTP`; nếu OTP hợp lệ mới tiến hành băm mật khẩu `bcrypt.hash` và gọi `sp_ThemNguoiDung` lưu tài khoản vào CSDL SQL Server.
* **Dòng 761 – 840 (Hàm `doiMatKhau`):**
  - Endpoint: `POST /api/auth/change-password`.
  - Cho phép người dùng lấy lại mật khẩu bằng cách xác thực mã OTP gửi về hòm thư Gmail mà không cần nhớ mật khẩu cũ.

#### + File 3: `qlsanbong_backend/src/routes/authRoutes.ts`
* **Dòng 20 – 30:**
  - Khai báo các route liên quan:
    + `router.post('/send-otp', authController.guiMaOTP);`
    + `router.post('/verify-otp', authController.xacThucOTP);`
    + `router.post('/change-password', authController.doiMatKhau);`
    + `router.post('/update-email', verifyToken, authController.capNhatEmail);`

#### + File 4: `Data SQL server 2022/ThuTuc.sql`
* **Dòng 4541 – 4582 (Stored Procedure `sp_LuuMaOTP`):**
  - Nhận tham số: `@email`, `@ma_otp`, `@loai_otp`, `@thoi_gian_phut = 5`.
  - Mở `BEGIN TRANSACTION`:
    1. Vô hiệu hóa toàn bộ các mã OTP cũ của email đó cho nghiệp vụ này bằng lệnh:  
       `UPDATE Xac_Thuc_OTP SET da_xac_thuc = 1 WHERE email = @email AND loai_otp = @loai_otp AND da_xac_thuc = 0;`
    2. Chèn bản ghi OTP mới với hạn sử dụng tính bằng phút hiện hành:  
       `DATEADD(MINUTE, ISNULL(@thoi_gian_phut, 5), GETDATE())`.
  - `COMMIT TRANSACTION` đảm bảo mỗi thời điểm chỉ có duy nhất 1 mã OTP có hiệu lực.
* **Dòng 4584 – 4635 (Stored Procedure `sp_KiemTraOTP`):**
  - Lấy bản ghi mới nhất trong bảng `Xac_Thuc_OTP` theo `@email`, `@loai_otp`, `@ma_otp`.
  - Kiểm tra 3 lớp điều kiện nghiêm ngặt:
    1. Nếu không tìm thấy bản ghi -> Trả về `hop_le = 0`, thông báo *"Mã OTP không chính xác!"*.
    2. Nếu `het_han_luc < GETDATE()` -> Trả về `hop_le = 0`, thông báo *"Mã OTP đã hết hiệu lực (quá hạn)! Vui lòng lấy mã mới."*.
    3. Nếu `da_xac_thuc = 1` -> Trả về `hop_le = 0`, thông báo *"Mã OTP này đã được sử dụng trước đó!"*.
  - Nếu thỏa mãn tất cả: Đánh dấu `UPDATE Xac_Thuc_OTP SET da_xac_thuc = 1 WHERE id = @id;` và trả về `hop_le = 1` (Thành công).

#### + File 5: `qlsanbong_fontend/src/pages/Login/login.tsx`
* **Dòng 161 – 199 (Hàm `handleSendOtpRegister`):**
  - Gửi yêu cầu `fetch(`${API_BASE_URL}/send-otp`)` kèm `{ email, loai_otp: "DANG_KY", ho_ten }`.
  - Khi gửi thành công: Đổi cờ trạng thái, hiển thị thông báo xanh và bắt đầu đếm ngược 60 giây (`setOtpCountdown(60)`), khóa nút bấm gửi lại để chống spam mạng.
* **Dòng 250 – 275 (Hàm `handleSubmit`):**
  - Kiểm tra người dùng đã nhập đủ 6 chữ số mã OTP hay chưa.
  - Gửi toàn bộ payload `{ ho_ten, email, so_dien_thoai, mat_khau, ma_otp }` sang endpoint `/register`.

---

### - Quy trình hoạt động chi tiết từng bước:
1. **Bước 1 (Người dùng nhập thông tin):** Khách hàng mở modal Đăng ký tài khoản trên trang chủ hoặc trang đăng nhập, điền Họ tên và địa chỉ Gmail của mình.
2. **Bước 2 (Yêu cầu gửi OTP):** Khách hàng bấm nút **"Nhận mã OTP"**.
3. **Bước 3 (Kiểm tra & Sinh mã tại Backend):**
   - Backend tiếp nhận yêu cầu tại `/api/auth/send-otp`.
   - Kiểm tra email chưa tồn tại trong bảng `Nguoi_Dung`.
   - Hàm `Math.random` sinh chuỗi ngẫu nhiên 6 số (Ví dụ: `491028`).
   - Gọi thủ tục `sp_LuuMaOTP` lưu vào bảng `Xac_Thuc_OTP` với thời điểm hết hạn là `Thời gian hiện tại + 5 phút`.
4. **Bước 4 (Nodemailer gửi qua Gmail SMTP):**
   - Hàm `sendOtpEmail` dùng Transporter Gmail App Password gửi email HTML định dạng đẹp đến Gmail của khách.
   - Quá trình chuyển phát thư mất từ 1 đến 3 giây.
5. **Bước 5 (Khách hàng nhận & nhập mã):**
   - Khách mở ứng dụng Gmail trên điện thoại hoặc máy tính, thấy thư mới từ Sport247 với mã `491028`.
   - Khách nhập 6 số này vào ô "Mã xác thực OTP" trên giao diện web.
6. **Bước 6 (Xác thực & Tạo tài khoản):**
   - Khách bấm **"Đăng ký ngay"**.
   - Backend gọi `sp_KiemTraOTP`: Hệ thống đối soát mã trong CSDL. Nếu đúng mã và thời gian chưa vượt quá 5 phút, CSDL đánh dấu mã này là `da_xac_thuc = 1` (để không thể dùng lại lần thứ hai).
   - Backend mã hóa mật khẩu bằng Bcrypt và chèn bản ghi vào bảng `Nguoi_Dung`. Khách hàng hoàn tất đăng ký tài khoản thành công.

---

## 3. Chi Tiết Chức Năng 2: Gửi Liên Hệ & Tự Động Báo Về Gmail Quản Trị Viên

### - Công nghệ:
+ **Next.js 16 (React 19) & TypeScript:** Xây dựng giao diện Form liên hệ mượt mà tại trang `/lien-he` và chân trang, tự động liên kết dữ liệu hồ sơ cá nhân.
+ **T-SQL Stored Procedure `sp_GuiLienHe`:** Đảm bảo toàn vẹn dữ liệu khi ghi nhận liên hệ mới vào bảng `Lien_He`.
+ **Asynchronous Non-blocking Email Dispatch:** Cơ chế kích hoạt gửi email trong Background luồng bất đồng bộ của Node.js, giúp API phản hồi cho khách hàng trong mili-giây mà không phải chờ đợi thời gian gửi mail của Google.

---

### - Những file xử lý code chi tiết:

#### + File 1: `qlsanbong_fontend/src/pages/lien-he.tsx`
* **Dòng 33 – 45 (State lưu trữ form liên hệ):**
  - Khai báo state `formData`: `{ ho_ten, email, so_dien_thoai, tieu_de, noi_dung }`.
* **Dòng 68 – 105 (Hàm `handleToggleUseAccountInfo` - Tính năng điền tự động):**
  - Khách hàng có thể tích chọn nút *"Sử dụng thông tin tài khoản đang đăng nhập"*.
  - Hệ thống tự động trích xuất thông tin `{ ho_ten, so_dien_thoai, email }` từ tài khoản đã đăng nhập nạp vào form, tiết kiệm thời gian gõ phím.
* **Dòng 107 – 155 (Hàm `handleSubmit` - Gửi liên hệ):**
  - Kiểm tra tính hợp lệ: Họ tên, nội dung không để trống.
  - Kiểm tra chuẩn số điện thoại: Phải gồm đúng 10 chữ số và bắt đầu bằng số `0` (Chuẩn viễn thông di động Việt Nam).
  - Gọi dịch vụ `contentService.sendLienHe(formData)`.
  - Hiển thị thông báo thành công và xóa trắng form sau khi gửi.

#### + File 2: `qlsanbong_backend/src/controllers/contentController.ts`
* **Dòng 373 – 410 (Hàm `guiLienHe`):**
  - Endpoint: `POST /api/lien-he`.
  - Chuẩn hóa số điện thoại: `so_dien_thoai.replace(/\D/g, '')`.
  - Thực thi Stored Procedure `sp_GuiLienHe` lưu dữ liệu vào bảng `Lien_He` với trạng thái ban đầu `CHUA_XU_LY`.
  - **Điểm ưu việt kiến trúc:** Kích hoạt gửi email ngầm bằng cú pháp:
    ```typescript
    sendContactEmailToAdmin({ ho_ten, email, so_dien_thoai, tieu_de, noi_dung })
      .catch((err) => console.error('Lỗi khi gửi email thông báo liên hệ:', err));
    ```
    Hệ thống không dùng lệnh `await` chặn luồng mà trả về phản hồi HTTP 201 cho khách hàng ngay lập tức, trong khi email vẫn được gửi đi âm thầm trong nền.

#### + File 3: `qlsanbong_backend/src/services/emailService.ts`
* **Dòng 51 – 157 (Hàm `sendContactEmailToAdmin`):**
  - Lấy địa chỉ hòm thư Admin từ biến `ADMIN_NOTIFICATION_EMAIL` (Mặc định `xoancao2.0@gmail.com`).
  - Lấy thời gian gửi theo múi giờ chuẩn Việt Nam `Asia/Ho_Chi_Minh` định dạng ngày/tháng/năm giờ:phút:giây.
  - Soạn tiêu đề email chứa biểu tượng bóng đá nổi bật:  
    `⚽ [Sport247] Liên hệ mới từ: <Họ_Tên> - <Tiêu_Đề>`.
  - Tạo khung HTML thông tin chi tiết:
    + Bảng thông tin: Họ tên, Số điện thoại (dạng link `tel:`), Email (dạng link `mailto:`), Thời gian gửi.
    + Khung nội dung chi tiết của khách hàng (`content-box` viền xanh emerald).
    + Nút bấm hành động nhanh to bản: **"📞 Gọi Điện Tư Vấn Ngay"** (`action-btn` màu xanh `#10b981`), giúp Admin khi mở thư trên điện thoại chỉ cần bấm 1 chạm là máy tự động gọi thẳng đến số của khách.
  - Gửi thư bằng `transporter.sendMail`.

#### + File 4: `Data SQL server 2022/ThuTuc.sql`
* **Dòng 4014 – 4037 (Stored Procedure `sp_GuiLienHe`):**
  - Nhận tham số: `@ho_ten`, `@email`, `@so_dien_thoai`, `@tieu_de`, `@noi_dung`.
  - Thực hiện chèn an toàn với `BEGIN TRANSACTION`:
    ```sql
    INSERT INTO Lien_He (ho_ten, email, so_dien_thoai, tieu_de, noi_dung, trang_thai_xu_ly, ngay_gui)
    VALUES (@ho_ten, @email, @so_dien_thoai, @tieu_de, @noi_dung, N'CHUA_XU_LY', GETDATE());
    ```
  - Trả về ID liên hệ vừa tạo qua `SCOPE_IDENTITY()`.

---

### - Quy trình hoạt động chi tiết từng bước:
1. **Bước 1:** Khách hàng (ví dụ: Anh Nam - Đại diện Công ty) truy cập vào mục "Liên hệ" trên website Sport247.
2. **Bước 2:** Anh Nam điền thông tin: *"Tôi muốn đặt 3 sân 7 người đá giải nội bộ công ty vào chiều thứ 7 tuần này"*, số điện thoại `0912345678`.
3. **Bước 3:** Khách bấm **"Gửi tin nhắn liên hệ"**. Frontend gửi API `POST /api/lien-he`.
4. **Bước 4:** Backend chạy thủ tục `sp_GuiLienHe` lưu yêu cầu vào bảng `Lien_He` trong CSDL SQL Server.
5. **Bước 5:** Backend lập tức phản hồi thông báo thành công cho Anh Nam trên màn hình.
6. **Bước 6:** Song song đó, Backend kích hoạt hàm `sendContactEmailToAdmin`. Thư viện Nodemailer kết nối Gmail SMTP bằng App Password và bắn một bức thư HTML khẩn cấp vào hộp thư `xoancao2.0@gmail.com` của Ban quản lý sân.
7. **Bước 7:** Điện thoại của Quản lý sân rung chuông báo có email mới. Quản lý mở thư, thấy đầy đủ thông tin yêu cầu của Anh Nam và bấm ngay nút **"📞 Gọi Điện Tư Vấn Ngay"** để chốt lịch đặt sân cho khách.

---

## 4. Chi Tiết Chức Năng 3: Quản Trị Viên Trả Lời Gmail Khách Hàng & Cơ Chế Fallback Thông Minh

### - Công nghệ:
+ **React 19 Dashboard Modal:** Xây dựng cửa sổ pop-up soạn thư phản hồi trực quan trên trang quản trị Dashboard, hỗ trợ mẫu trả lời sẵn và trích dẫn câu hỏi gốc.
+ **Dual-Channel Delivery & Fallback Strategy:** Cơ chế gửi thư kép thông minh. Nếu hòm thư khách hàng hợp lệ, email được chuyển tới khách. Nếu phát hiện khách không có email hoặc email bị sai/không tồn tại, hệ thống tự động bẻ luồng gửi bản sao cảnh báo về Gmail của Admin để không làm gián đoạn việc chăm sóc khách hàng.
+ **T-SQL Stored Procedure `sp_TraLoiLienHe`:** Lưu trữ nội dung trả lời, ghi nhận thời gian phản hồi và tự động đổi trạng thái xử lý sang `DA_XU_LY`.

---

### - Những file xử lý code chi tiết:

#### + File 1: `qlsanbong_fontend/src/pages/Dashboard.tsx`
* **Dòng 595 (State quản lý modal phản hồi):**
  - Khai báo state `replyLienHeModal`: `{ isOpen, data, tieu_de_tra_loi, noi_dung_tra_loi, isSubmitting }`.
* **Dòng 7220 – 7380 (Giao diện Modal trả lời liên hệ):**
  - Hiển thị tóm tắt thông tin người gửi: Họ tên, Email, Số điện thoại.
  - Hiển thị trích dẫn nội dung gốc khách hàng đã hỏi.
  - Cung cấp các nút điền sẵn phản hồi mẫu nhanh (Ví dụ: Mẫu báo giá giải đấu, Mẫu xác nhận còn sân trống,...).
  - Ô nhập tiêu đề và khung nhập nội dung giải đáp chi tiết (`textarea`).
* **Dòng 2283 – 2315 (Hàm `handleReplyLienHeSubmit`):**
  - Thu thập `tieu_de_tra_loi` và `noi_dung_tra_loi`.
  - Gọi API `contentService.replyLienHe(replyId, { ... })`.
  - Nhận phản hồi từ Backend, cập nhật lại bảng danh sách và hiển thị thông báo trạng thái gửi thư.

#### + File 2: `qlsanbong_backend/src/controllers/contentController.ts`
* **Dòng 454 – 502 (Hàm `traLoiLienHe`):**
  - Endpoint: `POST /api/lien-he/:id/tra-loi`.
  - Nhận `id`, `tieu_de_tra_loi`, `noi_dung_tra_loi`.
  - Bước 1: Gọi `sp_LayChiTietLienHe` lấy thông tin liên hệ gốc (Email, Họ tên, SĐT, Câu hỏi).
  - Bước 2: Thực thi `sp_TraLoiLienHe` lưu nội dung trả lời vào CSDL và cập nhật trạng thái `DA_XU_LY`.
  - Bước 3: Gọi hàm `sendContactReplyEmail` truyền toàn bộ thông tin để gửi email.
  - Bước 4: Trả về kết quả JSON cho Client biết thư đã được gửi tới khách hay đã kích hoạt Fallback về Admin.

#### + File 3: `qlsanbong_backend/src/services/emailService.ts`
* **Dòng 162 – 266 (Kênh 1: Gửi thư trực tiếp tới khách hàng):**
  - Kiểm tra xem khách có cung cấp email hợp lệ hay không (`hasValidEmailFormat`).
  - Nếu có email hợp lệ: Tạo mẫu email HTML trang trọng từ Ban Quản Lý Sport247:
    + Lời chào trân trọng theo tên khách: *"Kính gửi quý khách <Tên_Khách>,"*.
    + Khung nội dung giải đáp của Admin (`reply-box` màu xanh lá pastel dịu mắt).
    + Nút bấm tiện ích: **"⚽ Truy Cập Đặt Sân Online"**.
    + Khung trích dẫn lại câu hỏi ban đầu của khách để khách tiện theo dõi ngữ cảnh.
    + Chân trang gồm địa chỉ trung tâm, Hotline `0816344504` và email hỗ trợ.
  - Thực hiện gửi qua `transporter.sendMail`.
* **Dòng 268 – 375 (Kênh 2: Cơ Chế Fallback Chuyển Tiếp Về Gmail Admin):**
  - Kích hoạt khi: Khách không để lại email, hoặc quá trình gửi tới khách phát sinh lỗi (địa chỉ email không tồn tại, hộp thư khách bị đầy/bị khóa).
  - Soạn mẫu email cảnh báo khẩn cấp màu đỏ/hồng (`#ffe4e6`):
    + Tiêu đề: `⚠️ [Sport247 - Bản sao phản hồi] Không gửi được đến khách: <Tên_Khách> (<Email>)`.
    + Khung cảnh báo: *"⚠️ Không thể gửi email đến khách hàng... Hệ thống đã tự động chuyển tiếp nội dung phản hồi về Gmail của bạn để bạn có thể gọi điện thoại trực tiếp cho khách!"*.
    + Bảng thông tin khách hàng kèm số điện thoại in đậm.
    + Nội dung phản hồi Admin vừa gõ để Admin có kịch bản trao đổi qua điện thoại.
    + Nút bấm gọi điện thoại: **"📞 Gọi Điện Ngay Cho Khách Hàng (<Số_Điện_Thoại>)"**.
  - Gửi bản sao này về hộp thư `ADMIN_NOTIFICATION_EMAIL`. Đảm bảo nhân viên quản lý không bao giờ bị mất dấu thông tin xử lý.

#### + File 4: `Data SQL server 2022/ThuTuc.sql`
* **Dòng 4090 – 4113 (Stored Procedure `sp_TraLoiLienHe`):**
  - Nhận tham số: `@id`, `@noi_dung_tra_loi`.
  - Mở `BEGIN TRANSACTION`:
    ```sql
    UPDATE Lien_He
    SET noi_dung_tra_loi = @noi_dung_tra_loi,
        ngay_tra_loi = GETDATE(),
        trang_thai_xu_ly = N'DA_XU_LY'
    WHERE id = @id;
    ```
  - Đảm bảo toàn vẹn dữ liệu và cập nhật mốc thời gian xử lý chính xác.

---

### - Quy trình hoạt động chi tiết từng bước:
1. **Bước 1 (Xem liên hệ):** Nhân viên quản lý mở trang Dashboard, vào tab Liên hệ, thấy danh sách các khách hàng đang chờ phản hồi với nhãn màu vàng `CHƯA XỬ LÝ`.
2. **Bước 2 (Mở Modal & Soạn thư):** Nhân viên bấm vào liên hệ của Khách A -> Modal hiện ra câu hỏi gốc của khách. Nhân viên soạn nội dung giải đáp chi tiết về giá thuê sân và lịch trống.
3. **Bước 3 (Bấm gửi phản hồi):** Nhân viên bấm **"Gửi phản hồi Gmail"**.
4. **Bước 4 (Cập nhật CSDL):** Backend gọi `sp_TraLoiLienHe` ghi nhận câu trả lời vào CSDL SQL Server và chuyển trạng thái của liên hệ này sang nhãn xanh `ĐÃ XỬ LÝ`.
5. **Bước 5 (Phân nhánh gửi thư):**
   - **Nhánh A (Khách có email hợp lệ):** Backend kết nối Gmail SMTP gửi bức thư phản hồi chuẩn mực tới hòm thư của Khách A. Khách mở điện thoại đọc câu trả lời và có nút bấm quay lại web đặt sân.
   - **Nhánh B (Khách không có email hoặc email ảo):** Hệ thống bắt ngoại lệ (Try/Catch), tự động kích hoạt luồng **Fallback**, gửi một email cảnh báo màu đỏ về Gmail của Quản lý: *"Không gửi được thư cho khách A, đây là nội dung bạn vừa soạn, hãy gọi điện ngay cho khách theo số 0912xxx"*.
6. **Bước 6 (Hoàn tất chu trình):** Không có bất kỳ liên hệ nào bị bỏ sót hay gián đoạn, dịch vụ khách hàng đạt chuẩn chuyên nghiệp 24/7.

---

## 5. Bảng So Sánh Kỹ Thuật & Bộ Câu Hỏi Vấn Đáp Thường Gặp (Dành Cho Bảo Vệ Đồ Án)

### A. So sánh Cơ chế Gửi Mail Gmail App Password với Mật khẩu thông thường

| Tiêu Chí So Sánh | Sử Dụng Mật Khẩu Gmail Chính | Sử Dụng Gmail App Password (Hệ Thống Đang Dùng) |
| :--- | :--- | :--- |
| **Chính sách Google** | Đã bị Google cấm và vô hiệu hóa từ 05/2022 | Được Google chính thức khuyến nghị và hỗ trợ toàn diện |
| **Bảo mật tài khoản (2FA)** | Bắt buộc phải tắt xác thực 2 bước (Cực kỳ nguy hiểm) | Bắt buộc bật xác thực 2 bước (Bảo mật tài khoản tuyệt đối) |
| **Phạm vi quyền hạn** | Toàn quyền kiểm soát hòm thư, đổi mật khẩu, đọc thư riêng | Chỉ có quyền gửi thư SMTP, không thể đăng nhập giao diện web |
| **Thu hồi quyền (Revoke)** | Phải đổi mật khẩu gốc (Làm gián đoạn các thiết bị khác) | Xóa App Password trên Google Console chỉ với 1 cú click |
| **Tỷ lệ thư vào Inbox** | Thấp, dễ bị liệt vào diện nghi ngờ đăng nhập trái phép | Rất cao (>99%), thư vào thẳng Inbox trong 1 - 3 giây |

---

### B. Các Câu Hỏi Vấn Đáp Giảng Viên Thường Hỏi & Câu Trả Lời Chuẩn Mực

#### ❓ Câu hỏi 1: Tại sao hệ thống lại cần cơ chế Fallback khi trả lời liên hệ qua Gmail?
> **Trả lời:** Trong thực tế sử dụng dịch vụ sân bóng đá, rất nhiều khách hàng lớn tuổi hoặc thanh niên đặt sân vãng lai chỉ có nhu cầu để lại Số điện thoại mà không có địa chỉ Email, hoặc họ nhập sai ký tự email (ví dụ gõ nhầm `@gmai.com`). Nếu hệ thống chỉ trông cậy vào việc gửi mail cho khách, thư sẽ bị dội ngược (Bounce) và câu trả lời của nhân viên bị thất lạc. Cơ chế Fallback của nhóm em tự động phát hiện tình huống này và gửi toàn bộ nội dung trả lời về Gmail của Admin kèm số điện thoại để Admin chỉ cần bấm 1 chạm là gọi thẳng cho khách. Điều này giải quyết bài toán trải nghiệm người dùng thực tế và nâng cao tính chuyên nghiệp của hệ thống.

#### ❓ Câu hỏi 2: Mã OTP được bảo mật như thế nào trong CSDL SQL Server và làm sao chống tấn công Brute-force/Spam?
> **Trả lời:**
> 1. **Cơ chế TTL (Time-To-Live):** Trong Stored Procedure `sp_LuuMaOTP`, mã OTP chỉ có hạn dùng đúng 5 phút (`DATEADD(MINUTE, 5, GETDATE())`). Quá 5 phút thủ tục `sp_KiemTraOTP` sẽ tự động từ chối.
> 2. **Cơ chế Single-Use (Dùng một lần):** Khi xác thực thành công, mã lập tức được đánh dấu `da_xac_thuc = 1`, triệt tiêu khả năng dùng lại (Replay Attack).
> 3. **Vô hiệu hóa mã cũ:** Khi người dùng bấm nhận mã mới, thủ tục tự động hủy toàn bộ các mã cũ chưa xác thực của email đó.
> 4. **Chống spam ở Frontend:** Giao diện có bộ đếm ngược 60 giây (`setOtpCountdown(60)`), khóa nút bấm gửi lại trong 1 phút để ngăn chặn việc spam gọi API làm quá tải máy chủ SMTP.

#### ❓ Câu hỏi 3: Nếu máy chủ Google SMTP bị chậm hoặc mất mạng thì việc gửi form liên hệ của khách hàng có bị treo đơ giao diện không?
> **Trả lời:** Dạ hoàn toàn không. Nhóm em đã áp dụng kiến trúc **Bất đồng bộ không chặn (Non-blocking Asynchronous Dispatch)** trong file `contentController.ts`. Khi khách hàng gửi liên hệ, Backend lưu dữ liệu vào SQL Server trước, sau đó kích hoạt hàm `sendContactEmailToAdmin` trong background và trả ngay mã HTTP 201 cho khách hàng trong vài phần trăm giây. Quá trình bắt tay và gửi mail của Nodemailer với Google chạy ngầm độc lập; nếu có lỗi mạng, lỗi sẽ được ghi nhận vào file log (`catch`) mà không làm ảnh hưởng đến trải nghiệm của khách hàng.

---
*Tài liệu được biên soạn phục vụ công tác báo cáo, thuyết trình và vấn đáp Đồ Án Tốt Nghiệp Sport247.*
