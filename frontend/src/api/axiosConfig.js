import axios from 'axios';
import { getAuthToken, removeAuthToken } from '../utils/auth/auth';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          removeAuthToken();
          window.location.href = '/login';
          break;
        case 403:
          window.location.href = '/unauthorized';
          break;
        case 500:
          console.error('Server error:', error);
          break;
        default:
          console.error('Request error:', error);
      }
    }
    return Promise.reject(error);
  }
);

export default api;