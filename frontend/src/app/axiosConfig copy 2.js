// /frontend/src/app/axiosConfig.js

/**
 * @file Configuración central de la instancia de Axios.
 *
 * Este archivo crea y configura una instancia única de Axios que se utilizará
 * en toda la aplicación para comunicarse con el backend. La URL base de la API
 * se lee dinámicamente de las variables de entorno, permitiendo que la misma base de
 * código funcione tanto en desarrollo local como en producción.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import axios from 'axios';
import { getAuthToken, removeAuthToken } from '../utils/auth/auth';

// ==============================================================================
// SECCIÓN 2: CONFIGURACIÓN DINÁMICA DE LA URL BASE
// ==============================================================================

// Lee la URL de la API desde las variables de entorno de React.
// Se asegura de que si la variable está definida pero vacía, se use el fallback.
const apiURL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

console.log(`[Axios] Instancia creada. Conectando a la API en: ${apiURL}`);

// Validador para prevenir errores críticos en tiempo de ejecución.
if (!apiURL) {
  throw new Error("Error Crítico: La URL de la API no está definida. Verifica tus variables de entorno.");
}

// ==============================================================================
// SECCIÓN 3: CREACIÓN DE LA INSTANCIA DE AXIOS
// ==============================================================================

const api = axios.create({
  baseURL: apiURL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// ==============================================================================
// SECCIÓN 4: INTERCEPTORES
// ==============================================================================

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

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const { status, config } = error.response;
      // El interceptor de 401 Unauthorized redirige al login.
      if (status === 401 && !config.url.endsWith('/auth/login')) {
        console.warn('[Interceptor 401] Token inválido o expirado. Forzando cierre de sesión.');
        removeAuthToken();
        // Usar `window.location.replace` es a veces más robusto que `.href`
        window.location.replace('/login');
        return Promise.reject(new Error("Sesión inválida. Por favor, inicie sesión de nuevo."));
      }
    }
    return Promise.reject(error);
  }
);

// ==============================================================================
// SECCIÓN 5: EXPORTACIÓN
// ==============================================================================

export default api;