import { HTag } from '../../../shared/ui/HTag'
export function DeliveryReadiness({ ready, required, unit, delivered = false }: { ready: number; required: number; unit: string; delivered?: boolean }) {
  const format = (value: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 6 }).format(value)
  return <HTag tone={required > 0 && ready >= required ? 'green' : ready > 0 ? 'amber' : 'navy'} title={`${delivered ? 'Livré' : 'Disponible pour cette commande'} : ${format(ready)} / ${format(required)} ${unit}. Les réservations des autres commandes sont exclues.`}>{format(ready)}/{format(required)}{unit === 'lignes' ? ' lignes' : ''}</HTag>
}
