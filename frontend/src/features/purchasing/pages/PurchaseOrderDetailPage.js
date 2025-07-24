// /frontend/src/features/purchasing/pages/PurchaseOrderDetailPage.js
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Container, CircularProgress, Alert, Button, Grid, Divider } from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAuth } from '../../../app/contexts/AuthContext';
import { hasPermission } from '../../../constants/rolesAndPermissions'; // Ruta correcta
import { CAN_APPROVE_PURCHASE_ORDERS } from '../../../constants/rolesAndPermissions';
import { getPurchaseOrderByIdAPI, approvePurchaseOrderAPI } from '../api/purchasingAPI'; // Necesitarás estas APIs

const PurchaseOrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: po, isLoading, error } = useQuery({
    queryKey: ['purchaseOrder', id],
    queryFn: () => getPurchaseOrderByIdAPI(id),
    enabled: !!id,
  });

  const { mutate: approvePO, isPending: isApproving } = useMutation({
      mutationFn: () => approvePurchaseOrderAPI(id),
      onSuccess: (invoice) => {
          enqueueSnackbar(`Orden Aprobada. Factura de Compra #${invoice.invoice_number} generada.`, { variant: 'success' });
          queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
          queryClient.invalidateQueries({ queryKey: ['purchaseOrder', id] });
          // Opcional: navegar a la página de la factura
          // navigate(`/compras/facturas/${invoice._id}`);
      },
      onError: (err) => {
          enqueueSnackbar(err.response?.data?.detail || 'Error al aprobar la orden.', { variant: 'error' });
      }
  });

  const handleApprove = () => {
      approvePO();
  };

  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Alert severity="error">{error.message || 'No se pudo cargar la orden de compra.'}</Alert>;
  }

  const canApprove = hasPermission(CAN_APPROVE_PURCHASE_ORDERS, user?.role);

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 4, mt: 4 }}>
        <Grid container justifyContent="space-between" alignItems="center">
            <Grid item>
                <Typography variant="h4" gutterBottom>Detalle de Orden de Compra</Typography>
                <Typography variant="h6" color="primary.main">#{po.po_number}</Typography>
            </Grid>
            {po.status === 'pendiente' && canApprove && (
                <Grid item>
                    <Button 
                        variant="contained" 
                        color="success" 
                        startIcon={<CheckCircleIcon />}
                        onClick={handleApprove}
                        disabled={isApproving}
                    >
                        {isApproving ? 'Aprobando...' : 'Aprobar y Generar Factura'}
                    </Button>
                </Grid>
            )}
        </Grid>
        <Divider sx={{ my: 3 }} />

        {/* Aquí va la visualización de los datos de la OC */}
        <Typography><strong>Proveedor:</strong> {po.supplier.business_name}</Typography>
        <Typography><strong>Fecha:</strong> {new Date(po.created_at).toLocaleDateString()}</Typography>
        <Typography><strong>Estado:</strong> {po.status}</Typography>
        
        <Typography variant="h6" sx={{ mt: 3 }}>Ítems de la Orden</Typography>
        {/* Aquí renderizarías una tabla con los po.items */}
        
        <Box textAlign="right" mt={3}>
            <Typography variant="h5">Total: S/ {Number(po.total_amount).toFixed(2)}</Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default PurchaseOrderDetailPage;