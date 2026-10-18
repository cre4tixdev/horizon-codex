import { expect, it } from 'vitest'
import { importReport } from './report'
import { importRowSchema } from '../schemas/imports'
it('exporte un rapport CSV échappé sans formule Excel exécutable', () => {
  const row = importRowSchema.parse({ id: 'row', number: 1, status: 'error', action: 'error', data: { name: '=HYPERLINK("test")' }, before: {}, match: '', target: '', error: 'Valeur; invalide', resolution: '', candidates: [] })
  const csv = importReport({ rows: [row] })
  expect(importReport({ rows: [{ ...row, data: { name: '  =SUM(1)' } }] })).toContain("'  =SUM(1)")
  expect(csv.startsWith('\uFEFF')).toBe(true); expect(csv).toContain("'=HYPERLINK"); expect(csv).toContain('"Valeur; invalide"'); expect(csv).toContain('""test""')
})
