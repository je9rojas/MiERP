// File: /frontend/src/features/crm/components/SupplierDataGrid.js

/**
 * @file Componente de presentación para mostrar la lista de proveedores en una tabla.
 *
 * @description Este componente reutilizable renderiza los datos de los proveedores
 * utilizando MUI DataGrid. Es un componente controlado que recibe todas sus
 * props desde un componente padre (ej. SupplierListPage).
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { DataGrid } from '@mui/x-data-grid';
import { esES } from '@mui/x-data-grid/locales';

import DataGridToolbar from '../../../components/common/DataGridToolbar';
import { createSupplierColumns } from './supplierGridConfig'; // Se importa la configuración externa.

// ==============================================================================
// SECCIÓN 2: DEFINICIÓN DEL COMPONENTE PRINCIPAL
// ==============================================================================

const SupplierDataGrid = ({
    suppliers,
    rowCount,
    isLoading,
    paginationModel,
    onPaginationModelChange,
    onEditSupplier,
    searchTerm,
    onSearchChange,
}) => {
    const columns = useMemo(
        () => createSupplierColumns({
            onEditSupplier,
        }),
        [onEditSupplier]
    );

    return (
        <DataGrid
            // --- Props de Datos y Estructura ---
            rows={suppliers}
            columns={columns}
            getRowId={(row) => row.id} // Se utiliza `id` gracias a la capa anticorrupción.

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
                    searchPlaceholder: "Buscar por Razón Social o RUC..."
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

SupplierDataGrid.propTypes = {
    suppliers: PropTypes.arrayOf(PropTypes.object).isRequired,
    rowCount: PropTypes.number.isRequired,
    isLoading: PropTypes.bool.isRequired,
    paginationModel: PropTypes.shape({
        page: PropTypes.number.isRequired,
        pageSize: PropTypes.number.isRequired,
    }).isRequired,
    onPaginationModelChange: PropTypes.func.isRequired,
    onEditSupplier: PropTypes.func.isRequired,
    searchTerm: PropTypes.string.isRequired,
    onSearchChange: PropTypes.func.isRequired,
};

export default SupplierDataGrid;