import axios from 'axios';
import { Platform } from 'react-native';

/**
 * Servicio de Formaciones (webinars/formaciones veterinarias).
 *
 * Usa el endpoint get_webinars_group del plugin json-api-user que devuelve
 * las formaciones agrupadas como padre (el curso) + hijos (sesiones).
 *
 * Requiere autenticación: todas las peticiones necesitan una cookie válida.
 */

const BASE_URL =
  Platform.OS === 'web'
    ? 'http://localhost:3001'
    : 'https://fatroibericas.sg-host.com';

/**
 * Entrada del array `meta` de una formación.
 * WordPress devuelve pares tag/value planos. Algunos valores vienen
 * JSON-encoded (user_especie, modalidades, tipo_de_formacion, linea_negocio).
 */
export interface TrainingMeta {
  tag: string;
  value: string;
}

export interface TrainingSession {
  ID: string;
  post_title: string;
  post_content: string;
  post_status: string;
  menu_order: string;
  thumb_url: string;
  app_img: string;
  requested: string | number; // nº veces solicitada por este usuario
  meta: TrainingMeta[];
}

export interface Training {
  ID: string;
  post_title: string;
  post_content: string;
  post_excerpt: string;
  post_status: string;
  post_date: string;
  thumb_url: string;
  app_img: string;
  sesions: number;
  sesiones: TrainingSession[];
  meta: TrainingMeta[];
}

export interface TrainingsResponse {
  status: string;
  forms: Training[];
}

/**
 * Obtiene el valor de una etiqueta del meta. Si viene JSON-encoded,
 * intenta parsearlo y devolver el primer elemento (caso común: arrays de 1 elemento).
 */
export function getMetaValue(
  meta: TrainingMeta[] | undefined,
  tag: string
): string {
  if (!meta) return '';
  const entry = meta.find((m) => m.tag === tag);
  if (!entry) return '';
  return entry.value || '';
}

/**
 * Parsea un valor meta que llega como JSON string array.
 * Campos conocidos: user_especie, modalidades, tipo_de_formacion, linea_negocio, interes, category.
 */
export function getMetaArray(
  meta: TrainingMeta[] | undefined,
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
 * Parsea una fecha en cualquiera de los formatos que el backend usa en
 * formaciones: ACF datetime (`YYYY-MM-DD HH:MM:SS`) o solo fecha
 * (`YYYY-MM-DD`). Devuelve null si no reconoce el formato.
 */
function parseTrainingDate(raw: string): Date | null {
  if (!raw) return null;
  // ACF datetime: "2026-04-15 18:00:00"
  const m1 = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2}):?(\d{2})?)?$/);
  if (m1) {
    const [, y, mo, d, h = '0', mi = '0', s = '0'] = m1;
    const date = new Date(+y, +mo - 1, +d, +h, +mi, +s);
    return isNaN(date.getTime()) ? null : date;
  }
  return null;
}

/**
 * Devuelve todas las fechas relevantes de una formación: la del curso
 * padre + la de cada sesión. Útil para la vista de calendario, que debe
 * mostrar un marker por cada día en el que haya sesión (no solo por el
 * "día de inicio" del curso).
 *
 * Las fechas se normalizan a medianoche local para que el calendario
 * las agrupe correctamente por día (el usuario no necesita ver horas
 * aquí; para eso está el detalle del evento).
 */
export function getTrainingDates(training: Training): Date[] {
  const dates: Date[] = [];

  // Fecha del curso padre (meta `course_date` o `fecha_formacion`).
  const courseDate =
    getMetaValue(training.meta, 'course_date') ||
    getMetaValue(training.meta, 'fecha_formacion');
  const parent = parseTrainingDate(courseDate);
  if (parent) dates.push(parent);

  // Fechas de las sesiones (meta `sesions_N_sesion_date`).
  for (const m of training.meta || []) {
    if (!/^sesions_\d+_sesion_date$/.test(m.tag)) continue;
    const d = parseTrainingDate(m.value);
    if (d) dates.push(d);
  }

  // Dedupe por día (YYYY-MM-DD) manteniendo la instancia más temprana.
  const seen = new Set<string>();
  const unique: Date[] = [];
  for (const d of dates) {
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(d);
    }
  }
  return unique;
}

/**
 * Comprueba si el usuario (por su ID) está inscrito en una formación.
 *
 * El backend guarda los IDs de usuarios inscritos en el meta
 * `usuarios_registrados` como un JSON array de strings (ej.
 * `["3","15","1213"]`). La app original Android usa este mismo meta
 * para pintar la pantalla de Asistencias. No hay endpoint dedicado.
 *
 * También se consideran inscripciones en sesiones individuales: cada
 * sesión tiene su propio `sesions_N_usuarios_registrados`. Si el
 * usuario está en CUALQUIERA de los arrays (padre o sesiones), se
 * considera inscrito en la formación.
 */
export function isUserRegisteredInTraining(
  training: Training,
  userId: number | string
): boolean {
  if (!training.meta || !userId) return false;
  const userIdStr = String(userId);

  // Buscamos en todos los meta keys que terminen en `usuarios_registrados`
  // (incluye el del padre y los `sesions_N_usuarios_registrados`).
  for (const m of training.meta) {
    if (!/usuarios_registrados$/.test(m.tag)) continue;
    try {
      const parsed = JSON.parse(m.value);
      if (Array.isArray(parsed) && parsed.map(String).includes(userIdStr)) {
        return true;
      }
    } catch {
      // Si algún meta no es JSON válido lo ignoramos, no rompe la feature.
    }
  }
  return false;
}

/**
 * Lista las formaciones agrupadas (padre + sesiones).
 * Requiere cookie válida del usuario autenticado.
 */
export async function getTrainings(cookie: string): Promise<Training[]> {
  const response = await axios.get<TrainingsResponse>(
    `${BASE_URL}/api/user/get_webinars_group/`,
    {
      params: { cookie, insecure: 'cool' },
      timeout: 15000,
    }
  );

  if (response.data.status !== 'ok') {
    throw new Error('Error al obtener formaciones');
  }

  return response.data.forms || [];
}

/**
 * Localiza una formación por ID (útil para el detalle).
 * Reutiliza getTrainings porque el backend no tiene un endpoint específico por ID.
 */
export async function getTrainingById(
  cookie: string,
  id: string
): Promise<Training | null> {
  const trainings = await getTrainings(cookie);
  return trainings.find((t) => t.ID === id) || null;
}
