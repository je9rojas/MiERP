// File: /frontend/src/components/layout/DashboardSidebar.js

/**
 * @file Componente del menú lateral (Sidebar) para la navegación principal.
 * @description Renderiza la navegación de la aplicación, manejando los estados
 * abierto/cerrado, los menús desplegables y los permisos de usuario.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import MuiDrawer from '@mui/material/Drawer';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Box, Typography, List, ListItemButton, ListItemIcon, ListItemText,
  Divider, IconButton, Collapse,
} from '@mui/material';
import { ExpandLess as ExpandLessIcon, ExpandMore as ExpandMoreIcon, ChevronLeft as ChevronLeftIcon } from '@mui/icons-material';

import { useAuth } from '../../app/contexts/AuthContext';
import { hasPermission } from '../../utils/auth/roles';
import { SIDEBAR_STRUCTURE } from './sidebarConfig'; // Se importa la configuración

// ==============================================================================
// SECCIÓN 2: COMPONENTES DE ESTILO (Styled Components)
// ==============================================================================

const drawerWidth = 260;

const openedMixin = (theme) => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme) => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    ...(open && { ...openedMixin(theme), '& .MuiDrawer-paper': openedMixin(theme) }),
    ...(!open && { ...closedMixin(theme), '& .MuiDrawer-paper': closedMixin(theme) }),
  }),
);

// ==============================================================================
// SECCIÓN 3: COMPONENTE PRINCIPAL DEL SIDEBAR
// ==============================================================================

const DashboardSidebar = ({ open, handleDrawerClose }) => {
  const location = useLocation();
  const { user } = useAuth();

  const initialOpenMenus = useMemo(() => {
    const initialState = {};
    SIDEBAR_STRUCTURE.flatMap(s => s.items).forEach(item => {
      if (item.subItems?.some(sub => location.pathname.startsWith(sub.path))) {
        initialState[item.text] = true;
      }
    });
    return initialState;
  }, [location.pathname]);

  const [openMenus, setOpenMenus] = useState(initialOpenMenus);

  const handleMenuClick = useCallback((name) => {
    setOpenMenus(prev => ({ ...prev, [name]: !prev[name] }));
  }, []);

  const renderMenuItems = (items) => {
    if (!user) return null;

    return items
      .filter(item => !item.permission || hasPermission(user.role, item.permission))
      .map(item => {
        if (item.subItems) {
          const accessibleSubItems = item.subItems.filter(sub => !sub.permission || hasPermission(user.role, sub.permission));
          if (accessibleSubItems.length === 0) return null;

          return (
            <React.Fragment key={item.text}>
              <ListItemButton onClick={() => handleMenuClick(item.text)} sx={{ minHeight: 48, justifyContent: 'initial', px: 2.5 }}>
                <ListItemIcon sx={{ minWidth: 0, mr: open ? 3 : 'auto', justifyContent: 'center' }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} sx={{ opacity: open ? 1 : 0 }} />
                {open && (openMenus[item.text] ? <ExpandLessIcon /> : <ExpandMoreIcon />)}
              </ListItemButton>
              <Collapse in={openMenus[item.text] && open} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {accessibleSubItems.map(subItem => (
                    <ListItemButton key={subItem.text} component={RouterLink} to={subItem.path} selected={location.pathname.startsWith(subItem.path)} sx={{ pl: 4 }}>
                      <ListItemIcon sx={{ minWidth: 0, mr: open ? 3 : 'auto' }}>{subItem.icon}</ListItemIcon>
                      <ListItemText primary={subItem.text} sx={{ opacity: open ? 1 : 0 }} />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            </React.Fragment>
          );
        }

        return (
          <ListItemButton key={item.text} component={RouterLink} to={item.path} selected={location.pathname.startsWith(item.path)} sx={{ minHeight: 48, justifyContent: 'initial', px: 2.5 }}>
            <ListItemIcon sx={{ minWidth: 0, mr: open ? 3 : 'auto', justifyContent: 'center' }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} sx={{ opacity: open ? 1 : 0 }} />
          </ListItemButton>
        );
      });
  };

  return (
    <Drawer variant="permanent" open={open}>
      <DrawerHeader>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, pl: 2, opacity: open ? 1 : 0, transition: 'opacity 0.3s' }}>
          <Box component="img" src="/images/logo-icon.png" alt="MiERP Logo Icono" sx={{ width: 32, height: 32, mr: 1.5 }} />
          <Typography variant="h6" fontWeight="bold">MiERP</Typography>
        </Box>
        <IconButton onClick={handleDrawerClose}><ChevronLeftIcon /></IconButton>
      </DrawerHeader>
      <Divider />
      {SIDEBAR_STRUCTURE.map((section, index) => (
        <React.Fragment key={section.section}>
          {index > 0 && <Divider sx={{ my: 1 }} />}
          <List component="nav" sx={{ p: 1 }} subheader={open && <Typography variant="caption" sx={{ px: 2, color: 'text.secondary', fontWeight: 'bold' }}>{section.section.toUpperCase()}</Typography>}>
            {renderMenuItems(section.items)}
          </List>
        </React.Fragment>
      ))}
    </Drawer>
  );
};

DashboardSidebar.propTypes = {
    open: PropTypes.bool.isRequired,
    handleDrawerClose: PropTypes.func.isRequired,
};

export default DashboardSidebar;