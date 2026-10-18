import { describe, expect, it } from 'vitest'
import { addDays, monday, parseDuration, duration, sheetInput, type TimeSheet } from './time'
describe('Saisie des durées BE', () => {
  it.each([['1:30', 90], ['1,5', 90], ['1.25', 75], ['0:15', 15], ['', 0], ['24:00', 1440], [' 2 ', 120]])('%s → %s minutes', (input, result) => expect(parseDuration(input)).toBe(result))
  it.each(['-1', '1:90', '24:01', '25', '1.01', 'abc', '1:3', 'Infinity'])('refuse %s sans arrondir silencieusement', (input) => expect(parseDuration(input)).toBeUndefined())
  it('préserve les minutes et dépasse 24 h pour les totaux', () => { expect(duration(15)).toBe('0:15'); expect(duration(2400)).toBe('40:00') })
  it('calcule les semaines sans effet DST', () => { expect(monday('2026-10-25')).toBe('2026-10-19'); expect(addDays('2026-10-25', 1)).toBe('2026-10-26'); expect(monday('2027-01-01')).toBe('2026-12-28') })
  it('ne transmet pas les libellés ou coûts du client et conserve les lignes à zéro', () => {
    const line = { id: 'new:local', product: 'product', product_label: 'Label', product_code: 'Code', analytic_account: 'account', account_label: 'Affaire', account_code: '11450', sales_order_line: '', context: 'internal' as const, days: Array.from({ length: 7 }, () => ({ minutes: 0, description: '' })) }
    const result = sheetInput({ week_start: '2026-10-19', revision: 1 } as TimeSheet, [line])
    expect(result.lines).toHaveLength(1); expect(result.lines[0]?.id).toBe(''); expect(result.lines[0]).not.toHaveProperty('product_label'); expect(result.lines[0]?.days).toHaveLength(7)
  })
})
