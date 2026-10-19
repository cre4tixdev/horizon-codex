import { useListPageSize } from '../../../shared/hooks/useListPageSize'
import { keepPreviousListData } from '../../../shared/search/keepPreviousListData'
import { useListTableSorting } from '../../../shared/search/useListTableSorting'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router'
import { Receipt, Plus, UserRound, UsersRound, FilePenLine, Clock3, Wallet } from 'lucide-react'
import { HPageBreadcrumb } from '../../../shared/ui/HPageBreadcrumb'
import { HPageHeader } from '../../../shared/ui/HPageHeader'
import { HButton } from '../../../shared/ui/HButton'
import { HDataTable } from '../../../shared/ui/HDataTable'
import { HListPagination } from '../../../shared/ui/HListPagination'
import { HRecordTabs } from '../../../shared/ui/HRecordTabs'
import { HSummaryCards } from '../../../shared/ui/HSummaryCards'
import { HTag } from '../../../shared/ui/HTag'
import { HEmptyState } from '../../../shared/ui/HEmptyState'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { HDialog } from '../../../shared/ui/HDialog'
import { HDialogFooter } from '../../../shared/ui/HDialogFooter'
import { HFieldLabel } from '../../../shared/ui/HFieldLabel'
import { HInput } from '../../../shared/ui/HInput'
import { GroupedResults } from '../../../shared/search/GroupedResults'
import { groupResults } from '../../../shared/search/listPresentation'
import { formatAmount } from '../../../shared/formatters/money'
import { useExpensesAccess } from '../hooks/useExpensesAccess'
import { expensesService } from '../services/ExpensesService'
import { monthLabel, states, type ExpenseReport } from '../schemas/expenses'
export function ExpensesPage() {
  const listSorting = useListTableSorting('-month', {"Mois": "month", "employee_name": "employee", "Dépenses TTC": "total", "À rembourser": "reimbursable_total", "Manager": "validator", "État": "status"})
  const access = useExpensesAccess(), [params, setParams] = useSearchParams(), client = useQueryClient(), navigate = useNavigate()
  const choices = useQuery({ queryKey: ['expenses', 'choices'], queryFn: expensesService.choices, enabled: access.canRead, retry: false })
  const area = params.get('area') === 'review' ? 'review' : 'own'
  const { onMount: listRoot, perPage, control: pageSizeControl } = useListPageSize('list', true)
  const list = useQuery({ queryKey: ['expenses', 'list', area, params.toString(), perPage], queryFn: () => expensesService.list({ ...Object.fromEntries(params), perPage: perPage }), enabled: access.canRead, retry: false, placeholderData: keepPreviousListData(['expenses', 'list', area]) })
  const [creating, setCreating] = useState(false), [newMonth, setNewMonth] = useState(''), [creationKey, setCreationKey] = useState('')
  const create = useMutation({ mutationFn: () => expensesService.save({ month: newMonth, notes: '', validator: choices.data?.default_validator || '', supplement_of: '', creation_key: creationKey }), onSuccess: async (record) => { setCreating(false); await client.invalidateQueries({ queryKey: ['expenses'] }); navigate(`/expenses/${record.id}`, { state: { expensesListQuery: params.toString() } }) } })
  if (!access.canRead) return <HEmptyState icon={Receipt} title="Notes de frais" description="Vous ne disposez pas de l’accès aux notes de frais." />
  const table = (items: ExpenseReport[]) => <HDataTable columnSettings={{ id: 'expenses.reports', defaultHidden: ['title', 'tax', 'reimbursement_date'] }} listSorting={listSorting} columnBorders data={items} columns={[{ header: 'Mois', cell: ({ row }) => <span className="h-data-table-record-name">{monthLabel(row.original.month)}{row.original.supplement_of && ' · Complément'}</span> }, { header: 'Employé', accessorKey: 'employee_name' }, { header: 'Dépenses TTC', cell: ({ row }) => formatAmount(row.original.total, 'EUR') }, { header: 'À rembourser', cell: ({ row }) => formatAmount(row.original.reimbursable_total, 'EUR') }, { header: 'Manager', cell: ({ row }) => row.original.validator_name || 'À définir' }, { header: 'État', cell: ({ row }) => <HTag tone={row.original.status === 'returned' ? 'pink' : ['validated', 'reimbursed'].includes(row.original.status) ? 'green' : row.original.status === 'submitted' ? 'amber' : 'navy'}>{states[row.original.status]}</HTag> }, { accessorKey: 'title', header: 'Objet' }, { id: 'tax', header: 'TVA', cell: ({ row }) => formatAmount(row.original.tax, 'EUR') }, { id: 'reimbursement_date', header: 'Remboursée le', cell: ({ row }) => row.original.reimbursement_date ? new Date(row.original.reimbursement_date).toLocaleDateString('fr-FR') : '—' }]} columnAlignments={{ tax: 'right', 'Dépenses TTC': 'right', 'À rembourser': 'right' }} getRowLink={(r) => ({ href: `/expenses/${r.id}`, label: `Ouvrir la note ${monthLabel(r.month)} de ${r.employee_name}`, state: { expensesListQuery: params.toString() } })} />
  return <div ref={listRoot} className="contact-directory" aria-busy={list.isFetching}><HPageBreadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'Notes de frais' }]} /><HPageHeader title="Notes de frais" description="Vos dépenses mensuelles, justificatifs et remboursements." actions={access.canWrite && choices.data?.employee && <HButton variant="primary" onClick={() => { create.reset(); setCreating(true); setCreationKey(crypto.randomUUID()); setNewMonth(new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit' }).format(new Date())) }}><Plus size={14} />Nouvelle note</HButton>} />
    {choices.data && !choices.data.employee && access.canWrite && <p className="contact-muted">Associez votre compte à un employé actif dans Utilisateurs et accès pour saisir vos notes de frais.</p>}
    <HRecordTabs label="Vue des notes de frais" idPrefix="expense-area" value={area} onChange={(value) => setParams((current) => { const next = new URLSearchParams(current); next.delete('page'); next.delete('status'); if (value === 'review') { next.set('area', value); next.set('status', 'submitted') } else next.delete('area'); return next })} items={[{ value: 'own', label: 'Mes notes', icon: UserRound, panel: 'expenses-results' }, ...(choices.data?.can_review ? [{ value: 'review', label: 'À valider', icon: UsersRound, panel: 'expenses-results' }] : [])]} />
    <section id="expenses-results" role="tabpanel" aria-labelledby={`expense-area-${area}`}><HSummaryCards label="Synthèse des notes de frais" error={undefined} onRetry={() => void list.refetch()} items={[{ key: 'draft', label: 'Brouillons', icon: FilePenLine, tone: 'blue' as const }, { key: 'submitted', label: 'À valider', icon: Clock3, tone: 'amber' as const }, { key: 'returned', label: 'À corriger', icon: Receipt, tone: 'rose' as const }, { key: 'validated', label: 'À rembourser', icon: Wallet, tone: 'green' as const }].map((s) => { const next = new URLSearchParams(params); next.set('status', s.key); next.delete('page'); return { ...s, count: list.data?.summary[s.key], detail: 'Notes du périmètre affiché', href: `/expenses?${next}` } })} />
    <HListPagination pageSize={pageSizeControl} page={list.data?.page || 1} totalPages={list.data?.totalPages} busy={list.isFetching} label="Pagination des notes de frais" onPageChange={(page) => setParams((current) => { const next = new URLSearchParams(current); next.set('page', String(page)); return next })} />
    {(list.isPending || choices.isPending) && <HLoadingIndicator label="Chargement des notes de frais" />}{(list.error || choices.error) && <p role="alert" className="field-error">{list.error?.message || choices.error?.message}<HButton onClick={() => { void list.refetch(); void choices.refetch() }}>Réessayer</HButton></p>}
    {list.data && <>{list.data.items.length ? params.get('group') && params.get('group') !== 'none' ? <GroupedResults icon={Receipt} noun="notes" groups={groupResults(list.data.items, (r) => params.get('group') === 'employee' ? { key: r.employee, label: r.employee_name } : params.get('group') === 'month' ? { key: r.month, label: monthLabel(r.month) } : { key: r.status, label: states[r.status] })} render={table} /> : table(list.data.items) : <p className="contact-muted">Aucune note correspondant aux critères.</p>}<p className="contact-muted">{list.data.totalItems} note(s)</p></>}</section>
    {creating && <HDialog open title="Nouvelle note de frais" description="Regroupez les dépenses d’un mois dans une note unique." onOpenChange={(open) => { if (!open && !create.isPending) setCreating(false) }}><form className="dialog-form" onSubmit={(e) => { e.preventDefault(); create.mutate() }}><label><HFieldLabel required>Mois</HFieldLabel><HInput type="month" required value={newMonth} onChange={(e) => setNewMonth(e.target.value)} /></label><p className="contact-muted">{choices.data?.employee_name} · {choices.data?.validators.find((v) => v.id === choices.data?.default_validator)?.label || 'Manager à choisir dans la note'}</p>{create.error && <p role="alert" className="field-error">{create.error.message}</p>}<HDialogFooter><HButton disabled={create.isPending} onClick={() => setCreating(false)}>Annuler</HButton><HButton type="submit" variant="primary" disabled={create.isPending}>Créer la note</HButton></HDialogFooter></form></HDialog>}
  </div>
}
