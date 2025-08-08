// frontend/src/components/common/PageHeader.js

/**
 * @file Componente reutilizable para el encabezado de las páginas principales.
 * @description Muestra un encabezado estandarizado con título, subtítulo opcional
 * y un botón de acción principal que puede ser ocultado.
 */

// SECCIÓN 1: IMPORTACIONES DE MÓDULOS
import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

// SECCIÓN 2: DEFINICIÓN DEL COMPONENTE
/**
 * Muestra un encabezado de página estandarizado.
 *
 * @param {object} props - Las propiedades del componente.
 * @param {string} props.title - El título principal que se mostrará.
 * @param {string} [props.subtitle] - Un texto secundario opcional que aparece debajo del título.
 * @param {boolean} [props.showAddButton=true] - Si se debe mostrar el botón de acción principal.
 * @param {string} [props.addButtonText] - El texto para el botón de acción.
 * @param {function} [props.onAddClick] - La función que se ejecutará al hacer clic en el botón.
 */
const PageHeader = ({
    title,
    subtitle,
    showAddButton = true,
    addButtonText = "Añadir Nuevo",
    onAddClick = () => {},
}) => {
    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                pb: 2,
                mb: 3,
                borderBottom: '1px solid',
                borderColor: 'divider',
                flexWrap: 'wrap',
                gap: 2,
            }}
        >
            <Box>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                    {title}
                </Typography>
                {subtitle && (
                    <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                        {subtitle}
                    </Typography>
                )}
            </Box>

            {/* CORRECCIÓN: El botón solo se renderiza si `showAddButton` es true. */}
            {showAddButton && (
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={onAddClick}
                    sx={{ fontWeight: 'bold' }}
                >
                    {addButtonText}
                </Button>
            )}
        </Box>
    );
};

export default PageHeader;