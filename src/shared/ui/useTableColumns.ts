import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { useIsMutating, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sessionService } from '../../core/auth/services/session'
import { tablePreferencesService } from '../../core/preferences/TablePreferencesService'
import { tablePreferenceSchema, type TablePreferenceRecord } from '../../core/preferences/tablePreferences'
import { defaultTableColumns, type TableColumnsPreference } from './tableColumns'

const attempted = new Set<string>()
function legacy(key: string): { preference: TableColumnsPreference | undefined; error: string } {
  if (!key) return { preference: undefined, error: '' }
  try {
    const value = localStorage.getItem(key)
    return { preference: value ? tablePreferenceSchema.parse(JSON.parse(value)) : undefined, error: '' }
  } catch {
    console.warn('[table-columns] Ancienne préférence indisponible.')
    return { preference: undefined, error: 'Ancien affichage local invalide. Les colonnes par défaut sont utilisées.' }
  }
}
function forgetLegacy(key: string) {
  try { localStorage.removeItem(key) }
  catch { console.warn('[table-columns] Ancienne préférence locale non supprimée ; la préférence serveur reste prioritaire.') }
}
export function useTableColumns(id?: string) {
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot)
  const user = session.status === 'authenticated' ? session.user.id : ''
  const enabled = Boolean(id && user), key = enabled ? `horizon.table-columns.v1:${user}:${id}` : ''
  const previous = useMemo(() => legacy(key), [key]), client = useQueryClient()
  const [draft, setDraft] = useState<{ key: string; preference: TableColumnsPreference }>()
  const queryKey = ['table-columns', user, id || '']
  const query = useQuery({ queryKey, queryFn: async () => { const record = await tablePreferencesService.read(id!); return record.revision === 0 && previous.preference ? { ...record, preference: previous.preference } : record }, enabled, staleTime: 0, retry: false, refetchOnMount: () => client.isMutating({ mutationKey: ['table-columns', user, id || ''] }) === 0, refetchOnWindowFocus: () => client.isMutating({ mutationKey: ['table-columns', user, id || ''] }) === 0 })
  const active = useIsMutating({ mutationKey: queryKey }) > 0
  const save = useMutation({ mutationKey: queryKey, scope: { id: queryKey.join(':') }, mutationFn: (input: TablePreferenceRecord) => {
    if (!id) throw new Error('Rechargez les colonnes avant de les modifier.')
    return tablePreferencesService.save(id, input)
  }, onMutate: (input) => {
    const before = client.getQueryData<TablePreferenceRecord>(queryKey)
    void client.cancelQueries({ queryKey })
    client.setQueryData(queryKey, input)
    return before
  }, onError: (_error, _input, before) => { attempted.delete(key); if (before) client.setQueryData(queryKey, before); setDraft((current) => current?.key === key ? undefined : current) },
  onSuccess: (record) => { client.setQueryData(queryKey, record); forgetLegacy(key); setDraft((current) => current?.key === key ? undefined : current) } })
  useEffect(() => {
    if (!enabled || !query.data || save.isError) return
    if (query.data.revision > 0) { forgetLegacy(key); return }
    if (!previous.preference || attempted.has(key) || client.isMutating({ mutationKey: ['table-columns', user, id || ''] })) return
    attempted.add(key)
    save.mutate({ revision: query.data.revision, preference: previous.preference })
  }, [enabled, query.data, query.dataUpdatedAt, key, previous.preference, client, user, id, save.mutate, save.isError])
  const busy = enabled && (query.isPending || active)
  const blocked = busy || query.isError || save.isError
  return {
    preference: draft?.key === key ? draft.preference : query.data?.preference || previous.preference || defaultTableColumns,
    busy,
    error: save.error?.message || query.error?.message || (query.data?.revision === 0 ? previous.error : ''),
    change: (preference: TableColumnsPreference) => { const record = client.getQueryData<TablePreferenceRecord>(queryKey); if (enabled && !blocked && record && client.isMutating({ mutationKey: queryKey }) === 0) { setDraft({ key, preference }); save.mutate({ revision: record.revision, preference }) } },
    canEdit: enabled && !blocked,
    retry: () => { save.reset(); attempted.delete(key); void query.refetch() },
  }
}
