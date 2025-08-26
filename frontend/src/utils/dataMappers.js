// File: /frontend/src/utils/dataMappers.js

/**
 * @file Central de Mapeadores de Datos (Capa Anticorrupción).
 * @description Este módulo actúa como una capa de traducción entre los datos
 * crudos de la API (que usan `_id` y otros formatos específicos del backend) y
 * el modelo de datos "ideal" del frontend (que consistentemente usa `id` y
 * tipos de datos de JavaScript). Previene la propagación de inconsistencias
 * a través de la aplicación y simplifica la lógica de los componentes.
 */

// ==============================================================================
// SECCIÓN 1: MAPEADORES DE RESPUESTA (API -> FRONTEND)
// ==============================================================================

/**
 * Mapea una entidad o una estructura de datos de la API a un formato
 * compatible con el frontend de forma RECURSIVA.
 * Navega a través del objeto y sus propiedades anidadas (incluyendo arrays) y
 * convierte cualquier campo `_id` que encuentre a `id`, eliminando el original.
 * @param {any} data - El dato a transformar (puede ser objeto, array, o primitivo).
 * @returns {any} El dato completamente transformado y listo para la UI.
 */
export const mapApiToFrontend = (data) => {
  // Si el dato es un primitivo, nulo, o una instancia de Date, no se transforma.
  if (typeof data !== 'object' || data === null || data instanceof Date) {
    return data;
  }

  // Si el dato es un array, aplica la transformación a cada elemento de forma recursiva.
  if (Array.isArray(data)) {
    return data.map(item => mapApiToFrontend(item));
  }

  // --- LÓGICA PRINCIPAL PARA OBJETOS ---
  const newObj = {};

  // Itera sobre todas las claves del objeto original.
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key];
      
      // La transformación clave: si la llave es `_id`, la renombra a `id`.
      if (key === '_id') {
        newObj.id = value;
      } else {
        // Para cualquier otra llave, procesa su valor de forma recursiva.
        newObj[key] = mapApiToFrontend(value);
      }
    }
  }

  return newObj;
};

/**
 * Mapea una respuesta paginada completa de la API, aplicando la transformación
 * `mapApiToFrontend` a la lista de ítems.
 * @param {object} paginatedResponse - El objeto de respuesta paginada de la API.
 * @returns {object} La respuesta paginada con sus ítems transformados.
 */
export const mapPaginatedApiResponse = (paginatedResponse) => {
  if (!paginatedResponse || !Array.isArray(paginatedResponse.items)) {
    return { items: [], total_count: 0 };
  }
  
  return {
    ...paginatedResponse,
    items: mapApiToFrontend(paginatedResponse.items),
  };
};