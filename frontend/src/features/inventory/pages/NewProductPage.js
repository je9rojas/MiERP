// /frontend/src/features/inventory/pages/NewProductPage.js
// CÓDIGO CORREGIDO Y LIMPIO

import React from 'react';
// La importación de 'Box' ha sido eliminada para solucionar la advertencia
import { Typography, Paper, Container } from '@mui/material'; 
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import ProductForm from '../components/ProductForm';
import { createProductAPI } from '../../../api/productsAPI';

const NewProductPage = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const handleCreateProduct = async (productData) => {
    try {
      await createProductAPI(productData);
      enqueueSnackbar('Producto creado exitosamente!', { variant: 'success' });
      // Redirige a la lista de productos después de la creación exitosa
      // (Asegúrate de que esta ruta exista y muestre la lista de productos)
      navigate('/inventario/productos'); 
    } catch (error) {
      // Intenta obtener un mensaje de error detallado de la respuesta de la API
      const errorMsg = error.response?.data?.detail || 'Ocurrió un error al crear el producto';
      enqueueSnackbar(errorMsg, { variant: 'error' });
    }
  };

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: { xs: 2, sm: 3, md: 4 }, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Crear Nuevo Producto
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Complete los campos a continuación para registrar un nuevo artículo en el inventario.
        </Typography>
        <ProductForm onSubmit={handleCreateProduct} />
      </Paper>
    </Container>
  );
};

export default NewProductPage;