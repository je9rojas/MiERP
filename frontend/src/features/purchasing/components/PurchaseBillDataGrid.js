// File: /frontend/src/features/purchasing/components/PurchaseBillDataGrid.js

/**
 * @file Componente de presentación para mostrar la lista de Facturas de Compra.
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
import { createPurchaseBillColumns } from './purchaseBillGridConfig';

// ==============================================================================
// SECCIÓN 2: DEFINICIÓN DEL COMPONENTE PRINCIPAL
// ==============================================================================

const PurchaseBillDataGrid = ({
    bills,
    rowCount,
    isLoading,
    paginationModel,
    onPaginationModelChange,
    onViewDetails,
    searchTerm,
    onSearchChange,
}) => {
    const columns = useMemo(
        () => createPurchaseBillColumns({
            onViewDetails,
        }),
        [onViewDetails]
    );

    return (
        <DataGrid
            // --- Props de Datos y Estructura ---
            rows={bills}
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
                    showAddButton: false, // Las facturas se crean desde una OC.
                    searchTerm,
                    onSearchChange,
                    searchPlaceholder: "Buscar por N° de Factura..."
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

PurchaseBillDataGrid.propTypes = {
    bills: PropTypes.arrayOf(PropTypes.object).isRequired,
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

export default PurchaseBillDataGrid;