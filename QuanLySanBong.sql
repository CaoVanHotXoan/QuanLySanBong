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
IF OBJECT_ID('Vai_Tro', 'U') IS NOT NULL DROP TABLE Vai_Tro;
GO

-- =====================================================================
-- 4. TẠO CÁC BẢNG DỮ LIỆU CHUẨN SQL SERVER
-- =====================================================================

-- 4.0. Bảng Vai_Tro (Vai trò người dùng: Admin, Nhân viên, Khách hàng)
CREATE TABLE Vai_Tro (
    MaVaiTro INT IDENTITY(1,1) PRIMARY KEY,
    TenVaiTro NVARCHAR(50) UNIQUE NOT NULL,
    MoTa NVARCHAR(255) NULL
);
GO

-- 4.1. Bảng Nguoi_Dung (Người dùng & Khách hàng liên kết bảng Vai_Tro)
CREATE TABLE Nguoi_Dung (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ho_ten NVARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    so_dien_thoai VARCHAR(10),
    mat_khau VARCHAR(255),
    anh_dai_dien VARCHAR(255) NULL,
    MaVaiTro INT NOT NULL DEFAULT 3,
    FOREIGN KEY (MaVaiTro) REFERENCES Vai_Tro(MaVaiTro) ON DELETE NO ACTION
);
GO

-- 4.2. Bảng Loai_San 
CREATE TABLE Loai_San (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ten_loai NVARCHAR(50) NOT NULL, 
    mo_ta NVARCHAR(MAX),
    trang_thai BIT DEFAULT 1
);
GO
-- 4.3. Bảng San_Bong (Chi tiết từng sân bóng cụ thể)
CREATE TABLE San_Bong (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ma_loai_san INT NOT NULL,
    ten_san NVARCHAR(50) NOT NULL, 
    hinh_anh VARCHAR(255),
    don_gia_phut DECIMAL(10, 2) NOT NULL,
    trang_thai VARCHAR(20) CHECK (trang_thai IN ('SAN_SANG', 'BAO_TRI')) DEFAULT 'SAN_SANG',
    FOREIGN KEY (ma_loai_san) REFERENCES Loai_San(id) ON DELETE NO ACTION
);
GO

-- 4.5. Bảng Don_Dat_San (Đơn đặt lịch thi đấu: Cố định hoặc Linh hoạt theo phút)
CREATE TABLE Don_Dat_San (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ma_nguoi_dung INT NOT NULL,
    ma_san INT NOT NULL,
    ngay_da DATE NOT NULL,
    gio_bat_dau TIME NOT NULL,
    gio_ket_thuc TIME NOT NULL,
    tien_san DECIMAL(10, 2) NOT NULL,
    tong_tien DECIMAL(10, 2) NOT NULL,
    kieu_dat VARCHAR(20) CHECK (kieu_dat IN ('CO_DINH', 'LINH_HOAT')) DEFAULT 'CO_DINH',
    ghi_chu NVARCHAR(255) NULL,
    trang_thai VARCHAR(20) CHECK (trang_thai IN ('CHO_XAC_NHAN', 'DA_CHOT', 'HOAN_THANH', 'DA_HUY')) DEFAULT 'CHO_XAC_NHAN',
    ngay_tao DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ma_nguoi_dung) REFERENCES Nguoi_Dung(id) ON DELETE CASCADE,
    FOREIGN KEY (ma_san) REFERENCES San_Bong(id) ON DELETE NO ACTION
);
GO

-- 4.6. Bảng Thanh_Toan (Giao dịch cọc / thanh toán đủ qua Chuyển khoản / Tiền mặt)
CREATE TABLE Thanh_Toan (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ma_don_dat INT NOT NULL,
    phuong_thuc VARCHAR(20) CHECK (phuong_thuc IN ('TIEN_MAT', 'CHUYEN_KHOAN')) NOT NULL,
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
    tongtien_dichvu DECIMAL(10, 2) NOT NULL, 
    PRIMARY KEY (ma_don_dat, ma_dich_vu),
    FOREIGN KEY (ma_don_dat) REFERENCES Don_Dat_San(id) ON DELETE CASCADE,
    FOREIGN KEY (ma_dich_vu) REFERENCES Dich_Vu(id) ON DELETE NO ACTION
);
GO

-- =====================================================================
-- 5. CHÈN DỮ LIỆU MẪU BAN ĐẦU (INITIAL SEED DATA)
-- =====================================================================

-- 5.0. Vai trò mẫu
INSERT INTO Vai_Tro (TenVaiTro, MoTa) VALUES
(N'ADMIN', N'Quản trị viên toàn quyền hệ thống'),
(N'NHAN_VIEN', N'Nhân viên quản lý sân và bán hàng'),
(N'KHACH_HANG', N'Khách hàng đặt sân trực tuyến');

-- 5.1. Người dùng mẫu (Admin, Nhân viên, Khách hàng)
INSERT INTO Nguoi_Dung (ho_ten, email, so_dien_thoai, mat_khau, MaVaiTro) VALUES
(N'Quản Trị Viên Hệ Thống', 'Admin@gmail.com', '0909123456', '$2a$10$XwJkh09J4g1aUonHEMVhM.87Nd5qqBLSTC6G1XUQacB0F6RySPQJi', 1),
(N'Nhân Viên Quản Lý Sân', 'staff@soccer247.vn', '0909789789', '$2a$10$XwJkh09J4g1aUonHEMVhM.87Nd5qqBLSTC6G1XUQacB0F6RySPQJi', 2),
(N'Nguyễn Văn Đạt', 'vandat.soccer@gmail.com', '0988776655', '$2a$10$XwJkh09J4g1aUonHEMVhM.87Nd5qqBLSTC6G1XUQacB0F6RySPQJi', 3);

-- 5.2. Loại sân mẫu
INSERT INTO Loai_San (ten_loai, mo_ta, trang_thai) VALUES
(N'Sân 5 Người (Tiêu chuẩn)', N'Mặt cỏ nhân tạo cao cấp FIFA 2 sao, có đèn LED cao áp', 1),
(N'Sân 7 Người (Mở rộng)', N'Kích thước chuẩn thi đấu giải đấu phủi và phong trào', 1),
(N'Sân 11 Người (Chuyên nghiệp)', N'Sân cỏ tự nhiên tiêu chuẩn quốc tế có khán đài', 1);

-- 5.3. Sân bóng mẫu (Kèm don_gia_phut: Đơn giá theo từng phút)
INSERT INTO San_Bong (ma_loai_san, ten_san, hinh_anh, don_gia_phut, trang_thai) VALUES
(1, N'Sân 5A (Cỏ nhân tạo VIP)', 'https://images.unsplash.com/photo-1529900240041-dd2c1bb50c1e?q=80&w=800&auto=format&fit=crop', 5000.00, 'SAN_SANG'),
(1, N'Sân 5B (Khung thành nhôm)', 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800&auto=format&fit=crop', 5000.00, 'SAN_SANG'),
(2, N'Sân 7A (Sân Đèn LED Pro)', 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=800&auto=format&fit=crop', 8000.00, 'SAN_SANG'),
(2, N'Sân 7B (Khán đài A)', 'https://images.unsplash.com/photo-1551958219-acbc608c6377?q=80&w=800&auto=format&fit=crop', 8500.00, 'SAN_SANG'),
(3, N'Sân 11 Quốc Tế', 'https://images.unsplash.com/photo-1459865264687-595d652de67e?q=80&w=800&auto=format&fit=crop', 15000.00, 'SAN_SANG');

-- 5.4. Dịch vụ kèm theo mẫu
INSERT INTO Dich_Vu (ten_dich_vu, don_gia, ton_kho) VALUES
(N'Nước khoáng Aquafina 500ml', 10000.00, 200),
(N'Nước tăng lực Revive Chanh Muối', 15000.00, 150),
(N'Nước tăng lực RedBull (Bò Húc)', 20000.00, 100),
(N'Thuê áo bít tập luyện (Bộ 10 áo)', 50000.00, 20),
(N'Thuê trọng tài bắt chính (90 phút)', 200000.00, 5);

PRINT N'✅ ĐÃ KHỞI TẠO XONG CƠ SỞ DỮ LIỆU VÀ TOÀN BỘ BẢNG CHO QuanLySanBong!';
GO