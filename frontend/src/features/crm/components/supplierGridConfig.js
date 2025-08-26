// File: /frontend/src/features/crm/components/supplierGridConfig.js

/**
 * @file Archivo de configuración para las columnas del DataGrid de Proveedores.
 *
 * @description Centraliza la lógica de creación de columnas para la tabla de proveedores.
 * Al aislar esta configuración, se mejora la separación de concerns y se facilita
 * la mantenibilidad.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React from 'react';
import { Chip, Tooltip, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

// ==============================================================================
// SECCIÓN 2: FUNCIÓN FACTORÍA PARA LA DEFINICIÓN DE COLUMNAS
// ==============================================================================

/**
 * Crea la configuración de columnas para la tabla de Proveedores.
 * @param {object} actions - Objeto que contiene los callbacks para las acciones de la fila.
 * @param {function(string)} actions.onEditSupplier - Callback para editar el proveedor.
 * @returns {Array<object>} Un array de objetos de definición de columnas para MUI DataGrid.
 */
export const createSupplierColumns = ({ onEditSupplier }) => [
    {
        field: 'tax_id',
        headerName: 'ID Fiscal / RUC',
        width: 150,
    },
    {
        field: 'business_name',
        headerName: 'Razón Social',
        flex: 1,
        minWidth: 250,
    },
    {
        field: 'phone',
        headerName: 'Teléfono',
        width: 150,
        sortable: false,
        valueGetter: (value) => value || '—',
    },
    {
        field: 'emails',
        headerName: 'Correo Principal',
        width: 220,
        sortable: false,
        valueGetter: (value) => (value && value.length > 0) ? value[0].address : '—',
    },
    {
        field: 'is_active',
        headerName: 'Estado',
        width: 120,
        renderCell: (params) => (
            params.value
                ? <Chip label="Activo" color="success" size="small" variant="outlined" />
                : <Chip label="Inactivo" color="error" size="small" variant="outlined" />
        ),
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
            <Tooltip title="Editar Proveedor">
                <IconButton onClick={() => onEditSupplier(params.row.id)} size="small">
                    <EditIcon />
                </IconButton>
            </Tooltip>
        ),
    },
];