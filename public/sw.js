/**
 * Service worker di SplitALF.
 *
 * Strategia "network-first" sulle richieste GET di stessa origine: prova
 * sempre la rete (così dopo un deploy si ottengono subito gli asset nuovi) e
 * usa la cache solo come fallback offline. Le richieste cross-origin (API
 * Supabase, Google Fonts) NON vengono intercettate.
 */
const CACHE = 'splitalf-cache-v1';

self.addEventListener('install', () => {
  // Attiva subito la nuova versione senza attendere la chiusura delle schede.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Solo GET di stessa origine (no API Supabase, no font CDN, no POST).
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      try {
        const fresh = await fetch(request);
        const cache = await caches.open(CACHE);
        cache.put(request, fresh.clone());
        return fresh;
      } catch {
        const cached = await caches.match(request);
        if (cached) return cached;
        // Fallback offline per le navigazioni: l'app shell (scope root).
        if (request.mode === 'navigate') {
          const shell =
            (await caches.match('./')) || (await caches.match('index.html'));
          if (shell) return shell;
        }
        throw new Error('Risorsa non disponibile offline');
      }
    })(),
  );
});
