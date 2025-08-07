// /frontend/src/components/layout/DashboardSidebar.js

import React from 'react';
import { styled } from '@mui/material/styles';
import MuiDrawer from '@mui/material/Drawer';
import { Link, useLocation } from 'react-router-dom';
import {
  Box, Typography, List, ListItemButton, ListItemIcon, ListItemText,
  Divider, IconButton, Collapse,
} from '@mui/material';
import { useAuth } from '../../app/contexts/AuthContext';

// --- SECCIÓN 1: IMPORTACIÓN DE ICONOS ---
// Se mantienen todos los iconos necesarios para la interfaz del menú.
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
    ImportExport as ImportExportIcon,
} from '@mui/icons-material';

// --- SECCIÓN 2: IMPORTACIÓN DE PERMISOS (USANDO EL NUEVO SISTEMA) ---
// Se importan los nuevos grupos de permisos basados en acciones y la función de ayuda.
import {
  ROLES, ALL_ROLES, hasPermission,
  CAN_ACCESS_SALES_MODULE, CAN_VIEW_SALES_DASHBOARD, CAN_MANAGE_CLIENTS, CAN_MANAGE_QUOTES, CAN_MANAGE_SALES_ORDERS, CAN_USE_POS, CAN_MANAGE_SALE_INVOICES, CAN_MANAGE_RETURNS,
  CAN_ACCESS_PURCHASING_MODULE, CAN_MANAGE_SUPPLIERS, CAN_CRUD_PURCHASE_ORDERS, CAN_RECEIVE_GOODS, CAN_MANAGE_PAYABLES,
  CAN_ACCESS_INVENTORY_MODULE, CAN_MANAGE_PRODUCTS, CAN_MANAGE_WAREHOUSES, CAN_CONTROL_STOCK, CAN_MANAGE_TRANSFERS, CAN_ADJUST_INVENTORY, CAN_MANAGE_LOTS, CAN_VIEW_INVENTORY_VALUATION,
  CAN_ACCESS_FINANCE_MODULE, CAN_VIEW_FINANCE_DASHBOARD, CAN_MANAGE_RECEIVABLES,
  CAN_ACCESS_HR_MODULE, CAN_MANAGE_EMPLOYEES,
  CAN_ACCESS_REPORTS_MODULE, CAN_GENERATE_CATALOG,
  CAN_ACCESS_ADMIN_MODULE,
} from '../../constants/rolesAndPermissions';


// --- SECCIÓN 3: COMPONENTES DE ESTILO (Styled Components) ---
// Esta sección no requiere cambios, define la apariencia del Drawer.
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

// --- SECCIÓN 4: DEFINICIÓN DE LA ESTRUCTURA DEL MENÚ (REFACTORIZADA CON NUEVOS PERMISOS) ---
// Cada elemento y sub-elemento del menú ahora usa un grupo de permisos claro y descriptivo.
const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', roles: ALL_ROLES },
    { text: 'Ventas y CRM', icon: <PointOfSaleIcon />, roles: CAN_ACCESS_SALES_MODULE,
      subItems: [
        { text: 'Dashboard de Ventas', icon: <LeaderboardIcon />, path: '/ventas/dashboard', roles: CAN_VIEW_SALES_DASHBOARD },
        { text: 'Clientes', icon: <PeopleIcon />, path: '/ventas/clientes', roles: CAN_MANAGE_CLIENTS },
        { text: 'Cotizaciones', icon: <RequestQuoteIcon />, path: '/ventas/cotizaciones', roles: CAN_MANAGE_QUOTES },
        { text: 'Pedidos de Venta', icon: <ShoppingCartIcon />, path: '/ventas/pedidos', roles: CAN_MANAGE_SALES_ORDERS },
        { text: 'Punto de Venta (POS)', icon: <PointOfSaleIcon />, path: '/ventas/pos', roles: CAN_USE_POS },
        { text: 'Facturación', icon: <ReceiptLongIcon />, path: '/ventas/facturacion', roles: CAN_MANAGE_SALE_INVOICES },
        { text: 'Devoluciones (RMA)', icon: <AssignmentReturnIcon />, path: '/ventas/devoluciones', roles: CAN_MANAGE_RETURNS },
      ],
    },
    { text: 'Compras', icon: <ShoppingCartIcon />, roles: CAN_ACCESS_PURCHASING_MODULE,
      subItems: [
        { text: 'Proveedores', icon: <LocalShippingIcon />, path: '/compras/proveedores', roles: CAN_MANAGE_SUPPLIERS },
        { text: 'Órdenes de Compra', icon: <ReceiptLongIcon />, path: '/compras/ordenes', roles: CAN_CRUD_PURCHASE_ORDERS },
        { text: 'Recepción de Mercancía', icon: <WarehouseIcon />, path: '/compras/recepciones', roles: CAN_RECEIVE_GOODS },
        { text: 'Cuentas por Pagar', icon: <PaymentIcon />, path: '/compras/cuentas-pagar', roles: CAN_MANAGE_PAYABLES },
      ],
    },
    { text: 'Inventario', icon: <InventoryIcon />, roles: CAN_ACCESS_INVENTORY_MODULE,
      subItems: [
        { text: 'Productos y Servicios', icon: <InventoryIcon />, path: '/inventario/productos', roles: CAN_MANAGE_PRODUCTS },
        { text: 'Almacenes', icon: <WarehouseIcon />, path: '/inventario/almacenes', roles: CAN_MANAGE_WAREHOUSES },
        { text: 'Control de Stock', icon: <TableViewIcon />, path: '/inventario/stock', roles: CAN_CONTROL_STOCK },
        { text: 'Transferencias Internas', icon: <SyncAltIcon />, path: '/inventario/transferencias', roles: CAN_MANAGE_TRANSFERS },
        { text: 'Ajustes de Inventario', icon: <TuneIcon />, path: '/inventario/ajustes', roles: CAN_ADJUST_INVENTORY },
        { text: 'Lotes y Vencimientos', icon: <EventRepeatIcon />, path: '/inventario/lotes', roles: CAN_MANAGE_LOTS },
        { text: 'Valorización de Inventario', icon: <StackedLineChartIcon />, path: '/inventario/valorizacion', roles: CAN_VIEW_INVENTORY_VALUATION },
      ],
    },
    { text: 'Finanzas', icon: <AccountBalanceIcon />, roles: CAN_ACCESS_FINANCE_MODULE,
      subItems: [
        { text: 'Dashboard Financiero', icon: <LeaderboardIcon />, path: '/finanzas/dashboard', roles: CAN_VIEW_FINANCE_DASHBOARD },
        { text: 'Cuentas por Cobrar', icon: <PriceCheckIcon />, path: '/finanzas/cuentas-cobrar', roles: CAN_MANAGE_RECEIVABLES },
        { text: 'Gestión de Cobranzas', icon: <AccountBalanceWalletIcon />, path: '/finanzas/cobranzas', roles: CAN_MANAGE_RECEIVABLES },
        { text: 'Gestión de Pagos', icon: <PaymentIcon />, path: '/finanzas/pagos', roles: CAN_MANAGE_PAYABLES },
        { text: 'Conciliación Bancaria', icon: <AccountBalanceIcon />, path: '/finanzas/conciliacion', roles: CAN_MANAGE_PAYABLES },
        { text: 'Caja Chica', icon: <SavingsIcon />, path: '/finanzas/caja-chica', roles: CAN_MANAGE_PAYABLES },
        { text: 'Exportación Contable', icon: <FileUploadIcon />, path: '/finanzas/exportacion', roles: CAN_MANAGE_PAYABLES },
      ],
    },
    { text: 'Recursos Humanos', icon: <BadgeIcon />, roles: CAN_ACCESS_HR_MODULE,
      subItems: [
        { text: 'Gestión de Empleados', icon: <PeopleIcon />, path: '/rrhh/empleados', roles: CAN_MANAGE_EMPLOYEES },
        { text: 'Nómina / Planillas', icon: <PaymentIcon />, path: '/rrhh/nomina', roles: CAN_MANAGE_EMPLOYEES },
        { text: 'Control de Asistencia', icon: <CoPresentIcon />, path: '/rrhh/asistencia', roles: CAN_MANAGE_EMPLOYEES },
        { text: 'Gestión de Contratos', icon: <ArticleIcon />, path: '/rrhh/contratos', roles: CAN_MANAGE_EMPLOYEES },
        { text: 'Reclutamiento y Selección', icon: <PersonSearchIcon />, path: '/rrhh/reclutamiento', roles: CAN_MANAGE_EMPLOYEES },
      ],
    },
];

const reportsMenuItems = [
    { text: 'Reportes', icon: <AssessmentIcon />, roles: CAN_ACCESS_REPORTS_MODULE,
      subItems: [
        { text: 'Generar Catálogo', icon: <PictureAsPdfIcon />, path: '/reportes/catalogo', roles: CAN_GENERATE_CATALOG },
        { text: 'Reporte de Ventas', icon: <LeaderboardIcon />, path: '/reportes/ventas', roles: CAN_VIEW_SALES_DASHBOARD },
        { text: 'Análisis IA (Próximamente)', icon: <AutoAwesomeIcon />, path: '/reportes/ia', roles: CAN_VIEW_SALES_DASHBOARD },
      ]
    }
];
  
const adminMenuItems = [
    { text: 'Administración', icon: <BusinessIcon />, roles: CAN_ACCESS_ADMIN_MODULE,
      subItems: [
          { text: 'Configuración General', icon: <SettingsIcon />, path: '/admin/configuracion', roles: CAN_ACCESS_ADMIN_MODULE },
          { text: 'Usuarios y Roles', icon: <AdminPanelSettingsIcon />, path: '/admin/usuarios', roles: CAN_ACCESS_ADMIN_MODULE },
          { text: 'Gestión de Datos', icon: <ImportExportIcon />, path: '/admin/gestion-datos', roles: CAN_ACCESS_ADMIN_MODULE },
          { text: 'Sucursales', icon: <StoreIcon />, path: '/admin/sucursales', roles: CAN_ACCESS_ADMIN_MODULE },
          { text: 'Impuestos y Monedas', icon: <MonetizationOnIcon />, path: '/admin/impuestos', roles: CAN_ACCESS_ADMIN_MODULE },
          { text: 'Unidades de Medida', icon: <StraightenIcon />, path: '/admin/unidades', roles: CAN_ACCESS_ADMIN_MODULE },
          { text: 'Tipos de Documentos', icon: <FilePresentIcon />, path: '/admin/documentos', roles: CAN_ACCESS_ADMIN_MODULE },
      ]
    },
    { text: 'Sistema', icon: <BuildCircleIcon />, roles: [ROLES.SUPERADMIN],
      subItems: [
          { text: 'Auditoría de Usuarios', icon: <AdminPanelSettingsIcon />, path: '/sistema/auditoria', roles: [ROLES.SUPERADMIN] },
          { text: 'Bitácora de Cambios', icon: <HistoryToggleOffIcon />, path: '/sistema/changelog', roles: [ROLES.SUPERADMIN] },
          { text: 'Logs del Sistema', icon: <DnsIcon />, path: '/sistema/logs', roles: [ROLES.SUPERADMIN] },
          { text: 'Tareas Programadas', icon: <ScheduleIcon />, path: '/sistema/cron', roles: [ROLES.SUPERADMIN] },
          { text: 'Copias de Seguridad', icon: <BackupIcon />, path: '/sistema/backups', roles: [ROLES.SUPERADMIN] },
      ]
    }
];

// --- SECCIÓN 5: COMPONENTE PRINCIPAL DEL SIDEBAR ---
// Contiene la lógica para renderizar los menús y manejar su estado.
const DashboardSidebar = ({ open, handleDrawerClose }) => {
  const location = useLocation();
  const { user } = useAuth();
  
  const [openCollapse, setOpenCollapse] = React.useState({});

  const handleCollapseClick = (name) => {
    setOpenCollapse(prev => ({ ...prev, [name]: !prev[name] }));
  };

  /**
   * Renderiza una lista de elementos de menú, filtrando aquellos a los que el usuario
   * no tiene acceso, basado en la función de ayuda `hasPermission`.
   * @param {Array<object>} items - La lista de elementos de menú a renderizar.
   * @returns {Array<React.ReactNode>} - Un array de componentes de React listos para ser renderizados.
   */
  const renderMenuItems = (items) => {
    // Usamos la nueva función `hasPermission` para verificar el acceso.
    const accessibleItems = items.filter(item => hasPermission(item.roles, user?.role));

    return accessibleItems.map((item) => {
      // La misma lógica de `hasPermission` se aplica a los sub-items.
      const accessibleSubItems = item.subItems?.filter(subItem => hasPermission(subItem.roles, user?.role)) || [];
      const isParentActive = item.subItems?.some(sub => location.pathname.startsWith(sub.path));

      // Si un item principal no tiene sub-items visibles, no se renderiza.
      if (item.subItems && accessibleSubItems.length === 0) {
        return null;
      }
      
      return (
        <React.Fragment key={item.text}>
          {item.subItems ? (
            <React.Fragment>
              <ListItemButton 
                onClick={() => handleCollapseClick(item.text)} 
                sx={{ 
                  minHeight: 48, 
                  justifyContent: open ? 'initial' : 'center', 
                  px: 2.5, 
                  bgcolor: isParentActive ? 'action.hover' : 'transparent' 
                }}
              >
                <ListItemIcon sx={{ minWidth: 0, mr: open ? 3 : 'auto', justifyContent: 'center' }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} sx={{ opacity: open ? 1 : 0 }} />
                {open && (openCollapse[item.text] ? <ExpandLessIcon /> : <ExpandMoreIcon />)}
              </ListItemButton>
              <Collapse in={openCollapse[item.text] && open} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {accessibleSubItems.map((subItem) => (
                    <ListItemButton key={subItem.text} component={Link} to={subItem.path} selected={location.pathname === subItem.path} sx={{ pl: 4 }}>
                      <ListItemIcon sx={{ minWidth: 0, mr: 3, justifyContent: 'center', opacity: 0.8 }}>{subItem.icon}</ListItemIcon>
                      <ListItemText primary={subItem.text} />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            </React.Fragment>
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

  // El JSX que se devuelve para renderizar el componente.
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