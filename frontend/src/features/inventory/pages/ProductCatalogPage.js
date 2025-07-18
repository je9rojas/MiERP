// /frontend/src/features/inventory/pages/ProductCatalogPage.js

import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Box,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert
} from '@mui/material';

// --- SECCIÓN 1: IMPORTACIONES DE LA APLICACIÓN ---
// Componentes, APIs y hooks personalizados necesarios para la página.

import CatalogFilterForm from '../components/CatalogFilterForm';
import { generateCatalogAPI } from '../api/productsAPI';
import { useAuth } from '../../../app/contexts/AuthContext';
import { CAN_GENERATE_CATALOG } from '../../../constants/rolesAndPermissions';


/**
 * Página dedicada a la generación de catálogos de productos en formato PDF.
 * Permite a los usuarios aplicar filtros y seleccionar diferentes tipos de vistas
 * (cliente o vendedor) según sus permisos.
 */
const ProductCatalogPage = () => {

  // --- SECCIÓN 2: HOOKS Y ESTADO DEL COMPONENTE ---
  // Gestión del estado principal de la página: carga, errores y datos del usuario.

  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewType, setViewType] = useState('client');

  // Determina si el usuario actual tiene permisos para la vista de vendedor.
 const canGenerateSellerView = user && CAN_GENERATE_CATALOG.includes(user.role);

  // Efecto para establecer la vista por defecto según los permisos del usuario al cargar la página.
  useEffect(() => {
    if (canGenerateSellerView) {
      setViewType('seller');
    }
  }, [canGenerateSellerView]);

  // --- SECCIÓN 3: MANEJADORES DE LÓGICA DE NEGOCIO ---
  // Funciones que encapsulan la lógica principal de la página.

  /**
   * Orquesta la generación y descarga del catálogo PDF.
   * Se activa al enviar el formulario de filtros.
   * @param {object} filters - Objeto con los filtros seleccionados en el formulario.
   */
  const handleCatalogRequest = useCallback(async (filters) => {
    setIsLoading(true);
    setError(null);

    try {
      const requestPayload = {
        ...filters,
        view_type: viewType,
      };

      // Llama a la API esperando una respuesta de tipo Blob.
      const pdfBlob = await generateCatalogAPI(requestPayload);

      // Crea un enlace en memoria para iniciar la descarga del archivo.
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;

      const filename = viewType === 'seller' ? `catalogo_vendedor_${Date.now()}.pdf` : `catalogo_cliente_${Date.now()}.pdf`;
      link.setAttribute('download', filename);

      document.body.appendChild(link);
      link.click();
      
      // Limpia el enlace y el objeto URL del DOM y de la memoria.
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error("Error detallado al generar el catálogo:", err);
      let errorMessage = 'Ocurrió un error inesperado al generar el catálogo.';

      // Si la respuesta de error vino como un Blob, intenta leerlo como JSON.
      if (err.response && err.response.data instanceof Blob) {
        try {
          const errorJson = JSON.parse(await err.response.data.text());
          errorMessage = errorJson.detail || errorMessage;
        } catch (e) {
          console.error("No se pudo parsear el error del blob:", e);
        }
      } else if (err.response?.data?.detail) {
        // Si el error ya vino como JSON.
        errorMessage = err.response.data.detail;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [viewType]); // La función se recrea solo si 'viewType' cambia.

  // --- SECCIÓN 4: RENDERIZADO DEL COMPONENTE ---
  // Estructura JSX de la página.

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Generador de Catálogo de Productos
        </Typography>
        <Typography variant="h6" gutterBottom color="text.secondary">
          Seleccione los filtros y opciones para crear el reporte en PDF.
        </Typography>
        
        <Grid container spacing={4} sx={{ mt: 2 }}>
          <Grid item xs={12}>
            {/* El formulario de filtros gestiona su propio estado interno y botón de envío. */}
            <CatalogFilterForm 
              onSubmit={handleCatalogRequest} 
              isLoading={isLoading} 
            />
          </Grid>
          
          <Grid item xs={12}>
            <FormControl component="fieldset" fullWidth disabled={isLoading}>
              <FormLabel component="legend">Tipo de Reporte</FormLabel>
              <RadioGroup
                row
                aria-label="tipo-de-reporte"
                name="viewType"
                value={viewType}
                onChange={(event) => setViewType(event.target.value)}
              >
                {/* La opción de vendedor solo se renderiza si el usuario tiene permiso. */}
                {canGenerateSellerView && (
                  <FormControlLabel value="seller" control={<Radio />} label="Vendedor (con costos y stock)" />
                )}
                <FormControlLabel value="client" control={<Radio />} label="Cliente (vista pública)" />
              </RadioGroup>
            </FormControl>
          </Grid>
        </Grid>
        
        {error && (
          <Box mt={3}>
            <Alert severity="error" variant="outlined">{error}</Alert>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default ProductCatalogPage;