import { describe, expect, it } from 'vitest'
import { dashboardLayoutsSchema, defaultDashboard, moveWidget, placeWidgets, resizeWidget } from './layouts'

describe('Dashboard layouts', () => {
  it('packs widgets without overlap inside twelve columns and preserves reading order', () => {
    for (const widgets of [defaultDashboard.widgets, defaultDashboard.widgets.map((item, index) => resizeWidget(item, index % 2 ? 12 : 8, 8)), [...defaultDashboard.widgets].reverse()]) {
      const placed = placeWidgets(widgets), occupied = new Set<string>()
      expect(placed.map((item) => item.type)).toEqual(widgets.map((item) => item.type))
      for (const widget of placed) {
        expect(widget.x).toBeGreaterThanOrEqual(0); expect(widget.x + widget.width).toBeLessThanOrEqual(12)
        for (let y = widget.y; y < widget.y + widget.height; y++) for (let x = widget.x; x < widget.x + widget.width; x++) {
          const cell = `${x}:${y}`
          expect(occupied.has(cell)).toBe(false); occupied.add(cell)
        }
      }
    }
  })
  it('clamps sizes to readable widget minimums and bounded snapped dimensions', () => {
    expect(resizeWidget({ type: 'business', width: 6, height: 5 }, 2, 0)).toEqual({ type: 'business', width: 6, height: 4 })
    expect(resizeWidget({ type: 'activity', width: 6, height: 4 }, 100, 100)).toEqual({ type: 'activity', width: 12, height: 8 })
    expect(resizeWidget({ type: 'forecast', width: 3, height: 2 }, 5.9, 2.6)).toEqual({ type: 'forecast', width: 6, height: 3 })
  })
  it('reorders without mutating the source and ignores invalid moves', () => {
    const before = structuredClone(defaultDashboard.widgets)
    expect(moveWidget(before, 0, 7).at(-1)?.type).toBe('forecast')
    expect(before).toEqual(defaultDashboard.widgets)
    expect(moveWidget(before, -1, 2)).toEqual(before)
  })
  it('rejects unknown, duplicated, undersized widgets and absent default dashboards', () => {
    const dashboard = { ...defaultDashboard, id: 'personal' }
    const parse = (dashboards: unknown[], defaultId = 'personal') => dashboardLayoutsSchema.safeParse({ revision: 0, preference: { defaultId, dashboards } }).success
    expect(parse([dashboard])).toBe(true)
    expect(parse([dashboard, dashboard])).toBe(false)
    expect(parse([{ ...dashboard, widgets: [dashboard.widgets[0], dashboard.widgets[0]] }])).toBe(false)
    expect(parse([{ ...dashboard, widgets: [{ type: 'business', width: 3, height: 2 }] }])).toBe(false)
    expect(parse([{ ...dashboard, widgets: [{ type: 'injected', width: 3, height: 2 }] }])).toBe(false)
    expect(parse([dashboard], 'missing')).toBe(false)
    expect(parse([{ ...dashboard, id: 'horizon' }])).toBe(false)
    expect(parse([{ ...dashboard, owner: 'someone' }])).toBe(false)
  })
})
