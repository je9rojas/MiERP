// /frontend/src/routes/AppRoutes.js
// GESTOR PRINCIPAL DE RUTAS DE LA APLICACIÓN

import React from 'react';
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../app/contexts/AuthContext';
import { checkUserRole } from '../utils/auth/roles';
import { Box, CircularProgress, Typography } from '@mui/material';

// --- Layouts Principales de la Aplicación ---
import DashboardLayout from '../components/layout/DashboardLayout';
import AuthLayout from '../components/layout/AuthLayout';

// --- Páginas de la Aplicación ---
import HomePage from '../features/home/pages/HomePage';
import LoginPage from '../features/auth/pages/LoginPage';
import DashboardPage from '../features/dashboard/pages/DashboardPage';
import UserManagementPage from '../features/admin/pages/UserManagementPage';
import ProductListPage from '../features/inventory/pages/ProductListPage';
import NewProductPage from '../features/inventory/pages/NewProductPage';
import EditProductPage from '../features/inventory/pages/EditProductPage';
import ProductCatalogPage from '../features/inventory/pages/ProductCatalogPage';
import NewPurchaseOrderPage from '../features/purchasing/pages/NewPurchaseOrderPage';
import PurchaseOrderListPage from '../features/purchasing/pages/PurchaseOrderListPage';


// --- SECCIÓN 1: COMPONENTES GUARDIANES DE RUTAS (Route Guards) ---
// Estos componentes locales controlan el acceso a diferentes secciones de la aplicación.

const FullScreenLoader = () => (
  <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
    <CircularProgress />
  </Box>
);

/**
 * Guardián para rutas que requieren autenticación.
 * 1. Muestra un loader mientras se verifica la sesión inicial.
 * 2. Si el usuario no está autenticado, lo redirige a /login.
 * 3. Si se requieren roles específicos y el usuario no los cumple, lo redirige a /unauthorized.
 * 4. Si todo es correcto, permite el acceso a las rutas anidadas (`Outlet`).
 */
const PrivateRoutesGuard = ({ allowedRoles }) => {
  const { isAuthenticated, user, isInitialized } = useAuth();
  const location = useLocation();

  if (!isInitialized) {
    return <FullScreenLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // La validación de roles solo se ejecuta si se ha proporcionado un array 'allowedRoles'.
  if (allowedRoles && !checkUserRole(user?.role, allowedRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <Outlet />;
};

/**
 * Guardián para rutas públicas que no deben ser accesibles si el usuario ya ha iniciado sesión.
 * Por ejemplo, evita que un usuario logueado vea la página de /login.
 */
const PublicRouteGuard = () => {
  const { isAuthenticated, isInitialized } = useAuth();
  
  if (!isInitialized) {
    return <FullScreenLoader />;
  }
  
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
};


// --- SECCIÓN 2: COMPONENTE PRINCIPAL DE RUTAS ---
const AppRoutes = () => {
  return (
    <Routes>
      {/* Grupo 1: Rutas Públicas y de Autenticación */}
      <Route element={<PublicRouteGuard />}>
        <Route path="/" element={<HomePage />} />
        <Route element={<AuthLayout />}>
          <Route path="login" element={<LoginPage />} />
          {/* Aquí irían otras rutas como /register, /forgot-password, etc. */}
        </Route>
      </Route>

      {/* Grupo 2: Rutas Privadas del Dashboard (para todos los roles autenticados) */}
      <Route path="/" element={<PrivateRoutesGuard />}>
        <Route element={<DashboardLayout />}>
          {/* Todas las rutas anidadas aquí usan el DashboardLayout */}
          <Route path="dashboard" element={<DashboardPage />} />
          
          {/* Módulo de Inventario */}
          <Route path="inventario/productos" element={<ProductListPage />} />
          <Route path="inventario/productos/nuevo" element={<NewProductPage />} />
          <Route path="inventario/productos/editar/:sku" element={<EditProductPage />} />
          <Route path="reportes/catalogo" element={<ProductCatalogPage />} />
          
          {/* Módulo de Compras */}
          <Route path="compras/nueva" element={<NewPurchaseOrderPage />} />
          <Route path="compras/ordenes" element={<PurchaseOrderListPage />} />
        </Route>
      </Route>
      
      {/* Grupo 3: Rutas Privadas del Dashboard (SOLO PARA ADMINS) */}
      <Route path="/admin" element={<PrivateRoutesGuard allowedRoles={['superadmin', 'admin']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="usuarios" element={<UserManagementPage />} />
          {/* Aquí irían otras rutas de administración, como /admin/configuracion */}
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
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h3" component="h1" gutterBottom>404 - Página no Encontrada</Typography>
          <Typography>La página que buscas no existe o ha sido movida.</Typography>
        </Box>
      }/>
    </Routes>
  );
};

export default AppRoutes;