import axios from 'axios';

// Xác định môi trường
const env = import.meta.env.MODE || 'development';
const isProduction = env === 'production';

// Log environment for debugging
console.log('Environment:', env);
console.log('Vite Environment Variables:', import.meta.env);

// API URL dựa trên môi trường
let API_URL = isProduction 
  ? 'https://giasutoan-flask.onrender.com' 
  : 'http://localhost:5000';

// Override nếu có biến môi trường cụ thể
if (import.meta.env.VITE_API_URL) {
  API_URL = import.meta.env.VITE_API_URL;
}

console.log('Using API URL:', API_URL);

// Tạo instance Axios mặc định
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // Cấu hình phù hợp với backend CORS
});

// Tạo instance Axios với JWT auth
const authApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // Cấu hình phù hợp với backend CORS
});

// Tạo instance Axios cho RAG API endpoints
const ragApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// Request Interceptor để thêm token
authApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    console.log('Request config:', config);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add token to ragApi requests as well
ragApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor để xử lý lỗi chung
authApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    
    // Xử lý token hết hạn hoặc không hợp lệ
    if (error.response && error.response.status === 401) {
      console.log('Authentication error, removing token');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Apply the same response interceptor to ragApi
ragApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('RAG API Error:', error);
    
    if (error.response && error.response.status === 401) {
      console.log('Authentication error, removing token');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export { api, authApi, ragApi, API_URL }; 