import { describe, expect, it } from 'vitest'
import { emptyPurchaseLine, needsSchema, purchaseLineInputSchema } from './purchasing'

describe('Besoins d’achat', () => {
  const line = { ...emptyPurchaseLine(), source_line: 'sale-line', sold_quantity: 4, reserved: 0, prepared: 4, price_currency: 'EUR', quantity: 0 }
  const needs = { source_order: 'order', source_quote: 'quote', source_quote_number: 'DEV-1', opportunity: 'opportunity', title: 'Achats', currency: 'EUR', lines: [line] }

  it('accepte une quantité restante nulle quand le besoin est entièrement couvert', () => {
    expect(needsSchema.parse(needs).lines[0]?.quantity).toBe(0)
  })

  it('refuse un besoin négatif et conserve une quantité strictement positive en saisie', () => {
    expect(needsSchema.safeParse({ ...needs, lines: [{ ...line, quantity: -1 }] }).success).toBe(false)
    expect(purchaseLineInputSchema.safeParse(line).success).toBe(false)
    expect(purchaseLineInputSchema.safeParse({ ...line, quantity: 1 }).success).toBe(true)
  })
})
