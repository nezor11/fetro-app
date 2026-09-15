import axios, { AxiosError } from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import {
  PLUGIN_BASE_URL,
  postPlugin,
  isNetworkError,
  SessionExpiredError,
} from './pluginApi';

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

/**
 * Claves de almacenamiento.
 *
 * - La cookie de sesión equivale a un token: se guarda en
 *   `expo-secure-store` (Keychain en iOS, Keystore/EncryptedSharedPreferences
 *   en Android). SecureStore no existe en web, así que ahí cae a
 *   AsyncStorage (localStorage), igual que antes.
 * - Los datos del usuario (nombre, email…) no son secretos y siguen en
 *   AsyncStorage.
 *
 * `STORAGE_KEY_COOKIE_LEGACY` es la clave antigua en AsyncStorage. Al
 * arrancar, si existe, se migra a SecureStore y se borra para que las
 * sesiones abiertas antes de este cambio no se pierdan.
 */
const STORAGE_KEY_COOKIE = 'fetro_auth_cookie';
const STORAGE_KEY_COOKIE_LEGACY = '@fetro_auth_cookie';
const STORAGE_KEY_USER = '@fetro_auth_user';

const canUseSecureStore = Platform.OS !== 'web';

async function readCookie(): Promise<string | null> {
  if (canUseSecureStore) {
    const secure = await SecureStore.getItemAsync(STORAGE_KEY_COOKIE);
    if (secure) return secure;
    // Migración desde la clave antigua en AsyncStorage.
    const legacy = await AsyncStorage.getItem(STORAGE_KEY_COOKIE_LEGACY);
    if (legacy) {
      await SecureStore.setItemAsync(STORAGE_KEY_COOKIE, legacy);
      await AsyncStorage.removeItem(STORAGE_KEY_COOKIE_LEGACY);
    }
    return legacy;
  }
  return AsyncStorage.getItem(STORAGE_KEY_COOKIE_LEGACY);
}

async function writeCookie(cookie: string): Promise<void> {
  if (canUseSecureStore) {
    await SecureStore.setItemAsync(STORAGE_KEY_COOKIE, cookie);
    return;
  }
  await AsyncStorage.setItem(STORAGE_KEY_COOKIE_LEGACY, cookie);
}

async function deleteCookie(): Promise<void> {
  if (canUseSecureStore) {
    await SecureStore.deleteItemAsync(STORAGE_KEY_COOKIE);
  }
  await AsyncStorage.removeItem(STORAGE_KEY_COOKIE_LEGACY);
}

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
    const data = await postPlugin<LoginResponse & { error?: string }>(
      '/api/user/generate_auth_cookie/',
      { email, password },
      10000
    );

    if (data.status === 'error') {
      throw new Error(data.error || 'Error al iniciar sesión');
    }

    // Persist cookie and user data
    await writeCookie(data.cookie);
    await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(data.user));

    return data;
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
    const data = await postPlugin<RegisterResponse & { error?: string }>(
      '/api/user/register/',
      {
        username,
        email,
        user_pass: password,
        display_name: displayName,
        nonce,
        notify: 'both',
      },
      10000
    );

    if (data.status === 'error') {
      throw new Error(data.error || 'Error al registrarse');
    }

    return data;
  } catch (err) {
    handleNetworkError(err, 'registrarse');
  }
}

export async function getNonce(): Promise<string> {
  try {
    const response = await axios.get(
      `${PLUGIN_BASE_URL}/api/get_nonce/?controller=user&method=register&insecure=cool`
    );
    return response.data.nonce;
  } catch (err) {
    handleNetworkError(err, 'obtener nonce');
  }
}

/**
 * Resultado de validar la cookie contra el servidor:
 *
 * - `valid`       → el servidor confirma que la sesión sigue viva.
 * - `invalid`     → el servidor responde y dice que NO es válida
 *                   (caducada, usuario dado de baja…).
 * - `unreachable` → no hemos podido preguntar (sin red, timeout,
 *                   servidor caído). No sabemos nada de la cookie.
 *
 * Distinguirlo importa: antes cualquier fallo se trataba como
 * `invalid` y arrancar la app sin cobertura cerraba la sesión.
 */
export type CookieValidation = 'valid' | 'invalid' | 'unreachable';

export async function validateCookie(cookie: string): Promise<CookieValidation> {
  try {
    const data = await postPlugin<{ status?: string; valid?: boolean }>(
      '/api/user/validate_auth_cookie/',
      { cookie },
      10000
    );
    return data.status === 'ok' && data.valid === true ? 'valid' : 'invalid';
  } catch (err) {
    if (err instanceof SessionExpiredError) return 'invalid';
    if (isNetworkError(err)) return 'unreachable';
    // Respuesta HTTP de error (500, 404…) o body inesperado: tampoco
    // sabemos si la cookie es válida. Conservamos la sesión.
    return 'unreachable';
  }
}

export interface StoredAuthResult {
  auth: { cookie: string; user: UserData } | null;
  /**
   * `true` cuando había una sesión guardada pero el servidor la ha
   * rechazado. Permite avisar al usuario de que debe volver a entrar,
   * en vez de mostrarle el login sin explicación.
   */
  expired: boolean;
}

/**
 * Recupera la sesión guardada. Solo se descarta si el servidor confirma
 * que la cookie ya no es válida; si no hay red, se devuelve la sesión
 * tal cual para que la app arranque offline con la caché que tenga.
 */
export async function getStoredAuth(): Promise<StoredAuthResult> {
  let cookie: string | null = null;
  let userStr: string | null = null;
  try {
    cookie = await readCookie();
    userStr = await AsyncStorage.getItem(STORAGE_KEY_USER);
  } catch {
    // Storage corrupto o inaccesible: tratamos como "sin sesión".
  }

  if (!cookie || !userStr) {
    await clearAuth();
    return { auth: null, expired: false };
  }

  let user: UserData;
  try {
    user = JSON.parse(userStr);
  } catch {
    await clearAuth();
    return { auth: null, expired: false };
  }

  const validation = await validateCookie(cookie);
  if (validation === 'invalid') {
    await clearAuth();
    return { auth: null, expired: true };
  }
  return { auth: { cookie, user }, expired: false };
}

export async function retrievePassword(email: string): Promise<string> {
  try {
    const data = await postPlugin<{ status: string; error?: string; msg?: string }>(
      '/api/user/retrieve_password/',
      { user_login: email },
      10000
    );

    if (data.status === 'error') {
      throw new Error(data.error || 'Error al enviar el correo de recuperación');
    }

    return data.msg || 'Se ha enviado un enlace de recuperación a tu correo electrónico.';
  } catch (err) {
    handleNetworkError(err, 'recuperar contraseña');
  }
}

export async function clearAuth(): Promise<void> {
  try {
    await deleteCookie();
  } catch {
    // SecureStore puede fallar en entornos raros; no bloqueamos el
    // logout por ello.
  }
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
 * borrarla del almacenamiento nadie puede volver a usarla desde la app.
 */
export async function unsubscribeAccount(cookie: string): Promise<void> {
  try {
    const data = await postPlugin<any>(
      '/api/user/unsubscribe_account/',
      { cookie }
    );

    // El endpoint devuelve `true` directo en el body (no un objeto
    // `{status, ...}` como otros endpoints del plugin). Aceptamos
    // tanto `true` como `{status:'ok'}` por si cambian la forma.
    if (data !== true && data?.status !== 'ok') {
      throw new Error(data?.error || 'No se pudo dar de baja la cuenta');
    }
  } catch (err) {
    handleNetworkError(err, 'dar de baja la cuenta');
  }
}
