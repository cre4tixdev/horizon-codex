import { describe, expect, it } from 'vitest'
import { calendarMonth, civilDate, dateAllowed, dateString, monthDays, moveCalendarFocus, shiftDate, shiftMonth } from './datePicker'
describe('Calendrier Horizon partagé', () => {
  it('valide les jours civils et les années bissextiles sans convertir la zone', () => {
    expect(civilDate('2028-02-29')).toBeDefined(); expect(civilDate('2026-02-29')).toBeUndefined()
    expect(dateString(civilDate('2026-10-25')!)).toBe('2026-10-25'); expect(shiftDate('2026-10-25', 1)).toBe('2026-10-26')
    expect(calendarMonth('2026-10-19T08:30')).toBe('2026-10'); expect(calendarMonth('2026-04')).toBe('2026-04')
  })
  it('construit des semaines lundi–dimanche avec les jours adjacents', () => {
    const days = monthDays('2026-10'); expect(days.length % 7).toBe(0); expect(days[0]).toBe('2026-09-28'); expect(days.at(-1)).toBe('2026-11-01')
    expect(new Set(days).size).toBe(days.length); expect(shiftMonth('2026-12', 1)).toBe('2027-01')
  })
  it('navigue au clavier par jour, semaine, mois et année sans dépasser la fin du mois', () => {
    expect(moveCalendarFocus('2026-01-31', 'PageDown')).toBe('2026-02-28')
    expect(moveCalendarFocus('2028-02-29', 'PageDown', true)).toBe('2029-02-28')
    expect(moveCalendarFocus('2026-10-21', 'Home')).toBe('2026-10-19'); expect(moveCalendarFocus('2026-10-21', 'End')).toBe('2026-10-25')
    expect(moveCalendarFocus('2026-10-21', 'ArrowUp')).toBe('2026-10-14'); expect(moveCalendarFocus('2026-10-21', 'ArrowRight')).toBe('2026-10-22')
  })
  it('respecte min, max et pas des dates et mois', () => {
    expect(dateAllowed('2026-10-18', 'date', '2026-10-19')).toBe(false)
    expect(dateAllowed('2026-10-20', 'date', '2026-10-19', '2026-10-30', 2)).toBe(false)
    expect(dateAllowed('2026-10-21', 'date', '2026-10-19', '2026-10-30', 2)).toBe(true)
    expect(dateAllowed('2026-12', 'month', '2026-01', '2026-11')).toBe(false)
    expect(dateAllowed('2026-03', 'month', '2026-01', '', 2)).toBe(true)
    expect(dateAllowed('2026-02', 'month', '2026-01', '', 2)).toBe(false)
    expect(dateAllowed('', 'date')).toBe(true)
  })
  it('respecte les heures, secondes et pas sans appliquer de fuseau implicite', () => {
    expect(dateAllowed('2026-10-19T09:00', 'datetime-local', '2026-10-19T09:00:00', '', 900)).toBe(true)
    expect(dateAllowed('2026-10-19T09:10', 'datetime-local', '2026-10-19T09:00', '', 900)).toBe(false)
    expect(dateAllowed('2026-10-19T08:59', 'datetime-local', '2026-10-19T09:00')).toBe(false)
    expect(dateAllowed('2026-10-19T09:00:30', 'datetime-local', '', '', 'any')).toBe(true)
    expect(dateAllowed('2026-10-19T09:00:30', 'datetime-local')).toBe(false)
  })
})
