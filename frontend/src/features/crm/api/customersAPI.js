// /frontend/src/features/crm/api/customersAPI.js

/**
 * @file Contiene todas las funciones para interactuar con los endpoints de Clientes (Customers).
 *
 * Este módulo actúa como una capa de abstracción sobre las llamadas de red (Axios)
 * para la entidad 'Customer'. Se encarga de la comunicación con el backend y del
 * mapeo inicial de las respuestas para estandarizar el formato de los datos.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import api from '../../../app/axiosConfig';
import { mapPaginatedResponse, mapItemToId } from '../../../utils/dataMappers';

// ==============================================================================
// SECCIÓN 2: DEFINICIÓN DE LAS FUNCIONES DE API
// ==============================================================================

/**
 * Obtiene una lista paginada y filtrada de clientes desde la API.
 * @param {object} params - Parámetros de consulta (ej. { page, pageSize, search }).
 * @returns {Promise<object>} Un objeto con `total_count` y una lista de `items` (clientes).
 */
export const getCustomersAPI = async (params) => {
  const response = await api.get('/customers', { params });
  return mapPaginatedResponse(response.data);
};

/**
 * Obtiene los datos detallados de un único cliente por su ID.
 * @param {string} customerId - El ID del cliente a recuperar.
 * @returns {Promise<object>} Los datos del cliente mapeados.
 */
export const getCustomerByIdAPI = async (customerId) => {
  const response = await api.get(`/customers/${customerId}`);
  return mapItemToId(response.data);
};

/**
 * Envía los datos de un nuevo cliente al backend para su creación.
 * @param {object} customerData - El payload con los datos del nuevo cliente.
 * @returns {Promise<object>} El cliente recién creado, mapeado.
 */
export const createCustomerAPI = async (customerData) => {
  const response = await api.post('/customers', customerData);
  return mapItemToId(response.data);
};

/**
 * Envía los datos actualizados de un cliente para su modificación.
 * @param {string} customerId - El ID del cliente a actualizar.
 * @param {object} updateData - El payload con los campos a modificar.
 * @returns {Promise<object>} El cliente actualizado, mapeado.
 */
export const updateCustomerAPI = async (customerId, updateData) => {
  const response = await api.put(`/customers/${customerId}`, updateData);
  return mapItemToId(response.data);
};