// frontend/src/features/admin/api/dataManagementAPI.js

/**
 * @file Módulo de API para la gestión de datos (importación/exportación).
 * @description Encapsula las llamadas de Axios a los endpoints del backend
 * relacionados con la importación y exportación de datos maestros y transaccionales.
 */

// SECCIÓN 1: IMPORTACIONES
import api from '../../../app/axiosConfig';

// SECCIÓN 2: FUNCIONES DE API PARA EXPORTACIÓN
/**
 * Solicita al backend la exportación de todos los productos en formato CSV.
 * @returns {Promise<Blob>} Una promesa que resuelve a un Blob de tipo CSV.
 */
export const exportProductsAPI = async () => {
    const response = await api.get('/data/export/products', {
        responseType: 'blob', // Importante para que Axios maneje la respuesta como un archivo.
    });
    return response.data;
};


// SECCIÓN 3: FUNCIONES DE API PARA IMPORTACIÓN
/**
 * Sube un archivo CSV de catálogo de productos al backend para su importación.
 * @param {File} file - El archivo CSV seleccionado por el usuario.
 * @returns {Promise<object>} El resultado de la importación con un resumen y errores.
 */
export const importProductsAPI = async (file) => {
    // FormData es el formato estándar para enviar archivos en peticiones HTTP.
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post('/data/import/products', formData, {
        // Es crucial especificar el Content-Type para la subida de archivos.
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data;
};

/**
 * Sube un archivo CSV de inventario inicial al backend para crear una orden de compra.
 * @param {File} file - El archivo CSV seleccionado con las columnas (sku, quantity, cost).
 * @returns {Promise<object>} Los datos de la orden de compra de apertura creada.
 */
export const importInitialInventoryAPI = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    // Apunta al nuevo endpoint que creamos en el router de compras.
    const response = await api.post('/purchase-orders/upload-initial-inventory', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data;
};