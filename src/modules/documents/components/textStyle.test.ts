import { describe, expect, it } from 'vitest'
import { baseStyle, defaultLayout, layoutSchema } from '../schemas/templates'
import { textStyle } from './textStyle'

describe('document borders', () => {
  it('preserves the legacy lower border until explicit borders are configured', () => {
    expect(textStyle({ ...baseStyle, border: true })).toMatchObject({ borderBottom: '1px solid #091C3A', borderTop: undefined })
    expect(textStyle({ ...baseStyle, border: false }).borderBottom).toBeUndefined()
  })
  it('uses independent sides, color and fractional width, overriding the legacy flag', () => {
    expect(textStyle({ ...baseStyle, border: true, borders: { top: true, bottom: false, left: true, right: false, color: '#123456', width: 2.5 } })).toMatchObject({ borderTop: '2.5px solid #123456', borderBottom: 'none', borderLeft: '2.5px solid #123456', borderRight: 'none' })
  })
  it('validates subtitle styles and bounded border settings without modifying older models', () => {
    const layout = defaultLayout(), table = layout.blocks.find((block) => block.kind === 'table')!
    expect(layoutSchema.parse(layout)).toEqual(layout)
    table.tableSubtitle = { ...baseStyle, borders: { top: true, bottom: false, left: false, right: true, color: '#7B3FC7', width: 1.5 } }
    expect(layoutSchema.safeParse(layout).success).toBe(true)
    table.tableSubtitle.borders!.width = 11
    expect(layoutSchema.safeParse(layout).success).toBe(false)
    table.tableSubtitle.borders!.width = 1
    layout.blocks[0]!.tableSubtitle = table.tableSubtitle
    expect(layoutSchema.safeParse(layout).success).toBe(false)
  })
})
