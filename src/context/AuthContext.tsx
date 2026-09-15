import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  login as loginService,
  clearAuth,
  getStoredAuth,
  UserData,
} from '../services/auth';
import { setSessionInvalidHandler } from '../services/pluginApi';
import { queryClient } from '../queryClient';

interface AuthState {
  user: UserData | null;
  cookie: string | null;
  isLoading: boolean;
  isLoggedIn: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /**
   * Aviso pendiente para la pantalla de login, p.ej. "Tu sesión ha
   * caducado". Lo pone el propio contexto al cerrar sesión por causa
   * ajena al usuario y lo limpia `LoginScreen` cuando lo muestra o
   * cuando el usuario vuelve a entrar.
   */
  sessionMessage: string | null;
  clearSessionMessage: () => void;
}

const SESSION_EXPIRED_MESSAGE =
  'Tu sesión ha caducado. Vuelve a iniciar sesión para continuar.';

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    cookie: null,
    isLoading: true,
    isLoggedIn: false,
  });
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);
  // Espejo de `isLoggedIn` para que el handler global (que vive fuera
  // del ciclo de render) sepa si hay sesión que cerrar sin depender de
  // closures obsoletas.
  const loggedInRef = useRef(false);

  /**
   * Cierra la sesión localmente y vacía todo lo que dependía del
   * usuario: cookie y datos en storage, y la caché de TanStack Query
   * (si otro usuario entra en el mismo dispositivo no debe ver datos
   * del anterior aunque las queryKeys incluyan la cookie).
   */
  const endSession = useCallback(async (message: string | null) => {
    loggedInRef.current = false;
    await clearAuth();
    queryClient.clear();
    setSessionMessage(message);
    setState({
      user: null,
      cookie: null,
      isLoading: false,
      isLoggedIn: false,
    });
  }, []);

  useEffect(() => {
    getStoredAuth()
      .then(({ auth, expired }) => {
        if (auth) {
          loggedInRef.current = true;
          setState({
            user: auth.user,
            cookie: auth.cookie,
            isLoading: false,
            isLoggedIn: true,
          });
        } else {
          if (expired) setSessionMessage(SESSION_EXPIRED_MESSAGE);
          setState((s) => ({ ...s, isLoading: false }));
        }
      })
      .catch(() => setState((s) => ({ ...s, isLoading: false })));
  }, []);

  // Cualquier servicio que reciba "Invalid cookie" del backend avisa
  // aquí. Varias queries en paralelo pueden fallar a la vez; solo la
  // primera cierra la sesión, el resto no hace nada.
  useEffect(() => {
    setSessionInvalidHandler(() => {
      if (!loggedInRef.current) return;
      void endSession(SESSION_EXPIRED_MESSAGE);
    });
    return () => setSessionInvalidHandler(null);
  }, [endSession]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await loginService(email, password);
    loggedInRef.current = true;
    setSessionMessage(null);
    setState({
      user: response.user,
      cookie: response.cookie,
      isLoading: false,
      isLoggedIn: true,
    });
  }, []);

  const logout = useCallback(async () => {
    await endSession(null);
  }, [endSession]);

  const clearSessionMessage = useCallback(() => setSessionMessage(null), []);

  return (
    <AuthContext.Provider
      value={{ ...state, login, logout, sessionMessage, clearSessionMessage }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
