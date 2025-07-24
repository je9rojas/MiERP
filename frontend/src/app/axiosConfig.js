// /frontend/src/app/axiosConfig.js

import axios from 'axios';
import { getAuthToken, removeAuthToken } from '../utils/auth/auth';
import { API_BASE_URL } from '../constants/apiConfig';

console.log(`[Axios] Instancia creada. Conectando a la API en: ${API_BASE_URL}`);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    console.log('[Axios Request Interceptor] Añadiendo token a la petición...');
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('[Axios Request Interceptor] Error al construir la petición:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log('[Axios Response Interceptor] Recibida respuesta exitosa (2xx). Dejando pasar...');
    return response;
  },
  (error) => {
    console.error('[Axios Response Interceptor] Se ha interceptado un error.', error);
    if (error.response) {
      const { status, config } = error.response;
      if (status === 401 && !config.url.endsWith('/auth/login')) {
        console.error('[Interceptor 401] Token inválido o expirado. Forzando logout.');
        removeAuthToken();
        window.location.href = '/login';
        return Promise.reject(new Error("Sesión inválida. Por favor, inicie sesión de nuevo."));
      }
    }
    console.error('[Axios Response Interceptor] Rechazando la promesa para que sea manejada localmente...');
    return Promise.reject(error);
  }
);

export default api;