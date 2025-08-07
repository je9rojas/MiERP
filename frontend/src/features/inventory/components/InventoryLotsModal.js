// frontend/src/features/inventory/components/InventoryLotsModal.js

/**
 * @file Componente de modal para visualizar los lotes de inventario de un producto.
 * @description Este componente encapsula la lógica y la UI para obtener y mostrar
 * los lotes de inventario asociados a un ID de producto específico.
 */

// SECCIÓN 1: IMPORTACIONES DE MÓDULOS
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
    Box, Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Alert, CircularProgress, Typography
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { esES } from '@mui/x-data-grid/locales';
import { getInventoryLotsByProductIdAPI } from '../api/productsAPI';

// SECCIÓN 2: CONSTANTES Y CONFIGURACIÓN
const lotColumns = [
    { field: 'lot_number', headerName: 'N° de Lote', width: 200, description: 'Número de lote o de la orden de compra asociada.' },
    {
        field: 'acquisition_cost',
        headerName: 'Costo Adq.',
        type: 'number',
        width: 120,
        valueFormatter: (value) => `$${Number(value).toFixed(2)}`
    },
    { field: 'current_quantity', headerName: 'Stock Actual', type: 'number', width: 120, align: 'center', headerAlign: 'center' },
    {
        field: 'received_on',
        headerName: 'Fecha Recepción',
        width: 150,
        type: 'date',
        valueGetter: (value) => new Date(value),
        valueFormatter: (value) => format(value, 'dd/MM/yyyy')
    },
    { field: 'country_of_origin', headerName: 'País Origen', flex: 1, minWidth: 130, valueGetter: (value) => value || 'No especificado' },
];

// SECCIÓN 3: DEFINICIÓN DEL COMPONENTE
const InventoryLotsModal = ({ open, onClose, productId, productName }) => {
    const { data: lots, isLoading, isError, error } = useQuery({
        queryKey: ['inventoryLots', productId],
        queryFn: () => getInventoryLotsByProductIdAPI(productId),
        enabled: !!productId && open, // Solo ejecuta la query si el modal está abierto y hay un ID.
        staleTime: 5 * 60 * 1000, // Los lotes no cambian tan seguido, cache por 5 mins.
    });

    const renderContent = () => {
        if (isLoading) {
            return (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                    <CircularProgress />
                </Box>
            );
        }
        if (isError) {
            return <Alert severity="error" sx={{ my: 2 }}>Error al cargar los lotes: {error.message}</Alert>;
        }
        if (!lots || lots.length === 0) {
            return (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                    <Typography color="text.secondary">No se encontraron lotes para este producto.</Typography>
                </Box>
            );
        }
        return (
            <Box sx={{ height: 400, width: '100%', mt: 2 }}>
                <DataGrid
                    rows={lots}
                    columns={lotColumns}
                    getRowId={(row) => row._id} // CORRECCIÓN #2 APLICADA AQUÍ
                    density="compact"
                    localeText={esES.components.MuiDataGrid.defaultProps.localeText}
                    hideFooter
                    autoPageSize
                />
            </Box>
        );
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" scroll="paper">
            <DialogTitle>
                Lotes de Inventario
                <Typography variant="body2" color="text.secondary">
                    {productName}
                </Typography>
            </DialogTitle>
            <DialogContent dividers>
                {renderContent()}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary">Cerrar</Button>
            </DialogActions>
        </Dialog>
    );
};

export default InventoryLotsModal;