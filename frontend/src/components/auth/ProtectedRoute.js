// frontend/src/components/auth/ProtectedRoute.js

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
// import { useSelector } from 'react-redux'; // <-- ELIMINA ESTO
import { useAuth } from '../../app/contexts/AuthContext'; // <-- IMPORTA TU HOOK
import { checkUserRole } from '../../utils/auth/roles';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, isLoading } = useAuth(); // <-- USA EL CONTEXTO
  const location = useLocation();

  // Muestra una pantalla de carga mientras se verifica la autenticación inicial
  if (isLoading) {
    return <div>Cargando...</div>; // O un spinner/componente de carga
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !checkUserRole(user?.role, allowedRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;