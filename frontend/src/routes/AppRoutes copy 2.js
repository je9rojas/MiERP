// /frontend/src/routes/AppRoutes.js

/**
 * @file Gestor principal de rutas de la aplicación.
 * Utiliza carga perezosa (lazy loading) con React.Suspense para optimizar el rendimiento,
 * descargando el código de cada página solo cuando es necesario.
 * Implementa Route Guards para proteger las rutas basadas en la autenticación y los roles de usuario.
 */

// --- SECCIÓN 1: IMPORTACIONES ---
import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../app/contexts/AuthContext';
import { checkUserRole } from '../utils/auth/roles'; // Se asume la existencia de esta función de ayuda.
import { Box, CircularProgress, Typography } from '@mui/material';

// --- 1.1: Layouts y Componentes de Apoyo (Carga Estática) ---
import DashboardLayout from '../components/layout/DashboardLayout';
import AuthLayout from '../components/layout/AuthLayout';

const FullScreenLoader = () => (
  <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100vh">
    <CircularProgress size={50} />
    <Typography sx={{ mt: 2 }}>Cargando...</Typography>
  </Box>
);

// --- 1.2: Importaciones Dinámicas de Páginas (Lazy Loading) ---
const HomePage = lazy(() => import('../features/home/pages/HomePage'));
const LoginPage = lazy(() => import('../features/auth/pages/LoginPage'));
const DashboardPage = lazy(() => import('../features/dashboard/pages/DashboardPage'));

// Páginas de Inventario
const ProductListPage = lazy(() => import('../features/inventory/pages/ProductListPage'));
const NewProductPage = lazy(() => import('../features/inventory/pages/NewProductPage'));
const EditProductPage = lazy(() => import('../features/inventory/pages/EditProductPage'));
const ProductCatalogPage = lazy(() => import('../features/inventory/pages/ProductCatalogPage'));

// Páginas de Compras (CORRECCIÓN Y ADICIONES)
const PurchaseOrderListPage = lazy(() => import('../features/purchasing/pages/PurchaseOrderListPage'));
const CreatePurchaseOrderPage = lazy(() => import('../features/purchasing/pages/CreatePurchaseOrderPage')); // Nombre estandarizado
const PurchaseOrderDetailPage = lazy(() => import('../features/purchasing/pages/PurchaseOrderDetailPage')); // Ruta esencial añadida
const EditPurchaseOrderPage = lazy(() => import('../features/purchasing/pages/EditPurchaseOrderPage')); // Ruta esencial añadida

// Páginas de Administración
const UserManagementPage = lazy(() => import('../features/admin/pages/UserManagementPage'));
const DataManagementPage = lazy(() => import('../features/admin/pages/DataManagementPage'));


// --- SECCIÓN 2: COMPONENTES GUARDIANES DE RUTAS (Route Guards) ---

const PrivateRoutesGuard = ({ allowedRoles }) => {
  const { isAuthenticated, user, isInitialized } = useAuth();
  const location = useLocation();

  if (!isInitialized) {
    return <FullScreenLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se asume que checkUserRole maneja el caso de 'superadmin' dándole acceso a todo.
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


// --- SECCIÓN 3: COMPONENTE PRINCIPAL DE RUTAS ---

const AppRoutes = () => {
  return (
    <Suspense fallback={<FullScreenLoader />}>
      <Routes>
        {/* --- Grupo de Rutas Públicas y de Autenticación --- */}
        <Route element={<PublicRouteGuard />}>
          <Route path="/" element={<HomePage />} />
          <Route element={<AuthLayout />}>
            <Route path="login" element={<LoginPage />} />
          </Route>
        </Route>

        {/* --- Grupo de Rutas Privadas del Dashboard --- */}
        <Route element={<PrivateRoutesGuard />}>
          <Route element={<DashboardLayout />}>
            {/* Rutas Generales */}
            <Route path="dashboard" element={<DashboardPage />} />

            {/* Rutas del Módulo de Inventario */}
            <Route path="inventario/productos" element={<ProductListPage />} />
            <Route path="inventario/productos/nuevo" element={<NewProductPage />} />
            <Route path="inventario/productos/editar/:sku" element={<EditProductPage />} />
            
            {/* Rutas del Módulo de Compras (CORREGIDO Y COMPLETADO) */}
            <Route path="compras/ordenes" element={<PurchaseOrderListPage />} />
            <Route path="compras/ordenes/nueva" element={<CreatePurchaseOrderPage />} />
            <Route path="compras/ordenes/detalle/:id" element={<PurchaseOrderDetailPage />} />
            <Route path="compras/ordenes/editar/:id" element={<EditPurchaseOrderPage />} />

            {/* Rutas del Módulo de Reportes */}
            <Route path="reportes/catalogo" element={<ProductCatalogPage />} />
            
            {/* Rutas del Módulo de Administración (Protegidas por Rol) */}

            <Route element={<PrivateRoutesGuard allowedRoles={['superadmin', 'admin']} />}>
              <Route element={<DashboardLayout />}>
                {/* Todas las rutas anidadas aquí adentro heredarán la protección de roles */}
                <Route path="admin/usuarios" element={<UserManagementPage />} />
                <Route path="admin/gestion-datos" element={<DataManagementPage />} />
                {/* Si añades más rutas de admin, simplemente las pones aquí */}
              </Route>
            </Route>

          </Route>
        </Route>

        
        {/* --- Grupo de Rutas de Fallback y Error --- */}
        <Route path="/unauthorized" element={
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h3" component="h1" gutterBottom>403 - Acceso Denegado</Typography>
            <Typography>No tienes los permisos necesarios para ver esta página.</Typography>
          </Box>
        }/>
        <Route path="*" element={
          <Box p={4} textAlign="center">
            <Typography variant="h3" component="h1" gutterBottom>404 - Página no Encontrada</Typography>
            <Typography>La página que buscas no existe o ha sido movida.</Typography>
          </Box>
        }/>
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;