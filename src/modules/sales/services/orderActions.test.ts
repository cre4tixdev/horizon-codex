import { describe, expect, it } from 'vitest'
import { reservationChoicesSchema } from '../../inventory/schemas/stock'
import { hasStockToReserve } from './orderActions'
const choices = reservationChoicesSchema.parse({ revision: 'test', lines: [{ source_line: 'line', description: 'Produit', quantity: 4, capacity: 4, unit: 'u', reservable: true, selected: [], locations: [{ id: 'place', name: 'Stock', physical: 4, reserved: 0, available: 4, incoming: 0 }] }] })
describe('Action Réserver le stock', () => {
  it('attend le résultat serveur avant de proposer une réservation', () => { expect(hasStockToReserve(undefined)).toBe(false); expect(hasStockToReserve(choices)).toBe(true) })
  it('disparaît quand toute la capacité est déjà réservée', () => { expect(hasStockToReserve({ ...choices, lines: choices.lines.map((line) => ({ ...line, selected: [{ location: 'place', quantity: 4, lot: '', serial: '' }] })) })).toBe(false) })
  it('reste disponible pour le reliquat d’une réservation partielle', () => { expect(hasStockToReserve({ ...choices, lines: choices.lines.map((line) => ({ ...line, selected: [{ location: 'place', quantity: 2, lot: '', serial: '' }] })) })).toBe(true) })
  it('ne propose rien sans disponibilité physique ou besoin restant', () => { expect(hasStockToReserve({ ...choices, lines: choices.lines.map((line) => ({ ...line, capacity: 0 })) })).toBe(false); expect(hasStockToReserve({ ...choices, lines: choices.lines.map((line) => ({ ...line, locations: line.locations.map((location) => ({ ...location, available: 0 })) })) })).toBe(false) })
})
