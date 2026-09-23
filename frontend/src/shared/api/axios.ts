import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Request Interceptor
api.interceptors.request.use((config) => {
  const currentToken = sessionStorage.getItem('accessToken');
  if (currentToken) {
    config.headers.Authorization = `Bearer ${currentToken}`;
  }
  return config;
});

// Response Interceptor for silent refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = sessionStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token available');

        const res = await axios.post('http://localhost:5000/api/auth/refresh', { token: refreshToken });
        
        const newAccessToken = res.data.accessToken;
        sessionStorage.setItem('accessToken', newAccessToken);
        
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        
        // Notify React context to update its in-memory token
        window.dispatchEvent(new CustomEvent('token_refreshed', { detail: newAccessToken }));

        return api(originalRequest);
      } catch (refreshError) {
        // Force completely clear auth on failure
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('refreshToken');
        sessionStorage.removeItem('user');
        window.dispatchEvent(new Event('auth_logout'));
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
