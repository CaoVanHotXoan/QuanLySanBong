/**
 * =====================================================================
 * FRONTEND SERVICE: BÁO CÁO & THỐNG KÊ (BAO CAO SERVICE)
 * =====================================================================
 */

import api from './apiClient';

export const baoCaoService = {
    // 1. Thống kê doanh thu theo khoảng thời gian
    getDoanhThu: (tuNgay: string, denNgay: string) => {
        return api.get<{
            success: boolean;
            data: {
                tong_quan: {
                    tong_doanh_thu?: number;
                    doanh_thu_san?: number;
                    doanh_thu_dich_vu?: number;
                    tong_don_dat?: number;
                    tong_khach_hang?: number;
                    [key: string]: any;
                };
                chi_tiet_ngay: any[];
            };
        }>('/bao-cao/doanh-thu', { tu_ngay: tuNgay, den_ngay: denNgay });
    },

    // 2. Thống kê doanh thu phục vụ vẽ biểu đồ (Ngày, Tuần, Tháng)
    getDoanhThuBieuDo: (kieu: 'NGAY' | 'TUAN' | 'THANG' = 'NGAY', ngayMoc?: string) => {
        return api.get<{ success: boolean; data: any[] }>('/bao-cao/doanh-thu-bieu-do', {
            kieu,
            ngay_moc: ngayMoc,
        });
    },

    // 3. Top dịch vụ bán chạy
    getTopDichVu: (top: number = 5) => {
        return api.get<{ success: boolean; data: any[] }>('/bao-cao/top-dich-vu', { top });
    },

    // 4. Lấy đơn đặt sân mới nhất
    getDonMoiNhat: (limit: number = 5) => {
        return api.get<{ success: boolean; data: any[] }>('/bao-cao/don-moi-nhat', { limit });
    },

    // 5. Trạng thái sân trực quan theo thời gian thực
    getTrangThaiSanTrucQuan: (ngay?: string) => {
        return api.get<{ success: boolean; data: any[] }>('/bao-cao/trang-thai-san', { ngay });
    },
};

export default baoCaoService;
