import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import { Upload, Download, ArrowLeft, X, File } from 'lucide-react'

const FOLDER_IMG = 'https://lorpxeojlganrirzksff.supabase.co/storage/v1/object/public/documents/dossier%20transparent.png'

const DOC_CATEGORIES = [
  { key: 'reglement', label: 'Reglement de copropriete' },
  { key: 'pv', label: 'Proces-verbaux AG' },
  { key: 'plans', label: 'Plans de la residence' },
  { key: 'notices', label: 'Notices equipements' },
  { key: 'contrat', label: 'Contrats' },
  { key: 'info', label: 'Informations pratiques' },
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

  useEffect(() => { fetchDocs() }, [])

  async function fetchDocs() {
    const { data } = await supabase.from('documents').select('*').order('created_at', { ascending: false })
    setDocs(data || [])
    setLoading(false)
  }

  async function handleUpload(e) {
    e.preventDefault()
    if (!form.file || !form.title) return
    setUploading(true)

    const fileExt = form.file.name.split('.').pop()
    const fileName = `${Date.now()}-${form.title.replace(/\s+/g, '-')}.${fileExt}`

    const { error: uploadError } = await supabase.storage.from('documents').upload(fileName, form.file)
    if (uploadError) { alert('Erreur : ' + uploadError.message); setUploading(false); return }

    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(fileName)

    await supabase.from('documents').insert({
      title: form.title, category: form.category,
      file_url: urlData.publicUrl, uploaded_by: user.id
    })

    setShowUpload(false)
    setForm({ title: '', category: 'autre', file: null })
    fetchDocs()
    setUploading(false)
  }

  return (
    <div className="app-shell">
      <div className="page-content">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'var(--green-dark)', padding: 4 }}>
              <ArrowLeft size={22} />
            </button>
            <h1 style={{ fontSize: 20, fontWeight: 600, fontFamily: "'Cinzel', serif", color: 'var(--green-dark)' }}>Documents</h1>
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
              <label>Categorie</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {DOC_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Fichier</label>
              <input type="file" onChange={e => setForm(f => ({ ...f, file: e.target.files[0] }))} required accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png" />
            </div>
            <button type="submit" className="btn btn-primary" disabled={uploading}>
              <Upload size={16} /> {uploading ? 'Envoi...' : 'Televerser'}
            </button>
          </form>
        )}

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>Chargement...</p>
        ) : (
          DOC_CATEGORIES.map(cat => {
            const catDocs = docs.filter(d => d.category === cat.key)
            return (
              <div key={cat.key} style={{ marginBottom: 4 }}>
                <div className="card" style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                  cursor: catDocs.length > 0 ? 'pointer' : 'default',
                  opacity: catDocs.length > 0 ? 1 : 0.8
                }}
                  onClick={() => catDocs.length > 0 && catDocs[0].file_url && window.open(catDocs[0].file_url, '_blank')}
                >
                  <img src={FOLDER_IMG} alt="" style={{ width: 36, height: 36, objectFit: 'contain' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-dark)' }}>{cat.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {catDocs.length > 0
                        ? `${catDocs.length} document${catDocs.length > 1 ? 's' : ''}`
                        : 'Aucun document'
                      }
                    </div>
                  </div>
                  {catDocs.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <button onClick={(e) => { e.stopPropagation(); navigate('/document/' + catDocs[0].id + '/summary') }} style={{
                        background: 'var(--green-sage-10)', border: 'none', borderRadius: 6,
                        padding: '4px 8px', fontSize: 11, color: 'var(--green-sage)',
                        cursor: 'pointer', fontWeight: 500
                      }}>Resume</button>
                      <Download size={16} color="var(--text-muted)" />
                    </div>
                  )}
                </div>
                {catDocs.length > 1 && catDocs.slice(1).map(doc => (
                  <div key={doc.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px 10px 52px',
                    borderBottom: '1px solid var(--border-light)', cursor: 'pointer'
                  }}
                    onClick={() => doc.file_url && window.open(doc.file_url, '_blank')}
                  >
                    <File size={14} color="var(--text-muted)" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: 'var(--text-dark)' }}>{doc.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <button onClick={(e) => { e.stopPropagation(); navigate('/document/' + doc.id + '/summary') }} style={{
                        background: 'var(--green-sage-10)', border: 'none', borderRadius: 6,
                        padding: '3px 6px', fontSize: 10, color: 'var(--green-sage)',
                        cursor: 'pointer', fontWeight: 500
                      }}>Resume</button>
                      <Download size={14} color="var(--text-muted)" />
                    </div>
                  </div>
                ))}
              </div>
            )
          })
        )}
      </div>
      <BottomNav />
    </div>
  )
}
