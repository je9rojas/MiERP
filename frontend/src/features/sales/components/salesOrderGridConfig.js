// File: /frontend/src/features/sales/components/salesOrderGridConfig.js

/**
 * @file Archivo de configuración para el MUI DataGrid de Órdenes de Venta.
 *
 * Centraliza la lógica de creación de columnas para la tabla de órdenes de venta,
 * mejorando la separación de concerns y la mantenibilidad.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React from 'react';
import { Box, Chip, Tooltip, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { formatDate, formatCurrency } from '../../../utils/formatters';

// ==============================================================================
// SECCIÓN 2: CONSTANTES DE CONFIGURACIÓN
// ==============================================================================

const STATUS_CONFIG = {
    draft: { label: 'BORRADOR', color: 'default' },
    confirmed: { label: 'CONFIRMADO', color: 'info' },
    partially_shipped: { label: 'DESPACHADO PARCIAL', color: 'secondary' },
    shipped: { label: 'DESPACHADO TOTAL', color: 'primary' },
    invoiced: { label: 'FACTURADO', color: 'success' },
    cancelled: { label: 'CANCELADO', color: 'error' },
};

// ==============================================================================
// SECCIÓN 3: FUNCIÓN FACTORÍA PARA LA DEFINICIÓN DE COLUMNAS
// ==============================================================================

/**
 * Crea la configuración de columnas para la tabla de Órdenes de Venta.
 * @param {object} actions - Callbacks para los botones de acción.
 * @param {function(string)} actions.onViewDetails - Callback para ver/editar los detalles.
 * @param {function(string)} actions.onCreateShipment - Callback para crear un despacho.
 * @returns {Array<object>} Un array de objetos de definición de columnas.
 */
export const createSalesOrderColumns = ({ onViewDetails, onCreateShipment }) => [
    {
        field: 'order_number',
        headerName: 'N° Orden',
        width: 150,
    },
    {
        field: 'customer_name',
        headerName: 'Cliente',
        flex: 1,
        minWidth: 250,
    },
    {
        field: 'order_date',
        headerName: 'Fecha de Emisión',
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
        field: 'status',
        headerName: 'Estado',
        width: 200,
        renderCell: (params) => {
            const config = STATUS_CONFIG[params.value] || { label: params.value?.toUpperCase(), color: 'default' };
            return <Chip label={config.label} color={config.color} size="small" variant="outlined" />;
        },
    },
    {
        field: 'actions',
        headerName: 'Acciones',
        width: 120,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        disableColumnMenu: true,
        renderCell: (params) => {
            const canBeShipped = ['confirmed', 'partially_shipped'].includes(params.row.status);
            const isDraft = params.row.status === 'draft';

            return (
                <Box>
                    <Tooltip title={isDraft ? "Editar Orden" : "Ver Detalles"}>
                        <IconButton onClick={() => onViewDetails(params.row.id)} size="small">
                            {isDraft ? <EditIcon /> : <VisibilityIcon />}
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Crear Despacho">
                        <span>
                            <IconButton onClick={() => onCreateShipment(params.row.id)} size="small" disabled={!canBeShipped}>
                                <LocalShippingIcon />
                            </IconButton>
                        </span>
                    </Tooltip>
                </Box>
            );
        },
    },
];