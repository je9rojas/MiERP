// frontend/src/features/crm/components/customerGridConfig.js

/**
 * @file Archivo de configuración para el MUI DataGrid de Clientes (Customers).
 *
 * @description Este archivo centraliza la lógica de creación de columnas para
 * la tabla de clientes. Al aislar esta lógica, se mejora la separación de
 * concerns y se facilita la mantenibilidad y reutilización.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React from 'react';
import { Box, Chip, Tooltip, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

// ==============================================================================
// SECCIÓN 2: FUNCIÓN FACTORY PARA COLUMNAS
// ==============================================================================

/**
 * Factory function para crear la configuración de las columnas de la DataGrid de Clientes.
 * @param {object} actions - Un objeto que contiene los callbacks para las acciones.
 * @param {function} actions.onEditCustomer - Callback para navegar a la página de edición.
 * @returns {Array<object>} Un array de objetos de definición de columnas para MUI DataGrid.
 */
export const createCustomerColumns = (actions) => [
    {
        field: 'business_name',
        headerName: 'Razón Social',
        flex: 1,
        minWidth: 250,
    },
    {
        field: 'doc_type',
        headerName: 'Tipo Doc.',
        width: 100,
        valueFormatter: (value) => value?.toUpperCase() || '',
    },
    {
        field: 'doc_number',
        headerName: 'N° Documento',
        width: 150,
    },
    {
        field: 'phone',
        headerName: 'Teléfono',
        width: 150,
        sortable: false,
    },
    {
        field: 'contact_person',
        headerName: 'Persona de Contacto',
        flex: 1,
        minWidth: 200,
        valueGetter: (params) => params.value?.name || 'No asignado',
        sortable: false,
    },
    {
        field: 'is_active',
        headerName: 'Estado',
        width: 120,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => (
            <Chip
                label={params.value ? 'Activo' : 'Inactivo'}
                color={params.value ? 'success' : 'default'}
                size="small"
                variant="outlined"
            />
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
            <Box>
                <Tooltip title="Editar Cliente">
                    <IconButton onClick={() => actions.onEditCustomer(params.row.id)} size="small">
                        <EditIcon />
                    </IconButton>
                </Tooltip>
            </Box>
        ),
    },
];