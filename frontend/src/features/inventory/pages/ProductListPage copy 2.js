// /frontend/src/features/inventory/pages/ProductListPage.js
// VERSIÓN FINAL REFACTORIZADA CON REACT QUERY PARA GESTIÓN DE ESTADO DEL SERVIDOR

import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Paper, Alert, IconButton, Tooltip, Typography
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import HistoryIcon from '@mui/icons-material/History';
import { useSnackbar } from 'notistack';

// API, Hooks, Constantes y Componentes
import { getProductsAPI, deactivateProductAPI } from '../api/productsAPI';
import { useDebounce } from '../../../hooks/useDebounce';
import { PRODUCT_CATEGORIES, FILTER_TYPES, PRODUCT_SHAPES } from '../../../constants/productConstants';
import PageHeader from '../../../components/common/PageHeader';
import ConfirmationDialog from '../../../components/common/ConfirmationDialog';
import FilterBar from '../../../components/common/FilterBar';

// --- Definición de Filtros (fuera del componente) ---
const productFilterDefinitions = [
  { name: 'search', label: 'Buscar por SKU o Nombre', type: 'search', gridSize: 4 },
  { name: 'category', label: 'Filtrar por Producto', type: 'select', options: PRODUCT_CATEGORIES, gridSize: 3 },
  { name: 'product_type', label: 'Filtrar por Tipo', type: 'select', options: FILTER_TYPES, gridSize: 3, disabled: (filters) => filters.category !== 'filter' },
  { name: 'shape', label: 'Filtrar por Forma', type: 'select', options: PRODUCT_SHAPES, gridSize: 2, disabled: (filters) => filters.category !== 'filter' },
];


const ProductListPage = () => {
  // --- SECCIÓN 1: Hooks y Estados de UI ---
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  // Estados para la interacción del usuario (diálogos, paginación, filtros)
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [filters, setFilters] = useState({ search: '', category: '', product_type: '', shape: '' });
  const [isDeleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [productToDeactivate, setProductToDeactivate] = useState(null);

  // El hook de debounce ahora solo aplica al término de búsqueda
  const debouncedSearchTerm = useDebounce(filters.search, 500);

  // --- SECCIÓN 2: Lógica de Datos con React Query ---

  // `useQuery` maneja el fetching, caché, estado de carga y errores automáticamente.
  const { data, isLoading, error } = useQuery({
    queryKey: ['products', paginationModel, { ...filters, search: debouncedSearchTerm }], // La clave de caché única
    queryFn: async () => {
      const params = {
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize,
        search: debouncedSearchTerm.trim(),
        product_category: filters.category,
        product_type: filters.product_type,
        shape: filters.shape,
      };
      const response = await getProductsAPI(params);
      // El aplanamiento de datos se realiza aquí, dentro de la lógica de datos.
      const flattenedProducts = response.items.map(p => ({ ...p, ...(p.specifications || {}) }));
      return { items: flattenedProducts, total: response.total };
    },
    keepPreviousData: true, // Mejora la UX al paginar, mostrando datos anteriores mientras cargan los nuevos.
  });

  // `useMutation` maneja la lógica para operaciones de cambio (POST, PUT, DELETE).
  const { mutate: deactivateProduct, isPending: isDeactivating } = useMutation({
    mutationFn: deactivateProductAPI, // La función de la API que ejecuta
    onSuccess: (data, sku) => {
      enqueueSnackbar(`Producto con SKU '${sku}' desactivado correctamente.`, { variant: 'success' });
      // Invalida la caché de 'products' para que `useQuery` vuelva a cargar los datos frescos.
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err) => {
      enqueueSnackbar(err.response?.data?.detail || 'Error al desactivar el producto.', { variant: 'error' });
    }
  });

  // --- SECCIÓN 3: Handlers y Memoización ---

  const handleFilterChange = useCallback((event) => {
    const { name, value } = event.target;
    setFilters(prevFilters => {
      const newFilters = { ...prevFilters, [name]: value };
      if (name === 'category' && value !== 'filter') {
        newFilters.product_type = '';
        newFilters.shape = '';
      }
      return newFilters;
    });
  }, []);
  
  const handleOpenDeleteDialog = useCallback((product) => {
    setProductToDeactivate(product);
    setDeleteConfirmationOpen(true);
  }, []);

  const handleCloseDeleteDialog = useCallback(() => {
    setDeleteConfirmationOpen(false);
  }, []);

  const handleConfirmDeactivation = useCallback(() => {
    if (!productToDeactivate) return;
    deactivateProduct(productToDeactivate.sku);
    handleCloseDeleteDialog();
  }, [productToDeactivate, deactivateProduct, handleCloseDeleteDialog]);

  const columns = useMemo(() => [
    // ... (Tu definición de columnas se mantiene igual)
    // Pero ahora, los handlers de acciones llaman a la mutación.
  ], [navigate, handleOpenDeleteDialog]);

  // --- SECCIÓN 4: Renderizado del Componente ---
  return (
    <>
      <Container maxWidth="xl">
        <Paper sx={{ p: { xs: 2, md: 3 }, my: 4, borderRadius: 2, boxShadow: 3 }}>
          <PageHeader
            title="Gestión de Productos"
            buttonText="Añadir Producto"
            onButtonClick={() => navigate('/inventario/productos/nuevo')}
          />
          <FilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
            filterDefinitions={productFilterDefinitions}
          />
        
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error.message}</Alert>}

          <Box sx={{ height: 650, width: '100%' }}>
            <DataGrid
              rows={data?.items || []} // Usa los datos de useQuery
              columns={columns}
              getRowId={(row) => row._id}
              rowCount={data?.total || 0}
              loading={isLoading}
              pageSizeOptions={[10, 25, 50, 100]}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              paginationMode="server"
              density="compact"
            />
          </Box>
        </Paper>
      </Container>
      
      <ConfirmationDialog
        open={isDeleteConfirmationOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDeactivation}
        isConfirming={isDeactivating} // Pasa el estado de carga al diálogo
        title="Confirmar Desactivación de Producto"
      >
        <Typography>
            ¿Seguro que deseas desactivar el producto <strong>{productToDeactivate?.name}</strong>?
        </Typography>
      </ConfirmationDialog>
    </>
  );
};

export default ProductListPage;