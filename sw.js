// Guarda os arquivos do app no celular pra ele abrir na hora, até com internet fraca.
// E recebe as notificações do Força Teen, mesmo com o app fechado.
const CACHE = 'forteen-v10';
const ARQUIVOS = ['./', 'index.html', 'manifest.json', 'logo.svg'];
const API = 'https://script.google.com/macros/s/AKfycby_w7m1eiD_gHxD5GV0OdPoOHP89R3KsM2xwqJN1mObH53_ihz47rF3HHNzGU-VjoI6/exec';
const ICONE = 'https://lh3.googleusercontent.com/d/1hAwCKsE-3rU0ytcpxge7nAXP8Ss7od_K';
const SELO = 'https://lh3.googleusercontent.com/d/1a2AaRThMMyd_vY-u2EAn-lMWjncwXzXG';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARQUIVOS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  e.respondWith(
    caches.match(e.request).then((guardado) => {
      const daRede = fetch(e.request)
        .then((res) => {
          const copia = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copia));
          return res;
        })
        .catch(() => guardado);
      return guardado || daRede;
    })
  );
});

// Chegou um aviso: pergunta pro Força Teen qual é a mensagem e mostra a notificação.
self.addEventListener('push', (e) => {
  e.waitUntil(
    self.registration.pushManager.getSubscription()
      .then((s) => fetch(API, { method: 'POST', body: JSON.stringify({ fn: 'notificacaoPush', args: [s ? s.endpoint : ''] }) }))
      .then((r) => r.json())
      .then((j) => (j && j.ok ? j.r : null))
      .catch(() => null)
      .then((m) => self.registration.showNotification((m && m.titulo) || 'Força Teen ⚡', {
        body: (m && m.texto) || 'Tem novidade no Força Teen!',
        icon: ICONE,
        badge: SELO,
        tag: 'wego-' + ((m && m.ts) || Date.now()),
        vibrate: [120, 60, 120],
        data: { url: './' }
      }))
  );
});

// Tocou na notificação: abre o Força Teen (ou traz pra frente se já estiver aberto).
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((lista) => {
      for (const c of lista) { if ('focus' in c) return c.focus(); }
      return self.clients.openWindow('./');
    })
  );
});
