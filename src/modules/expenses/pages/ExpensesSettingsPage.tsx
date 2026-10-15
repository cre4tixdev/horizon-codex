import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router'
import { HRecordTabs } from '../../../shared/ui/HRecordTabs'
import { ExpenseVehiclesPanel } from '../components/ExpenseVehiclesPanel'
import { Plus, Receipt, Car } from 'lucide-react'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { HButton } from '../../../shared/ui/HButton'
import { HSaveButton } from '../../../shared/ui/HSaveButton'
import { HSettingsTable } from '../../../shared/ui/HSettingsTable'
import { HDialog } from '../../../shared/ui/HDialog'
import { HDialogFooter } from '../../../shared/ui/HDialogFooter'
import { HInput } from '../../../shared/ui/HInput'
import { HFieldLabel } from '../../../shared/ui/HFieldLabel'
import { HCombobox } from '../../../shared/ui/HCombobox'
import { SettingsEditButton } from '../../settings/components/SettingsEditButton'
import { expensesService } from '../services/ExpensesService'
import { categoryModes, type ExpenseCategory } from '../schemas/expenses'
export function ExpensesSettingsPage() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'vehicles' ? 'vehicles' : 'categories'
  return <><HRecordTabs label="Paramètres Notes de frais" idPrefix="expenses-settings-tab" value={tab} onChange={(value) => setParams((previous) => { const next = new URLSearchParams(previous); next.set('tab', value); return next }, { replace: true })} items={[{ value: 'categories', label: 'Catégories', icon: Receipt, panel: 'expenses-settings-categories' }, { value: 'vehicles', label: 'Véhicules', icon: Car, panel: 'expenses-settings-vehicles' }]} /><section className="contact-panel" role="tabpanel" id={`expenses-settings-${tab}`} aria-labelledby={`expenses-settings-tab-${tab}`}>{tab === 'vehicles' ? <ExpenseVehiclesPanel /> : <CategorySettings />}</section></>
}
function CategorySettings() {
  const query = useQuery({ queryKey: ['expenses', 'categories'], queryFn: expensesService.categories, retry: false }), [editor, setEditor] = useState<ExpenseCategory | 'new'>()
  return <><HSectionHeading title="Catégories de frais" icon={Receipt} description="Catégories et champs complémentaires des dépenses." actions={<HButton size="small" onClick={() => setEditor('new')}><Plus size={14} />Ajouter une catégorie</HButton>} />{query.error && <p role="alert" className="field-error">{query.error.message}<HButton onClick={() => void query.refetch()}>Réessayer</HButton></p>}{query.isPending && <p role="status">Chargement…</p>}{query.data && <HSettingsTable count={query.data.length} noun="catégorie"><table className="reference-table"><thead><tr><th>Code</th><th>Catégorie</th><th>Champs complémentaires</th><th>Ordre</th><th>Active</th><th /></tr></thead><tbody>{query.data.map((c) => <tr key={c.id}><td>{c.code}</td><td>{c.label}</td><td>{categoryModes[c.mode]}</td><td>{c.sort_order}</td><td>{c.active ? 'Oui' : 'Non'}</td><td className="reference-table-actions"><SettingsEditButton label={`Modifier ${c.label}`} onClick={() => setEditor(c)} /></td></tr>)}</tbody></table></HSettingsTable>}{editor && <CategoryEditor key={editor === 'new' ? 'new' : editor.id} record={editor === 'new' ? undefined : editor} onClose={() => setEditor(undefined)} />}</>
}
function CategoryEditor({ record, onClose }: { record?: ExpenseCategory | undefined; onClose: () => void }) {
  const client = useQueryClient(), [values, setValues] = useState<Omit<ExpenseCategory, 'id' | 'updated'>>(record || { code: '', label: '', mode: 'general', sort_order: 0, active: true })
  const save = useMutation({ mutationFn: () => expensesService.category(values, record), onSuccess: async () => { await client.invalidateQueries({ queryKey: ['expenses'] }); onClose() } })
  const changed = !record || ['code', 'label', 'mode', 'sort_order', 'active'].some((k) => values[k as keyof typeof values] !== record[k as keyof ExpenseCategory])
  return <HDialog open title={record ? 'Modifier la catégorie' : 'Nouvelle catégorie de frais'} description="Le comportement choisit les champs complémentaires demandés." onOpenChange={(open) => { if (!open && !save.isPending) onClose() }}><form id="expense-category" className="dialog-form" onSubmit={(e) => { e.preventDefault(); save.mutate() }}><HSectionHeading title="Catégorie" icon={Receipt} actions={<HSaveButton form="expense-category" hasChanges={changed} pending={save.isPending} />} /><label><HFieldLabel required>Code</HFieldLabel><HInput required maxLength={35} value={values.code} onChange={(e) => setValues({ ...values, code: e.target.value.toUpperCase() })} /></label><label><HFieldLabel required>Libellé</HFieldLabel><HInput required maxLength={120} value={values.label} onChange={(e) => setValues({ ...values, label: e.target.value })} /></label><label><HFieldLabel>Champs complémentaires</HFieldLabel><HCombobox showCodes={false} label="Comportement de la catégorie" clearable={false} value={values.mode} options={Object.entries(categoryModes).map(([value, label]) => ({ value, label }))} onChange={(v) => setValues({ ...values, mode: v as ExpenseCategory['mode'] })} /></label><label><HFieldLabel>Ordre</HFieldLabel><HInput type="number" min="0" value={values.sort_order} onChange={(e) => setValues({ ...values, sort_order: Number(e.target.value) })} /></label><label><input type="checkbox" checked={values.active} onChange={(e) => setValues({ ...values, active: e.target.checked })} /> Active</label>{save.error && <p role="alert" className="field-error">{save.error.message}</p>}<HDialogFooter><HButton disabled={save.isPending} onClick={onClose}>Fermer</HButton></HDialogFooter></form></HDialog>
}
