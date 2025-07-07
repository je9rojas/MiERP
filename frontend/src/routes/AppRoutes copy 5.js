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

// --- NUEVA ESTRUCTURA DE RUTAS ---

// Layout para Rutas Públicas: solo renderiza si NO estás autenticado.
// Si lo estás, te redirige al dashboard.
const PublicLayout = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (isAuthenticated) {
    // Redirige al dashboard si un usuario logueado intenta acceder a /login.
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }

  // Si no está autenticado, permite el paso al Outlet (que contendrá LoginPage).
  return <Outlet />;
};

// Layout para Rutas Privadas: solo renderiza si SÍ estás autenticado.
// Si no lo estás, te redirige al login.
const PrivateLayout = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si está autenticado, permite el paso al DashboardLayout.
  return <DashboardLayout />;
};

// Componente para proteger una ruta específica por ROL
const RoleBasedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Si el rol no está permitido, redirige a una página de no autorizado.
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
      {/* --- RUTAS PÚBLICAS --- */}
      <Route path="/" element={<HomePage />} />
      <Route element={<PublicLayout />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>
      </Route>

      {/* --- RUTAS PRIVADAS (PROTEGIDAS) --- */}
      {/* Todas las rutas aquí dentro requieren autenticación */}
      <Route element={<PrivateLayout />}>
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
        {/* Añade más rutas privadas aquí */}
      </Route>
      
      {/* --- RUTAS DE FALLBACK --- */}
      <Route path="/unauthorized" element={<h1>403 - No Autorizado</h1>} />
      <Route path="*" element={<h1>404 - Página no encontrada</h1>} />
    </Routes>
  );
};

export default AppRoutes;