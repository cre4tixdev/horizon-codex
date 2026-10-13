import { describe, expect, it } from 'vitest'
import { choicesSchema, paymentDefaults, paymentDueDate } from './billing'
const choices = choicesSchema.parse({ companies: [{ id: 'client', name: 'Client', payment_term: '45' }], suppliers: [], analytic: [], models: [], sources: { customer: [], supplier: [] }, operations: { customer: [], supplier: [] }, tax_codes: [], default_tax_code: '', payment_days: 30, payment_terms: '', default_payment_term: '30', payment_conditions: [{ id: '30', code: 'D30', label: '30 jours', description: '', days: 30, active: true }, { id: '45', code: 'D45', label: '45 jours', description: 'Accord 45 jours', days: 45, active: true }] })
describe('Préremplissage des conditions de paiement', () => {
  it('reste éditable lorsque la date de facture est momentanément vide', () => { expect(paymentDueDate('', 30)).toBe('') })
  it('reprend le choix client et calcule une échéance calendaire', () => {
    expect(paymentDefaults(choices, 'client', '2026-10-13')).toEqual({ payment_term: '45', payment_terms: 'Accord 45 jours', due_date: '2026-11-27' })
  })
  it('hérite du défaut global pour un client sans choix', () => {
    expect(paymentDefaults(choices, 'other', '2026-12-15')).toEqual({ payment_term: '30', payment_terms: '30 jours', due_date: '2027-01-14' })
  })
  it('ne propose plus une condition client archivée', () => {
    const archived = { ...choices, payment_conditions: choices.payment_conditions.map((term) => ({ ...term, active: term.id !== '45' })) }
    expect(paymentDefaults(archived, 'client', '2026-10-13').payment_term).toBe('30')
  })
})
