import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { describe, expect, it } from 'vitest'
type Priced = { subtotal: number; subtotal_before_discount: number; discount_amount: number; cost_total: number; margin_amount: number; margin_percent: number; options_total: number; lines: { tax_base: number; unit_price: number; line_total: number; margin_percent: number; section_total: number }[] }
const pricing: { exports: { quoteLines: (input: unknown, discount?: number, mode?: 'percent' | 'amount') => Priced } } = { exports: { quoteLines: () => { throw new Error('Pricing module not loaded') } } }
runInNewContext(readFileSync(new URL('../../../../pocketbase/pb_hooks/lib/pricing.js', import.meta.url), 'utf8'), { module: pricing, BadRequestError: Error })
describe('server draft pricing', () => {
  it('rounds fractional quantities to cents and sums independently rounded lines', () => {
    const result = pricing.exports.quoteLines([{ description: 'Intégration', unit: 'h', quantity: 2.5, unit_price: 100.25 }, { description: 'Complément', unit: 'u', quantity: 1, unit_price: 0.1 }])
    expect(result.lines[0]?.line_total).toBe(250.63)
    expect(result.subtotal).toBe(250.73)
  })
  it('supports an empty draft but refuses invalid or excessive money', () => {
    expect(pricing.exports.quoteLines([]).subtotal).toBe(0)
    expect(() => pricing.exports.quoteLines([{ description: 'Ligne', quantity: -1, unit_price: 1 }])).toThrow()
    expect(() => pricing.exports.quoteLines([{ description: 'Ligne', quantity: 1, unit_price: Number.POSITIVE_INFINITY }])).toThrow()
  })
})

describe('structured quotes', () => {
  it('keeps nested section totals and options separate after discount', async () => {
    const { emptyQuoteLine } = await import('../schemas/quotes')
    const { quotePreview } = await import('./quotePreview')
    const lines = [
      { ...emptyQuoteLine('section'), description: 'Vidéo', show_total: true },
      { ...emptyQuoteLine(), description: 'Caméra', quantity: 2.5, unit_price: 100.25, unit_cost: 60, discount: 10 },
      { ...emptyQuoteLine('subsection'), description: 'Accessoires' },
      { ...emptyQuoteLine(), description: 'Option', quantity: 3, unit_price: 10, is_option: true },
      { ...emptyQuoteLine('note'), description: 'Installation incluse' },
      { ...emptyQuoteLine('subsection'), description: 'Câblage' },
      { ...emptyQuoteLine(), description: 'Câbles', unit_price: 40 },
      { ...emptyQuoteLine('section'), description: 'Audio' },
      { ...emptyQuoteLine(), description: 'Micro', quantity: 2, unit_price: 20 },
    ]
    const server = pricing.exports.quoteLines(lines)
    const preview = quotePreview(lines)
    expect(server.subtotal).toBe(305.56)
    expect(preview.options_total).toBe(30)
    expect(preview.lines[0]?.section_total).toBe(265.56)
    expect(preview.lines[0]?.section_options_total).toBe(30)
    expect(preview.lines[2]?.section_total).toBe(0)
    expect(preview.lines[5]?.section_total).toBe(40)
    expect(preview.lines[7]?.section_total).toBe(40)
    expect(server.lines.map((line) => line.line_total)).toEqual(preview.lines.map((line) => line.line_total))
    expect(server.subtotal).toBe(preview.subtotal)
  })
  it('computes validity across calendar boundaries', async () => {
    const { quoteValidity } = await import('./quotePreview')
    expect(quoteValidity('2026-12-15', 30)).toBe('2027-01-14')
    expect(quoteValidity('2028-02-01', 30)).toBe('2028-03-02')
  })
})

it('reprices margin-based lines on rounded cost and derives margin for manual prices', async () => {
  const { quotePreview } = await import('./quotePreview')
  const lines = [{ description: 'Marge', quantity: 2, unit_cost: 100, unit_price: 1, price_source: 'margin' as const, margin_percent: 25, discount: 10 }, { description: 'Direct', quantity: 1, unit_cost: 80, unit_price: 100 }]
  const server = pricing.exports.quoteLines(lines)
  expect(server.lines[0]?.unit_price).toBe(125)
  expect(server.lines[0]?.line_total).toBe(225)
  expect(server.lines[1]?.margin_percent).toBe(25)
  expect(quotePreview(lines).subtotal).toBe(server.subtotal)
  expect(() => pricing.exports.quoteLines([{ ...lines[0], unit_cost: 0 }])).toThrow()
})
it('taxes independently rounded lines and excludes options from document VAT', () => {
  const tax: { exports: { quote: (lines: unknown, rate: number) => { tax: number } } } = { exports: { quote: () => ({ tax: 0 }) } }
  runInNewContext(readFileSync(new URL('../../../../pocketbase/pb_hooks/lib/tax.js', import.meta.url), 'utf8'), { module: tax, BadRequestError: Error })
  expect(tax.exports.quote([{ kind: 'item', line_total: 10.03 }, { kind: 'item', line_total: 10.03 }, { kind: 'item', line_total: 100, is_option: true }], 20).tax).toBe(4.02)
  expect(() => tax.exports.quote([], 101)).toThrow()
})

it('keeps three-level totals bounded by the next equal or higher heading', async () => {
  const { emptyQuoteLine } = await import('../schemas/quotes')
  const { quotePreview } = await import('./quotePreview')
  const lines = [emptyQuoteLine('section'), emptyQuoteLine('subsection'), emptyQuoteLine('subsection3'), { ...emptyQuoteLine(), unit_price: 10 }, emptyQuoteLine('subsection3'), { ...emptyQuoteLine(), unit_price: 20 }, emptyQuoteLine('subsection'), { ...emptyQuoteLine(), unit_price: 30 }].map((line) => ({ ...line, description: 'Test' }))
  const server = pricing.exports.quoteLines(lines)
  expect(server.lines[0]?.section_total).toBe(60)
  expect(server.lines[1]?.section_total).toBe(30)
  expect(server.lines[2]?.section_total).toBe(10)
  expect(server.lines[4]?.section_total).toBe(20)
  expect(server.lines.map((line) => line.section_total)).toEqual(quotePreview(lines).lines.map((line) => line.section_total))
})

const taxModule: { exports: { quote: (lines: unknown, rate: number) => { tax: number } } } = { exports: { quote: () => ({ tax: 0 }) } }
runInNewContext(readFileSync(new URL('../../../../pocketbase/pb_hooks/lib/tax.js', import.meta.url), 'utf8'), { module: taxModule, BadRequestError: Error })
it('applies footer discount after line discounts, excluding options and leaving costs unchanged', async () => {
  const { quotePreview } = await import('./quotePreview')
  const lines = [{ description: 'Article', quantity: 2, unit_price: 100, unit_cost: 60, discount: 10 }, { description: 'Option', quantity: 1, unit_price: 50, unit_cost: 20, is_option: true }]
  const server = pricing.exports.quoteLines(lines, 10), preview = quotePreview(lines, 10)
  expect(server.subtotal_before_discount).toBe(180)
  expect(server.discount_amount).toBe(18)
  expect(server.subtotal).toBe(162)
  expect(server.cost_total).toBe(120)
  expect(server.margin_amount).toBe(42)
  expect(server.margin_percent).toBe(35)
  expect(server.options_total).toBe(50)
  expect(server.lines[0]?.line_total).toBe(180)
  expect(taxModule.exports.quote(server.lines, 20).tax).toBe(32.4)
  expect(preview.subtotal).toBe(server.subtotal)
  expect(preview.margin_percent).toBe(server.margin_percent)
  expect(preview.lines.map((line) => line.tax_base)).toEqual(server.lines.map((line) => line.tax_base))
})
it('allocates rounding cents exactly, supports full discount and avoids division by zero', async () => {
  const { quotePreview } = await import('./quotePreview')
  for (const discount of [0, 1, 33.33, 50, 99.99, 100]) {
    const lines = [0.01, 0.01, 0.01, 10.03].map((unit_price) => ({ description: 'Test', quantity: 1, unit_price, unit_cost: 1 }))
    const server = pricing.exports.quoteLines(lines, discount)
    expect(server.lines.reduce((sum, line) => sum + Math.round(line.tax_base * 100), 0)).toBe(Math.round(server.subtotal * 100))
    expect(server.lines.every((line) => line.tax_base >= 0 && line.tax_base <= line.line_total)).toBe(true)
    expect(quotePreview(lines, discount).lines.map((line) => line.tax_base)).toEqual(server.lines.map((line) => line.tax_base))
    if (discount === 100) { expect(server.margin_amount).toBe(-4); expect(server.margin_percent).toBe(-100); expect(taxModule.exports.quote(server.lines, 20).tax).toBe(0) }
  }
  expect(pricing.exports.quoteLines([], 100).margin_percent).toBe(0)
  for (const invalid of [-1, 101, NaN, Infinity, '10', null]) expect(() => pricing.exports.quoteLines([], invalid as number)).toThrow()
})

it('accepts a footer amount, validates its bounds and agrees with percentage pricing', async () => {
  const { quotePreview } = await import('./quotePreview')
  const lines = [{ description: 'Article', quantity: 2, unit_price: 100, unit_cost: 60, discount: 10 }]
  const amount = pricing.exports.quoteLines(lines, 18, 'amount'), percentage = pricing.exports.quoteLines(lines, 10)
  expect(amount.subtotal).toBe(percentage.subtotal)
  expect(amount.discount_amount).toBe(18)
  expect(quotePreview(lines, 18, 'amount').subtotal).toBe(amount.subtotal)
  expect(taxModule.exports.quote(amount.lines, 20).tax).toBe(32.4)
  expect(() => pricing.exports.quoteLines(lines, 180.01, 'amount')).toThrow()
  expect(pricing.exports.quoteLines(lines, 180, 'amount').subtotal).toBe(0)
  expect(() => pricing.exports.quoteLines(lines, 101)).toThrow()
})

it('inherits options through three heading levels and stops at the next peer heading', async () => {
  const { quotePreview } = await import('./quotePreview')
  const lines = [
    { kind: 'section' as const, description: 'A', is_option: true },
    { description: 'Caméra', quantity: 1, unit_price: 20, unit_cost: 5, is_option: false },
    { kind: 'subsection' as const, description: 'A.1' },
    { kind: 'subsection3' as const, description: 'A.1.1' },
    { description: 'Accessoire', quantity: 1, unit_price: 30 },
    { kind: 'section' as const, description: 'B' },
    { description: 'Article', quantity: 1, unit_price: 40, unit_cost: 5 },
  ]
  const server = pricing.exports.quoteLines(lines, 10), preview = quotePreview(lines, 10)
  expect(server.subtotal).toBe(36)
  expect(server.options_total).toBe(50)
  expect(server.cost_total).toBe(5)
  expect(taxModule.exports.quote(server.lines, 20).tax).toBe(7.2)
  expect(server.lines.map((line) => line.section_total)).toEqual(preview.lines.map((line) => line.section_total))
  expect(preview.lines.map((line) => line.is_option)).toEqual([true, true, true, true, true, false, false])
  expect(preview.lines[1]?.optionInherited).toBe(true)
  expect(server.subtotal).toBe(preview.subtotal)
  expect(() => pricing.exports.quoteLines([{ description: 'Invalid', quantity: 1, unit_price: 100, discount: 101 }], 0, 'amount')).toThrow()
})
