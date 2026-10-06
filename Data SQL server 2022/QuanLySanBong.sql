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
IF OBJECT_ID('Khung_Gio', 'U') IS NOT NULL DROP TABLE Khung_Gio;
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
    ho_ten NVARCHAR(100) NULL,
    email VARCHAR(255) UNIQUE NULL,
    so_dien_thoai VARCHAR(20) NULL,
    mat_khau VARCHAR(255) NULL,
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

-- 4.4. Bảng Khung_Gio (Ma trận các mốc giờ bắt đầu đá 6h - 19h)
CREATE TABLE Khung_Gio (
    id INT IDENTITY(1,1) PRIMARY KEY,
    gio_bat_dau VARCHAR(5) NOT NULL,
    gio_ket_thuc VARCHAR(5) NOT NULL,
    nhan_hien_thi NVARCHAR(50) NOT NULL,
    thu_tu INT NOT NULL,
    trang_thai BIT DEFAULT 1
);
GO

-- 4.5. Bảng Don_Dat_San (Đơn đặt lịch thi đấu: Cố định hoặc Linh hoạt theo phút; Hỗ trợ NULL ma_san cho đơn bán lẻ dịch vụ/nước)
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

-- 4.6. Bảng Thanh_Toan (Lịch sử thanh toán cọc 30% và thanh toán toàn phần)
CREATE TABLE Thanh_Toan (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ma_don_dat INT NOT NULL,
    phuong_thuc VARCHAR(20) CHECK (phuong_thuc IN ('TIEN_MAT', 'CHUYEN_KHOAN')) NOT NULL,
    loai_thanh_toan VARCHAR(20) CHECK (loai_thanh_toan IN ('DAT_COC', 'TRA_HET', 'THANH_TOAN_SAU', 'CHUA_THANH_TOAN')) NOT NULL,
    so_tien DECIMAL(10, 2) NOT NULL,
    ma_giao_dich VARCHAR(100) NULL,
    trang_thai_gd VARCHAR(20) CHECK (trang_thai_gd IN ('DANG_CHO', 'CHO_XU_LY', 'THANH_CONG', 'THAT_BAI', 'HOAN_TIEN')) DEFAULT 'THANH_CONG',
    ngay_thanh_toan DATETIME DEFAULT GETDATE(),
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
    so_luong_da_tra INT NOT NULL DEFAULT 0,
    tongtien_dichvu DECIMAL(10, 2) NOT NULL, 
    PRIMARY KEY (ma_don_dat, ma_dich_vu),
    FOREIGN KEY (ma_don_dat) REFERENCES Don_Dat_San(id) ON DELETE CASCADE,
    FOREIGN KEY (ma_dich_vu) REFERENCES Dich_Vu(id) ON DELETE NO ACTION
);
GO

PRINT N'✅ ĐÃ KHỞI TẠO XONG CƠ SỞ DỮ LIỆU VÀ TOÀN BỘ BẢNG CHO QuanLySanBong!';
GO


