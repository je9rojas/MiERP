// /frontend/src/config/dataGridConfig.js

// Opciones por defecto para todas las tablas
export const defaultGridOptions = {
    density: 'compact',
    disableRowSelectionOnClick: true,
    initialState: { pagination: { paginationModel: { pageSize: 10 } } },
};

// Fábrica para la columna de acciones
export const createActionsColumn = ({ onEdit, onDelete, onHistory }) => ({
    field: 'actions',
    headerName: 'Acciones',
    type: 'actions',
    width: 130,
    align: 'right',
    headerAlign: 'right',
    getActions: (params) => [
        onHistory && <Tooltip title="Ver Movimientos"><IconButton onClick={() => onHistory(params.row)} size="small"><HistoryIcon /></IconButton></Tooltip>,
        onEdit && <Tooltip title="Editar"><IconButton onClick={() => onEdit(params.row)} size="small" color="primary"><EditIcon /></IconButton></Tooltip>,
        onDelete && <Tooltip title="Desactivar"><IconButton onClick={() => onDelete(params.row)} size="small" color="error"><DeleteIcon /></IconButton></Tooltip>,
    ].filter(Boolean),
});