import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
type Row = { date?: string; currency: string; subtotal?: number; amount?: number; margin?: number | null }
const { aggregate, trend } = runInNewContext(readFileSync('pocketbase/pb_hooks/lib/dashboard-metrics.js', 'utf8') + ';module.exports', { module: { exports: {} } }) as { trend: (rows: Row[], field: 'amount' | 'margin', from: string, to: string) => { step: string; dates: string[]; series: { currency: string; values: number[] }[] }; aggregate: (rows: Row[], field: 'amount' | 'margin', withMargin?: boolean) => { currency: string; amount: number; count: number; percent: number | null }[] }
describe('Indicateurs du dashboard', () => {
  it('additionne au centime et conserve une ligne par devise', () => {
    const result = aggregate([{ currency: 'EUR', amount: 0.1 }, { currency: 'USD', amount: 40 }, { currency: 'EUR', amount: 0.2 }], 'amount')
    expect(Array.from(result)).toEqual([{ currency: 'EUR', amount: 0.3, count: 2, percent: null }, { currency: 'USD', amount: 40, count: 1, percent: null }])
  })
  it('pondère la marge par le CA, au lieu de faire une moyenne des taux', () => {
    const result = aggregate([{ currency: 'EUR', subtotal: 100, margin: 20 }, { currency: 'EUR', subtotal: 900, margin: 450 }], 'margin', true)
    expect(result[0]).toEqual({ currency: 'EUR', amount: 470, count: 2, percent: 47 })
  })
  it('ne transforme pas une marge historique inconnue en marge nulle', () => {
    expect(aggregate([{ currency: 'EUR', subtotal: 100, margin: null }], 'margin', true)).toHaveLength(0)
    expect(aggregate([{ currency: 'EUR', subtotal: 0, margin: -5 }], 'margin', true)[0]?.percent).toBeNull()
  })
  it('refuse un agrégat qui ne peut plus conserver les centimes exactement', () => {
    expect(() => aggregate([{ currency: 'EUR', amount: Number.MAX_SAFE_INTEGER }], 'amount')).toThrow('Montant agrégé hors limites.')
  })
})

describe('Courbes financières du dashboard', () => {
  it('remplit les jours vides et agrège au centime par devise sans sortir de la période', () => {
    const result = trend([{ date: '2026-10-02', currency: 'EUR', amount: .1 }, { date: '2026-10-02', currency: 'EUR', amount: .2 }, { date: '2026-10-02', currency: 'USD', amount: 40 }, { date: '2026-09-30', currency: 'EUR', amount: 999 }], 'amount', '2026-10-01', '2026-10-03')
    expect(result.step).toBe('day')
    expect(Array.from(result.dates)).toEqual(['2026-10-01', '2026-10-02', '2026-10-03'])
    expect(Array.from(result.series, (series) => ({ ...series, values: Array.from(series.values) }))).toEqual([{ currency: 'EUR', values: [0, .3, 0] }, { currency: 'USD', values: [0, 40, 0] }])
  })
  it('utilise les semaines au trimestre et les mois à l’année sans perdre la dernière date', () => {
    const quarter = trend([{ date: '2026-12-31', currency: 'EUR', amount: 25 }], 'amount', '2026-10-01', '2026-12-31')
    expect(quarter.step).toBe('week')
    expect(quarter.series[0]?.values.at(-1)).toBe(25)
    const year = trend([{ date: '2024-02-29', currency: 'EUR', amount: 25 }], 'amount', '2024-01-01', '2024-12-31')
    expect(year.step).toBe('month')
    expect(year.dates).toHaveLength(12)
    expect(year.series[0]?.values[1]).toBe(25)
  })
  it('conserve les pertes et exclut les coûts historiques inconnus', () => {
    const result = trend([{ date: '2026-10-01', currency: 'EUR', margin: -25 }, { date: '2026-10-01', currency: 'EUR', margin: null }], 'margin', '2026-10-01', '2026-10-02')
    expect(Array.from(result.series[0]!.values)).toEqual([-25, 0])
    expect(trend([], 'amount', '2026-10-01', '2026-10-31').series).toHaveLength(0)
  })
})
