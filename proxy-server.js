/**
 * Proxy local para desarrollo web.
 * Reenvía las peticiones /api/* al servidor de WordPress,
 * añadiendo las cabeceras CORS necesarias.
 *
 * Uso: node proxy-server.js
 * El proxy escucha en http://localhost:3001
 *
 * ¿Por qué se necesita?
 * En el navegador (Chrome), las peticiones AJAX a otro dominio
 * son bloqueadas por la política CORS si el servidor no envía
 * la cabecera Access-Control-Allow-Origin. El endpoint /api/user/
 * de WordPress no tiene esas cabeceras. Este proxy actúa como
 * intermediario: la app hace peticiones a localhost:3001 (mismo
 * origen) y el proxy las reenvía a WordPress y devuelve la
 * respuesta con las cabeceras CORS correctas.
 *
 * En móvil (Expo Go / Android / iOS) NO se necesita este proxy
 * porque las apps nativas no tienen restricciones CORS.
 */

const http = require('http');
const https = require('https');
const url = require('url');

const TARGET = 'https://fatroibericas.sg-host.com';
const PORT = 3001;

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const targetUrl = TARGET + req.url;
  const parsed = url.parse(targetUrl);

  const options = {
    hostname: parsed.hostname,
    port: 443,
    path: parsed.path,
    method: req.method,
    headers: {
      ...req.headers,
      host: parsed.hostname,
    },
  };

  // Remove headers that cause issues
  delete options.headers['origin'];
  delete options.headers['referer'];

  const proxyReq = https.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, {
      ...proxyRes.headers,
      'Access-Control-Allow-Origin': '*',
    });
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err.message);
    res.writeHead(502);
    res.end(JSON.stringify({ error: 'Proxy error: ' + err.message }));
  });

  req.pipe(proxyReq);
});

server.listen(PORT, () => {
  console.log(`\n🔀 Proxy CORS activo en http://localhost:${PORT}`);
  console.log(`   Redirige peticiones a ${TARGET}`);
  console.log(`\n   Ejemplo: http://localhost:${PORT}/api/user/generate_auth_cookie/\n`);
});
