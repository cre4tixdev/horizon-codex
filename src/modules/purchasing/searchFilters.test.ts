import { describe, expect, it } from 'vitest'
import { filterValue } from '../../shared/search/filters'
import { purchasingFilters, purchasingGroupingFilter, purchasingKindFilter, purchaseGroup, normalizePurchasingFilters, changePurchasingFilter, resetPurchasingFilters } from './searchFilters'
describe('filtres de l’accueil Achats', () => {
  it('ouvre les pièces en attente et sépare le type des états', () => {
    const filters = purchasingFilters('all'), status = filters.find((item) => item.key === 'status')!
    const params = normalizePurchasingFilters(new URLSearchParams('q=câble&group=supplier_name'), true)
    expect(filterValue(params, status)).toBe('pending')
    const all = changePurchasingFilter(params, status, '', 'all')
    expect(all.get('status')).toBe(''); expect(normalizePurchasingFilters(all, true).get('status')).toBe('')
    expect(all.get('q')).toBe('câble'); expect(all.get('group')).toBe('supplier_name')
    expect(filters.map((item) => item.key)).toEqual(['kind', 'status', 'state'])
    expect(status.options.map((item) => item.value)).not.toContain('requests')
    expect(status.options.map((item) => item.value)).not.toContain('orders')
    expect(status.multiple).toBe(true)
  })
  it('adapte les états au type et conserve les autres critères', () => {
    const next = changePurchasingFilter(new URLSearchParams('status=draft,sent&state=archived&q=Paris&group=status&page=3'), purchasingKindFilter, 'requests', 'all')
    expect(next.get('status')).toBe('draft'); expect(next.get('state')).toBe('archived'); expect(next.get('q')).toBe('Paris'); expect(next.get('group')).toBe('status'); expect(next.has('page')).toBe(false)
    const options = purchasingFilters('all', next).find((item) => item.key === 'status')!.options.map((item) => item.value)
    expect(options).toContain('ordered'); expect(options).not.toContain('received')
    expect(resetPurchasingFilters(next, 'all').toString()).toBe('q=Paris&status=pending')
  })
  it('reprend les anciens liens de type et d’archives', () => {
    expect(normalizePurchasingFilters(new URLSearchParams('status=requests'), true).toString()).toBe('status=pending&kind=requests')
    expect(normalizePurchasingFilters(new URLSearchParams('status=orders'), true).get('kind')).toBe('orders')
    const next = normalizePurchasingFilters(new URLSearchParams('status=archived&q=Paris&group=status'), true)
    expect(next.get('state')).toBe('archived'); expect(next.get('status')).toBe(''); expect(next.get('q')).toBe('Paris')
    expect(purchasingFilters('all').at(-1)?.appearance).toBe('compact')
  })
  it('réserve le type à la liste commune et conserve les groupes sans référentiels exhaustifs', () => {
    for (const kind of ['requests', 'orders'] as const) expect(purchasingFilters(kind).map((item) => item.key)).toEqual(['status', 'state'])
    expect(purchasingGroupingFilter.options.map((item) => item.value)).toEqual(['none', 'supplier_name', 'opportunity', 'status'])
    const item = { status: 'draft', supplier_name: 'CVS', lines: [{ allocations: [{ opportunity: 'b', code: '12', label: 'Studio' }, { opportunity: 'a', code: '11', label: 'Salle' }, { opportunity: 'b', code: '12', label: 'Studio' }] }] }
    expect(purchaseGroup(item, 'opportunity')).toEqual({ key: 'a,b', label: '11 · Salle / 12 · Studio' })
    expect(purchaseGroup(item, 'status')).toEqual({ key: 'draft', label: 'Brouillon' })
    expect(purchaseGroup({ ...item, lines: [] }, 'opportunity').label).toBe('Sans opportunité')
    expect(purchaseGroup(item, 'supplier_name').label).toBe('CVS')
  })
})
