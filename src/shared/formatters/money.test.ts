import { expect, it } from 'vitest'
import { currencySymbol, formatAmount, parseAmountInput } from './money'

it('always displays the currency symbol and two decimal places', () => {
  const normalize = (value: string) => value.replace(/[\u00a0\u202f]/g, ' ')
  expect(normalize(formatAmount(12000, 'EUR'))).toBe('12 000,00 €')
  expect(normalize(formatAmount(12.3, 'USD'))).toBe('12,30 $')
  expect(normalize(formatAmount(12.345, 'GBP'))).toBe('12,35 £')
  expect(normalize(formatAmount(0, 'JPY'))).toBe('0,00 ¥')
  expect(normalize(formatAmount(-12.3, 'EUR'))).toBe('-12,30 €')
  expect(currencySymbol('EUR')).toBe('€')
  expect(currencySymbol('USD')).toBe('$')
})

it('parses currency text with French commas and grouping spaces, without accepting invalid input', () => {
  expect(parseAmountInput('1 234,56 €', 'EUR')).toBe(1234.56)
  expect(parseAmountInput('1234.56', 'EUR')).toBe(1234.56)
  expect(parseAmountInput('−2 €', 'EUR')).toBeNaN()
  expect(parseAmountInput('-2,50 €', 'EUR')).toBe(-2.5)
  for (const input of ['', 'abc', '12x', '1,2,3']) expect(parseAmountInput(input, 'EUR')).toBeNaN()
})
