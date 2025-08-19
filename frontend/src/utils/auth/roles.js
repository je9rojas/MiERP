// frontend/src/utils/auth/roles.js

/**
 * Sistema centralizado para la gestión de Roles y Permisos en la aplicación.
 *
 * Este archivo define:
 * 1.  ROLES: Constantes para todos los roles de usuario disponibles en el sistema.
 * 2.  PERMISSIONS: Constantes para cada acción específica y granular que un
 *     usuario puede realizar. Esto desacopla las acciones de los roles.
 * 3.  ROLES_PERMISSIONS: Un mapa que asigna un conjunto de permisos a cada rol.
 *     Este es el núcleo de la lógica de autorización.
 * 4.  hasPermission: Una función de utilidad para verificar si un usuario,
 *     basado en su rol, tiene un permiso específico. Otorga acceso total
 *     al SUPERADMIN por defecto.
 *
 * Esta estructura sigue el principio de Separación de Concerns, facilitando
 * la mantenibilidad y escalabilidad del control de acceso.
 */

// ==========================================================================
// SECCIÓN 1: DEFINICIÓN DE ROLES
// ==========================================================================

/**
 * Constantes que representan los roles de usuario en el sistema.
 * Los valores DEBEN coincidir exactamente con el Enum `UserRole` del backend.
 */
export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  ACCOUNTANT: 'accountant',
  SALES: 'sales', // <- CORRECCIÓN: De 'vendedor' a 'sales' para coincidir con el backend
  WAREHOUSE: 'warehouse',
};

// ==========================================================================
// SECCIÓN 2: DEFINICIÓN DE PERMISOS GRANULARES
// ==========================================================================

/**
 * Constantes para cada permiso específico en la aplicación.
 * Usar permisos granulares en lugar de solo roles permite un control de acceso
 * más flexible y fácil de mantener.
 */
export const PERMISSIONS = {
  // Permisos de Administración
  ADMIN_VIEW_USER_MANAGEMENT: 'ADMIN_VIEW_USER_MANAGEMENT',
  ADMIN_VIEW_DATA_MANAGEMENT: 'ADMIN_VIEW_DATA_MANAGEMENT',

  // Permisos de Productos (Inventario)
  INVENTORY_VIEW_PRODUCTS: 'INVENTORY_VIEW_PRODUCTS',
  INVENTORY_CREATE_PRODUCT: 'INVENTORY_CREATE_PRODUCT',
  INVENTORY_EDIT_PRODUCT: 'INVENTORY_EDIT_PRODUCT',
  INVENTORY_DELETE_PRODUCT: 'INVENTORY_DELETE_PRODUCT',
  INVENTORY_VIEW_STOCK: 'INVENTORY_VIEW_STOCK',
  INVENTORY_ADJUST_STOCK: 'INVENTORY_ADJUST_STOCK',

  // Permisos de Compras (Purchasing)
  PURCHASING_VIEW_ORDERS: 'PURCHASING_VIEW_ORDERS',
  PURCHASING_CREATE_ORDER: 'PURCHASING_CREATE_ORDER',
  PURCHASING_EDIT_ORDER: 'PURCHASING_EDIT_ORDER',
  PURCHASING_CANCEL_ORDER: 'PURCHASING_CANCEL_ORDER',
  PURCHASING_RECEIVE_GOODS: 'PURCHASING_RECEIVE_GOODS',
  PURCHASING_VIEW_BILLS: 'PURCHASING_VIEW_BILLS',
  PURCHASING_CREATE_BILL: 'PURCHASING_CREATE_BILL',

  // Permisos de Ventas (Sales)
  SALES_VIEW_ORDERS: 'SALES_VIEW_ORDERS',
  SALES_CREATE_ORDER: 'SALES_CREATE_ORDER',
  SALES_EDIT_ORDER: 'SALES_EDIT_ORDER',
  SALES_DISPATCH_GOODS: 'SALES_DISPATCH_GOODS',
  SALES_VIEW_INVOICES: 'SALES_VIEW_INVOICES',
  SALES_CREATE_INVOICE: 'SALES_CREATE_INVOICE',

  // Permisos de CRM
  CRM_VIEW_CUSTOMERS: 'CRM_VIEW_CUSTOMERS',
  CRM_MANAGE_CUSTOMERS: 'CRM_MANAGE_CUSTOMERS',
  CRM_VIEW_SUPPLIERS: 'CRM_VIEW_SUPPLIERS',
  CRM_MANAGE_SUPPLIERS: 'CRM_MANAGE_SUPPLIERS',
  
  // Permisos de Reportes
  REPORTS_VIEW_CATALOG: 'REPORTS_VIEW_CATALOG', // <- CORRECCIÓN: Se añade el permiso faltante
};

// ==========================================================================
// SECCIÓN 3: MAPEO DE ROLES A PERMISOS
// ==========================================================================

/**
 * Define qué permisos tiene cada rol.
 * El SUPERADMIN no necesita ser listado aquí, ya que `hasPermission` le
 * concede todos los permisos automáticamente.
 */
const ROLES_PERMISSIONS = {
  [ROLES.ADMIN]: [
    // El admin tiene todos los permisos definidos
    ...Object.values(PERMISSIONS),
  ],
  [ROLES.MANAGER]: [
    PERMISSIONS.INVENTORY_VIEW_PRODUCTS,
    PERMISSIONS.INVENTORY_CREATE_PRODUCT,
    PERMISSIONS.INVENTORY_EDIT_PRODUCT,
    PERMISSIONS.INVENTORY_VIEW_STOCK,
    PERMISSIONS.PURCHASING_VIEW_ORDERS,
    PERMISSIONS.PURCHASING_CREATE_ORDER,
    PERMISSIONS.PURCHASING_EDIT_ORDER,
    PERMISSIONS.PURCHASING_CANCEL_ORDER,
    PERMISSIONS.SALES_VIEW_ORDERS,
    PERMISSIONS.SALES_CREATE_ORDER,
    PERMISSIONS.SALES_EDIT_ORDER,
    PERMISSIONS.CRM_VIEW_CUSTOMERS,
    PERMISSIONS.CRM_MANAGE_CUSTOMERS,
    PERMISSIONS.CRM_VIEW_SUPPLIERS,
    PERMISSIONS.CRM_MANAGE_SUPPLIERS,
    PERMISSIONS.REPORTS_VIEW_CATALOG, // <- Se asigna el permiso al Manager
  ],
  [ROLES.ACCOUNTANT]: [
    PERMISSIONS.PURCHASING_VIEW_BILLS,
    PERMISSIONS.PURCHASING_CREATE_BILL,
    PERMISSIONS.SALES_VIEW_INVOICES,
    PERMISSIONS.SALES_CREATE_INVOICE,
    PERMISSIONS.CRM_VIEW_CUSTOMERS,
    PERMISSIONS.CRM_VIEW_SUPPLIERS,
  ],
  [ROLES.SALES]: [
    PERMISSIONS.SALES_VIEW_ORDERS,
    PERMISSIONS.SALES_CREATE_ORDER,
    PERMISSIONS.SALES_EDIT_ORDER,
    PERMISSIONS.CRM_VIEW_CUSTOMERS,
    PERMISSIONS.CRM_MANAGE_CUSTOMERS,
    PERMISSIONS.INVENTORY_VIEW_PRODUCTS,
  ],
  [ROLES.WAREHOUSE]: [
    PERMISSIONS.INVENTORY_VIEW_STOCK,
    PERMISSIONS.INVENTORY_ADJUST_STOCK,
    PERMISSIONS.PURCHASING_RECEIVE_GOODS,
    PERMISSIONS.SALES_DISPATCH_GOODS,
    PERMISSIONS.INVENTORY_VIEW_PRODUCTS,
  ],
};

// ==========================================================================
// SECCIÓN 4: FUNCIÓN DE VERIFICACIÓN DE PERMISOS
// ==========================================================================

/**
 * Verifica si un usuario tiene un permiso específico basado en su rol.
 *
 * @param {string} userRole - El rol del usuario actual (ej. ROLES.ADMIN).
 * @param {string} requiredPermission - El permiso que se requiere para la acción.
 * @returns {boolean} - `true` si el usuario tiene el permiso, `false` en caso contrario.
 */
export const hasPermission = (userRole, requiredPermission) => {
  if (userRole === ROLES.SUPERADMIN) {
    return true;
  }
  
  // Si no se proporciona un rol de usuario, no hay permisos.
  if (!userRole) {
    return false;
  }

  const userPermissions = ROLES_PERMISSIONS[userRole] || [];
  return userPermissions.includes(requiredPermission);
};