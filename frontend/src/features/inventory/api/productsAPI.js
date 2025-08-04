/**
 * @file Contiene todas las funciones para interactuar con los endpoints de productos del backend.
 *
 * Este módulo actúa como una capa de abstracción sobre las llamadas de red (Axios),
 * proporcionando un conjunto de funciones claras y reutilizables para que los
 * componentes y hooks de la aplicación puedan solicitar o enviar datos de productos
 * sin conocer los detalles de la implementación de la API.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import api from '../../../app/axiosConfig';

// ==============================================================================
// SECCIÓN 2: FUNCIONES DE LA API
// ==============================================================================

/**
 * Envía los datos de un nuevo producto al backend para su creación.
 * @param {object} productData - El payload del producto desde el formulario.
 * @returns {Promise<object>} Una promesa que resuelve con los datos del producto creado.
 */
export const createProductAPI = async (productData) => {
  const response = await api.post('/products/', productData);
  return response.data;
};

/**
 * Obtiene una lista paginada y filtrada de productos desde el backend.
 * @param {object} params - Objeto con parámetros de consulta (page, pageSize, search, etc.).
 * @returns {Promise<object>} Una promesa que resuelve con la respuesta paginada (items, total_count).
 */
export const getProductsAPI = async (params) => {
  const response = await api.get('/products/', { params });
  return response.data;
};

/**
 * Obtiene los datos completos de un único producto por su SKU.
 * @param {string} sku - El SKU del producto a obtener.
 * @returns {Promise<object>} Una promesa que resuelve con los datos del producto encontrado.
 */
export const getProductBySkuAPI = async (sku) => {
  // Aseguramos que el SKU se codifique correctamente para la URL, por si contiene caracteres especiales.
  const encodedSku = encodeURIComponent(sku);
  const response = await api.get(`/products/${encodedSku}`);
  return response.data;
};

/**
 * Envía los datos actualizados de un producto al backend para una actualización parcial.
 * @param {string} sku - El SKU del producto a actualizar.
 * @param {object} productData - El payload con los campos a actualizar.
 * @returns {Promise<object>} Una promesa que resuelve con los datos del producto ya actualizado.
 */
export const updateProductAPI = async (sku, productData) => {
  const encodedSku = encodeURIComponent(sku);
  // Se utiliza el método PATCH, que es el estándar para actualizaciones parciales.
  const response = await api.patch(`/products/${encodedSku}`, productData);
  return response.data;
};

/**
 * Envía una petición para desactivar (borrado lógico) un producto por su SKU.
 * @param {string} sku - El SKU del producto a desactivar.
 * @returns {Promise<void>} Una promesa que se resuelve cuando la operación ha finalizado.
 */
export const deactivateProductAPI = async (sku) => {
  const encodedSku = encodeURIComponent(sku);
  await api.delete(`/products/${encodedSku}`);
};

/**
 * Solicita la generación de un catálogo en PDF al backend.
 * @param {object} payload - Los filtros para el catálogo (search_term, product_types, view_type).
 * @returns {Promise<Blob>} Una promesa que resuelve a un objeto Blob que representa el archivo PDF.
 */
export const generateCatalogAPI = async (payload) => {
  const response = await api.post('/products/catalog', payload, {
    // Es crucial indicarle a Axios que la respuesta esperada es un archivo binario.
    responseType: 'blob',
  });
  return response.data;
};