// /frontend/src/features/reports/api/reportsAPI.js

/**
 * @file Contiene todas las funciones para interactuar con los endpoints de reportes del backend.
 *
 * Este módulo actúa como una capa de abstracción sobre las llamadas de red (Axios)
 * para la generación de todo tipo de reportes, como catálogos y documentos de venta.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import api from '../../../app/axiosConfig';

// ==============================================================================
// SECCIÓN 2: FUNCIONES DE LA API
// ==============================================================================

/**
 * Solicita la generación de un documento PDF para una Orden de Venta específica.
 * El backend determinará si el documento es una "Proforma" o una "Orden de Venta"
 * basándose en el estado de la orden.
 *
 * @param {string} orderId - El ID de la Orden de Venta a imprimir.
 *
 * @returns {Promise<{blob: Blob, filename: string}>} Una promesa que resuelve a un objeto
 * conteniendo el Blob del archivo PDF y el nombre de archivo sugerido por el servidor.
 * @throws {Error} Si la respuesta del servidor no es un PDF o no se puede extraer el nombre del archivo.
 */
export const generateSalesOrderPDFAPI = async (orderId) => {
    const response = await api.get(`/reports/sales/orders/${orderId}/print`, {
        responseType: 'blob', // Fundamental para manejar respuestas de archivos.
    });

    const contentDisposition = response.headers['content-disposition'];
    let filename = 'documento.pdf'; // Nombre de archivo por defecto.

    if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch.length > 1) {
            filename = filenameMatch[1];
        }
    }

    if (response.data.type !== 'application/pdf') {
        throw new Error('La respuesta del servidor no es un archivo PDF válido.');
    }
    
    return {
        blob: response.data,
        filename: filename
    };
};

/**
 * Solicita la generación de un catálogo de productos en PDF al backend.
 * 
 * @param {object} payload - El cuerpo de la petición con los filtros para el catálogo.
 * @param {'client' | 'seller'} payload.view_type - El tipo de vista para el catálogo.
 * @param {string[]} [payload.product_skus] - Lista de SKUs para un catálogo personalizado.
 * @param {string[]} [payload.brands] - Lista de marcas para filtrar.
 * @param {string[]} [payload.product_types] - Lista de tipos de producto para filtrar.
 * 
 * @returns {Promise<{blob: Blob, filename: string}>} Una promesa que resuelve a un objeto
 * conteniendo el Blob del PDF y el nombre del archivo.
 */
export const generateCatalogAPI = async (payload) => {
  const response = await api.post('/reports/catalog', payload, {
    responseType: 'blob',
  });

  const contentDisposition = response.headers['content-disposition'];
  let filename = 'catalogo_productos.pdf';

  if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
      if (filenameMatch && filenameMatch.length > 1) {
          filename = filenameMatch[1];
      }
  }

  if (response.data.type !== 'application/pdf') {
      throw new Error('La respuesta del servidor no es un archivo PDF válido.');
  }

  return {
    blob: response.data,
    filename: filename
  };
};