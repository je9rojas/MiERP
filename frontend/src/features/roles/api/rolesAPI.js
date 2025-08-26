// File: /frontend/src/features/roles/api/rolesAPI.js

/**
 * @file Contiene todas las funciones para interactuar con los endpoints de Roles.
 * @description Centraliza la comunicación con la API para la gestión de roles
 * y aplica la capa de mapeo para estandarizar los datos.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import api from '../../../app/axiosConfig';
import { mapApiToFrontend } from '../../../utils/dataMappers';

// ==============================================================================
// SECCIÓN 2: FUNCIONES DE LA API
// ==============================================================================

/**
 * Obtiene la lista completa de roles disponibles en el sistema.
 * @returns {Promise<Array<object>>} Una promesa que resuelve a la lista de roles, ya transformados.
 */
export const getRolesAPI = async () => {
    // NOTA: Asumiendo que el endpoint es '/roles'. Ajustar si es diferente.
    const response = await api.get('/roles');
    // La respuesta es un array, que `mapApiToFrontend` puede manejar recursivamente.
    return mapApiToFrontend(response.data);
};