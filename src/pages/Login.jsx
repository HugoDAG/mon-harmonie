import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { Building2 } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn({ email, password })
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
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Building2 size={40} color="var(--blue-600)" style={{ marginBottom: 8 }} />
          <h1 style={{ fontSize: 24, fontWeight: 600 }}>Mon Harmonie</h1>
          <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 4 }}>
            Résidence Harmonie — Aix-en-Provence
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ background: 'var(--red-50)', color: 'var(--red-500)', padding: '10px 14px', borderRadius: 'var(--radius)', fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="hugo@email.com" required />
          </div>

          <div className="form-group">
            <label>Mot de passe</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--gray-500)', marginTop: 16 }}>
          Pas encore inscrit ? <Link to="/register" style={{ color: 'var(--blue-500)' }}>Créer un compte</Link>
        </p>
      </div>
    </div>
  )
}
