import {
  WP_LOGGED_IN_COOKIE_NAME,
  buildWebSessionCookieHeader,
  buildWebSessionInjectionScript,
  normalizeWebUrl,
} from '../webSession';

const COOKIE = 'jorgetest|1790074284|token|hmac';

describe('webSession', () => {
  it('el nombre de cookie sigue el patrón de WordPress', () => {
    expect(WP_LOGGED_IN_COOKIE_NAME).toMatch(/^wordpress_logged_in_[0-9a-f]{32}$/);
  });

  it('construye la cabecera Cookie con el valor tal cual', () => {
    expect(buildWebSessionCookieHeader(COOKIE)).toBe(`${WP_LOGGED_IN_COOKIE_NAME}=${COOKIE}`);
  });

  it('el script inyectado escribe la cookie y no rompe con comillas', () => {
    const script = buildWebSessionInjectionScript('a"b\nc');
    expect(script).toContain('document.cookie=');
    expect(script.endsWith('true;')).toBe(true);
    // Debe ser JS válido: lo evaluamos con un document simulado.
    const doc: { cookie?: string } = {};
    // eslint-disable-next-line no-new-func
    new Function('document', script)(doc);
    expect(doc.cookie).toBe(`${WP_LOGGED_IN_COOKIE_NAME}=a"b\nc; path=/; secure; samesite=lax`);
  });

  it('normalizeWebUrl decodifica &#038; y &amp;', () => {
    expect(normalizeWebUrl('https://x.es/?post_type=solicitudes&#038;p=1')).toBe(
      'https://x.es/?post_type=solicitudes&p=1'
    );
    expect(normalizeWebUrl(' https://x.es/?a=1&amp;b=2 ')).toBe('https://x.es/?a=1&b=2');
  });
});
