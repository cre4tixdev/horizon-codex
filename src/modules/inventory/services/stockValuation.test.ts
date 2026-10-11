import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
type Layer = { place: string; quantity: number; cost: number }
type Method = 'standard' | 'cump' | 'fifo'
const engine = runInNewContext(readFileSync('pocketbase/pb_hooks/lib/stock-valuation-engine.js', 'utf8') + '; module.exports', { module: { exports: {} }, BadRequestError: Error }) as {
  value(layers: Layer[]): number; quantity(layers: Layer[]): number;
  movement(layers: Layer[], method: Method, standard: number, place: string, delta: number, actual: number, transfer?: string, receiving?: boolean): { layers: Layer[]; consumed: Layer[]; movementValue: number; valueDelta: number };
  change(layers: Layer[], method: Method, standard: number): Layer[];
}
describe('Valorisation serveur', () => {
  it('valorise au standard indépendamment du prix d’achat et conserve les couches d’entrée', () => {
    const initial: Layer[] = []
    const first = engine.movement(initial, 'standard', 10, 'MEU', 100, 9)
    const second = engine.movement(first.layers, 'standard', 10, 'MEU', 100, 12)
    expect(engine.value(second.layers)).toBe(2000)
    expect(engine.movement(second.layers, 'standard', 10, 'MEU', -20, 0).movementValue).toBe(-200)
    expect(initial).toEqual([])
  })
  it('calcule le CUMP pondéré à chaque entrée, y compris entre entrepôts', () => {
    const first = engine.movement([], 'cump', 0, 'MEU', 10, 10)
    const second = engine.movement(first.layers, 'cump', 0, 'SEV', 20, 16)
    expect(engine.value(second.layers)).toBe(420)
    expect(second.layers.map((layer) => layer.cost)).toEqual([14, 14])
    expect(engine.movement(second.layers, 'cump', 0, 'MEU', -5, 0).movementValue).toBe(-70)
  })
  it('consomme les couches FIFO de l’emplacement sans prendre celles d’un autre', () => {
    const initial = [{ place: 'SEV', quantity: 20, cost: 3 }, { place: 'MEU', quantity: 2, cost: 10 }, { place: 'MEU', quantity: 8, cost: 15 }]
    const out = engine.movement(initial, 'fifo', 0, 'MEU', -5, 0)
    expect(out.movementValue).toBe(-65); expect(engine.quantity(out.layers)).toBe(25)
  })
  it('préserve la valeur en transit et à réception, sans compter deux fois le transfert', () => {
    const initial = [{ place: 'MEU', quantity: 10, cost: .8 }]
    const out = engine.movement(initial, 'fifo', 0, 'MEU', -4, 0, 'transit:1')
    expect(out.valueDelta).toBe(0); expect(out.movementValue).toBe(-3.2); expect(engine.value(out.layers)).toBe(8)
    const receipt = engine.movement(out.layers, 'fifo', 0, 'SEV', 4, 0, 'transit:1', true)
    expect(receipt.valueDelta).toBe(0); expect(engine.value(receipt.layers)).toBe(8)
    expect(receipt.layers.some((layer) => layer.place === 'transit:1')).toBe(false)
  })
  it('conserve la valeur d’ouverture du changement vers CUMP/FIFO, régularise vers standard', () => {
    const initial = [{ place: 'MEU', quantity: 10, cost: 10 }, { place: 'SEV', quantity: 20, cost: 16 }]
    for (const method of ['cump', 'fifo'] as const) expect(engine.value(engine.change(initial, method, 0))).toBe(420)
    expect(engine.value(engine.change(initial, 'standard', 12))).toBe(360)
    expect(initial[0]?.cost).toBe(10)
  })
  it('conserve les fractions de centime et refuse une sortie sans couches suffisantes', () => {
    const first = engine.movement([], 'standard', .004, 'MEU', 1000, .005)
    expect(engine.value(first.layers)).toBe(4)
    expect(engine.movement(first.layers, 'standard', .004, 'MEU', -500, 0).movementValue).toBe(-2)
    expect(() => engine.movement(first.layers, 'fifo', 0, 'SEV', -1, 0)).toThrow()
    expect(() => engine.movement([], 'standard', 1e9, 'MEU', 1e6, 0)).toThrow()
  })
})
