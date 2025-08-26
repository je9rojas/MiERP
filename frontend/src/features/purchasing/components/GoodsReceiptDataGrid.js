// File: /frontend/src/features/purchasing/components/GoodsReceiptDataGrid.js

/**
 * @file Componente de presentación para mostrar la lista de Recepciones de Mercancía.
 *
 * @description Este componente es un componente de presentación ("tonto") que renderiza
 * la tabla de datos. Recibe la configuración de las columnas y todas las funciones de
 * manejo de eventos como props.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { DataGrid } from '@mui/x-data-grid';
import { esES } from '@mui/x-data-grid/locales';

import DataGridToolbar from '../../../components/common/DataGridToolbar';
import { createGoodsReceiptColumns } from './goodsReceiptGridConfig';

// ==============================================================================
// SECCIÓN 2: DEFINICIÓN DEL COMPONENTE PRINCIPAL
// ==============================================================================

const GoodsReceiptDataGrid = ({
    receipts,
    rowCount,
    isLoading,
    paginationModel,
    onPaginationModelChange,
    onViewDetails,
    searchTerm,
    onSearchChange,
}) => {
    const columns = useMemo(
        () => createGoodsReceiptColumns({
            onViewDetails,
        }),
        [onViewDetails]
    );

    return (
        <DataGrid
            // --- Props de Datos y Estructura ---
            rows={receipts}
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
                    showAddButton: false, // Las recepciones se crean desde una Orden de Compra.
                    searchTerm,
                    onSearchChange,
                    searchPlaceholder: "Buscar por N° de Recepción..."
                }
            }}
            localeText={esES.components.MuiDataGrid.defaultProps.localeText}
            sx={{ border: 'none' }}
        />
    );
};

// ==============================================================================
// SECCIÓN 3: DEFINICIÓN DE PROPTYPES
// ==============================================================================

GoodsReceiptDataGrid.propTypes = {
    receipts: PropTypes.arrayOf(PropTypes.object).isRequired,
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

export default GoodsReceiptDataGrid;