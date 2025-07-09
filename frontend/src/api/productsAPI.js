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
 * Obtiene la lista de todos los productos.
 */
export const getProductsAPI = async () => {
  const response = await api.get('/products/');
  return response.data;
};


// Tu función de catálogo puede permanecer aquí si la sigues usando
export const generateCatalogAPI = async (payload) => {
  // ...
};