// /frontend/src/api/authAPI.js
// VERSIÓN FINAL USANDO LA NUEVA ESTRUCTURA DE ENDPOINTS PLANOS

import api from '../../../app/axiosConfig';
import { ENDPOINTS } from '../../../constants/apiConfig';

export const loginAPI = async (credentials) => {
  console.log('[authAPI] Preparando petición de login...');
  const formBody = new URLSearchParams();
  formBody.append('username', credentials.username);
  formBody.append('password', credentials.password);
  
  try {
    // --- USO DE LA NUEVA CONSTANTE PLANA ---
    console.log(`[authAPI] Enviando POST a ${ENDPOINTS.AUTH_LOGIN} para el usuario: ${credentials.username}`);
    const response = await api.post(ENDPOINTS.AUTH_LOGIN, formBody, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    console.log('[authAPI] Respuesta de login recibida. ✅', response.data);
    if (!response.data || !response.data.access_token) {
      throw new Error('La respuesta del servidor no incluyó un token de acceso.');
    }
    return { token: response.data.access_token, user: response.data.user };
  } catch (error) {
    const errorMessage = error.response?.data?.detail || error.message || 'Error de conexión.';
    console.error('[authAPI] Error en la llamada de login:', errorMessage);
    throw new Error(errorMessage);
  }
};

export const getUserProfile = async () => {
  console.log(`[authAPI] Solicitando perfil (${ENDPOINTS.AUTH_PROFILE})...`);
  try {
    // --- USO DE LA NUEVA CONSTANTE PLANA ---
    const response = await api.get(ENDPOINTS.AUTH_PROFILE);
    console.log('[authAPI] Perfil de usuario recibido. ✅', response.data);
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.detail || 'No se pudo cargar el perfil.';
    console.error('[authAPI] Error obteniendo el perfil:', errorMessage);
    throw new Error(errorMessage);
  }
};

// --- ¡FUNCIÓN CORREGIDA Y OPTIMIZADA! ---
export const verifyToken = async () => {
  console.log(`[authAPI] Verificando token (${ENDPOINTS.AUTH_VERIFY_TOKEN})...`);
  
  /**
   * Esta función ahora cumple un contrato estricto:
   * - Si el token es válido, la promesa se resuelve exitosamente.
   * - Si el token es inválido o hay cualquier error (ej. 401 Unauthorized), la promesa es rechazada (lanza una excepción).
   * Esto permite que el AuthContext use un bloque try/catch simple y robusto para la inicialización.
   */
  try {
    const response = await api.get(ENDPOINTS.AUTH_VERIFY_TOKEN);
    
    // Verificación adicional: nos aseguramos de que el backend devuelva un estado 'ok'.
    if (response.status === 200 && response.data?.status === 'ok') {
      console.log('[authAPI] Verificación de token exitosa. ✅');
      // No necesitamos devolver nada, el éxito de la promesa es suficiente.
      return; 
    } else {
      // Si el backend devuelve 200 pero el cuerpo no es el esperado, lo tratamos como un error.
      throw new Error('La respuesta de verificación del token no fue la esperada.');
    }
  } catch (error) {
    // Si Axios lanza un error (ej. 401, 500), lo capturamos aquí.
    const errorMessage = error.response?.data?.detail || 'El token ya no es válido.';
    console.warn(`[authAPI] La verificación del token falló: ${errorMessage}`);
    // Y lo más importante: volvemos a lanzar la excepción para que el AuthContext la capture.
    throw new Error(errorMessage);
  }
};