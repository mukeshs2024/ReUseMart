import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

const AUTH_PATHS = ['/login', '/register', '/admin-secret-login'];

const isAuthRequest = (url?: string) => {
    if (!url) return false;
    return url.includes('/auth/login') || url.includes('/auth/register');
};

const isAuthPage = (pathname?: string) => {
    if (!pathname) return false;
    return AUTH_PATHS.includes(pathname);
};

// Request interceptor — attach JWT token
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('reusemart_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Response interceptor — handle 401 globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('reusemart_token');
                localStorage.removeItem('reusemart_auth');

                const currentPath = window.location.pathname;
                const requestUrl = error.config?.url as string | undefined;

                // Let login/register pages handle their own auth errors.
                if (!isAuthRequest(requestUrl) && !isAuthPage(currentPath)) {
                    window.location.replace('/login');
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;
