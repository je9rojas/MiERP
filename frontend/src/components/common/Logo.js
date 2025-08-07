// frontend/src/components/common/Logo.js

/**
 * @file Componente reutilizable para mostrar el logo de la aplicación.
 * @description Renderiza el logo del sistema "MiERP PRO" en formato SVG vectorial,
 * lo que garantiza una escalabilidad perfecta y un rendimiento óptimo.
 * Acepta props de estilo (`sx`) para una personalización flexible.
 */

// SECCIÓN 1: IMPORTACIONES DE MÓDULOS
import React from 'react';
import { Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

// SECCIÓN 2: DEFINICIÓN DEL COMPONENTE
const Logo = ({ sx }) => {
    // El logo se envuelve en un componente Box para facilitar su estilización y posicionamiento.
    // También se envuelve en un Link para que al hacer clic, redirija a la página de inicio.
    const logoContent = (
        <Box
            component="svg"
            width="200"
            height="50"
            viewBox="0 0 200 50"
            xmlns="http://www.w3.org/2000/svg"
            sx={{
                display: 'block', // Asegura que el SVG se comporte como un bloque
                ...sx // Permite pasar estilos personalizados desde las props
            }}
        >
            <defs>
                <style>
                    {`
                        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;700&display=swap');
                        .logo-text {
                            font-family: 'Montserrat', 'Arial', sans-serif;
                            font-size: 24px;
                            fill: #34495E; /* Un gris azulado oscuro para profesionalismo */
                        }
                        .logo-text-pro {
                            font-weight: 300; /* Light weight */
                            fill: #566573; /* Un gris ligeramente más claro */
                        }
                        .logo-text-mierp {
                            font-weight: 700; /* Bold weight */
                        }
                    `}
                </style>
            </defs>

            {/* Icono: Hexágono compuesto por 3 rombos */}
            <g transform="translate(25, 25)">
                {/* Rombo Izquierdo (Gris) */}
                <path d="M 0 0 L 12 -6.92 L 0 -13.84 L -12 -6.92 Z" fill="#B0BEC5"/>
                {/* Rombo Superior (Azul Claro) */}
                <path d="M 0 -13.84 L 12 -20.76 L 12 -6.92 L 0 0 Z" fill="#64B5F6"/>
                {/* Rombo Derecho (Azul Corporativo) */}
                <path d="M 12 -6.92 L 12 -20.76 L 24 -13.84 L 24 0 Z" fill="#2A62C3"/>
            </g>

            {/* Texto del Logo */}
            <text x="60" y="33" className="logo-text">
                <tspan className="logo-text-mierp">MiERP</tspan>
                <tspan className="logo-text-pro"> PRO</tspan>
            </text>
        </Box>
    );

    return (
        <RouterLink to="/" aria-label="Volver a la página de inicio">
            {logoContent}
        </RouterLink>
    );
};

export default React.memo(Logo);