import axios from 'axios';
import { Platform } from 'react-native';

/**
 * Servicio de Carreras VetSICS.
 *
 * Usa el endpoint get_vetsics del plugin json-api-user. Devuelve carreras
 * deportivas (running) patrocinadas por Fatro, cada una con su información
 * práctica, distancias disponibles, contactos y formulario de inscripción.
 *
 * Requiere autenticación: todas las peticiones necesitan una cookie válida.
 */

const BASE_URL =
  Platform.OS === 'web'
    ? 'http://localhost:3001'
    : 'https://fatroibericas.sg-host.com';

/**
 * Entrada del array `meta` de una carrera. WordPress devuelve pares
 * tag/value planos. Algunos valores vienen JSON-encoded (linea_negocio,
 * user_especie, category).
 */
export interface VetsicsMeta {
  tag: string;
  value: string;
}

/**
 * Forma bruta que devuelve el backend para una carrera.
 */
export interface VetsicsRace {
  ID: string;
  post_title: string;
  post_content: string;
  post_excerpt: string;
  post_status: string;
  post_date: string;
  thumb_url: string;
  app_img: string | null;
  requested: string | number;
  meta: VetsicsMeta[];
}

export interface VetsicsResponse {
  status: string;
  forms: VetsicsRace[];
}

/**
 * Devuelve el primer valor meta con el tag indicado (o '' si no existe).
 * Ojo: el backend puede repetir una misma tag (ej. linea_negocio aparece dos
 * veces); este helper devuelve la primera aparición.
 */
export function getMetaValue(meta: VetsicsMeta[] | undefined, tag: string): string {
  if (!meta) return '';
  const entry = meta.find((m) => m.tag === tag);
  return entry ? entry.value || '' : '';
}

/**
 * Parsea un valor meta que llega como JSON string array.
 * Ejemplos: linea_negocio, user_especie, category.
 */
export function getMetaArray(meta: VetsicsMeta[] | undefined, tag: string): string[] {
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
 * Devuelve las distancias disponibles de una carrera como array limpio.
 * El backend las guarda en `run_sponsored` con formato libre: "21k, 5k" o
 * "8k; 5k" o "21k 5k". Separamos por comas, punto y coma o espacios.
 */
export function getRaceDistances(meta: VetsicsMeta[] | undefined): string[] {
  const raw = getMetaValue(meta, 'run_sponsored');
  if (!raw) return [];
  return raw
    .split(/[,;]+|\s{2,}/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Intenta extraer la fecha de la carrera.
 *
 * El backend no entrega la fecha en un campo estructurado. Buscamos en
 * varios lugares con regex (formato DD/MM/YYYY o "DD de mes de YYYY") y
 * devolvemos la primera que encontremos como objeto Date.
 */
export function getRaceDate(race: VetsicsRace): Date | null {
  const sources = [
    getMetaValue(race.meta, 'run_sponsored_select'),
    getMetaValue(race.meta, 'titulo_del_bloque'),
    getMetaValue(race.meta, 'indications'),
    getMetaValue(race.meta, 'more_info'),
    race.post_excerpt,
    race.post_title,
  ];

  const months: Record<string, number> = {
    enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
    julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11,
  };

  for (const text of sources) {
    if (!text) continue;

    // Formato 20/06/2026
    const numeric = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (numeric) {
      const [, d, m, y] = numeric;
      const date = new Date(Number(y), Number(m) - 1, Number(d));
      if (!isNaN(date.getTime())) return date;
    }

    // Formato "15 de Febrero de 2026"
    const verbose = text.match(
      /(\d{1,2})\s+de\s+([a-záéíóú]+)\s+de\s+(\d{4})/i
    );
    if (verbose) {
      const [, d, monthName, y] = verbose;
      const monthIdx = months[monthName.toLowerCase()];
      if (monthIdx !== undefined) {
        const date = new Date(Number(y), monthIdx, Number(d));
        if (!isNaN(date.getTime())) return date;
      }
    }
  }

  return null;
}

/**
 * Separa carreras en futuras y pasadas usando getRaceDate.
 * Si una carrera no tiene fecha detectable, la consideramos futura
 * (conservador, mejor mostrarla que ocultarla).
 */
export function categorizeRaces(
  races: VetsicsRace[]
): { future: VetsicsRace[]; past: VetsicsRace[] } {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const future: VetsicsRace[] = [];
  const past: VetsicsRace[] = [];

  for (const race of races) {
    const date = getRaceDate(race);
    if (!date || date >= now) {
      future.push(race);
    } else {
      past.push(race);
    }
  }

  // Futuras: por fecha ascendente (la próxima primero)
  future.sort((a, b) => {
    const da = getRaceDate(a)?.getTime() ?? Infinity;
    const db = getRaceDate(b)?.getTime() ?? Infinity;
    return da - db;
  });
  // Pasadas: por fecha descendente (la más reciente primero)
  past.sort((a, b) => {
    const da = getRaceDate(a)?.getTime() ?? 0;
    const db = getRaceDate(b)?.getTime() ?? 0;
    return db - da;
  });

  return { future, past };
}

/**
 * Detecta si la carrera está marcada como "plazas agotadas" mirando el
 * texto del botón del formulario. El backend usa "AGOTADAS" (literal).
 */
export function isSoldOut(race: VetsicsRace): boolean {
  const btnText = getMetaValue(race.meta, 'texto_boton_formulario').toLowerCase();
  return btnText.includes('agotad');
}

/**
 * Lista las carreras VetSICS. Requiere cookie válida.
 */
export async function getVetsicsRaces(cookie: string): Promise<VetsicsRace[]> {
  const response = await axios.get<VetsicsResponse>(
    `${BASE_URL}/api/user/get_vetsics/`,
    {
      params: { cookie, insecure: 'cool' },
      timeout: 15000,
    }
  );

  if (response.data.status !== 'ok') {
    throw new Error('Error al obtener carreras VetSICS');
  }

  return response.data.forms || [];
}

/**
 * Localiza una carrera por ID (para el detalle).
 * Reutiliza getVetsicsRaces porque el backend no expone endpoint por ID.
 */
export async function getVetsicsRaceById(
  cookie: string,
  id: string
): Promise<VetsicsRace | null> {
  const races = await getVetsicsRaces(cookie);
  return races.find((r) => r.ID === id) || null;
}
