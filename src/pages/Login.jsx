import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import { Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetMode, setResetMode] = useState(false)
  const [resetSent, setResetSent] = useState(false)
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

  async function handleReset(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/login'
    })
    if (error) setError(error.message)
    else setResetSent(true)
    setLoading(false)
  }

  if (resetMode) {
    return (
      <div className="app-shell" style={{ justifyContent: 'center', background: 'var(--cream)' }}>
        <div className="page-content" style={{ paddingBottom: 16 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h1 style={{ fontSize: 28, fontWeight: 600, fontFamily: "'Cinzel', serif", color: 'var(--green-dark)', letterSpacing: 2 }}>HARMONIE</h1>
            <p style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 4, letterSpacing: 3, textTransform: 'uppercase' }}>Aix-en-Provence</p>
            <p style={{ fontSize: 14, color: 'var(--text-medium)', marginTop: 16 }}>Mot de passe oublié</p>
          </div>
          {resetSent ? (
            <div style={{ background: 'var(--green-sage-10)', color: 'var(--green-dark)', padding: '14px 16px', borderRadius: 'var(--radius)', fontSize: 13, textAlign: 'center' }}>
              Un email a été envoyé à <strong>{email}</strong>.
            </div>
          ) : (
            <form onSubmit={handleReset}>
              {error && <div style={{ background: 'var(--red-50)', color: 'var(--red-500)', padding: '10px 14px', borderRadius: 'var(--radius)', fontSize: 13, marginBottom: 16 }}>{error}</div>}
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="hugo@email.com" required />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Envoi...' : 'Envoyer le lien'}</button>
            </form>
          )}
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-light)', marginTop: 16 }}>
            <span onClick={() => { setResetMode(false); setResetSent(false); setError('') }} style={{ color: 'var(--green-sage)', cursor: 'pointer' }}>Retour</span>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell" style={{ justifyContent: 'center', background: 'var(--cream)' }}>
      <div className="page-content" style={{ paddingBottom: 16 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="https://lorpxeojlganrirzksff.supabase.co/storage/v1/object/public/documents/Logo.png" alt="Harmonie" style={{ width: 80, height: 80, objectFit: 'contain', marginBottom: 8 }} />
          <h1 style={{ fontSize: 28, fontWeight: 600, fontFamily: "'Cinzel', serif", color: 'var(--green-dark)', letterSpacing: 2 }}>HARMONIE</h1>
          <p style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 4, letterSpacing: 3, textTransform: 'uppercase' }}>Aix-en-Provence</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div style={{ background: 'var(--red-50)', color: 'var(--red-500)', padding: '10px 14px', borderRadius: 'var(--radius)', fontSize: 13, marginBottom: 16 }}>{error}</div>}
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="hugo@email.com" required />
          </div>
          <div className="form-group">
            <label>Mot de passe</label>
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required style={{ paddingRight: 44 }} />
              <button type="button" onClick={() => setShowPassword(s => !s)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <p style={{ textAlign: 'right', fontSize: 12, color: 'var(--green-sage)', marginTop: -8, marginBottom: 16, cursor: 'pointer' }} onClick={() => setResetMode(true)}>Mot de passe oublié ?</p>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Connexion...' : 'Se connecter'}</button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-light)', marginTop: 16 }}>
          Pas encore inscrit ? <Link to="/register" style={{ color: 'var(--green-sage)', fontWeight: 500 }}>Créer un compte</Link>
        </p>
      </div>
    </div>
  )
}
