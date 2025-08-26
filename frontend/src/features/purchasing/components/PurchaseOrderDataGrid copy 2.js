// /frontend/src/features/purchasing/components/PurchaseOrderDataGrid.js

/**
 * @file Componente de presentación para mostrar las Órdenes de Compra en una tabla.
 *
 * @description Este componente es un "componente tonto" (dumb component) cuya única
 * responsabilidad es renderizar la tabla de datos. Recibe la configuración de las
 * columnas y todas las funciones de manejo de eventos como props, manteniendo una
 * clara separación de concerns.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useMemo, useEffect } from 'react'; // Se añade useEffect
import { DataGrid } from '@mui/x-data-grid';
import { esES } from '@mui/x-data-grid/locales';

import DataGridToolbar from '../../../components/common/DataGridToolbar';
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
        onConfirmOrder,
        onRegisterReceipt,
        onRegisterBill,
        searchTerm,
        onSearchChange,
    } = props;

    // --- INICIO DE LOGS DE DEPURACIÓN ---
    useEffect(() => {
        if (orders && orders.length > 0) {
            console.log("[DEBUG_DATA_GRID] Datos ('orders') recibidos como props:", orders);
            console.log("[DEBUG_DATA_GRID] Verificando la primera fila:", orders[0]);
            console.log(`[DEBUG_DATA_GRID] -> ¿Existe 'id' en la primera fila?`, 'id' in orders[0]);
            console.log(`[DEBUG_DATA_GRID] -> Valor de 'id':`, orders[0].id);
            console.log(`[DEBUG_DATA_GRID] -> ¿Existe '_id' en la primera fila?`, '_id' in orders[0]);
        }
    }, [orders]);
    // --- FIN DE LOGS DE DEPURACIÓN ---

    const columns = useMemo(
        () => createPurchaseOrderColumns({
            onEditOrder: onEditOrder,
            onConfirmOrder: onConfirmOrder,
            onRegisterReceipt: onRegisterReceipt,
            onRegisterBill: onRegisterBill,
        }),
        [onEditOrder, onConfirmOrder, onRegisterReceipt, onRegisterBill]
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