// /frontend/src/features/inventory/pages/ProductListPage.js

/**
 * @file Página de Gestión de Productos con carga diferida.
 * Este componente presenta una interfaz de búsqueda inicial y solo consulta la base de datos
 * después de que el usuario interactúa con los filtros, optimizando el rendimiento y la UX.
 */

// --- SECCIÓN 1: IMPORTACIONES ---
import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Paper, Alert, IconButton, Tooltip, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import HistoryIcon from '@mui/icons-material/History';
import SearchIcon from '@mui/icons-material/Search';
import { useSnackbar } from 'notistack';

import { getProductsAPI, deactivateProductAPI } from '../api/productsAPI';
import { useDebounce } from '../../../hooks/useDebounce';
import { PRODUCT_CATEGORIES, FILTER_TYPES, PRODUCT_SHAPES } from '../../../constants/productConstants';
import ConfirmationDialog from '../../../components/common/ConfirmationDialog';
import FilterBar from '../../../components/common/FilterBar';
import ProductGridToolbar from '../components/ProductGridToolbar';

// --- SECCIÓN 2: DEFINICIONES Y COMPONENTES AUXILIARES ---

const productFilterDefinitions = [
  { name: 'search', label: 'Buscar por SKU o Nombre', type: 'search', gridSize: 4 },
  { name: 'category', label: 'Filtrar por Categoría', type: 'select', options: PRODUCT_CATEGORIES, gridSize: 3 },
  { name: 'product_type', label: 'Filtrar por Tipo', type: 'select', options: FILTER_TYPES, gridSize: 3, disabled: (filters) => filters.category !== 'filter' },
  { name: 'shape', label: 'Filtrar por Forma', type: 'select', options: PRODUCT_SHAPES, gridSize: 2, disabled: (filters) => filters.category !== 'filter' },
];

/**
 * Componente que se muestra antes de la primera búsqueda, invitando al usuario a interactuar.
 */
const InitialSearchPrompt = () => (
  <Box sx={{ textAlign: 'center', p: 8, color: 'text.secondary', border: '2px dashed #ccc', mt: 4, borderRadius: 2 }}>
    <SearchIcon sx={{ fontSize: 60, mb: 2 }} />
    <Typography variant="h6" component="h2" gutterBottom>
      Encuentre un Producto
    </Typography>
    <Typography>
      Utilice la barra de búsqueda o los filtros de arriba para comenzar.
    </Typography>
  </Box>
);


// --- SECCIÓN 3: COMPONENTE PRINCIPAL DE LA PÁGINA ---

const ProductListPage = () => {
  // --- 3.1: Hooks y Gestión de Estado ---
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [filters, setFilters] = useState({ search: '', category: '', product_type: '', shape: '' });
  const [isDeleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [productToDeactivate, setProductToDeactivate] = useState(null);
  
  const debouncedFilters = useDebounce(filters, 400);
  // NUEVO ESTADO: Controla si se ha realizado al menos una búsqueda.
  const [hasSearched, setHasSearched] = useState(false);

  // --- 3.2: Lógica de Obtención y Mutación de Datos ---
  const { data, isLoading, isFetching, error } = useQuery({
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
      const response = await getProductsAPI(params);
      const flattenedProducts = response.items.map(p => ({ ...p, ...(p.specifications || {}) }));
      return { items: flattenedProducts, total: response.total };
    },
    // CAMBIO CLAVE: La consulta está deshabilitada por defecto y solo se activará
    // cuando 'hasSearched' se convierta en 'true'.
    enabled: hasSearched,
    keepPreviousData: true,
  });

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

  // --- 3.3: Manejadores de Eventos y Memoización ---
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
    // CAMBIO CLAVE: Al primer cambio de filtro, se activa la búsqueda.
    if (!hasSearched) {
      setHasSearched(true);
    }
  }, [hasSearched]); // Se añade 'hasSearched' como dependencia.
  
  const handleOpenDeleteDialog = useCallback((product) => {
    setProductToDeactivate(product);
    setDeleteConfirmationOpen(true);
  }, []);

  const handleCloseDeleteDialog = useCallback(() => {
    setDeleteConfirmationOpen(false);
    setProductToDeactivate(null);
  }, []);

  const handleConfirmDeactivation = useCallback(() => {
    if (productToDeactivate) {
      deactivateProduct(productToDeactivate.sku);
    }
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

  // --- 3.4: Renderizado del Componente ---


// /frontend/src/features/inventory/pages/ProductListPage.js

// ... (El resto de tu componente: importaciones, estado, lógica de datos, handlers y columnas)

  // --- 3.4: Renderizado del Componente ---
  return (
    <>
      <Container maxWidth="xl">
        <Paper 
          sx={{ 
            p: { xs: 2, md: 3 }, 
            my: 4, 
            borderRadius: 2, 
            boxShadow: 3 
          }}
        >
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 2 }}>
            Gestión de Productos
          </Typography>

          <FilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
            filterDefinitions={productFilterDefinitions}
          />
        
          {/* Lógica de renderizado condicional: Muestra el prompt o la tabla */}
          {!hasSearched ? (
            <InitialSearchPrompt />
          ) : (
            <Box sx={{ flexGrow: 1, width: '100%', mt: 2, height: 'calc(100vh - 350px)' }}>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error.message}</Alert>}
              <DataGrid
                rows={data?.items || []}
                columns={columns}
                getRowId={(row) => row._id}
                rowCount={data?.total || 0}
                loading={isLoading || isFetching}
                pageSizeOptions={[10, 25, 50, 100]}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                paginationMode="server"
                density="compact"
                slots={{
                  toolbar: (props) => (
                    <ProductGridToolbar 
                      {...props}
                      onAddClick={() => navigate('/inventario/productos/nuevo')}
                    />
                  ),
                }}
                
                // --- ¡CAMBIO CLAVE AQUÍ! ---
                // Se establece el estado de ordenación inicial del DataGrid.
                // Esto hará que, la primera vez que se carguen los datos,
                // la columna 'sku' aparezca con la flecha de orden ascendente.
                initialState={{
                  sorting: {
                    sortModel: [{ field: 'sku', sort: 'asc' }],
                  },
                }}
              />
            </Box>
          )}
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
