import { useState, useSyncExternalStore } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PenLine, Plus } from 'lucide-react'
import { sessionService } from '../../../core/auth/services/session'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { HSettingsTable } from '../../../shared/ui/HSettingsTable'
import { HButton } from '../../../shared/ui/HButton'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { SettingsEditButton } from '../../settings/components/SettingsEditButton'
import { useMessagingAccess } from '../hooks/useMessagingAccess'
import { messagingService } from '../services/MessagingService'
import type { MailSignature } from '../schemas/mail'
import { MailSignatureDialog } from './MailSignatureDialog'

export function PersonalSignaturePreferences({ active }: { active: boolean }) {
  const access = useMessagingAccess(), session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot), client = useQueryClient()
  const userId = session.status === 'authenticated' ? session.user.id : ''
  const query = useQuery({ queryKey: ['messaging', 'personal-signatures', userId], queryFn: messagingService.personalSignatures, enabled: active && access.canRead, retry: false })
  const [editor, setEditor] = useState<MailSignature | 'new'>()
  if (!access.canRead) return null
  return <section className="contact-panel"><HSectionHeading title="Mes signatures e-mail" icon={PenLine} description="Vos signatures personnelles. La signature société reste gérée dans Paramètres." actions={access.canWrite && <HButton onClick={() => setEditor('new')}><Plus size={14} />Nouvelle signature</HButton>} />
    {query.isPending && <HLoadingIndicator label="Chargement des signatures" />}{query.error && <p role="alert" className="field-error">{query.error.message}<HButton onClick={() => void query.refetch()}>Réessayer</HButton></p>}
    {query.data && <HSettingsTable><table className="reference-table"><thead><tr><th>Signature</th><th className="settings-state-cell">Par défaut</th><th className="settings-state-cell">Active</th><th className="settings-actions-cell">Actions</th></tr></thead><tbody>{query.data.items.map((signature) => <tr key={signature.id}><td>{signature.name}</td><td className="settings-state-cell">{signature.is_default ? 'Oui' : 'Non'}</td><td className="settings-state-cell">{signature.active ? 'Oui' : 'Non'}</td><td className="settings-actions-cell">{access.canWrite && <SettingsEditButton label={signature.name} onClick={() => setEditor(signature)} />}</td></tr>)}{!query.data.items.length && <tr><td colSpan={4}>Aucune signature personnelle. La signature société reste disponible lors de l’envoi.</td></tr>}</tbody></table></HSettingsTable>}
    {editor && query.data && <MailSignatureDialog record={editor === 'new' ? undefined : editor} variables={query.data.variables} onClose={() => setEditor(undefined)} onSave={(input) => messagingService.savePersonalSignature(input, editor === 'new' ? undefined : editor.id, editor === 'new' ? undefined : editor.updated)} onSaved={() => { setEditor(undefined); void client.invalidateQueries({ queryKey: ['messaging'] }) }} />}
  </section>
}
