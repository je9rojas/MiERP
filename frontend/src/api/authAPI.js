// /frontend/src/api/authAPI.js
// VERSIÓN FINAL USANDO LA NUEVA ESTRUCTURA DE ENDPOINTS PLANOS

import api from './axiosConfig';
import { ENDPOINTS } from '../constants/apiConfig'; // La importación no cambia

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

export const verifyToken = async () => {
  console.log(`[authAPI] Verificando token (${ENDPOINTS.AUTH_VERIFY_TOKEN})...`);
  try {
    // --- USO DE LA NUEVA CONSTANTE PLANA ---
    const response = await api.get(ENDPOINTS.AUTH_VERIFY_TOKEN);
    const isValid = response.status === 200 && response.data?.status === 'ok';
    console.log(`[authAPI] Verificación de token completada. Válido: ${isValid ? '✅ Sí' : '❌ No'}`);
    if (!isValid) throw new Error("Token inválido.");
    return true;
  } catch (error) {
    console.warn('[authAPI] La verificación del token falló.');
    return false;
  }
};