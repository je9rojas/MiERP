// /frontend/src/components/layout/DashboardSidebar.js

/**
 * @file Componente del menú lateral (Sidebar) para la navegación principal del Dashboard.
 *
 * Este componente es responsable de renderizar los enlaces de navegación del sistema.
 * Sus características principales son:
 * - **Diseño Adaptable:** Se expande o contrae, mostrando solo iconos cuando está cerrado.
 * - **Navegación Jerárquica:** Soporta menús desplegables con sub-elementos.
 * - **Seguridad Basada en Roles:** Filtra dinámicamente los elementos del menú visibles
 *   para cada usuario según los permisos asociados a su rol, garantizando que solo
 *   vean las secciones a las que tienen acceso.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useState, useCallback, useEffect } from 'react';
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
    BuildCircle as BuildCircleIcon, Dns as DnsIcon,
    ExpandLess as ExpandLessIcon, ExpandMore as ExpandMoreIcon,
    PictureAsPdf as PictureAsPdfIcon, Assessment as AssessmentIcon,
    ChevronLeft as ChevronLeftIcon, ImportExport as ImportExportIcon,
    Article as ArticleIcon, // Se importa el icono para las facturas
} from '@mui/icons-material';

import { useAuth } from '../../app/contexts/AuthContext';
import { hasPermission, ALL_ROLES, CAN_ACCESS_SALES_MODULE, CAN_MANAGE_CLIENTS,
    CAN_ACCESS_PURCHASING_MODULE, CAN_MANAGE_SUPPLIERS, CAN_CRUD_PURCHASE_ORDERS,
    CAN_ACCESS_INVENTORY_MODULE, CAN_MANAGE_PRODUCTS,
    CAN_ACCESS_REPORTS_MODULE, CAN_GENERATE_CATALOG,
    CAN_ACCESS_ADMIN_MODULE, ROLES
} from '../../constants/rolesAndPermissions';

// ==============================================================================
// SECCIÓN 2: COMPONENTES DE ESTILO (STYLED COMPONENTS)
// ==============================================================================

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

// ==============================================================================
// SECCIÓN 3: ESTRUCTURA DE DATOS DEL MENÚ
// ==============================================================================

const SIDEBAR_STRUCTURE = [
    {
        section: "Principal",
        items: [
            { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', roles: ALL_ROLES },
            {
                text: 'Ventas y CRM', icon: <PointOfSaleIcon />, roles: CAN_ACCESS_SALES_MODULE,
                subItems: [
                    { text: 'Clientes', icon: <PeopleIcon />, path: '/crm/clientes', roles: CAN_MANAGE_CLIENTS },
                ],
            },
            {
                text: 'Compras', icon: <ShoppingCartIcon />, roles: CAN_ACCESS_PURCHASING_MODULE,
                subItems: [
                    { text: 'Proveedores', icon: <LocalShippingIcon />, path: '/crm/proveedores', roles: CAN_MANAGE_SUPPLIERS },
                    { text: 'Órdenes de Compra', icon: <ReceiptLongIcon />, path: '/compras/ordenes', roles: CAN_CRUD_PURCHASE_ORDERS },
                    // Se añade el nuevo enlace a la lista de facturas de compra.
                    { text: 'Facturas de Compra', icon: <ArticleIcon />, path: '/compras/facturas', roles: CAN_CRUD_PURCHASE_ORDERS },
                ],
            },
            {
                text: 'Inventario', icon: <InventoryIcon />, roles: CAN_ACCESS_INVENTORY_MODULE,
                subItems: [
                    { text: 'Productos', icon: <InventoryIcon />, path: '/inventario/productos', roles: CAN_MANAGE_PRODUCTS },
                ],
            },
        ]
    },
    {
        section: "Análisis",
        items: [
            {
                text: 'Reportes', icon: <AssessmentIcon />, roles: CAN_ACCESS_REPORTS_MODULE,
                subItems: [
                    { text: 'Generar Catálogo', icon: <PictureAsPdfIcon />, path: '/reportes/catalogo', roles: CAN_GENERATE_CATALOG },
                ]
            }
        ]
    },
    {
        section: "Configuración",
        items: [
            {
                text: 'Administración', icon: <BusinessIcon />, roles: CAN_ACCESS_ADMIN_MODULE,
                subItems: [
                    { text: 'Usuarios y Roles', icon: <AdminPanelSettingsIcon />, path: '/admin/usuarios', roles: CAN_ACCESS_ADMIN_MODULE },
                    { text: 'Gestión de Datos', icon: <ImportExportIcon />, path: '/admin/gestion-datos', roles: CAN_ACCESS_ADMIN_MODULE },
                ]
            },
            {
                text: 'Sistema', icon: <BuildCircleIcon />, roles: [ROLES.SUPERADMIN],
                subItems: [
                    { text: 'Logs del Sistema', icon: <DnsIcon />, path: '/sistema/logs', roles: [ROLES.SUPERADMIN] },
                ]
            }
        ]
    }
];

// ==============================================================================
// SECCIÓN 4: COMPONENTE PRINCIPAL DEL SIDEBAR
// ==============================================================================

const DashboardSidebar = ({ open, handleDrawerClose }) => {
    const location = useLocation();
    const { user } = useAuth();
    const [openCollapse, setOpenCollapse] = useState({});

    useEffect(() => {
        const activeParent = SIDEBAR_STRUCTURE.flatMap(s => s.items).find(item =>
            item.subItems?.some(sub => location.pathname.startsWith(sub.path))
        );
        if (activeParent) {
            setOpenCollapse(prev => ({ ...prev, [activeParent.text]: true }));
        }
    }, [location.pathname]);


    const handleCollapseClick = useCallback((name) => {
        setOpenCollapse(prev => ({ ...prev, [name]: !prev[name] }));
    }, []);

    const renderMenuItems = (items) => {
        const accessibleItems = items.filter(item => hasPermission(item.roles, user?.role));

        return accessibleItems.map((item) => {
            const accessibleSubItems = item.subItems?.filter(subItem => hasPermission(subItem.roles, user?.role)) || [];

            if (item.subItems && accessibleSubItems.length === 0) {
                return null;
            }
            
            if (!item.subItems) {
                return (
                    <ListItemButton key={item.text} component={Link} to={item.path} selected={location.pathname === item.path} sx={{ minHeight: 48, justifyContent: open ? 'initial' : 'center', px: 2.5 }}>
                        <ListItemIcon sx={{ minWidth: 0, mr: open ? 3 : 'auto', justifyContent: 'center' }}>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.text} sx={{ opacity: open ? 1 : 0 }} />
                    </ListItemButton>
                );
            }

            return (
                <React.Fragment key={item.text}>
                    <ListItemButton onClick={() => handleCollapseClick(item.text)} sx={{ minHeight: 48, justifyContent: open ? 'initial' : 'center', px: 2.5 }}>
                        <ListItemIcon sx={{ minWidth: 0, mr: open ? 3 : 'auto', justifyContent: 'center' }}>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.text} sx={{ opacity: open ? 1 : 0 }} />
                        {open && (openCollapse[item.text] ? <ExpandLessIcon /> : <ExpandMoreIcon />)}
                    </ListItemButton>
                    <Collapse in={openCollapse[item.text] && open} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                            {accessibleSubItems.map((subItem) => (
                                <ListItemButton key={subItem.text} component={Link} to={subItem.path} selected={location.pathname.startsWith(subItem.path)} sx={{ pl: 4 }}>
                                    <ListItemIcon sx={{ minWidth: 0, mr: 3, justifyContent: 'center', opacity: 0.8 }}>{subItem.icon}</ListItemIcon>
                                    <ListItemText primary={subItem.text} />
                                </ListItemButton>
                            ))}
                        </List>
                    </Collapse>
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
            {SIDEBAR_STRUCTURE.map((section, index) => (
                <React.Fragment key={section.section}>
                    {index > 0 && <Divider sx={{ mx: 2, my: 1 }} />}
                    <List component="nav" sx={{ p: 1 }} subheader={ open && <Typography variant="caption" sx={{ px: 2.5, color: 'text.secondary', fontWeight: 'bold' }}>{section.section.toUpperCase()}</Typography> }>
                        {renderMenuItems(section.items)}
                    </List>
                </React.Fragment>
            ))}
        </Drawer>
    );
};

export default DashboardSidebar;