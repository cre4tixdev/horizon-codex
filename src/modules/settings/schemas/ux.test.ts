import { describe, expect, it } from 'vitest'
import { uxDefaults, uxLimits, uxInputSchema, uxStyle } from './ux'
describe('Shared UX configuration', () => {
  it('borne la largeur de recherche et complète les anciens réglages sans les réinitialiser', () => {
    const legacy = Object.fromEntries(Object.entries(uxDefaults).filter(([key]) => key !== 'search_width'))
    expect(uxInputSchema.parse(legacy).search_width).toBe(840)
    expect(uxStyle({ ...uxDefaults, search_width: 960 })['--hz-search-width']).toBe('960px')
    for (const search_width of [399, 1201, 600.5]) expect(uxInputSchema.safeParse({ ...uxDefaults, search_width }).success).toBe(false)
  })
  it('retains the current Horizon baseline', () => {
    expect(uxInputSchema.parse(uxDefaults)).toEqual(uxDefaults)
    expect(uxStyle(uxDefaults)).toMatchObject({ '--hz-table-row-height': '32px', '--hz-table-cell-height': '26px', '--hz-workspace-gutter': '40px', '--hz-table-header-text-light': '#4C678E', '--hz-table-header-text-dark': '#B8C5D7' })
  })
  it('rejects unknown settings, fractions, unsafe CSS and unreadable sizes', () => {
    for (const patch of [{ row_height: 20 }, { row_height: 33.5 }, { page_margin: 200 }, { control_font: 25 }, { header_light: 'red;display:none' }, { table_border_dark: 'url(evil)' }, { table_header_text_light: 'red' }, { table_header_text_dark: 'url(evil)' }, { extra: 1 }]) expect(uxInputSchema.safeParse({ ...uxDefaults, ...patch }).success).toBe(false)
  })
  it('accepts 10 px text and the displayed limits', () => {
    expect(uxInputSchema.safeParse({ ...uxDefaults, table_font: 10, control_font: 10 }).success).toBe(true)
    for (const [key, range] of Object.entries(uxLimits)) {
      for (const value of [range.min, range.max]) expect(uxInputSchema.safeParse({ ...uxDefaults, [key]: value }).success).toBe(true)
      for (const value of [range.min - 1, range.max + 1]) expect(uxInputSchema.safeParse({ ...uxDefaults, [key]: value }).success).toBe(false)
    }
  })
  it('defaults missing filter keys and maps bounded filter tokens', () => {
    const legacy = Object.fromEntries(Object.entries(uxDefaults).filter(([key]) => !key.startsWith('filter_')))
    expect(uxInputSchema.parse(legacy)).toEqual(uxDefaults)
    expect(uxStyle({ ...uxDefaults, filter_option_height: 40, filter_font: 14, filter_selected_text_dark: '#AABBCC' })).toMatchObject({ '--hz-filter-option-height': '40px', '--hz-filter-font': '14px', '--hz-filter-selected-text-dark': '#AABBCC' })
    expect(uxInputSchema.safeParse({ ...uxDefaults, filter_text_light: 'url(evil)' }).success).toBe(false)
  })
  it('keeps editable controls smaller than their row', () => {
    const min = uxStyle({ ...uxDefaults, row_height: uxLimits.row_height.min }), max = uxStyle({ ...uxDefaults, row_height: uxLimits.row_height.max })
    expect(min['--hz-table-cell-height']).toBe('22px')
    expect(max['--hz-table-cell-height']).toBe('58px')
  })
  it('defaults legacy tracking header colors and maps only validated colors', () => {
    const legacy = Object.fromEntries(Object.entries(uxDefaults).filter(([key]) => !key.startsWith('order_tracking_header_')))
    expect(uxInputSchema.parse(legacy)).toEqual(uxDefaults)
    expect(uxStyle({ ...uxDefaults, order_tracking_header_light: '#AABBCC', order_tracking_header_dark: '#223344' })).toMatchObject({ '--hz-order-tracking-header-light': '#AABBCC', '--hz-order-tracking-header-dark': '#223344' })
    expect(uxInputSchema.safeParse({ ...uxDefaults, order_tracking_header_light: 'url(evil)' }).success).toBe(false)
    expect(uxInputSchema.safeParse({ ...uxDefaults, order_tracking_header_dark: '#fff' }).success).toBe(false)
  })
  it('validates and projects the tracking caption colors separately from its background', () => {
    const legacy = Object.fromEntries(Object.entries(uxDefaults).filter(([key]) => !key.startsWith('order_tracking_text_')))
    expect(uxInputSchema.parse(legacy)).toEqual(uxDefaults)
    expect(uxStyle({ ...uxDefaults, order_tracking_text_light: '#70334D', order_tracking_text_dark: '#FFC1DE' })).toMatchObject({ '--hz-order-tracking-text-light': '#70334D', '--hz-order-tracking-text-dark': '#FFC1DE' })
    for (const value of ['url(evil)', '#fff', 'red']) expect(uxInputSchema.safeParse({ ...uxDefaults, order_tracking_text_light: value }).success).toBe(false)
  })
  it('preserves half-pixel sidebar typography and rejects smaller increments', () => {
    expect(uxInputSchema.safeParse({ ...uxDefaults, sidebar_font: 12.5, sidebar_submenu_font: 11.5 }).success).toBe(true)
    expect(uxInputSchema.safeParse({ ...uxDefaults, sidebar_font: 12.25 }).success).toBe(false)
    expect(uxStyle({ ...uxDefaults, sidebar_width: 260 })['--hz-sidebar-width']).toBe('260px')
  })
})
