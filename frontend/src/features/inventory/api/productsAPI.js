// File: /frontend/src/features/inventory/api/productsAPI.js

/**
 * @file Contiene las funciones de API para el Catálogo de Productos y el Inventario.
 *
 * Este módulo encapsula las llamadas de Axios a los endpoints de productos
 * (catálogo) y lotes de inventario (stock transaccional).
 *
 * Se aplica una capa de mapeo a las respuestas de la API para estandarizar
 * la estructura de datos (ej. '_id' a 'id') antes de que sean utilizados
 * por la aplicación, garantizando consistencia y previsibilidad.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import api from '../../../app/axiosConfig';
import { mapPaginatedApiResponse, mapApiToFrontend } from '../../../utils/dataMappers';

// ==============================================================================
// SECCIÓN 2: FUNCIONES DE API PARA EL CATÁLOGO DE PRODUCTOS
// ==============================================================================

/**
 * Envía los datos de un nuevo producto maestro al backend para su creación.
 * @param {object} productData - El payload del producto desde el formulario.
 * @returns {Promise<object>} Una promesa que resuelve con los datos del producto creado y ya transformado.
 */
export const createProductAPI = async (productData) => {
  const response = await api.post('/products', productData);
  return mapApiToFrontend(response.data);
};

/**
 * Obtiene una lista paginada y filtrada de productos desde el backend.
 * @param {object} params - Objeto con parámetros de consulta (page, pageSize, search, etc.).
 * @returns {Promise<object>} Una promesa que resuelve con la respuesta paginada y ya transformada.
 */
export const getProductsAPI = async (params) => {
  const response = await api.get('/products', { params });
  return mapPaginatedApiResponse(response.data);
};

/**
 * Obtiene los datos completos de un único producto por su ID.
 * @param {string} productId - El ID del producto a obtener.
 * @returns {Promise<object>} Una promesa que resuelve con los datos del producto encontrado y ya transformado.
 */
export const getProductByIdAPI = async (productId) => {
  const response = await api.get(`/products/${productId}`);
  return mapApiToFrontend(response.data);
};

/**
 * Envía los datos actualizados de un producto al backend para una actualización parcial.
 * @param {string} productId - El ID del producto a actualizar.
 * @param {object} productData - El payload con los campos a actualizar.
 * @returns {Promise<object>} Una promesa que resuelve con los datos del producto ya actualizado y transformado.
 */
export const updateProductAPI = async (productId, productData) => {
  const response = await api.patch(`/products/${productId}`, productData);
  return mapApiToFrontend(response.data);
};

/**
 * Envía una petición para desactivar (borrado lógico) un producto por su ID.
 * Esta función no devuelve contenido, por lo que no requiere mapeo.
 * @param {string} productId - El ID del producto a desactivar.
 * @returns {Promise<void>} Una promesa que se resuelve cuando la operación ha finalizado.
 */
export const deactivateProductAPI = async (productId) => {
  await api.delete(`/products/${productId}`);
};

// ==============================================================================
// SECCIÓN 3: FUNCIONES DE API PARA LOTES DE INVENTARIO
// ==============================================================================

/**
 * Obtiene todos los lotes de inventario asociados a un ID de producto específico.
 * @param {string} productId - El ID del producto para el cual se solicitan los lotes.
 * @returns {Promise<Array<object>>} Una promesa que resuelve a un array de objetos de lote, ya transformados.
 */
export const getInventoryLotsByProductIdAPI = async (productId) => {
  const response = await api.get('/inventory-lots', {
    params: { product_id: productId }
  });
  // La respuesta es un array directo, `mapApiToFrontend` puede manejarlo recursivamente.
  return mapApiToFrontend(response.data);
};