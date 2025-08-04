// /frontend/src/features/inventory/pages/EditProductPage.js

/**
 * @file Página para la edición de un producto existente.
 *
 * Este componente obtiene los datos completos de un producto por su SKU,
 * los pasa al formulario reutilizable `ProductForm`, y maneja la lógica
 * de actualización. Utiliza React Query (`useQuery` y `useMutation`) para una
 * gestión de estado de datos declarativa, robusta y con manejo de caché.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Container, CircularProgress, Alert } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import ProductForm from '../components/ProductForm';
import { getProductBySkuAPI, updateProductAPI } from '../api/productsAPI';

// ==============================================================================
// SECCIÓN 2: COMPONENTE PRINCIPAL DE LA PÁGINA
// ==============================================================================

const EditProductPage = () => {
  // --- 2.1: Hooks y Gestión de Estado ---
  const { sku } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  // --- 2.2: Lógica de Obtención de Datos con React Query ---
  // useQuery maneja automáticamente isLoading, error, y el refetching.
  const { 
    data: productData, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['product', sku], // Clave única para este producto específico.
    queryFn: () => getProductBySkuAPI(sku),
    enabled: !!sku, // La consulta solo se ejecutará si el SKU existe.
  });

  // --- 2.3: Lógica de Mutación (Actualización) con React Query ---
  const { mutate: updateProduct, isPending: isUpdating } = useMutation({
    mutationFn: (updatedData) => updateProductAPI(sku, updatedData),
    onSuccess: () => {
      enqueueSnackbar('Producto actualizado exitosamente!', { variant: 'success' });
      // Invalida tanto la consulta de la lista como la de este producto específico
      // para asegurar que los datos se refresquen en todas partes.
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', sku] });
      navigate('/inventario/productos');
    },
    onError: (err) => {
      const errorMsg = err.response?.data?.detail || 'Error al actualizar el producto.';
      enqueueSnackbar(errorMsg, { variant: 'error' });
    }
  });

  // --- 2.4: Renderizado Condicional de Estados ---
  if (isLoading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Cargando producto...</Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">
          Error al cargar el producto: {error.message || 'No se pudo obtener la información del producto.'}
        </Alert>
      </Container>
    );
  }

  // --- 2.5: Renderizado del Formulario ---
  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: { xs: 2, md: 4 }, my: 4, borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Editar Producto
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
          Modificando el producto con SKU: <strong>{sku}</strong>
        </Typography>
        
        {/* El ProductForm se renderiza con los datos iniciales y el handler de la mutación. */}
        {productData && (
          <ProductForm 
            onSubmit={updateProduct} 
            initialData={productData} 
            isSubmitting={isUpdating} 
          />
        )}
      </Paper>
    </Container>
  );
};

export default EditProductPage;