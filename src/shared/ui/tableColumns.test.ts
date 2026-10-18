import { describe, it, expect } from 'vitest'
import { resolveTableColumns, defaultTableColumns } from './tableColumns'

describe('consultation table columns', () => {
  const ids = ['identity', 'email', 'phone', 'actions']
  it('keeps required columns visible while respecting their chosen positions', () => {
    expect(resolveTableColumns(ids, ['actions'], { order: ['actions', 'phone', 'identity', 'email'], hidden: ['identity', 'email', 'actions'] })).toEqual({ order: ['actions', 'phone', 'identity', 'email'], hidden: ['email'] })
  })
  it('preserves hidden columns in the chosen order when shown again', () => {
    const saved = { order: ['identity', 'phone', 'email', 'actions'], hidden: ['email'] }
    expect(resolveTableColumns(ids, ['actions'], saved)).toEqual(saved)
    expect(resolveTableColumns(ids, ['actions'], { ...saved, hidden: [] }).order).toEqual(saved.order)
  })
  it('ignores stale and duplicate ids and adds newly available columns', () => {
    expect(resolveTableColumns([...ids, 'new'], ['actions'], { order: ['phone', 'phone', 'removed'], hidden: ['removed', 'email', 'email'] })).toEqual({ order: ['phone', 'identity', 'email', 'actions', 'new'], hidden: ['email'] })
  })
  it('hides optional additions without losing explicit visibility choices', () => {
    const ids = ['identity', 'email', 'vat']
    expect(resolveTableColumns(ids, [], { order: ['identity', 'email'], hidden: [] }, ['vat']).hidden).toEqual(['vat'])
    expect(resolveTableColumns(ids, [], { order: ids, hidden: [] }, ['vat']).hidden).toEqual([])
    expect(resolveTableColumns(ids, [], defaultTableColumns, ['vat']).hidden).toEqual(['vat'])
  })
  it('keeps known widths when a column is hidden or moved', () => {
    expect(resolveTableColumns(ids, [], { order: ['phone', 'identity'], hidden: ['email'], widths: { identity: 240, email: 180, removed: 100 } })).toEqual({ order: ['phone', 'identity', 'email', 'actions'], hidden: ['email'], widths: { identity: 240, email: 180 } })
  })
  it('restores the declared defaults and supports an empty table definition', () => {
    expect(resolveTableColumns(ids, [], defaultTableColumns)).toEqual({ order: ids, hidden: [] })
    expect(resolveTableColumns([], [], defaultTableColumns)).toEqual(defaultTableColumns)
  })
})
