// /frontend/src/components/common/DataGridToolbar.js

/**
 * @file Componente de barra de herramientas personalizada y reutilizable para Material-UI DataGrid.
 *
 * Este componente está diseñado para ser utilizado dentro del `slot` de toolbar de un <DataGrid>.
 * Combina componentes estándar de la librería (como el contenedor y el filtro rápido) con
 * elementos personalizados (título y botón de "Añadir").
 */

import React from 'react';
import { Box, Typography, Button, TextField } from '@mui/material';
import { GridToolbarContainer, GridToolbarQuickFilter } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';

// Este componente recibe sus props a través de la prop `slotProps` del DataGrid.
const DataGridToolbar = ({ title, addButtonText, onAddClick, searchTerm, onSearchChange, searchPlaceholder }) => {
    return (
        <GridToolbarContainer
            sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2,
                p: 2,
            }}
        >
            {/* Título personalizado a la izquierda */}
            <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
                {title}
            </Typography>

            {/* Contenedor para los elementos de la derecha */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                {/* Filtro rápido estándar de DataGrid */}
                <GridToolbarQuickFilter
                    variant="outlined"
                    size="small"
                    placeholder={searchPlaceholder}
                    value={searchTerm}
                    onChange={onSearchChange}
                    sx={{ width: { xs: '100%', sm: 'auto' } }}
                />

                {/* Botón de "Añadir" personalizado */}
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={onAddClick}
                >
                    {addButtonText}
                </Button>
            </Box>
        </GridToolbarContainer>
    );
};

export default DataGridToolbar;