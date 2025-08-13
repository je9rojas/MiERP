// frontend/src/features/purchasing/components/PurchaseOrderDataGrid.js

/**
 * @file Componente de presentación para mostrar las Órdenes de Compra en una tabla.
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
import { createPurchaseOrderColumns } from './purchaseOrderGridConfig';

// ==============================================================================
// SECCIÓN 2: DEFINICIÓN DEL COMPONENTE PRINCIPAL
// ==============================================================================

const PurchaseOrderDataGrid = (props) => {
    const {
        orders,
        rowCount,
        isLoading,
        paginationModel,
        onPaginationModelChange,
        onEditOrder,
        onRegisterReceipt,
        searchTerm,
        onSearchChange,
    } = props;

    // La lógica de las columnas ahora está desacoplada.
    // Usamos useMemo para evitar recrear la configuración en cada renderizado.
    const columns = useMemo(
        () => createPurchaseOrderColumns({
            onViewDetails: onEditOrder, // El nombre interno en config es onViewDetails
            onRegisterReceipt: onRegisterReceipt,
        }),
        [onEditOrder, onRegisterReceipt]
    );

    return (
        <DataGrid
            rows={orders}
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
                    searchPlaceholder: "Buscar por N° de Orden..."
                }
            }}
            disableRowSelectionOnClick
            localeText={esES.components.MuiDataGrid.defaultProps.localeText}
            sx={{ border: 'none' }}
        />
    );
};

export default PurchaseOrderDataGrid;