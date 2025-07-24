// /frontend/src/constants/rolesAndPermissions.js

/**
 * @file Contiene la definición centralizada de roles y permisos para todo el ERP.
 * Esta estructura permite un control de acceso granular y mantenible.
 * Sigue el principio de Role-Based Access Control (RBAC).
 */

// --- SECCIÓN 1: DEFINICIÓN DE ROLES ---
/**
 * Define todos los roles de usuario disponibles en el sistema.
 * Usar `Object.freeze` previene modificaciones accidentales en tiempo de ejecución.
 * @constant {Object.<string, string>}
 */
export const ROLES = Object.freeze({
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  VENDEDOR: 'vendedor',
  WAREHOUSE: 'warehouse',
  ACCOUNTANT: 'accountant',
  HR_RECRUITER: 'hr_recruiter',
});

// --- SECCIÓN 2: PERMISOS DE ACCESO A MÓDULOS (VISTA DE ALTO NIVEL) ---
/**
 * Estos arrays definen qué roles pueden ver y acceder a los módulos principales del sistema.
 * Son ideales para controlar la visibilidad de elementos en el menú de navegación o la barra lateral.
 */
export const CAN_ACCESS_SALES_MODULE = [ROLES.ADMIN, ROLES.MANAGER, ROLES.VENDEDOR];
export const CAN_ACCESS_PURCHASING_MODULE = [ROLES.ADMIN, ROLES.MANAGER, ROLES.WAREHOUSE, ROLES.ACCOUNTANT];
export const CAN_ACCESS_INVENTORY_MODULE = [ROLES.ADMIN, ROLES.MANAGER, ROLES.WAREHOUSE, ROLES.VENDEDOR];
export const CAN_ACCESS_FINANCE_MODULE = [ROLES.ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT];
export const CAN_ACCESS_HR_MODULE = [ROLES.ADMIN, ROLES.MANAGER, ROLES.HR_RECRUITER];
export const CAN_ACCESS_REPORTS_MODULE = [ROLES.ADMIN, ROLES.MANAGER, ROLES.VENDEDOR];
export const CAN_ACCESS_ADMIN_MODULE = [ROLES.ADMIN];


// --- SECCIÓN 3: PERMISOS GRANULARES POR ACCIÓN ---
/**
 * Estos arrays definen permisos para acciones específicas (CRUD, aprobar, generar reportes, etc.).
 * Son utilizados para proteger rutas, botones y funcionalidades específicas dentro de cada módulo.
 */

// Módulo de Compras (Purchasing)
export const CAN_MANAGE_SUPPLIERS = [ROLES.ADMIN, ROLES.WAREHOUSE, ROLES.MANAGER];
export const CAN_CRUD_PURCHASE_ORDERS = [ROLES.ADMIN, ROLES.WAREHOUSE, ROLES.MANAGER]; // Crear, Ver, Editar
export const CAN_APPROVE_PURCHASE_ORDERS = [ROLES.ADMIN, ROLES.MANAGER]; // ¡Permiso clave! Solo roles de gestión pueden aprobar.
export const CAN_RECEIVE_GOODS = [ROLES.ADMIN, ROLES.WAREHOUSE]; // Marcar una OC como recibida
export const CAN_MANAGE_PAYABLES = [ROLES.ADMIN, ROLES.ACCOUNTANT]; // Gestionar facturas de compra y pagos

// Módulo de Ventas (Sales)
export const CAN_VIEW_SALES_DASHBOARD = [ROLES.ADMIN, ROLES.MANAGER];
export const CAN_MANAGE_CLIENTS = [ROLES.ADMIN, ROLES.MANAGER, ROLES.VENDEDOR];
export const CAN_MANAGE_QUOTES = [ROLES.ADMIN, ROLES.MANAGER, ROLES.VENDEDOR];
export const CAN_MANAGE_SALES_ORDERS = [ROLES.ADMIN, ROLES.MANAGER, ROLES.VENDEDOR];
export const CAN_USE_POS = [ROLES.ADMIN, ROLES.MANAGER, ROLES.VENDEDOR];
export const CAN_MANAGE_SALE_INVOICES = [ROLES.ADMIN, ROLES.ACCOUNTANT, ROLES.VENDEDOR];
export const CAN_MANAGE_RETURNS = [ROLES.ADMIN, ROLES.MANAGER, ROLES.VENDEDOR];

// Módulo de Inventario (Inventory)
export const CAN_MANAGE_PRODUCTS = [ROLES.ADMIN, ROLES.WAREHOUSE, ROLES.MANAGER];
export const CAN_MANAGE_WAREHOUSES = [ROLES.ADMIN, ROLES.WAREHOUSE];
export const CAN_CONTROL_STOCK = [ROLES.ADMIN, ROLES.WAREHOUSE];
export const CAN_MANAGE_TRANSFERS = [ROLES.ADMIN, ROLES.WAREHOUSE];
export const CAN_ADJUST_INVENTORY = [ROLES.ADMIN, ROLES.WAREHOUSE, ROLES.MANAGER];
export const CAN_MANAGE_LOTS = [ROLES.ADMIN, ROLES.WAREHOUSE];
export const CAN_VIEW_INVENTORY_VALUATION = [ROLES.ADMIN, ROLES.ACCOUNTANT, ROLES.MANAGER];
export const CAN_GENERATE_CATALOG = [ROLES.ADMIN, ROLES.MANAGER, ROLES.VENDEDOR];

// Módulo de Finanzas (Finance)
export const CAN_VIEW_FINANCE_DASHBOARD = [ROLES.ADMIN, ROLES.MANAGER];
export const CAN_MANAGE_RECEIVABLES = [ROLES.ADMIN, ROLES.ACCOUNTANT];

// Módulo de RRHH (Human Resources)
export const CAN_MANAGE_EMPLOYEES = [ROLES.ADMIN, ROLES.HR_RECRUITER, ROLES.MANAGER];


// --- SECCIÓN 4: UTILIDADES ---
/**
 * Un array que contiene todos los roles definidos. Útil para dependencias de backend
 * que deben permitir el acceso a cualquier usuario autenticado.
 * @constant {string[]}
 */
export const ALL_ROLES = Object.freeze(Object.values(ROLES));

/**
 * Función de ayuda para verificar si un rol de usuario está incluido en una lista de roles permitidos.
 * Centraliza la lógica de permisos y otorga acceso universal al SUPERADMIN.
 * @param {string[]} allowedRoles - Array de roles permitidos para una acción específica (ej. CAN_MANAGE_CLIENTS).
 * @param {string} userRole - El rol del usuario actual.
 * @returns {boolean} - `true` si el usuario tiene permiso, `false` en caso contrario.
 */
export const hasPermission = (allowedRoles, userRole) => {
  if (!userRole) return false;
  // El SUPERADMIN tiene acceso implícito a todas las funcionalidades.
  if (userRole === ROLES.SUPERADMIN) return true;
  return allowedRoles.includes(userRole);
};