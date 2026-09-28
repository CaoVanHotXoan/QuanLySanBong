-- =====================================================================
-- FILE: STORED PROCEDURES (THỦ TỤC LƯU TRỮ HỆ THỐNG QUẢN LÝ SÂN BÓNG)
-- Tương thích: SQL Server 2016, 2017, 2019, 2022+
-- Lưu ý: Đảm bảo đã chọn đúng cơ sở dữ liệu trước khi chạy file này
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. THỦ TỤC XÁC THỰC & NGƯỜI DÙNG (AUTH & USER)
-- ---------------------------------------------------------------------

-- 1.1. Thêm người dùng mới (Đăng ký)
CREATE OR ALTER PROCEDURE sp_ThemNguoiDung
    @ho_ten NVARCHAR(100),
    @email VARCHAR(255),
    @so_dien_thoai VARCHAR(15),
    @mat_khau VARCHAR(255),
    @vai_tro VARCHAR(20) = 'KHACH_HANG'
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        -- Kiểm tra email đã tồn tại chưa
        IF EXISTS (SELECT 1 FROM Nguoi_Dung WHERE email = @email)
        BEGIN
            ;THROW 50001, N'Email này đã được đăng ký trong hệ thống.', 1;
        END;

        -- Thêm người dùng mới
        INSERT INTO Nguoi_Dung (ho_ten, email, so_dien_thoai, mat_khau, vai_tro, ngay_tao)
        VALUES (@ho_ten, @email, @so_dien_thoai, @mat_khau, @vai_tro, GETDATE());

        SELECT 
            id, ho_ten, email, so_dien_thoai, vai_tro, ngay_tao 
        FROM Nguoi_Dung 
        WHERE id = SCOPE_IDENTITY();
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

-- 1.2. Đăng nhập người dùng
CREATE OR ALTER PROCEDURE sp_DangNhap
    @email VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Nguoi_Dung WHERE email = @email)
        BEGIN
            ;THROW 50002, N'Tài khoản email không tồn tại trong hệ thống.', 1;
        END;

        SELECT 
            id, ho_ten, email, so_dien_thoai, mat_khau, vai_tro, anh_dai_dien, ngay_tao
        FROM Nguoi_Dung 
        WHERE email = @email;
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

-- 1.3. Lấy thông tin người dùng theo ID
CREATE OR ALTER PROCEDURE sp_LayThongTinNguoiDung
    @ma_nguoi_dung INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Nguoi_Dung WHERE id = @ma_nguoi_dung)
        BEGIN
            ;THROW 50003, N'Không tìm thấy thông tin người dùng.', 1;
        END;

        SELECT 
            id, ho_ten, email, so_dien_thoai, vai_tro, anh_dai_dien, ngay_tao
        FROM Nguoi_Dung 
        WHERE id = @ma_nguoi_dung;
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO


-- ---------------------------------------------------------------------
-- 2. THỦ TỤC QUẢN LÝ SÂN VÀ ĐẶT SÂN (COURT & BOOKING)
-- ---------------------------------------------------------------------

-- 2.1. Lấy danh sách toàn bộ sân bóng kèm loại sân
CREATE OR ALTER PROCEDURE sp_LayDanhSachSan
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT 
            sb.id,
            sb.ten_san,
            sb.hinh_anh,
            sb.trang_thai,
            ls.id AS ma_loai_san,
            ls.ten_loai,
            ls.mo_ta,
            ls.gia_co_ban
        FROM San_Bong sb
        INNER JOIN Loai_San ls ON sb.ma_loai_san = ls.id;
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

-- 2.2. Lấy lịch đặt sân theo ngày và mã sân
CREATE OR ALTER PROCEDURE sp_LayLichSan
    @ngay_da DATE,
    @ma_san INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT 
            d.id AS ma_don_dat,
            d.ma_san,
            sb.ten_san,
            ls.ten_loai,
            d.ma_nguoi_dung,
            nd.ho_ten AS ten_khach_hang,
            nd.so_dien_thoai,
            d.ngay_da,
            d.gio_bat_dau,
            d.gio_ket_thuc,
            d.tien_san,
            d.tong_tien,
            d.trang_thai
        FROM Don_Dat_San d
        INNER JOIN San_Bong sb ON d.ma_san = sb.id
        INNER JOIN Loai_San ls ON sb.ma_loai_san = ls.id
        INNER JOIN Nguoi_Dung nd ON d.ma_nguoi_dung = nd.id
        WHERE d.ngay_da = @ngay_da
          AND (@ma_san IS NULL OR d.ma_san = @ma_san)
          AND d.trang_thai <> 'DA_HUY'
        ORDER BY d.gio_bat_dau ASC;
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

-- 2.3. Đặt sân bóng (sp_DatSan)
CREATE OR ALTER PROCEDURE sp_DatSan
    @ma_nguoi_dung INT,
    @ma_san INT,
    @ngay_da DATE,
    @gio_bat_dau TIME,
    @gio_ket_thuc TIME,
    @tien_san DECIMAL(10, 2) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        -- 1. Kiểm tra sân có tồn tại và đang sẵn sàng không
        IF NOT EXISTS (SELECT 1 FROM San_Bong WHERE id = @ma_san AND trang_thai = 'SAN_SANG')
        BEGIN
            ;THROW 50010, N'Sân bóng không tồn tại hoặc đang trong thời gian bảo trì.', 1;
        END;

        -- 2. Kiểm tra giờ bắt đầu phải nhỏ hơn giờ kết thúc
        IF @gio_bat_dau >= @gio_ket_thuc
        BEGIN
            ;THROW 50011, N'Giờ bắt đầu phải nhỏ hơn giờ kết thúc.', 1;
        END;

        -- 3. Kiểm tra ngày đặt không được trong quá khứ
        IF @ngay_da < CAST(GETDATE() AS DATE)
        BEGIN
            ;THROW 50012, N'Không thể đặt sân cho ngày trong quá khứ.', 1;
        END;

        -- 4. Kiểm tra xung đột khung giờ (Trùng lịch)
        IF EXISTS (
            SELECT 1 
            FROM Don_Dat_San 
            WHERE ma_san = @ma_san 
              AND ngay_da = @ngay_da 
              AND trang_thai IN ('CHO_XAC_NHAN', 'DA_CHOT')
              AND (
                  (@gio_bat_dau >= gio_bat_dau AND @gio_bat_dau < gio_ket_thuc) OR
                  (@gio_ket_thuc > gio_bat_dau AND @gio_ket_thuc <= gio_ket_thuc) OR
                  (@gio_bat_dau <= gio_bat_dau AND @gio_ket_thuc >= gio_ket_thuc)
              )
        )
        BEGIN
            ;THROW 50013, N'Khung giờ này sân đã có người đặt trước. Vui lòng chọn khung giờ khác!', 1;
        END;

        -- 5. Tính giá tiền sân nếu không truyền vào
        DECLARE @gia_tinh_duoc DECIMAL(10, 2);
        SET @gia_tinh_duoc = @tien_san;

        IF @gia_tinh_duoc IS NULL OR @gia_tinh_duoc <= 0
        BEGIN
            DECLARE @ma_loai_san INT;
            SELECT @ma_loai_san = ma_loai_san FROM San_Bong WHERE id = @ma_san;

            DECLARE @la_cuoi_tuan BIT;
            SET @la_cuoi_tuan = 0;
            IF DATEPART(dw, @ngay_da) IN (1, 7)
            BEGIN
                SET @la_cuoi_tuan = 1;
            END;

            -- Thử tìm theo bảng Khung_Gio_Gia
            SELECT TOP 1 @gia_tinh_duoc = don_gia
            FROM Khung_Gio_Gia
            WHERE ma_loai_san = @ma_loai_san
              AND la_cuoi_tuan = @la_cuoi_tuan
              AND @gio_bat_dau >= gio_bat_dau
              AND @gio_ket_thuc <= gio_ket_thuc;

            -- Nếu không có khung giờ riêng biệt thì lấy giá cơ bản
            IF @gia_tinh_duoc IS NULL
            BEGIN
                SELECT @gia_tinh_duoc = gia_co_ban FROM Loai_San WHERE id = @ma_loai_san;
            END;
        END;

        -- 6. Tạo đơn đặt sân
        INSERT INTO Don_Dat_San (
            ma_nguoi_dung, ma_san, ngay_da, gio_bat_dau, gio_ket_thuc, tien_san, tong_tien, trang_thai, ngay_tao
        )
        VALUES (
            @ma_nguoi_dung, @ma_san, @ngay_da, @gio_bat_dau, @gio_ket_thuc, @gia_tinh_duoc, @gia_tinh_duoc, 'CHO_XAC_NHAN', GETDATE()
        );

        DECLARE @ma_don_moi INT;
        SET @ma_don_moi = SCOPE_IDENTITY();

        COMMIT TRANSACTION;

        -- Trả về thông tin đơn vừa tạo
        SELECT 
            d.id, d.ma_nguoi_dung, d.ma_san, sb.ten_san, d.ngay_da, d.gio_bat_dau, d.gio_ket_thuc,
            d.tien_san, d.tong_tien, d.trang_thai, d.ngay_tao
        FROM Don_Dat_San d
        INNER JOIN San_Bong sb ON d.ma_san = sb.id
        WHERE d.id = @ma_don_moi;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 
        BEGIN
            ROLLBACK TRANSACTION;
        END;
        ;THROW;
    END CATCH;
END;
GO

-- 2.4. Hủy đơn đặt sân và hoàn cọc (sp_HuyDonVaHoanCoc)
CREATE OR ALTER PROCEDURE sp_HuyDonVaHoanCoc
    @ma_don_dat INT,
    @ma_nguoi_dung INT,
    @ly_do_huy NVARCHAR(255) = N'Khách hàng yêu cầu hủy đơn'
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        -- 1. Kiểm tra đơn đặt sân
        DECLARE @trang_thai_hien_tai VARCHAR(20);
        DECLARE @ngay_da DATE;
        DECLARE @gio_bat_dau TIME;
        DECLARE @nguoi_so_huu INT;

        SELECT 
            @trang_thai_hien_tai = trang_thai,
            @ngay_da = ngay_da,
            @gio_bat_dau = gio_bat_dau,
            @nguoi_so_huu = ma_nguoi_dung
        FROM Don_Dat_San
        WHERE id = @ma_don_dat;

        IF @trang_thai_hien_tai IS NULL
        BEGIN
            ;THROW 50020, N'Không tìm thấy thông tin đơn đặt sân.', 1;
        END;

        -- Kiểm tra quyền (Chỉ người đặt hoặc Admin mới được hủy)
        DECLARE @vai_tro VARCHAR(20);
        SELECT @vai_tro = vai_tro FROM Nguoi_Dung WHERE id = @ma_nguoi_dung;
        
        IF @nguoi_so_huu <> @ma_nguoi_dung AND @vai_tro NOT IN ('ADMIN', 'NHAN_VIEN')
        BEGIN
            ;THROW 50021, N'Bạn không có quyền hủy đơn đặt sân của người khác.', 1;
        END;

        IF @trang_thai_hien_tai = 'DA_HUY'
        BEGIN
            ;THROW 50022, N'Đơn đặt sân này đã được hủy trước đó.', 1;
        END;

        IF @trang_thai_hien_tai = 'HOAN_THANH'
        BEGIN
            ;THROW 50023, N'Đơn đặt sân đã hoàn thành, không thể hủy.', 1;
        END;

        -- 2. Tính khoảng cách thời gian từ hiện tại đến giờ đá
        DECLARE @thoi_diem_da DATETIME;
        SET @thoi_diem_da = CAST(@ngay_da AS DATETIME) + CAST(@gio_bat_dau AS DATETIME);
        
        DECLARE @so_gio_con_lai FLOAT;
        SET @so_gio_con_lai = DATEDIFF(MINUTE, GETDATE(), @thoi_diem_da) / 60.0;

        DECLARE @ty_le_hoan INT;
        SET @ty_le_hoan = 0;
        IF @so_gio_con_lai >= 24
        BEGIN
            SET @ty_le_hoan = 100;
        END
        ELSE IF @so_gio_con_lai >= 12
        BEGIN
            SET @ty_le_hoan = 50;
        END
        ELSE
        BEGIN
            SET @ty_le_hoan = 0;
        END;

        -- 3. Tính tổng số tiền đã thanh toán/cọc thành công
        DECLARE @tong_tien_da_coc DECIMAL(10, 2);
        SET @tong_tien_da_coc = 0;

        SELECT @tong_tien_da_coc = ISNULL(SUM(so_tien), 0)
        FROM Thanh_Toan
        WHERE ma_don_dat = @ma_don_dat AND trang_thai_gd = 'THANH_CONG';

        DECLARE @so_tien_hoan DECIMAL(10, 2);
        SET @so_tien_hoan = (@tong_tien_da_coc * @ty_le_hoan) / 100.0;

        -- 4. Cập nhật trạng thái đơn đặt sân
        UPDATE Don_Dat_San
        SET trang_thai = 'DA_HUY'
        WHERE id = @ma_don_dat;

        -- 5. Ghi nhận lịch sử hoàn tiền nếu có tiền cọc
        IF @tong_tien_da_coc > 0
        BEGIN
            INSERT INTO Lich_Su_Hoan_Tien (ma_don_dat, so_tien_hoan, ty_le_hoan, ly_do_huy, ngay_hoan)
            VALUES (@ma_don_dat, @so_tien_hoan, @ty_le_hoan, @ly_do_huy, GETDATE());

            -- Cập nhật trạng thái giao dịch thanh toán
            UPDATE Thanh_Toan
            SET trang_thai_gd = 'HOAN_TIEN'
            WHERE ma_don_dat = @ma_don_dat AND trang_thai_gd = 'THANH_CONG';
        END;

        COMMIT TRANSACTION;

        -- Trả kết quả
        SELECT 
            @ma_don_dat AS ma_don_dat,
            'DA_HUY' AS trang_thai,
            @tong_tien_da_coc AS tong_tien_da_coc,
            @ty_le_hoan AS ty_le_hoan,
            @so_tien_hoan AS so_tien_hoan,
            @so_gio_con_lai AS so_gio_con_lai,
            @ly_do_huy AS ly_do_huy;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 
        BEGIN
            ROLLBACK TRANSACTION;
        END;
        ;THROW;
    END CATCH;
END;
GO


-- ---------------------------------------------------------------------
-- 3. THỦ TỤC QUẢN LÝ DỊCH VỤ & KHO HÀNG (SERVICES & INVENTORY)
-- ---------------------------------------------------------------------

-- 3.1. Lấy danh sách dịch vụ
CREATE OR ALTER PROCEDURE sp_LayDanhSachDichVu
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT id, ten_dich_vu, don_gia, don_vi_tinh, ton_kho
        FROM Dich_Vu;
    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO

-- 3.2. Bán/Thêm dịch vụ vào đơn đặt sân (sp_ThemDichVu)
CREATE OR ALTER PROCEDURE sp_ThemDichVu
    @ma_don_dat INT,
    @ma_dich_vu INT,
    @so_luong INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        -- Kiểm tra đơn đặt sân
        IF NOT EXISTS (SELECT 1 FROM Don_Dat_San WHERE id = @ma_don_dat AND trang_thai IN ('CHO_XAC_NHAN', 'DA_CHOT'))
        BEGIN
            ;THROW 50030, N'Đơn đặt sân không tồn tại hoặc đã kết thúc/bị hủy.', 1;
        END;

        -- Kiểm tra số lượng mua hợp lệ
        IF @so_luong <= 0
        BEGIN
            ;THROW 50031, N'Số lượng dịch vụ phải lớn hơn 0.', 1;
        END;

        -- Kiểm tra dịch vụ và tồn kho
        DECLARE @don_gia DECIMAL(10, 2);
        DECLARE @ton_kho_hien_tai INT;
        SELECT @don_gia = don_gia, @ton_kho_hien_tai = ton_kho
        FROM Dich_Vu
        WHERE id = @ma_dich_vu;

        IF @don_gia IS NULL
        BEGIN
            ;THROW 50032, N'Dịch vụ không tồn tại trong hệ thống.', 1;
        END;

        IF @ton_kho_hien_tai < @so_luong
        BEGIN
            ;THROW 50033, N'Số lượng tồn kho không đủ để đáp ứng.', 1;
        END;

        -- Trừ tồn kho dịch vụ
        UPDATE Dich_Vu
        SET ton_kho = ton_kho - @so_luong
        WHERE id = @ma_dich_vu;

        -- Ghi chi tiết dịch vụ vào đơn đặt sân (Nếu có rồi thì cộng dồn số lượng)
        IF EXISTS (SELECT 1 FROM Chi_Tiet_Dich_Vu WHERE ma_don_dat = @ma_don_dat AND ma_dich_vu = @ma_dich_vu)
        BEGIN
            UPDATE Chi_Tiet_Dich_Vu
            SET so_luong = so_luong + @so_luong
            WHERE ma_don_dat = @ma_don_dat AND ma_dich_vu = @ma_dich_vu;
        END
        ELSE
        BEGIN
            INSERT INTO Chi_Tiet_Dich_Vu (ma_don_dat, ma_dich_vu, so_luong, gia_luc_ban)
            VALUES (@ma_don_dat, @ma_dich_vu, @so_luong, @don_gia);
        END;

        -- Cập nhật lại tổng tiền đơn đặt sân = tiền sân + tổng tiền tất cả dịch vụ
        DECLARE @tong_tien_dv DECIMAL(10, 2);
        SET @tong_tien_dv = 0;

        SELECT @tong_tien_dv = ISNULL(SUM(so_luong * gia_luc_ban), 0)
        FROM Chi_Tiet_Dich_Vu
        WHERE ma_don_dat = @ma_don_dat;

        UPDATE Don_Dat_San
        SET tong_tien = tien_san + @tong_tien_dv
        WHERE id = @ma_don_dat;

        COMMIT TRANSACTION;

        -- Trả về thông tin dịch vụ của đơn
        SELECT 
            ct.ma_don_dat,
            ct.ma_dich_vu,
            dv.ten_dich_vu,
            ct.so_luong,
            ct.gia_luc_ban,
            (ct.so_luong * ct.gia_luc_ban) AS thanh_tien,
            d.tong_tien AS tong_tien_don_moi
        FROM Chi_Tiet_Dich_Vu ct
        INNER JOIN Dich_Vu dv ON ct.ma_dich_vu = dv.id
        INNER JOIN Don_Dat_San d ON ct.ma_don_dat = d.id
        WHERE ct.ma_don_dat = @ma_don_dat AND ct.ma_dich_vu = @ma_dich_vu;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 
        BEGIN
            ROLLBACK TRANSACTION;
        END;
        ;THROW;
    END CATCH;
END;
GO

-- 3.3. Nhập kho dịch vụ (sp_NhapKhoDichVu)
CREATE OR ALTER PROCEDURE sp_NhapKhoDichVu
    @ma_dich_vu INT,
    @so_luong_nhap INT,
    @gia_nhap DECIMAL(10, 2)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Dich_Vu WHERE id = @ma_dich_vu)
        BEGIN
            ;THROW 50040, N'Dịch vụ không tồn tại trong hệ thống.', 1;
        END;

        IF @so_luong_nhap <= 0 OR @gia_nhap <= 0
        BEGIN
            ;THROW 50041, N'Số lượng và giá nhập phải lớn hơn 0.', 1;
        END;

        -- Thêm phiếu nhập kho
        INSERT INTO Phieu_Nhap_Kho (ma_dich_vu, so_luong_nhap, gia_nhap, ngay_nhap)
        VALUES (@ma_dich_vu, @so_luong_nhap, @gia_nhap, GETDATE());

        -- Cập nhật tăng số lượng tồn kho
        UPDATE Dich_Vu
        SET ton_kho = ton_kho + @so_luong_nhap
        WHERE id = @ma_dich_vu;

        COMMIT TRANSACTION;

        SELECT 
            dv.id, dv.ten_dich_vu, dv.ton_kho, @so_luong_nhap AS so_luong_vua_nhap, @gia_nhap AS gia_nhap
        FROM Dich_Vu dv
        WHERE dv.id = @ma_dich_vu;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 
        BEGIN
            ROLLBACK TRANSACTION;
        END;
        ;THROW;
    END CATCH;
END;
GO


-- ---------------------------------------------------------------------
-- 4. THỦ TỤC THANH TOÁN (PAYMENT)
-- ---------------------------------------------------------------------

-- 4.1. Xử lý thanh toán đơn đặt sân (sp_ThanhToanDon)
CREATE OR ALTER PROCEDURE sp_ThanhToanDon
    @ma_don_dat INT,
    @phuong_thuc VARCHAR(20),
    @loai_thanh_toan VARCHAR(20),
    @so_tien DECIMAL(10, 2),
    @ma_giao_dich VARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        -- Kiểm tra đơn đặt sân
        DECLARE @trang_thai_don VARCHAR(20);
        DECLARE @tong_tien DECIMAL(10, 2);

        SELECT @trang_thai_don = trang_thai, @tong_tien = tong_tien
        FROM Don_Dat_San
        WHERE id = @ma_don_dat;

        IF @trang_thai_don IS NULL
        BEGIN
            ;THROW 50050, N'Không tìm thấy đơn đặt sân tương ứng.', 1;
        END;

        IF @trang_thai_don = 'DA_HUY'
        BEGIN
            ;THROW 50051, N'Đơn đặt sân này đã bị hủy, không thể thực hiện thanh toán.', 1;
        END;

        IF @so_tien <= 0
        BEGIN
            ;THROW 50052, N'Số tiền thanh toán phải lớn hơn 0.', 1;
        END;

        -- Thêm bản ghi vào bảng Thanh_Toan
        INSERT INTO Thanh_Toan (
            ma_don_dat, phuong_thuc, loai_thanh_toan, so_tien, ma_giao_dich, trang_thai_gd, ngay_thanh_toan
        )
        VALUES (
            @ma_don_dat, @phuong_thuc, @loai_thanh_toan, @so_tien, @ma_giao_dich, 'THANH_CONG', GETDATE()
        );

        -- Cập nhật trạng thái đơn đặt sân
        IF @loai_thanh_toan = 'DAT_COC'
        BEGIN
            UPDATE Don_Dat_San SET trang_thai = 'DA_CHOT' WHERE id = @ma_don_dat;
        END
        ELSE IF @loai_thanh_toan = 'TRA_HET'
        BEGIN
            UPDATE Don_Dat_San SET trang_thai = 'HOAN_THANH' WHERE id = @ma_don_dat;
        END;

        COMMIT TRANSACTION;

        SELECT 
            tt.id AS ma_thanh_toan,
            tt.ma_don_dat,
            tt.phuong_thuc,
            tt.loai_thanh_toan,
            tt.so_tien,
            tt.ma_giao_dich,
            tt.trang_thai_gd,
            tt.ngay_thanh_toan,
            d.trang_thai AS trang_thai_don_moi
        FROM Thanh_Toan tt
        INNER JOIN Don_Dat_San d ON tt.ma_don_dat = d.id
        WHERE tt.id = SCOPE_IDENTITY();

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 
        BEGIN
            ROLLBACK TRANSACTION;
        END;
        ;THROW;
    END CATCH;
END;
GO


-- ---------------------------------------------------------------------
-- 5. THỦ TỤC BÁO CÁO & THỐNG KÊ (REPORT & STATISTICS)
-- ---------------------------------------------------------------------

-- 5.1. Báo cáo doanh thu theo khoảng thời gian (sp_BaoCaoDoanhThu)
CREATE OR ALTER PROCEDURE sp_BaoCaoDoanhThu
    @tu_ngay DATE,
    @den_ngay DATE
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF @tu_ngay > @den_ngay
        BEGIN
            ;THROW 50060, N'Từ ngày không được lớn hơn đến ngày.', 1;
        END;

        -- Bảng tạm tổng hợp doanh thu
        SELECT 
            COUNT(DISTINCT d.id) AS tong_so_don,
            COUNT(DISTINCT CASE WHEN d.trang_thai = 'HOAN_THANH' THEN d.id END) AS so_don_hoan_thanh,
            COUNT(DISTINCT CASE WHEN d.trang_thai = 'DA_HUY' THEN d.id END) AS so_don_da_huy,
            ISNULL(SUM(CASE WHEN d.trang_thai IN ('DA_CHOT', 'HOAN_THANH') THEN d.tien_san ELSE 0 END), 0) AS doanh_thu_tien_san,
            ISNULL(SUM(CASE WHEN d.trang_thai IN ('DA_CHOT', 'HOAN_THANH') THEN (d.tong_tien - d.tien_san) ELSE 0 END), 0) AS doanh_thu_dich_vu,
            ISNULL(SUM(CASE WHEN d.trang_thai IN ('DA_CHOT', 'HOAN_THANH') THEN d.tong_tien ELSE 0 END), 0) AS tong_doanh_thu,
            ISNULL((SELECT SUM(so_tien_hoan) FROM Lich_Su_Hoan_Tien WHERE CAST(ngay_hoan AS DATE) BETWEEN @tu_ngay AND @den_ngay), 0) AS tong_tien_hoan_tra
        FROM Don_Dat_San d
        WHERE d.ngay_da BETWEEN @tu_ngay AND @den_ngay;

        -- Chi tiết doanh thu theo từng ngày
        SELECT 
            d.ngay_da,
            COUNT(d.id) AS so_don_trong_ngay,
            ISNULL(SUM(d.tien_san), 0) AS tien_san,
            ISNULL(SUM(d.tong_tien - d.tien_san), 0) AS tien_dich_vu,
            ISNULL(SUM(d.tong_tien), 0) AS tong_tien_ngay
        FROM Don_Dat_San d
        WHERE d.ngay_da BETWEEN @tu_ngay AND @den_ngay
          AND d.trang_thai IN ('DA_CHOT', 'HOAN_THANH')
        GROUP BY d.ngay_da
        ORDER BY d.ngay_da ASC;

    END TRY
    BEGIN CATCH
        ;THROW;
    END CATCH;
END;
GO
