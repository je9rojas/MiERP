// /frontend/src/features/inventory/pages/EditProductPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Container, CircularProgress, Alert } from '@mui/material';
import { useSnackbar } from 'notistack';
import ProductForm from '../components/ProductForm';
import { getProductBySkuAPI, updateProductAPI } from '../api/productsAPI';

const EditProductPage = () => {
  const { sku } = useParams(); // Obtiene el SKU de la URL
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [productData, setProductData] = useState(null); // Para guardar los datos iniciales
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Efecto para cargar los datos del producto al montar la página
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        const data = await getProductBySkuAPI(sku);
        setProductData(data);
      } catch (err) {
        setError('No se pudo cargar la información del producto.');
        enqueueSnackbar('Error al cargar el producto', { variant: 'error' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [sku, enqueueSnackbar]); // Se ejecuta cada vez que el SKU cambie

  // 2. Handler para enviar la actualización a la API
  const handleUpdateProduct = async (updatedData) => {
    try {
      await updateProductAPI(sku, updatedData);
      enqueueSnackbar('Producto actualizado exitosamente!', { variant: 'success' });
      navigate('/inventario/productos');
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Error al actualizar el producto.';
      enqueueSnackbar(errorMsg, { variant: 'error' });
    }
  };

  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" gutterBottom>Editar Producto</Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
          SKU: <strong>{sku}</strong>
        </Typography>
        {/* 3. Renderizamos el ProductForm solo cuando tenemos los datos iniciales */}
        {productData && <ProductForm onSubmit={handleUpdateProduct} initialData={productData} />}
      </Paper>
    </Container>
  );
};

export default EditProductPage;