import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { displayDays, inputSchema } from './leave'
type CivilInput = { start_date: string; end_date: string; start_half: string; end_half: string }
type CalendarPolicy = { weekdays: number[]; holidays: string[]; holiday_calendar?: 'metropole' | 'none'; working_holidays?: string[] }
const code = readFileSync('pocketbase/pb_hooks/lib/leave-dates.js', 'utf8'), module = { exports: {} }
const holidayModule = { exports: {} }; runInNewContext(readFileSync('pocketbase/pb_hooks/lib/leave-holidays.js', 'utf8'), { module: holidayModule, Date, Error })
const holidays = holidayModule.exports as ((year: number) => string[]) & { named: (year: number) => Record<string, string> }
runInNewContext(code, { module, Date, Error, __hooks: '', require: () => holidays })
const dates = module.exports as { calculate: (input: CivilInput, policy: CalendarPolicy) => { duration: number; breakdown: Record<string, number> } }
const policy = { weekdays: [1, 2, 3, 4, 5], holidays: [] }, input = { start_date: '2026-10-23', end_date: '2026-10-26', start_half: 'pm', end_half: 'am' }
describe('Décompte civil des congés', () => {
  it('compte les demi-journées sans consommer le week-end et sans effet DST', () => { expect(dates.calculate(input, policy).duration).toBe(1) })
  it('ventile exactement les années et respecte les exclusions configurées', () => {
    const cross = { ...input, start_date: '2026-12-31', end_date: '2027-01-01', start_half: 'am', end_half: 'pm' }
    expect(dates.calculate(cross, policy)).toEqual({ duration: 2, breakdown: { 2026: 1, 2027: 1 } })
    expect(dates.calculate(cross, { ...policy, holidays: ['2027-01-01'] })).toEqual({ duration: 1, breakdown: { 2026: 1 } })
  })
  it('refuse dates impossibles, périodes inversées et périodes vides', () => {
    for (const changes of [{ start_date: '2026-02-30' }, { end_date: '2026-10-22' }, { end_date: '2026-10-23', end_half: 'am' }, { start_date: '2026-10-24', end_date: '2026-10-25' }]) expect(() => dates.calculate({ ...input, ...changes }, policy)).toThrow()
  })
  it('accepte les semaines personnalisées et les demi-journées isolées', () => {
    expect(dates.calculate({ ...input, start_date: '2026-10-24', end_date: '2026-10-24', start_half: 'pm', end_half: 'pm' }, { weekdays: [6], holidays: [] }).duration).toBe(.5)
  })
  it('valide les champs de demande et formate les jours pour Horizon', () => {
    expect(inputSchema.safeParse({ ...input, type: '', reason: '', manager: '' }).success).toBe(false)
    expect(displayDays(2.5)).toBe('2,5 j')
  })
})

describe('Jours fériés métropolitains', () => {
  it('correspond aux données officielles DINUM sur trois années', () => {
    const fixture = JSON.parse(readFileSync('tests/fixtures/france-metropole-holidays.json', 'utf8')) as { years: Record<string, Record<string, string>> }
    for (const [year, days] of Object.entries(fixture.years)) { expect(holidays(Number(year))).toEqual(Object.keys(days).sort()); expect(holidays.named(Number(year))).toEqual(days) }
    expect(() => holidays(1999)).toThrow()
  })
  const metro = { ...policy, holiday_calendar: 'metropole' as const, working_holidays: [] }
  const full = (start_date: string, end_date = start_date) => ({ start_date, end_date, start_half: 'am', end_half: 'pm' })
  it('exclut les jours fixes, mobiles et week-ends sans double déduction', () => {
    expect(dates.calculate(full('2026-11-09', '2026-11-13'), metro).duration).toBe(4)
    expect(dates.calculate(full('2026-05-11', '2026-05-29'), metro).duration).toBe(13)
    expect(dates.calculate(full('2026-08-14', '2026-08-17'), metro).duration).toBe(2)
    expect(dates.calculate(full('2026-12-31', '2027-01-04'), metro)).toEqual({ duration: 2, breakdown: { 2026: 1, 2027: 1 } })
    expect(() => dates.calculate(full('2026-11-11'), metro)).toThrow()
  })
  it('permet les exceptions travaillées, sans supprimer les exclusions explicites', () => {
    expect(dates.calculate(full('2026-05-25'), { ...metro, working_holidays: ['2026-05-25'] }).duration).toBe(1)
    expect(() => dates.calculate(full('2026-05-25'), { ...metro, working_holidays: ['2026-05-25'], holidays: ['2026-05-25'] })).toThrow()
    expect(dates.calculate(full('2026-11-09', '2026-11-13'), { ...metro, holidays: ['2026-11-10', '2026-11-11'] }).duration).toBe(3)
    expect(dates.calculate(full('2026-11-11'), { ...metro, holiday_calendar: 'none' }).duration).toBe(1)
  })
})
