// /frontend/src/app/contexts/AuthContext.js

/**
 * @file Proveedor de Contexto de Autenticación.
 *
 * Este archivo es el cerebro de la gestión de sesión del usuario. Expone el estado
 * de autenticación (si el usuario está logueado, quién es, su rol, etc.) y las
 * funciones para `login` y `logout` a toda la aplicación. Está diseñado para ser
 * robusto y compatible con el `StrictMode` de React 18.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import { loginAPI, verifyTokenAPI } from '../../features/auth/api/authAPI';
import { setAuthToken, getAuthToken, removeAuthToken } from '../../utils/auth/auth';

// ==============================================================================
// SECCIÓN 2: DEFINICIÓN DEL CONTEXTO Y DEL REDUCER
// ==============================================================================

const AuthContext = createContext(null);

const authReducer = (state, action) => {
    console.log(`[AuthReducer] Acción despachada: ${action.type}`, { payload: action.payload, estadoAnterior: state });
    
    switch (action.type) {
        case 'INITIALIZE':
            return {
                ...state,
                isAuthenticated: !!action.payload.user, // La autenticación depende de si hay un usuario
                user: action.payload.user,
                isInitialized: true, // <- La clave es que esto siempre se ponga a true
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

    console.log("[DEBUG] AuthProvider: Renderizando componente proveedor.");

    useEffect(() => {
        console.log("[DEBUG] AuthProvider: useEffect de inicialización se ha disparado.");
        const controller = new AbortController();

        const initializeAuth = async () => {
            console.log("[DEBUG] AuthProvider: Iniciando la función `initializeAuth`...");
            const token = getAuthToken();
            let user = null;

            try {
                if (token) {
                    console.log("[DEBUG] AuthProvider: Token encontrado. Intentando verificar con la API.");
                    user = await verifyTokenAPI(controller.signal);
                    console.log("[DEBUG] AuthProvider: Verificación de token exitosa. Usuario recibido:", user);
                }
            } catch (error) {
                console.error("[DEBUG] AuthProvider: Error durante la verificación del token.", error);
                if (error.name === 'CanceledError') {
                    console.log("[DEBUG] AuthProvider: La petición de verificación fue cancelada (comportamiento normal en StrictMode).");
                    // No hacemos nada y no despachamos, simplemente dejamos que el useEffect se limpie
                    // y se vuelva a ejecutar. NO terminamos la función aquí.
                } else {
                    console.warn("[DEBUG] AuthProvider: Token inválido o error de red. Limpiando sesión.");
                    removeAuthToken();
                    // El usuario seguirá siendo null.
                }
            } finally {
                // --- CORRECCIÓN CRÍTICA ---
                // El bloque `finally` se ejecuta SIEMPRE: en éxito, en error o en cancelación.
                // Aquí es donde garantizamos que la aplicación se "desbloquee".
                // Solo despachamos si la petición no fue cancelada, para evitar un re-render innecesario.
                if (!controller.signal.aborted) {
                    console.log("[DEBUG] AuthProvider: Proceso de inicialización finalizado. Despachando estado final.");
                    dispatch({ type: 'INITIALIZE', payload: { user } });
                }
            }
        };

        initializeAuth();

        return () => {
            console.log("[DEBUG] AuthProvider: Ejecutando limpieza de useEffect (abortando petición).");
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