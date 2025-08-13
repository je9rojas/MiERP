// /frontend/src/utils/auth/auth.js

/**
 * @file Utilidades para la gestión del token de autenticación en el LocalStorage.
 *
 * Este archivo proporciona un conjunto de funciones puras para interactuar con el
 * almacenamiento local del navegador. Centralizar esta lógica aquí asegura que la clave
 * del token ('authToken') sea consistente en toda la aplicación y facilita la
 * depuración de la persistencia de la sesión.
 */

// ==============================================================================
// SECCIÓN 1: CONSTANTES
// ==============================================================================

const AUTH_TOKEN_KEY = 'authToken';

// ==============================================================================
// SECCIÓN 2: FUNCIONES DE GESTIÓN DEL TOKEN
// ==============================================================================

/**
 * Guarda el token de autenticación en el LocalStorage.
 * @param {string} token - El token JWT recibido del backend.
 */
export const setAuthToken = (token) => {
  try {
    if (typeof token !== 'string' || token.trim() === '') {
      console.warn('[DEBUG] auth.js: Se intentó guardar un token inválido o vacío.');
      return;
    }
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    console.log(`[DEBUG] auth.js: Token guardado exitosamente en LocalStorage.`);
  } catch (error) {
    console.error('[DEBUG] auth.js: Error al intentar guardar el token en LocalStorage.', error);
  }
};

/**
 * Recupera el token de autenticación desde el LocalStorage.
 * @returns {string|null} El token JWT si existe, o null si no.
 */
export const getAuthToken = () => {
  try {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    // Este log es crucial para saber qué se está leyendo al inicio.
    console.log(`[DEBUG] auth.js: Leyendo token de LocalStorage. Valor encontrado: ${token ? `"${token.substring(0, 15)}..."` : 'null'}`);
    return token;
  } catch (error) {
    console.error('[DEBUG] auth.js: Error al intentar leer el token de LocalStorage.', error);
    return null;
  }
};

/**
 * Elimina el token de autenticación del LocalStorage.
 */
export const removeAuthToken = () => {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    console.log('[DEBUG] auth.js: Token eliminado de LocalStorage.');
  } catch (error) {
    console.error('[DEBUG] auth.js: Error al intentar eliminar el token de LocalStorage.', error);
  }
};

// ==============================================================================
// SECCIÓN 3: FUNCIONES DE GESTIÓN DE ROLES
// ==============================================================================

/**
 * Verifica si el rol de un usuario está incluido en una lista de roles permitidos.
 * @param {string} userRole - El rol del usuario actual (ej. 'admin').
 * @param {Array<string>} allowedRoles - Un array de roles que tienen permiso.
 * @returns {boolean} - `true` si el usuario tiene permiso, `false` en caso contrario.
 */
export const checkUserRole = (userRole, allowedRoles) => {
  // Si no se especifican roles permitidos, se asume que la ruta es pública para usuarios autenticados.
  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }
  // Se asegura de que la comparación no sea sensible a mayúsculas/minúsculas.
  return allowedRoles.includes(userRole?.toLowerCase());
};