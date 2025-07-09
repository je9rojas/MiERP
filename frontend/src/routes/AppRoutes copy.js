// /frontend/src/routes/AppRoutes.js
// CÓDIGO CORREGIDO Y OPTIMIZADO - LISTO PARA COPIAR Y PEGAR

import React from 'react';
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../app/contexts/AuthContext';
import { checkUserRole } from '../utils/auth/roles'; // Asegúrate de que este archivo exista y la función sea correcta

// Layouts
import DashboardLayout from '../components/layout/DashboardLayout';
import AuthLayout from '../components/layout/AuthLayout';

// Componentes UI
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';


// --- Importaciones de Páginas ---
import LoginPage from '../features/auth/pages/LoginPage';
import DashboardPage from '../features/dashboard/pages/DashboardPage';
import HomePage from '../features/home/pages/HomePage';
import UserManagementPage from '../features/admin/pages/UserManagementPage';
import ProductCatalogPage from '../features/inventory/pages/ProductCatalogPage';
import NewPurchaseOrderPage from '../features/purchasing/pages/NewPurchaseOrderPage';
import PurchaseOrderListPage from '../features/purchasing/pages/PurchaseOrderListPage';


// --- Componentes de Apoyo para Rutas ---

// 1. Componente de Carga a Pantalla Completa
const FullScreenLoader = () => (
  <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
    <CircularProgress size={60} />
  </Box>
);

// 2. Guardián de Rutas Privadas: UNIFICADO Y ÚNICO
const PrivateRoutesGuard = ({ allowedRoles }) => {
  const { isAuthenticated, user, isInitialized } = useAuth();
  const location = useLocation();

  // Muestra el loader SÓLO si el contexto no ha terminado de verificar el token inicial.
  // Esto previene el "parpadeo" y la redirección prematura a /login.
  if (!isInitialized) {
    return <FullScreenLoader />;
  }

  // Si ya se inicializó y el usuario NO está autenticado, se le redirige a /login.
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si la ruta requiere roles específicos y el usuario no los cumple, se le redirige a /unauthorized.
  // La función `checkUserRole` debería existir en tus utils, si no, puedes usar `allowedRoles.includes(user?.role)`
  if (allowedRoles && !checkUserRole(user?.role, allowedRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Si todas las validaciones son correctas, <Outlet /> renderiza la ruta hija correspondiente.
  return <Outlet />;
};

// 3. Guardián para Rutas Públicas (ej. /login)
// Evita que un usuario ya logueado acceda a la página de login.
const PublicRouteGuard = () => {
  const { isAuthenticated, isInitialized } = useAuth();

  if (!isInitialized) {
    return <FullScreenLoader />;
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
};


// --- Componente Principal de Rutas: ESTRUCTURA CORREGIDA ---
const AppRoutes = () => {
  return (
    <Routes>
      {/* RUTA PÚBLICA PRINCIPAL */}
      <Route path="/" element={<HomePage />} />
      
      {/* GRUPO DE RUTAS DE AUTENTICACIÓN (LOGIN, REGISTER, ETC.) */}
      <Route element={<PublicRouteGuard />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          {/* Aquí podrías agregar /register, /forgot-password, etc. */}
        </Route>
      </Route>

      {/* --- GRUPO DE RUTAS PRIVADAS --- */}
      {/* Todas las rutas aquí dentro estarán protegidas por PrivateRoutesGuard */}
      <Route element={<PrivateRoutesGuard />}>
        {/* Todas las rutas protegidas usarán el DashboardLayout */}
        <Route element={<DashboardLayout />}>
          {/* Rutas que solo requieren estar autenticado */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/compras/nueva" element={<NewPurchaseOrderPage />} />
          <Route path="/compras/ordenes" element={<PurchaseOrderListPage />} />
          <Route path="/reportes/catalogo" element={<ProductCatalogPage />} />
          
          {/* Si una ruta dentro de este layout requiere un rol específico, la envolvemos
              en OTRO guardián que verifique el rol. Esta es una forma de anidar protecciones.
              Aunque para mayor claridad, a menudo es mejor crear grupos separados.
              Por simplicidad, lo dejamos así para demostrar el concepto.
          */}
          <Route element={<PrivateRoutesGuard allowedRoles={['superadmin', 'admin']} />}>
             <Route path="/admin/usuarios" element={<UserManagementPage />} />
          </Route>

        </Route>
      </Route>
      
      {/* RUTAS DE FALLBACK (Error) */}
      <Route path="/unauthorized" element={
        <Box p={4} textAlign="center">
          <Typography variant="h3">403 - No Autorizado</Typography>
          <Typography>No tienes los permisos necesarios para acceder a esta página.</Typography>
        </Box>
      }/>
      <Route path="*" element={
        <Box p={4} textAlign="center">
          <Typography variant="h3">404 - Página no Encontrada</Typography>
          <Typography>La página que buscas no existe.</Typography>
        </Box>
      }/>
    </Routes>
  );
};

export default AppRoutes;