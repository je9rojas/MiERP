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

// --- 1.1: Componentes de Layout (Importación Estática) ---
import AuthLayout from '../components/layout/AuthLayout';
import DashboardLayout from '../components/layout/DashboardLayout';

// --- 1.2: Páginas (Importación Dinámica con Lazy Loading) ---

// Módulo de Autenticación y Páginas Públicas
const LoginPage = lazy(() => import('../features/auth/pages/LoginPage'));
const HomePage = lazy(() => import('../features/home/pages/HomePage'));

// Módulo de Dashboard
const DashboardPage = lazy(() => import('../features/dashboard/pages/DashboardPage'));

// Módulo de CRM
const CustomerListPage = lazy(() => import('../features/crm/pages/CustomerListPage'));
const NewCustomerPage = lazy(() => import('../features/crm/pages/NewCustomerPage'));
const EditCustomerPage = lazy(() => import('../features/crm/pages/EditCustomerPage'));
const SupplierListPage = lazy(() => import('../features/crm/pages/SupplierListPage'));
const NewSupplierPage = lazy(() => import('../features/crm/pages/NewSupplierPage'));
const EditSupplierPage = lazy(() => import('../features/crm/pages/EditSupplierPage'));

// Módulo de Inventario
const ProductListPage = lazy(() => import('../features/inventory/pages/ProductListPage'));
const NewProductPage = lazy(() => import('../features/inventory/pages/NewProductPage'));
const EditProductPage = lazy(() => import('../features/inventory/pages/EditProductPage'));

// Módulo de Compras
const PurchaseOrderListPage = lazy(() => import('../features/purchasing/pages/PurchaseOrderListPage'));
const NewPurchaseOrderPage = lazy(() => import('../features/purchasing/pages/NewPurchaseOrderPage'));
const EditPurchaseOrderPage = lazy(() => import('../features/purchasing/pages/EditPurchaseOrderPage'));
const CreateReceiptPage = lazy(() => import('../features/purchasing/pages/CreateReceiptPage'));
const GoodsReceiptListPage = lazy(() => import('../features/purchasing/pages/GoodsReceiptListPage'));
const GoodsReceiptDetailsPage = lazy(() => import('../features/purchasing/pages/GoodsReceiptDetailsPage'));
const CreatePurchaseBillPage = lazy(() => import('../features/purchasing/pages/CreatePurchaseBillPage'));
const PurchaseBillListPage = lazy(() => import('../features/purchasing/pages/PurchaseBillListPage'));
const PurchaseBillDetailsPage = lazy(() => import('../features/purchasing/pages/PurchaseBillDetailsPage'));

// Módulo de Ventas
const SalesOrderListPage = lazy(() => import('../features/sales/pages/SalesOrderListPage'));
const NewSalesOrderPage = lazy(() => import('../features/sales/pages/NewSalesOrderPage'));
const EditSalesOrderPage = lazy(() => import('../features/sales/pages/EditSalesOrderPage'));
const CreateShipmentPage = lazy(() => import('../features/sales/pages/CreateShipmentPage'));
const ShipmentListPage = lazy(() => import('../features/sales/pages/ShipmentListPage'));

// Módulo de Reportes
const ProductCatalogPage = lazy(() => import('../features/reports/pages/ProductCatalogPage'));

// Módulo de Administración
const UserManagementPage = lazy(() => import('../features/admin/pages/UserManagementPage'));
const DataManagementPage = lazy(() => import('../features/admin/pages/DataManagementPage'));


// ==============================================================================
// SECCIÓN 2: COMPONENTES AUXILIARES
// ==============================================================================

/**
 * @description Componente que muestra un indicador de carga a pantalla completa.
 * Se utiliza como fallback de Suspense durante la carga de módulos.
 */
const FullScreenLoader = () => (
  <Box
    display="flex"
    flexDirection="column"
    justifyContent="center"
    alignItems="center"
    height="100vh"
    width="100vw"
  >
    <CircularProgress size={50} />
    <Typography variant="h6" sx={{ mt: 2 }}>
      Cargando Módulo...
    </Typography>
  </Box>
);

// ==============================================================================
// SECCIÓN 3: GUARDIANES DE RUTA (ROUTE GUARDS)
// ==============================================================================

/**
 * @description Protege rutas que requieren autenticación y, opcionalmente, un permiso específico.
 * Redirige al login si el usuario no está autenticado o a una página de no autorizado
 * si no tiene los permisos necesarios.
 * @param {{ requiredPermission: string }} props El permiso requerido para acceder a la ruta.
 */
const ProtectedRoute = ({ requiredPermission }) => {
  const { isAuthenticated, user, isInitialized } = useAuth();
  const location = useLocation();

  if (!isInitialized) {
    return <FullScreenLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredPermission && !hasPermission(user?.role, requiredPermission)) {
    return <Navigate to="/acceso-denegado" replace />;
  }

  return <Outlet />;
};

/**
 * @description Protege rutas públicas que no deben ser accesibles si el usuario ya está autenticado.
 * Redirige al dashboard si el usuario intenta acceder a páginas como el login.
 */
const PublicRoute = () => {
  const { isAuthenticated, isInitialized } = useAuth();

  if (!isInitialized) {
    return <FullScreenLoader />;
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
};


// ==============================================================================
// SECCIÓN 4: DEFINICIÓN DE RUTAS DE LA APLICACIÓN
// ==============================================================================

const AppRoutes = () => {
  return (
    <Suspense fallback={<FullScreenLoader />}>
      <Routes>
        {/* --- 4.1: Rutas Públicas --- */}
        <Route element={<PublicRoute />}>
          <Route path="/" element={<HomePage />} />
          <Route element={<AuthLayout />}>
            <Route path="login" element={<LoginPage />} />
          </Route>
        </Route>

        {/* --- 4.2: Rutas Privadas y Protegidas por Rol --- */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />

            {/* Módulo de CRM */}
            <Route path="crm">
              <Route path="clientes" element={<CustomerListPage />} />
              <Route path="clientes/nuevo" element={<NewCustomerPage />} />
              <Route path="clientes/:customerId" element={<EditCustomerPage />} />
              <Route path="proveedores" element={<SupplierListPage />} />
              <Route path="proveedores/nuevo" element={<NewSupplierPage />} />
              <Route path="proveedores/:supplierId" element={<EditSupplierPage />} />
            </Route>

            {/* Módulo de Inventario */}
            <Route path="inventario">
              <Route path="productos" element={<ProductListPage />} />
              <Route path="productos/nuevo" element={<NewProductPage />} />
              <Route path="productos/:productId" element={<EditProductPage />} />
            </Route>

            {/* Módulo de Compras */}
            <Route path="compras">
              <Route path="ordenes" element={<PurchaseOrderListPage />} />
              <Route path="ordenes/nueva" element={<NewPurchaseOrderPage />} />
              <Route path="ordenes/:orderId" element={<EditPurchaseOrderPage />} />
              <Route path="ordenes/:orderId/recepcionar" element={<CreateReceiptPage />} />
              <Route path="ordenes/:orderId/facturar" element={<CreatePurchaseBillPage />} />
              <Route path="recepciones" element={<GoodsReceiptListPage />} />
              <Route path="recepciones/:receiptId" element={<GoodsReceiptDetailsPage />} />
              <Route path="facturas" element={<PurchaseBillListPage />} />
              <Route path="facturas/:billId" element={<PurchaseBillDetailsPage />} />
            </Route>
            
            {/* Módulo de Ventas */}
            <Route path="ventas">
              <Route path="ordenes" element={<SalesOrderListPage />} />
              <Route path="ordenes/nueva" element={<NewSalesOrderPage />} />
              <Route path="ordenes/:orderId" element={<EditSalesOrderPage />} />
              <Route path="ordenes/:orderId/despachar" element={<CreateShipmentPage />} />
              <Route path="despachos" element={<ShipmentListPage />} />
            </Route>

            {/* Módulo de Reportes */}
            <Route path="reportes">
              <Route path="catalogo-productos" element={<ProductCatalogPage />} />
            </Route>

            {/* Módulo de Administración (con guardián de permiso específico) */}
            <Route path="administracion">
              <Route 
                path="usuarios" 
                element={
                  <ProtectedRoute requiredPermission={PERMISSIONS.ADMIN_VIEW_USER_MANAGEMENT}>
                    <UserManagementPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="gestion-datos" 
                element={
                  <ProtectedRoute requiredPermission={PERMISSIONS.ADMIN_VIEW_DATA_MANAGEMENT}>
                    <DataManagementPage />
                  </ProtectedRoute>
                } 
              />
            </Route>
          </Route>
        </Route>

        {/* --- 4.3: Rutas de Error y Fallback --- */}
        <Route path="/acceso-denegado" element={
            <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h4">403 - Acceso Denegado</Typography>
                <Typography>No tienes permiso para ver esta página.</Typography>
            </Box>
        } />
        <Route path="*" element={
            <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h4">404 - Página no Encontrada</Typography>
                <Typography>La ruta que buscas no existe.</Typography>
            </Box>
        } />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;