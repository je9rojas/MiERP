// File: /frontend/src/features/crm/components/CustomerDataGrid.js

/**
 * @file Componente de presentación para mostrar los Clientes en una tabla.
 *
 * @description Este componente reutilizable renderiza los datos de los clientes
 * utilizando MUI DataGrid. Es un componente controlado ("tonto") que recibe todas
 * sus props y callbacks desde un componente padre (ej. CustomerListPage).
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { DataGrid } from '@mui/x-data-grid';
import { esES } from '@mui/x-data-grid/locales';

import DataGridToolbar from '../../../components/common/DataGridToolbar';
import { createCustomerColumns } from './customerGridConfig';

// ==============================================================================
// SECCIÓN 2: DEFINICIÓN DEL COMPONENTE PRINCIPAL
// ==============================================================================

const CustomerDataGrid = ({
    customers,
    rowCount,
    isLoading,
    paginationModel,
    onPaginationModelChange,
    onEditCustomer,
    searchTerm,
    onSearchChange,
}) => {
    // Se utiliza useMemo para evitar recrear la configuración de las columnas
    // en cada renderizado, a menos que las funciones de acción cambien.
    const columns = useMemo(
        () => createCustomerColumns({
            onEditCustomer,
        }),
        [onEditCustomer]
    );

    return (
        <DataGrid
            // --- Props de Datos y Estructura ---
            rows={customers}
            columns={columns}
            getRowId={(row) => row.id} // Garantiza que DataGrid use `id` como identificador único.

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
                    searchPlaceholder: "Buscar por Razón Social o N° Doc..."
                }
            }}
            localeText={esES.components.MuiDataGrid.defaultProps.localeText}
            sx={{ border: 'none' }} // Estilo para integrarse limpiamente en el Paper contenedor.
        />
    );
};

// ==============================================================================
// SECCIÓN 3: DEFINICIÓN DE PROPTYPES
// ==============================================================================

CustomerDataGrid.propTypes = {
    customers: PropTypes.arrayOf(PropTypes.object).isRequired,
    rowCount: PropTypes.number.isRequired,
    isLoading: PropTypes.bool.isRequired,
    paginationModel: PropTypes.shape({
        page: PropTypes.number.isRequired,
        pageSize: PropTypes.number.isRequired,
    }).isRequired,
    onPaginationModelChange: PropTypes.func.isRequired,
    onEditCustomer: PropTypes.func.isRequired,
    searchTerm: PropTypes.string.isRequired,
    onSearchChange: PropTypes.func.isRequired,
};

export default CustomerDataGrid;