// /frontend/src/features/purchasing/components/PurchaseOrderDataGrid.js

/**
 * @file Componente de presentación para mostrar la lista de Órdenes de Compra.
 */

import React from 'react';
import { Box, Chip, Tooltip, IconButton } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { esES } from '@mui/x-data-grid/locales'; // Se importa la localización desde su sub-paquete
import EditIcon from '@mui/icons-material/Edit';
import { format } from 'date-fns';

import DataGridToolbar from '../../../components/common/DataGridToolbar';

const PurchaseOrderDataGrid = (props) => {
    const {
        orders,
        rowCount,
        isLoading,
        paginationModel,
        onPaginationModelChange,
        onEditOrder,
        toolbarProps
    } = props;

    const columns = React.useMemo(() => [
        { field: 'order_number', headerName: 'N° Orden', width: 130 },
        {
            field: 'supplier',
            headerName: 'Proveedor',
            flex: 1,
            minWidth: 250,
            valueGetter: (value) => value?.business_name || 'N/A',
        },
        {
            field: 'order_date',
            headerName: 'Fecha de Emisión',
            width: 150,
            valueFormatter: (value) => value ? format(new Date(value), 'dd/MM/yyyy') : '',
        },
        {
            field: 'total_amount',
            headerName: 'Monto Total',
            width: 150,
            type: 'number',
            valueFormatter: (value) => `S/ ${Number(value || 0).toFixed(2)}`,
        },
        {
            field: 'status',
            headerName: 'Estado',
            width: 120,
            renderCell: (params) => (
                <Chip label={params.value || 'Pendiente'} color="warning" size="small" variant="outlined" />
            ),
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
                <Tooltip title="Ver/Editar Orden">
                    <IconButton onClick={() => onEditOrder(params.row._id)} size="small">
                        <EditIcon />
                    </IconButton>
                </Tooltip>
            ),
        },
    ], [onEditOrder]);

    return (
        <Box sx={{ height: 650, width: '100%' }}>
            <DataGrid
                rows={orders}
                columns={columns}
                getRowId={(row) => row._id}
                loading={isLoading}
                rowCount={rowCount}
                paginationModel={paginationModel}
                onPaginationModelChange={onPaginationModelChange}
                paginationMode="server"
                pageSizeOptions={[10, 25, 50]}
                slots={{ toolbar: DataGridToolbar }}
                slotProps={{ toolbar: toolbarProps }}
                disableRowSelectionOnClick
                autoHeight
                localeText={esES.components.MuiDataGrid.defaultProps.localeText}
            />
        </Box>
    );
};

export default PurchaseOrderDataGrid;