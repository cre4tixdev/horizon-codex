import { describe, expect, it } from 'vitest'
import { metricTrendGeometry } from './metricTrendGeometry'
describe('Courbe en arrière-plan des indicateurs', () => {
  it('garde une ligne plate finie pour une série à zéro', () => {
    const curve = metricTrendGeometry([0, 0, 0])!
    expect(curve.baseline).toBe(92)
    expect(curve.path).not.toMatch(/NaN|Infinity/)
    expect(metricTrendGeometry([])).toBeNull()
  })
  it('place les marges négatives sous le zéro et les positives au-dessus', () => {
    const curve = metricTrendGeometry([10, -10])!
    expect(curve.baseline).toBe(54)
    expect(curve.path).toContain('M0,16')
    expect(curve.path).toContain('320,92')
  })
})
