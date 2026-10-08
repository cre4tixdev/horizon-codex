function parts(date: Date, timezone: string) {
  const values = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(date).map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}:${values.second}`
}
export function zonedInput(instant: string, timezone: string) { return instant ? parts(new Date(instant.replace(' ', 'T')), timezone).slice(0, 16) : '' }
export function zonedInstant(value: string, timezone: string) {
  if (!value) return ''
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error('Date et heure invalides.')
  const wallTime = `${value}:00`
  const wall = Date.parse(`${wallTime}Z`)
  if (!Number.isFinite(wall) || new Date(wall).toISOString().slice(0, 19) !== wallTime) throw new Error('Date et heure invalides.')
  let instant = wall
  for (let attempt = 0; attempt < 3; attempt++) instant += wall - Date.parse(`${parts(new Date(instant), timezone)}Z`)
  if (parts(new Date(instant), timezone) !== wallTime) throw new Error('Cette heure n’existe pas dans ce fuseau (changement d’heure).')
  return new Date(instant).toISOString()
}
export function displayInstant(value: string, timezone = 'Europe/Paris') { return value ? new Intl.DateTimeFormat('fr-FR', { timeZone: timezone, dateStyle: 'short', timeStyle: 'short' }).format(new Date(value.replace(' ', 'T'))) : '—' }

export function displayDate(value: string, timezone = 'Europe/Paris') { return value ? new Intl.DateTimeFormat('fr-FR', { timeZone: timezone, dateStyle: 'short' }).format(new Date(value.replace(' ', 'T'))) : '—' }
