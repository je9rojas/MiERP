// /frontend/src/features/reports/api/reportsAPI.js

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
 * @param {object} payload - Los filtros para el catálogo (search_term, product_types, view_type).
 * @returns {Promise<Blob>} Una promesa que resuelve a un objeto Blob que representa el archivo PDF.
 */
export const generateCatalogAPI = async (payload) => {
  const response = await api.post('/reports/catalog', payload, {
    // Es crucial indicarle a Axios que la respuesta esperada es un archivo binario.
    responseType: 'blob',
  });
  return response.data;
};