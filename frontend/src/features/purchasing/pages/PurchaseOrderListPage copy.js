// /frontend/src/features/purchasing/pages/PurchaseOrderListPage.js
// ESQUELETO INICIAL PARA LA PÁGINA DE LISTADO DE ÓRDENES DE COMPRA

import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';

const PurchaseOrderListPage = () => {
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: { xs: 2, md: 3 } }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" component="h1">
            Gestión de Órdenes de Compra
          </Typography>
          {/* TODO: Aquí irá un botón para navegar a /compras/nueva */}
        </Box>
        <Typography variant="body1">
          Aquí se mostrará una tabla con todas las órdenes de compra registradas.
        </Typography>
        {/* TODO: Implementar la tabla de datos, filtros, paginación, etc. */}
      </Paper>
    </Container>
  );
};

export default PurchaseOrderListPage;