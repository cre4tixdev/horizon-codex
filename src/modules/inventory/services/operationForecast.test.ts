import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import type { OperationForecast } from '../schemas/operations'
type ForecastRecord = { kind: string; status: string; planned_date: string; completed_date?: string; archived?: boolean; dropship?: boolean; scrap?: boolean }
const forecast = runInNewContext(readFileSync('pocketbase/pb_hooks/lib/stock-operation-forecast.js', 'utf8') + '; module.exports', { module: { exports: {} } }) as (records: ForecastRecord[], today: string) => OperationForecast
const record = (changes: Partial<ForecastRecord>): ForecastRecord => ({ kind: 'IN', status: 'draft', planned_date: '', ...changes })
describe('Prévision des opérations Stock', () => {
  it('garde dix jours continus à cheval sur les mois et les années', () => {
    const result = forecast([], '2027-01-01')
    expect(Array.from(result.dates)).toEqual(['2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02', '2027-01-03', '2027-01-04', '2027-01-05', '2027-01-06', '2027-01-07', '2027-01-08'])
    expect(result.series.IN.completed.every((value) => value === 0)).toBe(true)
  })
  it('compte les pièces réalisées à leur date réelle et les ouvertes à leur date planifiée', () => {
    const result = forecast([record({ status: 'done', completed_date: '2026-10-10', planned_date: '2026-10-15', archived: true }), record({ planned_date: '2026-10-12' }), record({ status: 'cancelled', planned_date: '2026-10-12' }), record({ archived: true, planned_date: '2026-10-12' })], '2026-10-11')
    expect(Array.from(result.series.IN.completed)).toEqual([0, 1, 0, 0, 0, 0, 0, 0, 0, 0])
    expect(Array.from(result.series.IN.planned)).toEqual([0, 0, 0, 1, 0, 0, 0, 0, 0, 0])
  })
  it('signale les dates absentes et le retard sans déplacer artificiellement les pièces', () => {
    const result = forecast([record({}), record({ planned_date: '2026-10-01' }), record({ planned_date: '2026-10-10' }), record({ planned_date: '2026-10-19' }), record({ status: 'done' })], '2026-10-11')
    expect(result.series.IN.undated).toBe(1)
    expect(result.series.IN.overdue).toBe(2)
    expect(result.series.IN.planned.reduce((sum, value) => sum + value, 0)).toBe(1)
    expect(result.series.IN.completed.reduce((sum, value) => sum + value, 0)).toBe(0)
  })
  it('sépare livraisons, dropshipping et rebut et conserve le transit dans le prévu', () => {
    const result = forecast([record({ kind: 'OUT', planned_date: '2026-10-11' }), record({ kind: 'OUT', dropship: true, planned_date: '2026-10-11' }), record({ kind: 'OUT', scrap: true, planned_date: '2026-10-11' }), record({ kind: 'INT', status: 'transit', planned_date: '2026-10-11' }), record({ kind: 'INV', planned_date: '2026-10-11' })], '2026-10-11')
    for (const key of ['OUT', 'DS', 'SCRAP', 'INT'] as const) expect(result.series[key].planned[2]).toBe(1)
    expect(result.series.INT.completed[2]).toBe(0)
  })
})
