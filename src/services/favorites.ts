import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Servicio de Favoritos — gestión 100% local.
 *
 * Los favoritos viven en AsyncStorage del dispositivo, no en el backend.
 * Rationale:
 *
 * 1. **Ningún endpoint del plugin** `json-api-user` expone una tabla o meta
 *    para favoritos del usuario. Crear uno server-side implicaría PR al
 *    plugin + migración de wp_usermeta + negociación con Juan Luis.
 * 2. **Los favoritos son una "vista rápida"** personal, no datos que el
 *    usuario quiera compartir entre dispositivos. Si algún día lo
 *    necesitamos (multi-device sync), bastará con:
 *    a) Añadir un endpoint `save_user_meta` con meta_key `app_favorites`
 *    b) Sincronizar este servicio con esa meta en el login
 *
 * Se guarda un **snapshot mínimo** de cada favorito (título, imagen,
 * subtítulo, ruta de detalle) para que FavoritesScreen renderice sin
 * necesidad de re-pedir los datos del backend. Ventaja: instantáneo,
 * funciona offline. Desventaja: si el título o la imagen cambian en
 * producción, el favorito se queda con el dato "viejo" hasta que el
 * usuario abra el detalle real. Es un trade-off aceptable para esta UX.
 */

export type FavoriteKind =
  | 'post'
  | 'product'
  | 'training'
  | 'vetsics'
  | 'consulta'
  | 'solicitud';

/**
 * Forma plana que se guarda en AsyncStorage. Todos los campos necesarios
 * para mostrar la card y para re-abrir el detalle están aquí.
 */
export interface Favorite {
  kind: FavoriteKind;
  /**
   * ID del recurso. Suele ser string para consistencia con los IDs del
   * backend que vienen como string, aunque los posts de WP nativo los
   * traigan como number (los pasamos a string al crear el favorito).
   */
  id: string;
  /** Parámetros adicionales que identifican el recurso (ej. `groupKey`
   *  para consultas). Se serializa tal cual va al `navigation.navigate`. */
  routeParams?: Record<string, string | number>;
  /** Timestamp Unix ms del momento de añadir. Usado para ordenar. */
  addedAt: number;

  /** Snapshot mínimo para renderizar sin red. */
  title: string;
  subtitle?: string;
  imageUrl?: string | null;
}

const STORAGE_KEY = '@fetro_favorites';

/**
 * Clave única que identifica un recurso (ej. "vetsics:1234"). Permite
 * usarla en Map/Set y en comparaciones simples. El `id` viene como
 * string siempre.
 */
export function favoriteKey(kind: FavoriteKind, id: string): string {
  return `${kind}:${id}`;
}

export async function loadFavorites(): Promise<Favorite[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Validación defensiva: si alguien mete mano al storage o una
    // versión antigua escribió otra forma, devolvemos vacío en vez de
    // crashear.
    return Array.isArray(parsed) ? (parsed as Favorite[]) : [];
  } catch {
    return [];
  }
}

export async function saveFavorites(favorites: Favorite[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  } catch {
    // Si AsyncStorage falla (cuota llena, etc.) mejor fallar silencioso
    // y que la UI refleje el estado real al siguiente load. No tiene
    // sentido bloquear al usuario por un favorito que no guarda.
  }
}

/**
 * Añade un favorito. Si ya existe (misma kind+id), refresca el snapshot
 * y mueve el `addedAt` al momento actual (comportamiento "lo has
 * marcado ahora"). Devuelve la lista actualizada.
 */
export function addToList(
  list: Favorite[],
  fav: Omit<Favorite, 'addedAt'>
): Favorite[] {
  const withoutExisting = list.filter(
    (f) => !(f.kind === fav.kind && f.id === fav.id)
  );
  return [{ ...fav, addedAt: Date.now() }, ...withoutExisting];
}

export function removeFromList(
  list: Favorite[],
  kind: FavoriteKind,
  id: string
): Favorite[] {
  return list.filter((f) => !(f.kind === kind && f.id === id));
}

export function isInList(
  list: Favorite[],
  kind: FavoriteKind,
  id: string
): boolean {
  return list.some((f) => f.kind === kind && f.id === id);
}

/**
 * Etiqueta humana por tipo, usada en los headers de sección de
 * FavoritesScreen. Centralizada aquí para que coincida en todas partes.
 */
export const FAVORITE_KIND_LABELS: Record<
  FavoriteKind,
  { label: string; emoji: string }
> = {
  post: { label: 'Noticias', emoji: '📰' },
  product: { label: 'Productos', emoji: '💊' },
  training: { label: 'Formación', emoji: '📚' },
  vetsics: { label: 'Carreras VetSICS', emoji: '🏃' },
  consulta: { label: 'Especialistas', emoji: '👨‍⚕️' },
  solicitud: { label: 'Solicitudes', emoji: '📝' },
};
