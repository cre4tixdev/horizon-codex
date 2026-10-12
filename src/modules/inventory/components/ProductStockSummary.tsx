import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Package, PackageCheck, LockKeyhole } from 'lucide-react'
import { HButton } from '../../../shared/ui/HButton'
import { HFieldLabel } from '../../../shared/ui/HFieldLabel'
import { HDialog } from '../../../shared/ui/HDialog'
import { HDataTable } from '../../../shared/ui/HDataTable'
import { HTag } from '../../../shared/ui/HTag'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { stockService } from '../services/StockService'
import { useCatalogAccess } from '../hooks/useCatalogAccess'
const quantities = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 6 })
export function ProductStockSummary({ id, unit }: { id: string; unit: string }) {
  const access = useCatalogAccess(), [open, setOpen] = useState(false)
  const reservations = useQuery({ queryKey: ['inventory', 'product-reservations', id], queryFn: () => stockService.productReservations(id), enabled: access.canRead && open, retry: false })
  const stock = useQuery({ queryKey: ['inventory', 'product-stock', id], queryFn: () => stockService.productBalance(id), enabled: access.canRead, retry: false })
  const quantity = (value: number | undefined) => value === undefined ? '—' : `${quantities.format(value)} ${unit}`
  return <><div className="catalog-stock-box"><HFieldLabel>Infos Stock</HFieldLabel><div className="catalog-stock-summary" role="region" aria-label="Quantités en stock" title="Tous les emplacements des entrepôts actifs">
    <span><Package size={14} aria-hidden="true" />En stock <strong>{quantity(stock.data?.physical)}</strong></span>
    <span><PackageCheck size={14} aria-hidden="true" />Disponible <strong>{quantity(stock.data?.available)}</strong></span>
    <HButton variant="ghost" size="small" className="catalog-stock-reserved" aria-label="Consulter les réservations du produit" onClick={() => setOpen(true)}><LockKeyhole size={14} aria-hidden="true" />Réservé <strong>{quantity(stock.data?.reserved)}</strong></HButton>
    {stock.error && <span role="alert" className="field-error">{stock.error.message}<HButton variant="ghost" size="small" onClick={() => void stock.refetch()}>Réessayer</HButton></span>}
  </div></div>
    <HDialog open={open} onOpenChange={setOpen} title="Réservations du produit" description="Réservations actives par commande et emplacement." className="catalog-reservations-dialog">
      <div className="dialog-form">{reservations.isPending ? <HLoadingIndicator label="Chargement des réservations" /> : reservations.error ? <p role="alert" className="field-error">{reservations.error.message}<HButton size="small" onClick={() => void reservations.refetch()}>Réessayer</HButton></p> : <HDataTable columnBorders columnAlignments={{ quantity: 'right' }} data={reservations.data?.items || []} columns={[
        { header: 'Réservé par', accessorKey: 'actor' },
        { header: 'Commande', accessorKey: 'order_number' },
        { header: 'Affaires', cell: ({ row }) => <HTag tone="navy">{row.original.affair_code} · {row.original.client}</HTag> },
        { header: 'Emplacement', accessorKey: 'location' },
        { id: 'quantity', header: 'Quantité', cell: ({ row }) => quantity(row.original.quantity) },
        { header: 'Date', cell: ({ row }) => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Paris' }).format(new Date(row.original.created.replace(' ', 'T'))) },
      ]} />}</div>
    </HDialog></>
}
