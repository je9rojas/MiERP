// frontend/src/features/purchasing/components/GoodsReceiptDataGrid.js

/**
 * @file Componente de presentación para mostrar la lista de Recepciones de Mercancía.
 *
 * @description Este componente es un "componente tonto" (dumb component) que renderiza
 * la tabla de datos. Recibe la configuración de las columnas y todas las funciones de
 * manejo de eventos como props.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES DE MÓDULOS
// ==============================================================================

import React, { useMemo } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { esES } from '@mui/x-data-grid/locales';

import DataGridToolbar from '../../../components/common/DataGridToolbar';
// Se importa la función que define la estructura y lógica de las columnas.
import { createGoodsReceiptColumns } from './goodsReceiptGridConfig';

// ==============================================================================
// SECCIÓN 2: DEFINICIÓN DEL COMPONENTE PRINCIPAL
// ==============================================================================

const GoodsReceiptDataGrid = (props) => {
    const {
        receipts,
        rowCount,
        isLoading,
        paginationModel,
        onPaginationModelChange,
        onViewDetails,
        searchTerm,
        onSearchChange,
    } = props;

    const columns = useMemo(
        () => createGoodsReceiptColumns({
            onViewDetails: onViewDetails,
        }),
        [onViewDetails]
    );

    return (
        <DataGrid
            rows={receipts}
            columns={columns}
            getRowId={(row) => row.id}
            loading={isLoading}
            rowCount={rowCount}
            paginationModel={paginationModel}
            onPaginationModelChange={onPaginationModelChange}
            paginationMode="server"
            pageSizeOptions={[10, 25, 50]}
            slots={{ toolbar: DataGridToolbar }}
            slotProps={{
                toolbar: {
                    showAddButton: false, // No se pueden crear recepciones directamente
                    searchTerm: searchTerm,
                    onSearchChange: onSearchChange,
                    searchPlaceholder: "Buscar por N° de Recepción..."
                }
            }}
            disableRowSelectionOnClick
            localeText={esES.components.MuiDataGrid.defaultProps.localeText}
            sx={{ border: 'none' }}
        />
    );
};

export default GoodsReceiptDataGrid;