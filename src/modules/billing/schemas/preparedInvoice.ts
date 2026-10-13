import { paymentDefaults, type BillChoices, type BillInput, type Prepared } from './billing'

/** Remplace les données de source sans perdre l’identité du document fournisseur. */
export function applyPreparedInvoice(choices: BillChoices, current: BillInput, prepared: Prepared): BillInput {
  return { ...current, ...paymentDefaults(choices, prepared.company, current.invoice_date), company: prepared.company, invoice_kind: prepared.invoice_kind, customer_order_number: prepared.customer_order_number || '', title: prepared.title, lines: prepared.lines, source_orders: prepared.source_orders, source_operations: prepared.source_operations, deduction_ids: prepared.deduction_ids, source_invoice: prepared.source_invoice || '', schedules: [] }
}

export function hasInvoiceLines(input: BillInput): boolean {
  return input.lines.some((line) => Boolean(line.description.trim() || line.product || line.source_line || line.unit_price || line.reference || line.discount || line.kind !== 'item' || line.quantity !== 1 || line.unit !== 'u'))
}
