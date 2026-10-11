export type DashboardPeriod = 'month' | 'quarter' | 'year'

export function parisToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now)
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value
  return `${part('year')}-${part('month')}-${part('day')}`
}

export function readDashboardPeriod(value: string | null): DashboardPeriod {
  return value === 'quarter' || value === 'year' ? value : 'month'
}

export function readDashboardDate(value: string | null, fallback: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return fallback
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : fallback
}

export function dashboardPeriodRange(period: DashboardPeriod, anchor: string) {
  const date = new Date(`${anchor}T00:00:00Z`)
  const year = date.getUTCFullYear()
  const month = period === 'year' ? 0 : period === 'quarter' ? Math.floor(date.getUTCMonth() / 3) * 3 : date.getUTCMonth()
  const months = period === 'year' ? 12 : period === 'quarter' ? 3 : 1
  const start = new Date(Date.UTC(year, month, 1))
  const end = new Date(Date.UTC(year, month + months, 0))
  const format = new Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' })
  const label = period === 'year' ? String(year) : period === 'quarter' ? `T${month / 3 + 1} ${year}` : new Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC', month: 'long', year: 'numeric' }).format(start)
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10), label, description: `Du ${format.format(start)} au ${format.format(end)}`, previous: new Date(Date.UTC(year, month - months, 1)).toISOString().slice(0, 10), next: new Date(Date.UTC(year, month + months, 1)).toISOString().slice(0, 10) }
}
