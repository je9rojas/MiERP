// File: /frontend/src/features/inventory/components/productGridConfig.js

/**
 * @file Archivo de configuración para las columnas del DataGrid de Productos.
 * @description Centraliza la lógica de creación de columnas para la tabla de productos.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React from 'react';
import { Tooltip, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import WarehouseIcon from '@mui/icons-material/Warehouse';

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
// SECCIÓN 3: FUNCIÓN FACTORÍA PARA LA DEFINICIÓN DE COLUMNAS
// ==============================================================================

/**
 * Crea la configuración de columnas para la tabla de Productos.
 * @param {object} actions - Callbacks para los botones de acción.
 * @param {function(string)} actions.onEdit - Callback para navegar a la edición del producto.
 * @param {function(object)} actions.onDeactivate - Callback para abrir el diálogo de desactivación.
 * @param {function(object)} actions.onViewLots - Callback para abrir el modal de lotes de inventario.
 * @returns {Array<object>} Un array de objetos de definición de columnas.
 */
export const createProductColumns = ({ onEdit, onDeactivate, onViewLots }) => [
    { field: 'sku', headerName: 'SKU', width: 150 },
    { field: 'name', headerName: 'Nombre', flex: 1, minWidth: 250 },
    { field: 'brand', headerName: 'Marca', width: 120 },
    { 
        field: 'stock_quantity', 
        headerName: 'Stock Total', 
        type: 'number', 
        width: 110, 
        align: 'center', 
        headerAlign: 'center' 
    },
    { 
        field: 'average_cost', 
        headerName: 'Costo Prom.', 
        type: 'number', 
        width: 120, 
        align: 'right', 
        headerAlign: 'right', 
        valueFormatter: (value) => formatCurrency(value) 
    },
    { 
        field: 'price', 
        headerName: 'Precio Venta', 
        type: 'number', 
        width: 120, 
        align: 'right', 
        headerAlign: 'right', 
        valueFormatter: (value) => formatCurrency(value) 
    },
    {
        field: 'actions',
        headerName: 'Acciones',
        type: 'actions',
        width: 150,
        align: 'center',
        headerAlign: 'center',
        getActions: ({ row }) => [
            <Tooltip title="Ver Lotes de Inventario" key="lots">
                <IconButton onClick={() => onViewLots(row)} size="small">
                    <WarehouseIcon />
                </IconButton>
            </Tooltip>,
            <Tooltip title="Editar Producto" key="edit">
                <IconButton onClick={() => onEdit(row.id)} size="small">
                    <EditIcon />
                </IconButton>
            </Tooltip>,
            <Tooltip title="Desactivar Producto" key="delete">
                <IconButton onClick={() => onDeactivate(row)} size="small" color="error">
                    <DeleteIcon />
                </IconButton>
            </Tooltip>,
        ],
    },
];