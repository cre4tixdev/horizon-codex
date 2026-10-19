import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { describe, expect, it } from 'vitest'

type Input = { invoice_kind: string; deposit_percent?: number; title: string; lines: { kind: string; description: string; quantity: number; source_order?: string; source_line?: string }[] }
const model = runInNewContext(readFileSync('pocketbase/pb_hooks/lib/billing-deposit.js', 'utf8') + '; module.exports', { module: { exports: {} }, __hooks: '', require: () => ({ source: () => ({ lines: [{ id: 'disk', quantity: 5 }, { id: 'service', quantity: 2 }] }) }) }) as { upgrade: (app: object, kind: string, input: Input) => Input; label: (percent: number) => string }
const draft = (): Input => ({ invoice_kind: 'deposit', deposit_percent: 0, title: 'Objet conservé', lines: [{ kind: 'item', description: 'Acompte 30 % · Disque', quantity: 1.5, source_order: 'order', source_line: 'disk' }, { kind: 'item', description: 'Installation', quantity: 0.6, source_order: 'order', source_line: 'service' }] })

describe('Reprise des anciens acomptes', () => {
  it('retrouve un taux commun et les quantités sans modifier les montants ni l’objet', () => {
    const input = draft(), result = model.upgrade({}, 'customer', input)
    expect(result.deposit_percent).toBe(30); expect(result.title).toBe(input.title)
    expect(result.lines.map((line) => line.quantity)).toEqual([5, 2])
    expect(result.lines[0]?.description).toBe('Disque'); expect(input.lines[0]?.quantity).toBe(1.5)
    expect(model.upgrade({}, 'customer', result)).toBe(result)
    expect(model.label(12.5)).toBe('Acompte de 12,5 %')
  })
  it('ne devine pas un taux si les ratios diffèrent ou si une source manque', () => {
    const mixed = draft(); mixed.lines[1]!.quantity = 1
    expect(model.upgrade({}, 'customer', mixed)).toBe(mixed)
    const missing = draft(); missing.lines[0]!.source_line = ''
    expect(model.upgrade({}, 'customer', missing)).toBe(missing)
  })
  it('ne transforme pas les factures standard ni les avoirs historiques', () => {
    const standard = { ...draft(), invoice_kind: 'standard' }
    expect(model.upgrade({}, 'customer', standard)).toBe(standard)
    const credit = draft(); expect(model.upgrade({}, 'customer_credit', credit)).toBe(credit)
  })
})
