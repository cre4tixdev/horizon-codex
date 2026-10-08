import type { CalendarPeriod } from './periods'
export function timelinePosition(value: string, start: Date, end: Date): number {
  return Math.max(0, Math.min(100, (Date.parse(value) - start.getTime()) / (end.getTime() - start.getTime()) * 100))
}
export function timelineTicks(start: Date, end: Date, period: CalendarPeriod) {
  const ticks: { start: Date; end: Date }[] = []
  let current = new Date(start)
  while (current < end) {
    const next = new Date(current)
    if (period === 'year') next.setMonth(next.getMonth() + 1)
    else next.setDate(next.getDate() + (period === 'quarter' ? 7 : 1))
    ticks.push({ start: current, end: next > end ? end : next })
    current = next
  }
  return ticks
}
