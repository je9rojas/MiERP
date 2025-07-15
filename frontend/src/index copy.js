// /frontend/src/index.js
// CÓDIGO FINAL Y COMPLETO CON TODOS LOS PROVIDERS NECESARIOS

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { AuthProvider } from './app/contexts/AuthContext';
import { SnackbarProvider } from 'notistack';

// --- NUEVAS IMPORTACIONES PARA EL SELECTOR DE FECHAS ---
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale'; // Para poner el calendario en español

import App from './App';
import theme from './app/theme';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <AuthProvider>
          <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
            {/* --- NUEVO PROVIDER PARA LAS FECHAS --- */}
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
              <App />
            </LocalizationProvider>
          </SnackbarProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);