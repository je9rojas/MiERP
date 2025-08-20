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
// Se importan los mapeadores genéricos desde la ubicación centralizada.
import { mapPaginatedResponse, mapItemToId } from '../../../utils/dataMappers';

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
  return mapItemToId(response.data);
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
  return mapItemToId(response.data);
};

/**
 * Envía los datos actualizados de una orden de venta para su modificación.
 * @param {string} orderId - El ID de la orden de venta a actualizar.
 * @param {object} updateData - El payload con los campos a actualizar.
 * @returns {Promise<object>} Una promesa que resuelve con los datos de la orden de venta actualizada y mapeada.
 */
export const updateSalesOrderAPI = async (orderId, updateData) => {
  const response = await api.patch(`/sales/orders/${orderId}`, updateData);
  return mapItemToId(response.data);
};

/**
 * Envía una petición para confirmar una orden de venta.
 * @param {string} orderId - El ID de la orden de venta a confirmar.
 * @returns {Promise<object>} Una promesa que resuelve con los datos de la orden de venta actualizada y mapeada.
 */
export const confirmSalesOrderAPI = async (orderId) => {
  const response = await api.patch(`/sales/orders/${orderId}/confirm`);
  return mapItemToId(response.data);
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
  return mapItemToId(response.data);
};

/**
 * Obtiene una lista paginada y filtrada de todos los despachos.
 * @param {object} params - Objeto con parámetros de consulta (ej. { page, pageSize, search }).
 * @returns {Promise<object>} Una promesa que resuelve con la respuesta paginada y mapeada.
 */
export const getShipmentsAPI = async (params) => {
  const response = await api.get('/sales/shipments', { params });
  return mapPaginatedResponse(response.data);
};

/**
 * Obtiene los datos detallados de un único despacho por su ID.
 * @param {string} shipmentId - El ID del despacho a obtener.
 * @returns {Promise<object>} Una promesa que resuelve con los datos del despacho mapeados.
 */
export const getShipmentByIdAPI = async (shipmentId) => {
  const response = await api.get(`/sales/shipments/${shipmentId}`);
  return mapItemToId(response.data);
};