// /frontend/src/components/layout/DashboardLayout.js

/**
 * @file Componente principal del Layout del Dashboard.
 *
 * Este componente define la estructura visual principal para las páginas autenticadas.
 * Orquesta la AppBar (barra superior), el Sidebar (menú lateral) y el área de
 * contenido principal. Gestiona el estado de apertura/cierre del menú lateral.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useState } from 'react';
import { styled } from '@mui/material/styles';
import { Box, CssBaseline, Toolbar, IconButton, Typography } from '@mui/material';
import MuiAppBar from '@mui/material/AppBar';
import { Outlet } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardSidebar from './DashboardSidebar';
import { useAuth } from '../../app/contexts/AuthContext'; // Para mostrar el nombre del usuario

// ==============================================================================
// SECCIÓN 2: COMPONENTES DE ESTILO (STYLED COMPONENTS)
// ==============================================================================

// Ancho del menú lateral, debe ser consistente con el definido en DashboardSidebar.js
const drawerWidth = 260;

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

// ==============================================================================
// SECCIÓN 3: COMPONENTE PRINCIPAL DEL LAYOUT
// ==============================================================================

const DashboardLayout = () => {
  const [open, setOpen] = useState(true);
  const { user } = useAuth();

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      <AppBar position="fixed" open={open}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{
              marginRight: 5,
              ...(open && { display: 'none' }),
            }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            ERP Dashboard
          </Typography>
          <Typography variant="subtitle1">
            Hola, {user?.name || 'Usuario'}
          </Typography>
        </Toolbar>
      </AppBar>
      
      <DashboardSidebar 
        open={open} 
        handleDrawerClose={handleDrawerClose}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          backgroundColor: (theme) => theme.palette.grey[100],
          minHeight: '100vh'
        }}
      >
        {/* Este Toolbar actúa como un espaciador para que el contenido no quede debajo del AppBar */}
        <Toolbar /> 
        
        {/* Aquí se renderiza el contenido de la ruta actual (ej. ProductListPage) */}
        <Outlet />
      </Box>
    </Box>
  );
};

export default DashboardLayout;