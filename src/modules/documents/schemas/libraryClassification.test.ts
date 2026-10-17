import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { describe, expect, it } from 'vitest'
import { libraryThemes } from './library'
type Source = { collection: () => { name: string }; getString: (field: string) => string }
const classification = runInNewContext(readFileSync('pocketbase/pb_hooks/lib/ged-classification.js', 'utf8') + '; module.exports', { module: { exports: {} } }) as { labels: Record<string, string>; theme: (source: Source, historicalQuote?: boolean) => string }
const source = (name: string, fields: Record<string, string> = {}): Source => ({ collection: () => ({ name }), getString: (field) => fields[field] || '' })
describe('Classement GED par pièce métier', () => {
  it.each([
    ['sales_quotes', {}, 'quotes'], ['sales_quotes', { status: 'accepted' }, 'orders'],
    ['purchasing_orders', {}, 'purchases'], ['purchasing_requests', {}, 'requests'],
    ['inventory_operations', { kind: 'IN' }, 'receipts'], ['inventory_operations', { kind: 'OUT' }, 'deliveries'], ['inventory_operations', { kind: 'INT' }, 'stock'],
    ['billing_invoices', {}, 'invoices'], ['billing_supplier_invoices', {}, 'supplier_invoices'],
    ['billing_credit_notes', {}, 'credits'], ['billing_supplier_credit_notes', {}, 'supplier_credits'],
    ['crm_opportunities', {}, 'technical'], ['contacts_companies', {}, 'companies'],
  ] satisfies [string, Record<string, string>, string][])('classe %s selon son origine réelle', (entity, fields, expected) => {
    expect(classification.theme(source(entity, fields))).toBe(expected)
  })
  it('conserve le classement devis des fichiers de ses e-mails historiques après conversion en commande', () => {
    expect(classification.theme(source('sales_quotes', { status: 'accepted' }), true)).toBe('quotes')
  })
  it('partage les mêmes libellés métier entre serveur et filtres', () => {
    expect(classification.labels).toEqual(libraryThemes)
  })
})
