import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import { ArrowLeft, Home, Building, Search, Plus, AlertTriangle, Users, Megaphone, BarChart3, CalendarCheck, FileText, Calendar, User, ThumbsUp, MessageCircle, Pencil, Trash2, Shield, Phone, Lock, LogOut, HelpCircle } from 'lucide-react'

const SECTIONS = [
  {
    title: "Page d'accueil",
    icon: Home,
    items: [
      { icon: Building, text: "Mon bâtiment / Résidence — Basculez entre les publications de votre bâtiment et celles de toute la résidence." },
      { icon: Plus, text: "Bouton + (en bas à droite) — Créez une nouvelle publication. Choisissez le canal (bâtiment ou résidence), le type (voisinage, signalement, annonce, sondage) et ajoutez une photo si besoin." },
      { icon: Search, text: "Barre de recherche — Recherchez une publication par mot-clé, nom ou type." },
      { icon: ThumbsUp, text: "J'aime — Appuyez sur le pouce pour liker une publication." },
      { icon: MessageCircle, text: "Commentaires — Appuyez sur la bulle pour voir ou écrire un commentaire." },
      { icon: Pencil, text: "Modifier — Le crayon apparaît sur vos propres publications pour les éditer." },
      { icon: Trash2, text: "Supprimer — La corbeille permet de supprimer vos publications." }
    ]
  },
  {
    title: "Raccourcis",
    icon: HelpCircle,
    items: [
      { icon: AlertTriangle, text: "Signalements — Consultez tous les signalements (panne, fuite, éclairage…). Un badge de statut indique 🆕 Nouveau, ⏳ En cours, ✅ Résolu ou ❌ Rejeté." },
      { icon: Users, text: "Voisinage — Entraide entre voisins : prêt d'outils, colis, services…" },
      { icon: Megaphone, text: "Annonces — Informations importantes du syndic ou des résidents." },
      { icon: BarChart3, text: "Sondages — Votez sur des questions soumises à la communauté. Cliquez sur une option pour voter, recliquez pour retirer votre vote." },
      { icon: CalendarCheck, text: "Réserver — Réservez un espace commun (salle, local vélos, parking visiteur, jardin)." },
      { icon: FileText, text: "Documents — Consultez les documents de la copropriété (règlement, PV, contrats). Seuls les membres du conseil peuvent ajouter des documents." }
    ]
  },
  {
    title: "Barre de navigation",
    icon: Home,
    items: [
      { icon: Home, text: "Accueil — Retour au fil d'actualité." },
      { icon: Calendar, text: "Calendrier — Consultez les événements à venir (AG, conseil syndical, travaux, activités). Les membres du conseil peuvent ajouter des événements." },
      { icon: Users, text: "Annuaire — Retrouvez les contacts importants (syndic, gardiens, urgences) et la liste des résidents par bâtiment." },
      { icon: User, text: "Profil — Vos informations personnelles, co-résident lié, règles de la copro, changement de mot de passe." }
    ]
  },
  {
    title: "Compte duo",
    icon: Users,
    items: [
      { text: "Si vous vivez à deux dans le même logement, vous pouvez lier vos comptes. À l'inscription, entrez l'email de votre co-résident. Quand cette personne s'inscrit, les comptes sont liés automatiquement." },
      { text: "Vos publications s'afficheront sous la forme \"Hugo & Amélie — C2\"." }
    ]
  },
  {
    title: "Rôles",
    icon: Shield,
    items: [
      { text: "Résident — Peut publier, commenter, liker, réserver des espaces, consulter les documents." },
      { text: "Conseil Syndical — En plus : peut ajouter des documents, créer des événements au calendrier, modifier le statut des signalements, gérer les contacts de l'annuaire." },
      { text: "Syndic — Mêmes droits que le conseil syndical." },
      { text: "Admin — Tous les droits, y compris promouvoir d'autres résidents." }
    ]
  }
]

export default function Guide() {
  const navigate = useNavigate()

  return (
    <div className="app-shell">
      <div className="page-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <button onClick={() => navigate('/profile')} style={{ background: 'none', border: 'none', color: 'var(--gray-500)', padding: 4 }}>
            <ArrowLeft size={22} />
          </button>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>Guide d'utilisation</h1>
        </div>

        <div style={{ background: 'var(--blue-50)', padding: '12px 14px', borderRadius: 'var(--radius-lg)', marginBottom: 20, fontSize: 13, color: 'var(--blue-600)', lineHeight: 1.6 }}>
          Bienvenue sur Mon Harmonie ! Voici un guide rapide pour vous aider à prendre en main l'application.
        </div>

        {SECTIONS.map((section, si) => {
          const SectionIcon = section.icon
          return (
            <div key={si} style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 'var(--radius)', background: 'var(--blue-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <SectionIcon size={16} color="var(--blue-500)" />
                </div>
                <h2 style={{ fontSize: 16, fontWeight: 600 }}>{section.title}</h2>
              </div>
              {section.items.map((item, ii) => {
                const ItemIcon = item.icon
                return (
                  <div key={ii} style={{ display: 'flex', gap: 10, marginBottom: 10, paddingLeft: 4 }}>
                    {ItemIcon && (
                      <div style={{ marginTop: 2, flexShrink: 0 }}>
                        <ItemIcon size={16} color="var(--gray-400)" />
                      </div>
                    )}
                    <p style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.6 }}>{item.text}</p>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
      <BottomNav />
    </div>
  )
}
