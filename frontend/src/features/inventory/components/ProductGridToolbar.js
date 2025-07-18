// /frontend/src/features/inventory/components/ProductGridToolbar.js
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

/**
 * Barra de herramientas personalizada para el DataGrid de productos.
 * Incluye los controles estándar de la tabla y un botón personalizado para "Añadir Producto".
 * @param {object} props - Propiedades pasadas por el DataGrid.
 * @param {function} props.onAddClick - La función a ejecutar cuando se hace clic en el botón de añadir.
 */
const ProductGridToolbar = ({ onAddClick }) => {
  console.log('[ProductGridToolbar] La prop onAddClick recibida es:', onAddClick);
  return (
    <GridToolbarContainer>
      {/* Botones estándar del DataGrid a la izquierda */}
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarDensitySelector />
      <GridToolbarExport />
      
      {/* Botón personalizado "Añadir Producto" a la derecha */}

      {/* Botón personalizado "Añadir Producto" a la derecha */}
      <Button
        color="primary"
        startIcon={<AddIcon />}
        // LOG #4: Verifica el evento de clic en el botón
        onClick={() => {
          console.log('[ProductGridToolbar] ¡Botón (+) clickeado!');
          if (typeof onAddClick === 'function') {
            onAddClick();
          } else {
            console.error('[ProductGridToolbar] Error: onAddClick no es una función. No se puede navegar.');
          }
        }}
        sx={{ ml: 'auto' }} // Empuja el botón hacia la derecha
      >
        Añadir Producto
      </Button>
    </GridToolbarContainer>
  );
};

export default ProductGridToolbar;