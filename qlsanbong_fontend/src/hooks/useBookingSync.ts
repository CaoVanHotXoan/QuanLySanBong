import { useState, useEffect, useCallback } from 'react';

export interface ServiceItemOrder {
  id: number;
  ten_dich_vu: string;
  so_luong: number;
  don_gia: number;
  thanh_tien: number;
}

export interface DonDatSanSync {
  id: number | string;
  ma_don_dat: string; // VD: 'HD-2026-001'
  ten_khach_hang: string;
  so_dien_thoai: string;
  ten_san: string;
  ma_san?: number;
  gio_bat_dau: string; // VD: '17:00'
  gio_ket_thuc: string; // VD: '18:30'
  ngay_da: string; // VD: '2026-10-02'
  tien_san: number;
  dich_vu: ServiceItemOrder[];
  tong_tien: number;
  trang_thai: 'Chờ thanh toán' | 'Đã thanh toán' | 'Đã hủy';
  ngay_tao: string;
}

export const STORAGE_KEY = 'SYSTEM_ORDERS';
export const CUSTOM_STORAGE_EVENT = 'custom_storage_update';

export const INITIAL_ORDERS: DonDatSanSync[] = [
  {
    id: 101,
    ma_don_dat: 'HD-2026-001',
    ten_khach_hang: 'Nguyễn Văn Nam',
    so_dien_thoai: '0901234567',
    ten_san: 'Sân 1 (5 người)',
    ma_san: 1,
    gio_bat_dau: '17:00',
    gio_ket_thuc: '18:30',
    ngay_da: '2026-10-02',
    tien_san: 270000,
    dich_vu: [
      { id: 1, ten_dich_vu: 'Nước Khoáng Aquafina 500ml', so_luong: 4, don_gia: 10000, thanh_tien: 40000 },
      { id: 2, ten_dich_vu: 'Nước Tăng Lực Revive Chanh Muối', so_luong: 2, don_gia: 15000, thanh_tien: 30000 },
    ],
    tong_tien: 340000,
    trang_thai: 'Chờ thanh toán',
    ngay_tao: '2026-10-02T16:45:00',
  },
  {
    id: 102,
    ma_don_dat: 'HD-2026-002',
    ten_khach_hang: 'Trần Đình Trọng',
    so_dien_thoai: '0987654321',
    ten_san: 'Sân 4 (7 người)',
    ma_san: 4,
    gio_bat_dau: '18:30',
    gio_ket_thuc: '20:00',
    ngay_da: '2026-10-02',
    tien_san: 450000,
    dich_vu: [
      { id: 6, ten_dich_vu: 'Thuê Bộ Áo Bib Phân Đội (10 áo)', so_luong: 1, don_gia: 30000, thanh_tien: 30000 },
      { id: 3, ten_dich_vu: 'Nước Tăng Lực Red Bull', so_luong: 6, don_gia: 20000, thanh_tien: 120000 },
    ],
    tong_tien: 600000,
    trang_thai: 'Chờ thanh toán',
    ngay_tao: '2026-10-02T18:00:00',
  },
  {
    id: 201,
    ma_don_dat: 'HD-2026-999',
    ten_khach_hang: 'Vũ Đức Đam',
    so_dien_thoai: '0977889900',
    ten_san: 'Sân 1 (5 người)',
    ma_san: 1,
    gio_bat_dau: '07:00',
    gio_ket_thuc: '08:30',
    ngay_da: '2026-10-02',
    tien_san: 270000,
    dich_vu: [
      { id: 1, ten_dich_vu: 'Nước Khoáng Aquafina 500ml', so_luong: 6, don_gia: 10000, thanh_tien: 60000 },
    ],
    tong_tien: 330000,
    trang_thai: 'Đã thanh toán',
    ngay_tao: '2026-10-02T06:50:00',
  },
];

/**
 * Custom Hook useBookingSync
 * Quản lý đồng bộ danh sách đơn đặt sân qua localStorage và CustomEvent (Same Tab & Cross Tab)
 */
export function useBookingSync() {
  const [orders, setOrders] = useState<DonDatSanSync[]>([]);

  // 1. Hàm getOrders: Đọc dữ liệu từ localStorage
  const getOrders = useCallback((): DonDatSanSync[] => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        // Khởi tạo mặc định nếu chưa có
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ORDERS));
        return INITIAL_ORDERS;
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error('Lỗi khi đọc SYSTEM_ORDERS từ localStorage:', err);
      return [];
    }
  }, []);

  // Hàm phát thông báo CustomEvent để các component cùng Tab nhận được cập nhật
  const notifySameTab = useCallback((updatedOrders: DonDatSanSync[]) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(CUSTOM_STORAGE_EVENT, {
          detail: { orders: updatedOrders },
        })
      );
    }
  }, []);

  // 2. Hàm addOrder: Thêm đơn mới vào state, lưu xuống localStorage và dispatch CustomEvent
  const addOrder = useCallback(
    (newOrder: DonDatSanSync) => {
      if (typeof window === 'undefined') return;
      const currentList = getOrders();
      const updatedList = [newOrder, ...currentList.filter((o) => o.id !== newOrder.id)];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
        setOrders(updatedList);
        notifySameTab(updatedList);
      } catch (err) {
        console.error('Lỗi khi lưu đơn mới vào localStorage:', err);
      }
    },
    [getOrders, notifySameTab]
  );

  // 3. Hàm updateOrderStatus: Cập nhật trạng thái đơn (Chờ thanh toán, Đã thanh toán, Đã hủy)
  const updateOrderStatus = useCallback(
    (id: number | string, newStatus: 'Chờ thanh toán' | 'Đã thanh toán' | 'Đã hủy', extraUpdates?: Partial<DonDatSanSync>) => {
      if (typeof window === 'undefined') return;
      const currentList = getOrders();
      const updatedList = currentList.map((order) => {
        if (order.id === id || order.ma_don_dat === String(id)) {
          return {
            ...order,
            ...extraUpdates,
            trang_thai: newStatus,
          };
        }
        return order;
      });

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
        setOrders(updatedList);
        notifySameTab(updatedList);
      } catch (err) {
        console.error('Lỗi khi cập nhật trạng thái đơn trong localStorage:', err);
      }
    },
    [getOrders, notifySameTab]
  );

  // 4. Lắng nghe cả 2 sự kiện: storage (khác Tab) và custom_storage_update (cùng Tab)
  useEffect(() => {
    // Nạp dữ liệu ban đầu
    const initialList = getOrders();
    setOrders(initialList);

    // Lắng nghe thay đổi từ Tab khác qua Window Storage Event
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setOrders(parsed);
          }
        } catch (err) {
          console.error('Lỗi parse storage event:', err);
        }
      }
    };

    // Lắng nghe thay đổi trong cùng 1 Tab qua CustomEvent
    const handleCustomUpdate = (e: Event) => {
      const customEvt = e as CustomEvent<{ orders: DonDatSanSync[] }>;
      if (customEvt.detail?.orders) {
        setOrders(customEvt.detail.orders);
      } else {
        setOrders(getOrders());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(CUSTOM_STORAGE_EVENT, handleCustomUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(CUSTOM_STORAGE_EVENT, handleCustomUpdate);
    };
  }, [getOrders]);

  // Trả về danh sách đơn và các hàm quản lý
  return {
    orders,
    setOrders,
    getOrders,
    addOrder,
    updateOrderStatus,
    invoices: orders.filter((o) => o.trang_thai === 'Chờ thanh toán'),
    history: orders.filter((o) => o.trang_thai === 'Đã thanh toán'),
  };
}

export default useBookingSync;
