// /frontend/src/features/dashboard/pages/DashboardPage.js

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../app/contexts/AuthContext';
import { 
  Box, 
  Typography, 
  Button, 
  Paper,
  CircularProgress,
  Avatar
} from '@mui/material';
// --- CORRECCIÓN: Se importa Grid desde Unstable_Grid2 para usar la API más reciente ---
import Grid from '@mui/material/Unstable_Grid2'; 
import { 
  People as PeopleIcon, 
  Inventory as InventoryIcon, 
  Store as StoreIcon,
  BarChart as BarChartIcon
} from '@mui/icons-material';

const DashboardPage = () => {
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();

  // Redirigir si no está autenticado
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (isLoading || !user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  // Tarjetas de resumen
  const summaryCards = [
    { title: 'Usuarios', value: 24, icon: <PeopleIcon fontSize="large" />, color: 'primary' },
    { title: 'Productos', value: 156, icon: <InventoryIcon fontSize="large" />, color: 'secondary' },
    { title: 'Sucursales', value: 3, icon: <StoreIcon fontSize="large" />, color: 'success' },
    { title: 'Ventas Hoy', value: 42, icon: <BarChartIcon fontSize="large" />, color: 'warning' },
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Encabezado */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 4,
        p: 2,
        backgroundColor: 'background.paper',
        borderRadius: 2,
        boxShadow: 3
      }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Panel de Control
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Bienvenido, {user.name} ({user.role})
          </Typography>
        </Box>
        
        <Button 
          variant="contained" 
          color="error" 
          onClick={handleLogout}
          sx={{ fontWeight: 'bold' }}
        >
          Cerrar Sesión
        </Button>
      </Box>

      {/* Resumen */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {summaryCards.map((card, index) => (
          // --- CORRECCIÓN: Se elimina la prop "item" que ya no es necesaria ---
          <Grid xs={12} sm={6} md={3} key={index}>
            <Paper 
              sx={{ 
                p: 3, 
                display: 'flex', 
                alignItems: 'center',
                borderRadius: 3,
                backgroundColor: `${card.color}.light`,
                color: `${card.color}.contrastText`
              }}
            >
              <Avatar sx={{ 
                mr: 2, 
                bgcolor: `${card.color}.main`,
                width: 56, 
                height: 56 
              }}>
                {card.icon}
              </Avatar>
              <Box>
                <Typography variant="h6">{card.title}</Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{card.value}</Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Contenido principal */}
      <Grid container spacing={3}>
        {/* --- CORRECCIÓN: Se elimina la prop "item" --- */}
        <Grid xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
              Resumen de Actividades
            </Typography>
            <Box sx={{ p: 2, backgroundColor: 'grey.100', borderRadius: 2 }}>
              <Typography>
                <strong>Última actividad:</strong> Creación de nuevo producto "Monitor 24''"
              </Typography>
              <Typography sx={{ mt: 1 }}>
                <strong>Próximas tareas:</strong> Revisar inventario de sucursal principal
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        {/* --- CORRECCIÓN: Se elimina la prop "item" --- */}
        <Grid xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
              Tu Perfil
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ 
                width: 56, 
                height: 56, 
                mr: 2,
                bgcolor: 'primary.main' 
              }}>
                {user.name.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="h6">{user.name}</Typography>
                <Typography color="text.secondary">{user.role}</Typography>
              </Box>
            </Box>
            
            <Box sx={{ mt: 3 }}>
              <Typography><strong>Email:</strong> {user.username}@empresa.com</Typography>
              <Typography sx={{ mt: 1 }}><strong>Sucursal:</strong> {user.branch?.name || 'Central'}</Typography>
              <Typography sx={{ mt: 1 }}><strong>Último acceso:</strong> Hoy a las 09:30</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Pie de página */}
      <Box sx={{ mt: 4, textAlign: 'center', color: 'text.secondary' }}>
        <Typography variant="body2">
          MiERP v1.0 © {new Date().getFullYear()} - Sistema de Gestión Empresarial
        </Typography>
      </Box>
    </Box>
  );
};

export default DashboardPage;