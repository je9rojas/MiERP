// /frontend/src/features/sales/components/ShipmentDataGrid.js

/**
 * @file Componente reutilizable y configurable para mostrar una tabla de Despachos.
 * @description Abstrae la implementación de MUI DataGrid y proporciona una interfaz
 * limpia para ser consumido por la página de listado de despachos.
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
    rows, // (CORREGIDO) Se cambia el nombre de la prop de 'shipments' a 'rows' para seguir la convención.
    onRowClick,
    rowCount,
    paginationModel,
    onPaginationModelChange,
    isLoading,
}) => {
    return (
        <Box sx={{ height: 650, width: '100%' }}>
            <DataGrid
                // La prop 'rows' del DataGrid ahora se alimenta directamente de la prop 'rows' del componente.
                rows={rows}
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
                        // Aquí se pueden pasar props específicas al toolbar en el futuro,
                        // como funciones para activar filtros, exportar datos, etc.
                    },
                    row: {
                        style: { cursor: 'pointer' },
                    },
                }}
                sx={{
                    // Estilos para mejorar la accesibilidad y la experiencia de usuario,
                    // eliminando el contorno de foco por defecto que puede ser molesto.
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