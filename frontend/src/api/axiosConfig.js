// /frontend/src/api/axiosConfig.js
// CÓDIGO CORREGIDO CON LA VARIABLE DE ENTORNO CORRECTA

import axios from 'axios';
import { getAuthToken, removeAuthToken } from '../utils/auth/auth';

// --- CAMBIO CLAVE AQUÍ ---
// Nos aseguramos de usar la misma variable que definimos en el archivo .env.local
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

// Imprimimos en la consola la URL que se está usando.
// Esto es increíblemente útil para depurar problemas de conexión.
console.log(`[Axios] Conectando a la API en: ${API_BASE_URL}`);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Interceptor de Petición: Añade el token de autorización a cada petición.
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

// Interceptor de Respuesta: Maneja errores globales como el 401 (No Autorizado).
api.interceptors.response.use(
  // Si la respuesta es exitosa (2xx), simplemente la devuelve.
  (response) => response,
  
  // Si hay un error, se ejecuta esta función.
  (error) => {
    // Es una buena práctica verificar que 'error.response' existe antes de acceder a sus propiedades.
    if (error.response) {
      const { status, config } = error.response;

      // Lógica de redirección por token expirado/inválido:
      // Si el error es un 401 (No Autorizado) Y NO fue en la ruta de login,
      // significa que una sesión válida ha expirado.
      if (status === 401 && !config.url.endsWith('/auth/login')) {
        console.error('[Interceptor 401] Token inválido o expirado. Forzando logout y redirección.');
        
        // Limpia el token del almacenamiento local.
        removeAuthToken();
        
        // Redirige al usuario a la página de login.
        // Usar window.location.href fuerza una recarga completa de la página,
        // lo que ayuda a limpiar cualquier estado de React/Redux que pueda haber quedado.
        window.location.href = '/login';

        // Detenemos la cadena de promesas aquí para evitar que el error se propague más.
        return Promise.reject(new Error("Sesión inválida. Redirigido a login."));
      }
    }
    
    // Para todos los demás errores (ej. 404, 500, o un 401 en la página de login),
    // dejamos que la promesa sea rechazada. Esto permite que el código que hizo
    // la llamada original (ej. en un `try/catch` en AuthContext) maneje el error
    // de forma específica (ej. mostrando un mensaje "Credenciales incorrectas").
    return Promise.reject(error);
  }
);

export default api;