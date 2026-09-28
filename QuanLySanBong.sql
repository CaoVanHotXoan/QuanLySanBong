-- =====================================================================
-- FILE 1: CẤU TRÚC BẢNG CƠ SỞ DỮ LIỆU (DATABASE TABLES)
-- Project: Hệ thống Quản lý và Đặt sân thể thao
-- =====================================================================

-- 2. Bảng Nguoi_Dung
IF OBJECT_ID('Nguoi_Dung', 'U') IS NOT NULL DROP TABLE Nguoi_Dung;
CREATE TABLE Nguoi_Dung (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ho_ten NVARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    so_dien_thoai VARCHAR(15),
    mat_khau VARCHAR(255),
    google_id VARCHAR(255) UNIQUE,
    anh_dai_dien VARCHAR(255),
    vai_tro VARCHAR(20) CHECK (vai_tro IN ('ADMIN', 'NHAN_VIEN', 'KHACH_HANG')) DEFAULT 'KHACH_HANG',
    ngay_tao DATETIME DEFAULT GETDATE()
);

-- 3. Bảng Loai_San
IF OBJECT_ID('Loai_San', 'U') IS NOT NULL DROP TABLE Loai_San;
CREATE TABLE Loai_San (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ten_loai NVARCHAR(50) NOT NULL, 
    mo_ta NVARCHAR(MAX),
    gia_co_ban DECIMAL(10, 2) NOT NULL,
    trang_thai BIT DEFAULT 1
);

-- 4. Bảng Khung_Gio_Gia
IF OBJECT_ID('Khung_Gio_Gia', 'U') IS NOT NULL DROP TABLE Khung_Gio_Gia;
CREATE TABLE Khung_Gio_Gia (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ma_loai_san INT NOT NULL,
    gio_bat_dau TIME NOT NULL,
    gio_ket_thuc TIME NOT NULL,
    la_cuoi_tuan BIT DEFAULT 0, -- 0: Ngày thường (T2-T6), 1: Cuối tuần (T7-CN)
    don_gia DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (ma_loai_san) REFERENCES Loai_San(id) ON DELETE CASCADE
);

-- 5. Bảng San_Bong
IF OBJECT_ID('San_Bong', 'U') IS NOT NULL DROP TABLE San_Bong;
CREATE TABLE San_Bong (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ma_loai_san INT NOT NULL,
    ten_san NVARCHAR(50) NOT NULL, 
    hinh_anh VARCHAR(255),
    trang_thai VARCHAR(20) CHECK (trang_thai IN ('SAN_SANG', 'BAO_TRI')) DEFAULT 'SAN_SANG',
    FOREIGN KEY (ma_loai_san) REFERENCES Loai_San(id) ON DELETE NO ACTION
);

-- 6. Bảng Don_Dat_San
IF OBJECT_ID('Don_Dat_San', 'U') IS NOT NULL DROP TABLE Don_Dat_San;
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

-- 7. Bảng Thanh_Toan
IF OBJECT_ID('Thanh_Toan', 'U') IS NOT NULL DROP TABLE Thanh_Toan;
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

-- 8. Bảng Lich_Su_Hoan_Tien
IF OBJECT_ID('Lich_Su_Hoan_Tien', 'U') IS NOT NULL DROP TABLE Lich_Su_Hoan_Tien;
CREATE TABLE Lich_Su_Hoan_Tien (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ma_don_dat INT NOT NULL,
    so_tien_hoan DECIMAL(10, 2) NOT NULL,
    ty_le_hoan INT CHECK (ty_le_hoan BETWEEN 0 AND 100),
    ly_do_huy NVARCHAR(255),
    ngay_hoan DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ma_don_dat) REFERENCES Don_Dat_San(id) ON DELETE CASCADE
);

-- 9. Bảng Dich_Vu
IF OBJECT_ID('Dich_Vu', 'U') IS NOT NULL DROP TABLE Dich_Vu;
CREATE TABLE Dich_Vu (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ten_dich_vu NVARCHAR(100) NOT NULL,
    don_gia DECIMAL(10, 2) NOT NULL,
    don_vi_tinh NVARCHAR(20) NOT NULL, 
    ton_kho INT DEFAULT 0
);

-- 10. Bảng Phieu_Nhap_Kho
IF OBJECT_ID('Phieu_Nhap_Kho', 'U') IS NOT NULL DROP TABLE Phieu_Nhap_Kho;
CREATE TABLE Phieu_Nhap_Kho (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ma_dich_vu INT NOT NULL,
    so_luong_nhap INT NOT NULL,
    gia_nhap DECIMAL(10, 2) NOT NULL,
    ngay_nhap DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ma_dich_vu) REFERENCES Dich_Vu(id) ON DELETE CASCADE
);

-- 11. Bảng Chi_Tiet_Dich_Vu
IF OBJECT_ID('Chi_Tiet_Dich_Vu', 'U') IS NOT NULL DROP TABLE Chi_Tiet_Dich_Vu;
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