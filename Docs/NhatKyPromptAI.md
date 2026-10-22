# NHẬT KÝ SỬ DỤNG AI & PROMPTING CHUYÊN NGHIỆP
## Đồ án: Hệ Thống Quản Lý Và Đặt Sân Bóng Đá (Soccer247)
> **Mô hình Prompt áp dụng:** Khung chuẩn kỹ nghệ Prompting **Context — Task — Constraint (C-T-C)**  
> **Công cụ AI sử dụng:** Cursor / ChatGPT / GitHub Copilot / Gemini  

---

## 1. TỔNG QUAN NGUYÊN TẮC PROMPTING ÁP DỤNG TRONG DỰ ÁN

Để đạt hiệu quả lập trình tối ưu và tạo ra mã nguồn sạch, có tính bảo mật cao, mọi câu lệnh Prompt gửi tới AI đều tuân thủ nguyên tắc 3 thành phần:
1. **Context (Ngữ cảnh):** Cung cấp cấu trúc hệ thống, kiến trúc tầng (Layered Architecture), công nghệ sử dụng và trạng thái hiện tại.
2. **Task (Nhiệm vụ cụ thể):** Mô tả chính xác tính năng hoặc hàm cần xây dựng/tối ưu hóa.
3. **Constraint (Ràng buộc kỹ thuật):** Đặt ra các giới hạn chặt chẽ (không dùng raw query, bắt buộc dùng Stored Procedure, mã hóa mật khẩu, kiểm tra token, xử lý ngoại lệ `try/catch`, giao dịch `TRANSACTION`).

---

## 2. NHẬT KÝ CHI TIẾT CÁC PROMPT XỬ LÝ LOGIC PHỨC TẠP

### PROMPT 1: THIẾT KẾ CƠ SỞ DỮ LIỆU & STORED PROCEDURES ĐẶT SÂN CHỐNG XUNG ĐỘT (RACE CONDITION)

* **Context (Ngữ cảnh):**  
  > *"Tôi đang phát triển hệ thống Quản lý Sân bóng đá (Soccer247) sử dụng Microsoft SQL Server 2022. Bảng `Don_DatSan` lưu trữ các đơn đặt sân với các trường `ma_san`, `ngay_da`, `gio_bat_dau`, `gio_ket_thuc`, `trang_thai` (`CHO_THANH_TOAN`, `DA_COC`, `DA_THANH_TOAN`, `DA_HUY`)."*
* **Task (Nhiệm vụ):**  
  > *"Hãy viết Stored Procedure `sp_DatSan` nhận vào thông tin đặt sân của khách hàng, tự động kiểm tra xem khung giờ yêu cầu có bị trùng lặp với bất kỳ đơn nào đã được đặt hoặc đang giữ chỗ chưa hết hạn không. Nếu không trùng, thực hiện tạo mới đơn đặt sân."*
* **Constraint (Ràng buộc kỹ thuật):**  
  > 1. *"Bắt buộc sử dụng `BEGIN TRANSACTION` và `TRY...CATCH` với mức cô lập phù hợp để tránh Race Condition khi có 2 khách hàng cùng bấm đặt 1 slot cùng tích tắc."*  
  > 2. *"Thuật toán kiểm tra trùng lịch phải tuân thủ điều kiện: `(gio_bat_dau < @gio_ket_thuc AND gio_ket_thuc > @gio_bat_dau)`."*  
  > 3. *"Nếu phát hiện trùng lịch, `ROLLBACK TRANSACTION` và dùng `;THROW 50000, N'Khung giờ này đã có người đặt', 1;`."*  
  > 4. *"Không dùng câu lệnh SQL động bên ngoài, đóng gói 100% trong Procedure."*
* **Kết quả sinh ra & Tối ưu:**  
  * AI sinh ra thủ tục `sp_DatSan` với đầy đủ Transaction, kiểm tra ngoại lệ chặt chẽ, được lưu trữ tại file [ThuTuc.sql](file:///d:/BaoCaoTotNghiep/Data%20SQL%20server%202022/ThuTuc.sql).

---

### PROMPT 2: XÂY DỰNG MIDDLEWARE XÁC THỰC VÀ PHÂN QUYỀN SÂU BẰNG JWT

* **Context (Ngữ cảnh):**  
  > *"Backend hệ thống xây dựng bằng Node.js, Express.js và TypeScript. Người dùng đăng nhập thành công sẽ nhận được một chuỗi Token JWT chứa `id`, `email`, `vai_tro` (`ADMIN`, `NHAN_VIEN`, `KHACH_HANG`)."*
* **Task (Nhiệm vụ):**  
  > *"Hãy tạo 2 Middleware:  
  > 1. `verifyToken`: Trích xuất chuỗi JWT từ Header `Authorization: Bearer <token>`, giải mã và gắn thông tin người dùng vào đối tượng `req.user`.  
  > 2. `authorizeRoles(...roles: string[])`: Nhận vào danh sách các quyền được phép truy cập và kiểm tra quyền của `req.user`."*
* **Constraint (Ràng buộc kỹ thuật):**  
  > 1. *"Xử lý đầy đủ các trường hợp: Không có token (HTTP 401), token sai định dạng/hết hạn (HTTP 403), không đủ quyền hạn (HTTP 403). Các phản hồi lỗi phải ở định dạng JSON `{ success: false, message: '...' }`."*  
  > 2. *"Viết bằng TypeScript có định nghĩa Type chuẩn xác mở rộng từ `express.Request`."*  
  > 3. *"Secret key phải đọc từ biến môi trường `process.env.JWT_SECRET`."*
* **Kết quả sinh ra & Tối ưu:**  
  * Triển khai hoàn chỉnh tại file [authMiddleware.ts](file:///d:/BaoCaoTotNghiep/qlsanbong_backend/src/middlewares/authMiddleware.ts), bảo vệ an toàn cho các API nghiệp vụ nội bộ.

---

### PROMPT 3: VIẾT THUẬT TOÁN PHÂN TRANG (PAGINATION) SQL SERVER BẰNG OFFSET - FETCH NEXT

* **Context (Ngữ cảnh):**  
  > *"Hệ thống có lượng bài viết tin tức và lịch sử đặt sân ngày càng lớn. Việc lấy toàn bộ danh sách gây lãng phí băng thông mạng và giảm tốc độ phản hồi của API."*
* **Task (Nhiệm vụ):**  
  > *"Cập nhật Stored Procedure `sp_LayDanhSachTinTuc` và Controller `layDanhSachTinTuc` để hỗ trợ phân trang dữ liệu theo 2 tham số query: `page` (trang hiện tại) và `limit` (số bản ghi mỗi trang)."*
* **Constraint (Ràng buộc kỹ thuật):**  
  > 1. *"Trong SQL Server, bắt buộc sử dụng cú pháp chuẩn `OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY` kết hợp với mệnh đề `ORDER BY`."*  
  > 2. *"Stored Procedure phải trả về 2 tập kết quả (recordsets): Tập 1 trả về `total` (tổng số bản ghi thỏa mãn điều kiện lọc), Tập 2 trả về danh sách bản ghi của trang hiện tại."*  
  > 3. *"Controller phải tính toán `totalPages = Math.ceil(total / limit)` và trả về cấu trúc phân trang chuẩn `{ success: true, pagination: { page, limit, total, totalPages }, data: [...] }`."*  
  > 4. *"Đảm bảo tính tương thích ngược: nếu Client không truyền `page`, mặc định lấy từ trang 1 để không làm hỏng giao diện đã có."*
* **Kết quả sinh ra & Tối ưu:**  
  * Cập nhật thành công vào CSDL, [ThuTuc.sql](file:///d:/BaoCaoTotNghiep/Data%20SQL%20server%202022/ThuTuc.sql) và [contentController.ts](file:///d:/BaoCaoTotNghiep/qlsanbong_backend/src/controllers/contentController.ts).

---

### PROMPT 4: TẠO BỘ 5 UNIT TESTS TỰ ĐỘNG CHO CÁC LOGIC CỐT LÕI

* **Context (Ngữ cảnh):**  
  > *"Dự án Backend quản lý sân bóng đá chuẩn bị bảo vệ tốt nghiệp. Tiêu chí chấm điểm của trường yêu cầu phải có ít nhất 5 Unit Tests kiểm thử các logic cốt lõi và kiểm tra khả năng chịu lỗi."*
* **Task (Nhiệm vụ):**  
  > *"Hãy xây dựng bộ Unit Tests gồm 5 test suites bằng Vitest / Jest để kiểm thử độc lập các hàm nghiệp vụ của hệ thống."*
* **Constraint (Ràng buộc kỹ thuật):**  
  > 1. *"Suite 1: Kiểm thử mã hóa mật khẩu và so khớp mật khẩu đúng/sai với `bcryptjs`."*  
  > 2. *"Suite 2: Kiểm thử cấu trúc 3 phần (Header.Payload.Signature) của JWT và kiểm tra token bị giả mạo secret."*  
  > 3. *"Suite 3: Kiểm thử Middleware `authMiddleware` chặn truy cập trái phép bằng mock request/response."*  
  > 4. *"Suite 4: Kiểm thử hàm tính toán thời lượng đá, tổng tiền sân và tiền đặt cọc 30% kèm phụ phí giờ vàng."*  
  > 5. *"Suite 5: Kiểm thử thuật toán phát hiện xung đột khung giờ (Overlap Detection) để chống trùng lịch."*  
  > 6. *"Toàn bộ các test case phải độc lập, chạy nhanh trong vài giây và đạt tỷ lệ vượt qua 100% khi chạy lệnh `npm test`."*
* **Kết quả sinh ra & Tối ưu:**  
  * Hoàn thành tại [tests/unit.test.ts](file:///d:/BaoCaoTotNghiep/qlsanbong_backend/tests/unit.test.ts), vượt qua 17/17 test cases thành công rực rỡ.

---

### PROMPT 5: TÍCH HỢP TỰ ĐỘNG TÀI LIỆU SWAGGER UI TƯƠNG TÁC CHO TOÀN BỘ API

* **Context (Ngữ cảnh):**  
  > *"Dự án đã có file tài liệu đặc tả OpenAPI Specification chuẩn tại `OpenAPI.yaml` định nghĩa đầy đủ các routes, request body, headers và response schemas."*
* **Task (Nhiệm vụ):**  
  > *"Hãy tích hợp giao diện tương tác đồ họa Swagger UI vào máy chủ Express tại đường dẫn `/api-docs`."*
* **Constraint (Ràng buộc kỹ thuật):**  
  > 1. *"Sử dụng `swagger-ui-express` và `yamljs` để nạp file `OpenAPI.yaml` mà không cần chuyển đổi thủ công sang JSON."*  
  > 2. *"Có cơ chế fallback tìm file `OpenAPI.yaml` linh hoạt theo các thư mục chạy (dev tsx và production build dist)."*  
  > 3. *"Không làm gián đoạn hay ảnh hưởng đến các routes API hiện có và cổng kết nối WebSocket."*
* **Kết quả sinh ra & Tối ưu:**  
  * Đã kích hoạt giao diện Swagger UI tại `http://localhost:5000/api-docs`.

---

## 3. BẢNG TỔNG HỢP ĐÁNH GIÁ KỸ NĂNG ĐIỀU PHỐI AI

| Tiêu chí | Đánh giá | Minh chứng thực tế |
| :--- | :---: | :--- |
| **Tính rõ ràng ngữ cảnh (Context)** | Xuất sắc | Cung cấp đầy đủ cấu trúc bảng CSDL, quan hệ khóa ngoại, kiến trúc MVC & công nghệ sử dụng. |
| **Kiểm soát tính đúng đắn (Task)** | Xuất sắc | Yêu cầu viết code chia lớp mạch lạc, xử lý đúng bài toán nghiệp vụ sân bóng (giữ chỗ, cọc 30%, đối soát thanh toán). |
| **Kiểm soát ràng buộc kỹ thuật (Constraint)** | Xuất sắc | Ép buộc sử dụng Stored Procedures, Transactions, bảo mật Bcrypt/JWT và bắt lỗi toàn diện. |
| **Khả năng Review & Tối ưu hóa code AI** | Xuất sắc | Sinh viên đã kiểm tra lại, loại bỏ code thừa, viết Unit Test xác nhận và tích hợp Swagger UI chuẩn mực. |
