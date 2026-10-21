import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import { ArrowLeft, Upload, Download, Trash2, FileText, X, FolderOpen, Lock } from 'lucide-react'

const DOC_CATEGORIES = [
  { key: 'acte', label: 'Acte de vente / compromis' },
  { key: 'bail', label: 'Bail / contrat de location' },
  { key: 'assurance', label: 'Assurance habitation' },
  { key: 'facture', label: 'Factures / charges' },
  { key: 'courrier', label: 'Courriers syndic' },
  { key: 'pv', label: 'PV d\'assemblée générale' },
  { key: 'travaux', label: 'Devis / travaux' },
  { key: 'autre', label: 'Autres' }
]

export default function MesDocuments() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({ title: '', category: 'autre', file: null })
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => { fetchDocs() }, [])

  async function fetchDocs() {
    const { data } = await supabase
      .from('personal_documents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setDocs(data || [])
    setLoading(false)
  }

  async function handleUpload(e) {
    e.preventDefault()
    if (!form.file || !form.title) return
    setUploading(true)

    const fileExt = form.file.name.split('.').pop()
        const cleanTitle = form.title
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9-]/g, '-')
      .replace(/-+/g, '-')
    const filePath = `${user.id}/${Date.now()}-${cleanTitle}.${fileExt}`

        const filePath = `${user.id}/${Date.now()}-${cleanTitle}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('personal')
      .upload(filePath, form.file)

    if (uploadError) {
      alert('Erreur : ' + uploadError.message)
      setUploading(false)
      return
    }

    const fileSize = form.file.size < 1024 * 1024
      ? `${(form.file.size / 1024).toFixed(0)} Ko`
      : `${(form.file.size / (1024 * 1024)).toFixed(1)} Mo`

        await supabase.from('personal_documents').insert({
      user_id: user.id,
      title: form.title,
      category: form.category,
      file_url: filePath,
      file_size: fileSize
    })

    setShowUpload(false)
    setForm({ title: '', category: 'autre', file: null })
    fetchDocs()
    setUploading(false)
  }

    async function openDoc(filePath) {
    const { data, error } = await supabase.storage
      .from('personal')
      .createSignedUrl(filePath, 300)
    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank')
    } else {
      alert('Impossible d\'ouvrir le document')
    }
  }
  async function handleDelete(id) {
    await supabase.from('personal_documents').delete().eq('id', id)
    setDeletingId(null)
    fetchDocs()
  }

  const groupedDocs = DOC_CATEGORIES.map(cat => ({
    ...cat,
    docs: docs.filter(d => d.category === cat.key)
  })).filter(cat => cat.docs.length > 0)

  return (
    <div className="app-shell">
      <div className="page-content">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => navigate('/profile')} style={{ background: 'none', border: 'none', color: 'var(--green-dark)', padding: 4 }}>
              <ArrowLeft size={22} />
            </button>
            <h1 style={{ fontSize: 18, fontWeight: 600, fontFamily: "'Cinzel', serif", color: 'var(--green-dark)' }}>Mes documents</h1>
          </div>
          <button className="btn btn-secondary" onClick={() => setShowUpload(s => !s)} style={{ fontSize: 13 }}>
            {showUpload ? <X size={16} /> : <Upload size={16} />}
            {showUpload ? 'Annuler' : 'Ajouter'}
          </button>
        </div>

        {/* Privacy notice */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
          background: 'var(--green-sage-10)', borderRadius: 'var(--radius)',
          marginBottom: 16, fontSize: 12, color: 'var(--green-dark)'
        }}>
          <Lock size={14} />
          Vos documents sont prives et visibles uniquement par vous.
        </div>

        {/* Upload form */}
        {showUpload && (
          <form onSubmit={handleUpload} className="card" style={{ marginBottom: 16 }}>
            <div className="form-group">
              <label>Titre du document</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Acte de vente apt C223" required />
            </div>
            <div className="form-group">
              <label>Categorie</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {DOC_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Fichier</label>
              <input type="file" onChange={e => setForm(f => ({ ...f, file: e.target.files[0] }))} required accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.heic" />
            </div>
            <button type="submit" className="btn btn-primary" disabled={uploading}>
              <Upload size={16} /> {uploading ? 'Envoi en cours...' : 'Ajouter le document'}
            </button>
          </form>
        )}

        {/* Documents list */}
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>Chargement...</p>
        ) : docs.length === 0 && !showUpload ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <FolderOpen size={40} color="var(--text-muted)" style={{ marginBottom: 12, opacity: 0.4 }} />
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 4 }}>Aucun document personnel</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Ajoutez vos documents lies a la copropriete : acte de vente, assurance, factures...</p>
          </div>
        ) : (
          groupedDocs.map(cat => (
            <div key={cat.key} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                {cat.label}
              </div>
              {cat.docs.map(doc => (
                <div key={doc.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 'var(--radius)',
                    background: 'var(--cream)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center'
                  }}>
                    <FileText size={18} color="var(--green-sage)" />
                  </div>
                  <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => openDoc(doc.file_url)}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-dark)' }}>{doc.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                      {doc.file_size && ` · ${doc.file_size}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => openDoc(doc.file_url)} style={{
                      width: 32, height: 32, borderRadius: '50%', background: 'var(--green-50)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: 'none', cursor: 'pointer'
                    }}>
                      <Download size={14} color="var(--green-500)" />
                    </button>
                    {deletingId === doc.id ? (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => handleDelete(doc.id)} style={{
                          background: 'var(--red-500)', color: '#fff', border: 'none',
                          borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer'
                        }}>Oui</button>
                        <button onClick={() => setDeletingId(null)} style={{
                          background: 'var(--cream)', border: 'none',
                          borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer',
                          color: 'var(--text-muted)'
                        }}>Non</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeletingId(doc.id)} style={{
                        width: 32, height: 32, borderRadius: '50%', background: 'var(--red-50)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: 'none', cursor: 'pointer'
                      }}>
                        <Trash2 size={14} color="var(--red-500)" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
      <BottomNav />
    </div>
  )
}
