// /frontend/src/features/auth/api/authAPI.js

/**
 * @file Capa de API para todas las operaciones de autenticación.
 *
 * Este archivo encapsula las llamadas de Axios a los endpoints de autenticación,
 * manejando la preparación de datos y la gestión de errores específicos de cada operación,
 * asegurando una comunicación robusta con el backend.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import api from '../../../app/axiosConfig';

const ENDPOINTS = {
    AUTH_LOGIN: '/auth/login',
    AUTH_VERIFY_TOKEN: '/auth/verify-token',
};


// ==============================================================================
// SECCIÓN 2: FUNCIONES DE LA API
// ==============================================================================

/**
 * Realiza la petición de login al backend.
 * @param {object} credentials - Un objeto con `username` y `password`.
 * @returns {Promise<object>} Una promesa que resuelve a la respuesta completa del backend
 * @throws {Error} Si las credenciales son incorrectas o hay un error de conexión.
 */
export const loginAPI = async (credentials) => {
    console.log("[DEBUG] authAPI: Iniciando `loginAPI` con credenciales:", { username: credentials.username });
    
    // FastAPI espera los datos de login en un formato de formulario.
    const formBody = new URLSearchParams();
    formBody.append('username', credentials.username);
    formBody.append('password', credentials.password);

    try {
        const response = await api.post(ENDPOINTS.AUTH_LOGIN, formBody, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });

        if (!response.data?.access_token || !response.data?.user) {
            console.error("[DEBUG] authAPI: Respuesta de login inválida.", response.data);
            throw new Error('La respuesta del servidor de autenticación fue inválida.');
        }
        console.log("[DEBUG] authAPI: Login exitoso. Usuario:", response.data.user);
        return response.data;
    } catch (error) {
        const errorMessage = error.response?.data?.detail || error.message || 'Ocurrió un error inesperado.';
        console.error("[DEBUG] authAPI: Error en `loginAPI`.", { message: errorMessage, errorOriginal: error });
        throw new Error(errorMessage);
    }
};

/**
 * Verifica la validez del token JWT actual y devuelve los datos del usuario.
 * @param {AbortSignal} [signal] - Una señal opcional para permitir la cancelación de la petición.
 * @returns {Promise<object|null>} Una promesa que resuelve al objeto de usuario si el token
 * es válido, o `null` si la petición fue cancelada o el token es inválido.
 */
export const verifyTokenAPI = async (signal) => {
    console.log("[DEBUG] authAPI: Iniciando `verifyTokenAPI`...");
    try {
        const response = await api.get(ENDPOINTS.AUTH_VERIFY_TOKEN, { signal });
        
        console.log("[DEBUG] authAPI: Petición a `verifyTokenAPI` completada exitosamente.");

        // Devuelve el usuario solo si la respuesta es exitosa y contiene el usuario.
        return response.data?.user || null;

    } catch (error) {
        // --- CORRECCIÓN CRÍTICA ---
        // Se maneja el error de cancelación de forma silenciosa, devolviendo null.
        // Esto permite que el `AuthContext` que la llama no falle, sino que simplemente
        // reciba un usuario nulo, que es el resultado correcto de una verificación fallida o cancelada.
        if (error.name === 'CanceledError') {
            console.log("[DEBUG] authAPI: Petición a `verifyTokenAPI` fue cancelada (comportamiento esperado en StrictMode).");
            return null;
        }

        // Para cualquier otro error (401 Unauthorized, error de red, etc.), se loguea y devuelve null.
        console.error("[DEBUG] authAPI: Error en `verifyTokenAPI`. El token es inválido o hubo un error de red.", error.message);
        return null;
    }
};