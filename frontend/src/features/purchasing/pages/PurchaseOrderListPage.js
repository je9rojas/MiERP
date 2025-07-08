// /frontend/src/features/purchasing/pages/PurchaseOrderListPage.js
// CÓDIGO ACTUALIZADO CON ESTADOS Y ACCIONES - LISTO PARA COPIAR Y PEGAR

import React from 'react';
import { Container, Typography, Paper, Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, Tooltip } from '@mui/material';
import { Link } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CancelIcon from '@mui/icons-material/Cancel';

// --- DATOS DE EJEMPLO (MOCK DATA) ---
// Esto simula lo que recibirías de tu API.
const mockOrders = [
  { id: 'OC-2023-001', supplier: 'Proveedor A', date: '2023-10-27', total: 1500.00, status: 'PENDIENTE' },
  { id: 'OC-2023-002', supplier: 'Proveedor B', date: '2023-10-26', total: 850.50, status: 'CONFIRMADA' },
  { id: 'OC-2023-003', supplier: 'Proveedor C', date: '2023-10-25', total: 3200.75, status: 'RECIBIDA' },
  { id: 'OC-2023-004', supplier: 'Proveedor A', date: '2023-10-24', total: 450.00, status: 'CANCELADA' },
];

const getStatusChip = (status) => {
  const statusStyles = {
    PENDIENTE: { label: 'Pendiente', color: 'warning' },
    CONFIRMADA: { label: 'Confirmada', color: 'info' },
    RECIBIDA: { label: 'Recibida', color: 'success' },
    CANCELADA: { label: 'Cancelada', color: 'error' },
  };
  const style = statusStyles[status] || { label: 'Desconocido', color: 'default' };
  return <Chip label={style.label} color={style.color} size="small" />;
};

const PurchaseOrderListPage = () => {
  // TODO: Reemplazar mockOrders con una llamada a la API usando useState y useEffect

  const handleConfirm = (orderId) => {
    // TODO: Lógica para llamar a la API y confirmar la orden.
    // Aquí es donde pedirías el número de factura en un modal.
    console.log(`Confirmar orden: ${orderId}`);
    alert(`Aquí se abriría un diálogo para ingresar el N° de Factura y confirmar la orden ${orderId}.`);
  };

  const handleReceive = (orderId) => {
    // TODO: Lógica para navegar a una página de recepción o abrir un modal
    // para confirmar las cantidades recibidas. ESTO ACTUALIZA EL STOCK.
    console.log(`Recibir mercancía de la orden: ${orderId}`);
    alert(`Aquí se registraría la recepción de mercancía para la orden ${orderId}, afectando el inventario.`);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: { xs: 2, md: 3 } }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Gestión de Órdenes de Compra
          </Typography>
          <Button variant="contained" color="primary" component={Link} to="/compras/nueva" startIcon={<AddIcon />}>
            Nueva Orden de Compra
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID Orden</TableCell>
                <TableCell>Proveedor</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell align="center">Estado</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mockOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.id}</TableCell>
                  <TableCell>{order.supplier}</TableCell>
                  <TableCell>{order.date}</TableCell>
                  <TableCell align="center">{getStatusChip(order.status)}</TableCell>
                  <TableCell align="right">S/ {order.total.toFixed(2)}</TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                      {order.status === 'PENDIENTE' && (
                        <>
                          <Tooltip title="Confirmar Orden">
                            <IconButton color="primary" size="small" onClick={() => handleConfirm(order.id)}>
                              <CheckCircleIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Editar Orden">
                            <IconButton color="default" size="small" component={Link} to={`/compras/editar/${order.id}`}>
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Cancelar">
                            <IconButton color="error" size="small">
                              <CancelIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      {order.status === 'CONFIRMADA' && (
                        <>
                          <Tooltip title="Recibir Mercancía">
                            <IconButton color="success" size="small" onClick={() => handleReceive(order.id)}>
                              <LocalShippingIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Ver Detalles">
                            <IconButton color="default" size="small">
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      {(order.status === 'RECIBIDA' || order.status === 'CANCELADA') && (
                        <Tooltip title="Ver Detalles">
                          <IconButton color="default" size="small">
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
};

export default PurchaseOrderListPage;