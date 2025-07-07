// /frontend/src/app/contexts/AuthContext.js
// CÓDIGO COMPLETO, CORREGIDO Y OPTIMIZADO - LISTO PARA COPIAR Y PEGAR

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { loginAPI, getUserProfile, verifyToken } from '../../api/authAPI';
import { setAuthToken, getAuthToken, removeAuthToken } from '../../utils/auth/auth';

const AuthContext = createContext();

// El reducer ahora maneja el estado de inicialización
const authReducer = (state, action) => {
  console.log(`[AuthReducer] Action: ${action.type}`, action.payload);
  switch (action.type) {
    case 'INITIALIZE':
      return {
        ...state,
        isAuthenticated: action.payload.isAuthenticated,
        user: action.payload.user,
        isInitialized: true, // <-- La app ya está inicializada, las rutas pueden renderizar
        isLoading: false,
      };
    case 'LOGIN_REQUEST':
      return { ...state, isLoading: true, error: null };
    case 'LOGIN_SUCCESS':
      return { 
        ...state, 
        user: action.payload.user, 
        isAuthenticated: true, 
        isLoading: false,
        error: null
      };
    case 'LOGIN_FAILURE':
        return { ...state, error: action.payload, isLoading: false };
    case 'LOGOUT':
      return { 
        ...state, 
        user: null, 
        isAuthenticated: false,
      };
    default:
      return state;
  }
};

const initialState = {
  isAuthenticated: false,
  user: null,
  isLoading: false, // isLoading es para acciones como login/logout, no para la carga inicial
  isInitialized: false, // NUEVO: Controla si la verificación inicial ya se completó
  error: null
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Este useEffect se ejecuta UNA SOLA VEZ al montar el componente.
  // Su única responsabilidad es verificar el token y marcar la app como "inicializada".
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('[AuthProvider] Iniciando verificación de sesión...');
      try {
        const token = getAuthToken();
        if (!token) {
          console.log('[AuthProvider] No hay token, inicialización completada como no autenticado.');
          dispatch({ type: 'INITIALIZE', payload: { isAuthenticated: false, user: null } });
          return;
        }
        // Si hay token, verificamos que sea válido y obtenemos el perfil
        await verifyToken(); 
        const user = await getUserProfile();
        console.log('[AuthProvider] Token y perfil válidos. Inicialización completada como autenticado.');
        dispatch({ type: 'INITIALIZE', payload: { isAuthenticated: true, user } });
      } catch (error) {
        console.warn('[AuthProvider] Fallo en la inicialización (token inválido o error de red), limpiando sesión:', error.message);
        removeAuthToken();
        dispatch({ type: 'INITIALIZE', payload: { isAuthenticated: false, user: null } });
      }
    };
    
    initializeAuth();
  }, []); // El array de dependencias vacío [] GARANTIZA que solo se ejecute una vez.

  const login = useCallback(async (credentials) => {
    dispatch({ type: 'LOGIN_REQUEST' });
    try {
      const { token, user } = await loginAPI(credentials);
      setAuthToken(token);
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user } });
      return { success: true, user };
    } catch (error) {
      const errorMessage = error.response?.data?.detail || error.message || 'Credenciales incorrectas';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, []); // useCallback con array vacío es seguro porque no depende de props o estado

  const logout = useCallback(() => {
    removeAuthToken();
    dispatch({ type: 'LOGOUT' });
  }, []);

  const hasRole = useCallback((role) => state.user?.role === role, [state.user]);
  const isAdmin = useCallback(() => ['admin', 'superadmin'].includes(state.user?.role), [state.user]);
  
  return (
    <AuthContext.Provider value={{ ...state, login, logout, hasRole, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};