import { describe, expect, it } from 'vitest'
import { productDefaults, productSchema } from '../schemas/catalog'
import { productDuplicate } from './productDuplication'
const source = productSchema.parse({
  ...productDefaults({ brands: [], categories: [], units: [], currencies: [], suppliers: [], countries: [] }),
  sku: 'SOURCE', name: 'Connecteur', brand: 'brand', category: 'category', base_unit: 'unit', barcode: '123456',
  id: 'source-id', collectionId: 'products', updated: '2026-10-10', active: true, primary_image: '', images: [], category_label: 'Équipements', unit_code: 'u', unit_locked: true,
  pricing: { unit_cost: 80, unit_price: 96, coefficient: 1.2, margin_rate: 16.67, currency: 'EUR', product_supplier: 'offer', supplier: 'supplier', warning: '', source: 'supplier' },
  offers: [{ id: 'offer', supplier: 'supplier', supplier_name: 'Fournisseur', supplier_sku: 'REF', list_price: 100, discount: 20, purchase_quantity: 1, currency: 'EUR', lead_time_days: 3, valid_from: '2026-01-01 00:00:00', valid_until: '', is_preferred: true, unit_cost: 80, purchase_price: 80 }],
})
describe('Duplication produit', () => {
  it('reprend les réglages et prix mais jamais les identifiants et données historiques', () => {
    const copy = productDuplicate(source, true)
    expect(copy.sku).toBe(''); expect(copy.barcode).toBe(''); expect(copy.name).toBe('Connecteur (copie)')
    expect(copy.brand).toBe(source.brand); expect(copy.base_unit).toBe(source.base_unit)
    expect(copy.offers[0]).toMatchObject({ supplier: 'supplier', list_price: 100, discount: 20, is_preferred: true, valid_from: '2026-01-01' })
    expect(copy.offers[0]).not.toHaveProperty('id'); expect(copy).not.toHaveProperty('id'); expect(copy).not.toHaveProperty('price_history'); expect(copy).not.toHaveProperty('unit_locked')
    expect(source.sku).toBe('SOURCE'); expect(source.offers[0]?.id).toBe('offer')
  })
  it('permet de ne pas reprendre les fournisseurs sans perdre le coût effectif', () => {
    const copy = productDuplicate(source, false)
    expect(copy.offers).toEqual([]); expect(copy.reference_cost).toBe(80)
  })
})
