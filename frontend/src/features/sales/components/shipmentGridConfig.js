// /frontend/src/features/sales/components/shipmentGridConfig.js

/**
 * @file Define la configuración de columnas para la tabla de Despachos (Shipments).
 */

import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const shipmentColumns = [
    {
        field: 'shipment_number',
        headerName: 'N° Despacho',
        width: 150,
        valueGetter: (params) => params.row?.shipment_number || 'N/A',
    },
    {
        field: 'sales_order_id',
        headerName: 'N° Orden de Venta',
        width: 180,
        // En el futuro, se podría poblar el número de la orden de venta desde el backend.
        // Por ahora, se muestra el ID de la orden.
        valueGetter: (params) => params.row?.sales_order_id || 'N/A',
    },
    {
        field: 'customer',
        headerName: 'Cliente',
        flex: 1,
        minWidth: 200,
        valueGetter: (params) => params.row?.customer?.name || 'Cliente no encontrado',
    },
    {
        field: 'shipping_date',
        headerName: 'Fecha de Despacho',
        width: 180,
        valueGetter: (params) => params.row?.shipping_date,
        renderCell: (params) => {
            // Se añade una guarda para evitar errores si la fecha es nula o inválida.
            if (!params.value) {
                return 'N/A';
            }
            try {
                return format(new Date(params.value), 'dd MMM yyyy', { locale: es });
            } catch {
                return 'Fecha inválida';
            }
        },
    },
    {
        field: 'items',
        headerName: 'Ítems',
        width: 100,
        align: 'center',
        headerAlign: 'center',
        valueGetter: (params) => params.row?.items?.length || 0,
    },
    {
        field: 'created_by',
        headerName: 'Creado Por',
        width: 200,
        valueGetter: (params) => params.row?.created_by?.name || 'Usuario desconocido',
    },
];