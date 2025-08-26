// File: /frontend/src/features/purchasing/components/purchaseBillGridConfig.js

/**
 * @file Archivo de configuración para el MUI DataGrid de Facturas de Compra.
 *
 * Este archivo centraliza la lógica de creación de columnas para la tabla de
 * facturas de compra, mejorando la separación de concerns y la mantenibilidad.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React from 'react';
import { Box, Tooltip, IconButton } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { formatDate, formatCurrency } from '../../../utils/formatters';

// ==============================================================================
// SECCIÓN 2: FUNCIÓN FACTORÍA PARA LA DEFINICIÓN DE COLUMNAS
// ==============================================================================

/**
 * Crea la configuración de columnas para la tabla de Facturas de Compra.
 * @param {object} actions - Un objeto que contiene los callbacks para las acciones.
 * @param {function(string)} actions.onViewDetails - Callback para ver los detalles de una factura.
 * @returns {Array<object>} Un array de objetos de definición de columnas.
 */
export const createPurchaseBillColumns = ({ onViewDetails }) => [
    { 
        field: 'bill_number', 
        headerName: 'N° Factura (Interno)', 
        width: 180 
    },
    { 
        field: 'supplier_invoice_number', 
        headerName: 'N° Factura Proveedor', 
        width: 180 
    },
    {
        field: 'supplier_name',
        headerName: 'Proveedor',
        flex: 1,
        minWidth: 250,
    },
    {
        field: 'purchase_order_number',
        headerName: 'Orden de Compra',
        width: 150,
    },
    {
        field: 'invoice_date',
        headerName: 'Fecha de Factura',
        width: 150,
        type: 'date',
        valueFormatter: (value) => formatDate(value),
    },
    {
        field: 'total_amount',
        headerName: 'Monto Total',
        width: 150,
        type: 'number',
        align: 'right',
        headerAlign: 'right',
        valueFormatter: (value) => formatCurrency(value),
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
                <Tooltip title="Ver Detalles de la Factura">
                    <IconButton onClick={() => onViewDetails(params.row.id)} size="small">
                        <VisibilityIcon />
                    </IconButton>
                </Tooltip>
            </Box>
        ),
    },
];