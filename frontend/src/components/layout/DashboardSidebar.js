// /frontend/src/components/layout/DashboardSidebar.js
// VERSIÓN FINAL, COMPLETA Y PROFESIONAL

import React from 'react';
import { styled, useTheme } from '@mui/material/styles';
import MuiDrawer from '@mui/material/Drawer';
import { Link, useLocation } from 'react-router-dom';
import {
  Box, Typography, List, ListItemButton, ListItemIcon, ListItemText,
  Divider, IconButton, Collapse,
} from '@mui/material';
import { useAuth } from '../../app/contexts/AuthContext';

// --- SECCIÓN 1: IMPORTACIÓN COMPLETA DE ICONOS ---
import {
    Dashboard as DashboardIcon, PointOfSale as PointOfSaleIcon, People as PeopleIcon,
    RequestQuote as RequestQuoteIcon, ShoppingCart as ShoppingCartIcon, ReceiptLong as ReceiptLongIcon,
    AssignmentReturn as AssignmentReturnIcon, Leaderboard as LeaderboardIcon, Store as StoreIcon,
    LocalShipping as LocalShippingIcon, Warehouse as WarehouseIcon, Inventory as InventoryIcon,
    SyncAlt as SyncAltIcon, Tune as TuneIcon, EventRepeat as EventRepeatIcon,
    TableView as TableViewIcon, StackedLineChart as StackedLineChartIcon, AccountBalance as AccountBalanceIcon,
    PriceCheck as PriceCheckIcon, Payment as PaymentIcon, AccountBalanceWallet as AccountBalanceWalletIcon,
    Savings as SavingsIcon, FileUpload as FileUploadIcon, Badge as BadgeIcon, CoPresent as CoPresentIcon,
    Article as ArticleIcon, PersonSearch as PersonSearchIcon, Business as BusinessIcon,
    AdminPanelSettings as AdminPanelSettingsIcon, MonetizationOn as MonetizationOnIcon,
    Straighten as StraightenIcon, FilePresent as FilePresentIcon, BuildCircle as BuildCircleIcon,
    HistoryToggleOff as HistoryToggleOffIcon, Dns as DnsIcon, Schedule as ScheduleIcon,
    Backup as BackupIcon, Settings as SettingsIcon, ExpandLess as ExpandLessIcon,
    ExpandMore as ExpandMoreIcon, PictureAsPdf as PictureAsPdfIcon, Assessment as AssessmentIcon,
    AutoAwesome as AutoAwesomeIcon, ChevronLeft as ChevronLeftIcon,
} from '@mui/icons-material';

// --- SECCIÓN 2: IMPORTACIÓN DE ROLES DESDE LA FUENTE ÚNICA DE VERDAD ---
import {
  ADMIN_ACCESS,
  SALES_ACCESS,
  WAREHOUSE_ACCESS,
  ACCOUNTANT_ACCESS,
  HR_ACCESS,
  MANAGER_ACCESS,
  ALL_ROLES,
  ROLES,
} from '../../constants/rolesAndPermissions';


// --- SECCIÓN 3: COMPONENTES DE ESTILO (Styled Components) ---
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
    ...(open && { ...openedMixin(theme), '& .MuiDrawer-paper': openedMixin(theme) }),
    ...(!open && { ...closedMixin(theme), '& .MuiDrawer-paper': closedMixin(theme) }),
  }),
);

// --- SECCIÓN 4: DEFINICIÓN DE LA ESTRUCTURA DEL MENÚ ---
const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', roles: ALL_ROLES },
    { text: 'Ventas y CRM', icon: <PointOfSaleIcon />, roles: SALES_ACCESS,
      subItems: [
        { text: 'Dashboard de Ventas', icon: <LeaderboardIcon />, path: '/ventas/dashboard', roles: MANAGER_ACCESS },
        { text: 'Clientes', icon: <PeopleIcon />, path: '/ventas/clientes', roles: SALES_ACCESS },
        { text: 'Cotizaciones', icon: <RequestQuoteIcon />, path: '/ventas/cotizaciones', roles: SALES_ACCESS },
        { text: 'Pedidos de Venta', icon: <ShoppingCartIcon />, path: '/ventas/pedidos', roles: SALES_ACCESS },
        { text: 'Punto de Venta (POS)', icon: <PointOfSaleIcon />, path: '/ventas/pos', roles: SALES_ACCESS },
        { text: 'Facturación', icon: <ReceiptLongIcon />, path: '/ventas/facturacion', roles: [...new Set([...ACCOUNTANT_ACCESS, ROLES.SALES])] },
        { text: 'Devoluciones (RMA)', icon: <AssignmentReturnIcon />, path: '/ventas/devoluciones', roles: SALES_ACCESS },
      ],
    },
    { text: 'Compras', icon: <ShoppingCartIcon />, roles: [...new Set([...WAREHOUSE_ACCESS, ...ACCOUNTANT_ACCESS])],
      subItems: [
        { text: 'Proveedores', icon: <LocalShippingIcon />, path: '/compras/proveedores', roles: WAREHOUSE_ACCESS },
        { text: 'Órdenes de Compra', icon: <ReceiptLongIcon />, path: '/compras/ordenes', roles: WAREHOUSE_ACCESS },
        { text: 'Recepción de Mercancía', icon: <WarehouseIcon />, path: '/compras/recepciones', roles: WAREHOUSE_ACCESS },
        { text: 'Cuentas por Pagar', icon: <PaymentIcon />, path: '/compras/cuentas-pagar', roles: ACCOUNTANT_ACCESS },
      ],
    },
    { text: 'Inventario', icon: <InventoryIcon />, roles: [...new Set([...WAREHOUSE_ACCESS, ...SALES_ACCESS])],
      subItems: [
        { text: 'Productos y Servicios', icon: <InventoryIcon />, path: '/inventario/productos', roles: WAREHOUSE_ACCESS },
        { text: 'Almacenes', icon: <WarehouseIcon />, path: '/inventario/almacenes', roles: WAREHOUSE_ACCESS },
        { text: 'Control de Stock', icon: <TableViewIcon />, path: '/inventario/stock', roles: WAREHOUSE_ACCESS },
        { text: 'Transferencias Internas', icon: <SyncAltIcon />, path: '/inventario/transferencias', roles: WAREHOUSE_ACCESS },
        { text: 'Ajustes de Inventario', icon: <TuneIcon />, path: '/inventario/ajustes', roles: WAREHOUSE_ACCESS },
        { text: 'Lotes y Vencimientos', icon: <EventRepeatIcon />, path: '/inventario/lotes', roles: WAREHOUSE_ACCESS },
        { text: 'Valorización de Inventario', icon: <StackedLineChartIcon />, path: '/inventario/valorizacion', roles: ACCOUNTANT_ACCESS },
      ],
    },
    { text: 'Finanzas', icon: <AccountBalanceIcon />, roles: ACCOUNTANT_ACCESS,
      subItems: [
        { text: 'Dashboard Financiero', icon: <LeaderboardIcon />, path: '/finanzas/dashboard', roles: MANAGER_ACCESS },
        { text: 'Cuentas por Cobrar', icon: <PriceCheckIcon />, path: '/finanzas/cuentas-cobrar', roles: ACCOUNTANT_ACCESS },
        { text: 'Gestión de Cobranzas', icon: <AccountBalanceWalletIcon />, path: '/finanzas/cobranzas', roles: ACCOUNTANT_ACCESS },
        { text: 'Gestión de Pagos', icon: <PaymentIcon />, path: '/finanzas/pagos', roles: ACCOUNTANT_ACCESS },
        { text: 'Conciliación Bancaria', icon: <AccountBalanceIcon />, path: '/finanzas/conciliacion', roles: ACCOUNTANT_ACCESS },
        { text: 'Caja Chica', icon: <SavingsIcon />, path: '/finanzas/caja-chica', roles: ACCOUNTANT_ACCESS },
        { text: 'Exportación Contable', icon: <FileUploadIcon />, path: '/finanzas/exportacion', roles: ACCOUNTANT_ACCESS },
      ],
    },
    { text: 'Recursos Humanos', icon: <BadgeIcon />, roles: HR_ACCESS,
      subItems: [
        { text: 'Gestión de Empleados', icon: <PeopleIcon />, path: '/rrhh/empleados', roles: HR_ACCESS },
        { text: 'Nómina / Planillas', icon: <PaymentIcon />, path: '/rrhh/nomina', roles: HR_ACCESS },
        { text: 'Control de Asistencia', icon: <CoPresentIcon />, path: '/rrhh/asistencia', roles: HR_ACCESS },
        { text: 'Gestión de Contratos', icon: <ArticleIcon />, path: '/rrhh/contratos', roles: HR_ACCESS },
        { text: 'Reclutamiento y Selección', icon: <PersonSearchIcon />, path: '/rrhh/reclutamiento', roles: HR_ACCESS },
      ],
    },
];

const reportsMenuItems = [
    { text: 'Reportes', icon: <AssessmentIcon />, roles: MANAGER_ACCESS,
      subItems: [
        { text: 'Generar Catálogo', icon: <PictureAsPdfIcon />, path: '/reportes/catalogo', roles: SALES_ACCESS },
        { text: 'Reporte de Ventas', icon: <LeaderboardIcon />, path: '/reportes/ventas', roles: MANAGER_ACCESS },
        { text: 'Análisis IA (Próximamente)', icon: <AutoAwesomeIcon />, path: '/reportes/ia', roles: MANAGER_ACCESS },
      ]
    }
];
  
const adminMenuItems = [
    { text: 'Administración', icon: <BusinessIcon />, roles: ADMIN_ACCESS,
      subItems: [
          { text: 'Configuración General', icon: <SettingsIcon />, path: '/admin/configuracion' },
          { text: 'Usuarios y Roles', icon: <AdminPanelSettingsIcon />, path: '/admin/usuarios' },
          { text: 'Sucursales', icon: <StoreIcon />, path: '/admin/sucursales' },
          { text: 'Impuestos y Monedas', icon: <MonetizationOnIcon />, path: '/admin/impuestos' },
          { text: 'Unidades de Medida', icon: <StraightenIcon />, path: '/admin/unidades' },
          { text: 'Tipos de Documentos', icon: <FilePresentIcon />, path: '/admin/documentos' },
      ]
    },
    { text: 'Sistema', icon: <BuildCircleIcon />, roles: [ROLES.SUPERADMIN],
      subItems: [
          { text: 'Auditoría de Usuarios', icon: <AdminPanelSettingsIcon />, path: '/sistema/auditoria' },
          { text: 'Bitácora de Cambios', icon: <HistoryToggleOffIcon />, path: '/sistema/changelog' },
          { text: 'Logs del Sistema', icon: <DnsIcon />, path: '/sistema/logs' },
          { text: 'Tareas Programadas', icon: <ScheduleIcon />, path: '/sistema/cron' },
          { text: 'Copias de Seguridad', icon: <BackupIcon />, path: '/sistema/backups' },
      ]
    }
];

// --- SECCIÓN 5: Componente Principal del Sidebar ---
const DashboardSidebar = ({ open, handleDrawerClose }) => {
  const location = useLocation();
  const theme = useTheme();
  const { user } = useAuth();
  
  const [openCollapse, setOpenCollapse] = React.useState({});

  const handleCollapseClick = (name) => {
    setOpenCollapse(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const renderMenuItems = (items) => {
    const accessibleItems = items.filter(item => !item.roles || (user && user.role && item.roles.includes(user.role)));

    return accessibleItems.map((item) => {
      const accessibleSubItems = item.subItems?.filter(subItem => !subItem.roles || (user && user.role && subItem.roles.includes(user.role))) || [];
      const isParentActive = item.subItems?.some(sub => location.pathname.startsWith(sub.path));

      if (item.subItems && accessibleSubItems.length === 0) return null;
      
      return (
        <React.Fragment key={item.text}>
          {item.subItems ? (
            <>
              <ListItemButton onClick={() => handleCollapseClick(item.text)} sx={{ minHeight: 48, justifyContent: open ? 'initial' : 'center', px: 2.5, bgcolor: isParentActive ? 'action.hover' : 'transparent' }}>
                <ListItemIcon sx={{ minWidth: 0, mr: open ? 3 : 'auto', justifyContent: 'center' }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} sx={{ opacity: open ? 1 : 0 }} />
                {open && (openCollapse[item.text] ? <ExpandLessIcon /> : <ExpandMoreIcon />)}
              </ListItemButton>
              <Collapse in={openCollapse[item.text] && open} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {accessibleSubItems.map((subItem) => (
                    <ListItemButton key={subItem.text} component={Link} to={subItem.path} selected={location.pathname === subItem.path} sx={{ pl: 4 }}>
                      <ListItemIcon sx={{ minWidth: 0, mr: 3, justifyContent: 'center', opacity: 0.8 }}>{subItem.icon}</ListItemIcon>
                      <ListItemText primary={subItem.text} sx={{ opacity: open ? 1 : 0 }} />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            </>
          ) : (
            <ListItemButton component={Link} to={item.path} selected={location.pathname === item.path} sx={{ minHeight: 48, justifyContent: open ? 'initial' : 'center', px: 2.5 }}>
              <ListItemIcon sx={{ minWidth: 0, mr: open ? 3 : 'auto', justifyContent: 'center' }}>{item.icon}</ListItemIcon>
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
           <Box sx={{ width: 40, height: 40, backgroundColor: 'primary.main', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 1.5 }}>
            <Typography variant="h6" fontWeight="bold" color="primary.contrastText">M</Typography>
           </Box>
          <Typography variant="h6" fontWeight="bold">MiERP PRO</Typography>
        </Box>
        <IconButton onClick={handleDrawerClose}><ChevronLeftIcon /></IconButton>
      </DrawerHeader>
      <Divider />
      <List component="nav" sx={{ p: 1 }}>{renderMenuItems(menuItems)}</List>
      <Divider sx={{ mx: 2, my: 1 }} />
      <List component="nav" sx={{ p: 1 }}>{renderMenuItems(reportsMenuItems)}</List>
      <Divider sx={{ mx: 2, my: 1 }} />
      <List component="nav" sx={{ p: 1 }}>{renderMenuItems(adminMenuItems)}</List>
    </Drawer>
  );
};

export default DashboardSidebar;