// /frontend/src/api/authAPI.js
// VERSIÓN FINAL - USA CONSTANTES PARA LOS ENDPOINTS

import api from './axiosConfig';
// --- ¡IMPORTACIÓN CLAVE! ---
import { ENDPOINTS } from '../constants/apiConfig';

/**
 * Realiza la petición de login al backend.
 */
export const loginAPI = async (credentials) => {
  console.log('[authAPI] Preparando petición de login...');
  const formBody = new URLSearchParams();
  formBody.append('username', credentials.username);
  formBody.append('password', credentials.password);
  
  try {
    console.log(`[authAPI] Enviando POST a ${ENDPOINTS.AUTH.LOGIN} para el usuario: ${credentials.username}`);
    // --- USO DE LA CONSTANTE ---
    const response = await api.post(ENDPOINTS.AUTH.LOGIN, formBody, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    console.log('[authAPI] Respuesta de login recibida del backend. ✅', response.data);
    if (!response.data || !response.data.access_token) {
      throw new Error('La respuesta del servidor no incluyó un token de acceso.');
    }
    return { token: response.data.access_token, user: response.data.user };
  } catch (error) {
    const errorMessage = error.response?.data?.detail || error.message || 'Error de conexión o del servidor.';
    console.error('[authAPI] Error en la llamada de login:', errorMessage);
    throw new Error(errorMessage);
  }
};


/**
 * Obtiene el perfil del usuario autenticado desde el backend.
 */
export const getUserProfile = async () => {
  console.log(`[authAPI] Solicitando perfil de usuario (${ENDPOINTS.AUTH.PROFILE})...`);
  try {
    // --- USO DE LA CONSTANTE ---
    const response = await api.get(ENDPOINTS.AUTH.PROFILE);
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
 */
export const verifyToken = async () => {
  console.log(`[authAPI] Verificando validez del token (${ENDPOINTS.AUTH.VERIFY_TOKEN})...`);
  try {
    // --- USO DE LA CONSTANTE ---
    const response = await api.get(ENDPOINTS.AUTH.VERIFY_TOKEN);
    const isValid = response.status === 200 && response.data?.status === 'ok';
    console.log(`[authAPI] Verificación de token completada. Válido: ${isValid ? '✅ Sí' : '❌ No'}`);
    if (!isValid) throw new Error("Token inválido según el servidor.");
    return true;
  } catch (error) {
    console.warn('[authAPI] La verificación del token falló. Esto es normal si el token expiró o es inválido.');
    return false;
  }
};