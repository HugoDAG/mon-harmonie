import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import { ArrowLeft } from 'lucide-react'

const SECTIONS = [
  {
    title: "Box de parking (fermeture d'un emplacement)",
    intro: "Un copropriétaire peut fermer sa place de stationnement en sous-sol pour en faire un box, sous conditions :",
    items: [
      "Sous réserve de l'obtention de la conformité du programme",
      "Accord du propriétaire mitoyen de la place de parking",
      "Respecter la teinte des portes de garage définie par l'AG",
      "Travaux réalisés par une entreprise avec garantie décennale habilitée",
      "Porte placée sur la partie privative, sans gêner la libre circulation",
      "Accord préalable du syndic"
    ]
  },
  {
    title: "Stop park",
    intro: "Pose d'un stop park sur sa place de stationnement en sous-sol, sous conditions :",
    items: [
      "Entreprise disposant d'une garantie décennale et habilitée",
      "Posé sur la partie privative, sans gêner la libre circulation",
      "Placé à 1 m à l'intérieur de la place"
    ]
  },
  {
    title: "Borne de recharge véhicule électrique",
    intro: "Pose d'une borne de recharge sur sa place en sous-sol, sous conditions :",
    items: [
      "Entreprise disposant d'une garantie décennale et habilitée",
      "Borne posée sur la partie privative, sans gêner la libre circulation"
    ]
  },
  {
    title: "Brises-vues, pergolas et pergolas bioclimatiques",
    intro: "Autorisés sous réserve :",
    items: [
      "Conformes aux prescriptions de l'architecte",
      "Obtention du certificat de conformité de la résidence (les recommandations seront communiquées dès obtention)"
    ]
  },
  {
    title: "Moustiquaires",
    intro: "Autorisées sous conditions :",
    items: [
      "Obtention du certificat de conformité",
      "Respecter la teinte définie par l'AG",
      "Travaux réalisés par une entreprise avec garantie décennale"
    ]
  },
  {
    title: "Climatisation",
    intro: "La pose d'un système de climatisation affectant les parties communes est autorisée, aux frais exclusifs du copropriétaire, sous strict respect des conditions suivantes :",
    items: [
      "Réception par le syndic du certificat de conformité de l'ensemble immobilier",
      "Ne pas compromettre la stabilité de l'immeuble ni la sécurité des occupants",
      "Conforme à la destination de l'immeuble et au règlement",
      "Ne pas porter atteinte aux droits des autres copropriétaires",
      "Ne pas engendrer de nuisances sonores",
      "Condensats non raccordés aux canalisations d'eaux pluviales (bac récupérateur obligatoire)",
      "Unité extérieure posée en partie basse pour ne pas être visible de la rue ou des jardins",
      "Câblage sous goulotte, percement de façade sans altération",
      "Entreprise qualifiée avec garantie décennale",
      "Transmettre un projet complet respectant le cahier des charges au syndic"
    ]
  },
  {
    title: "Plaques des boîtes aux lettres",
    intro: "Harmonisation des plaques nominatives. Chaque copropriétaire fait réaliser sa plaque à ses frais, selon :",
    items: [
      "Fond : blanc",
      "Écriture : noire",
      "Dimension : taille de l'espace prévu pour l'étiquette sur la boîte aux lettres"
    ]
  },
  {
    title: "Terrain de pétanque",
    intro: "Créneau d'utilisation défini par l'AG :",
    items: [
      "Été (avril à septembre) : 11h – 21h",
      "Hiver (octobre à mars) : 10h – 18h"
    ]
  },
  {
    title: "Places de stationnement adaptées (PMR)",
    intro: "Les emplacements adaptés sont loués en priorité aux personnes titulaires de la carte de stationnement handicapé :",
    items: [
      "Demande au syndic par courrier recommandé",
      "Loyer : 110 € · Dépôt de garantie : 110 €",
      "Bail de 3 mois, renouvelable par tacite reconduction · préavis 1 mois"
    ]
  },
  {
    title: "Vie collective",
    intro: "Rappels issus de l'assemblée générale :",
    items: [
      "Les frais causés par la faute ou la négligence d'un copropriétaire ou d'un occupant lui sont imputés (clause d'aggravation des charges)",
      "La police municipale est autorisée à pénétrer dans les parties communes",
      "Tout copropriétaire peut demander au syndic l'inscription d'une question à l'ordre du jour de la prochaine AG"
    ]
  }
]

export default function Rules() {
  const navigate = useNavigate()

  return (
    <div className="app-shell">
      <div className="page-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <button onClick={() => navigate('/profile')} style={{ background: 'none', border: 'none', color: 'var(--green-dark)', padding: 4 }}>
            <ArrowLeft size={22} />
          </button>
          <h1 style={{ fontSize: 20, fontWeight: 600, fontFamily: "'Cinzel', serif", color: 'var(--green-dark)' }}>Règles de la copropriété</h1>
        </div>

        <div style={{ background: 'var(--green-sage-10)', padding: '12px 14px', borderRadius: 'var(--radius-lg)', marginBottom: 20, fontSize: 12, color: 'var(--green-dark)', lineHeight: 1.6 }}>
          Règles issues de l'assemblée générale constitutive du 8 septembre 2026. Pour tout projet de travaux privatifs, l'accord du syndic et le respect des conditions ci-dessous sont nécessaires.
        </div>

        {SECTIONS.map((section, si) => (
          <div key={si} className="card" style={{ marginBottom: 12 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, fontFamily: "'Cinzel', serif", color: 'var(--green-dark)', marginBottom: 6 }}>
              {section.title}
            </h2>
            {section.intro && (
              <p style={{ fontSize: 13, color: 'var(--text-medium)', lineHeight: 1.6, marginBottom: 8 }}>{section.intro}</p>
            )}
            {section.items.map((item, ii) => (
              <div key={ii} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--green-sage)', marginTop: 7, flexShrink: 0 }} />
                <p style={{ fontSize: 13, color: 'var(--text-medium)', lineHeight: 1.6 }}>{item}</p>
              </div>
            ))}
          </div>
        ))}

        <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 16, lineHeight: 1.5 }}>
          En cas de doute, se référer au règlement de copropriété et au procès-verbal de l'AG disponibles dans Documents.
        </p>
      </div>
      <BottomNav />
    </div>
  )
}
