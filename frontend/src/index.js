// /frontend/src/index.js
// [VERSIÓN DE DEPURACIÓN]

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

// --- SECCIÓN 2: INICIALIZACIÓN ---
console.log("[INDEX_DEBUG] 1. Archivo index.js cargado.");

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 0,
    },
  },
});
console.log("[INDEX_DEBUG] 2. Cliente React Query inicializado.");

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Error Crítico: No se pudo encontrar el elemento raíz con id "root".');
}
console.log("[INDEX_DEBUG] 3. Elemento raíz del DOM encontrado.");

const root = ReactDOM.createRoot(rootElement);

// --- SECCIÓN 3: RENDERIZADO ---
console.log("[INDEX_DEBUG] 4. A punto de llamar a root.render().");

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <AuthProvider>
            <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} autoHideDuration={4000}>
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

console.log("[INDEX_DEBUG] 5. Llamada a root.render() completada.");