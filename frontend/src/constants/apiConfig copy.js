// /frontend/src/constants/apiConfig.js
// VERSIÓN FINAL Y SIMPLIFICADA A PRUEBA DE ERRORES DE IMPORTACIÓN

export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

/**
 * Un objeto que contiene todos los endpoints de la API.
 * La estructura es PLANA para evitar errores de importación/anidación.
 * Formato: MODULO_ACCION
 */
export const ENDPOINTS = {
  // Autenticación
  AUTH_LOGIN: '/auth/login',
  AUTH_PROFILE: '/auth/profile',
  AUTH_VERIFY_TOKEN: '/auth/verify-token',

  // Productos
  PRODUCTS_LIST_CREATE: '/products',
  PRODUCT_DETAIL: (sku) => `/products/${sku}`,

  // (Aquí añadirás más endpoints en el futuro)
};