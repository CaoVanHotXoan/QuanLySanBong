"use strict";
/**
 * =====================================================================
 * SERVICE: IN-MEMORY CACHE HIỆU NĂNG CAO CHO CÁC API ĐỌC (READ-HEAVY)
 * - Tự động hết hạn sau TTL (Time-To-Live)
 * - Tự động xóa cache khi có hành động Thêm / Sửa / Xóa dữ liệu tương ứng
 * =====================================================================
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.memoryCache = void 0;
class MemoryCache {
    store = new Map();
    /**
     * Lấy dữ liệu từ Cache theo Key
     */
    get(key) {
        const entry = this.store.get(key);
        if (!entry)
            return null;
        if (Date.now() > entry.expiry) {
            this.store.delete(key);
            return null;
        }
        return entry.data;
    }
    /**
     * Lưu dữ liệu vào Cache với thời gian sống (mặc định 5 phút = 300 giây)
     */
    set(key, data, ttlSeconds = 300) {
        this.store.set(key, {
            data,
            expiry: Date.now() + ttlSeconds * 1000
        });
    }
    /**
     * Xóa một key cụ thể
     */
    del(key) {
        this.store.delete(key);
    }
    /**
     * Xóa toàn bộ key có tiền tố (prefix) bắt đầu bằng tiền tố truyền vào
     * Ví dụ: delPrefix('tin_tuc') sẽ xóa tất cả cache liên quan đến tin tức
     */
    delPrefix(prefix) {
        for (const key of this.store.keys()) {
            if (key.startsWith(prefix)) {
                this.store.delete(key);
            }
        }
    }
    /**
     * Xóa sạch toàn bộ cache
     */
    clear() {
        this.store.clear();
    }
}
exports.memoryCache = new MemoryCache();
exports.default = exports.memoryCache;
