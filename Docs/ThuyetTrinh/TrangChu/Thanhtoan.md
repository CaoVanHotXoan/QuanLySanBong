# BÁO CÁO THUYẾT TRÌNH: CHỨC NĂNG ĐẶT SÂN & THANH TOÁN ONLINE TẠI TRANG CHỦ

> **Hệ thống:** Quản Lý & Đặt Sân Bóng Đá Trực Tuyến Sport247 / Soccer247  
> **Sinh viên thực hiện:** Cao Văn Hột Xoàn (MSSV: 525000462) & Phạm Tiến Doanh (MSSV: 525000463)  
> **Khoa:** Công Nghệ Thông Tin - Đại Học Lạc Hồng (LHU)  

---

# PHẦN I: BẢN TÓM TẮT NGẮN GỌN (DÀNH CHO NÓI THUYẾT TRÌNH / HỌC THUỘC)

## 1. Chức năng Đặt Sân Online

### - Công nghệ:
+ **Next.js 16 (React 19) & TypeScript:** Xây dựng giao diện ma trận lịch sân thời gian thực, modal đặt sân 3 bước và đảm bảo an toàn kiểu dữ liệu.
+ **Tailwind CSS v4 & Lucide Icons:** Trực quan hóa 4 trạng thái ô sân bằng màu sắc (Xanh = Trống, Cam = Đang giữ chỗ, Đỏ = Đã đặt, Xám = Quá giờ) kèm animation nhấp nháy.
+ **Socket.IO (v4.8):** Đồng bộ trạng thái giữ chỗ tức thì trên RAM giữa mọi người dùng, giải quyết triệt để lỗi tranh chấp đặt trùng sân (Race Condition).
+ **Node.js & Express.js:** Xây dựng hệ thống RESTful API đặt sân và hứng Webhook thanh toán tự động từ ngân hàng.
+ **PayOS SDK (`@payos/node`):** Tích hợp Open Banking với Ngân hàng MB Bank, tự động tạo mã VietQR Napas 247 động theo từng mã đơn đặt.
+ **Microsoft SQL Server 2022 & Stored Procedures:** Lưu trữ dữ liệu tập trung, đảm bảo toàn vẹn giao dịch ACID với các thủ tục `sp_DatSan`, `sp_ThanhToanDon`, `sp_HuyDonTam`.

---

### - Những file xử lý code:
+ **File 1: `qlsanbong_fontend/src/pages/index.tsx` (Giao diện & Tương tác khách hàng)**
  * Dòng 673 – 730: `useEffect` kết nối Socket.IO, lắng nghe `slots_updated` (đổi màu ô sang CAM) và `payment_success` (nhận tiền thành công).
  * Dòng 1111 – 1202: hàm `handleSlotClick` (kiểm tra ô trống, tính toán dải ô khả dụng, emit `lock_slots` khóa giữ chỗ Real-time).
  * Dòng 1210 – 1239: hàm `handleSelectDuration` (chọn 30p-120p, duy trì khóa toàn dải ô chống khách khác cướp slot sau lưng).
  * Dòng 1246 – 1281: hàm `handleQuantityChange` & `useMemo` (chọn dịch vụ nước/áo bib, tự tính tổng tiền và tiền cọc 30% hoặc 100%).
  * Dòng 1316 – 1383: hàm `handleProceedToQR` (gửi POST `/api/thanh-toan/payos/tao-link`, nhận mã VietQR MB Bank kèm đếm ngược 10 phút).
  * Dòng 819 – 852: hàm `handlePaymentSuccessAction` (nhận tín hiệu thanh toán, phát `unlock_all`, chuyển ma trận sân sang màu ĐỎ).
  * Dòng 937 – 960: hàm `handleCloseBookingModal` (khách đóng/hủy modal -> emit `unlock_all` nhả slot về màu XANH, gọi API hủy đơn tạm).
  * Dòng 746 – 775: hàm `handleUnloadOrReload` (`navigator.sendBeacon` tự động dọn dẹp đơn tạm khi khách tắt tab/F5).

+ **File 2: `qlsanbong_backend/server.ts` (Quản lý khóa giữ chỗ Socket.IO trên RAM)**
  * Dòng 147 – 154: Khởi tạo Map bộ nhớ đệm `lockedSlots` trên RAM lưu cặp `slotId -> socket.id`.
  * Dòng 156 – 174: Sự kiện `socket.on('lock_slots')` (nhận danh sách ô cần giữ, lưu vào Map và broadcast `slots_updated` cho toàn mạng).
  * Dòng 187 – 199 & 232 – 245: Sự kiện `unlock_all` & `disconnect` (tự động xóa slot trong Map khi khách hủy hoặc mất mạng).

+ **File 3: `qlsanbong_backend/src/routes/thanhToanRoutes.ts` (Định tuyến API)**
  * Dòng 15 – 28: Khai báo 5 endpoints: `/payos/tao-link`, `/payos/trang-thai/:orderCode`, `/payos/webhook`, `/payos/huy-don-tam`.

+ **File 4: `qlsanbong_backend/src/controllers/thanhToanController.ts` (Nghiệp vụ Backend)**
  * Dòng 128 – 294: hàm `taoThanhToanPayOS` (thực thi `sp_DatSan` lưu đơn tạm `CHO_THANH_TOAN`, tạo mã `DS<id>`, gọi PayOS sinh mã VietQR).
  * Dòng 490 – 632: hàm `xuLyWebhookPayOS` (nhận Webhook từ MB Bank, đối soát regex `DS<id>`, gọi `sp_ThanhToanDon`, emit `payment_success`).
  * Dòng 804 – 846: hàm `huyDonTamPayOS` (thực thi `sp_HuyDonTam` xóa đơn tạm, phát Socket `booking_updated` giải phóng sân).

+ **File 5: `Data SQL server 2022/ThuTuc.sql` (Stored Procedures SQL Server)**
  * Dòng 1128: `sp_DatSan` (kiểm tra xung đột giờ, lưu đơn tạm với Transaction ACID).
  * Dòng 1596: `sp_ThanhToanDon` (ghi nhận thanh toán, tự động chuyển trạng thái đơn sang `DA_COC` hoặc `DA_THANH_TOAN`).
  * Dòng 3103: `sp_HuyDonTam` (xóa an toàn đơn tạm `CHO_THANH_TOAN` và chi tiết dịch vụ khi khách hủy).

---

### - Cách hoạt động:
+ **Bước 1:** Khách hàng xem ma trận lịch sân trực quan thời gian thực (Xanh = Trống, Cam = Đang giữ chỗ, Đỏ = Đã đặt).
+ **Bước 2:** Khách click chọn ô giờ trống -> Socket.IO lập tức khóa giữ chỗ dải ô khả dụng trên RAM -> Giao diện của tất cả khách khác chuyển sang màu CAM giữ chỗ (ngăn chặn xung đột).
+ **Bước 3:** Khách chọn thời lượng đá (30p, 60p, 90p, 120p) -> Hệ thống vẫn duy trì khóa toàn dải ô để bảo vệ slot.
+ **Bước 4:** Khách chọn dịch vụ đi kèm (nước uống, áo bib,...) và chọn hình thức thanh toán: Cọc 30% hoặc Trả hết 100%.
+ **Bước 5:** Khách bấm xác nhận -> Backend chạy `sp_DatSan` lưu đơn tạm, PayOS kết nối MB Bank sinh mã VietQR động chứa cú pháp `DS<mã_đơn>`.
+ **Bước 6:** Khách quét mã VietQR bằng App Ngân Hàng bất kỳ (thông tin số tiền và nội dung chuyển khoản được điền tự động chính xác).
+ **Bước 7:** MB Bank nhận tiền -> Cổng PayOS bắn Webhook tự động về Backend trong 1 - 3 giây.
+ **Bước 8:** Backend đối soát nội dung sao kê khớp cú pháp `DS<mã_đơn>` -> Thực thi `sp_ThanhToanDon` chốt đơn thành công.
+ **Bước 9:** Backend phát Socket.IO `payment_success` -> Màn hình khách hiện thông báo chúc mừng, ma trận sân toàn mạng đổi sang màu ĐỎ/VÀNG; slot thừa tự về màu XANH trống.
+ **Bước 10:** Nếu khách hủy/đóng modal/tắt trình duyệt -> Socket phát `unlock_all` và Backend gọi `sp_HuyDonTam` xóa đơn tạm để nhả sân ngay lập tức.

---
---

# PHẦN II: BẢN CHI TIẾT ĐẦY ĐỦ (DÀNH CHO VẤN ĐÁP KỸ THUẬT & DẪN CHỨNG CODE CỤ THỂ)

## 1. Chức năng Đặt Sân Online (Chi Tiết Chuyên Sâu)

### - Công nghệ:
+ **Next.js 16 (React 19) & TypeScript:** Dùng để xây dựng giao diện người dùng tương tác cao (SPA), render ma trận lịch sân thời gian thực (Real-time Grid), quản lý luồng Modal 3 bước (chọn thời lượng, dịch vụ & quét mã QR), đảm bảo tính an toàn kiểu dữ liệu (Type-safe) khi truyền nhận dữ liệu đặt sân.
+ **Tailwind CSS v4 & Lucide Icons:** Dùng để thiết kế giao diện hiện đại, trực quan hóa trạng thái các ô slot bằng màu sắc (Xanh = Trống, Cam/Tím = Đang giữ chỗ, Đỏ = Đã đặt/Đã cọc, Xám = Quá giờ), tạo hiệu ứng animation xoay vòng (Soccer Loader) và thanh đếm ngược thời gian thanh toán.
+ **Socket.IO (Client & Server v4.8):** Dùng để thiết lập kênh truyền thông hai chiều thời gian thực (WebSocket), đồng bộ tức thời mili-giây trạng thái giữ chỗ giữa hàng ngàn người dùng cùng lúc; giải quyết bài toán chống xung đột đặt trùng lịch (Race Condition) bằng bộ nhớ đệm RAM.
+ **Node.js & Express.js (v4.19):** Dùng để xây dựng tầng máy chủ Backend RESTful API, tiếp nhận yêu cầu đặt lịch, tính toán kiểm tra thời gian hợp lệ, điều phối giao dịch với ngân hàng, và quản lý vòng đời giữ chỗ của Client.
+ **PayOS SDK (`@payos/node` v2.0):** Dùng để tích hợp giải pháp thanh toán Open Banking với Ngân hàng TMCP Quân Đội (MB Bank); tự động sinh mã VietQR động theo chuẩn Napas 247 chứa số tiền và nội dung chuyển khoản mã hóa chuẩn xác.
+ **Webhook Architecture (PayOS to Express):** Dùng để nhận tín hiệu thông báo biến động số dư từ MB Bank tự động trong vòng 1 - 3 giây ngay khi khách chuyển khoản thành công mà không cần nhân viên phải duyệt tay hay đối soát sao kê thủ công.
+ **Microsoft SQL Server 2022:** Hệ quản trị cơ sở dữ liệu quan hệ (RDBMS) dùng để lưu trữ toàn bộ thông tin sân bóng, đơn đặt sân, chi tiết dịch vụ, hóa đơn và lịch sử giao dịch.
+ **T-SQL Stored Procedures & ACID Transactions:** Dùng để đóng gói 100% logic xử lý dữ liệu ở tầng Database (`sp_DatSan`, `sp_ThanhToanDon`, `sp_ThemNguoiDung`, `sp_HuyDonTam`), áp dụng `BEGIN TRANSACTION ... COMMIT / ROLLBACK` ngăn chặn tuyệt đối tình trạng dữ liệu mâu thuẫn khi có nhiều giao dịch đồng thời.

---

### - Những file xử lý code:

#### + File 1: `qlsanbong_fontend/src/pages/index.tsx` (Giao diện Frontend & Logic tương tác khách hàng)
* **Dòng 673 – 730 (Hàm `useEffect` - Khởi tạo kết nối Socket.IO Client & Cơ chế đồng bộ kép):**
  - Khởi tạo kết nối WebSocket với server qua `io(SOCKET_URL)`.
  - Lắng nghe sự kiện `slots_updated`: Nhận danh sách các ô slot đang bị giữ chỗ trên toàn hệ thống để cập nhật state `lockedSlots` (đổi màu ô sang CAM).
  - Lắng nghe sự kiện `payment_success`: Nhận thông báo tiền đã vào tài khoản MB Bank để kích hoạt hàm chúc mừng thành công.
  - Lắng nghe sự kiện `booking_updated`: Tự động tải lại ma trận sân khi có đơn đặt mới từ POS hoặc khách khác.
  - Tích hợp cơ chế fallback tự động đồng bộ mỗi 5 giây và khi người dùng chuyển lại tab (`window.focus`).
* **Dòng 1111 – 1202 (Hàm `handleSlotClick` - Xử lý khi khách click chọn ô giờ trống trên ma trận):**
  - Nhận tham số: `san: SanBong`, `slot: { start: string; end: string; label: string }`.
  - Kiểm tra điều kiện: Khung giờ đã trôi qua (`isSlotInThePast`), bắt buộc đăng nhập tài khoản (`currentUser`), kiểm tra ô có đang bị khách khác giữ Real-time (`lockedSlots`) hoặc đã có đơn trong DB (`gridSlots`).
  - Thuật toán tìm thời lượng tối đa khả dụng không xung đột: Kiểm tra 120p, 90p, 60p, 30p bằng `checkConflictForSan`.
  - Tạo mảng key `holdSlotKeys` chứa toàn bộ các ô thời gian khách có quyền mua (Ví dụ chọn 11h30 trống đến 13h00 -> sinh 3 key: `11:30`, `12:00`, `12:30`).
  - Phát tín hiệu Socket.IO: `socketRef.current?.emit('lock_slots', holdSlotKeys)` để khóa đồng loạt các ô này trên màn hình mọi khách khác.
  - Mở Modal đặt lịch ở bước chọn thời lượng (`setBookingStep('DURATION')`).
* **Dòng 1210 – 1239 (Hàm `handleSelectDuration` - Chọn thời lượng đá 30p, 60p, 90p, 120p):**
  - Nhận tham số: `durationMin: number`.
  - Tính toán giờ kết thúc mới (`newEndTime`) và giá tiền tương ứng (`newGiaTien = durationMin * donGiaPhut`).
  - Logic cốt lõi: Dù khách chọn mốc 30 phút hay 60 phút, hệ thống vẫn duy trì gửi `lock_slots` cho toàn bộ dải ô khả dụng (`activeHoldKeys`) để ngăn chặn việc khách khác click chen ngang vào các ô giờ phía sau.
* **Dòng 1246 – 1281 (Hàm `handleQuantityChange` & `useMemo` tính toán tổng tiền):**
  - Cho phép thêm bớt số lượng dịch vụ đi kèm (nước suối, nước ngọt, thuê áo bib, bóng thi đấu).
  - Tự động tính: `tongTienDon = tienSan + tongTienDichVu`.
  - Tính `soTienThanhToan`: Nếu chọn hình thức `DAT_COC` thì tính 30% tổng tiền (`Math.round(tong * 0.3)`), nếu `TRA_HET` thì thanh toán 100%.
* **Dòng 1289 – 1307 (Hàm `handleProceedToInfo` - Chuyển sang bước điền thông tin người đặt):**
  - Kiểm tra lại xung đột giờ lần 2, tiếp tục phát `lock_slots` duy trì cờ giữ chỗ, chuyển state `setBookingStep('INFO')`.
* **Dòng 1316 – 1383 (Hàm `handleProceedToQR` - Gửi yêu cầu tạo đơn tạm và sinh mã VietQR PayOS):**
  - Gọi API `POST /api/thanh-toan/payos/tao-link` truyền payload gồm `bookingData` (mã sân, ngày đá, giờ bắt đầu, giờ kết thúc, tiền sân, tổng tiền, dịch vụ) và `so_tien` thanh toán.
  - Nhận kết quả từ Backend: lưu thông tin mã QR, mã đơn đặt, `orderCode` vào state `payOSData`.
  - Chuyển Modal sang bước 3 (`setBookingStep('QR')`) hiển thị mã VietQR ngân hàng Quân Đội MB Bank kèm đồng hồ đếm ngược 10 phút.
* **Dòng 733 – 743 & Dòng 871 – 929 (Hàm `checkPayOSStatus` & Polling dự phòng):**
  - Cơ chế tự động Polling mỗi 2.5 giây gọi `GET /api/thanh-toan/payos/trang-thai/:orderCode` để kiểm tra kết quả đối soát nếu Webhook bị nghẽn mạng.
  - Phân tích phản hồi: Nếu `isPaid === true` -> kích hoạt `handlePaymentSuccessAction`. Nếu phát hiện khách chuyển tiền sai nội dung -> hiển thị cảnh báo đỏ trên Modal.
* **Dòng 819 – 852 (Hàm `handlePaymentSuccessAction` - Xử lý khi nhận tiền thành công):**
  - Kích hoạt khi Socket.IO nhận sự kiện `payment_success` từ Server.
  - Phát tín hiệu `socketRef.current?.emit('unlock_all')` để giải phóng các ô giữ chỗ trên RAM.
  - Gọi `fetchLichSan()` và `fetchDichVu()` cập nhật ma trận lịch sân từ xanh sang đỏ/vàng trên toàn bộ client.
  - Hiển thị màn hình thông báo thanh toán thành công, kích hoạt đồng hồ đếm ngược 10 giây tự động đóng modal.
* **Dòng 937 – 960 (Hàm `handleCloseBookingModal` - Xử lý khi khách bấm đóng Modal / Hủy đặt):**
  - Phát sự kiện `socketRef.current?.emit('unlock_all')` giải phóng ngay lập tức các ô slot về màu xanh `TRỐNG` cho người khác đặt.
  - Gọi API `POST /api/thanh-toan/payos/huy-don-tam` để xóa đơn tạm khỏi Database SQL Server.
* **Dòng 746 – 775 (Hàm `handleUnloadOrReload` - Xử lý khi khách F5 hoặc tắt trình duyệt):**
  - Dùng `navigator.sendBeacon` gửi tín hiệu ngầm đến `/api/thanh-toan/payos/huy-don-tam` dọn dẹp đơn tạm ngay cả khi tab đã đóng.

---

#### + File 2: `qlsanbong_backend/server.ts` (Quản lý kết nối Socket.IO & In-Memory Court Locking)
* **Dòng 147 – 154 (Khởi tạo bộ nhớ giữ chỗ tạm thời trên RAM):**
  - Khai báo biến `const lockedSlots = new Map<string, string>();` lưu trữ cặp `Key: slotId ("YYYY-MM-DD_MaSan_HH:mm")` -> `Value: socket.id`.
* **Dòng 156 – 174 (Sự kiện `socket.on('lock_slots')` - Khóa nhiều ô cùng lúc):**
  - Nhận mảng `slotIds: string[]` từ client.
  - Xóa bỏ các slot cũ do chính socket này nắm giữ, nạp toàn bộ danh sách `slotIds` mới vào `lockedSlots`.
  - Phát sóng toàn mạng: `io.emit('slots_updated', Array.from(lockedSlots.keys()))`.
* **Dòng 187 – 199 (Sự kiện `socket.on('unlock_all')` - Giải phóng toàn bộ giữ chỗ):**
  - Quét trong Map và xóa sạch mọi slot có `holderId === socket.id`.
  - Broadcast danh sách slot mới sau khi đã giải phóng cho tất cả người dùng khác.
* **Dòng 221 – 229 (Sự kiện `booking_updated` & `payment_success` - Relay thời gian thực):**
  - Chuyển tiếp tín hiệu cập nhật đơn đặt và thanh toán thành công giữa phân hệ Trang Chủ và phân hệ Nhân Viên Quầy POS Management System.
* **Dòng 232 – 250 (Sự kiện `socket.on('disconnect')` - Tự động dọn dẹp khi ngắt kết nối):**
  - Khi khách hàng mất mạng, tắt tab hoặc đóng trình duyệt, server tự động giải phóng toàn bộ các ô mà socket đó đang giữ và broadcast cho các máy khác.

---

#### + File 3: `qlsanbong_backend/src/routes/thanhToanRoutes.ts` (Định tuyến API Thanh Toán)
* **Dòng 15 – 28 (Khai báo các Endpoints PayOS VietQR MB Bank):**
  - `POST /payos/tao-link`: Trỏ đến controller `thanhToanController.taoThanhToanPayOS` (Tạo đơn & link QR).
  - `GET /payos/trang-thai/:orderCode`: Trỏ đến controller `thanhToanController.kiemTraTrangThaiPayOS` (Polling kiểm tra).
  - `POST /payos/webhook`: Trỏ đến controller `thanhToanController.xuLyWebhookPayOS` (Nhận Webhook từ MB Bank/PayOS).
  - `POST /payos/confirm-webhook`: Trỏ đến `thanhToanController.xacNhanWebhookUrl` (Đăng ký Webhook với cổng thanh toán).
  - `POST /payos/huy-don-tam`: Trỏ đến controller `thanhToanController.huyDonTamPayOS` (Hủy đơn tạm khi thoát).

---

#### + File 4: `qlsanbong_backend/src/controllers/thanhToanController.ts` (Xử lý nghiệp vụ Backend)
* **Dòng 128 – 294 (Hàm `taoThanhToanPayOS` - Tạo đơn đặt tạm thời và sinh liên kết VietQR):**
  - Nhận `bookingData`, `so_tien`, `loai_thanh_toan`, `ho_ten`, `so_dien_thoai`.
  - Kiểm tra khách hàng theo số điện thoại; nếu chưa có tài khoản thì tự động gọi Stored Procedure `sp_ThemNguoiDung` để tạo mới.
  - Thực thi Stored Procedure `sp_DatSan` với trạng thái ban đầu là `CHO_THANH_TOAN` và phương thức `CHUYEN_KHOAN` -> Nhận lại `finalDonDatId`.
  - Tạo `orderCode` ngẫu nhiên và sinh nội dung chuyển khoản chuẩn hóa: `description = "DS" + finalDonDatId` (Ví dụ: `DS125`).
  - Lưu mã `orderCode` vào ghi chú đơn đặt sân để phục vụ truy vấn đối soát.
  - Gọi SDK PayOS: `payOS.createPaymentLink(...)` truyền số tiền, orderCode, description và URL trả về.
  - Phản hồi JSON chứa: `qrCode` (chuỗi mã VietQR), `accountNumber` (Số tài khoản MB Bank), `accountName`, `amount`, `orderCode`, `ma_don_dat`.
* **Dòng 308 – 475 (Hàm `kiemTraTrangThaiPayOS` - Polling đối soát giao dịch):**
  - Nhận `orderCode` từ URL params, gọi `payOS.getPaymentLinkInformation(orderCode)` lấy dữ liệu sao kê ngân hàng MB Bank.
  - Đối soát nội dung chuyển khoản: So khớp xem có chứa đúng chuỗi `DS<ma_don_dat>` hay không.
  - Nếu khớp nội dung và tiền đã vào: Thực thi Stored Procedure `sp_ThanhToanDon` chuyển đơn sang `DA_COC` hoặc `DA_THANH_TOAN`, đồng thời phát sự kiện `io.emit('payment_success')` và `io.emit('booking_updated')`.
  - Nếu phát hiện sai nội dung: Gọi thủ tục `sp_GhiNhanChuyenKhoanSaiNoiDung` ghi log cảnh báo và thông báo về client.
* **Dòng 490 – 632 (Hàm `xuLyWebhookPayOS` - Xử lý Webhook tự động từ PayOS khi MB Bank báo có tiền):**
  - Nhận payload giao dịch do PayOS bắn sang khi tài khoản MB Bank nhận tiền.
  - Xác thực tính toàn vẹn dữ liệu qua `payOS.verifyPaymentWebhookData(req.body)`.
  - Trích xuất `orderCode`, số tiền nhận và nội dung chuyển khoản (`description`).
  - Dùng biểu thức chính quy Regex `/DS\s*0*(\d+)/i` để bóc tách mã đơn đặt sân.
  - Kiểm tra tính hợp lệ của nội dung: Nếu đúng cú pháp -> Gọi Stored Procedure `sp_ThanhToanDon` cập nhật đơn thành công; phát sóng WebSocket `payment_success` và `booking_updated`.
  - Nếu sai nội dung: Gọi `sp_GhiNhanChuyenKhoanSaiNoiDung`, không kích hoạt đơn bừa bãi nhằm bảo vệ an toàn tài chính.
* **Dòng 804 – 846 (Hàm `huyDonTamPayOS` - Hủy đơn tạm thời khi khách hủy):**
  - Nhận `ma_don_dat` hoặc `orderCode`, gọi Stored Procedure `sp_HuyDonTam` xóa bỏ bản ghi đơn tạm trong Database.
  - Phát sóng `io.emit('booking_updated')` để các máy khách khác lập tức thấy slot chuyển về màu xanh trống.

---

#### + File 5: `Data SQL server 2022/ThuTuc.sql` (Tầng dữ liệu 100% Stored Procedures)
* **Dòng 27 – 65 (Stored Procedure `sp_ThemNguoiDung`):**
  - Nhận tham số: `@ho_ten`, `@email`, `@so_dien_thoai`, `@mat_khau`, `@vai_tro`, `@MaVaiTro`.
  - Tự động chèn khách hàng mới vào bảng `Nguoi_Dung` nếu chưa tồn tại, trả về ID người dùng vừa tạo.
* **Dòng 1128 – 1220 (Stored Procedure `sp_DatSan`):**
  - Nhận tham số: `@ma_nguoi_dung`, `@ma_san`, `@ngay_da`, `@gio_bat_dau`, `@gio_ket_thuc`, `@tien_san`, `@tong_tien`, `@phuong_thuc`, `@trang_thai`, `@ghi_chu`.
  - Mở `BEGIN TRANSACTION` với mức cô lập nghiêm ngặt: Kiểm tra điều kiện xung đột khung giờ bằng mệnh đề:  
    `WHERE ma_san = @ma_san AND ngay_da = @ngay_da AND trang_thai NOT IN ('DA_HUY') AND (gio_bat_dau < @gio_ket_thuc AND gio_ket_thuc > @gio_bat_dau)`.
  - Nếu không xung đột: Chèn bản ghi vào bảng `Don_Dat_San` với trạng thái truyền vào (`CHO_THANH_TOAN`), gán ID mới qua `SCOPE_IDENTITY()`, gọi `COMMIT TRANSACTION` và trả về thông tin đơn.
* **Dòng 1596 – 1680 (Stored Procedure `sp_ThanhToanDon`):**
  - Nhận tham số: `@ma_don_dat`, `@phuong_thuc`, `@loai_thanh_toan`, `@so_tien`, `@ma_giao_dich`, `@noi_dung_chuyen_khoan`.
  - Mở `BEGIN TRANSACTION`: Chèn bản ghi giao dịch thành công vào bảng `Thanh_Toan`.
  - Tự động cập nhật trạng thái đơn đặt sân:  
    - Nếu `@loai_thanh_toan = 'DAT_COC'`: Cập nhật trạng thái thành `'DA_COC'`.  
    - Nếu `@loai_thanh_toan = 'TRA_HET'`: Cập nhật trạng thái thành `'DA_THANH_TOAN'`.
  - `COMMIT TRANSACTION` đảm bảo toàn vẹn dữ liệu thanh toán.
* **Dòng 1744 – 1775 (Stored Procedure `sp_GhiNhanChuyenKhoanSaiNoiDung`):**
  - Nhận mã đơn, số tiền và nội dung thực tế khách đã chuyển khoản.
  - Ghi nhận thông tin cảnh báo vào bảng thanh toán và ghi chú đơn, hỗ trợ Admin đối soát thủ công.
* **Dòng 3103 – 3150 (Stored Procedure `sp_HuyDonTam`):**
  - Nhận tham số `@ma_don_dat` hoặc `@searchStr`.
  - Xóa an toàn các bản ghi liên quan trong `Chi_Tiet_Dich_Vu`, `Thanh_Toan` và `Don_Dat_San` đối với các đơn đang ở trạng thái `CHO_THANH_TOAN` hoặc `CHUA_THANH_TOAN` (tuyệt đối không xóa đơn đã thanh toán hoặc đơn có cảnh báo tiền).

---

### - Cách hoạt động: mô tả chi tiết luồng đi hoạt động của chức năng

#### + Bước 1: Khách hàng truy cập Trang chủ, xem ma trận lịch sân thời gian thực (Real-time Grid)
- Trình duyệt tải toàn bộ danh sách sân và lịch đặt theo ngày từ CSDL SQL Server.
- Các ô khung giờ (mỗi ô 30 phút từ 06:00 đến 23:00) được hiển thị trực quan theo 4 trạng thái màu:
  + Màu Xanh lá: Ô còn trống, có thể bấm vào đặt.
  + Màu Cam / Tím (kèm hiệu ứng sóng nhấp nháy Ping): Ô đang có khách hàng khác giữ chỗ theo thời gian thực.
  + Màu Đỏ / Vàng: Ô đã có đơn đặt chính thức trong CSDL (Đã cọc hoặc Đã thanh toán).
  + Màu Xám mờ: Ô thuộc khung giờ đã trôi qua trong quá khứ so với thời gian hiện tại.
- Đồng thời, Frontend thiết lập kết nối Socket.IO với máy chủ Backend để sẵn sàng nhận các biến động lịch sân.

#### + Bước 2: Khách hàng click chọn ô giờ trống -> Kích hoạt cơ chế khóa giữ chỗ Real-Time (Socket.IO Court Locking)
- Khách hàng (ví dụ: Khách A) click vào ô `11:30` của Sân 5A.
- Hàm `handleSlotClick` trên Frontend kiểm tra:
  + Nếu khách chưa đăng nhập: Tự động bật Modal đăng nhập/đăng ký.
  + Nếu ô đã có người đặt trong DB hoặc đang bị người khác giữ trên RAM: Hiện thông báo từ chối chọn.
- Hệ thống tự động tính dải thời gian tối đa mà khách có thể mua từ mốc này mà không bị chạm vào lịch của người khác (Ví dụ từ 11:30 đến 13:00 đang trống -> dải tối đa là 90 phút, gồm 3 ô: `11:30`, `12:00`, `12:30`).
- Frontend phát sự kiện Socket.IO: `emit('lock_slots', ['2026-10-23_1_11:30', '2026-10-23_1_12:00', '2026-10-23_1_12:30'])`.
- Server Backend nạp 3 slot này vào bộ nhớ RAM (`lockedSlots Map`) gắn với `socket.id` của Khách A, sau đó phát lệnh `io.emit('slots_updated')` đến toàn bộ người dùng khác.
- Ngay lập tức, trên màn hình của tất cả các khách hàng khác, cả 3 ô giờ trên đều chuyển sang màu CAM giữ chỗ và bị vô hiệu hóa click, triệt tiêu hoàn toàn khả năng xung đột trùng giờ (Race Condition).
- Màn hình của Khách A hiển thị Modal đặt sân ở Bước 1: Mặc định chọn mốc 30 phút.

#### + Bước 3: Khách hàng chọn thời lượng đá (30p, 60p, 90p, 120p) - Duy trì khóa toàn dải ô
- Trong Modal, Khách A có thể bấm chọn mốc thời lượng mong muốn (Ví dụ: 30 phút, 60 phút hoặc 90 phút).
- Khi Khách A bấm chọn nút bất kỳ, hàm `handleSelectDuration` kích hoạt:
  + Cập nhật lại giờ kết thúc dự kiến và tính lại tiền sân tương ứng.
  + **Điểm ưu việt kỹ thuật:** Hệ thống vẫn tiếp tục duy trì phát `lock_slots` cho toàn bộ dải ô khả dụng (cả 3 ô `11:30`, `12:00`, `12:30`) chứ không thu hẹp danh sách khóa. Nhờ đó, người khác không thể vào cướp slot sau lưng khi khách đang cân nhắc thời lượng.
- Khách A bấm "Tiếp tục" -> Chuyển sang Bước 2: Chọn dịch vụ & Điền thông tin.

#### + Bước 4: Khách hàng chọn dịch vụ đi kèm & Phương thức thanh toán
- Khách hàng có thể tích chọn thêm các tiện ích đi kèm: Nước suối Aquafina, Nước tăng lực Redbull, Thuê áo bib thi đấu, Thuê trọng tài, Thuê bóng thi đấu.
- Hệ thống tự động tính toán tổng chi phí: `Tổng tiền = Tiền sân + Tổng tiền dịch vụ`.
- Khách hàng chọn hình thức thanh toán trực tuyến:
  + **Đặt cọc 30%:** Giữ chân sân, số tiền còn lại sẽ thanh toán tại quầy khi đến đá.
  + **Thanh toán 100%:** Trả hết toàn bộ tiền sân và dịch vụ.
- Thông tin họ tên và số điện thoại được tự động điền sẵn từ tài khoản đăng nhập.

#### + Bước 5: Xác nhận đặt sân -> Backend tạo đơn tạm thời và sinh mã VietQR PayOS (MB Bank)
- Khách hàng bấm nút **"Thanh toán VietQR MB Bank"**.
- Frontend gửi yêu cầu `POST /api/thanh-toan/payos/tao-link` mang toàn bộ dữ liệu đặt sân sang Backend.
- Máy chủ Backend thực hiện các tác vụ tuần tự:
  1. Kiểm tra tài khoản khách theo số điện thoại (nếu chưa có tài khoản sẽ tự gọi `sp_ThemNguoiDung` để lưu thông tin).
  2. Thực thi Stored Procedure `sp_DatSan` ghi nhận đơn đặt sân vào bảng `Don_Dat_San` ở trạng thái tạm thời `CHO_THANH_TOAN`.
  3. Lấy mã đơn vừa sinh (Ví dụ đơn `#125`), tạo cú pháp nội dung chuyển khoản chuẩn mực: `DS125`.
  4. Tạo mã `orderCode` ngẫu nhiên và gọi SDK PayOS (`payOS.createPaymentLink`) truyền số tiền, orderCode, description `DS125`.
  5. PayOS kết nối cổng Open Banking của Ngân Hàng Quân Đội (MB Bank) tạo mã VietQR động chuẩn Napas 247.
- Backend trả dữ liệu về cho Frontend: chuỗi mã `qrCode`, số tài khoản MB Bank, tên chủ tài khoản ("CAO VAN HOT XOAN"), số tiền chính xác, mã đơn đặt.
- Frontend chuyển Modal sang Bước 3: Hiển thị mã VietQR thanh toán rõ nét, kèm thông tin chi tiết và bộ đếm ngược thời gian giữ chỗ 10 phút.

#### + Bước 6: Khách hàng quét mã VietQR bằng App Ngân Hàng để chuyển tiền
- Khách hàng mở ứng dụng ngân hàng bất kỳ (MB Bank, Vietcombank, Techcombank, BIDV, MoMo,...) và chọn tính năng Quét mã QR.
- Ứng dụng ngân hàng tự động điền đầy đủ: Số tài khoản thụ hưởng MB Bank, Số tiền cần chuyển chính xác từng đồng, và Nội dung chuyển khoản là `DS125`. Khách không cần tự gõ bất kỳ thông tin nào, tránh nhầm lẫn sai sót.
- Khách hàng xác thực vân tay / FaceID / mã PIN để hoàn tất lệnh chuyển tiền.

#### + Bước 7: MB Bank ghi nhận tiền vào -> PayOS gửi Webhook tự động đến Backend
- Trong vòng 1 đến 3 giây ngay khi tài khoản MB Bank nhận được tiền, hệ thống PayOS nhận được thông báo biến động số dư tức thời từ ngân hàng.
- PayOS lập tức đóng gói dữ liệu giao dịch và gửi một `POST Webhook` an toàn đến máy chủ Backend tại endpoint `/api/thanh-toan/payos/webhook`.
- Backend tiếp nhận Webhook và xác thực tính toàn vẹn của chữ ký số (`verifyPaymentWebhookData`) nhằm chống gian lận và tấn công giả mạo yêu cầu.

#### + Bước 8: Backend đối soát nội dung sao kê và thực thi Stored Procedure `sp_ThanhToanDon`
- Backend trích xuất mã đơn từ nội dung sao kê (`DS125` -> Đơn ID: `125`).
- Kiểm tra tính hợp lệ của nội dung:
  + **Trường hợp đúng nội dung (`DS125`):**
    - Backend gọi Stored Procedure `sp_ThanhToanDon` trong SQL Server.
    - SQL Server mở Transaction: Chèn bản ghi giao dịch vào bảng `Thanh_Toan`, đồng thời cập nhật trạng thái đơn đặt sân từ `CHO_THANH_TOAN` sang `DA_COC` (nếu đặt cọc 30%) hoặc `DA_THANH_TOAN` (nếu trả 100%).
    - Phát tín hiệu Socket.IO thời gian thực:  
      `io.emit('payment_success', { ma_don_dat: 125, so_tien: amount, ... })`  
      `io.emit('booking_updated')`
  + **Trường hợp sai nội dung chuyển khoản:**
    - Backend ghi nhận cảnh báo qua Stored Procedure `sp_GhiNhanChuyenKhoanSaiNoiDung`.
    - Không tự động duyệt đơn bừa bãi; thông báo lỗi cho người dùng và gửi cảnh báo để quản trị viên kiểm tra đối soát thủ công.

#### + Bước 9: Cập nhật giao diện toàn hệ thống theo thời gian thực (Real-time Broadcast)
- Trình duyệt của Khách A bắt được sự kiện Socket `payment_success`:
  + Modal QR tự động đóng lại và chuyển sang màn hình thông báo **"🎉 Chúc mừng! Bạn đã đặt sân thành công!"**.
  + Frontend phát sự kiện Socket `unlock_all` để giải phóng các ô giữ chỗ tạm thời trên RAM.
  + Bắt đầu đếm ngược 10 giây tự động đóng màn hình thông báo chúc mừng.
- Cùng lúc đó, tất cả các máy khách khác trên mạng và phân hệ Quản lý tại quầy (POS) nhận được sự kiện `booking_updated`:
  + Tự động gọi lại API lấy lịch sân: Ô `11:30 - 12:00` chuyển từ màu cam giữ chỗ sang **Màu Đỏ (hoặc Vàng Đã Cọc)** mang tên khách hàng.
  + Các ô giờ còn lại (`12:00`, `12:30`) không được mua tự động trở về **Màu Xanh TRỐNG** để khách hàng tiếp theo có thể đặt ngay lập tức.

#### + Bước 10: Xử lý an toàn khi khách hủy bỏ / đóng modal / tải lại trang / quá thời gian
- **Khách hàng bấm nút Đóng (X) hoặc Hủy đặt:**
  + Frontend gửi sự kiện Socket `unlock_all` nhả ngay các ô giữ chỗ về màu xanh.
  + Gửi yêu cầu `POST /api/thanh-toan/payos/huy-don-tam` sang Backend để thực thi Stored Procedure `sp_HuyDonTam` xóa bỏ đơn tạm, tránh rác dữ liệu trong Database.
- **Khách hàng tải lại trang (F5) hoặc tắt trình duyệt:**
  + Hàm `handleUnloadOrReload` kích hoạt `navigator.sendBeacon` tự động bắn yêu cầu hủy đơn ngầm về Backend.
  + Sự kiện `disconnect` trên Socket.IO Server tự động dọn dẹp các slot mà socket đó đang giữ trong bộ nhớ RAM.
- **Hết thời gian đếm ngược 10 phút (Timeout):**
  + Giao diện tự động thông báo hết hạn thanh toán, đóng Modal và kích hoạt quy trình giải phóng slot tương tự như khi bấm hủy.

---
*Tài liệu được biên soạn phục vụ công tác báo cáo, thuyết trình và vấn đáp Đồ Án Tốt Nghiệp Sport247.*
