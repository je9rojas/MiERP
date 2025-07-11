// /frontend/src/components/layout/DashboardSidebar.js
// CÓDIGO FINAL Y COMPLETO - LISTO PARA COPIAR Y PEGAR

import React from 'react';
import { styled, useTheme } from '@mui/material/styles';
import MuiDrawer from '@mui/material/Drawer';
import { Link, useLocation } from 'react-router-dom';
import {
  Box, Typography, List, ListItemButton, ListItemIcon, ListItemText,
  Divider, IconButton, Collapse,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { useAuth } from '../../app/contexts/AuthContext';

// --- Iconos ---
import DashboardIcon from '@mui/icons-material/Dashboard';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import PeopleIcon from '@mui/icons-material/People';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import StoreIcon from '@mui/icons-material/Store';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import InventoryIcon from '@mui/icons-material/Inventory';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import TuneIcon from '@mui/icons-material/Tune';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import TableViewIcon from '@mui/icons-material/TableView';
import StackedLineChartIcon from '@mui/icons-material/StackedLineChart';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PriceCheckIcon from '@mui/icons-material/PriceCheck';
import PaymentIcon from '@mui/icons-material/Payment';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SavingsIcon from '@mui/icons-material/Savings';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import BadgeIcon from '@mui/icons-material/Badge';
import CoPresentIcon from '@mui/icons-material/CoPresent';
import ArticleIcon from '@mui/icons-material/Article';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import BusinessIcon from '@mui/icons-material/Business';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import StraightenIcon from '@mui/icons-material/Straighten';
import FilePresentIcon from '@mui/icons-material/FilePresent';
import BuildCircleIcon from '@mui/icons-material/BuildCircle';
import HistoryToggleOffIcon from '@mui/icons-material/HistoryToggleOff';
import DnsIcon from '@mui/icons-material/Dns';
import ScheduleIcon from '@mui/icons-material/Schedule';
import BackupIcon from '@mui/icons-material/Backup';
import SettingsIcon from '@mui/icons-material/Settings';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

import { ADMIN_ACCESS, SALES_ACCESS, WAREHOUSE_ACCESS, ACCOUNTANT_ACCESS, ALL_ROLES, MANAGER_ACCESS } from '../../constants/rolesAndPermissions';

// --- ESTILOS OPTIMIZADOS: Leen el ancho del menú directamente del tema ---
const openedMixin = (theme) => ({
  width: theme.mixins.drawerWidth,
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
    width: theme.mixins.drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    ...(open && {
      ...openedMixin(theme),
      '& .MuiDrawer-paper': openedMixin(theme),
    }),
    ...(!open && {
      ...closedMixin(theme),
      '& .MuiDrawer-paper': closedMixin(theme),
    }),
  }),
);

// --- Estructura de Datos para los Menús y Roles ---

const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', roles: ALL_ROLES },
    {
      text: 'Ventas y CRM', icon: <PointOfSaleIcon />, roles: SELLER_ROLES,
      subItems: [
        { text: 'Dashboard de Ventas', icon: <LeaderboardIcon />, path: '/ventas/dashboard', roles: MANAGER_ROLES },
        { text: 'Clientes', icon: <PeopleIcon />, path: '/ventas/clientes', roles: SELLER_ROLES },
        { text: 'Cotizaciones', icon: <RequestQuoteIcon />, path: '/ventas/cotizaciones', roles: SELLER_ROLES },
        { text: 'Pedidos de Venta', icon: <ShoppingCartIcon />, path: '/ventas/pedidos', roles: SELLER_ROLES },
        { text: 'Punto de Venta (POS)', icon: <PointOfSaleIcon />, path: '/ventas/pos', roles: SELLER_ROLES },
        { text: 'Facturación', icon: <ReceiptLongIcon />, path: '/ventas/facturacion', roles: ACCOUNTANT_ROLES.concat('vendedor') },
        { text: 'Devoluciones (RMA)', icon: <AssignmentReturnIcon />, path: '/ventas/devoluciones', roles: SELLER_ROLES },
      ],
    },
    {
      text: 'Compras', icon: <ShoppingCartIcon />, roles: WAREHOUSE_ROLES.concat(ACCOUNTANT_ROLES),
      subItems: [
        { text: 'Proveedores', icon: <LocalShippingIcon />, path: '/compras/proveedores', roles: WAREHOUSE_ROLES },
        { text: 'Órdenes de Compra', icon: <ReceiptLongIcon />, path: '/compras/ordenes', roles: WAREHOUSE_ROLES },
        { text: 'Recepción de Mercancía', icon: <WarehouseIcon />, path: '/compras/recepciones', roles: WAREHOUSE_ROLES },
        { text: 'Cuentas por Pagar', icon: <PaymentIcon />, path: '/compras/cuentas-pagar', roles: ACCOUNTANT_ROLES },
      ],
    },
    {
      text: 'Inventario', icon: <InventoryIcon />, roles: WAREHOUSE_ROLES.concat(SELLER_ROLES),
      subItems: [
        { text: 'Productos y Servicios', icon: <InventoryIcon />, path: '/inventario/productos', roles: WAREHOUSE_ROLES.concat(ADMIN_ROLES) },
        { text: 'Almacenes', icon: <WarehouseIcon />, path: '/inventario/almacenes', roles: WAREHOUSE_ROLES.concat(ADMIN_ROLES) },
        { text: 'Control de Stock', icon: <TableViewIcon />, path: '/inventario/stock', roles: WAREHOUSE_ROLES },
        { text: 'Transferencias Internas', icon: <SyncAltIcon />, path: '/inventario/transferencias', roles: WAREHOUSE_ROLES },
        { text: 'Ajustes de Inventario', icon: <TuneIcon />, path: '/inventario/ajustes', roles: WAREHOUSE_ROLES.concat(MANAGER_ROLES) },
        { text: 'Lotes y Vencimientos', icon: <EventRepeatIcon />, path: '/inventario/lotes', roles: WAREHOUSE_ROLES },
        { text: 'Valorización de Inventario', icon: <StackedLineChartIcon />, path: '/inventario/valorizacion', roles: ACCOUNTANT_ROLES.concat(MANAGER_ROLES) },
      ],
    },
    {
      text: 'Finanzas', icon: <AccountBalanceIcon />, roles: ACCOUNTANT_ROLES,
      subItems: [
        { text: 'Dashboard Financiero', icon: <LeaderboardIcon />, path: '/finanzas/dashboard', roles: MANAGER_ROLES },
        { text: 'Cuentas por Cobrar', icon: <PriceCheckIcon />, path: '/finanzas/cuentas-cobrar', roles: ACCOUNTANT_ROLES },
        { text: 'Gestión de Cobranzas', icon: <AccountBalanceWalletIcon />, path: '/finanzas/cobranzas', roles: ACCOUNTANT_ROLES },
        { text: 'Gestión de Pagos', icon: <PaymentIcon />, path: '/finanzas/pagos', roles: ACCOUNTANT_ROLES },
        { text: 'Conciliación Bancaria', icon: <AccountBalanceIcon />, path: '/finanzas/conciliacion', roles: ACCOUNTANT_ROLES },
        { text: 'Caja Chica', icon: <SavingsIcon />, path: '/finanzas/caja-chica', roles: ACCOUNTANT_ROLES },
        { text: 'Exportación Contable', icon: <FileUploadIcon />, path: '/finanzas/exportacion', roles: ACCOUNTANT_ROLES },
      ],
    },
    {
      text: 'Recursos Humanos', icon: <BadgeIcon />, roles: HR_ROLES,
      subItems: [
        { text: 'Gestión de Empleados', icon: <PeopleIcon />, path: '/rrhh/empleados', roles: HR_ROLES.concat(ADMIN_ROLES) },
        { text: 'Nómina / Planillas', icon: <PaymentIcon />, path: '/rrhh/nomina', roles: HR_ROLES },
        { text: 'Control de Asistencia', icon: <CoPresentIcon />, path: '/rrhh/asistencia', roles: HR_ROLES },
        { text: 'Gestión de Contratos', icon: <ArticleIcon />, path: '/rrhh/contratos', roles: HR_ROLES },
        { text: 'Reclutamiento y Selección', icon: <PersonSearchIcon />, path: '/rrhh/reclutamiento', roles: HR_ROLES },
      ],
    },
];

const reportsMenuItems = [
    {
        text: 'Reportes', icon: <AssessmentIcon />, roles: [...new Set([...MANAGER_ROLES, ...SELLER_ROLES])],
        subItems: [
            { text: 'Generar Catálogo', icon: <PictureAsPdfIcon />, path: '/reportes/catalogo', roles: SELLER_ROLES },
            { text: 'Reporte de Ventas', icon: <LeaderboardIcon />, path: '/reportes/ventas', roles: MANAGER_ROLES },
            { text: 'Análisis IA (Próximamente)', icon: <AutoAwesomeIcon />, path: '/reportes/ia', roles: MANAGER_ROLES },
        ]
    }
];
  
const adminMenuItems = [
    {
      text: 'Administración', icon: <BusinessIcon />, roles: ADMIN_ROLES,
      subItems: [
          { text: 'Configuración General', icon: <SettingsIcon />, path: '/admin/configuracion' },
          { text: 'Usuarios y Roles', icon: <AdminPanelSettingsIcon />, path: '/admin/usuarios' },
          { text: 'Sucursales', icon: <StoreIcon />, path: '/admin/sucursales' },
          { text: 'Impuestos y Monedas', icon: <MonetizationOnIcon />, path: '/admin/impuestos' },
          { text: 'Unidades de Medida', icon: <StraightenIcon />, path: '/admin/unidades' },
          { text: 'Tipos de Documentos', icon: <FilePresentIcon />, path: '/admin/documentos' },
      ]
    },
    {
      text: 'Sistema', icon: <BuildCircleIcon />, roles: ['superadmin'],
      subItems: [
          { text: 'Auditoría de Usuarios', icon: <AdminPanelSettingsIcon />, path: '/sistema/auditoria' },
          { text: 'Bitácora de Cambios', icon: <HistoryToggleOffIcon />, path: '/sistema/changelog' },
          { text: 'Logs del Sistema', icon: <DnsIcon />, path: '/sistema/logs' },
          { text: 'Tareas Programadas', icon: <ScheduleIcon />, path: '/sistema/cron' },
          { text: 'Copias de Seguridad', icon: <BackupIcon />, path: '/sistema/backups' },
      ]
    }
];

// --- Componente Principal (Ya no recibe 'drawerWidth') ---
const DashboardSidebar = ({ open, handleDrawerClose }) => {
  const location = useLocation();
  const theme = useTheme();
  const { user } = useAuth();
  // AÑADE ESTA LÍNEA PARA DEPURAR
  console.log('USER OBJECT IN SIDEBAR:', user); 

  const [openCollapse, setOpenCollapse] = React.useState({});

  const handleCollapseClick = (name) => {
    setOpenCollapse(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const renderMenuItems = (items, primaryColor = true) => {
    const iconColor = primaryColor ? theme.palette.primary.main : theme.palette.text.secondary;
    const accessibleItems = items.filter(item => !item.roles || (user && user.role && item.roles.includes(user.role)));

    return accessibleItems.map((item) => {
      const accessibleSubItems = item.subItems?.filter(subItem => !subItem.roles || (user && user.role && subItem.roles.includes(user.role))) || [];
      const isActive = item.path === location.pathname;
      const isParentActive = item.subItems?.some(sub => location.pathname.startsWith(sub.path));

      if (item.subItems && accessibleSubItems.length === 0) {
        return null;
      }
      
      return (
        <React.Fragment key={item.text}>
          {item.subItems ? (
            <>
              <ListItemButton
                onClick={() => handleCollapseClick(item.text)}
                sx={{ 
                  minHeight: 48, justifyContent: open ? 'initial' : 'center', px: 2.5,
                  bgcolor: isParentActive ? 'action.hover' : 'transparent',
                }}
              >
                <ListItemIcon sx={{ minWidth: 0, mr: open ? 3 : 'auto', justifyContent: 'center', color: iconColor }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} sx={{ opacity: open ? 1 : 0 }} />
                {open && (openCollapse[item.text] ? <ExpandLessIcon /> : <ExpandMoreIcon />)}
              </ListItemButton>
              <Collapse in={openCollapse[item.text] && open} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {accessibleSubItems.map((subItem) => (
                    <ListItemButton
                      key={subItem.text}
                      component={Link}
                      to={subItem.path}
                      selected={location.pathname === subItem.path}
                      sx={{ pl: 4 }}
                    >
                      <ListItemIcon sx={{ minWidth: 0, mr: 3, justifyContent: 'center', color: iconColor, opacity: 0.8 }}>
                        {subItem.icon}
                      </ListItemIcon>
                      <ListItemText primary={subItem.text} sx={{ opacity: open ? 1 : 0 }} />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            </>
          ) : (
            <ListItemButton
              component={Link}
              to={item.path}
              selected={isActive}
              sx={{ minHeight: 48, justifyContent: open ? 'initial' : 'center', px: 2.5 }}
            >
              <ListItemIcon sx={{ minWidth: 0, mr: open ? 3 : 'auto', justifyContent: 'center', color: iconColor }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} sx={{ opacity: open ? 1 : 0 }} />
            </ListItemButton>
          )}
        </React.Fragment>
      );
    });
  };

  return (
    <Drawer variant="permanent" open={open}>
      <DrawerHeader>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, pl: 2, opacity: open ? 1 : 0, transition: 'opacity 0.3s' }}>
           <Box sx={{ width: 40, height: 40, backgroundColor: 'primary.light', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 1.5 }}>
            <Typography variant="h6" fontWeight="bold" color="primary.contrastText">M</Typography>
           </Box>
          <Typography variant="h6" fontWeight="bold">MiERP PRO</Typography>
        </Box>
        <IconButton onClick={handleDrawerClose}>
          <ChevronLeftIcon sx={{ color: 'white' }} />
        </IconButton>
      </DrawerHeader>
      
      <Divider />

      <List component="nav" sx={{ p: 1 }}>
        {renderMenuItems(menuItems, true)}
      </List>
      
      <Divider sx={{ mx: 2, my: 1 }} />

      <List component="nav" sx={{ p: 1 }}>
        {renderMenuItems(reportsMenuItems, true)}
      </List>
      
      <Divider sx={{ mx: 2, my: 1 }} />
      
      <List component="nav" sx={{ p: 1 }}>
        {renderMenuItems(adminMenuItems, false)}
      </List>
    </Drawer>
  );
};

export default DashboardSidebar;