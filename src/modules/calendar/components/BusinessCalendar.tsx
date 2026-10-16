import { CalendarTimeline } from './CalendarTimeline'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { useCrmRealtime } from '../../crm/hooks/useCrmRealtime'
import { useCrmAccess } from '../../crm/hooks/useCrm'
import { useState, type CSSProperties } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useCalendarAccess } from '../hooks/useCalendarAccess'
import { ManualEventDialog } from './ManualEventDialog'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { HButton } from '../../../shared/ui/HButton'
import { useCalendarKindStyle } from '../hooks/useCalendarKindStyle'
import { HTag } from '../../../shared/ui/HTag'
import { calendarService } from '../services/CalendarService'
import { calendarKinds, type CalendarQuery } from '../schemas/events'
import { periodBounds, shiftPeriod, type CalendarPeriod } from '../periods'
import { displayInstant } from '../../../shared/time/zonedDate'
const modes: { value: CalendarPeriod; label: string }[] = [{ value: 'week', label: 'Semaine' }, { value: 'month', label: 'Mois' }, { value: 'quarter', label: 'Trimestre' }, { value: 'year', label: 'Année' }]
export function BusinessCalendar({ scope = 'all', search = '', archived = false, company = '', owner = '', status = '', preparationStatus = '', tag = '', layout = 'calendar' }: Omit<CalendarQuery, 'from' | 'to'> & { layout?: 'calendar' | 'timeline' }) {
  const { canRead } = useCrmAccess()
  const { canWrite } = useCalendarAccess()
  const [params, setParams] = useSearchParams()
  const [creating, setCreating] = useState<string>()
  const eventId = params.get('event') || undefined
  const closeEvent = () => { setCreating(undefined); if (eventId) { const next = new URLSearchParams(params); next.delete('event'); setParams(next, { replace: true }) } }
  const kinds = useCalendarKindStyle(canRead)
  const realtimeError = useCrmRealtime(canRead && scope !== 'tenders')
  const [anchor, setAnchor] = useState(() => new Date())
  const [period, setPeriod] = useState<CalendarPeriod>('month')
  const { start, end } = periodBounds(anchor, period)
  const options = { from: start.toISOString(), to: end.toISOString(), scope, search, archived, company, owner, status, preparationStatus, tag }
  const events = useQuery({ queryKey: ['calendar', options], queryFn: () => calendarService.schedule(options), retry: false, refetchInterval: 30_000 })
  const months = Array.from({ length: period === 'quarter' ? 3 : period === 'year' ? 12 : 1 }, (_, index) => new Date(start.getFullYear(), start.getMonth() + index, 1))
  const label = period === 'week' ? `${start.toLocaleDateString('fr-FR')} – ${new Date(end.getTime() - 1).toLocaleDateString('fr-FR')}` : period === 'quarter' ? `Trimestre ${Math.floor(start.getMonth() / 3) + 1} · ${start.getFullYear()}` : period === 'year' ? String(start.getFullYear()) : start.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  return <section className="business-calendar" aria-label="Calendrier des événements métier"><div className="calendar-navigation"><div className="calendar-toolbar"><div><HButton size="icon" aria-label="Période précédente" onClick={() => setAnchor(shiftPeriod(anchor, period, -1))}><ChevronLeft size={14} /></HButton><strong>{label}</strong><HButton size="icon" aria-label="Période suivante" onClick={() => setAnchor(shiftPeriod(anchor, period, 1))}><ChevronRight size={14} /></HButton><HButton size="small" onClick={() => setAnchor(new Date())}>Aujourd’hui</HButton></div><div className="contact-view-switch" role="group" aria-label="Période du calendrier">{modes.map((mode) => <HButton key={mode.value} aria-pressed={period === mode.value} onClick={() => setPeriod(mode.value)}>{mode.label}</HButton>)}</div>{layout === 'calendar' && <HButton disabled={!canWrite} title={canWrite ? 'Ajouter un événement' : 'Le droit de créer des événements Calendrier n’est pas actif pour votre compte.'} onClick={() => setCreating(new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()))}><Plus size={14} />Ajouter un événement</HButton>}</div>
    <div className="calendar-legend" aria-label="Légende des événements">{(Object.keys(calendarKinds) as (keyof typeof calendarKinds)[]).filter((kind) => layout !== 'timeline' || !['inventory', 'event', 'leave'].includes(kind)).map((kind) => { const appearance = kinds.styleFor(kind); return <span key={kind} className="h-tone" data-tone={appearance.tone} style={appearance.style}>{calendarKinds[kind]}</span> })}{layout === 'timeline' ? <span className="h-tone" data-tone="violet">Période</span> : <><span className="calendar-day-key" data-weekend="true">Week-end</span><span className="calendar-day-key" data-holiday="true">Jour férié · France métropolitaine</span></>}</div>
    </div>
    {realtimeError && <p role="alert" className="field-error">{realtimeError}</p>}
    {events.error && <p role="alert" className="field-error">{events.error.message}<HButton size="small" onClick={() => void events.refetch()}>Réessayer</HButton></p>}{events.isPending && <HLoadingIndicator label="Chargement du calendrier" />}
    {kinds.error && <p role="alert" className="field-error">Couleurs des rendez-vous indisponibles ; couleurs par défaut affichées.<HButton size="small" onClick={() => void kinds.refetch()}>Réessayer</HButton></p>}
    {layout === 'timeline' && events.data && <CalendarTimeline schedule={events.data} start={start} end={end} period={period} />}
    {layout === 'calendar' && <div className="calendar-months" data-period={period}>{months.map((month) => {
      const days = period === 'week' ? Array.from({ length: 7 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index)) : Array.from({ length: new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate() }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index + 1))
      return <div className="calendar-month" key={month.toISOString()}>{months.length > 1 && <h3>{period === 'year' ? <button type="button" className="calendar-month-link" aria-label={`Ouvrir ${month.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`} onClick={() => { setAnchor(month); setPeriod('month') }}>{month.toLocaleDateString('fr-FR', { month: 'long' })}</button> : month.toLocaleDateString('fr-FR', { month: 'long' })}</h3>}<div className="calendar-grid">{['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => <span key={day} className="calendar-weekday" data-weekend={day === 'Sam' || day === 'Dim'}>{day}</span>)}{period !== 'week' && Array.from({ length: (month.getDay() + 6) % 7 }, (_, index) => <div className="calendar-day calendar-day--empty" key={`empty-${index}`} />)}{days.map((day) => {
        const dayDate = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`
        const holiday = events.data?.holidays[dayDate], weekend = day.getDay() === 0 || day.getDay() === 6
        const next = new Date(day); next.setDate(next.getDate() + 1)
        const items = (events.data?.items || []).filter((item) => { if (item.all_day) return item.start.slice(0, 10) === `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`; return new Date(item.start) < next && (new Date(item.start) >= day || Boolean(item.end && new Date(item.end) > day)) })
        return <div className="calendar-day" key={day.toISOString()} data-date={dayDate} data-weekend={weekend} data-holiday={Boolean(holiday)} title={holiday ? `${holiday} · Jour férié (France métropolitaine)` : weekend ? 'Week-end' : undefined} data-today={day.toDateString() === new Date().toDateString()}>{canWrite && <button type="button" className="calendar-day-add" aria-label={`Ajouter un événement le ${day.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`} onClick={() => setCreating(dayDate)} />}<div className="calendar-day-heading"><time dateTime={day.toISOString()}>{day.getDate()}</time>{holiday && <span className="calendar-holiday-label" title={holiday}>{holiday}</span>}</div>{items.map((item) => { const base = kinds.styleFor(item.kind); const appearance = ['event', 'leave'].includes(item.kind) ? { tone: item.tone || base.tone, color: item.color, style: item.color ? { '--tag-color': item.color } as CSSProperties : undefined } : base; return <Link key={item.id} to={item.href} className="calendar-event h-tone" data-kind={item.kind} data-tone={appearance.tone} style={appearance.style} aria-label={`${calendarKinds[item.kind]} · ${item.code} · ${item.title}`} title={`${calendarKinds[item.kind]} · ${item.title} · ${displayInstant(item.start, item.timezone)} (${item.timezone})${item.location ? ` · ${item.location}` : ''}`}><HTag tone={appearance.tone} color={appearance.color}>{calendarKinds[item.kind]}</HTag><span className="calendar-event-label"><span className="calendar-event-code">{item.code || item.title}</span>{item.code && <span className="calendar-event-title"> · {item.title}</span>}</span>{!item.all_day && <small>{displayInstant(item.start, item.timezone)} · {item.timezone}</small>}</Link> })}</div>
      })}{period !== 'week' && Array.from({ length: (7 - ((month.getDay() + 6) % 7 + days.length) % 7) % 7 }, (_, index) => <div className="calendar-day calendar-day--empty" key={`trailing-${index}`} />)}</div></div>
    })}</div>}
    {(creating || eventId) && <ManualEventDialog id={eventId} initialDate={creating} onClose={closeEvent} />}
    {layout === 'calendar' && events.data && !events.data.items.length && <p className="calendar-empty"><CalendarDays size={16} />Aucun événement sur cette période.</p>}
  </section>
}
