import { useState } from 'react'
import { X, Send, Camera } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { POST_TYPES, CHANNELS } from '../lib/constants'

export default function CreatePost({ onClose, onCreated }) {
  const { user, profile } = useAuth()
  const [content, setContent] = useState('')
  const [type, setType] = useState(POST_TYPES.VOISINAGE)
  const [channel, setChannel] = useState(CHANNELS.BUILDING)
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading, setLoading] = useState(false)

  function handleImageChange(e) {
    const file = e.target.files[0]
    if (file) {
      setImage(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!content.trim()) return
    setLoading(true)

    let image_url = null

    if (image) {
      const fileExt = image.name.split('.').pop()
      const fileName = `${Date.now()}-${user.id}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(`posts/${fileName}`, image)

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('documents')
          .getPublicUrl(`posts/${fileName}`)
        image_url = urlData.publicUrl
      }
    }

    const { error } = await supabase.from('posts').insert({
      user_id: user.id,
      content: content.trim(),
      type,
      channel,
      building: profile?.building,
      image_url
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
        maxWidth: 480, padding: '16px 16px 24px', maxHeight: '85vh', overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600 }}>Nouvelle publication</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--gray-400)' }}>
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
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

          <div className="form-group">
            <label>Type</label>
            <select value={type} onChange={e => setType(e.target.value)}>
              <option value="voisinage">Voisinage</option>
              <option value="signalement">Signalement</option>
              <option value="annonce">Annonce</option>
              <option value="sondage">Sondage</option>
            </select>
          </div>

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

          <div className="form-group">
            <label>Photo (optionnel)</label>
            <label style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: 12, border: '1px dashed var(--gray-300)', borderRadius: 'var(--radius)',
              cursor: 'pointer', color: 'var(--gray-400)', fontSize: 13
            }}>
              <Camera size={18} />
              {image ? image.name : 'Ajouter une photo'}
              <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
            </label>
            {imagePreview && (
              <div style={{ position: 'relative', marginTop: 8 }}>
                <img src={imagePreview} alt="" style={{ width: '100%', borderRadius: 'var(--radius)', maxHeight: 200, objectFit: 'cover' }} />
                <button type="button" onClick={() => { setImage(null); setImagePreview(null) }}
                  style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <X size={16} color="#fff" />
                </button>
              </div>
            )}
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
