import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import { HLoadingIndicator } from './shared/ui/HLoadingIndicator'
import { sessionService } from './core/auth/services/session'
import './core/config/environment'
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-700.css'
import '@fontsource/montserrat/latin-600.css'
import './shared/styles.css'

const root = document.getElementById('root')

if (!root) {
  throw new Error("Le point de montage de l'application Horizon est absent.")
}

const appRoot = createRoot(root)
appRoot.render(<HLoadingIndicator label="Vérification de votre session…" />)

async function start() {
  await sessionService.restore()
  appRoot.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
void start()
