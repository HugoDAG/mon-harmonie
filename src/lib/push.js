/* Abonnement aux notifications push.
 *
 * Le navigateur ne donne rien sans un geste explicite du résident :
 * la permission doit être demandée depuis un clic, jamais au chargement.
 * Un refus est définitif tant que la personne ne le change pas elle-même
 * dans les réglages du navigateur — d'où les messages explicites.
 */

import { supabase } from './supabase'

// Clé publique VAPID — elle identifie l'application auprès du service de
// notification. Publique par nature, elle n'a rien de secret.
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || ''

export const SUJETS_NOTIF = [
  { cle: 'signalement', label: 'Signalements',  aide: "Un problème déclaré dans la résidence" },
  { cle: 'annonce',     label: 'Annonces',      aide: "Les informations du conseil et des voisins" },
  { cle: 'evenement',   label: 'Calendrier',    aide: "AG, travaux, encombrants, activités" },
  { cle: 'sondage',     label: 'Sondages',      aide: "Une question soumise au vote" },
  { cle: 'voisinage',   label: 'Voisinage',     aide: "Entraide et covoiturage" },
  { cle: 'commentaire', label: 'Réponses',      aide: "Quand quelqu'un répond à vos publications" },
  { cle: 'reservation', label: 'Réservations',  aide: "Quand un espace commun est réservé" }
]

export function pushDisponible() {
  return 'serviceWorker' in navigator &&
         'PushManager' in window &&
         'Notification' in window
}

export function permissionNotif() {
  if (!('Notification' in window)) return 'indisponible'
  return Notification.permission // 'default' | 'granted' | 'denied'
}

// Le navigateur veut la clé en octets, pas en texte.
function base64VersOctets(base64) {
  const complement = '='.repeat((4 - (base64.length % 4)) % 4)
  const normalise = (base64 + complement).replace(/-/g, '+').replace(/_/g, '/')
  const brut = window.atob(normalise)
  return Uint8Array.from([...brut].map(c => c.charCodeAt(0)))
}

function enBase64(buffer) {
  return window.btoa(String.fromCharCode(...new Uint8Array(buffer)))
}

/** Abonne cet appareil et enregistre l'abonnement côté base. */
export async function activerNotifications(userId) {
  if (!pushDisponible()) {
    throw new Error("Ce navigateur ne gère pas les notifications. Sur iPhone, " +
      "il faut d'abord ajouter Mon Harmonie à l'écran d'accueil.")
  }
  if (!VAPID_PUBLIC_KEY) {
    throw new Error("Les notifications ne sont pas encore configurées côté serveur.")
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    throw new Error("Les notifications ont été refusées. Vous pouvez les réautoriser " +
      "dans les réglages de votre navigateur, à la rubrique Notifications.")
  }

  const registration = await navigator.serviceWorker.ready

  // Un abonnement peut déjà exister (autre session, réinstallation) :
  // on le réutilise plutôt que d'en créer un deuxième pour le même appareil.
  let abonnement = await registration.pushManager.getSubscription()
  if (!abonnement) {
    abonnement = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64VersOctets(VAPID_PUBLIC_KEY)
    })
  }

  const { error } = await supabase.from('push_subscriptions').upsert({
    user_id: userId,
    endpoint: abonnement.endpoint,
    p256dh: enBase64(abonnement.getKey('p256dh')),
    auth: enBase64(abonnement.getKey('auth')),
    user_agent: navigator.userAgent.slice(0, 300),
    last_seen: new Date().toISOString()
  }, { onConflict: 'endpoint' })

  if (error) throw new Error("L'abonnement n'a pas pu être enregistré : " + error.message)
  return true
}

/** Désabonne cet appareil. Les autres appareils du résident restent actifs. */
export async function desactiverNotifications() {
  if (!pushDisponible()) return
  const registration = await navigator.serviceWorker.ready
  const abonnement = await registration.pushManager.getSubscription()
  if (!abonnement) return

  await supabase.from('push_subscriptions').delete().eq('endpoint', abonnement.endpoint)
  await abonnement.unsubscribe()
}

/** Cet appareil-ci est-il abonné ? */
export async function appareilAbonne() {
  if (!pushDisponible() || permissionNotif() !== 'granted') return false
  try {
    const registration = await navigator.serviceWorker.ready
    return !!(await registration.pushManager.getSubscription())
  } catch {
    return false
  }
}

/** Enregistre les sujets choisis par le résident. */
export async function enregistrerPreferences(userId, prefs) {
  const { error } = await supabase.from('profiles')
    .update({ notif_prefs: prefs }).eq('id', userId)
  if (error) throw new Error("Vos préférences n'ont pas pu être enregistrées : " + error.message)
}
