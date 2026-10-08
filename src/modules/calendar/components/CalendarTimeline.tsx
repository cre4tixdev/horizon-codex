import { Link } from 'react-router'
import { CalendarDays, Eye, Flag, Map, Presentation, CircleCheck } from 'lucide-react'
import { calendarKinds, type CalendarSchedule } from '../schemas/events'
import type { CalendarPeriod } from '../periods'
import { timelinePosition, timelineTicks } from '../timeline'
import { displayInstant } from '../../../shared/time/zonedDate'
const icons = { publication: Map, visit: Eye, submission: Flag, hearing: Presentation, result: CircleCheck }
export function CalendarTimeline({ schedule, start, end, period }: { schedule: CalendarSchedule; start: Date; end: Date; period: CalendarPeriod }) {
  const ticks = timelineTicks(start, end, period)
  const trackWidth = ticks.length * (period === 'year' ? 90 : period === 'quarter' ? 70 : 44)
  return <div className="calendar-timeline-scroll"><div className="calendar-timeline" style={{ minWidth: `calc(var(--timeline-label-width, 240px) + ${trackWidth}px)` }}>
    <div className="calendar-timeline-header"><strong>Appels d’offres</strong><div className="calendar-timeline-track">{ticks.map((tick) => <time key={tick.start.toISOString()} style={{ left: `${timelinePosition(tick.start.toISOString(), start, end)}%`, width: `${timelinePosition(tick.end.toISOString(), start, end) - timelinePosition(tick.start.toISOString(), start, end)}%` }} dateTime={tick.start.toISOString()}>{period === 'year' ? tick.start.toLocaleDateString('fr-FR', { month: 'short' }) : <><span>{tick.start.toLocaleDateString('fr-FR', { weekday: 'short' })}</span>{tick.start.getDate()}{period === 'quarter' && `/${tick.start.getMonth() + 1}`}</>}</time>)}</div></div>
    {schedule.periods.map((row) => <div className="calendar-timeline-row" key={row.id}><Link className="calendar-timeline-identity" to={row.href}><strong>{row.title}</strong><span>{row.code || 'Sans référence'} · {row.company}</span></Link><div className="calendar-timeline-track">
      {ticks.map((tick) => <span aria-hidden="true" className="calendar-timeline-gridline" key={tick.start.toISOString()} style={{ left: `${timelinePosition(tick.start.toISOString(), start, end)}%` }} />)}
      {row.start && row.end && <span className="calendar-timeline-period" title="Période de réponse : publication → remise" style={{ left: `${timelinePosition(row.start, start, end)}%`, width: `${Math.max(0, timelinePosition(row.end, start, end) - timelinePosition(row.start, start, end))}%` }} />}
      {schedule.items.filter((item) => item.source_record_id === row.source_record_id).map((item) => { const Icon = icons[item.kind]; const label = `${calendarKinds[item.kind]} · ${item.title} · ${displayInstant(item.start, item.timezone)} (${item.timezone})${item.location ? ` · ${item.location}` : ''}`; return <Link className="calendar-timeline-event" data-kind={item.kind} key={item.id} to={item.href} title={label} aria-label={label} style={{ left: `${timelinePosition(item.start, start, end)}%` }}><Icon size={13} /></Link> })}
    </div></div>)}
    {!schedule.periods.length && <p className="calendar-empty"><CalendarDays size={16} />Aucun appel d’offres sur cette période.</p>}
  </div></div>
}
