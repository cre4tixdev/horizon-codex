import { describe, expect, it } from 'vitest'
import { quoteTemplateFromQuote, templateQuoteInput } from '../schemas/quoteTemplates'
import { emptyQuoteLine } from '../schemas/quotes'
describe('modèles de contenu de devis', () => {
  const source = { title: 'Installation studio', notes: 'Texte partagé à relire', discount: 5, discount_mode: 'percent' as const, terms_id: 'conditions-vente', currency: 'EUR', quote_date: '2026-10-21', valid_until: '2026-12-05', lines: [{ ...emptyQuoteLine(), id: 'old-line', cost_refresh: 'old-token', product: 'product-id', description: 'Étude', price_source: 'margin' as const, margin_percent: 25, unit_cost: 100, unit_price: 125, line_total: 125, section_total: 0, section_options_total: 0, catalog_snapshot: { company: 'private' } }] }
  it('conserve la structure et les règles sans identité ou instantané du devis', () => {
    const model = quoteTemplateFromQuote(source)
    expect(model.content.validity_days).toBe(45)
    expect(model.content.lines[0]).toMatchObject({ product: 'product-id', price_source: 'margin', margin_percent: 25 })
    for (const key of ['id', 'cost_refresh', 'catalog_snapshot', 'line_total']) expect(model.content.lines[0]).not.toHaveProperty(key)
    for (const key of ['company', 'contact', 'opportunity', 'owner', 'quote_date', 'quote_number']) expect(model.content).not.toHaveProperty(key)
    expect(templateQuoteInput(model.content)).toMatchObject({ opportunity: '', owner: '', title: 'Installation studio' })
  })
  it('remplace une validité historique absente ou hors limites par 30 jours', () => {
    expect(quoteTemplateFromQuote({ ...source, valid_until: '' }).content.validity_days).toBe(30)
    expect(quoteTemplateFromQuote({ ...source, valid_until: '2020-01-01' }).content.validity_days).toBe(30)
  })
})
