// /frontend/src/routes/AppRoutes.js
// CÓDIGO COMPLETO, CORREGIDO Y REESTRUCTURADO - LISTO PARA COPIAR Y PEGAR

import React from 'react';
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../app/contexts/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import AuthLayout from '../components/layout/AuthLayout';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

// Importaciones de páginas
import LoginPage from '../features/auth/pages/LoginPage';
import DashboardPage from '../features/dashboard/pages/DashboardPage';
import HomePage from '../features/home/pages/HomePage';
import UserManagementPage from '../features/admin/pages/UserManagementPage';
import ProductCatalogPage from '../features/inventory/pages/ProductCatalogPage';
import NewPurchaseOrderPage from '../features/purchasing/pages/NewPurchaseOrderPage';

// --- COMPONENTE DE CARGA INICIAL (sin cambios) ---
const AuthLoader = () => (
  <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
    <CircularProgress size={60} />
  </Box>
);

// --- COMPONENTE GUARDIÁN DE RUTAS PRIVADAS ---
// Su única responsabilidad es verificar si el usuario está autenticado.
// Si no lo está, lo redirige al login. Si lo está, permite el paso.
const PrivateRouteGuard = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si está autenticado, renderiza el Outlet, que contendrá el DashboardLayout y sus rutas hijas.
  return <Outlet />;
};

// --- COMPONENTE PARA PROTEGER UNA RUTA ESPECÍFICA POR ROL ---
const RoleBasedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

const AppRoutes = () => {
  const { isInitialized } = useAuth();
  
  if (!isInitialized) {
    return <AuthLoader />;
  }

  return (
    <Routes>
      {/* --- RUTA DE INICIO PÚBLICA --- */}
      <Route path="/" element={<HomePage />} />
      
      {/* --- RUTA DE LOGIN (PÚBLICA) --- */}
      {/* Si un usuario ya logueado intenta ir a /login, será redirigido por el propio LoginPage o el contexto */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* --- GRUPO DE RUTAS PROTEGIDAS --- */}
      {/* Todas las rutas anidadas aquí requieren que el usuario esté autenticado */}
      <Route element={<PrivateRouteGuard />}>
        <Route element={<DashboardLayout />}>
          {/* La ruta por defecto dentro del dashboard */}
          <Route path="/dashboard" element={<DashboardPage />} />
          
          <Route 
            path="/compras/nueva" 
            element={
              <RoleBasedRoute allowedRoles={['superadmin', 'admin', 'manager', 'almacenero']}>
                <NewPurchaseOrderPage />
              </RoleBasedRoute>
            } 
          />
          <Route 
            path="/reportes/catalogo"
            element={
              <RoleBasedRoute allowedRoles={['superadmin', 'admin', 'manager', 'vendedor']}>
                <ProductCatalogPage />
              </RoleBasedRoute>
            }
          />
          <Route 
            path="/admin/usuarios"
            element={
              <RoleBasedRoute allowedRoles={['superadmin', 'admin']}>
                <UserManagementPage />
              </RoleBasedRoute>
            }
          />
        </Route>
      </Route>
      
      {/* --- RUTAS DE FALLBACK --- */}
      <Route path="/unauthorized" element={<h1>403 - No Autorizado</h1>} />
      <Route path="*" element={<h1>404 - Página no encontrada</h1>} />
    </Routes>
  );
};

export default AppRoutes;