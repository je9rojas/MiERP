// /frontend/src/api/productsAPI.js

import api from './axiosConfig';

/**
 * Envía los datos de un nuevo producto al backend para su creación.
 * @param {object} productData - Los datos del producto del formulario.
 * @returns {Promise<object>} - La respuesta de la API con el producto creado.
 */
export const createProductAPI = async (productData) => {
  const response = await api.post('/products/', productData);
  return response.data;
};


/**
 * Obtiene una lista paginada y filtrada de productos desde el backend.
 * @param {object} params - Objeto con los parámetros de consulta (page, pageSize, search, etc.)
 */
export const getProductsAPI = async (params) => {
  // `URLSearchParams` maneja correctamente los parámetros undefined o vacíos
  const response = await api.get('/products/', { params }); 
  return response.data;
};


// Tu función de catálogo puede permanecer aquí si la sigues usando
export const generateCatalogAPI = async (payload) => {
  // ...
};


/**
 * Obtiene los datos de un único producto por su SKU.
 * @param {string} sku - El SKU del producto a obtener.
 * @returns {Promise<object>} - Los datos del producto.
 */
export const getProductBySkuAPI = async (sku) => {
  const response = await api.get(`/products/${sku}`);
  return response.data;
};

/**
 * Envía los datos actualizados de un producto al backend.
 * @param {string} sku - El SKU del producto a actualizar.
 * @param {object} productData - Los datos actualizados del producto.
 * @returns {Promise<object>} - El producto con los datos actualizados.
 */
export const updateProductAPI = async (sku, productData) => {
  const response = await api.put(`/products/${sku}`, productData);
  return response.data;
};


/**
 * Envía una petición para desactivar (soft delete) un producto por su SKU.
 * @param {string} sku - El SKU del producto a desactivar.
 * @returns {Promise<void>}
 */
export const deactivateProductAPI = async (sku) => {
  await api.delete(`/products/${sku}`);
};

