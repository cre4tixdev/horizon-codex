import { describe, expect, it } from 'vitest'
import { keepPreviousListData } from './keepPreviousListData'

describe('keepPreviousListData', () => {
  const rows = { items: [{ id: 'first' }], summary: { draft: 2 } }
  it('preserves the same data through filter, sort and page changes', () => {
    const keep = keepPreviousListData(['expenses', 'list', 'own'])
    for (const criteria of ['status=draft', 'sort=month', 'page=2']) {
      expect(keep(rows, { queryKey: ['expenses', 'list', 'own', criteria] })).toBe(rows)
    }
  })
  it('resets on another module, document type, area or period', () => {
    const keep = keepPreviousListData(['leave', 'list', 'review', '2026'])
    for (const key of [['expenses', 'list', 'review', '2026'], ['leave', 'record', 'review', '2026'], ['leave', 'list', 'own', '2026'], ['leave', 'list', 'review', '2025']]) {
      expect(keep(rows, { queryKey: key })).toBeUndefined()
    }
    expect(keep(undefined, undefined)).toBeUndefined()
  })
})
