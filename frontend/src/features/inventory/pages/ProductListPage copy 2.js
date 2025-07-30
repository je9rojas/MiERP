// /frontend/src/features/inventory/pages/ProductListPage.js
// VERSIÓN DE DEPURACIÓN CORREGIDA

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Paper, Alert, IconButton, Tooltip, Typography,
} from '@mui/material';
// --- ¡LA CORRECCIÓN ESTÁ AQUÍ! ---
// Se separan las importaciones. DataGrid viene del paquete principal.
import { DataGrid } from '@mui/x-data-grid';
// esES y otras localizaciones vienen de la sub-ruta /locales.
import { esES } from '@mui/x-data-grid/locales';
import { useQuery } from '@tanstack/react-query';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import HistoryIcon from '@mui/icons-material/History';

import { getProductsAPI } from '../api/productsAPI';

const ProductListPage = () => {
  const navigate = useNavigate();

  // --- ESTADO SIMPLIFICADO: Solo nos enfocamos en la paginación ---
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });

  // --- OBTENCIÓN DE DATOS SIMPLIFICADA ---
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['products', paginationModel],
    queryFn: async () => {
      console.log('Fetching page:', paginationModel.page + 1); // Log para ver la petición
      const params = {
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize,
      };
      return await getProductsAPI(params);
    },
    placeholderData: (previousData) => previousData,
  });

  // --- COLUMNAS (Sin cambios) ---
  const columns = useMemo(() => [
    { field: 'sku', headerName: 'Código/SKU', width: 140 },
    { field: 'name', headerName: 'Nombre', flex: 1, minWidth: 200 },
    { field: 'brand', headerName: 'Marca', width: 120 },
    { field: 'price', headerName: 'Precio', type: 'number', width: 110, align: 'right', headerAlign: 'right', valueFormatter: (value) => value != null ? `S/ ${Number(value).toFixed(2)}` : '' },
    { field: 'stock_quantity', headerName: 'Stock', type: 'number', width: 90, align: 'center', headerAlign: 'center' },
    {
      field: 'actions', headerName: 'Acciones', type: 'actions', width: 130, align: 'right', headerAlign: 'right',
      getActions: (params) => [
        <Tooltip title="Ver Movimientos" key="history"><IconButton onClick={() => navigate(`/inventario/productos/movimientos/${encodeURIComponent(params.row.sku)}`)} size="small"><HistoryIcon /></IconButton></Tooltip>,
        <Tooltip title="Editar Producto" key="edit"><IconButton onClick={() => navigate(`/inventario/productos/editar/${encodeURIComponent(params.row.sku)}`)} size="small" color="primary"><EditIcon /></IconButton></Tooltip>,
        <Tooltip title="Desactivar Producto" key="delete"><IconButton size="small" color="error"><DeleteIcon /></IconButton></Tooltip>,
      ],
    },
  ], [navigate]);

  // --- RENDERIZADO ---
  return (
    <Container maxWidth="xl">
      <Paper sx={{ p: { xs: 2, md: 3 }, my: 4, borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 2 }}>
          Gestión de Productos (Prueba de Paginación)
        </Typography>

        <Box sx={{ flexGrow: 1, width: '100%', mt: 2, height: 'calc(100vh - 250px)' }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error.message}</Alert>}
          <DataGrid
            rows={data?.items || []}
            columns={columns}
            getRowId={(row) => row._id}
            loading={isLoading || isFetching}
            rowCount={data?.total_count || 0}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            paginationMode="server"
            pageSizeOptions={[10, 25, 50, 100]}
            density="compact"
            localeText={esES.components.MuiDataGrid.defaultProps.localeText}
          />
        </Box>
      </Paper>
    </Container>
  );
};

export default ProductListPage;