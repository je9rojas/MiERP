// /frontend/src/app/contexts/AuthContext.js

/**
 * @file [VERSIÓN FINAL CORREGIDA] Proveedor de Contexto de Autenticación.
 *
 * Este archivo es el cerebro de la gestión de sesión del usuario. Expone el estado
 * de autenticación (si el usuario está logueado, quién es, su rol, etc.) y las
 * funciones para `login` y `logout` a toda la aplicación.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import { loginAPI, verifyTokenAPI } from '../../features/auth/api/authAPI';
import { setAuthToken, getAuthToken, removeAuthToken } from '../../utils/auth/auth';
import { formatApiError } from '../../utils/errorUtils';

// ==============================================================================
// SECCIÓN 2: DEFINICIÓN DEL CONTEXTO Y DEL REDUCER
// ==============================================================================

const AuthContext = createContext(null);

const authReducer = (state, action) => {
    // Mantendremos los logs para futuras depuraciones
    console.log(`[AuthReducer] Acción despachada: ${action.type}`, { payload: action.payload, estadoAnterior: state });
    
    switch (action.type) {
        case 'INITIALIZE':
            return {
                ...state,
                isAuthenticated: !!action.payload.user,
                user: action.payload.user,
                isInitialized: true,
                isLoading: false,
            };
        case 'LOGIN_REQUEST':
            return { ...state, isLoading: true, error: null };
        case 'LOGIN_SUCCESS':
            return {
                ...state,
                isAuthenticated: true,
                user: action.payload.user,
                isLoading: false,
                error: null,
            };
        case 'LOGIN_FAILURE':
            return { ...state, isLoading: false, error: action.payload };
        case 'LOGOUT':
            return {
                ...state,
                isAuthenticated: false,
                user: null,
            };
        default:
            return state;
    }
};

const initialState = {
    isAuthenticated: false,
    isInitialized: false,
    isLoading: false,
    user: null,
    error: null,
};

// ==============================================================================
// SECCIÓN 3: COMPONENTE PROVEEDOR (PROVIDER)
// ==============================================================================

export const AuthProvider = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    useEffect(() => {
        const controller = new AbortController();

        const initializeAuth = async () => {
            let user = null;
            let shouldInitialize = true;

            try {
                const token = getAuthToken();
                if (token) {
                    user = await verifyTokenAPI(controller.signal);
                }
            } catch (error) {
                if (error.name === 'CanceledError') {
                    // Si la petición fue cancelada por StrictMode, le decimos al
                    // `finally` que no haga nada, porque el segundo `useEffect`
                    // se encargará de la inicialización.
                    shouldInitialize = false;
                } else {
                    // Si es un error real (token inválido/red), limpiamos el token.
                    // El usuario seguirá siendo `null`.
                    removeAuthToken();
                }
            } finally {
                // --- CORRECCIÓN CRÍTICA ---
                // Solo despachamos la acción de inicializar si la petición
                // NO fue cancelada. Esto asegura que solo el segundo `useEffect`
                // de StrictMode complete la inicialización.
                if (shouldInitialize) {
                    dispatch({ type: 'INITIALIZE', payload: { user } });
                }
            }
        };

        initializeAuth();

        return () => {
            controller.abort();
        };
    }, []);

    const login = useCallback(async (credentials) => {
        dispatch({ type: 'LOGIN_REQUEST' });
        try {
            const { access_token, user } = await loginAPI(credentials);
            setAuthToken(access_token);
            dispatch({ type: 'LOGIN_SUCCESS', payload: { user } });
        } catch (error) {
            const errorMessage = formatApiError(error) || 'Credenciales incorrectas o error de red.';
            dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
            throw new Error(errorMessage);
        }
    }, []);

    const logout = useCallback(() => {
        removeAuthToken();
        dispatch({ type: 'LOGOUT' });
    }, []);

    const value = useMemo(() => ({
        ...state,
        login,
        logout,
    }), [state, login, logout]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// ==============================================================================
// SECCIÓN 4: HOOK PERSONALIZADO
// ==============================================================================

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
    }
    return context;
};