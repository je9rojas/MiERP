// File: /frontend/src/features/sales/components/ShipmentDataGrid.js

/**
 * @file Componente reutilizable y configurable para mostrar una tabla de Despachos.
 * @description Abstrae la implementación de MUI DataGrid y proporciona una interfaz
 * limpia para ser consumido por la página de listado de despachos.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { DataGrid } from '@mui/x-data-grid';
import { esES } from '@mui/x-data-grid/locales';

import DataGridToolbar from '../../../components/common/DataGridToolbar';
import { createShipmentColumns } from './shipmentGridConfig';

// ==============================================================================
// SECCIÓN 2: DEFINICIÓN DEL COMPONENTE PRINCIPAL
// ==============================================================================

const ShipmentDataGrid = ({
    shipments,
    rowCount,
    isLoading,
    paginationModel,
    onPaginationModelChange,
    onViewDetails,
    searchTerm,
    onSearchChange,
}) => {
    const columns = useMemo(
        () => createShipmentColumns({
            onViewDetails,
        }),
        [onViewDetails]
    );

    return (
        <DataGrid
            // --- Props de Datos y Estructura ---
            rows={shipments}
            columns={columns}
            getRowId={(row) => row.id}

            // --- Props de Estado y Control ---
            loading={isLoading}
            rowCount={rowCount}
            paginationModel={paginationModel}
            onPaginationModelChange={onPaginationModelChange}
            paginationMode="server"
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
            
            // --- Props de Componentes y Estilo ---
            slots={{ toolbar: DataGridToolbar }}
            slotProps={{
                toolbar: {
                    showAddButton: false, // Los despachos se crean desde una OV.
                    searchTerm,
                    onSearchChange,
                    searchPlaceholder: "Buscar por N° de Despacho..."
                },
            }}
            localeText={esES.components.MuiDataGrid.defaultProps.localeText}
            sx={{ border: 'none' }}
        />
    );
};

// ==============================================================================
// SECCIÓN 3: DEFINICIÓN DE PROPTYPES
// ==============================================================================

ShipmentDataGrid.propTypes = {
    shipments: PropTypes.arrayOf(PropTypes.object).isRequired,
    rowCount: PropTypes.number.isRequired,
    isLoading: PropTypes.bool,
    paginationModel: PropTypes.shape({
        page: PropTypes.number.isRequired,
        pageSize: PropTypes.number.isRequired,
    }).isRequired,
    onPaginationModelChange: PropTypes.func.isRequired,
    onViewDetails: PropTypes.func.isRequired,
    searchTerm: PropTypes.string,
    onSearchChange: PropTypes.func.isRequired,
};

export default ShipmentDataGrid;