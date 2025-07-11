// /frontend/src/constants/rolesAndPermissions.js
// FUENTE ÚNICA DE VERDAD PARA LA GESTIÓN DE ROLES Y PERMISOS EN EL FRONTEND

// --- SECCIÓN 1: Definición Base de Roles ---
/**
 * Define los roles del sistema como un objeto.
 * Los valores (ej. 'superadmin') deben coincidir exactamente con los del Enum
 * en el backend para que las comprobaciones de permisos funcionen correctamente.
 * Usar un objeto centralizado como este previene errores de tipeo en el resto de la aplicación.
 */
export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  SALES: 'sales',
  WAREHOUSE: 'warehouse',
  ACCOUNTANT: 'accountant',
  HR_RECRUITER: 'hr_recruiter',
};


// --- SECCIÓN 2: Grupos de Acceso Jerárquicos ---
/**
 * Grupos de roles predefinidos para un control de acceso más fácil y legible.
 * La estructura es jerárquica (ej. un Manager tiene todos los permisos de un Admin).
 * Esto simplifica enormemente la definición de permisos en los componentes.
 */

// Nivel 2: Acceso de Administrador (puede hacer casi todo)
export const ADMIN_ACCESS = [
    ROLES.SUPERADMIN,
    ROLES.ADMIN,
];

// Nivel 3: Acceso de Gerente (hereda de Admin)
export const MANAGER_ACCESS = [
    ...ADMIN_ACCESS,
    ROLES.MANAGER,
];

// Grupos de Roles Departamentales (heredan de Manager)
export const SALES_ACCESS = [
    ...MANAGER_ACCESS,
    ROLES.SALES,
];

export const WAREHOUSE_ACCESS = [
    ...MANAGER_ACCESS,
    ROLES.WAREHOUSE,
];

export const ACCOUNTANT_ACCESS = [
    ...MANAGER_ACCESS,
    ROLES.ACCOUNTANT,
];

export const HR_ACCESS = [
    ...MANAGER_ACCESS,
    ROLES.HR_RECRUITER,
];


// --- SECCIÓN 3: Grupos de Utilidad ---
/**
 * Un array que contiene todos los roles posibles.
 * Muy útil para endpoints o componentes que deben ser accesibles
 * para cualquier usuario que haya iniciado sesión, sin importar su rol.
 */
export const ALL_ROLES = Object.values(ROLES);