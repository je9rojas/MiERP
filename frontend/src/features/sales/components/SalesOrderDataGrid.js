// File: /frontend/src/features/sales/components/SalesOrderDataGrid.js

/**
 * @file Componente de presentación para mostrar la lista de Órdenes de Venta.
 *
 * @description Este componente es un componente de presentación ("tonto") que renderiza
 * la tabla de datos. Recibe la configuración de las columnas y todas las funciones de
 * manejo de eventos como props, manteniendo una clara separación de concerns.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { DataGrid } from '@mui/x-data-grid';
import { esES } from '@mui/x-data-grid/locales';

import DataGridToolbar from '../../../components/common/DataGridToolbar';
import { createSalesOrderColumns } from './salesOrderGridConfig';

// ==============================================================================
// SECCIÓN 2: DEFINICIÓN DEL COMPONENTE PRINCIPAL
// ==============================================================================

const SalesOrderDataGrid = ({
    orders,
    rowCount,
    isLoading,
    paginationModel,
    onPaginationModelChange,
    onViewOrderDetails,
    onCreateShipment,
    toolbarProps,
}) => {
    const columns = useMemo(
        () => createSalesOrderColumns({
            onViewDetails: onViewOrderDetails,
            onCreateShipment: onCreateShipment,
        }),
        [onViewOrderDetails, onCreateShipment]
    );

    return (
        <DataGrid
            // --- Props de Datos y Estructura ---
            rows={orders}
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
            slotProps={{ toolbar: toolbarProps }}
            localeText={esES.components.MuiDataGrid.defaultProps.localeText}
            sx={{ border: 'none' }}
        />
    );
};

// ==============================================================================
// SECCIÓN 3: DEFINICIÓN DE PROPTYPES
// ==============================================================================

SalesOrderDataGrid.propTypes = {
    orders: PropTypes.arrayOf(PropTypes.object).isRequired,
    rowCount: PropTypes.number.isRequired,
    isLoading: PropTypes.bool,
    paginationModel: PropTypes.shape({
        page: PropTypes.number.isRequired,
        pageSize: PropTypes.number.isRequired,
    }).isRequired,
    onPaginationModelChange: PropTypes.func.isRequired,
    onViewOrderDetails: PropTypes.func.isRequired,
    onCreateShipment: PropTypes.func.isRequired,
    toolbarProps: PropTypes.object.isRequired,
};

export default SalesOrderDataGrid;