// frontend/src/features/sales/components/salesOrderGridConfig.js

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
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// ==============================================================================
// SECCIÓN 2: CONSTANTES Y FUNCIONES DE AYUDA
// ==============================================================================

const statusConfig = {
    draft: { label: 'BORRADOR', color: 'default' },
    confirmed: { label: 'CONFIRMADO', color: 'info' },
    partially_shipped: { label: 'DESPACHADO PARCIAL', color: 'secondary' },
    fully_shipped: { label: 'DESPACHADO TOTAL', color: 'primary' },
    invoiced: { label: 'FACTURADO', color: 'success' },
    cancelled: { label: 'CANCELADO', color: 'error' },
};

// ==============================================================================
// SECCIÓN 3: FACTORY FUNCTION PARA LAS COLUMNAS
// ==============================================================================

/**
 * Factory function para crear la configuración de las columnas de la DataGrid.
 * @param {object} actions - Callbacks para los botones de acción.
 * @param {function} actions.onViewDetails - Callback para ver/editar los detalles.
 * @param {function} actions.onCreateShipment - Callback para crear un despacho.
 * @returns {Array<object>} Un array de objetos de definición de columnas.
 */
export const createSalesOrderColumns = (actions) => [
    {
        field: 'order_number',
        headerName: 'N° Orden',
        width: 150,
    },
    {
        field: 'customer',
        headerName: 'Cliente',
        flex: 1,
        minWidth: 250,
        valueGetter: (value, row) => row.customer?.name || 'N/A',
    },
    {
        field: 'order_date',
        headerName: 'Fecha de Emisión',
        width: 150,
        type: 'date',
        valueGetter: (value) => value ? new Date(value) : null,
        valueFormatter: (value) => value ? format(value, 'dd/MM/yyyy') : '',
    },
    {
        field: 'total_amount',
        headerName: 'Monto Total',
        width: 150,
        type: 'number',
        align: 'right',
        headerAlign: 'right',
        valueFormatter: (value) => `S/ ${Number(value || 0).toFixed(2)}`,
    },
    {
        field: 'status',
        headerName: 'Estado',
        width: 200,
        renderCell: (params) => {
            const config = statusConfig[params.value] || { label: params.value, color: 'default' };
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

            return (
                <Box>
                    <Tooltip title={params.row.status === 'draft' ? "Editar Orden" : "Ver Detalles"}>
                        <IconButton onClick={() => actions.onViewDetails(params.row.id)} size="small">
                            {params.row.status === 'draft' ? <EditIcon /> : <VisibilityIcon />}
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Crear Despacho">
                        <span>
                            <IconButton onClick={() => actions.onCreateShipment(params.row.id)} size="small" disabled={!canBeShipped}>
                                <LocalShippingIcon />
                            </IconButton>
                        </span>
                    </Tooltip>
                </Box>
            );
        },
    },
];