import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, Undo2 } from 'lucide-react'
import { notificationService } from '../services/NotificationService'
import { notificationTopics, type NotificationPreferences as Preferences } from '../schemas/preferences'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { HSettingsTable } from '../../../shared/ui/HSettingsTable'
import { HSaveButton } from '../../../shared/ui/HSaveButton'
import { HButton } from '../../../shared/ui/HButton'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'

export function NotificationPreferences({ userId, active }: { userId: string; active: boolean }) {
  const query = useQuery({ queryKey: ['notification-preferences', userId], queryFn: () => notificationService.preferences(), enabled: active, retry: false, staleTime: 60_000 })
  return <div hidden={!active}>
    {query.isPending ? <HLoadingIndicator label="Chargement des préférences" /> : query.error ? <p className="field-error" role="alert">{query.error.message}<HButton onClick={() => void query.refetch()}>Réessayer</HButton></p> : query.data && <PreferencesEditor baseline={query.data} userId={userId} />}
  </div>
}
function PreferencesEditor({ baseline, userId }: { baseline: Preferences; userId: string }) {
  const [items, setItems] = useState(baseline.items), client = useQueryClient(), [saved, setSaved] = useState(false)
  const dirty = JSON.stringify(items) !== JSON.stringify(baseline.items)
  const save = useMutation({ mutationFn: () => notificationService.savePreferences({ version: baseline.version, items }), onSuccess: (data) => { client.setQueryData(['notification-preferences', userId], data); setSaved(true) } })
  return <section className="contact-panel notification-preferences"><HSectionHeading title="Mes notifications" icon={Bell} description="Choisissez les alertes qui apparaissent dans la cloche Horizon." actions={<><HButton variant="ghost" size="small" disabled={!dirty || save.isPending} onClick={() => { setItems(baseline.items); save.reset() }}><Undo2 size={14} />Annuler</HButton><HSaveButton hasChanges={dirty} pending={save.isPending} onClick={() => save.mutate()} /></>} />
    <HSettingsTable><table className="reference-table"><thead><tr><th>Événement</th><th className="settings-actions-cell">Dans Horizon</th></tr></thead><tbody>{items.map((item) => <tr key={item.event_type}><td><strong>{notificationTopics[item.event_type].label}</strong><p className="contact-muted">{notificationTopics[item.event_type].description}</p></td><td className="settings-actions-cell"><input type="checkbox" aria-label={notificationTopics[item.event_type].label} checked={item.in_app} disabled={save.isPending} onChange={(event) => { const enabled = event.target.checked; setItems((values) => values.map((v) => v.event_type === item.event_type ? { ...v, in_app: enabled } : v)); setSaved(false) }} /></td></tr>)}</tbody></table></HSettingsTable>
    <p className="contact-muted">Ces choix s’appliquent aux nouvelles alertes. Les tâches, mentions et demandes restent disponibles dans leurs pages.</p>
    {saved && !dirty && <p role="status" className="account-saved">Préférences enregistrées.</p>}{save.error && <p role="alert" className="field-error">{save.error.message}</p>}
  </section>
}
