import { createRoot } from 'react-dom/client'
import './styles.css'
import Root from './Root.jsx'

createRoot(document.getElementById('root')).render(<Root />)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
