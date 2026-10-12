import { createContext, useContext, useState, useSyncExternalStore } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { CellContext, ColumnDef } from '@tanstack/react-table'
import { ChartBar, Undo2 } from 'lucide-react'
import { sessionService } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
import { HPageBreadcrumb } from '../../../shared/ui/HPageBreadcrumb'
import { HRecordPageActions } from '../../../shared/ui/HRecordPageActions'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { HSaveButton } from '../../../shared/ui/HSaveButton'
import { HButton } from '../../../shared/ui/HButton'
import { HDataTable } from '../../../shared/ui/HDataTable'
import { HInput } from '../../../shared/ui/HInput'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { fixedAnalyticService } from '../services/FixedAnalyticService'
import { fixedAnalyticInputSchema, type FixedAnalytic } from '../schemas/fixedAnalytic'
const EditorContext = createContext<{ set: (id: string, field: 'code' | 'label', value: string) => void; busy: boolean } | undefined>(undefined)
function CodeCell({ row }: CellContext<FixedAnalytic, unknown>) { const editor = useContext(EditorContext)!; return <HInput aria-label={`Code ${row.original.label}`} inputMode="numeric" maxLength={12} value={row.original.code} disabled={editor.busy} onChange={(event) => editor.set(row.original.id, 'code', event.target.value)} /> }
function LabelCell({ row }: CellContext<FixedAnalytic, unknown>) { const editor = useContext(EditorContext)!; return <HInput aria-label={`Libellé ${row.original.code}`} maxLength={160} value={row.original.label} disabled={editor.busy} onChange={(event) => editor.set(row.original.id, 'label', event.target.value)} /> }
const columns: ColumnDef<FixedAnalytic>[] = [{ header: 'Usage', size: 160, cell: ({ row }) => row.original.key === 'stock' ? 'Stock' : 'Interne' }, { header: 'Code analytique', size: 150, cell: CodeCell }, { header: 'Libellé', size: 440, cell: LabelCell }]
export function FixedAnalyticSettingsPage() {
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot), can = session.status === 'authenticated' && hasPermission(session.user, 'settings.references')
  const query = useQuery({ queryKey: ['accounting', 'fixed-accounts'], queryFn: () => fixedAnalyticService.read(), enabled: can, retry: false })
  if (!can) return <p className="contact-muted">Droits de paramétrage nécessaires.</p>
  return query.data ? <Editor key={query.data.items.map((item) => item.updated).join(':')} initial={query.data.items} /> : query.error ? <p role="alert" className="field-error">{query.error.message}<HButton onClick={() => void query.refetch()}>Réessayer</HButton></p> : <HLoadingIndicator label="Chargement des codes analytiques" />
}
function Editor({ initial }: { initial: FixedAnalytic[] }) {
  const [items, setItems] = useState(initial), client = useQueryClient(), dirty = JSON.stringify(initial) !== JSON.stringify(items)
  const mutation = useMutation({ mutationFn: () => fixedAnalyticService.save(items), onSuccess: async (saved) => { client.setQueryData(['accounting', 'fixed-accounts'], saved); await Promise.all([client.invalidateQueries({ queryKey: ['purchasing'] }), client.invalidateQueries({ queryKey: ['inventory'] })]) } })
  const valid = items.every((item) => fixedAnalyticInputSchema.safeParse(item).success) && new Set(items.map((item) => item.code)).size === items.length
  return <section className="settings-section"><HPageBreadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'Paramètres', href: '/settings' }, { label: 'Codes analytiques fixes' }]} /><HRecordPageActions><HButton variant="ghost" size="icon" aria-label="Annuler les modifications" disabled={!dirty || mutation.isPending} onClick={() => setItems(initial)}><Undo2 size={14} /></HButton><HSaveButton form="fixed-accounts-form" hasChanges={dirty} pending={mutation.isPending} disabled={!valid} /></HRecordPageActions><HSectionHeading title="Codes analytiques fixes" icon={ChartBar} description="Imputations Stock et Interne. Modifier un numéro conserve les liaisons et les documents historiques." /><form id="fixed-accounts-form" onSubmit={(event) => { event.preventDefault(); if (valid) mutation.mutate() }}><EditorContext value={{ busy: mutation.isPending, set: (id, field, value) => setItems((current) => current.map((item) => item.id === id ? { ...item, [field]: value } : item)) }}><HDataTable resizable columnBorders columns={columns} data={items} /></EditorContext></form><p className="contact-muted">Numéros uniques de 1 à 12 chiffres. Les catégories déterminent l’imputation et le traitement des achats.</p>{!valid && <p role="alert" className="field-error">Vérifiez les numéros, leur unicité et les libellés.</p>}{mutation.error && <p role="alert" className="field-error">{mutation.error.message}</p>}</section>
}
