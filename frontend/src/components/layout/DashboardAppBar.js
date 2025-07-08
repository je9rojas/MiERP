// /frontend/src/components/layout/DashboardAppBar.js
// CÓDIGO FINAL Y COMPLETO - REEMPLAZA TODO EL ARCHIVO

import React from 'react';
import { styled } from '@mui/material/styles';
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import { Avatar, Box } from '@mui/material';
import { useAuth } from '../../app/contexts/AuthContext';

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: theme.mixins.drawerWidth,
    width: `calc(100% - ${theme.mixins.drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const DashboardAppBar = ({ open, handleDrawerOpen }) => {
  const { user } = useAuth();

  return (
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
          MiERP
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography sx={{ display: { xs: 'none', sm: 'block' } }}>
            {user?.name || 'Usuario'}
          </Typography>
          <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32, fontSize: '0.875rem' }}>
            {user?.name?.charAt(0).toUpperCase() || '?'}
          </Avatar>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default DashboardAppBar;