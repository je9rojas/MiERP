// File: /frontend/src/features/sales/components/shipmentGridConfig.js

/**
 * @file Define la configuración de columnas para la tabla de Despachos (Shipments).
 * @description Esta configuración está diseñada para funcionar con los datos enriquecidos
 * y transformados por la capa de API.
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
 * Crea la configuración de columnas para la tabla de Despachos.
 * @param {object} actions - Callbacks para los botones de acción.
 * @param {function(string)} actions.onViewDetails - Callback para ver los detalles del despacho.
 * @returns {Array<object>} Un array de objetos de definición de columnas.
 */
export const createShipmentColumns = ({ onViewDetails }) => [
    {
        field: 'shipment_number',
        headerName: 'N° Despacho',
        width: 180,
    },
    {
        field: 'sales_order_number',
        headerName: 'N° Orden de Venta',
        width: 180,
        // Este campo se aplana en la página contenedora (ShipmentListPage)
    },
    {
        field: 'customer_name',
        headerName: 'Cliente',
        flex: 1,
        minWidth: 250,
        // Este campo se aplana en la página contenedora (ShipmentListPage)
    },
    {
        field: 'shipping_date',
        headerName: 'Fecha de Despacho',
        width: 180,
        type: 'date',
        valueFormatter: (value) => formatDate(value),
    },
    {
        field: 'items',
        headerName: 'N° Ítems',
        width: 100,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        valueGetter: (value) => (Array.isArray(value) ? value.length : 0),
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
            <Tooltip title="Ver Detalles del Despacho">
                <IconButton onClick={() => onViewDetails(params.row.id)} size="small">
                    <VisibilityIcon />
                </IconButton>
            </Tooltip>
        ),
    },
];