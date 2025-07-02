// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './app/contexts/AuthContext';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './app/theme';

// Registrar tiempo de inicio
const startTime = performance.now();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// Registrar tiempo de fin después de la renderización inicial
const measureStartup = () => {
  const endTime = performance.now();
  const loadTime = endTime - startTime;
  console.log(`🕒 Tiempo de inicio de la aplicación: ${loadTime.toFixed(2)} ms`);
  
  // Registrar métricas de recursos (eliminada la variable 'entry' no utilizada)
  console.log("📦 Tamaño de recursos:");
  console.table(
    performance.getEntriesByType("resource").map(resource => ({
      "Recurso": resource.name,
      "Tipo": resource.initiatorType,
      "Tamaño (KB)": (resource.transferSize / 1024).toFixed(2),
      "Tiempo (ms)": resource.duration.toFixed(2)
    }))
  );
};

// Medir después de que se complete la renderización inicial
setTimeout(measureStartup, 0);