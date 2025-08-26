// File: /frontend/src/app/contexts/AuthContext.js

/**
 * @file Proveedor de Contexto para la Autenticación global de la aplicación.
 * @description Este módulo gestiona el estado de autenticación (usuario, token, etc.)
 * y proporciona funciones para `login` y `logout`. Actúa como la única fuente de verdad
 * para el estado de la sesión del usuario en toda la aplicación.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';

import { loginAPI, verifyTokenAPI } from '../../features/auth/api/authAPI';
import { setAuthToken, getAuthToken, removeAuthToken } from '../../utils/auth/auth';
import { formatApiError } from '../../utils/errorUtils';

// ==============================================================================
// SECCIÓN 2: DEFINICIÓN DEL CONTEXTO Y DEL REDUCER
// ==============================================================================

const AuthContext = createContext(null);

const initialState = {
    isAuthenticated: false,
    isInitialized: false, // Flag para saber si la verificación inicial del token ya se ejecutó.
    isLoading: false,
    user: null,
    error: null,
};

const authReducer = (state, action) => {
    switch (action.type) {
        case 'INITIALIZE':
            return {
                ...state,
                isAuthenticated: Boolean(action.payload.user),
                user: action.payload.user,
                isInitialized: true,
                isLoading: false,
            };
        case 'LOGIN_REQUEST':
            return {
                ...state,
                isLoading: true,
                error: null,
            };
        case 'LOGIN_SUCCESS':
            return {
                ...state,
                isAuthenticated: true,
                user: action.payload.user,
                isLoading: false,
                error: null,
            };
        case 'LOGIN_FAILURE':
            return {
                ...state,
                isAuthenticated: false,
                user: null,
                isLoading: false,
                error: action.payload.error,
            };
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

// ==============================================================================
// SECCIÓN 3: COMPONENTE PROVEEDOR (PROVIDER)
// ==============================================================================

export const AuthProvider = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    useEffect(() => {
        const initializeAuth = async () => {
            const token = getAuthToken();
            if (token) {
                try {
                    const user = await verifyTokenAPI();
                    dispatch({ type: 'INITIALIZE', payload: { user } });
                } catch (error) {
                    removeAuthToken();
                    dispatch({ type: 'INITIALIZE', payload: { user: null } });
                }
            } else {
                dispatch({ type: 'INITIALIZE', payload: { user: null } });
            }
        };

        initializeAuth();
    }, []);

    const login = useCallback(async (credentials) => {
        dispatch({ type: 'LOGIN_REQUEST' });
        try {
            const { access_token, user } = await loginAPI(credentials);
            setAuthToken(access_token);
            dispatch({ type: 'LOGIN_SUCCESS', payload: { user } });
        } catch (error) {
            const errorMessage = formatApiError(error);
            dispatch({ type: 'LOGIN_FAILURE', payload: { error: errorMessage } });
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

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired,
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