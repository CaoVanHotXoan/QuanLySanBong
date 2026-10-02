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
  trang_thai: 'Chờ thanh toán' | 'Đã thanh toán' | 'Đã hủy' | string;
  trang_thai_vao_san?: string;
  da_vao_san?: boolean;
  gio_vao_san?: string;
  ngay_tao: string;
}

export const STORAGE_KEY = 'SYSTEM_ORDERS';
export const CUSTOM_STORAGE_EVENT = 'custom_storage_update';

export const INITIAL_ORDERS: DonDatSanSync[] = [];

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
        localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
        return [];
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];

      // Lọc bỏ toàn bộ dữ liệu mẫu giả lập trước đây
      const cleaned = parsed.filter((o: any) => {
        if (!o) return false;
        const ma = String(o.ma_don_dat || '');
        const name = String(o.ten_khach_hang || '');
        if (ma === 'HD-2026-001' || ma === 'HD-2026-002' || ma === 'HD-2026-999') return false;
        if (name === 'Nguyễn Văn Nam' || name === 'Trần Đình Trọng' || name === 'Vũ Đức Đam') return false;
        return true;
      });

      if (cleaned.length !== parsed.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
      }
      return cleaned;
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
