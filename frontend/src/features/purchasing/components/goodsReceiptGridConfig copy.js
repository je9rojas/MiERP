// frontend/src/features/purchasing/components/goodsReceiptGridConfig.js

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
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// ==============================================================================
// SECCIÓN 2: FACTORY FUNCTION PARA LAS COLUMNAS
// ==============================================================================

/**
 * Factory function para crear la configuración de las columnas de la DataGrid.
 * @param {object} actions - Un objeto que contiene los callbacks para las acciones.
 * @param {function} actions.onViewDetails - Callback para ver los detalles de una recepción.
 * @returns {Array<object>} Un array de objetos de definición de columnas.
 */
export const createGoodsReceiptColumns = (actions) => [
    { 
        field: 'receipt_number', 
        headerName: 'N° Recepción', 
        width: 180 
    },
    {
        field: 'purchase_order_number',
        headerName: 'Orden de Compra',
        width: 180,
        // Este campo se añade en el servicio del backend.
        valueGetter: (_value, row) => row.purchase_order_number || 'N/A',
    },
    {
        field: 'supplier',
        headerName: 'Proveedor',
        flex: 1,
        minWidth: 250,
        valueGetter: (_value, row) => row.supplier?.business_name || 'N/A',
    },
    {
        field: 'received_date',
        headerName: 'Fecha de Recepción',
        width: 180,
        type: 'date',
        valueGetter: (value) => (value ? new Date(value) : null),
        valueFormatter: (value) => {
            if (!value) return '';
            try {
                return format(value, 'dd MMM yyyy, HH:mm', { locale: es });
            } catch (error) {
                return 'Fecha inválida';
            }
        },
    },
    // Podríamos añadir una columna de "Estado" si las recepciones tuvieran un ciclo de vida.
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
                    <IconButton onClick={() => actions.onViewDetails(params.id)} size="small">
                        <VisibilityIcon />
                    </IconButton>
                </Tooltip>
            </Box>
        ),
    },
];