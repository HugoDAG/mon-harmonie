import { Component } from 'react'

/* Dernier rempart avant la page blanche.
 *
 * Sans lui, la moindre erreur dans un composant démonte toute
 * l'application : le résident voit un écran vide, sans message ni
 * bouton, et n'a aucun moyen de comprendre ni de s'en sortir.
 *
 * C'est devenu plus gênant depuis l'arrivée du service worker : une
 * version qui plante peut être servie depuis le cache plusieurs
 * ouvertures de suite. D'où le bouton qui vide le cache avant de
 * recharger.
 *
 * Doit rester une classe : React n'offre pas d'équivalent en
 * composant de fonction.
 */
export default class GardeFou extends Component {
  constructor(props) {
    super(props)
    this.state = { erreur: null }
  }

  static getDerivedStateFromError(erreur) {
    return { erreur }
  }

  componentDidCatch(erreur, infos) {
    // Visible dans la console du navigateur, pour pouvoir diagnostiquer
    // si un résident nous signale le problème.
    console.error('Plantage de Mon Harmonie :', erreur, infos?.componentStack)
  }

  async rechargerPropre() {
    try {
      if ('caches' in window) {
        const noms = await caches.keys()
        await Promise.all(noms.map(n => caches.delete(n)))
      }
    } catch {
      // Tant pis, on recharge quand même.
    }
    window.location.reload()
  }

  render() {
    if (!this.state.erreur) return this.props.children

    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', padding: 32, textAlign: 'center', background: 'var(--cream)'
      }}>
        <div style={{ fontSize: 42, marginBottom: 14 }} aria-hidden="true">🌿</div>
        <h1 style={{
          fontSize: 19, fontWeight: 600, fontFamily: "'Cinzel', serif",
          color: 'var(--green-dark)', marginBottom: 10
        }}>
          Quelque chose s'est mal passé
        </h1>
        <p style={{
          fontSize: 14, color: 'var(--text-light)', lineHeight: 1.6,
          marginBottom: 22, maxWidth: 330
        }}>
          Mon Harmonie a rencontré une erreur inattendue. Vos données ne sont pas
          touchées. Rechargez la page&nbsp;; si le problème revient, prévenez le
          conseil syndical.
        </p>
        <button onClick={() => this.rechargerPropre()} style={{
          background: 'var(--green-dark)', color: 'var(--cream)', border: 'none',
          borderRadius: 'var(--radius)', padding: '11px 26px',
          cursor: 'pointer', fontSize: 14, fontFamily: 'inherit'
        }}>
          Recharger
        </button>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 16, maxWidth: 330 }}>
          Le rechargement vide aussi la version gardée en mémoire par votre téléphone.
        </p>
      </div>
    )
  }
}
