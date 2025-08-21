// /frontend/src/features/sales/components/ShipmentDataGrid.js

/**
 * @file Componente reutilizable para mostrar una tabla de Despachos.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React from 'react';
import { Box } from '@mui/material';

import { DataGrid } from '@mui/x-data-grid';
import { esES } from '@mui/x-data-grid/locales';

import { shipmentColumns } from './shipmentGridConfig';
import DataGridToolbar from '../../../components/common/DataGridToolbar';

// ==============================================================================
// SECCIÓN 2: COMPONENTE PRINCIPAL
// ==============================================================================

const ShipmentDataGrid = ({
    shipments,
    onRowClick,
    rowCount,
    paginationModel,
    onPaginationModelChange,
    isLoading,
}) => {
    return (
        <Box sx={{ height: 650, width: '100%' }}>
            <DataGrid
                rows={shipments}
                columns={shipmentColumns}
                getRowId={(row) => row.id}
                rowCount={rowCount}
                pageSizeOptions={[10, 25, 50]}
                paginationMode="server"
                paginationModel={paginationModel}
                onPaginationModelChange={onPaginationModelChange}
                loading={isLoading}
                onRowClick={(params) => onRowClick(params.id)}
                localeText={esES.components.MuiDataGrid.defaultProps.localeText}
                slots={{
                    toolbar: DataGridToolbar,
                }}
                slotProps={{
                    toolbar: {
                        // Aquí puedes pasar props al toolbar si es necesario,
                        // como funciones de búsqueda, filtros, etc.
                    },
                    row: {
                        style: { cursor: 'pointer' },
                    },
                }}
                sx={{
                    '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
                        outline: 'none',
                    },
                    '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': {
                        outline: 'none',
                    },
                }}
            />
        </Box>
    );
};

export default ShipmentDataGrid;