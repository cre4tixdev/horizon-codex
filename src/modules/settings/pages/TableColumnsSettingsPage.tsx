import { sessionService } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
import { HEmptyState } from '../../../shared/ui/HEmptyState'
import { useState, useSyncExternalStore } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router'
import { Columns3 } from 'lucide-react'
import { tableColumnCatalog, type TableColumnPolicy } from '../../../core/preferences/tableColumnPolicies'
import { tableColumnPoliciesService } from '../../../core/preferences/TableColumnPoliciesService'
import { useTableColumnPolicies, tableColumnPoliciesQueryKey } from '../../../shared/ui/useTableColumnPolicies'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { HSettingsTable } from '../../../shared/ui/HSettingsTable'
import { HSaveButton } from '../../../shared/ui/HSaveButton'
import { HButton } from '../../../shared/ui/HButton'
import { HCombobox } from '../../../shared/ui/HCombobox'
import { HFieldLabel } from '../../../shared/ui/HFieldLabel'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'

export function TableColumnsSettingsPage() {
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot)
  const allowed = session.status === 'authenticated' && ['admin', 'superuser'].includes(session.user.erpProfile || '') && hasPermission(session.user, 'settings.references')
  const query = useTableColumnPolicies(allowed), client = useQueryClient(), [params, setParams] = useSearchParams()
  const table = tableColumnCatalog.find((item) => item.key === params.get('table')) || tableColumnCatalog[0]!
  const [drafts, setDrafts] = useState<Record<string, TableColumnPolicy>>({})
  const saved = query.data?.items.find((item) => item.key === table.key)
  const record = drafts[table.key] || saved
  const excluded = record?.excluded || []
  const changed = Boolean(saved && record && JSON.stringify([...saved.excluded].sort()) !== JSON.stringify([...excluded].sort()))
  const save = useMutation({ mutationFn: (input: TableColumnPolicy) => tableColumnPoliciesService.save(input), onSuccess: async (result) => {
    client.setQueriesData<{ items: TableColumnPolicy[] }>({ queryKey: tableColumnPoliciesQueryKey }, (current) => current ? { items: current.items.map((item) => item.key === result.key ? result : item) } : current)
    setDrafts((current) => { const next = { ...current }; delete next[result.key]; return next })
    await client.invalidateQueries({ queryKey: tableColumnPoliciesQueryKey })
  } })
  const change = (next: string[]) => { if (record) setDrafts((current) => ({ ...current, [table.key]: { ...record, excluded: next } })) }
  if (!allowed) return <HEmptyState icon={Columns3} title="Colonnes des tableaux" description="Ce réglage commun est réservé aux administrateurs habilités." />
  return <section>
    <HSectionHeading icon={Columns3} title="Colonnes des tableaux" description="Choisissez les colonnes proposées à tous. Chaque utilisateur conserve ensuite son affichage et son ordre." actions={<HSaveButton type="button" hasChanges={changed} pending={save.isPending} onClick={() => { if (record) save.mutate(record) }} />} />
    <div className="contact-form-grid"><label><HFieldLabel>Tableau à configurer</HFieldLabel><HCombobox label="Tableau à configurer" value={table.key} required clearable={false} showCodes={false} disabled={save.isPending} options={tableColumnCatalog.map((item) => ({ value: item.key, label: `${item.group} · ${item.label}`, displayLabel: item.label }))} onChange={(value) => { save.reset(); const next = new URLSearchParams(params); next.set('table', value); setParams(next, { replace: true }) }} /></label></div>
    {query.isPending && <HLoadingIndicator label="Chargement des colonnes proposées" />}
    {query.error && <p role="alert" className="field-error">{query.error.message} <HButton size="small" onClick={() => void query.refetch()}>Réessayer</HButton></p>}
    {query.data && record && <>
      <div className="h-record-lines"><HSectionHeading title={table.label} description={`${table.columns.length - excluded.length} colonnes proposées sur ${table.columns.length}. Les colonnes obligatoires restent disponibles et déplaçables.`} actions={<HButton size="small" disabled={save.isPending || !excluded.length} onClick={() => change([])}>Tout proposer</HButton>} /></div>
      <HSettingsTable count={table.columns.length} noun="colonne"><table className="reference-table"><thead><tr><th>Colonne</th><th>Disponibilité</th><th className="settings-state-cell">Proposer</th></tr></thead><tbody>{table.columns.map((column) => <tr key={column.id}><td>{column.label}</td><td>{column.required ? 'Obligatoire' : excluded.includes(column.id) ? 'Non proposée' : 'Au choix de l’utilisateur'}</td><td className="settings-state-cell"><label className="h-choice"><input type="checkbox" aria-label={`Proposer ${column.label}`} checked={!excluded.includes(column.id)} disabled={column.required || save.isPending} onChange={(event) => change(event.target.checked ? excluded.filter((id) => id !== column.id) : [...excluded, column.id])} /></label></td></tr>)}</tbody></table></HSettingsTable>
      <p className="contact-muted">Retirer une colonne la masque aussi dans les affichages déjà personnalisés. La proposer à nouveau retrouve les choix personnels conservés. Ces réglages ne modifient pas les droits d’accès aux données.</p>
      {Object.keys(drafts).some((key) => key !== table.key) && <p role="status" className="contact-muted">Des modifications restent à enregistrer sur d’autres tableaux.</p>}
    </>}
    {save.error && <p role="alert" className="field-error">{save.error.message}<HButton size="small" onClick={() => { setDrafts((current) => { const next = { ...current }; delete next[table.key]; return next }); save.reset(); void query.refetch() }}>Recharger ce tableau</HButton></p>}
  </section>
}
