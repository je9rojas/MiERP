// /frontend/src/constants/rolesAndPermissions.js

/**
 * @file Contiene la definición centralizada de roles y permisos para todo el ERP.
 *
 * Esta estructura permite un control de acceso granular y mantenible, siguiendo el
 * principio de Role-Based Access Control (RBAC). Se divide en roles, permisos de
 * alto nivel (módulos) y permisos granulares (acciones), con una función de ayuda
 * que otorga acceso universal al rol de SUPERADMIN.
 */

// ==============================================================================
// SECCIÓN 1: DEFINICIÓN DE ROLES
// ==============================================================================

/**
 * Define todos los roles de usuario disponibles en el sistema.
 * Se utiliza `Object.freeze` para prevenir modificaciones accidentales en tiempo de ejecución.
 * Los nombres se mantienen en inglés por consistencia en el código.
 * @constant {Object.<string, string>}
 */
export const ROLES = Object.freeze({
    SUPERADMIN: 'superadmin',
    ADMIN: 'admin',
    MANAGER: 'manager',
    SELLER: 'seller', // Estandarizado a inglés
    WAREHOUSE: 'warehouse',
    ACCOUNTANT: 'accountant',
    HR_RECRUITER: 'hr_recruiter',
});

// ==============================================================================
// SECCIÓN 2: PERMISOS DE ACCESO A MÓDULOS (VISTA DE ALTO NIVEL)
// ==============================================================================

/**
 * Estos arrays definen qué roles pueden ver y acceder a los módulos principales.
 * Son ideales para controlar la visibilidad de elementos en el menú de navegación.
 * El SUPERADMIN se incluye explícitamente para que la intención sea auto-documentada.
 */
export const CAN_ACCESS_SALES_MODULE = [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.SELLER];
export const CAN_ACCESS_PURCHASING_MODULE = [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.WAREHOUSE, ROLES.ACCOUNTANT];
export const CAN_ACCESS_INVENTORY_MODULE = [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.WAREHOUSE, ROLES.SELLER];
export const CAN_ACCESS_FINANCE_MODULE = [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT];
export const CAN_ACCESS_HR_MODULE = [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.HR_RECRUITER];
export const CAN_ACCESS_REPORTS_MODULE = [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.SELLER];
export const CAN_ACCESS_ADMIN_MODULE = [ROLES.SUPERADMIN, ROLES.ADMIN];

// ==============================================================================
// SECCIÓN 3: PERMISOS GRANULARES POR ACCIÓN
// ==============================================================================

/**
 * Estos arrays definen permisos para acciones específicas dentro de cada módulo.
 * Son utilizados para proteger rutas, botones y funcionalidades concretas.
 */

// Módulo de Compras (Purchasing)
export const CAN_MANAGE_SUPPLIERS = [ROLES.ADMIN, ROLES.WAREHOUSE, ROLES.MANAGER];
export const CAN_CRUD_PURCHASE_ORDERS = [ROLES.ADMIN, ROLES.WAREHOUSE, ROLES.MANAGER];
export const CAN_APPROVE_PURCHASE_ORDERS = [ROLES.ADMIN, ROLES.MANAGER];
export const CAN_RECEIVE_GOODS = [ROLES.ADMIN, ROLES.WAREHOUSE];
export const CAN_MANAGE_PAYABLES = [ROLES.ADMIN, ROLES.ACCOUNTANT];

// Módulo de Ventas (Sales) y CRM
export const CAN_VIEW_SALES_DASHBOARD = [ROLES.ADMIN, ROLES.MANAGER];
export const CAN_MANAGE_CLIENTS = [ROLES.ADMIN, ROLES.MANAGER, ROLES.SELLER];
export const CAN_MANAGE_QUOTES = [ROLES.ADMIN, ROLES.MANAGER, ROLES.SELLER];
export const CAN_MANAGE_SALES_ORDERS = [ROLES.ADMIN, ROLES.MANAGER, ROLES.SELLER];
export const CAN_USE_POS = [ROLES.ADMIN, ROLES.MANAGER, ROLES.SELLER];
export const CAN_MANAGE_SALE_INVOICES = [ROLES.ADMIN, ROLES.ACCOUNTANT, ROLES.SELLER];
export const CAN_MANAGE_RETURNS = [ROLES.ADMIN, ROLES.MANAGER, ROLES.SELLER];

// Módulo de Inventario (Inventory)
export const CAN_MANAGE_PRODUCTS = [ROLES.ADMIN, ROLES.WAREHOUSE, ROLES.MANAGER];
export const CAN_MANAGE_WAREHOUSES = [ROLES.ADMIN, ROLES.WAREHOUSE];
export const CAN_CONTROL_STOCK = [ROLES.ADMIN, ROLES.WAREHOUSE];
export const CAN_MANAGE_TRANSFERS = [ROLES.ADMIN, ROLES.WAREHOUSE];
export const CAN_ADJUST_INVENTORY = [ROLES.ADMIN, ROLES.WAREHOUSE, ROLES.MANAGER];
export const CAN_MANAGE_LOTS = [ROLES.ADMIN, ROLES.WAREHOUSE];
export const CAN_VIEW_INVENTORY_VALUATION = [ROLES.ADMIN, ROLES.ACCOUNTANT, ROLES.MANAGER];
export const CAN_GENERATE_CATALOG = [ROLES.ADMIN, ROLES.MANAGER, ROLES.SELLER];
export const CAN_VIEW_COMMERCIAL_DATA = [ROLES.ADMIN, ROLES.MANAGER, ROLES.SELLER]; // Permiso para ver costos/precios

// Módulo de Finanzas (Finance)
export const CAN_VIEW_FINANCE_DASHBOARD = [ROLES.ADMIN, ROLES.MANAGER];
export const CAN_MANAGE_RECEIVABLES = [ROLES.ADMIN, ROLES.ACCOUNTANT];

// Módulo de RRHH (Human Resources)
export const CAN_MANAGE_EMPLOYEES = [ROLES.ADMIN, ROLES.HR_RECRUITER, ROLES.MANAGER];

// ==============================================================================
// SECCIÓN 4: UTILIDADES DE PERMISOS
// ==============================================================================

/**
 * Un array que contiene todos los roles definidos, excluyendo al SUPERADMIN.
 * Útil para menús desplegables de asignación de roles, donde no se debe poder asignar SUPERADMIN.
 */
export const ALL_ASSIGNABLE_ROLES = Object.freeze(Object.values(ROLES).filter(r => r !== ROLES.SUPERADMIN));

/**
 * Un array que contiene todos los roles. Útil para dependencias de backend
 * que deben permitir el acceso a cualquier usuario autenticado.
 */
export const ALL_ROLES = Object.freeze(Object.values(ROLES));

/**
 * Función de ayuda centralizada para verificar si un usuario tiene permiso para una acción.
 *
 * Esta es la única función que se debe usar en la aplicación para verificar permisos.
 * Centraliza la lógica y otorga acceso universal e implícito al rol de SUPERADMIN,
 * evitando tener que añadirlo manualmente a cada array de permisos.
 *
 * @param {string[]} allowedRoles - El array de roles permitidos para una acción (ej. CAN_MANAGE_CLIENTS).
 * @param {string} userRole - El rol del usuario actual que se está verificando.
 * @returns {boolean} `true` si el usuario tiene permiso, `false` en caso contrario.
 */
export const hasPermission = (allowedRoles, userRole) => {
    if (!userRole) {
        return false;
    }
    // El SUPERADMIN siempre tiene permiso, sin importar la lista de roles permitidos.
    if (userRole === ROLES.SUPERADMIN) {
        return true;
    }
    // Para el resto de los roles, se verifica si están incluidos en la lista.
    return allowedRoles.includes(userRole);
};