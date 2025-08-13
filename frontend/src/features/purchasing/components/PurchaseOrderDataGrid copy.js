// frontend/src/features/purchasing/components/PurchaseOrderDataGrid.js

/**
 * @file Componente de presentación para mostrar la lista de Órdenes de Compra.
 * @description Este componente es un "componente tonto" (dumb component) cuya única
 * responsabilidad es renderizar la tabla de datos. Recibe toda la data y las
 * funciones de manejo de eventos como props desde un componente "inteligente" padre.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES DE MÓDULOS
// ==============================================================================

import React from 'react';
import { Box, Chip, Tooltip, IconButton } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { esES } from '@mui/x-data-grid/locales';
import EditIcon from '@mui/icons-material/Edit';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { format } from 'date-fns';
import DataGridToolbar from '../../../components/common/DataGridToolbar';

// ==============================================================================
// SECCIÓN 2: CONSTANTES Y FUNCIONES DE AYUDA
// ==============================================================================

const statusColors = {
    draft: 'default',
    pending_approval: 'warning',
    approved: 'info',
    rejected: 'error',
    partially_received: 'secondary',
    completed: 'success',
    cancelled: 'error',
};

/**
 * Factory function para crear la configuración de las columnas de la DataGrid.
 * @param {function} onViewDetails - Callback para ver los detalles de una orden.
 * @param {function} onRegisterReceipt - Callback para registrar la recepción.
 * @returns {Array<object>} Un array de objetos de definición de columnas.
 */
const createColumns = (onViewDetails, onRegisterReceipt) => [
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
                    label={status.replace(/_/g, ' ').toUpperCase()}
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
        width: 120,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        disableColumnMenu: true,
        renderCell: (params) => {
            const canReceive = ['approved', 'partially_received'].includes(params.row.status);

            return (
                <Box>
                    <Tooltip title={params.row.status === 'draft' ? "Editar Orden" : "Ver Detalles"}>
                        <IconButton onClick={() => onViewDetails(params.id)} size="small">
                            {params.row.status === 'draft' ? <EditIcon /> : <VisibilityIcon />}
                        </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Registrar Recepción/Factura">
                        <span>
                            <IconButton onClick={() => onRegisterReceipt(params.id)} size="small" disabled={!canReceive}>
                                <ReceiptLongIcon />
                            </IconButton>
                        </span>
                    </Tooltip>
                </Box>
            );
        },
    },
];

// ==============================================================================
// SECCIÓN 3: DEFINICIÓN DEL COMPONENTE PRINCIPAL
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

    const columns = React.useMemo(() => createColumns(onEditOrder, onRegisterReceipt), [onEditOrder, onRegisterReceipt]);

    // Se elimina el Box contenedor con altura 'vh'. El DataGrid heredará la altura de su padre.
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
            sx={{ border: 'none' }} // El DataGrid ya no necesita un borde si el Paper lo contiene.
        />
    );
};

export default PurchaseOrderDataGrid;