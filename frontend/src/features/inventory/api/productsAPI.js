// /frontend/src/features/inventory/api/productsAPI.js

import api from '../../../app/axiosConfig';

/**
 * Envía los datos de un nuevo producto al backend para su creación.
 * @param {object} productData - Los datos del producto del formulario.
 * @returns {Promise<object>} - La respuesta de la API con el producto creado.
 */
export const createProductAPI = async (productData) => {
  // --- INICIO DEL DETECTIVE #3 ---
  console.log("🕵️ DETECTIVE #3 [productsAPI]: Datos a punto de ser enviados por Axios:", productData);
  // --- FIN DEL DETECTIVE #3 ---
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


/**
 * Solicita la generación de un catálogo en PDF al backend.
 * @param {object} payload - Los filtros para el catálogo (search_term, product_types, view_type).
 * @returns {Promise<Blob>} - Una promesa que resuelve a un Blob de PDF.
 */
export const generateCatalogAPI = async (payload) => {
  console.log('[API] Solicitando catálogo con payload:', payload); // Para depuración
  const response = await api.post('/products/catalog', payload, {
    // ¡ESTO ES CRUCIAL! Le dice a Axios que la respuesta es un archivo, no JSON.
    responseType: 'blob', 
  });
  return response.data; // response.data será el Blob del PDF
};


/**
 * Obtiene los datos de un único producto por su SKU.
 * @param {string} sku - El SKU del producto a obtener.
 * @returns {Promise<object>} - Los datos del producto.
 */
export const getProductBySkuAPI = async (sku) => {
  const encodedSku = encodeURIComponent(sku);
  const response = await api.get(`/products/${encodedSku}`);
  return response.data;
};

/**
 * Envía los datos actualizados de un producto al backend.
 * @param {string} sku - El SKU del producto a actualizar.
 * @param {object} productData - Los datos actualizados del producto.
 * @returns {Promise<object>} - El producto con los datos actualizados.
 */
export const updateProductAPI = async (sku, productData) => {
  const encodedSku = encodeURIComponent(sku);
  const response = await api.put(`/products/${encodedSku}`, productData);
  return response.data;
};


/**
 * Envía una petición para desactivar (soft delete) un producto por su SKU.
 * @param {string} sku - El SKU del producto a desactivar.
 * @returns {Promise<void>}
 */
export const deactivateProductAPI = async (sku) => {

  const encodedSku = encodeURIComponent(sku);
  await api.delete(`/products/${encodedSku}`);

};

