import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { describe, expect, it } from 'vitest'
import { expenseTax } from './expenseTax'
const server = runInNewContext(readFileSync('pocketbase/pb_hooks/lib/tax.js', 'utf8') + '; module.exports', { module: { exports: {} }, BadRequestError: Error }) as { expenseRate: (app: null, input: { amount: number; tax_amount: number; tax_code: string; tax_rate: number }, existing: { getString: () => string; getFloat: () => number }) => { amount: number; tax_amount: number } }
describe('Calcul indicatif de TVA des frais', () => {
  it('recalcule depuis le TTC ou le HT, en centimes', () => {
    expect(expenseTax(120, 20, 'gross')).toEqual({ amount: 120, tax_amount: 20 })
    expect(expenseTax(100, 20, 'net')).toEqual({ amount: 120, tax_amount: 20 })
    expect(expenseTax(10, 5.5, 'gross')).toEqual({ amount: 10, tax_amount: .52 })
    expect(expenseTax(.03, 20, 'net')).toEqual({ amount: .04, tax_amount: .01 })
    expect(expenseTax(19.99, 0, 'gross')).toEqual({ amount: 19.99, tax_amount: 0 })
  })
  it('concorde avec le contrôle serveur, depuis HT ou TTC et avec arrondis', () => {
    for (const rate of [0, 2.1, 5.5, 10, 20, 100]) for (const value of [.01, .03, .99, 9.99, 48, 1234.56]) for (const basis of ['gross', 'net'] as const) {
      const preview = expenseTax(value, rate, basis)
      const actual = server.expenseRate(null, { ...preview, tax_code: 'TEST', tax_rate: rate }, { getString: () => 'TEST', getFloat: () => rate })
      expect(actual.amount).toBe(preview.amount); expect(actual.tax_amount).toBe(preview.tax_amount)
    }
  })
  it('refuse valeurs invalides et dépassement du TTC maximal', () => {
    for (const amount of [NaN, Infinity, -1, 10000001]) expect(() => expenseTax(amount, 20, 'gross')).toThrow()
    expect(() => expenseTax(10000000, 20, 'net')).toThrow()
  })
})
