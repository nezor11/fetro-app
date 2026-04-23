import axios from 'axios';
import { Platform } from 'react-native';

/**
 * Servicio de QR codes.
 *
 * Los "QR codes" de Fatro **no son prospectos de productos farmacéuticos**
 * (como yo asumía al principio del scope). Son códigos de compromiso
 * del veterinario con distintos tipos de actividad:
 *
 * - `ASISTENCIA` — el vet confirma que asistió a un taller/charla
 * - `RECIBI` — confirma recepción de merchandising (queso, agenda, termo…)
 * - `ACUERDO` — firma un compromiso de beca o formación
 * - `COMPROMISO` — inscripción a un taller in-company
 *
 * En la app original Android cada veterinario tiene una libretita
 * virtual de códigos escaneados; el scanner es cómo se añade uno nuevo
 * a ese histórico.
 *
 * Endpoint: `/api/user/get_qrcodes/?cookie=X[&identifier=Y]`
 * - Sin identifier → lista todos los QR disponibles (~90 actualmente)
 * - Con identifier → devuelve el QR concreto (count 0 o 1)
 */

const BASE_URL =
  Platform.OS === 'web'
    ? 'http://localhost:3001'
    : 'https://fatroibericas.sg-host.com';

export interface QRCodeMeta {
  tag: string;
  value: string;
}

export interface QRCode {
  ID: string;
  post_title: string;
  post_content: string;
  post_excerpt: string;
  post_status: string;
  post_name: string;
  post_date: string;
  thumb_url: string | null;
  requested?: string | number;
  meta: QRCodeMeta[];
}

interface QRCodesResponse {
  status: string;
  forms: QRCode[];
}

/**
 * Lee un meta por tag; string vacío si no existe. Duplicado de otros
 * servicios — considerar extraer a un `utils/meta.ts` cuando crezca.
 */
export function getMetaValue(
  meta: QRCodeMeta[] | undefined,
  tag: string
): string {
  if (!meta) return '';
  const entry = meta.find((m) => m.tag === tag);
  return entry?.value ?? '';
}

export function getMetaArray(
  meta: QRCodeMeta[] | undefined,
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
 * Mapa de `qr_type` (string crudo del backend) a etiqueta humana +
 * emoji. El backend puede devolver cualquier string, incluido uno que
 * no esté en el mapa — en ese caso `getQRTypeDisplay` hace fallback a
 * una versión capitalizada del propio valor.
 */
const QR_TYPE_DISPLAY: Record<
  string,
  { label: string; emoji: string; color: string }
> = {
  ASISTENCIA: { label: 'Asistencia', emoji: '✅', color: '#4CAF50' },
  RECIBI: { label: 'Recibí', emoji: '📦', color: '#1976D2' },
  ACUERDO: { label: 'Acuerdo', emoji: '🤝', color: '#8C1464' },
  COMPROMISO: { label: 'Compromiso', emoji: '📝', color: '#E67E22' },
};

export function getQRTypeDisplay(qrType: string): {
  label: string;
  emoji: string;
  color: string;
} {
  const upper = (qrType || '').toUpperCase();
  return (
    QR_TYPE_DISPLAY[upper] ?? {
      label: qrType || 'QR',
      emoji: '🔖',
      color: '#666',
    }
  );
}

/**
 * Busca un QR por su identifier (el string que contiene el propio
 * código QR escaneado). Devuelve el QR encontrado o `null` si no
 * existe ninguno con ese identifier.
 *
 * Nota: el backend hace matching exacto (no es LIKE), así que el
 * identifier tiene que coincidir al carácter. Nuestra UI hace un
 * `trim()` antes de consultar para tolerar whitespace accidental.
 */
export async function getQRCodeByIdentifier(
  cookie: string,
  identifier: string
): Promise<QRCode | null> {
  const res = await axios.get<QRCodesResponse>(
    `${BASE_URL}/api/user/get_qrcodes/`,
    {
      params: { cookie, identifier: identifier.trim() },
      timeout: 15000,
    }
  );

  if (res.data.status !== 'ok') {
    throw new Error('Error consultando el QR en el servidor');
  }
  const list = res.data.forms ?? [];
  return list.length > 0 ? list[0] : null;
}

/**
 * Lista todos los QR disponibles. Útil para la pantalla de "mis QR
 * escaneados" (histórico) o para implementar un fallback manual
 * "buscar por código". De momento lo exponemos pero no se usa; lo
 * dejamos listo para cuando el equipo valide el flujo.
 */
export async function getAllQRCodes(cookie: string): Promise<QRCode[]> {
  const res = await axios.get<QRCodesResponse>(
    `${BASE_URL}/api/user/get_qrcodes/`,
    { params: { cookie }, timeout: 15000 }
  );
  if (res.data.status !== 'ok') {
    throw new Error('No se pudieron cargar los QR codes');
  }
  return res.data.forms ?? [];
}
