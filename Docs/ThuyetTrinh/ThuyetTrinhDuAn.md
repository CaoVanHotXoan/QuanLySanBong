# KỊCH BẢN THUYẾT TRÌNH BẢO VỆ ĐỒ ÁN TỐT NGHIỆP: DỰ ÁN SOCCER247
**Đề tài:** Hệ Thống Quản Lý & Đặt Sân Bóng Đá Toàn Diện (`Soccer247` / `QuanLySanBong`)  
**Sinh viên thực hiện:**  
- **Cao Văn Hột Xoàn** — MSSV: 525000452 (525000462)  
- **Phạm Tiến Doanh** — MSSV: 525000463  
**Đơn vị đào tạo:** Khoa Công Nghệ Thông Tin — Trường Đại Học Lạc Hồng (LHU)  
**Thời lượng thuyết trình chuẩn:** 10 – 15 phút (kèm phần chuyển tiếp Live Demo & Vấn đáp Q&A)  
**Tài liệu tham chiếu:** [`Soccer247-He-Thong-Quan-Ly-and-DJat-San-Bong-DJa-Toan-Dien.pptx`](file:///d:/BaoCaoTotNghiep/Docs/Soccer247-He-Thong-Quan-Ly-and-DJat-San-Bong-DJa-Toan-Dien.pptx)

---

## MỤC LỤC ĐIỀU HƯỚNG BÀI NÓI
1. [Chiến thuật & Phong thái thuyết trình ghi điểm](#1-chiến-thuật--phong-thái-thuyết-trình-ghi-điểm)
2. [Phân bổ thời gian 10 Slide theo tiêu chuẩn](#2-phân-bổ-thời-gian-10-slide-theo-tiêu-chuẩn)
3. [Kịch bản lời thoại chi tiết từng Slide (Từ Slide 1 đến Slide 10)](#3-kịch-bản-lời-thoại-chi-tiết-từng-slide)
   - [Slide 1: Bìa — Giới thiệu Đề tài & Tác giả](#slide-1-bìa--giới-thiệu-đề-tài--tác-giả)
   - [Phần Mở Rộng: LÝ DO CHỌN ĐỀ TÀI & TÍNH CẤP THIẾT CỦA DỰ ÁN](#phần-mở-rộng-lý-do-chọn-đề-tài--tính-cấp-thiết-của-dự-án)
   - [Slide 2: 01 — Tổng quan Nền tảng & 3 Phân hệ](#slide-2-01--tổng-quan-nền-tảng--3-phân-hệ)
   - [Slide 3: 02 — Cơ chế Đồng bộ Thời gian thực (Socket.IO Court Locking)](#slide-3-02--cơ-chế-đồng-bộ-thời-gian-thực-socketio-court-locking)
   - [Slide 4: 03 — Tài chính, Đặt cọc & Thanh toán PayOS VietQR](#slide-4-03--tài-chính-đặt-cọc--thanh-toán-payos-vietqr)
   - [Slide 5: 04 — Giao diện Người dùng (Customer Web App UI/UX)](#slide-5-04--giao-diện-người-dùng-customer-web-app-uiux)
   - [Slide 6: 05 — Vận hành Tại quầy (Staff POS System)](#slide-6-05--vận-hành-tại-quầy-staff-pos-system)
   - [Slide 7: 06 — Điều hành Tổng thể (Admin Dashboard 16 Modules)](#slide-7-06--điều-hành-tổng-thể-admin-dashboard-16-modules)
   - [Slide 8: 07 — Kiến trúc Công nghệ Toàn diện (Tech Stack)](#slide-8-07--kiến-trúc-công-nghệ-toàn-diện-tech-stack)
   - [Slide 9: 08 — Cơ sở Dữ liệu & An ninh Bảo mật (Database & Security)](#slide-9-08--cơ-sở-dữ-liệu--an-ninh-bảo-mật-database--security)
   - [Slide 10: 09 — Hoàn tất Thuyết minh & Mở đầu Q&A](#slide-10-09--hoàn-tất-thuyết-minh--mở-đầu-qa)
4. [Kịch bản phối hợp Demo trực tiếp (Live Demo Script)](#4-kịch-bản-phối-hợp-demo-trực-tiếp-live-demo-script)
5. [Bộ câu hỏi "Bẫy" của Hội đồng & Chiến thuật phản biện thực tế](#5-bộ-câu-hỏi-bẫy-của-hội-đồng--chiến-thuật-phản-biện-thực-tế)

---

## 1. CHIẾN THUẬT & PHONG THÁI THUYẾT TRÌNH GHI ĐIỂM

> [!TIP]
> **Nguyên tắc "3 Nhất" để chinh phục Hội đồng:**
> 1. **Phong thái tự tin nhất:** Giọng nói to, rõ ràng, dứt khoát, duy trì giao tiếp ánh mắt (eye contact) với các Thầy/Cô trong Hội đồng chấm. Không đọc thuộc lòng từng chữ trên slide; slide chỉ hiển thị từ khóa, người nói đóng vai trò làm sáng tỏ giá trị kỹ thuật và tính ứng dụng thực tế.
> 2. **Dẫn chứng kỹ thuật sâu sắc nhất:** Mỗi tính năng trình bày đều gắn liền với giải pháp kiến trúc thực tế (Ví dụ: Thay vì chỉ nói "đặt sân không bị trùng", hãy nói *"hệ thống xử lý race condition bằng cơ chế In-Memory Locking trên Socket.io kết hợp Serializable Transaction của SQL Server"*).
> 3. **Phối hợp nhóm ăn ý nhất:** Hai thành viên đứng hai bên bục thuyết trình; người nói chính trình bày logic, người phụ trách demo thao tác dứt khoát theo hiệu lệnh, nhịp nhàng từng thao tác chuột.

---

## 2. PHÂN BỔ THỜI GIAN 10 SLIDE THEO TIÊU CHUẨN

| Thứ tự Nội dung | Nội dung trọng tâm | Thời lượng gợi ý | Người trình bày gợi ý |
|---|---|---|---|
| **Slide 1** | Bìa: Chào hỏi, giới thiệu thành viên & đề tài | **45 giây** | Thành viên 1 |
| **Phần Mở Rộng** | **Lý do chọn đề tài & 3 Nỗi đau thực tiễn** | **1 phút 15 giây** | Thành viên 1 (Rất quan trọng) |
| **Slide 2** | 01 — Tổng quan Nền tảng: 3 Phân hệ chính | **1 phút 15 giây** | Thành viên 1 |
| **Slide 3** | 02 — Cơ chế Khóa Slot Thời gian thực (Socket.IO) | **1 phút 45 giây** | Thành viên 1 (Trọng điểm kỹ thuật) |
| **Slide 4** | 03 — Tài chính, Thanh toán PayOS VietQR & CSKH | **1 phút 30 giây** | Thành viên 1 |
| **Slide 5** | 04 — Phân hệ Khách hàng (Customer Web App) | **1 phút 15 giây** | Thành viên 2 |
| **Slide 6** | 05 — Phân hệ Nhân viên tại quầy (POS System) | **1 phút 30 giây** | Thành viên 2 |
| **Slide 7** | 06 — Phân hệ Quản trị trung tâm (Admin Dashboard) | **1 phút 30 giây** | Thành viên 2 |
| **Slide 8** | 07 — Kiến trúc Công nghệ & Hạ tầng triển khai | **1 phút 30 giây** | Thành viên 1 |
| **Slide 9** | 08 — Tầng Cơ sở dữ liệu & 100% Stored Procedures | **1 phút 45 giây** | Thành viên 1 (Trọng điểm học thuật) |
| **Slide 10**| Hoàn tất thuyết minh & Giới thiệu phần Live Demo | **45 giây** | Cả hai thành viên |
| **Phần Demo**| Thao tác thực tế kịch bản giữ chỗ & POS song song | **3 – 4 phút** | Thành viên 2 thao tác, Thành viên 1 thuyết minh |

---

## 3. KỊCH BẢN LỜI THOẠI CHI TIẾT TỪNG SLIDE

---

### SLIDE 1: BÌA — GIỚI THIỆU ĐỀ TÀI & TÁC GIẢ
- **Tiêu đề Slide:** `SOCCER247 · DỰ ÁN HỆ THỐNG VẬN HÀNH`
- **Nội dung hiển thị:** *Soccer247 - Hệ Thống Quản Lý & Đặt Sân Bóng Đá Toàn Diện. Giải pháp số hóa "All-in-One" cho quy trình kinh doanh và vận hành sân nhân tạo. Cao Văn Hột Xoàn - MSSV: 525000452 | Phạm Tiến Doanh - MSSV: 525000463.*
- **Thời lượng:** ~45 giây.
- **Hành động:** Đứng thẳng, cúi đầu chào lịch sự, mỉm cười, tay chỉ nhẹ về phía màn chiếu.

#### 🎙️ Lời thoại trình bày:
> *"Kính thưa quý Thầy Cô trong Hội đồng chấm bảo vệ đồ án tốt nghiệp, cùng toàn thể các bạn sinh viên có mặt trong buổi bảo vệ ngày hôm nay!*
>
> *Em xin tự giới thiệu, em tên là **Cao Văn Hột Xoàn**, và đồng hành cùng em là bạn **Phạm Tiến Doanh**. Hôm nay, nhóm chúng em rất vinh dự được đại diện trình bày trước Hội đồng đề tài tốt nghiệp chuyên ngành Công nghệ Thông tin với tên gọi:*
>
> **'SOCCER247 — HỆ THỐNG QUẢN LÝ VÀ ĐẶT SÂN BÓNG ĐÁ TOÀN DIỆN'**.
>
> *Dự án Soccer247 được chúng em nghiên cứu và phát triển nhằm mang đến một giải pháp số hóa toàn diện theo mô hình 'All-in-One', giải quyết triệt để các bài toán nhức nhối trong quy trình kinh doanh, chống xung đột lịch đặt sân, tự động hóa thanh toán ngân hàng và tối ưu hóa vận hành mặt sân nhân tạo từ khách hàng đến quầy thu ngân và chủ sân.*
>
> *Trước khi đi sâu vào các chức năng kỹ thuật, em xin phép được trình bày ngắn gọn về **Lý do chọn đề tài và Tính cấp thiết** của dự án Soccer247!"*

---

### PHẦN MỞ RỘNG: LÝ DO CHỌN ĐỀ TÀI & TÍNH CẤP THIẾT CỦA DỰ ÁN
- **Vị trí trình bày:** Ngay sau lời chào mở đầu Slide 1 và dẫn nhập trực tiếp vào Slide 2.
- **Thời lượng:** ~1 phút 15 giây.
- **Mục tiêu ghi điểm:** Thể hiện rõ tư duy phân tích bài toán thực tế của một kỹ sư CNTT tương lai: *Phần mềm sinh ra từ nhu cầu có thật, giải quyết nỗi đau có thật của thị trường.*

#### 🎙️ Lời thoại trình bày chi tiết:
> *"Kính thưa Thầy Cô, lý do thúc đẩy nhóm chúng em quyết định lựa chọn và xây dựng đề tài Soccer247 xuất phát từ 4 động lực thực tiễn và công nghệ rõ nét:*
>
> 1. *Thứ nhất là **Sự bùng nổ của phong tràu thể thao phong trào:** Sau giờ làm việc và học tập, nhu cầu thuê sân bóng đá mini nhân tạo để rèn luyện sức khỏe của thanh niên, học sinh, sinh viên và nhân viên văn phòng tăng trưởng cực kỳ mạnh mẽ. Tuy nhiên, hạ tầng công nghệ phục vụ lĩnh vực này tại Việt Nam vẫn còn rất manh mún và sơ khai.*
>
> 2. *Thứ hai là **3 Nỗi đau lớn (Pain Points) của mô hình quản lý sân truyền thống:**
>    - **Đối với Khách đặt sân:** Phải gọi điện hoặc nhắn tin Zalo dò hỏi từng sân xem có giờ trống không rất mất thời gian. Khách không nhìn thấy được bảng giá minh bạch, và thường xuyên gặp tình trạng dở khóc dở cười: đến nơi thì sân đã bị người khác đá do nhân viên nhận trùng lịch.
>    - **Đối với Nhân viên tại quầy:** Ghi chép lịch bằng sổ tay hoặc file Excel rời rạc; lúc đông khách vào giờ cao điểm rất dễ nhầm lẫn. Khách gọi thêm nước ngọt, thuê áo bib thường bị sót, không ghi vào hóa đơn dẫn đến thất thoát tiền bạc cuối ca trực.
>    - **Đối với Chủ sân:** Không có mặt trực tiếp tại sân thì hoàn toàn 'mù mờ' về số liệu doanh thu thực tế; không thể thống kê được khung giờ nào đông, khung giờ nào vắng để kích cầu giảm giá, và việc kiểm kê kho nước giải khát rất dễ bị chênh lệch thất thoát.
>
> 3. *Thứ ba là **Xu hướng chuyển đổi số và Thanh toán không tiền mặt (Cashless Payment):** Khách hàng ngày nay chuộng quét mã QR ngân hàng nhanh chóng. Việc bắt khách chuyển khoản rồi chụp màn hình gửi qua Zalo chờ nhân viên kiểm tra số dư rất phiền hà và dễ bị lừa đảo bằng bill giả mạo. Cần phải có một cổng thanh toán tự động xác nhận trong tích tắc.*
>
> 4. *Và cuối cùng là **Thách thức kỹ thuật chuyên sâu:** Nhóm muốn vận dụng toàn bộ kiến thức chuyên ngành đã tích lũy trong 4 năm đại học — từ việc giải quyết bài toán đồng bộ thời gian thực **Real-time Concurrency (Socket.IO)**, tích hợp cổng thanh toán ngân hàng **Open Banking VietQR (PayOS)**, đến việc thiết kế chuẩn hóa cơ sở dữ liệu doanh nghiệp an toàn tuyệt đối với **100% Stored Procedures** trên Microsoft SQL Server 2022.*
>
> *Chính vì những lý do cấp thiết đó, nhóm chúng em đã phát triển nền tảng **Soccer247** để mang lại một lời giải trọn vẹn!"*

---

### SLIDE 2: 01 — TỔNG QUAN NỀN TẢNG & 3 PHÂN HỆ
- **Tiêu đề Slide:** `01 — TỔNG QUAN NỀN TẢNG`
- **Nội dung hiển thị:** *Web Application Fullstack áp dụng kiến trúc Client-Server hiện đại. 3 phân hệ: PHÂN HỆ NGƯỜI DÙNG, ĐIỀU HÀNH TẠI CHỖ (POS), QUẢN TRỊ TRUNG TÂM (Admin).*
- **Thời lượng:** ~1 phút 15 giây.
- **Mã nguồn liên kết:** [`qlsanbong_fontend/src/pages/index.tsx`](file:///d:/BaoCaoTotNghiep/qlsanbong_fontend/src/pages/index.tsx), [`management-system.tsx`](file:///d:/BaoCaoTotNghiep/qlsanbong_fontend/src/pages/management-system.tsx), [`Dashboard.tsx`](file:///d:/BaoCaoTotNghiep/qlsanbong_fontend/src/pages/Dashboard.tsx).
- **Hành động:** Nhấn mạnh cấu trúc 3 phân hệ tương ứng 3 đối tượng người dùng thực tế.

#### 🎙️ Lời thoại trình bày:
> *"Kính thưa Hội đồng, để giải quyết trọn vẹn 3 nỗi đau thực tế nêu trên, **Soccer247** được xây dựng dưới dạng một nền tảng **Web Application Fullstack** hoàn chỉnh theo kiến trúc Client-Server hiện đại, khép kín trong **3 phân hệ độc lập nhưng đồng bộ dữ liệu thời gian thực**:*
>
> 1. *Thứ nhất là **Phân hệ Khách hàng (Customer Web App):** Cung cấp giao diện trực quan giúp cầu thủ và đội bóng tra cứu tình trạng sân trống theo ngày, xem bảng giá theo khung giờ vàng và thực hiện đặt sân trực tuyến 24/7.*
> 2. *Thứ hai là **Phân hệ Điều hành tại quầy (Staff POS System):** Được thiết kế chuyên biệt cho nhân viên trực sân và thu ngân, hỗ trợ check-in khách vào sân chỉ với 1 click, giám sát lưới sân theo thời gian thực và bán lẻ nước uống độc lập.*
> 3. *Thứ ba là **Phân hệ Quản trị Trung tâm (Admin Dashboard):** Dành riêng cho chủ sân với hơn 16 phân hệ quản lý chuyên sâu — từ cấu hình giá linh hoạt theo giờ cao điểm, quản lý nhập/xuất kho hàng đến theo dõi báo cáo biểu đồ tài chính.*
>
> *Và điểm cốt lõi tạo nên sự khác biệt của Soccer247 chính là cơ chế đồng bộ dữ liệu mà em xin phép trình bày ngay ở Slide tiếp theo."*

---

### SLIDE 3: 02 — CƠ CHẾ ĐỒNG BỘ THỜI GIAN THỰC (SOCKET.IO COURT LOCKING)
- **Tiêu đề Slide:** `02 — CƠ CHẾ ĐỒNG BỘ THỜI GIAN THỰC`
- **Nội dung hiển thị:** *Realtime Court Locking giải quyết bài toán trùng lịch. Thao tác giữ chỗ kích hoạt ngay khi thao tác. Phát sóng Realtime qua Socket.IO. Khóa slot tức thì theo thời gian thực.*
- **Thời lượng:** ~1 phút 45 giây (**Slide cốt lõi kỹ thuật - cần nói rõ và tự tin**).
- **Mã nguồn liên kết:** [`qlsanbong_backend/src/server.ts`](file:///d:/BaoCaoTotNghiep/qlsanbong_backend/src/server.ts#L60-L140), hook [`useBookingSync.ts`](file:///d:/BaoCaoTotNghiep/qlsanbong_fontend/src/hooks/useBookingSync.ts).
- **Hành động:** Nhấn mạnh thuật toán giải quyết **Race Condition** và cơ chế giải phóng bộ nhớ.

#### 🎙️ Lời thoại trình bày:
> *"Thưa Thầy Cô, bài toán hóc búa nhất của một ứng dụng đặt sân trực tuyến là: **'Làm sao ngăn chặn hai người cùng nhấn đặt một sân tại cùng một khung giờ trong cùng một tích tắc (Race Condition)?'**.*
>
> *Nếu chỉ dùng cơ sở dữ liệu để kiểm tra lúc bấm nút thanh toán, trải nghiệm người dùng sẽ rất tệ vì họ đã mất công điền thông tin rồi mới nhận thông báo bị trùng. Để giải quyết triệt để vấn đề này, nhóm em đã thiết kế cơ chế **Realtime Court Locking** độc quyền trên nền tảng **Socket.IO**:*
>
> - *Cơ chế hoạt động như sau: Ngay khi một khách hàng nhấp chuột vào một ô slot trống trên ma trận sân, Frontend sẽ lập tức phát sự kiện `lock-slot` lên Backend.*
> - *Trên Backend, máy chủ Node.js duy trì một cấu trúc dữ liệu `lockedSlots` tối ưu trực tiếp trên bộ nhớ RAM. Server kiểm tra trong O(1): Nếu slot chưa bị ai chiếm, Server sẽ cấp quyền khóa tạm thời cho `socket.id` đó và lập tức **Broadcast (phát sóng)** sự kiện `slot-locked` tới toàn bộ các trình duyệt và màn hình POS của nhân viên đang mở.*
> - *Ngay lập tức, trên màn hình của tất cả những người dùng khác, ô slot đó sẽ chuyển sang màu tím hoặc xám kèm trạng thái **'Đang có người chọn'**, ngăn chặn tuyệt đối hành vi bấm đè.*
> - *Đặc biệt, để tránh trường hợp người dùng chọn giữ chỗ rồi bỏ quên hoặc tắt mạng làm 'treo' sân, hệ thống trang bị **Timer đếm ngược giữ chỗ (Countdown Timer)**. Sau thời gian quy định hoặc khi socket disconnect, Server sẽ tự động giải phóng slot và phát sóng mở khóa `slot-unlocked` trở lại.*
> - *Ngoài ra, nhân viên tại quầy còn được trang bị tính năng **Force Unlock** để chủ động xử lý can thiệp các trường hợp phát sinh khẩn cấp."*

---

### SLIDE 4: 03 — TÀI CHÍNH, ĐẶT CỌC & THANH TOÁN PAYOS VIETQR
- **Tiêu đề Slide:** `03 — TÀI CHÍNH & THANH TOÁN`
- **Nội dung hiển thị:** *Thanh toán linh hoạt, hoàn tiền qua Email. 01 Đặt cọc linh hoạt (30% hoặc toàn phần). 02 Tích hợp PayOS VietQR tự động. 03 Hoàn tiền qua CSKH. 04 Đối soát lịch sử.*
- **Thời lượng:** ~1 phút 30 giây.
- **Mã nguồn liên kết:** [`qlsanbong_backend/src/services/payosService.ts`](file:///d:/BaoCaoTotNghiep/qlsanbong_backend/src/services/payosService.ts), bảng [`Thanh_Toan`](file:///d:/BaoCaoTotNghiep/Data%20SQL%20server%202022/QuanLySanBong.sql#L113-L125), [`Lich_Su_Hoan_Tien`](file:///d:/BaoCaoTotNghiep/Data%20SQL%20server%202022/QuanLySanBong.sql#L128-L136).
- **Hành động:** Nhấn mạnh tính tự động hóa 100% của cổng thanh toán Open Banking, không cần người xác nhận thủ công.

#### 🎙️ Lời thoại trình bày:
> *"Về khía cạnh Tài chính và Thanh toán, Soccer247 cung cấp một luồng thanh toán hiện đại và an toàn bậc nhất hiện nay thông qua 4 trụ cột chính:*
>
> 1. *Thứ nhất là **Chính sách Đặt cọc linh hoạt:** Hệ thống cho phép khách hàng lựa chọn **Đặt cọc trước 30%** theo tiêu chuẩn thương mại hoặc **Thanh toán toàn phần 100%**, hoặc trả sau bằng tiền mặt khi tới sân.*
> 2. *Thứ hai là **Tích hợp Cổng thanh toán tự động PayOS VietQR:** Nhóm đã tích hợp trực tiếp SDK của PayOS liên kết hệ thống ngân hàng Quân đội MB Bank. Khi khách chọn thanh toán, hệ thống tự động sinh một mã VietQR động chứa chính xác số tiền và mã đơn hàng duy nhất (`orderCode`).*
>    - *Khi khách quét mã chuyển tiền thành công, Open Banking Webhook sẽ đẩy dữ liệu về API Backend trong vòng chưa đầy 2 giây.*
>    - *Hệ thống tự động kích hoạt Stored Procedure cập nhật trạng thái đơn thành `DA_COC` hoặc `DA_THANH_TOAN` và phát sóng Socket.IO đóng Modal thanh toán trên máy khách ngay tức khắc mà không cần chụp màn hình chuyển khoản gửi cho chủ sân xác nhận thủ công.*
> 3. *Thứ ba là **Quy trình Hoàn tiền minh bạch (Refund Policy):** Trong trường hợp thời tiết mưa bão hoặc sự cố, khách hàng có thể gửi yêu cầu hỗ trợ qua module Liên hệ. Quản trị viên sau khi kiểm tra lý do và điều kiện hủy sẽ thực hiện duyệt hoàn tiền.*
> 4. *Thứ tư là **Đối soát & Nhật ký tài chính:** Mọi biến động dòng tiền đều được ghi nhận chi tiết vào 2 bảng `Thanh_Toan` và `Lich_Su_Hoan_Tien`, đảm bảo độ chính xác tuyệt đối trong khâu kiểm toán cuối ngày."*

---

### SLIDE 5: 04 — GIAO DIỆN NGƯỜI DÙNG (CUSTOMER WEB APP UI/UX)
- **Tiêu đề Slide:** `04 — GIAO DIỆN NGƯỜI DÙNG`
- **Nội dung hiển thị:** *Phân hệ Khách hàng - Customer Web App. Giao diện thân thiện hỗ trợ Dark/Light mode. Bản đồ Leaflet định vị trực quan. Tra cứu lịch trống và đặt sân. Mua kèm dịch vụ nước uống.*
- **Thời lượng:** ~1 phút 15 giây.
- **Mã nguồn liên kết:** [`qlsanbong_fontend/src/pages/index.tsx`](file:///d:/BaoCaoTotNghiep/qlsanbong_fontend/src/pages/index.tsx), component [`DateNavigationBar`](file:///d:/BaoCaoTotNghiep/qlsanbong_fontend/src/pages/index.tsx#L48), CSS Tailwind v4.
- **Hành động:** Hướng tay về màn hình, miêu tả trải nghiệm thị giác và tiện ích dành cho người đặt sân.

#### 🎙️ Lời thoại trình bày:
> *(Thành viên 2 tiếp lời)*:
>
> *"Tiếp nối phần kiến trúc, em xin phép trình bày về **Phân hệ Giao diện Người dùng (Customer Web App)**.*
>
> *Với tôn chỉ lấy người dùng làm trung tâm, giao diện trang chủ Soccer247 được thiết kế theo phong cách hiện đại với 4 điểm nhấn nổi bật:*
>
> - *Thứ nhất, hỗ trợ chuyển đổi mượt mà giữa **Dark Mode và Light Mode**, giúp các cầu thủ dễ dàng theo dõi đặt sân cả vào ban ngày lẫn các khung giờ đá bóng đêm mà không bị mỏi mắt.*
> - *Thứ hai, trang bị **Bản đồ tương tác Leaflet OpenStreetMap** định vị cụm sân bóng trực quan, hiển thị đầy đủ thông tin địa chỉ, chỉ dẫn đường đi và hotline liên hệ.*
> - *Thứ ba là **Thanh chọn ngày thông minh kết hợp Bộ lọc phân loại sân:** Khách hàng có thể chuyển nhanh giữa các ngày trong tuần và lọc theo sân 5 người, sân 7 người hay sân 11 người. Toàn bộ lưới sân sẽ tự động nạp lại lịch trống tương ứng.*
> - *Thứ tư, tính năng **Upselling - Bán kèm dịch vụ:** Ngay trong hộp thoại đặt sân, khách hàng có thể chọn mua thêm nước khoáng, nước tăng lực, thuê áo tập bib hoặc trọng tài với bộ đếm số lượng trực quan, tổng tiền được tính toán tự động và minh bạch trước khi xuất mã QR thanh toán."*

---

### SLIDE 6: 05 — VẬN HÀNH TẠI QUẦY (STAFF POS SYSTEM)
- **Tiêu đề Slide:** `05 — VẬN HÀNH TẠI QUẦY`
- **Nội dung hiển thị:** *Phân hệ Nhân viên - POS System. Quản lý mặt sân: Giám sát lưới sân (Đang trống / Đã đặt / Tạm Khóa / Force Unlock). Thu ngân & Dịch vụ: Check-in nhanh, dịch vụ phát sinh, đơn bán lẻ nước uống độc lập.*
- **Thời lượng:** ~1 phút 30 giây.
- **Mã nguồn liên kết:** [`qlsanbong_fontend/src/pages/management-system.tsx`](file:///d:/BaoCaoTotNghiep/qlsanbong_fontend/src/pages/management-system.tsx).
- **Hành động:** Nhấn mạnh sự tiện lợi trong thao tác chuột của nhân viên thu ngân (giảm thời gian tạo đơn từ 3 phút xuống 10 giây).

#### 🎙️ Lời thoại trình bày:
> *"Tại khu vực điều hành mặt sân, nhân viên thu ngân được cung cấp một giao diện **POS System** chuyên nghiệp tại đường dẫn `/management-system`:*
>
> - *Giao diện được bố trí theo dạng **Ma trận Lưới thời gian thực**: Nhân viên có thể quan sát trực tiếp toàn bộ các cụm sân trên cùng một màn hình với hệ thống mã màu phân định rõ ràng:*
>   - *Màu xanh: Sân đang hoàn toàn trống.*
>   - *Màu vàng: Đơn cọc đang chờ xác nhận hoặc chuẩn bị nhận sân.*
>   - *Màu đỏ: Sân đã chốt thanh toán.*
>   - *Hiệu ứng chuyển động (Pulse): Slot đang có khách đá trên sân.*
> - *Khi khách đến sân, nhân viên chỉ cần nhấp chuột vào slot và bấm **'Xác nhận vào sân' (Check-in)**, hệ thống lập tức ghi nhận thời gian thực vào bảng `Don_Dat_San`.*
> - *Trong quá trình thi đấu, nếu đội bóng có nhu cầu gọi thêm nước suối hoặc mượn bóng, nhân viên có thể mở trực tiếp đơn đặt để cộng thêm dịch vụ phát sinh vào hóa đơn tổng.*
> - *Đặc biệt, hệ thống hỗ trợ **Tạo đơn bán lẻ nước và dịch vụ độc lập** (không cần gắn với lịch đặt sân) dành cho khách vãng lai ghé mua nước, tự động trừ tồn kho và in phiếu thu ngân một cách chuẩn xác."*

---

### SLIDE 7: 06 — ĐIỀU HÀNH TỔNG THỂ (ADMIN DASHBOARD 16 MODULES)
- **Tiêu đề Slide:** `06 — ĐIỀU HÀNH TỔNG THỂ`
- **Nội dung hiển thị:** *Phân hệ Quản trị viên - Admin Dashboard. Trang điều khiển trung tâm với 16 module. Theo dõi doanh thu, cấu hình bảng giá theo khung giờ. Quản lý kho hàng: Nhập / Xuất. Phân quyền người dùng và quản trị nội dung CMS/Banner.*
- **Thời lượng:** ~1 phút 30 giây.
- **Mã nguồn liên kết:** [`qlsanbong_fontend/src/pages/Dashboard.tsx`](file:///d:/BaoCaoTotNghiep/qlsanbong_fontend/src/pages/Dashboard.tsx#L101-L123), thư mục [`Data SQL server 2022/ThuTuc.sql`](file:///d:/BaoCaoTotNghiep/Data%20SQL%20server%202022/ThuTuc.sql).
- **Hành động:** Nêu bật chiều sâu nghiệp vụ quản trị của một phần mềm thương mại thực thụ.

#### 🎙️ Lời thoại trình bày:
> *"Ở cấp độ quản lý vĩ mô, **Phân hệ Admin Dashboard** đóng vai trò là 'bộ não điều hành trung tâm' với **16 modules quản trị chuyên sâu**, bao quát toàn bộ hoạt động kinh doanh của sân bóng:*
>
> 1. *Module **Báo cáo Thống kê & Doanh thu:** Cung cấp biểu đồ trực quan về doanh thu theo ngày, tuần, tháng, tỷ lệ lấp đầy sân theo từng khung giờ và phân tích nguồn thu (tiền sân vs tiền dịch vụ).*
> 2. *Module **Cấu hình Bảng giá & Khung giờ linh hoạt:** Chủ sân có thể thiết lập đơn giá khác nhau giữa giờ thấp điểm (ban ngày) và giờ cao điểm (sau 17h chiều và cuối tuần).*
> 3. *Module **Quản lý Kho & Nhập hàng:** Cho phép lập phiếu nhập kho hàng hóa (`Phieu_Nhap_Kho`), theo dõi biến động số lượng tồn kho của từng loại nước ngọt, tự động cảnh báo khi hàng sắp hết.*
> 4. *Module **Phân quyền & Tài khoản Người dùng:** Quản lý danh sách người dùng theo vai trò: `ADMIN`, `NHAN_VIEN` và `KHACH_HANG`.*
> 5. *Hệ thống **CMS Quản trị Nội dung:** Cho phép chủ sân tải lên hình ảnh hoặc video Banner đa phương tiện (tự động tối ưu qua Cloudinary), đăng tải tin tức khuyến mãi và phản hồi trực tiếp các ý kiến đóng góp từ khách hàng qua Email."*

---

### SLIDE 8: 07 — KIẾN TRÚC CÔNG NGHỆ TOÀN DIỆN (TECH STACK)
- **Tiêu đề Slide:** `07 — KIẾN TRÚC CÔNG NGHỆ`
- **Nội dung hiển thị:** *Nền tảng kỹ thuật - Tech Stack. Frontend: Next.js 16, React 19, TailwindCSS v4. Backend: Node.js, Express.js, Socket.IO, JWT bảo mật. Cloud Media: Cloudinary. Email SMTP: Nodemailer.*
- **Thời lượng:** ~1 phút 30 giây.
- **Mã nguồn liên kết:** [`package.json`](file:///d:/BaoCaoTotNghiep/qlsanbong_fontend/package.json), [`qlsanbong_backend/package.json`](file:///d:/BaoCaoTotNghiep/qlsanbong_backend/package.json).
- **Hành động:** Khẳng định việc lựa chọn công nghệ đón đầu xu hướng năm 2025-2026.

#### 🎙️ Lời thoại trình bày:
> *(Thành viên 1 tiếp lời)*:
>
> *"Kính thưa Thầy Cô, để đảm bảo hệ thống vận hành mượt mà, chịu tải cao và có tính mở rộng trong tương lai, chúng em đã lựa chọn một hệ sinh thái công nghệ đón đầu xu hướng:*
>
> - *Về **Frontend:** Chúng em sử dụng **Next.js phiên bản 16** kết hợp thư viện lõi **React 19** và **TypeScript 100%**. Việc sử dụng TypeScript giúp loại trừ triệt để các lỗi runtime do sai kiểu dữ liệu. Giao diện được xây dựng bằng **TailwindCSS v4** cho tốc độ biên dịch CSS siêu tốc và bộ icon vector **Lucide-React**.*
> - *Về **Backend:** Hệ thống xây dựng trên nền tảng **Node.js (LTS)** và **Express.js**, kết hợp cơ chế xử lý I/O bất đồng bộ non-blocking. Toàn bộ các API phản hồi đều được nén bằng middleware **compression (Gzip)**, giúp giảm từ 60% đến 80% dung lượng payload truyền qua mạng.*
> - *Về **Bảo mật:** Sử dụng **JSON Web Token (JWT)** cho xác thực không trạng thái (stateless authentication) và thuật toán băm mật khẩu một chiều **Bcryptjs (salted hash)**.*
> - *Về **Dịch vụ Đám mây & Bên thứ ba:** Tích hợp **Cloudinary CDN** để lưu trữ và nén ảnh/video tự động; sử dụng thư viện **Nodemailer** với giao thức Gmail SMTP để gửi mã OTP và phản hồi thư liên hệ tới khách hàng."*

---

### SLIDE 9: 08 — CƠ SỞ DỮ LIỆU & AN NINH BẢO MẬT (DATABASE & SECURITY)
- **Tiêu đề Slide:** `08 — CƠ SỞ DỮ LIỆU & BẢO MẬT`
- **Nội dung hiển thị:** *Kiến trúc cơ sở dữ liệu. Microsoft SQL Server 2022 core engine. Data Model: 15 bảng chuẩn hóa, tối ưu index. Business Logic: 100% via Stored Procedures. Security Layer: Chống SQL Injection tuyệt đối.*
- **Thời lượng:** ~1 phút 45 giây (**Slide bảo vệ học thuật - ghi điểm tối đa**).
- **Mã nguồn liên kết:** [`Data SQL server 2022/QuanLySanBong.sql`](file:///d:/BaoCaoTotNghiep/Data%20SQL%20server%202022/QuanLySanBong.sql), [`Data SQL server 2022/ThuTuc.sql`](file:///d:/BaoCaoTotNghiep/Data%20SQL%20server%202022/ThuTuc.sql).
- **Hành động:** Nhấn mạnh triết lý kiến trúc "100% Stored Procedures", mở sẵn file SQL để sẵn sàng chứng minh nếu Hội đồng hỏi.

#### 🎙️ Lời thoại trình bày:
> *"Một trong những điểm sáng kỹ thuật lớn nhất của dự án Soccer247 chính là ở tầng **Cơ sở dữ liệu (Database Layer)**:*
>
> - *Hệ thống sử dụng **Microsoft SQL Server 2022** làm hệ quản trị cơ sở dữ liệu quan hệ doanh nghiệp. Lược đồ CSDL gồm **15 bảng dữ liệu** được chuẩn hóa nghiêm ngặt theo dạng chuẩn 3 (3NF), thiết lập đầy đủ các quan hệ khóa ngoại (Foreign Key) và chỉ mục (Index) trên các trường thường xuyên tìm kiếm như `ngay_da`, `trang_thai`, `so_dien_thoai`.*
> - *Đặc biệt, **100% Logic nghiệp vụ được đóng gói hoàn toàn trong hơn 60+ Stored Procedures và Transact-SQL Functions**. Trong toàn bộ mã nguồn Backend Node.js, nhóm chúng em **tuyệt đối không sử dụng bất kỳ câu lệnh SQL thô (raw query)** dạng ghép chuỗi nào.*
> - *Ưu điểm vượt trội của kiến trúc này mang lại:*
>   1. *Thứ nhất, **Chống tấn công SQL Injection tuyệt đối:** Mọi tham số từ phía Client truyền vào đều được driver `node-mssql` ép kiểu rõ ràng qua cơ chế Parameterized Input của Stored Procedure.*
>   2. *Thứ hai, **Tối ưu hóa hiệu năng thực thi:** Các Stored Procedure được SQL Server biên dịch sẵn thành Execution Plan trên bộ nhớ đệm, giúp tốc độ truy vấn nhanh hơn gấp nhiều lần so với raw query.*
>   3. *Thứ ba, **Tính toàn vẹn giao dịch (ACID Transactions):** Trong các thao tác nhạy cảm như đặt sân kèm dịch vụ hoặc nhập kho, nghiệp vụ được bọc trong khối `BEGIN TRANSACTION ... COMMIT TRANSACTION ... BEGIN CATCH ... ROLLBACK`, đảm bảo nếu có bất kỳ lỗi nào xảy ra thì dữ liệu sẽ được khôi phục nguyên vẹn, không bao giờ xuất hiện tình trạng đơn rác hoặc trừ tiền mà không ghi nhận sân."*

---

### SLIDE 10: 09 — HOÀN TẤT THUYẾT MINH & MỞ ĐẦU Q&A
- **Tiêu đề Slide:** `SOCCER247 · HOÀN TẤT THUYẾT MINH`
- **Nội dung hiển thị:** *Chân thành cảm ơn! Cảm ơn Thầy/Cô và các bạn đã chú ý lắng nghe phần trình bày. Q&A Phần hỏi đáp.*
- **Thời lượng:** ~45 giây.
- **Hành động:** Hai thành viên đứng song song, cúi chào Hội đồng, chuyển màn hình sang giao diện Web đang chạy thực tế để bắt đầu Live Demo.

#### 🎙️ Lời thoại trình bày:
> *"Kính thưa quý Thầy Cô trong Hội đồng chấm tốt nghiệp!*
>
> *Trên đây là toàn bộ nội dung tổng quan về mục tiêu, giải pháp kiến trúc, công nghệ và cơ sở dữ liệu của dự án **Soccer247 — Hệ Thống Quản Lý Và Đặt Sân Bóng Đá Toàn Diện**.*
>
> *Chúng em xin chân thành gửi lời cảm ơn sâu sắc đến quý Thầy Cô trong Khoa Công nghệ Thông tin, đặc biệt là Thầy/Cô hướng dẫn đã luôn tận tình định hướng, chỉ bảo và hỗ trợ chúng em trong suốt quá trình hoàn thiện đồ án này.*
>
> *Sau đây, chúng em xin phép được trình chiếu phần **Live Demo trực tiếp hệ thống trên môi trường thực tế** để minh họa các kịch bản giữ chỗ Real-time, tạo đơn POS và thanh toán tự động, sau đó lắng nghe những nhận xét, góp ý và giải đáp các câu hỏi vấn đáp từ phía Hội đồng.*
>
> *Em xin chân thành cảm ơn Thầy Cô!"*

---

## 4. KỊCH BẢN PHỐI HỢP DEMO TRỰC TIẾP (LIVE DEMO SCRIPT)

> [!IMPORTANT]
> **Chuẩn bị trước khi lên thuyết trình:**
> - Mở sẵn 2 cửa sổ trình duyệt đặt cạnh nhau (Split Screen):
>   - Cửa sổ 1 (Bên trái): Trình duyệt người dùng (Khách hàng truy cập `http://localhost:3000`).
>   - Cửa sổ 2 (Bên phải): Trình duyệt quản trị / nhân viên thu ngân (`http://localhost:3000/management-system`).
> - Khởi động sẵn Backend (`npm run dev`) và Frontend (`npm run dev`).
> - Đảm bảo kết nối mạng ổn định để Webhook PayOS hoạt động bình thường.

### Kịch bản Demo 3 bước ghi điểm tuyệt đối:

#### Bước 1: Demo cơ chế Khóa Slot Thời gian thực (Socket.IO Real-time Locking)
- **Thành viên thuyết minh:** *"Kính thưa Thầy Cô, sau đây chúng em sẽ chứng minh cơ chế chống đặt trùng sân theo thời gian thực."*
- **Thao tác:** 
  1. Ở màn hình Khách hàng bên trái, click vào ô slot 17:30 - 18:30 của Sân 1.
  2. Lập tức quan sát màn hình bên phải: Ô slot đó trên giao diện POS của nhân viên ngay tức khắc chuyển màu và hiển thị trạng thái đang giữ chỗ.
  3. Bật thêm 1 tab ẩn danh đóng vai trò khách hàng thứ hai: Ô slot cũng không thể bị click đặt đè.
  4. Đóng modal ở máy khách thứ nhất -> ngay lập tức ô slot bên kia mở khóa màu xanh trở lại.

#### Bước 2: Demo quy trình Đặt sân kèm dịch vụ & Sinh mã PayOS VietQR
- **Thành viên thuyết minh:** *"Tiếp theo là quy trình đặt sân và xuất mã thanh toán tự động."*
- **Thao tác:**
  1. Chọn slot sân, chọn thêm 2 chai Revive và 1 bộ áo bib.
  2. Điền tên khách hàng: `Nguyễn Văn A`, SĐT: `0901234567`.
  3. Chọn phương thức `Đặt cọc 30%` -> Bấm **Đặt sân ngay**.
  4. Hệ thống hiển thị Modal VietQR của PayOS với đúng số tiền cọc và mã đơn hàng duy nhất.

#### Bước 3: Demo Check-in và Quản lý tại quầy (Staff POS System)
- **Thành viên thuyết minh:** *"Tại phân hệ POS dành cho nhân viên tại quầy."*
- **Thao tác:**
  1. Mở trang `/management-system`, bấm vào đơn đặt sân vừa tạo.
  2. Bấm nút **'Check-in vào sân'** -> Slot chuyển sang trạng thái đang đá (`DANG_DA`).
  3. Thao tác gọi thêm 3 chai nước suối phát sinh -> Tiền đơn hàng được cộng dồn tức thì.
  4. Thao tác tạo 1 đơn bán lẻ 2 chai nước độc lập không cần đặt sân để chứng minh tính linh hoạt của hệ thống.

---

## 5. BỘ CÂU HỎI "BẪY" CỦA HỘI ĐỒNG & CHIẾN THUẬT PHẢN BIỆN THỰC TẾ

### Câu hỏi 1: "Nếu 2 khách hàng ở 2 nơi bấm chuột vào cùng một ô slot tại cùng 1 mili-giây thì hệ thống xử lý thế nào để không bị trùng?"
- **Cách trả lời ăn điểm:**
  > *"Dạ thưa Thầy Cô, hệ thống của chúng em xử lý qua **2 lớp bảo vệ (Two-layer Defense)**:*
  > 
  > 1. *Lớp thứ nhất tại tầng RAM của Node.js: Khi sự kiện `lock-slot` được gửi tới, do Node.js hoạt động theo mô hình Single-Threaded Event Loop, các event handler được xếp hàng vào Event Queue và xử lý tuần tự. Server sẽ cấp quyền cho request đầu tiên ghi vào đối tượng `lockedSlots` trong RAM, và từ chối ngay request thứ hai.*
  > 2. *Lớp thứ hai tại tầng Database SQL Server: Khi tạo đơn đặt sân, Stored Procedure `sp_TaoDonDatSan` sử dụng mức cô lập giao dịch (Transaction Isolation Level) với câu lệnh kiểm tra trùng lặp `IF EXISTS (SELECT 1 FROM Don_Dat_San WITH (UPDLOCK) WHERE ma_san = @ma_san AND ngay_da = @ngay_da AND ...)` trước khi INSERT. Do đó, ngay cả khi vượt qua tầng mạng thì Database cũng sẽ chặn đứng và rollback giao dịch."*

---

### Câu hỏi 2: "Tại sao nhóm chọn viết 100% Stored Procedures thay vì dùng các ORM hiện đại như Prisma, Sequelize hay TypeORM?"
- **Cách trả lời ăn điểm:**
  > *"Dạ thưa Thầy Cô, việc chọn viết 100% Stored Procedures là quyết định kiến trúc có chủ đích của nhóm dựa trên 3 lý do kỹ thuật:*
  > 
  > 1. *Thứ nhất về **Hiệu năng (Performance):** Đối với bài toán đặt sân có ma trận tính giá phức tạp (theo loại sân, theo khung giờ vàng và tính phút lẻ), Stored Procedure được SQL Server biên dịch sẵn (Pre-compiled) và tối ưu hóa Execution Plan, giảm tối đa thời gian phân tích cú pháp mỗi lần gọi.*
  > 2. *Thứ hai về **Bảo mật tuyệt đối (Security):** Tách biệt hoàn toàn tầng ứng dụng và cấu trúc bảng vật lý. Backend Node.js chỉ được cấp quyền EXECUTE các Stored Procedure, không có quyền truy cập trực tiếp vào bảng. Điều này triệt tiêu hoàn toàn nguy cơ SQL Injection.*
  > 3. *Thứ ba về **Toàn vẹn dữ liệu (ACID Transaction):** Toàn bộ nghiệp vụ kiểm tra slot trống, tạo đơn đặt, trừ tồn kho và ghi nhận chi tiết dịch vụ được thực hiện trọn vẹn trong một Transaction tại SQL Server. Nếu dùng ORM qua nhiều lượt gọi mạng (multiple round-trips), nguy cơ lỗi mạng giữa chừng gây sai lệch dữ liệu là rất cao."*

---

### Câu hỏi 3: "Khách hàng đặt cọc xong nhưng trời mưa không đá được thì hệ thống xử lý hoàn tiền như thế nào?"
- **Cách trả lời ăn điểm:**
  > *"Dạ thưa Thầy Cô, hệ thống xử lý qua quy trình Hoàn tiền CSKH minh bạch:*
  > 
  > 1. *Khách hàng gửi yêu cầu qua trang Liên hệ (`/lien-he`) kèm theo mã đơn hàng và lý do hủy.*
  > 2. *Quản trị viên đăng nhập vào Admin Dashboard, truy cập module **Lịch sử hoàn tiền** (`HOAN_TIEN`). Hệ thống sẽ hiển thị thông tin đơn, số tiền đã cọc và thời gian quy định hủy.*
  > 3. *Nếu hủy đúng quy định, Admin xác nhận duyệt. Hệ thống kích hoạt Stored Procedure cập nhật trạng thái đơn thành `DA_HUY`, ghi nhận bản ghi vào bảng `Lich_Su_Hoan_Tien` (lưu rõ tỷ lệ hoàn và số tiền hoàn), đồng thời giải phóng slot sân trên lưới để cho phép khách hàng khác đặt lại ngay lập tức."*

---

### Câu hỏi 4: "Next.js 16 và React 19 có tính năng gì nổi bật được áp dụng trong dự án này?"
- **Cách trả lời ăn điểm:**
  > *"Dạ thưa Thầy Cô, trong dự án Soccer247:*
  > 
  > - *Chúng em tận dụng **React 19** với các hooks tối ưu hiệu năng cao như `useMemo` để ghi nhớ ma trận lưới sân, tránh re-render không cần thiết khi có hàng chục slot cập nhật trạng thái.*
  > - *Kết hợp với **Next.js 16 Pages Router**, toàn bộ routing được định tuyến tự động, tích hợp nén tài nguyên giúp tốc độ tải trang ban đầu (First Contentful Paint) chỉ dưới 0.8 giây.*
  > - *Tích hợp trực tiếp WebSocket client trong React Lifecycle thông qua custom hook `useBookingSync`, đảm bảo đóng/mở kết nối socket an toàn khi chuyển trang, không gây rò rỉ bộ nhớ (memory leak)."*

---

### Câu hỏi 5: "Tại sao nhóm lại chọn đề tài Quản lý sân bóng đá Soccer247 thay vì các đề tài rất phổ biến như Web bán hàng (e-Commerce) hay Blog / Mạng xã hội?"
- **Cách trả lời ăn điểm:**
  > *"Dạ thưa Thầy Cô, nhóm em quyết định chọn đề tài này vì bài toán quản lý và đặt sân bóng đá có độ phức tạp kỹ thuật và giá trị thực tiễn cao hơn rất nhiều so với web bán hàng truyền thống:*
  > 
  > 1. *Thương mại điện tử thông thường chỉ cần quản lý số lượng tồn kho (Inventory decrement). Nhưng đặt sân bóng đá là **quản lý tài nguyên theo không gian và thời gian 2 chiều (Time-space Scheduling Matrix)** — một sân chỉ có thể phục vụ 1 đội trong đúng 1 khung giờ nhất định.*
  > 2. *Đề tài này đòi hỏi phải giải quyết bài toán đồng bộ thời gian thực **Real-time Concurrency** phức tạp để chống đặt trùng lịch (Race Condition) — điều mà các web bán hàng cơ bản không có.*
  > 3. *Hệ thống tích hợp quy trình nghiệp vụ khép kín gồm cả **B2C (Khách đặt online)**, **O2O (Nhân viên vận hành tại quầy POS)** và **B2B Dashboard (Chủ sân điều hành)**, mang tính ứng dụng thương mại rất cao và có thể chuyển giao vận hành thực tế ngay sau khi bảo vệ."*

---

## 6. LỜI KẾT & CHÚC THÀNH CÔNG

Tài liệu này được biên soạn bám sát 100% từng Slide trong tệp thuyết trình [`Soccer247-He-Thong-Quan-Ly-and-DJat-San-Bong-DJa-Toan-Dien.pptx`](file:///d:/BaoCaoTotNghiep/Docs/Soccer247-He-Thong-Quan-Ly-and-DJat-San-Bong-DJa-Toan-Dien.pptx) và cấu trúc mã nguồn thực tế của dự án. 

Chúc hai bạn **Cao Văn Hột Xoàn** và **Phạm Tiến Doanh** bình tĩnh, tự tin, phối hợp nhịp nhàng và đạt **điểm 10 tuyệt đối** trong buổi bảo vệ Đồ án Tốt nghiệp!
