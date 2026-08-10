import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import { ArrowLeft } from 'lucide-react'

const SECTIONS = [
  {
    title: "Page d'accueil",
    items: [
      "Mon bâtiment / Résidence — Basculez entre les publications de votre bâtiment et celles de toute la résidence.",
      "Bouton + (barre inférieure) — Créez une nouvelle publication. Choisissez le canal (bâtiment ou résidence), le type (voisinage, signalement, annonce, sondage) et ajoutez une photo si besoin.",
      "Barre de recherche — Recherchez une publication par mot-clé, nom ou type.",
      "👍 J'aime — Appuyez sur le pouce pour liker une publication.",
      "💬 Commentaires — Appuyez sur la bulle pour voir ou écrire un commentaire.",
      "✏️ Modifier — Le crayon apparaît sur vos propres publications pour les éditer.",
      "🗑️ Supprimer — La corbeille permet de supprimer vos publications.",
      "Masquer / Afficher — Vous pouvez replier le fil d'actualité pour ne voir que les raccourcis."
    ]
  },
  {
    title: "Raccourcis",
    items: [
      "Signalements — Déclarez un problème (panne, fuite, éclairage…). Un badge de statut indique 🆕 Nouveau, ⏳ En cours, ✅ Résolu ou ❌ Rejeté. Onglet \"Mes signalements\" pour voir vos envois.",
      "Annonces — Informations importantes ou petites annonces entre résidents. Onglet \"Mes annonces\" pour voir les vôtres.",
      "Réserver — Réservez un espace commun (salle, local vélos, parking visiteur, jardin).",
      "Voisinage — Entraide entre voisins : prêt d'outils, colis, services… Onglet \"Mes discussions\" pour voir vos publications.",
      "Sondages — Votez sur des questions soumises à la communauté. 1 vote par logement. Cliquez sur une option pour voter, recliquez pour retirer votre vote.",
      "Documents — Consultez les documents de la copropriété (règlement, PV, contrats, plans). Seuls les membres du conseil peuvent ajouter des documents."
    ]
  },
  {
    title: "Barre de navigation",
    items: [
      "Accueil — Retour au fil d'actualité et aux raccourcis.",
      "Calendrier — Consultez les événements à venir (AG, conseil syndical, travaux, activités). Cliquez sur un jour pour voir ses événements. Les membres du conseil peuvent ajouter des événements.",
      "Bouton + — Créer une nouvelle publication depuis n'importe quelle page.",
      "Annuaire — Retrouvez les contacts importants (syndic, gardiens, urgences) et la liste des résidents par bâtiment. Les sections se replient pour plus de lisibilité.",
      "Mon compte — Vos informations personnelles, co-résident, mot de passe, signalements et annonces envoyés, règles de la copro, guide d'utilisation."
    ]
  },
  {
    title: "Mon compte",
    items: [
      "Mes informations — Consultez votre nom, bâtiment, email, co-résident lié et changez votre mot de passe.",
      "Mes signalements — Liste de tous vos signalements avec leur statut actuel.",
      "Mes annonces — Liste de toutes vos annonces publiées.",
      "Règles de copropriété — Sera disponible dès réception du règlement.",
      "Guide d'utilisation — Cette page.",
      "Déconnexion — Pour vous déconnecter de l'application.",
      "Supprimer mon compte — Suppression irréversible de toutes vos données (RGPD)."
    ]
  },
  {
    title: "Compte duo",
    items: [
      "Si vous vivez à deux dans le même logement, vous pouvez lier vos comptes. À l'inscription, entrez l'email de votre co-résident.",
      "Quand cette personne s'inscrit avec cet email, les comptes sont liés automatiquement.",
      "Vos publications s'afficheront sous la forme \"Hugo & Amélie — C2\".",
      "Le lien est visible dans Mon compte > Mes informations."
    ]
  },
  {
    title: "Rôles",
    items: [
      "Résident — Peut publier, commenter, liker, réserver des espaces, consulter les documents et voter aux sondages.",
      "Conseil Syndical — En plus : peut ajouter des documents, créer des événements au calendrier, modifier le statut des signalements, gérer les contacts de l'annuaire.",
      "Syndic — Mêmes droits que le conseil syndical.",
      "Admin — Tous les droits, y compris promouvoir d'autres résidents depuis l'annuaire."
    ]
  },
  {
    title: "Numéros d'urgence",
    items: [
      "Les numéros d'urgence (pompiers, SAMU, police, gaz, eau) sont accessibles dans l'annuaire.",
      "Cliquez sur le téléphone vert pour appeler directement."
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
          Bienvenue sur Mon Harmonie ! Voici un guide complet pour vous aider à prendre en main l'application.
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
