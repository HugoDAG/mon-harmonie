import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import BottomNav from '../components/BottomNav'
import { FileText, Download, ChevronRight } from 'lucide-react'

const DOC_CATEGORIES = [
  { key: 'reglement', label: 'Règlement intérieur' },
  { key: 'pv', label: "PV d'assemblées générales" },
  { key: 'contrat', label: 'Contrats' },
  { key: 'autre', label: 'Autres documents' }
]

export default function Documents() {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDocs() {
      const { data } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false })
      setDocs(data || [])
      setLoading(false)
    }
    fetchDocs()
  }, [])

  return (
    <div className="app-shell">
      <div className="page-content">
        <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Documents</h1>

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
                  <div key={doc.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', cursor: 'pointer' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 'var(--radius)', background: 'var(--blue-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileText size={18} color="var(--blue-500)" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{doc.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                        {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <ChevronRight size={18} color="var(--gray-300)" />
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
