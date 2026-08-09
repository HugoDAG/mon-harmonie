import { useState } from 'react'
import { X, Send } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { POST_TYPES, CHANNELS } from '../lib/constants'

export default function CreatePost({ onClose, onCreated }) {
  const { user, profile } = useAuth()
  const [content, setContent] = useState('')
  const [type, setType] = useState(POST_TYPES.VOISINAGE)
  const [channel, setChannel] = useState(CHANNELS.BUILDING)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!content.trim()) return
    setLoading(true)

    const { error } = await supabase.from('posts').insert({
      user_id: user.id,
      content: content.trim(),
      type,
      channel,
      building: profile?.building
    })

    if (!error) {
      onCreated?.()
      onClose()
    }
    setLoading(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100
    }}>
      <div style={{
        background: '#fff', borderRadius: '16px 16px 0 0', width: '100%',
        maxWidth: 480, padding: '16px 16px 24px', maxHeight: '80vh', overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600 }}>Nouvelle publication</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--gray-400)' }}>
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Channel */}
          <div className="form-group">
            <label>Canal de diffusion</label>
            <div className="channel-switch">
              <button type="button"
                className={`channel-btn ${channel === CHANNELS.BUILDING ? 'active' : ''}`}
                onClick={() => setChannel(CHANNELS.BUILDING)}
              >Mon bâtiment ({profile?.building})</button>
              <button type="button"
                className={`channel-btn ${channel === CHANNELS.RESIDENCE ? 'active' : ''}`}
                onClick={() => setChannel(CHANNELS.RESIDENCE)}
              >Résidence</button>
            </div>
          </div>

          {/* Type */}
          <div className="form-group">
            <label>Type</label>
            <select value={type} onChange={e => setType(e.target.value)}>
              <option value="voisinage">Voisinage</option>
              <option value="signalement">Signalement</option>
              <option value="annonce">Annonce</option>
              <option value="sondage">Sondage</option>
            </select>
          </div>

          {/* Content */}
          <div className="form-group">
            <label>Message</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Écrivez votre message…"
              rows={4}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            <Send size={16} />
            {loading ? 'Publication…' : 'Publier'}
          </button>
        </form>
      </div>
    </div>
  )
}
