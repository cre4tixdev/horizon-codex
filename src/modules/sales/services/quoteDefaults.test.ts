import { describe, expect, it } from 'vitest'
import { emptyQuoteLine, salesSettingsSchema } from '../schemas/quotes'
import { defaultQuoteTerms, isUnusedQuoteLine, prefilledQuoteTitle } from './quoteDefaults'

describe('quote creation defaults', () => {
  it('selects only the configured active default terms', () => {
    const settings = salesSettingsSchema.parse({ id: '', updated: '', validity_days: 30, default_tax_rate: 20, column_widths: {}, units: [], terms: [{ id: 'old', label: 'Old', content: 'Old', active: false, is_default: false }, { id: 'current', label: 'Current', content: 'Current', active: true, is_default: true }] })
    expect(defaultQuoteTerms(settings)).toBe('current')
    expect(defaultQuoteTerms({ ...settings, terms: [] })).toBe('')
  })
  it('does not treat a partially entered line as unused', () => {
    expect(isUnusedQuoteLine(emptyQuoteLine())).toBe(true)
    for (const line of [{ description: 'Texte' }, { product: 'product' }, { reference: 'REF' }, { quantity: 2 }, { unit_price: 10 }, { is_option: true }, { kind: 'section' as const }]) expect(isUnusedQuoteLine({ ...emptyQuoteLine(), ...line })).toBe(false)
  })
  it('updates a suggested title but preserves a manually entered title', () => {
    expect(prefilledQuoteTitle('', '', 'Affaire A')).toBe('Affaire A')
    expect(prefilledQuoteTitle('Affaire A', 'Affaire A', 'Affaire B')).toBe('Affaire B')
    expect(prefilledQuoteTitle('Mon titre', 'Affaire A', 'Affaire B')).toBe('Mon titre')
  })
})
