// frontend/src/components/common/Logo.js

/**
 * @file Componente reutilizable para mostrar el logo de la aplicación.
 * @description Renderiza el logo del sistema "MiERP PRO" como un SVG en línea (inline),
 * lo que garantiza una escalabilidad perfecta, un rendimiento óptimo y la posibilidad
 * de manipulación a través de CSS o JavaScript.
 */

// SECCIÓN 1: IMPORTACIONES DE MÓDULOS
import React from 'react';
import { Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

// SECCIÓN 2: DEFINICIONES DE LOS COMPONENTES SVG
// Estos son sub-componentes que contienen el código SVG real.
// Cuando tengas tu nuevo logo, reemplazarás el contenido de estas etiquetas <svg>.

const FullLogoSVG = (props) => (
    // CUANDO TENGAS TU NUEVO LOGO COMPLETO, PEGA SU CÓDIGO SVG AQUÍ DENTRO.
    // Asegúrate de ajustar el `viewBox` para que se adapte a las dimensiones de tu nuevo logo.
    <svg width="100%" height="100%" viewBox="0 0 200 50" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <style>
                {`
                    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;700&display=swap');
                    .logo-text {
                        font-family: 'Montserrat', 'Arial', sans-serif;
                        font-size: 24px;
                        fill: #34495E;
                    }
                    .logo-text-pro {
                        font-weight: 300;
                        fill: #566573;
                    }
                    .logo-text-mierp {
                        font-weight: 700;
                    }
                `}
            </style>
        </defs>
        <g transform="translate(25, 25)">
            <path d="M 0 0 L 12 -6.92 L 0 -13.84 L -12 -6.92 Z" fill="#B0BEC5"/>
            <path d="M 0 -13.84 L 12 -20.76 L 12 -6.92 L 0 0 Z" fill="#64B5F6"/>
            <path d="M 12 -6.92 L 12 -20.76 L 24 -13.84 L 24 0 Z" fill="#2A62C3"/>
        </g>
        <text x="60" y="33" className="logo-text">
            <tspan className="logo-text-mierp">MiERP</tspan>
            <tspan className="logo-text-pro"> PRO</tspan>
        </text>
    </svg>
);

const IconOnlySVG = (props) => (
    // CUANDO TENGAS TU NUEVO LOGO DE SOLO-ICONO, PEGA SU CÓDIGO SVG AQUÍ DENTRO.
    // Ajusta el `viewBox` para que encuadre perfectamente el icono.
    <svg width="100%" height="100%" viewBox="-15 -26 45 35" xmlns="http://www.w3.org/2000/svg" {...props}>
        <g>
            <path d="M 0 0 L 12 -6.92 L 0 -13.84 L -12 -6.92 Z" fill="#B0BEC5"/>
            <path d="M 0 -13.84 L 12 -20.76 L 12 -6.92 L 0 0 Z" fill="#64B5F6"/>
            <path d="M 12 -6.92 L 12 -20.76 L 24 -13.84 L 24 0 Z" fill="#2A62C3"/>
        </g>
    </svg>
);


// SECCIÓN 3: DEFINICIÓN DEL COMPONENTE PRINCIPAL
/**
 * Renderiza el logo de la aplicación.
 * @param {object} props - Propiedades del componente.
 * @param {'full' | 'icon'} [props.variant='full'] - La variante del logo a mostrar.
 * @param {object} [props.sx] - Estilos personalizados de Material-UI para aplicar al contenedor del logo.
 */
const Logo = ({ variant = 'full', sx }) => {

    let LogoComponent;
    let defaultWidth;

    // Determina qué componente SVG renderizar y su tamaño por defecto.
    switch (variant) {
        case 'icon':
            LogoComponent = <IconOnlySVG />;
            defaultWidth = 40;
            break;
        case 'full':
        default:
            LogoComponent = <FullLogoSVG />;
            defaultWidth = 200;
            break;
    }

    // El componente Box actúa como un contenedor que controla el tamaño y la posición.
    // El SVG interno se expandirá para llenar este contenedor.
    const logoContainer = (
        <Box
            sx={{
                width: defaultWidth,
                lineHeight: 0, // Elimina espacio extra debajo del SVG
                display: 'inline-block', // Asegura un comportamiento de bloque predecible
                ...sx,
            }}
        >
            {LogoComponent}
        </Box>
    );

    return (
        <RouterLink to="/" aria-label="Volver a la página de inicio">
            {logoContainer}
        </RouterLink>
    );
};

export default React.memo(Logo);