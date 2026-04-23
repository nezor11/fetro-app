import axios, { AxiosError } from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * En web (Chrome), las peticiones al servidor de WordPress son bloqueadas
 * por CORS. Usamos un proxy local (proxy-server.js) que reenvía las
 * peticiones y añade las cabeceras CORS necesarias.
 * En móvil nativo no hay restricciones CORS, así que se usa la URL directa.
 */
const AUTH_BASE_URL =
  Platform.OS === 'web'
    ? 'http://localhost:3001'
    : 'https://fatroibericas.sg-host.com';

export interface UserData {
  id: number;
  username: string;
  email: string;
  displayname: string;
  firstname: string;
  lastname: string;
  nickname: string;
  avatar: string | null;
  meta: Record<string, any>;
}

export interface LoginResponse {
  status: string;
  cookie: string;
  cookie_name: string;
  user: UserData;
}

export interface RegisterResponse {
  status: string;
  cookie: string;
  user_id: number;
}

const STORAGE_KEY_COOKIE = '@fetro_auth_cookie';
const STORAGE_KEY_USER = '@fetro_auth_user';

/**
 * Handles network errors providing clear messages.
 * On web, CORS blocks cross-origin requests to the auth API.
 */
function handleNetworkError(err: unknown, action: string): never {
  if (err instanceof AxiosError) {
    // No response = network error (CORS block, no internet, server down)
    if (!err.response) {
      if (Platform.OS === 'web') {
        throw new Error(
          `Error de red al ${action}. En navegador web, las peticiones al servidor pueden estar bloqueadas por CORS. Prueba desde Expo Go en tu móvil.`
        );
      }
      throw new Error(
        `Error de conexión al ${action}. Verifica tu conexión a internet.`
      );
    }
    // Server responded with an error status
    const data = err.response.data;
    if (data?.error) {
      throw new Error(data.error);
    }
  }
  if (err instanceof Error) {
    throw err;
  }
  throw new Error(`Error desconocido al ${action}`);
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  try {
    const formData = new URLSearchParams();
    formData.append('email', email);
    formData.append('password', password);
    formData.append('insecure', 'cool');

    const response = await axios.post(
      `${AUTH_BASE_URL}/api/user/generate_auth_cookie/`,
      formData.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    if (response.data.status === 'error') {
      throw new Error(response.data.error || 'Error al iniciar sesión');
    }

    // Persist cookie and user data
    await AsyncStorage.setItem(STORAGE_KEY_COOKIE, response.data.cookie);
    await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(response.data.user));

    return response.data;
  } catch (err) {
    handleNetworkError(err, 'iniciar sesión');
  }
}

export async function register(
  username: string,
  email: string,
  password: string,
  displayName: string,
  nonce: string
): Promise<RegisterResponse> {
  try {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('email', email);
    formData.append('user_pass', password);
    formData.append('display_name', displayName);
    formData.append('nonce', nonce);
    formData.append('insecure', 'cool');
    formData.append('notify', 'both');

    const response = await axios.post(
      `${AUTH_BASE_URL}/api/user/register/`,
      formData.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    if (response.data.status === 'error') {
      throw new Error(response.data.error || 'Error al registrarse');
    }

    return response.data;
  } catch (err) {
    handleNetworkError(err, 'registrarse');
  }
}

export async function getNonce(): Promise<string> {
  try {
    const response = await axios.get(
      `${AUTH_BASE_URL}/api/get_nonce/?controller=user&method=register&insecure=cool`
    );
    return response.data.nonce;
  } catch (err) {
    handleNetworkError(err, 'obtener nonce');
  }
}

export async function validateCookie(cookie: string): Promise<boolean> {
  try {
    const response = await axios.get(
      `${AUTH_BASE_URL}/api/user/validate_auth_cookie/?cookie=${encodeURIComponent(cookie)}&insecure=cool`
    );
    return response.data.status === 'ok' && response.data.valid === true;
  } catch {
    return false;
  }
}

export async function getStoredAuth(): Promise<{ cookie: string; user: UserData } | null> {
  try {
    const cookie = await AsyncStorage.getItem(STORAGE_KEY_COOKIE);
    const userStr = await AsyncStorage.getItem(STORAGE_KEY_USER);
    if (cookie && userStr) {
      const isValid = await validateCookie(cookie);
      if (isValid) {
        return { cookie, user: JSON.parse(userStr) };
      }
    }
  } catch {}
  await clearAuth();
  return null;
}

export async function retrievePassword(email: string): Promise<string> {
  try {
    const formData = new URLSearchParams();
    formData.append('user_login', email);
    formData.append('insecure', 'cool');

    const response = await axios.post(
      `${AUTH_BASE_URL}/api/user/retrieve_password/`,
      formData.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    if (response.data.status === 'error') {
      throw new Error(response.data.error || 'Error al enviar el correo de recuperación');
    }

    return response.data.msg || 'Se ha enviado un enlace de recuperación a tu correo electrónico.';
  } catch (err) {
    handleNetworkError(err, 'recuperar contraseña');
  }
}

export async function clearAuth(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY_COOKIE);
  await AsyncStorage.removeItem(STORAGE_KEY_USER);
}

/**
 * Da de baja la cuenta del usuario autenticado. El endpoint
 * `unsubscribe_account` del plugin hace un **soft-delete**: marca el
 * meta `account_activated = 0` del usuario pero no elimina la cuenta
 * del backend. Esto respeta GDPR (derecho al olvido) sin perder el
 * histórico con fines legales/fiscales — si el usuario quiere borrado
 * completo, hay que contactar con el DPO.
 *
 * Flujo esperado tras esta llamada:
 *
 * 1. El backend responde `true` y pone `account_activated = 0`.
 * 2. La app limpia la cookie local con `clearAuth()`.
 * 3. El `AuthContext` marca `isLoggedIn = false`.
 * 4. `RootNavigator` conmuta automáticamente al stack de Login.
 *
 * No hace `wp_logout_user` server-side, así que técnicamente la
 * cookie de WP sigue siendo válida hasta su expiración — pero al
 * borrarla de AsyncStorage nadie puede volver a usarla desde la app.
 */
export async function unsubscribeAccount(cookie: string): Promise<void> {
  try {
    const response = await axios.get(
      `${AUTH_BASE_URL}/api/user/unsubscribe_account/`,
      { params: { cookie, insecure: 'cool' }, timeout: 15000 }
    );

    // El endpoint devuelve `true` directo en el body (no un objeto
    // `{status, ...}` como otros endpoints del plugin). Aceptamos
    // tanto `true` como `{status:'ok'}` por si cambian la forma.
    if (
      response.data !== true &&
      response.data?.status !== 'ok'
    ) {
      throw new Error(
        response.data?.error || 'No se pudo dar de baja la cuenta'
      );
    }
  } catch (err) {
    handleNetworkError(err, 'dar de baja la cuenta');
  }
}
