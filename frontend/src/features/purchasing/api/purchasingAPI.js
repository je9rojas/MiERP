// frontend/src/features/purchasing/api/purchasingAPI.js

/**
 * @file Contiene todas las funciones para interactuar con los endpoints de Órdenes de Compra del backend.
 *
 * Este módulo actúa como una capa de abstracción sobre las llamadas de red (Axios).
 * Centraliza la lógica de comunicación con la API de compras, garantizando que
 * los componentes no necesiten conocer los detalles de la implementación.
 *
 * Se aplica una capa de mapeo a las respuestas para estandarizar el modelo de datos
 * (ej. '_id' a 'id') antes de ser entregado a la aplicación, lo que asegura
 * consistencia y reduce la complejidad en los componentes.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import api from '../../../app/axiosConfig';
// Se importan los mapeadores para transformar las respuestas complejas de las órdenes de compra.
import { mapPaginatedResponse, mapPurchaseOrderResponse } from '../mappers/purchaseOrderMappers';

// ==============================================================================
// SECCIÓN 2: FUNCIONES DE LA API
// ==============================================================================

/**
 * Obtiene una lista paginada y filtrada de órdenes de compra.
 * @param {object} params - Objeto con parámetros de consulta (ej. { page, pageSize, search }).
 * @returns {Promise<object>} Una promesa que resuelve con la respuesta paginada y ya mapeada.
 */
export const getPurchaseOrdersAPI = async (params) => {
    const response = await api.get('/purchase-orders', { params });
    // Se aplica el mapeador a la respuesta paginada para estandarizar los IDs.
    return mapPaginatedResponse(response.data);
};

/**
 * Obtiene los datos detallados de una única orden de compra por su ID.
 * @param {string} orderId - El ID de la orden de compra a obtener.
 * @returns {Promise<object>} Una promesa que resuelve con los datos de la orden de compra, ya mapeados.
 */
export const getPurchaseOrderByIdAPI = async (orderId) => {
    const response = await api.get(`/purchase-orders/${orderId}`);
    // Se usa el mapeador específico para la estructura compleja de una orden de compra.
    return mapPurchaseOrderResponse(response.data);
};

/**
 * Envía los datos de una nueva orden de compra al backend para su creación.
 * @param {object} purchaseOrderData - El payload con los datos de la orden de compra desde el formulario.
 * @returns {Promise<object>} Una promesa que resuelve con los datos de la orden de compra recién creada y ya mapeada.
 */
export const createPurchaseOrderAPI = async (purchaseOrderData) => {
    const response = await api.post('/purchase-orders', purchaseOrderData);
    // Se mapea la respuesta para asegurar consistencia desde el momento de la creación.
    return mapPurchaseOrderResponse(response.data);
};

/**
 * Envía los datos actualizados de una orden de compra para su modificación.
 * @param {string} orderId - El ID de la orden de compra a actualizar.
 * @param {object} updateData - El payload con los campos a actualizar.
 * @returns {Promise<object>} Una promesa que resuelve con los datos de la orden de compra actualizada y mapeada.
 */
export const updatePurchaseOrderAPI = async (orderId, updateData) => {
    const response = await api.patch(`/purchase-orders/${orderId}`, updateData);
    // Se mapea la respuesta para asegurar que la UI reciba los datos actualizados de forma consistente.
    return mapPurchaseOrderResponse(response.data);
};

/**
 * Envía una petición para cambiar el estado de una orden de compra (ej. aprobar, cancelar).
 * @param {string} orderId - El ID de la orden de compra.
 * @param {string} action - La acción a realizar (ej. 'approve', 'cancel').
 * @returns {Promise<object>} Una promesa que resuelve con los datos de la orden de compra actualizada y mapeada.
 */
export const updatePurchaseOrderStatusAPI = async (orderId, action) => {
    const response = await api.post(`/purchase-orders/${orderId}/status`, { action });
    // Se mapea la respuesta para mantener la consistencia de los datos.
    return mapPurchaseOrderResponse(response.data);
};