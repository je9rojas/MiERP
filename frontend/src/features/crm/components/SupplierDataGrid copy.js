// /frontend/src/features/crm/components/SupplierDataGrid.js

/**
 * @file Componente de presentación para mostrar la lista de proveedores en una tabla.
 * Utiliza Material-UI DataGrid para una visualización rica en características como
 * ordenamiento, paginación y personalización de columnas.
 */

import React from 'react';
import { Box } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { esES } from '@mui/x-data-grid/locales';

// Definición de las columnas para la tabla de proveedores
const columns = [
    {
        field: 'ruc',
        headerName: 'RUC',
        width: 150,
        sortable: true,
    },
    {
        field: 'business_name',
        headerName: 'Razón Social',
        flex: 1,
        minWidth: 250,
    },
    {
        field: 'trade_name',
        headerName: 'Nombre Comercial',
        flex: 1,
        minWidth: 200,
        // Si el nombre comercial no existe, muestra un guion
        valueGetter: (params) => params.value || '—',
    },
    {
        field: 'phone',
        headerName: 'Teléfono',
        width: 150,
        sortable: false,
        valueGetter: (params) => params.value || '—',
    },
    {
        field: 'email',
        headerName: 'Correo Electrónico',
        width: 220,
        sortable: false,
        valueGetter: (params) => params.value || '—',
    },
    // Puedes añadir más columnas como 'Acciones' con botones de editar/borrar en el futuro
];

const SupplierDataGrid = ({ suppliers }) => {
    return (
        <Box sx={{ height: 650, width: '100%' }}>
            <DataGrid
                rows={suppliers}
                columns={columns}
                getRowId={(row) => row.id} // El ID de cada fila viene del campo 'id' de nuestros datos
                pageSizeOptions={[10, 25, 50]}
                initialState={{
                    pagination: { paginationModel: { pageSize: 10 } },
                }}
                localeText={esES.components.MuiDataGrid.defaultProps.localeText} // Traducción al español
                disableRowSelectionOnClick
                autoHeight
            />
        </Box>
    );
};

export default SupplierDataGrid;