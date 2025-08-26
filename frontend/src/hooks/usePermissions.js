// File: /frontend/src/hooks/usePermissions.js

/**
 * @file Hook personalizado que centraliza y simplifica la lógica de verificación de permisos.
 * @description Abstrae la necesidad de acceder directamente al contexto de autenticación y a la
 * función 'hasPermission' en cada componente que requiere una comprobación de roles.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import { useAuth } from '../app/contexts/AuthContext';
import { hasPermission as checkUserPermission } from '../utils/auth/roles'; // Importar con alias

// ==============================================================================
// SECCIÓN 2: DEFINICIÓN DEL HOOK
// ==============================================================================

/**
 * Proporciona un conjunto de herramientas para verificar los permisos del usuario actual.
 * 
 * @returns {{
 *  user: object | null,
 *  userRole: string | undefined,
 *  hasPermission: (requiredPermission: string) => boolean,
 *  isSuperAdmin: boolean,
 *  isAdmin: boolean
 * }} Un objeto con el usuario, su rol y funciones de ayuda para la verificación.
 */
export const usePermissions = () => {
    const { user } = useAuth();
    const userRole = user?.role;

    /**
     * Verifica si el usuario actual tiene un permiso específico.
     * La lógica real (incluyendo el acceso universal del superadmin) está delegada
     * a la función 'checkUserPermission' centralizada.
     * 
     * @param {string} requiredPermission - El permiso requerido (ej. PERMISSIONS.CRM_VIEW_CUSTOMERS).
     * @returns {boolean} - True si el usuario tiene el permiso, false en caso contrario.
     */
    const hasPermission = (requiredPermission) => {
        return checkUserPermission(userRole, requiredPermission);
    };

    return {
        user,
        userRole,
        hasPermission,
        // Banderas de conveniencia para los roles más comunes.
        isSuperAdmin: userRole === 'superadmin',
        isAdmin: userRole === 'admin',
    };
};