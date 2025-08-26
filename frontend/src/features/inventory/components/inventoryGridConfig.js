// File: /frontend/src/features/inventory/components/inventoryGridConfig.js

/**
 * @file Archivo de configuración para las columnas del DataGrid de Lotes de Inventario.
 * @description Centraliza la lógica de creación de columnas para la tabla de lotes.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// ==============================================================================
// SECCIÓN 2: FUNCIONES DE AYUDA
// ==============================================================================

const formatCurrency = (value) => {
    if (value === null || value === undefined) {
        return '';
    }
    const number = Number(value);
    return `S/ ${number.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// ==============================================================================
// SECCIÓN 3: DEFINICIÓN DE COLUMNAS
// ==============================================================================

/**
 * Define la configuración de columnas para la tabla de Lotes de Inventario.
 * Como no tiene acciones, puede ser una constante en lugar de una función factoría.
 */
export const lotColumns = [
    { 
        field: 'lot_number', 
        headerName: 'N° de Lote', 
        width: 200, 
        description: 'Número de lote o de la orden de compra asociada.' 
    },
    {
        field: 'acquisition_cost',
        headerName: 'Costo Adq.',
        type: 'number',
        width: 120,
        align: 'right',
        headerAlign: 'right',
        valueFormatter: (value) => formatCurrency(value)
    },
    { 
        field: 'current_quantity', 
        headerName: 'Stock Actual', 
        type: 'number', 
        width: 120, 
        align: 'center', 
        headerAlign: 'center' 
    },
    {
        field: 'received_on',
        headerName: 'Fecha Recepción',
        width: 150,
        type: 'date',
        valueFormatter: (value) => {
            if (value instanceof Date && !isNaN(value)) {
                return format(value, 'dd/MM/yyyy', { locale: es });
            }
            return '';
        }
    },
    { 
        field: 'country_of_origin', 
        headerName: 'País Origen', 
        flex: 1, 
        minWidth: 130, 
        valueGetter: (value) => value || 'No especificado' 
    },
];