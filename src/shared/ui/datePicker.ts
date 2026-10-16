export type DatePickerKind = 'date' | 'month' | 'datetime-local'
export const monthNames = Array.from({ length: 12 }, (_, month) => new Date(2024, month, 1).toLocaleDateString('fr-FR', { month: 'long' }))
export function civilDate(value: string): Date | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number(value.slice(0, 4)) < 1) return undefined
  const date = new Date(`${value}T12:00:00`)
  return Number.isFinite(date.getTime()) && dateString(date) === value ? date : undefined
}
export function dateString(date: Date) { return `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` }
export function calendarMonth(value: string, today = new Date()) { return civilDate(value.slice(0, 10)) ? value.slice(0, 7) : /^\d{4}-(0[1-9]|1[0-2])$/.test(value.slice(0, 7)) ? value.slice(0, 7) : dateString(today).slice(0, 7) }
export function shiftDate(value: string, days: number) { const date = civilDate(value)!; date.setDate(date.getDate() + days); return dateString(date) }
export function shiftMonth(value: string, delta: number) { const date = civilDate(`${value.slice(0, 7)}-01`)!; date.setMonth(date.getMonth() + delta); return dateString(date).slice(0, 7) }
export function moveCalendarFocus(value: string, key: string, shift = false) {
  const date = civilDate(value)!
  if (key === 'ArrowLeft') return shiftDate(value, -1)
  if (key === 'ArrowRight') return shiftDate(value, 1)
  if (key === 'ArrowUp') return shiftDate(value, -7)
  if (key === 'ArrowDown') return shiftDate(value, 7)
  const weekday = (date.getDay() + 6) % 7
  if (key === 'Home') return shiftDate(value, -weekday)
  if (key === 'End') return shiftDate(value, 6 - weekday)
  const month = shiftMonth(value, (key === 'PageUp' ? -1 : 1) * (shift ? 12 : 1)), last = new Date(`${month}-01T12:00:00`); last.setMonth(last.getMonth() + 1, 0)
  return `${month}-${String(Math.min(date.getDate(), last.getDate())).padStart(2, '0')}`
}
export function monthDays(month: string) {
  const first = civilDate(`${month}-01`)!, offset = (first.getDay() + 6) % 7, last = new Date(first); last.setMonth(last.getMonth() + 1, 0)
  const count = Math.ceil((offset + last.getDate()) / 7) * 7
  return Array.from({ length: count }, (_, index) => shiftDate(`${month}-01`, index - offset))
}
export function dateAllowed(value: string, kind: DatePickerKind, min = '', max = '', step: string | number | undefined = undefined, baseValue = '') {
  if (!value) return true
  const numeric = (v: string) => kind !== 'month' && !civilDate(v.slice(0, 10)) ? Number.NaN : kind === 'month' ? /^\d{4}-(0[1-9]|1[0-2])$/.test(v) ? Number(v.slice(0, 4)) * 12 + Number(v.slice(5, 7)) - 1 : Number.NaN : Date.parse(`${v}${kind === 'date' ? 'T00:00:00' : ''}Z`)
  const number = numeric(value), minimum = numeric(min), maximum = numeric(max)
  if (!Number.isFinite(number) || Number.isFinite(minimum) && number < minimum || Number.isFinite(maximum) && number > maximum) return false
  if (step === 'any') return true
  const defaultStep = kind === 'datetime-local' ? 60 : 1, interval = Number(step) > 0 && Number.isFinite(Number(step)) ? Number(step) : defaultStep, unit = kind === 'date' ? 86400000 : kind === 'month' ? 1 : 1000
  const base = Number.isFinite(minimum) ? minimum : Number.isFinite(numeric(baseValue)) ? numeric(baseValue) : numeric(kind === 'month' ? '1970-01' : kind === 'date' ? '1970-01-01' : '1970-01-01T00:00')
  const distance = (number - base) / unit
  return Math.abs(distance / interval - Math.round(distance / interval)) < 1e-7
}
