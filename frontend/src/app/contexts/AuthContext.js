import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { loginAPI, getUserProfile, verifyToken } from '../../api/authAPI';
import { setAuthToken, getAuthToken, removeAuthToken } from '../../utils/auth/auth';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return { 
        ...state, 
        user: action.payload.user, 
        isAuthenticated: true, 
        isLoading: false,
        error: null
      };
    case 'LOGOUT':
      return { 
        ...state, 
        user: null, 
        isAuthenticated: false, 
        isLoading: false 
      };
    case 'LOADING':
      return { ...state, isLoading: true, error: null };
    case 'ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'AUTH_CHECK_COMPLETE':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: action.payload.isAuthenticated,
        user: action.payload.user || null
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    isAuthenticated: false,
    user: null,
    isLoading: true,
    error: null
  });

  const login = async (credentials) => {
    dispatch({ type: 'LOADING' });
    try {
      const { token, user } = await loginAPI(credentials);
      setAuthToken(token);
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user } });
      return { success: true, user }; // Devuelve éxito para que el componente maneje la navegación
    } catch (error) {
      dispatch({ 
        type: 'ERROR', 
        payload: error.message || 'Credenciales incorrectas' 
      });
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    removeAuthToken();
    dispatch({ type: 'LOGOUT' });
    return { success: true }; // Devuelve éxito para que el componente maneje la navegación
  };

  const checkAuth = async () => {
    dispatch({ type: 'LOADING' });
    try {
      const token = getAuthToken();
      if (!token) {
        dispatch({ type: 'AUTH_CHECK_COMPLETE', payload: { isAuthenticated: false } });
        return;
      }

      // Verificar token primero
      const tokenValid = await verifyToken();
      if (!tokenValid) {
        removeAuthToken();
        dispatch({ type: 'AUTH_CHECK_COMPLETE', payload: { isAuthenticated: false } });
        return;
      }

      // Obtener datos del usuario
      const user = await getUserProfile();
      console.log('Perfil de usuario obtenido:', user);
      dispatch({ type: 'AUTH_CHECK_COMPLETE', payload: { isAuthenticated: true, user } });
    } catch (error) {
      removeAuthToken();
      dispatch({ type: 'AUTH_CHECK_COMPLETE', payload: { isAuthenticated: false } });
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      logout,
      checkAuth,
      hasRole: (role) => state.user?.role === role,
      isAdmin: () => state.user?.role === 'admin' || state.user?.role === 'superadmin'
    }}>
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