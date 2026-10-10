import { describe, expect, it } from 'vitest'
import { productDefaults, productPageSchema, productSchema } from './catalog'

const product = {
  ...productDefaults({ brands: [], categories: [], units: [], currencies: [], suppliers: [], countries: [] }),
  sku: 'BNC-12G', name: 'Fiche BNC', category: 'category', base_unit: 'unit', brand: 'brand',
  id: 'product', collectionId: 'products', updated: '2026-10-10', active: true,
  primary_image: '', images: [], category_label: 'Équipements', unit_code: 'u', unit_locked: false,
  pricing: { unit_cost: 100, unit_price: 120, coefficient: 1.2, margin_rate: 16.666667, currency: 'EUR', product_supplier: '', supplier: '', warning: '', source: 'reference' },
}

describe('Compatibilité du catalogue lors d’une mise à jour serveur', () => {
  it('lit une fiche et une liste sans champ dernier achat dans les anciens hooks', () => {
    expect(productSchema.parse(product).last_purchase).toBeNull()
    expect(productPageSchema.parse({ items: [product], page: 1, totalItems: 1, totalPages: 1 }).items[0]?.last_purchase).toBeNull()
  })
  it('conserve le dernier achat réel quand il est fourni et refuse un montant invalide', () => {
    const purchase = { unit_cost: 95, date: '2026-10-09', currency: 'EUR', unit: 'u', supplier_name: 'Fournisseur' }
    expect(productSchema.parse({ ...product, last_purchase: purchase }).last_purchase).toEqual(purchase)
    expect(productSchema.safeParse({ ...product, last_purchase: { ...purchase, unit_cost: 'invalide' } }).success).toBe(false)
  })
})
