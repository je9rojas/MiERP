// /frontend/src/app/contexts/AuthContext.js
// CÓDIGO COMPLETO - NO NECESITA CAMBIOS PERO SE INCLUYE POR CLARIDAD

import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import { loginAPI, getUserProfile, verifyToken } from '../../features/auth/api/authAPI';
import { setAuthToken, getAuthToken, removeAuthToken } from '../../utils/auth/auth';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'INITIALIZE':
      return { ...state, isAuthenticated: action.payload.isAuthenticated, user: action.payload.user, isInitialized: true, isLoading: false };
    case 'LOGIN_REQUEST':
      return { ...state, isLoading: true, error: null };
    case 'LOGIN_SUCCESS':
      return { ...state, user: action.payload.user, isAuthenticated: true, isLoading: false, error: null };
    case 'LOGIN_FAILURE':
      return { ...state, error: action.payload, isLoading: false };
    case 'LOGOUT':
      return { ...state, user: null, isAuthenticated: false };
    default:
      return state;
  }
};

const initialState = {
  isAuthenticated: false,
  user: null,
  isLoading: false,
  isInitialized: false,
  error: null
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          dispatch({ type: 'INITIALIZE', payload: { isAuthenticated: false, user: null } });
          return;
        }
        await verifyToken(); 
        const user = await getUserProfile();
        dispatch({ type: 'INITIALIZE', payload: { isAuthenticated: true, user } });
      } catch (error) {
        removeAuthToken();
        dispatch({ type: 'INITIALIZE', payload: { isAuthenticated: false, user: null } });
      }
    };
    initializeAuth();
  }, []);

  const login = useCallback(async (credentials) => {
    console.log('[AuthContext] 1. Iniciando proceso de login...');
    dispatch({ type: 'LOGIN_REQUEST' });
    try {
      console.log('[AuthContext] 2. Llamando a loginAPI...');
      const { token, user } = await loginAPI(credentials);
      console.log('[AuthContext] 6. loginAPI ha respondido exitosamente. Guardando token...');
      setAuthToken(token);
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user } });
      console.log('[AuthContext] 7. Login completado.');
    } catch (error) {
      console.error('[AuthContext] 8. Se ha producido un error durante el login.', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Credenciales incorrectas';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
    }
  }, []);

  const logout = useCallback(() => {
    removeAuthToken();
    dispatch({ type: 'LOGOUT' });
  }, []);

  const value = useMemo(() => ({ ...state, login, logout }), [state, login, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) { throw new Error('useAuth debe usarse dentro de un AuthProvider'); }
  return context;
};