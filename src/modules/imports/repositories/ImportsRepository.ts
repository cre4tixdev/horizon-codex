import { createPocketBaseClient } from '../../../core/pocketbase/client'
import { jobMutationSchema, jobSchema, historySchema, profilesSchema, odooConfigSchema, sourceSchema, type PreviewInput, type ImportType, type ImportMode } from '../schemas/imports'
export function createImportsRepository(url: string) {
  const client = createPocketBaseClient(url)
  const send = (path: string, body?: object, changes = false) => client.send(`/api/horizon/imports/${path}`, { method: body ? 'POST' : 'GET', ...(body ? { body } : {}), ...(changes ? { headers: { 'X-Horizon-Import-Response': 'changes' } } : {}), requestKey: null, signal: AbortSignal.timeout(60_000) })
  return {
    preview: async (input: PreviewInput) => jobSchema.parse(await send('preview', input)),
    get: async (id: string) => jobSchema.parse(await send(`jobs/${id}`)),
    resolve: async (id: string, row: string, resolution: string, values?: Record<string, string>) => jobMutationSchema.parse(await send(`jobs/${id}/resolve`, { row, resolution, ...(values ? { values } : {}) }, true)),
    resolveBulk: async (id: string, filter: string, resolution: '' | 'skip') => jobSchema.parse(await send(`jobs/${id}/resolve-bulk`, { filter, resolution })),
    recheck: async (id: string) => jobSchema.parse(await send(`jobs/${id}/recheck`, {})),
    discard: async (id: string) => { await send(`jobs/${id}/discard`, {}) },
    apply: async (id: string) => jobSchema.parse(await send(`jobs/${id}/apply`, {})),
    history: async () => historySchema.parse(await send('history')).items,
    profiles: async () => profilesSchema.parse(await send('profiles')).items,
    saveProfile: async (input: { name: string; type: ImportType; headers: string[]; mapping: Record<string, number>; mode: ImportMode }) => profilesSchema.parse(await send('profiles', input)).items,
    odoo: async () => odooConfigSchema.parse(await send('odoo')),
    saveOdoo: async (input: { base_url: string; database: string; api_key: string }) => odooConfigSchema.parse(await send('odoo', input)),
    readOdoo: async (input: { type: ImportType; after_id: number; query: string; since: string }) => sourceSchema.parse(await send('odoo/read', input)),
  }
}
