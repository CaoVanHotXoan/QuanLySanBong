# BÁO CÁO THUYẾT TRÌNH: CƠ CHẾ PHÂN TRANG DỮ LIỆU ĐA TẦNG TẠI TRANG QUẢN TRỊ (ADMIN DASHBOARD PAGINATION)

> **Hệ thống:** Quản Lý & Đặt Sân Bóng Đá Trực Tuyến Sport247 / Soccer247  
> **Sinh viên thực hiện:** Cao Văn Hột Xoàn (MSSV: 525000462) & Phạm Tiến Doanh (MSSV: 525000463)  
> **Khoa:** Công Nghệ Thông Tin - Đại Học Lạc Hồng (LHU)  

---

# PHẦN I: BẢN TÓM TẮT NGẮN GỌN (DÀNH CHO NÓI THUYẾT TRÌNH / HỌC THUỘC)

## 1. Tổng Quan Về Cơ Chế Phân Trang Tại Trang Quản Trị Dashboard
+ **Khái niệm:** Phân trang (Pagination) là giải pháp chia nhỏ tập dữ liệu lớn thành từng trang cố định (mặc định **10 bản ghi / trang**), giúp giao diện bảng biểu luôn ngăn nắp, giảm thiểu thời gian kết xuất (Render DOM) và nâng cao trải nghiệm quản trị mượt mà 60 FPS.
+ **Kiến trúc áp dụng:** Hệ thống Sport247 kết hợp linh hoạt **2 giải pháp phân trang chuyên sâu**:
  1. **Phân trang Client-side thông minh (Smart In-Memory Pagination):** Áp dụng component tái sử dụng độc lập `TablePagination` kết hợp state quản lý đa tab `tabPages` cho **13 bảng dữ liệu quản trị** trong `Dashboard.tsx`.
  2. **Phân trang Server-side tại CSDL (Database Offset Pagination):** Áp dụng cú pháp chuẩn `OFFSET ... FETCH NEXT` trong Stored Procedure SQL Server 2022 (`sp_LayDanhSachTinTuc`, `sp_LayDanhSachTinTucAdmin`) nhằm tối ưu hóa tải trọng mạng khi dữ liệu bài viết tăng lên hàng ngàn bản ghi.

---

## 2. Công Nghệ Nền Tảng Áp Dụng
+ **Next.js 16 (React 19) & TypeScript:** Đóng gói component phân trang Generic `TablePagination` với Type-safe tuyệt đối, tái sử dụng linh hoạt cho mọi kiểu đối tượng (`SanBong`, `DonDatSan`, `NguoiDung`, `ThanhToan`...).
+ **Thuật toán Cửa sổ trượt (Sliding Window Algorithm):** Giới hạn hiển thị tối đa 5 nút số trang xung quanh trang hiện tại (`maxButtons = 5`), tự động co giãn dải nút thông minh giúp thanh điều hướng không bao giờ bị vỡ layout kể cả khi có hàng trăm trang.
+ **Tailwind CSS v4 & Dark/Light Mode Tokens:** Giao diện phân trang hiện đại, hỗ trợ hiệu ứng chuyển màu mượt mà theo Theme hệ thống, chỉ thị rõ ràng trạng thái nút khả dụng, nút đang chọn (`scale-105`), và nút bị vô hiệu hóa (`opacity-30 cursor-not-allowed`).
+ **Microsoft SQL Server 2022 & T-SQL Procedures:** Thủ tục lưu trữ `sp_LayDanhSachTinTuc` sử dụng `OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY` kết hợp truy vấn đếm song song `COUNT(*) AS total` cung cấp đầy đủ siêu dữ liệu (Metadata) phân trang.

---

## 3. Những File Xử Lý Code Cốt Lõi

+ **File 1: `qlsanbong_fontend/src/pages/Dashboard.tsx` (Component & Logic Phân Trang Dashboard)**
  - Dòng 391 – 511: Khai báo interface `TablePaginationProps` và component `TablePagination` (thanh điều hướng phân trang chuẩn với 4 nút điều hướng: `«` Trang đầu, `Trước`, Danh sách số trang, `Sau`, `»` Trang cuối).
  - Dòng 518 – 523: Khởi tạo state quản lý trang riêng biệt cho từng Tab: `tabPages: Record<string, number>`, hàm `getTabPage(tabKey)` và `setTabPage(tabKey, page)`.
  - Dòng 525 – 537: Hàm generic helper `getPaginatedData<T>(list, tabKey, pageSize = 10)` (tự động cắt mảng dữ liệu bằng `.slice(startIndex, startIndex + pageSize)` và tính toán `totalPages`, `startItem`, `endItem`).
  - Dòng 3954, 4030, 4084, 4154, 4211, 4540, 4621, 4722, 4859, 4910, 5251, 5373, 5465, 5596: Tích hợp component `TablePagination` vào toàn bộ 13 bảng nghiệp vụ trong Dashboard.

+ **File 2: `Data SQL server 2022/ThuTuc.sql` (Stored Procedures SQL Server)**
  - Dòng 3808 – 3851: Stored Procedure `sp_LayDanhSachTinTuc` (nhận `@page`, `@limit`, tính `@offset = (@page - 1) * @limit`, trả về tập kết quả `COUNT(*) AS total` và dữ liệu phân trang `OFFSET...FETCH NEXT`).
  - Dòng 4408 – 4450: Stored Procedure `sp_LayDanhSachTinTucAdmin` (hỗ trợ phân trang linh hoạt tùy chọn cho trang quản trị bài viết).

---

## 4. Cách Hoạt Động Tóm Tắt Khi Admin Thao Tác Phân Trang

1. **Bước 1 (Nạp dữ liệu):** Khi Admin mở một Tab bất kỳ trên Dashboard (ví dụ: Tab Sân Bóng `SAN_BONG` gồm 25 sân), toàn bộ danh sách được nạp vào state `courtList`.
2. **Bước 2 (Tính toán phân trang):** Hàm `getPaginatedData` kiểm tra trang hiện tại của tab `SAN_BONG` (mặc định là trang 1):
   - Tính toán: `startIndex = (1 - 1) * 10 = 0`, cắt 10 phần tử đầu tiên bằng `.slice(0, 10)` gán vào `pagedData.items`.
   - Tính toán thông tin hiển thị: `startItem = 1`, `endItem = 10`, `totalItems = 25`, `totalPages = 3`.
3. **Bước 3 (Hiển thị giao diện):**
   - Bảng chỉ render đúng 10 dòng sân bóng của trang 1.
   - Thanh phân trang hiển thị dòng chữ: *"Hiển thị 1 - 10 trên tổng số 25 bản ghi (Trang 1 / 3)"*.
   - Nút "« Trang đầu" và "Trước" tự động bị mờ (`disabled`) vì đang ở trang 1. Nút số `1` được tô màu xanh ngọc nổi bật.
4. **Bước 4 (Chuyển trang):** Admin bấm vào nút số `2` hoặc bấm "Sau":
   - Sự kiện `onPageChange(2)` kích hoạt -> gọi `setTabPage('SAN_BONG', 2)`.
   - Hàm `getPaginatedData` tự động tính lại `startIndex = 10`, cắt tiếp từ phần tử thứ 11 đến 20.
   - Bảng lập tức chuyển mượt sang 10 sân tiếp theo mà không cần tải lại toàn bộ trang web (Zero Reload).
5. **Bước 5 (Độc lập trạng thái đa Tab):** Khi Admin chuyển sang Tab "Người dùng" (`NGUOI_DUNG`) rồi quay lại Tab "Sân bóng", hệ thống vẫn ghi nhớ Tab Sân bóng đang dừng ở trang 2 nhờ cấu trúc `Record<string, number>`, không bị reset về trang đầu.

---
---

# PHẦN II: BẢN CHI TIẾT ĐẦY ĐỦ (DÀNH CHO VẤN ĐÁP KỸ THUẬT & DẪN CHỨNG CODE CỤ THỂ)

## 1. Kiến Trúc Phân Trang Hai Tầng (Two-Tier Pagination Architecture)

```
┌────────────────────────────────────────────────────────────────────────┐
│                   MÔ HÌNH PHÂN TRANG HAI TẦNG SPORT247                 │
└────────────────────────────────────────────────────────────────────────┘

  [ Quản Trị Viên / Nhân Viên ]
      │ Bấm chuyển trang trên giao diện Dashboard (Tab: Sân, Đơn, User...)
      ▼
┌────────────────────────────────────────────────────────────────────────┐
│             TẦNG 1: CLIENT-SIDE SMART PAGINATION (Dashboard.tsx)       │
│  • Hàm getPaginatedData(list, tabKey, pageSize = 10)                   │
│  • State đa Tab: tabPages = { SAN_BONG: 2, NGUOI_DUNG: 1, ... }        │
│  • Cắt mảng bộ nhớ: list.slice(startIndex, startIndex + pageSize)      │
│  • Component hiển thị: <TablePagination />                             │
│    - Cửa sổ trượt tối đa 5 nút số trang (Sliding Window)               │
│    - Dòng hiển thị siêu dữ liệu: "Hiển thị X - Y trên tổng số Z"       │
│    - Các nút tắt: « (Đầu), Trước, [1][2][3], Sau, » (Cuối)             │
└───────────────────┬────────────────────────────────────────────────────┘
                    │ Dành cho các module dữ liệu lớn (Tin tức, Nhật ký hệ thống)
                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│             TẦNG 2: SERVER-SIDE DATABASE PAGINATION (SQL Server 2022)  │
│  • Stored Procedure: sp_LayDanhSachTinTuc, sp_LayDanhSachTinTucAdmin   │
│  • Công thức: @offset = (@page - 1) * @limit                           │
│  • Cú pháp: OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY            │
│  • Truy vấn kép: SELECT COUNT(*) AS total (Lấy tổng số bản ghi)        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Dẫn Chứng File & Dòng Code Cụ Thể

### A. Component Phân Trang Chuẩn `TablePagination` Trong `Dashboard.tsx`

* **Vị trí file:** `qlsanbong_fontend/src/pages/Dashboard.tsx` (Dòng 391 – 511)
* **Khai báo Interface Props (Dòng 391 – 397):**
  ```typescript
  interface TablePaginationProps {
    currentPage: number;
    totalItems: number;
    pageSize?: number;
    onPageChange: (page: number) => void;
    isDarkMode?: boolean;
  }
  ```
* **Thuật toán tính toán siêu dữ liệu & Cửa sổ trượt (Dòng 399 – 420):**
  ```typescript
  function TablePagination({
    currentPage,
    totalItems,
    pageSize = 10,
    onPageChange,
    isDarkMode = true,
  }: TablePaginationProps) {
    // 1. Tính tổng số trang (ít nhất là 1 trang)
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    // 2. Tính số thứ tự bản ghi bắt đầu và kết thúc
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    // 3. Thuật toán Cửa sổ trượt 5 nút (Sliding Window 5 buttons)
    const pages: number[] = [];
    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }
    for (let p = startPage; p <= endPage; p++) {
      pages.push(p);
    }
  ```
* **Giao diện JSX hiển thị thanh điều khiển (Dòng 421 – 510):**
  - **Dòng thông tin:** Hiển thị rõ ràng dải bản ghi hiện tại:  
    `Hiển thị {startItem} - {endItem} trên tổng số {totalItems} bản ghi (Trang {currentPage} / {totalPages})`.
  - **Nút Về trang đầu (`«`):** Gọi `onPageChange(1)`, tự động bị disable nếu `currentPage <= 1`.
  - **Nút Trang trước (`Trước`):** Gọi `onPageChange(Math.max(1, currentPage - 1))`.
  - **Dải nút số trang:** Render danh sách `pages.map((p) => ...)`. Nếu `p === currentPage`, kích hoạt style màu xanh ngọc nổi bật `bg-emerald-600 text-white scale-105 shadow-md`.
  - **Nút Trang tiếp theo (`Sau`):** Gọi `onPageChange(Math.min(totalPages, currentPage + 1))`.
  - **Nút Đến trang cuối (`»`):** Gọi `onPageChange(totalPages)`, tự động bị disable nếu `currentPage >= totalPages`.

---

### B. Cơ Chế Quản Lý Độc Lập Trạng Thái Đa Tab (`tabPages`) & Hàm `getPaginatedData`

* **Vị trí file:** `qlsanbong_fontend/src/pages/Dashboard.tsx` (Dòng 518 – 537)
* **Khai báo State lưu trữ vị trí trang của từng Tab (Dòng 518 – 523):**
  ```typescript
  // Quản lý phân trang cho từng Tab (10 bản ghi/trang)
  const [tabPages, setTabPages] = useState<Record<string, number>>({});
  const getTabPage = (tabKey: string) => tabPages[tabKey] || 1;
  const setTabPage = (tabKey: string, page: number) => {
    setTabPages((prev) => ({ ...prev, [tabKey]: page }));
  };
  ```
  *Ưu điểm kỹ thuật:* Trong Dashboard có hơn 10 tab khác nhau (Sân bóng, Đơn đặt, Khách hàng, Doanh thu...). Việc lưu trữ dạng Dictionary `Record<string, number>` giúp mỗi tab giữ riêng số trang hiện tại của mình mà không bị xung đột hay reset khi Admin bấm qua lại giữa các menu.

* **Hàm Generic Helper cắt mảng dữ liệu (Dòng 525 – 537):**
  ```typescript
  const getPaginatedData = <T,>(list: T[], tabKey: string, pageSize = 10) => {
    const rawPage = getTabPage(tabKey);
    const total = (list || []).length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const currentPage = Math.min(Math.max(1, rawPage), totalPages);
    const startIndex = (currentPage - 1) * pageSize;
    return {
      items: (list || []).slice(startIndex, startIndex + pageSize),
      currentPage,
      totalItems: total,
      pageSize,
    };
  };
  ```
  *Ưu điểm kỹ thuật:*  
  - Tự động chuẩn hóa biên an toàn: `currentPage = Math.min(Math.max(1, rawPage), totalPages)`. Tránh tình trạng nếu Admin vừa xóa bản ghi cuối cùng của trang làm giảm tổng số trang, hệ thống sẽ tự động lùi về trang hợp lệ gần nhất mà không bị lỗi trang trắng (Out-of-bounds error).
  - Sử dụng toán tử `.slice(startIndex, startIndex + pageSize)` của JavaScript mảng trên RAM, tốc độ thực thi chỉ tốn dưới 0.1 mili-giây.

---

### C. Dẫn Chứng Tích Hợp Tại 13 Bảng Dữ Liệu Trong `Dashboard.tsx`

Component `TablePagination` được gắn đồng bộ ở chân của tất cả các bảng dữ liệu quản trị:

| STT | Tên Bảng Quản Trị | Tab Key Định Danh | Dòng Code Tích Hợp Trong `Dashboard.tsx` | Mô Tả Dữ Liệu Phân Trang |
| :---: | :--- | :--- | :--- | :--- |
| **1** | Danh Sách Sân Bóng | `SAN_BONG` | Dòng 3954 & 4030 – 4036 | Phân trang danh sách sân bóng (10 sân/trang) |
| **2** | Danh Mục Loại Sân | `LOAI_SAN` | Dòng 4045 & 4084 – 4090 | Phân trang loại sân 5, 7, 11 người |
| **3** | Danh Sách Đơn Đặt Sân | `DON_DAT_SAN` | Dòng 4100 & 4154 – 4160 | Phân trang danh sách đơn đặt từ web và quầy |
| **4** | Chi Tiết Dịch Vụ Đơn | `CHI_TIET_DICH_VU` | Dòng 4169 & 4211 – 4217 | Phân trang dịch vụ nước, áo bib đi kèm |
| **5** | Danh Mục Dịch Vụ | `DICH_VU` | Dòng 4226 & 4540 – 4546 | Phân trang bảng giá và tồn kho dịch vụ |
| **6** | Lịch Sử Nhập Kho | `NHAP_KHO` | Dòng 4555 & 4621 – 4627 | Phân trang các phiếu nhập kho hàng hóa |
| **7** | Giao Dịch Thanh Toán | `THANH_TOAN` | Dòng 4636 & 4722 – 4728 | Phân trang các biên lai chuyển khoản VietQR |
| **8** | Lịch Sử Hoàn Tiền | `HOAN_TIEN` | Dòng 4738 & 4859 – 4865 | Phân trang các đơn hủy sân và hoàn cọc |
| **9** | Khung Giờ & Bảng Giá | `KHUNG_GIO_GIA` | Dòng 4874 & 4910 – 4916 | Phân trang cấu hình giá giờ vàng/giờ thường |
| **10** | Quản Lý Người Dùng | `NGUOI_DUNG` | Dòng 5146 & 5251 – 5257 | Phân trang danh sách Khách hàng & Nhân viên |
| **11** | Phân Quyền Vai Trò | `VAI_TRO` | Dòng 5266 & 5373 – 5379 | Phân trang các vai trò trong hệ thống |
| **12** | Quản Lý Tin Tức | `TIN_TUC` | Dòng 5388 & 5465 – 5471 | Phân trang danh sách bài viết thể thao |
| **13** | Quản Lý Khách Liên Hệ | `LIEN_HE` | Dòng 5480 & 5596 – 5602 | Phân trang các thư liên hệ của khách hàng |

*Đoạn mã tích hợp mẫu tại Tab Sân Bóng (Dòng 4030 – 4036):*
```tsx
<TablePagination
  currentPage={pagedData.currentPage}
  totalItems={pagedData.totalItems}
  pageSize={10}
  onPageChange={(p) => setTabPage('SAN_BONG', p)}
  isDarkMode={isDarkMode}
/>
```

---

### D. Phân Trang Server-Side Bằng T-SQL Stored Procedures Trong SQL Server 2022

* **Vị trí file:** `Data SQL server 2022/ThuTuc.sql` (Dòng 3808 – 3851)
* **Chi tiết mã nguồn Stored Procedure `sp_LayDanhSachTinTuc`:**
  ```sql
  CREATE OR ALTER PROCEDURE sp_LayDanhSachTinTuc
      @ma_loai_tin INT = NULL,
      @tu_khoa NVARCHAR(100) = NULL,
      @page INT = 1,
      @limit INT = 50
  AS
  BEGIN
      SET NOCOUNT ON;
      BEGIN TRY
          -- Chuẩn hóa giá trị đầu vào an toàn
          IF @page IS NULL OR @page < 1 SET @page = 1;
          IF @limit IS NULL OR @limit < 1 SET @limit = 50;
          DECLARE @offset INT = (@page - 1) * @limit;

          -- 1. Lấy tổng số dòng để hỗ trợ tính tổng số trang (Pagination metadata)
          SELECT COUNT(*) AS total
          FROM Tin_Tuc t
          WHERE t.trang_thai = 1
            AND (@ma_loai_tin IS NULL OR @ma_loai_tin = 0 OR t.ma_loai_tin = @ma_loai_tin)
            AND (@tu_khoa IS NULL OR @tu_khoa = '' OR t.tieu_de LIKE N'%' + @tu_khoa + '%' OR t.tom_tat LIKE N'%' + @tu_khoa + '%');

          -- 2. Lấy dữ liệu phân trang chuẩn SQL Server OFFSET ... FETCH NEXT
          SELECT
                  t.id,
                  t.ma_loai_tin,
                  l.ten_loai,
                  t.tieu_de,
                  t.tom_tat,
                  t.noi_dung,
                  t.hinh_anh,
                  t.luot_xem,
                  t.ngay_dang,
                  t.trang_thai
              FROM Tin_Tuc t
              LEFT JOIN Loai_Tin_Tuc l ON t.ma_loai_tin = l.id
              WHERE t.trang_thai = 1
                AND (@ma_loai_tin IS NULL OR @ma_loai_tin = 0 OR t.ma_loai_tin = @ma_loai_tin)
                AND (@tu_khoa IS NULL OR @tu_khoa = '' OR t.tieu_de LIKE N'%' + @tu_khoa + '%' OR t.tom_tat LIKE N'%' + @tu_khoa + '%')
              ORDER BY t.ngay_dang DESC
              OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
      END TRY
      BEGIN CATCH
          ;THROW;
      END CATCH;
  END;
  GO
  ```

* **Phân tích kỹ thuật câu lệnh SQL Server:**
  - `DECLARE @offset INT = (@page - 1) * @limit`: Công thức tính số lượng bản ghi cần bỏ qua từ đầu bảng.
    + Ví dụ: Trang 1 với limit 10 -> `offset = (1 - 1) * 10 = 0` (lấy từ dòng 1).
    + Trang 2 với limit 10 -> `offset = (2 - 1) * 10 = 10` (bỏ qua 10 dòng đầu, lấy 10 dòng tiếp theo).
  - `OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`: Cú pháp chuẩn của chuẩn ANSI SQL bắt đầu từ SQL Server 2012 trở lên, thay thế hoàn toàn cho cách dùng hàm phụ trợ `ROW_NUMBER() OVER()` phức tạp của các phiên bản cũ, giúp SQL Query Optimizer thực thi kế hoạch truy vấn với tốc độ mili-giây.

---

## 3. Các Công Thức Toán Học & Thuật Toán Phân Trang Chi Tiết

### A. Công thức tính tổng số trang (`totalPages`):
$$\text{totalPages} = \max\left(1, \left\lceil \frac{\text{totalItems}}{\text{pageSize}} \right\rceil\right)$$
- Sử dụng hàm trần `Math.ceil()`: Nếu có 21 bản ghi, mỗi trang 10 bản ghi thì $\lceil 21 / 10 \rceil = 3$ trang (Trang 1 có 10, Trang 2 có 10, Trang 3 có 1).
- Nếu danh sách rỗng (`totalItems = 0`): Hàm `Math.max(1, ...)` đảm bảo luôn hiển thị tối thiểu Trang 1, tránh lỗi chia cho 0 hoặc hiển thị trang số 0 bất hợp lệ.

### B. Công thức tính dải bản ghi hiển thị (`startItem` & `endItem`):
$$\text{startItem} = \begin{cases} 0 & \text{khi } \text{totalItems} = 0 \\ (\text{currentPage} - 1) \times \text{pageSize} + 1 & \text{khi } \text{totalItems} > 0 \end{cases}$$
$$\text{endItem} = \min(\text{currentPage} \times \text{pageSize}, \text{totalItems})$$
- *Ví dụ thực tế:* Tại trang 2 với 25 bản ghi:
  - $\text{startItem} = (2 - 1) \times 10 + 1 = 11$.
  - $\text{endItem} = \min(2 \times 10, 25) = \min(20, 25) = 20$.
  - Kết quả in ra giao diện: *"Hiển thị 11 - 20 trên tổng số 25 bản ghi"*.
  - Tại trang 3: $\text{startItem} = 21$, $\text{endItem} = \min(30, 25) = 25$ -> *"Hiển thị 21 - 25 trên tổng số 25 bản ghi"*.

### C. Thuật toán Cửa sổ trượt (Sliding Window 5 Nút Số):
- Đặt `maxButtons = 5` nhằm bảo vệ thanh điều hướng không bị tràn màn hình điện thoại hoặc máy tính bảng.
- Điểm giữa của cửa sổ: `half = Math.floor(5 / 2) = 2`.
- `startPage = Math.max(1, currentPage - 2)`.
- `endPage = Math.min(totalPages, startPage + 4)`.
- *Điều chỉnh biên:* Nếu `endPage - startPage + 1 < 5`, lùi ngược lại: `startPage = Math.max(1, endPage - 4)`.
- *Mô phỏng thực tế:*
  - Đang ở Trang 1 / Tổng 10 trang -> Hiển thị: `[1] 2 3 4 5`
  - Đang ở Trang 5 / Tổng 10 trang -> Hiển thị: `3 4 [5] 6 7`
  - Đang ở Trang 10 / Tổng 10 trang -> Hiển thị: `6 7 8 9 [10]`

---

## 4. Bảng So Sánh Kỹ Thuật Giữa 2 Phương Pháp Phân Trang

| Tiêu Chí So Sánh | Phân Trang Phía Client (Client-Side Pagination) | Phân Trang Phía Server (Server-Side Pagination) |
| :--- | :--- | :--- |
| **Cơ chế xử lý** | Tải toàn bộ dữ liệu về RAM của Client, dùng `.slice()` để hiển thị | Chỉ truy vấn đúng số dòng cần thiết từ CSDL qua `OFFSET...FETCH NEXT` |
| **Tốc độ chuyển trang** | Tức thì mili-giây (0ms), không có độ trễ mạng | Phụ thuộc vào tốc độ mạng và thời gian phản hồi API của server |
| **Trải nghiệm người dùng** | Cực kỳ mượt mà, không giật lag, hỗ trợ lọc và tìm kiếm tức thì | Phải hiện Loading xoay vòng mỗi lần người dùng bấm chuyển trang |
| **Tải trọng máy chủ** | Rất nhẹ (API chỉ gọi 1 lần ban đầu, sau đó client tự xử lý) | Mỗi lần bấm chuyển trang đều phải gửi 1 truy vấn SQL lên server |
| **Phù hợp nhất với** | Các tập dữ liệu quản trị dưới 5.000 bản ghi (Sân, Giá, Đơn ngày, Dịch vụ) | Các tập dữ liệu khổng lồ hàng trăm ngàn bản ghi (Log hệ thống, Tin tức) |
| **Ứng dụng trong Sport247** | Áp dụng cho **13 bảng quản trị tại Dashboard** (`TablePagination`) | Áp dụng cho **Module Tin Tức** (`sp_LayDanhSachTinTuc`) |

---

## 5. Bộ Câu Hỏi Vấn Đáp Thường Gặp Khi Bảo Vệ Đồ Án (FAQ)

#### ❓ Câu hỏi 1: Tại sao trong Dashboard nhóm lại chọn giải pháp phân trang Client-side thay vì bắt Backend phải phân trang từng trang?
> **Trả lời:** Dạ thưa thầy cô, việc lựa chọn phân trang Client-side cho trang Dashboard xuất phát từ 3 lý do kỹ thuật tối ưu:
> 1. **Số lượng bản ghi vừa phải và tập trung:** Một cụm sân bóng đá thường có khoảng vài chục sân, vài chục loại dịch vụ và vài trăm đơn đặt sân trong tuần. Dung lượng JSON nạp về chỉ tốn khoảng vài trăm Kilobytes.
> 2. **Hỗ trợ tìm kiếm, lọc và sắp xếp tức thì (Instant Filter & Sort):** Khi toàn bộ dữ liệu đã nằm trên RAM của Client, người quản lý gõ từ khóa tìm kiếm hoặc lọc theo trạng thái đến đâu thì kết quả xuất hiện ngay lập tức đến đó (0 mili-giây) mà không cần phải chờ server phản hồi.
> 3. **Giảm áp lực kết nối cho SQL Server:** Máy chủ CSDL không bị bắn dồn dập hàng loạt truy vấn `SELECT` mỗi khi Admin click chuyển giữa các trang bảng biểu.

#### ❓ Câu hỏi 2: Nếu người dùng đang ở trang cuối cùng (ví dụ trang 5) mà thực hiện xóa bản ghi duy nhất của trang đó thì hệ thống xử lý như thế nào để không bị lỗi trang trắng?
> **Trả lời:** Dạ trong hàm `getPaginatedData` tại dòng 528 – 529 của `Dashboard.tsx`, nhóm em đã cài đặt cơ chế **tự động co giãn biên an toàn**:
> ```typescript
> const totalPages = Math.max(1, Math.ceil(total / pageSize));
> const currentPage = Math.min(Math.max(1, rawPage), totalPages);
> ```
> Khi bản ghi duy nhất bị xóa, `total` giảm xuống khiến `totalPages` giảm từ 5 về 4. Hàm `Math.min(5, 4)` sẽ tự động phát hiện số trang hiện tại đã vượt quá giới hạn và kéo `currentPage` an toàn về trang 4. Nhờ đó bảng dữ liệu lập tức hiển thị dữ liệu của trang 4 một cách hoàn hảo mà không bao giờ bị lỗi mảng rỗng hay vỡ giao diện.

#### ❓ Câu hỏi 3: Làm thế nào để giải quyết vấn đề khi Admin chuyển qua lại giữa các Tab thì số trang không bị reset về trang 1?
> **Trả lời:** Dạ nhóm em không dùng một biến `currentPage` đơn lẻ cho toàn bộ Dashboard mà sử dụng cấu trúc dữ liệu Dictionary:
> ```typescript
> const [tabPages, setTabPages] = useState<Record<string, number>>({});
> ```
> Mỗi Tab có một định danh duy nhất (`SAN_BONG`, `DON_DAT_SAN`, `NGUOI_DUNG`...). Khi người dùng ở Tab Sân bóng trang 3, hệ thống ghi nhận `tabPages['SAN_BONG'] = 3`. Dù người dùng có bấm sang Tab Người dùng để xem trang 1 rồi quay trở lại, hàm `getTabPage('SAN_BONG')` vẫn đọc ra giá trị 3 và hiển thị đúng trang 3 mà người dùng đang làm việc dở dang.

---
*Tài liệu được biên soạn phục vụ công tác báo cáo, thuyết trình và vấn đáp Đồ Án Tốt Nghiệp Sport247.*
