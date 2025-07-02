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

console.log('[index] Iniciando aplicación');

const startTime = performance.now();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(

    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>

);

const measureStartup = () => {
  const endTime = performance.now();
  const loadTime = endTime - startTime;
  console.log(`[index] 🕒 Tiempo de inicio: ${loadTime.toFixed(2)} ms`);
  
  console.log("[index] 📦 Tamaño de recursos:");
  console.table(
    performance.getEntriesByType("resource").map(resource => ({
      "Recurso": resource.name,
      "Tipo": resource.initiatorType,
      "Tamaño (KB)": (resource.transferSize / 1024).toFixed(2),
      "Tiempo (ms)": resource.duration.toFixed(2)
    }))
  );
};

setTimeout(measureStartup, 0);