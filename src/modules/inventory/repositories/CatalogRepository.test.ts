import { afterEach, expect, it, vi } from 'vitest'
import { productDefaults } from '../schemas/catalog'
import { createCatalogRepository } from './CatalogRepository'

vi.mock('../../../core/pocketbase/client', async () => {
  const { default: PocketBase } = await import('pocketbase')
  return { createPocketBaseClient: (url: string) => new PocketBase(url) }
})
afterEach(() => vi.unstubAllGlobals())

it('charge simultanément les composants illustrés sans annuler leurs accès aux photos protégées', async () => {
  const record = { ...productDefaults({ brands: [], categories: [], units: [], currencies: [], suppliers: [], countries: [] }), sku: 'COMP', name: 'Composant', category: 'category', base_unit: 'unit', brand: 'brand', id: 'component', collectionId: 'products', updated: '2026-10-22', active: true, primary_image: 'photo.png', images: [], category_label: 'Produits', unit_code: 'u', unit_locked: false, pricing: { unit_cost: 10, unit_price: 20, coefficient: 2, margin_rate: 100, currency: 'EUR', product_supplier: '', supplier: '', warning: '', source: 'reference' } }
  let cancelled = 0
  vi.stubGlobal('fetch', vi.fn((url: string, options: RequestInit) => {
    if (!url.endsWith('/api/files/token')) return Promise.resolve(Response.json(new URL(url).pathname.endsWith('/products') ? { items: [record], page: 1, totalPages: 1, totalItems: 1 } : record))
    return new Promise<Response>((resolve, reject) => {
      const timer = setTimeout(() => resolve(Response.json({ token: 'protected-test-token' })), 20)
      options.signal?.addEventListener('abort', () => { cancelled++; clearTimeout(timer); reject(new DOMException('Aborted', 'AbortError')) }, { once: true })
    })
  }))
  const repository = createCatalogRepository('http://catalogue.test')
  const results = await Promise.all([repository.record('firstcomponent1'), repository.record('secondcomponen2')])
  const lists = await Promise.all([repository.list({ q: 'first' }), repository.list({ q: 'second' })])
  expect(lists.every((list) => Boolean(list.items[0]?.image_url))).toBe(true)
  expect(cancelled).toBe(0)
  expect(results).toHaveLength(2)
  for (const result of results) expect(result.image_url).toContain('/api/files/products/component/photo.png?token=')
})
