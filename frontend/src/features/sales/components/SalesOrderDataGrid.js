// /frontend/src/features/sales/components/SalesOrderDataGrid.js

/**
 * @file Componente de presentación para mostrar la lista de Órdenes de Venta.
 *
 * @description Este componente es un "componente tonto" (dumb component) que renderiza
 * la tabla de datos. Recibe la configuración de las columnas y todas las funciones de
 * manejo de eventos como props, manteniendo una clara separación de concerns.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useMemo } from 'react';
import { Box } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { esES } from '@mui/x-data-grid/locales';

import DataGridToolbar from '../../../components/common/DataGridToolbar';
// Se importa la función que define la estructura y lógica de las columnas.
import { createSalesOrderColumns } from './salesOrderGridConfig';

// ==============================================================================
// SECCIÓN 2: COMPONENTE PRINCIPAL
// ==============================================================================

const SalesOrderDataGrid = (props) => {
    const {
        orders,
        rowCount,
        isLoading,
        paginationModel,
        onPaginationModelChange,
        onViewOrderDetails,
        onCreateShipment, // Se añade la nueva prop para la acción de despachar
        toolbarProps,
    } = props;

    // La lógica de las columnas ahora está completamente desacoplada.
    // Usamos useMemo para evitar recrear la configuración en cada renderizado.
    const columns = useMemo(
        () => createSalesOrderColumns({
            onViewDetails: onViewOrderDetails,
            onCreateShipment: onCreateShipment,
        }),
        [onViewOrderDetails, onCreateShipment]
    );

    return (
        // Se elimina la altura fija para que el componente sea más flexible.
        // La página contenedora será responsable de asignar la altura.
        <DataGrid
            // Configuración Esencial
            rows={orders}
            columns={columns}
            getRowId={(row) => row.id}

            // Estado y Paginación
            loading={isLoading}
            rowCount={rowCount}
            paginationModel={paginationModel}
            onPaginationModelChange={onPaginationModelChange}
            paginationMode="server"
            pageSizeOptions={[10, 25, 50]}
            
            // Toolbar Personalizado
            slots={{ toolbar: DataGridToolbar }}
            slotProps={{ toolbar: toolbarProps }}

            // Otras Propiedades y Estilos
            disableRowSelectionOnClick
            localeText={esES.components.MuiDataGrid.defaultProps.localeText}
            sx={{ border: 'none' }}
        />
    );
};

export default SalesOrderDataGrid;