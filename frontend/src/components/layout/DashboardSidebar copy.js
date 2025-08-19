// /frontend/src/components/layout/DashboardSidebar.js

/**
 * @file Componente del menú lateral (Sidebar) para la navegación principal del Dashboard.
 *
 * Este componente es responsable de renderizar los enlaces de navegación del sistema
 * de forma jerárquica y adaptable. Filtra dinámicamente los elementos del menú
 * basándose en el sistema de permisos centralizado de la aplicación, asegurando que
 * los usuarios solo vean las opciones a las que tienen acceso.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useState, useCallback, useMemo } from 'react';
import { styled } from '@mui/material/styles';
import MuiDrawer from '@mui/material/Drawer';
import { Link, useLocation } from 'react-router-dom';
import {
  Box, Typography, List, ListItemButton, ListItemIcon, ListItemText,
  Divider, IconButton, Collapse,
} from '@mui/material';
import {
  Dashboard as DashboardIcon, PointOfSale as PointOfSaleIcon, People as PeopleIcon,
  ShoppingCart as ShoppingCartIcon, ReceiptLong as ReceiptLongIcon,
  LocalShipping as LocalShippingIcon, Inventory as InventoryIcon,
  AdminPanelSettings as AdminPanelSettingsIcon, Business as BusinessIcon,
  BuildCircle as BuildCircleIcon, Dns as DnsIcon, ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon, PictureAsPdf as PictureAsPdfIcon,
  Assessment as AssessmentIcon, ChevronLeft as ChevronLeftIcon,
  ImportExport as ImportExportIcon, Article as ArticleIcon,
  Handshake as CrmIcon, MonetizationOn as FinanceIcon,
  Inventory2 as GoodsReceiptIcon,
} from '@mui/icons-material';

import { useAuth } from '../../app/contexts/AuthContext';
import { hasPermission, PERMISSIONS } from '../../utils/auth/roles';

// ==============================================================================
// SECCIÓN 2: COMPONENTES DE ESTILO (STYLED COMPONENTS)
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
// SECCIÓN 3: ESTRUCTURA DE DATOS DEL MENÚ
// ==============================================================================

const SIDEBAR_STRUCTURE = [
  {
    section: "Principal",
    items: [
      { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
      {
        text: 'CRM', icon: <CrmIcon />,
        permission: [PERMISSIONS.CRM_VIEW_SUPPLIERS, PERMISSIONS.CRM_VIEW_CUSTOMERS],
        subItems: [
          { text: 'Proveedores', icon: <BusinessIcon />, path: '/crm/proveedores', permission: PERMISSIONS.CRM_VIEW_SUPPLIERS },
          { text: 'Clientes', icon: <PeopleIcon />, path: '/crm/clientes', permission: PERMISSIONS.CRM_VIEW_CUSTOMERS },
        ],
      },
      {
        text: 'Ventas', icon: <PointOfSaleIcon />,
        // El menú de Ventas será visible si el usuario puede ver órdenes, despachar o ver facturas.
        permission: [PERMISSIONS.SALES_VIEW_ORDERS, PERMISSIONS.SALES_DISPATCH_GOODS, PERMISSIONS.SALES_VIEW_INVOICES],
        subItems: [
          { text: 'Órdenes de Venta', icon: <ReceiptLongIcon />, path: '/ventas/ordenes', permission: PERMISSIONS.SALES_VIEW_ORDERS },
          // --- CORRECCIÓN CRÍTICA ---
          // Se descomentan las rutas para Despachos y Facturas de Venta.
          { text: 'Despachos', icon: <LocalShippingIcon />, path: '/ventas/despachos', permission: PERMISSIONS.SALES_DISPATCH_GOODS },
          { text: 'Facturas de Venta', icon: <ArticleIcon />, path: '/ventas/facturas', permission: PERMISSIONS.SALES_VIEW_INVOICES },
        ],
      },
      {
        text: 'Compras', icon: <ShoppingCartIcon />,
        permission: [PERMISSIONS.PURCHASING_VIEW_ORDERS, PERMISSIONS.PURCHASING_RECEIVE_GOODS, PERMISSIONS.PURCHASING_VIEW_BILLS],
        subItems: [
          { text: 'Órdenes de Compra', icon: <ReceiptLongIcon />, path: '/compras/ordenes', permission: PERMISSIONS.PURCHASING_VIEW_ORDERS },
          { text: 'Recepciones', icon: <GoodsReceiptIcon />, path: '/compras/recepciones', permission: PERMISSIONS.PURCHASING_RECEIVE_GOODS },
          { text: 'Facturas de Compra', icon: <ArticleIcon />, path: '/compras/facturas', permission: PERMISSIONS.PURCHASING_VIEW_BILLS },
        ],
      },
      {
        text: 'Inventario', icon: <InventoryIcon />, permission: PERMISSIONS.INVENTORY_VIEW_PRODUCTS,
        subItems: [
          { text: 'Productos', icon: <InventoryIcon />, path: '/inventario/productos', permission: PERMISSIONS.INVENTORY_VIEW_PRODUCTS },
        ],
      },
    ]
  },
  {
    section: "Análisis",
    items: [
      {
        text: 'Reportes', icon: <AssessmentIcon />, permission: PERMISSIONS.REPORTS_VIEW_CATALOG,
        subItems: [
          { text: 'Generar Catálogo', icon: <PictureAsPdfIcon />, path: '/reportes/catalogo', permission: PERMISSIONS.REPORTS_VIEW_CATALOG },
        ]
      }
    ]
  },
  {
    section: "Configuración",
    items: [
      {
        text: 'Administración', icon: <AdminPanelSettingsIcon />, permission: [PERMISSIONS.ADMIN_VIEW_USER_MANAGEMENT, PERMISSIONS.ADMIN_VIEW_DATA_MANAGEMENT],
        subItems: [
          { text: 'Usuarios y Roles', icon: <PeopleIcon />, path: '/admin/usuarios', permission: PERMISSIONS.ADMIN_VIEW_USER_MANAGEMENT },
          { text: 'Gestión de Datos', icon: <ImportExportIcon />, path: '/admin/gestion-datos', permission: PERMISSIONS.ADMIN_VIEW_DATA_MANAGEMENT },
        ]
      },
    ]
  }
];

// ==============================================================================
// SECCIÓN 4: COMPONENTE PRINCIPAL DEL SIDEBAR
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

  const checkPermission = (permission) => {
    if (!permission) return true;
    if (Array.isArray(permission)) {
      return permission.some(p => p && hasPermission(user.role, p));
    }
    return hasPermission(user.role, permission);
  };

  const renderMenuItems = useCallback((items) => {
    if (!items || !user) return null;

    const createListItem = (item, isSubItem = false) => {
      if (!checkPermission(item.permission)) return null;

      if (item.subItems) {
        const accessibleSubItems = item.subItems.map(sub => createListItem(sub, true)).filter(Boolean);
        if (accessibleSubItems.length === 0) return null;

        return (
          <React.Fragment key={item.text}>
            <ListItemButton onClick={() => handleMenuClick(item.text)} sx={{ minHeight: 48, justifyContent: open ? 'initial' : 'center', px: 2.5 }}>
              <ListItemIcon sx={{ minWidth: 0, mr: open ? 3 : 'auto', justifyContent: 'center' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} sx={{ opacity: open ? 1 : 0 }} />
              {open && (openMenus[item.text] ? <ExpandLessIcon /> : <ExpandMoreIcon />)}
            </ListItemButton>
            <Collapse in={openMenus[item.text] && open} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>{accessibleSubItems}</List>
            </Collapse>
          </React.Fragment>
        );
      }
      
      return (
        <ListItemButton
          key={item.text}
          component={Link}
          to={item.path}
          selected={location.pathname.startsWith(item.path)}
          sx={{ pl: isSubItem ? 4 : 2.5, minHeight: 48, justifyContent: open ? 'initial' : 'center' }}
        >
          <ListItemIcon sx={{ minWidth: 0, mr: open ? 3 : 'auto', justifyContent: 'center' }}>
            {item.icon}
          </ListItemIcon>
          <ListItemText primary={item.text} sx={{ opacity: open ? 1 : 0 }} />
        </ListItemButton>
      );
    };

    return items.map(item => createListItem(item)).filter(Boolean);
  }, [user, open, openMenus, location.pathname, handleMenuClick]);

  return (
    <Drawer variant="permanent" open={open}>
      <DrawerHeader>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, pl: 2, opacity: open ? 1 : 0, transition: 'opacity 0.3s' }}>
          <Box sx={{ width: 40, height: 40, backgroundColor: 'primary.main', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 1.5 }}>
            <Typography variant="h6" fontWeight="bold" color="primary.contrastText">M</Typography>
          </Box>
          <Typography variant="h6" fontWeight="bold">MiERP</Typography>
        </Box>
        <IconButton onClick={handleDrawerClose}><ChevronLeftIcon /></IconButton>
      </DrawerHeader>
      <Divider />
      {SIDEBAR_STRUCTURE.map((section, index) => (
        <React.Fragment key={section.section}>
          {index > 0 && <Divider sx={{ mx: 2, my: 1 }} />}
          <List component="nav" sx={{ p: 1 }} subheader={open && <Typography variant="caption" sx={{ px: 2.5, color: 'text.secondary', fontWeight: 'bold' }}>{section.section.toUpperCase()}</Typography>}>
            {renderMenuItems(section.items)}
          </List>
        </React.Fragment>
      ))}
    </Drawer>
  );
};

export default DashboardSidebar;