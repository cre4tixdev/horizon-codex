import type { ImportJob, ImportJobMutation } from './imports'

export function mergeImportJob(previous: ImportJob | undefined, next: ImportJobMutation): ImportJob {
  const { partial, ...job } = next
  if (!partial) return job
  if (!previous || previous.id !== job.id) throw new Error('Préparation indisponible. Rechargez la page avant de continuer.')
  const patches = new Map(job.rows.map((row) => [row.id, row]))
  const known = new Set(previous.rows.map((row) => row.id))
  if (job.rows.some((row) => !known.has(row.id))) throw new Error('La préparation a changé. Rechargez la page avant de continuer.')
  return { ...job, rows: previous.rows.map((row) => patches.get(row.id) || row) }
}
