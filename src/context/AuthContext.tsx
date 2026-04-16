import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  login as loginService,
  clearAuth,
  getStoredAuth,
  UserData,
} from '../services/auth';

interface AuthState {
  user: UserData | null;
  cookie: string | null;
  isLoading: boolean;
  isLoggedIn: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    cookie: null,
    isLoading: true,
    isLoggedIn: false,
  });

  useEffect(() => {
    getStoredAuth()
      .then((auth) => {
        if (auth) {
          setState({
            user: auth.user,
            cookie: auth.cookie,
            isLoading: false,
            isLoggedIn: true,
          });
        } else {
          setState((s) => ({ ...s, isLoading: false }));
        }
      })
      .catch(() => setState((s) => ({ ...s, isLoading: false })));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await loginService(email, password);
    setState({
      user: response.user,
      cookie: response.cookie,
      isLoading: false,
      isLoggedIn: true,
    });
  }, []);

  const logout = useCallback(async () => {
    await clearAuth();
    setState({
      user: null,
      cookie: null,
      isLoading: false,
      isLoggedIn: false,
    });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
