// File: /frontend/src/routes/AppRoutes.js

/**
 * @file Gestor principal de rutas de la aplicación.
 *
 * @description Este componente centraliza la configuración de todas las rutas de la
 * aplicación utilizando React Router. Implementa guardias de rutas para proteger
 * el acceso a las páginas y utiliza carga diferida (lazy loading) para optimizar
 * el rendimiento inicial de la aplicación.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';

import { useAuth } from '../app/contexts/AuthContext';
import { hasPermission, PERMISSIONS } from '../utils/auth/roles';

// --- 1.1: Componentes de Carga y Layouts (Importación Estática) ---
import DashboardLayout from '../components/layout/DashboardLayout';
import AuthLayout from '../components/layout/AuthLayout';

const FullScreenLoader = () => (
  <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100vh">
    <CircularProgress size={50} />
    <Typography sx={{ mt: 2 }}>Cargando Módulo...</Typography>
  </Box>
);

// --- 1.2: Importaciones Dinámicas de Páginas (Lazy Loading) ---
const HomePage = lazy(() => import('../features/home/pages/HomePage'));
const LoginPage = lazy(() => import('../features/auth/pages/LoginPage'));
const DashboardPage = lazy(() => import('../features/dashboard/pages/DashboardPage'));
// CRM
const SupplierListPage = lazy(() => import('../features/crm/pages/SupplierListPage'));
const NewSupplierPage = lazy(() => import('../features/crm/pages/NewSupplierPage'));
// const EditSupplierPage = lazy(() => import('../features/crm/pages/EditSupplierPage')); // Descomentar cuando el archivo exista
const CustomerListPage = lazy(() => import('../features/crm/pages/CustomerListPage'));
const NewCustomerPage = lazy(() => import('../features/crm/pages/NewCustomerPage'));
// const EditCustomerPage = lazy(() => import('../features/crm/pages/EditCustomerPage')); // Descomentar cuando el archivo exista
// Sales
const SalesOrderListPage = lazy(() => import('../features/sales/pages/SalesOrderListPage'));
const NewSalesOrderPage = lazy(() => import('../features/sales/pages/NewSalesOrderPage'));
const EditSalesOrderPage = lazy(() => import('../features/sales/pages/EditSalesOrderPage'));
const CreateShipmentPage = lazy(() => import('../features/sales/pages/CreateShipmentPage'));
const ShipmentListPage = lazy(() => import('../features/sales/pages/ShipmentListPage'));
// Purchasing
const PurchaseOrderListPage = lazy(() => import('../features/purchasing/pages/PurchaseOrderListPage'));
const NewPurchaseOrderPage = lazy(() => import('../features/purchasing/pages/NewPurchaseOrderPage'));
const EditPurchaseOrderPage = lazy(() => import('../features/purchasing/pages/EditPurchaseOrderPage'));
const CreateReceiptPage = lazy(() => import('../features/purchasing/pages/CreateReceiptPage'));
const GoodsReceiptListPage = lazy(() => import('../features/purchasing/pages/GoodsReceiptListPage'));
const GoodsReceiptDetailsPage = lazy(() => import('../features/purchasing/pages/GoodsReceiptDetailsPage'));
const PurchaseBillListPage = lazy(() => import('../features/purchasing/pages/PurchaseBillListPage'));
const PurchaseBillDetailsPage = lazy(() => import('../features/purchasing/pages/PurchaseBillDetailsPage'));
const CreatePurchaseBillPage = lazy(() => import('../features/purchasing/pages/CreatePurchaseBillPage'));
// Inventory
const ProductListPage = lazy(() => import('../features/inventory/pages/ProductListPage'));
const NewProductPage = lazy(() => import('../features/inventory/pages/NewProductPage'));
const EditProductPage = lazy(() => import('../features/inventory/pages/EditProductPage'));
// Reports
const ProductCatalogPage = lazy(() => import('../features/reports/pages/ProductCatalogPage'));
// Admin
const UserManagementPage = lazy(() => import('../features/admin/pages/UserManagementPage'));
const DataManagementPage = lazy(() => import('../features/admin/pages/DataManagementPage'));

// ==============================================================================
// SECCIÓN 2: GUARDIANES DE RUTAS
// ==============================================================================

const PermissionGuard = ({ requiredPermission }) => {
  const { isAuthenticated, user, isInitialized } = useAuth();
  const location = useLocation();

  if (!isInitialized) return <FullScreenLoader />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  if (requiredPermission && !hasPermission(user?.role, requiredPermission)) return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
};

const PublicRouteGuard = () => {
  const { isAuthenticated, isInitialized } = useAuth();
  if (!isInitialized) return <FullScreenLoader />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
};

// ==============================================================================
// SECCIÓN 3: COMPONENTE PRINCIPAL DE RUTAS
// ==============================================================================

const AppRoutes = () => {
  return (
    <Suspense fallback={<FullScreenLoader />}>
      <Routes>
        {/* --- Rutas Públicas --- */}
        <Route element={<PublicRouteGuard />}>
          <Route path="/" element={<HomePage />} />
          <Route element={<AuthLayout />}>
            <Route path="login" element={<LoginPage />} />
          </Route>
        </Route>

        {/* --- Rutas Privadas y Protegidas --- */}
        <Route path="/" element={<PermissionGuard />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />

            {/* Módulo de CRM */}
            <Route path="crm">
              <Route path="proveedores" element={<SupplierListPage />} />
              <Route path="proveedores/nuevo" element={<NewSupplierPage />} />
              {/* <Route path="proveedores/:supplierId" element={<EditSupplierPage />} /> */} {/* Descomentar cuando el componente exista */}
              <Route path="clientes" element={<CustomerListPage />} />
              <Route path="clientes/nuevo" element={<NewCustomerPage />} />
              {/* <Route path="clientes/:customerId" element={<EditCustomerPage />} /> */} {/* Descomentar cuando el componente exista */}
            </Route>
            
            {/* Módulo de Ventas */}
            <Route path="ventas">
              <Route path="ordenes" element={<SalesOrderListPage />} />
              <Route path="ordenes/nueva" element={<NewSalesOrderPage />} />
              <Route path="ordenes/:orderId" element={<EditSalesOrderPage />} />
              <Route path="ordenes/:orderId/despachar" element={<CreateShipmentPage />} />
              <Route path="despachos" element={<ShipmentListPage />} />
            </Route>

            {/* Módulo de Compras */}
            <Route path="compras">
                <Route path="ordenes" element={<PurchaseOrderListPage />} />
                <Route path="ordenes/nueva" element={<NewPurchaseOrderPage />} />
                <Route path="ordenes/:orderId" element={<EditPurchaseOrderPage />} />
                <Route path="ordenes/:orderId/recepciones/nueva" element={<CreateReceiptPage />} />
                <Route path="ordenes/:orderId/facturar" element={<CreatePurchaseBillPage />} />
                <Route path="recepciones" element={<GoodsReceiptListPage />} />
                <Route path="recepciones/:receiptId" element={<GoodsReceiptDetailsPage />} />
                <Route path="facturas" element={<PurchaseBillListPage />} />
                <Route path="facturas/:billId" element={<PurchaseBillDetailsPage />} />
            </Route>

            {/* Módulo de Inventario */}
            <Route path="inventario">
              <Route path="productos" element={<ProductListPage />} />
              <Route path="productos/nuevo" element={<NewProductPage />} />
              <Route path="productos/:productId" element={<EditProductPage />} />
            </Route>

            {/* Módulo de Reportes */}
            <Route path="reportes">
              <Route path="catalogo" element={<ProductCatalogPage />} />
            </Route>

            {/* Rutas de Administración */}
            <Route path="admin">
                <Route element={<PermissionGuard requiredPermission={PERMISSIONS.ADMIN_VIEW_USER_MANAGEMENT} />}>
                    <Route path="usuarios" element={<UserManagementPage />} />
                </Route>
                <Route element={<PermissionGuard requiredPermission={PERMISSIONS.ADMIN_VIEW_DATA_MANAGEMENT} />}>
                    <Route path="gestion-datos" element={<DataManagementPage />} />
                </Route>
            </Route>
          </Route>
        </Route>

        {/* --- Rutas de Error y Fallback --- */}
        <Route path="/unauthorized" element={<Box sx={{ p: 4, textAlign: 'center' }}><Typography variant="h3">403 - Acceso Denegado</Typography></Box>} />
        <Route path="*" element={<Box sx={{ p: 4, textAlign: 'center' }}><Typography variant="h3">404 - Página no Encontrada</Typography></Box>} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;