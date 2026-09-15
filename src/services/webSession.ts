/**
 * Sesión compartida móvil → web.
 *
 * La cookie que devuelve `generate_auth_cookie` del plugin `json-api-user`
 * no es un token propio: es exactamente el valor que WordPress guarda en
 * su cookie `wordpress_logged_in_<hash>` (el plugin llama a
 * `wp_generate_auth_cookie(..., 'logged_in')`). Por tanto, si un WebView
 * envía esa misma cookie con el nombre correcto, WordPress considera al
 * usuario logueado y los formularios de Contact Form 7 aparecen ya
 * pre-rellenados con sus datos, sin volver a pedir contraseña.
 *
 * El `<hash>` es `md5(siteurl)` (COOKIEHASH en WP). Comprobado contra
 * producción y staging el 15/09/2026: ambos usan el `siteurl`
 * `https://fatroiberica.es` (staging es una copia y conserva la opción).
 * Si algún día cambia, recalcular con:
 *
 *   printf 'https://fatroiberica.es' | md5sum
 */
export const WP_COOKIE_HASH = 'dd4a937d1d668744f525e0b185ac4cf4';
export const WP_LOGGED_IN_COOKIE_NAME = `wordpress_logged_in_${WP_COOKIE_HASH}`;

/**
 * Valor de la cabecera `Cookie` para la primera petición del WebView, de
 * modo que ya la primera página llegue con sesión y no haya "parpadeo"
 * de login.
 */
export function buildWebSessionCookieHeader(cookie: string): string {
  return `${WP_LOGGED_IN_COOKIE_NAME}=${cookie}`;
}

/**
 * Script para `injectedJavaScriptBeforeContentLoaded`. La cabecera solo
 * viaja en la petición inicial; para que las navegaciones posteriores
 * (envío del formulario, enlaces) sigan autenticadas, la cookie tiene
 * que estar en el jar del WebView, y `document.cookie` la deja ahí.
 *
 * El valor contiene `|`, permitido en cookies (RFC 6265). Se serializa
 * con JSON.stringify para que nunca rompa el script aunque el backend
 * devolviese comillas o saltos de línea.
 */
export function buildWebSessionInjectionScript(cookie: string): string {
  const value = JSON.stringify(`${WP_LOGGED_IN_COOKIE_NAME}=${cookie}; path=/; secure; samesite=lax`);
  return `(function(){try{document.cookie=${value};}catch(e){}})();true;`;
}

/**
 * Los `guid` que devuelve el plugin vienen con entidades HTML
 * (`&#038;` en vez de `&`). Abrirlos tal cual convierte el resto de la
 * query en fragmento y la página que carga es el listado, no el post.
 */
export function normalizeWebUrl(url: string): string {
  return url
    .replace(/&#0*38;/g, '&')
    .replace(/&amp;/g, '&')
    .trim();
}
