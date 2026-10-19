import { keepPreviousListData } from '../../../shared/search/keepPreviousListData'
import { useSearchParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, Clock3, FileClock, FileCheck, CircleAlert } from 'lucide-react'
import { HEmployeeAvatar } from '../../../shared/ui/HEmployeeAvatar'
import { HSummaryCards } from '../../../shared/ui/HSummaryCards'
import { HPeriodMatrix, HPeriodCell } from '../../../shared/ui/HPeriodMatrix'
import { TimeStatus } from './TimeStatus'
import { TimeAgenda } from './TimeAgenda'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { HEmptyState } from '../../../shared/ui/HEmptyState'
import { HButton } from '../../../shared/ui/HButton'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { HListPagination } from '../../../shared/ui/HListPagination'
import { GroupedResults } from '../../../shared/search/GroupedResults'
import { groupResults } from '../../../shared/search/listPresentation'
import { useListTableSorting } from '../../../shared/search/useListTableSorting'
import { timeService } from '../services/TimeService'
import { dateLabel, duration, overviewStates, type TimeOverviewCell, type TimeOverviewRow } from '../schemas/time'

function Person({ row }: { row: TimeOverviewRow }) {
  return <span className="time-matrix-identity"><HEmployeeAvatar name={row.employee_name} queryKey={['time', 'photo', row.employee, row.photo_revision]} hasPhoto={row.has_photo} load={() => timeService.photo(row.employee)} /><span className="time-matrix-person"><strong>{row.employee_name}</strong><small>{row.team_name}{row.work_type === 'production' ? ' · PROD' : ''}</small></span></span>
}
export function TimeOverview({ area, view, date, history = false }: { area: 'own' | 'review'; view: 'week' | 'month' | 'year'; date: string; history?: boolean }) {
  const [params, setParams] = useSearchParams(), review = area === 'review'
  const query = useQuery({ queryKey: ['time', 'overview', area, view, date, params.toString()], queryFn: () => timeService.overview({ ...Object.fromEntries(params), area, view, date }), retry: false, placeholderData: keepPreviousListData(['time', 'overview', area, view, date]) })
  const sorting = useListTableSorting('employee_name', { Employé: 'employee_name', Équipe: 'team_name', Total: 'total_minutes' })
  const data = query.data
  const label = (p: { start: string; end: string }) => view === 'year' ? new Date(p.start).toLocaleDateString('fr-FR', { month: 'short', timeZone: 'UTC' }) : view === 'week' ? new Date(p.start).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit', timeZone: 'UTC' }) : `${dateLabel(p.start)} – ${dateLabel(p.end)}`
  const href = (cell: TimeOverviewCell, start: string) => {
    const next = new URLSearchParams(params)
    if (view === 'year') { next.set('view', 'month'); next.set('month', start.slice(0, 7)); next.set('date', start); next.set('area', area); next.delete('page'); return `/time-reporting?${next}` }
    if (cell.sheets.length === 1) return `/time-reporting/sheets/${cell.sheets[0]!.id}`
    return !review && !history && !['off', 'unavailable'].includes(cell.status) ? `/time-reporting?view=week&date=${cell.key}&area=own` : undefined
  }
  const cellContent = (cell: TimeOverviewCell) => <>
    <strong>{cell.minutes === null || cell.status === 'unavailable' ? '—' : duration(cell.minutes)}</strong>
    <TimeStatus status={cell.status} review={review} />
    {view === 'year' && cell.total_weeks > 0 && <small>{cell.validated_weeks}/{cell.total_weeks} validées</small>}
  </>
  const table = (rows: TimeOverviewRow[]) => <HPeriodMatrix rows={rows} sorting={sorting} periods={(data?.periods || []).map((period) => ({ key: period.key, label: label(period) }))} identity={(row) => <Person row={row} />} total={(row) => duration(row.total_minutes)} cell={(row, index) => {
    const period = data!.periods[index]!, cell = row.cells[index]!
    return <HPeriodCell status={cell.status} href={href(cell, period.start)} state={{ timeListQuery: params.toString() }} label={`${row.employee_name} · ${label(period)} · ${review && cell.status === 'missing' ? 'Non reçue' : overviewStates[cell.status]}`}>{cellContent(cell)}</HPeriodCell>
  }} />
  const summaryLink = (status: string) => { const next = new URLSearchParams(params); next.set('area', 'review'); next.set('view', view); next.set('date', date); next.set('status', status); next.delete('page'); return `/time-reporting?${next}` }
  const own = data?.items[0]
  return <div className="time-overview" aria-busy={query.isFetching}>
    {query.isPending && <HLoadingIndicator label="Chargement du suivi des temps" />}
    {query.error && <p role="alert" className="field-error">{query.error.message}<HButton onClick={() => void query.refetch()}>Réessayer</HButton></p>}
    {review && <HSummaryCards label="Synthèse de l’équipe" columns={5} error={undefined} onRetry={() => void query.refetch()} items={[
      { label: 'Heures reçues', icon: Clock3, tone: 'blue', count: undefined, value: data ? duration(data.summary.minutes) : '—', detail: 'Période sélectionnée · hors filtres', href: summaryLink('') },
      { label: 'À valider', icon: FileClock, tone: 'amber', count: data?.summary.submitted, detail: 'Feuilles soumises', href: summaryLink('submitted') },
      { label: 'Validées', icon: FileCheck, tone: 'green', count: data?.summary.validated, detail: 'Feuilles approuvées', href: summaryLink('validated') },
      { label: 'À corriger', icon: CircleAlert, tone: 'rose', count: data?.summary.rejected, detail: 'Feuilles retournées', href: summaryLink('rejected') },
      { label: 'Non reçues', icon: FileClock, tone: 'navy', count: data?.summary.missing, detail: 'Semaines attendues à ce jour', href: summaryLink('missing') },
    ]} />}
    {data && <>
      <HSectionHeading title={review ? 'Suivi de l’équipe' : history ? 'Historique de mes temps' : 'Mes temps'} count={review ? data.totalItems : undefined} description={review ? 'Heures reçues et validation. Les brouillons restent privés.' : ''} actions={!review && own ? <span className="time-agenda-total">{duration(own.total_minutes)} <small>heures saisies</small></span> : undefined} />
      {!data.items.length ? <HEmptyState icon={CalendarDays} title={review ? 'Aucun collaborateur sur cette période' : 'Aucune feuille sur cette période'} description={review ? 'Seuls les employés concernés et les historiques autorisés sont affichés.' : 'Vos feuilles enregistrées apparaîtront ici.'} /> : review ? <div className={`time-matrix time-matrix--${view}`}>
        {params.get('group') === 'employee' || params.get('group') === 'team' ? <GroupedResults icon={CalendarDays} noun="collaborateurs" groups={groupResults(data.items, (r) => params.get('group') === 'team' ? { key: r.team_name, label: r.team_name || 'Sans équipe' } : { key: r.employee, label: r.employee_name })} render={table} /> : table(data.items)}
      </div> : <TimeAgenda data={data} row={own!} history={history} query={params.toString()} />}

      {review && <HListPagination page={data.page} totalPages={data.totalPages} label="Pagination des collaborateurs" busy={query.isFetching} onPageChange={(page) => setParams((current) => { const next = new URLSearchParams(current); next.set('page', String(page)); return next })} />}
    </>}
  </div>
}
