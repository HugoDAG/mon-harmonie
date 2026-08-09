import { useAuth } from '../lib/AuthContext'
import BottomNav from '../components/BottomNav'
import { LogOut, Building, Mail, User, Users } from 'lucide-react'

export default function Profile() {
  const { profile, signOut } = useAuth()

  return (
    <div className="app-shell">
      <div className="page-content">
        <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20 }}>Mon profil</h1>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div className="avatar" style={{
            width: 64, height: 64, fontSize: 22, margin: '0 auto 12px',
            background: 'var(--blue-50)', color: 'var(--blue-600)'
          }}>
            {profile?.first_name?.[0]}{profile?.last_name?.[0]}
          </div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>
            {profile?.first_name} {profile?.last_name}
          </div>
          {profile?.co_resident && (
            <div style={{ fontSize: 14, color: 'var(--gray-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 4 }}>
              <Users size={14} /> & {profile.co_resident.first_name}
            </div>
          )}
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--gray-100)' }}>
            <Building size={18} color="var(--gray-400)" />
            <div>
              <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>Bâtiment</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{profile?.building}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
            <Mail size={18} color="var(--gray-400)" />
            <div>
              <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>Email</div>
              <div style={{ fontSize: 14 }}>{profile?.email}</div>
            </div>
          </div>
        </div>

        <button
          onClick={signOut}
          className="btn"
          style={{
            width: '100%', marginTop: 24, padding: 12,
            background: 'var(--red-50)', color: 'var(--red-500)',
            border: '1px solid var(--red-500)', borderRadius: 'var(--radius)'
          }}
        >
          <LogOut size={16} /> Se déconnecter
        </button>
      </div>
      <BottomNav />
    </div>
  )
}
