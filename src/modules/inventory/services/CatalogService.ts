import { productDuplicate } from './productDuplication'
import { ZodError } from 'zod'
import { ClientResponseError } from 'pocketbase'
import { environment } from '../../../core/config/environment'
import { sessionService } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
import { createCatalogRepository } from '../repositories/CatalogRepository'
import { productInputSchema, type Category, type ProductInput, type ProductFiles, type Product } from '../schemas/catalog'
const repository = environment.pocketBaseUrl ? createCatalogRepository(environment.pocketBaseUrl) : undefined
async function run<T>(permission: string, action: (repo: NonNullable<typeof repository>) => Promise<T>) {
  const session = sessionService.getSnapshot()
  if (session.status !== 'authenticated' || !hasPermission(session.user, permission)) throw new Error('Accès au catalogue refusé.')
  if (!repository) throw new Error('Le catalogue n’est pas configuré.')
  try { return await action(repository) } catch (error) { console.error('[catalogue] Operation failed', { status: error instanceof ClientResponseError ? error.status : 0, ...(error instanceof ZodError ? { fields: error.issues.map((issue) => ({ path: issue.path.join('.'), code: issue.code })) } : {}) }); throw new Error(error instanceof ClientResponseError && [400, 403, 404, 409].includes(error.status) ? error.response.message : 'Catalogue indisponible. Réessayez.', { cause: error }) }
}
export const catalogService = {
  productQuotes: async (id: string, page = 1) => {
    try { return await run('inventory.read', (repo) => repo.productQuotes(id, page)) } catch (error) {
      if (error instanceof Error && error.cause instanceof ClientResponseError && error.cause.status === 404) throw new Error('L’historique des devis du produit n’est pas disponible sur ce serveur.', { cause: error })
      throw error
    }
  },
  duplicateDraft: (id: string, includeSuppliers: boolean) => run('inventory.write', async (repo) => { const source = await repo.record(id); return { input: productDuplicate(source, includeSuppliers), files: { primary: await repo.duplicatePhoto(source), images: [], removePrimary: false, removeImages: [] } satisfies ProductFiles } }),
  createBrand: (name: string) => run('inventory.write', (repo) => repo.createBrand(name.trim())),
  list: (query: Record<string, string | number>) => run('inventory.read', (repo) => repo.list(query)),
  record: (id: string) => run('inventory.read', (repo) => repo.record(id)),
  choices: () => run('inventory.read', (repo) => repo.choices()),
  save: (input: ProductInput, key: string, files: ProductFiles, record?: Product) => { const uploads = [...files.images, ...(files.primary ? [files.primary] : [])]; if (uploads.some((file) => file.size > 5000000 || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type))) throw new Error('Photos PNG, JPEG ou WebP de 5 Mo maximum.'); if ((record?.images.length || 0) - files.removeImages.length + files.images.length > 6) throw new Error('Six photos de galerie maximum.'); return run('inventory.write', (repo) => repo.save(productInputSchema.parse(input), key, files, record)) },
  state: (record: Product, active: boolean) => run('inventory.write', (repo) => repo.state(record, active)),
  categories: () => { const session = sessionService.getSnapshot(); return run(session.status === 'authenticated' && hasPermission(session.user, 'settings.references') ? 'settings.references' : 'inventory.read', (repo) => repo.categories()) },
  saveCategory: (input: Omit<Category, 'id' | 'updated'> & Partial<Pick<Category, 'id' | 'updated'>>) => run('settings.references', (repo) => repo.saveCategory(input)),
  quoteLine: (product: string, offer: string, currency: string) => run('inventory.read', (repo) => repo.quoteLine(product, offer, currency)),
}
