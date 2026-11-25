import { useState, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'
import { Bell, BellOff } from 'lucide-react'
import {
  SUJETS_NOTIF, pushDisponible, permissionNotif, appareilAbonne,
  activerNotifications, desactiverNotifications, enregistrerPreferences
} from '../lib/push'

/* Réglages des notifications, dans « Mes informations ».
 *
 * Deux niveaux volontairement distincts :
 *   - l'interrupteur principal concerne CET appareil ;
 *   - les sujets concernent le compte, donc tous les appareils.
 * Mélanger les deux est la meilleure façon de faire croire à quelqu'un
 * qu'il a coupé les notifications partout alors qu'il les reçoit encore
 * sur sa tablette.
 */

const PREFS_DEFAUT = {
  signalement: true, annonce: true, evenement: true,
  sondage: true, voisinage: true, commentaire: true, reservation: false
}

export default function ReglagesNotifications() {
  const { user, profile, fetchProfile } = useAuth()
  const [abonne, setAbonne] = useState(false)
  const [prefs, setPrefs] = useState(PREFS_DEFAUT)
  const [occupe, setOccupe] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    appareilAbonne().then(setAbonne)
  }, [])

  useEffect(() => {
    if (profile?.notif_prefs) setPrefs({ ...PREFS_DEFAUT, ...profile.notif_prefs })
  }, [profile])

  if (!pushDisponible()) return null

  const refuse = permissionNotif() === 'denied'

  async function basculerAbonnement() {
    setOccupe(true)
    setMessage(null)
    try {
      if (abonne) {
        await desactiverNotifications()
        setAbonne(false)
        setMessage({ ton: 'info', texte: 'Notifications désactivées sur cet appareil.' })
      } else {
        await activerNotifications(user.id)
        setAbonne(true)
        setMessage({ ton: 'ok', texte: 'Notifications activées sur cet appareil.' })
      }
    } catch (e) {
      setMessage({ ton: 'erreur', texte: e.message })
    }
    setOccupe(false)
  }

  async function basculerSujet(cle) {
    const suivant = { ...prefs, [cle]: !prefs[cle] }
    setPrefs(suivant)                       // réponse immédiate
    try {
      await enregistrerPreferences(user.id, suivant)
      fetchProfile?.(user.id)
    } catch (e) {
      setPrefs(prefs)                       // on remet si la base refuse
      setMessage({ ton: 'erreur', texte: e.message })
    }
  }

  const couleurMessage = {
    ok: 'var(--green-600)', info: 'var(--text-light)', erreur: 'var(--red-500)'
  }

  return (
    <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--border-light)' }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-medium)', marginBottom: 4 }}>
        Notifications
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>
        Être prévenu sur cet appareil quand il se passe quelque chose dans la résidence.
      </div>

      {refuse ? (
        <div style={{
          fontSize: 12, color: 'var(--text-medium)', background: 'var(--amber-50)',
          border: '1px solid var(--border-light)', borderRadius: 'var(--radius)',
          padding: '10px 12px', lineHeight: 1.5
        }}>
          Les notifications sont bloquées pour Mon Harmonie dans les réglages de votre
          navigateur. Vous devez les réautoriser depuis ces réglages : l'application ne
          peut pas le faire à votre place.
        </div>
      ) : (
        <button onClick={basculerAbonnement} disabled={occupe} style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
          padding: '12px 14px', borderRadius: 'var(--radius)',
          border: `1px solid ${abonne ? 'var(--green-sage)' : 'var(--border)'}`,
          background: abonne ? 'var(--green-sage-10)' : 'var(--white)',
          cursor: occupe ? 'default' : 'pointer', textAlign: 'left', fontFamily: 'inherit'
        }}>
          {abonne
            ? <Bell size={17} color="var(--green-dark)" />
            : <BellOff size={17} color="var(--text-muted)" />}
          <span style={{ flex: 1, fontSize: 13, color: 'var(--text-dark)' }}>
            {occupe ? 'Un instant...' : abonne
              ? 'Activées sur cet appareil'
              : 'Activer sur cet appareil'}
          </span>
        </button>
      )}

      {message && (
        <div style={{ fontSize: 11, marginTop: 8, lineHeight: 1.5, color: couleurMessage[message.ton] }}>
          {message.texte}
        </div>
      )}

      {abonne && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-medium)', marginBottom: 2 }}>
            Me prévenir pour
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
            Ces choix valent pour tous vos appareils.
          </div>

          {SUJETS_NOTIF.map(sujet => (
            <label key={sujet.cle} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 0', borderBottom: '1px solid var(--border-light)', cursor: 'pointer'
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: 'var(--text-dark)' }}>{sujet.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sujet.aide}</div>
              </div>
              <input
                type="checkbox"
                checked={!!prefs[sujet.cle]}
                onChange={() => basculerSujet(sujet.cle)}
                style={{ width: 20, height: 20, accentColor: 'var(--green-dark)', flexShrink: 0, cursor: 'pointer' }}
              />
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
