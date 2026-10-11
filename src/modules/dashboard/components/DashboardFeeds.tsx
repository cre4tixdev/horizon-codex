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
export function DashboardFeeds({ userId, canCalendar, canActivity }: { userId: string; canCalendar: boolean; canActivity: boolean }) {
  const appointmentKinds = useReferences('crm_appointment_kinds', canCalendar)
  const today = parisToday(), to = new Date(Date.parse(today) + 7 * 86400000).toISOString()
  const planning = useQuery({ queryKey: ['calendar', 'dashboard', userId, today], queryFn: async () => {
    const now = Date.now()
    const [events, tasks] = await Promise.all([canCalendar ? calendarService.events({ from: `${today}T00:00:00.000Z`, to, owner: userId }) : Promise.resolve([]), dashboardService.tasks(today, new Date(Date.parse(to) - 86400000).toISOString().slice(0, 10))])
    return [...events.filter((event) => event.all_day || Date.parse(event.end || event.start) >= now).map((event) => ({ id: event.id, title: event.title, context: [event.code, event.company].filter(Boolean).join(' · '), start: event.start, allDay: event.all_day, kind: calendarKinds[event.kind], kindCode: event.kind, tone: event.tone, color: event.color, detail: [calendarKinds[event.kind], event.location].filter(Boolean).join(' · '), href: event.href })), ...tasks.items.map((task) => ({ id: task.id, title: task.title, context: task.source, start: task.due_date, allDay: true, kind: 'Tâche', kindCode: 'task', tone: undefined, color: undefined, detail: 'Tâche', href: task.href }))].sort((a, b) => Date.parse(a.start) - Date.parse(b.start)).slice(0, 5)
  }, enabled: canCalendar || canActivity, staleTime: 60_000, refetchOnMount: 'always', retry: false })
  const activity = useQuery({ queryKey: ['activity', 'dashboard', userId], queryFn: () => dashboardService.activity(), enabled: canActivity, staleTime: 30_000, refetchOnMount: 'always', refetchInterval: 60_000, retry: false })
  const events = planning.data
  return <div className="dashboard-secondary">
    <section className="panel h-dashboard-card h-tone" data-tone="navy" aria-labelledby="planning-title">
      <div className="panel-heading dashboard-feed-heading"><h2 id="planning-title"><CalendarDays size={17} aria-hidden="true" />Mon planning</h2><span className="dashboard-feed-subtitle" title="Vos tâches et échéances · 7 prochains jours">Vos tâches et échéances · 7 prochains jours</span><Link to="/calendar" aria-label="Ouvrir le calendrier" className="panel-icon-link"><ArrowUpRight size={16} /></Link></div>
      {!canCalendar && !canActivity ? <HEmptyState icon={CalendarDays} title="Planning non accessible" description="Aucun module métier consultable." /> : planning.isPending ? <HLoadingIndicator label="Chargement du planning" /> : planning.isError ? <HEmptyState icon={CalendarDays} title="Planning indisponible" description={planning.error.message}><HButton size="small" onClick={() => void planning.refetch()}>Réessayer</HButton></HEmptyState> : !events?.length ? <HEmptyState icon={CalendarDays} title="Aucune échéance cette semaine" description="Vos tâches datées, remises, visites et soutenances apparaîtront ici." /> : <ul className="dashboard-feed dashboard-agenda">{events.map((event) => {
        const tag = appointmentKinds.data?.find((item) => item.code === event.kindCode)
        const isToday = parisToday(stamp(event.start)) === today
        return <li key={event.id}><Link to={event.href}>
          <time className="dashboard-agenda-date" dateTime={stamp(event.start).toISOString()} data-today={isToday}><strong>{new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', day: 'numeric' }).format(stamp(event.start))}</strong><span>{new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', month: 'short' }).format(stamp(event.start))}</span></time>
          <div><strong title={event.title}>{event.title}</strong><span className="dashboard-feed-context" title={event.context}>{event.context}</span><div className="dashboard-agenda-meta">{event.kindCode === 'task' ? <HBadge>{event.kind}</HBadge> : <HTag color={event.color || tag?.color} tone={event.tone || tag?.tone || (event.kindCode === 'hearing' ? 'violet' : event.kindCode === 'submission' ? 'pink' : 'blue')} title={appointmentKinds.error ? 'Couleur par défaut : réglages indisponibles.' : undefined}>{event.kind}</HTag>}<small><Clock3 size={11} aria-hidden="true" />{isToday ? 'Aujourd’hui' : new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', weekday: 'long' }).format(stamp(event.start))}{!event.allDay && ` · ${new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit' }).format(stamp(event.start))}`}</small></div></div>
          <ArrowUpRight size={14} aria-hidden="true" />
        </Link></li>
      })}</ul>}
    </section>
    <section className="panel h-dashboard-card h-tone" data-tone="navy" aria-labelledby="activity-title">
      <div className="panel-heading"><h2 id="activity-title"><Activity size={17} aria-hidden="true" />Activité récente</h2><HBadge>Équipe</HBadge></div>
      {!canActivity ? <HEmptyState icon={ListTodo} title="Activité non accessible" description="Aucun module métier consultable." /> : activity.isPending ? <HLoadingIndicator label="Chargement de l’activité récente" /> : activity.isError ? <HEmptyState icon={Activity} title="Activité indisponible" description={activity.error.message}><HButton size="small" onClick={() => void activity.refetch()}>Réessayer</HButton></HEmptyState> : !activity.data?.items.length ? <HEmptyState icon={ListTodo} title="Aucune activité récente" description="Les notes et événements de vos modules apparaîtront ici." /> : <ul className="dashboard-feed dashboard-feed--activity">{activity.data.items.map((event) => {
        const Icon = activityIcons[event.type] || Activity
        return <li key={event.id}><Link to={event.href}>
          <span className="dashboard-feed-icon dashboard-activity-icon" aria-hidden="true"><Icon size={14} /></span>
          <div><div className="dashboard-activity-title"><strong title={event.body}>{event.body || 'Fiche mise à jour'}</strong></div><span className="dashboard-feed-context" title={event.source}>{event.source}</span><small>{event.author} · <time dateTime={stamp(event.created).toISOString()}>{dateLabel(event.created)}</time></small></div>
          <ArrowUpRight size={14} aria-hidden="true" />
        </Link></li>
      })}</ul>}
    </section>
  </div>
}
