import BottomNav from '../components/BottomNav'
import { Construction } from 'lucide-react'

export default function Placeholder({ title }) {
  return (
    <div className="app-shell">
      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Construction size={40} color="var(--gray-300)" />
        <h1 style={{ fontSize: 18, fontWeight: 600, marginTop: 12 }}>{title}</h1>
        <p style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 4 }}>Bientôt disponible</p>
      </div>
      <BottomNav />
    </div>
  )
}
