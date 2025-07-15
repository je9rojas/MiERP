// /frontend/src/features/inventory/pages/ProductCatalogPage.js
// CÓDIGO COMPLETO Y OPTIMIZADO - LISTO PARA COPIAR Y PEGAR

import React, { useState } from 'react';
import {
  Container, Typography, Paper, Grid, Button, CircularProgress, Box,
  FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Alert
} from '@mui/material';
import CatalogFilterForm from '../components/CatalogFilterForm';
import { generateCatalogAPI } from '../api/productsAPI';
import { useAuth } from '../../../app/contexts/AuthContext'; // Importar para verificar roles

const ProductCatalogPage = () => {
  const { user } = useAuth(); // Obtener usuario para lógica condicional
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // El tipo de vista por defecto es 'client'. Solo cambia si el usuario tiene permiso.
  const [viewType, setViewType] = useState('client'); 

  // Roles que pueden generar la vista de vendedor
  const canGenerateSellerView = user && ['superadmin', 'admin', 'manager', 'vendedor'].includes(user.role);

  // Al montar, si el usuario puede generar vista de vendedor, la ponemos por defecto.
  React.useEffect(() => {
    if (canGenerateSellerView) {
      setViewType('seller');
    }
  }, [canGenerateSellerView]);

  const handleGenerateCatalog = async (filters) => {
    setIsLoading(true);
    setError(null);
    try {
      const requestPayload = {
        ...filters,
        view_type: viewType,
      };

      const response = await generateCatalogAPI(requestPayload);
      
      const pdfBlob = new Blob([response], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      const filename = viewType === 'seller' ? 'catalogo_vendedor.pdf' : 'catalogo_cliente.pdf';
      link.setAttribute('download', filename);
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error("Error al generar el catálogo:", err);
      const errorMessage = err.response?.data?.detail || 'Ocurrió un error al generar el catálogo. Inténtelo de nuevo.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Generador de Catálogo de Productos
      </Typography>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h6" gutterBottom>
          Seleccione los filtros y opciones
        </Typography>
        
        <Grid container spacing={4}>
          <Grid item xs={12}>
            <CatalogFilterForm 
              onSubmit={(filters) => handleGenerateCatalog(filters)} 
              isLoading={isLoading} 
              // Pasamos el botón como hijo para un mejor control
              submitButton={
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', position: 'relative' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={isLoading}
                    size="large"
                  >
                    {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Generar PDF'}
                  </Button>
                </Box>
              }
            />
          </Grid>
          
          <Grid item xs={12}>
            <FormControl component="fieldset" fullWidth>
              <FormLabel component="legend">Tipo de Reporte</FormLabel>
              <RadioGroup
                row
                aria-label="tipo-reporte"
                name="viewType"
                value={viewType}
                onChange={(e) => setViewType(e.target.value)}
              >
                {/* El RadioButton de vendedor solo se muestra si el usuario tiene permiso */}
                {canGenerateSellerView && (
                  <FormControlLabel value="seller" control={<Radio />} label="Vendedor (con precios/stock)" />
                )}
                <FormControlLabel value="client" control={<Radio />} label="Cliente (sin datos sensibles)" />
              </RadioGroup>
            </FormControl>
          </Grid>
        </Grid>
        
        {error && (
          <Box mt={3}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default ProductCatalogPage;