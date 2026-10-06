import type { ActivityEvent } from '../../core/activity/types/activity'

export function changeAction(item: Pick<ActivityEvent, 'body' | 'metadata'>) {
  const status = item.metadata.changes?.find((change) => change.field === 'active' && change.label === 'Statut')
  if (status?.after === 'Archivé') return 'a archivé la fiche'
  if (status?.after === 'Actif' && item.metadata.action !== 'create') return 'a réactivé la fiche'
  if (item.body === 'Fiche créée') return 'a créé la fiche'
  return 'a modifié la fiche'
}
