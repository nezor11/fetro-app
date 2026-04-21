import axios from 'axios';
import { Platform } from 'react-native';

/**
 * Servicio de Solicitudes.
 *
 * Usa el endpoint `get_solicitudes` del plugin json-api-user. Devuelve
 * promociones y peticiones que el usuario profesional puede rellenar:
 * merchandising (alfombrillas, carteles), becas, sorteos, etc. Cada
 * solicitud es un post del CPT `solicitudes` con un formulario Contact
 * Form 7 asociado por `custom_form_id`.
 *
 * ## Por qué no renderizamos el formulario nativamente
 *
 * El `custom_form_value` del backend es HTML + shortcodes CF7 con
 * `[text*]`, `[countrytext*]`, `[dynamichidden default:usermeta_xxx]`,
 * `[acceptance]`, JavaScript embebido, pre-fill desde meta de usuario…
 * Replicarlo en React Native sería frágil y nos forzaría a perseguir
 * cada refactor que el equipo de backend haga al form. En su lugar,
 * abrimos la URL del post (`guid`) en el navegador del dispositivo con
 * `Linking.openURL()`: el usuario verá el formulario web nativo de WP,
 * ya pre-rellenado si tiene sesión abierta.
 *
 * Cuando el backend exponga un endpoint dedicado (`submit_solicitud`) o
 * cuando implementemos un parser CF7 con los sabores que realmente
 * usamos, se podrá migrar a un flujo 100% nativo.
 */

const BASE_URL =
  Platform.OS === 'web'
    ? 'http://localhost:3001'
    : 'https://fatroibericas.sg-host.com';

export interface SolicitudMeta {
  tag: string;
  value: string;
}

/**
 * Estructura cruda que devuelve el backend por cada solicitud. Hereda
 * los campos típicos de un post WP (ID, post_title, post_name, guid...)
 * más campos añadidos por el plugin (app_img, thumb_url, custom_form_*).
 */
export interface Solicitud {
  ID: string;
  post_title: string;
  post_name: string;
  post_content: string;
  post_excerpt: string;
  post_status: string;
  post_date: string;
  /** URL completa del post en WordPress (útil para abrir en navegador). */
  guid: string;
  thumb_url: string | null;
  app_img: string | null;
  custom_form_id: number | string | null;
  custom_form_value: string | null;
  requested: string | number;
  meta: SolicitudMeta[];
}

export interface SolicitudesResponse {
  status: string;
  forms: Solicitud[];
}

/**
 * Helpers de lectura de `meta`. Compatibles con valores planos y con
 * JSON-encoded arrays, que es lo que devuelve `enrich_post_metadata`
 * tras el refactor del 16-abr (linea_negocio, category, user_especie).
 */
export function getMetaValue(
  meta: SolicitudMeta[] | undefined,
  tag: string
): string {
  if (!meta) return '';
  const entry = meta.find((m) => m.tag === tag);
  return entry?.value ?? '';
}

export function getMetaArray(
  meta: SolicitudMeta[] | undefined,
  tag: string
): string[] {
  const raw = getMetaValue(meta, tag);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
    return [String(parsed)];
  } catch {
    return [raw];
  }
}

/**
 * El backend guarda la fecha de fin de promoción como string numérico
 * `YYYYMMDD` (ej. `"20251214"`). Lo convertimos a Date robustamente;
 * si el formato es inesperado devolvemos null y la UI oculta el chip.
 */
export function parseDatePromo(raw: string): Date | null {
  if (!raw) return null;
  const match = raw.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (!match) return null;
  const [, y, m, d] = match;
  const date = new Date(+y, +m - 1, +d);
  return isNaN(date.getTime()) ? null : date;
}

const MONTHS_ES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

export function formatDatePromo(raw: string): string {
  const date = parseDatePromo(raw);
  if (!date) return '';
  return `${date.getDate()} ${MONTHS_ES[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Una solicitud está "vigente" si aún no ha pasado su `date_promo`.
 * Si no hay fecha se considera vigente (conservador: mejor mostrar algo
 * obsoleto que ocultar una solicitud válida).
 */
export function isSolicitudVigente(solicitud: Solicitud): boolean {
  const raw = getMetaValue(solicitud.meta, 'date_promo');
  const date = parseDatePromo(raw);
  if (!date) return true;
  return date.getTime() >= Date.now();
}

/**
 * Mapea la línea de negocio a un emoji, igual que en consultas.ts pero
 * aquí la línea viene como JSON array (`["ANICO","GANADERIA"]`) así que
 * elegimos el primero o un genérico si hay varios.
 */
export function getSolicitudEmoji(lineas: string[]): string {
  if (lineas.length === 0) return '📝';
  if (lineas.length > 1) return '🏷️';
  const key = lineas[0].toUpperCase();
  if (key === 'ANICO') return '🐾';
  if (key === 'PORCINO') return '🐷';
  if (key === 'VACUNO' || key === 'GANADERIA') return '🐄';
  if (key === 'AVICULTURA') return '🐔';
  if (key === 'CUNICULT' || key === 'CUNICULTURA') return '🐇';
  if (key === 'CABALLOS' || key === 'EQUINO') return '🐴';
  return '📝';
}

/**
 * Limpia el HTML de `more_info` antes de renderizarlo. El backend devuelve
 * plantillas de email marketing importadas (tipo Mailchimp) con tres
 * problemas crónicos:
 *
 * 1. **Letras `n` sueltas** entre tags y al principio del string: artefacto
 *    de un `str_replace` mal hecho en algún pipeline del backend donde los
 *    `\n` literales (2 caracteres) se convirtieron en la letra `n`. Se ven
 *    como "n", "n n" o "nnnnnn" aislados.
 * 2. **Spans invisibles** con `font-size: 0`, `visibility: hidden` o
 *    `display: none` usados como padding invisible de email tracking.
 *    Contienen muchos caracteres zero-width (`\u200C`, `\u200B`) que
 *    inflan el DOM que pinta react-native-render-html.
 * 3. **`\r\n` multi-línea**: el email vino con CRLF en vez de LF.
 *
 * Esta función es un parche temporal. Cuando Juan Luis arregle el
 * pipeline del backend (probablemente un `sanitize_text_field` demasiado
 * agresivo), podemos retirarla.
 */
export function sanitizeSolicitudHtml(html: string): string {
  if (!html) return '';

  let cleaned = html;

  // 1. Normaliza CRLF a LF.
  cleaned = cleaned.replace(/\r\n/g, '\n');

  // 2. Elimina caracteres zero-width invisibles.
  cleaned = cleaned.replace(/[\u200B\u200C\u200D\uFEFF]/g, '');

  // 3. Elimina elementos con `font-size: 0`, `display: none` o
  //    `visibility: hidden` (son espaciadores invisibles de email).
  //    Se ejecuta en bucle hasta que no haya cambios porque pueden
  //    estar anidados.
  const hiddenStyleRegex =
    /<(span|div|td|tr|table|p)[^>]*style="[^"]*(?:font-size:\s*0|display:\s*none|visibility:\s*hidden)[^"]*"[^>]*>[\s\S]*?<\/\1>/gi;
  let prev = '';
  while (prev !== cleaned) {
    prev = cleaned;
    cleaned = cleaned.replace(hiddenStyleRegex, '');
  }

  // 4. Elimina nodos de texto que son SOLO letras `n` (con espacios y/o
  //    `&nbsp;` alrededor, entre tags o al principio/fin del string).
  //    Pattern: `>n<`, `> n n<`, `>nnn<`, `>&nbsp;n<`, etc.
  const nSpace = '(?:\\s|&nbsp;)*';
  cleaned = cleaned.replace(
    new RegExp(`>${nSpace}(?:n${nSpace})+<`, 'g'),
    '><'
  );

  // 5. Quita `n`+whitespace/&nbsp; sueltas al principio del string.
  cleaned = cleaned.replace(new RegExp(`^${nSpace}(?:n${nSpace})+`, 'i'), '');

  // 6. Quita `n`+whitespace/&nbsp; al final.
  cleaned = cleaned.replace(new RegExp(`${nSpace}(?:n${nSpace})+$`, 'i'), '');

  // 7. Colapsa newlines múltiples.
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return cleaned.trim();
}

/**
 * Pide todas las solicitudes disponibles. Lanza `Error` si el backend
 * responde con `status != 'ok'` para que la pantalla pueda distinguir
 * un fallo real de una lista vacía legítima.
 */
export async function getSolicitudes(cookie: string): Promise<Solicitud[]> {
  const res = await axios.get<SolicitudesResponse>(
    `${BASE_URL}/api/user/get_solicitudes/`,
    {
      params: { cookie },
      timeout: 15000,
    }
  );
  if (res.data.status !== 'ok') {
    throw new Error('No se pudieron cargar las solicitudes');
  }
  return res.data.forms ?? [];
}

/**
 * Encuentra una solicitud concreta por ID en la lista completa. Evita un
 * endpoint adicional `get_solicitud_by_id` que el plugin no ofrece.
 */
export async function getSolicitudById(
  cookie: string,
  id: string
): Promise<Solicitud | null> {
  const all = await getSolicitudes(cookie);
  return all.find((s) => String(s.ID) === String(id)) ?? null;
}
