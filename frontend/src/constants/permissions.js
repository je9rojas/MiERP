/**
 * @file Constantes de Permisos del Frontend
 * Este archivo centraliza las claves de los permisos utilizadas en toda la aplicación de React.
 * DEBE mantenerse sincronizado con `/backend/app/constants/permissions.py`.
 * Usar estas constantes en lugar de strings mágicos previene errores de tipeo y facilita
 * el mantenimiento y la búsqueda de referencias en el código.
 */

// Permisos de Órdenes de Compra
export const PURCHASE_ORDER_CREATE = "purchase:order:create";
export const PURCHASE_ORDER_VIEW = "purchase:order:view";
export const PURCHASE_ORDER_EDIT = "purchase:order:edit";
export const PURCHASE_ORDER_APPROVE = "purchase:order:approve";

// Permisos de Usuarios
export const USER_MANAGE = "user:manage";

// Permisos de Roles
export const ROLE_MANAGE = "role:manage";

// A medida que añadas más permisos en el backend, añádelos aquí también.
// Por ejemplo:
// export const PRODUCT_VIEW = "product:view";
// export const PRODUCT_MANAGE = "product:manage";
// export const REPORT_FINANCIAL_VIEW = "report:financial:view";