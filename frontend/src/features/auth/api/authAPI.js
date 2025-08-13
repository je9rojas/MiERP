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
// Asumiremos que tienes un archivo de constantes para los endpoints. Si no, puedes reemplazarlo por la cadena.
// import { ENDPOINTS } from '../../../constants/apiConfig'; 
const ENDPOINTS = {
    AUTH_LOGIN: '/auth/login',
    AUTH_VERIFY_TOKEN: '/auth/verify-token',
    AUTH_PROFILE: '/auth/me'
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
    const formBody = new URLSearchParams();
    formBody.append('username', credentials.username);
    formBody.append('password', credentials.password);

    try {
        const response = await api.post(ENDPOINTS.AUTH_LOGIN, formBody, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });

        if (!response.data?.access_token || !response.data?.user) {
            console.error("[DEBUG] authAPI: Respuesta de login inválida.", response.data);
            throw new Error('La respuesta del servidor de autenticación fue inválida o incompleta.');
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
 * @returns {Promise<object>} Una promesa que resuelve al objeto de usuario si el token es válido.
 * @throws {Error} Si el token es inválido, ha expirado, fue cancelado, o hay un error de red.
 */
export const verifyTokenAPI = async (signal) => {
    console.log("[DEBUG] authAPI: Iniciando `verifyTokenAPI`...");
    try {
        console.log(`[DEBUG] authAPI: Realizando petición GET a ${ENDPOINTS.AUTH_VERIFY_TOKEN}`);
        const response = await api.get(ENDPOINTS.AUTH_VERIFY_TOKEN, { signal });
        
        console.log("[DEBUG] authAPI: Petición a `verifyTokenAPI` completada. Respuesta:", response);

        if (response.status === 200 && response.data?.user) {
            console.log("[DEBUG] authAPI: Verificación exitosa. Usuario válido encontrado:", response.data.user);
            return response.data.user;
        } else {
            console.warn("[DEBUG] authAPI: La respuesta de verificación fue exitosa pero no contenía los datos de usuario esperados.", response.data);
            throw new Error('La respuesta de verificación del token no fue la esperada.');
        }
    } catch (error) {
        // LOG EXHAUSTIVO: Muestra todos los detalles del error.
        console.error("[DEBUG] authAPI: Error en `verifyTokenAPI`. Detalles del error:", {
            esErrorDeCancelacion: error.name === 'CanceledError',
            mensajeError: error.message,
            respuestaServidor: error.response?.data,
            estadoHttp: error.response?.status,
            peticion: error.request,
            errorCompleto: error
        });

        if (error.name === 'CanceledError') {
            throw error;
        }
        const errorMessage = error.response?.data?.detail || 'La sesión ha expirado o es inválida.';
        throw new Error(errorMessage);
    }
};

/**
 * Obtiene el perfil completo del usuario autenticado.
 * @returns {Promise<object>} Los datos del perfil del usuario.
 * @throws {Error} Si el token es inválido o no se puede cargar el perfil.
 */
export const getUserProfileAPI = async () => {
    console.log("[DEBUG] authAPI: Iniciando `getUserProfileAPI`...");
    try {
        const response = await api.get(ENDPOINTS.AUTH_PROFILE);
        console.log("[DEBUG] authAPI: Perfil de usuario obtenido exitosamente:", response.data);
        return response.data;
    } catch (error) {
        const errorMessage = error.response?.data?.detail || 'No se pudo cargar el perfil del usuario.';
        console.error("[DEBUG] authAPI: Error en `getUserProfileAPI`.", { message: errorMessage, errorOriginal: error });
        throw new Error(errorMessage);
    }
};