import axios from 'axios';
import { Platform } from 'react-native';

/**
 * Servicio de perfil del usuario.
 *
 * Lectura: `/api/user/get_user_meta/?cookie=...` devuelve TODAS las claves
 * de `wp_usermeta` del usuario autenticado. Filtramos las que nos
 * interesan (nombre, apellidos, empresa, contacto…) e ignoramos las
 * internas de WP (session_tokens, rich_editing, admin_color, etc.).
 *
 * Escritura: el plugin expone dos endpoints:
 *
 * - `update_user_meta?meta_key=<key>&meta_value=<val>` → un campo por
 *   petición. Trata `name`/`surname` como casos especiales que actualizan
 *   `first_name`/`last_name` del core de WP con `wp_update_user()`.
 * - `update_user_meta_vars?field1=val1&field2=val2` → varios campos de
 *   golpe. Todos van a `usermeta` sin lógica especial; perfecto para los
 *   campos custom de Fatro.
 *
 * Estrategia: enviamos **dos peticiones** por cada guardado de formulario:
 *   1. `update_user_meta_vars` con todos los meta custom en una sola llamada.
 *   2. Si cambió nombre/apellido, `update_user_meta` con `meta_key=name`
 *      y/o `meta_key=surname` (para disparar la lógica de `wp_update_user`).
 *
 * Así tocamos el servidor un mínimo de veces y respetamos la API del
 * plugin sin hacks.
 */

const BASE_URL =
  Platform.OS === 'web'
    ? 'http://localhost:3001'
    : 'https://fatroibericas.sg-host.com';

/**
 * Perfil normalizado que consume la UI. Son exactamente los campos que
 * el formulario de edición puede tocar; el resto del meta de WP no nos
 * interesa mostrarlo.
 */
export interface UserProfile {
  firstName: string;
  lastName: string;
  /** Segundo apellido. Convención de Fatro: meta_key `last_name2`. */
  lastName2: string;
  /** Teléfono; meta_key `phone`. */
  phone: string;
  /** Empresa / clínica; meta_key `company`. */
  company: string;
  /** Dirección postal; meta_key `direccion`. */
  direccion: string;
  /** Código postal; meta_key `cp`. */
  cp: string;
  /** Ciudad / provincia; meta_key `city`. */
  city: string;
  /** Bio / descripción del usuario; meta_key `description` (core WP). */
  description: string;
}

/**
 * El endpoint `get_user_meta` devuelve un objeto plano con todas las
 * claves del usermeta. Los campos de Fatro que pueden venir como string
 * o array (si se guardaron con coma separadores), los aplanamos.
 */
interface GetUserMetaResponse {
  status: string;
  first_name?: string;
  last_name?: string;
  last_name2?: string;
  phone?: string;
  company?: string;
  direccion?: string;
  cp?: string;
  city?: string;
  description?: string;
  [key: string]: unknown;
}

/**
 * Aplana un valor de meta que puede venir como string, array o null.
 * El backend a veces devuelve arrays (ej. valores separados por comas
 * guardados vía `update_user_meta_vars`); al leer queremos siempre un
 * string para la UI.
 */
function flattenMeta(value: unknown): string {
  if (value == null) return '';
  if (Array.isArray(value)) return value.filter(Boolean).join(', ');
  return String(value);
}

export async function getProfile(cookie: string): Promise<UserProfile> {
  const res = await axios.get<GetUserMetaResponse>(
    `${BASE_URL}/api/user/get_user_meta/`,
    { params: { cookie }, timeout: 15000 }
  );

  if (res.data.status !== 'ok') {
    throw new Error('No se pudo cargar el perfil');
  }

  return {
    firstName: flattenMeta(res.data.first_name),
    lastName: flattenMeta(res.data.last_name),
    lastName2: flattenMeta(res.data.last_name2),
    phone: flattenMeta(res.data.phone),
    company: flattenMeta(res.data.company),
    direccion: flattenMeta(res.data.direccion),
    cp: flattenMeta(res.data.cp),
    city: flattenMeta(res.data.city),
    description: flattenMeta(res.data.description),
  };
}

/**
 * Guarda el perfil completo. Estrategia: una llamada a
 * `update_user_meta_vars` con los campos custom + llamadas puntuales a
 * `update_user_meta` para los campos que requieren `wp_update_user`
 * (name/surname).
 *
 * Se podría optimizar para enviar solo los campos que cambiaron, pero
 * con 9 campos eso es premature optimization; el servidor lo absorbe sin
 * problema y la llamada es sub-segundo.
 */
export async function updateProfile(
  cookie: string,
  profile: UserProfile
): Promise<void> {
  // 1. Campos custom de Fatro (y description, que es core pero lo
  //    acepta update_user_meta_vars directamente).
  const metaVars = new URLSearchParams();
  metaVars.append('cookie', cookie);
  metaVars.append('last_name2', profile.lastName2);
  metaVars.append('phone', profile.phone);
  metaVars.append('company', profile.company);
  metaVars.append('direccion', profile.direccion);
  metaVars.append('cp', profile.cp);
  metaVars.append('city', profile.city);
  metaVars.append('description', profile.description);

  const metaRes = await axios.post(
    `${BASE_URL}/api/user/update_user_meta_vars/`,
    metaVars.toString(),
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 15000,
    }
  );

  if (metaRes.data.status && metaRes.data.status !== 'ok') {
    throw new Error(
      metaRes.data.error || 'Error al guardar los datos de contacto'
    );
  }

  // 2. Nombre y primer apellido requieren `wp_update_user` para que se
  //    reflejen en `user_login` y `display_name`. El endpoint
  //    `update_user_meta` con meta_key=name/surname los mapea a
  //    first_name/last_name del core.
  await updateSingleMeta(cookie, 'name', profile.firstName);
  await updateSingleMeta(cookie, 'surname', profile.lastName);
}

async function updateSingleMeta(
  cookie: string,
  key: string,
  value: string
): Promise<void> {
  // El endpoint exige meta_value no vacío. Si el usuario lo borró, le
  // mandamos un espacio para "limpiar" (alternativa: usar
  // delete_user_meta, pero se complica innecesariamente).
  const safeValue = value.trim() || ' ';
  const body = new URLSearchParams();
  body.append('cookie', cookie);
  body.append('meta_key', key);
  body.append('meta_value', safeValue);

  const res = await axios.post(
    `${BASE_URL}/api/user/update_user_meta/`,
    body.toString(),
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 15000,
    }
  );

  if (res.data.status === 'error') {
    throw new Error(res.data.error || `Error al guardar ${key}`);
  }
}
