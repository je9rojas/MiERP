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
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import { format } from 'date-fns';

// ==============================================================================
// SECCIÓN 2: CONSTANTES Y FUNCIONES DE AYUDA
// ==============================================================================

const statusColors = {
    draft: 'default',
    confirmed: 'info',
    partially_received: 'secondary',
    fully_received: 'success',
    billed: 'primary',
    cancelled: 'error',
};

const statusLabels = {
    draft: 'Borrador',
    confirmed: 'Confirmado',
    partially_received: 'Recibido Parcial',
    fully_received: 'Recibido Completo',
    billed: 'Facturado',
    cancelled: 'Cancelado',
};


// ==============================================================================
// SECCIÓN 3: FUNCIÓN FACTORY PARA COLUMNAS
// ==============================================================================

/**
 * Factory function para crear la configuración de las columnas de la DataGrid.
 * @param {object} actions - Un objeto que contiene los callbacks para las acciones.
 * @param {function} actions.onEditOrder - Callback para ver/editar los detalles.
 * @param {function} actions.onConfirmOrder - Callback para confirmar una orden en borrador.
 * @param {function} actions.onRegisterReceipt - Callback para registrar la recepción.
 * @param {function} actions.onRegisterBill - Callback para registrar la factura de la orden.
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
                return format(new Date(value), 'dd/MM/yyyy');
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
        width: 180,
        renderCell: (params) => {
            const status = params.value || 'draft';
            return (
                <Chip
                    label={statusLabels[status] || status.toUpperCase()}
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
        width: 160,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        disableColumnMenu: true,
        renderCell: (params) => {
            const { row } = params;
            const isDraft = row.status === 'draft';
            const canBeReceived = ['confirmed', 'partially_received'].includes(row.status);
            // Lógica de negocio: Se puede facturar si ya se ha recibido algo (parcial o totalmente).
            const canBeBilled = ['partially_received', 'fully_received'].includes(row.status);

            return (
                <Box>
                    <Tooltip title={isDraft ? "Editar Orden" : "Ver Detalles"}>
                        <IconButton onClick={() => actions.onEditOrder(row.id)} size="small">
                            {isDraft ? <EditIcon /> : <VisibilityIcon />}
                        </IconButton>
                    </Tooltip>
                    
                    {isDraft && (
                         <Tooltip title="Confirmar Orden">
                            <IconButton onClick={() => actions.onConfirmOrder(row)} color="success" size="small">
                                <CheckCircleOutlineIcon />
                            </IconButton>
                        </Tooltip>
                    )}
                    
                    <Tooltip title="Registrar Recepción">
                        <span>
                            <IconButton onClick={() => actions.onRegisterReceipt(row.id)} size="small" disabled={!canBeReceived}>
                                <ReceiptLongIcon />
                            </IconButton>
                        </span>
                    </Tooltip>
                    
                    <Tooltip title="Registrar Factura">
                        <span>
                            {/* --- CORRECCIÓN CRÍTICA --- */}
                            {/* Se conecta el onClick a la nueva función `onRegisterBill` */}
                            <IconButton onClick={() => actions.onRegisterBill(row.id)} size="small" disabled={!canBeBilled}>
                                <FactCheckIcon />
                            </IconButton>
                        </span>
                    </Tooltip>
                </Box>
            );
        },
    },
];