import { useSyncExternalStore } from 'react'
import { sessionService } from '../../core/auth/services/session'
import { HPageHeader } from '../../shared/ui/HPageHeader'

export function AccountPage() {
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot)
  return <div>
    <HPageHeader title="Mon compte" description="Les informations de votre compte Horizon." />
    {session.status === 'authenticated' ? <section className="account-details" aria-label="Informations du compte">
      <h2>Profil</h2>
      <dl><div><dt>Nom</dt><dd>{session.user.name || 'Non renseigné'}</dd></div><div><dt>Adresse e-mail</dt><dd>{session.user.email}</dd></div><div><dt>Rôle</dt><dd>{session.user.role.label}</dd></div></dl>
      <p>Pour modifier ces informations ou vos accès, contactez votre administrateur.</p>
    </section> : <p>Connectez-vous pour consulter votre compte.</p>}
  </div>
}
