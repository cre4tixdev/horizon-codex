import { useSyncExternalStore, type ComponentProps } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { sessionService } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
import { HRecordPicker } from '../../../shared/records/HRecordPicker'
export function ContactRecordPicker({ resource, ready, onRecordSaved, ...props }: Omit<ComponentProps<typeof HRecordPicker>, 'canCreate' | 'canInspect' | 'createLabel' | 'onSaved'> & { onRecordSaved?: (id: string) => Promise<void> }) {
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot)
  const client = useQueryClient()
  const read = session.status === 'authenticated' && hasPermission(session.user, 'contacts.read')
  const write = read && session.status === 'authenticated' && hasPermission(session.user, 'contacts.write')
  return <HRecordPicker {...props} resource={resource} recordHref={(id) => `/contacts/${resource === 'company' ? 'companies' : 'people'}/${id}`} ready={ready} canCreate={write} canInspect={read} createLabel={resource === 'company' ? 'Créer une société' : 'Créer un contact'} onSaved={async (result) => { await Promise.all([client.invalidateQueries({ queryKey: ['contacts'] }), client.invalidateQueries({ queryKey: ['crm', 'company-choices'] }), client.invalidateQueries({ queryKey: ['crm', 'person-choices'] })]); await onRecordSaved?.(result.id) }} />
}
