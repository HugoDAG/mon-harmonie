import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import { Eye, EyeOff, Camera } from 'lucide-react'
import { BUILDINGS } from '../lib/constants'

export default function Register() {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '',
    building: '', apartment: '', coResidentEmail: ''
  })
  const [proofImage, setProofImage] = useState(null)
  const [proofPreview, setProofPreview] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  function update(field) {
    return (e) => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  function handleProofChange(e) {
    const file = e.target.files[0]
    if (file) { setProofImage(file); setProofPreview(URL.createObjectURL(file)) }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email, password: form.password
      })
      if (signUpError) throw signUpError

      let proof_photo_url = null
      if (proofImage) {
        const fileExt = proofImage.name.split('.').pop()
        const fileName = `proof-${data.user.id}.${fileExt}`
        const { error: uploadError } = await supabase.storage.from('documents').upload(`proofs/${fileName}`, proofImage)
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('documents').getPublicUrl(`proofs/${fileName}`)
          proof_photo_url = urlData.publicUrl
        }
      }

      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        first_name: form.firstName,
        last_name: form.lastName,
        building: form.building,
        apartment: form.apartment.trim().toUpperCase() || null,
        email: form.email,
        account_status: 'pending',
        proof_photo_url
      })
      if (profileError) throw profileError

      if (form.coResidentEmail) {
        await supabase.from('co_resident_invites').insert({
          inviter_id: data.user.id,
          invitee_email: form.coResidentEmail
        })
      }

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
            Votre demande a été envoyée. Un administrateur de la résidence va vérifier vos informations et valider votre compte.
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
          <img src="https://lorpxeojlganrirzksff.supabase.co/storage/v1/object/public/documents/logo-transparent.png" alt="Harmonie" style={{ width: 70, height: 70, objectFit: 'contain', marginBottom: 8 }} />
          <h1 style={{ fontSize: 22, fontWeight: 600, fontFamily: "'Cinzel', serif", color: 'var(--green-dark)', letterSpacing: 2 }}>HARMONIE</h1>
          <p style={{ fontSize: 12, color: 'var(--text-light)', letterSpacing: 3, textTransform: 'uppercase' }}>Aix-en-Provence</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div style={{ background: 'var(--red-50)', color: 'var(--red-500)', padding: '10px 14px', borderRadius: 'var(--radius)', fontSize: 13, marginBottom: 16 }}>{error}</div>}

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

          <div className="form-group">
            <label>Mon bâtiment</label>
            <select value={form.building} onChange={update('building')} required>
              <option value="">Choisir mon bâtiment...</option>
              {BUILDINGS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Numéro d'appartement</label>
            <input value={form.apartment} onChange={update('apartment')} placeholder="Ex: C223" required />
          </div>

          <div className="form-group">
            <label>Photo de votre boîte aux lettres <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>(preuve de résidence)</span></label>
            <label style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: 12, border: '1px dashed var(--border)', borderRadius: 'var(--radius)',
              cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13
            }}>
              <Camera size={18} />
              {proofImage ? proofImage.name : 'Prendre une photo'}
              <input type="file" accept="image/*" capture="environment" onChange={handleProofChange} style={{ display: 'none' }} />
            </label>
            {proofPreview && (
              <img src={proofPreview} alt="" style={{ width: '100%', borderRadius: 'var(--radius)', marginTop: 8, maxHeight: 150, objectFit: 'cover' }} />
            )}
          </div>

          <div className="form-group">
            <label>Lier un co-résident <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>(optionnel)</span></label>
            <input type="email" value={form.coResidentEmail} onChange={update('coResidentEmail')} placeholder="Email du co-résident" />
            <p className="form-hint">Publiez ensemble en tant que co-résidents</p>
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
