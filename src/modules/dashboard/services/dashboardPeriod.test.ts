import { describe, expect, it } from 'vitest'
import { dashboardPeriodRange, parisToday, readDashboardDate, readDashboardPeriod } from './dashboardPeriod'

describe('Périodes du dashboard', () => {
  it('prend le jour de Paris même lorsque UTC est encore la veille', () => {
    expect(parisToday(new Date('2026-12-31T23:30:00Z'))).toBe('2027-01-01')
  })
  it('couvre le mois calendaire, y compris une année bissextile', () => {
    expect(dashboardPeriodRange('month', '2028-02-15')).toMatchObject({ start: '2028-02-01', end: '2028-02-29', previous: '2028-01-01', next: '2028-03-01', label: 'février 2028' })
  })
  it('couvre un trimestre complet et passe correctement à l’année suivante', () => {
    expect(dashboardPeriodRange('quarter', '2026-11-05')).toMatchObject({ start: '2026-10-01', end: '2026-12-31', next: '2027-01-01', previous: '2026-07-01', label: 'T4 2026' })
  })
  it('couvre l’année calendaire sans dépendre du changement d’heure', () => {
    expect(dashboardPeriodRange('year', '2026-03-29')).toMatchObject({ start: '2026-01-01', end: '2026-12-31', previous: '2025-01-01', next: '2027-01-01', label: '2026' })
  })
  it('ignore les paramètres URL malformés et les dates impossibles', () => {
    expect(readDashboardPeriod('week')).toBe('month')
    expect(readDashboardDate('2026-02-30', '2026-10-11')).toBe('2026-10-11')
    expect(readDashboardDate('not-a-date', '2026-10-11')).toBe('2026-10-11')
    expect(readDashboardDate('2028-02-29', '2026-10-11')).toBe('2028-02-29')
  })
})
