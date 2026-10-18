import { Fragment, type ReactNode } from 'react'

export type CalendarGridDay = { date: string; holiday?: string | undefined }
/** Shared month/week frame; modules provide only the contents of each day. */
export function HCalendarGrid<T extends CalendarGridDay>({ days, renderDay, padded = true, compact = false, label, renderWeekSummary }: { days: readonly T[]; renderDay: (day: T) => ReactNode; padded?: boolean; compact?: boolean; label?: string; renderWeekSummary?: (index: number) => ReactNode }) {
  const leading = padded && days.length ? (new Date(days[0]!.date).getUTCDay() + 6) % 7 : 0
  const trailing = padded ? (7 - (leading + days.length) % 7) % 7 : 0
  const today = new Date().toLocaleDateString('sv-SE')
  const cells = [
    ...Array.from({ length: leading }, (_, i) => <div className="calendar-day calendar-day--empty" key={`leading-${i}`} />),
    ...days.map((day) => {
      const value = new Date(day.date), weekend = [0, 6].includes(value.getUTCDay())
      return <div className="calendar-day" key={day.date} data-date={day.date} data-weekend={weekend} data-holiday={Boolean(day.holiday)} data-today={day.date === today} title={day.holiday ? `${day.holiday} · Jour férié (France métropolitaine)` : weekend ? 'Week-end' : undefined}>
        <div className="calendar-day-heading"><time dateTime={day.date}>{value.getUTCDate()}</time>{day.holiday && !compact && <span className="calendar-holiday-label" title={day.holiday}>{day.holiday}</span>}</div>
        {renderDay(day)}
      </div>
    }),
    ...Array.from({ length: trailing }, (_, i) => <div className="calendar-day calendar-day--empty" key={`trailing-${i}`} />),
  ]
  return <div className="calendar-grid" data-compact={compact || undefined} data-week-summary={Boolean(renderWeekSummary) || undefined} aria-label={label}>
    {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, index) => <span key={day} className="calendar-weekday" data-weekend={index > 4}>{day}</span>)}
    {renderWeekSummary && <span className="calendar-weekday calendar-week-summary-heading">Total</span>}
    {renderWeekSummary ? Array.from({ length: cells.length / 7 }, (_, index) => <Fragment key={index}>{cells.slice(index * 7, index * 7 + 7)}<div className="calendar-week-summary">{renderWeekSummary(index)}</div></Fragment>) : cells}
  </div>
}
