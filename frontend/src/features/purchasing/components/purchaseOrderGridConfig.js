// frontend/src/features/purchasing/components/purchaseOrderGridConfig.js

/**
 * @file Archivo de configuración para el MUI DataGrid de Órdenes de Compra.
 *
 * Este archivo centraliza la lógica de creación de columnas y otras configuraciones
 * específicas de la tabla de órdenes de compra. Al aislar esta lógica, se mejora la
 * separación de concerns y se hace más fácil de mantener y probar.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React from 'react';
import { Box, Chip, Tooltip, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { format } from 'date-fns';

// ==============================================================================
// SECCIÓN 2: CONSTANTES Y FUNCIONES DE AYUDA
// ==============================================================================

const statusColors = {
    draft: 'default',
    pending_approval: 'warning',
    approved: 'info',
    rejected: 'error',
    partially_received: 'secondary',
    completed: 'success',
    cancelled: 'error',
};

/**
 * Factory function para crear la configuración de las columnas de la DataGrid.
 * @param {object} actions - Un objeto que contiene los callbacks para las acciones.
 * @param {function} actions.onViewDetails - Callback para ver/editar los detalles.
 * @param {function} actions.onRegisterReceipt - Callback para registrar la recepción.
 * @returns {Array<object>} Un array de objetos de definición de columnas.
 */
export const createPurchaseOrderColumns = (actions) => [
    { field: 'order_number', headerName: 'N° Orden', width: 150 },
    {
        field: 'supplier',
        headerName: 'Proveedor',
        flex: 1,
        minWidth: 250,
        valueGetter: (params) => params.value?.business_name || 'N/A',
    },
    {
        field: 'order_date',
        headerName: 'Fecha de Emisión',
        width: 150,
        type: 'date',
        valueGetter: (params) => (params.value ? new Date(params.value) : null),
        valueFormatter: (value) => {
            if (!value) return '';
            try {
                return format(value, 'dd/MM/yyyy');
            } catch (error) {
                return 'Fecha inválida';
            }
        },
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
        width: 150,
        renderCell: (params) => {
            const status = params.value || 'draft';
            return (
                <Chip
                    label={status.replace(/_/g, ' ').toUpperCase()}
                    color={statusColors[status] || 'default'}
                    size="small"
                    variant="outlined"
                />
            );
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
            const canReceive = ['approved', 'partially_received'].includes(params.row.status);

            return (
                <Box>
                    <Tooltip title={params.row.status === 'draft' ? "Editar Orden" : "Ver Detalles"}>
                        <IconButton onClick={() => actions.onViewDetails(params.id)} size="small">
                            {params.row.status === 'draft' ? <EditIcon /> : <VisibilityIcon />}
                        </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Registrar Recepción/Factura">
                        <span>
                            <IconButton onClick={() => actions.onRegisterReceipt(params.id)} size="small" disabled={!canReceive}>
                                <ReceiptLongIcon />
                            </IconButton>
                        </span>
                    </Tooltip>
                </Box>
            );
        },
    },
];