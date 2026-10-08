export type CalendarPeriod = 'week' | 'month' | 'quarter' | 'year'
export function periodBounds(anchor: Date, period: CalendarPeriod) {
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate())
  if (period === 'week') start.setDate(start.getDate() - (start.getDay() + 6) % 7)
  else { start.setDate(1); if (period === 'quarter') start.setMonth(Math.floor(start.getMonth() / 3) * 3); if (period === 'year') start.setMonth(0) }
  const end = new Date(start)
  if (period === 'week') end.setDate(end.getDate() + 7)
  else end.setMonth(end.getMonth() + (period === 'month' ? 1 : period === 'quarter' ? 3 : 12))
  return { start, end }
}
export function shiftPeriod(anchor: Date, period: CalendarPeriod, direction: number) {
  const { start } = periodBounds(anchor, period)
  if (period === 'week') start.setDate(start.getDate() + direction * 7)
  else start.setMonth(start.getMonth() + direction * (period === 'month' ? 1 : period === 'quarter' ? 3 : 12))
  return start
}
