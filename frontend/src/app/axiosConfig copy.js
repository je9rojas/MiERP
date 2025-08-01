// /frontend/src/app/axiosConfig.js

/**
 * @file Configuración central de la instancia de Axios.
 *
 * Este archivo crea y configura una instancia única de Axios que se utilizará
 * en toda la aplicación para comunicarse con el backend. Incluye interceptores
 * para automatizar el manejo de tokens de autenticación y errores globales,
 * como la expiración de la sesión.
 */

// --- SECCIÓN 1: IMPORTACIONES ---

import axios from 'axios';
import { getAuthToken, removeAuthToken } from '../utils/auth/auth';
import { API_BASE_URL } from '../constants/apiConfig';


// --- SECCIÓN 2: CREACIÓN DE LA INSTANCIA DE AXIOS ---

// Se crea una instancia de Axios con la URL base importada desde el archivo de configuración.
// Esto asegura que todas las peticiones apunten a la versión correcta de la API (ej. /api/v1).
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

console.log(`[Axios] Instancia creada. Conectando a la API en: ${API_BASE_URL}`);


// --- SECCIÓN 3: INTERCEPTOR DE PETICIONES (REQUEST INTERCEPTOR) ---

/**
 * Este interceptor se ejecuta ANTES de que cada petición sea enviada al servidor.
 * Su principal responsabilidad es añadir el token de autenticación (JWT) a la
 * cabecera 'Authorization' si existe uno, automatizando la seguridad en todas
 * las peticiones a endpoints protegidos.
 */
api.interceptors.request.use(
  (config) => {
    console.log('[Axios Request Interceptor] Preparando petición...');
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[Axios Request Interceptor] Token de autenticación añadido.');
    }
    return config;
  },
  (error) => {
    console.error('[Axios Request Interceptor] Error al construir la petición:', error);
    return Promise.reject(error);
  }
);


// --- SECCIÓN 4: INTERCEPTOR DE RESPUESTAS (RESPONSE INTERCEPTOR) ---

/**
 * Este interceptor se ejecuta DESPUÉS de recibir una respuesta del servidor.
 * Actúa como un guardián global para todas las respuestas de la API, permitiendo
 * manejar errores comunes, como la expiración de la sesión, en un solo lugar.
 */
api.interceptors.response.use(
  // Función que se ejecuta para respuestas exitosas (código 2xx).
  (response) => {
    console.log('[Axios Response Interceptor] Recibida respuesta exitosa (2xx).');
    return response;
  },
  // Función que se ejecuta para respuestas con error.
  (error) => {
    console.error('[Axios Response Interceptor] Se ha interceptado un error de respuesta.', error);

    if (error.response) {
      const { status, config } = error.response;

      // Caso especial: Manejo global de sesión expirada (Error 401 Unauthorized).
      // Si el error es un 401 y la petición NO era para hacer login (para evitar un bucle infinito),
      // se asume que el token es inválido o ha expirado.
      if (status === 401 && !config.url.endsWith('/auth/login')) {
        console.warn('[Interceptor 401] Token inválido o expirado. Se forzará el cierre de sesión.');

        // Se limpia el token del almacenamiento local.
        removeAuthToken();

        // Se redirige al usuario a la página de login.
        // `window.location.href` fuerza un refresco completo de la página, limpiando cualquier estado en memoria.
        window.location.href = '/login';

        // Se rechaza la promesa con un nuevo error para detener cualquier otro procesamiento.
        return Promise.reject(new Error("Sesión inválida. Por favor, inicie sesión de nuevo."));
      }
    }

    console.log('[Axios Response Interceptor] Rechazando la promesa para que sea manejada por el componente que hizo la llamada.');
    // Para todos los demás errores (ej. 404, 500, etc.), se deja que el componente que
    // originó la llamada (a través de .catch() o React Query) se encargue de manejarlos.
    return Promise.reject(error);
  }
);


// --- SECCIÓN 5: EXPORTACIÓN ---

export default api;