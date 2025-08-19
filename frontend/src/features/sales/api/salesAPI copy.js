// /frontend/src/features/sales/api/salesAPI.js

/**
 * @file Contiene todas las funciones para interactuar con los endpoints del Módulo de Ventas.
 *
 * Este módulo actúa como una capa de abstracción sobre las llamadas de red (Axios) para
 * las entidades del flujo "Order-to-Cash": Órdenes de Venta y Despachos.
 * Aplica una capa de mapeo a las respuestas para estandarizar el modelo de datos.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import api from '../../../app/axiosConfig';
// Reutilizamos los mappers de compras, ya que la lógica de estandarización de IDs es idéntica.
import { mapPaginatedResponse, mapPurchaseOrderResponse as mapSalesResponse } from '../../purchasing/mappers/purchaseOrderMappers';

// ==============================================================================
// SECCIÓN 2: FUNCIONES DE API PARA ÓRDENES DE VENTA (SALES ORDERS)
// ==============================================================================

/**
 * Envía los datos de una nueva orden de venta al backend para su creación.
 * @param {object} salesOrderData - El payload con los datos de la orden de venta desde el formulario.
 * @returns {Promise<object>} Una promesa que resuelve con los datos de la orden de venta creada y mapeada.
 */
export const createSalesOrderAPI = async (salesOrderData) => {
    const response = await api.post('/sales/orders', salesOrderData);
    return mapSalesResponse(response.data);
};

/**
 * Obtiene una lista paginada y filtrada de órdenes de venta.
 * @param {object} params - Objeto con parámetros de consulta (ej. { page, pageSize, search, status }).
 * @returns {Promise<object>} Una promesa que resuelve con la respuesta paginada y mapeada.
 */
export const getSalesOrdersAPI = async (params) => {
    const response = await api.get('/sales/orders', { params });
    return mapPaginatedResponse(response.data);
};

/**
 * Obtiene los datos detallados de una única orden de venta por su ID.
 * @param {string} orderId - El ID de la orden de venta a obtener.
 * @returns {Promise<object>} Una promesa que resuelve con los datos de la orden de venta mapeados.
 */
export const getSalesOrderByIdAPI = async (orderId) => {
    const response = await api.get(`/sales/orders/${orderId}`);
    return mapSalesResponse(response.data);
};

/**
 * Envía una petición para confirmar una orden de venta.
 * @param {string} orderId - El ID de la orden de venta a confirmar.
 * @returns {Promise<object>} Una promesa que resuelve con los datos de la orden de venta actualizada y mapeada.
 */
export const confirmSalesOrderAPI = async (orderId) => {
    const response = await api.patch(`/sales/orders/${orderId}/confirm`);
    return mapSalesResponse(response.data);
};

// ==============================================================================
// SECCIÓN 3: FUNCIONES DE API PARA DESPACHOS (SHIPMENTS)
// ==============================================================================

/**
 * Envía los datos de un nuevo despacho al backend para su procesamiento.
 * @param {string} orderId - El ID de la Orden de Venta de origen.
 * @param {object} shipmentData - El payload con los datos del despacho.
 * @returns {Promise<object>} Una promesa que resuelve con los datos del despacho recién creado y mapeado.
 */
export const createShipmentAPI = async (orderId, shipmentData) => {
    const response = await api.post(`/sales/orders/${orderId}/shipments`, shipmentData);
    return mapSalesResponse(response.data);
};