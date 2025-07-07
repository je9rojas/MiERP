// /frontend/src/routes/AppRoutes.js
// CÓDIGO COMPLETO Y CORREGIDO FINAL - LISTO PARA COPIAR Y PEGAR

import React from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
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

// --- COMPONENTE PROTEGIDO MEJORADO ---
// Ahora no renderiza un <Outlet>, sino directamente el componente hijo.
// Esto simplifica la estructura de rutas.
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />; // Es mejor tener una página de "No Autorizado"
  }

  return children; // Renderiza directamente el componente que se le pasa
};

const PublicRoute = () => {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? <Outlet /> : <Navigate to="/dashboard" replace />;
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

      {/* --- RUTAS DE AUTENTICACIÓN (SOLO PARA NO LOGUEADOS) --- */}
      <Route element={<PublicRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>
      </Route>

      {/* --- RUTAS PROTEGIDAS DENTRO DEL DASHBOARD --- */}
      {/* 
        El DashboardLayout ahora envuelve un <Outlet /> que será reemplazado
        por el contenido de cada una de las rutas hijas protegidas.
      */}
      <Route path="/" element={<DashboardLayout />}>
        <Route 
          path="dashboard"
          element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} 
        />
        <Route 
          path="compras/nueva"
          element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'manager', 'almacenero']}>
              <NewPurchaseOrderPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="reportes/catalogo"
          element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'manager', 'vendedor']}>
              <ProductCatalogPage />
            </ProtectedRoute>
          }
        />
        <Route 
          path="admin/usuarios"
          element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
              <UserManagementPage />
            </ProtectedRoute>
          }
        />
        {/* Aquí puedes añadir más rutas protegidas... */}
      </Route>
      
      {/* --- RUTAS DE FALLBACK --- */}
      <Route path="/unauthorized" element={<h1>403 - No tienes permiso para ver esta página</h1>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;