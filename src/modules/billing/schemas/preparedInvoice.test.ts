import { describe, expect, it } from 'vitest'
import { choicesSchema, newInput, newLine, preparedSchema } from './billing'
import { applyPreparedInvoice, hasInvoiceLines } from './preparedInvoice'

const choices = choicesSchema.parse({ companies: [], suppliers: [{ id: 'supplier', name: 'Fournisseur', payment_term: '45' }], analytic: [], models: [], sources: { customer: [], supplier: [] }, operations: { customer: [], supplier: [] }, tax_codes: [], default_tax_code: 'VAT20', payment_days: 30, payment_terms: '', default_payment_term: '45', payment_conditions: [{ id: '45', code: 'D45', label: '45 jours', description: 'Paiement à 45 jours', days: 45, active: true }] })
describe('Préparation de facture depuis une commande', () => {
  it('reprend la source serveur et conserve les informations saisies de la facture', () => {
    const current = { ...newInput(choices), invoice_date: '2026-10-05', service_date: '2026-10-03', supplier_invoice_number: 'FOURN-2026-42', notes: 'Note conservée', template_id: 'model', schedules: [{ due_date: '2026-11-01', amount: 999 }] }
    const prepared = preparedSchema.parse({ company: 'supplier', invoice_kind: 'standard', title: 'Facture · BC-42', lines: [{ ...newLine('VAT20'), source_type: 'supplier', source_line: 'source-line', source_order: 'order', quantity: 3, unit_price: 45, tax_rate: 20, analytic_allocations: [{ analytic_account: 'account', percentage: 100 }] }], source_orders: ['order'], source_operations: [], deduction_ids: ['deposit'] })
    const result = applyPreparedInvoice(choices, current, prepared)
    expect(result).toMatchObject({ company: 'supplier', title: 'Facture · BC-42', supplier_invoice_number: 'FOURN-2026-42', invoice_date: '2026-10-05', service_date: '2026-10-03', notes: 'Note conservée', template_id: 'model', due_date: '2026-11-19', payment_term: '45', payment_terms: 'Paiement à 45 jours', source_orders: ['order'], deduction_ids: ['deposit'], schedules: [] })
    expect(result.lines).toEqual(prepared.lines)
    expect(current.schedules).toHaveLength(1)
  })
  it('protège les lignes saisies sans demander une confirmation pour le placeholder initial', () => {
    const input = newInput(choices)
    expect(hasInvoiceLines(input)).toBe(false)
    expect(hasInvoiceLines({ ...input, supplier_invoice_number: 'FOURN-42' })).toBe(false)
    expect(hasInvoiceLines({ ...input, lines: [{ ...input.lines[0]!, quantity: 4 }] })).toBe(true)
    expect(hasInvoiceLines({ ...input, lines: [{ ...input.lines[0]!, description: 'Ligne manuelle' }] })).toBe(true)
    expect(hasInvoiceLines({ ...input, lines: [newLine('', 'spacer')] })).toBe(true)
  })
})
