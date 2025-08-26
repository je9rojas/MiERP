// File: /frontend/src/features/users/api/usersAPI.js

/**
 * @file Contiene todas las funciones para interactuar con los endpoints de Usuarios.
 * @description Este módulo encapsula las llamadas a la API para la entidad 'User',
 * aplicando la capa anticorrupción para estandarizar los datos (`_id` -> `id`)
 * antes de que lleguen a la aplicación.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import api from '../../../app/axiosConfig';
import { mapPaginatedApiResponse, mapApiToFrontend } from '../../../utils/dataMappers';

// ==============================================================================
// SECCIÓN 2: FUNCIONES DE LA API
// ==============================================================================

/**
 * Obtiene una lista paginada de usuarios desde el backend.
 * @param {object} params - Parámetros de consulta (ej. page, pageSize).
 * @returns {Promise<object>} Una promesa que resuelve a la respuesta paginada y transformada.
 */
export const getUsersAPI = async (params) => {
  // NOTA: Asumiendo que el endpoint es '/users'. Ajustar si es diferente (ej. '/admin/users').
  const response = await api.get('/users', { params });
  return mapPaginatedApiResponse(response.data);
};

/**
 * Obtiene los datos de un único usuario por su ID.
 * @param {string} userId - El ID del usuario.
 * @returns {Promise<object>} Los datos del usuario, ya transformados.
 */
export const getUserByIdAPI = async (userId) => {
  const response = await api.get(`/users/${userId}`);
  return mapApiToFrontend(response.data);
};

/**
 * Envía los datos de un nuevo usuario al backend para su creación.
 * @param {object} userData - Los datos del usuario del formulario.
 * @returns {Promise<object>} El usuario creado, ya transformado.
 */
export const createUserAPI = async (userData) => {
  const response = await api.post('/users', userData);
  return mapApiToFrontend(response.data);
};

/**
 * Envía los datos actualizados de un usuario al backend.
 * @param {string} userId - El ID del usuario a actualizar.
 * @param {object} userData - Los datos actualizados.
 * @returns {Promise<object>} El usuario actualizado, ya transformado.
 */
export const updateUserAPI = async (userId, userData) => {
  const response = await api.put(`/users/${userId}`, userData);
  return mapApiToFrontend(response.data);
};

/**
 * Envía una petición para desactivar (borrado lógico) un usuario por su ID.
 * @param {string} userId - El ID del usuario a desactivar.
 * @returns {Promise<void>} Una promesa que se resuelve al finalizar.
 */
export const deactivateUserAPI = async (userId) => {
  // NOTA: Usualmente el borrado lógico se hace con PATCH o DELETE.
  // Asumiendo DELETE por el nombre de tu función original.
  await api.delete(`/users/${userId}`);
};