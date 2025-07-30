// /frontend/src/constants/apiConfig.js

/**
 * @file Archivo de Configuración Centralizado para las Constantes de la API.
 *
 * Este archivo sirve como la única fuente de la verdad para todas las
 * configuraciones relacionadas con la comunicación con el backend. Centralizar esta
 * información aquí facilita enormemente el cambio entre entornos (desarrollo,
 * staging, producción) y la gestión de las rutas de los endpoints, previniendo
 * errores por tener URLs hardcodeadas en múltiples lugares.
 */

// --- SECCIÓN 1: URL BASE DE LA API ---

/**
 * La URL raíz del backend, incluyendo la versión de la API.
 * Todas las peticiones de Axios usarán esta URL como punto de partida.
 *
 * Utiliza una variable de entorno (REACT_APP_API_URL) para máxima flexibilidad
 * en diferentes entornos de despliegue, con un valor por defecto para el
 * desarrollo local.
 */
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';


// --- SECCIÓN 2: COLECCIÓN DE ENDPOINTS ---

/**
 * Un objeto que mapea acciones de negocio a sus rutas de API relativas.
 * El uso de funciones para endpoints que requieren parámetros (como un ID)
 * asegura que las URLs se construyan siempre de la misma manera, evitando errores.
 *
 * Formato sugerido para las claves: MODULO_ACCIÓN
 */
export const ENDPOINTS = {
  // --- Módulo: Autenticación ---
  AUTH_LOGIN: '/auth/login',
  AUTH_PROFILE: '/auth/profile',
  AUTH_VERIFY_TOKEN: '/auth/verify-token',

  // --- Módulo: Inventario (Productos) ---
  PRODUCTS_BASE: '/products',
  PRODUCTS_BY_SKU: (sku) => `/products/${sku}`,
  PRODUCTS_CATALOG: '/products/catalog',

  // --- Módulo: CRM (Proveedores) ---
  SUPPLIERS_BASE: '/suppliers',
  SUPPLIERS_BY_ID: (supplierId) => `/suppliers/${supplierId}`,

  // --- Módulo: CRM (Clientes) ---
  // Ejemplo: CUSTOMERS_BASE: '/customers',

  // --- Módulo: Compras ---
  PURCHASES_BASE: '/purchase-orders', // Asumiendo que el prefijo del router es 'purchase-orders'
  PURCHASES_BY_ID: (orderId) => `/purchase-orders/${orderId}`,

  // --- Módulo: Administración ---
  // Ejemplo: ADMIN_USERS: '/users',
};