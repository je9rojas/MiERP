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
import { ENDPOINTS } from '../../../constants/apiConfig';

// ==============================================================================
// SECCIÓN 2: FUNCIONES DE LA API
// ==============================================================================

/**
 * Realiza la petición de login al backend.
 * @param {object} credentials - Un objeto con `username` y `password`.
 * @returns {Promise<object>} Una promesa que resuelve a la respuesta completa del backend
 * (ej. { access_token, token_type, user }).
 * @throws {Error} Si las credenciales son incorrectas o hay un error de conexión.
 */
export const loginAPI = async (credentials) => {
    // FastAPI con OAuth2PasswordRequestForm espera los datos en formato x-www-form-urlencoded.
    const formBody = new URLSearchParams();
    formBody.append('username', credentials.username);
    formBody.append('password', credentials.password);

    try {
        const response = await api.post(ENDPOINTS.AUTH_LOGIN, formBody, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });

        if (!response.data?.access_token || !response.data?.user) {
            throw new Error('La respuesta del servidor de autenticación fue inválida o incompleta.');
        }
        return response.data;
    } catch (error) {
        const errorMessage = error.response?.data?.detail || error.message || 'Ocurrió un error inesperado.';
        throw new Error(errorMessage);
    }
};

/**
 * Verifica la validez del token JWT actual y devuelve los datos del usuario.
 * Es crucial para la inicialización de la sesión y es compatible con la cancelación.
 *
 * @param {AbortSignal} [signal] - Una señal opcional para permitir la cancelación de la petición.
 * @returns {Promise<object>} Una promesa que resuelve al objeto de usuario si el token es válido.
 * @throws {Error} Si el token es inválido, ha expirado, fue cancelado, o hay un error de red.
 */
export const verifyTokenAPI = async (signal) => {
    try {
        const response = await api.get(ENDPOINTS.AUTH_VERIFY_TOKEN, { signal });
        
        if (response.status === 200 && response.data?.user) {
            return response.data.user;
        } else {
            throw new Error('La respuesta de verificación del token no fue la esperada.');
        }
    } catch (error) {
        if (error.name === 'CanceledError') {
            throw error; // Relanza el error de cancelación para que el llamador lo maneje.
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
    try {
        const response = await api.get(ENDPOINTS.AUTH_PROFILE);
        return response.data;
    } catch (error) {
        const errorMessage = error.response?.data?.detail || 'No se pudo cargar el perfil del usuario.';
        throw new Error(errorMessage);
    }
};