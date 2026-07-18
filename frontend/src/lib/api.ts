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

export default api