import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import BottomNav from '../components/BottomNav'
import { ArrowLeft, FileText, Save, ChevronDown, Check, X as XIcon } from 'lucide-react'

export default function DocumentSummary() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [doc, setDoc] = useState(null)
  const [summary, setSummary] = useState('')
  const [doitText, setDoitText] = useState('')
  const [nePeutText, setNePeutText] = useState('')
  const [loading, setLoading] = useState(true)
  const [extracting, setExtracting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingSummary, setEditingSummary] = useState(false)
  const [editingTable, setEditingTable] = useState(false)
  const [openPage, setOpenPage] = useState(null)

  const canEdit = profile?.role === 'admin' || profile?.role === 'syndic' || profile?.role === 'conseil'

  useEffect(() => { fetchDoc() }, [id])

  async function fetchDoc() {
    const { data } = await supabase.from('documents').select('*').eq('id', id).single()
    setDoc(data)
    if (data?.summary) setSummary(data.summary)
    if (data?.syndic_obligations) {
      try {
        const parsed = JSON.parse(data.syndic_obligations)
        if (Array.isArray(parsed)) {
          // Ancien format (liste d'objets) -> converti en texte
          setDoitText(parsed.filter(o => o.doit).map(o => o.action).join('\n'))
          setNePeutText(parsed.filter(o => !o.doit).map(o => o.action).join('\n'))
        } else {
          setDoitText(parsed.doit || '')
          setNePeutText(parsed.nepeut || '')
        }
      } catch { /* ignore */ }
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
    await supabase.from('documents')
      .update({ syndic_obligations: JSON.stringify({ doit: doitText, nepeut: nePeutText }) })
      .eq('id', id)
    setSaving(false)
    setEditingTable(false)
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
  const hasObligations = doitText.trim() || nePeutText.trim()

  // Rend un bloc de texte libre : une ligne = une puce ; une ligne finissant par ":" = sous-titre
  function ListBlock({ text, variant }) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    if (lines.length === 0) return null
    const isDoit = variant === 'doit'
    const bg = isDoit ? 'var(--green-50)' : 'var(--red-50)'
    const emoji = isDoit ? '✅' : '❌'
    return (
      <div>
        {lines.map((line, i) => {
          if (line.endsWith(':')) {
            return (
              <div key={i} style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-dark)', margin: '10px 0 4px' }}>
                {line.replace(/:$/, '')}
              </div>
            )
          }
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px',
              background: bg, borderRadius: 'var(--radius)', marginBottom: 4
            }}>
              <span style={{ fontSize: 16 }}>{emoji}</span>
              <span style={{ fontSize: 13, color: 'var(--text-dark)', lineHeight: 1.5 }}>
                {line.replace(/^[-•]\s*/, '')}
              </span>
            </div>
          )
        })}
      </div>
    )
  }

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
          <h1 style={{ fontSize: 18, fontWeight: 600, fontFamily: "'Cinzel', serif", color: 'var(--green-dark)' }}>Résumé du document</h1>
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
            <h2 style={{ fontSize: 15, fontWeight: 600, fontFamily: "'Cinzel', serif", color: 'var(--green-dark)' }}>Résumé page par page</h2>
            {canEdit && summary && !editingSummary && (
              <button onClick={() => setEditingSummary(true)} style={{ background: 'none', border: 'none', color: 'var(--green-sage)', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
                Modifier
              </button>
            )}
          </div>

          {editingSummary ? (
            <div>
              <div style={{ background: 'var(--green-sage-10)', padding: '10px 12px', borderRadius: 'var(--radius)', marginBottom: 12, fontSize: 12, color: 'var(--green-dark)', lineHeight: 1.5 }}>
                Utilisez "--- Page X ---" pour séparer les pages. Écrivez un court résumé sous chaque marqueur.
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
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>Aucun résumé disponible</p>
              {canEdit && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {doc?.file_url && doc.file_url.toLowerCase().endsWith('.pdf') && (
                    <button onClick={extractText} disabled={extracting} className="btn btn-secondary" style={{ fontSize: 13, padding: 12 }}>
                      {extracting ? 'Extraction en cours...' : 'Extraire le texte du PDF'}
                    </button>
                  )}
                  <button onClick={() => { setSummary('--- Page 1 ---\nRésumé de la page 1...\n\n--- Page 2 ---\nRésumé de la page 2...'); setEditingSummary(true) }} className="btn btn-primary" style={{ fontSize: 13, padding: 12 }}>
                    Rédiger un résumé manuellement
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ==================== OBLIGATIONS DU SYNDIC ==================== */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, fontFamily: "'Cinzel', serif", color: 'var(--green-dark)' }}>Obligations du syndic</h2>
            {canEdit && !editingTable && hasObligations && (
              <button onClick={() => setEditingTable(true)} style={{ background: 'none', border: 'none', color: 'var(--green-sage)', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
                Modifier
              </button>
            )}
          </div>

          {editingTable ? (
            <div>
              <div style={{ background: 'var(--green-sage-10)', padding: '10px 12px', borderRadius: 'var(--radius)', marginBottom: 12, fontSize: 12, color: 'var(--green-dark)', lineHeight: 1.5 }}>
                Collez votre texte. Une ligne = une puce. Une ligne finissant par « : » devient un sous-titre.
              </div>

              <div className="form-group">
                <label style={{ color: 'var(--green-600)' }}>✅ Ce que le syndic doit faire</label>
                <textarea
                  value={doitText}
                  onChange={e => setDoitText(e.target.value)}
                  placeholder={"Souscrire et gérer les contrats votés en AG :\nAssurance multirisque — AXA (18 448 €/an)\nNettoyage — ASD Nettoyage (68 400 €/an)\n..."}
                  style={{ width: '100%', minHeight: 160, padding: '12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13, fontFamily: 'inherit', lineHeight: 1.6, resize: 'vertical' }}
                />
              </div>

              <div className="form-group">
                <label style={{ color: 'var(--red-500)' }}>❌ Ce que le syndic ne peut pas faire</label>
                <textarea
                  value={nePeutText}
                  onChange={e => setNePeutText(e.target.value)}
                  placeholder={"Engager une dépense > 1 500 € TTC sans consulter le conseil syndical\nModifier seul le règlement de copropriété\n..."}
                  style={{ width: '100%', minHeight: 120, padding: '12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13, fontFamily: 'inherit', lineHeight: 1.6, resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={() => { setEditingTable(false); fetchDoc() }} className="btn btn-secondary" style={{ flex: 1, fontSize: 13 }}>Annuler</button>
                <button onClick={saveObligations} className="btn btn-primary" disabled={saving} style={{ flex: 1, fontSize: 13 }}>
                  <Save size={16} /> {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </div>
          ) : !hasObligations ? (
            <div style={{ textAlign: 'center', padding: 24 }}>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>Aucune obligation renseignée</p>
              {canEdit && (
                <button onClick={() => setEditingTable(true)} className="btn btn-primary" style={{ fontSize: 13, padding: 12 }}>
                  Ajouter les obligations du syndic
                </button>
              )}
            </div>
          ) : (
            <div>
              {doitText.trim() && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--green-dark)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Check size={16} color="var(--green-500)" /> Ce que le syndic doit faire
                  </div>
                  <ListBlock text={doitText} variant="doit" />
                </div>
              )}

              {nePeutText.trim() && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--red-500)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <XIcon size={16} color="var(--red-500)" /> Ce que le syndic ne peut pas faire
                  </div>
                  <ListBlock text={nePeutText} variant="nepeut" />
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
