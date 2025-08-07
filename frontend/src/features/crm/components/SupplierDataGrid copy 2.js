// /frontend/src/features/crm/components/SupplierDataGrid.js

/**
 * @file Componente de presentación para mostrar la lista de proveedores en una tabla.
 *
 * Utiliza Material-UI DataGrid y está configurado para usar un toolbar personalizado
 * a través del sistema de `slots` de la librería.
 */

import React from 'react';
import { Box, Chip, Tooltip, IconButton } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { esES } from '@mui/x-data-grid/locales';
import EditIcon from '@mui/icons-material/Edit';

import DataGridToolbar from '../../../components/common/DataGridToolbar'; // Importamos nuestro toolbar

const SupplierDataGrid = (props) => {
    const {
        suppliers,
        rowCount,
        isLoading,
        paginationModel,
        onPaginationModelChange,
        onEditSupplier,
        // Props para el toolbar, que ahora se pasan a través de la tabla
        toolbarProps
    } = props;

    const columns = React.useMemo(() => [
        { field: 'ruc', headerName: 'RUC', width: 150 },
        { field: 'business_name', headerName: 'Razón Social', flex: 1, minWidth: 250 },
        { field: 'phone', headerName: 'Teléfono', width: 150, sortable: false, valueGetter: (value) => value || '—' },
        { field: 'email', headerName: 'Correo Electrónico', width: 220, sortable: false, valueGetter: (value) => value || '—' },
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
    ], [onEditSupplier]);

    return (
        <Box sx={{ height: 650, width: '100%' }}>
            <DataGrid
                rows={suppliers}
                columns={columns}
                getRowId={(row) => row.id}
                loading={isLoading}
                rowCount={rowCount}
                paginationModel={paginationModel}
                onPaginationModelChange={onPaginationModelChange}
                paginationMode="server"
                pageSizeOptions={[10, 25, 50]}
                disableRowSelectionOnClick
                autoHeight
                localeText={esES.components.MuiDataGrid.defaultProps.localeText}
                
                // --- ARQUITECTURA CORREGIDA ---
                // Se le dice al DataGrid que use nuestro componente en el slot del toolbar.
                slots={{
                    toolbar: DataGridToolbar,
                }}
                // Se le pasan todas las props necesarias a nuestro toolbar personalizado.
                slotProps={{
                    toolbar: toolbarProps
                }}
            />
        </Box>
    );
};

export default SupplierDataGrid;