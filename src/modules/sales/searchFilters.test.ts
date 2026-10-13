import { describe, expect, it } from 'vitest'
import { changeFilter, toggleFilterValue } from '../../shared/search/filters'
import { quoteFilters, quoteKindFilter, quoteStateFilter, changeSalesFilter, normalizeSalesFilters, resetSalesFilters } from './searchFilters'
describe('filtres Ventes', () => {
  it('reprend les anciens liens sans mélanger type et archives', () => {
    expect(normalizeSalesFilters(new URLSearchParams('status=accepted&q=Paris')).toString()).toBe('q=Paris&kind=order')
    expect(normalizeSalesFilters(new URLSearchParams('status=archived')).toString()).toBe('state=archived')
    expect(normalizeSalesFilters(new URLSearchParams('status=draft')).get('kind')).toBe('quote')
  })
  it('affiche les états selon les types et retire seulement les critères incompatibles', () => {
    expect(quoteFilters(new URLSearchParams('kind=order')).map((item) => item.key)).toEqual(['kind', 'order_status', 'customer_number', 'state'])
    const next = changeFilter(changeSalesFilter(new URLSearchParams('kind=quote,order&status=draft,sent&order_status=completed&q=Paris&state=archived'), quoteKindFilter, 'order'), quoteKindFilter, 'order')
    expect(next.has('status')).toBe(false); expect(next.get('order_status')).toBe('completed'); expect(next.get('state')).toBe('archived'); expect(next.get('q')).toBe('Paris')
  })
  it('retire un seul choix d’une famille et réinitialise en conservant la recherche', () => {
    expect(toggleFilterValue(quoteStateFilter, 'draft,sent', 'draft')).toBe('sent')
    expect(toggleFilterValue(quoteStateFilter, 'sent', 'sent')).toBe('')
    expect(resetSalesFilters(new URLSearchParams('q=Paris&status=accepted&state=archived&order_status=completed&page=3&sort=quote_number')).toString()).toBe('q=Paris')
  })
})
