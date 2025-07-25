/**
 * @file /frontend/src/features/purchasing/pages/PurchaseOrderListPage.js
 * @description Página principal para la visualización, filtrado y gestión de Órdenes de Compra.
 * Utiliza MUI DataGrid para una presentación eficiente y react-query para la gestión de datos asíncrona.
 */

// --- SECCIÓN 1: IMPORTACIONES ---
import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Paper, Alert, IconButton, Tooltip, Typography, Chip } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { esES } from '@mui/x-data-grid/locales';
import { useQuery } from '@tanstack/react-query';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';

// --- ¡CORRECCIÓN! Se importan las herramientas de permisos necesarias ---
import { useAuth } from '../../../app/contexts/AuthContext';

import { getPurchaseOrdersAPI } from '../api/purchasingAPI';
import { useDebounce } from '../../../hooks/useDebounce';
import FilterBar from '../../../components/common/FilterBar';
import PurchaseOrderGridToolbar from '../components/PurchaseOrderGridToolbar';


// --- SECCIÓN 2: DEFINICIONES Y FUNCIONES AUXILIARES A NIVEL DE MÓDULO ---

/**
 * Define la configuración para la barra de filtros de la página.
 * @constant {Array<object>}
 */
const purchaseOrderFilterDefinitions = [
  { name: 'search', label: 'Buscar por N° Orden o Proveedor', type: 'search', gridSize: 6 },
  {
    name: 'status',
    label: 'Filtrar por Estado',
    type: 'select',
    options: [
      { value: 'pendiente', label: 'Pendiente' },
      { value: 'aprobada', label: 'Aprobada' },
      { value: 'rechazada', label: 'Rechazada' },
      { value: 'completada', label: 'Completada' },
    ],
    gridSize: 4
  },
];

/**
 * Devuelve un componente Chip de MUI estilizado según el estado de la orden.
 * @param {string} status - El estado de la orden de compra (ej. 'pendiente').
 * @returns {React.ReactElement} Un componente Chip.
 */
const getStatusChip = (status) => {
    const statusMap = {
      pendiente: { label: 'Pendiente', color: 'warning' },
      aprobada: { label: 'Aprobada', color: 'info' },
      recibida: { label: 'Recibida', color: 'success' },
      completada: { label: 'Completada', color: 'primary' },
      rechazada: { label: 'Rechazada', color: 'error' },
      cancelada: { label: 'Cancelada', color: 'error' },
    };
    const style = statusMap[status] || { label: status, color: 'default' };
    return <Chip label={style.label} color={style.color} size="small" />;
};


/**
 * Componente que se muestra antes de la primera búsqueda, invitando al usuario a interactuar.
 */
const InitialSearchPrompt = () => (
  <Box sx={{ textAlign: 'center', p: 8, color: 'text.secondary', border: '2px dashed #ccc', mt: 4, borderRadius: 2 }}>
    <SearchIcon sx={{ fontSize: 60, mb: 2 }} />
    <Typography variant="h6" component="h2" gutterBottom>
      Encuentre una Orden de Compra
    </Typography>
    <Typography>
      Utilice la barra de búsqueda o los filtros de arriba para comenzar.
    </Typography>
  </Box>
);


// --- SECCIÓN 3: COMPONENTE PRINCIPAL DE LA PÁGINA ---

const PurchaseOrderListPage = () => {

  // --- SECCIÓN 3.1: Hooks y Estado ---
  const navigate = useNavigate();
  // Se añade el hook useAuth para acceder a los datos del usuario.
  const { user } = useAuth();
  console.log('[PurchaseOrderListPage] 1. Usuario obtenido del AuthContext:', user);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [filters, setFilters] = useState({ search: '', status: '' });
  const debouncedFilters = useDebounce(filters, 400);
  const [hasSearched, setHasSearched] = useState(false);


// --- SECCIÓN 3.2: Lógica de Obtención de Datos ---
  // Se añade 'isFetching' para un mejor feedback de carga en cada búsqueda.
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['purchaseOrders', paginationModel, debouncedFilters],
    queryFn: async () => {
      const params = {
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize,
        search: debouncedFilters.search.trim() || undefined,
        status: debouncedFilters.status || undefined,
      };
      return getPurchaseOrdersAPI(params);
    },
    // ¡CAMBIO CLAVE! La consulta está deshabilitada por defecto y solo se ejecutará
    // cuando 'hasSearched' se convierta en 'true', logrando la carga diferida.
    enabled: hasSearched,
    keepPreviousData: true,
  });

  // --- SECCIÓN 3.3: Manejadores de Eventos ---
  // Se corrige el handler para que sea compatible con el componente FilterBar
  const handleFilterChange = useCallback((newFilters) => {
    setPaginationModel(previousModel => ({ ...previousModel, page: 0 }));
    setFilters(newFilters);

    if (!hasSearched) {
      setHasSearched(true);
    }
  }, [hasSearched]);
  
  const handleNavigateToDetail = useCallback((orderId) => {
    navigate(`/compras/ordenes/detalle/${orderId}`);
  }, [navigate]);

  const handleNavigateToEdit = useCallback((orderId) => {
    navigate(`/compras/ordenes/editar/${orderId}`);
  }, [navigate]);

  // --- SECCIÓN 3.4: Definición de Columnas para DataGrid ---
  // Se añade la lógica de permisos para el botón de editar.
  const columns = useMemo(() => [
    { field: 'order_number', headerName: 'N° de Orden', width: 180 },
    { field: 'supplier_name', headerName: 'Proveedor', flex: 1, minWidth: 250 },
    { field: 'order_date', headerName: 'Fecha Creación', width: 150, type: 'date', valueGetter: (value) => new Date(value) },
    { field: 'total_amount', headerName: 'Monto Total', type: 'number', width: 150, align: 'right', headerAlign: 'right', valueFormatter: (value) => `S/ ${Number(value).toFixed(2)}` },
    { field: 'status', headerName: 'Estado', width: 150, renderCell: (params) => getStatusChip(params.value) },
    {
      field: 'actions', 
      headerName: 'Acciones', 
      type: 'actions', 
      width: 120, 
      align: 'center', 
      headerAlign: 'center',
      getActions: (params) => {
        const actions = [];
        // Se utiliza la función 'hasPermission' para determinar si el botón de editar debe mostrarse.
        const canEdit = user ? hasPermission(CAN_CRUD_PURCHASE_ORDERS, user.role) : false;

        // El botón de editar solo aparece si la orden está en borrador Y el usuario tiene permiso.
        if (params.row.status === 'draft' && canEdit) {
          actions.push(
            <Tooltip title="Editar Orden" key="edit">
              <IconButton onClick={() => handleNavigateToEdit(params.row._id)} size="small" color="primary">
                <EditIcon />
              </IconButton>
            </Tooltip>
          );
        }
        
        // El botón de ver detalles siempre está disponible para quienes pueden ver la página.
        actions.push(
          <Tooltip title="Ver Detalle / Aprobar" key="view">
            <IconButton onClick={() => handleNavigateToDetail(params.row._id)} size="small">
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
        );

        return actions;
      },
    },
  ], [handleNavigateToDetail, handleNavigateToEdit, user]); // Se añade 'user' a las dependencias del hook.

  
// --- 3.5: Renderizado del Componente ---
return (
    <Container maxWidth="xl">
      <Paper 
        sx={{ 
          p: { xs: 2, md: 3 }, 
          my: 4, 
          borderRadius: 2, 
          boxShadow: 3 
        }}
      >
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 2 }}>
          Gestión de Órdenes de Compra
        </Typography>

        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          filterDefinitions={purchaseOrderFilterDefinitions}
        />
      
        {!hasSearched ? (
          <InitialSearchPrompt />
        ) : (
          <Box 
            sx={{ flexGrow: 1, width: '100%', mt: 2, height: 'calc(100vh - 350px)' }}
          >
            {error && <Alert severity="error" sx={{ my: 2 }}>{error.message || 'Error al cargar las órdenes de compra.'}</Alert>}
            <DataGrid
              rows={data?.items || []}
              columns={columns}
              getRowId={(row) => row._id}
              rowCount={data?.total || 0}
              loading={isLoading || isFetching}
              pageSizeOptions={[10, 25, 50]}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              paginationMode="server"
              density="compact"
              localeText={esES.components.MuiDataGrid.defaultProps.localeText}
              disableRowSelectionOnClick
              slots={{
                  toolbar: () => (
                    <PurchaseOrderGridToolbar 
                      onAddClick={() => navigate('/compras/ordenes/nueva')} 
                      user={user} 
                    />
                  ),
              }}
              initialState={{
                sorting: {
                  sortModel: [{ field: 'order_number', sort: 'desc' }],
                },
              }}
            />
          </Box>
        )}
      </Paper>
    </Container>
  );



export default PurchaseOrderListPage;