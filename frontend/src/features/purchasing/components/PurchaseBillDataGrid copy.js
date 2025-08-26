// frontend/src/features/purchasing/components/PurchaseBillDataGrid.js

/**
 * @file Componente de presentación para mostrar la lista de Facturas de Compra.
 *
 * @description Este componente es un "componente tonto" (dumb component) cuya única
 * responsabilidad es renderizar la tabla de datos. Recibe la configuración de las
 * columnas y todas las funciones de manejo de eventos como props, manteniendo una
 * clara separación de concerns.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES DE MÓDULOS
// ==============================================================================

import React, { useMemo } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { esES } from '@mui/x-data-grid/locales';

import DataGridToolbar from '../../../components/common/DataGridToolbar';
// Se importa la función que crea la configuración de las columnas.
import { createPurchaseBillColumns } from './purchaseBillGridConfig';

// ==============================================================================
// SECCIÓN 2: DEFINICIÓN DEL COMPONENTE PRINCIPAL
// ==============================================================================

const PurchaseBillDataGrid = (props) => {
    const {
        bills,
        rowCount,
        isLoading,
        paginationModel,
        onPaginationModelChange,
        onViewDetails,
        searchTerm,
        onSearchChange,
    } = props;

    // La lógica de las columnas está desacoplada.
    // Usamos useMemo para evitar recrear la configuración en cada renderizado.
    const columns = useMemo(
        () => createPurchaseBillColumns({
            onViewDetails: onViewDetails,
        }),
        [onViewDetails]
    );

    return (
        <DataGrid
            rows={bills}
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
                    searchTerm: searchTerm,
                    onSearchChange: onSearchChange,
                    searchPlaceholder: "Buscar por N° de Factura..."
                }
            }}
            disableRowSelectionOnClick
            localeText={esES.components.MuiDataGrid.defaultProps.localeText}
            sx={{ border: 'none' }}
        />
    );
};

export default PurchaseBillDataGrid;