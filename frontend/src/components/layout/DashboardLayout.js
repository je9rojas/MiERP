// /frontend/src/components/layout/DashboardLayout.js
import React, { useState } from 'react';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import DashboardAppBar from './DashboardAppBar';
import DashboardSidebar from './DashboardSidebar';

const DashboardLayout = () => {
  // Estado para controlar si el menú lateral está abierto o cerrado
  const [open, setOpen] = useState(false);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Pasamos el estado y la función para abrir el menú a la barra superior */}
      <DashboardAppBar open={open} handleDrawerOpen={handleDrawerOpen} />
      
      {/* Pasamos el estado y la función para cerrar el menú a la barra lateral */}
      <DashboardSidebar open={open} handleDrawerClose={handleDrawerClose} />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          // Añadimos un paddingTop para que el contenido no quede debajo del AppBar
          mt: (theme) => `calc(${theme.mixins.toolbar.minHeight}px + ${theme.spacing(1)})`,
        }}
      >
        {/* Aquí se renderizarán todas las páginas de tu dashboard */}
        <Outlet />
      </Box>
    </Box>
  );
};

export default DashboardLayout;