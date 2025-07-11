// /frontend/src/api/axiosConfig.js
// VERSIÓN FINAL - USA LA CONSTANTE CENTRALIZADA

import axios from 'axios';
import { getAuthToken, removeAuthToken } from '../utils/auth/auth';
// --- ¡IMPORTACIÓN CLAVE! ---
import { API_BASE_URL } from '../constants/apiConfig'; 

// Imprimimos en la consola la URL que se está usando para una fácil depuración.
console.log(`[Axios] Instancia creada. Conectando a la API en: ${API_BASE_URL}`);

const api = axios.create({
  // --- USO DE LA CONSTANTE ---
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Interceptor de Petición: Añade el token de autorización a cada petición saliente.
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de Respuesta: Maneja errores globales, especialmente el 401 (No Autorizado).
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, config } = error.response;
      // Si el token expiró o es inválido (y no es un intento de login),
      // forzamos el logout para proteger la aplicación.
      if (status === 401 && !config.url.endsWith('/auth/login')) {
        console.error('[Interceptor 401] Token inválido o expirado. Forzando logout y redirección.');
        removeAuthToken();
        window.location.href = '/login';
        return Promise.reject(new Error("Sesión inválida. Redirigido a login."));
      }
    }
    // Para todos los demás errores, dejamos que sean manejados por el código que hizo la llamada.
    return Promise.reject(error);
  }
);

export default api;