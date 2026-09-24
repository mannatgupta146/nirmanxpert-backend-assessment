import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

// Response Interceptor for silent refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/refresh' && originalRequest.url !== '/auth/login') {
      originalRequest._retry = true;
      try {
        // The backend uses HttpOnly cookies now, so we just make the request
        await axios.post(`${baseURL}/auth/refresh`, {}, { withCredentials: true });
        
        // Retry original request (browser will automatically include the new accessToken cookie)
        return api(originalRequest);
      } catch (refreshError) {
        // Force completely clear auth on failure
        sessionStorage.removeItem('user');
        window.dispatchEvent(new Event('auth_logout'));
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
