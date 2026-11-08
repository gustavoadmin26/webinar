/* Build version: __PANEL_VERSION__ */
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  if (event.request.mode !== 'navigate') return;
  event.respondWith(fetch(event.request, { cache: 'no-store' }).catch(() => new Response(
    '<!doctype html><html lang="pt-BR"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Painel offline</title><body style="font:1rem system-ui;background:#031832;color:white;padding:24px"><h1>Sem conexão</h1><p>Reconecte à internet e reabra o painel.</p><a style="color:#58dcff" href="/painel/">Tentar novamente</a></body></html>',
    { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  )));
});
