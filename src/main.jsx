import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/global.css'
import { registerServiceWorker } from './lib/registerSW'
import GardeFou from './components/GardeFou'

// Enregistré avant le rendu, à dessein : si l'application plante au
// démarrage, le service worker doit quand même être en place pour
// pouvoir servir la page hors ligne.
registerServiceWorker()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GardeFou>
      <App />
    </GardeFou>
  </React.StrictMode>
)
