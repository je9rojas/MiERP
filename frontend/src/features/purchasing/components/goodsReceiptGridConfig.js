// File: /frontend/src/features/purchasing/components/goodsReceiptGridConfig.js

/**
 * @file Archivo de configuración para el MUI DataGrid de Recepciones de Mercancía.
 *
 * Este archivo centraliza la lógica de creación de columnas para la tabla de
 * recepciones, mejorando la separación de concerns y la mantenibilidad.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React from 'react';
import { Box, Tooltip, IconButton } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { formatDate } from '../../../utils/formatters';

// ==============================================================================
// SECCIÓN 2: FUNCIÓN FACTORÍA PARA LA DEFINICIÓN DE COLUMNAS
// ==============================================================================

/**
 * Crea la configuración de columnas para la tabla de Recepciones de Mercancía.
 * @param {object} actions - Un objeto que contiene los callbacks para las acciones.
 * @param {function(string)} actions.onViewDetails - Callback para ver los detalles de una recepción.
 * @returns {Array<object>} Un array de objetos de definición de columnas.
 */
export const createGoodsReceiptColumns = ({ onViewDetails }) => [
    { 
        field: 'receipt_number', 
        headerName: 'N° Recepción', 
        width: 180 
    },
    {
        field: 'purchase_order_number',
        headerName: 'Orden de Compra',
        width: 180,
    },
    {
        field: 'supplier_name',
        headerName: 'Proveedor',
        flex: 1,
        minWidth: 250,
    },
    {
        field: 'received_date',
        headerName: 'Fecha de Recepción',
        width: 180,
        type: 'date',
        valueFormatter: (value) => formatDate(value),
    },
    {
        field: 'actions',
        headerName: 'Acciones',
        width: 100,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        disableColumnMenu: true,
        renderCell: (params) => (
            <Box>
                <Tooltip title="Ver Detalles de la Recepción">
                    <IconButton onClick={() => onViewDetails(params.row.id)} size="small">
                        <VisibilityIcon />
                    </IconButton>
                </Tooltip>
            </Box>
        ),
    },
];