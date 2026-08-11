import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import { ArrowLeft, Check, X, Building, User } from 'lucide-react'

export default function PendingApprovals() {
  const navigate = useNavigate()
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchPending() }, [])

  async function fetchPending() {
    const { data } = await supabase.from('profiles')
      .select('*')
      .eq('account_status', 'pending')
      .order('created_at', { ascending: false })
    setPending(data || [])
    setLoading(false)
  }

  async function handleApprove(id) {
    await supabase.from('profiles').update({ account_status: 'approved' }).eq('id', id)
    fetchPending()
  }

  async function handleReject(id) {
    await supabase.from('profiles').update({ account_status: 'rejected' }).eq('id', id)
    fetchPending()
  }

  return (
    <div className="app-shell">
      <div className="page-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <button onClick={() => navigate('/profile')} style={{ background: 'none', border: 'none', color: 'var(--green-dark)', padding: 4 }}>
            <ArrowLeft size={22} />
          </button>
          <h1 style={{ fontSize: 20, fontWeight: 600, fontFamily: "'Cinzel', serif", color: 'var(--green-dark)' }}>Demandes en attente</h1>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>Chargement...</p>
        ) : pending.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>
            <User size={32} color="var(--text-muted)" style={{ marginBottom: 8, opacity: 0.5 }} />
            <p style={{ fontSize: 14 }}>Aucune demande en attente</p>
          </div>
        ) : (
          pending.map(p => (
            <div key={p.id} className="card" style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div className="avatar" style={{ background: 'var(--cream)', color: 'var(--green-dark)' }}>
                  {p.first_name?.[0]}{p.last_name?.[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 500 }}>{p.first_name} {p.last_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.email}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <div style={{ flex: 1, padding: '8px 12px', background: 'var(--cream)', borderRadius: 'var(--radius)', fontSize: 13 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Bâtiment</div>
                  <div style={{ fontWeight: 500 }}>{p.building}</div>
                </div>
                <div style={{ flex: 1, padding: '8px 12px', background: 'var(--cream)', borderRadius: 'var(--radius)', fontSize: 13 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Appartement</div>
                  <div style={{ fontWeight: 500 }}>{p.apartment || 'Non renseigné'}</div>
                </div>
              </div>

              {p.proof_photo_url && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Photo de preuve :</div>
                  <img src={p.proof_photo_url} alt="Preuve" style={{ width: '100%', borderRadius: 'var(--radius)', maxHeight: 200, objectFit: 'cover' }} />
                </div>
              )}

              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
                Inscrit le {new Date(p.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => handleReject(p.id)} style={{
                  flex: 1, padding: 10, borderRadius: 'var(--radius)',
                  background: 'var(--red-50)', color: 'var(--red-500)',
                  border: '1px solid var(--red-500)', fontSize: 13, fontWeight: 500,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                }}>
                  <X size={16} /> Refuser
                </button>
                <button onClick={() => handleApprove(p.id)} style={{
                  flex: 1, padding: 10, borderRadius: 'var(--radius)',
                  background: 'var(--green-dark)', color: '#fff',
                  border: 'none', fontSize: 13, fontWeight: 500,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                }}>
                  <Check size={16} /> Approuver
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      <BottomNav />
    </div>
  )
}
