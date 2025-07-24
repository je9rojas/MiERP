// /frontend/src/features/purchasing/components/PurchaseOrderGridToolbar.js
// COMPONENTE REFACTORIZADO PARA USAR PERMISOS DIRECTOS

/**
 * @file Barra de herramientas inteligente y segura para el DataGrid de Órdenes de Compra.
 * Este componente renderiza condicionalmente el botón "Nueva Orden de Compra"
 * basándose en la lista de permisos del usuario actual.
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
// Importamos la constante del permiso para evitar errores de tipeo
import { PURCHASE_ORDER_CREATE } from '../../../constants/permissions'; // Asegúrate de crear este archivo

// --- SECCIÓN 2: COMPONENTE PRINCIPAL ---
const PurchaseOrderGridToolbar = ({ onAddClick }) => {
  // Se obtiene el usuario del contexto. Este objeto `user` ahora DEBE tener un array `permissions`.
  const { user } = useAuth();
  
  // --- CAMBIO CRÍTICO: Lógica de permisos simplificada y correcta ---
  // Comprobamos si la clave del permiso existe en el array de permisos del usuario.
  // La regla para 'superadmin' se maneja en el backend, que puede darle todos los permisos.
  const canCreate = user?.permissions?.includes(PURCHASE_ORDER_CREATE);

  return (
    <GridToolbarContainer>
      {/* Controles estándar del DataGrid */}
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarDensitySelector />
      <GridToolbarExport />
      
      {/* El botón "Nueva Orden de Compra" solo se renderiza si el usuario tiene el permiso explícito. */}
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