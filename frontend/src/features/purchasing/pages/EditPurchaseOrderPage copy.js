// frontend/src/features/purchasing/pages/EditPurchaseOrderPage.js

/**
 * @file Página para ver, editar y gestionar el ciclo de vida de una Orden de Compra.
 *
 * @description Orquesta el flujo completo de una Orden de Compra (OC), desde su
 * edición en estado de borrador y su confirmación, hasta la navegación para
 * registrar las recepciones de mercancía. Utiliza un sistema de control de acceso
 * basado en permisos para mostrar las acciones disponibles al usuario.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { Container, Paper, Box, CircularProgress, Alert, Button, Divider } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Inventory2Icon from '@mui/icons-material/Inventory2';

// Hooks, API, Componentes y Utilitarios
import { useAuth } from '../../../app/contexts/AuthContext';
import { hasPermission, PERMISSIONS } from '../../../utils/auth/roles';
import PurchaseOrderForm from '../components/PurchaseOrderForm';
import { getPurchaseOrderByIdAPI, updatePurchaseOrderAPI, updatePurchaseOrderStatusAPI } from '../api/purchasingAPI';
import { getSuppliersAPI } from '../../crm/api/suppliersAPI';
import { getProductsAPI } from '../../inventory/api/productsAPI';
import { mapFormValuesToUpdatePayload } from '../mappers/purchaseOrderMappers';
import { formatApiError } from '../../../utils/errorUtils';
import PageHeader from '../../../components/common/PageHeader';

// ==============================================================================
// SECCIÓN 2: SUB-COMPONENTE DE BOTONES DE ACCIÓN
// ==============================================================================

/**
 * Renderiza los botones de acción disponibles para la OC según su estado y
 * los permisos del usuario.
 */
const ActionButtons = ({ order, user, onConfirm, onNavigateToReceipt, isSubmitting }) => {
  if (!order || !user?.role) {
    return null;
  }

  // Lógica de permisos para determinar qué botones mostrar
  const canConfirm = hasPermission(user.role, PERMISSIONS.PURCHASING_CANCEL_ORDER); // Confirmar es parte de la gestión de la OC
  const canReceive = hasPermission(user.role, PERMISSIONS.PURCHASING_RECEIVE_GOODS);

  const showConfirmButton = order.status === 'draft' && canConfirm;
  const showReceiptButton = ['confirmed', 'partially_received'].includes(order.status) && canReceive;

  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', my: 2, gap: 2 }}>
      {showConfirmButton && (
        <Button
          variant="contained"
          startIcon={<CheckCircleIcon />}
          onClick={onConfirm}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Confirmando...' : 'Confirmar Orden'}
        </Button>
      )}
      {showReceiptButton && (
        <Button
          variant="contained"
          color="secondary"
          startIcon={<Inventory2Icon />}
          onClick={onNavigateToReceipt}
        >
          Registrar Recepción
        </Button>
      )}
    </Box>
  );
};

// ==============================================================================
// SECCIÓN 3: COMPONENTE PRINCIPAL DE LA PÁGINA
// ==============================================================================

const EditPurchaseOrderPage = () => {
  // --------------------------------------------------------------------------
  // Sub-sección 3.1: Hooks y Estado
  // --------------------------------------------------------------------------
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // --------------------------------------------------------------------------
  // Sub-sección 3.2: Lógica de Obtención de Datos (React Query)
  // --------------------------------------------------------------------------
  const [orderQuery, suppliersQuery, productsQuery] = useQueries({
    queries: [
      {
        queryKey: ['purchaseOrder', orderId],
        queryFn: () => getPurchaseOrderByIdAPI(orderId),
        enabled: !!orderId,
      },
      {
        queryKey: ['suppliersListForForm'],
        queryFn: () => getSuppliersAPI({ page: 1, pageSize: 1000 }),
        select: (data) => data.items || [],
        staleTime: 300000, // 5 minutos
      },
      {
        queryKey: ['productsListForForm'],
        queryFn: () => getProductsAPI({ page: 1, pageSize: 1000 }),
        select: (data) => data.items || [],
        staleTime: 300000, // 5 minutos
      },
    ],
  });

  const isLoading = orderQuery.isLoading || suppliersQuery.isLoading || productsQuery.isLoading;
  const isError = orderQuery.isError || suppliersQuery.isError || productsQuery.isError;
  const error = orderQuery.error || suppliersQuery.error || productsQuery.error;

  // --------------------------------------------------------------------------
  // Sub-sección 3.3: Lógica de Mutaciones (React Query)
  // --------------------------------------------------------------------------
  const { mutate: updatePurchaseOrder, isPending: isUpdating } = useMutation({
    mutationFn: (payload) => updatePurchaseOrderAPI(orderId, payload),
    onSuccess: (data) => {
      enqueueSnackbar(`Orden de Compra ${data?.order_number || ''} actualizada exitosamente.`, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrder', orderId] });
    },
    onError: (err) => enqueueSnackbar(formatApiError(err), { variant: 'error' }),
  });

  const { mutate: updateStatus, isPending: isUpdatingStatus } = useMutation({
    mutationFn: (newStatus) => updatePurchaseOrderStatusAPI(orderId, newStatus),
    onSuccess: (data) => {
      enqueueSnackbar(`Estado actualizado a: ${data.status.replace('_', ' ').toUpperCase()}`, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] }); // Invalidar lista general
      queryClient.invalidateQueries({ queryKey: ['purchaseOrder', orderId] }); // Invalidar esta orden
    },
    onError: (err) => enqueueSnackbar(formatApiError(err), { variant: 'error' }),
  });

  const isSubmitting = isUpdating || isUpdatingStatus;

  // --------------------------------------------------------------------------
  // Sub-sección 3.4: Manejadores de Eventos
  // --------------------------------------------------------------------------
  const handleUpdatePurchaseOrder = useCallback((formValues) => {
    const payload = mapFormValuesToUpdatePayload(formValues);
    updatePurchaseOrder(payload);
  }, [updatePurchaseOrder]);

  const handleConfirmOrder = useCallback(() => {
    updateStatus('confirmed');
  }, [updateStatus]);

  const handleNavigateToReceipt = useCallback(() => {
    navigate(`/compras/ordenes/${orderId}/recepciones/nueva`);
  }, [navigate, orderId]);

  // --------------------------------------------------------------------------
  // Sub-sección 3.5: Lógica de Renderizado
  // --------------------------------------------------------------------------
  if (isLoading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (isError) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{formatApiError(error)}</Alert>
      </Container>
    );
  }

  const purchaseOrder = orderQuery.data;
  const isReadOnly = purchaseOrder?.status !== 'draft';

  return (
    <Container maxWidth="xl" sx={{ my: 4 }}>
      <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 2 }}>
        <PageHeader
          title={isReadOnly ? `Detalles de OC: ${purchaseOrder?.order_number || ''}` : `Editar OC: ${purchaseOrder?.order_number || ''}`}
          subtitle={isReadOnly ? "Revise los detalles para registrar la recepción." : "Modifique los detalles de la solicitud de compra."}
        />

        <ActionButtons
          order={purchaseOrder}
          user={user}
          onConfirm={handleConfirmOrder}
          onNavigateToReceipt={handleNavigateToReceipt}
          isSubmitting={isSubmitting}
        />

        <Divider sx={{ mb: 3 }} />

        <Box>
          {purchaseOrder && suppliersQuery.data && productsQuery.data && (
            <PurchaseOrderForm
              initialData={purchaseOrder}
              onSubmit={handleUpdatePurchaseOrder}
              isSubmitting={isUpdating}
              isReadOnly={isReadOnly}
              suppliersOptions={suppliersQuery.data}
              productsOptions={productsQuery.data}
              isLoadingSuppliers={suppliersQuery.isLoading}
              isLoadingProducts={productsQuery.isLoading}
            />
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default EditPurchaseOrderPage;