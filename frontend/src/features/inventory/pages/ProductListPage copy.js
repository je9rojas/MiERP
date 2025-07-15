// /frontend/src/features/inventory/pages/ProductListPage.js
// VERSIÓN FINAL Y PROFESIONAL CON ARQUITECTURA OPTIMIZADA

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Paper, Alert, IconButton, Tooltip, Typography
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import HistoryIcon from '@mui/icons-material/History';
import { useSnackbar } from 'notistack';

// API y Hooks
import { getProductsAPI, deactivateProductAPI } from '../api/productsAPI';
import { useDebounce } from '../../../hooks/useDebounce';

// Constantes y Componentes Reutilizables
import { PRODUCT_CATEGORIES, FILTER_TYPES, PRODUCT_SHAPES } from '../../../constants/productConstants';
import PageHeader from '../../../components/common/PageHeader';
import ConfirmationDialog from '../../../components/common/ConfirmationDialog';
import FilterBar from '../../../components/common/FilterBar';

// --- Definición de los Filtros para esta página ---
// Se define fuera del componente para que no se recree en cada render.
const productFilterDefinitions = [
  { name: 'search', label: 'Buscar por SKU o Nombre', type: 'search', gridSize: 4 },
  { name: 'category', label: 'Filtrar por Producto', type: 'select', options: PRODUCT_CATEGORIES, gridSize: 3 },
  { name: 'product_type', label: 'Filtrar por Tipo', type: 'select', options: FILTER_TYPES, gridSize: 3, disabled: (filters) => filters.category !== 'filter' },
  { name: 'shape', label: 'Filtrar por Forma', type: 'select', options: PRODUCT_SHAPES, gridSize: 2, disabled: (filters) => filters.category !== 'filter' },
];


const ProductListPage = () => {
  // --- SECCIÓN 1: Hooks y Estados ---
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  // Estados para la data de la tabla y UI
  const [products, setProducts] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para el diálogo de confirmación
  const [isDeleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [productToDeactivate, setProductToDeactivate] = useState(null);

  // Estados para paginación y filtros
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [filters, setFilters] = useState({ search: '', category: '', product_type: '', shape: '' });
  const debouncedSearchTerm = useDebounce(filters.search, 500);

  // --- SECCIÓN 2: Lógica de Datos y Handlers ---

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize,
        search: debouncedSearchTerm.trim(),
        product_category: filters.category,
        product_type: filters.product_type,
        shape: filters.shape,
      };
      const response = await getProductsAPI(params);
      const flattenedProducts = response.items.map(p => ({ ...p, ...(p.specifications || {}) }));
      
      setProducts(flattenedProducts);
      setRowCount(response.total);
      setError(null);
    } catch (err) {
      setError('No se pudieron cargar los productos. Verifique la conexión con el servidor.');
      console.error("Error fetching products:", err);
    } finally {
      setIsLoading(false);
    }
  }, [paginationModel, debouncedSearchTerm, filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

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
    setProductToDeactivate(null);
  }, []);

  const handleConfirmDeactivation = useCallback(async () => {
    if (!productToDeactivate) return;
    try {
      await deactivateProductAPI(productToDeactivate.sku);
      enqueueSnackbar(`Producto '${productToDeactivate.name}' desactivado.`, { variant: 'success' });
      fetchProducts();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.detail || 'Error al desactivar el producto.', { variant: 'error' });
    } finally {
      handleCloseDeleteDialog();
    }
  }, [productToDeactivate, enqueueSnackbar, fetchProducts, handleCloseDeleteDialog]);
  
  // --- SECCIÓN 3: Definición de Columnas para DataGrid ---
  const columns = useMemo(() => [
    { field: 'sku', headerName: 'Código/SKU', width: 140 },
    { field: 'name', headerName: 'Nombre', flex: 1, minWidth: 200 },
    { field: 'brand', headerName: 'Marca', width: 120 },
    {
      field: 'cost',
      headerName: 'Costo',
      type: 'number',
      width: 110,
      align: 'right',
      headerAlign: 'right',
      valueFormatter: (value) => value != null ? `S/ ${Number(value).toFixed(2)}` : ''
    },
    {
      field: 'price',
      headerName: 'Precio',
      type: 'number',
      width: 110,
      align: 'right',
      headerAlign: 'right',
      valueFormatter: (value) => value != null ? `S/ ${Number(value).toFixed(2)}` : ''
    },
    { field: 'stock_quantity', headerName: 'Stock', type: 'number', width: 90, align: 'center', headerAlign: 'center' },
    {
      field: 'actions',
      headerName: 'Acciones',
      type: 'actions',
      width: 130,
      align: 'right',
      headerAlign: 'right',
      getActions: (params) => [
        <Tooltip title="Ver Movimientos" key="history"><IconButton onClick={() => console.log(`Ver movimientos para: ${params.row.sku}`)} size="small"><HistoryIcon /></IconButton></Tooltip>,
        <Tooltip title="Editar Producto" key="edit"><IconButton onClick={() => navigate(`/inventario/productos/editar/${params.row.sku}`)} size="small" color="primary"><EditIcon /></IconButton></Tooltip>,
        <Tooltip title="Desactivar Producto" key="delete"><IconButton onClick={() => handleOpenDeleteDialog(params.row)} size="small" color="error"><DeleteIcon /></IconButton></Tooltip>,
      ],
    },
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
        
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box sx={{ height: 650, width: '100%' }}>
            <DataGrid
              rows={products}
              columns={columns}
              getRowId={(row) => row._id}
              rowCount={rowCount}
              loading={isLoading}
              pageSizeOptions={[10, 25, 50, 100]}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              paginationMode="server"
              density="compact"
              disableRowSelectionOnClick
              localeText={{ noRowsLabel: 'No se encontraron productos que coincidan con los filtros.' }}
            />
          </Box>
        </Paper>
      </Container>
      
      <ConfirmationDialog
        open={isDeleteConfirmationOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDeactivation}
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