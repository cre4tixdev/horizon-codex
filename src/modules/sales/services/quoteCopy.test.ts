import { describe, expect, it } from 'vitest'
import { emptyQuoteLine, quoteInputSchema } from '../schemas/quotes'
import { copyQuoteContent } from './quoteCopy'

describe('copy quote content', () => {
  it('keeps target identity, dates and salesperson while copying structured lines and prices', () => {
    const target = quoteInputSchema.parse({ opportunity: 'target-opportunity', owner: 'target-owner', title: 'Avant copie', quote_date: '2026-10-10', valid_until: '2026-11-09', notes: '', lines: [] })
    const source = { title: 'Source', notes: 'Conditions spécifiques', discount: 12.5, discount_mode: 'amount' as const, terms_id: 'terms-source', lines: [
      { ...emptyQuoteLine('section'), id: 'source-title', description: 'Matériel', show_total: true, line_total: 0, section_total: 100, section_options_total: 0 },
      { ...emptyQuoteLine(), id: 'source-item', description: 'Caméra', product: 'product-id', unit_cost: 60.123456, unit_price: 100.123456, quantity: 2, is_option: true, line_total: 200.25, section_total: 0, section_options_total: 0 },
    ] }
    const copied = copyQuoteContent(source, target)
    expect(copied).toMatchObject({ opportunity: target.opportunity, owner: target.owner, quote_date: target.quote_date, valid_until: target.valid_until, title: source.title, notes: source.notes, discount: 12.5, discount_mode: 'amount', terms_id: source.terms_id })
    expect(copied.lines[0]).toMatchObject({ kind: 'section', show_total: true })
    expect(copied.lines[1]).toMatchObject({ product: 'product-id', quantity: 2, unit_cost: 60.123456, unit_price: 100.123456, is_option: true })
    expect(copied.lines[1]).not.toHaveProperty('id')
    expect(copied.lines[1]).not.toHaveProperty('line_total')
    expect(target.title).toBe('Avant copie')
    expect(copied.lines).not.toBe(source.lines)
    expect(copyQuoteContent(source, { ...target, opportunity: '' }).opportunity).toBe('')
  })
})
