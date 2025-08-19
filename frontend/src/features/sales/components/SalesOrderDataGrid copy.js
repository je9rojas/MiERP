// /frontend/src/features/sales/components/SalesOrderDataGrid.js

/**
 * @file Componente de presentación para mostrar la lista de Órdenes de Venta.
 *
 * Utiliza Material-UI DataGrid para una visualización rica en características,
 * incluyendo ordenamiento, paginación, un toolbar personalizado y formato de datos.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React from 'react';
import { Box, Chip, Tooltip, IconButton } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { esES } from '@mui/x-data-grid/locales';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { format } from 'date-fns';

import DataGridToolbar from '../../../components/common/DataGridToolbar';

// ==============================================================================
// SECCIÓN 2: SUB-COMPONENTES Y DEFINICIONES
// ==============================================================================

/**
 * Renderiza un Chip de Material-UI con un color y texto apropiados
 * según el estado de la orden de venta.
 */
const StatusChip = ({ status }) => {
    const statusMap = {
        pending_payment: { label: 'Pendiente Pago', color: 'warning' },
        paid: { label: 'Pagada', color: 'info' },
        shipped: { label: 'Enviada', color: 'primary' },
        completed: { label: 'Completada', color: 'success' },
        cancelled: { label: 'Cancelada', color: 'error' },
    };

    const style = statusMap[status] || { label: status, color: 'default' };
    return <Chip label={style.label} color={style.color} size="small" variant="outlined" />;
};

// ==============================================================================
// SECCIÓN 3: COMPONENTE PRINCIPAL
// ==============================================================================

const SalesOrderDataGrid = (props) => {
    const {
        orders,
        rowCount,
        isLoading,
        paginationModel,
        onPaginationModelChange,
        onViewOrderDetails,
        toolbarProps
    } = props;

    const columns = React.useMemo(() => [
        {
            field: 'order_number',
            headerName: 'N° Orden',
            width: 150,
        },
        {
            field: 'customer',
            headerName: 'Cliente',
            flex: 1,
            minWidth: 250,
            valueGetter: (value) => value?.business_name || 'N/A',
        },
        {
            field: 'order_date',
            headerName: 'Fecha de Emisión',
            width: 150,
            type: 'date',
            valueGetter: (value) => value ? new Date(value) : null,
            valueFormatter: (value) => value ? format(value, 'dd/MM/yyyy') : '',
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
            renderCell: (params) => <StatusChip status={params.value} />,
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
                <Tooltip title="Ver Detalle">
                    <IconButton onClick={() => onViewOrderDetails(params.row.id)} size="small">
                        <VisibilityIcon />
                    </IconButton>
                </Tooltip>
            ),
        },
    ], [onViewOrderDetails]);

    return (
        <Box sx={{ height: 650, width: '100%' }}>
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
                autoHeight
                localeText={esES.components.MuiDataGrid.defaultProps.localeText}
            />
        </Box>
    );
};

export default SalesOrderDataGrid;