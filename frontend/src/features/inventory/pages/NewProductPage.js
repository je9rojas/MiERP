// /frontend/src/features/inventory/pages/NewProductPage.js
// PÁGINA CONTENEDORA PARA EL FORMULARIO DE CREACIÓN DE PRODUCTOS

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Paper, Container, Box } from '@mui/material'; 
import { useSnackbar } from 'notistack';

// --- SECCIÓN 1: IMPORTACIONES DE LA APLICACIÓN ---
import ProductForm from '../components/ProductForm'; // El componente de UI del formulario
import { createProductAPI } from '../api/productsAPI'; // La función que llama a la API

/**
 * NewProductPage es un "componente contenedor inteligente" (Smart Container).
 * Su responsabilidad principal es gestionar la lógica y el estado de la página, como:
 * - Manejar el estado de envío (`isSubmitting`).
 * - Orquestar la llamada a la API para crear un nuevo producto.
 * - Mostrar notificaciones al usuario sobre el resultado (éxito o error).
 * - Redirigir al usuario después de una acción exitosa.
 *
 * Delega toda la responsabilidad de la presentación y validación del formulario
 * al componente hijo `ProductForm`.
 */
const NewProductPage = () => {
  // --- SECCIÓN 2: Hooks y Estados ---
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  
  // Estado para controlar si el formulario está en proceso de envío.
  // Es crucial para deshabilitar el botón de guardar y dar feedback visual.
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- SECCIÓN 3: LÓGICA DE MANEJO DE EVENTOS ---

  /**
   * Se ejecuta cuando el componente ProductForm (manejado por Formik)
   * envía sus datos ya validados.
   * @param {object} productData - Los datos del producto, formateados y listos para la API.
   */
  const handleCreateProduct = async (productData) => {
    // 1. Inicia el estado de carga para deshabilitar el botón de envío.
    setIsSubmitting(true);

    try {
      // 2. Llama a la función de la API con los datos del producto.
      await createProductAPI(productData);

      // 3. Si tiene éxito, muestra una notificación positiva y clara.
      enqueueSnackbar('Producto creado exitosamente!', { variant: 'success' });

      // 4. Redirige al usuario a la lista de productos para que vea el resultado.
      navigate('/inventario/productos'); 
    } catch (error) {
      // 5. Si falla, procesa y muestra un mensaje de error detallado y útil.
      console.error("Error detallado del backend al crear producto:", error.response?.data);

      const errorDetail = error.response?.data?.detail;
      let userFriendlyErrorMessage = 'Ocurrió un error al crear el producto.';
      
      // Pydantic devuelve un array de errores de validación, lo formateamos para el usuario.
      if (Array.isArray(errorDetail)) {
        userFriendlyErrorMessage = errorDetail
          .map(err => `${err.loc[1]}: ${err.msg}`) // ej: "sku: Este campo es requerido"
          .join('; ');
      } 
      // Si el error es un solo string (como nuestro "SKU ya existe").
      else if (typeof errorDetail === 'string') {
        userFriendlyErrorMessage = errorDetail;
      }
      
      enqueueSnackbar(userFriendlyErrorMessage, { 
        variant: 'error',
        persist: true, // El mensaje de error no desaparece automáticamente
      });
    } finally {
      // 6. Se ejecuta siempre (en éxito o error) para volver a habilitar el botón.
      setIsSubmitting(false);
    }
  };


  // --- SECCIÓN 4: RENDERIZADO DEL COMPONENTE ---

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: { xs: 2, sm: 3, md: 4 }, my: 4, borderRadius: 2, boxShadow: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Crear Nuevo Producto
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Complete todos los campos a continuación para registrar un nuevo artículo en el inventario.
          </Typography>
        </Box>
        
        {/* 
          Renderizamos el componente de formulario reutilizable.
          - Para "Crear", no le pasamos `initialData`.
          - onSubmit: La función que se ejecutará cuando el formulario se envíe.
          - isSubmitting: El estado para que el formulario sepa si está en proceso de guardado.
        */}
        <ProductForm 
          onSubmit={handleCreateProduct} 
          isSubmitting={isSubmitting} 
        />
      </Paper>
    </Container>
  );
};

export default NewProductPage;