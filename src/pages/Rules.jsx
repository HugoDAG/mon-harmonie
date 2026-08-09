import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import { ArrowLeft, Book, Clock, Volume2, Trash2, Car, Dog, Wrench, AlertTriangle } from 'lucide-react'

const RULES = [
  {
    icon: Clock,
    title: 'Horaires de calme',
    content: 'Le calme est de rigueur entre 22h et 7h en semaine, et entre 22h et 9h le week-end et jours fériés. Les travaux sont autorisés de 9h à 12h et de 14h à 18h en semaine, et de 10h à 12h le samedi.'
  },
  {
    icon: Volume2,
    title: 'Nuisances sonores',
    content: 'Les nuisances sonores excessives (musique forte, fêtes bruyantes) sont interdites à toute heure. En cas de fête, prévenez vos voisins et le gardien à l\'avance.'
  },
  {
    icon: Trash2,
    title: 'Gestion des déchets',
    content: 'Les poubelles doivent être déposées dans les conteneurs prévus à cet effet. Le tri sélectif est obligatoire. Les encombrants doivent être signalés au gardien pour enlèvement.'
  },
  {
    icon: Car,
    title: 'Parking',
    content: 'Chaque résident dispose d\'une place numérotée. Les places visiteurs sont réservées aux invités pour une durée maximale de 48h. Les véhicules en panne doivent être signalés au syndic.'
  },
  {
    icon: Dog,
    title: 'Animaux',
    content: 'Les animaux domestiques sont autorisés sous réserve qu\'ils ne causent aucune nuisance. Les chiens doivent être tenus en laisse dans les parties communes. Les déjections doivent être ramassées.'
  },
  {
    icon: Wrench,
    title: 'Travaux privatifs',
    content: 'Tout travaux modifiant la structure ou l\'aspect extérieur du bâtiment doit être soumis au vote en assemblée générale. Informez vos voisins et le syndic avant le début des travaux.'
  },
  {
    icon: AlertTriangle,
    title: 'Parties communes',
    content: 'Il est interdit de laisser des objets personnels dans les parties communes (couloirs, escaliers, halls). Les vélos doivent être rangés dans le local prévu. Tout dégât doit être signalé immédiatement.'
  }
]

export default function Rules() {
  const navigate = useNavigate()

  return (
    <div className="app-shell">
      <div className="page-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <button onClick={() => navigate('/profile')} style={{ background: 'none', border: 'none', color: 'var(--gray-500)', padding: 4 }}>
            <ArrowLeft size={22} />
          </button>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>Règles de la copropriété</h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--blue-50)', borderRadius: 'var(--radius)', marginBottom: 16 }}>
          <Book size={18} color="var(--blue-500)" />
          <p style={{ fontSize: 12, color: 'var(--blue-600)' }}>
            Ces règles s'appliquent à tous les résidents. Le règlement complet est disponible dans la section Documents.
          </p>
        </div>

        {RULES.map((rule, i) => {
          const RuleIcon = rule.icon
          return (
            <div key={i} className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 'var(--radius)', background: 'var(--gray-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <RuleIcon size={16} color="var(--blue-500)" />
                </div>
                <h2 style={{ fontSize: 15, fontWeight: 600 }}>{rule.title}</h2>
              </div>
              <p style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.6 }}>{rule.content}</p>
            </div>
          )
        })}
      </div>
      <BottomNav />
    </div>
  )
}
