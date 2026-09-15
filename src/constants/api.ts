import { Platform } from 'react-native';

/**
 * Hosts de WordPress conocidos.
 *
 * - `PRODUCTION_HOST` — el sitio real de Fatro Ibérica. Cuentas y datos
 *   reales; las pruebas destructivas (registro, baja de cuenta) crean o
 *   desactivan usuarios de verdad.
 * - `STAGING_HOST` — copia de pruebas en SiteGround donde se desarrolló
 *   la app. Puede ir por detrás de producción en contenido y plugin.
 *
 * El host activo se elige con la variable de entorno pública de Expo
 * `EXPO_PUBLIC_API_HOST` (se inyecta en build time, ver
 * https://docs.expo.dev/guides/environment-variables/). Sin variable se
 * usa producción. Para desarrollar contra staging:
 *
 *   EXPO_PUBLIC_API_HOST=https://fatroibericas.sg-host.com npx expo start
 *
 * o un fichero `.env.local` (ignorado por git) con esa línea.
 */
export const PRODUCTION_HOST = 'https://fatroiberica.es';
export const STAGING_HOST = 'https://fatroibericas.sg-host.com';

function normalizeHost(raw: string | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim().replace(/\/+$/, '');
  return /^https?:\/\//.test(trimmed) ? trimmed : null;
}

export const API_HOST =
  normalizeHost(process.env.EXPO_PUBLIC_API_HOST) ?? PRODUCTION_HOST;

/** REST estándar de WordPress (posts, categorías, productos, media). */
export const API_BASE_URL = `${API_HOST}/wp-json/wp/v2`;

/**
 * Base de los endpoints del plugin `json-api-user` (`/api/user/...`).
 *
 * En web (Chrome) esas rutas no envían cabeceras CORS, así que se pasa
 * por el proxy local `proxy-server.js`, que reenvía al mismo `API_HOST`.
 * En móvil nativo no hay CORS y se usa el host directo.
 */
export const PLUGIN_BASE_URL =
  Platform.OS === 'web' ? 'http://localhost:3001' : API_HOST;
