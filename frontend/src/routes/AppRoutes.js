// /frontend/src/routes/AppRoutes.js
// CÓDIGO FINAL CON RUTAS DE PRODUCTOS Y ESTRUCTURA OPTIMIZADA

import React from 'react';
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../app/contexts/AuthContext';
import { checkUserRole } from '../utils/auth/roles';

// --- Layouts Principales ---
import DashboardLayout from '../components/layout/DashboardLayout';
import AuthLayout from '../components/layout/AuthLayout';

// --- Componentes de Apoyo para UI y Rutas ---
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

// --- Importaciones de Páginas de la Aplicación ---
// (Asegúrate de crear los nuevos archivos ProductListPage y NewProductPage)
import HomePage from '../features/home/pages/HomePage';
import LoginPage from '../features/auth/pages/LoginPage';
import DashboardPage from '../features/dashboard/pages/DashboardPage';
import UserManagementPage from '../features/admin/pages/UserManagementPage';
import ProductCatalogPage from '../features/inventory/pages/ProductCatalogPage';
import ProductListPage from '../features/inventory/pages/ProductListPage'; // <-- NUEVA PÁGINA
import NewProductPage from '../features/inventory/pages/NewProductPage';   // <-- NUEVA PÁGINA
import NewPurchaseOrderPage from '../features/purchasing/pages/NewPurchaseOrderPage';
import PurchaseOrderListPage from '../features/purchasing/pages/PurchaseOrderListPage';
import EditProductPage from '../features/inventory/pages/EditProductPage';


// --- Componentes Guardianes para la Lógica de Rutas ---

const FullScreenLoader = () => (
  <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
    <CircularProgress size={60} />
  </Box>
);

const PrivateRoutesGuard = ({ allowedRoles }) => {
  const { isAuthenticated, user, isInitialized } = useAuth();
  const location = useLocation();

  if (!isInitialized) {
    return <FullScreenLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !checkUserRole(user?.role, allowedRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

const PublicRouteGuard = () => {
  const { isAuthenticated, isInitialized } = useAuth();

  if (!isInitialized) {
    return <FullScreenLoader />;
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
};


// --- Componente Principal de Rutas con Estructura Modular ---
const AppRoutes = () => {
  return (
    <Routes>
      {/* RUTA PÚBLICA DE ATERRIZAJE */}
      <Route path="/" element={<HomePage />} />
      
      {/* GRUPO DE RUTAS DE AUTENTICACIÓN */}
      <Route element={<PublicRouteGuard />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>
      </Route>

      {/* --- GRUPO DE RUTAS PROTEGIDAS - ROL GENERAL (Cualquier usuario autenticado) --- */}
      {/* Todas las rutas aquí dentro requieren que el usuario haya iniciado sesión */}
      <Route element={<PrivateRoutesGuard />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          
          {/* Rutas de Inventario */}
          <Route path="/inventario/productos" element={<ProductListPage />} />
          <Route path="/inventario/productos/nuevo" element={<NewProductPage />} />
          <Route path="/inventario/productos/editar/:sku" element={<EditProductPage />} />
          <Route path="/reportes/catalogo" element={<ProductCatalogPage />} />

          {/* Rutas de Compras */}
          <Route path="/compras/nueva" element={<NewPurchaseOrderPage />} />
          <Route path="/compras/ordenes" element={<PurchaseOrderListPage />} />
        </Route>
      </Route>

      {/* --- GRUPO DE RUTAS PROTEGIDAS - SOLO ADMINISTRADORES --- */}
      {/* Todas las rutas aquí dentro requieren que el usuario tenga rol 'superadmin' o 'admin' */}
      <Route element={<PrivateRoutesGuard allowedRoles={['superadmin', 'admin']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin/usuarios" element={<UserManagementPage />} />
          {/* Aquí podrías añadir más rutas exclusivas para administradores, como /admin/configuracion */}
        </Route>
      </Route>
      
      {/* RUTAS DE FALLBACK (Error) */}
      <Route path="/unauthorized" element={
        <Box p={4} textAlign="center">
          <Typography variant="h3" component="h1" gutterBottom>403 - No Autorizado</Typography>
          <Typography>No tienes los permisos necesarios para acceder a esta página.</Typography>
        </Box>
      }/>
      <Route path="*" element={
        <Box p={4} textAlign="center">
          <Typography variant="h3" component="h1" gutterBottom>404 - Página no Encontrada</Typography>
          <Typography>La página que buscas no existe o ha sido movida.</Typography>
        </Box>
      }/>
    </Routes>
  );
};

export default AppRoutes;