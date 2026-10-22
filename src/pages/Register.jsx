import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Eye, EyeOff, KeyRound } from 'lucide-react'

export default function Register() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', code: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  function update(field) {
    return (e) => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const code = form.code.trim()
      if (!code) throw new Error("Veuillez entrer votre code d'accès")

      // 1. Vérifier le code AVANT de créer le compte
      const { data: lookup, error: lookupErr } = await supabase.rpc('lookup_access_code', { p_code: code })
      if (lookupErr) throw lookupErr
      const apt = lookup && lookup[0]
      if (!apt) throw new Error("Code d'accès invalide. Vérifiez le papier reçu dans votre boîte aux lettres.")
      if (apt.is_full) throw new Error("Ce logement a déjà 2 comptes associés. Contactez le conseil syndical si besoin.")

      // 2. Créer le compte
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email, password: form.password
      })
      if (signUpError) throw signUpError

      // 3. Créer le profil (en attente de validation)
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        first_name: form.firstName,
        last_name: form.lastName,
        building: apt.building,
        apartment: apt.number,
        email: form.email,
        account_status: 'pending'
      })
      if (profileError) throw profileError

      // 4. Lier automatiquement un éventuel co-résident du même logement
      await supabase.rpc('link_coresident', { p_building: apt.building, p_number: apt.number })

      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="app-shell" style={{ justifyContent: 'center', background: 'var(--cream)' }}>
        <div className="page-content" style={{ textAlign: 'center', paddingTop: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <h1 style={{ fontSize: 22, fontWeight: 600, fontFamily: "'Cinzel', serif", color: 'var(--green-dark)', marginBottom: 8 }}>
            Compte en attente
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-light)', lineHeight: 1.6, marginBottom: 24 }}>
            Votre demande a été envoyée. Un administrateur de la résidence va valider votre compte.
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Vous recevrez un accès dès que votre compte sera approuvé.
          </p>
          <button onClick={() => navigate('/login')} className="btn btn-primary" style={{ marginTop: 32 }}>
            Retour à la connexion
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell" style={{ justifyContent: 'center', background: 'var(--cream)' }}>
      <div className="page-content" style={{ paddingBottom: 16 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src="https://lorpxeojlganrirzksff.supabase.co/storage/v1/object/public/documents/new%20logo%20trans.png" alt="Harmonie" style={{ width: 70, height: 70, objectFit: 'contain', marginBottom: 8 }} />
          <h1 style={{ fontSize: 22, fontWeight: 600, fontFamily: "'Cinzel', serif", color: 'var(--green-dark)', letterSpacing: 2 }}>HARMONIE</h1>
          <p style={{ fontSize: 12, color: 'var(--text-light)', letterSpacing: 3, textTransform: 'uppercase' }}>Aix-en-Provence</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div style={{ background: 'var(--red-50)', color: 'var(--red-500)', padding: '10px 14px', borderRadius: 'var(--radius)', fontSize: 13, marginBottom: 16 }}>{error}</div>}

          {/* Code d'accès */}
          <div className="form-group">
            <label>Code d'accès</label>
            <div style={{ position: 'relative' }}>
              <KeyRound size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input value={form.code} onChange={update('code')} placeholder="Ex : C223-7K4P" required
                style={{ paddingLeft: 40, textTransform: 'uppercase', fontFamily: 'monospace', letterSpacing: 1 }} />
            </div>
            <p className="form-hint" style={{ lineHeight: 1.5 }}>
              Le code reçu dans votre boîte aux lettres. Il identifie automatiquement votre bâtiment et votre appartement.
            </p>
          </div>

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
              <button type="button" onClick={() => setShowPassword(s => !s)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div style={{ background: 'var(--green-sage-10)', padding: '10px 12px', borderRadius: 'var(--radius)', marginBottom: 16, fontSize: 12, color: 'var(--green-dark)', lineHeight: 1.5 }}>
            Vous vivez à deux ? Votre co-résident utilise le même code pour créer son compte : vos deux comptes seront automatiquement liés.
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Envoi...' : 'Demander un compte'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-light)', marginTop: 16 }}>
          Déjà inscrit ? <Link to="/login" style={{ color: 'var(--green-sage)', fontWeight: 500 }}>Se connecter</Link>
        </p>
      </div>
    </div>
  )
}
