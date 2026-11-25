/* Enregistrement du service worker.
 *
 * Le piège classique d'une application installée : le résident garde
 * une version périmée pendant des jours sans le savoir. On surveille
 * donc l'arrivée d'une nouvelle version et on recharge une fois,
 * discrètement, quand elle prend la main.
 */

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return
  if (location.hostname === 'localhost') return

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      // Un échec ici ne doit jamais empêcher l'application de tourner
      console.warn('Service worker non enregistré :', err)
    })
  })

  // À la toute première visite, le service worker prend la main sur une
  // page déjà affichée : la recharger ne servirait qu'à faire clignoter
  // l'écran. On ne recharge que lors d'une vraie mise à jour, quand un
  // service worker en remplace un autre.
  const avaitUnControleur = !!navigator.serviceWorker.controller
  let rechargement = false

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!avaitUnControleur || rechargement) return
    rechargement = true
    window.location.reload()
  })
}
