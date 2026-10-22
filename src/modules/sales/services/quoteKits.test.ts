import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { emptyQuoteLine, type QuoteLineInput } from '../schemas/quotes'
import { quotePreview } from './quotePreview'
import { copyKitRows, moveKitRows } from './quoteKits'
const kits = { exports: { prepare: (rows: QuoteLineInput[]) => rows } }
runInNewContext(readFileSync(new URL('../../../../pocketbase/pb_hooks/lib/sales-kits.js', import.meta.url), 'utf8'), { module: kits, BadRequestError: Error })
const server = { exports: { quoteLines: quotePreview } }
runInNewContext(readFileSync(new URL('../../../../pocketbase/pb_hooks/lib/pricing.js', import.meta.url), 'utf8'), { module: server, __hooks: 'hooks', require: () => kits.exports, BadRequestError: Error })
const rows: QuoteLineInput[] = [{ ...emptyQuoteLine(), product: 'parent-product', kit_key: 'kit-parent-key-000001', description: 'Kit', quantity: 2, unit_price: 100 }, { ...emptyQuoteLine(), product: 'child-product', kit_parent: 'kit-parent-key-000001', kit_quantity: 3, description: 'Composant', quantity: 3, unit_cost: 10, unit_price: 400 }]
describe('kits de devis', () => {
  it('compte les montants une seule fois et multiplie les quantités opérationnelles', () => {
    const actual = server.exports.quoteLines(rows), preview = quotePreview(rows)
    expect(actual).toMatchObject({ subtotal: 200, cost_total: 60, margin_amount: 140 })
    expect(actual.lines[0]).toMatchObject({ unit_cost: 30, line_total: 200 })
    expect(actual.lines[1]).toMatchObject({ quantity: 6, unit_price: 0, line_total: 0 })
    expect(preview.subtotal).toBe(actual.subtotal); expect(preview.cost_total).toBe(actual.cost_total)
  })
  it('propage les options sans doubler le montant et calcule la marge du parent', () => {
    const actual = server.exports.quoteLines([{ ...rows[0], price_source: 'margin', margin_percent: 50, is_option: true }, rows[1]!])
    expect(actual).toMatchObject({ subtotal: 0, cost_total: 0, options_total: 90 })
  })
  it('refuse les composants orphelins et conserve les groupes au déplacement et à la copie', () => {
    expect(() => kits.exports.prepare([rows[1]!])).toThrow()
    const copies = copyKitRows(rows); expect(copies[0]!.kit_key).not.toBe(rows[0]!.kit_key); expect(copies[1]!.kit_parent).toBe(copies[0]!.kit_key)
    const ordinary = { ...emptyQuoteLine(), description: 'Libre' }
    expect(moveKitRows([...rows, ordinary], 0, 2).map((line) => line.description)).toEqual(['Libre', 'Kit', 'Composant'])
    expect(moveKitRows([...rows, ordinary], 1, 2)).toEqual([...rows, ordinary])
  })
})
