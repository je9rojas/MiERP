// /frontend/src/features/admin/api/dataManagementAPI.js

import api from '../../../app/axiosConfig';

/**
 * Solicita al backend la exportación de todos los productos en formato CSV.
 * @returns {Promise<Blob>} Una promesa que resuelve a un Blob de tipo CSV.
 */
export const exportProductsAPI = async () => {
    const response = await api.get('/data/export/products', {
        responseType: 'blob',
    });
    return response.data;
};

// --- AÑADE ESTA NUEVA FUNCIÓN COMPLETA ---

/**
 * Sube un archivo CSV de productos al backend para su importación.
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