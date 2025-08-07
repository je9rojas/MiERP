// frontend/src/features/inventory/pages/ProductListPage.js

/**
 * @file Página principal para la visualización y gestión del catálogo de productos.
 * @description Muestra una tabla paginada de productos con capacidades de búsqueda,
 * filtrado y acciones como edición, desactivación y visualización de lotes de inventario.
 */

// SECCIÓN 1: IMPORTACIONES DE MÓDULOS
import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { Box, Container, Paper, Alert, IconButton, Tooltip } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { esES } from '@mui/x-data-grid/locales';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import WarehouseIcon from '@mui/icons-material/Warehouse';

import { getProductsAPI, deactivateProductAPI } from '../api/productsAPI';
import useDebounce from '../../../hooks/useDebounce';
import ConfirmationDialog from '../../../components/common/ConfirmationDialog';
import DataGridToolbar from '../../../components/common/DataGridToolbar';
import InventoryLotsModal from '../components/InventoryLotsModal';

// SECCIÓN 2: FUNCIONES DE UTILIDAD
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

// SECCIÓN 3: COMPONENTE PRINCIPAL DE LA PÁGINA
const ProductListPage = () => {
    // Sub-sección 3.1: Hooks y Estado Local
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();

    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });
    const [filters, setFilters] = useState({ search: '' });
    const [modalState, setModalState] = useState({ open: false, product: null });
    const [productToDeactivate, setProductToDeactivate] = useState(null);

    const debouncedSearchTerm = useDebounce(filters.search, 500);

    // Sub-sección 3.2: Lógica de Fetching y Mutaciones (react-query)
    const { data, isLoading, isFetching, error } = useQuery({
        queryKey: ['products', paginationModel, debouncedSearchTerm],
        queryFn: () => getProductsAPI({
            page: paginationModel.page + 1,
            page_size: paginationModel.pageSize,
            search: debouncedSearchTerm,
        }),
        keepPreviousData: true,
    });

    const { mutate: deactivateProduct, isPending: isDeactivating } = useMutation({
        mutationFn: deactivateProductAPI,
        onSuccess: (data, sku) => {
            enqueueSnackbar(`Producto '${sku}' desactivado correctamente.`, { variant: 'success' });
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
        onError: (err) => {
            const errorMessage = err.response?.data?.detail || 'Ocurrió un error al desactivar el producto.';
            enqueueSnackbar(errorMessage, { variant: 'error' });
        },
    });

    // Sub-sección 3.3: Manejadores de Eventos y Callbacks
    const handleFilterChange = useCallback((event) => {
        setFilters(prev => ({ ...prev, search: event.target.value }));
        setPaginationModel(prev => ({ ...prev, page: 0 }));
    }, []);
    
    const handleConfirmDeactivation = useCallback(() => {
        if (productToDeactivate) {
            deactivateProduct(productToDeactivate.sku);
            setProductToDeactivate(null);
        }
    }, [productToDeactivate, deactivateProduct]);

    // Sub-sección 3.4: Definición de Columnas para la DataGrid (Memoizada)
    const columns = useMemo(() => [
        { field: 'sku', headerName: 'SKU', width: 150 },
        { field: 'name', headerName: 'Nombre', flex: 1, minWidth: 250 },
        { field: 'brand', headerName: 'Marca', width: 120 },
        { field: 'stock_quantity', headerName: 'Stock Total', type: 'number', width: 110, align: 'center', headerAlign: 'center' },
        { 
            field: 'average_cost', 
            headerName: 'Costo Prom.', 
            type: 'number', 
            width: 120, 
            align: 'right', 
            headerAlign: 'right', 
            valueFormatter: (params) => formatCurrency(params.value)
        },
        { 
            field: 'price', 
            headerName: 'Precio Venta', 
            type: 'number', 
            width: 120, 
            align: 'right', 
            headerAlign: 'right', 
            valueFormatter: (params) => formatCurrency(params.value)
        },
        {
            field: 'actions',
            headerName: 'Acciones',
            type: 'actions',
            width: 150,
            align: 'center',
            headerAlign: 'center',
            getActions: ({ row }) => [
                <Tooltip title="Ver Lotes de Inventario" key="lots">
                    <IconButton onClick={() => setModalState({ open: true, product: row })} size="small"><WarehouseIcon /></IconButton>
                </Tooltip>,
                <Tooltip title="Editar Producto" key="edit">
                    <IconButton onClick={() => navigate(`/inventario/productos/editar/${encodeURIComponent(row.sku)}`)} size="small"><EditIcon /></IconButton>
                </Tooltip>,
                <Tooltip title="Desactivar Producto" key="delete">
                    <IconButton onClick={() => setProductToDeactivate(row)} size="small" color="error"><DeleteIcon /></IconButton>
                </Tooltip>,
            ],
        },
    ], [navigate]);

    // Sub-sección 3.5: Configuración de la Barra de Herramientas
    const toolbarProps = {
        title: "Catálogo de Productos",
        addButtonText: "Añadir Producto",
        onAddClick: () => navigate('/inventario/productos/nuevo'),
        searchTerm: filters.search,
        onSearchChange: handleFilterChange,
        searchPlaceholder: "Buscar por SKU, Nombre o Marca...",
    };

    // Sub-sección 3.6: Renderizado del Componente
    return (
        <>
            <Container maxWidth="xl" sx={{ my: 4 }}>
                <Paper sx={{ height: '75vh', width: '100%', borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    {error && <Alert severity="error" sx={{ m: 2 }}>{`Error al cargar productos: ${error.message}`}</Alert>}
                    <DataGrid
                        rows={data?.items || []}
                        columns={columns}
                        getRowId={(row) => row._id}
                        rowCount={data?.total_count || 0}
                        paginationModel={paginationModel}
                        onPaginationModelChange={setPaginationModel}
                        paginationMode="server"
                        pageSizeOptions={[10, 25, 50, 100]}
                        loading={isLoading || isFetching}
                        density="compact"
                        localeText={esES.components.MuiDataGrid.defaultProps.localeText}
                        slots={{ toolbar: DataGridToolbar }}
                        slotProps={{ toolbar: toolbarProps }}
                        disableRowSelectionOnClick
                        sx={{ border: 'none' }}
                    />
                </Paper>
            </Container>

            <InventoryLotsModal
                open={modalState.open}
                onClose={() => setModalState({ open: false, product: null })}
                productId={modalState.product?._id}
                productName={modalState.product?.name}
            />

            <ConfirmationDialog
                open={!!productToDeactivate}
                onClose={() => setProductToDeactivate(null)}
                onConfirm={handleConfirmDeactivation}
                isConfirming={isDeactivating}
                title="Confirmar Desactivación"
                message={`¿Está seguro que desea desactivar el producto '${productToDeactivate?.name}' (SKU: ${productToDeactivate?.sku})?`}
            />
        </>
    );
};

export default ProductListPage;