// File: /frontend/src/features/admin/api/dataManagementAPI.js

/**
 * @file Módulo de API para la gestión de datos (importación/exportación).
 * @description Encapsula las llamadas de Axios a los endpoints del backend
 * relacionados con la importación y exportación de datos maestros y transaccionales.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import api from '../../../app/axiosConfig';

// ==============================================================================
// SECCIÓN 2: DEFINICIÓN DE ENDPOINTS
// ==============================================================================

const ENDPOINTS = {
    EXPORT_PRODUCTS: '/data/export/products',
    IMPORT_PRODUCTS: '/data/import/products',
    IMPORT_INITIAL_INVENTORY: '/purchasing/orders/upload-initial-inventory',
};

// ==============================================================================
// SECCIÓN 3: FUNCIONES DE API PARA EXPORTACIÓN
// ==============================================================================

/**
 * Solicita al backend la exportación de todos los productos en formato CSV.
 * @returns {Promise<Blob>} Una promesa que resuelve a un objeto Blob de tipo CSV.
 * @throws {Error} Si la petición a la API falla.
 */
export const exportProductsAPI = async () => {
    const response = await api.get(ENDPOINTS.EXPORT_PRODUCTS, {
        // `responseType: 'blob'` es crucial para que Axios maneje la respuesta como un archivo binario.
        responseType: 'blob',
    });
    return response.data;
};


// ==============================================================================
// SECCIÓN 4: FUNCIONES DE API PARA IMPORTACIÓN
// ==============================================================================

/**
 * Sube un archivo CSV de catálogo de productos al backend para su importación masiva.
 * @param {File} file - El archivo CSV seleccionado por el usuario.
 * @returns {Promise<object>} Una promesa que resuelve con el resultado de la importación (resumen, errores, etc.).
 * @throws {Error} Si la subida del archivo o el proceso de importación fallan.
 */
export const importProductsAPI = async (file) => {
    // `FormData` es el formato estándar para enviar archivos en peticiones HTTP.
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post(ENDPOINTS.IMPORT_PRODUCTS, formData, {
        // El navegador establece automáticamente el `Content-Type` correcto para `multipart/form-data`
        // cuando se usa un objeto FormData, por lo que no es estrictamente necesario definirlo.
    });

    return response.data;
};

/**
 * Sube un archivo CSV de inventario inicial para crear una orden de compra de apertura.
 * @param {File} file - El archivo CSV con las columnas requeridas (sku, quantity, cost).
 * @returns {Promise<object>} Una promesa que resuelve con los datos de la orden de compra creada.
 * @throws {Error} Si la subida o el procesamiento del inventario fallan.
 */
export const importInitialInventoryAPI = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(ENDPOINTS.IMPORT_INITIAL_INVENTORY, formData);

    // NOTA: Si esta respuesta devolviera la orden de compra creada, idealmente
    // se importaría `mapApiToFrontend` para transformarla aquí y mantener la consistencia.
    // Por ahora, se asume que la página que llama a esta función se encarga de re-validar los datos si es necesario.
    return response.data;
};