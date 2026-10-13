import type { ReservationChoices } from '../../inventory/schemas/stock'
export function hasStockToReserve(choices: ReservationChoices | undefined): boolean {
  return Boolean(choices?.lines.some((line) => line.reservable && line.capacity - line.selected.reduce((sum, item) => sum + item.quantity, 0) > 0.000001 && line.locations.some((location) => location.available > 0)))
}
