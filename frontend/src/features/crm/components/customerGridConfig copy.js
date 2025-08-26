// /frontend/src/features/crm/components/customerGridConfig.js

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
        // Se usa 'valueFormatter' para mostrar el texto en mayúsculas.
        valueFormatter: (value) => value?.toUpperCase() || 'N/A',
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
        // Se usa 'valueFormatter' para mostrar un guion si no hay valor.
        valueFormatter: (value) => value || '—',
    },
    {
        field: 'contact_person',
        headerName: 'Persona de Contacto',
        flex: 1,
        minWidth: 200,
        sortable: false,
        // (CORRECCIÓN CLAVE) Se utiliza un valueGetter robusto.
        // Accede a 'params.row.contact_person' y, solo si no es nulo,
        // intenta leer la propiedad 'name'. Esto previene el error.
        valueGetter: (value, row) => row.contact_person?.name || 'No asignado',
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