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
