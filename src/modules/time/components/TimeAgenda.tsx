import { Link } from 'react-router'
import { HCalendarGrid } from '../../../shared/ui/HCalendarGrid'
import { HTableViewport } from '../../../shared/ui/HTableViewport'
import { addDays, dateLabel, duration, monday, overviewStates, type TimeOverview, type TimeOverviewRow } from '../schemas/time'
import { TimeStatus } from './TimeStatus'

export function TimeAgenda({ data, row, history, query }: { data: TimeOverview; row: TimeOverviewRow; history: boolean; query: string }) {
  const today = data.today, state = { timeListQuery: query }
  const weekLink = (date: string) => {
    const start = monday(date), period = row.cells.find((cell) => cell.key === start)
    if (period?.sheets.length === 1) return `/time-reporting/sheets/${period.sheets[0]!.id}`
    return date <= today && !history && row.work_type !== 'production' ? `/time-reporting?area=own&view=week&date=${start}` : undefined
  }
  const monthLink = (date: string) => { const params = new URLSearchParams(query); params.set('area', 'own'); params.set('view', 'month'); params.set('month', date.slice(0, 7)); params.set('date', date); params.delete('page'); return `/time-reporting?${params}` }
  if (data.view === 'year') return <div className="time-agenda-year" aria-label="Agenda annuel de mes temps">{data.periods.map((period, index) => {
    const cell = row.cells[index]!, days = row.days.filter((day) => day.date >= period.start && day.date <= period.end)
    return <section className="time-agenda-year-month" key={period.key}>
      <Link className="time-agenda-month-heading" to={monthLink(period.start)} aria-label={`Ouvrir ${new Date(period.start).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' })}`}><strong>{new Date(period.start).toLocaleDateString('fr-FR', { month: 'long', timeZone: 'UTC' })}</strong><span>{duration(cell.minutes || 0)}</span></Link>
      <div className="time-agenda-month-state"><TimeStatus status={cell.status} />{cell.total_weeks > 0 && <small>{cell.validated_weeks}/{cell.total_weeks} validées</small>}</div>
      <HCalendarGrid compact days={days} renderDay={(day) => day.minutes > 0 ? <span className="time-agenda-dot" data-state={day.sheet_status} title={`${duration(day.minutes)} · ${day.sheet_status ? overviewStates[day.sheet_status] : ''}`} /> : null} />
    </section>
  })}</div>
  return <div className="time-agenda-month" aria-label="Agenda mensuel de mes temps">
    <HTableViewport className="data-table-scroll"><HCalendarGrid days={row.days} renderWeekSummary={(index) => {
      const period = data.periods[index]!, cell = row.cells[index]!, target = weekLink(period.start)
      const content = <><strong>{cell.status === 'future' && !cell.minutes ? '—' : duration(cell.minutes || 0)}</strong><TimeStatus status={cell.status} /></>
      return target ? <Link to={target} state={state} aria-label={`Total semaine du ${dateLabel(period.start)} au ${dateLabel(period.end)}`}>{content}</Link> : <span>{content}</span>
    }} renderDay={(day) => {
      const target = day.date <= today ? weekLink(day.date) : undefined, status = day.sheet_status, emptyLabel = day.holiday || (day.absent ? 'Absence' : day.weekend ? '' : day.sheet_status ? day.sheet_status === 'draft' ? 'Continuer' : '' : day.date > today ? '' : history ? '' : 'Saisir')
      return <>{target && <Link className="calendar-day-add" to={target} state={state} aria-label={`${day.sheet_status ? 'Ouvrir' : 'Saisir'} la semaine du ${dateLabel(monday(day.date))} au ${dateLabel(addDays(monday(day.date), 6))} · ${dateLabel(day.date)}`} />}{day.minutes > 0 ? <div className="time-agenda-hours" data-state={status}><strong>{duration(day.minutes)}</strong>{status && <TimeStatus status={status} />}</div> : <span className="time-agenda-empty">{day.holiday ? '' : emptyLabel}</span>}</>
    }} /></HTableViewport>

  </div>
}
