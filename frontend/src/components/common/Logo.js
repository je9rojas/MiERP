// frontend/src/components/common/Logo.js

/**
 * @file Componente reutilizable para mostrar el logo de la aplicación.
 * @description Muestra el logo del sistema "MiERP PRO" desde un archivo de imagen estático.
 * Es flexible y puede renderizar diferentes variantes del logo (completo o solo el icono)
 * a través de la prop `variant`.
 */

// SECCIÓN 1: IMPORTACIONES DE MÓDULOS
import React from 'react';
import { Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

// SECCIÓN 2: DEFINICIÓN DEL COMPONENTE
/**
 * Renderiza el logo de la aplicación.
 * @param {object} props - Propiedades del componente.
 * @param {'full' | 'icon'} [props.variant='full'] - La variante del logo a mostrar.
 * @param {object} [props.sx] - Estilos personalizados de Material-UI para aplicar al contenedor del logo.
 */
const Logo = ({ variant = 'full', sx }) => {

    let logoSrc;
    let altText;
    let defaultWidth;

    // Determina qué archivo de logo y qué atributos usar según la variante.
    switch (variant) {
        case 'icon':
            logoSrc = '/images/logo-icon.png';
            altText = 'Icono de MiERP PRO';
            defaultWidth = 40; // Un tamaño por defecto más pequeño para el icono.
            break;
        case 'full':
        default:
            logoSrc = '/images/logo-full.png';
            altText = 'Logo de MiERP PRO';
            defaultWidth = 200; // Ancho por defecto para el logo completo.
            break;
    }

    // Se utiliza Box con component="img" para tener un control total del estilo
    // a través de la prop `sx`.
    const logoImage = (
        <Box
            component="img"
            src={logoSrc}
            alt={altText}
            sx={{
                width: defaultWidth,
                height: 'auto', // Mantiene la proporción de la imagen.
                display: 'block',
                ...sx, // Permite que los estilos pasados por props sobreescriban los defaults.
            }}
        />
    );

    // El logo siempre actúa como un enlace a la página principal.
    return (
        <RouterLink to="/" aria-label="Volver a la página de inicio">
            {logoImage}
        </RouterLink>
    );
};

export default React.memo(Logo);