// /frontend/src/features/inventory/pages/ProductListPage.js
// CÓDIGO FINAL CON COERCIÓN DE TIPOS

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Paper,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import { getProductsAPI } from '../../../api/productsAPI';

const columns = [
  { 
    field: '_id', 
    headerName: 'ID', 
    width: 220 
  },
  { field: 'sku', headerName: 'SKU', width: 150 },
  { field: 'name', headerName: 'Nombre del Producto', flex: 1, minWidth: 250 },
  { field: 'brand', headerName: 'Marca', width: 150 },
  {
    field: 'price',
    headerName: 'Precio (S/.)',
    type: 'number',
    width: 120,
    // Este valueFormatter ahora funcionará porque le garantizamos un número.
    valueFormatter: (params) => {
      if (typeof params.value !== 'number' || isNaN(params.value)) {
        return '';
      }
      return `S/ ${params.value.toFixed(2)}`;
    },
  },
  {
    field: 'stock_quantity',
    headerName: 'Stock',
    type: 'number',
    width: 100,
  },
  {
    field: 'is_active',
    headerName: 'Estado',
    type: 'boolean',
    width: 120,
    renderCell: (params) => (
      <Typography color={params.value ? 'success.main' : 'error.main'} sx={{ fontWeight: 'bold' }}>
        {params.value ? 'Activo' : 'Inactivo'}
      </Typography>
    ),
  },
];

const ProductListPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const dataFromAPI = await getProductsAPI();
        
        // --- ¡LA SOLUCIÓN! ---
        // Mapeamos los datos recibidos para asegurar que los tipos sean correctos.
        const formattedProducts = dataFromAPI.map(product => ({
          ...product,
          // Convertimos explícitamente a número. Usamos `Number()` que maneja bien `null` o `undefined`.
          price: Number(product.price),
          stock_quantity: Number(product.stock_quantity)
        }));

        setProducts(formattedProducts);
        setError(null);
      } catch (err) {
        setError('No se pudieron cargar los productos.');
        console.error("Error fetching products:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleAddNewProduct = () => {
    navigate('/inventario/productos/nuevo');
  };

  return (
    <Container maxWidth="xl">
      <Paper sx={{ p: { xs: 2, md: 3 }, my: 4, borderRadius: 2, boxShadow: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Gestión de Productos
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddNewProduct}
            sx={{ fontWeight: 'bold' }}
          >
            Añadir Nuevo Producto
          </Button>
        </Box>

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Cargando productos...</Typography>
          </Box>
        )}

        {error && !isLoading && (
          <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
        )}

        {!isLoading && !error && (
          <Box sx={{ height: 650, width: '100%' }}>
            <DataGrid
              rows={products}
              columns={columns}
              getRowId={(row) => row._id}
              pageSizeOptions={[10, 25, 50, 100]}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 10 },
                },
              }}
              checkboxSelection
              disableRowSelectionOnClick
              localeText={{ noRowsLabel: 'No se encontraron productos para mostrar.' }}
            />
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default ProductListPage;