/* Mon Harmonie — envoi des notifications push
 *
 * Appelée par un « Database Webhook » de Supabase à chaque insertion
 * dans posts, events, comments ou bookings.
 *
 * Elle décide qui doit être prévenu, en respectant trois règles :
 *   - l'auteur n'est jamais notifié de sa propre publication ;
 *   - une publication de bâtiment ne sort pas du bâtiment ;
 *   - chacun ne reçoit que les sujets qu'il a cochés.
 *
 * Les abonnements périmés (téléphone réinitialisé, application
 * désinstallée) sont supprimés au fil de l'eau : sans ça la table
 * se remplit d'adresses mortes et chaque envoi ralentit.
 */

import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const VAPID_PUBLIC  = Deno.env.get('VAPID_PUBLIC_KEY')  ?? ''
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY') ?? ''
const VAPID_SUJET   = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:contact@mon-harmonie.app'

webpush.setVapidDetails(VAPID_SUJET, VAPID_PUBLIC, VAPID_PRIVATE)

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// Un covoiturage est une publication de voisinage : même préférence.
const PREF_PAR_TYPE: Record<string, string> = {
  annonce: 'annonce',
  signalement: 'signalement',
  voisinage: 'voisinage',
  covoiturage: 'voisinage',
  sondage: 'sondage'
}

const TITRE_PAR_TYPE: Record<string, string> = {
  annonce: 'Nouvelle annonce',
  signalement: 'Nouveau signalement',
  voisinage: 'Voisinage',
  covoiturage: 'Covoiturage',
  sondage: 'Nouveau sondage'
}

const CHEMIN_PAR_TYPE: Record<string, string> = {
  annonce: '/posts/annonce',
  signalement: '/posts/signalement',
  voisinage: '/posts/voisinage',
  covoiturage: '/posts/voisinage',
  sondage: '/posts/sondage'
}

function resumer(texte: string | null, taille = 110): string {
  if (!texte) return ''
  const propre = texte.replace(/\s+/g, ' ').trim()
  return propre.length > taille ? propre.slice(0, taille - 1) + '…' : propre
}

type Destinataires = {
  prefKey: string
  titre: string
  corps: string
  url: string
  batiment?: string | null   // limite aux résidents de ce bâtiment
  auteur?: string | null     // à ne pas notifier
  seulement?: string[]       // liste fermée d'identifiants
}

/** Construit la notification à partir de l'évènement reçu. */
async function preparer(table: string, record: any): Promise<Destinataires | null> {
  if (table === 'posts') {
    const prefKey = PREF_PAR_TYPE[record.type]
    if (!prefKey) return null
    return {
      prefKey,
      titre: TITRE_PAR_TYPE[record.type] ?? 'Mon Harmonie',
      corps: resumer(record.content),
      url: CHEMIN_PAR_TYPE[record.type] ?? '/',
      batiment: record.channel === 'building' ? record.building : null,
      auteur: record.user_id
    }
  }

  if (table === 'events') {
    return {
      prefKey: 'evenement',
      titre: 'Nouvel évènement',
      corps: resumer(record.title),
      url: '/calendar',
      auteur: record.created_by ?? null
    }
  }

  if (table === 'bookings') {
    const { data: espace } = await supabase
      .from('spaces').select('name').eq('id', record.space_id).single()
    return {
      prefKey: 'reservation',
      titre: 'Espace réservé',
      corps: resumer(`${espace?.name ?? 'Un espace commun'} le ${record.date}`),
      url: '/calendar',
      auteur: record.user_id
    }
  }

  if (table === 'comments') {
    // Seul l'auteur de la publication est concerné : prévenir toute la
    // résidence d'une réponse serait insupportable.
    const { data: post } = await supabase
      .from('posts').select('user_id, type').eq('id', record.post_id).single()
    if (!post || post.user_id === record.user_id) return null
    return {
      prefKey: 'commentaire',
      titre: 'Réponse à votre publication',
      corps: resumer(record.content),
      url: CHEMIN_PAR_TYPE[post.type] ?? '/',
      auteur: record.user_id,
      seulement: [post.user_id]
    }
  }

  return null
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Méthode non autorisée', { status: 405 })
  }
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    return new Response('Clés VAPID absentes', { status: 500 })
  }

  let charge: any
  try {
    charge = await req.json()
  } catch {
    return new Response('Corps illisible', { status: 400 })
  }

  const { table, type, record } = charge ?? {}
  if (type !== 'INSERT' || !record) {
    return new Response(JSON.stringify({ ignore: true }), { status: 200 })
  }

  const notif = await preparer(table, record)
  if (!notif) {
    return new Response(JSON.stringify({ ignore: true }), { status: 200 })
  }

  // Qui a coché ce sujet et a le droit de voir la publication ?
  let requete = supabase
    .from('profiles')
    .select('id, notif_prefs')
    .eq('account_status', 'approved')

  if (notif.batiment) requete = requete.eq('building', notif.batiment)
  if (notif.seulement) requete = requete.in('id', notif.seulement)

  const { data: profils, error: erreurProfils } = await requete
  if (erreurProfils) {
    return new Response(JSON.stringify({ error: erreurProfils.message }), { status: 500 })
  }

  const destinataires = (profils ?? [])
    .filter(p => p.id !== notif.auteur)
    .filter(p => {
      const prefs = p.notif_prefs ?? {}
      // Une préférence absente vaut « oui », sauf les réservations.
      return prefs[notif.prefKey] ?? (notif.prefKey !== 'reservation')
    })
    .map(p => p.id)

  if (destinataires.length === 0) {
    return new Response(JSON.stringify({ envoyees: 0 }), { status: 200 })
  }

  const { data: abonnements } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .in('user_id', destinataires)

  const contenu = JSON.stringify({
    title: notif.titre,
    body: notif.corps,
    url: notif.url,
    tag: `${table}-${record.id}`
  })

  let envoyees = 0
  const perimes: string[] = []

  await Promise.all((abonnements ?? []).map(async (ab) => {
    try {
      await webpush.sendNotification(
        { endpoint: ab.endpoint, keys: { p256dh: ab.p256dh, auth: ab.auth } },
        contenu
      )
      envoyees++
    } catch (e: any) {
      // 404 et 410 : l'abonnement n'existe plus chez le navigateur.
      if (e?.statusCode === 404 || e?.statusCode === 410) perimes.push(ab.id)
      else console.error('Envoi échoué', ab.endpoint?.slice(0, 60), e?.statusCode, e?.message)
    }
  }))

  if (perimes.length > 0) {
    await supabase.from('push_subscriptions').delete().in('id', perimes)
  }

  return new Response(
    JSON.stringify({ envoyees, perimes: perimes.length, destinataires: destinataires.length }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
