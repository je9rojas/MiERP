// /frontend/src/features/sales/api/salesAPI.js

/**
 * @file Contiene todas las funciones para interactuar con los endpoints de Órdenes de Venta del backend.
 *
 * Este módulo actúa como una capa de abstracción sobre las llamadas de red (Axios),
 * proporcionando un conjunto de funciones claras y reutilizables para que los
 * componentes y hooks del módulo de ventas puedan solicitar o enviar datos
 * sin conocer los detalles de la implementación de la API.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import api from '../../../app/axiosConfig';

// ==============================================================================
// SECCIÓN 2: FUNCIONES DE LA API
// ==============================================================================

/**
 * Envía los datos de una nueva orden de venta al backend para su creación.
 * @param {object} salesOrderData - El payload con los datos de la orden de venta desde el formulario.
 * @returns {Promise<object>} Una promesa que resuelve con los datos de la orden de venta recién creada.
 */
export const createSalesOrderAPI = async (salesOrderData) => {
    const response = await api.post('/sales-orders', salesOrderData);
    return response.data;
};

/**
 * Obtiene una lista paginada y filtrada de órdenes de venta.
 * (Implementación futura)
 * @param {object} params - Objeto con parámetros de consulta (ej. { page, pageSize, search, status }).
 * @returns {Promise<object>} Una promesa que resuelve con la respuesta paginada.
 */
export const getSalesOrdersAPI = async (params) => {
    const response = await api.get('/sales-orders', { params });
    return response.data;
};

/**
 * Obtiene los datos detallados de una única orden de venta por su ID.
 * (Implementación futura)
 * @param {string} orderId - El ID de la orden de venta a obtener.
 * @returns {Promise<object>} Una promesa que resuelve con los datos de la orden de venta.
 */
export const getSalesOrderByIdAPI = async (orderId) => {
    const response = await api.get(`/sales-orders/${orderId}`);
    return response.data;
};

// En el futuro, podrías añadir más funciones aquí, como:
// export const updateSalesOrderStatusAPI = (orderId, status) => api.post(...);