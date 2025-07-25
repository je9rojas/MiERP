// /frontend/src/features/purchasing/components/PurchaseOrderGridToolbar.js

/**
 * @file Barra de herramientas inteligente y segura para el DataGrid de Órdenes de Compra.
 * Utiliza el hook 'usePermissions' para renderizar condicionalmente sus acciones.
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

// --- ¡CAMBIO CLAVE! ---
// Se importa el nuevo hook 'usePermissions' y solo la constante de roles.
// Se eliminan 'useAuth' y la importación de la función 'hasPermission'.
import { usePermissions } from '../../../hooks/usePermissions';
import { CAN_CRUD_PURCHASE_ORDERS } from '../../../constants/rolesAndPermissions';


// --- SECCIÓN 2: COMPONENTE PRINCIPAL ---
const PurchaseOrderGridToolbar = ({ onAddClick }) => {
  // --- ¡CAMBIO CLAVE! ---
  // Se utiliza el hook 'usePermissions' para obtener la función de verificación.
  // El código es ahora más limpio y declarativo.
  const { hasPermission } = usePermissions();
  
  const canCreate = hasPermission(CAN_CRUD_PURCHASE_ORDERS);

  return (
    <GridToolbarContainer>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarDensitySelector />
      <GridToolbarExport />
      
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