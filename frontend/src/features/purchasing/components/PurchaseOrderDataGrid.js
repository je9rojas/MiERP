// frontend/src/features/purchasing/components/PurchaseOrderDataGrid.js

/**
 * @file Componente de presentación para mostrar la lista de Órdenes de Compra.
 * @description Este componente es un "componente tonto" (dumb component) cuya única
 * responsabilidad es renderizar la tabla de datos. Recibe toda la data y las
 * funciones de manejo de eventos como props desde un componente "inteligente" padre.
 */

// SECCIÓN 1: IMPORTACIONES DE MÓDULOS
import React from 'react';
import { Box, Chip, Tooltip, IconButton } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { esES } from '@mui/x-data-grid/locales';
import EditIcon from '@mui/icons-material/Edit';
import { format } from 'date-fns';
import DataGridToolbar from '../../../components/common/DataGridToolbar';

// SECCIÓN 2: CONSTANTES Y FUNCIONES DE AYUDA
const statusColors = {
    draft: 'default',
    pending_approval: 'info',
    approved: 'primary',
    rejected: 'error',
    partially_received: 'secondary',
    completed: 'success',
    cancelled: 'error',
};

/**
 * Factory function para crear la configuración de las columnas de la DataGrid.
 * Se extrae para mejorar la legibilidad y la separación de intereses.
 * @param {function} onEditOrder - El callback a ejecutar al hacer clic en el botón de editar.
 * @returns {Array<object>} Un array de objetos de definición de columnas.
 */
const createColumns = (onEditOrder) => [
    { field: 'order_number', headerName: 'N° Orden', width: 150 },
    {
        field: 'supplier',
        headerName: 'Proveedor',
        flex: 1,
        minWidth: 250,
        valueGetter: (params) => params.value?.business_name || 'N/A',
    },
    {
        field: 'order_date',
        headerName: 'Fecha de Emisión',
        width: 150,
        type: 'date',
        valueGetter: (params) => (params.value ? new Date(params.value) : null),
        // CORRECCIÓN: La firma es (value), no (params). Se comprueba el valor directamente.
        valueFormatter: (value) => {
            if (!value) return '';
            try {
                return format(value, 'dd/MM/yyyy');
            } catch (error) {
                return 'Fecha inválida';
            }
        },
    },
    {
        field: 'total_amount',
        headerName: 'Monto Total',
        width: 150,
        type: 'number',
        align: 'right',
        headerAlign: 'right',
        // CORRECCIÓN: La firma es (value), no (params).
        valueFormatter: (value) => `S/ ${Number(value || 0).toFixed(2)}`,
    },
    {
        field: 'status',
        headerName: 'Estado',
        width: 150,
        renderCell: (params) => {
            const status = params.value || 'draft';
            return (
                <Chip
                    label={status.replace('_', ' ').toUpperCase()}
                    color={statusColors[status] || 'default'}
                    size="small"
                    variant="outlined"
                />
            );
        },
    },
    {
        field: 'actions',
        headerName: 'Acciones',
        width: 100,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        disableColumnMenu: true,
        renderCell: (params) => (
            <Tooltip title="Ver / Editar Orden">
                <IconButton onClick={() => onEditOrder(params.id)} size="small">
                    <EditIcon />
                </IconButton>
            </Tooltip>
        ),
    },
];

// SECCIÓN 3: DEFINICIÓN DEL COMPONENTE PRINCIPAL
const PurchaseOrderDataGrid = (props) => {
    const {
        orders,
        rowCount,
        isLoading,
        paginationModel,
        onPaginationModelChange,
        onEditOrder,
        searchTerm,
        onSearchChange,
    } = props;

    const columns = React.useMemo(() => createColumns(onEditOrder), [onEditOrder]);

    return (
        <Box sx={{ height: '75vh', width: '100%' }}>
            <DataGrid
                rows={orders}
                columns={columns}
                // CORRECCIÓN DEFINITIVA: Se añade `getRowId` para solucionar el error de
                // identificador único de forma explícita y robusta.
                getRowId={(row) => row._id}
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
        </Box>
    );
};

export default PurchaseOrderDataGrid;