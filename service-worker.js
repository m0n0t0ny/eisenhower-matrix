// Service Worker per la PWA Eisenhower Matrix

const CACHE_NAME = "priority-quadrants-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/styles.css",
  "/app.js",
  "/manifest.json",
  "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap"
];

// Installazione del Service Worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Forza l'attivazione immediata
  );
});

// Gestione delle richieste
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - restituisce la risposta dalla cache
      if (response) {
        return response;
      }

      // Clona la richiesta
      const fetchRequest = event.request.clone();

      return fetch(fetchRequest)
        .then((response) => {
          // Verifica che la risposta sia valida
          if (
            !response ||
            response.status !== 200 ||
            response.type !== "basic"
          ) {
            return response;
          }

          // Clona la risposta
          const responseToCache = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // In caso di errore di rete, per richieste di pagine prova a restituire la pagina offline
          if (event.request.mode === "navigate") {
            return caches.match("/index.html");
          }
        });
    })
  );
});

// Attivazione del Service Worker: pulisce le vecchie cache
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              // Elimina le cache che non sono nella whitelist
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim()) // Prende il controllo di tutte le schede
  );
});

// Gestione dei messaggi (per aggiornamenti della cache)
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
