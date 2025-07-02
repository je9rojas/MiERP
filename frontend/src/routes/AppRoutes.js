// /frontend/src/routes/AppRoutes.js
import React from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../app/contexts/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import AuthLayout from '../components/layout/AuthLayout';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

// Importaciones directas de páginas
import LoginPage from '../features/auth/pages/LoginPage';
import DashboardPage from '../features/dashboard/pages/DashboardPage';
import HomePage from '../features/home/pages/HomePage';
// --- NUEVA IMPORTACIÓN ---
import UserManagementPage from '../features/admin/pages/UserManagementPage';

console.log('[AppRoutes] Configurando rutas');

// --- COMPONENTE PROTECTEDROUTE MEJORADO ---
// Ahora puede verificar no solo si estás autenticado, sino también tu rol.
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

  // Si se especifica una lista de roles, verifica si el rol del usuario está incluido.
  // Si no se especifica 'allowedRoles', permite el acceso a cualquier usuario autenticado.
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Si el rol no está permitido, redirige al dashboard principal.
    // Podrías crear una página de "Acceso Denegado" para una mejor experiencia.
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

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

      {/* --- ESTRUCTURA DE RUTAS PROTEGIDAS ACTUALIZADA --- */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          {/* Rutas generales del dashboard */}
          <Route path="/dashboard" element={<DashboardPage />} />
          
          {/* --- NUEVA RUTA DE ADMINISTRACIÓN CON PROTECCIÓN POR ROL --- */}
          <Route element={<ProtectedRoute allowedRoles={['superadmin', 'admin']} />}>
            <Route path="/admin/usuarios" element={<UserManagementPage />} />
            {/* Aquí puedes añadir más rutas que solo los administradores puedan ver */}
          </Route>
          
          {/* Aquí irán las otras rutas (ventas, inventario, etc.) */}
        </Route>
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;