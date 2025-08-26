// File: /frontend/src/features/purchasing/components/purchaseOrderGridConfig.js

/**
 * @file Archivo de configuración para el MUI DataGrid de Órdenes de Compra.
 *
 * @description Este archivo centraliza la lógica de creación de columnas para la tabla.
 * Al aislar esta configuración, se mejora la separación de concerns y se facilita
 * la mantenibilidad. La función `createPurchaseOrderColumns` actúa como una
 * factoría que recibe las funciones de acción como dependencias, permitiendo que
 * las columnas sean interactivas sin acoplarse al estado del componente padre.
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
import { es } from 'date-fns/locale';

// ==============================================================================
// SECCIÓN 2: CONSTANTES DE CONFIGURACIÓN
// ==============================================================================

const STATUS_CONFIG = {
    draft:              { label: 'Borrador',          color: 'default'   },
    confirmed:          { label: 'Confirmado',        color: 'info'      },
    partially_received: { label: 'Recibido Parcial',  color: 'secondary' },
    fully_received:     { label: 'Recibido Completo', color: 'success'   },
    billed:             { label: 'Facturado',         color: 'primary'   },
    cancelled:          { label: 'Cancelado',         color: 'error'     },
};

// ==============================================================================
// SECCIÓN 3: FUNCIÓN FACTORÍA PARA LA DEFINICIÓN DE COLUMNAS
// ==============================================================================

/**
 * Crea la configuración de columnas para la tabla de Órdenes de Compra.
 * @param {object} actions - Objeto que contiene los callbacks para las acciones de la fila.
 * @param {function(string)} actions.onEditOrder - Callback para editar/ver la orden.
 * @param {function(object)} actions.onConfirmOrder - Callback para confirmar la orden.
 * @param {function(string)} actions.onRegisterReceipt - Callback para registrar una recepción.
 * @param {function(string)} actions.onRegisterBill - Callback para registrar una factura.
 * @returns {Array<object>} Un array de objetos de definición de columnas para MUI DataGrid.
 */
export const createPurchaseOrderColumns = ({ onEditOrder, onConfirmOrder, onRegisterReceipt, onRegisterBill }) => [
    {
        field: 'order_number',
        headerName: 'N° Orden',
        width: 150,
    },
    {
        field: 'supplier_name',
        headerName: 'Proveedor',
        flex: 1,
        minWidth: 250,
    },
    {
        field: 'order_date',
        headerName: 'Fecha de Emisión',
        width: 150,
        type: 'date',
        valueFormatter: (value) => {
            if (value instanceof Date && !isNaN(value)) {
                return format(value, 'dd/MM/yyyy', { locale: es });
            }
            return '';
        },
    },
    {
        field: 'total_amount',
        headerName: 'Monto Total',
        width: 150,
        type: 'number',
        align: 'right',
        headerAlign: 'right',
        valueFormatter: (value) => {
            const number = Number(value || 0);
            return `S/ ${number.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
    },
    {
        field: 'status',
        headerName: 'Estado',
        width: 180,
        renderCell: (params) => {
            const statusKey = params.value || 'draft';
            const config = STATUS_CONFIG[statusKey] || { label: statusKey.toUpperCase(), color: 'default' };
            return (
                <Chip
                    label={config.label}
                    color={config.color}
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
            const canBeBilled = ['partially_received', 'fully_received'].includes(row.status);

            return (
                <Box>
                    <Tooltip title={isDraft ? "Editar Orden" : "Ver Detalles"}>
                        <IconButton onClick={() => onEditOrder(row.id)} size="small">
                            {isDraft ? <EditIcon /> : <VisibilityIcon />}
                        </IconButton>
                    </Tooltip>

                    {isDraft && (
                         <Tooltip title="Confirmar Orden">
                            <IconButton onClick={() => onConfirmOrder(row)} color="success" size="small">
                                <CheckCircleOutlineIcon />
                            </IconButton>
                        </Tooltip>
                    )}

                    <Tooltip title="Registrar Recepción">
                        <span>
                            <IconButton onClick={() => onRegisterReceipt(row.id)} size="small" disabled={!canBeReceived}>
                                <ReceiptLongIcon />
                            </IconButton>
                        </span>
                    </Tooltip>

                    <Tooltip title="Registrar Factura">
                        <span>
                            <IconButton onClick={() => onRegisterBill(row.id)} size="small" disabled={!canBeBilled}>
                                <FactCheckIcon />
                            </IconButton>
                        </span>
                    </Tooltip>
                </Box>
            );
        },
    },
];