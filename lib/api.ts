import axios from 'axios';
import { toast } from 'sonner';

// 1. 创建实例
const api = axios.create({
    baseURL: 'http://localhost:8000/api', // Laravel 的地址
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: true, // 允许跨域携带 Cookie (如果你将来用 Sanctum Cookie 模式)
});

// 2. 请求拦截器：每次请求都从 localStorage 拿 Token 带上
api.interceptors.request.use((config) => {
    // 注意：我们把 token 存在 localStorage 里，key 叫 'poker_token'
    const token = typeof window !== 'undefined' ? localStorage.getItem('poker_token') : null;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// 3. 响应拦截器：统一处理错误
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // 如果是 401 (未授权)，说明 Token 过期或无效
        if (error.response?.status === 401) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('poker_token'); // 清除失效 Token
                // 这里的跳转建议在组件层处理，或者用 window.location
                // window.location.href = '/';
            }
        }
        // 把错误抛出去，让组件自己决定是否弹窗
        return Promise.reject(error);
    }
);

export default api;