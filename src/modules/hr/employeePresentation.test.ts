import { describe, expect, it } from 'vitest'
import { sortEmployeeResults } from './employeePresentation'

const employee = (first_name: string, last_name: string, professional_email = '', job_title = '') => ({ first_name, last_name, professional_email, job_title })
describe('tri des employés', () => {
  it('compare le nom de famille avant le prénom, y compris les noms composés et accents', () => {
    const rows = [employee('Alice', 'Martin'), employee('Zoé', 'Jean'), employee('Ana', 'Jean Paul'), employee('Émile', 'Durand'), employee('Anne', 'durand')]
    const expected = [rows[4], rows[3], rows[1], rows[2], rows[0]]
    expect(sortEmployeeResults(rows, 'name:asc')).toEqual(expected)
    expect(sortEmployeeResults(rows, 'name:desc')).toEqual([...expected].reverse())
    expect(rows[0]?.last_name).toBe('Martin')
  })
  it('conserve les tris explicites par e-mail et poste', () => {
    const rows = [employee('Alice', 'Martin', 'z@local.invalid', 'Achats'), employee('Zoé', 'Durand', 'a@local.invalid', 'Ventes')]
    expect(sortEmployeeResults(rows, 'email:asc')).toEqual([...rows].reverse())
    expect(sortEmployeeResults(rows, 'job:asc')).toEqual(rows)
  })
})
