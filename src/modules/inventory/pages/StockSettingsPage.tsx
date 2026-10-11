import { StockValuationSettings } from '../components/StockValuation'
import '../stock-operations.css'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { HRecordTabs } from '../../../shared/ui/HRecordTabs'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Warehouse, MapPin, LockKeyhole } from 'lucide-react'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { HButton } from '../../../shared/ui/HButton'
import { HSaveButton } from '../../../shared/ui/HSaveButton'
import { HFieldLabel } from '../../../shared/ui/HFieldLabel'
import { HInput } from '../../../shared/ui/HInput'
import { HCombobox } from '../../../shared/ui/HCombobox'
import { HSettingsTable } from '../../../shared/ui/HSettingsTable'
import { HDataTable } from '../../../shared/ui/HDataTable'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { operationsService } from '../services/OperationsService'
import { stockService } from '../services/StockService'
import type { StockSettings } from '../schemas/operations'
export function StockSettingsPage() {
  const query = useQuery({ queryKey: ['inventory', 'settings'], queryFn: () => operationsService.settings(), retry: false })
  if (query.error) return <p role="alert" className="field-error">{query.error.message}<HButton onClick={() => void query.refetch()}>Réessayer</HButton></p>
  if (!query.data) return <HLoadingIndicator label="Chargement des paramètres Stock" />
  return <StockSettingsEditor key={JSON.stringify(query.data)} initial={query.data} />
}
function StockSettingsEditor({ initial }: { initial: StockSettings }) {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'valuation' ? 'valuation' : 'warehouses'
  const [values, setValues] = useState(initial), client = useQueryClient(), [place, setPlace] = useState({ warehouse: initial.warehouses[0]?.id || '', code: '', name: '' }), dirty = JSON.stringify(values) !== JSON.stringify(initial)
  const save = useMutation({ mutationFn: () => operationsService.saveSettings(values), onSuccess: async () => { await client.invalidateQueries({ queryKey: ['inventory'] }) } })
  const locationChoices = useQuery({ queryKey: ['inventory', 'operation-choices'], queryFn: () => operationsService.choices(), retry: false })
  const addLocation = useMutation({ mutationFn: () => stockService.createLocation(place.warehouse, place.code, place.name), onSuccess: async () => { setPlace({ ...place, code: '', name: '' }); await client.invalidateQueries({ queryKey: ['inventory'] }) } })
  function change(index: number, field: 'name' | 'code' | 'active', value: string | boolean) { setValues((current) => ({ ...current, warehouses: current.warehouses.map((item, i) => i === index ? { ...item, [field]: value } : item) })) }
  return <div className="settings-section stock-settings-page"><HSectionHeading title="Stock" icon={Warehouse} description="Entrepôts, emplacements et valorisation du stock." />
    <HRecordTabs label="Paramètres Stock" idPrefix="stock-settings" value={tab} items={[{ value: 'warehouses', label: 'Entrepôts et emplacements', panel: 'stock-warehouses' }, { value: 'valuation', label: 'Valorisation', panel: 'stock-valuation' }]} onChange={(value) => { const next = new URLSearchParams(params); next.set('tab', value); setParams(next, { replace: true }) }} />
    {tab === 'warehouses' ? <div id="stock-warehouses" role="tabpanel" aria-labelledby="stock-settings-warehouses" className="stock-settings-page">
    <section className="contact-panel"><HSectionHeading title="Entrepôts" icon={Warehouse} actions={<><HButton size="small" onClick={() => setValues((current) => ({ ...current, warehouses: [...current.warehouses, { id: '', name: '', code: '', active: true }] }))}><Plus size={14} />Ajouter</HButton><HSaveButton hasChanges={dirty} pending={save.isPending} onClick={() => save.mutate()} /></>} /><HSettingsTable><table className="reference-table stock-warehouse-table"><colgroup><col style={{ width: '68%' }} /><col style={{ width: '20%' }} /><col style={{ width: '12%' }} /></colgroup><thead><tr><th>Entrepôt</th><th>Code</th><th className="settings-action-cell">Actif</th></tr></thead><tbody>{values.warehouses.map((item, index) => <tr key={item.id || `new-${index}`}><td><HInput aria-label={`Nom de l’entrepôt ${index + 1}`} value={item.name} onChange={(event) => change(index, 'name', event.target.value)} /></td><td><HInput aria-label={`Code de l’entrepôt ${index + 1}`} maxLength={3} value={item.code} onChange={(event) => change(index, 'code', event.target.value.toUpperCase())} /></td><td className="settings-action-cell"><input type="checkbox" aria-label={`Entrepôt ${item.name} actif`} checked={item.active} onChange={(event) => change(index, 'active', event.target.checked)} /></td></tr>)}</tbody></table></HSettingsTable><div className="stock-settings-table-footer"><span className="contact-muted">Numérotation : <strong>MEU/IN/00001</strong> · Séquence continue par entrepôt et type.</span><span className="contact-muted">{values.warehouses.length} entrepôt(s)</span></div><label className="stock-settings-policy contact-checkbox"><input type="checkbox" checked={values.lock_inventory} onChange={(event) => setValues({ ...values, lock_inventory: event.target.checked })} /><LockKeyhole size={14} /><span>Verrouiller les mouvements pendant le comptage</span></label></section>
    <section className="contact-panel"><HSectionHeading title="Emplacements" icon={MapPin} /><div className="stock-settings-table"><HDataTable columnBorders data={locationChoices.data?.locations || []} columns={[{ header: 'Entrepôt', cell: ({ row }) => initial.warehouses.find((item) => item.id === row.original.warehouse)?.name || '—' }, { header: 'Emplacement', accessorKey: 'name' }]} /></div><form className="stock-location-create" onSubmit={(event) => { event.preventDefault(); addLocation.mutate() }}><label><HFieldLabel>Entrepôt</HFieldLabel><HCombobox label="Entrepôt du nouvel emplacement" value={place.warehouse} showCodes={false} clearable={false} options={initial.warehouses.filter((item) => item.active).map((item) => ({ value: item.id, label: item.name }))} onChange={(warehouse) => setPlace({ ...place, warehouse })} /></label><label><HFieldLabel>Code</HFieldLabel><HInput required aria-label="Code du nouvel emplacement" placeholder="Code" value={place.code} onChange={(event) => setPlace({ ...place, code: event.target.value })} /></label><label><HFieldLabel>Nom de l’emplacement</HFieldLabel><HInput required aria-label="Nom du nouvel emplacement" placeholder="Nom de l’emplacement" value={place.name} onChange={(event) => setPlace({ ...place, name: event.target.value })} /></label><HButton type="submit" disabled={addLocation.isPending || !place.code.trim() || !place.name.trim()}><Plus size={14} />Ajouter</HButton></form></section>
    {(save.error || addLocation.error || locationChoices.error) && <p role="alert" className="field-error">{save.error?.message || addLocation.error?.message || locationChoices.error?.message}</p>}
    </div> : <div id="stock-valuation" role="tabpanel" aria-labelledby="stock-settings-valuation"><StockValuationSettings /></div>}
  </div>
}
