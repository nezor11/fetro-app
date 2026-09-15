import axios, { AxiosError } from 'axios';
import { PLUGIN_BASE_URL } from '../constants/api';

/**
 * Acceso común a los endpoints del plugin `json-api-user`
 * (`/api/user/...`, `/api/get_nonce/`).
 *
 * Todas las llamadas que llevan `cookie` van por **POST** con el body
 * `x-www-form-urlencoded`. El plugin lee los parámetros de `$_REQUEST`,
 * así que acepta indistintamente GET o POST, pero con POST la cookie de
 * sesión no acaba en la URL (logs de servidor, proxies, historial).
 */
export { PLUGIN_BASE_URL };

const DEFAULT_TIMEOUT = 15000;

export type FormParams = Record<string, string | number | null | undefined>;

/**
 * Error que lanza `postPlugin` cuando el servidor rechaza la cookie de
 * sesión. Las pantallas no necesitan tratarlo: `AuthContext` se
 * suscribe vía `setSessionInvalidHandler` y cierra la sesión con un
 * aviso, y `queryClient` no reintenta este tipo de error.
 */
export class SessionExpiredError extends Error {
  constructor(message = 'Tu sesión ha caducado. Vuelve a iniciar sesión.') {
    super(message);
    this.name = 'SessionExpiredError';
  }
}

type SessionInvalidHandler = () => void;
let sessionInvalidHandler: SessionInvalidHandler | null = null;

/** Registra el callback que se dispara al detectar una cookie inválida. */
export function setSessionInvalidHandler(handler: SessionInvalidHandler | null) {
  sessionInvalidHandler = handler;
}

/** Mensaje literal que devuelve el plugin ante una cookie rechazada. */
const INVALID_COOKIE_PATTERN = /invalid cookie/i;

function toFormBody(params: FormParams): string {
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue;
    body.append(key, String(value));
  }
  return body.toString();
}

/**
 * POST a un endpoint del plugin. `path` es relativo a la base, p.ej.
 * `/api/user/get_solicitudes/`. Devuelve el body parseado como `T`.
 *
 * Si la petición llevaba `cookie` y el servidor responde con el error
 * de cookie inválida, lanza `SessionExpiredError` y avisa al handler
 * global antes de devolver el control.
 */
export async function postPlugin<T = any>(
  path: string,
  params: FormParams,
  timeout: number = DEFAULT_TIMEOUT
): Promise<T> {
  const response = await axios.post<T>(
    `${PLUGIN_BASE_URL}${path}`,
    toFormBody({ insecure: 'cool', ...params }),
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout,
    }
  );

  const data = response.data as any;
  if (
    params.cookie &&
    data &&
    data.status === 'error' &&
    typeof data.error === 'string' &&
    INVALID_COOKIE_PATTERN.test(data.error)
  ) {
    sessionInvalidHandler?.();
    throw new SessionExpiredError();
  }

  return response.data;
}

/**
 * `true` si el error es de red (sin respuesta del servidor): sin
 * conexión, timeout, DNS, CORS… Se usa para distinguir "el servidor
 * dijo que no" de "no hemos podido preguntar".
 */
export function isNetworkError(err: unknown): boolean {
  return err instanceof AxiosError && !err.response;
}
