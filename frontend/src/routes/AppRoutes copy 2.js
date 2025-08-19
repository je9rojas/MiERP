// frontend/src/routes/AppRoutes.js

/**
 * @file Gestor principal de rutas de la aplicación.
 *
 * Este componente define toda la navegación de la aplicación utilizando React Router.
 * Implementa un sistema de control de acceso basado en permisos, Carga Perezosa
 * (Lazy Loading) para los componentes de página, y un Suspense fallback global
 * para una experiencia de usuario fluida y un rendimiento óptimo.
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

// Módulo de CRM
const SupplierListPage = lazy(() => import('../features/crm/pages/SupplierListPage'));
const NewSupplierPage = lazy(() => import('../features/crm/pages/NewSupplierPage'));
const CustomerListPage = lazy(() => import('../features/crm/pages/CustomerListPage'));
const NewCustomerPage = lazy(() => import('../features/crm/pages/NewCustomerPage'));
// const EditCustomerPage = lazy(() => import('../features/crm/pages/EditCustomerPage')); // Preparado para el futuro

// Módulo de Ventas
const SalesOrderListPage = lazy(() => import('../features/sales/pages/SalesOrderListPage'));
const NewSalesOrderPage = lazy(() => import('../features/sales/pages/NewSalesOrderPage'));
const EditSalesOrderPage = lazy(() => import('../features/sales/pages/EditSalesOrderPage'));
const CreateShipmentPage = lazy(() => import('../features/sales/pages/CreateShipmentPage'));

// Módulo de Compras
const PurchaseOrderListPage = lazy(() => import('../features/purchasing/pages/PurchaseOrderListPage'));
const NewPurchaseOrderPage = lazy(() => import('../features/purchasing/pages/NewPurchaseOrderPage'));
const EditPurchaseOrderPage = lazy(() => import('../features/purchasing/pages/EditPurchaseOrderPage'));
const CreateReceiptPage = lazy(() => import('../features/purchasing/pages/CreateReceiptPage'));
const GoodsReceiptListPage = lazy(() => import('../features/purchasing/pages/GoodsReceiptListPage'));
const GoodsReceiptDetailsPage = lazy(() => import('../features/purchasing/pages/GoodsReceiptDetailsPage'));
const PurchaseBillListPage = lazy(() => import('../features/purchasing/pages/PurchaseBillListPage'));
const PurchaseBillDetailsPage = lazy(() => import('../features/purchasing/pages/PurchaseBillDetailsPage'));
const CreatePurchaseBillPage = lazy(() => import('../features/purchasing/pages/CreatePurchaseBillPage'));

// Módulo de Inventario
const ProductListPage = lazy(() => import('../features/inventory/pages/ProductListPage'));
const NewProductPage = lazy(() => import('../features/inventory/pages/NewProductPage'));
const EditProductPage = lazy(() => import('../features/inventory/pages/EditProductPage'));

// Módulos de Soporte
const ProductCatalogPage = lazy(() => import('../features/reports/pages/ProductCatalogPage'));
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
  if (requiredPermission && !hasPermission(user.role, requiredPermission)) return <Navigate to="/unauthorized" replace />;

  return <Outlet />;
};

const PublicRouteGuard = () => {
  const { isAuthenticated, isInitialized } = useAuth();
  if (!isInitialized) return <FullScreenLoader />;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
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

        {/* --- Rutas Privadas --- */}
        <Route element={<PermissionGuard />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Módulo de CRM */}
            <Route path="crm/proveedores" element={<SupplierListPage />} />
            <Route path="crm/proveedores/nuevo" element={<NewSupplierPage />} />
            <Route path="crm/clientes" element={<CustomerListPage />} />
            <Route path="crm/clientes/nuevo" element={<NewCustomerPage />} />
            {/* <Route path="crm/clientes/editar/:customerId" element={<EditCustomerPage />} /> */}

            {/* Módulo de Ventas */}
            <Route path="ventas/ordenes" element={<SalesOrderListPage />} />
            <Route path="ventas/ordenes/nueva" element={<NewSalesOrderPage />} />
            <Route path="ventas/ordenes/:orderId" element={<EditSalesOrderPage />} />
            <Route path="ventas/ordenes/:orderId/despachar" element={<CreateShipmentPage />} />

            {/* Módulo de Compras */}
            <Route path="compras/ordenes" element={<PurchaseOrderListPage />} />
            <Route path="compras/ordenes/nueva" element={<NewPurchaseOrderPage />} />
            <Route path="compras/ordenes/editar/:orderId" element={<EditPurchaseOrderPage />} />
            <Route path="compras/ordenes/:orderId/recepciones/nueva" element={<CreateReceiptPage />} />
            <Route path="compras/ordenes/:orderId/facturar" element={<CreatePurchaseBillPage />} />
            <Route path="compras/recepciones" element={<GoodsReceiptListPage />} />
            <Route path="compras/recepciones/:receiptId" element={<GoodsReceiptDetailsPage />} />
            <Route path="compras/facturas" element={<PurchaseBillListPage />} />
            <Route path="compras/facturas/:billId" element={<PurchaseBillDetailsPage />} />

            {/* Módulo de Inventario */}
            <Route path="inventario/productos" element={<ProductListPage />} />
            <Route path="inventario/productos/nuevo" element={<NewProductPage />} />
            <Route path="inventario/productos/editar/:sku" element={<EditProductPage />} />

            {/* Módulo de Reportes */}
            <Route path="reportes/catalogo" element={<ProductCatalogPage />} />

            {/* Rutas de Administración */}
            <Route element={<PermissionGuard requiredPermission={PERMISSIONS.ADMIN_VIEW_USER_MANAGEMENT} />}>
              <Route path="admin/usuarios" element={<UserManagementPage />} />
            </Route>
            <Route element={<PermissionGuard requiredPermission={PERMISSIONS.ADMIN_VIEW_DATA_MANAGEMENT} />}>
              <Route path="admin/gestion-datos" element={<DataManagementPage />} />
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