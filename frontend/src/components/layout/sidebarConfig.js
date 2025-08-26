// File: /frontend/src/components/layout/sidebarConfig.js

/**
 * @file Archivo de configuración para la estructura del menú lateral (Sidebar).
 * @description Centraliza la definición de todos los enlaces y menús desplegables
 * de la aplicación para facilitar su mantenimiento y modificación.
 */

import React from 'react';
import {
    Dashboard as DashboardIcon, PointOfSale as PointOfSaleIcon, People as PeopleIcon,
    ShoppingCart as ShoppingCartIcon, ReceiptLong as ReceiptLongIcon,
    LocalShipping as LocalShippingIcon, Inventory as InventoryIcon,
    AdminPanelSettings as AdminPanelSettingsIcon, Business as BusinessIcon,
    PictureAsPdf as PictureAsPdfIcon, Assessment as AssessmentIcon,
    ImportExport as ImportExportIcon, Article as ArticleIcon,
    Handshake as CrmIcon, Inventory2 as GoodsReceiptIcon,
} from '@mui/icons-material';
import { PERMISSIONS } from '../../utils/auth/roles';

export const SIDEBAR_STRUCTURE = [
    {
        section: "Principal",
        items: [
            { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
            {
                text: 'CRM', icon: <CrmIcon />,
                permission: PERMISSIONS.CRM_VIEW_CUSTOMERS,
                subItems: [
                    { text: 'Clientes', icon: <PeopleIcon />, path: '/crm/clientes', permission: PERMISSIONS.CRM_VIEW_CUSTOMERS },
                    { text: 'Proveedores', icon: <BusinessIcon />, path: '/crm/proveedores', permission: PERMISSIONS.CRM_VIEW_SUPPLIERS },
                ],
            },
            {
                text: 'Ventas', icon: <PointOfSaleIcon />,
                permission: PERMISSIONS.SALES_VIEW_ORDERS,
                subItems: [
                    { text: 'Órdenes de Venta', icon: <ReceiptLongIcon />, path: '/ventas/ordenes', permission: PERMISSIONS.SALES_VIEW_ORDERS },
                    { text: 'Despachos', icon: <LocalShippingIcon />, path: '/ventas/despachos', permission: PERMISSIONS.SALES_DISPATCH_GOODS },
                ],
            },
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
                text: 'Inventario', icon: <InventoryIcon />,
                permission: PERMISSIONS.INVENTORY_VIEW_PRODUCTS,
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
                text: 'Reportes', icon: <AssessmentIcon />,
                permission: PERMISSIONS.REPORTS_VIEW_CATALOG,
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
                text: 'Administración', icon: <AdminPanelSettingsIcon />,
                permission: PERMISSIONS.ADMIN_VIEW_USER_MANAGEMENT,
                subItems: [
                    { text: 'Usuarios y Roles', icon: <PeopleIcon />, path: '/admin/usuarios', permission: PERMISSIONS.ADMIN_VIEW_USER_MANAGEMENT },
                    { text: 'Gestión de Datos', icon: <ImportExportIcon />, path: '/admin/gestion-datos', permission: PERMISSIONS.ADMIN_VIEW_DATA_MANAGEMENT },
                ]
            },
        ]
    }
];