import { useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { ArrowUpRight, CalendarDays, Clock3, FileCheck, Link2 } from 'lucide-react'
import { hasPermission, type HorizonUser } from '../../../core/auth/types/session'
import { HButton } from '../../../shared/ui/HButton'
import { HDataTable } from '../../../shared/ui/HDataTable'
import { HEmptyState } from '../../../shared/ui/HEmptyState'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { HResourceTimeline } from '../../../shared/ui/HResourceTimeline'
import { HEmployeeAvatar } from '../../../shared/ui/HEmployeeAvatar'
import { HPeriodCell } from '../../../shared/ui/HPeriodMatrix'
import { timelinePosition, timelineColor } from '../../../shared/calendar/timeline'
import { timeService } from '../../time/services/TimeService'
import { duration, overviewStates, type TimeOverview } from '../../time/schemas/time'
import { leaveService } from '../../leave/services/LeaveService'
import { expensesService } from '../../expenses/services/ExpensesService'
import { displayDays, type LeaveCalendarData } from '../../leave/schemas/leave'
import type { DashboardWidget } from '../schemas/layouts'
import { shortcutCatalog } from '../schemas/shortcuts'
import { widgetRange, type WidgetRange } from '../services/widgetRecords'
import { dashboardPeriodRange, parisToday } from '../services/dashboardPeriod'

export function WidgetFrame({ title, href, children }: { title: string; href?: string | undefined; children: ReactNode }) {
  return <section className="panel h-dashboard-card h-tone dashboard-data-panel" data-tone="navy" aria-label={title}><div className="panel-heading"><h2>{title}</h2>{href && <Link to={href} className="panel-icon-link" aria-label={`Tout voir : ${title}`}><ArrowUpRight size={15} /></Link>}</div><div className="dashboard-widget-body">{children}</div></section>
}
export function ShortcutWidget({ widget, user }: { widget: DashboardWidget; user: HorizonUser | undefined }) {
  const links = widget.config.links.map((key) => shortcutCatalog[key]).filter((item) => user && hasPermission(user, item.permission))
  return <WidgetFrame title={widget.config.title || 'Mes raccourcis'}>{links.length ? <ShortcutLinks links={links} /> : <p className="contact-muted">Aucun raccourci accessible. Configurez les destinations du widget.</p>}</WidgetFrame>
}
function QueryState({ query }: { query: { isPending: boolean; error: Error | null; refetch: () => unknown } }) {
  return query.error ? <p className="field-error" role="alert">{query.error.message}<HButton size="small" onClick={() => void query.refetch()}>Réessayer</HButton></p> : query.isPending ? <HLoadingIndicator label="Chargement du widget" /> : null
}
export function TimeWidget({ widget, range, user }: { widget: DashboardWidget; range: WidgetRange; user: HorizonUser | undefined }) {
  const [page, setPage] = useState(1), allowed = Boolean(user && hasPermission(user, 'time.read')), own = widget.config.scope === 'own'
  const selected = widgetRange(widget.config.period, range) || range
  const yearly = selected.start.slice(5) === '01-01' && selected.end.slice(5) === '12-31'
  const quarterly = !yearly && selected.start.slice(0, 7) !== selected.end.slice(0, 7)
  const view = yearly ? 'year' : quarterly ? 'quarter' : 'month', date = selected.start, area = own ? 'own' : 'review'
  const choices = useQuery({ queryKey: ['time', 'choices', user?.id], queryFn: timeService.choices, enabled: allowed, staleTime: 60_000, retry: false })
  const enabled = allowed && Boolean(own ? choices.data?.tracks_time || choices.data?.has_history : choices.data?.can_review)
  const query = useQuery({ queryKey: ['dashboard', 'time-widget', user?.id, area, view, date, page], queryFn: () => timeService.overview({ area, view, date, page: String(page) }), enabled, staleTime: 60_000, retry: false })
  const data = query.data, href = `/time-reporting?area=${area}&view=${yearly ? 'year' : 'month'}&date=${date}`
  return <WidgetFrame title={widget.config.title || (own ? 'Mes temps' : 'Temps de l’équipe')} href={enabled ? href : undefined}>
    {!allowed ? <p className="contact-muted">Accès TimeReport nécessaire.</p> : <><QueryState query={choices} />{choices.data && !enabled && <p className="contact-muted">{own ? choices.data.entry_reason || 'Vous ne saisissez pas vos heures.' : 'La vue équipe nécessite un rôle de validation.'}</p>}{enabled && <><QueryState query={query} />{data && <><p className="dashboard-widget-context">{selected.label} · {own ? 'Mes heures' : 'Mon périmètre de validation'}</p>{data.items.length ? <TimeWidgetTable data={data} href={href} /> : <HEmptyState icon={Clock3} title="Aucune saisie sur cette période" description="Les feuilles et leur état apparaîtront ici." />}{data.totalPages > 1 && <div className="dashboard-record-pagination"><HButton size="small" disabled={page <= 1} onClick={() => setPage(page - 1)}>Précédent</HButton><span>{page} / {data.totalPages}</span><HButton size="small" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>Suivant</HButton></div>}</>}</>}</>}
  </WidgetFrame>
}
export function LeaveWidget({ widget, range, user }: { widget: DashboardWidget; range: WidgetRange; user: HorizonUser | undefined }) {
  const allowed = Boolean(user && hasPermission(user, 'leave.read')), [page, setPage] = useState(1)
  const selected = widgetRange(widget.config.period, range) || range
  // The shared leave calendar supports at most three months; always name the actual window.
  const window = Date.parse(selected.end) - Date.parse(selected.start) > 94 * 86400000 ? dashboardPeriodRange('month', selected.start) : selected
  const scope = widget.config.scope === 'company' ? 'company' : 'team'
  const query = useQuery({ queryKey: ['dashboard', 'leave-widget', user?.id, window.start, window.end, scope, page], queryFn: () => leaveService.calendar({ from: window.start, to: window.end, scope, page: String(page) }), enabled: allowed, staleTime: 60_000, retry: false })
  const result = query.data
  return <WidgetFrame title={widget.config.title || 'Absences'} href={allowed ? `/leave?area=calendar&scope=${scope}&date=${window.start}` : undefined}>
    {!allowed ? <p className="contact-muted">Accès Congés nécessaire.</p> : <><p className="dashboard-widget-context">{window.description} · {scope === 'team' ? 'Mon équipe' : 'Entreprise'}</p><QueryState query={query} />{result && (result.employees.length ? <><LeaveWidgetTimeline result={result} first={window.start} />{result.totalPages > 1 && <div className="dashboard-record-pagination"><HButton size="small" disabled={page <= 1} onClick={() => setPage(page - 1)}>Précédent</HButton><span>{page} / {result.totalPages}</span><HButton size="small" disabled={page >= result.totalPages} onClick={() => setPage(page + 1)}>Suivant</HButton></div>}</> : <HEmptyState icon={CalendarDays} title="Aucune absence sur cette période" description="Les congés validés et en attente apparaîtront ici." />)}</>}
  </WidgetFrame>
}
function ApprovalSource({ kind, user }: { kind: 'leave' | 'expenses' | 'time'; user: HorizonUser }) {
  const allowed = hasPermission(user, `${kind}.read`) && hasPermission(user, `${kind}.validate`)
  const choices = useQuery({ queryKey: ['dashboard', 'approval-choices', user.id, kind], queryFn: async () => kind === 'leave' ? (await leaveService.choices()).can_review : kind === 'expenses' ? (await expensesService.choices()).can_review : (await timeService.choices()).can_review, enabled: allowed, staleTime: 60_000, retry: false })
  const query = useQuery({ queryKey: ['dashboard', 'approvals', user.id, kind], queryFn: async () => {
    if (kind === 'leave') return (await leaveService.list({ area: 'review', status: 'submitted,cancel_requested', year: parisToday().slice(0, 4), perPage: '3' })).totalItems
    if (kind === 'expenses') return (await expensesService.list({ area: 'review', status: 'submitted', perPage: 3 })).totalItems
    return (await timeService.list({ area: 'review', status: 'submitted', month: parisToday().slice(0, 7), page: '1' })).totalItems
  }, enabled: allowed && choices.data === true, staleTime: 30_000, retry: false })
  const label = { leave: 'Congés', expenses: 'Notes de frais', time: 'TimeReport' }[kind], href = kind === 'time' ? `/time-reporting?area=review&view=month&date=${parisToday()}&status=submitted` : `/${kind}?area=review&status=${kind === 'leave' ? 'submitted,cancel_requested' : 'submitted'}`
  if (!allowed) return null
  return <div className="dashboard-approval-source"><QueryState query={choices} />{choices.data === false && <small className="contact-muted">{label} · Aucun périmètre de validation</small>}{choices.data === true && <><ApprovalLink label={label} href={href} count={query.data} period={kind === 'time' ? 'Mois en cours' : kind === 'leave' ? 'Année en cours' : 'Toutes périodes'} /><QueryState query={query} /></>}</div>
}
export function ApprovalWidget({ widget, user }: { widget: DashboardWidget; user: HorizonUser | undefined }) {
  return <WidgetFrame title={widget.config.title || 'À valider'}>{user && ['leave', 'expenses', 'time'].some((kind) => hasPermission(user, `${kind}.validate`)) ? (['leave', 'expenses', 'time'] as const).map((kind) => <ApprovalSource key={kind} kind={kind} user={user} />) : <p className="contact-muted">Aucun droit de validation disponible.</p>}</WidgetFrame>
}

export function TimeWidgetTable({ data, href = '/time-reporting' }: { data: TimeOverview; href?: string }) {
  const yearly = data.view === 'year', quarterly = data.view === 'quarter'
  return <HDataTable columnBorders data={data.items} columns={[
      { id: 'employee', header: 'Collaborateur', cell: ({ row }) => <span className="h-resource-timeline-identity"><HEmployeeAvatar name={row.original.employee_name} queryKey={['time', 'photo', row.original.employee, row.original.photo_revision]} hasPhoto={row.original.has_photo} load={() => timeService.photo(row.original.employee)} /><span>{row.original.employee_name}</span></span> },
      ...data.periods.map((period, index) => ({ id: period.key, header: yearly || quarterly ? new Date(period.start).toLocaleDateString('fr-FR', { month: 'short', timeZone: 'UTC' }) : `${period.start.slice(8, 10)}/${period.start.slice(5, 7)}`, cell: ({ row }: { row: { original: typeof data.items[number] } }) => { const cell = row.original.cells[index]!; return <HPeriodCell status={cell.status} label={overviewStates[cell.status]} href={cell.sheets[0] ? `/time-reporting/sheets/${cell.sheets[0].id}` : href}><strong>{cell.minutes === null || cell.status === 'unavailable' ? '—' : duration(cell.minutes)}</strong><small>{overviewStates[cell.status]}</small></HPeriodCell> } })),
      { id: 'total', header: 'Total', cell: ({ row }) => duration(row.original.total_minutes) },
    ]} />
}

export function LeaveWidgetTimeline({ result, first }: { result: LeaveCalendarData; first: string }) {
  return <HResourceTimeline label="Absences du widget" days={result.days} rows={result.employees} rowKey={(row) => row.id} today={parisToday()} identity={(row) => <span className="h-resource-timeline-identity"><HEmployeeAvatar name={row.name} hasPhoto={row.has_photo} queryKey={['leave', 'photo', row.id, row.photo_revision]} load={() => leaveService.photo(row.id)} /><span>{row.name}</span></span>} bars={(row) => result.items.filter((item) => item.employee === row.id).flatMap((item) => { const position = timelinePosition(first, result.days.length, item.start_date, item.end_date, item.start_half, item.end_half); return position ? [{ key: item.id, position, label: `${row.name} · ${item.type_label} · ${displayDays(item.duration)}`, title: `${row.name} · ${item.type_label} · ${displayDays(item.duration)}${item.pending ? ' · En attente' : ''}`, href: item.href, tone: 'blue' as const, color: timelineColor(row.id), tentative: item.pending }] : [] })} total={(index) => { const day = result.days[index]!, count = day.absent + day.pending; return count ? count.toLocaleString('fr-FR') : '' }} />
}

export function ShortcutLinks({ links }: { links: (typeof shortcutCatalog)[keyof typeof shortcutCatalog][] }) {
  return <nav className="dashboard-shortcuts" aria-label="Raccourcis personnels">{links.map((item) => <Link key={item.key} to={item.href}><Link2 size={14} />{item.label}<ArrowUpRight size={13} /></Link>)}</nav>
}

export function ApprovalLink({ label, href, count, period }: { label: string; href: string; count: number | undefined; period: string }) {
  return <Link to={href}><span><FileCheck size={16} />{label}<small>{period}</small></span><strong>{count ?? '—'}</strong></Link>
}
