// /frontend/src/features/inventory/pages/ProductListPage.js

/**
 * @file Página principal para la gestión de productos del inventario.
 *
 * Este componente permite a los usuarios visualizar, buscar, filtrar y paginar
 * la lista de productos. Utiliza React Query para una gestión de datos eficiente
 * y una DataGrid de MUI para una presentación profesional de la información.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Alert,
  IconButton,
  Tooltip,
  Typography,
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

// ==============================================================================
// SECCIÓN 2: CONSTANTES Y DEFINICIONES
// ==============================================================================

const productFilterDefinitions = [
  { name: 'search', label: 'Buscar por SKU o Nombre', type: 'search', gridSize: 4 },
  { name: 'category', label: 'Categoría', type: 'select', options: PRODUCT_CATEGORIES, gridSize: 3 },
  { name: 'product_type', label: 'Tipo', type: 'select', options: FILTER_TYPES, gridSize: 3, disabled: (filters) => filters.category !== 'filter' },
  { name: 'shape', label: 'Forma', type: 'select', options: PRODUCT_SHAPES, gridSize: 2, disabled: (filters) => filters.category !== 'filter' },
];

// ==============================================================================
// SECCIÓN 3: COMPONENTE PRINCIPAL DE LA PÁGINA
// ==============================================================================

const ProductListPage = () => {
  // --- 3.1: Hooks y Gestión de Estado ---
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });
  const [filters, setFilters] = useState({ search: '', category: '', product_type: '', shape: '' });
  const [productToDeactivate, setProductToDeactivate] = useState(null);

  const debouncedFilters = useDebounce(filters, 500);

  // --- 3.2: Lógica de Obtención y Mutación de Datos ---
  const { data: queryData, isLoading, isFetching, error } = useQuery({
    queryKey: ['products', paginationModel, debouncedFilters],
    queryFn: async () => {
      const rawParams = {
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize,
        search: debouncedFilters.search.trim(),
        product_category: debouncedFilters.category,
        product_type: debouncedFilters.product_type,
        shape: debouncedFilters.shape,
      };
      const cleanParams = Object.fromEntries(Object.entries(rawParams).filter(([, value]) => value));
      return await getProductsAPI(cleanParams);
    },
    placeholderData: (previousData) => previousData,
  });

  const data = useMemo(() => queryData || { items: [], total_count: 0 }, [queryData]);

  const { mutate: deactivateProduct, isPending: isDeactivating } = useMutation({
    mutationFn: deactivateProductAPI,
    onSuccess: (data, sku) => {
      enqueueSnackbar(`Producto con SKU '${sku}' desactivado correctamente.`, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err) => {
      enqueueSnackbar(err.response?.data?.detail || 'Error al desactivar el producto.', { variant: 'error' });
    }
  });

  // --- 3.3: Manejadores de Eventos (Callbacks Memoizados) ---
  const handleFilterChange = useCallback((event) => {
    const { name, value } = event.target;
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
    setFilters((prevFilters) => {
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
    if (productToDeactivate) {
      deactivateProduct(productToDeactivate.sku);
    }
    handleCloseDeleteDialog();
  }, [productToDeactivate, deactivateProduct, handleCloseDeleteDialog]);

  // --- 3.4: Definición de Columnas y Toolbar (Memoizadas para Rendimiento) ---
  const columns = useMemo(() => [
    { field: 'sku', headerName: 'Código/SKU', width: 140 },
    { field: 'brand', headerName: 'Marca', width: 120 },
    { field: 'cost', headerName: 'Costo', type: 'number', width: 100, align: 'right', headerAlign: 'right', valueFormatter: (value) => value != null ? `S/ ${Number(value).toFixed(2)}` : '' },
    { field: 'price', headerName: 'Precio', type: 'number', width: 100, align: 'right', headerAlign: 'right', valueFormatter: (value) => value != null ? `S/ ${Number(value).toFixed(2)}` : '' },
    { field: 'stock_quantity', headerName: 'Stock', type: 'number', width: 90, align: 'center', headerAlign: 'center' },
    
    { field: 'dimA', headerName: 'A', width: 70, align: 'center', headerAlign: 'center', renderCell: (params) => params.row.dimensions?.a || '' },
    { field: 'dimB', headerName: 'B', width: 70, align: 'center', headerAlign: 'center', renderCell: (params) => params.row.dimensions?.b || '' },
    { field: 'dimC', headerName: 'C', width: 70, align: 'center', headerAlign: 'center', renderCell: (params) => params.row.dimensions?.c || '' },
    { field: 'dimF', headerName: 'F', width: 70, align: 'center', headerAlign: 'center', renderCell: (params) => params.row.dimensions?.f || '' },
    { field: 'dimG', headerName: 'G', width: 120, align: 'center', headerAlign: 'center', renderCell: (params) => params.row.dimensions?.g || '' },
    { field: 'dimH', headerName: 'H', width: 70, align: 'center', headerAlign: 'center', renderCell: (params) => params.row.dimensions?.h || '' },
    
    {
      field: 'actions',
      headerName: 'Acciones',
      type: 'actions',
      flex: 1,
      minWidth: 120,
      align: 'right',
      headerAlign: 'right',
      getActions: ({ row }) => [
        <Tooltip title="Editar Producto" key="edit"><IconButton onClick={() => navigate(`/inventario/productos/editar/${encodeURIComponent(row.sku)}`)} size="small" color="primary"><EditIcon /></IconButton></Tooltip>,
        <Tooltip title="Ver Movimientos" key="history"><IconButton onClick={() => navigate(`/inventario/productos/movimientos/${encodeURIComponent(row.sku)}`)} size="small"><HistoryIcon /></IconButton></Tooltip>,
        <Tooltip title="Desactivar Producto" key="delete"><IconButton onClick={() => handleOpenDeleteDialog(row)} size="small" color="error"><DeleteIcon /></IconButton></Tooltip>,
      ],
    },
  ], [navigate, handleOpenDeleteDialog]);

  const memoizedToolbar = useCallback(() => (
    <ProductGridToolbar onAddClick={() => navigate('/inventario/productos/nuevo')} />
  ), [navigate]);

  // --- 3.5: Renderizado del Componente ---
  return (
    <>
      <Container maxWidth={false} sx={{ maxWidth: '1600px' }}>
        <Paper sx={{ p: { xs: 2, md: 3 }, my: 4, borderRadius: 2, boxShadow: 3 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 3 }}>
            Gestión de Productos
          </Typography>
          <FilterBar filters={filters} onFilterChange={handleFilterChange} filterDefinitions={productFilterDefinitions} />
          <Box sx={{ flexGrow: 1, width: '100%', mt: 3, height: 'calc(100vh - 380px)' }}>
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
              slots={{ toolbar: memoizedToolbar }}
              slotProps={{ toolbar: { showQuickFilter: true } }}
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
          ¿Seguro que deseas desactivar el producto <strong>{productToDeactivate?.name || productToDeactivate?.sku}</strong> con SKU <strong>{productToDeactivate?.sku}</strong>?
        </Typography>
      </ConfirmationDialog>
    </>
  );
};

export default ProductListPage;