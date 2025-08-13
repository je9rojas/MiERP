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
const apiURL = process.env.REACT_APP_API_URL;

console.log(`[Axios] Instancia creada. Conectando a la API en: ${apiURL}`);

// VALIDACIÓN CRÍTICA: Se asegura de que la URL de la API esté definida.
// Esta práctica de "fail-fast" previene errores silenciosos y bucles de carga infinitos.
if (!apiURL) {
  throw new Error(
    "Error Crítico: REACT_APP_API_URL no está definida. " +
    "Asegúrate de que tienes un archivo .env.local en el directorio /frontend " +
    "y de que el servidor de desarrollo fue reiniciado."
  );
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
      if (status === 401 && !config.url?.endsWith('/auth/login')) {
        console.warn('[Interceptor 401] Token inválido o expirado. Forzando cierre de sesión.');
        removeAuthToken();
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