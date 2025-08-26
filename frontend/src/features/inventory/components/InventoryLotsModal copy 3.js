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

// SECCIÓN 2: FUNCIONES DE UTILIDAD Y CONFIGURACIÓN
/**
 * Formatea un valor numérico como una cadena de moneda en Soles (S/).
 * Maneja correctamente el valor 0, mostrándolo formateado en lugar de vacío.
 * @param {number | null | undefined} value - El valor numérico a formatear.
 * @returns {string} La cadena formateada, ej: "S/ 120.50" o "S/ 0.00".
 */
const formatCurrency = (value) => {
    // CORRECCIÓN: La comprobación ahora es explícita para null y undefined,
    // permitiendo que el número 0 sea procesado correctamente.
    if (value === null || value === undefined) {
        return ''; // Devuelve vacío solo si el dato realmente no existe.
    }
    return `S/ ${Number(value).toFixed(2)}`;
};

const lotColumns = [
    { field: 'lot_number', headerName: 'N° de Lote', width: 200, description: 'Número de lote o de la orden de compra asociada.' },
    {
        field: 'acquisition_cost',
        headerName: 'Costo Adq.',
        type: 'number',
        width: 120,
        align: 'right',
        headerAlign: 'right',
        valueFormatter: (params) => formatCurrency(params.value)
    },
    { field: 'current_quantity', headerName: 'Stock Actual', type: 'number', width: 120, align: 'center', headerAlign: 'center' },
    {
        field: 'received_on',
        headerName: 'Fecha Recepción',
        width: 150,
        type: 'date',
        valueGetter: (params) => new Date(params.value),
        valueFormatter: (params) => format(params.value, 'dd/MM/yyyy')
    },
    { field: 'country_of_origin', headerName: 'País Origen', flex: 1, minWidth: 130, valueGetter: (params) => params.value || 'No especificado' },
];

// SECCIÓN 3: DEFINICIÓN DEL COMPONENTE
const InventoryLotsModal = ({ open, onClose, productId, productName }) => {
    const { data: lots, isLoading, isError, error } = useQuery({
        queryKey: ['inventoryLots', productId],
        queryFn: () => getInventoryLotsByProductIdAPI(productId),
        enabled: !!productId && open,
        staleTime: 5 * 60 * 1000,
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
            return <Alert severity="error" sx={{ my: 2 }}>{`Error al cargar los lotes: ${error.message}`}</Alert>;
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
                    getRowId={(row) => row._id}
                    density="compact"
                    localeText={esES.components.MuiDataGrid.defaultProps.localeText}
                    hideFooter
                    autoPageSize
                    sx={{ border: 'none' }}
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