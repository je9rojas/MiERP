// /frontend/src/features/auth/api/authAPI.js

/**
 * @file Capa de API para todas las operaciones de autenticación.
 * Este archivo encapsula las llamadas de Axios a los endpoints de autenticación,
 * manejando la preparación de datos y la gestión de errores específicos de cada operación.
 */

// --- SECCIÓN 1: IMPORTACIONES ---
import api from '../../../app/axiosConfig';
import { ENDPOINTS } from '../../../constants/apiConfig';


// --- SECCIÓN 2: FUNCIONES DE LA API DE AUTENTICACIÓN ---

/**
 * Realiza la petición de login al backend.
 * @param {object} credentials - Un objeto con `username` y `password`.
 * @returns {Promise<object>} Una promesa que resuelve a la respuesta completa del backend
 * (ej. { access_token: string, token_type: string, user: object }).
 * @throws {Error} Si las credenciales son incorrectas o hay un error de conexión.
 */
export const loginAPI = async (credentials) => {
  console.log('[authAPI] 1. Preparando petición de login...');
  // FastAPI con OAuth2PasswordRequestForm espera los datos en formato x-www-form-urlencoded.
  const formBody = new URLSearchParams();
  formBody.append('username', credentials.username);
  formBody.append('password', credentials.password);
  
  try {
    console.log(`[authAPI] 2. Enviando POST a ${ENDPOINTS.AUTH_LOGIN} para el usuario: ${credentials.username}`);
    const response = await api.post(ENDPOINTS.AUTH_LOGIN, formBody, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    console.log('[authAPI] 3. Respuesta de login recibida. ✅', response.data);
    
    if (!response.data || !response.data.access_token || !response.data.user) {
      throw new Error('La respuesta del servidor de autenticación fue inválida.');
    }

    // --- ¡CORRECCIÓN CLAVE AQUÍ! ---
    // Se devuelve la respuesta 'data' del servidor directamente, sin ninguna transformación.
    // Esto asegura que el AuthContext reciba el objeto completo con la propiedad 'access_token'.
    return response.data;

  } catch (error) {
    console.error('[authAPI] 4. Se ha producido un error en la llamada de login.', error);
    let errorMessage = 'Ocurrió un error inesperado durante el inicio de sesión.';
    if (error.response) {
        errorMessage = error.response.data.detail || 'Credenciales incorrectas.';
    } else if (error.request) {
        errorMessage = 'No se pudo conectar con el servidor. Por favor, intente más tarde.';
    } else {
        errorMessage = error.message;
    }
    throw new Error(errorMessage);
  }
};


/**
 * Verifica la validez del token JWT actual y, si es válido, devuelve los datos del usuario.
 * Esta función es crucial para la inicialización de la sesión al recargar la página.
 *
 * @returns {Promise<object>} Una promesa que resuelve al objeto de usuario si el token es válido.
 * @throws {Error} Si el token es inválido, ha expirado o hay un error de red.
 */
export const verifyTokenAPI = async () => {
  console.log(`[authAPI] Verificando token y obteniendo usuario (${ENDPOINTS.AUTH_VERIFY_TOKEN})...`);
  
  try {
    const response = await api.get(ENDPOINTS.AUTH_VERIFY_TOKEN);
    
    if (response.status === 200 && response.data?.user) {
      console.log('[authAPI] Verificación de token exitosa. Usuario obtenido. ✅', response.data.user);
      // Se devuelve solo el objeto de usuario, que es lo que AuthContext necesita para inicializar.
      return response.data.user;
    } else {
      throw new Error('La respuesta de verificación del token no fue la esperada.');
    }
  } catch (error) {
    const errorMessage = error.response?.data?.detail || 'La sesión ha expirado.';
    console.warn(`[authAPI] La verificación del token falló: ${errorMessage}`);
    throw new Error(errorMessage);
  }
};


/**
 * Obtiene el perfil completo del usuario autenticado (si se necesita en otras partes de la app).
 * @returns {Promise<object>} Los datos del perfil del usuario.
 * @throws {Error} Si el token es inválido o no se puede cargar el perfil.
 */
export const getUserProfile = async () => {
  console.log(`[authAPI] Solicitando perfil (${ENDPOINTS.AUTH_PROFILE})...`);
  try {
    const response = await api.get(ENDPOINTS.AUTH_PROFILE);
    console.log('[authAPI] Perfil de usuario recibido. ✅', response.data);
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.detail || 'No se pudo cargar el perfil.';
    console.error('[authAPI] Error obteniendo el perfil:', errorMessage);
    throw new Error(errorMessage);
  }
};