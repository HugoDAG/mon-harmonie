import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { Building2, Eye, EyeOff } from 'lucide-react'
import { BUILDINGS } from '../lib/constants'

export default function Register() {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '',
    building: '', coResidentEmail: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  function update(field) {
    return (e) => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signUp(form)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-shell" style={{ justifyContent: 'center' }}>
      <div className="page-content" style={{ paddingBottom: 16 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Building2 size={36} color="var(--blue-600)" style={{ marginBottom: 6 }} />
          <h1 style={{ fontSize: 22, fontWeight: 600 }}>Mon Harmonie</h1>
          <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 4 }}>
            Résidence Harmonie — Aix-en-Provence
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--blue-500)' }} />
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gray-300)' }} />
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gray-300)' }} />
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ background: 'var(--red-50)', color: 'var(--red-500)', padding: '10px 14px', borderRadius: 'var(--radius)', fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label>Prénom</label>
            <input value={form.firstName} onChange={update('firstName')} placeholder="Hugo" required />
          </div>

          <div className="form-group">
            <label>Nom</label>
            <input value={form.lastName} onChange={update('lastName')} placeholder="Dupont" required />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input type="email" value={form.email} onChange={update('email')} placeholder="hugo@email.com" required />
          </div>

          <div className="form-group">
            <label>Mot de passe</label>
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={update('password')} placeholder="••••••••" required minLength={6} style={{ paddingRight: 44 }} />
              <button type="button" onClick={() => setShowPassword(s => !s)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--gray-400)', cursor: 'pointer' }}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Mon bâtiment</label>
            <select value={form.building} onChange={update('building')} required>
              <option value="">Choisir mon bâtiment…</option>
              {BUILDINGS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Lier un co-résident <span style={{ fontSize: 11, color: 'var(--gray-400)', fontWeight: 400 }}>(optionnel)</span></label>
            <input type="email" value={form.coResidentEmail} onChange={update('coResidentEmail')} placeholder="Email du co-résident" />
            <p className="form-hint">Publiez ensemble en tant que co-résidents</p>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Création…' : 'Créer mon compte'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--gray-500)', marginTop: 16 }}>
          Déjà inscrit ? <Link to="/login" style={{ color: 'var(--blue-500)' }}>Se connecter</Link>
        </p>
      </div>
    </div>
  )
}
