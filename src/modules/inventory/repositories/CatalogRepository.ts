import { z } from 'zod'
import { createPocketBaseClient } from '../../../core/pocketbase/client'
import { productQuotesSchema, brandSchema, categorySchema, productSchema, productPageSchema, choicesSchema, quoteProductSchema, type ProductInput, type ProductFiles, type Category, type Product } from '../schemas/catalog'
export function createCatalogRepository(url: string) {
  const client = createPocketBaseClient(url)
  async function photos(record: Product, existingToken?: string): Promise<Product> { if (!record.primary_image && !record.images.length) return record; const token = existingToken || await client.files.getToken(); return { ...record, image_url: record.primary_image ? client.files.getURL(record, record.primary_image, { token }) : '', image_urls: record.images.map((name) => client.files.getURL(record, name, { token })) } }
  async function read(value: unknown) { return photos(productSchema.parse(value)) }
  return {
    async productQuotes(id: string, page: number) { return productQuotesSchema.parse(await client.send(`/api/horizon/inventory/products/${id}/quotes`, { method: 'GET', query: { page }, requestKey: null })) },
    async list(query: Record<string, string | number>) { const page = productPageSchema.parse(await client.send('/api/horizon/inventory/products', { method: 'GET', query, requestKey: null })); const token = page.items.some((item) => item.primary_image || item.images.length) ? await client.files.getToken() : undefined; return { ...page, items: await Promise.all(page.items.map((item) => photos(item, token))) } },
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
