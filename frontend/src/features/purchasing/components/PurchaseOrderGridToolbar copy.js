// /frontend/src/features/purchasing/components/PurchaseOrderGridToolbar.js

/**
 * @file Barra de herramientas inteligente y segura para el DataGrid de Órdenes de Compra.
 * Este componente es responsable de mostrar los controles estándar de la tabla y,
 * lo más importante, de renderizar condicionalmente el botón "Nueva Orden de Compra"
 * basándose en los permisos del usuario actual.
 */

// --- SECCIÓN 1: IMPORTACIONES ---
import React from 'react';
import {
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarDensitySelector,
  GridToolbarExport,
} from '@mui/x-data-grid';
import { Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

import { useAuth } from '../../../app/contexts/AuthContext';
import { CAN_CRUD_PURCHASE_ORDERS, hasPermission } from '../../../constants/rolesAndPermissions';


// --- SECCIÓN 2: COMPONENTE PRINCIPAL ---
const PurchaseOrderGridToolbar = ({ onAddClick }) => {
  // Se obtiene el usuario directamente desde el contexto de autenticación.
  const { user } = useAuth();
  
  // La lógica de permisos utiliza el 'user' del contexto para determinar la visibilidad.
  const canCreate = hasPermission(CAN_CRUD_PURCHASE_ORDERS, user?.role);

  return (
    <GridToolbarContainer>
      {/* Controles estándar del DataGrid */}
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarDensitySelector />
      <GridToolbarExport />
      
      {/* El botón "Nueva Orden de Compra" solo se renderiza si 'canCreate' es true. */}
      {canCreate && (
        <Button
          color="primary"
          startIcon={<AddIcon />}
          onClick={onAddClick}
          sx={{ ml: 'auto' }}
        >
          Nueva Orden de Compra
        </Button>
      )}
    </GridToolbarContainer>
  );
};

export default PurchaseOrderGridToolbar;