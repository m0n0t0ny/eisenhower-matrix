// Service Worker per la PWA Eisenhower Matrix
// Versione migliorata per funzionamento offline ottimale

const CACHE_NAME = "eisenhower-matrix-v2";
const OFFLINE_URL = "./offline.html";

// Risorse da cachare per funzionamento offline
const urlsToCache = [
  "./",
  "./index.html",
  "./offline.html", // Pagina di fallback offline
  "./styles.css",
  "./dark-mode.css",
  "./app.js",
  "./manifest.json",
  "./icon.svg",
  "./icons/icon-72x72.png",
  "./icons/icon-96x96.png",
  "./icons/icon-128x128.png",
  "./icons/icon-144x144.png",
  "./icons/icon-152x152.png",
  "./icons/icon-192x192.png",
  "./icons/icon-384x384.png",
  "./icons/icon-512x512.png",
  "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap"
];

// Installazione del Service Worker con risposta di fallback offline
self.addEventListener("install", (event) => {
  console.log("[ServiceWorker] Installazione in corso");

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[ServiceWorker] Cache aperta");
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log("[ServiceWorker] Tutti i contenuti sono stati cachati");
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error("[ServiceWorker] Errore durante la cache:", error);
      })
  );
});

// Pulizia vecchie cache durante l'attivazione
self.addEventListener("activate", (event) => {
  console.log("[ServiceWorker] Attivazione in corso");

  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              console.log(
                "[ServiceWorker] Eliminazione vecchia cache:",
                cacheName
              );
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log("[ServiceWorker] Attivato e in controllo");
        return self.clients.claim();
      })
  );
});

// Strategia di cache migliorata con supporto offline
self.addEventListener("fetch", (event) => {
  // Ignora le richieste non GET
  if (event.request.method !== "GET") return;

  // Ignora le richieste a URL esterni che non siano font Google
  const url = new URL(event.request.url);
  if (
    url.origin !== self.location.origin &&
    !event.request.url.includes("fonts.googleapis.com") &&
    !event.request.url.includes("fonts.gstatic.com")
  ) {
    return;
  }

  event.respondWith(
    // Prima prova la cache, poi la rete
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        console.log(
          "[ServiceWorker] Risorsa trovata in cache:",
          event.request.url
        );
        return cachedResponse;
      }

      // Se non in cache, vai alla rete
      console.log("[ServiceWorker] Scaricamento risorsa:", event.request.url);
      return fetch(event.request)
        .then((networkResponse) => {
          // Verifica che la risposta sia valida
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.type !== "basic"
          ) {
            return networkResponse;
          }

          // Cache la risposta per usi futuri
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
            console.log(
              "[ServiceWorker] Nuova risorsa cachata:",
              event.request.url
            );
          });

          return networkResponse;
        })
        .catch((error) => {
          console.log("[ServiceWorker] Errore di fetch:", error);

          // Se è una richiesta di navigazione, vai alla pagina offline
          if (event.request.mode === "navigate") {
            console.log("[ServiceWorker] Mostrando pagina offline");
            return caches.match(OFFLINE_URL);
          }

          // Per altre risorse, restituisci una risposta di errore generica
          return new Response("Connessione non disponibile", {
            status: 503,
            statusText: "Service Unavailable",
            headers: new Headers({
              "Content-Type": "text/plain"
            })
          });
        });
    })
  );
});

// Gestione messaggi per lo skip waiting
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    console.log("[ServiceWorker] Skip waiting richiesto");
    self.skipWaiting();
  }
});

// Gestione dei sincronizzazioni in background (per salvare attività offline)
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-tasks") {
    console.log("[ServiceWorker] Sincronizzazione attività");
  }
});
