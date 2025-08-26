// File: /frontend/src/features/auth/api/authAPI.js

/**
 * @file Capa de API para todas las operaciones de autenticación.
 *
 * Este archivo encapsula las llamadas de Axios a los endpoints de autenticación.
 * Aplica la capa anticorrupción a las respuestas que contienen datos de usuario
 * para asegurar un modelo de datos consistente (`id` vs `_id`) en toda la aplicación,
 * especialmente en el `AuthContext`.
 */

// =omed=============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import api from '../../../app/axiosConfig';
import { mapApiToFrontend } from '../../../utils/dataMappers';

// ==============================================================================
// SECCIÓN 2: DEFINICIÓN DE ENDPOINTS
// ==============================================================================

const ENDPOINTS = {
    LOGIN: '/auth/login',
    VERIFY_TOKEN: '/auth/verify-token',
};

// ==============================================================================
// SECCIÓN 3: FUNCIONES DE LA API
// ==============================================================================

/**
 * Realiza la petición de login al backend.
 * @param {object} credentials - Un objeto con `username` y `password`.
 * @returns {Promise<object>} Una promesa que resuelve a un objeto con `access_token` y los datos del `user` transformados.
 * @throws {Error} Si las credenciales son incorrectas o hay un error de conexión.
 */
export const loginAPI = async (credentials) => {
    // FastAPI espera los datos de login en un formato de formulario.
    const formBody = new URLSearchParams();
    formBody.append('username', credentials.username);
    formBody.append('password', credentials.password);

    try {
        const response = await api.post(ENDPOINTS.LOGIN, formBody, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });

        const { access_token, user } = response.data;

        if (!access_token || !user) {
            throw new Error('La respuesta del servidor de autenticación fue inválida.');
        }
        
        // Se aplica la transformación al objeto de usuario antes de devolverlo.
        const mappedUser = mapApiToFrontend(user);
        
        return { access_token, user: mappedUser };

    } catch (error) {
        const errorMessage = error.response?.data?.detail || error.message || 'Ocurrió un error inesperado.';
        throw new Error(errorMessage);
    }
};

/**
 * Verifica la validez del token JWT actual y devuelve los datos del usuario transformados.
 * @param {AbortSignal} [signal] - Una señal opcional para permitir la cancelación de la petición.
 * @returns {Promise<object|null>} Una promesa que resuelve al objeto de usuario transformado si el token
 * es válido, o `null` si la petición fue cancelada o el token es inválido.
 */
export const verifyTokenAPI = async (signal) => {
    try {
        const response = await api.get(ENDPOINTS.VERIFY_TOKEN, { signal });
        
        const user = response.data?.user;

        // Si la respuesta es exitosa y contiene un usuario, se transforma y se devuelve.
        if (user) {
            return mapApiToFrontend(user);
        }
        
        return null;

    } catch (error) {
        // Se manejan los errores (token inválido, red, cancelación) de forma silenciosa,
        // devolviendo `null` para indicar que la verificación no fue exitosa.
        if (error.name !== 'CanceledError') {
            console.error("Error al verificar el token:", error.message);
        }
        return null;
    }
};