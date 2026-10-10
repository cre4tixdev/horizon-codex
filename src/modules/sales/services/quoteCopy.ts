import { quoteInputSchema, type Quote, type QuoteInput } from '../schemas/quotes'

// Only editable content is imported; document identity and dates stay on the target.
export function copyQuoteContent(source: Pick<Quote, 'title' | 'notes' | 'discount' | 'discount_mode' | 'terms_id' | 'lines'>, target: QuoteInput): QuoteInput {
  return { ...quoteInputSchema.omit({ opportunity: true }).parse({ ...target, title: source.title, notes: source.notes, discount: source.discount, discount_mode: source.discount_mode, terms_id: source.terms_id, lines: source.lines }), opportunity: target.opportunity }
}
