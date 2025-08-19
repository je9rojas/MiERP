// /frontend/src/features/inventory/api/productsAPI.js

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
// Se importan los mapeadores genéricos desde la nueva ubicación centralizada.
import { mapPaginatedResponse, mapItemToId, mapArrayToId } from '../../../utils/dataMappers';

// ==============================================================================
// SECCIÓN 2: FUNCIONES DE API PARA EL CATÁLOGO DE PRODUCTOS
// ==============================================================================

/**
 * Envía los datos de un nuevo producto maestro al backend para su creación.
 * @param {object} productData - El payload del producto desde el formulario.
 * @returns {Promise<object>} Una promesa que resuelve con los datos del producto creado y ya mapeado.
 */
export const createProductAPI = async (productData) => {
  const response = await api.post('/products', productData);
  // Se aplica el mapeador a la respuesta para estandarizar el ID.
  return mapItemToId(response.data);
};

/**
 * Obtiene una lista paginada y filtrada de productos desde el backend.
 * @param {object} params - Objeto con parámetros de consulta (page, page_size, search, etc.).
 * @returns {Promise<object>} Una promesa que resuelve con la respuesta paginada y ya mapeada.
 */
export const getProductsAPI = async (params) => {
  const response = await api.get('/products', { params });
  // Se aplica el mapeador a la respuesta paginada para estandarizar los IDs de todos los items.
  return mapPaginatedResponse(response.data);
};

/**
 * Obtiene los datos completos de un único producto por su SKU.
 * @param {string} sku - El SKU del producto a obtener.
 * @returns {Promise<object>} Una promesa que resuelve con los datos del producto encontrado y ya mapeado.
 */
export const getProductBySkuAPI = async (sku) => {
  const encodedSku = encodeURIComponent(sku);
  const response = await api.get(`/products/${encodedSku}`);
  // Se aplica el mapeador a la respuesta para estandarizar el ID.
  return mapItemToId(response.data);
};

/**
 * Envía los datos actualizados de un producto al backend para una actualización parcial.
 * @param {string} sku - El SKU del producto a actualizar.
 * @param {object} productData - El payload con los campos a actualizar.
 * @returns {Promise<object>} Una promesa que resuelve con los datos del producto ya actualizado y mapeado.
 */
export const updateProductAPI = async (sku, productData) => {
  const encodedSku = encodeURIComponent(sku);
  const response = await api.patch(`/products/${encodedSku}`, productData);
  // Se aplica el mapeador a la respuesta para estandarizar el ID.
  return mapItemToId(response.data);
};

/**
 * Envía una petición para desactivar (borrado lógico) un producto por su SKU.
 * Esta función no devuelve contenido, por lo que no requiere mapeo.
 * @param {string} sku - El SKU del producto a desactivar.
 * @returns {Promise<void>} Una promesa que se resuelve cuando la operación ha finalizado.
 */
export const deactivateProductAPI = async (sku) => {
  const encodedSku = encodeURIComponent(sku);
  await api.delete(`/products/${encodedSku}`);
};

// ==============================================================================
// SECCIÓN 3: FUNCIONES DE API PARA LOTES DE INVENTARIO
// ==============================================================================

/**
 * Obtiene todos los lotes de inventario asociados a un ID de producto específico.
 * @param {string} productId - El ID del producto para el cual se solicitan los lotes.
 * @returns {Promise<Array<object>>} Una promesa que resuelve a un array de objetos de lote, ya mapeados.
 */
export const getInventoryLotsByProductIdAPI = async (productId) => {
  const response = await api.get('/inventory-lots', {
    params: { product_id: productId }
  });
  // La respuesta es un array directo, se usa el mapeador de arrays para estandarizar los IDs.
  return mapArrayToId(response.data);
};