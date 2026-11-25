import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Directory from './pages/Directory'
import Documents from './pages/Documents'
import DocumentSummary from './pages/DocumentSummary'
import MesDocuments from './pages/MesDocuments'
import Bookings from './pages/Bookings'
import Profile from './pages/Profile'
import PostsByType from './pages/PostsByType'
import CalendarPage from './pages/CalendarPage'
import Rules from './pages/Rules'
import Guide from './pages/Guide'
import MaResidence from './pages/MaResidence'
import PendingApprovals from './pages/PendingApprovals'
import ScrollToTop from './components/ScrollToTop'

/* Écran de chargement honnête.
 *
 * Depuis que l'application s'ouvre hors ligne grâce au service worker,
 * un résident sans réseau voyait « Chargement... » indéfiniment. On lui
 * dit maintenant ce qui se passe, qu'il soit déconnecté ou que le
 * serveur ne réponde pas.
 */
function EcranChargement({ immediat = false }) {
  const [horsLigne, setHorsLigne] = useState(() => !navigator.onLine)
  const [tropLong, setTropLong] = useState(immediat)

  useEffect(() => {
    const enLigne = () => setHorsLigne(false)
    const deconnecte = () => setHorsLigne(true)
    window.addEventListener('online', enLigne)
    window.addEventListener('offline', deconnecte)
    const minuteur = setTimeout(() => setTropLong(true), 12000)
    return () => {
      window.removeEventListener('online', enLigne)
      window.removeEventListener('offline', deconnecte)
      clearTimeout(minuteur)
    }
  }, [])

  if (!horsLigne && !tropLong) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)' }}>
        Chargement...
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100vh', padding: 32, textAlign: 'center', background: 'var(--cream)'
    }}>
      <div style={{ fontSize: 42, marginBottom: 14 }} aria-hidden="true">🌿</div>
      <h1 style={{ fontSize: 19, fontWeight: 600, fontFamily: "'Cinzel', serif", color: 'var(--green-dark)', marginBottom: 10 }}>
        {horsLigne ? 'Pas de connexion' : 'Le service ne répond pas'}
      </h1>
      <p style={{ fontSize: 14, color: 'var(--text-light)', lineHeight: 1.6, marginBottom: 22, maxWidth: 320 }}>
        {horsLigne
          ? "Mon Harmonie a besoin d'internet pour afficher la résidence. Vos données sont intactes, tout reviendra avec la connexion."
          : "L'application n'arrive pas à joindre le serveur. Réessayez dans un instant ; si cela dure, prévenez le conseil syndical."}
      </p>
      <button onClick={() => window.location.reload()} style={{
        background: 'var(--green-dark)', color: 'var(--cream)', border: 'none',
        borderRadius: 'var(--radius)', padding: '11px 26px', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit'
      }}>
        Réessayer
      </button>
    </div>
  )
}

function PrivateRoute({ children }) {
  const { user, profile, loading, isApproved, signOut } = useAuth()
  if (loading) return <EcranChargement />
  if (!user) return <Navigate to="/login" />
  // Connecté mais profil introuvable : c'est presque toujours le réseau.
  // Afficher l'accueil sans profil ne donnerait qu'une page vide et
  // muette, alors autant dire ce qui se passe.
  if (!profile) return <EcranChargement immediat />
  if (profile && !isApproved()) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: 32, textAlign: 'center', background: 'var(--cream)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>{profile.account_status === 'rejected' ? '❌' : '⏳'}</div>
        <h1 style={{ fontSize: 20, fontWeight: 600, fontFamily: "'Cinzel', serif", color: 'var(--green-dark)', marginBottom: 8 }}>
          {profile.account_status === 'rejected' ? 'Demande refusee' : 'Compte en attente'}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-light)', lineHeight: 1.6, marginBottom: 24 }}>
          {profile.account_status === 'rejected'
            ? "Votre demande d'inscription a ete refusee. Contactez l'administrateur de la residence."
            : "Votre compte est en cours de verification par un administrateur. Vous recevrez l'acces une fois approuve."
          }
        </p>
        <button onClick={signOut} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '10px 20px', color: 'var(--text-medium)', cursor: 'pointer', fontSize: 13 }}>
          Se deconnecter
        </button>
      </div>
    )
  }
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/" /> : children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="/posts/:type" element={<PrivateRoute><PostsByType /></PrivateRoute>} />
          <Route path="/directory" element={<PrivateRoute><Directory /></PrivateRoute>} />
          <Route path="/documents" element={<PrivateRoute><Documents /></PrivateRoute>} />
          <Route path="/document/:id/summary" element={<PrivateRoute><DocumentSummary /></PrivateRoute>} />
          <Route path="/mes-documents" element={<PrivateRoute><MesDocuments /></PrivateRoute>} />
          <Route path="/bookings" element={<PrivateRoute><Bookings /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/calendar" element={<PrivateRoute><CalendarPage /></PrivateRoute>} />
          <Route path="/rules" element={<PrivateRoute><Rules /></PrivateRoute>} />
          <Route path="/guide" element={<PrivateRoute><Guide /></PrivateRoute>} />
          <Route path="/ma-residence" element={<PrivateRoute><MaResidence /></PrivateRoute>} />
          <Route path="/pending" element={<PrivateRoute><PendingApprovals /></PrivateRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
