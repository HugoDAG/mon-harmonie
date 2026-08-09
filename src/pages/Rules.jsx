import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import { ArrowLeft, Book, Clock } from 'lucide-react'

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

        <div style={{ textAlign: 'center', padding: 40 }}>
          <Clock size={40} color="var(--gray-300)" style={{ marginBottom: 12 }} />
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 8 }}>Pas encore de règlement</h2>
          <p style={{ fontSize: 13, color: 'var(--gray-400)', lineHeight: 1.6 }}>
            Nous n'avons pas encore reçu le règlement de copropriété. Il sera disponible ici dès réception.
          </p>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
