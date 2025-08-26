// /frontend/src/utils/dataMappers.js

/**
 * @file Utilidades genéricas para la transformación de datos (Mappers).
 *
 * @description Este archivo centraliza funciones comunes para mapear datos entre
 * la API y la UI, siguiendo el principio DRY (Don't Repeat Yourself). La principal
 * responsabilidad es normalizar las respuestas de la API, como la conversión de
 * `_id` a `id` de forma recursiva, para que sean compatibles con los componentes
 * del frontend (ej. MUI DataGrid) de manera consistente.
 */

// ==============================================================================
// SECCIÓN 1: MAPEADORES DE RESPUESTA (API -> UI)
// ==============================================================================

/**
 * Mapea un único objeto de la API a un formato compatible con la UI de forma RECURSIVA.
 * Navega a través del objeto y sus propiedades anidadas (incluyendo arrays) y
 * convierte cualquier campo `_id` que encuentre a `id`, eliminando el original.
 * @param {any} data - El dato a transformar (puede ser objeto, array, o primitivo).
 * @returns {any} El dato completamente transformado.
 */
export const mapItemToId = (data) => {
  // Si el dato no es un objeto (o es nulo), no hay nada que transformar.
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  // Si el dato es un array, aplica la transformación a cada elemento.
  if (Array.isArray(data)) {
    return data.map(item => mapItemToId(item));
  }

  // --- LÓGICA PRINCIPAL PARA OBJETOS ---
  // 1. Crea una copia del objeto para trabajar sobre ella.
  const newObj = { ...data };

  // 2. Si el objeto actual tiene una propiedad '_id', la renombra a 'id'.
  if (Object.prototype.hasOwnProperty.call(newObj, '_id')) {
    newObj.id = newObj._id;
    delete newObj._id;
  }

  // 3. Itera sobre todas las claves del nuevo objeto para procesar sus valores.
  for (const key in newObj) {
    if (Object.prototype.hasOwnProperty.call(newObj, key)) {
      // Llama recursivamente a la función para transformar propiedades anidadas.
      newObj[key] = mapItemToId(newObj[key]);
    }
  }

  return newObj;
};

/**
 * Aplica la transformación `mapItemToId` a cada elemento de un array.
 * (Esta función ahora es una simple envoltura, ya que mapItemToId maneja arrays).
 * @param {Array<object>} items - El array de objetos recibido de la API.
 * @returns {Array<object>} El array con todos sus objetos transformados.
 */
export const mapArrayToId = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }
  return items.map(mapItemToId);
};

/**
 * Mapea una respuesta paginada completa de la API, aplicando la transformación
 * `mapItemToId` a la lista de ítems.
 * @param {object} paginatedResponse - El objeto de respuesta paginada de la API.
 * @returns {object} La respuesta paginada con sus ítems transformados.
 */
export const mapPaginatedResponse = (paginatedResponse) => {
  if (!paginatedResponse || !paginatedResponse.items) {
    return { items: [], total_count: 0 };
  }
  
  return {
    ...paginatedResponse,
    items: mapArrayToId(paginatedResponse.items),
  };
};