import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import { ArrowLeft } from 'lucide-react'

const SECTIONS = [
  {
    title: "Page d'accueil",
    items: [
      "Mon bâtiment / Résidence — Basculez entre les publications de votre bâtiment et celles de toute la résidence.",
      "Bouton + (barre inférieure) — Créez une nouvelle publication. Choisissez le canal (bâtiment ou résidence), le type et ajoutez une photo si besoin.",
      "Barre de recherche — Recherchez une publication par mot-clé, nom ou type.",
      "J'aime — Appuyez sur le pouce pour liker une publication.",
      "Commentaires — Appuyez sur la bulle pour voir ou écrire un commentaire.",
      "Modifier / Supprimer — Le crayon et la corbeille apparaissent sur vos propres publications.",
      "Nouveaux résidents — Un message de bienvenue s'affiche brièvement quand un voisin vient de s'inscrire."
    ]
  },
  {
    title: "Les raccourcis",
    items: [
      "Signalements — Déclarez un problème (panne, fuite, éclairage…). Un badge indique le statut : 🆕 Nouveau, ⏳ En cours, ✅ Résolu, ❌ Rejeté.",
      "Annonces — Informations importantes ou petites annonces entre résidents.",
      "Réserver — Réservez un espace commun (salle, local vélos, parking visiteur, jardin, terrain de pétanque).",
      "Voisinage — Entraide entre voisins et covoiturage (voir ci-dessous).",
      "Sondages — Votez sur les questions soumises à la communauté. 1 vote par logement.",
      "Documents — Consultez les documents de la copropriété. Chaque document peut avoir un résumé (voir ci-dessous)."
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
      "Vous pouvez supprimer vos propres réservations depuis la liste."
    ]
  },
  {
    title: "Barre de navigation",
    items: [
      "Accueil — Fil d'actualité et raccourcis.",
      "Calendrier — Événements à venir (AG, conseil, travaux, encombrants, activités, info). Cliquez sur un jour pour voir ses événements. Le conseil/syndic peut en ajouter, avec une option de répétition (utile pour les encombrants).",
      "Bouton + — Créer une publication depuis n'importe quelle page.",
      "Annuaire — Contacts importants (syndic, gardiens, prestataires, urgences) et résidents par bâtiment. Les sections se replient.",
      "Mon compte — Vos informations et vos espaces personnels."
    ]
  },
  {
    title: "Mon compte",
    items: [
      "Mes informations — Nom, bâtiment, numéro d'appartement (anonyme), email, co-résident lié et changement de mot de passe.",
      "Mes signalements — Liste de tous vos signalements avec leur statut.",
      "Mes annonces — Liste de toutes vos annonces publiées.",
      "Mes documents — Votre coffre-fort personnel : stockez vos documents liés à la copropriété (acte de vente, assurance, factures, courriers syndic…). Ils sont privés et visibles uniquement par vous.",
      "Règles de la copropriété — Les règles issues de l'AG (travaux privatifs, boîtes aux lettres, pétanque…).",
      "Guide d'utilisation — Cette page.",
      "Ma résidence — Vue de tous les bâtiments et appartements, avec les résidents présents dans l'app (lecture seule pour tous, gestion réservée à l'admin/syndic).",
      "Demandes en attente (admin/syndic) — Approbation des nouvelles inscriptions.",
      "Déconnexion et Suppression de compte (RGPD)."
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
      "À l'inscription, chaque résident fournit son bâtiment, son numéro d'appartement et une photo de sa boîte aux lettres (preuve de résidence).",
      "Le compte est en attente de validation par un administrateur de la résidence.",
      "L'administrateur vérifie les informations et approuve ou refuse la demande.",
      "Un résident ne peut pas se promouvoir lui-même : seuls l'admin ou le syndic attribuent les rôles.",
      "Vos documents personnels sont stockés dans un espace privé et chiffré d'accès : personne d'autre ne peut les ouvrir."
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
    title: "Numéros d'urgence",
    items: [
      "Les numéros d'urgence (pompiers, SAMU, police, gaz, eau) sont dans l'annuaire.",
      "Appuyez sur le bouton téléphone vert pour appeler directement."
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
