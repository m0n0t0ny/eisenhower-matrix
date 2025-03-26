// Service Worker per la PWA Eisenhower Matrix
const CACHE_NAME = "eisenhower-matrix-v3"; // Incrementato per forzare l'aggiornamento
const OFFLINE_URL = "./offline.html";

// Risorse da cachare per funzionamento offline - aggiornate in base ai file esistenti
const urlsToCache = [
  "./",
  "./index.html",
  "./offline.html",
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

// Installazione del Service Worker e caching immediato di tutte le risorse
self.addEventListener("install", (event) => {
  console.log("[ServiceWorker] Installazione in corso");

  // Forza l'attivazione immediata
  self.skipWaiting();

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log(
          "[ServiceWorker] Cache aperta, aggiunta di tutte le risorse"
        );
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error("[ServiceWorker] Errore durante il caching:", error);
      })
  );
});

// Attivazione e pulizia vecchie cache
self.addEventListener("activate", (event) => {
  console.log("[ServiceWorker] Attivazione in corso");

  // Prendi il controllo immediatamente senza richiedere refresh
  event.waitUntil(self.clients.claim());

  // Pulisci vecchie cache
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log(
              "[ServiceWorker] Eliminazione vecchia cache:",
              cacheName
            );
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Questa funzione tenta di recuperare una risorsa dalla cache o dalla rete
const fetchResource = async (request) => {
  // Prima prova dalla cache
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    console.log("[ServiceWorker] Risorsa servita dalla cache:", request.url);
    return cachedResponse;
  }

  // Se non in cache, prova la rete
  try {
    console.log("[ServiceWorker] Recupero dalla rete:", request.url);
    const networkResponse = await fetch(request);

    // Non cachare risposte problematiche
    if (
      !networkResponse ||
      networkResponse.status !== 200 ||
      networkResponse.type !== "basic"
    ) {
      return networkResponse;
    }

    // Cache per uso futuro
    const responseToCache = networkResponse.clone();
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, responseToCache);

    return networkResponse;
  } catch (error) {
    console.error("[ServiceWorker] Errore nel recupero da rete:", error);

    // Se è una richiesta di navigazione, mostra la pagina offline
    if (request.mode === "navigate") {
      const offlineResponse = await caches.match(OFFLINE_URL);
      if (offlineResponse) {
        return offlineResponse;
      }
    }

    // In caso di fallimento totale
    return new Response("Risorsa non disponibile offline", {
      status: 503,
      statusText: "Service Unavailable"
    });
  }
};

// Intercepta le richieste fetch
self.addEventListener("fetch", (event) => {
  if (
    !event.request.url.startsWith(self.location.origin) &&
    !event.request.url.includes("fonts.googleapis.com") &&
    !event.request.url.includes("fonts.gstatic.com")
  ) {
    return;
  }

  event.respondWith(fetchResource(event.request));
});
