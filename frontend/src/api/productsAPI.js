// /frontend/src/api/productsAPI.js
// CÓDIGO COMPLETO Y OPTIMIZADO - LISTO PARA COPIAR Y PEGAR

import api from './axiosConfig';

/**
 * Llama al backend para generar un catálogo en PDF basado en filtros y el tipo de vista.
 * @param {object} payload - Objeto que contiene los filtros y el view_type.
 *                          Ej: { search_term: 'filtro', product_types: ['aire'], view_type: 'seller' }
 * @returns {Promise<Blob>} - Una promesa que resuelve con el PDF como un Blob.
 */
export const generateCatalogAPI = async (payload) => {
  const response = await api.post('/products/catalog/generate', payload, {
    // ¡MUY IMPORTANTE! Le decimos a Axios que esperamos un archivo binario (Blob), no JSON.
    responseType: 'blob', 
  });
  // La data de la respuesta ya es el Blob que necesitamos
  return response.data;
};

// Si tienes más llamadas a la API de productos, las puedes añadir aquí.
// export const getProductsAPI = () => api.get('/products');