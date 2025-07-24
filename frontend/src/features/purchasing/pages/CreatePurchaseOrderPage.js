// /frontend/src/features/purchasing/pages/CreatePurchaseOrderPage.js

/**
 * @file Contenedor de la página para la creación de una nueva Orden de Compra.
 * Este componente actúa como un "controlador", gestionando la lógica de estado
 * (carga, errores) y la comunicación con la API, mientras delega la
 * presentación de la interfaz de usuario al componente `PurchaseOrderForm`.
 */

// --- SECCIÓN 1: IMPORTACIONES ---
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Paper, Container, Box } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import PurchaseOrderForm from '../components/PurchaseOrderForm';
import { createPurchaseOrderAPI } from '../api/purchasingAPI';


// --- SECCIÓN 2: COMPONENTE PRINCIPAL DE LA PÁGINA ---

const CreatePurchaseOrderPage = () => {

  // --- 2.1: Hooks y Estado ---
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  // --- 2.2: Lógica de Mutación de Datos (React Query) ---
  // `useMutation` gestiona de forma elegante el ciclo de vida de la petición a la API.
  const { mutate: createPurchaseOrder, isPending } = useMutation({
    mutationFn: createPurchaseOrderAPI,
    onSuccess: (response) => {
      // Al tener éxito, muestra una notificación clara y útil.
      enqueueSnackbar(`Orden de Compra #${response.data.order_number} creada exitosamente.`, { variant: 'success' });
      // Invalida la caché de la lista de órdenes para que se actualice al volver.
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      // Redirige al usuario de vuelta a la lista.
      navigate('/compras/ordenes');
    },
    onError: (error) => {
      // En caso de error, muestra un mensaje detallado del backend.
      const errorDetail = error.response?.data?.detail || 'Ocurrió un error al crear la orden de compra.';
      enqueueSnackbar(errorDetail, { variant: 'error' });
    }
  });

  // --- 2.3: Manejadores de Eventos ---
  /**
   * Se ejecuta cuando el `PurchaseOrderForm` es enviado.
   * Procesa los datos del formulario y llama a la mutación para enviarlos a la API.
   * @param {object} formData - Los valores del formulario gestionados por Formik.
   * @param {string} taxPercentage - El porcentaje de impuestos seleccionado, pasado como segundo argumento.
   */
  const handleFormSubmit = (formData, taxPercentage) => {
    // Aquí se construye el payload final que se enviará a la API,
    // asegurando que coincida con el DTO 'PurchaseOrderCreate' del backend.
    const apiPayload = {
      supplier_id: formData.supplier_id,
      order_date: formData.order_date,
      expected_delivery_date: formData.expected_delivery_date,
      notes: formData.notes,
      items: formData.items.map(item => ({
        product_id: item.product_id,
        quantity: Number(item.quantity),
        unit_cost: Number(item.unit_cost)
      })),
      // Podrías añadir más campos aquí si el backend los requiere, como el 'tax_percentage'.
    };
    
    createPurchaseOrder(apiPayload);
  };

  // --- 2.4: Renderizado del Componente ---
  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 2, boxShadow: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Crear Nueva Orden de Compra
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Seleccione un proveedor y añada los productos que desea comprar.
          </Typography>
        </Box>
        
        <PurchaseOrderForm 
          onSubmit={handleFormSubmit} 
          isSubmitting={isPending}
        />
      </Paper>
    </Container>
  );
};

export default CreatePurchaseOrderPage;