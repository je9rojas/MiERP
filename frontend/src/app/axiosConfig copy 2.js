// /frontend/src/app/axiosConfig.js

/**
 * @file Configuración centralizada de la instancia de Axios.
 * Este archivo crea una instancia de Axios con una URL base y configura interceptores
 * globales para manejar la inyección de tokens de autenticación y la gestión
 * de errores comunes, como la expiración de la sesión (error 401).
 */

// --- SECCIÓN 1: IMPORTACIONES ---
import axios from 'axios';
import { getAuthToken, removeAuthToken } from '../utils/auth/auth';
import { API_BASE_URL } from '../constants/apiConfig';

// --- SECCIÓN 2: CREACIÓN DE LA INSTANCIA DE AXIOS ---

console.log(`[Axios] Instancia creada. Conectando a la API en: ${API_BASE_URL}`);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});


// --- SECCIÓN 3: CONFIGURACIÓN DE INTERCEPTORES ---

/**
 * Interceptor de Petición (Request Interceptor):
 * Se ejecuta ANTES de que cada petición sea enviada.
 * Su principal responsabilidad es obtener el token de autenticación del almacenamiento
 * y añadirlo a la cabecera 'Authorization' si existe.
 */
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // Esto solo se activa si hay un error al construir la petición.
    return Promise.reject(error);
  }
);


/**
 * Interceptor de Respuesta (Response Interceptor):
 * Se ejecuta DESPUÉS de recibir una respuesta de la API.
 * Su principal responsabilidad es manejar errores globales.
 * - Si recibe un error 401 (No Autorizado), indica que el token es inválido o ha expirado,
 *   por lo que fuerza un logout para proteger la aplicación.
 * - Para cualquier otro error, simplemente lo re-lanza para que sea manejado por el
 *   bloque `catch` específico de la llamada a la API que lo originó.
 */
api.interceptors.response.use(
  // Función para respuestas exitosas (código 2xx): simplemente las deja pasar.
  (response) => response,

  // --- ¡FUNCIÓN DE ERROR CORREGIDA Y ROBUSTA! ---
  (error) => {
    // Se comprueba si el error tiene un objeto 'response', lo que significa que fue una respuesta del servidor.
    if (error.response) {
      const { status, config } = error.response;

      // Lógica específica para errores de autenticación 401.
      // Se excluye la ruta de login para evitar un bucle infinito si el login falla.
      if (status === 401 && !config.url.endsWith('/auth/login')) {
        console.error('[Interceptor 401] Token inválido o expirado. Forzando logout y redirección.');
        removeAuthToken();
        // Redirige al usuario a la página de login.
        window.location.href = '/login';
        
        // Se devuelve una promesa rechazada con un error claro.
        // Esto detiene la cadena de promesas original.
        return Promise.reject(new Error("Sesión inválida. Por favor, inicie sesión de nuevo."));
      }
    }

    // Para CUALQUIER otro error (incluyendo errores 500, 404, errores de red, etc.),
    // esta línea asegura que la promesa original siempre sea rechazada.
    // Esto permite que los bloques `catch` en `authAPI.js` y otros lugares funcionen correctamente.
    return Promise.reject(error);
  }
);

export default api;