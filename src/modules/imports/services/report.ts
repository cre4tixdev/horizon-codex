import type { ImportJob } from '../schemas/imports'
import { actionLabels } from '../schemas/imports'
const cell = (value: string) => '"' + ((/^[\s]*[=+@-]/.test(value) || /^[\t\r\n]/.test(value)) ? "'" + value : value).replaceAll('"', '""') + '"'
export function importReport(job: Pick<ImportJob, 'rows'>) {
  const rows = [['Ligne', 'Action', 'Fiche', 'Contrôle', 'Traitée'], ...job.rows.map((row) => [String(row.number), actionLabels[row.action] || row.action, String(row.data.name || [row.data.first_name, row.data.last_name].filter(Boolean).join(' ')), row.error || row.match, row.status === 'applied' ? 'Oui' : 'Non'])]
  return '\uFEFF' + rows.map((row) => row.map(cell).join(';')).join('\r\n')
}
export function downloadImportReport(job: ImportJob) {
  const url = URL.createObjectURL(new Blob([importReport(job)], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a'); link.href = url; link.download = `import-${job.id}.csv`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
}
