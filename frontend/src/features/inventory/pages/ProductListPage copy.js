// /frontend/src/features/inventory/pages/ProductListPage.js

import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Paper, Alert, IconButton, Tooltip, Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { esES } from '@mui/x-data-grid/locales';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import HistoryIcon from '@mui/icons-material/History';
import { useSnackbar } from 'notistack';

import { getProductsAPI, deactivateProductAPI } from '../api/productsAPI';
import useDebounce from '../../../hooks/useDebounce';
import { PRODUCT_CATEGORIES, FILTER_TYPES, PRODUCT_SHAPES } from '../../../constants/productConstants';
import ConfirmationDialog from '../../../components/common/ConfirmationDialog';
import FilterBar from '../../../components/common/FilterBar';
import ProductGridToolbar from '../components/ProductGridToolbar';

const productFilterDefinitions = [
  { name: 'search', label: 'Buscar por SKU o Nombre', type: 'search', gridSize: 4 },
  { name: 'category', label: 'Categoría', type: 'select', options: PRODUCT_CATEGORIES, gridSize: 3 },
  { name: 'product_type', label: 'Tipo', type: 'select', options: FILTER_TYPES, gridSize: 3, disabled: (filters) => filters.category !== 'filter' },
  { name: 'shape', label: 'Forma', type: 'select', options: PRODUCT_SHAPES, gridSize: 2, disabled: (filters) => filters.category !== 'filter' },
];

const ProductListPage = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [filters, setFilters] = useState({ search: '', category: '', product_type: '', shape: '' });
  const [productToDeactivate, setProductToDeactivate] = useState(null);

  const debouncedFilters = useDebounce(filters, 500);

  const { data: queryData, isLoading, isFetching, error } = useQuery({
    queryKey: ['products', paginationModel, debouncedFilters],
    queryFn: async () => {
      const params = {
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize,
        search: debouncedFilters.search.trim(),
        product_category: debouncedFilters.category,
        product_type: debouncedFilters.product_type,
        shape: debouncedFilters.shape,
      };
      // Usamos el nombre de propiedad 'total_count' para alinearnos con el backend.
      const response = await getProductsAPI(params);
      const flattenedProducts = response.items.map(p => ({ ...p, ...(p.specifications || {}) }));
      return { items: flattenedProducts, total_count: response.total_count };
    },
    keepPreviousData: true,
    // Práctica de robustez: Proporciona datos iniciales para que la Grid nunca reciba 'undefined'.
    initialData: { items: [], total_count: 0 },
  });

  // Práctica de robustez: Estabiliza el objeto de datos para la UI.
  const data = useMemo(() => queryData || { items: [], total_count: 0 }, [queryData]);

  const { mutate: deactivateProduct, isPending: isDeactivating } = useMutation({
    mutationFn: deactivateProductAPI,
    onSuccess: (data, sku) => {
      enqueueSnackbar(`Producto con SKU '${sku}' desactivado.`, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err) => {
      enqueueSnackbar(err.response?.data?.detail || 'Error al desactivar.', { variant: 'error' });
    }
  });

  const handleFilterChange = useCallback((event) => {
    const { name, value } = event.target;
    setPaginationModel(prev => ({ ...prev, page: 0 }));
    setFilters(prevFilters => {
      const newFilters = { ...prevFilters, [name]: value };
      if (name === 'category' && value !== 'filter') {
        newFilters.product_type = '';
        newFilters.shape = '';
      }
      return newFilters;
    });
  }, []);

  const handleOpenDeleteDialog = useCallback((product) => setProductToDeactivate(product), []);
  const handleCloseDeleteDialog = useCallback(() => setProductToDeactivate(null), []);

  const handleConfirmDeactivation = useCallback(() => {
    if (productToDeactivate) deactivateProduct(productToDeactivate.sku);
    handleCloseDeleteDialog();
  }, [productToDeactivate, deactivateProduct, handleCloseDeleteDialog]);

  const columns = useMemo(() => [
    { field: 'sku', headerName: 'Código/SKU', width: 140 },
    { field: 'name', headerName: 'Nombre', flex: 1, minWidth: 200 },
    { field: 'brand', headerName: 'Marca', width: 120 },
    { field: 'price', headerName: 'Precio', type: 'number', width: 110, align: 'right', headerAlign: 'right', valueFormatter: (value) => value != null ? `S/ ${Number(value).toFixed(2)}` : '' },
    { field: 'stock_quantity', headerName: 'Stock', type: 'number', width: 90, align: 'center', headerAlign: 'center' },
    {
      field: 'actions', headerName: 'Acciones', type: 'actions', width: 130, align: 'right', headerAlign: 'right',
      getActions: (params) => [
        <Tooltip title="Ver Movimientos" key="history"><IconButton onClick={() => navigate(`/inventario/productos/movimientos/${encodeURIComponent(params.row.sku)}`)} size="small"><HistoryIcon /></IconButton></Tooltip>,
        <Tooltip title="Editar Producto" key="edit"><IconButton onClick={() => navigate(`/inventario/productos/editar/${encodeURIComponent(params.row.sku)}`)} size="small" color="primary"><EditIcon /></IconButton></Tooltip>,
        <Tooltip title="Desactivar Producto" key="delete"><IconButton onClick={() => handleOpenDeleteDialog(params.row)} size="small" color="error"><DeleteIcon /></IconButton></Tooltip>,
      ],
    },
  ], [navigate, handleOpenDeleteDialog]);

  // --- ¡SOLUCIÓN DEFINITIVA! ---
  // Se usa useCallback para memoizar la función que crea el Toolbar.
  // Esto asegura que la referencia al componente sea estable entre re-renderizados,
  // evitando que la DataGrid reinicie su estado interno.
  const memoizedToolbar = useCallback(
    () => (
      <ProductGridToolbar
        onAddClick={() => navigate('/inventario/productos/nuevo')}
      />
    ),
    [navigate]
  );

  return (
    <>
      <Container maxWidth="xl">
        <Paper sx={{ p: { xs: 2, md: 3 }, my: 4, borderRadius: 2, boxShadow: 3 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 2 }}>
            Gestión de Productos
          </Typography>
          <FilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
            filterDefinitions={productFilterDefinitions}
          />
          <Box sx={{ flexGrow: 1, width: '100%', mt: 2, height: 'calc(100vh - 350px)' }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error.message}</Alert>}
            <DataGrid
              rows={data.items}
              columns={columns}
              getRowId={(row) => row._id}
              loading={isLoading || isFetching}
              rowCount={data.total_count}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              paginationMode="server"
              pageSizeOptions={[10, 25, 50, 100]}
              // Se pasa el componente memoizado a la prop 'slots'.
              slots={{ toolbar: memoizedToolbar }}
              density="compact"
              localeText={esES.components.MuiDataGrid.defaultProps.localeText}
            />
          </Box>
        </Paper>
      </Container>
      <ConfirmationDialog
        open={!!productToDeactivate}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDeactivation}
        isConfirming={isDeactivating}
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