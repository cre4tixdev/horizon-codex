import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { describe, expect, it } from 'vitest'
type Line = { id: string; product: string; from_location: string; source_line: string; sales_line?: string; quantity: number; planned_quantity?: number; unit: string; tracking?: string; traces?: { lot: string; serial?: string; quantity: number }[] }
type RecordStub = { getString: (name: string) => string; getBool: () => boolean }
type Context = { physical: Map<string, number>; reserved: Map<string, number>; own: Map<string, number>; active: Set<string> }
type Ready = { ready: number; required: number; unit: string; complete: boolean; lines: { id: string; ready: number }[] }
const engine = runInNewContext(readFileSync('pocketbase/pb_hooks/lib/stock-delivery-readiness.js', 'utf8') + '; module.exports', { module: { exports: {} } }) as { project: (record: RecordStub, context: Context) => Ready }
const line = (changes: Partial<Line> = {}): Line => ({ id: 'a', product: 'product', from_location: 'place', source_line: 'sale', quantity: 4, unit: 'u', ...changes })
const record = (lines: Line[], done = false): RecordStub => ({ getBool: () => false, getString: (name) => ({ kind: 'OUT', sales_quote: 'quote', status: done ? 'done' : 'draft', lines: JSON.stringify(lines) })[name as 'kind'] || '' })
const context = (physical = 0, reserved = 0, own = 0): Context => ({ physical: new Map([['product/place/', physical]]), reserved: new Map([['product/place/', reserved]]), own: new Map([['product/place//sale', own]]), active: new Set(['place']) })
describe('disponibilités des BL', () => {
  it('conserve le besoin même à stock nul', () => { const ready = engine.project(record([line()]), context()); expect([ready.ready, ready.required, ready.complete]).toEqual([0, 4, false]) })
  it('exclut les réservations étrangères et réintègre seulement celles de la ligne', () => { expect(engine.project(record([line()]), context(4, 4, 2)).ready).toBe(2) })
  it('ne compte pas deux fois le même stock entre lignes du BL', () => { const ready = engine.project(record([line({ quantity: 2 }), line({ id: 'b', source_line: 'other', quantity: 2 })]), context(3)); expect(Array.from(ready.lines, (item) => item.ready)).toEqual([2, 1]); expect(ready.ready).toBe(3) })
  it('compte les lignes prêtes lorsque les unités sont différentes', () => { const ready = engine.project(record([line({ quantity: 1 }), line({ id: 'b', source_line: 'other', quantity: 4, unit: 'm' })]), context(2)); expect([ready.ready, ready.required, ready.unit]).toEqual([1, 2, 'lignes']) })
  it('conserve la quantité prévue sur une livraison partielle historique', () => { const ready = engine.project(record([line({ quantity: 2, planned_quantity: 4 })], true), context()); expect([ready.ready, ready.required]).toEqual([2, 4]) })
  it('compte seulement les lignes totalement livrées dans un historique multi-unités', () => { const ready = engine.project(record([line({ quantity: 2, planned_quantity: 4 }), line({ id: 'b', source_line: 'other', quantity: 1, planned_quantity: 1, unit: 'm' })], true), context()); expect([ready.ready, ready.required, ready.complete]).toEqual([1, 2, false]) })
  it('utilise les identités disponibles et limite aux identités sélectionnées', () => {
    const stock = context(100); stock.physical.set('product/place/lot', 3)
    expect(engine.project(record([line({ tracking: 'lot' })]), stock).ready).toBe(3)
    expect(engine.project(record([line({ tracking: 'lot', traces: [{ lot: 'lot', quantity: 2 }] })]), stock).ready).toBe(2)
    stock.active.clear(); expect(engine.project(record([line()]), stock).ready).toBe(0)
  })
})
