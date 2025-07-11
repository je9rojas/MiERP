// /frontend/src/constants/apiConfig.js
// Fuente única de verdad para la configuración de la API.

export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

export const ENDPOINTS = {
  // Autenticación
  LOGIN: '/auth/login',
  PROFILE: '/auth/profile',
  VERIFY_TOKEN: '/auth/verify-token',

  // Productos
  PRODUCTS: '/products', // Para GET (con params) y POST
  PRODUCT_DETAIL: (sku) => `/products/${sku}`, // Para GET, PUT, DELETE por SKU

  // (Aquí añadirás más endpoints en el futuro)
  SUPPLIERS: '/suppliers',
  PURCHASE_ORDERS: '/purchase-orders',
};