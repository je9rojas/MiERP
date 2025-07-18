// /frontend/src/features/inventory/pages/ProductListPage.js
// PÁGINA DE LISTA DE PRODUCTOS CON GESTIÓN DE ESTADO PROFESIONAL USANDO REACT QUERY

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

// --- SECCIÓN 1: IMPORTACIONES DE LA APLICACIÓN ---
import { getProductsAPI, deactivateProductAPI } from '../api/productsAPI';
import { useDebounce } from '../../../hooks/useDebounce';
import { PRODUCT_CATEGORIES, FILTER_TYPES, PRODUCT_SHAPES } from '../../../constants/productConstants';
import PageHeader from '../../../components/common/PageHeader';
import ConfirmationDialog from '../../../components/common/ConfirmationDialog';
import FilterBar from '../../../components/common/FilterBar';

// --- SECCIÓN 2: DEFINICIÓN DE CONFIGURACIONES (FUERA DEL COMPONENTE) ---
// Definir esto fuera evita que se recree en cada render.
const productFilterDefinitions = [
  { name: 'search', label: 'Buscar por SKU o Nombre', type: 'search', gridSize: 4 },
  { name: 'category', label: 'Filtrar por Producto', type: 'select', options: PRODUCT_CATEGORIES, gridSize: 3 },
  { name: 'product_type', label: 'Filtrar por Tipo', type: 'select', options: FILTER_TYPES, gridSize: 3, disabled: (filters) => filters.category !== 'filter' },
  { name: 'shape', label: 'Filtrar por Forma', type: 'select', options: PRODUCT_SHAPES, gridSize: 2, disabled: (filters) => filters.category !== 'filter' },
];


const ProductListPage = () => {
  // --- SECCIÓN 3: HOOKS Y ESTADOS DE UI ---
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  // Estados que controlan la interacción del usuario: paginación y filtros.
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [filters, setFilters] = useState({ search: '', category: '', product_type: '', shape: '' });
  
  // Estado para el diálogo de confirmación.
  const [isDeleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [productToDeactivate, setProductToDeactivate] = useState(null);

  // Hook personalizado para evitar llamadas a la API en cada pulsación de tecla.
  const debouncedFilters = useDebounce(filters, 400);

  // --- SECCIÓN 4: LÓGICA DE DATOS CON REACT QUERY ---

  // `useQuery` se encarga de obtener los datos, manejar la caché, el estado de carga y los errores.
  const { data, isLoading, error } = useQuery({
    // La 'queryKey' es un array que identifica unívocamente esta consulta.
    // React Query volverá a ejecutar la consulta si cualquier valor de esta clave cambia.
    queryKey: ['products', paginationModel, debouncedFilters],
    // 'queryFn' es la función asíncrona que obtiene los datos.
    queryFn: async () => {
      const params = {
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize,
        search: debouncedFilters.search.trim(),
        product_category: debouncedFilters.category,
        product_type: debouncedFilters.product_type,
        shape: debouncedFilters.shape,
      };
      const response = await getProductsAPI(params);
      // El aplanamiento de datos se realiza aquí, dentro de la lógica de datos.
      const flattenedProducts = response.items.map(p => ({ ...p, ...(p.specifications || {}) }));
      return { items: flattenedProducts, total: response.total };
    },
    // `keepPreviousData: true` mejora la UX al paginar, mostrando los datos anteriores
    // mientras se cargan los nuevos, evitando un parpadeo de la tabla vacía.
    keepPreviousData: true,
  });

  // `useMutation` maneja las operaciones de escritura (POST, PUT, DELETE).
  const { mutate: deactivateProduct, isPending: isDeactivating } = useMutation({
    mutationFn: deactivateProductAPI,
    onSuccess: (data, sku) => {
      enqueueSnackbar(`Producto con SKU '${sku}' desactivado correctamente.`, { variant: 'success' });
      // Invalida la caché de 'products', lo que le dice a React Query que los datos están obsoletos
      // y provoca que `useQuery` vuelva a ejecutar la consulta para refrescar la tabla.
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err) => {
      enqueueSnackbar(err.response?.data?.detail || 'Error al desactivar el producto.', { variant: 'error' });
    }
  });

  // --- SECCIÓN 5: HANDLERS Y MEMOIZACIÓN ---

  const handleFilterChange = useCallback((event) => {
    const { name, value } = event.target;
    // Volvemos a la primera página si se cambia un filtro para no ver una página vacía.
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
    { field: 'sku', headerName: 'Código/SKU', width: 140 },
    { field: 'name', headerName: 'Nombre', flex: 1, minWidth: 200 },
    { field: 'brand', headerName: 'Marca', width: 120 },
    {
      field: 'price', headerName: 'Precio', type: 'number', width: 110, align: 'right', headerAlign: 'right',
      valueFormatter: (value) => value != null ? `S/ ${Number(value).toFixed(2)}` : ''
    },
    { field: 'stock_quantity', headerName: 'Stock', type: 'number', width: 90, align: 'center', headerAlign: 'center' },
    {
      field: 'actions', headerName: 'Acciones', type: 'actions', width: 130, align: 'right', headerAlign: 'right',
      getActions: (params) => [
        <Tooltip title="Ver Movimientos" key="history"><IconButton onClick={() => navigate(`/inventario/productos/movimientos/${params.row.sku}`)} size="small"><HistoryIcon /></IconButton></Tooltip>,
        <Tooltip title="Editar Producto" key="edit"><IconButton onClick={() => navigate(`/inventario/productos/editar/${params.row.sku}`)} size="small" color="primary"><EditIcon /></IconButton></Tooltip>,
        <Tooltip title="Desactivar Producto" key="delete"><IconButton onClick={() => handleOpenDeleteDialog(params.row)} size="small" color="error"><DeleteIcon /></IconButton></Tooltip>,
      ],
    },
  ], [navigate, handleOpenDeleteDialog]);

  // --- SECCIÓN 6: RENDERIZADO DEL COMPONENTE ---
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

          <Box sx={{ height: 650, minHeight: 400, width: '100%' }}>
            <DataGrid
              rows={data?.items || []}
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