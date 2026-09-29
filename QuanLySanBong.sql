-- =====================================================================
-- FILE 1: CẤU TRÚC CƠ SỞ DỮ LIỆU & BẢNG (DATABASE & TABLES SCHEMA)
-- Project: Hệ Thống Quản Lý Và Đặt Sân Thể Thao (Soccer247)
-- Tương thích: SQL Server 2016, 2017, 2019, 2022+
-- =====================================================================



USE QuanLySanBong;
GO

-- =====================================================================
-- 1. XÓA BẢNG CŨ NẾU ĐÃ TỒN TẠI (THEO THỨ TỰ RÀNG BUỘC KHÓA NGOẠI)
-- =====================================================================
IF OBJECT_ID('Chi_Tiet_Dich_Vu', 'U') IS NOT NULL DROP TABLE Chi_Tiet_Dich_Vu;
IF OBJECT_ID('Phieu_Nhap_Kho', 'U') IS NOT NULL DROP TABLE Phieu_Nhap_Kho;
IF OBJECT_ID('Dich_Vu', 'U') IS NOT NULL DROP TABLE Dich_Vu;
IF OBJECT_ID('Lich_Su_Hoan_Tien', 'U') IS NOT NULL DROP TABLE Lich_Su_Hoan_Tien;
IF OBJECT_ID('Thanh_Toan', 'U') IS NOT NULL DROP TABLE Thanh_Toan;
IF OBJECT_ID('Don_Dat_San', 'U') IS NOT NULL DROP TABLE Don_Dat_San;
IF OBJECT_ID('San_Bong', 'U') IS NOT NULL DROP TABLE San_Bong;
IF OBJECT_ID('Khung_Gio_Gia', 'U') IS NOT NULL DROP TABLE Khung_Gio_Gia;
IF OBJECT_ID('Loai_San', 'U') IS NOT NULL DROP TABLE Loai_San;
IF OBJECT_ID('Nguoi_Dung', 'U') IS NOT NULL DROP TABLE Nguoi_Dung;
GO

-- =====================================================================
-- 4. TẠO CÁC BẢNG DỮ LIỆU CHUẨN SQL SERVER
-- =====================================================================

-- 4.1. Bảng Nguoi_Dung (Người dùng & Khách hàng)
CREATE TABLE Nguoi_Dung (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ho_ten NVARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    so_dien_thoai VARCHAR(15),
    mat_khau VARCHAR(255),
    anh_dai_dien VARCHAR(255) NULL,
    vai_tro VARCHAR(20) CHECK (vai_tro IN ('ADMIN', 'NHAN_VIEN', 'KHACH_HANG')) DEFAULT 'KHACH_HANG',
    ngay_tao DATETIME DEFAULT GETDATE()
);
GO

-- 4.2. Bảng Loai_San (Loại sân: Sân 5, Sân 7, Pickleball, Cầu lông)
CREATE TABLE Loai_San (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ten_loai NVARCHAR(50) NOT NULL, 
    mo_ta NVARCHAR(MAX),
    gia_co_ban DECIMAL(10, 2) NOT NULL,
    trang_thai BIT DEFAULT 1
);
GO

-- 4.3. Bảng Khung_Gio_Gia (Bảng giá theo giờ thường / giờ vàng / cuối tuần)
CREATE TABLE Khung_Gio_Gia (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ma_loai_san INT NOT NULL,
    gio_bat_dau TIME NOT NULL,
    gio_ket_thuc TIME NOT NULL,
    la_cuoi_tuan BIT DEFAULT 0, -- 0: Ngày thường (T2-T6), 1: Cuối tuần (T7-CN)
    don_gia DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (ma_loai_san) REFERENCES Loai_San(id) ON DELETE CASCADE
);
GO

-- 4.4. Bảng San_Bong (Chi tiết từng sân bóng cụ thể)
CREATE TABLE San_Bong (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ma_loai_san INT NOT NULL,
    ten_san NVARCHAR(50) NOT NULL, 
    hinh_anh VARCHAR(255),
    trang_thai VARCHAR(20) CHECK (trang_thai IN ('SAN_SANG', 'BAO_TRI')) DEFAULT 'SAN_SANG',
    FOREIGN KEY (ma_loai_san) REFERENCES Loai_San(id) ON DELETE NO ACTION
);
GO

-- 4.5. Bảng Don_Dat_San (Đơn đặt lịch thi đấu)
CREATE TABLE Don_Dat_San (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ma_nguoi_dung INT NOT NULL,
    ma_san INT NOT NULL,
    ngay_da DATE NOT NULL,
    gio_bat_dau TIME NOT NULL,
    gio_ket_thuc TIME NOT NULL,
    tien_san DECIMAL(10, 2) NOT NULL,
    tong_tien DECIMAL(10, 2) NOT NULL,
    trang_thai VARCHAR(20) CHECK (trang_thai IN ('CHO_XAC_NHAN', 'DA_CHOT', 'HOAN_THANH', 'DA_HUY')) DEFAULT 'CHO_XAC_NHAN',
    ngay_tao DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ma_nguoi_dung) REFERENCES Nguoi_Dung(id) ON DELETE CASCADE,
    FOREIGN KEY (ma_san) REFERENCES San_Bong(id) ON DELETE NO ACTION
);
GO

-- 4.6. Bảng Thanh_Toan (Giao dịch cọc / thanh toán đủ qua VNPay/MoMo/Tiền mặt)
CREATE TABLE Thanh_Toan (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ma_don_dat INT NOT NULL,
    phuong_thuc VARCHAR(20) CHECK (phuong_thuc IN ('TIEN_MAT', 'VNPAY', 'MOMO')) NOT NULL,
    loai_thanh_toan VARCHAR(20) CHECK (loai_thanh_toan IN ('DAT_COC', 'TRA_HET')) NOT NULL,
    so_tien DECIMAL(10, 2) NOT NULL,
    ma_giao_dich VARCHAR(100), 
    trang_thai_gd VARCHAR(20) CHECK (trang_thai_gd IN ('DANG_CHO', 'THANH_CONG', 'THAT_BAI', 'HOAN_TIEN')) DEFAULT 'DANG_CHO',
    ngay_thanh_toan DATETIME NULL,
    FOREIGN KEY (ma_don_dat) REFERENCES Don_Dat_San(id) ON DELETE CASCADE
);
GO

-- 4.7. Bảng Lich_Su_Hoan_Tien (Ghi nhận lịch sử hủy sân và hoàn cọc)
CREATE TABLE Lich_Su_Hoan_Tien (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ma_don_dat INT NOT NULL,
    so_tien_hoan DECIMAL(10, 2) NOT NULL,
    ty_le_hoan INT CHECK (ty_le_hoan BETWEEN 0 AND 100),
    ly_do_huy NVARCHAR(255),
    ngay_hoan DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ma_don_dat) REFERENCES Don_Dat_San(id) ON DELETE CASCADE
);
GO

-- 4.8. Bảng Dich_Vu (Danh mục nước uống, phụ kiện, thuê trọng tài...)
CREATE TABLE Dich_Vu (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ten_dich_vu NVARCHAR(100) NOT NULL,
    don_gia DECIMAL(10, 2) NOT NULL,
    don_vi_tinh NVARCHAR(20) NOT NULL, 
    ton_kho INT DEFAULT 0
);
GO

-- 4.9. Bảng Phieu_Nhap_Kho (Quản lý nhập hàng dịch vụ)
CREATE TABLE Phieu_Nhap_Kho (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ma_dich_vu INT NOT NULL,
    so_luong_nhap INT NOT NULL,
    gia_nhap DECIMAL(10, 2) NOT NULL,
    ngay_nhap DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ma_dich_vu) REFERENCES Dich_Vu(id) ON DELETE CASCADE
);
GO

-- 4.10. Bảng Chi_Tiet_Dich_Vu (Dịch vụ kèm theo trong từng đơn đặt sân)
CREATE TABLE Chi_Tiet_Dich_Vu (
    ma_don_dat INT NOT NULL,
    ma_dich_vu INT NOT NULL,
    so_luong INT NOT NULL DEFAULT 1,
    gia_luc_ban DECIMAL(10, 2) NOT NULL, 
    PRIMARY KEY (ma_don_dat, ma_dich_vu),
    FOREIGN KEY (ma_don_dat) REFERENCES Don_Dat_San(id) ON DELETE CASCADE,
    FOREIGN KEY (ma_dich_vu) REFERENCES Dich_Vu(id) ON DELETE NO ACTION
);
GO

-- =====================================================================
-- 5. CHÈN DỮ LIỆU MẪU BAN ĐẦU (INITIAL SEED DATA)
-- =====================================================================

-- 5.1. Người dùng mẫu (Admin, Nhân viên, Khách hàng)
INSERT INTO Nguoi_Dung (ho_ten, email, so_dien_thoai, mat_khau, vai_tro) VALUES
(N'Quản Trị Viên Hệ Thống', 'admin@soccer247.vn', '0909123456', '$2b$10$wE8eJ5.lK6xT8GzZz3lG..zM1bZ0v6O2D1aB3c4e5f6g7h8i9j0k', 'ADMIN'),
(N'Nhân Viên Quản Lý Sân', 'staff@soccer247.vn', '0909789789', '$2b$10$wE8eJ5.lK6xT8GzZz3lG..zM1bZ0v6O2D1aB3c4e5f6g7h8i9j0k', 'NHAN_VIEN'),
(N'Nguyễn Văn Đạt', 'vandat.soccer@gmail.com', '0988776655', '$2b$10$wE8eJ5.lK6xT8GzZz3lG..zM1bZ0v6O2D1aB3c4e5f6g7h8i9j0k', 'KHACH_HANG');

-- 5.2. Loại sân
INSERT INTO Loai_San (ten_loai, mo_ta, gia_co_ban, trang_thai) VALUES
(N'Sân 5 người', N'Cỏ nhân tạo FIFA tiêu chuẩn, hệ thống đèn LED chống chói 1000 Lux', 250000, 1),
(N'Sân 7 người', N'Mặt cỏ mềm cao cấp tiêu chuẩn thi đấu giao hữu', 450000, 1),
(N'Sân Pickleball', N'Mặt sân cao su chuẩn quốc tế, lưới và vạch kẻ chuẩn thi đấu', 180000, 1),
(N'Sân Cầu lông', N'Sàn gỗ chuyên dụng trong nhà, chống trơn trượt tối đa', 120000, 1);

-- 5.3. Danh sách sân bóng
INSERT INTO San_Bong (ma_loai_san, ten_san, hinh_anh, trang_thai) VALUES
(1, N'Sân 5A (Cỏ nhân tạo)', '/images/san-5a.jpg', 'SAN_SANG'),
(1, N'Sân 5B (Cỏ nhân tạo)', '/images/san-5b.jpg', 'SAN_SANG'),
(1, N'Sân 5C (VIP)', '/images/san-5c.jpg', 'SAN_SANG'),
(2, N'Sân 7A (Sân lớn)', '/images/san-7a.jpg', 'SAN_SANG'),
(2, N'Sân 7B (Sân lớn)', '/images/san-7b.jpg', 'SAN_SANG'),
(3, N'Pickleball 01 (Indoor)', '/images/pickleball-1.jpg', 'SAN_SANG'),
(3, N'Pickleball 02 (Outdoor)', '/images/pickleball-2.jpg', 'SAN_SANG'),
(4, N'Cầu lông 01 (Trong nhà)', '/images/caulong-1.jpg', 'SAN_SANG');

-- 5.4. Dịch vụ tại sân
INSERT INTO Dich_Vu (ten_dich_vu, don_gia, don_vi_tinh, ton_kho) VALUES
(N'Nước lọc Aquafina 500ml', 10000, N'Chai', 200),
(N'Nước tăng lực Revive chanh muối', 20000, N'Chai', 100),
(N'Nước điện giải Pocari Sweat 500ml', 25000, N'Chai', 80),
(N'Thuê bộ áo Bib phân đội (10 áo)', 30000, N'Bộ / Trận', 25),
(N'Thuê giày đá bóng cỏ nhân tạo', 40000, N'Đôi / Trận', 40),
(N'Thuê trọng tài bắt trận chuyên nghiệp', 200000, N'Người / Trận', 5);

-- 5.5. Bảng giá khung giờ
INSERT INTO Khung_Gio_Gia (ma_loai_san, gio_bat_dau, gio_ket_thuc, la_cuoi_tuan, don_gia) VALUES
-- Sân 5 người
(1, '06:00', '16:30', 0, 250000),
(1, '16:30', '21:00', 0, 350000),
(1, '21:00', '23:00', 0, 250000),
(1, '06:00', '23:00', 1, 380000),
-- Sân 7 người
(2, '06:00', '16:30', 0, 450000),
(2, '16:30', '21:00', 0, 650000),
(2, '21:00', '23:00', 0, 450000),
(2, '06:00', '23:00', 1, 700000),
-- Sân Pickleball
(3, '06:00', '16:30', 0, 180000),
(3, '16:30', '21:00', 0, 260000),
(3, '21:00', '23:00', 0, 180000),
(3, '06:00', '23:00', 1, 280000),
-- Sân Cầu lông
(4, '06:00', '16:30', 0, 120000),
(4, '16:30', '21:00', 0, 180000),
(4, '21:00', '23:00', 0, 120000),
(4, '06:00', '23:00', 1, 200000);
GO

PRINT N'✅ ĐÃ KHỞI TẠO XONG CƠ SỞ DỮ LIỆU VÀ TOÀN BỘ BẢNG CHO QuanLySanBong!';
GO