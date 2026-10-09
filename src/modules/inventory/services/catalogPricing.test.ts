import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { quotePreview } from '../../sales/services/quotePreview'
const pricing = runInNewContext(readFileSync('pocketbase/pb_hooks/lib/catalog-pricing.js', 'utf8') + '; module.exports', { module: { exports: {} }, BadRequestError: Error }) as { offer(input: { list_price: number; discount: number; purchase_quantity: number }): { purchase_price: number; unit_cost: number }; sale(cost: number, coefficient: number): number; marginRate(cost: number, price: number): number | null }
describe('Catalogue et coût par unité', () => {
  it('ramène le net du touret au mètre avant le coefficient de famille', () => { const value = pricing.offer({ list_price: 1000, discount: 20, purchase_quantity: 1000 }); expect(value).toEqual({ purchase_price: 800, unit_cost: .8 }); expect(pricing.sale(value.unit_cost, 1.35)).toBe(1.08) })
  it('conserve les fractions de centime jusqu’au calcul du montant de ligne', () => { const value = pricing.offer({ list_price: 4, discount: 0, purchase_quantity: 1000 }); const price = pricing.sale(value.unit_cost, 1.35); const quote = quotePreview([{ quantity: 500, unit_cost: value.unit_cost, unit_price: price }]); expect(quote.subtotal).toBe(2.7); expect(quote.cost_total).toBe(2); expect(quote.lines[0]?.margin_percent).toBeCloseTo(35); expect(quotePreview([{ quantity: 500, unit_cost: .004, price_source: 'margin', margin_percent: 35 }]).subtotal).toBe(2.7) })
  it('distingue marge sur vente et majoration sur coût', () => { expect(pricing.marginRate(100, pricing.sale(100, 1.2))).toBeCloseTo(16.666667); expect(pricing.marginRate(0, 0)).toBeNull(); expect(pricing.marginRate(100, 80)).toBe(-25) })
  it('refuse les coefficients et conditionnements non numériques ou hors limites', () => { expect(() => pricing.sale(100, 0)).toThrow(); expect(() => pricing.offer({ list_price: 1, discount: 101, purchase_quantity: 1 })).toThrow(); expect(() => pricing.offer({ list_price: 1, discount: 0, purchase_quantity: 0 })).toThrow() })
})
