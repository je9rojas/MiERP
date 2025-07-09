// /frontend/src/api/authAPI.js
// CÓDIGO FINAL Y COMPLETO CON LOGGING DETALLADO

import api from './axiosConfig';

/**
 * Realiza la petición de login al backend.
 * FastAPI con OAuth2PasswordRequestForm espera los datos en formato 'application/x-www-form-urlencoded'.
 * @param {object} credentials - Un objeto con { username, password }.
 * @returns {Promise<{token: string, user: object}>} - Una promesa que resuelve con el token y los datos del usuario.
 */
export const loginAPI = async (credentials) => {
  console.log('[authAPI] Preparando petición de login...');
  
  // 1. Preparamos los datos en el formato correcto (form-urlencoded).
  const formBody = new URLSearchParams();
  formBody.append('username', credentials.username);
  formBody.append('password', credentials.password);
  
  try {
    console.log(`[authAPI] Enviando POST a /auth/login para el usuario: ${credentials.username}`);
    
    // 2. Realizamos la petición POST, enviando el cuerpo codificado y especificando el Content-Type.
    const response = await api.post('/auth/login', formBody, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    console.log('[authAPI] Respuesta de login recibida del backend. ✅', response.data);
    
    // 3. Verificamos que la respuesta contenga el token.
    if (!response.data || !response.data.access_token) {
      throw new Error('La respuesta del servidor no incluyó un token de acceso.');
    }

    return {
      token: response.data.access_token,
      user: response.data.user,
    };
  } catch (error) {
    // Este bloque captura errores de red (si el servidor está caído) o si la promesa es rechazada por el interceptor.
    const errorMessage = error.response?.data?.detail || error.message || 'Error de conexión o del servidor.';
    console.error('[authAPI] Error en la llamada de login:', errorMessage);
    // Re-lanzamos el error para que sea capturado por el AuthContext.
    throw new Error(errorMessage);
  }
};


/**
 * Obtiene el perfil del usuario autenticado desde el backend.
 * @returns {Promise<object>} - Una promesa que resuelve con los datos del perfil del usuario.
 */
export const getUserProfile = async () => {
  console.log('[authAPI] Solicitando perfil de usuario (/auth/profile)...');
  try {
    const response = await api.get('/auth/profile');
    console.log('[authAPI] Perfil de usuario recibido. ✅', response.data);
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.detail || 'No se pudo cargar el perfil del usuario.';
    console.error('[authAPI] Error obteniendo el perfil:', errorMessage);
    throw new Error(errorMessage);
  }
};


/**
 * Verifica si el token actual sigue siendo válido en el backend.
 * @returns {Promise<boolean>} - True si el token es válido, false en caso contrario.
 */
export const verifyToken = async () => {
  console.log('[authAPI] Verificando validez del token (/auth/verify-token)...');
  try {
    const response = await api.get('/auth/verify-token');
    const isValid = response.status === 200 && response.data?.status === 'ok';
    console.log(`[authAPI] Verificación de token completada. Válido: ${isValid ? '✅ Sí' : '❌ No'}`);
    if (!isValid) throw new Error("Token inválido según el servidor.");
    return true;
  } catch (error) {
    console.warn('[authAPI] La verificación del token falló. Esto es normal si el token expiró o es inválido.');
    return false;
  }
};

// Puedes añadir tu función registerAPI aquí si la necesitas, siguiendo el mismo patrón de logging.