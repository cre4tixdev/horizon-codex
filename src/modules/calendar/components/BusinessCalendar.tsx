import { CalendarTimeline } from './CalendarTimeline'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { useCrmRealtime } from '../../crm/hooks/useCrmRealtime'
import { useCrmAccess } from '../../crm/hooks/useCrm'
import { useState } from 'react'
import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { HButton } from '../../../shared/ui/HButton'
import { HCombobox } from '../../../shared/ui/HCombobox'
import { HTag } from '../../../shared/ui/HTag'
import { calendarService } from '../services/CalendarService'
import { calendarKinds, type CalendarQuery } from '../schemas/events'
import { periodBounds, shiftPeriod, type CalendarPeriod } from '../periods'
import { displayInstant } from '../../../shared/time/zonedDate'
const modes = [{ value: 'week', label: 'Semaine' }, { value: 'month', label: 'Mois' }, { value: 'quarter', label: 'Trimestre' }, { value: 'year', label: 'Année' }]
export function BusinessCalendar({ scope = 'all', search = '', archived = false, company = '', owner = '', status = '', preparationStatus = '', tag = '', layout = 'calendar' }: Omit<CalendarQuery, 'from' | 'to'> & { layout?: 'calendar' | 'timeline' }) {
  const { canRead } = useCrmAccess()
  const realtimeError = useCrmRealtime(canRead && scope !== 'tenders')
  const [anchor, setAnchor] = useState(() => new Date())
  const [period, setPeriod] = useState<CalendarPeriod>('month')
  const { start, end } = periodBounds(anchor, period)
  const options = { from: start.toISOString(), to: end.toISOString(), scope, search, archived, company, owner, status, preparationStatus, tag }
  const events = useQuery({ queryKey: ['calendar', options], queryFn: () => calendarService.schedule(options), retry: false, refetchInterval: 30_000 })
  const months = Array.from({ length: period === 'quarter' ? 3 : period === 'year' ? 12 : 1 }, (_, index) => new Date(start.getFullYear(), start.getMonth() + index, 1))
  const label = period === 'week' ? `${start.toLocaleDateString('fr-FR')} – ${new Date(end.getTime() - 1).toLocaleDateString('fr-FR')}` : period === 'quarter' ? `Trimestre ${Math.floor(start.getMonth() / 3) + 1} · ${start.getFullYear()}` : period === 'year' ? String(start.getFullYear()) : start.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  return <section className="business-calendar" aria-label="Calendrier des événements métier"><div className="calendar-toolbar"><div><HButton size="icon" aria-label="Période précédente" onClick={() => setAnchor(shiftPeriod(anchor, period, -1))}><ChevronLeft size={14} /></HButton><strong>{label}</strong><HButton size="icon" aria-label="Période suivante" onClick={() => setAnchor(shiftPeriod(anchor, period, 1))}><ChevronRight size={14} /></HButton><HButton size="small" onClick={() => setAnchor(new Date())}>Aujourd’hui</HButton></div><HCombobox label="Période du calendrier" value={period} required showCodes={false} options={modes} onChange={(value) => { if (value === 'week' || value === 'month' || value === 'quarter' || value === 'year') setPeriod(value) }} /></div>
    {realtimeError && <p role="alert" className="field-error">{realtimeError}</p>}
    {events.error && <p role="alert" className="field-error">{events.error.message}<HButton size="small" onClick={() => void events.refetch()}>Réessayer</HButton></p>}{events.isPending && <HLoadingIndicator label="Chargement du calendrier" />}
    {layout === 'timeline' && events.data && <><div className="calendar-timeline-legend"><span data-kind="publication">Publication</span><span data-kind="visit">Visite</span><span data-kind="hearing">Soutenance</span><span data-kind="submission">Remise</span><span data-kind="period">Période</span></div><CalendarTimeline schedule={events.data} start={start} end={end} period={period} /></>}
    {layout === 'calendar' && <div className="calendar-months" data-period={period}>{months.map((month) => {
      const days = period === 'week' ? Array.from({ length: 7 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index)) : Array.from({ length: new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate() }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index + 1))
      return <div className="calendar-month" key={month.toISOString()}>{months.length > 1 && <h3>{month.toLocaleDateString('fr-FR', { month: 'long' })}</h3>}<div className="calendar-grid">{['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => <span key={day} className="calendar-weekday">{day}</span>)}{period !== 'week' && Array.from({ length: (month.getDay() + 6) % 7 }, (_, index) => <div className="calendar-day calendar-day--empty" key={`empty-${index}`} />)}{days.map((day) => {
        const next = new Date(day); next.setDate(next.getDate() + 1)
        const items = (events.data?.items || []).filter((item) => { if (item.all_day) return item.start.slice(0, 10) === `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`; return new Date(item.start) < next && (new Date(item.start) >= day || Boolean(item.end && new Date(item.end) > day)) })
        return <div className="calendar-day" key={day.toISOString()} data-today={day.toDateString() === new Date().toDateString()}><time dateTime={day.toISOString()}>{day.getDate()}</time>{items.map((item) => <Link key={item.id} to={item.href} className="calendar-event" data-kind={item.kind} title={`${calendarKinds[item.kind]} · ${item.title} · ${displayInstant(item.start, item.timezone)} (${item.timezone})${item.location ? ` · ${item.location}` : ''}`}><HTag tone={item.kind === 'submission' ? 'pink' : item.kind === 'hearing' ? 'violet' : 'blue'}>{calendarKinds[item.kind]}</HTag><span>#{item.code} · {item.title}</span>{!item.all_day && <small>{displayInstant(item.start, item.timezone)} · {item.timezone}</small>}</Link>)}</div>
      })}</div></div>
    })}</div>}
    {layout === 'calendar' && events.data && !events.data.items.length && <p className="calendar-empty"><CalendarDays size={16} />Aucun événement sur cette période.</p>}
  </section>
}
