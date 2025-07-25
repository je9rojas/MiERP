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
import { checkUserRole } from '../utils/auth/roles';
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

const ProductListPage = lazy(() => import('../features/inventory/pages/ProductListPage'));
const NewProductPage = lazy(() => import('../features/inventory/pages/NewProductPage'));
const EditProductPage = lazy(() => import('../features/inventory/pages/EditProductPage'));
const ProductCatalogPage = lazy(() => import('../features/inventory/pages/ProductCatalogPage'));

const PurchaseOrderListPage = lazy(() => import('../features/purchasing/pages/PurchaseOrderListPage'));
const CreatePurchaseOrderPage = lazy(() => import('../features/purchasing/pages/CreatePurchaseOrderPage'));
const PurchaseOrderDetailPage = lazy(() => import('../features/purchasing/pages/PurchaseOrderDetailPage'));
const EditPurchaseOrderPage = lazy(() => import('../features/purchasing/pages/EditPurchaseOrderPage'));

const UserManagementPage = lazy(() => import('../features/admin/pages/UserManagementPage'));
const DataManagementPage = lazy(() => import('../features/admin/pages/DataManagementPage'));


const NewSupplierPage = lazy(() => import('../features/crm/pages/NewSupplierPage'));
const SupplierListPage = lazy(() => import('../features/crm/pages/SupplierListPage'));

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

  // Aquí se utiliza la función de ayuda que ya sabe que 'superadmin' tiene acceso a todo.
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


// --- SECCIÓN 3: COMPONENTE PRINCIPAL DE RUTAS (CORREGIDO) ---

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

        {/* --- ¡ESTRUCTURA CORREGIDA PARA TODAS LAS RUTAS PRIVADAS! --- */}
        {/* Un único Guardián de Autenticación y un único Layout para todas las rutas del dashboard. */}
        <Route element={<PrivateRoutesGuard />}>
          <Route path="/" element={<DashboardLayout />}>
            {/* Rutas Generales (accesibles para cualquier rol logueado) */}
            <Route path="dashboard" element={<DashboardPage />} />

            {/* --- RUTAS NUEVAS PARA CRM --- */}
            <Route path="crm/proveedores/nuevo" element={<NewSupplierPage />} />
            <Route path="crm/proveedores" element={<SupplierListPage />} />
            {/* ----------------------------- */}

            {/* Rutas del Módulo de Inventario */}
            <Route path="inventario/productos" element={<ProductListPage />} />
            <Route path="inventario/productos/nuevo" element={<NewProductPage />} />
            <Route path="inventario/productos/editar/:sku" element={<EditProductPage />} />
            
            {/* Rutas del Módulo de Compras */}
            <Route path="compras/ordenes" element={<PurchaseOrderListPage />} />
            <Route path="compras/ordenes/nueva" element={<CreatePurchaseOrderPage />} />
            <Route path="compras/ordenes/detalle/:id" element={<PurchaseOrderDetailPage />} />
            <Route path="compras/ordenes/editar/:id" element={<EditPurchaseOrderPage />} />

            {/* Rutas del Módulo de Reportes */}
            <Route path="reportes/catalogo" element={<ProductCatalogPage />} />
            
            {/* Rutas del Módulo de Administración (con su propia protección de roles anidada) */}
            <Route element={<PrivateRoutesGuard allowedRoles={['superadmin', 'admin']} />}>
              <Route path="admin/usuarios" element={<UserManagementPage />} />
              <Route path="admin/gestion-datos" element={<DataManagementPage />} />
              {/* Si añades más rutas de admin, simplemente las pones aquí */}
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