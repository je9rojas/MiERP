// /frontend/src/constants/crmConstants.js

/**
 * @file Contiene las constantes y valores predefinidos para el módulo de CRM.
 *
 * Centralizar estas constantes aquí (ej. tipos de correo, estados de cliente)
 * asegura la consistencia entre los componentes y facilita el mantenimiento.
 */

/**
 * Define las opciones para el propósito de los correos electrónicos de los proveedores.
 * El `value` debe coincidir con el Enum `EmailPurpose` del backend.
 * El `label` es lo que el usuario verá en la interfaz.
 * @constant {Array<object>}
 */
export const EMAIL_PURPOSES = [
    { value: 'general', label: 'General' },
    { value: 'ventas', label: 'Ventas' },
    { value: 'cobranzas', label: 'Cobranzas / Facturación' },
    { value: 'logística', label: 'Logística' },
    { value: 'soporte', label: 'Soporte' },
];