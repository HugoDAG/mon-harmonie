import { useState } from 'react'
import { X, Send, Camera, Plus, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { POST_TYPES, CHANNELS, RIDE_DESTINATIONS } from '../lib/constants'

const EMPTY_RIDE = {
  role: 'propose',
  destination: 'Aix centre',
  customDestination: '',
  direction: 'aller',
  frequency: 'ponctuel',
  date: '',
  time: '',
  days: '',
  seats: 3
}

export default function CreatePost({ onClose, onCreated, defaultType }) {
  const { user, profile } = useAuth()
  const [content, setContent] = useState('')
  const [type, setType] = useState(defaultType || POST_TYPES.VOISINAGE)
  const [channel, setChannel] = useState(CHANNELS.BUILDING)
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [pollOptions, setPollOptions] = useState(['', ''])
  const [ride, setRide] = useState(EMPTY_RIDE)

  const isRide = type === POST_TYPES.COVOITURAGE
  const isPoll = type === POST_TYPES.SONDAGE

  function updateRide(field, value) {
    setRide(r => ({ ...r, [field]: value }))
  }

  function handleImageChange(e) {
    const file = e.target.files[0]
    if (file) { setImage(file); setImagePreview(URL.createObjectURL(file)) }
  }

  function updatePollOption(index, value) {
    setPollOptions(opts => opts.map((o, i) => i === index ? value : o))
  }

  function addPollOption() {
    if (pollOptions.length < 6) setPollOptions(opts => [...opts, ''])
  }

  function removePollOption(index) {
    if (pollOptions.length > 2) setPollOptions(opts => opts.filter((_, i) => i !== index))
  }

  function buildRideSummary() {
    const dest = ride.destination === 'Autre' ? (ride.customDestination || 'Destination à préciser') : ride.destination
    const who = ride.role === 'propose' ? 'Je propose un trajet' : 'Je cherche un trajet'
    return `${who} vers ${dest}`
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!isRide && !content.trim()) return
    if (isPoll && pollOptions.filter(o => o.trim()).length < 2) {
      alert('Un sondage doit avoir au moins 2 options')
      return
    }
    if (isRide && ride.frequency === 'ponctuel' && !ride.date) {
      alert('Indiquez la date du trajet')
      return
    }
    if (isRide && ride.destination === 'Autre' && !ride.customDestination.trim()) {
      alert('Précisez la destination')
      return
    }
    setLoading(true)

    let image_url = null
    if (image && !isRide && !isPoll) {
      const fileExt = image.name.split('.').pop()
      const fileName = `${Date.now()}-${user.id}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('documents').upload(`posts/${fileName}`, image)
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('documents').getPublicUrl(`posts/${fileName}`)
        image_url = urlData.publicUrl
      }
    }

    const ridePayload = isRide ? {
      role: ride.role,
      destination: ride.destination === 'Autre' ? ride.customDestination.trim() : ride.destination,
      direction: ride.direction,
      frequency: ride.frequency,
      date: ride.frequency === 'ponctuel' ? ride.date : null,
      time: ride.time || null,
      days: ride.frequency === 'regulier' ? (ride.days.trim() || null) : null,
      seats: ride.role === 'propose' ? Number(ride.seats) || 1 : null
    } : null

    const { data: postData, error } = await supabase.from('posts').insert({
      user_id: user.id,
      content: content.trim() || (isRide ? buildRideSummary() : ''),
      type,
      channel,
      building: profile?.building,
      image_url,
      ride: ridePayload
    }).select().single()

    if (!error && isPoll && postData) {
      const options = pollOptions.filter(o => o.trim()).map((label, i) => ({ post_id: postData.id, label: label.trim(), position: i }))
      await supabase.from('poll_options').insert(options)
    }

    if (error) {
      alert('Erreur : ' + error.message)
    } else {
      onCreated?.()
      onClose()
    }
    setLoading(false)
  }

  const chipStyle = (active) => ({
    flex: 1, padding: '8px 0', fontSize: 12, fontWeight: 500, cursor: 'pointer',
    border: '1px solid ' + (active ? 'var(--green-dark)' : 'var(--border)'),
    background: active ? 'var(--green-dark)' : 'var(--white)',
    color: active ? 'var(--cream)' : 'var(--text-medium)',
    borderRadius: 'var(--radius)'
  })

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100
    }}>
      <div style={{
        background: 'var(--white)', borderRadius: '16px 16px 0 0', width: '100%',
        maxWidth: 480, padding: '16px 16px 24px', maxHeight: '85vh', overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600, fontFamily: "'Cinzel', serif", color: 'var(--green-dark)' }}>Nouvelle publication</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}>
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Canal de diffusion</label>
            <div className="channel-switch">
              <button type="button" className={`channel-btn ${channel === CHANNELS.BUILDING ? 'active' : ''}`} onClick={() => setChannel(CHANNELS.BUILDING)}>Mon bâtiment ({profile?.building})</button>
              <button type="button" className={`channel-btn ${channel === CHANNELS.RESIDENCE ? 'active' : ''}`} onClick={() => setChannel(CHANNELS.RESIDENCE)}>Résidence</button>
            </div>
          </div>

          <div className="form-group">
            <label>Type</label>
            <select value={type} onChange={e => setType(e.target.value)}>
              <optgroup label="Voisinage">
                <option value="voisinage">Entraide entre voisins</option>
                <option value="covoiturage">Covoiturage</option>
              </optgroup>
              <optgroup label="Autres">
                <option value="signalement">Signalement</option>
                <option value="annonce">Annonce</option>
                <option value="sondage">Sondage</option>
              </optgroup>
            </select>
          </div>

          {/* Covoiturage */}
          {isRide && (
            <>
              <div className="form-group">
                <label>Je...</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => updateRide('role', 'propose')} style={chipStyle(ride.role === 'propose')}>🚗 Propose un trajet</button>
                  <button type="button" onClick={() => updateRide('role', 'cherche')} style={chipStyle(ride.role === 'cherche')}>🙋 Cherche un trajet</button>
                </div>
              </div>

              <div className="form-group">
                <label>Destination</label>
                <select value={ride.destination} onChange={e => updateRide('destination', e.target.value)}>
                  {RIDE_DESTINATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                {ride.destination === 'Autre' && (
                  <input value={ride.customDestination} onChange={e => updateRide('customDestination', e.target.value)} placeholder="Ex: Plan de Campagne" style={{ marginTop: 8 }} />
                )}
              </div>

              <div className="form-group">
                <label>Sens</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => updateRide('direction', 'aller')} style={chipStyle(ride.direction === 'aller')}>Aller</button>
                  <button type="button" onClick={() => updateRide('direction', 'retour')} style={chipStyle(ride.direction === 'retour')}>Retour</button>
                  <button type="button" onClick={() => updateRide('direction', 'aller-retour')} style={chipStyle(ride.direction === 'aller-retour')}>Aller-retour</button>
                </div>
              </div>

              <div className="form-group">
                <label>Fréquence</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => updateRide('frequency', 'ponctuel')} style={chipStyle(ride.frequency === 'ponctuel')}>Ponctuel</button>
                  <button type="button" onClick={() => updateRide('frequency', 'regulier')} style={chipStyle(ride.frequency === 'regulier')}>Régulier</button>
                </div>
              </div>

              {ride.frequency === 'ponctuel' ? (
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" value={ride.date} onChange={e => updateRide('date', e.target.value)} min={new Date().toISOString().split('T')[0]} />
                </div>
              ) : (
                <div className="form-group">
                  <label>Jours</label>
                  <input value={ride.days} onChange={e => updateRide('days', e.target.value)} placeholder="Ex: Du lundi au vendredi" />
                </div>
              )}

              <div className="form-group">
                <label>Heure de départ (optionnel)</label>
                <input type="time" value={ride.time} onChange={e => updateRide('time', e.target.value)} />
              </div>

              {ride.role === 'propose' && (
                <div className="form-group">
                  <label>Places disponibles</label>
                  <select value={ride.seats} onChange={e => updateRide('seats', e.target.value)}>
                    {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              )}
            </>
          )}

          <div className="form-group">
            <label>
              {isPoll ? 'Question du sondage' : type === 'signalement' ? 'Description du problème' : isRide ? 'Précisions (optionnel)' : 'Message'}
            </label>
            <textarea value={content} onChange={e => setContent(e.target.value)}
              placeholder={
                isPoll ? 'Posez votre question...'
                  : type === 'signalement' ? 'Décrivez le problème rencontré...'
                  : isRide ? 'Point de rendez-vous, participation aux frais...'
                  : 'Écrivez votre message...'
              }
              rows={isRide ? 2 : 4} required={!isRide} />
          </div>

          {isPoll && (
            <div className="form-group">
              <label>Options du sondage</label>
              {pollOptions.map((opt, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input value={opt} onChange={e => updatePollOption(i, e.target.value)} placeholder={`Option ${i + 1}`}
                    style={{ flex: 1, padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13 }} />
                  {pollOptions.length > 2 && (
                    <button type="button" onClick={() => removePollOption(i)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
              {pollOptions.length < 6 && (
                <button type="button" onClick={addPollOption} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--green-sage)', fontSize: 13, cursor: 'pointer', padding: '4px 0' }}>
                  <Plus size={14} /> Ajouter une option
                </button>
              )}
            </div>
          )}

          {!isPoll && !isRide && (
            <div className="form-group">
              <label>Photo (optionnel)</label>
              <label style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: 12, border: '1px dashed var(--border)', borderRadius: 'var(--radius)',
                cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13
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
          )}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            <Send size={16} />
            {loading ? 'Publication...' : type === 'signalement' ? 'Envoyer le signalement' : 'Publier'}
          </button>
        </form>
      </div>
    </div>
  )
}
