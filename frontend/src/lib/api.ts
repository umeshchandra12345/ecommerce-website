import { Api } from "./client";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:8000'
    : '/api');

const api = new Api({
    baseURL: API_BASE_URL,
    securityWorker: (token) => {
        if (token) {
            return {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            }
        }
        return {}
    }
})

// Auto-clear invalid or expired tokens on 401 Unauthorized
api.instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login') && window.location.pathname !== '/') {
        window.location.href = "/seller/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api