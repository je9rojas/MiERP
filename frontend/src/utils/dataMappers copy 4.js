// /frontend/src/utils/dataMappers.js

/**
 * @file Utilidades genéricas para la transformación de datos (Mappers).
 *
 * @description Este archivo centraliza funciones comunes para mapear datos entre
 * la API y la UI, siguiendo el principio DRY (Don't Repeat Yourself). La principal
 * responsabilidad es normalizar las respuestas de la API, como la conversión de
 * `_id` a `id`, para que sean compatibles con los componentes del frontend
 * (ej. MUI DataGrid) de manera consistente en toda la aplicación.
 */

// ==============================================================================
// SECCIÓN 1: MAPEADORES DE RESPUESTA (API -> UI)
// ==============================================================================

/**
 * Mapea un único objeto de la API a un formato compatible con la UI.
 * Copia el valor de `_id` a `id` y luego elimina el `_id` original.
 * @param {object | null} item - El objeto individual recibido de la API.
 * @returns {object | null} El objeto transformado, o null si la entrada es nula.
 */
export const mapItemToId = (item) => {
  if (!item) {
    return null;
  }
  
  if (item._id) {
    // --- CORRECCIÓN FINAL Y DEFINITIVA ---
    // 1. Se crea una copia del objeto para no mutar el original.
    const transformedItem = { ...item };
    
    // 2. Se copia el valor de '_id' a una nueva propiedad 'id'.
    transformedItem.id = transformedItem._id;
    
    // 3. Se elimina la propiedad '_id' original para evitar cualquier ambigüedad.
    delete transformedItem._id;
    
    return transformedItem;
  }
  
  // Si el objeto no tiene '_id' (ya fue transformado o no viene de la DB), se devuelve tal cual.
  return item;
};

/**
 * Aplica la transformación `mapItemToId` a cada elemento de un array.
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
 * `mapArrayToId` a la lista de ítems.
 * @param {object} paginatedResponse - El objeto de respuesta paginada de la API.
 * @returns {object} La respuesta paginada con sus ítems transformados.
 */
export const mapPaginatedResponse = (paginatedResponse) => {
  if (!paginatedResponse || !paginatedResponse.items) {
    return { items: [], total_count: 0 };
  }
  
  const result = {
    ...paginatedResponse,
    items: mapArrayToId(paginatedResponse.items),
  };
  
  return result;
};
