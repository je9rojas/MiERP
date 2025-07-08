// /frontend/src/components/layout/DashboardLayout.js
// CÓDIGO FINAL Y COMPLETO - REEMPLAZA TODO EL ARCHIVO

import React, { useState } from 'react';
import { Box, CssBaseline, Toolbar, useTheme } from '@mui/material';
import { Outlet } from 'react-router-dom';
import DashboardAppBar from './DashboardAppBar';
import DashboardSidebar from './DashboardSidebar';

const DashboardLayout = () => {
  const theme = useTheme();
  const [open, setOpen] = useState(true);

  // Obtenemos el ancho del drawer directamente del tema
  const drawerWidth = theme.mixins.drawerWidth;

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <DashboardAppBar 
        open={open} 
        handleDrawerOpen={handleDrawerOpen}
      />
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
        }}
      >
        <Toolbar /> 
        <Outlet />
      </Box>
    </Box>
  );
};

export default DashboardLayout;