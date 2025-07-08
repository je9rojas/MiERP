// /frontend/src/features/purchasing/pages/PurchaseOrderListPage.js
// CÓDIGO ACTUALIZADO Y FINAL - LISTO PARA COPIAR Y PEGAR

import React from 'react';
import { Container, Typography, Paper, Box, Button } from '@mui/material';
import { Link } from 'react-router-dom'; // <-- PASO 1: Importar Link
import AddIcon from '@mui/icons-material/Add'; // <-- (Opcional) Icono para el botón

const PurchaseOrderListPage = () => {
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: { xs: 2, md: 3 } }}>
        {/* --- PASO 2: ESTRUCTURA PARA EL TÍTULO Y EL BOTÓN --- */}
        {/* Usamos un Box con Flexbox para alinear el título a la izquierda y el botón a la derecha */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Gestión de Órdenes de Compra
          </Typography>

          {/* --- PASO 3: AÑADIR EL BOTÓN DE "NUEVA ORDEN" --- */}
          {/* Este botón usa el componente Link de React Router para la navegación */}
          <Button
            variant="contained"
            color="primary"
            component={Link}
            to="/compras/nueva" // <-- ¡La ruta de destino!
            startIcon={<AddIcon />}
          >
            Nueva Orden de Compra
          </Button>
        </Box>

        {/* --- PRÓXIMOS PASOS --- */}
        <Typography variant="body1" color="text.secondary">
          Aquí se mostrará una tabla con todas las órdenes de compra registradas.
        </Typography>
        {/* TODO: Implementar la tabla de datos (DataGrid), filtros, paginación, etc. */}

      </Paper>
    </Container>
  );
};

export default PurchaseOrderListPage;