// /frontend/src/routes/AppRoutes.js
// CÓDIGO COMPLETO Y CORREGIDO - LISTO PARA COPIAR Y PEGAR

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
// --- NUEVA IMPORTACIÓN PARA LA PÁGINA DE COMPRAS ---
import NewPurchaseOrderPage from '../features/purchasing/pages/NewPurchaseOrderPage'; 

console.log('[AppRoutes] Configurando rutas');

// --- COMPONENTE PROTECTEDROUTE (sin cambios) ---
const ProtectedRoute = ({ allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Se añade una verificación para 'user.role' para evitar errores si user es null temporalmente
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

// --- COMPONENTE PUBLICROUTE (sin cambios) ---
const PublicRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress size={60} />
      </Box>
    );
  }
  return !isAuthenticated ? <Outlet /> : <Navigate to="/dashboard" replace />;
};

const AppRoutes = () => {
  const location = useLocation();
  console.log('[AppRoutes] Ruta actual:', location.pathname);
  
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      <Route element={<PublicRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>
      </Route>

      {/* --- ESTRUCTURA DE RUTAS PROTEGIDAS --- */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          {/* Rutas generales */}
          <Route path="/dashboard" element={<DashboardPage />} />
          
          {/* --- NUEVA RUTA DE COMPRAS --- */}
          {/* Añadimos protección de roles. Solo ciertos usuarios pueden registrar compras. */}
          <Route 
            path="/compras/nueva" 
            element={
              <ProtectedRoute allowedRoles={['superadmin', 'admin', 'manager', 'almacenero']}>
                <NewPurchaseOrderPage />
              </ProtectedRoute>
            } 
          />
          {/* Aquí irán otras rutas de compras como /compras/listado */}

          {/* Ruta de reportes */}
          <Route 
            path="/reportes/catalogo" 
            element={
              <ProtectedRoute allowedRoles={['superadmin', 'admin', 'manager', 'vendedor']}>
                <ProductCatalogPage />
              </ProtectedRoute>
            }
          />

          {/* Ruta de administración */}
          <Route element={<ProtectedRoute allowedRoles={['superadmin', 'admin']} />}>
            <Route path="/admin/usuarios" element={<UserManagementPage />} />
          </Route>
          
        </Route>
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;