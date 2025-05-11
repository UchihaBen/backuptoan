import axios from 'axios';
import { config } from '../config';

// Xác định môi trường
const env = import.meta.env.MODE || 'development';
const isProduction = env === 'production';

// Log environment for debugging
console.log('Environment:', env);
console.log('API URLs:', config.API_URL, config.RAG_API_URL);

// Sử dụng API URL từ file cấu hình
const API_URL = config.API_URL;
const RAG_API_URL = config.RAG_API_URL;

// Tạo instance Axios cho API chính (xử lý tài khoản, chức năng chung)
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// Tạo instance Axios với JWT auth cho API chính
const authApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// Tạo instance Axios cho RAG API endpoints
const ragApi = axios.create({
  baseURL: RAG_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// Request Interceptor để thêm token cho API chính
authApi.interceptors.request.use(
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

// Request Interceptor để thêm token cho RAG API
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

// Response Interceptor để xử lý lỗi chung cho API chính
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

// Response Interceptor để xử lý lỗi chung cho RAG API
ragApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('RAG API Error:', error);
    
    // Xử lý token hết hạn hoặc không hợp lệ
    if (error.response && error.response.status === 401) {
      console.log('Authentication error, removing token');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export { api, authApi, ragApi, API_URL, RAG_API_URL, config };