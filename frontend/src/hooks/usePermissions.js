// /frontend/src/hooks/usePermissions.js

/**
 * @file Hook personalizado que centraliza y simplifica la lógica de verificación de permisos.
 * Abstrae la necesidad de acceder directamente al contexto de autenticación y a la
 * función 'hasPermission' en cada componente que requiere una comprobación de roles.
 */

import { useAuth } from '../app/contexts/AuthContext';
import { hasPermission as checkPermission } from '../constants/rolesAndPermissions';

/**
 * Proporciona un conjunto de herramientas para verificar los permisos del usuario actual.
 * 
 * @param {string[]} allowedRoles - Un array de constantes de roles (ej. CAN_CRUD_PURCHASE_ORDERS).
 * @returns {object} Un objeto que contiene:
 *  - `user`: El objeto completo del usuario autenticado.
 *  - `hasPermission`: Una función que toma un array de roles y devuelve true/false.
 *  - Banderas de conveniencia como `isSuperAdmin`, `isAdmin`, etc.
 */
export const usePermissions = () => {
  const { user } = useAuth();
  const userRole = user?.role;

  /**
   * Verifica si el rol del usuario actual está incluido en una lista de roles permitidos.
   * La lógica real (incluyendo el acceso universal del superadmin) está delegada
   * a la función 'checkPermission' centralizada.
   * 
   * @param {string[]} allowedRoles - El array de roles a verificar.
   * @returns {boolean} - True si el usuario tiene permiso, false en caso contrario.
   */
  const hasPermission = (allowedRoles) => {
    return checkPermission(allowedRoles, userRole);
  };

  return {
    user,
    userRole,
    hasPermission,
    // Puedes añadir más helpers aquí para los roles más comunes
    isSuperAdmin: userRole === 'superadmin',
    isAdmin: userRole === 'admin',
  };
};