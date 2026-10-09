import { textStyle } from '../components/textStyle'
import { describe, it, expect } from 'vitest'
import { defaultLayout, layoutSchema, printableWidth, newBlock, resizeColumns, setSameLine, bodyRows, fonts, dockBlock, placedBlock, duplicateBlock, reorderBlock, expandLegacyBlocks, fitImage, resizeBlock, libraryKinds } from './templates'
describe('Document layout contract', () => {
  it('starts with a printable flowing quotation and repeated page number', () => {
    const layout = defaultLayout()
    expect(layoutSchema.safeParse(layout).success).toBe(true)
    expect(layout.blocks.find((block) => block.kind === 'table')?.zone).toBe('body')
    expect(layout.blocks.find((block) => block.kind === 'pageNumber')?.zone).toBe('footer')
  })
  it('keeps three section styles on their own table and rejects unrelated blocks', () => {
    const layout = defaultLayout(), table = layout.blocks.find((block) => block.kind === 'table')!
    table.tableHeadings = layout.headings.map((style) => ({ ...style, size: 17 }))
    expect(layoutSchema.safeParse(layout).success).toBe(true)
    expect(layout.headings[0]?.size).not.toBe(17)
    table.tableHeadings.pop()
    expect(layoutSchema.safeParse(layout).success).toBe(false)
    delete table.tableHeadings
    layout.blocks[0]!.tableHeadings = layout.headings
    expect(layoutSchema.safeParse(layout).success).toBe(false)
  })
  it('accepts a separate table header style and validates its colors and ownership', () => {
    const layout = defaultLayout(), table = layout.blocks.find((block) => block.kind === 'table')!
    table.tableHeader = { ...table.style, color: '#FFFFFF', background: '#091C3A', size: 14 }
    expect(layoutSchema.safeParse(layout).success).toBe(true)
    expect(table.tableHeadings).toBeUndefined()
    table.tableHeader.color = 'red'
    expect(layoutSchema.safeParse(layout).success).toBe(false)
    table.tableHeader.color = '#FFFFFF'
    layout.blocks[0]!.tableHeader = table.tableHeader
    expect(layoutSchema.safeParse(layout).success).toBe(false)
  })
  it('keeps line and note styles separate and restricted to tables', () => {
    const layout = defaultLayout(), table = layout.blocks.find((block) => block.kind === 'table')!
    table.tableLine = { ...table.style, color: '#7B3FC7', size: 13 }
    table.tableNote = { ...table.style, color: '#091C3A', size: 11, italic: true }
    expect(layoutSchema.safeParse(layout).success).toBe(true)
    expect(table.tableLine.italic).toBe(false)
    for (const property of ['tableLine', 'tableNote'] as const) {
      layout.blocks[0]![property] = table[property]
      expect(layoutSchema.safeParse(layout).success).toBe(false)
      delete layout.blocks[0]![property]
      const valid = table[property]!
      table[property] = { ...valid, backgroundOpacity: 2 }
      expect(layoutSchema.safeParse(layout).success).toBe(false)
      table[property] = valid
    }
  })
  it('rejects blocks outside the printable width and fixed zones', () => {
    const layout = defaultLayout()
    layout.blocks[0]!.x = printableWidth(layout)
    expect(layoutSchema.safeParse(layout).success).toBe(false)
    const footer = newBlock('pageNumber', 300); footer.y = 100
    layout.blocks = [footer]
    expect(layoutSchema.safeParse(layout).success).toBe(false)
  })
  it('keeps old opaque styles and bounds backdrop opacity without fading text', () => {
    const layout = defaultLayout()
    layout.background = { color: '#E8EDF4', image: '', opacity: 0.35, fit: 'contain' }
    expect(layoutSchema.safeParse(layout).success).toBe(true)
    const style: typeof layout.headings[number] = { ...layout.headings[0]!, background: '#7B3FC7', backgroundOpacity: 0.5 }
    expect(textStyle(style).backgroundColor).toBe('rgba(123,63,199,0.5)')
    expect(textStyle(style).opacity).toBeUndefined()
    delete style.backgroundOpacity
    expect(textStyle(style).backgroundColor).toBe('#7B3FC7')
    layout.background.opacity = 1.01
    expect(layoutSchema.safeParse(layout).success).toBe(false)
    layout.background.opacity = 1
    layout.background.image = 'https://remote.invalid/image.png'
    expect(layoutSchema.safeParse(layout).success).toBe(false)
    layout.background.image = ''
    layout.headings[0]!.backgroundOpacity = -0.01
    expect(layoutSchema.safeParse(layout).success).toBe(false)
  })
  it('requires coherent dynamic columns and unique block identities', () => {
    const layout = defaultLayout(), table = layout.blocks.find((block) => block.kind === 'table')!
    table.columns[0]!.width = 30
    expect(layoutSchema.safeParse(layout).success).toBe(false)
    const other = defaultLayout(); other.blocks.push(other.blocks[0]!)
    expect(layoutSchema.safeParse(other).success).toBe(false)
  })
  it('places several blocks on one row without changing legacy flow or table pagination', () => {
    const layout = defaultLayout(), title = layout.blocks[0]!, client = layout.blocks[1]!
    expect(bodyRows(layout.blocks)).toHaveLength(8)
    const joined = setSameLine(layout, client.id, true)
    expect(bodyRows(joined.blocks)[0]).toHaveLength(2)
    expect(joined.blocks[0]!.x + joined.blocks[0]!.width).toBeLessThan(joined.blocks[1]!.x)
    expect(layoutSchema.safeParse(joined).success).toBe(true)
    expect(setSameLine(joined, joined.blocks[2]!.id, true)).toBe(joined)
    const image = newBlock('image', printableWidth(layout)); joined.blocks.splice(2, 0, image)
    const three = setSameLine(joined, image.id, true)
    expect(bodyRows(three.blocks)[0]).toHaveLength(3)
    expect(layoutSchema.safeParse(three).success).toBe(true)
    joined.blocks.splice(2, 1)
    const separated = setSameLine(joined, client.id, false)
    expect(bodyRows(separated.blocks)).toHaveLength(8)
    expect(title.sameLine).toBeUndefined()
  })
  it('accepts each embedded font and public client fields, but rejects unsupported sources', () => {
    const layout = defaultLayout()
    for (const font of fonts) { layout.blocks[0]!.style.font = font; expect(layoutSchema.safeParse(layout).success).toBe(true) }
    layout.blocks[0]!.field = 'company.postal_code'
    layout.blocks[2]!.tableSource = 'sales.quote_lines'
    expect(layoutSchema.safeParse(layout).success).toBe(true)
    expect(layoutSchema.safeParse({ ...layout, blocks: [{ ...layout.blocks[0], tableSource: 'private' }] }).success).toBe(false)
  })
  it('keeps docking attached to the printable zone across size changes', () => {
    const layout = defaultLayout(), first = layout.blocks[0]!
    first.width = 200
    const right = dockBlock(layout, first.id, 'right')
    expect(placedBlock(right, right.blocks[0]!).x).toBe(printableWidth(layout) - 200)
    const landscape = { ...right, orientation: 'landscape' as const }
    expect(placedBlock(landscape, right.blocks[0]!).x).toBe(printableWidth(landscape) - 200)
    const bottom = dockBlock(layout, first.id, 'bottom')
    expect(bodyRows(bottom.blocks).at(-1)?.[0]?.id).toBe(first.id)
    expect(bodyRows(bottom.blocks).at(-1)?.[0]?.y).toBe(0)
    const footer = layout.blocks.at(-1)!
    expect(placedBlock(dockBlock(layout, footer.id, 'bottom'), { ...footer, anchorY: 'bottom' }).y).toBe(layout.footerHeight - footer.height)
  })
  it('inserts a duplicate directly below its flow row and reorders without moving another zone', () => {
    const layout = defaultLayout(), first = layout.blocks[0]!, client = layout.blocks[1]!
    const copy = duplicateBlock(layout, first.id)
    expect(copy.layout.blocks[1]?.id).toBe(copy.id)
    expect(copy.layout.blocks[1]?.field).toBe(first.field)
    const joined = setSameLine(layout, client.id, true), groupedCopy = duplicateBlock(joined, first.id)
    expect(groupedCopy.layout.blocks[2]?.id).toBe(groupedCopy.id)
    expect(bodyRows(groupedCopy.layout.blocks)[0]).toHaveLength(2)
    expect(bodyRows(reorderBlock(layout, client.id, first.id, false).blocks)[0]?.[0]?.id).toBe(client.id)
    expect(reorderBlock(layout, first.id, layout.blocks.at(-1)!.id, true)).toBe(layout)
    const footer = layout.blocks.at(-1)!, footerCopy = duplicateBlock(layout, footer.id)
    expect(footerCopy.layout.footerHeight).toBe(56)
    expect(footerCopy.layout.blocks.at(-1)?.y).toBe(32)
    expect(layoutSchema.safeParse(footerCopy.layout).success).toBe(true)
  })
  it('composes templates from generic blocks and expands legacy fields only in an editable copy', () => {
    const layout = defaultLayout()
    expect(layout.blocks.every((block) => libraryKinds.includes(block.kind))).toBe(true)
    expect(layout.blocks.filter((block) => block.kind === 'field').map((block) => block.field)).toEqual(expect.arrayContaining(['quote.subtotal', 'quote.tax', 'quote.total', 'quote.terms_content']))
    const old = newBlock('totals', 650), bold = newBlock('text', 650); bold.style.bold = true; old.id = 'x'.repeat(100)
    const source = { ...layout, blocks: [old, bold] }
    const converted = expandLegacyBlocks(source)
    expect(layoutSchema.safeParse(converted).success).toBe(true)
    expect(new Set(converted.blocks.map((block) => block.id)).size).toBe(converted.blocks.length)
    expect(converted.blocks.every((block) => block.kind === 'field' || block.kind === 'text')).toBe(true)
    expect(converted.blocks.at(-1)?.style.bold).toBe(false)
    expect(converted.blocks.at(-1)?.content?.content?.[0]?.content?.[0]?.marks).toContainEqual({ type: 'bold' })
    expect(source.blocks[0]?.kind).toBe('totals')
    expect(source.blocks[1]?.style.bold).toBe(true)
  })
  it('fits natural image bounds and keeps the same ratio from either dimension', () => {
    const image = fitImage(newBlock('image', 650), 300, 150, 650, 400)
    expect(image.width).toBe(300); expect(image.height).toBe(150)
    const resized = resizeBlock(image, 200, 150, 650, 400)
    expect(resized.width).toBe(200); expect(resized.height).toBe(100)
    const height = resizeBlock(image, 300, 80, 650, 400, 'height')
    expect(height.width).toBe(160); expect(height.height).toBe(80)
    const bounded = resizeBlock(image, 900, 150, 650, 200)
    expect(bounded.width).toBe(400); expect(bounded.height).toBe(200)
  })
  it('redistributes table widths with a minimum usable proportion', () => {
    const columns = newBlock('table', 650).columns
    const resized = resizeColumns(columns, 'description', 99)
    expect(resized.every((column) => column.width >= 3)).toBe(true)
    expect(resized.reduce((sum, column) => sum + column.width, 0)).toBeCloseTo(100)
    const single = resizeColumns([columns[0]!], 'description', 10)
    expect(single[0]?.width).toBe(100)
  })
})
