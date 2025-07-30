import { GridToolbarContainer, GridToolbarQuickFilter } from '@mui/x-data-grid';

// Este toolbar personalizado simplemente muestra el campo de búsqueda rápida.
// Puedes añadir más elementos aquí, como botones de exportar, filtros, etc.
const DataGridToolbar = (props) => {
  return (
    <GridToolbarContainer>
      <GridToolbarQuickFilter {...props.quickFilterProps} />
    </GridToolbarContainer>
  );
};

export default DataGridToolbar;