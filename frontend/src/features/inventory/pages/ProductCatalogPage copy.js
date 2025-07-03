// /frontend/src/features/inventory/pages/ProductCatalogPage.js
import React, { useState } from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';
import CatalogFilterForm from '../components/CatalogFilterForm'; // Lo crearemos en el siguiente paso
import { generateCatalogAPI } from '../../../api/productsAPI';

const ProductCatalogPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerateCatalog = async (filters) => {
    setIsLoading(true);
    setError(null);
    try {
      // Llama a la función de la API
      const response = await generateCatalogAPI(filters);
      
      // Crea un Blob (Binary Large Object) desde la respuesta del backend
      const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
      
      // Crea una URL temporal para el Blob
      const url = window.URL.createObjectURL(pdfBlob);
      
      // Crea un enlace <a> invisible para iniciar la descarga
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'catalogo_productos.pdf'); // Nombre del archivo a descargar
      
      // Añade el enlace al DOM, simula un clic y luego lo elimina
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Libera la URL del objeto para ahorrar memoria
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
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom>
        Generador de Catálogo de Productos
      </Typography>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h6" gutterBottom>
          Seleccione los filtros
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          Configure los criterios para generar un catálogo personalizado en formato PDF. El sistema generará una vista para vendedor (con precios y stock) si ha iniciado sesión con un rol apropiado.
        </Typography>
        
        <CatalogFilterForm 
          onSubmit={handleGenerateCatalog} 
          isLoading={isLoading} 
        />
        
        {error && (
          <Box mt={2}>
            <Typography color="error">{error}</Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default ProductCatalogPage;