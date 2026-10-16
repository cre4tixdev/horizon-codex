import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { Mail } from 'lucide-react'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { HButton } from '../../../shared/ui/HButton'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { messagingService } from '../services/MessagingService'

export function MailOAuthCallbackPage() {
  const [callback] = useState(() => {
    const params = new URLSearchParams(window.location.search), state = params.get('state'), code = params.get('code'), expected = sessionStorage.getItem('horizon-mail-oauth-state')
    return state && expected && state === expected && code && !params.has('error') ? { state, code } : null
  })
  const started = useRef(false), [result, setResult] = useState<'pending' | 'connected' | 'failed'>(callback ? 'pending' : 'failed'), [error, setError] = useState('Connexion annulée, expirée ou ouverte dans un autre onglet. Recommencez depuis les paramètres.')
  useEffect(() => {
    if (started.current) return
    started.current = true
    sessionStorage.removeItem('horizon-mail-oauth-state')
    window.history.replaceState(window.history.state, '', '/messaging/oauth/callback')
    if (!callback) return
    void messagingService.completeConnection(callback.state, callback.code).then(() => setResult('connected')).catch((e: unknown) => { setError(e instanceof Error ? e.message : 'Connexion Microsoft indisponible.'); setResult('failed') })
  }, [callback])
  return <><HSectionHeading title="Connexion Microsoft" icon={Mail} />{result === 'pending' ? <HLoadingIndicator label="Vérification de la boîte Microsoft" /> : <><p role={result === 'failed' ? 'alert' : 'status'} className={result === 'failed' ? 'field-error' : 'contact-muted'}>{result === 'connected' ? 'La boîte Microsoft est connectée. Vous pouvez préparer vos envois Horizon.' : error}</p><HButton asChild><Link to="/settings/emails?tab=mailboxes">Revenir aux expéditeurs</Link></HButton></>}</>
}
