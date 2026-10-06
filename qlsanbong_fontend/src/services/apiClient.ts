/**
 * =====================================================================
 * API CLIENT TRUNG TÂM CHO FRONTEND (NEXT.JS)
 * Tự động cấu hình baseURL, Header Token xác thực và xử lý lỗi
 * =====================================================================
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface RequestOptions extends RequestInit {
    params?: Record<string, any>;
}

export class ApiError extends Error {
    status: number;
    data: any;

    constructor(message: string, status: number, data?: any) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }
}

/**
 * Hàm lấy Authorization token từ LocalStorage
 */
const getAuthToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token') || localStorage.getItem('auth_token') || null;
};

/**
 * Hàm gọi API chung (Wrapper quanh fetch)
 */
export const apiClient = async <T = any>(
    endpoint: string,
    options: RequestOptions = {}
): Promise<T> => {
    const { params, headers: customHeaders, ...customOptions } = options;

    // Xử lý Query Parameters
    let url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    if (params) {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                queryParams.append(key, String(value));
            }
        });
        const queryString = queryParams.toString();
        if (queryString) {
            url += `${url.includes('?') ? '&' : '?'}${queryString}`;
        }
    }

    // Thiết lập headers
    const headers = new Headers(customHeaders || {});
    if (!headers.has('Content-Type') && !(customOptions.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }

    const token = getAuthToken();
    if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    try {
        const response = await fetch(url, {
            ...customOptions,
            headers,
        });

        // Xử lý status code lỗi
        if (!response.ok) {
            let errorData: any = {};
            try {
                errorData = await response.json();
            } catch (e) {
                errorData = { message: response.statusText };
            }

            const errorMessage = errorData.message || `Yêu cầu thất bại với mã lỗi HTTP ${response.status}`;
            throw new ApiError(errorMessage, response.status, errorData);
        }

        // Parse JSON trả về
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return (await response.json()) as T;
        }

        return (await response.text()) as unknown as T;
    } catch (error: any) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(error.message || 'Lỗi mạng hoặc không thể kết nối tới máy chủ', 500);
    }
};

// Các phương thức tiện ích
export const api = {
    get: <T = any>(url: string, params?: Record<string, any>, options?: RequestOptions) =>
        apiClient<T>(url, { method: 'GET', params, ...options }),

    post: <T = any>(url: string, body?: any, options?: RequestOptions) =>
        apiClient<T>(url, {
            method: 'POST',
            body: body instanceof FormData ? body : JSON.stringify(body),
            ...options,
        }),

    put: <T = any>(url: string, body?: any, options?: RequestOptions) =>
        apiClient<T>(url, {
            method: 'PUT',
            body: body instanceof FormData ? body : JSON.stringify(body),
            ...options,
        }),

    delete: <T = any>(url: string, params?: Record<string, any>, options?: RequestOptions) =>
        apiClient<T>(url, { method: 'DELETE', params, ...options }),
};

export default api;
