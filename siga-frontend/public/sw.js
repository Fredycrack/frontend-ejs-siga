/**
 * Trabajador de servicio de SIGA (modo sin conexion, RNF10).
 * - Guarda los archivos de la interfaz y las paginas "Mis labores" (trabajador
 *   de campo) y "Mi taller" (tecnico) para usarlas y registrar avances sin senal.
 * - Las llamadas a /api nunca se guardan: siempre van a la red.
 */
const VERSION = 'siga-2.0.1';
const ESTATICOS = [
  '/css/siga.css', '/js/siga.js', '/js/cola-offline.js', '/js/campo.js', '/js/taller.js', '/img/logo.svg',
  '/img/icono-192.png', '/manifest.webmanifest', '/offline'
];
const PAGINAS_OFFLINE = ['/mis-labores', '/mi-taller'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ESTATICOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((k) => k !== VERSION && k !== 'siga-paginas').map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/')) return;

  if (e.request.mode === 'navigate') {
    const guardar = PAGINAS_OFFLINE.includes(url.pathname);
    e.respondWith(
      fetch(e.request).then((r) => {
        // Solo se guarda la pagina real (no las redirecciones al inicio de sesion)
        if (guardar && r.ok && r.type === 'basic' && !r.redirected) {
          const copia = r.clone();
          caches.open('siga-paginas').then((c) => c.put(url.pathname, copia));
        }
        return r;
      }).catch(() => caches.match(url.pathname, { cacheName: 'siga-paginas' })
        .then((r) => r || caches.match('/offline')))
    );
    return;
  }

  if (/^\/(css|js|img)\//.test(url.pathname) || url.pathname === '/manifest.webmanifest') {
    e.respondWith(
      caches.match(e.request).then((guardado) => {
        const red = fetch(e.request).then((r) => {
          if (r.ok) { const copia = r.clone(); caches.open(VERSION).then((c) => c.put(e.request, copia)); }
          return r;
        }).catch(() => guardado);
        return guardado || red;
      })
    );
  }
});
