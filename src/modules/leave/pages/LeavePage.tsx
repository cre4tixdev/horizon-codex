import { useListPageSize } from '../../../shared/hooks/useListPageSize'
import { keepPreviousListData } from '../../../shared/search/keepPreviousListData'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, Plus, UserRound, UsersRound, Coins, FilePenLine, Clock3, CircleCheck, CircleX } from 'lucide-react'
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
import { HInput } from '../../../shared/ui/HInput'
import { GroupedResults } from '../../../shared/search/GroupedResults'
import { groupResults } from '../../../shared/search/listPresentation'
import { useListTableSorting } from '../../../shared/search/useListTableSorting'
import { useLeaveAccess, useLeaveChoices } from '../hooks/useLeave'
import { leaveService } from '../services/LeaveService'
import { displayDays, displayDate, leaveStates, stateTone, type LeaveRequest } from '../schemas/leave'
import { LeaveEditor } from '../components/LeaveEditor'
import { LeaveBalances } from '../components/LeaveBalances'
import { LeaveCalendar } from '../components/LeaveCalendar'
import { LeaveAllocations } from '../components/LeaveAllocations'
import '../leave.css'
export function LeavePage() {
  const access = useLeaveAccess(), choices = useLeaveChoices(access.canRead), [params, setParams] = useSearchParams(), client = useQueryClient(), navigate = useNavigate(), [creating, setCreating] = useState(false)
  const area = params.get('area') || 'own', year = params.get('year') || String(new Date().getFullYear()), isList = ['own', 'review'].includes(area)
  const { onMount: listRoot, perPage, control: pageSizeControl } = useListPageSize('list', isList)
  const list = useQuery({ queryKey: ['leave', 'list', area, year, params.toString(), perPage], queryFn: () => leaveService.list({ ...Object.fromEntries(params), perPage: String(perPage) }), enabled: access.canRead && isList, retry: false, placeholderData: keepPreviousListData(['leave', 'list', area, year]), refetchInterval: 30_000 })
  const sorting = useListTableSorting('-start_date', { Employé: 'employee', Type: 'type', Début: 'start_date', Fin: 'end_date', Durée: 'duration', Manager: 'manager', État: 'status' })
  if (!access.canRead) return <HEmptyState icon={CalendarDays} title="Congés" description="Vous ne disposez pas de l’accès aux congés." />
  const table = (items: LeaveRequest[]) => <HDataTable columnSettings={{ id: 'leave.requests', defaultHidden: ['direct_declaration'] }} columnBorders listSorting={sorting} data={items} columns={[
    { header: 'Employé', cell: ({ row }) => <span className="h-data-table-record-name">{row.original.employee_name}</span> },
    { id: 'Type', header: 'Type', accessorKey: 'type_label' },
    { header: 'Début', cell: ({ row }) => <>{displayDate(row.original.start_date)}<small className="leave-cell-detail">{row.original.start_half === 'pm' ? 'Après-midi' : 'Matin'}</small></> },
    { header: 'Fin', cell: ({ row }) => <>{displayDate(row.original.end_date)}<small className="leave-cell-detail">{row.original.end_half === 'am' ? 'Matin' : 'Après-midi'}</small></> },
    { header: 'Durée', cell: ({ row }) => displayDays(row.original.duration) },
    { header: 'Manager', cell: ({ row }) => row.original.manager_name || 'À définir' },
    { header: 'État', cell: ({ row }) => <HTag tone={stateTone(row.original.status)}>{leaveStates[row.original.status]}</HTag> },
    { id: 'direct_declaration', header: 'Circuit', cell: ({ row }) => row.original.direct_declaration ? 'Déclaration directe' : 'Validation manager' },
  ]} columnAlignments={{ Durée: 'right' }} columnWidths={{ Début: 125, Fin: 125, Durée: 90 }} getRowLink={(r) => ({ href: `/leave/${r.id}`, label: `Ouvrir le congé de ${r.employee_name} du ${displayDate(r.start_date)}`, state: { leaveListQuery: params.toString() } })} />
  return <div ref={listRoot} className="contact-directory leave-page" aria-busy={isList && list.isFetching}><HPageBreadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'Congés' }]} /><HPageHeader title="Congés" description="Vos absences, vos droits et la disponibilité de l’équipe." actions={<>{access.canWrite && choices.data?.employee && <HButton variant="primary" onClick={() => setCreating(true)}><Plus size={14} />Nouvelle demande</HButton>}</>} />
  <HRecordTabs label="Vues des congés" idPrefix="leave-area" value={area} onChange={(value) => setParams((current) => { const next = new URLSearchParams(current); next.set('area', value); for (const key of ['page', 'status', 'employee', 'type', 'state', 'group', 'sort']) next.delete(key); if (value === 'review') next.set('status', 'submitted,cancel_requested'); return next })} items={[{ value: 'own', label: 'Mes congés', icon: UserRound, panel: 'leave-results' }, ...(choices.data?.can_review ? [{ value: 'review', label: 'À valider', icon: UsersRound, panel: 'leave-results' }] : []), { value: 'calendar', label: 'Calendrier d’équipe', icon: CalendarDays, panel: 'leave-results' }, ...(choices.data?.can_allocate ? [{ value: 'allocations', label: 'Allocations RH', icon: Coins, panel: 'leave-results' }] : [])]} actions={area !== 'calendar' && <label className="leave-year"><span>Année</span><HInput aria-label="Année des congés" type="number" min={2000} max={2200} value={year} onChange={(e) => setParams((current) => { const next = new URLSearchParams(current); next.set('year', e.target.value); next.delete('page'); return next })} /></label>} />
  <section id="leave-results" role="tabpanel" aria-labelledby={`leave-area-${area}`}>
    {choices.isPending && <HLoadingIndicator label="Chargement des congés" />}{choices.error && <p role="alert" className="field-error">{choices.error.message}<HButton onClick={() => void choices.refetch()}>Réessayer</HButton></p>}
    {area === 'own' && choices.data && <><LeaveBalances balances={list.data?.balances || []} choices={choices.data} year={year} />{!choices.data.employee && <p className="contact-muted">Associez votre compte à un employé actif pour déposer une demande. Les RH peuvent lui attribuer des droits même sans compte Horizon.</p>}</>}
    {area === 'review' && <HSummaryCards label="Demandes du périmètre manager" error={undefined} onRetry={() => void list.refetch()} items={[{ key: 'submitted', label: 'À valider', icon: Clock3, tone: 'amber' as const }, { key: 'cancel_requested', label: 'Annulations à traiter', icon: CircleX, tone: 'rose' as const }, { key: 'approved', label: 'Validés', icon: CircleCheck, tone: 'green' as const }, { key: 'rejected', label: 'Refusés', icon: FilePenLine, tone: 'violet' as const }].map((s) => { const next = new URLSearchParams(params); next.set('status', s.key); next.delete('page'); return { ...s, href: `/leave?${next}`, count: list.data?.summary[s.key], detail: `Demandes ${year} · votre périmètre` } })} />}
    {isList && <><HListPagination pageSize={pageSizeControl} page={list.data?.page || 1} totalPages={list.data?.totalPages} busy={list.isFetching} label="Pagination des congés" onPageChange={(page) => setParams((current) => { const next = new URLSearchParams(current); next.set('page', String(page)); return next })} />{list.isPending && <HLoadingIndicator label="Chargement des demandes" />}{list.error && <p role="alert" className="field-error">{list.error.message}<HButton onClick={() => void list.refetch()}>Réessayer</HButton></p>}{list.data && <>{list.data.items.length ? params.get('group') && params.get('group') !== 'none' ? <GroupedResults icon={CalendarDays} noun="demandes" groups={groupResults(list.data.items, (r) => params.get('group') === 'employee' ? { key: r.employee, label: r.employee_name } : params.get('group') === 'type' ? { key: r.type, label: r.type_label } : { key: r.status, label: leaveStates[r.status] })} render={table} /> : table(list.data.items) : <HEmptyState icon={CalendarDays} title={area === 'review' ? 'Aucune demande à traiter' : 'Aucune demande pour cette sélection'} description={area === 'review' ? 'Les demandes de vos collaborateurs apparaîtront ici.' : 'Préparez votre prochaine absence avec Nouvelle demande.'} />}<p className="contact-muted">{list.data.totalItems} demande(s)</p></>}</>}
    {area === 'calendar' && <LeaveCalendar />}{area === 'allocations' && choices.data?.can_allocate && <LeaveAllocations choices={choices.data} year={year} />}
  </section>
  {creating && choices.data && <LeaveEditor choices={choices.data} onClose={() => setCreating(false)} onSaved={(r) => { setCreating(false); void client.invalidateQueries({ queryKey: ['leave'] }); navigate(`/leave/${r.id}`, { state: { leaveListQuery: params.toString() } }) }} />}
  </div>
}
