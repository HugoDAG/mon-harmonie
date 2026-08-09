import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import BottomNav from '../components/BottomNav'
import { FileText, Upload, ChevronRight, ArrowLeft, X, Download } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const DOC_CATEGORIES = [
  { key: 'reglement', label: 'Règlement intérieur' },
  { key: 'pv', label: "PV d'assemblées générales" },
  { key: 'contrat', label: 'Contrats' },
  { key: 'autre', label: 'Autres documents' }
]

export default function Documents() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({ title: '', category: 'autre', file: null })

  const canUpload = profile?.role === 'syndic' || profile?.role === 'admin' || profile?.role === 'conseil'

  useEffect(() => {
    fetchDocs()
  }, [])

  async function fetchDocs() {
    const { data } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false })
    setDocs(data || [])
    setLoading(false)
  }

  async function handleUpload(e) {
    e.preventDefault()
    if (!form.file || !form.title) return
    setUploading(true)

    const fileExt = form.file.name.split('.').pop()
    const fileName = `${Date.now()}-${form.title.replace(/\s+/g, '-')}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, form.file)

    if (uploadError) {
      alert('Erreur lors du téléversement : ' + uploadError.message)
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName)

    const { error: dbError } = await supabase.from('documents').insert({
      title: form.title,
      category: form.category,
      file_url: urlData.publicUrl,
      uploaded_by: user.id
    })

    if (dbError) {
      alert('Erreur : ' + dbError.message)
    } else {
      setShowUpload(false)
      setForm({ title: '', category: 'autre', file: null })
      fetchDocs()
    }
    setUploading(false)
  }

  function handleDownload(doc) {
    if (doc.file_url) {
      window.open(doc.file_url, '_blank')
    }
  }

  return (
    <div className="app-shell">
      <div className="page-content">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'var(--gray-500)', padding: 4 }}>
              <ArrowLeft size={22} />
            </button>
            <h1 style={{ fontSize: 20, fontWeight: 600 }}>Documents</h1>
          </div>
          {canUpload && (
            <button className="btn btn-secondary" onClick={() => setShowUpload(s => !s)} style={{ fontSize: 13 }}>
              {showUpload ? <X size={16} /> : <Upload size={16} />}
              {showUpload ? 'Annuler' : 'Ajouter'}
            </button>
          )}
        </div>

        {showUpload && (
          <form onSubmit={handleUpload} className="card" style={{ marginBottom: 16 }}>
            <div className="form-group">
              <label>Titre du document</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: PV AG Juin 2027" required />
            </div>
            <div className="form-group">
              <label>Catégorie</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {DOC_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Fichier</label>
              <input type="file" onChange={e => setForm(f => ({ ...f, file: e.target.files[0] }))} required accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png" />
            </div>
            <button type="submit" className="btn btn-primary" disabled={uploading}>
              <Upload size={16} />
              {uploading ? 'Envoi en cours…' : 'Téléverser'}
            </button>
          </form>
        )}

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 32 }}>Chargement…</p>
        ) : (
          DOC_CATEGORIES.map(cat => {
            const catDocs = docs.filter(d => d.category === cat.key)
            if (catDocs.length === 0) return null
            return (
              <div key={cat.key} style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-400)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                  {cat.label}
                </h2>
                {catDocs.map(doc => (
                  <div key={doc.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', cursor: 'pointer' }} onClick={() => handleDownload(doc)}>
                    <div style={{ width: 36, height: 36, borderRadius: 'var(--radius)', background: 'var(--blue-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileText size={18} color="var(--blue-500)" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{doc.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                        {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <Download size={18} color="var(--gray-300)" />
                  </div>
                ))}
              </div>
            )
          })
        )}

        {!loading && docs.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 32 }}>
            <FileText size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
            <p style={{ fontSize: 14 }}>Aucun document pour le moment</p>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
