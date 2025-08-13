// frontend/src/features/purchasing/components/purchaseBillGridConfig.js

/**
 * @file Archivo de configuración para el MUI DataGrid de Facturas de Compra.
 *
 * Este archivo centraliza la lógica de creación de columnas y otras configuraciones
 * específicas de la tabla de facturas de compra. Al aislar esta lógica, se mejora la
 * separación de concerns y se hace más fácil de mantener y probar.
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
 * @param {function} actions.onViewDetails - Callback para ver los detalles de una factura.
 * @returns {Array<object>} Un array de objetos de definición de columnas.
 */
export const createPurchaseBillColumns = (actions) => [
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
        field: 'supplier',
        headerName: 'Proveedor',
        flex: 1,
        minWidth: 250,
        // CORRECCIÓN: Se añade una guarda para asegurar que params.row exista.
        valueGetter: (params) => params.row?.supplier?.business_name || 'N/A',
    },
    {
        field: 'purchase_order_number',
        headerName: 'Orden de Compra',
        width: 150,
        // CORRECCIÓN: Se añade una guarda para asegurar que params.row exista.
        valueGetter: (params) => params.row?.purchase_order_number || 'N/A',
    },
    {
        field: 'received_date',
        headerName: 'Fecha de Recepción',
        width: 180,
        type: 'date',
        // El `value` que recibe valueGetter ya es `params.row.received_date`, por lo que es seguro.
        valueGetter: (params) => (params.value ? new Date(params.value) : null),
        valueFormatter: (value) => {
            if (!value) return '';
            try {
                return format(value, 'dd MMM yyyy, HH:mm', { locale: es });
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
                    {/* El onClick aquí es seguro porque si la fila no existe, el botón no se renderiza. */}
                    <IconButton onClick={() => actions.onViewDetails(params.id)} size="small">
                        <VisibilityIcon />
                    </IconButton>
                </Tooltip>
            </Box>
        ),
    },
];