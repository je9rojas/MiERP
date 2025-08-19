// frontend/src/features/purchasing/pages/GoodsReceiptDetailsPage.js

/**
 * @file Página contenedora para mostrar los detalles de una Recepción de Mercancía.
 *
 * @description Este componente orquesta la visualización de los detalles de una
 * recepción de mercancía específica. Valida los permisos del usuario para
 * determinar si puede iniciar acciones posteriores, como la creación de una
 * factura de compra a partir de la recepción.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useCallback } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Container, Paper, Box, CircularProgress, Typography, Alert, Button, Divider } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ReceiptIcon from '@mui/icons-material/Receipt';

// Hooks, API, Componentes y el nuevo sistema de Permisos
import { useAuth } from '../../../app/contexts/AuthContext';
import { hasPermission, PERMISSIONS } from '../../../utils/auth/roles';
import { getGoodsReceiptByIdAPI } from '../api/purchasingAPI';
import GoodsReceiptDetails from '../components/GoodsReceiptDetails';
import PageHeader from '../../../components/common/PageHeader';
import { formatApiError } from '../../../utils/errorUtils';

// ==============================================================================
// SECCIÓN 2: COMPONENTE PRINCIPAL DE LA PÁGINA
// ==============================================================================

const GoodsReceiptDetailsPage = () => {
  // --------------------------------------------------------------------------
  // Sub-sección 2.1: Hooks y Estado
  // --------------------------------------------------------------------------
  const { receiptId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // --------------------------------------------------------------------------
  // Sub-sección 2.2: Lógica de Obtención de Datos (React Query)
  // --------------------------------------------------------------------------
  const {
    data: receipt,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['goodsReceipt', receiptId],
    queryFn: () => getGoodsReceiptByIdAPI(receiptId),
    enabled: !!receiptId,
  });

  // --------------------------------------------------------------------------
  // Sub-sección 2.3: Manejadores de Eventos
  // --------------------------------------------------------------------------
  const handleNavigateToBill = useCallback(() => {
    navigate(`/compras/recepciones/${receiptId}/facturar`);
  }, [navigate, receiptId]);

  // --------------------------------------------------------------------------
  // Sub-sección 2.4: Renderizado Condicional (Carga y Error)
  // --------------------------------------------------------------------------
  if (isLoading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Cargando detalles de la recepción...</Typography>
        </Box>
      </Container>
    );
  }

  if (isError) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{`Error al cargar los datos: ${formatApiError(error)}`}</Alert>
      </Container>
    );
  }

  // --------------------------------------------------------------------------
  // Sub-sección 2.5: Renderizado Principal
  // --------------------------------------------------------------------------
  const canCreateBill = hasPermission(user?.role, PERMISSIONS.PURCHASING_CREATE_BILL);

  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 2 }}>
        <PageHeader
          title={`Detalles de Recepción: ${receipt?.receipt_number || ''}`}
          subtitle="Información detallada de la entrada de mercancía al inventario."
        />

        <Box mt={3} mb={3} display="flex" justifyContent="space-between" alignItems="center">
          <Button
            component={RouterLink}
            to="/compras/recepciones"
            startIcon={<ArrowBackIcon />}
          >
            Volver a la Lista
          </Button>

          {/* El botón para facturar solo aparece si el usuario tiene el permiso explícito. */}
          {canCreateBill && (
            <Button
              variant="contained"
              startIcon={<ReceiptIcon />}
              onClick={handleNavigateToBill}
            >
              Crear Factura de Compra
            </Button>
          )}
        </Box>

        <Divider sx={{ mb: 3 }} />

        {receipt && <GoodsReceiptDetails receipt={receipt} />}
      </Paper>
    </Container>
  );
};

export default GoodsReceiptDetailsPage;