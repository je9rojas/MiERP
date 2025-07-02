// /frontend/src/components/layout/DashboardSidebar.js
import React from 'react';
import { styled, useTheme } from '@mui/material/styles';
import MuiDrawer from '@mui/material/Drawer';
// --- ¡IMPORTANTE! Se añade el componente Link para la navegación ---
import { Link } from 'react-router-dom';
import {
  Box, Typography, List, ListItemButton, ListItemIcon, ListItemText,
  Divider, IconButton, Collapse,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

// --- Tus imports de iconos se mantienen intactos ---
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


// --- LÓGICA DE ESTILOS PARA LA TRANSICIÓN (sin cambios) ---
const openedMixin = (theme) => ({
  width: theme.mixins.drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
  boxShadow: theme.shadows[2],
  borderRight: 'none',
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
  borderRight: 'none',
});

// --- COMPONENTES STYLED (sin cambios) ---
const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  backgroundColor: theme.palette.primary.dark,
  color: theme.palette.primary.contrastText,
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

// --- ESTRUCTURA DE DATOS PARA LOS MENÚS (sin cambios) ---
const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    {
      text: 'Ventas y CRM',
      icon: <PointOfSaleIcon />,
      subItems: [
        { text: 'Dashboard de Ventas', icon: <LeaderboardIcon />, path: '/ventas/dashboard' },
        { text: 'Clientes', icon: <PeopleIcon />, path: '/ventas/clientes' },
        { text: 'Cotizaciones', icon: <RequestQuoteIcon />, path: '/ventas/cotizaciones' },
        { text: 'Pedidos de Venta', icon: <ShoppingCartIcon />, path: '/ventas/pedidos' },
        { text: 'Punto de Venta (POS)', icon: <PointOfSaleIcon />, path: '/ventas/pos' },
        { text: 'Facturación', icon: <ReceiptLongIcon />, path: '/ventas/facturacion' },
        { text: 'Devoluciones (RMA)', icon: <AssignmentReturnIcon />, path: '/ventas/devoluciones' },
      ],
    },
    {
      text: 'Compras',
      icon: <ShoppingCartIcon />,
      subItems: [
        { text: 'Proveedores', icon: <LocalShippingIcon />, path: '/compras/proveedores' },
        { text: 'Órdenes de Compra', icon: <ReceiptLongIcon />, path: '/compras/ordenes' },
        { text: 'Recepción de Mercancía', icon: <WarehouseIcon />, path: '/compras/recepciones' },
        { text: 'Cuentas por Pagar', icon: <PaymentIcon />, path: '/compras/cuentas-pagar' },
      ],
    },
    {
      text: 'Inventario',
      icon: <InventoryIcon />,
      subItems: [
        { text: 'Productos y Servicios', icon: <InventoryIcon />, path: '/inventario/productos' },
        { text: 'Almacenes', icon: <WarehouseIcon />, path: '/inventario/almacenes' },
        { text: 'Control de Stock', icon: <TableViewIcon />, path: '/inventario/stock' },
        { text: 'Transferencias Internas', icon: <SyncAltIcon />, path: '/inventario/transferencias' },
        { text: 'Ajustes de Inventario', icon: <TuneIcon />, path: '/inventario/ajustes' },
        { text: 'Lotes y Vencimientos', icon: <EventRepeatIcon />, path: '/inventario/lotes' },
        { text: 'Valorización de Inventario', icon: <StackedLineChartIcon />, path: '/inventario/valorizacion' },
      ],
    },
    {
      text: 'Finanzas',
      icon: <AccountBalanceIcon />,
      subItems: [
        { text: 'Dashboard Financiero', icon: <LeaderboardIcon />, path: '/finanzas/dashboard' },
        { text: 'Cuentas por Cobrar', icon: <PriceCheckIcon />, path: '/finanzas/cuentas-cobrar' },
        { text: 'Gestión de Cobranzas', icon: <AccountBalanceWalletIcon />, path: '/finanzas/cobranzas' },
        { text: 'Gestión de Pagos', icon: <PaymentIcon />, path: '/finanzas/pagos' },
        { text: 'Conciliación Bancaria', icon: <AccountBalanceIcon />, path: '/finanzas/conciliacion' },
        { text: 'Caja Chica', icon: <SavingsIcon />, path: '/finanzas/caja-chica' },
        { text: 'Exportación Contable', icon: <FileUploadIcon />, path: '/finanzas/exportacion' },
      ],
    },
    {
      text: 'Recursos Humanos',
      icon: <BadgeIcon />,
      subItems: [
        { text: 'Gestión de Empleados', icon: <PeopleIcon />, path: '/rrhh/empleados' },
        { text: 'Nómina / Planillas', icon: <PaymentIcon />, path: '/rrhh/nomina' },
        { text: 'Control de Asistencia', icon: <CoPresentIcon />, path: '/rrhh/asistencia' },
        { text: 'Gestión de Contratos', icon: <ArticleIcon />, path: '/rrhh/contratos' },
        { text: 'Reclutamiento y Selección', icon: <PersonSearchIcon />, path: '/rrhh/reclutamiento' },
      ],
    },
  ];
  
  const adminMenuItems = [
      {
      text: 'Administración',
      icon: <BusinessIcon />,
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
      text: 'Sistema',
      icon: <BuildCircleIcon />,
      subItems: [
          { text: 'Auditoría de Usuarios', icon: <AdminPanelSettingsIcon />, path: '/sistema/auditoria' },
          { text: 'Bitácora de Cambios', icon: <HistoryToggleOffIcon />, path: '/sistema/changelog' },
          { text: 'Logs del Sistema', icon: <DnsIcon />, path: '/sistema/logs' },
          { text: 'Tareas Programadas', icon: <ScheduleIcon />, path: '/sistema/cron' },
          { text: 'Copias de Seguridad', icon: <BackupIcon />, path: '/sistema/backups' },
      ]
    }
  ];

const DashboardSidebar = ({ open, handleDrawerClose }) => {
  const theme = useTheme();
  const [openCollapse, setOpenCollapse] = React.useState({});

  const handleCollapseClick = (name) => {
    setOpenCollapse(prev => ({ ...prev, [name]: !prev[name] }));
  };

  // --- FUNCIÓN DE RENDERIZADO OPTIMIZADA ---
  const renderMenuItems = (items, primaryColor = true) => {
    const iconColor = primaryColor ? theme.palette.primary.main : theme.palette.text.secondary;
    return items.map((item) => (
      <React.Fragment key={item.text}>
        {item.subItems ? (
          <>
            <ListItemButton
              onClick={() => handleCollapseClick(item.text)}
              sx={{ minHeight: 48, justifyContent: open ? 'initial' : 'center', px: 2.5 }}
            >
              <ListItemIcon sx={{ minWidth: 0, mr: open ? 3 : 'auto', justifyContent: 'center', color: iconColor }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} sx={{ opacity: open ? 1 : 0 }} />
              {open && (openCollapse[item.text] ? <ExpandLessIcon /> : <ExpandMoreIcon />)}
            </ListItemButton>
            <Collapse in={openCollapse[item.text] && open} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {item.subItems.map((subItem) => (
                  // --- CAMBIO CLAVE: Usamos Link en lugar de <a> ---
                  <ListItemButton
                    key={subItem.text}
                    component={Link}
                    to={subItem.path}
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
          // --- CAMBIO CLAVE: Usamos Link en lugar de <a> ---
          <ListItemButton
            component={Link}
            to={item.path}
            sx={{ minHeight: 48, justifyContent: open ? 'initial' : 'center', px: 2.5 }}
          >
            <ListItemIcon sx={{ minWidth: 0, mr: open ? 3 : 'auto', justifyContent: 'center', color: iconColor }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} sx={{ opacity: open ? 1 : 0 }} />
          </ListItemButton>
        )}
      </React.Fragment>
    ));
  };


  return (
    <Drawer variant="permanent" open={open}>
      <DrawerHeader>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, pl: 2, opacity: open ? 1 : 0, transition: 'opacity 0.3s' }}>
           <Box sx={{ width: 40, height: 40, backgroundColor: theme.palette.primary.light, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 1.5 }}>
            <Typography variant="h6" fontWeight="bold">M</Typography>
          </Box>
          <Typography variant="h6" fontWeight="bold">MiERP PRO</Typography>
        </Box>
        <IconButton onClick={handleDrawerClose} sx={{ color: 'white' }}>
          <ChevronLeftIcon />
        </IconButton>
      </DrawerHeader>
      
      <Divider />

      <List component="nav">
        {renderMenuItems(menuItems, true)}
      </List>
      
      <Divider sx={{ mx: 2 }} />
      
      <List component="nav">
        {renderMenuItems(adminMenuItems, false)}
      </List>
    </Drawer>
  );
};

export default DashboardSidebar;