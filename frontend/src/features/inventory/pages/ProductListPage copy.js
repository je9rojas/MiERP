// /frontend/src/features/inventory/pages/ProductListPage.js

/**
 * @file Página principal para la gestión de productos del inventario.
 *
 * Permite a los usuarios visualizar, buscar y filtrar la lista de productos.
 * Incorpora la nueva arquitectura de lotes, mostrando el costo promedio y
 * permitiendo ver el desglose de lotes de inventario para cada producto.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Container, Paper, Alert, IconButton, Tooltip, Typography,
    Dialog, DialogTitle, DialogContent, DialogActions, Button, CircularProgress
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { esES } from '@mui/x-data-grid/locales';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import { useSnackbar } from 'notistack';
import { format } from 'date-fns';

import { getProductsAPI, deactivateProductAPI, getInventoryLotsByProductIdAPI } from '../api/productsAPI';
import useDebounce from '../../../hooks/useDebounce';
import ConfirmationDialog from '../../../components/common/ConfirmationDialog';
import DataGridToolbar from '../../../components/common/DataGridToolbar';

// ==============================================================================
// SECCIÓN 2: SUB-COMPONENTES (MODAL DE LOTES)
// ==============================================================================

const lotColumns = [
    { field: 'lot_number', headerName: 'N° de Lote', width: 200 },
    { field: 'acquisition_cost', headerName: 'Costo Adq.', type: 'number', width: 120, valueFormatter: (value) => `S/ ${Number(value).toFixed(2)}` },
    { field: 'current_quantity', headerName: 'Stock Actual', type: 'number', width: 120, align: 'center', headerAlign: 'center' },
    { field: 'received_on', headerName: 'Fecha Recepción', width: 150, type: 'date', valueGetter: (value) => new Date(value), valueFormatter: (value) => format(value, 'dd/MM/yyyy') },
    { field: 'country_of_origin', headerName: 'País Origen', flex: 1, minWidth: 130, valueGetter: (value) => value || 'N/A' },
];

const InventoryLotsModal = ({ open, onClose, productId }) => {
    const { data: lots, isLoading, isError, error } = useQuery({
        queryKey: ['inventoryLots', productId],
        queryFn: () => getInventoryLotsByProductIdAPI(productId),
        enabled: !!productId && open,
    });

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle>Lotes de Inventario del Producto</DialogTitle>
            <DialogContent>
                {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><CircularProgress /></Box>}
                {isError && <Alert severity="error">Error al cargar los lotes: {error.message}</Alert>}
                {lots && (
                    <Box sx={{ height: 400, width: '100%', mt: 2 }}>
                        <DataGrid
                            rows={lots}
                            columns={lotColumns}
                            getRowId={(row) => row.id}
                            density="compact"
                            localeText={esES.components.MuiDataGrid.defaultProps.localeText}
                            hideFooter
                        />
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cerrar</Button>
            </DialogActions>
        </Dialog>
    );
};

// ==============================================================================
// SECCIÓN 3: COMPONENTE PRINCIPAL DE LA PÁGINA
// ==============================================================================

const ProductListPage = () => {
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();

    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });
    const [filters, setFilters] = useState({ search: '' });
    const [modalState, setModalState] = useState({ open: false, productId: null });
    const [productToDeactivate, setProductToDeactivate] = useState(null);

    const debouncedFilters = useDebounce(filters, 500);

    const { data, isLoading, isFetching, error } = useQuery({
        queryKey: ['products', paginationModel, debouncedFilters],
        queryFn: () => getProductsAPI({
            page: paginationModel.page + 1,
            page_size: paginationModel.pageSize,
            search: debouncedFilters.search,
        }),
        keepPreviousData: true,
    });

    const { mutate: deactivateProduct, isPending: isDeactivating } = useMutation({
        mutationFn: deactivateProductAPI,
        onSuccess: (data, sku) => {
            enqueueSnackbar(`Producto '${sku}' desactivado correctamente.`, { variant: 'success' });
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
        onError: (err) => enqueueSnackbar(err.response?.data?.detail || 'Error al desactivar.', { variant: 'error' }),
    });
    
    const handleFilterChange = useCallback((event) => {
        setFilters(prev => ({ ...prev, search: event.target.value }));
        setPaginationModel(prev => ({ ...prev, page: 0 }));
    }, []);

    const handleConfirmDeactivation = useCallback(() => {
        if (productToDeactivate) {
            deactivateProduct(productToDeactivate.sku);
        }
        setProductToDeactivate(null);
    }, [productToDeactivate, deactivateProduct]);

    const handleOpenModal = useCallback((productId) => {
        setModalState({ open: true, productId: productId });
    }, []);
    
    const handleCloseModal = useCallback(() => {
        setModalState({ open: false, productId: null });
    }, []);

    const columns = useMemo(() => [
        { field: 'sku', headerName: 'SKU', width: 150 },
        { field: 'name', headerName: 'Nombre', flex: 1, minWidth: 250 },
        { field: 'brand', headerName: 'Marca', width: 120 },
        { field: 'stock_quantity', headerName: 'Stock Total', type: 'number', width: 110, align: 'center', headerAlign: 'center' },
        { field: 'average_cost', headerName: 'Costo Prom.', type: 'number', width: 120, align: 'right', headerAlign: 'right', valueFormatter: (value) => `S/ ${Number(value).toFixed(2)}` },
        { field: 'price', headerName: 'Precio Venta', type: 'number', width: 120, align: 'right', headerAlign: 'right', valueFormatter: (value) => `S/ ${Number(value).toFixed(2)}` },
        {
            field: 'actions',
            headerName: 'Acciones',
            type: 'actions',
            width: 150,
            align: 'center',
            getActions: ({ row }) => [
                <Tooltip title="Ver Lotes de Inventario" key="lots"><IconButton onClick={() => handleOpenModal(row.id)} size="small"><WarehouseIcon /></IconButton></Tooltip>,
                <Tooltip title="Editar Producto" key="edit"><IconButton onClick={() => navigate(`/inventario/productos/editar/${encodeURIComponent(row.sku)}`)} size="small"><EditIcon /></IconButton></Tooltip>,
                <Tooltip title="Desactivar Producto" key="delete"><IconButton onClick={() => setProductToDeactivate(row)} size="small" color="error"><DeleteIcon /></IconButton></Tooltip>,
            ],
        },
    ], [navigate, handleOpenModal]);

    const toolbarProps = {
        title: "Gestión de Productos",
        addButtonText: "Añadir Nuevo Producto",
        onAddClick: () => navigate('/inventario/productos/nuevo'),
        searchTerm: filters.search,
        onSearchChange: handleFilterChange,
        searchPlaceholder: "Buscar por SKU o Nombre...",
    };

    return (
        <>
            <Container maxWidth="xl" sx={{ my: 4 }}>
                <Paper sx={{ p: 0, borderRadius: 2, boxShadow: 3, overflow: 'hidden' }}>
                    {error && <Alert severity="error" sx={{ m: 2 }}>{error.message}</Alert>}
                    <DataGrid
                        rows={data?.items || []}
                        columns={columns}
                        getRowId={(row) => row.id}
                        loading={isLoading || isFetching}
                        rowCount={data?.total_count || 0}
                        paginationModel={paginationModel}
                        onPaginationModelChange={setPaginationModel}
                        paginationMode="server"
                        pageSizeOptions={[10, 25, 50, 100]}
                        slots={{ toolbar: DataGridToolbar }}
                        slotProps={{ toolbar: toolbarProps }}
                        density="compact"
                        localeText={esES.components.MuiDataGrid.defaultProps.localeText}
                    />
                </Paper>
            </Container>

            <InventoryLotsModal
                open={modalState.open}
                onClose={handleCloseModal}
                productId={modalState.productId}
            />

            <ConfirmationDialog
                open={!!productToDeactivate}
                onClose={() => setProductToDeactivate(null)}
                onConfirm={handleConfirmDeactivation}
                isConfirming={isDeactivating}
                title="Confirmar Desactivación"
                message={`¿Seguro que deseas desactivar el producto con SKU '${productToDeactivate?.sku}'?`}
            />
        </>
    );
};

export default ProductListPage;