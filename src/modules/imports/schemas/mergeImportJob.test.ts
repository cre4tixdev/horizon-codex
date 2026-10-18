import { describe, expect, it } from 'vitest'
import type { ImportJob, ImportRow } from './imports'
import { jobMutationSchema } from './imports'
import { mergeImportJob } from './mergeImportJob'

const row = (id: string, number: number): ImportRow => ({ id, number, status: 'create', action: 'create', data: { name: id, image_base64: 'image' }, before: {}, match: '', target: '', error: '', resolution: '', candidates: [] })
const job: ImportJob = { id: 'job', type: 'companies', source: 'file', filename: 'test.csv', status: 'preview', mode: 'upsert', created: '', summary: { total: 600, create: 600, update: 0, skip: 0, conflict: 0, error: 0, applied: 0 }, error: '', rows: Array.from({ length: 600 }, (_, i) => row(String(i), i + 1)) }

describe('réponse partielle de résolution Imports', () => {
  it('conserve les 600 lignes, leur ordre et leurs images en fusionnant plusieurs lignes affectées', () => {
    const changed = { ...job.rows[25], status: 'skip', resolution: 'skip' }
    const dependent = { ...job.rows[26], status: 'create' }
    const patch = jobMutationSchema.parse({ ...job, partial: true, rows: [dependent, changed], summary: { ...job.summary, skip: 1, create: 599 } })
    const result = mergeImportJob(job, patch)
    expect(result.rows).toHaveLength(600)
    expect(result.rows[25]).toEqual(changed)
    expect(result.rows[26]).toEqual(dependent)
    expect(result.rows[599]).toBe(job.rows[599])
    expect(result.rows[599]?.data.image_base64).toBe('image')
    expect(result.summary.skip).toBe(1)
    expect(result).not.toHaveProperty('partial')
  })

  it('accepte encore une réponse complète et refuse une fusion sans préparation correspondante', () => {
    expect(mergeImportJob(undefined, job)).toEqual(job)
    expect(() => mergeImportJob(undefined, { ...job, partial: true, rows: [] })).toThrow('Rechargez')
    expect(() => mergeImportJob({ ...job, id: 'other' }, { ...job, partial: true })).toThrow('Rechargez')
    expect(() => mergeImportJob(job, { ...job, partial: true, rows: [row('unknown', 601)] })).toThrow('Rechargez')
  })
})
