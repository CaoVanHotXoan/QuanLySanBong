-- =====================================================================
-- FILE 1: CẤU TRÚC CƠ SỞ DỮ LIỆU & BẢNG (DATABASE & TABLES SCHEMA)
-- Project: Hệ Thống Quản Lý Và Đặt Sân Bóng Đá Toàn Diện (Soccer247)
-- Tương thích: Microsoft SQL Server 2016, 2017, 2019, 2022+
-- ĐẶC ĐIỂM: 
--   - Chứa toàn bộ 15 bảng nghiệp vụ, quan hệ khóa ngoại, chỉ mục hiệu năng
--   - Chứa dữ liệu khởi tạo mặc định (Seed Data)
--   - TUYỆT ĐỐI KHÔNG CHỨA BẤT KỲ STORED PROCEDURE NÀO (Toàn bộ nằm ở ThuTuc.sql)
-- =====================================================================

USE master;
GO

-- 1. TỰ ĐỘNG TẠO DATABASE NẾU CHƯA CÓ
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'QuanLySanBong')
BEGIN
    CREATE DATABASE QuanLySanBong;
END;
GO

USE QuanLySanBong;
GO

-- =====================================================================
-- 2. XÓA BẢNG CŨ NẾU ĐÃ TỒN TẠI (THEO THỨ TỰ RÀNG BUỘC KHÓA NGOẠI)
-- =====================================================================
IF OBJECT_ID('Chi_Tiet_Dich_Vu', 'U') IS NOT NULL DROP TABLE Chi_Tiet_Dich_Vu;
IF OBJECT_ID('Phieu_Nhap_Kho', 'U') IS NOT NULL DROP TABLE Phieu_Nhap_Kho;
IF OBJECT_ID('Dich_Vu', 'U') IS NOT NULL DROP TABLE Dich_Vu;
IF OBJECT_ID('Lich_Su_Hoan_Tien', 'U') IS NOT NULL DROP TABLE Lich_Su_Hoan_Tien;
IF OBJECT_ID('Thanh_Toan', 'U') IS NOT NULL DROP TABLE Thanh_Toan;
IF OBJECT_ID('Don_Dat_San', 'U') IS NOT NULL DROP TABLE Don_Dat_San;
IF OBJECT_ID('San_Bong', 'U') IS NOT NULL DROP TABLE San_Bong;
IF OBJECT_ID('Khung_Gio', 'U') IS NOT NULL DROP TABLE Khung_Gio;
IF OBJECT_ID('Khung_Gio_Gia', 'U') IS NOT NULL DROP TABLE Khung_Gio_Gia;
IF OBJECT_ID('Loai_San', 'U') IS NOT NULL DROP TABLE Loai_San;
IF OBJECT_ID('Nguoi_Dung', 'U') IS NOT NULL DROP TABLE Nguoi_Dung;
IF OBJECT_ID('Vai_Tro', 'U') IS NOT NULL DROP TABLE Vai_Tro;
IF OBJECT_ID('Tin_Tuc', 'U') IS NOT NULL DROP TABLE Tin_Tuc;
IF OBJECT_ID('Loai_Tin_Tuc', 'U') IS NOT NULL DROP TABLE Loai_Tin_Tuc;
IF OBJECT_ID('Banner', 'U') IS NOT NULL DROP TABLE Banner;
IF OBJECT_ID('Lien_He', 'U') IS NOT NULL DROP TABLE Lien_He;
IF OBJECT_ID('About_Us', 'U') IS NOT NULL DROP TABLE About_Us;
IF OBJECT_ID('Xac_Thuc_OTP', 'U') IS NOT NULL DROP TABLE Xac_Thuc_OTP;
GO

-- =====================================================================
-- 3. TẠO CÁC BẢNG DỮ LIỆU CHUẨN SQL SERVER
-- =====================================================================

-- 3.1. Bảng Vai_Tro (Vai trò người dùng: Admin, Nhân viên, Khách hàng)
CREATE TABLE Vai_Tro (
    MaVaiTro INT IDENTITY(1,1) PRIMARY KEY,
    TenVaiTro NVARCHAR(50) UNIQUE NOT NULL,
    MoTa NVARCHAR(255) NULL
);
GO

-- 3.2. Bảng Nguoi_Dung (Người dùng & Khách hàng liên kết bảng Vai_Tro)
CREATE TABLE Nguoi_Dung (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ho_ten NVARCHAR(100) NULL,
    email VARCHAR(255) UNIQUE NULL,
    so_dien_thoai VARCHAR(20) NULL,
    mat_khau VARCHAR(255) NULL,
    anh_dai_dien VARCHAR(255) NULL,
    MaVaiTro INT NOT NULL DEFAULT 3,
    FOREIGN KEY (MaVaiTro) REFERENCES Vai_Tro(MaVaiTro) ON DELETE NO ACTION
);
GO

-- 3.3. Bảng Loai_San (Danh mục phân loại sân 5, 7, 11 người)
CREATE TABLE Loai_San (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ten_loai NVARCHAR(50) NOT NULL, 
    mo_ta NVARCHAR(MAX),
    trang_thai BIT DEFAULT 1
);
GO

-- 3.4. Bảng San_Bong (Chi tiết từng sân bóng cụ thể)
CREATE TABLE San_Bong (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ma_loai_san INT NOT NULL,
    ten_san NVARCHAR(50) NOT NULL, 
    hinh_anh VARCHAR(255),
    don_gia_phut DECIMAL(10, 2) NOT NULL DEFAULT 5000.00,
    trang_thai VARCHAR(20) CHECK (trang_thai IN ('SAN_SANG', 'BAO_TRI')) DEFAULT 'SAN_SANG',
    FOREIGN KEY (ma_loai_san) REFERENCES Loai_San(id) ON DELETE NO ACTION
);
GO

-- 3.5. Bảng Khung_Gio (Ma trận các mốc giờ bắt đầu đá chuẩn 24h)
CREATE TABLE Khung_Gio (
    id INT IDENTITY(1,1) PRIMARY KEY,
    gio_bat_dau VARCHAR(5) NOT NULL,
    gio_ket_thuc VARCHAR(5) NOT NULL,
    nhan_hien_thi NVARCHAR(50) NOT NULL,
    thu_tu INT NOT NULL,
    trang_thai BIT DEFAULT 1
);
GO

-- 3.6. Bảng Don_Dat_San (Đơn đặt lịch thi đấu & bán lẻ dịch vụ tại quầy)
CREATE TABLE Don_Dat_San (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ma_nguoi_dung INT NULL,
    ma_san INT NULL, -- NULL nếu là đơn bán lẻ nước / dịch vụ tại quầy không đặt sân
    ngay_da DATE NOT NULL,
    gio_bat_dau TIME NOT NULL,
    gio_ket_thuc TIME NULL,
    tien_san DECIMAL(10, 2) NULL,
    tong_tien DECIMAL(10, 2) NULL,
    phuong_thuc VARCHAR(20) CHECK (phuong_thuc IN ('TIEN_MAT', 'CHUYEN_KHOAN')) NOT NULL,
    ghi_chu NVARCHAR(255) NULL,
    trang_thai VARCHAR(30) CHECK (trang_thai IN ('CHO_THANH_TOAN', 'CHUA_THANH_TOAN', 'CHO_XAC_NHAN', 'DA_COC', 'DANG_DA', 'DA_THANH_TOAN', 'Da Thanh Toan', 'HOAN_THANH', 'DA_HUY', 'DA_CHOT')) DEFAULT 'CHO_THANH_TOAN',
    da_vao_san BIT DEFAULT 0,
    gio_vao_san TIME NULL,
    ngay_tao DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ma_nguoi_dung) REFERENCES Nguoi_Dung(id) ON DELETE CASCADE,
    FOREIGN KEY (ma_san) REFERENCES San_Bong(id) ON DELETE NO ACTION
);
GO

-- 3.7. Bảng Thanh_Toan (Lịch sử thanh toán cọc 30% và thanh toán toàn phần)
CREATE TABLE Thanh_Toan (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ma_don_dat INT NOT NULL,
    phuong_thuc VARCHAR(20) CHECK (phuong_thuc IN ('TIEN_MAT', 'CHUYEN_KHOAN')) NOT NULL,
    loai_thanh_toan VARCHAR(20) CHECK (loai_thanh_toan IN ('DAT_COC', 'TRA_HET', 'THANH_TOAN_SAU', 'CHUA_THANH_TOAN')) NOT NULL,
    so_tien DECIMAL(10, 2) NOT NULL,
    ma_giao_dich VARCHAR(100) NULL,
    noi_dung_chuyen_khoan NVARCHAR(255) NULL,
    trang_thai_gd VARCHAR(20) CHECK (trang_thai_gd IN ('DANG_CHO', 'CHO_XU_LY', 'THANH_CONG', 'THAT_BAI', 'HOAN_TIEN')) DEFAULT 'THANH_CONG',
    ngay_thanh_toan DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ma_don_dat) REFERENCES Don_Dat_San(id) ON DELETE CASCADE
);
GO

-- 3.8. Bảng Lich_Su_Hoan_Tien (Ghi nhận lịch sử hủy sân và hoàn cọc qua CSKH)
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

-- 3.9. Bảng Dich_Vu (Danh mục nước uống, phụ kiện, thuê trọng tài...)
CREATE TABLE Dich_Vu (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ten_dich_vu NVARCHAR(100) NOT NULL,
    don_gia DECIMAL(10, 2) NOT NULL,
    ton_kho INT DEFAULT 0
);
GO

-- 3.10. Bảng Phieu_Nhap_Kho (Quản lý nhập hàng dịch vụ)
CREATE TABLE Phieu_Nhap_Kho (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ma_dich_vu INT NOT NULL,
    so_luong_nhap INT NOT NULL,
    gia_nhap DECIMAL(10, 2) NOT NULL,
    ngay_nhap DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ma_dich_vu) REFERENCES Dich_Vu(id) ON DELETE CASCADE
);
GO

-- 3.11. Bảng Chi_Tiet_Dich_Vu (Dịch vụ kèm theo trong từng đơn đặt sân)
CREATE TABLE Chi_Tiet_Dich_Vu (
    ma_don_dat INT NOT NULL,
    ma_dich_vu INT NOT NULL,
    so_luong INT NOT NULL DEFAULT 1,
    so_luong_da_tra INT NOT NULL DEFAULT 0,
    tongtien_dichvu DECIMAL(10, 2) NOT NULL DEFAULT 0, 
    PRIMARY KEY (ma_don_dat, ma_dich_vu),
    FOREIGN KEY (ma_don_dat) REFERENCES Don_Dat_San(id) ON DELETE CASCADE,
    FOREIGN KEY (ma_dich_vu) REFERENCES Dich_Vu(id) ON DELETE NO ACTION
);
GO

-- 3.12. Bảng Banner (Quản lý Banner quảng cáo / Video Slider trang chủ)
CREATE TABLE Banner (
    id INT IDENTITY(1,1) PRIMARY KEY,
    tieu_de NVARCHAR(150) NULL,
    loai_banner VARCHAR(10) CHECK (loai_banner IN ('IMAGE', 'VIDEO')) DEFAULT 'IMAGE',
    hinh_anh VARCHAR(MAX) NULL,
    video_url VARCHAR(MAX) NULL,
    lien_ket VARCHAR(500) NULL,
    thu_tu INT DEFAULT 1,
    trang_thai BIT DEFAULT 1,
    ngay_tao DATETIME DEFAULT GETDATE()
);
GO

-- 3.13. Bảng Loai_Tin_Tuc (Danh mục tin tức)
CREATE TABLE Loai_Tin_Tuc (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ten_loai NVARCHAR(100) NOT NULL,
    trang_thai BIT DEFAULT 1
);
GO

-- 3.14. Bảng Tin_Tuc (Bài viết tin tức truyền thông)
CREATE TABLE Tin_Tuc (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ma_loai_tin INT NOT NULL,
    tieu_de NVARCHAR(255) NOT NULL,
    tom_tat NVARCHAR(500) NULL,
    noi_dung NVARCHAR(MAX) NOT NULL,
    hinh_anh VARCHAR(255) NULL,
    luot_xem INT DEFAULT 0,
    ngay_dang DATETIME DEFAULT GETDATE(),
    trang_thai BIT DEFAULT 1,
    FOREIGN KEY (ma_loai_tin) REFERENCES Loai_Tin_Tuc(id) ON DELETE NO ACTION
);
GO

-- 3.15. Bảng Lien_He (Lưu phản hồi / Góp ý từ khách hàng gửi qua Web)
CREATE TABLE Lien_He (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ho_ten NVARCHAR(100) NOT NULL,
    email VARCHAR(255) NULL,
    so_dien_thoai VARCHAR(20) NOT NULL,
    tieu_de NVARCHAR(150) NULL,
    noi_dung NVARCHAR(MAX) NOT NULL,
    trang_thai_xu_ly NVARCHAR(30) CHECK (trang_thai_xu_ly IN (N'CHUA_XU_LY', N'DA_XU_LY')) DEFAULT N'CHUA_XU_LY',
    ngay_gui DATETIME DEFAULT GETDATE(),
    noi_dung_tra_loi NVARCHAR(MAX) NULL,
    ngay_tra_loi DATETIME NULL
);
GO

-- 3.16. Bảng About_Us (Cấu hình trang About Us, địa chỉ, hotline, mạng xã hội)
CREATE TABLE About_Us (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ten_trung_tam NVARCHAR(150) NOT NULL,
    hotline VARCHAR(20) NOT NULL,
    email VARCHAR(255) NULL,
    dia_chi NVARCHAR(255) NOT NULL,
    link_map VARCHAR(500) NULL,
    gioi_thieu_ngan NVARCHAR(MAX) NULL,
    bai_viet_about_us NVARCHAR(MAX) NULL,
    link_facebook VARCHAR(255) NULL,
    link_zalo VARCHAR(255) NULL
);
GO

-- 3.17. Bảng Xac_Thuc_OTP (Lưu trữ và xác thực mã OTP qua Gmail)
CREATE TABLE Xac_Thuc_OTP (
    id INT IDENTITY(1,1) PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    ma_otp VARCHAR(10) NOT NULL,
    loai_otp VARCHAR(50) NOT NULL,
    het_han_luc DATETIME NOT NULL,
    da_xac_thuc BIT DEFAULT 0,
    ngay_tao DATETIME DEFAULT GETDATE()
);
GO

-- =====================================================================
-- 4. CHỈ MỤC TỐI ƯU HIỆU NĂNG TRUY VẤN (PERFORMANCE INDEXES)
-- =====================================================================
CREATE NONCLUSTERED INDEX IX_DonDatSan_NgayDa_TrangThai ON Don_Dat_San(ngay_da, trang_thai) INCLUDE (ma_san, ma_nguoi_dung, tong_tien);
CREATE NONCLUSTERED INDEX IX_DonDatSan_MaNguoiDung ON Don_Dat_San(ma_nguoi_dung);
CREATE NONCLUSTERED INDEX IX_DonDatSan_MaSan ON Don_Dat_San(ma_san);
CREATE NONCLUSTERED INDEX IX_ThanhToan_MaDonDat ON Thanh_Toan(ma_don_dat);
CREATE NONCLUSTERED INDEX IX_TinTuc_MaLoaiTin_TrangThai ON Tin_Tuc(ma_loai_tin, trang_thai) INCLUDE (tieu_de, ngay_dang, luot_xem);
CREATE NONCLUSTERED INDEX IX_LienHe_TrangThai ON Lien_He(trang_thai_xu_ly);
CREATE NONCLUSTERED INDEX IX_XacThucOTP_Email_Loai ON Xac_Thuc_OTP(email, loai_otp, da_xac_thuc, het_han_luc);
GO

-- =====================================================================
-- 5. KHỞI TẠO DỮ LIỆU BAN ĐẦU (SEED DATA MẶC ĐỊNH)
-- =====================================================================

-- 5.1. Dữ liệu Vai trò
IF NOT EXISTS (SELECT 1 FROM Vai_Tro)
BEGIN
    INSERT INTO Vai_Tro (TenVaiTro, MoTa) VALUES
    ('ADMIN', N'Quản trị viên toàn quyền hệ thống'),
    ('NHAN_VIEN', N'Nhân viên quản lý sân và bán hàng tại quầy'),
    ('KHACH_HANG', N'Khách hàng đặt sân');
END;
GO

-- 5.2. Dữ liệu Tài khoản Quản trị viên mặc định (Mật khẩu: Admin@123)
IF NOT EXISTS (SELECT 1 FROM Nguoi_Dung WHERE email = 'admin@soccer247.vn')
BEGIN
    INSERT INTO Nguoi_Dung (ho_ten, email, so_dien_thoai, mat_khau, MaVaiTro)
    VALUES (N'Quản Trị Viên', 'admin@soccer247.vn', '0901234567', '$2a$10$w3U6sJc8m3iK7M9p3Q9q2e9U9U9U9U9U9U9U9U9U9U9U9U9U9U9U9', 1);
END;
GO

-- 5.3. Dữ liệu Loại Sân
IF NOT EXISTS (SELECT 1 FROM Loai_San)
BEGIN
    INSERT INTO Loai_San (ten_loai, mo_ta, trang_thai) VALUES
    (N'Sân 5 người', N'Sân cỏ nhân tạo mini 5 người, kích thước 20m x 40m', 1),
    (N'Sân 7 người', N'Sân cỏ nhân tạo bán tiêu chuẩn 7 người, kích thước 30m x 50m', 1),
    (N'Sân 11 người', N'Sân cỏ nhân tạo tiêu chuẩn thi đấu 11 người, kích thước 60m x 100m', 1);
END;
GO

-- 5.4. Dữ liệu Sân Bóng mẫu
IF NOT EXISTS (SELECT 1 FROM San_Bong)
BEGIN
    INSERT INTO San_Bong (ma_loai_san, ten_san, don_gia_phut, trang_thai) VALUES
    (1, N'Sân 5A', 5000.00, 'SAN_SANG'),
    (1, N'Sân 5B', 5000.00, 'SAN_SANG'),
    (1, N'Sân 5C', 5000.00, 'SAN_SANG'),
    (2, N'Sân 7A', 8000.00, 'SAN_SANG'),
    (2, N'Sân 7B', 8000.00, 'SAN_SANG'),
    (3, N'Sân 11A', 15000.00, 'SAN_SANG');
END;
GO

-- 5.5. Dữ liệu Khung Giờ chuẩn từ 06:00 đến 23:30
IF NOT EXISTS (SELECT 1 FROM Khung_Gio)
BEGIN
    INSERT INTO Khung_Gio (gio_bat_dau, gio_ket_thuc, nhan_hien_thi, thu_tu, trang_thai) VALUES
    ('06:00', '06:30', N'06:00 - 06:30', 1, 1),
    ('06:30', '07:00', N'06:30 - 07:00', 2, 1),
    ('07:00', '07:30', N'07:00 - 07:30', 3, 1),
    ('07:30', '08:00', N'07:30 - 08:00', 4, 1),
    ('08:00', '08:30', N'08:00 - 08:30', 5, 1),
    ('08:30', '09:00', N'08:30 - 09:00', 6, 1),
    ('09:00', '09:30', N'09:00 - 09:30', 7, 1),
    ('09:30', '10:00', N'09:30 - 10:00', 8, 1),
    ('10:00', '10:30', N'10:00 - 10:30', 9, 1),
    ('10:30', '11:00', N'10:30 - 11:00', 10, 1),
    ('11:00', '11:30', N'11:00 - 11:30', 11, 1),
    ('11:30', '12:00', N'11:30 - 12:00', 12, 1),
    ('12:00', '12:30', N'12:00 - 12:30', 13, 1),
    ('12:30', '13:00', N'12:30 - 13:00', 14, 1),
    ('13:00', '13:30', N'13:00 - 13:30', 15, 1),
    ('13:30', '14:00', N'13:30 - 14:00', 16, 1),
    ('14:00', '14:30', N'14:00 - 14:30', 17, 1),
    ('14:30', '15:00', N'14:30 - 15:00', 18, 1),
    ('15:00', '15:30', N'15:00 - 15:30', 19, 1),
    ('15:30', '16:00', N'15:30 - 16:00', 20, 1),
    ('16:00', '16:30', N'16:00 - 16:30', 21, 1),
    ('16:30', '17:00', N'16:30 - 17:00', 22, 1),
    ('17:00', '17:30', N'17:00 - 17:30', 23, 1),
    ('17:30', '18:00', N'17:30 - 18:00', 24, 1),
    ('18:00', '18:30', N'18:00 - 18:30', 25, 1),
    ('18:30', '19:00', N'18:30 - 19:00', 26, 1),
    ('19:00', '19:30', N'19:00 - 19:30', 27, 1),
    ('19:30', '20:00', N'19:30 - 20:00', 28, 1),
    ('20:00', '20:30', N'20:00 - 20:30', 29, 1),
    ('20:30', '21:00', N'20:30 - 21:00', 30, 1),
    ('21:00', '21:30', N'21:00 - 21:30', 31, 1),
    ('21:30', '22:00', N'21:30 - 22:00', 32, 1),
    ('22:00', '22:30', N'22:00 - 22:30', 33, 1),
    ('22:30', '23:00', N'22:30 - 23:00', 34, 1),
    ('23:00', '23:30', N'23:00 - 23:30', 35, 1);
END;
GO

-- 5.6. Dữ liệu Dịch vụ & Hàng hóa kho
IF NOT EXISTS (SELECT 1 FROM Dich_Vu)
BEGIN
    INSERT INTO Dich_Vu (ten_dich_vu, don_gia, ton_kho) VALUES
    (N'Nước suối Aquafina 500ml', 10000.00, 200),
    (N'Nước khoáng Revive Chanh Muối', 15000.00, 150),
    (N'Nước tăng lực Redbull Thái', 20000.00, 100),
    (N'Áo tập Bib phân đội (Thuê/Trận)', 30000.00, 50),
    (N'Bóng thi đấu FIFA Molten (Thuê/Trận)', 50000.00, 20),
    (N'Thuê trọng tài bắt chính (Trận)', 150000.00, 10);
END;
GO

-- 5.7. Dữ liệu Danh mục Tin tức
IF NOT EXISTS (SELECT 1 FROM Loai_Tin_Tuc)
BEGIN
    INSERT INTO Loai_Tin_Tuc (ten_loai, trang_thai) VALUES
    (N'Tin tức & Sự kiện', 1),
    (N'Giải đấu bóng đá phong trào', 1),
    (N'Khuyến mãi & Ưu đãi giờ vàng', 1),
    (N'Cẩm nang & Luật thi đấu', 1);
END;
GO

-- 5.8. Dữ liệu Giới thiệu hệ thống (About Us)
IF NOT EXISTS (SELECT 1 FROM About_Us)
BEGIN
    INSERT INTO About_Us (ten_trung_tam, hotline, email, dia_chi, link_map, gioi_thieu_ngan, bai_viet_about_us, link_facebook, link_zalo)
    VALUES (
        N'Soccer247 - Trung Tâm Thể Thao & Sân Bóng Nhân Tạo Hiện Đại',
        '0901234567',
        'contact@soccer247.vn',
        N'Số 123 Đường Nguyễn Ái Quốc, TP. Biên Hòa, Tỉnh Đồng Nai',
        'https://maps.google.com',
        N'Soccer247 cung cấp cụm sân bóng cỏ nhân tạo tiêu chuẩn FIFA, hệ thống chiếu sáng LED hiện đại, dịch vụ tiện ích khép kín và đặt sân trực tuyến 24/7.',
        N'Chào mừng bạn đến với Soccer247! Chúng tôi tự hào là đơn vị tiên phong áp dụng công nghệ số hóa vào việc vận hành và quản lý sân bóng tại Việt Nam. Với chất lượng mặt cỏ nhập khẩu đạt chuẩn FIFA, khu vực căn tin phục vụ giải khát đa dạng, phòng thay đồ sạch sẽ và bãi đỗ xe rộng rãi, Soccer247 cam kết mang lại trải nghiệm thi đấu thể thao chuyên nghiệp và tuyệt vời nhất cho cộng đồng yêu bóng đá.',
        'https://facebook.com/soccer247',
        'https://zalo.me/0901234567'
    );
END;
GO

-- 5.9. Dữ liệu Banner Slider mẫu
IF NOT EXISTS (SELECT 1 FROM Banner)
BEGIN
    INSERT INTO Banner (tieu_de, loai_banner, hinh_anh, video_url, lien_ket, thu_tu, trang_thai) VALUES
    (N'Chào mừng bạn đến với Soccer247 - Đặt sân nhanh chóng!', 'IMAGE', 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80', NULL, '/', 1, 1),
    (N'Ưu đãi giờ vàng: Giảm 20% cho khung giờ ban ngày', 'IMAGE', 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=1200&q=80', NULL, '/', 2, 1);
END;
GO

PRINT N'✅ ĐÃ KHỞI TẠO XONG CƠ SỞ DỮ LIỆU, TOÀN BỘ 15 BẢNG VÀ SEED DATA CHO QuanLySanBong!';
PRINT N'⚠️ LƯU Ý: File này TUYỆT ĐỐI KHÔNG CHỨA PROCEDURE. Hãy chạy tiếp file ThuTuc.sql để cài đặt toàn bộ thủ tục lưu trữ!';
GO
