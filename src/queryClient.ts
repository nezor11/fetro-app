import { QueryClient } from '@tanstack/react-query';
import { SessionExpiredError } from './services/pluginApi';

/**
 * Cliente global de TanStack Query compartido por toda la app.
 *
 * La configuración está pensada para nuestro caso real:
 * datos de WordPress que cambian en escala de minutos (carreras,
 * especialistas, formaciones, solicitudes), no de segundos. Repetir
 * fetches cada segundo sería gasto de batería y datos móviles; dejar
 * la cache caducar cada 5 minutos da sensación de frescura sin petar
 * el servidor.
 *
 * - `staleTime: 5 min` → durante ese tiempo, volver a montar una
 *   pantalla que ya tiene datos los usa directamente sin fetch. Pull-to-
 *   refresh sigue funcionando porque llama explícitamente a `refetch()`.
 * - `gcTime: 10 min` → tras 10 min sin que nadie use el query, la
 *   cache se borra para no inflar memoria.
 * - `retry: 1` → en caso de error de red, reintenta una vez. Más
 *   intentos son ruido (el usuario prefiere ver el error rápido y
 *   tocar pull-to-refresh él mismo).
 * - `refetchOnWindowFocus: false` → en mobile no tiene sentido; en web
 *   puede ser útil pero preferimos comportamiento consistente entre
 *   plataformas.
 *
 * Cuando añadamos features más dinámicas (notificaciones, mensajería,
 * inventario) bastará con pasar un `staleTime` distinto al hook
 * concreto: `useQuery({ staleTime: 30_000, ... })`.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      // Un reintento salvo si el backend ha rechazado la cookie: en ese
      // caso AuthContext ya está cerrando la sesión y repetir es ruido.
      retry: (failureCount, error) =>
        !(error instanceof SessionExpiredError) && failureCount < 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Convenciones de `queryKey`:
 *
 * - Primer elemento: dominio (solicitudes, vetsics, consultas, ...).
 * - Siguientes: dependencias que deben disparar un nuevo fetch cuando
 *   cambien (ej. cookie del usuario, id de un post, filtros).
 *
 * Ejemplos:
 *   ['solicitudes', cookie]
 *   ['vetsics', cookie]
 *   ['post', postId]
 *   ['posts', categoryId, page]
 *
 * Este patrón permite invalidar todo un dominio con
 * `queryClient.invalidateQueries({ queryKey: ['solicitudes'] })`
 * si algún día añadimos mutaciones que modifican ese dominio.
 */
export const queryKeys = {
  solicitudes: (cookie: string | null) => ['solicitudes', cookie] as const,
  vetsics: (cookie: string | null) => ['vetsics', cookie] as const,
  consultas: (cookie: string | null) => ['consultas', cookie] as const,
  trainings: (cookie: string | null) => ['trainings', cookie] as const,
  products: (page: number) => ['products', page] as const,
  posts: (categoryId: number | undefined, page: number) =>
    ['posts', categoryId, page] as const,
  categories: () => ['categories'] as const,
  search: (query: string) => ['search', query] as const,
  post: (id: number) => ['post', id] as const,
  product: (id: number) => ['product', id] as const,
};
