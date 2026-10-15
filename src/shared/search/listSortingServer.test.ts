import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { describe, expect, it } from 'vitest'

type Row = { id: string; value: string | number | null }
const sandbox: { module: { exports: unknown } } = { module: { exports: {} } }
runInNewContext(readFileSync(new URL('../../../pocketbase/pb_hooks/lib/list-sorting.js', import.meta.url), 'utf8'), sandbox)
const sorting = sandbox.module.exports as {
  text: (values: (string | null)[]) => string
  sql: (value: string, fields: string[], fallback: string) => string
  rows: (items: Row[], value: string, fields: string[], fallback: string) => Row[]
}

describe('Server list sorting primitives', () => {
  it('allows both directions only on explicitly declared fields', () => {
    expect(sorting.sql('-value', ['value'], 'value')).toBe('-value')
    expect(sorting.sql('value,secret', ['value'], 'value')).toBe('value')
  })
  it('compares numbers rather than their formatted text, including zero', () => {
    const rows = [{ id: 'a', value: 10 }, { id: 'b', value: 2 }, { id: 'c', value: 0 }]
    expect(sorting.rows([...rows], 'value', ['value'], 'value').map((item) => item.value)).toEqual([0, 2, 10])
    expect(sorting.rows([...rows], '-value', ['value'], 'value').map((item) => item.value)).toEqual([10, 2, 0])
  })
  it('keeps absent values last in both directions and breaks ties by identifier', () => {
    const rows = [{ id: 'z', value: null }, { id: 'b', value: 2 }, { id: 'a', value: 2 }]
    for (const sort of ['value', '-value']) expect(sorting.rows([...rows], sort, ['value'], 'value').map((item) => item.id)).toEqual(['a', 'b', 'z'])
  })
  it('orders the displayed labels of multi-value relations deterministically', () => {
    expect(sorting.text(['Fournisseur', 'Client', 'Client', null, ''])).toBe('Client · Fournisseur')
  })

})
