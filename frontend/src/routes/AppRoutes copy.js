// /frontend/src/routes/AppRoutes.js
// GESTOR DE RUTAS FINAL CON CARGA PEREZOSA (LAZY LOADING) PARA MÁXIMO RENDIMIENTO

import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../app/contexts/AuthContext';
import { checkUserRole } from '../utils/auth/roles';
import { Box, CircularProgress, Typography } from '@mui/material';

// --- SECCIÓN 1: LAYOUTS Y COMPONENTES DE APOYO ---
// Los Layouts y el Loader se importan de forma estática porque son necesarios
// desde el principio para la estructura y los fallbacks de carga.
import DashboardLayout from '../components/layout/DashboardLayout';
import AuthLayout from '../components/layout/AuthLayout';

const FullScreenLoader = () => (
  <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
    <CircularProgress size={50} />
  </Box>
);

// --- SECCIÓN 2: IMPORTACIONES DINÁMICAS DE PÁGINAS (LAZY LOADING) ---
// Cada página se importa usando React.lazy(). Esto crea un "chunk" de JavaScript
// separado para cada página, que solo se descargará cuando el usuario navegue a ella.
const HomePage = lazy(() => import('../features/home/pages/HomePage'));
const LoginPage = lazy(() => import('../features/auth/pages/LoginPage'));
const DashboardPage = lazy(() => import('../features/dashboard/pages/DashboardPage'));
const UserManagementPage = lazy(() => import('../features/admin/pages/UserManagementPage'));
const ProductListPage = lazy(() => import('../features/inventory/pages/ProductListPage'));
const NewProductPage = lazy(() => import('../features/inventory/pages/NewProductPage'));
const EditProductPage = lazy(() => import('../features/inventory/pages/EditProductPage'));
const ProductCatalogPage = lazy(() => import('../features/inventory/pages/ProductCatalogPage'));
const NewPurchaseOrderPage = lazy(() => import('../features/purchasing/pages/NewPurchaseOrderPage'));
const PurchaseOrderListPage = lazy(() => import('../features/purchasing/pages/PurchaseOrderListPage'));
const DataManagementPage = lazy(() => import('../features/admin/pages/DataManagementPage'));

// --- SECCIÓN 3: COMPONENTES GUARDIANES DE RUTAS (Route Guards) ---
// La lógica de estos componentes no cambia.
const PrivateRoutesGuard = ({ allowedRoles }) => {
  const { isAuthenticated, user, isInitialized } = useAuth();
  const location = useLocation();
  if (!isInitialized) return <FullScreenLoader />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  if (allowedRoles && !checkUserRole(user?.role, allowedRoles)) return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
};

const PublicRouteGuard = () => {
  const { isAuthenticated, isInitialized } = useAuth();
  if (!isInitialized) return <FullScreenLoader />;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
};


// --- SECCIÓN 4: COMPONENTE PRINCIPAL DE RUTAS ---
const AppRoutes = () => {
  return (
    // Toda la definición de rutas está envuelta en <Suspense>.
    // Si React intenta renderizar un componente lazy que aún no se ha descargado,
    // mostrará el `fallback` (nuestro loader) hasta que el código esté listo.
    <Suspense fallback={<FullScreenLoader />}>
      <Routes>
        {/* Grupo 1: Rutas Públicas y de Autenticación */}
        <Route element={<PublicRouteGuard />}>
          <Route path="/" element={<HomePage />} />
          <Route element={<AuthLayout />}>
            <Route path="login" element={<LoginPage />} />
          </Route>
        </Route>

        {/* Grupo 2: Rutas Privadas del Dashboard (para todos los roles autenticados) */}
        <Route path="/" element={<PrivateRoutesGuard />}>
          <Route element={<DashboardLayout />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="inventario/productos" element={<ProductListPage />} />
            <Route path="inventario/productos/nuevo" element={<NewProductPage />} />
            <Route path="inventario/productos/editar/:sku" element={<EditProductPage />} />
            <Route path="reportes/catalogo" element={<ProductCatalogPage />} />
            <Route path="compras/nueva" element={<NewPurchaseOrderPage />} />
            <Route path="compras/ordenes" element={<PurchaseOrderListPage />} />
          </Route>
        </Route>
        
        {/* Grupo 3: Rutas Privadas del Dashboard (SOLO PARA ADMINS) */}
        <Route path="/admin" element={<PrivateRoutesGuard allowedRoles={['superadmin', 'admin']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="usuarios" element={<UserManagementPage />} />
            <Route path="gestion-datos" element={<DataManagementPage />} />
          </Route>
        </Route>
        
        {/* Grupo 4: Rutas de Fallback y Error */}
        <Route path="/unauthorized" element={
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h3" component="h1" gutterBottom>403 - Acceso Denegado</Typography>
            <Typography>No tienes los permisos necesarios para ver esta página.</Typography>
          </Box>
        }/>
        <Route path="*" element={
          <Box p={4} textAlign="center">
            <Typography variant="h3" component="h1" gutterBottom>404 - Página no Encontrada</Typography>
            <Typography>La página que buscas no existe o ha sido movida.</Typography>
          </Box>
        }/>
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;