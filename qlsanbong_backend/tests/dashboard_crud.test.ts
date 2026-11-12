import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { sql, poolPromise } from '../src/config/db';

describe('Kiểm tra toàn bộ chức năng CRUD của Dashboard trên SQL Server', () => {
    let pool: any;
    let testSanId: number | null = null;
    let testLoaiSanId: number | null = null;
    let testDichVuId: number | null = null;
    let testKhungGioId: number | null = null;

    beforeAll(async () => {
        try {
            pool = await poolPromise;
        } catch (err) {
            console.warn('⚠️ SQL Server không thể kết nối trong môi trường sandbox cô lập, bỏ qua integration test.');
        }
    });

    afterAll(async () => {
        // Dọn dẹp dữ liệu test nếu còn sót
        if (testSanId) {
            try {
                await pool.request().input('id', sql.Int, testSanId).execute('sp_XoaSanBong');
            } catch (e) {}
        }
        if (testLoaiSanId) {
            try {
                await pool.request().input('id', sql.Int, testLoaiSanId).execute('sp_XoaLoaiSan');
            } catch (e) {}
        }
        if (testDichVuId) {
            try {
                await pool.request().input('id', sql.Int, testDichVuId).execute('sp_XoaDichVu');
            } catch (e) {}
        }
        if (testKhungGioId) {
            try {
                await pool.request().input('id', sql.Int, testKhungGioId).execute('sp_XoaKhungGio');
            } catch (e) {}
        }
    });

    // 1. KIỂM TRA CRUD LOẠI SÂN
    it('1. Thêm, Sửa, Xóa Loại Sân (Loai_San) hoạt động bình thường', async () => {
        if (!pool) return;
        // 1.1 Thêm
        const addRes = await pool.request()
            .input('ten_loai', sql.NVarChar(50), 'Sân Test Vitest')
            .input('mo_ta', sql.NVarChar(255), 'Mô tả loại sân test')
            .execute('sp_ThemLoaiSan');
        
        expect(addRes.recordset).toBeDefined();
        expect(addRes.recordset.length).toBeGreaterThan(0);
        testLoaiSanId = addRes.recordset[0].id;
        expect(testLoaiSanId).toBeGreaterThan(0);

        // 1.2 Sửa
        const editRes = await pool.request()
            .input('id', sql.Int, testLoaiSanId)
            .input('ten_loai', sql.NVarChar(50), 'Sân Test Vitest Đã Sửa')
            .input('mo_ta', sql.NVarChar(255), 'Mô tả cập nhật')
            .execute('sp_SuaLoaiSan');
        expect(editRes.recordset[0].ten_loai).toBe('Sân Test Vitest Đã Sửa');

        // 1.3 Xóa
        const delRes = await pool.request()
            .input('id', sql.Int, testLoaiSanId)
            .execute('sp_XoaLoaiSan');
        expect(delRes).toBeDefined();
        testLoaiSanId = null;
    });

    // 2. KIỂM TRA CRUD SÂN BÓNG (MỤC SÂN BÓNG)
    it('2. Thêm, Sửa, Xóa Sân Bóng (San_Bong) hoạt động bình thường', async () => {
        if (!pool) return;
        // 2.1 Thêm sân
        const addRes = await pool.request()
            .input('ten_san', sql.NVarChar(50), 'Sân Test Cỏ Nhân Tạo')
            .input('ma_loai_san', sql.Int, 1)
            .input('hinh_anh', sql.VarChar(255), 'https://res.cloudinary.com/test.jpg')
            .input('don_gia_phut', sql.Decimal(10, 2), 5000.00)
            .input('trang_thai', sql.VarChar(20), 'SAN_SANG')
            .execute('sp_ThemSanBong');

        expect(addRes.recordset).toBeDefined();
        expect(addRes.recordset.length).toBeGreaterThan(0);
        testSanId = addRes.recordset[0].id;
        expect(testSanId).toBeGreaterThan(0);
        expect(addRes.recordset[0].ten_san).toBe('Sân Test Cỏ Nhân Tạo');

        // 2.2 Sửa sân
        const editRes = await pool.request()
            .input('id', sql.Int, testSanId)
            .input('ten_san', sql.NVarChar(50), 'Sân Test Đã Cập Nhật')
            .input('ma_loai_san', sql.Int, 1)
            .input('hinh_anh', sql.VarChar(255), 'https://res.cloudinary.com/updated.jpg')
            .input('don_gia_phut', sql.Decimal(10, 2), 6000.00)
            .input('trang_thai', sql.VarChar(20), 'BAO_TRI')
            .execute('sp_SuaSanBong');

        expect(editRes.recordset[0].ten_san).toBe('Sân Test Đã Cập Nhật');
        expect(editRes.recordset[0].trang_thai).toBe('BAO_TRI');

        // 2.3 Xóa sân
        const delRes = await pool.request()
            .input('id', sql.Int, testSanId)
            .execute('sp_XoaSanBong');
        expect(delRes).toBeDefined();
        testSanId = null;
    });

    // 3. KIỂM TRA CRUD DỊCH VỤ
    it('3. Thêm, Sửa, Xóa Dịch Vụ (Dich_Vu) hoạt động bình thường', async () => {
        if (!pool) return;
        // 3.1 Thêm
        const addRes = await pool.request()
            .input('ten_dich_vu', sql.NVarChar(100), 'Nước Chanh Muối Test')
            .input('don_gia', sql.Decimal(10, 2), 15000.00)
            .input('don_vi_tinh', sql.NVarChar(20), 'Chai')
            .input('ton_kho', sql.Int, 50)
            .execute('sp_ThemDichVuMoi');

        expect(addRes.recordset).toBeDefined();
        testDichVuId = addRes.recordset[0].id;
        expect(testDichVuId).toBeGreaterThan(0);

        // 3.2 Sửa
        const editRes = await pool.request()
            .input('id', sql.Int, testDichVuId)
            .input('ten_dich_vu', sql.NVarChar(100), 'Nước Chanh Muối Test Vip')
            .input('don_gia', sql.Decimal(10, 2), 20000.00)
            .input('don_vi_tinh', sql.NVarChar(20), 'Chai')
            .input('ton_kho', sql.Int, 60)
            .execute('sp_SuaDichVu');
        expect(editRes.recordset[0].ten_dich_vu).toBe('Nước Chanh Muối Test Vip');

        // 3.3 Xóa
        await pool.request()
            .input('id', sql.Int, testDichVuId)
            .execute('sp_XoaDichVu');
        testDichVuId = null;
    });

    // 4. KIỂM TRA CRUD KHUNG GIỜ
    it('4. Thêm, Sửa, Xóa Khung Giờ (Khung_Gio) hoạt động bình thường', async () => {
        if (!pool) return;
        // 4.1 Thêm
        const addRes = await pool.request()
            .input('gio_bat_dau', sql.VarChar(5), '04:00')
            .input('gio_ket_thuc', sql.VarChar(5), '05:00')
            .input('nhan_hien_thi', sql.NVarChar(50), '4h00 Sáng')
            .input('thu_tu', sql.Int, 99)
            .input('trang_thai', sql.Bit, 1)
            .execute('sp_ThemKhungGio');

        expect(addRes.recordset).toBeDefined();
        testKhungGioId = addRes.recordset[0].id;
        expect(testKhungGioId).toBeGreaterThan(0);

        // 4.2 Sửa
        const editRes = await pool.request()
            .input('id', sql.Int, testKhungGioId)
            .input('gio_bat_dau', sql.VarChar(5), '04:00')
            .input('gio_ket_thuc', sql.VarChar(5), '05:00')
            .input('nhan_hien_thi', sql.NVarChar(50), '4h00 Ca Sớm')
            .input('thu_tu', sql.Int, 100)
            .input('trang_thai', sql.Bit, 1)
            .execute('sp_SuaKhungGio');
        expect(editRes.recordset[0].nhan_hien_thi).toBe('4h00 Ca Sớm');

        // 4.3 Xóa
        await pool.request()
            .input('id', sql.Int, testKhungGioId)
            .execute('sp_XoaKhungGio');
        testKhungGioId = null;
    });
});
