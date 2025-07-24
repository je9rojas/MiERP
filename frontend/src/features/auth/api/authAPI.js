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
 * @returns {Promise<{token: string, user: object}>} Un objeto con el token de acceso y los datos del usuario.
 * @throws {Error} Si las credenciales son incorrectas o hay un error de conexión.
 */
export const loginAPI = async (credentials) => {
  console.log('[authAPI] 1. Preparando petición de login...');
  const formBody = new URLSearchParams();
  formBody.append('username', credentials.username);
  formBody.append('password', credentials.password);
  
  try {
    console.log(`[authAPI] 2. Enviando POST a ${ENDPOINTS.AUTH_LOGIN} para el usuario: ${credentials.username}`);
    const response = await api.post(ENDPOINTS.AUTH_LOGIN, formBody, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    console.log('[authAPI] 4. Respuesta de login recibida. ✅', response.data);
    if (!response.data || !response.data.access_token) {
      throw new Error('La respuesta del servidor no incluyó un token de acceso.');
    }
    return { token: response.data.access_token, user: response.data.user };
  } catch (error) {
    console.error('[authAPI] 5. Se ha producido un error en la llamada de login.', error);
    const errorMessage = error.response?.data?.detail || error.message || 'Error de conexión.';
    throw new Error(errorMessage);
  }
};

/**
 * Obtiene el perfil completo del usuario autenticado.
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

/**
 * Verifica la validez del token JWT actual y, si es válido, devuelve los datos del usuario.
 * Esta función optimizada realiza la verificación y la obtención del perfil en una sola llamada.
 *
 * @returns {Promise<object>} El objeto de usuario si el token es válido.
 * @throws {Error} Si el token es inválido, ha expirado o hay un error de red.
 */
export const verifyToken = async () => {
  console.log(`[authAPI] Verificando token y obteniendo usuario (${ENDPOINTS.AUTH_VERIFY_TOKEN})...`);
  
  try {
    const response = await api.get(ENDPOINTS.AUTH_VERIFY_TOKEN);
    
    // Si la respuesta es exitosa (200) y contiene el objeto de usuario, la verificación es correcta.
    if (response.status === 200 && response.data?.user) {
      console.log('[authAPI] Verificación de token exitosa. Usuario obtenido. ✅', response.data.user);
      // Devolvemos el objeto de usuario para que el AuthContext lo utilice.
      return response.data.user;
    } else {
      // Si el backend devuelve 200 pero el cuerpo no es el esperado, lo tratamos como un error.
      throw new Error('La respuesta de verificación del token no fue la esperada.');
    }
  } catch (error) {
    // Si Axios lanza un error (ej. 401, 500), lo capturamos.
    const errorMessage = error.response?.data?.detail || 'El token ya no es válido.';
    console.warn(`[authAPI] La verificación del token falló: ${errorMessage}`);
    // Re-lanzamos la excepción para que el AuthContext la capture y maneje el logout.
    throw new Error(errorMessage);
  }
};