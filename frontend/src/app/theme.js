// src/app/theme.js
import { createTheme } from '@mui/material/styles';

// --- OPTIMIZACIÓN: Centralizamos el ancho del menú en una constante ---
// Cambia este valor para ajustar el ancho del menú lateral en toda la aplicación.
// Lo hemos aumentado de 240 a 280 para dar más espacio a los textos e iconos.
const DRAWER_WIDTH = 280;

const theme = createTheme({
  // --- MODIFICACIÓN CLAVE: Se actualiza el valor del ancho del menú ---
  mixins: {
    drawerWidth: DRAWER_WIDTH,
  },
  palette: {
    primary: {
      main: '#1e3a8a',
      light: '#3b82f6',
      dark: '#1d4ed8',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#0f766e',
      light: '#0d9488',
      dark: '#115e59',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
    },
    divider: '#e2e8f0',
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
    h5: {
      fontWeight: 700,
      fontSize: '1.5rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    subtitle1: {
      fontWeight: 500,
    },
    body1: {
      fontSize: '0.875rem',
    },
    body2: {
      fontSize: '0.8125rem',
    },
  },
  shape: {
    borderRadius: 8,
  },
  // Se conservan tus personalizaciones de componentes, que están bien estructuradas.
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            backgroundColor: 'rgba(59, 130, 246, 0.08)',
            '&:hover': {
              backgroundColor: 'rgba(59, 130, 246, 0.12)',
            },
          },
        },
      },
    },
  },
});

export default theme;