import { describe, expect, it } from 'vitest'
import { collectOdoo } from './odoo'
const page = (start: number, count: number, total: number, more: boolean) => ({ headers: ['external_id', 'name'], rows: Array.from({ length: count }, (_, i) => [String(start + i), `Société ${start + i}`]), total, has_more: more, after_id: start + count - 1, namespace: 'test' })
describe('Lecture complète Odoo', () => {
  it('charge automatiquement plus de 1000 résultats avec progression et sans tronquer', async () => {
    const progress: number[] = [], cursors: number[] = []
    const result = await collectOdoo(async (after) => { cursors.push(after); const count = Math.min(200, 1201 - after); return page(after + 1, count, 1201, after + count < 1201) }, (loaded) => progress.push(loaded))
    expect(result.rows).toHaveLength(1201); expect(cursors).toEqual([0, 200, 400, 600, 800, 1000, 1200]); expect(progress.at(-1)).toBe(1201)
  })
  it('refuse les résultats partiels si une page échoue', async () => {
    await expect(collectOdoo(async (after) => { if (after) throw new Error('Interruption'); return page(1, 200, 300, true) }, () => {})).rejects.toThrow('Interruption')
  })
  it('refuse un total modifié, une page finale incomplète et les doublons', async () => {
    await expect(collectOdoo(async (after) => page(after + 1, 200, after ? 401 : 400, true), () => {})).rejects.toThrow('changé')
    await expect(collectOdoo(async () => page(1, 1, 2, false), () => {})).rejects.toThrow('changé')
    await expect(collectOdoo(async () => page(1, 200, 400, true), () => {})).rejects.toThrow('incohérents')
  })
})
