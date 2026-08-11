import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import { ArrowLeft } from 'lucide-react'

const SECTIONS = [
  {
    title: "Page d'accueil",
    items: [
      "Mon batiment / Residence - Basculez entre les publications de votre batiment et celles de toute la residence.",
      "Bouton + (barre inferieure) - Creez une nouvelle publication. Choisissez le canal (batiment ou residence), le type (voisinage, signalement, annonce, sondage) et ajoutez une photo si besoin.",
      "Barre de recherche - Recherchez une publication par mot-cle, nom ou type.",
      "J'aime - Appuyez sur le pouce pour liker une publication.",
      "Commentaires - Appuyez sur la bulle pour voir ou ecrire un commentaire.",
      "Modifier - Le crayon apparait sur vos propres publications pour les editer.",
      "Supprimer - La corbeille permet de supprimer vos publications.",
      "Masquer / Afficher - Vous pouvez replier le fil d'actualite pour ne voir que les raccourcis."
    ]
  },
  {
    title: "Raccourcis",
    items: [
      "Signalements - Declarez un probleme (panne, fuite, eclairage...). Un badge de statut indique Nouveau, En cours, Resolu ou Rejete. Onglet \"Mes signalements\" pour voir vos envois.",
      "Annonces - Informations importantes ou petites annonces entre residents. Onglet \"Mes annonces\" pour voir les votres.",
      "Reserver - Reservez un espace commun (salle commune, local velos, parking visiteur, jardin partage, terrain de petanque).",
      "Voisinage - Entraide entre voisins : pret d'outils, colis, services... Onglet \"Mes discussions\" pour voir vos publications.",
      "Sondages - Votez sur des questions soumises a la communaute. 1 vote par logement. Cliquez sur une option pour voter, recliquez pour retirer votre vote.",
      "Documents - Consultez les documents de la copropriete (reglement, PV, contrats, plans). Seuls les membres du conseil peuvent ajouter des documents."
    ]
  },
  {
    title: "Barre de navigation",
    items: [
      "Accueil - Retour au fil d'actualite et aux raccourcis.",
      "Calendrier - Consultez les evenements a venir (AG, conseil syndical, travaux, activites). Cliquez sur un jour pour voir ses evenements. Les membres du conseil peuvent ajouter des evenements.",
      "Bouton + - Creer une nouvelle publication depuis n'importe quelle page.",
      "Annuaire - Retrouvez les contacts importants (syndic, gardiens, urgences) et la liste des residents par batiment. Les sections se replient pour plus de lisibilite.",
      "Mon compte - Vos informations personnelles, co-resident, mot de passe, signalements et annonces envoyes, regles de la copro, guide d'utilisation."
    ]
  },
  {
    title: "Mon compte",
    items: [
      "Mes informations - Consultez votre nom, batiment, numero d'appartement (anonyme), email, co-resident lie et changez votre mot de passe.",
      "Mes signalements - Liste de tous vos signalements avec leur statut actuel.",
      "Mes annonces - Liste de toutes vos annonces publiees.",
      "Regles de copropriete - Sera disponible des reception du reglement.",
      "Guide d'utilisation - Cette page.",
      "Ma residence (admin) - Visualisez tous les batiments et appartements, et les residents presents dans l'app.",
      "Demandes en attente (admin) - Approuvez ou refusez les demandes d'inscription.",
      "Deconnexion - Pour vous deconnecter de l'application.",
      "Supprimer mon compte - Suppression irreversible de toutes vos donnees (RGPD)."
    ]
  },
  {
    title: "Compte duo",
    items: [
      "Si vous vivez a deux dans le meme logement, vous pouvez lier vos comptes. A l'inscription, entrez l'email de votre co-resident.",
      "Quand cette personne s'inscrit avec cet email, les comptes sont lies automatiquement.",
      "Vos publications s'afficheront sous la forme \"Prenom Resident & Prenom Co-Resident - Batiment\".",
      "Le lien est visible dans Mon compte puis Mes informations."
    ]
  },
  {
    title: "Securite et inscription",
    items: [
      "A l'inscription, chaque resident fournit son batiment, son numero d'appartement et une photo de sa boite aux lettres.",
      "Le compte est en attente de validation par un administrateur de la residence.",
      "L'administrateur verifie les informations et approuve ou refuse la demande.",
      "Le numero d'appartement reste anonyme pour les autres residents. Seul le batiment est visible."
    ]
  },
  {
    title: "Roles",
    items: [
      "Resident - Peut publier, commenter, liker, reserver des espaces, consulter les documents et voter aux sondages.",
      "Conseil Syndical - En plus : peut ajouter des documents, creer des evenements au calendrier, modifier le statut des signalements, gerer les contacts de l'annuaire.",
      "Syndic - Memes droits que le conseil syndical.",
      "Admin - Tous les droits, y compris promouvoir d'autres residents depuis l'annuaire, gerer Ma residence et approuver les demandes."
    ]
  },
  {
    title: "Numeros d'urgence",
    items: [
      "Les numeros d'urgence (pompiers, SAMU, police, gaz, eau) sont accessibles dans l'annuaire.",
      "Cliquez sur le telephone vert pour appeler directement."
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
          Bienvenue sur Mon Harmonie ! Voici un guide complet pour vous aider a prendre en main l'application.
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
