import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'
import { inArtifact } from './lib/reminders'

// The artifact viewer already pads the page for the notch; avoid padding twice.
if (inArtifact()) document.documentElement.classList.add('in-artifact')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('./sw.js').catch(() => {})
}
