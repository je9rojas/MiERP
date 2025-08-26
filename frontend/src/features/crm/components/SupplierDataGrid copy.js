// /frontend/src/features/crm/components/SupplierDataGrid.js

/**
 * @file Componente de presentación para mostrar la lista de proveedores en una tabla.
 *
 * Utiliza Material-UI DataGrid y está configurado para:
 * - Usar un toolbar personalizado a través del sistema de `slots`.
 * - Identificar correctamente las filas utilizando el campo `_id` de MongoDB.
 * - Manejar de forma segura la visualización de datos complejos como el array de correos.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React from 'react';
import { Box, Chip, Tooltip, IconButton } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { esES } from '@mui/x-data-grid/locales';
import EditIcon from '@mui/icons-material/Edit';

import DataGridToolbar from '../../../components/common/DataGridToolbar';

// ==============================================================================
// SECCIÓN 2: COMPONENTE PRINCIPAL
// ==============================================================================

const SupplierDataGrid = (props) => {
    const {
        suppliers,
        rowCount,
        isLoading,
        paginationModel,
        onPaginationModelChange,
        onEditSupplier,
        toolbarProps
    } = props;

    // --- 2.1: Definición de las Columnas de la Tabla ---
    const columns = React.useMemo(() => [
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
                    <IconButton onClick={() => onEditSupplier(params.row._id)} size="small">
                        <EditIcon />
                    </IconButton>
                </Tooltip>
            ),
        },
    ], [onEditSupplier]);


    // --- 2.2: Renderizado del Componente DataGrid ---
    return (
        <Box sx={{ height: 650, width: '100%' }}>
            <DataGrid
                // --- Configuración Esencial ---
                rows={suppliers}
                columns={columns}
                getRowId={(row) => row._id}

                // --- Estado y Paginación ---
                loading={isLoading}
                rowCount={rowCount}
                paginationModel={paginationModel}
                onPaginationModelChange={onPaginationModelChange}
                paginationMode="server"
                pageSizeOptions={[10, 25, 50]}
                
                // --- Toolbar Personalizado ---
                slots={{ toolbar: DataGridToolbar }}
                slotProps={{ toolbar: toolbarProps }}

                // --- Propiedades Adicionales ---
                disableRowSelectionOnClick
                autoHeight
                localeText={esES.components.MuiDataGrid.defaultProps.localeText}
            />
        </Box>
    );
};

export default SupplierDataGrid;