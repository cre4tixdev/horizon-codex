import { z } from 'zod'
import { ClientResponseError } from 'pocketbase'
import { createPocketBaseClient } from '../../../core/pocketbase/client'
import { sourceLinkSchema, choicesSchema, libraryFileSchema, libraryPageSchema, type LibraryInput, type LibraryFolder, type LibraryCategory } from '../schemas/library'
export function createLibraryRepository(url: string) {
  const client = createPocketBaseClient(url)
  return {
    async list(query: Record<string, string>, signal?: AbortSignal) { return libraryPageSchema.parse(await client.send('/api/horizon/ged/files', { method: 'GET', query, signal: signal ?? null, requestKey: null })) },
    async context(entity: string, id: string) { return sourceLinkSchema.parse(await client.send('/api/horizon/ged/context', { method: 'GET', query: { entity, id }, requestKey: null })) },
    async record(id: string) { return libraryFileSchema.parse(await client.send(`/api/horizon/ged/files/${id}`, { method: 'GET', requestKey: null })) },
    async choices() { return choicesSchema.parse(await client.send('/api/horizon/ged/choices', { method: 'GET', requestKey: null })) },
    async search(kind: string, q: string, signal?: AbortSignal) { return z.object({ items: z.array(z.object({ value: z.string(), label: z.string() })) }).parse(await client.send('/api/horizon/ged/search', { method: 'GET', query: { kind, q }, signal: signal ?? null, requestKey: null })).items },
    async upload(input: LibraryInput, files: File[]) { const body = new FormData(); body.set('input', JSON.stringify(input)); files.forEach((f) => body.append('files', f)); return z.object({ items: z.array(libraryFileSchema) }).parse(await client.send('/api/horizon/ged/upload', { method: 'POST', body, requestKey: null })).items },
    async save(id: string, updated: string, input: LibraryInput) { return libraryFileSchema.parse(await client.send(`/api/horizon/ged/files/${id}/save`, { method: 'POST', body: { updated, input }, requestKey: null })) },
    async version(id: string, updated: string, note: string, file: File) { const body = new FormData(); body.set('updated', updated); body.set('note', note); body.append('files', file); return libraryFileSchema.parse(await client.send(`/api/horizon/ged/files/${id}/version`, { method: 'POST', body, requestKey: null })) },
    async archive(id: string, updated: string, archived: boolean) { return libraryFileSchema.parse(await client.send(`/api/horizon/ged/files/${id}/archive`, { method: 'POST', body: { updated, archived }, requestKey: null })) },
    async folder(input: Omit<LibraryFolder, 'id' | 'created_by' | 'updated'> & { id?: string; updated?: string; active: boolean }) { await client.send('/api/horizon/ged/folders', { method: 'POST', body: input, requestKey: null }) },
    async category(input: Omit<LibraryCategory, 'id' | 'updated'> & { id?: string; updated?: string }) { await client.send('/api/horizon/ged/categories', { method: 'POST', body: input, requestKey: null }) },
    async file(id: string, version: string) { const response = await fetch(client.buildURL(`/api/horizon/ged/files/${id}/versions/${version}/file`), { headers: { Authorization: client.authStore.token }, cache: 'no-store' }); if (!response.ok) throw new ClientResponseError({ status: response.status }); return response.blob() },
  }
}
