// /frontend/src/routes/AppRoutes.js
// CÓDIGO FINAL CON LÓGICA DE CARGA CENTRALIZADA - LISTO PARA COPIAR Y PEGAR

import React from 'react';
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../app/contexts/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import AuthLayout from '../components/layout/AuthLayout';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

// Importaciones de páginas (asegúrate de que todas tus páginas estén aquí)
import LoginPage from '../features/auth/pages/LoginPage';
import DashboardPage from '../features/dashboard/pages/DashboardPage';
import HomePage from '../features/home/pages/HomePage';
import UserManagementPage from '../features/admin/pages/UserManagementPage';
import ProductCatalogPage from '../features/inventory/pages/ProductCatalogPage';
import NewPurchaseOrderPage from '../features/purchasing/pages/NewPurchaseOrderPage';
import PurchaseOrderListPage from '../features/purchasing/pages/PurchaseOrderListPage';

// Componente de carga a pantalla completa
const FullScreenLoader = () => (
  <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
    <CircularProgress size={60} />
  </Box>
);

// --- MODIFICACIÓN CLAVE: PrivateRoute ahora maneja el estado de carga ---
const PrivateRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  // Si la autenticación todavía se está verificando, muestra el loader a pantalla completa.
  if (isLoading) {
    return <FullScreenLoader />;
  }

  // Si terminó de cargar y no está autenticado, redirige a /login.
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si está autenticado pero no tiene el rol necesario, redirige a no autorizado.
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Si todo está correcto, renderiza el contenido solicitado.
  return children;
};

// Componente para rutas públicas (sin cambios)
const PublicRouteGuard = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
};

const AppRoutes = () => {
  const { isInitialized } = useAuth();
  
  // Muestra el loader mientras el contexto de autenticación se inicializa por primera vez.
  if (!isInitialized) {
    return <FullScreenLoader />;
  }

  return (
    <Routes>
      {/* RUTA PÚBLICA PRINCIPAL */}
      <Route path="/" element={<HomePage />} />
      
      {/* GRUPO DE RUTAS DE AUTENTICACIÓN */}
      <Route element={<PublicRouteGuard />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>
      </Route>

      {/* GRUPO DE RUTAS PRIVADAS (PROTEGIDAS) */}
      <Route 
        element={
          <PrivateRoute>
            <DashboardLayout /> 
          </PrivateRoute>
        }
      >
        {/* Las páginas hijas ahora se renderizan sin preocuparse por el estado de carga */}
        <Route path="/dashboard" element={<DashboardPage />} />
        
        <Route 
          path="/compras/nueva" 
          element={
            <PrivateRoute allowedRoles={['superadmin', 'admin', 'manager', 'almacenero']}>
              <NewPurchaseOrderPage />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/compras/ordenes"
          element={
            <PrivateRoute allowedRoles={['superadmin', 'admin', 'manager', 'almacenero', 'vendedor']}>
              <PurchaseOrderListPage />
            </PrivateRoute>
          }
        />
        <Route 
          path="/reportes/catalogo"
          element={
            <PrivateRoute allowedRoles={['superadmin', 'admin', 'manager', 'vendedor']}>
              <ProductCatalogPage />
            </PrivateRoute>
          }
        />
        <Route 
          path="/admin/usuarios"
          element={
            <PrivateRoute allowedRoles={['superadmin', 'admin']}>
              <UserManagementPage />
            </PrivateRoute>
          }
        />
      </Route>
      
      {/* RUTAS DE FALLBACK (Error) */}
      <Route path="/unauthorized" element={<h1>403 - No Autorizado</h1>} />
      <Route path="*" element={<h1>404 - Página no encontrada</h1>} />
    </Routes>
  );
};

export default AppRoutes;