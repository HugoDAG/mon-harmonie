/* Mon Harmonie — service worker
 *
 * Deux rôles :
 *   1. permettre à l'application de s'ouvrir sans réseau ;
 *   2. recevoir les notifications push (le jour où l'envoi sera en place).
 *
 * Prudence volontaire : un service worker trop gourmand peut figer une
 * version périmée de l'application chez les résidents pendant des jours.
 * On ne met donc en cache que ce qui porte une empreinte dans son nom
 * (les fichiers de /assets/, qui changent de nom à chaque déploiement),
 * et la page d'accueil est toujours demandée au réseau en premier.
 *
 * Rien de ce qui vient de Supabase n'est mis en cache : ce sont des
 * données vivantes, et certaines sont privées.
 */

const VERSION = 'harmonie-v1'
const SHELL = `${VERSION}-shell`
const ASSETS = `${VERSION}-assets`
const OFFLINE_URL = '/offline.html'

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL)
    await cache.addAll([OFFLINE_URL, '/manifest.json'])

    // Les fichiers de l'application portent une empreinte dans leur nom,
    // qui change à chaque déploiement : impossible de l'écrire ici. On
    // lit donc la page d'accueil et on en extrait les noms réels.
    // Sans ce préchargement, l'application s'ouvre hors ligne sur un
    // écran blanc : la coquille est en cache, mais pas son contenu.
    try {
      const response = await fetch('/', { cache: 'reload' })
      if (response.ok) {
        const copie = response.clone()
        const html = await response.text()
        await cache.put('/', copie)
        const fichiers = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map(m => m[1])
        await Promise.all(fichiers.map(f => cache.add(f).catch(() => {})))
      }
    } catch {
      // Installation sans réseau : la page hors ligne suffira jusqu'à
      // la prochaine visite connectée.
    }

    await self.skipWaiting()
  })())
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(
        names
          .filter(n => !n.startsWith(VERSION))
          .map(n => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Images publiques du stockage Supabase : logo, bannière, icônes des
  // raccourcis. Elles ne changent presque jamais et toute l'identité
  // visuelle en dépend — sans ce cache, l'application s'affiche nue dès
  // que le réseau manque ou que le projet Supabase est en pause.
  // Rien d'autre venant de Supabase n'est conservé : les données sont
  // vivantes, et les documents personnels sont privés.
  if (url.origin !== self.location.origin) {
    if (url.hostname.endsWith('.supabase.co') &&
        url.pathname.startsWith('/storage/v1/object/public/')) {
      event.respondWith(
        caches.match(request).then(cached => {
          const reseau = fetch(request).then(response => {
            if (response.ok) {
              const copie = response.clone()
              caches.open(ASSETS).then(cache => cache.put(request, copie))
            }
            return response
          }).catch(() => cached)
          // On sert l'image connue tout de suite et on la rafraîchit en
          // arrière-plan : affichage instantané, et jamais d'écran vide.
          return cached || reseau
        })
      )
    }
    return
  }

  // Navigation : le réseau d'abord, pour ne jamais servir une version
  // périmée. Hors ligne, on retombe sur la dernière page d'accueil
  // connue, puis sur la page d'excuse.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // On ne rafraîchit la coquille qu'avec une vraie page d'accueil.
          // Sans ces deux conditions, une page introuvable ou une erreur
          // du serveur viendrait écraser la version hors ligne.
          if (response.ok && url.pathname === '/') {
            const copy = response.clone()
            caches.open(SHELL).then(cache => cache.put('/', copy))
          }
          return response
        })
        .catch(async () => {
          const cached = await caches.match('/')
          return cached || caches.match(OFFLINE_URL)
        })
    )
    return
  }

  // Fichiers de build : leur nom contient une empreinte, donc un fichier
  // déjà vu ne changera jamais. Cache d'abord, c'est sans risque.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached
        return fetch(request).then(response => {
          if (response.ok) {
            const copy = response.clone()
            caches.open(ASSETS).then(cache => cache.put(request, copy))
          }
          return response
        })
      })
    )
  }
})

/* ----------------------------------------------------------------
 * Notifications push
 *
 * Ces gestionnaires sont prêts, mais rien ne les déclenchera tant
 * qu'un service d'envoi ne sera pas branché côté serveur.
 * ---------------------------------------------------------------- */

self.addEventListener('push', event => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = { body: event.data ? event.data.text() : '' }
  }

  const title = payload.title || 'Mon Harmonie'
  const options = {
    body: payload.body || '',
    icon: payload.icon || '/icon-192.png',
    badge: '/icon-192.png',
    tag: payload.tag || 'harmonie',
    data: { url: payload.url || '/' }
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const target = (event.notification.data && event.notification.data.url) || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windows => {
        // Si l'application est déjà ouverte, on y navigue plutôt que
        // d'ouvrir un deuxième onglet.
        for (const client of windows) {
          if (client.url.startsWith(self.location.origin) && 'focus' in client) {
            client.navigate(target)
            return client.focus()
          }
        }
        return self.clients.openWindow(target)
      })
  )
})
