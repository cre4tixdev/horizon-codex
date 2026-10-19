import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Receipt, Wallet, CircleAlert, FileCheck } from 'lucide-react'
import { HButton } from '../../../shared/ui/HButton'
import { HInput } from '../../../shared/ui/HInput'
import { HSummaryCards } from '../../../shared/ui/HSummaryCards'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { HPeriodMatrix, HPeriodCell } from '../../../shared/ui/HPeriodMatrix'
import type { ListPageSizeControl } from '../../../shared/hooks/useListPageSize'
import { HListPagination } from '../../../shared/ui/HListPagination'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { HEmptyState } from '../../../shared/ui/HEmptyState'
import { HTag } from '../../../shared/ui/HTag'
import { HDialog } from '../../../shared/ui/HDialog'
import { HDialogFooter } from '../../../shared/ui/HDialogFooter'
import { HDataTable } from '../../../shared/ui/HDataTable'
import { GroupedResults } from '../../../shared/search/GroupedResults'
import { groupResults } from '../../../shared/search/listPresentation'
import { keepPreviousListData } from '../../../shared/search/keepPreviousListData'
import { useListTableSorting } from '../../../shared/search/useListTableSorting'
import { formatAmount } from '../../../shared/formatters/money'
import { expensesService } from '../services/ExpensesService'
import { expensePeriod, monthLabel, overviewStates, states, type ExpenseOverviewCell, type ExpenseOverviewRow } from '../schemas/expenses'
import '../expenses.css'

const tone = (status: string) => status === 'returned' ? 'pink' : ['validated', 'reimbursed'].includes(status) ? 'green' : status === 'submitted' ? 'amber' : 'navy'
const currentMonth = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit' }).format(new Date())
export function ExpenseOverview({ perPage, pageSize }: { perPage: number; pageSize: ListPageSizeControl }) {
  const [params, setParams] = useSearchParams(), sorting = useListTableSorting('employee', { Employé: 'employee', Équipe: 'team', Total: 'total' })
  const view = params.get('view') === 'year' ? 'year' : params.get('view') === 'quarter' ? 'quarter' : 'month', raw = params.get('month') || currentMonth(), month = /^20\d{2}-(0[1-9]|1[0-2])$/.test(raw) ? raw : currentMonth()
  const query = useQuery({ queryKey: ['expenses', 'overview', view, month, params.toString(), perPage], queryFn: () => expensesService.overview({ ...Object.fromEntries(params), area: 'team', view, month, perPage }), retry: false, placeholderData: keepPreviousListData(['expenses', 'overview', view, month]) })
  const data = query.data, [selected, setSelected] = useState<{ employee: string; month: string } | null>(null)
  const row = data?.items.find((item) => item.employee === selected?.employee), selectedCell = row?.cells.find((item) => item.month === selected?.month)
  const change = (values: Record<string, string>) => setParams((current) => { const next = new URLSearchParams(current); next.set('area', 'team'); Object.entries(values).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key)); next.delete('page'); return next })
  const label = data ? view === 'year' ? data.start.slice(0, 4) : view === 'quarter' ? `T${Math.floor((Number(data.start.slice(5)) - 1) / 3) + 1} · ${data.start.slice(0, 4)}` : monthLabel(month) : monthLabel(month)
  const summaryLink = (status: string) => { const next = new URLSearchParams(params); next.set('area', 'team'); next.set('view', view); next.set('month', month); if (status) next.set('status', status); else next.delete('status'); next.delete('page'); return `/expenses?${next}` }
  const statuses = (cell: ExpenseOverviewCell) => cell.reports.length ? [...new Set(cell.reports.map((report) => report.status))].map((status) => <HTag key={status} tone={tone(status)}>{states[status]}{cell.reports.filter((report) => report.status === status).length > 1 ? ` ×${cell.reports.filter((report) => report.status === status).length}` : ''}</HTag>) : <span className="contact-muted">{params.get('state') === 'archived' ? '—' : overviewStates[cell.status]}</span>
  const table = (rows: ExpenseOverviewRow[]) => <HPeriodMatrix rows={rows} sorting={sorting} periods={(data?.periods || []).map((period) => ({ key: period, label: new Intl.DateTimeFormat('fr-FR', { month: view === 'year' ? 'short' : 'long', timeZone: 'UTC' }).format(new Date(period + '-01T12:00:00Z')) }))} identity={(item) => <span className="h-period-person"><strong>{item.employee_name}</strong><small>{item.team_name || 'Sans équipe'}</small></span>} totalLabel="Total TTC" total={(item) => formatAmount(item.total, 'EUR')} cell={(item, index) => {
    const cell = item.cells[index]!, single = cell.reports.length === 1 ? cell.reports[0] : undefined
    return <HPeriodCell status={cell.status} label={`${item.employee_name} · ${monthLabel(cell.month)} · ${overviewStates[cell.status]}`} href={single ? `/expenses/${single.id}` : undefined} state={{ expensesListQuery: params.toString() }} onClick={cell.reports.length > 1 ? () => setSelected({ employee: item.employee, month: cell.month }) : undefined}>
      {cell.reports.length > 0 && <strong>{formatAmount(cell.total, 'EUR')}</strong>}{statuses(cell)}{cell.reports.length > 1 && <small>{cell.reports.length} notes · voir le détail</small>}
    </HPeriodCell>
  }} />
  return <div className="expenses-overview" aria-busy={query.isFetching}>
    <HSectionHeading title="Suivi de l’équipe" description={label} actions={<div className="expenses-period-actions"><div className="contact-view-switch" role="group" aria-label="Période du suivi des notes">{(['month', 'quarter', 'year'] as const).map((value) => <HButton key={value} size="small" variant="ghost" aria-pressed={view === value} onClick={() => change({ view: value })}>{({ month: 'Mois', quarter: 'Trimestre', year: 'Année' })[value]}</HButton>)}</div><HButton size="icon" aria-label="Période précédente" disabled={expensePeriod(month, view, -1) < '2000-01'} onClick={() => change({ month: expensePeriod(month, view, -1) })}><ChevronLeft size={14} /></HButton>{view === 'year' ? <HInput type="number" aria-label="Année du suivi des notes" min={2000} max={2099} key={month.slice(0, 4)} defaultValue={month.slice(0, 4)} onBlur={(event) => { if (/^20\d{2}$/.test(event.target.value)) change({ month: event.target.value + month.slice(4) }); else event.target.value = month.slice(0, 4) }} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); event.currentTarget.blur() } }} /> : <HInput type="month" aria-label="Mois du suivi des notes" min="2000-01" max="2099-12" value={month} onChange={(event) => { if (/^20\d{2}-(0[1-9]|1[0-2])$/.test(event.target.value)) change({ month: event.target.value }) }} />}<HButton size="icon" aria-label="Période suivante" disabled={expensePeriod(month, view, 1) > '2099-12'} onClick={() => change({ month: expensePeriod(month, view, 1) })}><ChevronRight size={14} /></HButton><HButton size="small" onClick={() => change({ month: currentMonth() })}>Aujourd’hui</HButton></div>} />
    <HSummaryCards label="Synthèse des notes de l’équipe" columns={5} error={undefined} onRetry={() => void query.refetch()} items={[
      { key: 'submitted', label: 'À valider', icon: Clock3, tone: 'amber' as const }, { key: 'returned', label: 'À corriger', icon: CircleAlert, tone: 'rose' as const }, { key: 'validated', label: 'À rembourser', icon: Wallet, tone: 'green' as const }, { key: 'reimbursed', label: 'Remboursées', icon: FileCheck, tone: 'blue' as const }, { key: 'missing', label: 'Non reçues', icon: Receipt, tone: 'navy' as const },
    ].map((item) => ({ ...item, count: data?.summary[item.key as keyof typeof data.summary], detail: item.key === 'missing' ? 'Mois sans note reçue · à ce jour' : 'Notes de la période · hors filtre d’état', href: summaryLink(item.key) }))} />
    {query.isPending && <HLoadingIndicator label="Chargement du suivi des notes" />}{query.error && <p role="alert" className="field-error">{query.error.message}<HButton size="small" onClick={() => void query.refetch()}>Réessayer</HButton></p>}
    {data && <><p className="contact-muted">{data.global ? 'Périmètre global, brouillons inclus.' : 'Notes reçues de vos collaborateurs et notes qui vous sont attribuées. Brouillons privés.'} Non reçue : aucune note transmise, sans obligation de déclaration.</p>{data.items.length ? (params.get('group') || 'team') === 'none' ? table(data.items) : <GroupedResults icon={CalendarDays} noun="collaborateurs" groups={groupResults(data.items, (item) => params.get('group') === 'employee' ? { key: item.employee, label: item.employee_name } : { key: item.team, label: item.team_name || 'Sans équipe' })} render={table} /> : <HEmptyState icon={Receipt} title="Aucun collaborateur correspondant" description="Aucun collaborateur ou historique de note accessible pour ces critères." />}<HListPagination pageSize={pageSize} page={data.page} totalPages={data.totalPages} busy={query.isFetching} label="Pagination du suivi des notes" onPageChange={(page) => setParams((current) => { const next = new URLSearchParams(current); next.set('page', String(page)); return next })} /></>}
    <HDialog open={Boolean(selectedCell)} onOpenChange={(open) => { if (!open) setSelected(null) }} title={selectedCell ? monthLabel(selectedCell.month) : 'Notes du mois'} description={row?.employee_name || ''}><div className="dialog-form">{selectedCell && <HDataTable data={selectedCell.reports} columnBorders columnAlignments={{ Total: 'right' }} columns={[{ id: 'Note', header: 'Note', cell: ({ row: note }) => <Link to={`/expenses/${note.original.id}`} state={{ expensesListQuery: params.toString() }}>{note.original.supplement ? 'Complément' : 'Note principale'}</Link> }, { id: 'État', header: 'État', cell: ({ row: note }) => <HTag tone={tone(note.original.status)}>{states[note.original.status]}</HTag> }, { id: 'Total', header: 'Total TTC', cell: ({ row: note }) => formatAmount(note.original.total, 'EUR') }]} />}</div><HDialogFooter><HButton onClick={() => setSelected(null)}>Fermer</HButton></HDialogFooter></HDialog>
  </div>
}
