// File: /frontend/src/features/sales/api/salesAPI.js

/**
 * @file Contiene todas las funciones para interactuar con los endpoints del Módulo de Ventas.
 *
 * @description Este módulo actúa como una capa de abstracción sobre las llamadas de red (Axios)
 * para las entidades del flujo "Order-to-Cash". Todos los endpoints que devuelven
 * datos de la base de datos aplican una capa de mapeo (Capa Anticorrupción) para
 * estandarizar el formato de los datos (ej. _id -> id) antes de que sean utilizados
 * por la aplicación.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import api from '../../../app/axiosConfig';
import { mapPaginatedApiResponse, mapApiToFrontend } from '../../../utils/dataMappers';

// ==============================================================================
// SECCIÓN 2: FUNCIONES DE API PARA ÓRDENES DE VENTA (SALES ORDERS)
// ==============================================================================

/**
 * Envía los datos de una nueva orden de venta al backend para su creación.
 * @param {object} salesOrderData - El payload con los datos de la orden de venta desde el formulario.
 * @returns {Promise<object>} Una promesa que resuelve con los datos de la orden de venta creada y transformada.
 */
export const createSalesOrderAPI = async (salesOrderData) => {
  const response = await api.post('/sales/orders', salesOrderData);
  return mapApiToFrontend(response.data);
};

/**
 * Obtiene una lista paginada y filtrada de órdenes de venta.
 * @param {object} params - Objeto con parámetros de consulta (ej. { page, pageSize, search, status }).
 * @returns {Promise<object>} Una promesa que resuelve con la respuesta paginada y transformada.
 */
export const getSalesOrdersAPI = async (params) => {
  const response = await api.get('/sales/orders', { params });
  return mapPaginatedApiResponse(response.data);
};

/**
 * Obtiene los datos detallados de una única orden de venta por su ID.
 * @param {string} orderId - El ID de la orden de venta a obtener.
 * @returns {Promise<object>} Una promesa que resuelve con los datos de la orden de venta transformados.
 */
export const getSalesOrderByIdAPI = async (orderId) => {
  const response = await api.get(`/sales/orders/${orderId}`);
  return mapApiToFrontend(response.data);
};

/**
 * Envía los datos actualizados de una orden de venta para su modificación.
 * @param {string} orderId - El ID de la orden de venta a actualizar.
 * @param {object} updateData - El payload con los campos a actualizar.
 * @returns {Promise<object>} Una promesa que resuelve con los datos de la orden de venta actualizada y transformada.
 */
export const updateSalesOrderAPI = async (orderId, updateData) => {
  const response = await api.patch(`/sales/orders/${orderId}`, updateData);
  return mapApiToFrontend(response.data);
};

/**
 * Envía una petición para confirmar una orden de venta.
 * @param {string} orderId - El ID de la orden de venta a confirmar.
 * @returns {Promise<object>} Una promesa que resuelve con los datos de la orden de venta actualizada y transformada.
 */
export const confirmSalesOrderAPI = async (orderId) => {
  const response = await api.patch(`/sales/orders/${orderId}/confirm`);
  return mapApiToFrontend(response.data);
};

// ==============================================================================
// SECCIÓN 3: FUNCIONES DE API PARA DESPACHOS (SHIPMENTS)
// ==============================================================================

/**
 * Envía los datos de un nuevo despacho al backend para su procesamiento.
 * @param {string} orderId - El ID de la Orden de Venta de origen.
 * @param {object} shipmentData - El payload con los datos del despacho.
 * @returns {Promise<object>} Una promesa que resuelve con los datos del despacho recién creado y transformado.
 */
export const createShipmentAPI = async (orderId, shipmentData) => {
  const response = await api.post(`/sales/orders/${orderId}/shipments`, shipmentData);
  return mapApiToFrontend(response.data);
};

/**
 * Obtiene una lista paginada y filtrada de todos los despachos.
 * @param {object} params - Objeto con parámetros de consulta (ej. { page, pageSize, search }).
 * @returns {Promise<object>} Una promesa que resuelve con la respuesta paginada y transformada.
 */
export const getShipmentsAPI = async (params) => {
  const response = await api.get('/sales/shipments', { params });
  return mapPaginatedApiResponse(response.data);
};

/**
 * Obtiene los datos detallados de un único despacho por su ID.
 * @param {string} shipmentId - El ID del despacho a obtener.
 * @returns {Promise<object>} Una promesa que resuelve con los datos del despacho transformados.
 */
export const getShipmentByIdAPI = async (shipmentId) => {
  const response = await api.get(`/sales/shipments/${shipmentId}`);
  return mapApiToFrontend(response.data);
};