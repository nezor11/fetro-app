import axios from 'axios';
import { Platform } from 'react-native';

/**
 * Servicio de Consultas veterinarias.
 *
 * Usa el endpoint `get_specialities` del plugin json-api-user. Devuelve el
 * directorio de especialistas Fatro agrupados por línea de negocio (animales
 * de compañía, ganadería vacuno, porcino, etc.). Cada especialista es un
 * post del CPT `consulta` en WordPress.
 *
 * A día de hoy el plugin expone el directorio pero **no** tiene un endpoint
 * para guardar "consultas enviadas por el usuario"; el CTA de contactar es
 * un placeholder que abrirá `mailto:` o un formulario dedicado cuando el
 * backend defina cómo se persisten las consultas.
 *
 * Requiere autenticación: todas las peticiones necesitan una cookie válida.
 */

const BASE_URL =
  Platform.OS === 'web'
    ? 'http://localhost:3001'
    : 'https://fatroibericas.sg-host.com';

/**
 * Ficha de un especialista tal y como viene del backend.
 *
 * Todos los campos son strings (WordPress los serializa así), incluso los
 * ids numéricos como `specialist_img` o `interes`.
 */
export interface Specialist {
  specialist_img: string;
  thumb_url: string;
  /** Título del post WP (suele coincidir con la especialidad principal). */
  speciality: string;
  specialist_name: string;
  specialist_cv: string;
  specialist_slug: string;
  more_info: string;
  /** Id de la categoría WP asociada al especialista. */
  interes: string;
  linea_negocio: 'ANICO' | 'GANADERIA' | string;
  category: string;
}

/**
 * El backend agrupa por línea de negocio usando claves `speciality_<slug>`.
 * Algunas están vacías (ej. avicultura, cunicultura) pero el plugin las
 * devuelve igualmente como array vacío. Las ignoramos en la UI.
 */
export interface SpecialitiesMap {
  speciality_anico?: Specialist[];
  speciality_gan?: Specialist[];
  speciality_por?: Specialist[];
  [key: string]: Specialist[] | undefined;
}

export interface SpecialitiesResponse {
  status: string;
  specialities: SpecialitiesMap;
}

/**
 * Grupo de especialistas ya normalizado y listo para pintar en pantalla.
 */
export interface SpecialityGroup {
  /** Key original del backend (`speciality_anico`, etc.). */
  key: string;
  /** Etiqueta humana deducida del primer item (`category`). */
  title: string;
  /** Emoji representativo para el header de sección. */
  emoji: string;
  specialists: Specialist[];
}

/**
 * Asigna un emoji según la línea de negocio o la categoría. Se usa tanto en
 * el listado (header) como en el detalle (chip) para que el usuario sepa de
 * qué tipo de especialista está leyendo.
 */
export function getCategoryEmoji(
  lineaNegocio: string,
  category: string
): string {
  const cat = category.toLowerCase();
  if (cat.includes('compañía') || cat.includes('compania')) return '🐾';
  if (cat.includes('vacuno')) return '🐄';
  if (cat.includes('porcino')) return '🐷';
  if (cat.includes('avicultura')) return '🐔';
  if (cat.includes('cunicultura')) return '🐇';
  if (cat.includes('equino')) return '🐴';
  if (cat.includes('ovino') || cat.includes('caprino')) return '🐑';
  return lineaNegocio === 'ANICO' ? '🐾' : '🐄';
}

/**
 * Ordena los grupos con un criterio estable: primero animales de compañía
 * (la línea con más tráfico), luego las de ganadería, y dentro de cada tier
 * por número de especialistas descendente.
 */
const GROUP_PRIORITY: Record<string, number> = {
  speciality_anico: 0,
  speciality_gan: 1,
  speciality_por: 2,
  speciality_equino: 3,
  'speciality_ovino-caprino': 4,
  speciality_avicultura: 5,
  speciality_cunicultura: 6,
  speciality_vetsics: 9,
};

/**
 * Convierte el mapa crudo del backend en una lista de grupos ya preparados
 * para pintar. Filtra los grupos vacíos y deduce títulos/emojis a partir
 * del primer especialista de cada grupo.
 */
export function buildSpecialityGroups(
  map: SpecialitiesMap
): SpecialityGroup[] {
  const groups: SpecialityGroup[] = [];
  for (const [key, arr] of Object.entries(map)) {
    if (!arr || arr.length === 0) continue;
    const first = arr[0];
    groups.push({
      key,
      title: first.category || prettifyKey(key),
      emoji: getCategoryEmoji(first.linea_negocio, first.category),
      specialists: arr,
    });
  }
  groups.sort((a, b) => {
    const pa = GROUP_PRIORITY[a.key] ?? 100;
    const pb = GROUP_PRIORITY[b.key] ?? 100;
    if (pa !== pb) return pa - pb;
    return b.specialists.length - a.specialists.length;
  });
  return groups;
}

/**
 * Fallback para grupos cuyo primer item no traiga `category` legible.
 * `speciality_anico` → "Anico" (casi nunca se usa porque siempre hay category).
 */
function prettifyKey(key: string): string {
  const slug = key.replace(/^speciality_/, '');
  return slug.charAt(0).toUpperCase() + slug.slice(1).replace(/[-_]/g, ' ');
}

/**
 * Dado un slug de especialista (único dentro de una línea), lo localiza en
 * el árbol de grupos. Se usa desde la pantalla de detalle: navegamos
 * pasando `slug + key` y recuperamos el especialista completo sin una
 * petición adicional.
 */
export function findSpecialistBySlug(
  map: SpecialitiesMap,
  groupKey: string,
  slug: string
): Specialist | null {
  const group = map[groupKey];
  if (!group) return null;
  return group.find((s) => s.specialist_slug === slug) ?? null;
}

/**
 * Petición principal. Devuelve el mapa completo agrupado por clave
 * `speciality_*`. No cacheamos nada: el directorio es pequeño y cambia
 * rara vez, pero se refresca cada vez que se abre la pestaña.
 */
export async function getSpecialities(
  cookie: string
): Promise<SpecialitiesMap> {
  const res = await axios.get<SpecialitiesResponse>(
    `${BASE_URL}/api/user/get_specialities/`,
    {
      params: { cookie },
      timeout: 15000,
    }
  );
  if (res.data.status !== 'ok') {
    throw new Error('No se pudieron cargar las consultas');
  }
  return res.data.specialities ?? {};
}
