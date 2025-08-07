// frontend/src/features/reports/api/reportsAPI.js

/**
 * @file Contiene todas las funciones para interactuar con los endpoints de reportes del backend.
 *
 * Este módulo actúa como una capa de abstracción sobre las llamadas de red (Axios)
 * para la generación de todo tipo de reportes, como catálogos, informes de ventas, etc.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import api from '../../../app/axiosConfig';

// ==============================================================================
// SECCIÓN 2: FUNCIONES DE LA API
// ==============================================================================

/**
 * Solicita la generación de un catálogo de productos en PDF al backend.
 * 
 * La API aplica los filtros con la siguiente prioridad:
 * 1. Si se proporciona `product_skus`, se genera un catálogo solo con esos productos.
 * 2. Si no, si se proporciona `product_types`, se genera un catálogo con productos de esos tipos.
 * 3. `search_term` se aplica como un filtro adicional en los casos 2 y 3.
 * 
 * @param {object} payload - El cuerpo de la petición con los filtros para el catálogo.
 * @param {'client' | 'seller'} payload.view_type - El tipo de vista para el catálogo (con o sin datos comerciales).
 * @param {string[]} [payload.product_skus] - (Prioridad 1) Lista de SKUs para un catálogo personalizado.
 * @param {string[]} [payload.product_types] - (Prioridad 2) Lista de tipos de producto para un catálogo temático.
 * @param {string} [payload.search_term] - (Prioridad 3) Término de búsqueda general por SKU o nombre.
 * 
 * @returns {Promise<Blob>} Una promesa que resuelve a un objeto Blob que representa el archivo PDF.
 */
export const generateCatalogAPI = async (payload) => {
  const response = await api.post('/reports/catalog', payload, {
    // Es crucial indicarle a Axios que la respuesta esperada es un archivo binario.
    responseType: 'blob',
  });
  return response.data;
};