import { z } from 'zod'
import { quoteLineInputSchema, type Quote, type QuoteInput } from './quotes'
export const quoteTemplateContentSchema = z.object({ title: z.string().max(200), notes: z.string().max(10000), validity_days: z.number().int().min(1).max(365), terms_id: z.string().max(100), discount: z.number().min(0).max(1000000000), discount_mode: z.enum(['percent', 'amount']), lines: z.array(quoteLineInputSchema).min(1).max(200) })
export const quoteTemplateInputSchema = z.object({ label: z.string().trim().min(1, 'Nommez le modèle.').max(120), description: z.string().max(1000), currency: z.enum(['EUR', 'USD', 'GBP', 'CAD', 'CHF']), content: quoteTemplateContentSchema })
export const quoteTemplateSummarySchema = quoteTemplateInputSchema.omit({ content: true }).extend({ id: z.string(), active: z.boolean(), updated: z.string() })
export const quoteTemplateSchema = quoteTemplateSummarySchema.extend({ content: quoteTemplateContentSchema })
export const quoteTemplatePageSchema = z.object({ items: z.array(quoteTemplateSummarySchema), page: z.number(), totalPages: z.number(), totalItems: z.number() })
export const quoteTemplatePreviewSchema = z.object({ template: quoteTemplateSummarySchema, input: quoteTemplateContentSchema.omit({ validity_days: true }).extend({ valid_until: z.string() }), terms_label: z.string(), token: z.string(), issues: z.array(z.object({ line: z.number(), message: z.string() })), subtotal: z.number(), options_total: z.number() })
export type QuoteTemplateInput = z.infer<typeof quoteTemplateInputSchema>
export type QuoteTemplate = z.infer<typeof quoteTemplateSchema>
export type QuoteTemplatePreview = z.infer<typeof quoteTemplatePreviewSchema>
export type QuoteTemplateQuery = { q: string; page: number; state: 'active' | 'archived' }
export type QuoteTemplatePreviewInput = { id: string; opportunity: string; quote_date: string; token?: string }
// Remove business identity, snapshots, persisted line ids and transient cost markers.
export function quoteTemplateFromQuote(source: Pick<Quote, 'title' | 'notes' | 'discount' | 'discount_mode' | 'terms_id' | 'lines' | 'currency' | 'quote_date' | 'valid_until'>): QuoteTemplateInput {
  const days = Math.round((Date.parse(source.valid_until) - Date.parse(source.quote_date)) / 86400000)
  return quoteTemplateInputSchema.parse({ label: source.title.slice(0, 120), description: '', currency: source.currency, content: { title: source.title, notes: source.notes, discount: source.discount, discount_mode: source.discount_mode, terms_id: source.terms_id, validity_days: Number.isFinite(days) && days >= 1 && days <= 365 ? days : 30, lines: source.lines.map((line) => quoteLineInputSchema.parse(Object.fromEntries(Object.entries(line).filter(([field]) => !['id', 'cost_refresh'].includes(field))))) } })
}
export function templateQuoteInput(content: QuoteTemplateInput['content']): QuoteInput {
  return { opportunity: '', owner: '', title: content.title, notes: content.notes, discount: content.discount, discount_mode: content.discount_mode, terms_id: content.terms_id, quote_date: '2000-01-01', valid_until: '', lines: content.lines }
}
