import { describe, expect, it } from 'vitest'
import { dashboardLayoutsSchema, defaultDashboard, createWidget, placeWidgets, positionWidget, resizeWidget } from './layouts'
import { widgetConfigSchema, dataSpecSchema } from './widgetData'
function assertLayout(widgets: ReturnType<typeof placeWidgets>) {
  const occupied = new Set<string>()
  for (const widget of widgets) {
    expect(widget.x).toBeGreaterThanOrEqual(0); expect(widget.x + widget.width).toBeLessThanOrEqual(12)
    for (let y = widget.y; y < widget.y + widget.height; y++) for (let x = widget.x; x < widget.x + widget.width; x++) { const cell = `${x}:${y}`; expect(occupied.has(cell)).toBe(false); occupied.add(cell) }
  }
}
describe('Dashboard instances and grid', () => {
  it('packs implicit positions and displaces neighbours with no overlap', () => {
    assertLayout(placeWidgets(defaultDashboard.widgets))
    const initial = placeWidgets(defaultDashboard.widgets), moved = { ...initial[1]!, x: 0, y: 0 }
    const after = positionWidget(initial, moved)
    expect(after.find((item) => item.id === moved.id)).toMatchObject({ x: 0, y: 0 })
    expect(after[0]!.y).toBeGreaterThan(0)
    assertLayout(after)
    expect(placeWidgets(after)).toEqual(after)
    expect(initial[0]!.y).toBe(0)
  })
  it('resizes one unit at a time, keeps config and identity, clamps positions', () => {
    const metric = { ...createWidget('forecast'), x: 9, y: 3 }
    expect(resizeWidget(metric, 2, 1)).toEqual({ ...metric, width: 2, height: 1 })
    expect(resizeWidget(metric, 5, 3)).toEqual({ ...metric, width: 5, height: 3, x: 7 })
    expect(resizeWidget(createWidget('business'), 0, 0)).toMatchObject({ width: 2, height: 2 })
    expect(resizeWidget(metric, 100, 100)).toMatchObject({ width: 12, height: 12, x: 0 })
  })
  const parse = (widgets: unknown[]) => dashboardLayoutsSchema.safeParse({ revision: 0, preference: { defaultId: 'personal', dashboards: [{ id: 'personal', name: 'Travail', widgets }] } })
  it('reads existing layouts and keeps several independent instances of one type', () => {
    const old = parse([{ type: 'business', width: 6, height: 5 }]); expect(old.success).toBe(true)
    if (old.success) expect(old.data.preference.dashboards[0]!.widgets[0]).toMatchObject({ id: 'legacy-business', config: { pages: expect.any(Array) } })
    const a = createWidget('records'), b = createWidget('records'); b.config.data.source = 'quotes'
    expect(parse([a, b]).success).toBe(true); expect(parse([a, a]).success).toBe(false)
    expect(a.config.data.source).toBe('opportunities')
  })
  it('defaults new and legacy widgets to Horizon tables, preserving saved presentations', () => {
    expect(createWidget('records').config.data.presentation).toBe('table')
    expect(createWidget('business').config.pages.every((page) => page.presentation === 'table')).toBe(true)
    const implicit = parse([{ type: 'business', width: 6, height: 5 }])
    expect(implicit.success).toBe(true)
    if (implicit.success) {
      expect(implicit.data.preference.dashboards[0]!.widgets[0]!.config.pages.every((page) => page.presentation === 'table')).toBe(true)
      expect(dashboardLayoutsSchema.parse(implicit.data)).toEqual(implicit.data)
    }
    // An omitted page override in the server's compact v2 format means its saved list default.
    const compact = parse([{ ...createWidget('business'), config: {} }])
    expect(compact.success).toBe(true)
    if (compact.success) expect(compact.data.preference.dashboards[0]!.widgets[0]!.config.pages[0]!.presentation).toBe('list')
    const custom = createWidget('business'); custom.config.pages[0]!.presentation = 'list'
    const explicit = parse([custom])
    expect(explicit.success).toBe(true)
    if (explicit.success) expect(explicit.data.preference.dashboards[0]!.widgets[0]!.config.pages[0]!.presentation).toBe('list')
  })
  it('rejects unknown fields, off-grid positions and unbounded instances', () => {
    const widget = createWidget('records')
    for (const invalid of [{ ...widget, x: 10 }, { ...widget, y: 1001 }, { ...widget, type: 'sql' }, { ...widget, owner: 'another' }, { ...widget, width: 1 }, { ...widget, height: 0 }, { ...widget, config: { ...widget.config, sql: 'select *' } }]) expect(parse([invalid]).success).toBe(false)
    expect(parse(Array.from({ length: 33 }, () => createWidget('records'))).success).toBe(false)
  })
  it('validates carousel bounds and each page source/filter combination', () => {
    const base = widgetConfigSchema.parse({})
    expect(widgetConfigSchema.safeParse({ ...base, pages: [] }).success).toBe(false)
    expect(widgetConfigSchema.safeParse({ ...base, pages: Array.from({ length: 13 }, () => base.pages[0]) }).success).toBe(false)
    expect(widgetConfigSchema.safeParse({ ...base, interval: 2 }).success).toBe(false)
    expect(dataSpecSchema.safeParse({ source: 'invoices', scope: 'own' }).success).toBe(false)
    expect(dataSpecSchema.safeParse({ source: 'orders', status: 'sent' }).success).toBe(false)
    expect(dataSpecSchema.safeParse({ source: 'quotes', status: 'sent', scope: 'own' }).success).toBe(true)
    expect(dataSpecSchema.safeParse({ search: 'x'.repeat(201) }).success).toBe(false)
  })
})
