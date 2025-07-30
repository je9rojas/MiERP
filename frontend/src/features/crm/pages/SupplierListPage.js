// /frontend/src/features/crm/pages/SupplierListPage.js

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Chip, IconButton, Tooltip } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { esES } from '@mui/x-data-grid/locales';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import PageHeader from '../../../components/common/PageHeader';
import DataGridToolbar from '../../../components/common/DataGridToolbar'; // Asumo un toolbar reutilizable
import { getSuppliersAPI } from '../api/suppliersAPI';
import useDebounce from '../../../hooks/useDebounce'; // Asumo un hook de debounce

const SupplierListPage = () => {
  const navigate = useNavigate();
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500); // 500ms de retardo

  // 1. Obtención de datos con React Query
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['suppliers', paginationModel.page + 1, paginationModel.pageSize, debouncedSearchTerm],
    queryFn: () => getSuppliersAPI({
      page: paginationModel.page + 1,
      pageSize: paginationModel.pageSize,
      search: debouncedSearchTerm,
    }),
    placeholderData: (previousData) => previousData, // Muestra datos antiguos mientras se cargan nuevos
  });

  // 2. Definición de columnas para la DataGrid
  const columns = [
    { field: 'ruc', headerName: 'RUC / ID Fiscal', width: 150 },
    { field: 'business_name', headerName: 'Razón Social', flex: 1 },
    { field: 'trade_name', headerName: 'Nombre Comercial', flex: 1 },
    { field: 'phone', headerName: 'Teléfono', width: 150 },
    { field: 'email', headerName: 'Email', width: 200 },
    {
      field: 'is_active',
      headerName: 'Estado',
      width: 120,
      renderCell: (params) => (
        params.value
          ? <Chip label="Activo" color="success" size="small" />
          : <Chip label="Inactivo" color="error" size="small" />
      ),
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 100,
      sortable: false,
      disableColumnMenu: true,
      renderCell: (params) => (
        <Tooltip title="Editar Proveedor">
          <IconButton onClick={() => navigate(`/crm/proveedores/editar/${params.row.id}`)}>
            <EditIcon />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  if (isError) {
    // Idealmente, aquí iría un componente de error más elegante.
    return <Box>Error al cargar los datos: {error.message}</Box>;
  }

  return (
    <Box>
      <PageHeader
        title="Gestión de Proveedores"
        subtitle="Consulte, cree o edite los proveedores de su empresa."
      >
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/crm/proveedores/nuevo')}
        >
          Nuevo Proveedor
        </Button>
      </PageHeader>

      <Box sx={{ height: 650, width: '100%', mt: 3 }}>
        <DataGrid
          // Filas y Columnas
          rows={data?.items || []}
          columns={columns}
          // Carga y Errores
          loading={isLoading}
          // Paginación del lado del servidor
          rowCount={data?.total_count || 0}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          paginationMode="server"
          // Toolbar
          slots={{
            toolbar: DataGridToolbar,
          }}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
              quickFilterProps: {
                placeholder: 'Buscar por RUC, Razón Social...',
                value: searchTerm,
                onChange: (e) => setSearchTerm(e.target.value),
              },
            },
          }}
          // Otras props
          disableRowSelectionOnClick
          // Traducción
          localeText={esES.components.MuiDataGrid.defaultProps.localeText}
        />
      </Box>
    </Box>
  );
};

export default SupplierListPage;