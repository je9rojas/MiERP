// /frontend/src/features/inventory/pages/ProductListPage.js
// VERSIÓN FINAL CON DATOS APLANADOS Y TODAS LAS COLUMNAS DE MEDIDAS

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
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [products, setProducts] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [isLoading, setIsLoading¡Entendido! Aquí tienes la versión final y profesional de tu `ProductListPage.js`, completamente actualizada para cumplir con todos los nuevos requisitos.

He aplicado la técnica de "aplanamiento de datos" para mostrar las columnas de medidas individuales (`A`, `B`, `C`, etc.) y he optimizado la definición de las columnas y los `handlers` para seguir las mejores prácticas de React.

---

### Código Final y Optimizado para `ProductListPage.js`

Reemplaza todo el contenido de tu archivo con este código.


// /frontend/src/features/inventory/pages/ProductListPage.js
// VERSIÓN FINAL Y PROFESIONAL CON MEDIDAS EN COLUMNAS SEPARADAS

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
] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [productToDeactivate, setProductToDeactivate] = useState(null);
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
        category: filters.category,
        product_type: filters.product_type,
        shape: filters.shape,
      };
      const response = await getProductsAPI(params);
      
      // --- APLANAMIENTO DE DATOS ---
      // Transformamos los datos para que el DataGrid los maneje más eficientemente.
      const flattenedProducts = response.items.map(product => ({
        ...product,
        ...(product.specifications || {}), // Desempaqueta las especificaciones en el nivel superior
      }));

      setProducts(flattenedProducts);
      setRowCount(response.total);
      setError(null);
    } catch (err) {
      setError('No se pudieron cargar los productos.');
      console.error("Error fetching products:", err);
    } finally {
      setIsLoading(false);
    }
  }, [paginationModel, debouncedSearchTerm, filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleFilterChange = useCallback((event) => { /* ... se mantiene igual ... */ }, [filters]);
  const handleOpenDeleteDialog = useCallback((product) => { /* ... se mantiene igual ... */ }, []);
  const handleCloseDeleteDialog = useCallback(() => { /* ... se mantiene igual ... */ }, []);
  const handleConfirmDeactivation = useCallback(async () => { /* ... se mantiene igual ... */ }, [productToDeactivate, enqueueSnackbar, fetchProducts, handleCloseDeleteDialog]);
  
  // --- SECCIÓN 3: Definición de Columnas para DataGrid ---
  const columns = useMemo(() => [
    {import { useSnackbar } from 'notistack';

import { getProductsAPI, deactivateProductAPI } from '../../../api/productsAPI';
import { useDebounce } from '../../../hooks/useDebounce';
import { PRODUCT_CATEGORIES, FILTER_TYPES, PRODUCT_SHAPES } from '../../../constants/productConstants';

const ProductListPage = () => {
  // --- SECCIÓN 1: Hooks y Estados ---
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [products, setProducts] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [productToDeactivate, setProductToDeactivate] = useState(null);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [filters, setFilters] = useState({ search: '', category: '', product_type: '', shape: '' });
  const debouncedSearchTerm = useDebounce(filters.search, 500);

  // --- SECCIÓN 2: Lógica de Datos y Handlers ---

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page: paginationModel.page + 1, pageSize: paginationModel.pageSize,
        search: debouncedSearchTerm.trim(),
        product_category: filters.category,
        product_type: filters.product_type,
        shape: filters.shape,
      };
      const response = await getProductsAPI(params);
      
      // Aplanamos los datos: copiamos las especificaciones al nivel superior de cada producto
      const flattenedProducts = response.items.map(product => ({
        ...product,
        ...(product.specifications || {}), // Esto copia A, B, C, etc. al objeto principal
      }));

      setProducts(flattenedProducts);
      setRowCount(response.total);
      setError(null);
    } catch (err) {
      setError('No se pudieron cargar los productos.');
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
    const newState = { ...filters, [name]: value };
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

  const handleCloseDeleteDialog = useCallback(() => setDeleteConfirmationOpen(false), []);

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
    
    // Columnas de Medidas (ahora no necesitan valueGetter)
    { field: 'A', headerName: 'A', type: 'number', width: 70, align: 'center', headerAlign: 'center' },
    { field: 'B', headerName: 'B', width: 70, align: 'center', headerAlign: 'center' },
    { field: 'C', headerName: 'C', type: 'number', width: 70, align: 'center', headerAlign: 'center' },
    { field: 'D', headerName: 'D', type: 'number', width: 70, align: 'center', headerAlign: 'center' },
    { field: 'F', headerName: 'F', type: 'number', width: 70, align: 'center', headerAlign: 'center' },
    { field: 'G', headerName: 'G', type: 'number', width: 70, align: 'center', headerAlign: 'center' },
    { field: 'H', headerName: 'H', type: 'number', width: 70, align: 'center', headerAlign: 'center' },

    { field: 'stock_quantity', headerName: 'Stock', type: 'number', width: 90, align: 'center', headerAlign: 'center' },
    {
      field: 'actions',
      headerName: 'Acciones',
      type: 'actions',
      width: 100,
      getActions: (params) => [
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>Gestión de Productos</Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/inventario/productos/nuevo')} sx={{ fontWeight: 'bold' }}>Añadir Producto</Button>
          </Box>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth variant="outlined" label="Buscar" name="search" value={filters.search} onChange={handleFilterChange} InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>) }} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField select fullWidth label="Producto" name="category" value={filters.category} onChange={handleFilterChange}>
                <MenuItem value=""><em>Todos</em></MenuItem>
                {PRODUCT_CATEGORIES.map(option => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField select fullWidth label="Tipo" name="product_type" value={filters.product_type} onChange={handleFilterChange} disabled={filters.category !== 'filter'}>
                <MenuItem value=""><em>Todos</em></MenuItem>
                {FILTER_TYPES.map(option => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField select fullWidth label="Forma" name="shape" value={filters.shape} onChange={handleFilterChange} disabled={filters.category !== 'filter'}>
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
              density="compact"
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