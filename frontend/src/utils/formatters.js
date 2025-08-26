// File: /frontend/src/utils/formatters.js

/**
 * @file Módulo de utilidades para el formateo de datos.
 * @description Centraliza toda la lógica de formato de datos (monedas, fechas, etc.)
 * para garantizar una presentación consistente en toda la interfaz de usuario.
 * Actúa como la única fuente de verdad para la representación visual de los datos.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import { format as formatDateFns } from 'date-fns';
import { es } from 'date-fns/locale';

// ==============================================================================
// SECCIÓN 2: FORMATEADORES DE MONEDA
// ==============================================================================

/**
 * Formatea un valor numérico como una cadena de moneda en Soles (PEN).
 * Utiliza `toLocaleString` para un formato correcto con separadores de miles.
 * @param {number | null | undefined} value - El valor numérico a formatear.
 * @param {object} [options] - Opciones adicionales de formato.
 * @param {string} [options.currencySymbol='S/'] - El símbolo de la moneda a utilizar.
 * @returns {string} La cadena formateada (ej. "S/ 1,250.75") o un string vacío si el valor es nulo.
 */
export const formatCurrency = (value, options = {}) => {
    const { currencySymbol = 'S/' } = options;
    if (value === null || value === undefined || isNaN(Number(value))) {
        return '';
    }
    const number = Number(value);
    return `${currencySymbol} ${number.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// ==============================================================================
// SECCIÓN 3: FORMATEADORES DE FECHA
// ==============================================================================

/**
 * Formatea un objeto Date a un formato de fecha estándar (dd/MM/yyyy).
 * @param {Date | string | null | undefined} date - El objeto Date o string de fecha.
 * @param {string} [defaultValue=''] - El valor a devolver si la fecha es inválida.
 * @returns {string} La fecha formateada o el valor por defecto.
 */
export const formatDate = (date, defaultValue = '') => {
    if (!date) return defaultValue;
    
    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (isNaN(dateObj.getTime())) {
        return defaultValue;
    }

    return formatDateFns(dateObj, 'dd/MM/yyyy', { locale: es });
};

/**
 * Formatea un objeto Date a un formato de fecha y hora (dd/MM/yyyy HH:mm).
 * @param {Date | string | null | undefined} dateTime - El objeto Date o string de fecha y hora.
 * @param {string} [defaultValue=''] - El valor a devolver si la fecha y hora son inválidas.
 * @returns {string} La fecha y hora formateadas o el valor por defecto.
 */
export const formatDateTime = (dateTime, defaultValue = '') => {
    if (!dateTime) return defaultValue;

    const dateObj = dateTime instanceof Date ? dateTime : new Date(dateTime);

    if (isNaN(dateObj.getTime())) {
        return defaultValue;
    }
    
    return formatDateFns(dateObj, 'dd/MM/yyyy HH:mm', { locale: es });
};