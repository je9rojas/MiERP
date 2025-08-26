// File: /frontend/src/features/purchasing/components/PurchaseOrderDataGrid.js

/**
 * @file Componente de presentación para mostrar las Órdenes de Compra en una tabla.
 *
 * @description Este componente es un componente de presentación ("tonto") cuya única
 * responsabilidad es renderizar la tabla de datos. Recibe la configuración de las
 * columnas y todas las funciones de manejo de eventos como props, manteniendo una
 * clara separación de concerns.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { DataGrid } from '@mui/x-data-grid';
import { esES } from '@mui/x-data-grid/locales';

import DataGridToolbar from '../../../components/common/DataGridToolbar';
import { createPurchaseOrderColumns } from './purchaseOrderGridConfig';

// ==============================================================================
// SECCIÓN 2: DEFINICIÓN DEL COMPONENTE PRINCIPAL
// ==============================================================================

const PurchaseOrderDataGrid = ({
    orders,
    rowCount,
    isLoading,
    paginationModel,
    onPaginationModelChange,
    onEditOrder,
    onConfirmOrder,
    onRegisterReceipt,
    onRegisterBill,
    searchTerm,
    onSearchChange,
}) => {
    const columns = useMemo(
        () => createPurchaseOrderColumns({
            onEditOrder,
            onConfirmOrder,
            onRegisterReceipt,
            onRegisterBill,
        }),
        [onEditOrder, onConfirmOrder, onRegisterReceipt, onRegisterBill]
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
            slotProps={{
                toolbar: {
                    searchTerm,
                    onSearchChange,
                    searchPlaceholder: "Buscar por N° de Orden..."
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

PurchaseOrderDataGrid.propTypes = {
    orders: PropTypes.arrayOf(PropTypes.object).isRequired,
    rowCount: PropTypes.number.isRequired,
    isLoading: PropTypes.bool,
    paginationModel: PropTypes.shape({
        page: PropTypes.number.isRequired,
        pageSize: PropTypes.number.isRequired,
    }).isRequired,
    onPaginationModelChange: PropTypes.func.isRequired,
    onEditOrder: PropTypes.func.isRequired,
    onConfirmOrder: PropTypes.func.isRequired,
    onRegisterReceipt: PropTypes.func.isRequired,
    onRegisterBill: PropTypes.func.isRequired,
    searchTerm: PropTypes.string,
    onSearchChange: PropTypes.func.isRequired,
};

export default PurchaseOrderDataGrid;