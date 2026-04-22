import {
  VetsicsRace,
  getRaceDate,
} from './vetsics';
import {
  Training,
  getTrainingDates,
} from './trainings';
import {
  Solicitud,
  getMetaValue,
  parseDatePromo,
} from './solicitudes';

/**
 * Servicio agregador para la vista de Calendario.
 *
 * No consume ningún endpoint: compone eventos a partir de los datos que
 * ya vienen de `get_vetsics`, `get_webinars_group` y `get_solicitudes`.
 * Al vivir en el cache de TanStack Query compartido, esta pantalla no
 * dispara fetches adicionales si el usuario ha visitado antes esas tabs.
 */

/**
 * Tipos de evento reconocidos. El `kind` sirve para:
 * - Elegir color del marker en el calendario
 * - Elegir icono + label en la lista de eventos
 * - Decidir a qué pantalla de detalle navegar al tocar
 */
export type CalendarEventKind = 'vetsics' | 'training' | 'solicitud';

export interface CalendarEvent {
  kind: CalendarEventKind;
  id: string;
  title: string;
  /** Fecha normalizada del evento. */
  date: Date;
  /** String `YYYY-MM-DD` en hora local. Clave para agrupar por día. */
  dateKey: string;
  /** Parámetros extra útiles para navegación. */
  routeParams?: Record<string, string>;
}

/**
 * Formatea una `Date` al string `YYYY-MM-DD` que react-native-calendars
 * usa como identificador de día. Es la misma API que usan DateString
 * en sus tipos públicos.
 */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Colores por tipo de evento. Se usan como dots en el calendario y como
 * acento en la card de la lista. Centralizados aquí para que el cambio
 * sea de un solo sitio si mañana el diseño evoluciona.
 */
export const EVENT_COLORS: Record<CalendarEventKind, string> = {
  vetsics: '#8C1464', // Novicell accent
  training: '#1976D2',
  solicitud: '#E67E22',
};

export const EVENT_LABELS: Record<CalendarEventKind, string> = {
  vetsics: 'Carrera VetSICS',
  training: 'Formación',
  solicitud: 'Solicitud',
};

export const EVENT_EMOJIS: Record<CalendarEventKind, string> = {
  vetsics: '🏁',
  training: '📚',
  solicitud: '📝',
};

/**
 * Decodifica las entidades HTML más comunes de los títulos de WP.
 * Evita que en el calendario aparezca `&amp;` en vez de `&`.
 */
function decodeHtml(text: string): string {
  return (text || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

interface AggregateInput {
  vetsics?: VetsicsRace[];
  trainings?: Training[];
  solicitudes?: Solicitud[];
}

/**
 * Agrega los eventos de todas las fuentes en una sola lista
 * cronológica. Cada formación puede generar N eventos (uno por sesión
 * + uno por el curso padre, deduplicados por día en
 * `getTrainingDates`).
 */
export function aggregateCalendarEvents(
  input: AggregateInput
): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  for (const race of input.vetsics ?? []) {
    const date = getRaceDate(race);
    if (!date) continue;
    events.push({
      kind: 'vetsics',
      id: race.ID,
      title: decodeHtml(race.post_title),
      date,
      dateKey: toDateKey(date),
    });
  }

  for (const training of input.trainings ?? []) {
    const dates = getTrainingDates(training);
    for (const date of dates) {
      events.push({
        kind: 'training',
        id: training.ID,
        title: decodeHtml(training.post_title),
        date,
        dateKey: toDateKey(date),
      });
    }
  }

  for (const solicitud of input.solicitudes ?? []) {
    const raw = getMetaValue(solicitud.meta, 'date_promo');
    const date = parseDatePromo(raw);
    if (!date) continue;
    events.push({
      kind: 'solicitud',
      id: String(solicitud.ID),
      title: decodeHtml(solicitud.post_title),
      date,
      dateKey: toDateKey(date),
    });
  }

  // Orden cronológico ascendente por defecto. La pantalla puede
  // filtrarlos por día después.
  events.sort((a, b) => a.date.getTime() - b.date.getTime());
  return events;
}

/**
 * Construye el objeto `markedDates` que consume el componente
 * `<Calendar>` de react-native-calendars en modo multi-dot. Un día con
 * N eventos de distinto tipo tendrá N dots de colores distintos.
 *
 * Deduplicamos por tipo dentro del mismo día: si en un día hay 3
 * formaciones no pintamos 3 dots azules (visualmente ruidoso), solo
 * uno.
 */
export function buildMarkedDates(
  events: CalendarEvent[],
  selectedDateKey: string | null
): Record<string, MarkedDate> {
  const byDay = new Map<string, Set<CalendarEventKind>>();
  for (const e of events) {
    if (!byDay.has(e.dateKey)) byDay.set(e.dateKey, new Set());
    byDay.get(e.dateKey)!.add(e.kind);
  }

  const marked: Record<string, MarkedDate> = {};
  for (const [dateKey, kinds] of byDay) {
    marked[dateKey] = {
      dots: Array.from(kinds).map((k) => ({
        key: k,
        color: EVENT_COLORS[k],
      })),
    };
  }

  if (selectedDateKey) {
    // Añadimos el flag `selected` al día elegido por el usuario,
    // manteniendo los dots existentes (si los hay).
    marked[selectedDateKey] = {
      ...(marked[selectedDateKey] ?? {}),
      selected: true,
    };
  }

  return marked;
}

/**
 * Shape mínimo que react-native-calendars acepta en `markedDates`.
 * Declaramos aquí la forma que usamos para no depender del tipado
 * interno de la librería (que a veces es laxo).
 */
export interface MarkedDate {
  dots?: Array<{ key: string; color: string; selectedDotColor?: string }>;
  selected?: boolean;
  selectedColor?: string;
}
