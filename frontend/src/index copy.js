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

// --- ¡CORRECCIÓN CRÍTICA! ---
// Se importa el adaptador y el locale correctos para la versión 3 de date-fns,
// que es la que está definida en package.json.
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { es } from 'date-fns/locale/es';

import { AuthProvider } from './app/contexts/AuthContext';
import App from './App';
import theme from './app/theme';
import './index.css';


// --- SECCIÓN 2: INICIALIZACIÓN DE CLIENTES Y CONFIGURACIONES ---

// Se crea una única instancia del cliente de React Query para toda la aplicación.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 0,
    },
  },
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Error Crítico: No se pudo encontrar el elemento raíz con id "root" en el DOM.');
}
const root = ReactDOM.createRoot(rootElement);


// --- SECCIÓN 3: RENDERIZADO DE LA APLICACIÓN ---

/**
 * Renderiza la aplicación, envolviendo el componente App en todos los proveedores
 * de contexto globales necesarios. El orden jerárquico es importante para que las
 * dependencias se inyecten correctamente en los componentes hijos.
 * 
 * Jerarquía de Providers:
 * 1. React.StrictMode: Activa verificaciones y advertencias adicionales en desarrollo.
 * 2. BrowserRouter: Habilita el enrutamiento de la aplicación.
 * 3. QueryClientProvider: Proporciona el cliente de React Query para la gestión de datos del servidor.
 * 4. ThemeProvider: Proporciona el tema de Material-UI a todos los componentes.
 * 5. AuthProvider: Gestiona el estado de autenticación global.
 * 6. SnackbarProvider: Habilita el sistema de notificaciones (snackbars).
 * 7. LocalizationProvider: Configura el adaptador de fechas y el idioma para los componentes de calendario.
 */
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