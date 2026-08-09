import { useState, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import BottomNav from '../components/BottomNav'
import { LogOut, Building, Mail, User, Users, LinkIcon } from 'lucide-react'

export default function Profile() {
  const { profile, signOut } = useAuth()
  const [coResidentName, setCoResidentName] = useState(null)

  useEffect(() => {
    if (profile?.co_resident_id) {
      supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', profile.co_resident_id)
        .single()
        .then(({ data }) => {
          if (data) setCoResidentName(`${data.first_name} ${data.last_name?.[0] || ''}.`)
        })
    }
  }, [profile])

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
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--gray-100)' }}>
            <Building size={18} color="var(--gray-400)" />
            <div>
              <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>Bâtiment</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{profile?.building}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--gray-100)' }}>
            <Mail size={18} color="var(--gray-400)" />
            <div>
              <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>Email</div>
              <div style={{ fontSize: 14 }}>{profile?.email}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
            <LinkIcon size={18} color="var(--gray-400)" />
            <div>
              <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>Co-résident</div>
              {coResidentName ? (
                <div style={{ fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Users size={14} color="var(--green-500)" />
                  {coResidentName}
                  <span style={{ fontSize: 11, color: 'var(--green-500)', background: 'var(--green-50)', padding: '2px 8px', borderRadius: 99 }}>Lié</span>
                </div>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--gray-400)' }}>Aucun co-résident lié</div>
              )}
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
