/**
 * =====================================================================
 * SERVICE: IN-MEMORY CACHE HIỆU NĂNG CAO CHO CÁC API ĐỌC (READ-HEAVY)
 * - Tự động hết hạn sau TTL (Time-To-Live)
 * - Tự động xóa cache khi có hành động Thêm / Sửa / Xóa dữ liệu tương ứng
 * =====================================================================
 */

interface CacheEntry<T> {
    data: T;
    expiry: number;
}

class MemoryCache {
    private store: Map<string, CacheEntry<any>> = new Map();

    /**
     * Lấy dữ liệu từ Cache theo Key
     */
    get<T>(key: string): T | null {
        const entry = this.store.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expiry) {
            this.store.delete(key);
            return null;
        }
        return entry.data as T;
    }

    /**
     * Lưu dữ liệu vào Cache với thời gian sống (mặc định 5 phút = 300 giây)
     */
    set<T>(key: string, data: T, ttlSeconds: number = 300): void {
        this.store.set(key, {
            data,
            expiry: Date.now() + ttlSeconds * 1000
        });
    }

    /**
     * Xóa một key cụ thể
     */
    del(key: string): void {
        this.store.delete(key);
    }

    /**
     * Xóa toàn bộ key có tiền tố (prefix) bắt đầu bằng tiền tố truyền vào
     * Ví dụ: delPrefix('tin_tuc') sẽ xóa tất cả cache liên quan đến tin tức
     */
    delPrefix(prefix: string): void {
        for (const key of this.store.keys()) {
            if (key.startsWith(prefix)) {
                this.store.delete(key);
            }
        }
    }

    /**
     * Xóa sạch toàn bộ cache
     */
    clear(): void {
        this.store.clear();
    }
}

export const memoryCache = new MemoryCache();
export default memoryCache;
