// /frontend/src/features/inventory/pages/ProductListPage.js
// VERSIÓN FINAL Y PROFESIONAL CON LÓGICA OPTIMIZADA Y ESTRUCTURA CLARA

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Container, Paper, Typography, Alert,
  IconButton, Tooltip, Dialog, DialogActions, DialogContent,
  DialogContentText, DialogTitle, TextField, Grid, InputAdornment, MenuItem
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { useSnackbar } from 'notistack';

import { getProductsAPI, deactivateProductAPI } from '../../../api/productsAPI';
import { useDebounce } from '../../../hooks/useDebounce';
import { PRODUCT_CATEGORIES, FILTER_TYPES, PRODUCT_SHAPES } from '../../../constants/productConstants';


const ProductListPage = () => {
  // --- SECCIÓN 1: Hooks y Estados ---
  // Centralizamos todos los hooks y estados al principio para una mejor legibilidad.
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [products, setProducts] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isDeleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [productToDeactivate, setProductToDeactivate] = useState(null);

  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    product_type: '',
    shape: '',
  });
  const debouncedSearchTerm = useDebounce(filters.search, 500);


  // --- SECCIÓN 2: Lógica de Datos y Handlers ---

  // useCallback memoriza la función para que no se recree en cada render,
  // optimizando el rendimiento y estabilizando las dependencias de otros hooks.
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize,
        search: debouncedSearchTerm.trim(),
        product_category: filters.category, // Mapeo correcto al backend
        product_type: filters.product_type,
        shape: filters.shape,
      };
      const response = await getProductsAPI(params);
      setProducts(response.items);
      setRowCount(response.total);
      setError(null);
    } catch (err) {
      setError('No se pudieron cargar los productos. Verifique la conexión con el servidor.');
      console.error("Error fetching products:", err);
    } finally {
      setIsLoading(false);
    }
  }, [paginationModel, debouncedSearchTerm, filters]);

  // useEffect que llama a fetchProducts cuando cambian sus dependencias.
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleFilterChange = useCallback((event) => {
    const { name, value } = event.target;
    const newState = { ...filters, [name]: value };
    // Si el usuario cambia la categoría principal, reseteamos los filtros dependientes
    // para evitar una combinación inválida (ej. categoría "Batería" con tipo "Aire").
    if (name === 'category' && value !== 'filter') {
      newState.product_type = '';
      newState.shape = '';
    }
    setFilters(newState);
  }, [filters]);

  const handleOpenDeleteDialog = useCallback((product) => {
    setProductToDeactivate(product);
    setDeleteConfirmationOpen(true);
  }, []);

  const handleCloseDeleteDialog = useCallback(() => {
    setDeleteConfirmationOpen(false);
  }, []);

  const handleConfirmDeactivation = useCallback(async () => {
    if (!productToDeactivate) return;
    try {
      await deactivateProductAPI(productToDeactivate.sku);
      enqueueSnackbar(`Producto '${productToDeactivate.name}' desactivado correctamente.`, { variant: 'success' });
      fetchProducts(); // Vuelve a cargar los datos para reflejar el cambio.
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Error al desactivar el producto.';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      handleCloseDeleteDialog();
    }
  }, [productToDeactivate, enqueueSnackbar, fetchProducts, handleCloseDeleteDialog]);
  
  // --- SECCIÓN 3: Definición de Columnas para DataGrid ---
  // useMemo optimiza el rendimiento al evitar que este array se recalcule en cada render,
  // a menos que cambien sus dependencias (navigate, handleOpenDeleteDialog).
  const columns = useMemo(() => [
    { field: 'sku', headerName: 'Código/SKU', width: 180 },
    { 
      field: 'category',
      headerName: 'Producto', 
      width: 150,
      valueFormatter: (value) => {
        const category = PRODUCT_CATEGORIES.find(c => c.value === value);
        return category ? category.label : value;
      }
    },
    { 
      field: 'product_type',
      headerName: 'Tipo', 
      width: 150,
      valueFormatter: (value) => {
        const type = FILTER_TYPES.find(t => t.value === value);
        return type ? type.label : value;
      }
    },
    { field: 'brand', headerName: 'Marca', width: 150 },
    {
      field: 'price',
      headerName: 'Precio (S/.)',
      type: 'number',
      width: 130,
      valueFormatter: (value) => {
        if (typeof value !== 'number' || isNaN(value)) return '';
        return `S/ ${value.toFixed(2)}`;
      },
    },
    { field: 'stock_quantity', headerName: 'Stock', type: 'number', width: 100 },
    {
      field: 'actions',
      headerName: 'Acciones',
      type: 'actions',
      width: 120,
      align: 'center',
      headerAlign: 'center',
      getActions: (params) => [
        <Tooltip title="Editar Producto" key="edit"><IconButton onClick={() => navigate(`/inventario/productos/editar/${params.row.sku}`)} color="primary"><EditIcon /></IconButton></Tooltip>,
        <Tooltip title="Desactivar Producto" key="delete"><IconButton onClick={() => handleOpenDeleteDialog(params.row)} color="error"><DeleteIcon /></IconButton></Tooltip>,
      ],
    },
  ], [navigate, handleOpenDeleteDialog]);

  // --- SECCIÓN 4: Renderizado del Componente ---
  return (
    <>
      <Container maxWidth="xl">
        <Paper sx={{ p: { xs: 2, md: 3 }, my: 4, borderRadius: 2, boxShadow: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>Gestión de Productos</Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/inventario/productos/nuevo')} sx={{ fontWeight: 'bold' }}>Añadir Producto</Button>
          </Box>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth variant="outlined" label="Buscar por SKU o Nombre" name="search" value={filters.search} onChange={handleFilterChange} InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>) }} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField select fullWidth label="Filtrar por Producto" name="category" value={filters.category} onChange={handleFilterChange}>
                <MenuItem value=""><em>Todos</em></MenuItem>
                {PRODUCT_CATEGORIES.map(option => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField select fullWidth label="Filtrar por Tipo" name="product_type" value={filters.product_type} onChange={handleFilterChange} disabled={filters.category !== 'filter'}>
                <MenuItem value=""><em>Todos</em></MenuItem>
                {FILTER_TYPES.map(option => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField select fullWidth label="Filtrar por Forma" name="shape" value={filters.shape} onChange={handleFilterChange} disabled={filters.category !== 'filter'}>
                <MenuItem value=""><em>Todas</em></MenuItem>
                {PRODUCT_SHAPES.map(option => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>
        
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
              checkboxSelection
              disableRowSelectionOnClick
              localeText={{ noRowsLabel: 'No se encontraron productos que coincidan con los filtros.' }}
            />
          </Box>
        </Paper>
      </Container>
      
      <Dialog open={isDeleteConfirmationOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirmar Desactivación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Seguro que deseas desactivar el producto <strong>{productToDeactivate?.name}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancelar</Button>
          <Button onClick={handleConfirmDeactivation} color="error" variant="contained">Desactivar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ProductListPage;