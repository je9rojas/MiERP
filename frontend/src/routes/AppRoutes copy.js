// frontend/src/routes/AppRoutes.js

/**
 * @file Gestor principal de rutas de la aplicación.
 *
 * Este componente define toda la navegación de la aplicación utilizando React Router.
 * Implementa características avanzadas como Carga Perezosa (Lazy Loading) y Guardianes
 * de Ruta para un rendimiento y seguridad óptimos.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../app/contexts/AuthContext';
import { checkUserRole } from '../utils/auth/roles';
import { Box, CircularProgress, Typography } from '@mui/material';

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
const ProductListPage = lazy(() => import('../features/inventory/pages/ProductListPage'));
const NewProductPage = lazy(() => import('../features/inventory/pages/NewProductPage'));
const EditProductPage = lazy(() => import('../features/inventory/pages/EditProductPage'));
const PurchaseOrderListPage = lazy(() => import('../features/purchasing/pages/PurchaseOrderListPage'));
const NewPurchaseOrderPage = lazy(() => import('../features/purchasing/pages/NewPurchaseOrderPage'));
// CORRECCIÓN: Se importa la nueva página de edición.
const EditPurchaseOrderPage = lazy(() => import('../features/purchasing/pages/EditPurchaseOrderPage'));
const UserManagementPage = lazy(() => import('../features/admin/pages/UserManagementPage'));
const DataManagementPage = lazy(() => import('../features/admin/pages/DataManagementPage'));
const SupplierListPage = lazy(() => import('../features/crm/pages/SupplierListPage'));
const NewSupplierPage = lazy(() => import('../features/crm/pages/NewSupplierPage'));
const ProductCatalogPage = lazy(() => import('../features/reports/pages/ProductCatalogPage'));
const SalesOrderListPage = lazy(() => import('../features/sales/pages/SalesOrderListPage'));
const NewSalesOrderPage = lazy(() => import('../features/sales/pages/NewSalesOrderPage'));

// ==============================================================================
// SECCIÓN 2: COMPONENTES GUARDIANES DE RUTAS (ROUTE GUARDS)
// ==============================================================================

const PrivateRoutesGuard = ({ allowedRoles }) => {
    const { isAuthenticated, user, isInitialized } = useAuth();
    const location = useLocation();

    if (!isInitialized) {
        return <FullScreenLoader />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && !checkUserRole(user?.role, allowedRoles)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <Outlet />;
};

const PublicRouteGuard = () => {
    const { isAuthenticated, isInitialized } = useAuth();

    if (!isInitialized) {
        return <FullScreenLoader />;
    }

    return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
};

// ==============================================================================
// SECCIÓN 3: COMPONENTE PRINCIPAL DE RUTAS
// ==============================================================================

const AppRoutes = () => {
    return (
        <Suspense fallback={<FullScreenLoader />}>
            <Routes>
                {/* --- Grupo de Rutas Públicas --- */}
                <Route element={<PublicRouteGuard />}>
                    <Route path="/" element={<HomePage />} />
                    <Route element={<AuthLayout />}>
                        <Route path="login" element={<LoginPage />} />
                    </Route>
                </Route>

                {/* --- Grupo de Rutas Privadas --- */}
                <Route element={<PrivateRoutesGuard />}>
                    <Route element={<DashboardLayout />}>
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />

                        {/* Módulo de Ventas */}
                        <Route path="ventas/ordenes" element={<SalesOrderListPage />} />
                        <Route path="ventas/ordenes/nueva" element={<NewSalesOrderPage />} />

                        {/* Módulo de Inventario */}
                        <Route path="inventario/productos" element={<ProductListPage />} />
                        <Route path="inventario/productos/nuevo" element={<NewProductPage />} />
                        <Route path="inventario/productos/editar/:sku" element={<EditProductPage />} />
                        
                        {/* Módulo de Compras */}
                        <Route path="compras/ordenes" element={<PurchaseOrderListPage />} />
                        <Route path="compras/ordenes/nueva" element={<NewPurchaseOrderPage />} />
                        {/* CORRECCIÓN: Se añade la nueva ruta de edición. */}
                        <Route path="compras/ordenes/editar/:orderId" element={<EditPurchaseOrderPage />} />
                        
                        {/* Módulo de CRM */}
                        <Route path="crm/proveedores" element={<SupplierListPage />} />
                        <Route path="crm/proveedores/nuevo" element={<NewSupplierPage />} />
                        
                        {/* Módulo de Reportes */}
                        <Route path="reportes/catalogo" element={<ProductCatalogPage />} />
                        
                        {/* Módulo de Administración */}
                        <Route element={<PrivateRoutesGuard allowedRoles={['superadmin', 'admin']} />}>
                            <Route path="admin/usuarios" element={<UserManagementPage />} />
                            <Route path="admin/gestion-datos" element={<DataManagementPage />} />
                        </Route>
                    </Route>
                </Route>
                
                {/* --- Rutas de Error y Fallback --- */}
                <Route path="/unauthorized" element={
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant="h3" component="h1" gutterBottom>403 - Acceso Denegado</Typography>
                        <Typography>No tienes los permisos necesarios para acceder a este recurso.</Typography>
                    </Box>
                }/>
                <Route path="*" element={
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant="h3" component="h1" gutterBottom>404 - Página no Encontrada</Typography>
                        <Typography>La página que buscas no existe o ha sido movida.</Typography>
                    </Box>
                }/>
            </Routes>
        </Suspense>
    );
};

export default AppRoutes;