import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import { ArrowLeft } from 'lucide-react'

const SECTIONS = [
  {
    title: "Page d'accueil",
    items: [
      "Rappels — Quand une Assemblée Générale, un passage d'encombrants, des travaux ou un conseil syndical approchent (moins de 7 jours), un bandeau s'affiche en haut de l'accueil avec le compte à rebours. Il devient orange la veille et le jour même. La croix le masque si vous l'avez bien noté.",
      "Cette semaine à Harmonie — En haut de l'accueil, un récapitulatif des 7 jours à venir : prochains événements, espaces communs réservés, signalements en cours, signalements résolus cette semaine et sondages ouverts. Appuyez sur une ligne pour aller directement au détail. Si tout est calme, le bloc vous le dit.",
      "Pastille orange sur les raccourcis — Le petit chiffre orange indique le nombre de nouveautés depuis votre dernière visite (nouvelles annonces, nouveaux signalements, etc.). Il disparaît une fois que vous êtes passé voir.",
      "Étiquette « Nouveau » — Les publications parues depuis votre dernière visite sont marquées dans le fil.",
      "Mon bâtiment / Résidence — Basculez entre les publications de votre bâtiment et celles de toute la résidence.",
      "Événements dans le fil — Quand le conseil ou le syndic crée un événement, il apparaît aussi dans le fil d'actualité (encadré orange). Appuyez dessus pour ouvrir le calendrier.",
      "Bouton + (barre inférieure) — Créez une nouvelle publication. Choisissez le canal (bâtiment ou résidence), le type et ajoutez une photo si besoin.",
      "Photos — Elles sont automatiquement allégées avant l'envoi (une photo de téléphone de 10 Mo tombe sous le mégaoctet) : le fil reste rapide à charger en 4G et le stockage de la résidence ne sature pas. La qualité à l'écran est inchangée.",
      "Barre de recherche — Recherchez une publication par mot-clé, nom ou type.",
      "J'aime — Appuyez sur le pouce pour liker une publication.",
      "Commentaires — Appuyez sur la bulle pour voir ou écrire un commentaire.",
      "Modifier / Supprimer — Le crayon et la corbeille apparaissent sur vos propres publications.",
      "Nouveaux résidents — Un message de bienvenue s'affiche brièvement quand un voisin vient de s'inscrire.",
      "Tirez vers le bas pour rafraîchir le fil."
    ]
  },
  {
    title: "Les raccourcis",
    items: [
      "Signalements — Déclarez un problème (panne, fuite, éclairage…). Un badge indique le statut : 🆕 Nouveau, ⏳ En cours, ✅ Résolu, ❌ Rejeté.",
      "Signalements oubliés — Si un signalement reste ouvert plus de 14 jours sans que son statut bouge, une mention orange « Sans réponse depuis X jours » apparaît dessus, visible par tous. Le conseil et le syndic voient en plus le total de ces signalements dans le récapitulatif de la semaine.",
      "Annonces — Informations importantes ou petites annonces entre résidents.",
      "Réserver — Réservez un espace commun (salle, local vélos, parking visiteur, jardin, terrain de pétanque).",
      "Voisinage — Entraide entre voisins et covoiturage (voir ci-dessous).",
      "Sondages — Votez sur les questions soumises à la communauté. Un seul vote par logement : si vous avez un compte duo, le vote de votre co-résident vaut pour vous deux, et le sondage se verrouille après son choix. Tant que personne n'a voté chez vous, vous pouvez changer d'avis librement.",
      "Documents — Consultez les documents de la copropriété. Chaque document peut avoir un résumé (voir ci-dessous).",
      "C'est ici, et nulle part ailleurs, que vous retrouvez l'intégralité des publications d'un type — y compris les vôtres."
    ]
  },
  {
    title: "Voisinage & Covoiturage",
    items: [
      "En haut de la page Voisinage : filtres Tout · 🤝 Entraide · 🚗 Covoiturage.",
      "Entraide — Prêt d'outils, colis, services, questions entre voisins.",
      "Covoiturage — Depuis le +, choisissez le type « Covoiturage ». Indiquez si vous proposez ou cherchez un trajet, la destination (Aix centre, gare TGV, aéroport…), le sens (aller / retour), la fréquence (ponctuel ou régulier) et le nombre de places.",
      "Astuce : pour toucher un maximum de voisins, publiez vos trajets sur le canal Résidence."
    ]
  },
  {
    title: "Réserver un espace",
    items: [
      "Choisissez l'espace, la date et l'horaire, puis confirmez.",
      "Terrain de pétanque — Créneaux imposés par l'AG : 11h–21h l'été (avril à septembre), 10h–18h l'hiver (octobre à mars). L'application empêche toute réservation hors de ces horaires.",
      "Votre réservation apparaît automatiquement dans le calendrier, visible par tous : plus de mauvaise surprise en arrivant devant une salle déjà occupée.",
      "Deux réservations ne peuvent plus se chevaucher sur le même espace : si le créneau est pris, l'application vous dit par qui et jusqu'à quelle heure. Finir à 14h et commencer à 14h reste possible, ce n'est pas un chevauchement.",
      "Vous pouvez supprimer vos propres réservations depuis la liste."
    ]
  },
  {
    title: "Barre de navigation",
    items: [
      "Accueil — Fil d'actualité, récapitulatif de la semaine et raccourcis.",
      "Calendrier — Événements à venir (AG, conseil, travaux, encombrants, activités, info) et réservations d'espaces communs. Cliquez sur un jour pour voir son détail. Les pastilles sous les jours indiquent ce qui s'y passe ; la pastille vert foncé signale une réservation. Le conseil/syndic peut ajouter des événements, avec une option de répétition (utile pour les encombrants).",
      "Bouton + — Créer une publication depuis n'importe quelle page.",
      "Annuaire — Contacts importants (syndic, gardiens, prestataires, urgences) et résidents par bâtiment. Les sections se replient et restent comme vous les laissez.",
      "Mon compte — Vos informations et les documents de référence de la résidence."
    ]
  },
  {
    title: "Mon compte",
    items: [
      "La page est en deux parties : « Mon compte », qui ne concerne que vous, et « La résidence », les documents de référence communs.",
      "Mes informations — Nom, bâtiment, numéro d'appartement (anonyme), email, co-résident lié et changement de mot de passe.",
      "Mes documents — Votre coffre-fort personnel : stockez vos documents liés à la copropriété (acte de vente, assurance, factures, courriers syndic…). Ils sont privés et visibles uniquement par vous.",
      "Ma résidence — Vue de tous les bâtiments et appartements, avec les résidents présents dans l'app (lecture seule pour tous, gestion réservée à l'admin/syndic).",
      "Règles de la copropriété — Les règles issues de l'AG (travaux privatifs, boîtes aux lettres, pétanque…).",
      "Guide d'utilisation — Cette page.",
      "Demandes en attente (admin/syndic) — Approbation des nouvelles inscriptions.",
      "Déconnexion et Suppression de compte (RGPD).",
      "Vos signalements et vos annonces ne sont plus listés ici : retrouvez-les directement dans les onglets Signalements et Annonces de l'accueil, avec ceux de vos voisins."
    ]
  },
  {
    title: "Numéro d'appartement",
    items: [
      "Renseignez votre appartement dans Mes informations (ex : C223 = bâtiment C2, 2e étage, appartement n°3).",
      "Il reste anonyme : seuls les autres résidents voient votre bâtiment, jamais votre numéro précis.",
      "Une fois saisi, votre logement apparaît automatiquement dans « Ma résidence », dans le bon bâtiment."
    ]
  },
  {
    title: "Documents & résumés",
    items: [
      "Les documents sont classés par catégorie (règlement, PV d'AG, plans, contrats…).",
      "Bouton Résumé — Pour chaque document, le conseil/syndic peut rédiger un résumé page par page (volets dépliables) et un tableau des obligations du syndic (ce qu'il doit faire ✅ / ce qu'il ne peut pas faire ❌).",
      "Les résidents consultent ces résumés en lecture seule : pratique pour comprendre un PV sans tout lire."
    ]
  },
  {
    title: "Compte duo (co-résidents)",
    items: [
      "Si vous vivez à deux dans le même logement, liez vos comptes : à l'inscription, entrez l'email de votre co-résident.",
      "Quand cette personne s'inscrit avec cet email, les comptes sont liés automatiquement.",
      "Vos publications s'affichent alors sous la forme « Prénom & Prénom — Bâtiment ».",
      "Le lien est visible dans Mon compte → Mes informations."
    ]
  },
  {
    title: "Sécurité et inscription",
    items: [
      "L'accès à l'application se fait par un QR code distribué dans les boîtes aux lettres de la résidence. Scannez-le (ou ouvrez le lien) pour arriver sur la page d'inscription.",
      "À l'inscription, vous renseignez votre nom, votre bâtiment, votre numéro d'appartement et, si vous le souhaitez, l'email de votre co-résident.",
      "Aucune vérification par email n'est demandée : vous pouvez vous connecter dès que le compte est créé.",
      "Le compte est en attente de validation par un administrateur de la résidence, qui vérifie la cohérence des informations avant d'approuver.",
      "Un résident ne peut pas se promouvoir lui-même : seuls l'admin ou le syndic attribuent les rôles.",
      "Vos documents personnels sont stockés dans un espace privé : personne d'autre ne peut les ouvrir, pas même l'admin."
    ]
  },
  {
    title: "Les rôles",
    items: [
      "Résident — Publier, commenter, liker, réserver, consulter, voter aux sondages, stocker ses documents personnels.",
      "Conseil syndical — En plus : ajouter des documents et leurs résumés, créer des événements, modifier le statut des signalements, gérer les contacts de l'annuaire.",
      "Syndic — Mêmes droits que le conseil syndical.",
      "Admin — Tous les droits : promouvoir des résidents, gérer Ma résidence, approuver les demandes d'inscription."
    ]
  },
  {
    title: "Annuaire et numéros d'urgence",
    items: [
      "Les contacts sont regroupés par section (syndic, gardiens, prestataires, urgences). Chaque section se replie, et l'application garde vos sections fermées jusqu'à ce que vous les rouvriez.",
      "Appuyez sur le bouton téléphone vert pour appeler directement.",
      "Un contact peut avoir deux numéros (fixe et portable, par exemple). Dans ce cas, le bouton téléphone vous demande lequel appeler.",
      "Le conseil et le syndic peuvent ajouter, modifier ou supprimer les contacts de l'annuaire."
    ]
  }
]

export default function Guide() {
  const navigate = useNavigate()

  return (
    <div className="app-shell">
      <div className="page-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <button onClick={() => navigate('/profile')} style={{ background: 'none', border: 'none', color: 'var(--green-dark)', padding: 4 }}>
            <ArrowLeft size={22} />
          </button>
          <h1 style={{ fontSize: 20, fontWeight: 600, fontFamily: "'Cinzel', serif", color: 'var(--green-dark)' }}>Guide d'utilisation</h1>
        </div>

        <div style={{ background: 'var(--green-sage-10)', padding: '12px 14px', borderRadius: 'var(--radius-lg)', marginBottom: 20, fontSize: 13, color: 'var(--green-dark)', lineHeight: 1.6 }}>
          Bienvenue sur Mon Harmonie ! Voici un guide complet pour prendre en main l'application de votre copropriété.
        </div>

        {SECTIONS.map((section, si) => (
          <div key={si} style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, fontFamily: "'Cinzel', serif", color: 'var(--green-dark)', marginBottom: 10 }}>
              {section.title}
            </h2>
            {section.items.map((item, ii) => (
              <div key={ii} style={{ display: 'flex', gap: 10, marginBottom: 8, paddingLeft: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green-sage)', marginTop: 7, flexShrink: 0 }} />
                <p style={{ fontSize: 13, color: 'var(--text-medium)', lineHeight: 1.6 }}>{item}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
      <BottomNav />
    </div>
  )
}
