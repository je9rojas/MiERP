import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { checkUserRole } from '../../utils/auth/roles';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !checkUserRole(user.role, allowedRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;