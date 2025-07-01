import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  IconButton, 
  Typography, 
  Avatar, 
  Menu, 
  MenuItem, 
  Box,
  useTheme,
  Divider // Añadido Divider
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  Notifications as NotificationsIcon,
  AccountCircle as AccountCircleIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon // Añadido SettingsIcon
} from '@mui/icons-material';
import { useAuth } from '../../app/contexts/AuthContext';

const DashboardAppBar = ({ handleDrawerToggle }) => {
  const theme = useTheme();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: theme.zIndex.drawer + 1,
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
        
        <Typography 
          variant="h6" 
          noWrap 
          component="div"
          sx={{ 
            fontWeight: 700,
            background: theme.palette.primary.main,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          MiERP PRO
        </Typography>
        
        <Box sx={{ flexGrow: 1 }} />
        
        <IconButton color="inherit" sx={{ mr: 1 }}>
          <NotificationsIcon />
        </IconButton>
        
        <IconButton
          edge="end"
          aria-label="account of current user"
          aria-haspopup="true"
          onClick={handleProfileMenuOpen}
          color="inherit"
        >
          {user ? (
            <Avatar 
              sx={{ 
                width: 36, 
                height: 36,
                bgcolor: theme.palette.primary.main,
                fontSize: '0.875rem'
              }}
            >
              {user.name.charAt(0)}
            </Avatar>
          ) : (
            <AccountCircleIcon />
          )}
        </IconButton>
        
        <Menu
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          sx={{ mt: 1 }}
        >
          <MenuItem disabled>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ mr: 2, bgcolor: theme.palette.primary.main }}>
                {user?.name?.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="subtitle1">{user?.name}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {user?.role === 'superadmin' ? 'Administrador Global' : 'Administrador'}
                </Typography>
              </Box>
            </Box>
          </MenuItem>
          <Divider sx={{ my: 1 }} />
          <MenuItem onClick={handleMenuClose}>
            <AccountCircleIcon sx={{ mr: 2 }} /> Perfil
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <SettingsIcon sx={{ mr: 2 }} /> Configuración
          </MenuItem>
          <Divider sx={{ my: 1 }} />
          <MenuItem onClick={handleLogout} sx={{ color: theme.palette.error.main }}>
            <LogoutIcon sx={{ mr: 2 }} /> Cerrar sesión
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default DashboardAppBar;