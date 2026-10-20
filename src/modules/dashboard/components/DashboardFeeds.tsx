import { useId } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import type { LucideIcon } from 'lucide-react'
import { Activity, ArrowUpRight, CalendarDays, Clock3, ListTodo, MessageSquare, FileText, CheckCheck, PencilLine } from 'lucide-react'
import { HTag } from '../../../shared/ui/HTag'
import { useReferences } from '../../settings/hooks/useReferences'
import { HBadge } from '../../../shared/ui/HBadge'
import { HEmptyState } from '../../../shared/ui/HEmptyState'
import { HButton } from '../../../shared/ui/HButton'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { calendarService } from '../../calendar/services/CalendarService'
import { calendarKinds } from '../../calendar/schemas/events'
import { dashboardService } from '../services/DashboardService'
import { parisToday } from '../services/dashboardPeriod'
const stamp = (value: string) => new Date(value.includes('T') ? value : value.replace(' ', 'T'))
const activityIcons: Record<string, LucideIcon> = { note: MessageSquare, message: MessageSquare, document: FileText, task: CheckCheck, change: PencilLine, status_change: CheckCheck, system: Activity }
const dateLabel = (value: string, allDay = false) => new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', day: 'numeric', month: 'short', ...(allDay ? {} : { hour: '2-digit', minute: '2-digit' }) }).format(stamp(value))
async function loadPlanning(userId: string, canCalendar: boolean, today: string, to: string) {
  const now = Date.now()
  const [events, tasks] = await Promise.all([canCalendar ? calendarService.events({ from: `${today}T00:00:00.000Z`, to, owner: userId }) : Promise.resolve([]), dashboardService.tasks(today, new Date(Date.parse(to) - 86400000).toISOString().slice(0, 10))])
  return [...events.filter((event) => event.all_day || Date.parse(event.end || event.start) >= now).map((event) => ({ id: event.id, title: event.title, context: [event.code, event.company].filter(Boolean).join(' · '), start: event.start, allDay: event.all_day, kind: calendarKinds[event.kind], kindCode: event.kind, tone: event.tone, color: event.color, detail: [calendarKinds[event.kind], event.location].filter(Boolean).join(' · '), href: event.href })), ...tasks.items.map((task) => ({ id: task.id, title: task.title, context: task.source, start: task.due_date, allDay: true, kind: 'Tâche', kindCode: 'task', tone: undefined, color: undefined, detail: 'Tâche', href: task.href }))].sort((a, b) => Date.parse(a.start) - Date.parse(b.start)).slice(0, 5)
}
export type DashboardFeedExamples = { planning?: Awaited<ReturnType<typeof loadPlanning>>; activity?: Awaited<ReturnType<typeof dashboardService.activity>> }
export function DashboardFeeds({ userId, canCalendar, canActivity, kind, title, preview }: { userId: string; canCalendar: boolean; canActivity: boolean; kind?: 'planning' | 'activity'; title?: string; preview?: DashboardFeedExamples }) {
  const id = useId()
  const appointmentKinds = useReferences('crm_appointment_kinds', !preview && canCalendar && kind !== 'activity')
  const today = parisToday(), to = new Date(Date.parse(today) + 7 * 86400000).toISOString()
  const planning = useQuery({ queryKey: ['calendar', 'dashboard', userId, today], queryFn: () => loadPlanning(userId, canCalendar, today, to), enabled: !preview && kind !== 'activity' && (canCalendar || canActivity), staleTime: 60_000, refetchOnMount: 'always', retry: false })
  const activity = useQuery({ queryKey: ['activity', 'dashboard', userId], queryFn: () => dashboardService.activity(), enabled: !preview && kind !== 'planning' && canActivity, staleTime: 30_000, refetchOnMount: 'always', refetchInterval: 60_000, retry: false })
  const events = preview?.planning ?? planning.data
  const activityItems = preview?.activity?.items ?? activity.data?.items
  return <div className={kind ? 'dashboard-feed-widget' : 'dashboard-secondary'}>
    {kind !== 'activity' && <section className="panel h-dashboard-card h-tone" data-tone="navy" aria-labelledby={`${id}-planning`}>
      <div className="panel-heading dashboard-feed-heading"><h2 id={`${id}-planning`}><CalendarDays size={17} aria-hidden="true" />{title || 'Mon planning'}</h2><span className="dashboard-feed-subtitle" title="Vos tâches et échéances · 7 prochains jours">Vos tâches et échéances · 7 prochains jours</span><Link to="/calendar" aria-label="Ouvrir le calendrier" className="panel-icon-link"><ArrowUpRight size={16} /></Link></div>
      {!canCalendar && !canActivity ? <HEmptyState icon={CalendarDays} title="Planning non accessible" description="Aucun module métier consultable." /> : planning.isPending && !preview ? <HLoadingIndicator label="Chargement du planning" /> : planning.isError && !preview ? <HEmptyState icon={CalendarDays} title="Planning indisponible" description={planning.error.message}><HButton size="small" onClick={() => void planning.refetch()}>Réessayer</HButton></HEmptyState> : !events?.length ? <HEmptyState icon={CalendarDays} title="Aucune échéance cette semaine" description="Vos tâches datées, remises, visites et soutenances apparaîtront ici." /> : <ul className="dashboard-feed dashboard-agenda">{events.map((event) => {
        const tag = appointmentKinds.data?.find((item) => item.code === event.kindCode)
        const isToday = parisToday(stamp(event.start)) === today
        return <li key={event.id}><Link to={event.href}>
          <time className="dashboard-agenda-date" dateTime={stamp(event.start).toISOString()} data-today={isToday}><strong>{new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', day: 'numeric' }).format(stamp(event.start))}</strong><span>{new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', month: 'short' }).format(stamp(event.start))}</span></time>
          <div><strong title={event.title}>{event.title}</strong><span className="dashboard-feed-context" title={event.context}>{event.context}</span><div className="dashboard-agenda-meta">{event.kindCode === 'task' ? <HBadge>{event.kind}</HBadge> : <HTag color={event.color || tag?.color} tone={event.tone || tag?.tone || (event.kindCode === 'hearing' ? 'violet' : event.kindCode === 'submission' ? 'pink' : 'blue')} title={appointmentKinds.error ? 'Couleur par défaut : réglages indisponibles.' : undefined}>{event.kind}</HTag>}<small><Clock3 size={11} aria-hidden="true" />{isToday ? 'Aujourd’hui' : new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', weekday: 'long' }).format(stamp(event.start))}{!event.allDay && ` · ${new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit' }).format(stamp(event.start))}`}</small></div></div>
          <ArrowUpRight size={14} aria-hidden="true" />
        </Link></li>
      })}</ul>}
    </section>}
    {kind !== 'planning' && <section className="panel h-dashboard-card h-tone" data-tone="navy" aria-labelledby={`${id}-activity`}>
      <div className="panel-heading"><h2 id={`${id}-activity`}><Activity size={17} aria-hidden="true" />{title || 'Mon activité récente'}</h2>{canActivity && <Link to="/activity?view=own" className="panel-icon-link" aria-label="Voir toute mon activité" title="Voir toute mon activité"><ArrowUpRight size={16} /></Link>}</div>
      {!canActivity ? <HEmptyState icon={ListTodo} title="Activité non accessible" description="Aucun module métier consultable." /> : activity.isPending && !preview ? <HLoadingIndicator label="Chargement de l’activité récente" /> : activity.isError && !preview ? <HEmptyState icon={Activity} title="Activité indisponible" description={activity.error.message}><HButton size="small" onClick={() => void activity.refetch()}>Réessayer</HButton></HEmptyState> : !activityItems?.length ? <HEmptyState icon={ListTodo} title="Aucune activité récente" description="Vos actions, vos mentions et les tâches qui vous sont attribuées apparaîtront ici." /> : <ul className="dashboard-feed dashboard-feed--activity">{activityItems.map((event) => {
        const Icon = activityIcons[event.type] || Activity
        return <li key={event.id}><Link to={event.href}>
          <span className="dashboard-feed-icon dashboard-activity-icon" aria-hidden="true"><Icon size={14} /></span>
          <div><div className="dashboard-activity-title"><strong title={event.body}>{event.body || 'Fiche mise à jour'}</strong></div><span className="dashboard-feed-context" title={event.source}>{event.source}</span><small>{event.author} · <time dateTime={stamp(event.created).toISOString()}>{dateLabel(event.created)}</time></small></div>
          <ArrowUpRight size={14} aria-hidden="true" />
        </Link></li>
      })}</ul>}
    </section>}
  </div>
}
