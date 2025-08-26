// /frontend/src/components/layout/DashboardSidebar.js

/**
 * @file [VERSIÓN DE DEPURACIÓN] Componente del menú lateral (Sidebar).
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
// SECCIÓN 2: COMPONENTES DE ESTILO
// ==============================================================================

const drawerWidth = 260;
// ... (El resto de los styled components no cambia, se asume que están aquí)
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
// SECCIÓN 3: ESTRUCTURA DE DATOS DEL MENÚ (SIMPLIFICADA PARA DEPURACIÓN)
// ==============================================================================

const SIDEBAR_STRUCTURE = [
  {
    section: "Principal",
    items: [
      { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
      {
        text: 'CRM', icon: <CrmIcon />,
        permission: PERMISSIONS.CRM_VIEW_SUPPLIERS, // Simplificado a un solo permiso
        subItems: [
          { text: 'Proveedores', icon: <BusinessIcon />, path: '/crm/proveedores', permission: PERMISSIONS.CRM_VIEW_SUPPLIERS },
          { text: 'Clientes', icon: <PeopleIcon />, path: '/crm/clientes', permission: PERMISSIONS.CRM_VIEW_CUSTOMERS },
        ],
      },
      {
        text: 'Ventas', icon: <PointOfSaleIcon />,
        permission: PERMISSIONS.SALES_VIEW_ORDERS, // Simplificado a un solo permiso
        subItems: [
          { text: 'Órdenes de Venta', icon: <ReceiptLongIcon />, path: '/ventas/ordenes', permission: PERMISSIONS.SALES_VIEW_ORDERS },
          { text: 'Despachos', icon: <LocalShippingIcon />, path: '/ventas/despachos', permission: PERMISSIONS.SALES_DISPATCH_GOODS },
          { text: 'Facturas de Venta', icon: <ArticleIcon />, path: '/ventas/facturas', permission: PERMISSIONS.SALES_VIEW_INVOICES },
        ],
      },
      // ... (El resto de la estructura sigue igual)
      {
        text: 'Compras', icon: <ShoppingCartIcon />,
        permission: PERMISSIONS.PURCHASING_VIEW_ORDERS,
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
        text: 'Administración', icon: <AdminPanelSettingsIcon />, permission: PERMISSIONS.ADMIN_VIEW_USER_MANAGEMENT,
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
  // --- LOG DE DEPURACIÓN ---
  console.log('[DEBUG] Renderizando DashboardSidebar...');
  
  const location = useLocation();
  const { user } = useAuth();
  
  // --- LOG DE DEPURACIÓN ---
  console.log('[DEBUG] Objeto user de useAuth():', user);

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

  const renderMenuItems = useCallback((items) => {
    if (!items || !user) {
      // --- LOG DE DEPURACIÓN ---
      console.log('[DEBUG] renderMenuItems: No se renderiza nada (falta `items` o `user`).');
      return null;
    }

    const createListItem = (item) => {
      // --- LOG DE DEPURACIÓN ---
      console.log(`[DEBUG] Verificando permiso para: "${item.text}". Se requiere:`, item.permission);
      
      const isVisible = !item.permission || hasPermission(user.role, item.permission);
      
      // --- LOG DE DEPURACIÓN ---
      console.log(`[DEBUG] -> Resultado: ${isVisible ? 'VISIBLE' : 'OCULTO'}`);

      if (!isVisible) return null;

      // ... (El resto de la lógica de renderizado no cambia)
      if (item.subItems) {
        // ...
      }
      return (
        <ListItemButton key={item.text} component={Link} to={item.path} selected={location.pathname.startsWith(item.path)}>
            {/* ... */}
        </ListItemButton>
      );
    };

    // Esto es solo un fragmento para ilustrar los logs, el código completo está abajo
    // La lógica de renderizado original va aquí.
    return items.map(item => {
        // --- LOG DE DEPURACIÓN ---
        console.log(`[DEBUG] Verificando permiso para: "${item.text}". Se requiere:`, item.permission);
        const isVisible = !item.permission || hasPermission(user.role, item.permission);
        console.log(`[DEBUG] -> Resultado: ${isVisible ? 'VISIBLE' : 'OCULTO'}`);
        if (!isVisible) return null;

        if (item.subItems) {
            const accessibleSubItems = item.subItems.filter(sub => !sub.permission || hasPermission(user.role, sub.permission));
            if (accessibleSubItems.length === 0) return null;

            return (
              <React.Fragment key={item.text}>
                <ListItemButton onClick={() => handleMenuClick(item.text)} sx={{ minHeight: 48, justifyContent: open ? 'initial' : 'center', px: 2.5 }}>
                  <ListItemIcon sx={{ minWidth: 0, mr: open ? 3 : 'auto', justifyContent: 'center' }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} sx={{ opacity: open ? 1 : 0 }} />
                  {open && (openMenus[item.text] ? <ExpandLessIcon /> : <ExpandMoreIcon />)}
                </ListItemButton>
                <Collapse in={openMenus[item.text] && open} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {accessibleSubItems.map(subItem => (
                       <ListItemButton key={subItem.text} component={Link} to={subItem.path} selected={location.pathname.startsWith(subItem.path)} sx={{ pl: 4, minHeight: 48, justifyContent: open ? 'initial' : 'center' }}>
                         <ListItemIcon sx={{ minWidth: 0, mr: open ? 3 : 'auto', justifyContent: 'center' }}>{subItem.icon}</ListItemIcon>
                         <ListItemText primary={subItem.text} sx={{ opacity: open ? 1 : 0 }} />
                       </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              </React.Fragment>
            );
        }
        return (
           <ListItemButton key={item.text} component={Link} to={item.path} selected={location.pathname.startsWith(item.path)} sx={{ minHeight: 48, justifyContent: open ? 'initial' : 'center', px: 2.5 }}>
             <ListItemIcon sx={{ minWidth: 0, mr: open ? 3 : 'auto', justifyContent: 'center' }}>{item.icon}</ListItemIcon>
             <ListItemText primary={item.text} sx={{ opacity: open ? 1 : 0 }} />
           </ListItemButton>
        );
    }).filter(Boolean);

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