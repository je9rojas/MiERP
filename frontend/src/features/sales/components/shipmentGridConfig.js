// /frontend/src/features/sales/components/shipmentGridConfig.js

/**
 * @file Define la configuración de columnas para la tabla de Despachos (Shipments).
 * @description Esta configuración está diseñada para funcionar con datos aplanados
 * provenientes del mapper 'mapShipmentToDataGridRow'.
 */

// Ya no se necesitan importaciones de 'date-fns' aquí, la lógica de formato
// se ha movido al mapper para una mejor separación de concerns.

export const shipmentColumns = [
    {
        // (MODIFICADO) El 'field' ahora apunta a la propiedad aplanada.
        field: 'shipmentNumber',
        headerName: 'N° Despacho',
        width: 150,
        // (ELIMINADO) 'valueGetter' ya no es necesario.
    },
    {
        // (MODIFICADO)
        field: 'salesOrderNumber',
        headerName: 'N° Orden de Venta',
        width: 180,
    },
    {
        // (MODIFICADO)
        field: 'customerName',
        headerName: 'Cliente',
        flex: 1,
        minWidth: 200,
    },
    {
        // (MODIFICADO)
        field: 'shipmentDate',
        headerName: 'Fecha de Despacho',
        width: 180,
        // (ELIMINADO) 'valueGetter' y 'renderCell' ya no son necesarios
        // porque el mapper ya ha formateado la fecha.
    },
    {
        // (MODIFICADO)
        field: 'itemCount',
        headerName: 'Ítems',
        width: 100,
        align: 'center',
        headerAlign: 'center',
    },
    {
        // (MODIFICADO)
        field: 'createdByName',
        headerName: 'Creado Por',
        width: 200,
    },
];