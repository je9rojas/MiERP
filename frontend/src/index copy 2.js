// /frontend/src/index.js

/**
 * @file Punto de entrada principal de la aplicación React.
 * Este archivo es responsable de renderizar el componente raíz (`App`) en el DOM
 * y de envolver toda la aplicación en los proveedores de contexto globales
 * necesarios para su funcionamiento (rutas, tema, estado de autenticación, etc.).
 */

// --- SECCIÓN 1: IMPORTACIONES ---
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { SnackbarProvider } from 'notistack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { es } from 'date-fns/locale/es';

import { AuthProvider } from './app/contexts/AuthContext';
import App from './App';
import theme from './app/theme';
import './index.css';


// --- SECCIÓN 2: INICIALIZACIÓN DE CLIENTES Y CONFIGURACIONES ---

console.log("[DEBUG] index.js: Archivo cargado. Iniciando configuración de la aplicación.");

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 0,
    },
  },
});
console.log("[DEBUG] index.js: Cliente de React Query inicializado.");

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("[CRITICAL ERROR] index.js: No se pudo encontrar el elemento raíz '#root' en el DOM.");
  throw new Error('Error Crítico: No se pudo encontrar el elemento raíz con id "root" en el DOM.');
}
console.log("[DEBUG] index.js: Elemento raíz del DOM encontrado.");

const root = ReactDOM.createRoot(rootElement);


// --- SECCIÓN 3: RENDERIZADO DE LA APLICACIÓN ---
console.log("[DEBUG] index.js: Iniciando renderizado de la aplicación React...");

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <AuthProvider>
            <SnackbarProvider
              maxSnack={3}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              autoHideDuration={4000}
            >
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                <App />
              </LocalizationProvider>
            </SnackbarProvider>
          </AuthProvider>
        </ThemeProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);

console.log("[DEBUG] index.js: Renderizado de la aplicación completado.");