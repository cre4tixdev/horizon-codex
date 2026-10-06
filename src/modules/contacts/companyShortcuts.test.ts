import { describe, expect, it } from 'vitest'
import { companyShortcuts } from './companyShortcuts'

describe('Raccourcis contextuels sociétés', () => {
  it('ne propose que les ventes pour un client et les achats pour un fournisseur', () => {
    expect(companyShortcuts(['customer']).map((item) => item.id)).toEqual(['quotes', 'sales-orders', 'customer-invoices', 'deliveries', 'opportunities'])
    expect(companyShortcuts(['supplier']).map((item) => item.id)).toEqual(['purchase-orders', 'receipts', 'supplier-invoices'])
    expect(companyShortcuts([])).toEqual([])
  })
  it('cumule les deux rôles sans inventer de compteur ni de destination pour un module absent', () => {
    const links = companyShortcuts(['customer', 'supplier'])
    expect(new Set(links.map((item) => item.id)).size).toBe(8)
    expect(links.every((item) => item.count === undefined && item.href === undefined)).toBe(true)
  })
})
