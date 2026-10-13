import { describe, expect, it } from 'vitest'
import { stockOperationFilters, normalizeOperationFilters, changeOperationFilter, operationGroup } from './searchOperationFilters'
import { catalogFilters } from './searchFilters'
import { stockFilters, internalAssetFilters } from './searchStockFilters'
describe('filtres Stock communs', () => {
  it('garde les critères courts, multiples et les archives compactes séparées', () => {
    const filters = stockOperationFilters(false)
    expect(filters.map((item) => item.key)).toEqual(['kind', 'variant', 'status', 'state'])
    expect(filters.filter((item) => item.key !== 'state').every((item) => item.multiple)).toBe(true)
    expect(filters.find((item) => item.key === 'status')!.options.some((item) => item.value === 'archived')).toBe(false)
    expect(filters.at(-1)?.appearance).toBe('compact')
    expect(stockOperationFilters(true).map((item) => item.key)).toEqual(['status', 'state'])
    expect(catalogFilters([]).at(-1)?.appearance).toBe('compact')
    expect(stockFilters[0]?.multiple).toBe(true); expect(internalAssetFilters[0]?.multiple).toBe(true)
  })
  it('reprend les liens et retire seulement la sortie incompatible', () => {
    const params = new URLSearchParams('status=archived&q=Studio&group=status')
    expect(normalizeOperationFilters(params).get('state')).toBe('archived')
    expect(normalizeOperationFilters(params).get('q')).toBe('Studio')
    const kind = stockOperationFilters(false)[0]!
    expect(changeOperationFilter(new URLSearchParams('variant=delivery&q=Studio'), kind, 'IN,RET').has('variant')).toBe(false)
    expect(stockOperationFilters(false, new URLSearchParams('kind=IN')).map((item) => item.key)).not.toContain('variant')
  })
  it('regroupe toutes les affaires distinctes sans dupliquer une pièce', () => {
    const item = { kind: 'IN' as const, status: 'draft' as const, warehouse: 'w', warehouse_name: 'Meudon', opportunity: '', opportunity_name: '', supplier_name: '', opportunities: [{ id: '2', name: 'Studio' }, { id: '1', name: 'Salle' }, { id: '2', name: 'Studio' }] }
    expect(operationGroup(item, 'opportunity')).toEqual({ key: '1,2', label: 'Salle / Studio' })
    expect(operationGroup(item, 'supplier').label).toBe('Sans fournisseur')
  })
})
