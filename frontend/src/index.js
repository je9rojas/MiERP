// /frontend/src/index.js
// PUNTO DE ENTRADA PRINCIPAL DE LA APLICACIÓN REACT Y CONFIGURACIÓN DE PROVEEDORES GLOBALES

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { AuthProvider } from './app/contexts/AuthContext';
import { SnackbarProvider } from 'notistack';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';

// --- ¡NUEVAS IMPORTACIONES PARA REACT QUERY! ---
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import App from './App';
import theme from './app/theme';
import './index.css';

// --- SECCIÓN 1: INICIALIZACIÓN DE CLIENTES Y CONFIGURACIONES ---

// Se crea una única instancia del cliente de React Query para toda la aplicación.
// Aquí se pueden configurar opciones globales para todas las queries.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Evita que React Query reintente automáticamente las peticiones que fallan (ej. un 404).
      // Es mejor manejar los reintentos de forma manual donde sea necesario.
      retry: false,
      // Los datos se consideran "obsoletos" inmediatamente, lo que fomenta la revalidación
      // al volver a enfocar la ventana, pero aún se sirven desde la caché para una UX rápida.
      staleTime: 0,
    },
  },
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Error Crítico: No se pudo encontrar el elemento raíz con id "root" en el DOM.');
}
const root = ReactDOM.createRoot(rootElement);


// --- SECCIÓN 2: RENDERIZADO DE LA APLICACIÓN ---

/**
 * Renderiza la aplicación, envolviendo el componente App en todos los proveedores
 * de contexto globales necesarios. El orden es importante para que las dependencias
 * se inyecten correctamente en los componentes hijos.
 * 
 * Jerarquía de Providers:
 * 1. BrowserRouter: Habilita el enrutamiento.
 * 2. QueryClientProvider: Proporciona el cliente de React Query para la gestión de datos del servidor.
 * 3. ThemeProvider: Proporciona el tema de Material-UI.
 * 4. AuthProvider: Gestiona el estado de autenticación.
 * 5. SnackbarProvider: Habilita el sistema de notificaciones.
 * 6. LocalizationProvider: Configura el idioma para los selectores de fecha.
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
        {/* ReactQueryDevtools solo se renderiza en entorno de desarrollo para depuración */}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);