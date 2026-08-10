import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Lock, Eye, EyeOff, Check } from 'lucide-react'

export default function ChangePassword() {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('6 caractères minimum'); return }
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas'); return }
    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    if (err) { setError(err.message) } else { setSuccess(true); setTimeout(() => { setOpen(false); setSuccess(false); setPassword(''); setConfirm('') }, 2000) }
    setLoading(false)
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="card" style={{
        display: 'flex', alignItems: 'center', gap: 12, width: '100%', cursor: 'pointer',
        textAlign: 'left', border: '1px solid var(--gray-200)', background: '#fff', marginTop: 4, marginBottom: 4
      }}>
        <div style={{ width: 36, height: 36, borderRadius: 'var(--radius)', background: 'var(--gray-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Lock size={18} color="var(--gray-500)" />
        </div>
        <div style={{ fontSize: 14, fontWeight: 500 }}>Changer mon mot de passe</div>
      </button>
    )
  }

  return (
    <div className="card" style={{ marginTop: 4, marginBottom: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Lock size={18} color="var(--gray-500)" />
        <span style={{ fontSize: 14, fontWeight: 600 }}>Changer mon mot de passe</span>
      </div>

      {success ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--green-600)', fontSize: 13 }}>
          <Check size={16} /> Mot de passe modifié avec succès
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ background: 'var(--red-50)', color: 'var(--red-500)', padding: '8px 12px', borderRadius: 'var(--radius)', fontSize: 12, marginBottom: 10 }}>
              {error}
            </div>
          )}
          <div className="form-group">
            <label>Nouveau mot de passe</label>
            <div style={{ position: 'relative' }}>
              <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} style={{ paddingRight: 44 }} />
              <button type="button" onClick={() => setShowPw(s => !s)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--gray-400)', cursor: 'pointer' }}>
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label>Confirmer</label>
            <input type={showPw ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" required />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => { setOpen(false); setError('') }} className="btn btn-secondary" style={{ flex: 1, fontSize: 13 }}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1, fontSize: 13 }}>{loading ? '…' : 'Modifier'}</button>
          </div>
        </form>
      )}
    </div>
  )
}
