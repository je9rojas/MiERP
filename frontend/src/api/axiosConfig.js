// /frontend/src/api/axiosConfig.js
// CÓDIGO COMPLETO Y CORREGIDO FINAL - LISTO PARA COPIAR Y PEGAR

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

// --- INTERCEPTOR DE RESPUESTA CORREGIDO ---
api.interceptors.response.use(
  // Si la respuesta es exitosa, simplemente la pasamos
  (response) => response,
  // Si hay un error, lo manejamos aquí
  (error) => {
    // Es buena práctica verificar que 'error.response' existe
    if (error.response) {
      const { status, config } = error.response;

      // --- LÓGICA CLAVE ---
      // Verificamos si el error es un 401 Y si NO es de la ruta de login.
      // Solo si se cumplen ambas condiciones, redirigimos.
      // Esto permite que la página de login maneje sus propios errores 401.
      if (status === 401 && config.url !== '/auth/login') {
        console.log('[Interceptor] Token inválido o expirado. Redirigiendo a login.');
        removeAuthToken();
        // Usamos window.location para una recarga completa, limpiando todo el estado.
        window.location.href = '/login';
        // Devolvemos una promesa rechazada para detener cualquier procesamiento posterior.
        return Promise.reject(error);
      }
    }
    
    // Para todos los demás errores (incluyendo el 401 del login),
    // simplemente dejamos que el error continúe su curso para ser
    // capturado por el `catch` block de la llamada original (en authAPI.js y AuthContext.js).
    return Promise.reject(error);
  }
);

export default api;