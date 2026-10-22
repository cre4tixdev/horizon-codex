import { mergePreviewSchema, mergeChoicesSchema, type MergeSelection, type MergeApplication } from '../../../shared/merge/schema'
import { z } from 'zod'
import { createPocketBaseClient } from '../../../core/pocketbase/client'
import { productQuotesSchema, brandSchema, categorySchema, productSchema, productPageSchema, choicesSchema, quoteProductSchema, type ProductInput, type ProductFiles, type Category, type Product } from '../schemas/catalog'
export function createCatalogRepository(url: string) {
  const client = createPocketBaseClient(url)
  // Les composants illustrés sont lus en parallèle : ne pas annuler leur accès aux fichiers protégés.
  async function photos(record: Product, existingToken?: string): Promise<Product> { if (!record.primary_image && !record.images.length) return record; const token = existingToken || await client.files.getToken({ requestKey: null }); return { ...record, image_url: record.primary_image ? client.files.getURL(record, record.primary_image, { token }) : '', image_urls: record.images.map((name) => client.files.getURL(record, name, { token })) } }
  async function read(value: unknown) { return photos(productSchema.parse(value)) }
  return {
    async kitSettings() { return z.object({ prefix: z.string(), updated: z.string() }).parse(await client.send('/api/horizon/inventory/kits/settings', { method: 'GET', requestKey: null })) },
    async saveKitSettings(input: { prefix: string; updated: string }) { return z.object({ prefix: z.string(), updated: z.string() }).parse(await client.send('/api/horizon/inventory/kits/settings', { method: 'POST', body: input, requestKey: null })) },
    async mergeChoices(q: string) { return mergeChoicesSchema.parse(await client.send('/api/horizon/data-quality/candidates', { method: 'GET', query: { kind: 'products', q, mode: 'manual', page: 1 }, requestKey: null })).items.map((item) => item.left) },
    async mergePreview(body: MergeSelection) { return mergePreviewSchema.parse(await client.send('/api/horizon/inventory/merge/preview', { method: 'POST', body, requestKey: null })) },
    async mergeApply(body: MergeApplication) { return z.object({ id: z.string() }).parse(await client.send('/api/horizon/inventory/merge/apply', { method: 'POST', body, requestKey: null })) },
    async mergedSources(id: string) { return z.object({ items: z.array(z.object({ id: z.string(), name: z.string(), sku: z.string() })) }).parse(await client.send(`/api/horizon/inventory/products/${id}/merged-sources`, { method: 'GET', requestKey: null })).items },
    async imageURL(collectionId: string, id: string, filename: string) { const token = await client.files.getToken({ requestKey: null }); return client.files.getURL({ collectionId, id }, filename, { token }) },
    async barcodePreview(brand: string, sku: string) { return z.object({ barcode: z.string() }).parse(await client.send('/api/horizon/inventory/barcode-preview', { method: 'GET', query: { brand, sku }, requestKey: null })).barcode },
    async duplicatePhoto(record: Product) {
      if (!record.image_url) return undefined
      const response = await fetch(record.image_url)
      if (!response.ok) throw new Error('La photo du produit ne peut pas être copiée.')
      const blob = await response.blob()
      return new File([blob], record.primary_image, { type: blob.type })
    },
    async productQuotes(id: string, page: number) { return productQuotesSchema.parse(await client.send(`/api/horizon/inventory/products/${id}/quotes`, { method: 'GET', query: { page }, requestKey: null })) },
    async list(query: Record<string, string | number>) { const page = productPageSchema.parse(await client.send('/api/horizon/inventory/products', { method: 'GET', query, requestKey: null })); const token = page.items.some((item) => item.primary_image || item.images.length) ? await client.files.getToken({ requestKey: null }) : undefined; return { ...page, items: await Promise.all(page.items.map((item) => photos(item, token))) } },
    async record(id: string) { return read(await client.send(`/api/horizon/inventory/products/${id}`, { method: 'GET', requestKey: null })) },
    async choices() { return choicesSchema.parse(await client.send('/api/horizon/inventory/choices', { method: 'GET', requestKey: null })) },
    async save(input: ProductInput, key: string, files: ProductFiles, record?: Product) { const body = new FormData(); body.set('input', JSON.stringify(input)); body.set('creation_key', key); if (record) { body.set('id', record.id); body.set('updated', record.updated) }; body.set('remove_image', String(files.removePrimary)); body.set('remove_images', JSON.stringify(files.removeImages)); if (files.primary) body.set('primary_image', files.primary); files.images.forEach((file) => body.append('images', file)); return read(await client.send('/api/horizon/inventory/products/save', { method: 'POST', body, requestKey: null })) },
    async state(record: Product, active: boolean) { return read(await client.send('/api/horizon/inventory/products/state', { method: 'POST', body: { id: record.id, updated: record.updated, active }, requestKey: null })) },
    async createBrand(name: string) { return brandSchema.parse(await client.send('/api/horizon/inventory/brands/create', { method: 'POST', body: { name }, requestKey: null })) },
    async categories() { return z.object({ items: z.array(categorySchema) }).parse(await client.send('/api/horizon/inventory/categories', { method: 'GET', requestKey: null })).items },
    async saveCategory(input: Omit<Category, 'id' | 'updated'> & Partial<Pick<Category, 'id' | 'updated'>>) { return categorySchema.parse(await client.send('/api/horizon/inventory/categories/save', { method: 'POST', body: input, requestKey: null })) },
    async quoteLine(product: string, offer: string, currency: string) { return quoteProductSchema.parse(await client.send('/api/horizon/inventory/quote-line', { method: 'POST', body: { product, offer, currency }, requestKey: null })) },
  }
}
