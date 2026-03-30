import axios from 'axios';
import { useAuthStore } from '../store/authStore';

let baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Fallback logic for malformed Render environment variables
if (baseURL === 'kora-apparel-backend' || baseURL === 'kora-apparel-backend/api') {
  baseURL = 'https://kora-apparel-backend.onrender.com/api';
} else if (baseURL && !baseURL.endsWith('/api') && baseURL !== 'http://localhost:5000/api') {
  if (!baseURL.startsWith('http')) {
    baseURL = `https://${baseURL}`;
  }
  baseURL = `${baseURL.replace(/\/+$/, '')}/api`;
}

const api = axios.create({
  baseURL,
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
