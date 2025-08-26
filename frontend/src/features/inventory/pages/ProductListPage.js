// File: /frontend/src/features/inventory/pages/ProductListPage.js

/**
 * @file Página principal para la visualización y gestión del catálogo de productos.
 * @description Muestra una tabla paginada de productos con capacidades de búsqueda,
 * filtrado y acciones como edición, desactivación y visualización de lotes de inventario.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { Container, Paper, Alert } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { esES } from '@mui/x-data-grid/locales';

import { getProductsAPI, deactivateProductAPI } from '../api/productsAPI';
import useDebounce from '../../../hooks/useDebounce';
import ConfirmationDialog from '../../../components/common/ConfirmationDialog';
import DataGridToolbar from '../../../components/common/DataGridToolbar';
import InventoryLotsModal from '../components/InventoryLotsModal';
import PageHeader from '../../../components/common/PageHeader';
import { formatApiError } from '../../../utils/errorUtils';
import { createProductColumns } from '../components/productGridConfig';

// ==============================================================================
// SECCIÓN 2: COMPONENTE PRINCIPAL DE LA PÁGINA
// ==============================================================================

const ProductListPage = () => {
    // --------------------------------------------------------------------------
    // Sub-sección 2.1: Hooks y Estado Local
    // --------------------------------------------------------------------------
    
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();

    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });
    const [searchTerm, setSearchTerm] = useState('');
    const [lotsModalState, setLotsModalState] = useState({ open: false, product: null });
    const [deactivationState, setDeactivationState] = useState({ open: false, product: null });

    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    // --------------------------------------------------------------------------
    // Sub-sección 2.2: Lógica de Obtención y Mutación de Datos
    // --------------------------------------------------------------------------
    
    const { data, isLoading, isFetching, error } = useQuery({
        queryKey: ['products', paginationModel, debouncedSearchTerm],
        queryFn: () => getProductsAPI({
            page: paginationModel.page + 1,
            pageSize: paginationModel.pageSize, // Consistente con otros módulos
            search: debouncedSearchTerm,
        }),
        placeholderData: (previousData) => previousData,
    });

    const { mutate: deactivateProduct, isPending: isDeactivating } = useMutation({
        mutationFn: (productId) => deactivateProductAPI(productId),
        onSuccess: (data, productId) => {
            enqueueSnackbar(`Producto ID '${productId}' desactivado correctamente.`, { variant: 'success' });
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
        onError: (error) => {
            enqueueSnackbar(formatApiError(error), { variant: 'error' });
        },
    });

    // --------------------------------------------------------------------------
    // Sub-sección 2.3: Manejadores de Eventos
    // --------------------------------------------------------------------------
    
    const handleSearchChange = useCallback((event) => {
        setSearchTerm(event.target.value);
    }, []);
    
    const handleConfirmDeactivation = useCallback(() => {
        if (deactivationState.product) {
            deactivateProduct(deactivationState.product.id); // Se usa `id`
            setDeactivationState({ open: false, product: null });
        }
    }, [deactivationState.product, deactivateProduct]);

    // --------------------------------------------------------------------------
    // Sub-sección 2.4: Configuración de la DataGrid
    // --------------------------------------------------------------------------
    
    const columns = useMemo(() => createProductColumns({
        onEdit: (productId) => navigate(`/inventario/productos/${productId}`),
        onDeactivate: (product) => setDeactivationState({ open: true, product }),
        onViewLots: (product) => setLotsModalState({ open: true, product }),
    }), [navigate]);

    // --------------------------------------------------------------------------
    // Sub-sección 2.5: Renderizado del Componente
    // --------------------------------------------------------------------------
    
    return (
        <>
            <Container maxWidth="xl" sx={{ my: 4 }}>
                <PageHeader
                    title="Catálogo de Productos"
                    subtitle="Visualice y gestione todos los artículos registrados en el sistema."
                    addButtonText="Añadir Producto"
                    onAddClick={() => navigate('/inventario/productos/nuevo')}
                />
                <Paper sx={{ height: '75vh', width: '100%', mt: 3, borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    {error && <Alert severity="error" sx={{ m: 2 }}>{`Error al cargar productos: ${formatApiError(error)}`}</Alert>}
                    <DataGrid
                        rows={data?.items || []}
                        columns={columns}
                        getRowId={(row) => row.id} // Se usa `id`
                        rowCount={data?.total_count || 0}
                        paginationModel={paginationModel}
                        onPaginationModelChange={setPaginationModel}
                        paginationMode="server"
                        pageSizeOptions={[10, 25, 50, 100]}
                        loading={isLoading || isFetching}
                        density="compact"
                        localeText={esES.components.MuiDataGrid.defaultProps.localeText}
                        slots={{ toolbar: DataGridToolbar }}
                        slotProps={{
                            toolbar: {
                                showAddButton: false, // El botón ya está en PageHeader
                                searchTerm: searchTerm,
                                onSearchChange: handleSearchChange,
                                searchPlaceholder: "Buscar por SKU, Nombre o Marca...",
                            }
                        }}
                        disableRowSelectionOnClick
                        sx={{ border: 'none' }}
                    />
                </Paper>
            </Container>

            {lotsModalState.open && (
                <InventoryLotsModal
                    open={lotsModalState.open}
                    onClose={() => setLotsModalState({ open: false, product: null })}
                    productId={lotsModalState.product?.id} // Se usa `id`
                    productName={lotsModalState.product?.name}
                />
            )}

            {deactivationState.open && (
                <ConfirmationDialog
                    isOpen={deactivationState.open}
                    onClose={() => setDeactivationState({ open: false, product: null })}
                    onConfirm={handleConfirmDeactivation}
                    isLoading={isDeactivating}
                    title="Confirmar Desactivación"
                    content={`¿Está seguro que desea desactivar el producto '${deactivationState.product?.name}' (SKU: ${deactivationState.product?.sku})?`}
                />
            )}
        </>
    );
};

export default ProductListPage;