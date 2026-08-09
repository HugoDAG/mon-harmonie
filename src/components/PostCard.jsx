import { POST_TYPE_LABELS } from '../lib/constants'
import { AlertTriangle, Megaphone, Users, BarChart3 } from 'lucide-react'

const TYPE_ICONS = {
  annonce: Megaphone,
  signalement: AlertTriangle,
  voisinage: Users,
  sondage: BarChart3
}

function getInitials(profile) {
  if (profile.co_resident) {
    const first = profile.first_name?.[0] || ''
    const coFirst = profile.co_resident.first_name?.[0] || ''
    return `${first}&${coFirst}`
  }
  const f = profile.first_name?.[0] || ''
  const l = profile.last_name?.[0] || ''
  return `${f}${l}`
}

function getDisplayName(profile) {
  const lastName = profile.last_name ? `${profile.last_name[0]}.` : ''
  if (profile.co_resident) {
    return `${profile.first_name} & ${profile.co_resident.first_name}`
  }
  return `${profile.first_name} ${lastName}`
}

const AVATAR_COLORS = {
  annonce: { bg: 'var(--blue-50)', color: 'var(--blue-600)' },
  signalement: { bg: 'var(--amber-50)', color: 'var(--amber-600)' },
  voisinage: { bg: 'var(--green-50)', color: 'var(--green-600)' },
  sondage: { bg: 'var(--purple-50)', color: 'var(--purple-500)' }
}

export default function PostCard({ post }) {
  const { profile, type, content, channel, created_at } = post
  const typeInfo = POST_TYPE_LABELS[type] || POST_TYPE_LABELS.annonce
  const Icon = TYPE_ICONS[type] || Megaphone
  const avatarStyle = AVATAR_COLORS[type] || AVATAR_COLORS.annonce
  const isSyndic = profile?.role === 'syndic'

  const timeAgo = formatTimeAgo(created_at)

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div className="avatar" style={{ background: avatarStyle.bg, color: avatarStyle.color }}>
          {isSyndic ? 'SY' : getInitials(profile)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>
              {isSyndic ? 'Syndic' : getDisplayName(profile)}
            </span>
            {!isSyndic && profile?.building && (
              <span className="building-tag">{profile.building}</span>
            )}
          </div>
          <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{timeAgo}</div>
        </div>
      </div>

      <p style={{ fontSize: 14, color: 'var(--gray-600)', lineHeight: 1.6 }}>{content}</p>

      <div style={{ marginTop: 10 }}>
        <span className="tag" style={{ background: typeInfo.bg, color: typeInfo.color }}>
          <Icon size={12} />
          {typeInfo.label}
        </span>
      </div>
    </div>
  )
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.round(diffMs / 60000)
  const diffHours = Math.round(diffMs / 3600000)
  const diffDays = Math.round(diffMs / 86400000)

  if (diffMins < 1) return "À l'instant"
  if (diffMins < 60) return `Il y a ${diffMins} min`
  if (diffHours < 24) return `Il y a ${diffHours}h`
  if (diffDays === 1) return 'Hier'
  if (diffDays < 7) return `Il y a ${diffDays} jours`
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}
