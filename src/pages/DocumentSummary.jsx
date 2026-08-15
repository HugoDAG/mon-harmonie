import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import BottomNav from '../components/BottomNav'
import { ArrowLeft, FileText, Save, ChevronDown, Plus, Trash2, Check, X as XIcon } from 'lucide-react'

export default function DocumentSummary() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [doc, setDoc] = useState(null)
  const [summary, setSummary] = useState('')
  const [obligations, setObligations] = useState([])
  const [loading, setLoading] = useState(true)
  const [extracting, setExtracting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingSummary, setEditingSummary] = useState(false)
  const [editingTable, setEditingTable] = useState(false)
  const [openPage, setOpenPage] = useState(null)
  const [newObligation, setNewObligation] = useState({ action: '', doit: true })

  const canEdit = profile?.role === 'admin' || profile?.role === 'syndic' || profile?.role === 'conseil'

  useEffect(() => { fetchDoc() }, [id])

  async function fetchDoc() {
    const { data } = await supabase.from('documents').select('*').eq('id', id).single()
    setDoc(data)
    if (data?.summary) setSummary(data.summary)
    if (data?.syndic_obligations) {
      try { setObligations(JSON.parse(data.syndic_obligations)) } catch { setObligations([]) }
    }
    setLoading(false)
  }

  async function extractText() {
    if (!doc?.file_url) return
    setExtracting(true)
    try {
      const pdf = await window.pdfjsLib.getDocument(doc.file_url).promise
      const extractedPages = []
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()
        const text = textContent.items.map(item => item.str).join(' ')
        extractedPages.push({ page: i, text: text.trim() })
      }
      const autoSummary = extractedPages.map(p =>
        `--- Page ${p.page} ---\n${p.text.slice(0, 500)}${p.text.length > 500 ? '...' : ''}`
      ).join('\n\n')
      setSummary(autoSummary)
      setEditingSummary(true)
    } catch (err) {
      alert('Erreur lors de la lecture du PDF : ' + err.message)
    }
    setExtracting(false)
  }

  async function saveSummary() {
    setSaving(true)
    await supabase.from('documents').update({ summary }).eq('id', id)
    setSaving(false)
    setEditingSummary(false)
  }

  async function saveObligations() {
    setSaving(true)
    await supabase.from('documents').update({ syndic_obligations: JSON.stringify(obligations) }).eq('id', id)
    setSaving(false)
    setEditingTable(false)
  }

  function addObligation() {
    if (!newObligation.action.trim()) return
    setObligations(prev => [...prev, { action: newObligation.action.trim(), doit: newObligation.doit }])
    setNewObligation({ action: '', doit: true })
  }

  function removeObligation(index) {
    setObligations(prev => prev.filter((_, i) => i !== index))
  }

  function toggleObligation(index) {
    setObligations(prev => prev.map((o, i) => i === index ? { ...o, doit: !o.doit } : o))
  }

  function parseSummaryPages() {
    if (!summary.includes('--- Page ')) return null
    return summary.split('--- Page ').filter(Boolean).map(section => {
      const lines = section.split('\n')
      const pageTitle = 'Page ' + lines[0]?.replace(' ---', '')
      const content = lines.slice(1).join('\n').trim()
      return { title: pageTitle, content }
    })
  }

  const summaryPages = parseSummaryPages()
  const doitFaire = obligations.filter(o => o.doit)
  const nePeutPas = obligations.filter(o => !o.doit)

  if (loading) {
    return (
      <div className="app-shell">
        <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <p style={{ color: 'var(--text-muted)' }}>Chargement...</p>
        </div>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="app-shell">
      <div className="page-content">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <button onClick={() => navigate('/documents')} style={{ background: 'none', border: 'none', color: 'var(--green-dark)', padding: 4 }}>
            <ArrowLeft size={22} />
          </button>
          <h1 style={{ fontSize: 18, fontWeight: 600, fontFamily: "'Cinzel', serif", color: 'var(--green-dark)' }}>Resume du document</h1>
        </div>

        {/* Document info */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, borderRadius: 'var(--radius)', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={20} color="var(--green-sage)" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 500 }}>{doc?.title}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {doc?.created_at && new Date(doc.created_at).toLocaleDateString('fr-FR')}
            </div>
          </div>
        </div>

        {/* ==================== RESUME PAGE PAR PAGE ==================== */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, fontFamily: "'Cinzel', serif", color: 'var(--green-dark)' }}>Resume page par page</h2>
            {canEdit && summary && !editingSummary && (
              <button onClick={() => setEditingSummary(true)} style={{ background: 'none', border: 'none', color: 'var(--green-sage)', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
                Modifier
              </button>
            )}
          </div>

          {editingSummary ? (
            <div>
              <div style={{ background: 'var(--green-sage-10)', padding: '10px 12px', borderRadius: 'var(--radius)', marginBottom: 12, fontSize: 12, color: 'var(--green-dark)', lineHeight: 1.5 }}>
                Utilisez "--- Page X ---" pour separer les pages. Ecrivez un court resume sous chaque marqueur.
              </div>
              <textarea
                value={summary}
                onChange={e => setSummary(e.target.value)}
                style={{ width: '100%', minHeight: 250, padding: '12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13, fontFamily: 'inherit', lineHeight: 1.6, resize: 'vertical' }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button onClick={() => setEditingSummary(false)} className="btn btn-secondary" style={{ flex: 1, fontSize: 13 }}>Annuler</button>
                <button onClick={saveSummary} className="btn btn-primary" disabled={saving} style={{ flex: 1, fontSize: 13 }}>
                  <Save size={16} /> {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </div>
          ) : summary && summaryPages ? (
            summaryPages.map((p, i) => {
              const isPageOpen = openPage === i
              return (
                <div key={i} style={{ marginBottom: 6 }}>
                  <button onClick={() => setOpenPage(isPageOpen ? null : i)} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', padding: '12px 14px',
                    background: 'var(--cream)', border: '1px solid var(--border-light)',
                    borderRadius: isPageOpen ? 'var(--radius) var(--radius) 0 0' : 'var(--radius)',
                    cursor: 'pointer', textAlign: 'left'
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--green-dark)' }}>{p.title}</span>
                    <ChevronDown size={16} color="var(--text-muted)" style={{ transform: isPageOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                  </button>
                  {isPageOpen && (
                    <div style={{
                      padding: '12px 14px', background: 'var(--white)',
                      border: '1px solid var(--border-light)', borderTop: 'none',
                      borderRadius: '0 0 var(--radius) var(--radius)',
                      fontSize: 13, color: 'var(--text-medium)', lineHeight: 1.7, whiteSpace: 'pre-wrap'
                    }}>
                      {p.content || 'Aucun contenu pour cette page.'}
                    </div>
                  )}
                </div>
              )
            })
          ) : summary && !summaryPages ? (
            <div className="card" style={{ fontSize: 13, color: 'var(--text-medium)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {summary}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 24 }}>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>Aucun resume disponible</p>
              {canEdit && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {doc?.file_url && doc.file_url.toLowerCase().endsWith('.pdf') && (
                    <button onClick={extractText} disabled={extracting} className="btn btn-secondary" style={{ fontSize: 13, padding: 12 }}>
                      {extracting ? 'Extraction en cours...' : 'Extraire le texte du PDF'}
                    </button>
                  )}
                  <button onClick={() => { setSummary('--- Page 1 ---\nResume de la page 1...\n\n--- Page 2 ---\nResume de la page 2...'); setEditingSummary(true) }} className="btn btn-primary" style={{ fontSize: 13, padding: 12 }}>
                    Rediger un resume manuellement
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ==================== TABLEAU SYNDIC ==================== */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, fontFamily: "'Cinzel', serif", color: 'var(--green-dark)' }}>Obligations du syndic</h2>
            {canEdit && !editingTable && obligations.length > 0 && (
              <button onClick={() => setEditingTable(true)} style={{ background: 'none', border: 'none', color: 'var(--green-sage)', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
                Modifier
              </button>
            )}
          </div>

          {obligations.length === 0 && !editingTable ? (
            <div style={{ textAlign: 'center', padding: 24 }}>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>Aucune obligation renseignee</p>
              {canEdit && (
                <button onClick={() => setEditingTable(true)} className="btn btn-primary" style={{ fontSize: 13, padding: 12 }}>
                  Ajouter les obligations du syndic
                </button>
              )}
            </div>
          ) : editingTable ? (
            <div>
              {/* Liste editable */}
              {obligations.map((o, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0',
                  borderBottom: '1px solid var(--border-light)'
                }}>
                  <button onClick={() => toggleObligation(i)} style={{
                    width: 28, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer',
                    background: o.doit ? 'var(--green-50)' : 'var(--red-50)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    {o.doit ? <Check size={14} color="var(--green-500)" /> : <XIcon size={14} color="var(--red-500)" />}
                  </button>
                  <span style={{ flex: 1, fontSize: 13, color: 'var(--text-dark)' }}>{o.action}</span>
                  <button onClick={() => removeObligation(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                    <Trash2 size={14} color="var(--text-muted)" />
                  </button>
                </div>
              ))}

              {/* Ajouter */}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <select value={newObligation.doit} onChange={e => setNewObligation(n => ({ ...n, doit: e.target.value === 'true' }))}
                  style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 12 }}>
                  <option value="true">Doit faire</option>
                  <option value="false">Ne peut pas</option>
                </select>
                <input value={newObligation.action} onChange={e => setNewObligation(n => ({ ...n, action: e.target.value }))}
                  placeholder="Ex: Entretenir les parties communes"
                  style={{ flex: 1, padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13 }}
                  onKeyDown={e => e.key === 'Enter' && addObligation()}
                />
                <button onClick={addObligation} style={{ background: 'var(--green-dark)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', padding: '8px 12px', cursor: 'pointer' }}>
                  <Plus size={16} />
                </button>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button onClick={() => { setEditingTable(false); fetchDoc() }} className="btn btn-secondary" style={{ flex: 1, fontSize: 13 }}>Annuler</button>
                <button onClick={saveObligations} className="btn btn-primary" disabled={saving} style={{ flex: 1, fontSize: 13 }}>
                  <Save size={16} /> {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Tableau lecture */}
              {doitFaire.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--green-dark)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Check size={16} color="var(--green-500)" /> Ce que le syndic doit faire
                  </div>
                  {doitFaire.map((o, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                      background: 'var(--green-50)', borderRadius: 'var(--radius)', marginBottom: 4
                    }}>
                      <span style={{ fontSize: 16 }}>✅</span>
                      <span style={{ fontSize: 13, color: 'var(--text-dark)' }}>{o.action}</span>
                    </div>
                  ))}
                </div>
              )}

              {nePeutPas.length > 0 && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--red-500)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <XIcon size={16} color="var(--red-500)" /> Ce que le syndic ne peut pas faire
                  </div>
                  {nePeutPas.map((o, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                      background: 'var(--red-50)', borderRadius: 'var(--radius)', marginBottom: 4
                    }}>
                      <span style={{ fontSize: 16 }}>❌</span>
                      <span style={{ fontSize: 13, color: 'var(--text-dark)' }}>{o.action}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
