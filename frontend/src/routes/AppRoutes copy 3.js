// /frontend/src/routes/AppRoutes.js
// CÓDIGO COMPLETO, CORREGIDO Y OPTIMIZADO - LISTO PARA COPIAR Y PEGAR

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

// --- COMPONENTE DE CARGA INICIAL ---
// Este componente se mostrará solo una vez mientras la app verifica el token.
const AuthLoader = () => (
  <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
    <CircularProgress size={60} />
  </Box>
);

// --- COMPONENTES DE RUTA (sin 'isLoading') ---
const ProtectedRoute = ({ allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Si el rol no está permitido, redirige al dashboard principal.
    return <Navigate to="/dashboard" replace />;
  }

  // Outlet renderiza los componentes hijos de la ruta (las páginas)
  return <Outlet />;
};

const PublicRoute = () => {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? <Outlet /> : <Navigate to="/dashboard" replace />;
};


const AppRoutes = () => {
  // Obtenemos el nuevo estado 'isInitialized' del contexto.
  const { isInitialized } = useAuth();
  const location = useLocation();
  
  console.log('[AppRoutes] Ruta actual:', location.pathname);

  // --- LÓGICA DE RENDERIZADO PRINCIPAL ---
  // Si la autenticación aún no se ha verificado, mostramos el loader global.
  // Esto previene que las rutas intenten redirigir prematuramente.
  if (!isInitialized) {
    return <AuthLoader />;
  }

  // Una vez inicializado, renderizamos el árbol de rutas completo.
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      <Route element={<PublicRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          {/* Todas tus rutas protegidas van aquí */}
          <Route path="/dashboard" element={<DashboardPage />} />
          
          <Route 
            path="/compras/nueva" 
            element={
              <ProtectedRoute allowedRoles={['superadmin', 'admin', 'manager', 'almacenero']}>
                <NewPurchaseOrderPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/reportes/catalogo" 
            element={
              <ProtectedRoute allowedRoles={['superadmin', 'admin', 'manager', 'vendedor']}>
                <ProductCatalogPage />
              </ProtectedRoute>
            }
          />

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