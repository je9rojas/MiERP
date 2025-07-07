// /frontend/src/routes/AppRoutes.js
// CÓDIGO COMPLETO Y REESTRUCTURADO FINAL - LISTO PARA COPIAR Y PEGAR

import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
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

// --- COMPONENTE GUARDIÁN DE RUTAS ---
// Este componente decide si el usuario puede ver la página solicitada o si debe ser redirigido.
const PrivateRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Si no está autenticado, siempre redirige a /login, guardando la ruta que intentaba visitar.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Si está autenticado pero no tiene el rol, redirige a /unauthorized.
    return <Navigate to="/unauthorized" replace />;
  }

  // Si está autenticado y tiene el rol (o no se requieren roles), muestra el contenido.
  return children;
};

const AppRoutes = () => {
  const { isInitialized, isAuthenticated } = useAuth();
  
  if (!isInitialized) {
    return <AuthLoader />;
  }

  return (
    <Routes>
      {/* --- RUTA PÚBLICA --- */}
      <Route path="/" element={<HomePage />} />
      
      {/* --- RUTA DE LOGIN --- */}
      {/* Si el usuario ya está autenticado, redirige al dashboard. Si no, muestra LoginPage. */}
      <Route 
        path="/login" 
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthLayout><LoginPage /></AuthLayout>
        } 
      />

      {/* --- RUTAS PRIVADAS (PROTEGIDAS) --- */}
      {/* Todas estas rutas requieren autenticación. El componente PrivateRoute se encarga de ello. */}
      <Route 
        path="/dashboard"
        element={<PrivateRoute><DashboardLayout><DashboardPage /></DashboardLayout></PrivateRoute>}
      />
      <Route 
        path="/compras/nueva" 
        element={
          <PrivateRoute allowedRoles={['superadmin', 'admin', 'manager', 'almacenero']}>
            <DashboardLayout><NewPurchaseOrderPage /></DashboardLayout>
          </PrivateRoute>
        } 
      />
      <Route 
        path="/reportes/catalogo"
        element={
          <PrivateRoute allowedRoles={['superadmin', 'admin', 'manager', 'vendedor']}>
            <DashboardLayout><ProductCatalogPage /></DashboardLayout>
          </PrivateRoute>
        }
      />
      <Route 
        path="/admin/usuarios"
        element={
          <PrivateRoute allowedRoles={['superadmin', 'admin']}>
            <DashboardLayout><UserManagementPage /></DashboardLayout>
          </PrivateRoute>
        }
      />
      
      {/* --- RUTAS DE FALLBACK --- */}
      <Route path="/unauthorized" element={<h1>403 - No Autorizado</h1>} />
      <Route path="*" element={<h1>404 - Página no encontrada</h1>} />
    </Routes>
  );
};

export default AppRoutes;