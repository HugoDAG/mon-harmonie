import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Directory from './pages/Directory'
import Documents from './pages/Documents'
import Bookings from './pages/Bookings'
import Profile from './pages/Profile'
import PostsByType from './pages/PostsByType'
import CalendarPage from './pages/CalendarPage'
import Rules from './pages/Rules'
import Guide from './pages/Guide'
import MaResidence from './pages/MaResidence'
import PendingApprovals from './pages/PendingApprovals'
import ScrollToTop from './components/ScrollToTop'

function PrivateRoute({ children }) {
  const { user, profile, loading, isApproved, signOut } = useAuth()
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)' }}>Chargement...</div>
  if (!user) return <Navigate to="/login" />
  if (profile && !isApproved()) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: 32, textAlign: 'center', background: 'var(--cream)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>{profile.account_status === 'rejected' ? '❌' : '⏳'}</div>
        <h1 style={{ fontSize: 20, fontWeight: 600, fontFamily: "'Cinzel', serif", color: 'var(--green-dark)', marginBottom: 8 }}>
          {profile.account_status === 'rejected' ? 'Demande refusée' : 'Compte en attente'}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-light)', lineHeight: 1.6, marginBottom: 24 }}>
          {profile.account_status === 'rejected'
            ? "Votre demande d'inscription a été refusée. Contactez l'administrateur de la résidence."
            : "Votre compte est en cours de vérification par un administrateur. Vous recevrez l'accès une fois approuvé."
          }
        </p>
        <button onClick={signOut} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '10px 20px', color: 'var(--text-medium)', cursor: 'pointer', fontSize: 13 }}>
          Se déconnecter
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
