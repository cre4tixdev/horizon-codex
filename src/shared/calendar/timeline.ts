import { extraTagColors } from '../schemas/tagTone'
export const shiftDate = (date: string, days: number) => new Date(Date.parse(date) + days * 86400000).toISOString().slice(0, 10)
export function timelinePeriod(date: string, view: 'week' | 'month') {
  const value = new Date(`${date}T12:00:00Z`)
  const first = view === 'week' ? shiftDate(date, -((value.getUTCDay() + 6) % 7)) : date.slice(0, 7) + '-01'
  const last = view === 'week' ? shiftDate(first, 6) : new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + 1, 0)).toISOString().slice(0, 10)
  return { first, last }
}
export function timelinePosition(first: string, count: number, start: string, end: string, startHalf: 'am' | 'pm', endHalf: 'am' | 'pm') {
  const startSlot = Math.round((Date.parse(start) - Date.parse(first)) / 86400000) * 2 + (startHalf === 'pm' ? 1 : 0)
  const endSlot = Math.round((Date.parse(end) - Date.parse(first)) / 86400000) * 2 + (endHalf === 'pm' ? 2 : 1)
  if (endSlot <= 0 || startSlot >= count * 2 || endSlot <= startSlot) return null
  return { gridColumn: `${Math.max(0, startSlot) + 1} / ${Math.min(count * 2, endSlot) + 1}` }
}

/** Pseudo-random palette assignment, stable across sorting, filtering and reloads. */
export function timelineColor(resource: string) {
  let hash = 0
  for (const character of resource) hash = (Math.imul(hash, 31) + character.charCodeAt(0)) | 0
  return extraTagColors[(hash >>> 0) % extraTagColors.length]!.color
}
