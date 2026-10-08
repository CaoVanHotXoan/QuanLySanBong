/**
 * =====================================================================
 * CONTROLLER: NỘI DUNG TRANG WEB & QUẢN TRỊ (CMS CONTROLLER)
 * 100% SỬ DỤNG STORED PROCEDURES (SQL SERVER):
 * - Banner: sp_LayDanhSachBanner, sp_LayDanhSachBannerAdmin, sp_ThemBanner, sp_SuaBanner, sp_XoaBanner
 * - Tin Tức: sp_LayDanhSachLoaiTinTuc, sp_LayDanhSachLoaiTinTucAdmin, sp_ThemLoaiTinTuc, sp_SuaLoaiTinTuc, sp_XoaLoaiTinTuc
 * - Bài Viết: sp_LayDanhSachTinTuc, sp_LayDanhSachTinTucAdmin, sp_LayChiTietTinTuc, sp_ThemTinTuc, sp_SuaTinTuc, sp_XoaTinTuc
 * - About Us: sp_LayThongTinAboutUs, sp_CapNhatAboutUs
 * - Liên Hệ: sp_GuiLienHe, sp_LayDanhSachLienHe, sp_CapNhatTrangThaiLienHe, sp_XoaLienHe
 * =====================================================================
 */

import { Request, Response } from 'express';
import { sql, poolPromise } from '../config/db';
import { AuthRequest } from '../types';
import { ensureCloudinaryUrl, deleteFromCloudinary } from '../services/uploadService';
import { sendContactEmailToAdmin, sendContactReplyEmail } from '../services/emailService';
import memoryCache from '../services/cacheService';

// =====================================================================
// 1. NHÓM LOẠI TIN TỨC (DANH MỤC)
// =====================================================================

export const layDanhSachLoaiTinTuc = async (req: Request, res: Response) => {
    try {
        const cached = memoryCache.get('loai_tin_client');
        if (cached) {
            return res.status(200).json({ success: true, data: cached });
        }
        const pool = await poolPromise;
        const result = await pool.request().execute('sp_LayDanhSachLoaiTinTuc');
        const data = result.recordset || [];
        memoryCache.set('loai_tin_client', data, 300);
        return res.status(200).json({ success: true, data });
    } catch (error: any) {
        console.error('Lỗi sp_LayDanhSachLoaiTinTuc:', error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const layDanhSachLoaiTinTucAdmin = async (req: Request, res: Response) => {
    try {
        const cached = memoryCache.get('loai_tin_admin');
        if (cached) {
            return res.status(200).json({ success: true, data: cached });
        }
        const pool = await poolPromise;
        const result = await pool.request().execute('sp_LayDanhSachLoaiTinTucAdmin');
        const data = result.recordset || [];
        memoryCache.set('loai_tin_admin', data, 300);
        return res.status(200).json({ success: true, data });
    } catch (error: any) {
        console.error('Lỗi sp_LayDanhSachLoaiTinTucAdmin:', error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const themLoaiTinTuc = async (req: AuthRequest, res: Response) => {
    try {
        const { ten_loai, trang_thai } = req.body;
        if (!ten_loai) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập tên loại tin tức!' });
        }
        const isStatusActive = (trang_thai as any) == 1 || (trang_thai as any) === true || trang_thai === undefined;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('ten_loai', sql.NVarChar(100), ten_loai)
            .input('trang_thai', sql.Bit, isStatusActive ? 1 : 0)
            .execute('sp_ThemLoaiTinTuc');

        memoryCache.delPrefix('loai_tin_');
        return res.status(201).json({ success: true, message: 'Thêm loại tin tức thành công!', data: result.recordset ? result.recordset[0] : null });
    } catch (error: any) {
        console.error('Lỗi sp_ThemLoaiTinTuc:', error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const suaLoaiTinTuc = async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(String(req.params.id), 10);
        const { ten_loai, trang_thai } = req.body;
        if (isNaN(id) || !ten_loai) {
            return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ!' });
        }
        const isStatusActive = (trang_thai as any) == 1 || (trang_thai as any) === true;
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, id)
            .input('ten_loai', sql.NVarChar(100), ten_loai)
            .input('trang_thai', sql.Bit, isStatusActive ? 1 : 0)
            .execute('sp_SuaLoaiTinTuc');

        memoryCache.delPrefix('loai_tin_');
        return res.status(200).json({ success: true, message: 'Cập nhật loại tin tức thành công!' });
    } catch (error: any) {
        console.error('Lỗi sp_SuaLoaiTinTuc:', error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const xoaLoaiTinTuc = async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(String(req.params.id), 10);
        if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID không hợp lệ!' });

        const pool = await poolPromise;
        await pool.request().input('id', sql.Int, id).execute('sp_XoaLoaiTinTuc');
        memoryCache.delPrefix('loai_tin_');
        return res.status(200).json({ success: true, message: 'Xóa loại tin tức thành công!' });
    } catch (error: any) {
        console.error('Lỗi sp_XoaLoaiTinTuc:', error.message);
        return res.status(400).json({ success: false, message: error.message });
    }
};

// =====================================================================
// 2. NHÓM TIN TỨC (BÀI VIẾT)
// =====================================================================

export const layDanhSachTinTuc = async (req: Request, res: Response) => {
    try {
        const ma_loai_tin = req.query.ma_loai_tin ? parseInt(req.query.ma_loai_tin as string, 10) : null;
        const tu_khoa = (req.query.tu_khoa as string) || null;
        const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

        const cacheKey = `tin_tuc_client_${ma_loai_tin || 'all'}_${tu_khoa || ''}_${limit}`;
        const cached = memoryCache.get(cacheKey);
        if (cached) {
            return res.status(200).json({ success: true, data: cached });
        }

        const pool = await poolPromise;
        const request = pool.request();
        request.input('ma_loai_tin', sql.Int, ma_loai_tin);
        request.input('tu_khoa', sql.NVarChar(100), tu_khoa);
        request.input('limit', sql.Int, limit);

        const result = await request.execute('sp_LayDanhSachTinTuc');
        const data = result.recordset || [];
        memoryCache.set(cacheKey, data, 180); // Cache 3 phút
        return res.status(200).json({ success: true, data });
    } catch (error: any) {
        console.error('Lỗi sp_LayDanhSachTinTuc:', error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const layDanhSachTinTucAdmin = async (req: Request, res: Response) => {
    try {
        const cached = memoryCache.get('tin_tuc_admin');
        if (cached) {
            return res.status(200).json({ success: true, data: cached });
        }
        const pool = await poolPromise;
        const result = await pool.request().execute('sp_LayDanhSachTinTucAdmin');
        const data = result.recordset || [];
        memoryCache.set('tin_tuc_admin', data, 180);
        return res.status(200).json({ success: true, data });
    } catch (error: any) {
        console.error('Lỗi sp_LayDanhSachTinTucAdmin:', error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const layChiTietTinTuc = async (req: Request, res: Response) => {
    try {
        const id = parseInt(String(req.params.id), 10);
        if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID không hợp lệ!' });

        const pool = await poolPromise;
        const result = await pool.request().input('id', sql.Int, id).execute('sp_LayChiTietTinTuc');

        if (!result.recordset || result.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết tin tức!' });
        }
        return res.status(200).json({ success: true, data: result.recordset[0] });
    } catch (error: any) {
        console.error('Lỗi sp_LayChiTietTinTuc:', error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const themTinTuc = async (req: AuthRequest, res: Response) => {
    try {
        let { ma_loai_tin, tieu_de, tom_tat, noi_dung, hinh_anh, trang_thai } = req.body;
        if (!ma_loai_tin || !tieu_de || !noi_dung) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ Loại tin, Tiêu đề và Nội dung!' });
        }

        // 1. Tự động lưu trữ ảnh lên Cloudinary nếu là link ngoài
        if (hinh_anh) {
            hinh_anh = await ensureCloudinaryUrl(hinh_anh, 'IMAGE');
        }

        const isStatusActive = (trang_thai as any) == 1 || (trang_thai as any) === true || trang_thai === undefined;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('ma_loai_tin', sql.Int, ma_loai_tin)
            .input('tieu_de', sql.NVarChar(255), tieu_de)
            .input('tom_tat', sql.NVarChar(500), tom_tat || null)
            .input('noi_dung', sql.NVarChar(sql.MAX), noi_dung)
            .input('hinh_anh', sql.VarChar(255), hinh_anh || null)
            .input('trang_thai', sql.Bit, isStatusActive ? 1 : 0)
            .execute('sp_ThemTinTuc');

        memoryCache.delPrefix('tin_tuc_');
        return res.status(201).json({ success: true, message: 'Thêm bài viết tin tức thành công!', data: result.recordset ? result.recordset[0] : null });
    } catch (error: any) {
        console.error('Lỗi sp_ThemTinTuc:', error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const suaTinTuc = async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(String(req.params.id), 10);
        let { ma_loai_tin, tieu_de, tom_tat, noi_dung, hinh_anh, trang_thai } = req.body;

        if (isNaN(id) || !ma_loai_tin || !tieu_de || !noi_dung) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ thông tin bài viết!' });
        }

        const pool = await poolPromise;

        // 1. Lấy thông tin bài viết cũ qua Stored Procedure
        const oldResult = await pool.request().input('id', sql.Int, id).execute('sp_LayChiTietTinTucAdmin');
        const oldNews = oldResult.recordset && oldResult.recordset.length > 0 ? oldResult.recordset[0] : null;

        // 2. Tự động lưu trữ ảnh lên Cloudinary nếu là link ngoài
        if (hinh_anh) {
            hinh_anh = await ensureCloudinaryUrl(hinh_anh, 'IMAGE');
        }

        // 3. Nếu ảnh cũ trên Cloudinary khác với ảnh mới, xóa ảnh cũ trên Cloudinary
        if (oldNews && oldNews.hinh_anh && oldNews.hinh_anh !== hinh_anh) {
            await deleteFromCloudinary(oldNews.hinh_anh, 'image');
        }

        // 4. Cập nhật bài viết qua Stored Procedure
        const isStatusActive = (trang_thai as any) == 1 || (trang_thai as any) === true;
        await pool.request()
            .input('id', sql.Int, id)
            .input('ma_loai_tin', sql.Int, ma_loai_tin)
            .input('tieu_de', sql.NVarChar(255), tieu_de)
            .input('tom_tat', sql.NVarChar(500), tom_tat || null)
            .input('noi_dung', sql.NVarChar(sql.MAX), noi_dung)
            .input('hinh_anh', sql.VarChar(255), hinh_anh || null)
            .input('trang_thai', sql.Bit, isStatusActive ? 1 : 0)
            .execute('sp_SuaTinTuc');

        memoryCache.delPrefix('tin_tuc_');
        return res.status(200).json({ success: true, message: 'Cập nhật tin tức thành công!' });
    } catch (error: any) {
        console.error('Lỗi sp_SuaTinTuc:', error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const xoaTinTuc = async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(String(req.params.id), 10);
        if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID không hợp lệ!' });

        const pool = await poolPromise;

        // 1. Lấy thông tin bài viết để lấy link ảnh cũ
        const oldResult = await pool.request().input('id', sql.Int, id).execute('sp_LayChiTietTinTucAdmin');
        const oldNews = oldResult.recordset && oldResult.recordset.length > 0 ? oldResult.recordset[0] : null;

        // 2. Xóa ảnh bài viết trên Cloudinary nếu có
        if (oldNews && oldNews.hinh_anh) {
            await deleteFromCloudinary(oldNews.hinh_anh, 'image');
        }

        // 3. Xóa bài viết trong CSDL qua Stored Procedure
        await pool.request().input('id', sql.Int, id).execute('sp_XoaTinTuc');
        memoryCache.delPrefix('tin_tuc_');
        return res.status(200).json({ success: true, message: 'Xóa bài viết tin tức thành công!' });
    } catch (error: any) {
        console.error('Lỗi sp_XoaTinTuc:', error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// =====================================================================
// 3. NHÓM ABOUT US
// =====================================================================

export const layThongTinAboutUs = async (req: Request, res: Response) => {
    try {
        const cached = memoryCache.get('about_us');
        if (cached) {
            return res.status(200).json({ success: true, data: cached });
        }
        const pool = await poolPromise;
        const result = await pool.request().execute('sp_LayThongTinAboutUs');
        const aboutData = result.recordset && result.recordset.length > 0 ? result.recordset[0] : null;
        if (aboutData) {
            memoryCache.set('about_us', aboutData, 600); // Cache 10 phút
        }
        return res.status(200).json({ success: true, data: aboutData });
    } catch (error: any) {
        console.error('Lỗi sp_LayThongTinAboutUs:', error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const capNhatAboutUs = async (req: AuthRequest, res: Response) => {
    try {
        let { ten_trung_tam, hotline, email, dia_chi, link_map, gioi_thieu_ngan, bai_viet_about_us, link_facebook, link_zalo } = req.body;

        // Tự động bóc tách link src chuẩn nếu người dùng dán cả thẻ <iframe src="..."></iframe>
        if (link_map && typeof link_map === 'string') {
            const trimmed = link_map.trim();
            const iframeMatch = trimmed.match(/src=["']([^"']+)["']/i);
            if (iframeMatch && iframeMatch[1]) {
                link_map = iframeMatch[1];
            } else {
                link_map = trimmed;
            }
        }

        const pool = await poolPromise;
        await pool.request()
            .input('ten_trung_tam', sql.NVarChar(150), ten_trung_tam || 'Trung Tâm Thể Thao Soccer247')
            .input('hotline', sql.VarChar(20), hotline || '0816344504')
            .input('email', sql.VarChar(255), email || null)
            .input('dia_chi', sql.NVarChar(255), dia_chi || 'Biên Hòa - Đồng Nai')
            .input('link_map', sql.VarChar(500), link_map || null)
            .input('gioi_thieu_ngan', sql.NVarChar(sql.MAX), gioi_thieu_ngan || null)
            .input('bai_viet_about_us', sql.NVarChar(sql.MAX), bai_viet_about_us || null)
            .input('link_facebook', sql.VarChar(255), link_facebook || null)
            .input('link_zalo', sql.VarChar(255), link_zalo || null)
            .execute('sp_CapNhatAboutUs');

        memoryCache.del('about_us');
        return res.status(200).json({ success: true, message: 'Cập nhật thông tin About Us thành công!', data: { link_map } });
    } catch (error: any) {
        console.error('Lỗi sp_CapNhatAboutUs:', error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// =====================================================================
// 4. NHÓM LIÊN HỆ
// =====================================================================

export const guiLienHe = async (req: Request, res: Response) => {
    try {
        const { ho_ten, email, so_dien_thoai, tieu_de, noi_dung } = req.body;
        let cleanPhone = so_dien_thoai ? String(so_dien_thoai).replace(/\D/g, '') : '';
        if (cleanPhone.length !== 10 || !cleanPhone.startsWith('0')) {
            return res.status(400).json({ success: false, message: 'Số điện thoại không hợp lệ! Vui lòng nhập đúng 10 chữ số (Bắt đầu bằng số 0).' });
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('ho_ten', sql.NVarChar(100), ho_ten)
            .input('email', sql.VarChar(255), email || null)
            .input('so_dien_thoai', sql.VarChar(20), cleanPhone)
            .input('tieu_de', sql.NVarChar(150), tieu_de || null)
            .input('noi_dung', sql.NVarChar(sql.MAX), noi_dung)
            .execute('sp_GuiLienHe');

        // Gửi email thông báo về Gmail của Admin trong background (không chặn kết quả trả về)
        sendContactEmailToAdmin({
            ho_ten,
            email,
            so_dien_thoai,
            tieu_de,
            noi_dung
        }).catch((err) => {
            console.error('Lỗi khi gửi email thông báo liên hệ:', err);
        });

        return res.status(201).json({ 
            success: true, 
            message: 'Cảm ơn bạn đã liên hệ! Thông tin đã được lưu vào hệ thống và gửi thông báo trực tiếp đến ban quản lý Soccer247.',
            data: result.recordset ? result.recordset[0] : null
        });
    } catch (error: any) {
        console.error('Lỗi sp_GuiLienHe:', error.message);
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const layDanhSachLienHe = async (req: AuthRequest, res: Response) => {
    try {
        const trang_thai_xu_ly = (req.query.trang_thai_xu_ly as string) || null;
        const pool = await poolPromise;
        const request = pool.request();
        request.input('trang_thai_xu_ly', sql.NVarChar(30), trang_thai_xu_ly);

        const result = await request.execute('sp_LayDanhSachLienHe');
        const list = (result.recordset || []).map((row: any) => ({
            ...row,
            trang_thai: row.trang_thai_xu_ly || row.trang_thai || 'CHUA_XU_LY',
            trang_thai_xu_ly: row.trang_thai_xu_ly || row.trang_thai || 'CHUA_XU_LY'
        }));
        return res.status(200).json({ success: true, data: list });
    } catch (error: any) {
        console.error('Lỗi sp_LayDanhSachLienHe:', error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const capNhatTrangThaiLienHe = async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(String(req.params.id), 10);
        const { trang_thai_xu_ly } = req.body;

        if (isNaN(id) || !trang_thai_xu_ly) {
            return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ!' });
        }

        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, id)
            .input('trang_thai_xu_ly', sql.NVarChar(30), trang_thai_xu_ly)
            .execute('sp_CapNhatTrangThaiLienHe');

        return res.status(200).json({ success: true, message: 'Cập nhật trạng thái liên hệ thành công!' });
    } catch (error: any) {
        console.error('Lỗi sp_CapNhatTrangThaiLienHe:', error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const traLoiLienHe = async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(String(req.params.id), 10);
        const { tieu_de_tra_loi, noi_dung_tra_loi } = req.body;

        if (isNaN(id) || !noi_dung_tra_loi || !noi_dung_tra_loi.trim()) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập nội dung phản hồi!' });
        }

        const pool = await poolPromise;

        // 1. Lấy thông tin liên hệ hiện tại qua Stored Procedure sp_LayChiTietLienHe
        const detailResult = await pool.request().input('id', sql.Int, id).execute('sp_LayChiTietLienHe');
        const contact = detailResult.recordset && detailResult.recordset.length > 0 ? detailResult.recordset[0] : null;

        if (!contact) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin liên hệ này!' });
        }

        // 2. Cập nhật nội dung trả lời vào CSDL qua Stored Procedure sp_TraLoiLienHe
        await pool.request()
            .input('id', sql.Int, id)
            .input('noi_dung_tra_loi', sql.NVarChar(sql.MAX), noi_dung_tra_loi.trim())
            .execute('sp_TraLoiLienHe');

        // 3. Tiến hành gửi email cho khách hàng (nếu lỗi/không gửi được thì tự động fallback về Gmail Admin)
        const emailResult = await sendContactReplyEmail({
            toEmail: contact.email,
            customerName: contact.ho_ten,
            customerPhone: contact.so_dien_thoai,
            originalSubject: contact.tieu_de,
            originalMessage: contact.noi_dung,
            replySubject: tieu_de_tra_loi || `⚽ [Soccer247] Phản hồi yêu cầu: ${contact.tieu_de || 'Đặt sân thể thao'}`,
            replyMessage: noi_dung_tra_loi.trim(),
        });

        return res.status(200).json({
            success: true,
            message: emailResult.message || 'Đã lưu phản hồi liên hệ thành công!',
            data: {
                sentToCustomer: emailResult.sentToCustomer,
                sentToAdminFallback: emailResult.sentToAdminFallback
            }
        });
    } catch (error: any) {
        console.error('Lỗi traLoiLienHe:', error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const xoaLienHe = async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(String(req.params.id), 10);
        if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID không hợp lệ!' });

        const pool = await poolPromise;
        await pool.request().input('id', sql.Int, id).execute('sp_XoaLienHe');
        return res.status(200).json({ success: true, message: 'Xóa liên hệ thành công!' });
    } catch (error: any) {
        console.error('Lỗi sp_XoaLienHe:', error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// =====================================================================
// 5. NHÓM BANNER
// =====================================================================

export const layDanhSachBanner = async (req: Request, res: Response) => {
    try {
        const cached = memoryCache.get('banner_client');
        if (cached) {
            return res.status(200).json({ success: true, data: cached });
        }
        const pool = await poolPromise;
        const result = await pool.request().execute('sp_LayDanhSachBanner');
        const data = result.recordset || [];
        memoryCache.set('banner_client', data, 300);
        return res.status(200).json({ success: true, data });
    } catch (error: any) {
        console.error('Lỗi sp_LayDanhSachBanner:', error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const layDanhSachBannerAdmin = async (req: Request, res: Response) => {
    try {
        const cached = memoryCache.get('banner_admin');
        if (cached) {
            return res.status(200).json({ success: true, data: cached });
        }
        const pool = await poolPromise;
        const result = await pool.request().execute('sp_LayDanhSachBannerAdmin');
        const data = result.recordset || [];
        memoryCache.set('banner_admin', data, 300);
        return res.status(200).json({ success: true, data });
    } catch (error: any) {
        console.error('Lỗi sp_LayDanhSachBannerAdmin:', error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const themBanner = async (req: AuthRequest, res: Response) => {
    try {
        let { tieu_de, loai_banner, hinh_anh, video_url, lien_ket, link_dieu_huong, thu_tu, trang_thai } = req.body;
        const finalLienKet = lien_ket || link_dieu_huong || null;
        const normalizedType = loai_banner === 'VIDEO' ? 'VIDEO' : 'IMAGE';

        // 1. Tự động chuyển đổi và lưu file ảnh/video lên Cloudinary nếu là link ngoài
        if (normalizedType === 'IMAGE' && hinh_anh) {
            hinh_anh = await ensureCloudinaryUrl(hinh_anh, 'IMAGE');
        } else if (normalizedType === 'VIDEO' && video_url) {
            video_url = await ensureCloudinaryUrl(video_url, 'VIDEO');
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('tieu_de', sql.NVarChar(150), tieu_de || null)
            .input('loai_banner', sql.VarChar(10), normalizedType)
            .input('hinh_anh', sql.VarChar(sql.MAX), hinh_anh || null)
            .input('video_url', sql.VarChar(sql.MAX), video_url || null)
            .input('lien_ket', sql.VarChar(500), finalLienKet)
            .input('thu_tu', sql.Int, thu_tu ? parseInt(thu_tu, 10) : 1)
            .input('trang_thai', sql.Bit, trang_thai === undefined || trang_thai === true || (trang_thai as any) == 1 ? 1 : 0)
            .execute('sp_ThemBanner');

        memoryCache.delPrefix('banner_');
        return res.status(201).json({ success: true, message: 'Thêm banner thành công!', data: result.recordset ? result.recordset[0] : null });
    } catch (error: any) {
        console.error('Lỗi sp_ThemBanner:', error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const suaBanner = async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(String(req.params.id), 10);
        let { tieu_de, loai_banner, hinh_anh, video_url, lien_ket, link_dieu_huong, thu_tu, trang_thai } = req.body;
        if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID không hợp lệ!' });

        const finalLienKet = lien_ket || link_dieu_huong || null;
        const normalizedType = loai_banner === 'VIDEO' ? 'VIDEO' : 'IMAGE';
        const pool = await poolPromise;

        // 1. Lấy thông tin banner hiện tại từ CSDL bằng Stored Procedure
        const oldBannerResult = await pool.request().input('id', sql.Int, id).execute('sp_LayChiTietBanner');
        const oldBanner = oldBannerResult.recordset && oldBannerResult.recordset.length > 0 ? oldBannerResult.recordset[0] : null;

        // 2. Tự động chuyển đổi và lưu file ảnh/video lên Cloudinary nếu là link ngoài
        if (normalizedType === 'IMAGE' && hinh_anh) {
            hinh_anh = await ensureCloudinaryUrl(hinh_anh, 'IMAGE');
        } else if (normalizedType === 'VIDEO' && video_url) {
            video_url = await ensureCloudinaryUrl(video_url, 'VIDEO');
        }

        // 3. Nếu file cũ trên Cloudinary khác với file mới (hoặc chuyển đổi loại banner), xóa file cũ trên Cloudinary
        if (oldBanner) {
            if (oldBanner.hinh_anh && oldBanner.hinh_anh !== hinh_anh) {
                await deleteFromCloudinary(oldBanner.hinh_anh, 'image');
            }
            if (oldBanner.video_url && oldBanner.video_url !== video_url) {
                await deleteFromCloudinary(oldBanner.video_url, 'video');
            }
        }

        // 4. Cập nhật thông tin vào CSDL qua Stored Procedure
        await pool.request()
            .input('id', sql.Int, id)
            .input('tieu_de', sql.NVarChar(150), tieu_de || null)
            .input('loai_banner', sql.VarChar(10), normalizedType)
            .input('hinh_anh', sql.VarChar(sql.MAX), hinh_anh || null)
            .input('video_url', sql.VarChar(sql.MAX), video_url || null)
            .input('lien_ket', sql.VarChar(500), finalLienKet)
            .input('thu_tu', sql.Int, thu_tu ? parseInt(thu_tu, 10) : 1)
            .input('trang_thai', sql.Bit, trang_thai === undefined || trang_thai === true || (trang_thai as any) == 1 ? 1 : 0)
            .execute('sp_SuaBanner');

        memoryCache.delPrefix('banner_');
        return res.status(200).json({ success: true, message: 'Cập nhật banner thành công!' });
    } catch (error: any) {
        console.error('Lỗi sp_SuaBanner:', error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const xoaBanner = async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(String(req.params.id), 10);
        if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID không hợp lệ!' });

        const pool = await poolPromise;

        // 1. Lấy thông tin banner trước khi xóa bằng Stored Procedure
        const bannerResult = await pool.request().input('id', sql.Int, id).execute('sp_LayChiTietBanner');
        const banner = bannerResult.recordset && bannerResult.recordset.length > 0 ? bannerResult.recordset[0] : null;

        // 2. Xóa ảnh và video tương ứng trên Cloudinary
        if (banner) {
            if (banner.hinh_anh) {
                await deleteFromCloudinary(banner.hinh_anh, 'image');
            }
            if (banner.video_url) {
                await deleteFromCloudinary(banner.video_url, 'video');
            }
        }

        // 3. Xóa bản ghi trong CSDL bằng Stored Procedure
        await pool.request().input('id', sql.Int, id).execute('sp_XoaBanner');
        memoryCache.delPrefix('banner_');
        return res.status(200).json({ success: true, message: 'Xóa banner thành công!' });
    } catch (error: any) {
        console.error('Lỗi sp_XoaBanner:', error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};
