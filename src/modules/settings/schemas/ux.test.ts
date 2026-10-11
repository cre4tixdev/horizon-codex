import { describe, expect, it } from 'vitest'
import { uxDefaults, uxLimits, uxInputSchema, uxStyle } from './ux'
describe('Shared UX configuration', () => {
  it('retains the current Horizon baseline', () => {
    expect(uxInputSchema.parse(uxDefaults)).toEqual(uxDefaults)
    expect(uxStyle(uxDefaults)).toMatchObject({ '--hz-table-row-height': '32px', '--hz-table-cell-height': '26px', '--hz-workspace-gutter': '40px' })
  })
  it('rejects unknown settings, fractions, unsafe CSS and unreadable sizes', () => {
    for (const patch of [{ row_height: 20 }, { row_height: 33.5 }, { page_margin: 200 }, { control_font: 25 }, { header_light: 'red;display:none' }, { extra: 1 }]) expect(uxInputSchema.safeParse({ ...uxDefaults, ...patch }).success).toBe(false)
  })
  it('accepts 10 px text and the displayed limits', () => {
    expect(uxInputSchema.safeParse({ ...uxDefaults, table_font: 10, control_font: 10 }).success).toBe(true)
    for (const [key, range] of Object.entries(uxLimits)) {
      for (const value of [range.min, range.max]) expect(uxInputSchema.safeParse({ ...uxDefaults, [key]: value }).success).toBe(true)
      for (const value of [range.min - 1, range.max + 1]) expect(uxInputSchema.safeParse({ ...uxDefaults, [key]: value }).success).toBe(false)
    }
  })
  it('keeps editable controls smaller than their row', () => {
    const min = uxStyle({ ...uxDefaults, row_height: uxLimits.row_height.min }), max = uxStyle({ ...uxDefaults, row_height: uxLimits.row_height.max })
    expect(min['--hz-table-cell-height']).toBe('22px')
    expect(max['--hz-table-cell-height']).toBe('58px')
  })
})
