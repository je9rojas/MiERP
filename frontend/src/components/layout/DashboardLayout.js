// src/components/layout/DashboardLayout.js
import React, { useState } from 'react';
import { Box, CssBaseline, Toolbar, useTheme } from '@mui/material';
import DashboardSidebar from './DashboardSidebar';
import DashboardAppBar from './DashboardAppBar'; // Nuevo componente

const DashboardLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <DashboardAppBar handleDrawerToggle={handleDrawerToggle} />
      <DashboardSidebar 
        mobileOpen={mobileOpen} 
        handleDrawerToggle={handleDrawerToggle} 
      />
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 3,
          width: { sm: `calc(100% - ${theme.mixins.drawerWidth}px)` },
          marginTop: { xs: '56px', sm: '64px' }
        }}
      >
        <Toolbar /> {/* Espacio para AppBar */}
        {children}
      </Box>
    </Box>
  );
};

export default DashboardLayout;