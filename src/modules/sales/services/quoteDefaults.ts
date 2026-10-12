import type { QuoteLineInput, SalesSettings } from '../schemas/quotes'

export function isUnusedQuoteLine(line: Partial<QuoteLineInput> | undefined) {
  return Boolean(line && line.kind === 'item' && !line.product && !line.description?.trim() && !line.brand?.trim() && !line.reference?.trim() && line.quantity === 1 && line.unit === 'u' && !line.unit_price && !line.unit_cost && !line.discount && !line.is_option)
}
export function defaultQuoteTerms(settings: SalesSettings) {
  return settings.terms.find((term) => term.active && term.is_default)?.id || ''
}
export function prefilledQuoteTitle(current: string, previous: string, opportunityTitle: string) {
  return !current.trim() || current === previous ? opportunityTitle.slice(0, 200) : current
}
